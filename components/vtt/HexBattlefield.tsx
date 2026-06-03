"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import {
  axialDistance,
  axialToPixel,
  hexCorners,
  hexesInRange,
  pixelToAxial,
} from "@/lib/vtt/hex-math";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import { moveRoomTokenBudget, postRoomAttack, postRoomAbility, postRoomAreaSpell, useRoomSync } from "@/hooks/useRoomSync";
import { readThemeColor } from "@/lib/theme";
import { TurnOrderPanel } from "@/components/vtt/TurnOrderPanel";
import { TokenActionPanel } from "@/components/vtt/TokenActionPanel";
import { MonsterSpawnPanel } from "@/components/vtt/MonsterSpawnPanel";
import { TokenConditionsPanel } from "@/components/vtt/TokenConditionsPanel";
import {
  CombatFxLayer,
  combatFxFromMessage,
  type CombatFxState,
  type TokenCombatFlash,
} from "@/components/vtt/CombatFxLayer";
import type { ChatMessage } from "@/lib/room/chat";
import { activeTokenId } from "@/lib/room/combat";
import {
  canAttackTarget,
  listTokenCombatActions,
  resolveCombatAction,
} from "@/lib/combat/attack";
import { canAbilityTarget } from "@/lib/combat/ability";
import { canCastAreaAt, computeSpellAreaHexes } from "@/lib/combat/area-spell";
import type { CombatActionOption } from "@/lib/combat/types";
import {
  canMoveToken,
  hexToMeters,
  reachableHexes,
  walkRemaining,
} from "@/lib/vtt/movement";
import {
  isMoveMode,
  isTargetMode,
  type TokenActionMode,
} from "@/lib/vtt/action-mode";
import { useCombatTurn } from "@/hooks/useCombatActions";
import { collectPlayerActorIds, resolveTokenRing } from "@/lib/vtt/token-colors";
import { drawCircularTokenImage, drawTokenIdentityRings } from "@/lib/vtt/token-canvas";
import { DEFAULT_PORTRAIT_FOCUS, type PortraitFocus } from "@/lib/media/portrait-focus";
import "./vtt.css";

type Props = {
  scene: BattleScene;
  canEdit: boolean;
  canControlCombat?: boolean;
  roomId?: string;
  onOpenSheet?: (actorId: string) => void;
  onOpenCompendium?: () => void;
};

