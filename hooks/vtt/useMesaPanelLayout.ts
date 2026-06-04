"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clampMesaPanelWidth,
  loadMesaPanelLayout,
  saveMesaPanelLayout,
  type MesaPanelLayout,
  type MesaPanelSide,
} from "@/lib/vtt/mesa-panel-layout";

export function useMesaPanelLayout(roomId?: string) {
  const [left, setLeft] = useState<MesaPanelLayout>(() => loadMesaPanelLayout("left", roomId));
  const [right, setRight] = useState<MesaPanelLayout>(() => loadMesaPanelLayout("right", roomId));

  useEffect(() => {
    saveMesaPanelLayout("left", left, roomId);
  }, [left, roomId]);

  useEffect(() => {
    saveMesaPanelLayout("right", right, roomId);
  }, [right, roomId]);

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

  return { left, right, setWidth, toggleCollapsed, patch };
}
