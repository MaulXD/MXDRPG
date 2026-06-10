"use client";

import { useCallback, useEffect, useState } from "react";
import type { SheetEditRequest } from "@/lib/character/sheet-edit-request";

const POLL_MS = 30_000;

export function useSheetEditRequest(characterId: string | null, enabled = true) {
  const [request, setRequest] = useState<SheetEditRequest | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!characterId || !enabled) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/characters/${characterId}/edit-request`, {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { request?: SheetEditRequest | null };
      setRequest(data.request ?? null);
    } finally {
      setLoading(false);
    }
  }, [characterId, enabled]);

  useEffect(() => {
    void refresh();
    if (!characterId || !enabled) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [characterId, enabled, refresh]);

  return { request, loading, refresh };
}

export function useGmEditRequests(adventureId: string | null, roomId?: string | null, enabled = true) {
  const [requests, setRequests] = useState<
    (SheetEditRequest & { characterName?: string })[]
  >([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!adventureId || !enabled) return;
    setLoading(true);
    try {
      const qs = roomId ? `?roomId=${encodeURIComponent(roomId)}` : "";
      const res = await fetch(`/api/adventures/${adventureId}/edit-requests${qs}`, {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        requests?: (SheetEditRequest & { characterName?: string })[];
      };
      setRequests(data.requests ?? []);
    } finally {
      setLoading(false);
    }
  }, [adventureId, roomId, enabled]);

  useEffect(() => {
    void refresh();
    if (!adventureId || !enabled) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [adventureId, roomId, enabled, refresh]);

  return { requests, loading, refresh, hasPending: requests.length > 0 };
}

export type PlayerEditRequestRow = SheetEditRequest & { characterName?: string };

export function usePlayerEditRequests(adventureId: string | null, enabled = true) {
  const [requests, setRequests] = useState<PlayerEditRequestRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!adventureId || !enabled) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/adventures/${adventureId}/my-edit-requests`, {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { requests?: PlayerEditRequestRow[] };
      setRequests(data.requests ?? []);
    } finally {
      setLoading(false);
    }
  }, [adventureId, enabled]);

  useEffect(() => {
    void refresh();
    if (!adventureId || !enabled) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [adventureId, enabled, refresh]);

  return {
    requests,
    loading,
    refresh,
    hasActive: requests.length > 0,
  };
}
