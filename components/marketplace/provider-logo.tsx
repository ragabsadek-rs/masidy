import type { IconType } from "react-icons";
import { SiGithub, SiSlack, SiStripe, SiDatadog, SiNotion, SiPostgresql, SiSentry } from "react-icons/si";
import { FaAws } from "react-icons/fa";

interface ProviderLogoProps {
  provider: string;
  className?: string;
}

const logos: Record<string, IconType> = {
  Masidy: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#2563EB" />
      <path d="M7.5 16.5L10 8.5L12.5 12.5L15 8.5L17.5 16.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  GitHub: SiGithub,
  Slack: SiSlack,
  Stripe: SiStripe,
  Datadog: SiDatadog,
  Notion: SiNotion,
  "Amazon Web Services": FaAws,
  PostgreSQL: SiPostgresql,
  Sentry: SiSentry,
};

const DefaultLogo: IconType = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#94A3B8" />
    <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export function ProviderLogo({ provider, className }: ProviderLogoProps) {
  const key = provider === "AWS" ? "Amazon Web Services" : provider;
  const Logo = logos[key] ?? DefaultLogo;
  return <Logo className={className} />;
}
