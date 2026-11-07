import { useId, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

// UI preview only: no API calls and no debt-settlement algorithm yet.
const createExpense = () => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `expense-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  payerId: "",
  amount: "",
});

const Calculation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const session = state?.session;
  const participants = session?.participants ?? [];
  const courtPayerLabelId = useId();

  const [courtPrice, setCourtPrice] = useState("");
  const [courtPayerId, setCourtPayerId] = useState("");
  const [shuttleExpenses, setShuttleExpenses] = useState([createExpense()]);

  const changeShuttleExpense = (id, field, value) => {
    setShuttleExpenses((current) =>
      current.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense,
      ),
    );
  };

  const addShuttleExpense = () =>
    setShuttleExpenses((current) => [...current, createExpense()]);

  const removeShuttleExpense = (id) =>
    setShuttleExpenses((current) =>
      current.filter((expense) => expense.id !== id),
    );

  // Only simple display totals. Per-person allocations/transfers are not computed yet.
  const asAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
  };
  const shuttleTotal = shuttleExpenses.reduce(
    (sum, expense) => sum + asAmount(expense.amount),
    0,
  );
  const total = asAmount(courtPrice) + shuttleTotal;
  const money = (amount) =>
    new Intl.NumberFormat(i18n.resolvedLanguage || "vi", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  const ParticipantOptions = () => (
    <>
      <option value="">{t("calculation.selectParticipant")}</option>
      {participants.map((person) => (
        <option value={person.id} key={person.id}>
          {person.name}
        </option>
      ))}
    </>
  );

  if (!session) {
    return (
      <Page>
        <Content>
          <Card>
            <Title>{t("calculation.noSession")}</Title>
            <SecondaryButton type="button" onClick={() => navigate("/")}>
              {t("calculation.back")}
            </SecondaryButton>
          </Card>
        </Content>
      </Page>
    );
  }

  return (
    <Page>
      <Content>
        <TopBar>
          <BackLink type="button" onClick={() => navigate("/")}>
            ← {t("calculation.back")}
          </BackLink>
        </TopBar>
        <HeaderCard>
          <Eyebrow>{t("calculation.eyebrow")}</Eyebrow>
          <Title>{t("calculation.title")}</Title>
          <Subtitle>
            {session.title}
            {session.subtitle && session.subtitle !== "-"
              ? ` · ${session.subtitle}`
              : ""}
          </Subtitle>
          <ParticipantsInfo>
            {t("calculation.participantCount", { count: participants.length })}
          </ParticipantsInfo>
        </HeaderCard>

        <Card>
          <SectionHeading>
            <IconCircle>🏟️</IconCircle>
            <div>
              <SectionTitle>{t("calculation.courtSection")}</SectionTitle>
              <Hint>{t("calculation.courtHint")}</Hint>
            </div>
          </SectionHeading>
          <FormGroup>
            <Label htmlFor="court-price">{t("calculation.courtTotal")}</Label>
            <InputWrap>
              <Input
                id="court-price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="48,00"
                value={courtPrice}
                onChange={(e) => setCourtPrice(e.target.value)}
              />
              <Unit>€</Unit>
            </InputWrap>
          </FormGroup>
          <FormGroup>
            <Label htmlFor={courtPayerLabelId}>
              {t("calculation.courtPayer")}
            </Label>
            <Select
              id={courtPayerLabelId}
              value={courtPayerId}
              onChange={(e) => setCourtPayerId(e.target.value)}
            >
              <ParticipantOptions />
            </Select>
          </FormGroup>
        </Card>

        <Card>
          <SectionHeading>
            <IconCircle>🏸</IconCircle>
            <div>
              <SectionTitle>{t("calculation.shuttleSection")}</SectionTitle>
              <Hint>{t("calculation.shuttleHint")}</Hint>
            </div>
          </SectionHeading>
          <ExpenseList>
            {shuttleExpenses.map((expense, index) => (
              <ExpenseItem key={expense.id}>
                <ExpenseHeader>
                  <ExpenseNumber>
                    {t("calculation.shuttleExpense", { number: index + 1 })}
                  </ExpenseNumber>
                  <RemoveButton
                    type="button"
                    aria-label={t("calculation.removeExpense", {
                      number: index + 1,
                    })}
                    onClick={() => removeShuttleExpense(expense.id)}
                  >
                    ✕
                  </RemoveButton>
                </ExpenseHeader>
                <FormGroup>
                  <Label htmlFor={`shuttle-payer-${expense.id}`}>
                    {t("calculation.shuttlePayer")}
                  </Label>
                  <Select
                    id={`shuttle-payer-${expense.id}`}
                    value={expense.payerId}
                    onChange={(e) =>
                      changeShuttleExpense(
                        expense.id,
                        "payerId",
                        e.target.value,
                      )
                    }
                  >
                    <ParticipantOptions />
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label htmlFor={`shuttle-amount-${expense.id}`}>
                    {t("calculation.amount")}
                  </Label>
                  <InputWrap>
                    <Input
                      id={`shuttle-amount-${expense.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="12,00"
                      value={expense.amount}
                      onChange={(e) =>
                        changeShuttleExpense(
                          expense.id,
                          "amount",
                          e.target.value,
                        )
                      }
                    />
                    <Unit>€</Unit>
                  </InputWrap>
                </FormGroup>
              </ExpenseItem>
            ))}
          </ExpenseList>
          <AddButton type="button" onClick={addShuttleExpense}>
            + {t("calculation.addShuttleExpense")}
          </AddButton>
          <SubtotalRow>
            <span>{t("calculation.shuttleTotal")}</span>
            <b>{money(shuttleTotal)}</b>
          </SubtotalRow>
        </Card>

        <Card>
          <SectionTitle>{t("calculation.summary")}</SectionTitle>
          <SummaryRows>
            <SummaryRow>
              <span>{t("calculation.courtSection")}</span>
              <b>{money(asAmount(courtPrice))}</b>
            </SummaryRow>
            <SummaryRow>
              <span>{t("calculation.shuttleSection")}</span>
              <b>{money(shuttleTotal)}</b>
            </SummaryRow>
          </SummaryRows>
          <GrandTotal>
            <span>{t("calculation.grandTotal")}</span>
            <strong>{money(total)}</strong>
          </GrandTotal>
          <MetaText>{t("calculation.summaryNotice")}</MetaText>
        </Card>

        <Card>
          <SectionTitle>{t("calculation.settlement")}</SectionTitle>
          <Hint>{t("calculation.settlementHint")}</Hint>
          <SettlementHeader>
            <span>{t("calculation.from")}</span>
            <span>{t("calculation.amount")}</span>
            <span>{t("calculation.to")}</span>
          </SettlementHeader>
          <SettlementEmpty>
            <span>↗</span>
            <b>{t("calculation.settlementPending")}</b>
            <small>{t("calculation.settlementPendingHint")}</small>
          </SettlementEmpty>
          <PrimaryButton disabled type="button">
            {t("calculation.calculateSoon")}
          </PrimaryButton>
        </Card>
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
  padding-bottom: 32px;
