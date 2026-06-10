"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clampMesaPanelWidth,
  loadMesaPanelLayout,
  saveMesaPanelLayout,
  MESA_PANEL_DEFAULT_LEFT,
  MESA_PANEL_DEFAULT_RIGHT,
  type MesaPanelLayout,
  type MesaPanelSide,
} from "@/lib/vtt/mesa-panel-layout";

const SSR_DEFAULT_LEFT: MesaPanelLayout = { width: MESA_PANEL_DEFAULT_LEFT, collapsed: false };
const SSR_DEFAULT_RIGHT: MesaPanelLayout = { width: MESA_PANEL_DEFAULT_RIGHT, collapsed: false };

export function useMesaPanelLayout(roomId?: string) {
  const [left, setLeft] = useState<MesaPanelLayout>(SSR_DEFAULT_LEFT);
  const [right, setRight] = useState<MesaPanelLayout>(SSR_DEFAULT_RIGHT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLeft(loadMesaPanelLayout("left", roomId));
    setRight(loadMesaPanelLayout("right", roomId));
    setHydrated(true);
  }, [roomId]);

  useEffect(() => {
    if (!hydrated) return;
    saveMesaPanelLayout("left", left, roomId);
  }, [left, roomId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveMesaPanelLayout("right", right, roomId);
  }, [right, roomId, hydrated]);

  const patch = useCallback((side: MesaPanelSide, patch: Partial<MesaPanelLayout>) => {
    const apply = (prev: MesaPanelLayout): MesaPanelLayout => ({
      width: patch.width != null ? clampMesaPanelWidth(patch.width) : prev.width,
      collapsed: patch.collapsed ?? prev.collapsed,
    });
    if (side === "left") setLeft(apply);
    else setRight(apply);
  }, []);

  const setWidth = useCallback(
    (side: MesaPanelSide, width: number) => patch(side, { width }),
    [patch]
  );

  const toggleCollapsed = useCallback(
    (side: MesaPanelSide) => {
      if (side === "left") setLeft((p) => ({ ...p, collapsed: !p.collapsed }));
      else setRight((p) => ({ ...p, collapsed: !p.collapsed }));
    },
    []
  );

  return { left, right, setWidth, toggleCollapsed, patch, hydrated };
}
