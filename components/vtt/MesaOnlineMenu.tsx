"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PlayerProfileCard } from "@/components/friends/PlayerProfileCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { RoomPresenceMember } from "@/hooks/useRoomPresence";
import { computeCursorDetailPlacement } from "@/lib/vtt/cursor-detail-placement";

type Props = {
  online: RoomPresenceMember[];
  loading?: boolean;
  selfUserId?: string | null;
  adventureId?: string | null;
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

type FriendActionState = "idle" | "loading" | "friend" | "pending" | "error";

export function MesaOnlineMenu({ online, loading = false, selfUserId, adventureId }: Props) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [nickname, setNickname] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addOk, setAddOk] = useState("");
  const [memberActions, setMemberActions] = useState<Record<string, FriendActionState>>({});
  const rootRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => sortMembers(online), [online]);
  const canSocialize = Boolean(selfUserId);

  const loadSocial = useCallback(async () => {
    if (!canSocialize) return;
    const [fRes, rRes] = await Promise.all([
      fetch("/api/friends", { cache: "no-store", credentials: "same-origin" }),
      fetch("/api/friends/requests", { cache: "no-store", credentials: "same-origin" }),
    ]);
    if (fRes.ok) {
      const data = (await fRes.json()) as { friends?: { id: string }[] };
      setFriendIds(new Set((data.friends ?? []).map((f) => f.id)));
    }
    if (rRes.ok) {
      const data = (await rRes.json()) as {
        outgoing?: { toUserId: string }[];
      };
      setPendingIds(new Set((data.outgoing ?? []).map((r) => r.toUserId)));
    }
  }, [canSocialize]);

  useEffect(() => {
    if (!open || !canSocialize) return;
    void loadSocial();
  }, [open, canSocialize, loadSocial]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setHover(null);
      setAddError("");
      setAddOk("");
    }
  }, [open]);

  async function addFriendByUserId(targetUserId: string) {
    if (!canSocialize || targetUserId === selfUserId) return;
    setMemberActions((prev) => ({ ...prev, [targetUserId]: "loading" }));
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; kind?: string };
      if (!res.ok) {
        setMemberActions((prev) => ({ ...prev, [targetUserId]: "error" }));
        throw new Error(data.error ?? "Erro");
      }
      if (data.kind === "friend") {
        setFriendIds((prev) => new Set(prev).add(targetUserId));
        setMemberActions((prev) => ({ ...prev, [targetUserId]: "friend" }));
      } else {
        setPendingIds((prev) => new Set(prev).add(targetUserId));
        setMemberActions((prev) => ({ ...prev, [targetUserId]: "pending" }));
      }
      await loadSocial();
    } catch (e) {
      setMemberActions((prev) => ({ ...prev, [targetUserId]: "error" }));
      throw e;
    }
  }

  async function addFriendByNickname(e: React.FormEvent) {
    e.preventDefault();
    const nick = nickname.trim();
    if (!nick || !canSocialize) return;
    setAddLoading(true);
    setAddError("");
    setAddOk("");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nick }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; kind?: string };
      if (!res.ok) {
        setAddError(data.error ?? "Não foi possível enviar o pedido");
        return;
      }
      setNickname("");
      setAddOk(data.kind === "friend" ? "Amizade aceita!" : "Pedido de amizade enviado.");
      await loadSocial();
    } catch {
      setAddError("Falha de conexão.");
    } finally {
      setAddLoading(false);
    }
  }

  async function acceptFriendRequest(requestId: string) {
    await fetch(`/api/friends/requests/${requestId}/accept`, {
      method: "POST",
      credentials: "same-origin",
    });
    await loadSocial();
  }

  async function inviteToMesa(targetUserId: string) {
    if (!adventureId || !canSocialize) return;
    setMemberActions((prev) => ({ ...prev, [targetUserId]: "loading" }));
    try {
      const res = await fetch("/api/friends/invite", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, adventureId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMemberActions((prev) => ({ ...prev, [targetUserId]: "error" }));
        return;
      }
      setMemberActions((prev) => ({ ...prev, [targetUserId]: "idle" }));
      setAddOk(`Convite enviado para ${playerDisplayName(online.find((m) => m.userId === targetUserId)!)}.`);
    } catch {
      setMemberActions((prev) => ({ ...prev, [targetUserId]: "error" }));
    }
  }

  function memberFriendState(userId: string): FriendActionState {
    if (memberActions[userId] === "loading") return "loading";
    if (memberActions[userId] === "error") return "error";
    if (friendIds.has(userId) || memberActions[userId] === "friend") return "friend";
    if (pendingIds.has(userId) || memberActions[userId] === "pending") return "pending";
    return "idle";
  }

  const count = online.length;
  const label = loading && count === 0 ? "…" : String(count);

  const tooltip =
    hover && typeof document !== "undefined"
      ? (() => {
          const { member, pointer } = hover;
          const isSelf = member.userId === selfUserId;
          const friendState = memberFriendState(member.userId);
          const placement = computeCursorDetailPlacement(pointer);
          return createPortal(
            <div
              className={`mesa-online-menu__hover-card glass-panel mesa-online-menu__hover-card--cursor mesa-online-menu__hover-card--interactive${
                placement.flipLeft ? " mesa-online-menu__hover-card--cursor-left" : ""
              }`}
              style={{ left: placement.left, top: placement.top }}
              role="tooltip"
              onMouseEnter={() => setHover(hover)}
              onMouseLeave={() => setHover(null)}
            >
              {isSelf ? (
                <>
                  <div className="mesa-online-menu__hover-row">
                    <span className="mesa-online-menu__hover-eyebrow">Papel</span>
                    <strong className="mesa-online-menu__hover-role">
                      {roleLabel(member)}
                      <em className="mesa-online-menu__you"> · você</em>
                    </strong>
                  </div>
                  <div className="mesa-online-menu__hover-row">
                    <span className="mesa-online-menu__hover-eyebrow">Ficha</span>
                    <strong className="mesa-online-menu__hover-sheet">{characterDisplayName(member)}</strong>
                  </div>
                </>
              ) : canSocialize ? (
                <PlayerProfileCard
                  userId={member.userId}
                  selfUserId={selfUserId ?? undefined}
                  compact
                  contextRole={roleLabel(member)}
                  contextSheet={characterDisplayName(member)}
                  onAddFriend={addFriendByUserId}
                  onAcceptRequest={acceptFriendRequest}
                  onMessage={() => {
                    window.location.href = `/amigos?com=${encodeURIComponent(member.userId)}`;
                  }}
                  className="mesa-online-menu__profile-card"
                />
              ) : (
                <>
                  <div className="mesa-online-menu__hover-row">
                    <span className="mesa-online-menu__hover-eyebrow">Jogador</span>
                    <span className="mesa-online-menu__hover-player">{playerDisplayName(member)}</span>
                  </div>
                  <div className="mesa-online-menu__hover-row">
                    <span className="mesa-online-menu__hover-eyebrow">Ficha</span>
                    <strong className="mesa-online-menu__hover-sheet">{characterDisplayName(member)}</strong>
                  </div>
                </>
              )}
              {canSocialize && !isSelf && adventureId && friendState !== "loading" ? (
                <div className="mesa-online-menu__hover-actions">
                  <button
                    type="button"
                    className="vtt-btn vtt-btn--ghost vtt-btn--compact mesa-online-menu__hover-btn"
                    onClick={() => void inviteToMesa(member.userId)}
                  >
                    Convidar à mesa
                  </button>
                  {friendState === "friend" ? (
                    <Link
                      href={`/amigos?com=${encodeURIComponent(member.userId)}`}
                      className="vtt-btn vtt-btn--ghost vtt-btn--compact mesa-online-menu__hover-btn"
                    >
                      Abrir mensagens
                    </Link>
                  ) : null}
                </div>
              ) : null}
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

          {canSocialize ? (
            <form className="mesa-online-menu__add" onSubmit={(e) => void addFriendByNickname(e)}>
              <p className="mesa-online-menu__add-label">Adicionar jogador</p>
              <div className="mesa-online-menu__add-row">
                <input
                  className="input mesa-online-menu__add-input"
                  placeholder="Apelido @usuario"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={addLoading}
                  aria-label="Apelido do jogador"
                />
                <button
                  type="submit"
                  className="vtt-btn vtt-btn--ghost vtt-btn--compact"
                  disabled={addLoading || !nickname.trim()}
                >
                  {addLoading ? "…" : "Adicionar"}
                </button>
              </div>
              {addError ? <p className="mesa-online-menu__add-msg mesa-online-menu__add-msg--err">{addError}</p> : null}
              {addOk ? <p className="mesa-online-menu__add-msg mesa-online-menu__add-msg--ok">{addOk}</p> : null}
            </form>
          ) : null}
        </div>
      ) : null}

      {tooltip}
    </div>
  );
}
