import { useEffect, useState } from "react";
import styled from "styled-components";
import { FaRegCopy, FaRegCheckCircle } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";

const STORAGE_USER_ID = "sport-session-user-id";
const STORAGE_USER_NAME = "sport-session-user-name";

const requestJson = async (url, options) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);

  return res.json();
};

const createSafeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getOrCreateUserId = () => {
  try {
    let id = localStorage.getItem(STORAGE_USER_ID);
    if (!id) {
      id = createSafeId();
      localStorage.setItem(STORAGE_USER_ID, id);
    }
    return id;
  } catch {
    return createSafeId();
  }
};

const readName = () => {
  try {
    return localStorage.getItem(STORAGE_USER_NAME) || "";
  } catch {
    return "";
  }
};

const saveName = (name) => {
  try {
    localStorage.setItem(STORAGE_USER_NAME, name);
  } catch {
    // Ignore localStorage errors in private/sandboxed browsers.
  }
};

const buildSummary = (session) => {
  const joined = session.participants.length;
  const missing = Math.max(session.capacity - joined, 0);

  const list = session.participants
    .map((p, i) => `${i + 1}. ${p.name}${p.slot === "16h" ? " (ab 16h)" : ""}`)
    .join("\n");

  return `${session.title}\n1 sân 15h-16h\n2 sân 16h-18h\n\n👥 ${joined}/${session.capacity} (${missing} thiếu)\n\n${list}\n\n👉 Link:\n${session.link}`;
};

const upsertParticipant = (participants, userId, name, slot) => {
  const filtered = participants.filter((p) => p.id !== userId);
  if (slot === "NO") return filtered;
  return [...filtered, { id: userId, name, slot }];
};

