"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PlayerProfileCard } from "@/components/friends/PlayerProfileCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { RoomPresenceMember } from "@/hooks/useRoomPresence";
import { computeCursorDetailPlacement } from "@/lib/vtt/cursor-detail-placement";

const PANEL_HIDE_DELAY_MS = 500;

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

type ProfilePanelState = {
  member: RoomPresenceMember;
  pointer: { x: number; y: number };
  pinned: boolean;
};

type FriendActionState = "idle" | "loading" | "friend" | "pending" | "error";

export function MesaOnlineMenu({ online, loading = false, selfUserId, adventureId }: Props) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<ProfilePanelState | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [incomingByUser, setIncomingByUser] = useState<Map<string, string>>(new Map());
  const [nickname, setNickname] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addOk, setAddOk] = useState("");
  const [memberActions, setMemberActions] = useState<Record<string, FriendActionState>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sorted = useMemo(() => sortMembers(online), [online]);
  const canSocialize = Boolean(selfUserId);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const closePanel = useCallback(() => {
    clearHideTimer();
    setPanel(null);
  }, [clearHideTimer]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setPanel((prev) => (prev?.pinned ? prev : null));
    }, PANEL_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  const openPanel = useCallback(
    (member: RoomPresenceMember, pointer: { x: number; y: number }, pinned = false) => {
      clearHideTimer();
      setPanel({ member, pointer, pinned });
    },
    [clearHideTimer]
  );

  const togglePin = useCallback(
    (member: RoomPresenceMember, pointer: { x: number; y: number }) => {
      clearHideTimer();
      setPanel((prev) => {
        if (prev?.member.userId === member.userId && prev.pinned) return null;
        return { member, pointer, pinned: true };
      });
    },
    [clearHideTimer]
  );

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
        incoming?: { id: string; fromUserId: string }[];
        outgoing?: { toUserId: string }[];
      };
      setPendingIds(new Set((data.outgoing ?? []).map((r) => r.toUserId)));
      const incoming = new Map<string, string>();
      for (const req of data.incoming ?? []) {
        incoming.set(req.fromUserId, req.id);
      }
      setIncomingByUser(incoming);
    }
  }, [canSocialize]);

  useEffect(() => {
    if (!open || !canSocialize) return;
    void loadSocial();
  }, [open, canSocialize, loadSocial]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      closePanel();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, closePanel]);

  useEffect(() => {
    if (!open) {
      closePanel();
      setAddError("");
      setAddOk("");
    }
  }, [open, closePanel]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

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
        setAddError(data.error ?? "Não foi possível enviar o pedido");
        throw new Error(data.error ?? "Erro");
      }
      if (data.kind === "friend") {
        setFriendIds((prev) => new Set(prev).add(targetUserId));
        setMemberActions((prev) => ({ ...prev, [targetUserId]: "friend" }));
        setAddOk("Amizade aceita!");
      } else {
        setPendingIds((prev) => new Set(prev).add(targetUserId));
        setMemberActions((prev) => ({ ...prev, [targetUserId]: "pending" }));
        setAddOk("Pedido de amizade enviado.");
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
    const res = await fetch(`/api/friends/requests/${requestId}/accept`, {
      method: "POST",
      credentials: "same-origin",
    });
    if (res.ok) {
      setAddOk("Amizade aceita!");
      await loadSocial();
    }
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
        setAddError(data.error ?? "Não foi possível convidar");
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

  function pointerFromAvatar(el: HTMLElement): { x: number; y: number } {
    const rect = el.getBoundingClientRect();
    return { x: rect.right, y: rect.top + rect.height / 2 };
  }

  const count = online.length;
  const label = loading && count === 0 ? "…" : String(count);

  const profilePortal =
    panel && typeof document !== "undefined"
      ? (() => {
          const { member, pointer, pinned } = panel;
          const isSelf = member.userId === selfUserId;
          const friendState = memberFriendState(member.userId);
          const incomingRequestId = incomingByUser.get(member.userId);
          const placement = computeCursorDetailPlacement(pointer);
          return createPortal(
            <div
              ref={panelRef}
              className={`mesa-online-menu__hover-card glass-panel mesa-online-menu__hover-card--cursor mesa-online-menu__hover-card--interactive${
                pinned ? " mesa-online-menu__hover-card--pinned" : ""
              }${placement.flipLeft ? " mesa-online-menu__hover-card--cursor-left" : ""}`}
              style={{ left: placement.left, top: placement.top }}
              role="dialog"
              aria-label={`Perfil de ${playerDisplayName(member)}`}
              onMouseEnter={clearHideTimer}
              onMouseLeave={() => {
                if (!pinned) scheduleHide();
              }}
            >
              {pinned ? (
                <button
                  type="button"
                  className="mesa-online-menu__panel-close"
                  aria-label="Fechar perfil"
                  onClick={closePanel}
                >
                  ✕
                </button>
              ) : null}
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
                  key={`${member.userId}-${friendState}`}
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
              {canSocialize && !isSelf ? (
                <div className="mesa-online-menu__hover-actions">
                  {friendState === "idle" ? (
                    <button
                      type="button"
                      className="vtt-btn vtt-btn--ghost vtt-btn--compact mesa-online-menu__hover-btn mesa-online-menu__hover-btn--accent"
                      onClick={() => void addFriendByUserId(member.userId)}
                    >
                      Adicionar amigo
                    </button>
                  ) : null}
                  {incomingRequestId ? (
                    <button
                      type="button"
                      className="vtt-btn vtt-btn--ghost vtt-btn--compact mesa-online-menu__hover-btn mesa-online-menu__hover-btn--accent"
                      onClick={() => void acceptFriendRequest(incomingRequestId)}
                    >
                      Aceitar pedido de amizade
                    </button>
                  ) : null}
                  {friendState === "pending" ? (
                    <span className="mesa-online-menu__hover-status">Pedido enviado — aguardando resposta</span>
                  ) : null}
                  {adventureId && friendState !== "loading" ? (
                    <button
                      type="button"
                      className="vtt-btn vtt-btn--ghost vtt-btn--compact mesa-online-menu__hover-btn"
                      onClick={() => void inviteToMesa(member.userId)}
                    >
                      Convidar à mesa
                    </button>
                  ) : null}
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
                const isActive = panel?.member.userId === member.userId;
                const sheetName = characterDisplayName(member);
                const playerName = playerDisplayName(member);
                return (
                  <li
                    key={member.userId}
                    className={`mesa-online-menu__item${isSelf ? " mesa-online-menu__item--self" : ""}${
                      isGm ? " mesa-online-menu__item--gm" : ""
                    }${isActive ? " mesa-online-menu__item--active" : ""}`}
                    role="option"
                    aria-selected={isSelf || isActive}
                    aria-label={`${roleLabel(member)}, ${sheetName}, jogador ${playerName}${
                      isSelf ? ", você" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="mesa-online-menu__avatar-btn"
                      aria-expanded={isActive}
                      onMouseEnter={(e) => {
                        const pinned =
                          panel?.member.userId === member.userId && panel.pinned;
                        openPanel(member, { x: e.clientX, y: e.clientY }, pinned);
                      }}
                      onMouseMove={(e) => {
                        if (panel?.pinned && panel.member.userId !== member.userId) return;
                        openPanel(
                          member,
                          { x: e.clientX, y: e.clientY },
                          panel?.member.userId === member.userId && panel.pinned
                        );
                      }}
                      onMouseLeave={() => {
                        if (panel?.pinned && panel.member.userId === member.userId) return;
                        scheduleHide();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(member, pointerFromAvatar(e.currentTarget));
                      }}
                      onFocus={(e) => {
                        openPanel(member, pointerFromAvatar(e.currentTarget), false);
                      }}
                      onBlur={() => {
                        if (!panel?.pinned) scheduleHide();
                      }}
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

      {profilePortal}
    </div>
  );
}
