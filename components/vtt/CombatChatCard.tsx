"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/room/chat";
import { combatEventTone } from "@/lib/room/chat-events";
import { CombatEventIcon } from "@/components/ui/EldarinIcons";
import {
  combatChatActionTags,
  combatChatAuthorRoleLabel,
  combatChatDamageSummary,
  combatChatHeroDisplay,
  combatChatRollFormula,
  combatChatRollSummary,
  isStagedCombatChatMessage,
  shouldShowCombatDamageInChat,
  splitCombatChatDetail,
  type CombatChatRevealPhase,
} from "@/lib/combat/chat-display";
import { hpBarColor } from "@/lib/vtt/token-hp-display";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  message: ChatMessage;
  revealPhase?: CombatChatRevealPhase;
  tokens: BattleToken[];
  time: string;
};

function TokenThumb({ token }: { token: BattleToken | undefined }) {
  const name = token?.name?.trim() || "Token";
  const initials = name.slice(0, 2).toUpperCase();
  const imageUrl = token?.imageUrl?.trim();

  return (
    <span className="combat-chat-card__thumb" aria-hidden>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" />
      ) : (
        <span
          className="combat-chat-card__thumb-fallback"
          style={{ background: token?.color ?? "#4a3c32" }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}

export function CombatChatCard({ message, revealPhase, tokens, time }: Props) {
  const [expanded, setExpanded] = useState(false);
  const c = message.combat;
  if (!c) return null;

  const tone = combatEventTone(c);
  const staged = isStagedCombatChatMessage(message);
  const showDamage = shouldShowCombatDamageInChat(message, revealPhase);
  const attacker = tokens.find((t) => t.id === c.attackerTokenId);
  const defender = tokens.find((t) => t.id === c.defenderTokenId);
  const focusToken = c.resolution === "defeat" ? defender : attacker;
  const tokenName = focusToken?.name ?? message.authorName;
  const detailParts = c.detail
    ? splitCombatChatDetail(c.detail, c.resolution === "save" ? "save" : "attack")
    : { roll: "", damage: null };
  const formula = combatChatRollFormula(detailParts.roll || c.detail || "");
  const hero = combatChatHeroDisplay(message, showDamage);
  const summary =
    staged && !showDamage ? combatChatRollSummary(message) : combatChatDamageSummary(message);
  const damageLine =
    showDamage && detailParts.damage
      ? detailParts.damage
      : showDamage && c.detail && !detailParts.roll
        ? c.detail
        : null;
  const actionName = c.weaponName?.trim() || (c.resolution === "defeat" ? "Derrotado" : "Ação");
  const vsTarget =
    c.resolution !== "defeat" && defender?.name && attacker?.id !== defender.id
      ? defender.name
      : null;
  const hpMax = Math.max(c.defenderHpBefore, c.defenderHpAfter, 1);
  const hpPct = Math.round((c.defenderHpAfter / hpMax) * 100);
  const hpFillColor = hpBarColor(c.defenderHpAfter / hpMax);
  const showHpBar =
    showDamage &&
    tone !== "defeat" &&
    tone !== "info" &&
    c.defenderHpBefore > 0 &&
    (c.hit || c.resolution === "save");

  return (
    <article className={`combat-chat-card combat-chat-card--${tone}`}>
      <header className="combat-chat-card__header">
        <TokenThumb token={focusToken} />
        <div className="combat-chat-card__identity">
          <strong className="combat-chat-card__name">{tokenName}</strong>
          <span className="combat-chat-card__role">
            {message.authorName}
            <span className="combat-chat-card__role-sep"> · </span>
            {combatChatAuthorRoleLabel(message.authorRole)}
          </span>
        </div>
        <time className="combat-chat-card__time">{time}</time>
      </header>

      <div className="combat-chat-card__action">
        <span className="combat-chat-card__action-icon" aria-hidden>
          <CombatEventIcon tone={tone} size={16} />
        </span>
        <div className="combat-chat-card__action-text">
          <span className="combat-chat-card__action-name">{actionName}</span>
          {vsTarget ? (
            <span className="combat-chat-card__action-target">→ {vsTarget}</span>
          ) : null}
          <span className="combat-chat-card__action-tags">{combatChatActionTags(c)}</span>
        </div>
      </div>

      {formula && formula !== "—" ? (
        <div className="combat-chat-card__formula">{formula}</div>
      ) : null}

      <div className="combat-chat-card__result">
        <div className="combat-chat-card__result-main">
          <span className="combat-chat-card__result-value">{hero.value}</span>
          {hero.caption ? (
            <span className="combat-chat-card__result-caption">{hero.caption}</span>
          ) : null}
        </div>
        {c.detail ? (
          <button
            type="button"
            className="combat-chat-card__expand"
            aria-expanded={expanded}
            aria-label={expanded ? "Ocultar detalhes" : "Ver detalhes da rolagem"}
            onClick={() => setExpanded((v) => !v)}
          >
            ›
          </button>
        ) : null}
      </div>

      {expanded && c.detail ? (
        <p className="combat-chat-card__detail">{c.detail}</p>
      ) : null}

      <p className="combat-chat-card__summary">{summary}</p>

      {showDamage && damageLine ? (
        <p className="combat-chat-card__damage">{damageLine}</p>
      ) : null}

      {showDamage && c.attackerHeal && c.attackerHeal > 0 ? (
        <p className="combat-chat-card__heal">+{c.attackerHeal} HP (arma)</p>
      ) : null}

      {showHpBar ? (
        <div className="combat-chat-card__hp" role="presentation">
          <div
            className="combat-chat-card__hp-fill"
            style={{ width: `${Math.min(100, hpPct)}%`, background: hpFillColor }}
          />
          <span className="combat-chat-card__hp-label">
            HP {c.defenderHpBefore} → {c.defenderHpAfter}
          </span>
        </div>
      ) : null}
    </article>
  );
}
