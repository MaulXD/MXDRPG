"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NotificationItem } from "@/lib/notifications/types";
import "./notifications.css";

const POLL_MS = 30_000;
const fetchOpts = { credentials: "same-origin" as const, cache: "no-store" as const };

type NotificationsContextValue = {
  ready: boolean;
  selfUserId: string | null;
  items: NotificationItem[];
  count: number;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications(): NotificationsContextValue | null {
  return useContext(NotificationsContext);
}

type ProviderProps = {
  children: ReactNode;
  initialUserId?: string | null;
};

export function NotificationsProvider({ children, initialUserId = null }: ProviderProps) {
  const [ready, setReady] = useState(initialUserId != null);
  const [selfUserId, setSelfUserId] = useState<string | null>(initialUserId);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!selfUserId) {
      setItems([]);
      setCount(0);
      return;
    }
    try {
      const res = await fetch("/api/notifications", fetchOpts);
      if (res.status === 401) {
        setSelfUserId(null);
        setItems([]);
        setCount(0);
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { items?: NotificationItem[]; count?: number };
      setItems(data.items ?? []);
      setCount(data.count ?? data.items?.length ?? 0);
    } catch {
      /* ignore */
    }
  }, [selfUserId]);

  useEffect(() => {
    if (initialUserId) {
      setSelfUserId(initialUserId);
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", fetchOpts);
        if (!res.ok) {
          if (!cancelled) setReady(true);
          return;
        }
        const data = (await res.json()) as { user?: { id: string } };
        if (!cancelled) {
          setSelfUserId(data.user?.id ?? null);
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialUserId]);

  useEffect(() => {
    if (!selfUserId) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [selfUserId, refresh]);

  const value = useMemo(
    () => ({ ready, selfUserId, items, count, refresh }),
    [ready, selfUserId, items, count, refresh]
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}
