export const metadata = {
  title: "Builder — Masidy",
};

// Full-screen layout — no sidebar, no top bar from parent
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
