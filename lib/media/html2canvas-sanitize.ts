/**
 * html2canvas 1.x não entende color-mix(), color(), oklch(), etc.
 * Copia estilos já computados (rgb/rgba) do DOM vivo para o clone e remove folhas CSS.
 */

const SKIP_PROPS = new Set([
  "transition",
  "transition-property",
  "transition-duration",
  "transition-timing-function",
  "transition-delay",
  "animation",
  "animation-name",
  "animation-duration",
  "animation-timing-function",
  "animation-delay",
  "animation-iteration-count",
  "animation-direction",
  "animation-fill-mode",
  "animation-play-state",
  "-webkit-transition",
  "-webkit-animation",
]);

function copyComputedStyles(source: Element, target: HTMLElement): void {
  const computed = getComputedStyle(source);
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    if (SKIP_PROPS.has(prop)) continue;
    const value = computed.getPropertyValue(prop);
    if (!value) continue;
    if (
      value.includes("color-mix(") ||
      value.includes("color(") ||
      value.includes("oklch(") ||
      value.includes("lch(")
    ) {
      continue;
    }
    target.style.setProperty(prop, value, computed.getPropertyPriority(prop));
  }
}

function walkPair(source: Element, target: Element): void {
  if (source instanceof HTMLElement && target instanceof HTMLElement) {
    copyComputedStyles(source, target);
  }
  const srcKids = source.children;
  const tgtKids = target.children;
  const n = Math.min(srcKids.length, tgtKids.length);
  for (let i = 0; i < n; i++) {
    walkPair(srcKids[i]!, tgtKids[i]!);
  }
}

/** Inline estilos computados do nó vivo no clone (mesma árvore de filhos). */
export function inlineComputedStylesForHtml2Canvas(
  liveRoot: HTMLElement,
  clonedRoot: HTMLElement
): void {
  walkPair(liveRoot, clonedRoot);
}

/** Remove folhas de estilo do documento clonado para o parser do html2canvas não quebrar. */
export function stripStylesheetsFromClone(doc: Document): void {
  doc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove());
}
