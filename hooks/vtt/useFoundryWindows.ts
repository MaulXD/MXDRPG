"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clampWindowLayout,
  computePopupPosition,
  type FoundryWindowLayout,
  type MesaWindowId,
} from "@/lib/vtt/foundry-window-placement";

export type { FoundryWindowLayout, MesaWindowId };

/** Painéis fixos na coluna esquerda (um aberto por vez). */
export const FOUNDRY_DOCK_PANEL_IDS: MesaWindowId[] = [
  "actors",
  "initiative",
  "ficha",
  "chat",
  "dice",
  "spawn",
  "invite",
  "gm",
  "dungeon",
  "whiteboard",
  "status",
];

type Registry = Partial<Record<MesaWindowId, FoundryWindowLayout>>;

const DEFAULT_LAYOUTS: Record<MesaWindowId, Omit<FoundryWindowLayout, "open" | "minimized" | "z">> = {
  actors: { x: 52, y: 48, width: 248, height: 420 },
  gm: { x: 52, y: 48, width: 300, height: 480 },
  dungeon: { x: 52, y: 48, width: 360, height: 540 },
  whiteboard: { x: 52, y: 48, width: 280, height: 480 },
  tokens: { x: 52, y: 48, width: 300, height: 480 },
  initiative: { x: 52, y: 500, width: 196, height: 300 },
  chat: { x: 52, y: 48, width: 340, height: 340 },
  dice: { x: 52, y: 400, width: 300, height: 260 },
  ficha: { x: 400, y: 48, width: 360, height: 320 },
  spawn: { x: 400, y: 360, width: 320, height: 380 },
  invite: { x: 52, y: 48, width: 280, height: 280 },
  character: { x: 72, y: 40, width: 960, height: 680 },
  createCharacter: { x: 48, y: 32, width: 1040, height: 720 },
  monsterSheet: { x: 96, y: 56, width: 520, height: 640 },
  status: { x: 52, y: 48, width: 400, height: 520 },
};

const DEFAULT_OPEN: MesaWindowId[] = ["initiative", "spawn"];

/** Painéis abertos por padrão como janela flutuante (não na barra lateral). */
const DEFAULT_FLOATING: MesaWindowId[] = ["initiative"];

function storageKey(roomId?: string): string {
  return `eldarin-foundry-windows${roomId ? `-${roomId}` : ""}`;
}

function floatingStorageKey(roomId?: string): string {
  return `eldarin-foundry-floating${roomId ? `-${roomId}` : ""}`;
}

type FloatingMap = Partial<Record<MesaWindowId, boolean>>;

function defaultFloatingMap(): FloatingMap {
  const map: FloatingMap = {};
  for (const id of DEFAULT_FLOATING) map[id] = true;
  return map;
}

function loadFloating(roomId?: string): FloatingMap {
  if (typeof window === "undefined") return defaultFloatingMap();
  try {
    const raw = localStorage.getItem(floatingStorageKey(roomId));
    if (!raw) return defaultFloatingMap();
    return { ...defaultFloatingMap(), ...(JSON.parse(raw) as FloatingMap) };
  } catch {
    return defaultFloatingMap();
  }
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
        if (merged.width < 760) merged.width = DEFAULT_LAYOUTS.character.width;
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
  const [registry, setRegistry] = useState<Registry>(() => buildDefaultRegistry());
  const [floating, setFloating] = useState<FloatingMap>(() => defaultFloatingMap());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRegistry(loadRegistry(roomId));
    setFloating(loadFloating(roomId));
    setHydrated(true);
  }, [roomId]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const id = window.requestAnimationFrame(() => {
      setRegistry((prev) => {
        let changed = false;
        const next: Registry = { ...prev };
        for (const wid of Object.keys(next) as MesaWindowId[]) {
          const win = next[wid];
          if (!win || !floating[wid]) continue;
          const clamped = clampWindowLayout(win);
          if (clamped.x !== win.x || clamped.y !== win.y) {
            next[wid] = clamped;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [hydrated, floating, roomId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(roomId), JSON.stringify(registry));
    } catch {
      /* quota */
    }
  }, [registry, roomId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(floatingStorageKey(roomId), JSON.stringify(floating));
    } catch {
      /* quota */
    }
  }, [floating, roomId, hydrated]);

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

  const isFloating = useCallback(
    (id: MesaWindowId) => Boolean(floating[id]),
    [floating]
  );

  const openAsPopup = useCallback((id: MesaWindowId) => {
    setFloating((floatPrev) => {
      const wasFloating = Boolean(floatPrev[id]);
      setRegistry((prev) => {
        const cur = prev[id] ?? defaultEntry(id, 10);
        if (cur.open && !cur.minimized && wasFloating) {
          const z = maxZ(prev) + 1;
          return { ...prev, [id]: { ...cur, z } };
        }
        const nextFloating: FloatingMap = { ...floatPrev, [id]: true };
        const size = {
          width: cur.width ?? DEFAULT_LAYOUTS[id].width,
          height: cur.height ?? DEFAULT_LAYOUTS[id].height,
        };
        const pos = computePopupPosition(id, prev, nextFloating, size);
        const z = maxZ(prev) + 1;
        return {
          ...prev,
          [id]: { ...cur, open: true, minimized: false, z, x: pos.x, y: pos.y },
        };
      });
      return { ...floatPrev, [id]: true };
    });
  }, []);

  /** Clique direito: abre na barra lateral; se já estiver na barra, fecha. */
  const openInDock = useCallback((id: MesaWindowId) => {
    setFloating((floatPrev) => {
      const wasFloating = Boolean(floatPrev[id]);
      setRegistry((prev) => {
        const cur = prev[id] ?? defaultEntry(id, 10);
        if (cur.open && !cur.minimized && !wasFloating) {
          return { ...prev, [id]: { ...cur, open: false, minimized: false } };
        }
        const next: Registry = { ...prev };
        if (FOUNDRY_DOCK_PANEL_IDS.includes(id)) {
          for (const dockId of FOUNDRY_DOCK_PANEL_IDS) {
            if (dockId === id) continue;
            if (floatPrev[dockId]) continue;
            const other = next[dockId] ?? defaultEntry(dockId, 10);
            next[dockId] = { ...other, open: false, minimized: false };
          }
        }
        const z = maxZ(prev) + 1;
        next[id] = { ...cur, open: true, minimized: false, z };
        return next;
      });
      return { ...floatPrev, [id]: false };
    });
  }, []);

  const toggle = openInDock;

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
    setFloating((floatPrev) => {
      setRegistry((prev) => {
        const cur = prev[id] ?? defaultEntry(id, 10);
        const z = maxZ(prev) + 1;
        if (floatPrev[id]) {
          const size = {
            width: cur.width ?? DEFAULT_LAYOUTS[id].width,
            height: cur.height ?? DEFAULT_LAYOUTS[id].height,
          };
          const pos = computePopupPosition(id, prev, floatPrev, size);
          return {
            ...prev,
            [id]: { ...cur, minimized: false, open: true, z, x: pos.x, y: pos.y },
          };
        }
        return { ...prev, [id]: { ...cur, minimized: false, open: true, z } };
      });
      return floatPrev;
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
      return Boolean(w?.open && !floating[id]);
    });
  }, [registry, floating]);

  return {
    get,
    patch,
    toggle,
    open,
    openAsPopup,
    openInDock,
    close,
    minimize,
    restore,
    focus,
    isActive,
    isFloating,
    isDockOpen,
    hydrated,
  };
}