const App = () => {
  const [userId] = useState(getOrCreateUserId);
  const [name, setName] = useState(readName());
  const [draft, setDraft] = useState(readName());
  const [editingName, setEditingName] = useState(!readName());
  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [participantDraft, setParticipantDraft] = useState("");

  const [copied, setCopied] = useState(false);
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const joined = session ? session.participants?.length : 0;
  const missing = Math.max(session ? session.capacity - joined : 0, 0);
  const isFull = missing === 0;
  const [languageOpen, setLanguageOpen] = useState(false);

  const setActiveSession = (nextSession) => {
    setSession(nextSession);
    setActiveSessionId(nextSession?.id || null);
  };

  const loadSessions = async () => {
    const res = await fetch("/api/sessions");
    if (!res.ok) throw new Error("Sessions API error");

    const data = await res.json();
    setSessions(data);
    setActiveSession(data[0] || null);
  };

  useEffect(() => {
    loadSessions().catch((e) =>
      console.warn("Failed to load session data.", e),
    );
  }, []);

  const loadSessionById = (id) => {
    const selected = sessions.find((s) => s.id === id);
    if (selected) setActiveSession(selected);
  };

  const commitName = () => {
    const finalName = draft.trim();
    if (!finalName) return false;

    saveName(finalName);
    setName(finalName);
    setDraft(finalName);
    setEditingName(false);
    return true;
  };

  const startEditParticipant = (participant) => {
    setEditingParticipantId(participant.id);
    setParticipantDraft(participant.name);
  };

  const saveParticipantToApi = (sessionId, participantId, name, slot) =>
    requestJson(`/api/session/${sessionId}/participants`, {
      method: "POST",
      body: JSON.stringify({
        id: participantId,
        name,
        slot,
      }),
    });

  const copy = async () => {
    const text = buildSummary(session);

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    navigator.vibrate?.(60);
    setTimeout(() => setCopied(false), 1500);
  };

  const join = async (slot) => {
    if (!session) return;

    const finalName = draft.trim() || name.trim();

    if (!finalName) {
      setEditingName(true);
      return;
    }

    saveName(finalName);
    setName(finalName);
    setDraft(finalName);

    setSession((prev) => ({
      ...prev,
      participants: upsertParticipant(
        prev.participants,
        userId,
        finalName,
        slot,
      ),
    }));

    try {
      const updatedSession = await saveParticipantToApi(
        session.id,
        userId,
        finalName,
        slot,
      );

      setSession(updatedSession);
      setSessions((prev) =>
        prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
      );

      navigator.vibrate?.(40);
    } catch (error) {
      console.warn("Failed to save participant.", error);
    }
  };

  const saveParticipantEdit = async (participant) => {
    if (!session) return;

    const finalName = participantDraft.trim();
    if (!finalName) return;

    setEditingParticipantId(null);

    try {
      const updatedSession = await saveParticipantToApi(
        session.id,
        participant.id,
        finalName,
        participant.slot,
      );

      setSession(updatedSession);
      setSessions((prev) =>
        prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
      );
    } catch (error) {
      console.warn("Failed to update participant.", error);
    }
  };
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage || "vi";

  return (
    <Page>
      <LanguageSwitcher>
        <LanguageIconButton
          type="button"
          aria-label={t("language.select")}
          onClick={() => setLanguageOpen((prev) => !prev)}
        >
          <FaGlobe />
          <CurrentLanguage>{currentLanguage.toUpperCase()}</CurrentLanguage>
        </LanguageIconButton>

        {languageOpen && (
          <LanguageDropdown>
            {[
              { key: "vi", label: "Tiếng Việt" },
              { key: "de", label: "Deutsch" },
              { key: "en", label: "English" },
            ].map((lang) => (
              <LanguageOption
                key={lang.key}
                type="button"
                $active={currentLanguage === lang.key}
                onClick={() => {
                  i18n.changeLanguage(lang.key);
                  localStorage.setItem("language", lang.key);
                  setLanguageOpen(false);
                }}
              >
                <span>{lang.label}</span>
                {i18n.language === lang.key && <span>✓</span>}
              </LanguageOption>
            ))}
          </LanguageDropdown>
        )}
      </LanguageSwitcher>
      <CopyButton onClick={copy} aria-label={t("button.copy")} copied={copied}>
        {!copied ? (
          <FaRegCopy size={"3em"} />
        ) : (
          <FaRegCheckCircle size={"3em"} />
        )}
      </CopyButton>

      <Content>
        {sessions.length > 1 && (
          <TabRow>
            {sessions.map((item) => (
              <TabButton
                key={item.id}
                type="button"
                $active={item.id === activeSessionId}
                onClick={() => loadSessionById(item.id)}
              >
                {item.title}
              </TabButton>
            ))}
          </TabRow>
        )}
        {session && (
          <Card>
            <HeaderRow>
              <div>
                <Title>{session.title}</Title>
                <Subtitle>{session.subtitle}</Subtitle>
              </div>
            </HeaderRow>

            <StatusBox $isFull={isFull}>
              <StatusMain>
                👥 {joined}/{session.capacity}
              </StatusMain>
              <StatusSub>
                {isFull
                  ? t("status.full")
                  : t("capacity.remaining", { count: missing })}
              </StatusSub>
            </StatusBox>

            <NameBox>
              {editingName ? (
                <NameForm>
                  <NameLabel>{t("user.nameLabel")}</NameLabel>
                  <NameInputRow>
                    <NameInput
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitName();
                      }}
                      placeholder={t("user.namePlaceholder")}
                      autoFocus
                    />
                    <SmallButton onClick={commitName}>OK</SmallButton>
                  </NameInputRow>
                </NameForm>
              ) : (
                <NameDisplay onClick={() => setEditingName(true)}>
                  <span>
                    {t("user.greeting")} <b>{name}</b> 👋
                  </span>
                  <FaEdit />
                </NameDisplay>
              )}
            </NameBox>

            <ActionGroup>
              <FightButton onClick={() => join("15h")}>
                {t("join.fight", { time: "15h" })}
              </FightButton>

              <FightButton onClick={() => join("16h")}>
                {t("join.fight", { time: "16h" })}
              </FightButton>

              <CancelButton onClick={() => join("NO")}>
                {t("join.cancel")}
              </CancelButton>
            </ActionGroup>
          </Card>
        )}
        {session?.participants && (
          <Card>
            <SectionTitle>{t("list.title")}</SectionTitle>
            <ParticipantList>
              {session.participants.map((participant, index) => {
                const isEditingThis = editingParticipantId === participant.id;

                return (
                  <ParticipantItem key={participant.id}>
                    {isEditingThis ? (
                      <NameInputRow>
                        <NameInput
                          value={participantDraft}
                          onChange={(event) =>
                            setParticipantDraft(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter")
                              saveParticipantEdit(participant);
                            if (event.key === "Escape")
                              setEditingParticipantId(null);
                          }}
                          autoFocus
                        />
                        <SmallButton
                          onClick={() => saveParticipantEdit(participant)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter")
                              saveParticipantEdit(participant);
                            if (event.key === "Escape")
                              setEditingParticipantId(null);
                          }}
                        >
                          OK
                        </SmallButton>
                      </NameInputRow>
                    ) : (
                      <>
                        <ParticipantName>
                          {index + 1}. {participant.name}
                        </ParticipantName>

                        <ParticipantSlotEdit>
                          <ParticipantSlot>{participant.slot}</ParticipantSlot>
                          <FaEdit
                            onClick={() => startEditParticipant(participant)}
                          />
                        </ParticipantSlotEdit>
                      </>
                    )}
                  </ParticipantItem>
                );
              })}
            </ParticipantList>
          </Card>
        )}

        <CardButton
          style={{
            justifyContent: "center",
            display: "flex",
            cursor: "pointer",
            fontWeight: "800",
            background: "lightseagreen",
            color: "white",
          }}
          onClick={() => navigate("/create-session")}
        >
          {t("app.createSession")}
        </CardButton>
      </Content>

      {copied && <Toast>{t("toast.copied")}</Toast>}
    </Page>
  );
};

export default App;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
  padding-bottom: 4px;
`;

const TabButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "#f97316" : "#e4e4e7")};
  color: ${({ $active }) => ($active ? "white" : "#3f3f46")};
  white-space: nowrap;

  &:active {
    transform: scale(0.97);
  }
`;

