"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PlayerProfileCard } from "@/components/friends/PlayerProfileCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { RoomPresenceMember } from "@/hooks/useRoomPresence";
import { computeAvatarAnchorPlacement } from "@/lib/vtt/cursor-detail-placement";

const PANEL_HIDE_DELAY_MS = 500;

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

type ProfilePanelState = {
  member: RoomPresenceMember;
  placement: { left: number; top: number; flipLeft: boolean };
  pinned: boolean;
};

type FriendActionState = "idle" | "loading" | "friend" | "pending" | "error";

export function MesaOnlineMenu({ online, loading = false, selfUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<ProfilePanelState | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
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
    (member: RoomPresenceMember, anchorEl: HTMLElement, pinned = false) => {
      clearHideTimer();
      const placement = computeAvatarAnchorPlacement(anchorEl.getBoundingClientRect());
      setPanel({ member, placement, pinned });
    },
    [clearHideTimer]
  );

  const togglePin = useCallback(
    (member: RoomPresenceMember, anchorEl: HTMLElement) => {
      clearHideTimer();
      const placement = computeAvatarAnchorPlacement(anchorEl.getBoundingClientRect());
      setPanel((prev) => {
        if (prev?.member.userId === member.userId && prev.pinned) return null;
        return { member, placement, pinned: true };
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
    if (!open) closePanel();
  }, [open, closePanel]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  useEffect(() => {
    if (!panel || !open) return;
    const syncPlacement = () => {
      const btn = rootRef.current?.querySelector<HTMLElement>(
        `[data-online-member="${panel.member.userId}"]`
      );
      if (!btn) return;
      const placement = computeAvatarAnchorPlacement(btn.getBoundingClientRect());
      setPanel((prev) => (prev ? { ...prev, placement } : null));
    };
    syncPlacement();
    window.addEventListener("resize", syncPlacement);
    window.addEventListener("scroll", syncPlacement, true);
    return () => {
      window.removeEventListener("resize", syncPlacement);
      window.removeEventListener("scroll", syncPlacement, true);
    };
  }, [open, panel?.member.userId]);

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

  async function acceptFriendRequest(requestId: string) {
    const res = await fetch(`/api/friends/requests/${requestId}/accept`, {
      method: "POST",
      credentials: "same-origin",
    });
    if (res.ok) await loadSocial();
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

  const profilePortal =
    panel && typeof document !== "undefined"
      ? (() => {
          const { member, placement, pinned } = panel;
          const isSelf = member.userId === selfUserId;
          const friendState = memberFriendState(member.userId);
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
            </div>,
            document.body
          );
        })()
      : null;

  return (
    <div className="mesa-online-menu" ref={rootRef}>
      <button
        type="button"
        className={`mesa-online-menu__trigger${loading ? " mesa-online-menu__trigger--loading" : ""}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-busy={loading || undefined}
        title={loading ? "Carregando jogadores online…" : "Jogadores online na mesa"}
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
                      data-online-member={member.userId}
                      aria-expanded={isActive}
                      onMouseEnter={(e) => {
                        const pinned =
                          panel?.member.userId === member.userId && panel.pinned;
                        openPanel(member, e.currentTarget, pinned);
                      }}
                      onMouseLeave={() => {
                        if (panel?.pinned && panel.member.userId === member.userId) return;
                        scheduleHide();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(member, e.currentTarget);
                      }}
                      onFocus={(e) => {
                        openPanel(member, e.currentTarget, false);
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
        </div>
      ) : null}

      {profilePortal}
    </div>
  );
}
