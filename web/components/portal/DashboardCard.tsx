type Props = {
  title: string;
  description: string;
  accent?: "cyan" | "magenta" | "lime";
  href?: string;
};

const accentColor = {
  cyan: "var(--neon-cyan)",
  magenta: "var(--neon-magenta)",
  lime: "var(--neon-lime)",
};

export function DashboardCard({ title, description, accent = "cyan", href }: Props) {
  const inner = (
    <>
      <h3 style={{ color: accentColor[accent] }}>{title}</h3>
      <p>{description}</p>
    </>
  );

  if (href) {
    return (
      <a href={href} className="glass feature-card" style={{ display: "block" }}>
        {inner}
      </a>
    );
  }

  return <article className="glass feature-card">{inner}</article>;
}
