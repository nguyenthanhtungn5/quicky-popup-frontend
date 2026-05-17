import { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SectionTitle } from "./App";

const CreateSessionPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [rawText, setRawText] = useState("");
  const [loadingParse, setLoadingParse] = useState(false);

  const [draft, setDraft] = useState({
    title: "",
    subtitle: "",
    capacity: 10,
    additionalInfo: "",
    slots: [],
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
      <Content>
        <Card>
          <Title>{t("app.createSession")}</Title>
          <Subtitle>{t("app.createNewSession")}</Subtitle>

          <FormGroup>
            <Label>Admin Text</Label>
            <TextArea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`CL 14.05
1 sân 13-16h
2 sân 16-18h
max 12ng
thêm ng thêm sân`}
            />
          </FormGroup>

          <CreateButton onClick={parseSession} disabled={loadingParse}>
            {loadingParse ? "Parsing..." : "AI Parse"}
          </CreateButton>

          <FormGroup>
            <Label>Title</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </FormGroup>

          <FormGroup>
            <Label>Subtitle</Label>
            <Input
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
            />
          </FormGroup>

          <FormGroup>
            <Label>Capacity</Label>
            <Input
              type="number"
              value={draft.capacity}
              onChange={(e) =>
                setDraft({ ...draft, capacity: Number(e.target.value) })
              }
            />
          </FormGroup>

          <FormGroup>
            <Label>Zusatzinformationen</Label>
            <TextArea
              value={draft.additionalInfo}
              onChange={(e) =>
                setDraft({ ...draft, additionalInfo: e.target.value })
              }
            />
          </FormGroup>

          <SectionTitle>Slots</SectionTitle>

          {draft.slots.map((slot, index) => (
            <SlotRow key={index}>
              <Input
                value={slot.startTime}
                onChange={(e) => {
                  const next = [...draft.slots];
                  next[index].startTime = e.target.value;
                  setDraft({ ...draft, slots: next });
                }}
                placeholder="Start"
              />

              <Input
                value={slot.endTime}
                onChange={(e) => {
                  const next = [...draft.slots];
                  next[index].endTime = e.target.value;
                  setDraft({ ...draft, slots: next });
                }}
                placeholder="Ende"
              />

              <Input
                type="number"
                value={slot.courtCount}
                onChange={(e) => {
                  const next = [...draft.slots];
                  next[index].courtCount = Number(e.target.value);
                  setDraft({ ...draft, slots: next });
                }}
                placeholder="Plätze"
              />
            </SlotRow>
          ))}

          <ButtonGroup>
            <CreateButton onClick={createSession}>Create</CreateButton>
            <CancelButton onClick={() => navigate("/")}>Cancel</CancelButton>
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
  margin: 6px 0 24px;
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
    border-color: #f97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.14);
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
  background: lightseagreen;
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
    border-color: #f97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.14);
  }
`;

const SlotRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 80px;
  gap: 8px;
  margin-bottom: 10px;
`;
