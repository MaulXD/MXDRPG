"use client";

import { useCallback, useEffect, useState } from "react";
import type { InventoryItemRequest } from "@/lib/character/inventory-item-request";

const POLL_MS = 30_000;
const POLL_FAST_MS = 5_000;

export function usePlayerInventoryRequests(characterId: string | null, enabled = true) {
  const [requests, setRequests] = useState<InventoryItemRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!characterId || !enabled) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/characters/${characterId}/inventory-request`, {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { requests?: InventoryItemRequest[] };
      setRequests(data.requests ?? []);
    } finally {
      setLoading(false);
    }
  }, [characterId, enabled]);

  const hasPending = requests.length > 0;

  useEffect(() => {
    void refresh();
    if (!characterId || !enabled) return;
    const interval = hasPending ? POLL_FAST_MS : POLL_MS;
    const id = window.setInterval(() => void refresh(), interval);
    return () => window.clearInterval(id);
  }, [characterId, enabled, refresh, hasPending]);

  return { requests, loading, refresh, hasPending };
}

export type GmInventoryRequestRow = InventoryItemRequest & { characterName?: string };

export function useGmInventoryRequests(
  adventureId: string | null,
  roomId?: string | null,
  enabled = true
) {
  const [requests, setRequests] = useState<GmInventoryRequestRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!adventureId || !enabled) return;
    setLoading(true);
    try {
      const qs = roomId ? `?roomId=${encodeURIComponent(roomId)}` : "";
      const res = await fetch(`/api/adventures/${adventureId}/inventory-requests${qs}`, {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { requests?: GmInventoryRequestRow[] };
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

export type PlayerInventoryRequestRow = InventoryItemRequest & { characterName?: string };

export function usePlayerInventoryNotifications(adventureId: string | null, enabled = true) {
  const [requests, setRequests] = useState<PlayerInventoryRequestRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!adventureId || !enabled) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/adventures/${adventureId}/my-inventory-requests`, {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { requests?: PlayerInventoryRequestRow[] };
      setRequests(data.requests ?? []);
    } finally {
      setLoading(false);
    }
  }, [adventureId, enabled]);

  const hasPending = requests.some((r) => r.status === "pending");

  useEffect(() => {
    void refresh();
    if (!adventureId || !enabled) return;
    const interval = hasPending ? POLL_FAST_MS : POLL_MS;
    const id = window.setInterval(() => void refresh(), interval);
    return () => window.clearInterval(id);
  }, [adventureId, enabled, refresh, hasPending]);

  return {
    requests,
    loading,
    refresh,
    hasActive: requests.length > 0,
    hasPending,
  };
}
