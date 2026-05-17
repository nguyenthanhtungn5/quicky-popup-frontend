import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

const Calculation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const session = state?.session;

  const [courtPrice, setCourtPrice] = useState("");
  const [shuttlePrice, setShuttlePrice] = useState("");
  const [payerId, setPayerId] = useState("");
  const [result, setResult] = useState(null);

  const calculate = async () => {
    const res = await fetch(`/api/session/${session.id}/calculation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courtPrice: Number(courtPrice),
        shuttlePrice: Number(shuttlePrice),
        payerId,
      }),
    });

    if (!res.ok) throw new Error("Calculation failed");
    setResult(await res.json());
  };

  if (!session) {
    return (
      <Page>
        <Content>
          <Card>
            <Title>No session found</Title>
            <Button onClick={() => navigate("/")}>Back</Button>
          </Card>
        </Content>
      </Page>
    );
  }

  return (
    <Page>
      <Content>
        <Card>
          <Title>Abrechnung</Title>
          <Subtitle>
            {session.title} · {session.subtitle}
          </Subtitle>

          <FormGroup>
            <Label>Preis Spielplätze (€)</Label>
            <Input
              type="number"
              value={courtPrice}
              onChange={(e) => setCourtPrice(e.target.value)}
              placeholder="z.B. 48"
            />
          </FormGroup>

          <FormGroup>
            <Label>Preis Federball (€)</Label>
            <Input
              type="number"
              value={shuttlePrice}
              onChange={(e) => setShuttlePrice(e.target.value)}
              placeholder="z.B. 12"
            />
          </FormGroup>

          <FormGroup>
            <Label>Wer hat bezahlt?</Label>
            <Select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
            >
              <option value="">Person auswählen</option>
              {session.participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <ActionGroup>
            <Button onClick={calculate}>Berechnen</Button>
            <CancelButton onClick={() => navigate("/")}>Zurück</CancelButton>
          </ActionGroup>
        </Card>

        {result && (
          <Card>
            <SectionTitle>Ergebnis</SectionTitle>

            <ResultBox>
              <ResultLine>
                <b>Gesamt:</b> {result.total} €
              </ResultLine>
              <ResultLine>
                <b>Personen:</b> {result.personCount}
              </ResultLine>
              <ResultLine>
                <b>Pro Person:</b> {result.amountPerPerson} €
              </ResultLine>
            </ResultBox>

            <DebtList>
              {result.debts.map((d) => (
                <DebtRow key={d.id}>
                  <span>{d.name}</span>
                  <b>
                    {d.amount} € → {d.payTo}
                  </b>
                </DebtRow>
              ))}
            </DebtList>
          </Card>
        )}
      </Content>
    </Page>
  );
};

export default Calculation;

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

const Title = styled.h1`
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: -0.04em;
`;

const Subtitle = styled.p`
  margin: 6px 0 24px;
  color: #71717a;
  font-size: 14px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 900;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
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
  box-sizing: border-box;
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

const Select = styled.select`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d4d4d8;
  border-radius: 14px;
  padding: 13px 14px;
  font-size: 16px;
  outline: none;
  background: white;
`;

const ActionGroup = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  width: 100%;
  min-height: 58px;
  border: none;
  border-radius: 18px;
  background: #f97316;
  color: white;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
  }
`;

const CancelButton = styled(Button)`
  min-height: 52px;
  background: #e4e4e7;
  color: #3f3f46;
  font-size: 16px;
`;

const ResultBox = styled.div`
  border-radius: 18px;
  padding: 16px;
  background: #ffedd5;
  font-size: 15px;
`;

const ResultLine = styled.div`
  margin-bottom: 6px;
`;

const DebtList = styled.div`
  margin-top: 12px;
  display: grid;
  gap: 8px;
`;

const DebtRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-radius: 16px;
  padding: 13px 14px;
  background: #fafafa;
`;
