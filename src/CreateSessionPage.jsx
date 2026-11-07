import { useState } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SectionTitle,
  LanguageIconButton,
  LanguageSwitcher,
  CurrentLanguage,
  LanguageDropdown,
  LanguageOption,
} from "./App";
import { FaGlobe, FaTrashAlt } from "react-icons/fa";
import { validateSessionSlots } from "./utility.js";

const CreateSessionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editSession = location.state?.editSession || null;
  const isEditing = Boolean(editSession?.id);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage || "vi";
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mode, setMode] = useState(isEditing ? "manual" : "quick");

  const [rawText, setRawText] = useState("");

  const [draft, setDraft] = useState(() => ({
    title: editSession?.title || "",
    subtitle: editSession?.subtitle || "",
    capacity: editSession?.capacity ?? 10,
    additionalInfo:
      editSession?.additionalInfo ?? editSession?.additional_info ?? "",
    slots: editSession?.slots?.map((s) => ({ ...s })) || [],
    participants: editSession?.participants?.map((p) => ({ ...p })) || [],
    waitlist: editSession?.waitlist?.map((p) => ({ ...p })) || [],
  }));
  const saveSession = async () => {
    if (saving || deleting) return;
    setFormError("");

    if (!isEditing && mode === "quick" && !rawText.trim()) {
      setFormError(t("createSession.enterText"));
      return;
    }

    setSaving(true);
    try {
      let dataToSave = draft;

      // Quick mode: parse once and immediately create from the validated result.
      if (!isEditing && mode === "quick") {
        const parseRes = await fetch("/api/parse-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: rawText.trim() }),
        });
        if (!parseRes.ok) throw new Error(`Parse failed: ${parseRes.status}`);
        const parsed = await parseRes.json();
        dataToSave = {
          title: parsed.title || "",
          subtitle: parsed.subtitle || "",
          capacity: parsed.capacity ?? 10,
          additionalInfo: parsed.additionalInfo || "",
          slots: Array.isArray(parsed.slots) ? parsed.slots : [],
          participants: Array.isArray(parsed.participants)
            ? parsed.participants
            : [],
          waitlist: Array.isArray(parsed.waitlist) ? parsed.waitlist : [],
        };
      }

      const valid =
        dataToSave.title?.trim() &&
        Number.isInteger(Number(dataToSave.capacity)) &&
        Number(dataToSave.capacity) > 0 &&
        Array.isArray(dataToSave.slots) &&
        dataToSave.slots.length > 0 &&
        dataToSave.slots.every(
          (slot) =>
            /^\d{2}:\d{2}$/.test(slot.startTime || "") &&
            /^\d{2}:\d{2}$/.test(slot.endTime || "") &&
            slot.startTime < slot.endTime &&
            Number.isInteger(Number(slot.courtCount)) &&
            Number(slot.courtCount) > 0,
        );

      const slotCheck = validateSessionSlots(dataToSave.slots);
      if (!valid || !slotCheck.valid) {
        // Retain AI data for correction instead of saving a broken session.
        setDraft(dataToSave);
        setMode("manual");
        setFormError(
          slotCheck.errors.length
            ? `${t("createSession.reviewDetails")} ${slotCheck.errors.join("; ")}`
            : t("createSession.reviewDetails"),
        );
        return;
      }

      const endpoint = isEditing
        ? `/api/session/${encodeURIComponent(editSession.id)}`
        : "/api/session";
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dataToSave,
          capacity: Number(dataToSave.capacity),
          link: editSession?.link || window.location.origin,
        }),
      });
      if (!res.ok) throw new Error(`Save session failed: ${res.status}`);
      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      setFormError(t("session.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const archiveSession = async () => {
    if (!isEditing || deleting || saving) return;
    if (
      !window.confirm(
        t("session.deleteConfirm", {
          title: editSession.title,
          defaultValue: `Archive session "${editSession.title}"?`,
        }),
      )
    )
      return;
    setDeleting(true);
    setFormError("");
    try {
      const res = await fetch(
        `/api/session/${encodeURIComponent(editSession.id)}/archive`,
        {
          method: "PATCH",
        },
      );
      if (!res.ok) throw new Error(`Archive failed: ${res.status}`);
      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      setFormError(
        t("session.deleteFailed", {
          defaultValue: "Could not archive session.",
        }),
      );
    } finally {
      setDeleting(false);
    }
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
          <Title>{isEditing ? t("button.edit") : t("app.createSession")}</Title>
        </PageHeader>

        {!isEditing && (
          <ModeTabs role="tablist" aria-label={t("createSession.modeLabel")}>
            <ModeTab
              type="button"
              role="tab"
              aria-selected={mode === "quick"}
              $active={mode === "quick"}
              onClick={() => {
                setMode("quick");
                setFormError("");
              }}
            >
              {t("createSession.quickTab")}
            </ModeTab>
            <ModeTab
              type="button"
              role="tab"
              aria-selected={mode === "manual"}
              $active={mode === "manual"}
              onClick={() => {
                setMode("manual");
                setFormError("");
              }}
            >
              {t("createSession.manualTab")}
            </ModeTab>
          </ModeTabs>
        )}

        {!isEditing && mode === "quick" && (
          <Card>
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
          </Card>
        )}

        {(isEditing || mode === "manual") && (
          <Card>
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
                onChange={(e) =>
                  setDraft({ ...draft, subtitle: e.target.value })
                }
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
                      i === index
                        ? { ...item, startTime: e.target.value }
                        : item,
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

            {!isEditing && (
              <AddSlotButton
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    slots: [
                      ...prev.slots,
                      {
                        startTime: "",
                        endTime: "",
                        courtCount: 1,
                        maxPlayers: 0,
                        note: "",
                      },
                    ],
                  }))
                }
              >
                + {t("session.addSlot")}
              </AddSlotButton>
            )}

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
          </Card>
        )}

        {formError && <ErrorMessage role="alert">{formError}</ErrorMessage>}
        <ButtonGroup>
          <CreateButton
            type="button"
            onClick={saveSession}
            disabled={
              saving ||
              deleting ||
              (!isEditing && mode === "quick" && !rawText.trim())
            }
          >
            {saving
              ? t("status.loading")
              : isEditing
                ? t("button.save")
                : t("button.create")}
          </CreateButton>
          <CancelButton type="button" onClick={() => navigate("/")}>
            {t("button.cancel")}
          </CancelButton>
        </ButtonGroup>
        {isEditing && (
          <DeleteButton
            type="button"
            onClick={archiveSession}
            disabled={deleting || saving}
          >
            <FaTrashAlt />
            {deleting ? t("status.loading") : t("button.delete")}
          </DeleteButton>
        )}
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
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
    box-shadow: 0 0 0 3px rgba(0, 100, 0, 0.14);
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
    box-shadow: 0 0 0 3px rgba(0, 100, 0, 0.14);
  }
`;

const SlotRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 80px;
  gap: 8px;
  margin-bottom: 10px;
`;

const ErrorMessage = styled.p`
  color: #b91c1c;
  font-size: 14px;
  font-weight: 700;
`;

const DeleteButton = styled.button`
  width: 100%;
  margin-top: 18px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid #fecaca;
  background: #fff;
  color: #b91c1c;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModeTabs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 5px;
  border-radius: 18px;
  background: #e4e4e7;
`;

const ModeTab = styled.button`
  padding: 14px 8px;
  border: none;
  border-radius: 14px;
  background: ${({ $active }) => ($active ? "darkgreen" : "transparent")};
  color: ${({ $active }) => ($active ? "white" : "#3f3f46")};
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  &:focus-visible {
    outline: 2px solid darkgreen;
    outline-offset: 2px;
  }
`;

const AddSlotButton = styled.button`
  border: 1px solid darkgreen;
  background: white;
  color: darkgreen;
  border-radius: 14px;
  padding: 12px;
  font-weight: 800;
  margin: 12px 0 24px;
  cursor: pointer;
`;
