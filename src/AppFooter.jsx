import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import { LuBookOpen, LuMail, LuMessageCircle } from "react-icons/lu";

// Configure VITE_CONTACT_EMAIL in the frontend environment when ready.
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL?.trim();

export default function AppFooter() {
  const { t } = useTranslation();

  return (
    <Footer>
      <Brand>Quicky</Brand>
      <Description>{t("footer.description")}</Description>

      <Help>
        <HelpSummary>
          <LuBookOpen aria-hidden="true" size={17} />
          {t("footer.help")}
        </HelpSummary>
        <HelpText>{t("footer.helpText")}</HelpText>
      </Help>

      {CONTACT_EMAIL && (
        <Contact
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Quicky feedback")}`}
        >
          <LuMessageCircle aria-hidden="true" size={17} />
          {t("footer.feedback")}
          <LuMail aria-hidden="true" size={15} />
        </Contact>
      )}

      <Divider />
      <FinePrint>
        © {new Date().getFullYear()} {t("footer.tagline")}
      </FinePrint>
    </Footer>
  );
}

const Footer = styled.footer`
  width: 100%;
  max-width: 430px;
  box-sizing: border-box;
  margin: 8px auto 0;
  padding: 18px 20px 0 20px;
  text-align: center;
  color: #52525b;
`;

const Brand = styled.div`
  font-size: 16px;
  font-weight: 900;
  color: #18181b;
`;

const Description = styled.p`
  white-space: pre-line;
  text-align: center;
  color: #71717a;
  line-height: 1.6;
`;

const Help = styled.details`
  border: 1px solid #e4e4e7;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  margin-bottom: 10px;
`;

const FooterActionStyle = css`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 13px 14px;
  color: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid darkgreen;
    outline-offset: 2px;
  }
`;

const HelpSummary = styled.summary`
  ${FooterActionStyle}
  list-style: none;
`;

const Contact = styled.a`
  ${FooterActionStyle}
  border: 1px solid #e4e4e7;
  border-radius: 14px;
  background: #fff;
  text-decoration: none;
`;

const HelpText = styled.p`
  white-space: pre-line;
  margin: 0;
  padding: 0 14px 14px;
  font-size: 13px;
  line-height: 1.6;
`;

const Divider = styled.div`
  height: 1px;
  background: #e4e4e7;
  margin: 18px 0 12px;
`;

const FinePrint = styled.small`
  display: block;
  color: #71717a;
  font-size: 11px;
  line-height: 1.5;
`;
