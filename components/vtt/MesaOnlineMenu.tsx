"use client";

import { useEffect, useRef, useState } from "react";
import type { RoomPresenceMember } from "@/hooks/useRoomPresence";

type Props = {
  online: RoomPresenceMember[];
  loading?: boolean;
  selfUserId?: string | null;
};

function memberPhotoUrl(member: RoomPresenceMember): string | null {
  return member.characterPortraitUrl ?? member.avatarUrl ?? null;
}

function memberLabel(member: RoomPresenceMember): string {
  const user = member.displayName.trim() || "Jogador";
  const character = member.characterName?.trim();
  if (character) return `${character} (${user})`;
  return user;
}

function MemberAvatar({ member }: { member: RoomPresenceMember }) {
  const photo = memberPhotoUrl(member);
  const initial = (member.characterName ?? member.displayName).slice(0, 1).toUpperCase() || "?";
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt="" className="mesa-online-menu__avatar-img" />
    );
  }
  return <span className="mesa-online-menu__avatar-fallback">{initial}</span>;
}

export function MesaOnlineMenu({ online, loading = false, selfUserId }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const count = online.length;
  const label = loading && count === 0 ? "…" : String(count);

  return (
    <div className="mesa-online-menu" ref={rootRef}>
      <button
        type="button"
        className="mesa-online-menu__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mesa-online-menu__dot" aria-hidden />
        <span className="mesa-online-menu__trigger-label">Online</span>
        <span className="mesa-online-menu__count">{label}</span>
      </button>

      {open ? (
        <div className="mesa-online-menu__panel glass-panel" role="listbox" aria-label="Jogadores online">
          <p className="mesa-online-menu__title">Na mesa agora</p>
          {online.length === 0 ? (
            <p className="mesa-online-menu__empty">
              {loading ? "Carregando…" : "Ninguém online no momento."}
            </p>
          ) : (
            <ul className="mesa-online-menu__list">
              {online.map((member) => (
                <li
                  key={member.userId}
                  className={`mesa-online-menu__item${member.userId === selfUserId ? " mesa-online-menu__item--self" : ""}`}
                  role="option"
                  aria-selected={member.userId === selfUserId}
                >
                  <span className="mesa-online-menu__avatar">
                    <MemberAvatar member={member} />
                  </span>
                  <span className="mesa-online-menu__meta">
                    <span className="mesa-online-menu__name-row">
                      <strong className="mesa-online-menu__name" title={memberLabel(member)}>
                        {memberLabel(member)}
                      </strong>
                      {member.userId === selfUserId ? (
                        <span className="mesa-online-menu__you">você</span>
                      ) : null}
                      <span
                        className={`mesa-online-menu__role mesa-online-menu__role--${member.role}`}
                      >
                        {member.role === "gm" ? "Mestre" : "Jogador"}
                      </span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
