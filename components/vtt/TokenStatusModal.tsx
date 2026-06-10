"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BattleToken } from "@/lib/vtt/types";
import type { CombatTrack } from "@/lib/room/combat";
import { TokenStatusBody } from "@/components/vtt/TokenStatusBody";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";

type Props = {
  open: boolean;
  token: BattleToken | null;
  roomId: string;
  combat: CombatTrack | null | undefined;
  canApplyConditions: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

function storageKey(roomId: string): string {
  return `eldarin-status-window-${roomId}`;
}

function defaultLayout(): FoundryWindowLayout {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200;
  const h = typeof window !== "undefined" ? window.innerHeight : 800;
  return {
    open: false,
    minimized: false,
    x: Math.max(48, Math.round(w / 2 - 200)),
    y: Math.max(4, Math.round(h * 0.1)),
    width: 400,
    height: Math.min(560, Math.round(h * 0.72)),
    z: 88,
  };
}

function loadLayout(roomId: string): FoundryWindowLayout {
  if (typeof window === "undefined") return defaultLayout();
  try {
    const raw = sessionStorage.getItem(storageKey(roomId));
    if (!raw) return defaultLayout();
    const parsed = JSON.parse(raw) as Partial<FoundryWindowLayout>;
    return { ...defaultLayout(), ...parsed, open: false };
  } catch {
    return defaultLayout();
  }
}

function resolvePortalRoot(): HTMLElement {
  return document.getElementById("foundry-mesa-windows") ?? document.body;
}

export function TokenStatusModal({
  open,
  token,
  roomId,
  combat,
  canApplyConditions,
  onClose,
  onUpdate,
}: Props) {
  const [layout, setLayout] = useState<FoundryWindowLayout>(() => loadLayout(roomId));
  const zCounter = useRef(layout.z);

  useEffect(() => {
    setLayout(loadLayout(roomId));
  }, [roomId]);

  useEffect(() => {
    if (!open) return;
    zCounter.current += 1;
    setLayout((prev) => ({ ...prev, z: zCounter.current }));
  }, [open, token?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const { open: _o, minimized, x, y, width, height, z } = layout;
      sessionStorage.setItem(
        storageKey(roomId),
        JSON.stringify({ minimized, x, y, width, height, z })
      );
    } catch {
      /* ignore quota */
    }
  }, [layout.minimized, layout.x, layout.y, layout.width, layout.height, layout.z, roomId]);

  const patchLayout = useCallback((patch: Partial<FoundryWindowLayout>) => {
    setLayout((prev) => ({ ...prev, ...patch }));
  }, []);

  const focusWindow = useCallback(() => {
    zCounter.current += 1;
    setLayout((prev) => ({ ...prev, z: zCounter.current }));
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !token || typeof document === "undefined") return null;

  const windowLayout: FoundryWindowLayout = { ...layout, open: true };

  return createPortal(
    <FoundryWindow
      title={`Status · ${token.name}`}
      layout={windowLayout}
      onLayoutChange={patchLayout}
      onClose={onClose}
      onMinimize={() => patchLayout({ minimized: !layout.minimized })}
      onFocus={focusWindow}
      className="foundry-window--status"
      minWidth={280}
      minHeight={220}
    >
      <TokenStatusBody
        token={token}
        roomId={roomId}
        combat={combat}
        canApplyConditions={canApplyConditions}
        onUpdate={onUpdate}
      />
    </FoundryWindow>,
    resolvePortalRoot()
  );
}
