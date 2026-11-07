import { useRef, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SectionTitle,
  LanguageIconButton,
  LanguageSwitcher,
  CurrentLanguage,
  LanguageDropdown,
  LanguageOption,
} from "./App";
import { FaGlobe } from "react-icons/fa";
import { LuScanText } from "react-icons/lu";

const CreateSessionPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage || "vi";
  const [languageOpen, setLanguageOpen] = useState(false);
  const detailsRef = useRef(null);

  const [rawText, setRawText] = useState("");
  const [loadingParse, setLoadingParse] = useState(false);

  const [draft, setDraft] = useState({
    title: "",
    subtitle: "",
    capacity: 10,
    additionalInfo: "",
    slots: [],
    participants: [],
    waitlist: [],
  });
  const parseSession = async () => {
    setLoadingParse(true);

    try {
      const res = await fetch("/api/parse-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: rawText }),
      });

      if (!res.ok) throw new Error("Parse failed");

      const data = await res.json();

      setDraft({
        title: data.title || "",
        subtitle: data.subtitle || "",
        capacity: data.capacity || 10,
        additionalInfo: data.additionalInfo || "",
        slots: data.slots || [],
        participants: data.participants || [],
        waitlist: data.waitlist || [],
      });
      requestAnimationFrame(() => {
        detailsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingParse(false);
    }
  };

  const createSession = async () => {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...draft,
        capacity: Number(draft.capacity) || 10,
        link: window.location.origin,
      }),
    });

    if (!res.ok) throw new Error("Create session failed");

    navigate("/");
  };

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
                {currentLanguage === lang.key && <span>✓</span>}
              </LanguageOption>
            ))}
          </LanguageDropdown>
        )}
      </LanguageSwitcher>
      <Content>
        <PageHeader>
          <Title>{t("app.createSession")}</Title>
        </PageHeader>

        <Card>
          <CardHeading>{t("createSession.quickFromText")}</CardHeading>
          <CardHint>{t("createSession.quickFromTextHint")}</CardHint>
          <FormGroup>
            <Label htmlFor="session-raw-text">{t("session.adminText")}</Label>
            <TextArea
              id="session-raw-text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={t("session.adminTextPlaceholder")}
            />
          </FormGroup>
          <CreateButton onClick={parseSession} disabled={loadingParse}>
            <LuScanText size={21} />
            {loadingParse ? t("status.parsing") : t("button.aiParse")}
          </CreateButton>
        </Card>

        <Card ref={detailsRef}>
          <CardHeading>{t("createSession.sessionDetails")}</CardHeading>
          <CardHint>{t("createSession.sessionDetailsHint")}</CardHint>
          <FormGroup>
            <Label>{t("session.title")}</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label>{t("session.subtitle")}</Label>
            <Input
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label>{t("session.capacity")}</Label>
            <Input
              type="number"
              min="1"
              value={draft.capacity}
              onChange={(e) =>
                setDraft({ ...draft, capacity: Number(e.target.value) })
              }
            />
          </FormGroup>
          <FormGroup>
            <Label>{t("session.additionalInfo")}</Label>
            <TextArea
              value={draft.additionalInfo}
              onChange={(e) =>
                setDraft({ ...draft, additionalInfo: e.target.value })
              }
            />
          </FormGroup>

          <SectionTitle>{t("session.slots")}</SectionTitle>
          {draft.slots.map((slot, index) => (
            <SlotRow key={index}>
              <Input
                value={slot.startTime ?? ""}
                onChange={(e) => {
                  const next = draft.slots.map((item, i) =>
                    i === index ? { ...item, startTime: e.target.value } : item,
                  );
                  setDraft({ ...draft, slots: next });
                }}
                placeholder={t("session.startTime")}
              />
              <Input
                value={slot.endTime ?? ""}
                onChange={(e) => {
                  const next = draft.slots.map((item, i) =>
                    i === index ? { ...item, endTime: e.target.value } : item,
                  );
                  setDraft({ ...draft, slots: next });
                }}
                placeholder={t("session.endTime")}
              />
              <Input
                type="number"
                min="0"
                value={slot.courtCount ?? ""}
                onChange={(e) => {
                  const next = draft.slots.map((item, i) =>
                    i === index
                      ? { ...item, courtCount: Number(e.target.value) }
                      : item,
                  );
                  setDraft({ ...draft, slots: next });
                }}
                placeholder={t("session.courts")}
              />
            </SlotRow>
          ))}

          <SectionTitle>{t("session.participants")}</SectionTitle>
          {draft.participants.map((p, index) => (
            <SlotRow key={index}>
              <Input value={p.name ?? ""} readOnly />
              <Input value={p.startTime ?? ""} readOnly />
              <Input value={p.endTime ?? ""} readOnly />
            </SlotRow>
          ))}

          <SectionTitle>{t("session.waitlist")}</SectionTitle>
          {draft.waitlist.map((p, index) => (
            <SlotRow key={index}>
              <Input value={p.name ?? ""} readOnly />
              <Input value={p.note ?? ""} readOnly />
            </SlotRow>
          ))}

          <ButtonGroup>
            <CreateButton type="button" onClick={createSession}>
              {t("button.create")}
            </CreateButton>
            <CancelButton type="button" onClick={() => navigate("/")}>
              {t("button.cancel")}
            </CancelButton>
          </ButtonGroup>
        </Card>
      </Content>
    </Page>
  );
};

export default CreateSessionPage;

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
  padding-top: 64px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PageHeader = styled.header`
  padding: 0 4px;
`;

const CardHeading = styled.h2`
  margin: 0 0 6px;
  font-size: 19px;
  font-weight: 850;
  color: #18181b;
`;

const CardHint = styled.p`
  margin: 0 0 20px;
  color: #71717a;
  font-size: 13px;
  line-height: 1.5;
`;

const Card = styled.section`
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 2px 10px rgb(232, 235, 233);
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

const FormGroup = styled.div`
  margin-bottom: 18px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #52525b;
  font-weight: 800;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #d4d4d8;
  border-radius: 14px;
  padding: 13px 14px;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: darkgreen;
    box-shadow: 0 0 0 3px rgb(232, 235, 233);
  }
`;

const ButtonGroup = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 28px;
`;

const BaseButton = styled.button`
  width: 100%;
  min-height: 56px;
  border: none;
  border-radius: 18px;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
  }
`;

const CreateButton = styled(BaseButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  background: darkgreen;
  color: white;
`;

const CancelButton = styled(BaseButton)`
  background: #e4e4e7;
  color: #3f3f46;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 140px;
  box-sizing: border-box;
  border: 1px solid #d4d4d8;
  border-radius: 14px;
  padding: 13px 14px;
  font-size: 16px;
  resize: vertical;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: darkgreen;
    box-shadow: 0 0 0 3px rgb(232, 235, 233);
  }
`;

const SlotRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 80px;
  gap: 8px;
  margin-bottom: 10px;
`;