const Page = styled.div`
  min-height: 100vh;
  background: #f4f4f5;
  color: #18181b;
  padding: 16px;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
`;

const Content = styled.main`
  max-width: 430px;
  margin: 0 auto;
  padding-top: 1em;
  padding-bottom: 32px;
`;

const Card = styled.section`
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
`;

const CardButton = styled.button`
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  width: 100%;
  border: none;
`;

const CopyButton = styled.button`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 16px;
  background: ${(props) => (props.copied === true ? "#22c55e" : "lightcoral")};
  color: white;
  padding: 12px 14px;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.28);
  cursor: pointer;

  &:active {
    transform: scale(0.96);
  }
`;

const CopyIcon = styled.span`
  font-size: 16px;
  line-height: 1;
`;

const CopyText = styled.span`
  line-height: 1;
`;

const HeaderRow = styled.div``;

const Title = styled.h1`
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #111;
`;

const Subtitle = styled.p`
  margin: 6px 0 0;
  color: #71717a;
  font-size: 14px;
`;

const StatusBox = styled.div`
  margin-top: 20px;
  border-radius: 18px;
  padding: 16px;
  background: ${({ $isFull }) => ($isFull ? "#dcfce7" : "#ffedd5")};
`;

const StatusMain = styled.div`
  font-size: 20px;
  font-weight: 900;
`;

const StatusSub = styled.div`
  margin-top: 2px;
  color: #52525b;
  font-size: 14px;
  font-weight: 700;
`;

const NameBox = styled.div`
  margin-top: 18px;
`;

const NameForm = styled.div``;

const NameLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #52525b;
  font-weight: 800;
`;

const NameInputRow = styled.div`
  display: flex;
  gap: 8px;
`;

const NameInput = styled.input`
  min-width: 0;
  flex: 1;
  border: 1px solid #d4d4d8;
  border-radius: 14px;
  padding: 13px 14px;
  font-size: 16px;
  outline: none;

  &:focus {
    border-color: #f97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.14);
  }
`;

const SmallButton = styled.button`
  border: none;
  border-radius: 14px;
  padding: 0 16px;
  background: #18181b;
  color: white;
  font-weight: 900;
  cursor: pointer;

  &:active {
    transform: scale(0.97);
  }
`;

const NameDisplay = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  border-radius: 16px;
  background: #fafafa;
  padding: 14px;
  font-size: 16px;
  cursor: pointer;
  color: #18181b;
`;

const ActionGroup = styled.div`
  margin-top: 18px;
  display: grid;
  gap: 10px;
`;

const BaseActionButton = styled.button`
  width: 100%;
  min-height: 58px;
  border: none;
  border-radius: 18px;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
  }
`;

const FightButton = styled(BaseActionButton)`
  background: #f97316;
  color: white;
  box-shadow: 0 8px 18px rgba(249, 115, 22, 0.22);
`;

const CancelButton = styled(BaseActionButton)`
  min-height: 52px;
  background: #e4e4e7;
  color: #3f3f46;
  font-size: 16px;
  font-family: inherit;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  color: #111;
`;

const ParticipantList = styled.div`
  margin-top: 12px;
  display: grid;
  gap: 8px;
`;

const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 16px;
  padding: 13px 14px;
  background: ${({ $isMe }) => ($isMe ? "#ffedd5" : "#fafafa")};
  font-weight: ${({ $isMe }) => ($isMe ? 900 : 600)};
`;

const ParticipantName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ParticipantSlot = styled.span`
  margin-left: 12px;
  font-size: 14px;
  color: black;
  flex: 0 0 auto;
`;

const ParticipantSlotEdit = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #71717a;
  font-size: 14px;
  cursor: pointer;
`;

const Toast = styled.div`
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 20px;
  max-width: 430px;
  margin: 0 auto;
  border-radius: 18px;
  background: #18181b;
  color: white;
  padding: 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.2);
`;

const LanguageSwitcher = styled.div`
  position: static;
  top: 16px;
  left: 16px;
  z-index: 20;
`;

const LanguageIconButton = styled.button`
  height: 2em;
  min-width: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 16px;
  background: white;
  color: #18181b;
  padding: 0 14px;
  font-size: 18px;
  font-weight: 900;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  cursor: pointer;

  &:active {
    transform: scale(0.96);
  }
`;

const CurrentLanguage = styled.span`
  font-size: 12px;
  line-height: 1;
`;

const LanguageDropdown = styled.div`
  position: absolute;
  top: 60px;
  left: 0;
  min-width: 160px;
  padding: 6px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.16);
`;

const LanguageOption = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: none;
  border-radius: 13px;
  padding: 12px 13px;
  background: ${({ $active }) => ($active ? "#ffedd5" : "transparent")};
  color: ${({ $active }) => ($active ? "#9a3412" : "#18181b")};
  font-size: 14px;
  font-weight: 800;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f4f4f5;
  }

  &:active {
    transform: scale(0.98);
  }
`;
