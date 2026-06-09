"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 30_000;

export function FriendsNavBadge() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/invites", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { invites?: unknown[] };
      setCount(Array.isArray(data.invites) ? data.invites.length : 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <Link href="/eldarin#amigos" className="nav-link friends-nav-badge">
      Amigos
      {count > 0 ? (
        <span className="friends-nav-badge__count" aria-label={`${count} convites pendentes`}>
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
