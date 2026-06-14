"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/room/chat";
import { combatEventTone, combatHealAmount, isCombatHealEvent } from "@/lib/room/chat-events";
import { CombatEventIcon } from "@/components/ui/EldarinIcons";
import {
  combatChatActionTags,
  combatChatBonusHealNote,
  combatChatDamageSummary,
  combatChatHeroDisplay,
  combatChatRollSummary,
  combatChatTargetName,
  isStagedCombatChatMessage,
  savingThrowHeadline,
  shouldShowCombatDamageInChat,
  type CombatChatRevealPhase,
} from "@/lib/combat/chat-display";
import { combatUsageKind } from "@/lib/combat/chat-labels";
import { SavingThrowHeadline } from "@/components/vtt/SavingThrowHeadline";
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
  const usageKind = combatUsageKind(c, message.text);
  const staged = isStagedCombatChatMessage(message);
  const showDamage = shouldShowCombatDamageInChat(message, revealPhase);
  const attacker = tokens.find((t) => t.id === c.attackerTokenId);
  const defender = tokens.find((t) => t.id === c.defenderTokenId);
  const focusToken = c.resolution === "defeat" ? defender : attacker;
  const tokenName = focusToken?.name ?? message.authorName;
  const hero = combatChatHeroDisplay(message, showDamage);
  const summary =
    staged && !showDamage ? combatChatRollSummary(message) : combatChatDamageSummary(message);
  const actionName = c.weaponName?.trim() || (c.resolution === "defeat" ? "Derrotado" : "Ação");
  const vsTarget = combatChatTargetName(c, defender?.name, message.text);
  const bonusHealNote = combatChatBonusHealNote(c);
  const hpMax = Math.max(c.defenderHpBefore, c.defenderHpAfter, 1);
  const hpPct = Math.round((c.defenderHpAfter / hpMax) * 100);
  const hpFillColor = hpBarColor(c.defenderHpAfter / hpMax);
  const healAmount = combatHealAmount(c);
  const isHealEvent = isCombatHealEvent(c) && healAmount > 0;
  const showHpBar =
    showDamage &&
    !isHealEvent &&
    tone !== "defeat" &&
    tone !== "info" &&
    c.defenderHpBefore > 0 &&
    (c.hit || c.resolution === "save");
  const showHealBar =
    showDamage && isHealEvent && c.defenderHpBefore >= 0;
  const hasDetail = Boolean(c.detail?.trim());
  const saveHeadline = savingThrowHeadline(c);

  const savePass = saveHeadline?.success === true;
  const saveFail = saveHeadline?.success === false;

  const actionLine = [
    actionName,
    vsTarget ? `→ ${vsTarget}` : null,
    combatChatActionTags(c, message.text),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={`combat-chat-card combat-chat-card--${tone}${usageKind === "buff" || usageKind === "consumable_effect" ? " combat-chat-card--buff" : ""}${usageKind === "debuff" ? " combat-chat-card--debuff" : ""}${savePass ? " combat-chat-card--save-pass" : ""}${saveFail ? " combat-chat-card--save-fail" : ""}`}
    >
      <header className="combat-chat-card__header">
        <TokenThumb token={focusToken} />
        <div className="combat-chat-card__identity">
          <strong className="combat-chat-card__name">{tokenName}</strong>
          <span className="combat-chat-card__action-line">{actionLine}</span>
        </div>
        <time className="combat-chat-card__time">{time}</time>
      </header>

      {saveHeadline ? <SavingThrowHeadline headline={saveHeadline} /> : null}

      <div className="combat-chat-card__body">
        <div className="combat-chat-card__roll" aria-hidden>
          <CombatEventIcon tone={tone} size={14} />
          <span className="combat-chat-card__result-value">{hero.value}</span>
          {hero.caption ? (
            <span className="combat-chat-card__result-caption">{hero.caption}</span>
          ) : null}
        </div>
        <p className="combat-chat-card__summary">{summary}</p>
        {hasDetail ? (
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

      {expanded && hasDetail ? (
        <p className="combat-chat-card__detail">{c.detail}</p>
      ) : null}

      {showDamage && bonusHealNote ? (
        <p className="combat-chat-card__heal">{bonusHealNote}</p>
      ) : null}

      {showHealBar ? (
        <div className="combat-chat-card__hp combat-chat-card__hp--heal" role="presentation">
          <div
            className="combat-chat-card__hp-fill"
            style={{
              width: `${Math.min(100, hpPct)}%`,
              background: "var(--accent-success, #3d8f55)",
            }}
          />
          <span className="combat-chat-card__hp-label combat-chat-card__hp-label--heal">
            +{healAmount} HP ({c.defenderHpBefore} → {c.defenderHpAfter})
          </span>
        </div>
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