`;
const TopBar = styled.div`
  margin: 3px 0 16px;
`;
const BackLink = styled.button`
  border: 0;
  background: transparent;
  color: darkgreen;
  font-weight: 800;
  padding: 8px 0;
  cursor: pointer;
  font-size: 14px;
`;
const Card = styled.section`
  background: white;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
`;
const HeaderCard = styled(Card)`
  padding: 24px 20px;
`;
const Eyebrow = styled.div`
  color: darkgreen;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
`;
const Title = styled.h1`
  margin: 0;
  font-size: 30px;
  line-height: 1.13;
  font-weight: 900;
  letter-spacing: -0.04em;
`;
const Subtitle = styled.p`
  margin: 9px 0 14px;
  color: #71717a;
  font-size: 14px;
`;
const ParticipantsInfo = styled.span`
  background: #edf7ed;
  color: darkgreen;
  border-radius: 100px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 800;
`;
const SectionHeading = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
`;
const IconCircle = styled.div`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: #edf7ed;
`;
const SectionTitle = styled.h2`
  margin: 0 0 7px;
  font-size: 18px;
  font-weight: 900;
`;
const Hint = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: #71717a;
`;
const FormGroup = styled.div`
  margin-bottom: 16px;
  &:last-child {
    margin-bottom: 0;
  }
`;
const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 800;
  color: #52525b;
`;
const InputWrap = styled.div`
  position: relative;
`;
const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  border: 1px solid #d4d4d8;
  border-radius: 14px;
  padding: 13px 40px 13px 14px;
  font-size: 16px;
  outline: none;
  &:focus {
    border-color: darkgreen;
    box-shadow: 0 0 0 3px rgba(14, 118, 14, 0.12);
  }
`;
const Unit = styled.span`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #71717a;
  font-weight: 700;
`;
const Select = styled.select`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  border: 1px solid #d4d4d8;
  border-radius: 14px;
  padding: 13px 14px;
  font-size: 16px;
  outline: none;
  background: white;
  &:focus {
    border-color: darkgreen;
  }
`;
const ExpenseList = styled.div`
  display: grid;
  gap: 12px;
`;
const ExpenseItem = styled.div`
  background: #fafafa;
  border: 1px solid #f1f1f2;
  border-radius: 18px;
  padding: 15px;
`;
const ExpenseHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;
const ExpenseNumber = styled.span`
  font-weight: 900;
  font-size: 14px;
`;
const RemoveButton = styled.button`
  border: 0;
  background: transparent;
  color: #71717a;
  cursor: pointer;
  padding: 5px 8px;
  font-size: 16px;
`;
const AddButton = styled.button`
  width: 100%;
  border: 1.5px dashed #9ac49a;
  background: #f6fbf6;
  color: darkgreen;
  border-radius: 14px;
  min-height: 48px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 850;
  margin-top: 12px;
`;
const SubtotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
  font-size: 14px;
  font-weight: 800;
`;
const SummaryRows = styled.div`
  display: grid;
  gap: 12px;
  margin: 19px 0;
`;
const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #52525b;
  font-size: 14px;
`;
const GrandTotal = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-radius: 16px;
  padding: 17px;
  background: #edf7ed;
  color: darkgreen;
  font-weight: 900;
  strong {
    font-size: 23px;
  }
`;
const MetaText = styled.p`
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #71717a;
`;
const SettlementHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  margin-top: 18px;
  padding: 12px;
  border-bottom: 1px solid #e4e4e7;
  font-size: 12px;
  color: #71717a;
  font-weight: 800;
  span:last-child {
    text-align: right;
  }
`;
const SettlementEmpty = styled.div`
  min-height: 136px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 7px;
  color: #52525b;
  span {
    font-size: 26px;
    color: darkgreen;
  }
  b {
    font-size: 14px;
  }
  small {
    font-size: 12px;
    color: #71717a;
  }
`;
const PrimaryButton = styled.button`
  width: 100%;
  border: 0;
  min-height: 56px;
  border-radius: 16px;
  background: darkgreen;
  color: white;
  font-size: 16px;
  font-weight: 900;
  &:disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }
`;
const SecondaryButton = styled.button`
  margin-top: 16px;
  width: 100%;
  border: 0;
  border-radius: 16px;
  min-height: 52px;
  background: #e4e4e7;
  color: #3f3f46;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
`;
