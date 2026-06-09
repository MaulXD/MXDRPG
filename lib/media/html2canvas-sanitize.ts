/**
 * html2canvas 1.x não entende color-mix(), color(), oklch(), etc.
 * Copia estilos computados (rgb/rgba) do DOM vivo para o clone e remove folhas CSS.
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

/** Funções de cor modernas que quebram o parser do html2canvas. */
const UNSAFE_COLOR_VALUE =
  /color-mix\s*\(|(?<![\w-])color\s*\(|oklch\s*\(|oklab\s*\(|lch\s*\(|lab\s*\(/i;

function isSafeCSSValue(prop: string, value: string): boolean {
  if (!value || value === "initial" || value === "unset" || value === "inherit") return false;
  if (prop.startsWith("--")) return false;
  if (UNSAFE_COLOR_VALUE.test(value)) return false;
  return true;
}

function copyComputedStyles(source: Element, target: HTMLElement): void {
  const computed = getComputedStyle(source);
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    if (SKIP_PROPS.has(prop)) continue;
    const value = computed.getPropertyValue(prop);
    if (!isSafeCSSValue(prop, value)) continue;
    target.style.setProperty(prop, value, computed.getPropertyPriority(prop));
  }
}

/** Remove propriedades inline que ainda contenham funções de cor não suportadas. */
export function scrubElementInlineStyles(target: HTMLElement): void {
  const style = target.style;
  const toRemove: string[] = [];
  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    const value = style.getPropertyValue(prop);
    if (prop.startsWith("--") || UNSAFE_COLOR_VALUE.test(value)) {
      toRemove.push(prop);
    }
  }
  for (const prop of toRemove) {
    style.removeProperty(prop);
  }
}

function scrubTree(root: HTMLElement): void {
  scrubElementInlineStyles(root);
  root.querySelectorAll<HTMLElement>("*").forEach(scrubElementInlineStyles);
}

function walkPair(source: Element, target: Element): void {
  if (source instanceof HTMLElement && target instanceof HTMLElement) {
    copyComputedStyles(source, target);
    scrubElementInlineStyles(target);
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
  const liveNodes = [liveRoot, ...Array.from(liveRoot.querySelectorAll("*"))];
  const cloneNodes = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll("*"))];
  const n = Math.min(liveNodes.length, cloneNodes.length);
  for (let i = 0; i < n; i++) {
    const src = liveNodes[i];
    const tgt = cloneNodes[i];
    if (src instanceof HTMLElement && tgt instanceof HTMLElement) {
      copyComputedStyles(src, tgt);
      scrubElementInlineStyles(tgt);
    }
  }
  if (liveNodes.length !== cloneNodes.length) {
    walkPair(liveRoot, clonedRoot);
  }
  scrubTree(clonedRoot);
}

/** Remove folhas de estilo do documento clonado para o parser do html2canvas não quebrar. */
export function stripStylesheetsFromClone(doc: Document): void {
  doc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove());
}

/** CSS só com hex/rgba — reaplicado após remover folhas com color-mix(). */
export const PDF_CAPTURE_SAFE_CSS = `
.sheet-pdf-capture-host { visibility: visible !important; opacity: 1 !important; }
.sheet-pdf-capture {
  width: 920px;
  background: #121921;
  color: #e8ecf0;
  font-family: "Lora", Georgia, serif;
  --sheet-accent: #c9a962;
  --sheet-accent-soft: rgba(201, 169, 98, 0.14);
  --sheet-surface: #1a1f2e;
  --sheet-border: rgba(122, 163, 201, 0.22);
  --sheet-border-bright: rgba(122, 163, 201, 0.38);
  --sheet-inset: rgba(0, 0, 0, 0.35);
  --mf-bg: #121921;
  --mf-accent: #7aa3c9;
  --mf-accent-dim: rgba(122, 163, 201, 0.45);
  --mf-accent-soft: rgba(122, 163, 201, 0.12);
  --mf-pad: 0.65rem;
  --mf-inset: 10px;
}
.sheet-pdf-capture__frame.mf {
  background: #121921;
  padding: calc(var(--mf-pad) + var(--mf-inset));
}
.sheet-pdf-capture .sheet-shell--popup { width: 100%; max-width: 100%; }
.sheet-pdf-capture .ornament-card {
  background: rgba(26, 31, 46, 0.92);
  border: 1px solid rgba(122, 163, 201, 0.22);
}
.sheet-pdf-capture .mf::before,
.sheet-pdf-capture .mf::after {
  border-color: rgba(122, 163, 201, 0.28);
}
.sheet-pdf-capture img { max-width: 100%; }
`;

export function injectPdfCaptureSafeStyles(doc: Document): void {
  const style = doc.createElement("style");
  style.textContent = PDF_CAPTURE_SAFE_CSS;
  doc.head.appendChild(style);
}