export function HexBattlefield({
  scene: initial,
  canEdit,
  canControlCombat = false,
  roomId = "demo",
  onOpenSheet,
  onOpenCompendium,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [, setImgTick] = useState(0);
  const [scene, setScene] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial.tokens[0]?.id ?? null);
  const [actionMode, setActionMode] = useState<TokenActionMode>("idle");
  const [selectedCombatAction, setSelectedCombatAction] = useState<CombatActionOption | null>(null);
  const [hoverAxial, setHoverAxial] = useState<Axial | null>(null);
  const [themeTick, setThemeTick] = useState(0);
  const [combatFx, setCombatFx] = useState<CombatFxState | null>(null);
  const [tokenFlash, setTokenFlash] = useState<{
    tokenId: string;
    kind: NonNullable<TokenCombatFlash>;
  } | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const seenCombatRef = useRef<Set<string>>(new Set());
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onTheme = () => setThemeTick((n) => n + 1);
    window.addEventListener("eldarin-theme-change", onTheme);
    return () => window.removeEventListener("eldarin-theme-change", onTheme);
  }, []);

  const { snapshot, refresh } = useRoomSync(roomId);
  const turnActiveId = snapshot?.combat ? activeTokenId(snapshot.combat) : null;
  const turn = useCombatTurn({ combat: snapshot?.combat, canBypassTurn: canControlCombat });

  const selected = scene.tokens.find((t) => t.id === selectedId) ?? null;
  const selectedActor =
    selected?.linked && selected.actorId ? snapshot?.actors[selected.actorId] ?? null : null;

  const activeCombatAction = useMemo(() => {
    if (selectedCombatAction) return selectedCombatAction;
    if (selectedActor) return resolveCombatAction(selectedActor);
    if (selected) return listTokenCombatActions(selected, null)[0] ?? null;
    return null;
  }, [selectedCombatAction, selectedActor, selected]);

  const playerActorIds = useMemo(
    () => collectPlayerActorIds(scene.tokens),
    [scene.tokens]
  );

  const focusByTokenId = useMemo(() => {
    const map = new Map<string, PortraitFocus>();
    for (const token of scene.tokens) {
      if (token.imageFocus) {
        map.set(token.id, token.imageFocus);
        continue;
      }
      if (token.actorId && snapshot?.actors[token.actorId]) {
        const actor = snapshot.actors[token.actorId];
        map.set(
          token.id,
          actor.portraitFocus ?? DEFAULT_PORTRAIT_FOCUS
        );
      }
    }
    return map;
  }, [scene.tokens, snapshot?.actors]);

  const moveMode = actionMode === "move-run" ? "run" : "walk";
  const showMovement = Boolean(selected && isMoveMode(actionMode));
  const isAreaSpellMode = Boolean(
    selected &&
      actionMode === "spell" &&
      activeCombatAction?.areaShape &&
      activeCombatAction.areaShape !== "single"
  );

  const attackableIds = useMemo(() => {
    if (!selected || !activeCombatAction || !isTargetMode(actionMode)) return new Set<string>();
    if (activeCombatAction.selfTarget) return new Set<string>();
    const ids = new Set<string>();
    for (const t of scene.tokens) {
      if (t.id === selected.id) continue;
      const check =
        activeCombatAction.kind === "ability"
          ? canAbilityTarget(selected, t, activeCombatAction, {
              activeTokenId: turn.activeTokenId,
              bypassTurn: turn.bypassTurn,
            })
          : canAttackTarget(selected, t, activeCombatAction, {
              activeTokenId: turn.activeTokenId,
              bypassTurn: turn.bypassTurn,
            });
      if (check.ok) ids.add(t.id);
    }
    return ids;
  }, [selected, scene.tokens, activeCombatAction, actionMode, turn]);

  useEffect(() => {
    if (!snapshot?.chat) return;
    for (const msg of snapshot.chat) {
      if (msg.kind !== "combat" || !msg.combat || seenCombatRef.current.has(msg.id)) continue;
      seenCombatRef.current.add(msg.id);
      const defender = snapshot.scene.tokens.find((t) => t.id === msg.combat!.defenderTokenId);
      const attacker = snapshot.scene.tokens.find((t) => t.id === msg.combat!.attackerTokenId);
      if (!defender || !attacker) continue;
      const fx = combatFxFromMessage(msg, attacker.axial, defender.axial);
      if (fx) setCombatFx(fx);
    }
  }, [snapshot?.chat, snapshot?.scene.tokens]);

  useEffect(() => {
    if (!snapshot) return;
    setScene(snapshot.scene);
  }, [snapshot]);

  useEffect(() => {
    setActionMode("idle");
    setSelectedCombatAction(null);
    setActionErr(null);
  }, [selectedId]);

  function triggerCombatFx(msg: ChatMessage) {
    if (msg.kind !== "combat" || !msg.combat) return;
    seenCombatRef.current.add(msg.id);
    const defender = scene.tokens.find((t) => t.id === msg.combat!.defenderTokenId);
    const attacker = scene.tokens.find((t) => t.id === msg.combat!.attackerTokenId);
    if (!defender || !attacker) return;
    const fx = combatFxFromMessage(msg, attacker.axial, defender.axial);
    if (fx) setCombatFx(fx);
  }

  async function castAreaSpell(center: Axial) {
    if (!selected || !activeCombatAction?.areaShape) return;
    setActionErr(null);
    try {
      const snap = await postRoomAreaSpell(roomId, selected.id, center.q, center.r, {
        actionEntryId: activeCombatAction.entryId,
        bypassTurn: turn.bypassTurn,
      });
      const combatMsgs = snap.chat.filter((m) => m.kind === "combat");
      const last = combatMsgs[combatMsgs.length - 1];
      if (last?.kind === "combat") triggerCombatFx(last);
      setActionMode("idle");
      refresh();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Falha na magia de área");
    }
  }

  async function attackToken(defenderId: string) {
    if (!selected || !activeCombatAction) return;
    setActionErr(null);
    try {
      let snap;
      if (activeCombatAction.kind === "ability") {
        snap = await postRoomAbility(roomId, selected.id, defenderId, {
          actionEntryId: activeCombatAction.entryId,
          bypassTurn: turn.bypassTurn,
        });
      } else {
        const packId =
          activeCombatAction.packId === "armas" || activeCombatAction.packId === "magias"
            ? activeCombatAction.packId
            : undefined;
        snap = await postRoomAttack(roomId, selected.id, defenderId, {
          actionPack: packId,
          actionEntryId: packId ? activeCombatAction.entryId : undefined,
          bypassTurn: turn.bypassTurn,
        });
      }
      const combatMsgs = snap.chat.filter((m) => m.kind === "combat");
      const last = combatMsgs[combatMsgs.length - 1];
      if (last?.kind === "combat") triggerCombatFx(last);
      setActionMode("idle");
      refresh();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Falha no ataque");
    }
  }

  async function moveSelectedTo(axial: Axial) {
    if (!selected || !isMoveMode(actionMode)) return;
    setActionErr(null);
    try {
      await moveRoomTokenBudget(roomId, selected.id, axial.q, axial.r, moveMode, turn.bypassTurn);
      refresh();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Movimento inválido");
    }
  }

  useEffect(() => {
    const map = imagesRef.current;
    for (const token of scene.tokens) {
      if (!token.imageUrl) {
        map.delete(token.id);
        continue;
      }
      const cached = map.get(token.id);
      if (cached?.src === token.imageUrl) continue;
      const img = new Image();
      img.onload = () => setImgTick((n) => n + 1);
      img.src = token.imageUrl;
      map.set(token.id, img);
    }
  }, [scene.tokens]);

  const gridCells = useMemo(() => {
    const cells: Axial[] = [];
    const R = scene.gridRadius;
    for (let q = -R; q <= R; q++) {
      for (let r = Math.max(-R, -q - R); r <= Math.min(R, -q + R); r++) {
        cells.push({ q, r });
      }
    }
    return cells;
  }, [scene.gridRadius]);

  const rangeSet = useMemo(() => {
    if (!selected || !showMovement) return new Set<string>();
    const max = reachableHexes(selected, moveMode);
    return new Set(hexesInRange(selected.axial, max).map((c) => `${c.q},${c.r}`));
  }, [selected, showMovement, moveMode]);

  const walkSet = useMemo(() => {
    if (!selected || !showMovement) return new Set<string>();
    const max = walkRemaining(selected);
    return new Set(hexesInRange(selected.axial, max).map((c) => `${c.q},${c.r}`));
  }, [selected, showMovement]);

  const attackRangeSet = useMemo(() => {
    if (!selected || !activeCombatAction || !isTargetMode(actionMode)) return new Set<string>();
    if (isAreaSpellMode) {
      return new Set(
        hexesInRange(selected.axial, activeCombatAction.rangeHex)
          .map((c) => `${c.q},${c.r}`)
      );
    }
    return new Set(
      hexesInRange(selected.axial, activeCombatAction.rangeHex)
        .filter((c) => axialDistance(selected.axial, c) > 0)
        .map((c) => `${c.q},${c.r}`)
    );
  }, [selected, activeCombatAction, actionMode, isAreaSpellMode]);

  const areaPreviewSet = useMemo(() => {
    if (!selected || !activeCombatAction || !isAreaSpellMode || !hoverAxial) return new Set<string>();
    const check = canCastAreaAt(selected, hoverAxial, activeCombatAction, {
      activeTokenId: turn.activeTokenId,
      bypassTurn: turn.bypassTurn,
    });
    if (!check.ok) return new Set<string>();
    const hexes = computeSpellAreaHexes(
      hoverAxial,
      activeCombatAction.areaShape ?? "burst",
      activeCombatAction.areaRadiusHex ?? 1,
      activeCombatAction.areaHexCount
    );
    return new Set(hexes.map((c) => `${c.q},${c.r}`));
  }, [selected, activeCombatAction, isAreaSpellMode, hoverAxial, turn]);

  const hoverMovePreview = useMemo(() => {
    if (!selected || !hoverAxial || !showMovement) return null;
    return canMoveToken(selected, hoverAxial, moveMode);
  }, [selected, hoverAxial, showMovement, moveMode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    if (w < 10 || h < 10) {
      w = wrapRef.current?.clientWidth ?? 800;
      h = wrapRef.current?.clientHeight ?? 640;
    }
    if (w < 10 || h < 10) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, readThemeColor("--vtt-canvas-bg-0", "#1a1610"));
    bg.addColorStop(1, readThemeColor("--vtt-canvas-bg-1", "#0f0d0a"));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const ox = w / 2;
    const oy = h / 2;
    const size = scene.hexSize;

    for (const cell of gridCells) {
      const { x, y } = axialToPixel(cell.q, cell.r, size, ox, oy);
      const key = `${cell.q},${cell.r}`;
      let fill = readThemeColor("--vtt-hex-fill", "rgba(180,155,110,0.07)");
      let stroke = readThemeColor("--vtt-hex-stroke", "rgba(180,155,110,0.28)");

      if (showMovement && walkSet.has(key)) {
        fill = readThemeColor("--vtt-hex-walk-fill", "rgba(90,115,82,0.28)");
        stroke = readThemeColor("--vtt-hex-walk-stroke", "rgba(120,150,95,0.75)");
      }
      if (showMovement && rangeSet.has(key) && !walkSet.has(key)) {
        fill = readThemeColor("--vtt-hex-run-fill", "rgba(184,134,11,0.22)");
        stroke = readThemeColor("--vtt-hex-run-stroke", "rgba(201,169,98,0.65)");
      }
      if (isTargetMode(actionMode) && attackRangeSet.has(key)) {
        fill = readThemeColor("--vtt-hex-attack-fill", "rgba(139,69,19,0.2)");
        stroke = readThemeColor("--vtt-hex-attack-stroke", "rgba(180,80,60,0.7)");
      }
      if (isAreaSpellMode && areaPreviewSet.has(key)) {
        fill = readThemeColor("--vtt-hex-area-fill", "rgba(120,60,180,0.35)");
        stroke = readThemeColor("--vtt-hex-area-stroke", "rgba(180,120,255,0.85)");
      }
      if (isAreaSpellMode && hoverAxial?.q === cell.q && hoverAxial?.r === cell.r && areaPreviewSet.has(key)) {
        fill = readThemeColor("--vtt-hex-area-center-fill", "rgba(200,100,255,0.45)");
        stroke = readThemeColor("--vtt-hex-area-center-stroke", "#e8c4ff");
        ctx.lineWidth = 2.5;
      }
      if (hoverAxial?.q === cell.q && hoverAxial?.r === cell.r) {
        stroke = readThemeColor("--vtt-hex-hover-stroke", "#c9a962");
        fill = readThemeColor("--vtt-hex-hover-fill", "rgba(201,169,98,0.18)");
      }

      ctx.beginPath();
      const corners = hexCorners(x, y, size - 2);
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (
        hoverMovePreview?.ok &&
        hoverAxial?.q === cell.q &&
        hoverAxial?.r === cell.r &&
        hoverMovePreview.dist > 0
      ) {
        ctx.fillStyle = readThemeColor("--vtt-token-text", "#e8e0d4");
        ctx.font = "600 10px Lora, Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `${hoverMovePreview.dist} hex · ${hexToMeters(hoverMovePreview.dist)} m`,
          x,
          y + 4
        );
      }
    }

    for (const token of scene.tokens) {
      const { x, y } = axialToPixel(token.axial.q, token.axial.r, size, ox, oy);
      const r = size * 0.42;
      const img = imagesRef.current.get(token.id);
      const focus = focusByTokenId.get(token.id) ?? DEFAULT_PORTRAIT_FOCUS;
      const ringStyle = resolveTokenRing(token, playerActorIds);

      ctx.beginPath();
      ctx.arc(x, y, r + 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fill();

      if (img?.complete && img.naturalWidth > 0) {
        drawCircularTokenImage(ctx, img, x, y, r, focus);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = token.color;
        ctx.fill();
      }

      drawTokenIdentityRings(ctx, x, y, r, ringStyle);

      if (tokenFlash?.tokenId === token.id) {
        const flashColor =
          tokenFlash.kind === "crit"
            ? "rgba(232,160,32,0.95)"
            : tokenFlash.kind === "hit"
              ? "rgba(200,80,60,0.9)"
              : "rgba(140,140,160,0.85)";
        ctx.beginPath();
        ctx.arc(x, y, r + 10, 0, Math.PI * 2);
        ctx.strokeStyle = flashColor;
        ctx.lineWidth = tokenFlash.kind === "crit" ? 4 : 3;
        ctx.stroke();
      }

      if (token.id === turnActiveId) {
        ctx.beginPath();
        ctx.arc(x, y, r + 7, 0, Math.PI * 2);
        ctx.strokeStyle = readThemeColor("--vtt-token-ring-turn", "#b8860b");
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      if (token.id === selectedId) {
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = readThemeColor("--vtt-token-ring-selected", "#c9a962");
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (attackableIds.has(token.id)) {
        ctx.beginPath();
        ctx.arc(x, y, r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = readThemeColor("--vtt-token-ring-target", "#c44");
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (token.vidaMax != null && token.vida != null) {
        const barW = size * 0.85;
        const barH = 4;
        const bx = x - barW / 2;
        const by = y - r - 10;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = readThemeColor("--vtt-hp-bar", "#5a7352");
        ctx.fillRect(bx, by, barW * (token.vida / token.vidaMax), barH);
      }

      ctx.fillStyle = readThemeColor("--vtt-token-text", "#e8e0d4");
      ctx.font = "600 12px Lora, Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(token.name, x, y + r + 14);
    }

    return true;
  }, [
    gridCells,
    scene,
    selectedId,
    rangeSet,
    walkSet,
    attackRangeSet,
    areaPreviewSet,
    isAreaSpellMode,
    attackableIds,
    hoverAxial,
    hoverMovePreview,
    turnActiveId,
    themeTick,
    showMovement,
    actionMode,
    playerActorIds,
    focusByTokenId,
    tokenFlash,
    isAreaSpellMode,
    areaPreviewSet,
  ]);

  useLayoutEffect(() => {
    draw();
    const ro = new ResizeObserver(() => draw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    const t1 = requestAnimationFrame(() => draw());
    const t2 = setTimeout(() => draw(), 50);
    return () => {
      cancelAnimationFrame(t1);
      clearTimeout(t2);
    };
  }, [draw]);

  function canvasCenter() {
    const canvas = canvasRef.current!;
    return { ox: canvas.clientWidth / 2, oy: canvas.clientHeight / 2 };
  }

  function tokenAtPoint(px: number, py: number): BattleToken | null {
    const { ox, oy } = canvasCenter();
    for (const token of scene.tokens) {
      const { x, y } = axialToPixel(token.axial.q, token.axial.r, scene.hexSize, ox, oy);
      if (Math.hypot(px - x, py - y) < scene.hexSize * 0.5) return token;
    }
    return null;
  }

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { px: e.clientX - rect.left, py: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const { px, py } = pointerPos(e);
    clickStartRef.current = { x: px, y: py };
    const hit = tokenAtPoint(px, py);

    if (hit) {
      if (hit.id !== selectedId) {
        if (selectedId && attackableIds.has(hit.id)) return;
        setSelectedId(hit.id);
      }
      return;
    }

    const axial = pixelToAxial(px, py, scene.hexSize, canvasCenter().ox, canvasCenter().oy);
    if (canControlCombat && actionMode === "idle" && !selectedId) {
      setHoverAxial(axial);
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { px, py } = pointerPos(e);
    const { ox, oy } = canvasCenter();
    setHoverAxial(pixelToAxial(px, py, scene.hexSize, ox, oy));

    const hoverToken = tokenAtPoint(px, py);
    const canvas = canvasRef.current;
    if (canvas) {
      if (hoverToken && selectedId && attackableIds.has(hoverToken.id)) {
        canvas.style.cursor = "crosshair";
      } else if (showMovement) {
        canvas.style.cursor = "cell";
      } else {
        canvas.style.cursor = "default";
      }
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const start = clickStartRef.current;
    clickStartRef.current = null;
    if (!start) return;

    const { px, py } = pointerPos(e);
    if (Math.hypot(px - start.x, py - start.y) > 8) return;

    const hit = tokenAtPoint(px, py);
    const { ox, oy } = canvasCenter();
    const axial = pixelToAxial(px, py, scene.hexSize, ox, oy);

    if (hit) {
      if (hit.id !== selectedId && selectedId && attackableIds.has(hit.id)) {
        void attackToken(hit.id);
        return;
      }
      setSelectedId(hit.id);
      return;
    }

    if (selectedId && isMoveMode(actionMode)) {
      void moveSelectedTo(axial);
      return;
    }

    if (selectedId && isAreaSpellMode && activeCombatAction && selected) {
      const check = canCastAreaAt(selected, axial, activeCombatAction, {
        activeTokenId: turn.activeTokenId,
        bypassTurn: turn.bypassTurn,
      });
      if (check.ok) {
        void castAreaSpell(axial);
      } else {
        setActionErr(check.reason ?? "Centro de área inválido");
      }
    }
  }

  const canUseToken =
    selected &&
    (selected.linked || selected.monsterEntryId || canControlCombat);

  return (
    <div className="vtt-shell">
      <aside className="vtt-sidebar">
        <p className="vtt-eyebrow">Mesa ao vivo</p>
        {snapshot ? (
          <p className="vtt-sync-live">
            <span className="vtt-sync-dot" aria-hidden />
            Sync · rev {snapshot.revision}
          </p>
        ) : null}
        <h2 className="vtt-title">{scene.name}</h2>
        <p className="vtt-hint">Selecione token → escolha ação → clique alvo ou hex</p>

        <div className="vtt-mesa-tools">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const t = scene.tokens.find((x) => x.id === selectedId);
              onOpenSheet?.(t?.actorId ?? "pc-aventureiro");
            }}
          >
            Ficha
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onOpenCompendium?.()}>
            Compêndios
          </button>
        </div>

        {canControlCombat ? (
          <MonsterSpawnPanel roomId={roomId} spawnAxial={hoverAxial} onSpawned={refresh} />
        ) : null}

        {selected && (
          <div className="vtt-token-panel">
            <strong style={{ color: selected.color }}>{selected.name}</strong>
            {selected.linked ? (
              <p className="vtt-linked-badge">Ficha linkada</p>
            ) : selected.monsterEntryId ? (
              <p className="vtt-linked-badge">Monstro · {selected.monsterEntryId}</p>
            ) : null}
            {selected.vidaMax != null ? (
              <p>
                Vida {selected.vida}/{selected.vidaMax}
              </p>
            ) : null}
            {selected.defesa != null ? (
              <p>
                Defesa {selected.defesa}
                {selected.defesaBonus ? ` (+${selected.defesaBonus} buff)` : ""}
              </p>
            ) : null}
            <p>
              PA: {selected.pa}/{selected.paMax}
            </p>

            {canUseToken ? (
              <TokenActionPanel
                roomId={roomId}
                token={selected}
                tokens={scene.tokens}
                actor={selectedActor}
                combat={snapshot?.combat}
                canBypassTurn={canControlCombat}
                actionMode={actionMode}
                onActionModeChange={setActionMode}
                selectedAction={selectedCombatAction}
                onSelectedActionChange={setSelectedCombatAction}
                onAttackResult={triggerCombatFx}
                onUpdate={refresh}
              />
            ) : (
              <p className="vtt-combat-hint">Token sem stats de combate.</p>
            )}
            {actionErr ? <p className="dice-err">{actionErr}</p> : null}

            {canControlCombat ? (
              <TokenConditionsPanel
                roomId={roomId}
                token={selected}
                canEdit={canControlCombat}
                onUpdate={refresh}
              />
            ) : null}
          </div>
        )}

        {snapshot?.combat ? (
          <TurnOrderPanel
            roomId={roomId}
            combat={snapshot.combat}
            tokens={scene.tokens}
            canControl={canControlCombat}
            onUpdate={refresh}
          />
        ) : null}

        <ul className="vtt-token-list">
          {scene.tokens.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={t.id === selectedId ? "active" : ""}
                onClick={() => setSelectedId(t.id)}
              >
                <span className="token-dot" style={{ background: t.color }} />
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div ref={wrapRef} className="vtt-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="vtt-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setHoverAxial(null)}
        />
        <CombatFxLayer
          wrapRef={wrapRef}
          hexSize={scene.hexSize}
          fx={combatFx}
          onTokenFlash={(tokenId, kind) => {
            if (tokenId && kind) setTokenFlash({ tokenId, kind });
            else setTokenFlash(null);
          }}
          onDone={() => {
            setCombatFx(null);
            setTokenFlash(null);
          }}
        />
      </div>
    </div>
  );
}
