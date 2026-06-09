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
.sheet-pdf-capture-host { visibility: visible !important; opacity: 1 !important; width: 794px !important; }
.sheet-pdf-doc {
  width: 794px;
  max-width: 794px;
  background: #faf6ee;
  color: #1a1410;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 7.5pt;
  line-height: 1.28;
  padding: 8mm;
  box-sizing: border-box;
}
.sheet-pdf-doc__title { font-size: 12pt; text-align: center; border-bottom: 2px solid #b8922e; margin: 0; }
.sheet-pdf-doc__brand { text-align: center; font-size: 6.5pt; color: #5c4a32; }
.sheet-pdf-doc__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 6mm; }
.sheet-pdf-doc__full { grid-column: 1 / -1; }
.sheet-pdf-doc h2 { font-size: 7.5pt; background: #3d5c40; color: #f0e6d4; padding: 0.12em 0.35em; margin: 0.5em 0 0.2em; }
.sheet-pdf-doc table { width: 100%; border-collapse: collapse; font-size: 6.5pt; }
.sheet-pdf-doc th, .sheet-pdf-doc td { border: 1px solid #c4b59a; padding: 0.12em 0.25em; }
.sheet-pdf-doc thead th { background: #2c3d2e; color: #f0e6d4; text-align: center; }
.sheet-pdf-doc__kv th { background: #ebe2d0; }
.sheet-pdf-doc__skills { display: flex; flex-wrap: wrap; gap: 0.35em; }
.sheet-pdf-doc__skill { border: 1px solid #c4b59a; padding: 0.1em 0.35em; font-size: 6.5pt; }
.sheet-pdf-doc img { max-width: 100%; }
`;

export function injectPdfCaptureSafeStyles(doc: Document): void {
  const style = doc.createElement("style");
  style.textContent = PDF_CAPTURE_SAFE_CSS;
  doc.head.appendChild(style);
}
