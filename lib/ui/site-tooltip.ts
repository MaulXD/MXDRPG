/** Seletores de tooltips já estilizados no app — não duplicar com a camada global. */
export const BUILTIN_TOOLTIP_SELECTOR =
  "[role='tooltip'], .wizard-hover-tip__bubble, .foundry-icon-bar__tooltip, .action-hover-tip__bubble, .sheet-hover-tip__bubble";

export function hasBuiltInTooltip(el: HTMLElement): boolean {
  return Boolean(el.querySelector(BUILTIN_TOOLTIP_SELECTOR));
}

export function migrateNativeTitle(el: HTMLElement): void {
  const title = el.getAttribute("title")?.trim();
  if (!title) return;

  if (hasBuiltInTooltip(el)) {
    el.removeAttribute("title");
    return;
  }

  if (!el.dataset.siteTip) {
    el.dataset.siteTip = title;
  }
  el.removeAttribute("title");
}

export function scanNativeTitles(root: ParentNode): void {
  if (root instanceof HTMLElement && root.hasAttribute("title")) {
    migrateNativeTitle(root);
  }
  if ("querySelectorAll" in root) {
    root.querySelectorAll<HTMLElement>("[title]").forEach(migrateNativeTitle);
  }
}

export type SiteTooltipPlacement = {
  left: number;
  top: number;
  flipAbove: boolean;
};

export function computeSiteTooltipPlacement(
  anchorX: number,
  anchorY: number,
  tipW: number,
  tipH: number,
  pad = 10
): SiteTooltipPlacement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const offsetX = 14;
  const offsetY = 16;

  let left = anchorX + offsetX;
  let top = anchorY + offsetY;
  let flipAbove = false;

  if (left + tipW + pad > vw) {
    left = Math.max(pad, anchorX - tipW - offsetX);
  }
  if (top + tipH + pad > vh) {
    top = Math.max(pad, anchorY - tipH - offsetY);
    flipAbove = true;
  }

  return { left, top, flipAbove };
}
