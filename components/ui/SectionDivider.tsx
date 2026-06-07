type Props = {
  title: string;
  className?: string;
};

/** Separador de seção v4 — DESIGN-ELDARIN-V4 §8 */
export function SectionDivider({ title, className = "" }: Props) {
  const root = ["section-divider", className].filter(Boolean).join(" ");
  return (
    <div className={root}>
      <div className="section-divider__line" aria-hidden />
      <div className="section-divider__gem" aria-hidden />
      <span className="section-divider__title">{title}</span>
      <div className="section-divider__gem" aria-hidden />
      <div className="section-divider__line" aria-hidden />
    </div>
  );
}
