"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { RoomPresenceMember } from "@/hooks/useRoomPresence";
import { computeCursorDetailPlacement } from "@/lib/vtt/cursor-detail-placement";

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
  return isGmMember(member) ? "Mestre" : "—";
}

function isGmMember(member: RoomPresenceMember): boolean {
  return member.role === "gm" || member.isOwner;
}

function roleLabel(member: RoomPresenceMember): string {
  return isGmMember(member) ? "Mestre" : "Jogador";
}

function sortMembers(members: RoomPresenceMember[]): RoomPresenceMember[] {
  return [...members].sort((a, b) => {
    const aGm = isGmMember(a);
    const bGm = isGmMember(b);
    if (aGm !== bGm) return aGm ? -1 : 1;
    return playerDisplayName(a).localeCompare(playerDisplayName(b), "pt-BR");
  });
}

function MemberAvatar({ member }: { member: RoomPresenceMember }) {
  const photo = memberPhotoUrl(member);
  const label = member.characterName ?? member.displayName;
  return (
    <UserAvatar
      url={photo}
      focus={member.avatarFocus}
      label={label}
      className="mesa-online-menu__avatar-wrap"
      imgClassName="mesa-online-menu__avatar-img"
    />
  );
}

type HoverState = {
  member: RoomPresenceMember;
  pointer: { x: number; y: number };
};

export function MesaOnlineMenu({ online, loading = false, selfUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<HoverState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => sortMembers(online), [online]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) setHover(null);
  }, [open]);

  const count = online.length;
  const label = loading && count === 0 ? "…" : String(count);

  const tooltip =
    hover && typeof document !== "undefined"
      ? (() => {
          const { member, pointer } = hover;
          const isSelf = member.userId === selfUserId;
          const placement = computeCursorDetailPlacement(pointer);
          return createPortal(
            <div
              className={`mesa-online-menu__hover-card glass-panel mesa-online-menu__hover-card--cursor${
                placement.flipLeft ? " mesa-online-menu__hover-card--cursor-left" : ""
              }`}
              style={{ left: placement.left, top: placement.top }}
              role="tooltip"
            >
              <div className="mesa-online-menu__hover-row">
                <span className="mesa-online-menu__hover-eyebrow">Papel</span>
                <strong
                  className={`mesa-online-menu__hover-role${
                    isGmMember(member) ? " mesa-online-menu__hover-role--gm" : ""
                  }`}
                >
                  {roleLabel(member)}
                  {isSelf ? <em className="mesa-online-menu__you"> · você</em> : null}
                </strong>
              </div>
              <div className="mesa-online-menu__hover-row">
                <span className="mesa-online-menu__hover-eyebrow">Nome da ficha</span>
                <strong className="mesa-online-menu__hover-sheet">{characterDisplayName(member)}</strong>
              </div>
              <div className="mesa-online-menu__hover-row">
                <span className="mesa-online-menu__hover-eyebrow">Nome do jogador</span>
                <span className="mesa-online-menu__hover-player">{playerDisplayName(member)}</span>
              </div>
            </div>,
            document.body
          );
        })()
      : null;

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
          {sorted.length === 0 ? (
            <p className="mesa-online-menu__empty">
              {loading ? "Carregando…" : "Ninguém online no momento."}
            </p>
          ) : (
            <ul className="mesa-online-menu__list">
              {sorted.map((member) => {
                const isSelf = member.userId === selfUserId;
                const isGm = isGmMember(member);
                const sheetName = characterDisplayName(member);
                const playerName = playerDisplayName(member);
                return (
                  <li
                    key={member.userId}
                    className={`mesa-online-menu__item${isSelf ? " mesa-online-menu__item--self" : ""}${
                      isGm ? " mesa-online-menu__item--gm" : ""
                    }`}
                    role="option"
                    aria-selected={isSelf}
                    aria-label={`${roleLabel(member)}, ${sheetName}, jogador ${playerName}${
                      isSelf ? ", você" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="mesa-online-menu__avatar-btn"
                      onMouseEnter={(e) =>
                        setHover({ member, pointer: { x: e.clientX, y: e.clientY } })
                      }
                      onMouseMove={(e) =>
                        setHover((prev) =>
                          prev?.member.userId === member.userId
                            ? { member, pointer: { x: e.clientX, y: e.clientY } }
                            : prev
                        )
                      }
                      onMouseLeave={() =>
                        setHover((prev) => (prev?.member.userId === member.userId ? null : prev))
                      }
                      onFocus={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHover({
                          member,
                          pointer: { x: rect.right, y: rect.top + rect.height / 2 },
                        });
                      }}
                      onBlur={() =>
                        setHover((prev) => (prev?.member.userId === member.userId ? null : prev))
                      }
                    >
                      <span className="mesa-online-menu__avatar">
                        <MemberAvatar member={member} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {tooltip}
    </div>
  );
}
