"use client";

import { useCallback, useEffect, useState } from "react";

export type MesaWindowId =
  | "actors"
  | "gm"
  | "dungeon"
  | "tokens"
  | "initiative"
  | "chat"
  | "dice"
  | "ficha"
  | "spawn"
  | "character";

/** Painéis fixos na coluna esquerda (um aberto por vez). */
export const FOUNDRY_DOCK_PANEL_IDS: MesaWindowId[] = [
  "actors",
  "initiative",
  "chat",
  "dice",
  "ficha",
  "spawn",
  "gm",
  "dungeon",
];

export type FoundryWindowLayout = {
  open: boolean;
  minimized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
};

type Registry = Partial<Record<MesaWindowId, FoundryWindowLayout>>;

const DEFAULT_LAYOUTS: Record<MesaWindowId, Omit<FoundryWindowLayout, "open" | "minimized" | "z">> = {
  actors: { x: 52, y: 48, width: 280, height: 440 },
  gm: { x: 52, y: 48, width: 300, height: 480 },
  dungeon: { x: 52, y: 48, width: 300, height: 520 },
  tokens: { x: 52, y: 48, width: 300, height: 480 },
  initiative: { x: 52, y: 500, width: 280, height: 360 },
  chat: { x: 52, y: 48, width: 340, height: 340 },
  dice: { x: 52, y: 400, width: 300, height: 260 },
  ficha: { x: 400, y: 48, width: 360, height: 320 },
  spawn: { x: 400, y: 360, width: 320, height: 380 },
  character: { x: 72, y: 40, width: 960, height: 680 },
};

const DEFAULT_OPEN: MesaWindowId[] = ["initiative"];

function storageKey(roomId?: string): string {
  return `eldarin-foundry-windows${roomId ? `-${roomId}` : ""}`;
}

function defaultEntry(id: MesaWindowId, z: number): FoundryWindowLayout {
  return {
    ...DEFAULT_LAYOUTS[id],
    open: DEFAULT_OPEN.includes(id),
    minimized: false,
    z,
  };
}

function buildDefaultRegistry(): Registry {
  const reg: Registry = {};
  let z = 10;
  for (const id of Object.keys(DEFAULT_LAYOUTS) as MesaWindowId[]) {
    reg[id] = defaultEntry(id, z++);
  }
  return reg;
}

function maxZ(registry: Registry): number {
  let max = 20;
  for (const w of Object.values(registry)) {
    if (w && w.z > max) max = w.z;
  }
  return max;
}

function loadRegistry(roomId?: string): Registry {
  if (typeof window === "undefined") return buildDefaultRegistry();
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    if (!raw) return buildDefaultRegistry();
    const parsed = JSON.parse(raw) as Registry;
    if (parsed.tokens && !parsed.actors) {
      parsed.actors = { ...parsed.tokens };
    }
    const base = buildDefaultRegistry();
    for (const id of Object.keys(DEFAULT_LAYOUTS) as MesaWindowId[]) {
      const saved = parsed[id];
      if (!saved) continue;
      const merged: FoundryWindowLayout = {
        ...base[id]!,
        ...saved,
        x: typeof saved.x === "number" ? saved.x : base[id]!.x,
        y: typeof saved.y === "number" ? saved.y : base[id]!.y,
        width: typeof saved.width === "number" ? saved.width : base[id]!.width,
        height: typeof saved.height === "number" ? saved.height : base[id]!.height,
        open: Boolean(saved.open),
        minimized: Boolean(saved.minimized),
        z: typeof saved.z === "number" ? saved.z : base[id]!.z,
      };
      if (id === "character") {
        if (merged.width < 640) merged.width = DEFAULT_LAYOUTS.character.width;
        if (merged.height < 400) merged.height = DEFAULT_LAYOUTS.character.height;
      }
      base[id] = merged;
    }
    return base;
  } catch {
    return buildDefaultRegistry();
  }
}

export function useFoundryWindows(roomId?: string) {
  const [registry, setRegistry] = useState<Registry>(buildDefaultRegistry);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRegistry(loadRegistry(roomId));
    setHydrated(true);
  }, [roomId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(roomId), JSON.stringify(registry));
    } catch {
      /* quota */
    }
  }, [registry, roomId, hydrated]);

  const get = useCallback(
    (id: MesaWindowId): FoundryWindowLayout => {
      return registry[id] ?? defaultEntry(id, 10);
    },
    [registry]
  );

  const patch = useCallback((id: MesaWindowId, next: Partial<FoundryWindowLayout>) => {
    setRegistry((prev) => {
      const cur = prev[id] ?? defaultEntry(id, 10);
      return { ...prev, [id]: { ...cur, ...next } };
    });
  }, []);

  const toggle = useCallback((id: MesaWindowId) => {
    setRegistry((prev) => {
      const cur = prev[id] ?? defaultEntry(id, 10);
      const closing = cur.open && !cur.minimized;
      const next: Registry = { ...prev };

      if (FOUNDRY_DOCK_PANEL_IDS.includes(id) && !closing) {
        for (const dockId of FOUNDRY_DOCK_PANEL_IDS) {
          if (dockId === id) continue;
          const other = next[dockId] ?? defaultEntry(dockId, 10);
          next[dockId] = { ...other, open: false, minimized: false };
        }
      }

      if (closing) {
        next[id] = { ...cur, open: false, minimized: false };
      } else {
        const z = maxZ(prev) + 1;
        next[id] = { ...cur, open: true, minimized: false, z };
      }
      return next;
    });
  }, []);

  const open = useCallback((id: MesaWindowId) => {
    setRegistry((prev) => {
      const cur = prev[id] ?? defaultEntry(id, 10);
      const z = maxZ(prev) + 1;
      return { ...prev, [id]: { ...cur, open: true, minimized: false, z } };
    });
  }, []);

  const close = useCallback((id: MesaWindowId) => {
    setRegistry((prev) => {
      const cur = prev[id] ?? defaultEntry(id, 10);
      return { ...prev, [id]: { ...cur, open: false, minimized: false } };
    });
  }, []);

  const minimize = useCallback((id: MesaWindowId) => {
    setRegistry((prev) => {
      const cur = prev[id] ?? defaultEntry(id, 10);
      return { ...prev, [id]: { ...cur, minimized: true } };
    });
  }, []);

  const restore = useCallback((id: MesaWindowId) => {
    setRegistry((prev) => {
      const cur = prev[id] ?? defaultEntry(id, 10);
      const z = maxZ(prev) + 1;
      return { ...prev, [id]: { ...cur, minimized: false, open: true, z } };
    });
  }, []);

  const focus = useCallback((id: MesaWindowId) => {
    setRegistry((prev) => {
      const cur = prev[id] ?? defaultEntry(id, 10);
      if (!cur.open) return prev;
      const z = maxZ(prev) + 1;
      return { ...prev, [id]: { ...cur, z } };
    });
  }, []);

  const isActive = useCallback(
    (id: MesaWindowId) => {
      const w = registry[id];
      return Boolean(w?.open && !w?.minimized);
    },
    [registry]
  );

  const isDockOpen = useCallback(() => {
    return FOUNDRY_DOCK_PANEL_IDS.some((id) => {
      const w = registry[id];
      return Boolean(w?.open);
    });
  }, [registry]);

  return {
    get,
    patch,
    toggle,
    open,
    close,
    minimize,
    restore,
    focus,
    isActive,
    isDockOpen,
    hydrated,
  };
}
