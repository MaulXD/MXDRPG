export type MesaPanelSide = "left" | "right";

export type MesaPanelLayout = {
  width: number;
  collapsed: boolean;
};

export const MESA_PANEL_COLLAPSED_WIDTH = 36;
export const MESA_PANEL_WIDTH_MIN = 200;
export const MESA_PANEL_WIDTH_MAX = 480;
export const MESA_PANEL_DEFAULT_LEFT = 240;
export const MESA_PANEL_DEFAULT_RIGHT = 280;

export function clampMesaPanelWidth(width: number): number {
  return Math.min(MESA_PANEL_WIDTH_MAX, Math.max(MESA_PANEL_WIDTH_MIN, Math.round(width)));
}

export function effectiveMesaPanelWidth(panel: MesaPanelLayout): number {
  return panel.collapsed ? MESA_PANEL_COLLAPSED_WIDTH : panel.width;
}

function storageKey(side: MesaPanelSide, roomId?: string): string {
  return `eldarin-mesa-panel-${side}${roomId ? `-${roomId}` : ""}`;
}

export function loadMesaPanelLayout(side: MesaPanelSide, roomId?: string): MesaPanelLayout {
  if (typeof window === "undefined") {
    return {
      width: side === "left" ? MESA_PANEL_DEFAULT_LEFT : MESA_PANEL_DEFAULT_RIGHT,
      collapsed: false,
    };
  }
  try {
    const raw = localStorage.getItem(storageKey(side, roomId));
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as Partial<MesaPanelLayout>;
    return {
      width: clampMesaPanelWidth(
        parsed.width ?? (side === "left" ? MESA_PANEL_DEFAULT_LEFT : MESA_PANEL_DEFAULT_RIGHT)
      ),
      collapsed: Boolean(parsed.collapsed),
    };
  } catch {
    return {
      width: side === "left" ? MESA_PANEL_DEFAULT_LEFT : MESA_PANEL_DEFAULT_RIGHT,
      collapsed: false,
    };
  }
}

export function saveMesaPanelLayout(
  side: MesaPanelSide,
  layout: MesaPanelLayout,
  roomId?: string
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(side, roomId), JSON.stringify(layout));
  } catch {
    /* quota / private mode */
  }
}
