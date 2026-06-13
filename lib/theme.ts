function themeColorRoot(): Element {
  const mesa = document.querySelector(".vtt-chrome[data-vtt-mesa]");
  return mesa ?? document.documentElement;
}

export function readThemeColor(varName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(themeColorRoot()).getPropertyValue(varName).trim();
  return value || fallback;
}
