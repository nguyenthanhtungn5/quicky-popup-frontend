import { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CreateSessionPage = () => {
  const navigate = useNavigate();

  const [draft, setDraft] = useState({
    title: "",
    subtitle: "",
    capacity: 10,
  });

  const createSession = async () => {
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: draft.title || "CL -",
          subtitle: draft.subtitle || "-",
          capacity: Number(draft.capacity) || 10,
          link: window.location.origin,
        }),
      });

      if (!res.ok) {
        throw new Error("Create session failed");
      }

      navigate("/");
    } catch (e) {
      console.warn(e);
    }
  };
  const { t, i18n } = useTranslation();

  return (
    <Page>
      <Content>
        <Card>
          <Title>{t("app.createSession")}</Title>
          <Subtitle>{t("app.createNewSession")}</Subtitle>

          <FormGroup>
            <Label>{t("session.title")}</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Ví dụ: CL 29.05"
            />
          </FormGroup>

          <FormGroup>
            <Label>{t("session.subtitle")}</Label>
            <Input
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              placeholder="15–16h · 16–18h"
            />
          </FormGroup>

          <FormGroup>
            <Label>{t("session.maxCapacity")}</Label>
            <Input
              type="number"
              value={draft.capacity}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  capacity: Number(e.target.value),
                })
              }
            />
          </FormGroup>

          <ButtonGroup>
            <CancelButton onClick={() => navigate("/")}>Cancel</CancelButton>

            <CreateButton onClick={createSession}>Create</CreateButton>
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
