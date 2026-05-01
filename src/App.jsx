import { useEffect, useState } from "react";
import styled from "styled-components";
import { FaRegCopy, FaRegCheckCircle } from "react-icons/fa";

const STORAGE_USER_ID = "sport-session-user-id";
const STORAGE_USER_NAME = "sport-session-user-name";

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

const initialSession = {
  id: "Test-Session-1",
  title: "CL 29.05",
  subtitle: "15–16h · 16–18h",
  capacity: 10,
  link: "https://www.auzora.de",
  participants: [
    { id: "1", name: "Bin", slot: "15h" },
    { id: "2", name: "Thanh", slot: "15h" },
    { id: "3", name: "Nga", slot: "16h" },
  ],
};

const App = () => {
  const [userId] = useState(getOrCreateUserId);
  const [name, setName] = useState(readName());
  const [draft, setDraft] = useState(readName());
  const [editing, setEditing] = useState(!readName());
  const [session, setSession] = useState(initialSession);
  const [copied, setCopied] = useState(false);

  const joined = session.participants.length;
  const missing = Math.max(session.capacity - joined, 0);
  const isFull = missing === 0;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setSession(data);
      } catch (e) {
        console.warn("Failed to load session data, using initial data.", e);
      }
    };

    load();
  }, []);
  const commitName = () => {
    const finalName = draft.trim();
    if (!finalName) return false;

    saveName(finalName);
    setName(finalName);
    setDraft(finalName);
    setEditing(false);
    return true;
  };

  const join = async (slot) => {
    const finalName = draft.trim() || name.trim();

    if (!finalName) {
      setEditing(true);
      return;
    }

    saveName(finalName);
    setName(finalName);
    setDraft(finalName);
    setEditing(false);

    // optimistic update
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
      const updatedSession = await saveParticipant(slot, finalName);
      setSession(updatedSession);
      navigator.vibrate?.(40);
    } catch (error) {
      console.warn("Failed to save participant.", error);
    }
  };

  const saveParticipant = async (slot, finalName) => {
    const res = await fetch("/api/session/participants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: userId,
        name: finalName,
        slot,
      }),
    });

    if (!res.ok) {
      throw new Error("Save failed");
    }

    return res.json();
  };

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

  return (
    <Page>
      <CopyButton onClick={copy} aria-label="Copy summary" copied={copied}>
        {!copied ? (
          <FaRegCopy size={"2em"} />
        ) : (
          <FaRegCheckCircle size={"2em"} />
        )}
      </CopyButton>

      <Content>
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
            <StatusSub>{isFull ? "đủ rồi" : `còn thiếu ${missing}`}</StatusSub>
          </StatusBox>

          <NameBox>
            {editing ? (
              <NameForm>
                <NameLabel>Tên của bạn</NameLabel>
                <NameInputRow>
                  <NameInput
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitName();
                    }}
                    placeholder="Ví dụ: Tùng"
                    autoFocus
                  />
                  <SmallButton onClick={commitName}>OK</SmallButton>
                </NameInputRow>
              </NameForm>
            ) : (
              <NameDisplay onClick={() => setEditing(true)}>
                <span>👋 {name}</span>
                <span>✏️</span>
              </NameDisplay>
            )}
          </NameBox>

          <ActionGroup>
            <FightButton onClick={() => join("15h")}>🔥 Fight! 15h</FightButton>
            <FightButton onClick={() => join("16h")}>🔥 Fight! 16h</FightButton>
            <CancelButton onClick={() => join("NO")}>❌ Không đi</CancelButton>
          </ActionGroup>
        </Card>

        <Card>
          <SectionTitle>Danh sách</SectionTitle>
          <ParticipantList>
            {session.participants.map((participant, index) => {
              const isMe = participant.id === userId;
              return (
                <ParticipantItem key={participant.id} $isMe={isMe}>
                  <ParticipantName>
                    {index + 1}. {participant.name}
                  </ParticipantName>
                  <ParticipantSlot>{participant.slot}</ParticipantSlot>
                </ParticipantItem>
              );
            })}
          </ParticipantList>
        </Card>
      </Content>

      {copied && <Toast>✅ Copied! Zurück zu Messenger und einfügen.</Toast>}
    </Page>
  );
};

export default App;

const Page = styled.div`
  min-height: 100vh;
  background: #f4f4f5;
  color: #18181b;
  padding: 16px;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
`;

const Content = styled.main`
  max-width: 430px;
  margin: 0 auto;
  padding-top: 64px;
  padding-bottom: 32px;
`;

const Card = styled.section`
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
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

const HeaderRow = styled.div`
  padding-right: 92px;
`;

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
  font-weight: 800;
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
  color: #71717a;
  font-size: 14px;
  flex: 0 0 auto;
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
