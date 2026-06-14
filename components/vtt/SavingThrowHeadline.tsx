import type { SavingThrowHeadline as Headline } from "@/lib/combat/saving-throw-chat";

type Props = {
  headline: Headline;
};

/** Destaque nas duas primeiras letras do atributo (ex.: DE + streza). */
function AttributeEmphasis({ full }: { full: string }) {
  if (full.length < 2) return <strong className="combat-chat-card__save-attr">{full}</strong>;
  const mark = full.slice(0, 2).toLocaleUpperCase("pt-BR");
  const rest = full.slice(2);
  return (
    <span className="combat-chat-card__save-attr">
      <span className="combat-chat-card__save-attr-mark">{mark}</span>
      {rest}
    </span>
  );
}

export function SavingThrowHeadline({ headline }: Props) {
  const pass = headline.success === true;
  const fail = headline.success === false;
  const className = [
    "combat-chat-card__save-headline",
    pass ? "combat-chat-card__save-headline--pass" : "",
    fail ? "combat-chat-card__save-headline--fail" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <p className={className}>
      {headline.verb ? (
        <>
          <strong className="combat-chat-card__save-verb">{headline.verb}</strong>
          {" no teste de salvaguarda de "}
        </>
      ) : (
        <>Teste de salvaguarda de </>
      )}
      <AttributeEmphasis full={headline.attributeFull} />
      {headline.dc != null ? (
        <>
          {", dificuldade "}
          <strong className="combat-chat-card__save-dc">{headline.dc}</strong>
        </>
      ) : null}
    </p>
  );
}
