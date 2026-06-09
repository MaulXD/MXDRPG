"use client";

import { useEffect, useRef, useState } from "react";
import type { RoomPresenceMember } from "@/hooks/useRoomPresence";

type Props = {
  online: RoomPresenceMember[];
  loading?: boolean;
  selfUserId?: string | null;
};

function memberPhotoUrl(member: RoomPresenceMember): string | null {
  return member.avatarUrl ?? member.characterPortraitUrl ?? null;
}

function playerDisplayName(member: RoomPresenceMember): string {
  return member.displayName.trim() || "Jogador";
}

function characterDisplayName(member: RoomPresenceMember): string {
  const name = member.characterName?.trim();
  if (name) return name;
  return member.role === "gm" ? "Mestre" : "—";
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
              {online.map((member) => {
                const isSelf = member.userId === selfUserId;
                const sheetName = characterDisplayName(member);
                const playerName = playerDisplayName(member);
                return (
                  <li
                    key={member.userId}
                    className={`mesa-online-menu__item${isSelf ? " mesa-online-menu__item--self" : ""}`}
                    role="option"
                    aria-selected={isSelf}
                    aria-label={`${sheetName}, jogador ${playerName}${isSelf ? ", você" : ""}`}
                  >
                    <div className="mesa-online-menu__avatar-wrap">
                      <span className="mesa-online-menu__avatar">
                        <MemberAvatar member={member} />
                      </span>
                      <div className="mesa-online-menu__hover-card glass-panel" role="tooltip">
                        <div className="mesa-online-menu__hover-row">
                          <span className="mesa-online-menu__hover-eyebrow">Nome da ficha</span>
                          <strong className="mesa-online-menu__hover-sheet">{sheetName}</strong>
                        </div>
                        <div className="mesa-online-menu__hover-row">
                          <span className="mesa-online-menu__hover-eyebrow">Nome do jogador</span>
                          <span className="mesa-online-menu__hover-player">
                            {playerName}
                            {isSelf ? <em className="mesa-online-menu__you"> você</em> : null}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
