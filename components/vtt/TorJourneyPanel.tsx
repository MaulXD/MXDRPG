"use client";

import { useCallback, useMemo, useState } from "react";
import { patchTorSession, postRoomChat } from "@/hooks/useRoomSync";
import { rollTorCheck, featDieRollPayload } from "@/lib/character/um-anel/dice";
/* O papel guarda o ID da Perícia ("caca", "percepcao"); a mesa lê o RÓTULO da
   ficha ("Caçada", "Vigilância"). O painel imprimia o id cru — o Mestre lia
   "Caçador rola caca" e o jogador procurava "caca" numa ficha que diz "Caçada". */
import { SKILL_LABEL } from "@/lib/character/um-anel/data";
import type { TorSkillId } from "@/lib/character/um-anel/types";
import {
  TOR_JOURNEY_EVENT_META,
  TOR_JOURNEY_ROLES,
  TOR_JOURNEY_ROLE_META,
  validateTorRoleAssignment,
  type TorRoleAssignment,
  TOR_REGION_META,
  TOR_REGION_TYPES,
  TOR_SEASONS,
  TOR_TERRAIN_TYPES,
  computeTorJourneyLength,
  formatTorJourneyEventMessage,
  resolveTorJourneyEvent,
  resolveTorMarchingTest,
  terrainRollModifier,
  torEventTargetFromRoll,
  torJourneyEventFromFeatDie,
  type TorRegionType,
  type TorSeason,
  type TorTerrainType,
} from "@/lib/combat/um-anel/journey";
import type { TorJourneyProgress } from "@/lib/combat/um-anel/session-state";
import "./tor-journey.css";

type Props = {
  roomId: string;
  /** Só o Mestre conduz a Jornada (rola Marcha e determina eventos). */
  canManage: boolean;
  /**
   * Estado vindo do snapshot da sala. É a fonte da verdade: sobrevive a recarga
   * e chega a todos os jogadores por SSE, então o placar da viagem é público.
   */
  progress: TorJourneyProgress | null;
  onUpdate: () => void;
};

const SEASON_LABEL: Record<TorSeason, string> = {
  primavera: "Primavera",
  verao: "Verão",
  outono: "Outono",
  inverno: "Inverno",
};

const TERRAIN_LABEL: Record<TorTerrainType, string> = {
  estrada: "Estrada",
  normal: "Normal",
  dificil: "Difícil",
};

const RANKS = [0, 1, 2, 3, 4, 5, 6] as const;

/** ND padrão de mesa quando o Mestre não define outro. */
const DEFAULT_TN = 14;

/** Dado de Sucesso isolado (1–6) — escolhe o alvo do evento. */
function rollSuccessDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

export function TorJourneyPanel({ roomId, canManage, progress, onUpdate }: Props) {
  // Configuração da rota: local só ATÉ iniciar. Depois a verdade é `progress`.
  const [draftTrechos, setDraftTrechos] = useState(10);
  const [draftHard, setDraftHard] = useState(2);
  const [draftSeason, setDraftSeason] = useState<TorSeason>("verao");
  const [draftRegion, setDraftRegion] = useState<TorRegionType>("selvagem");
  const [draftMounted, setDraftMounted] = useState(false);
  const [draftForced, setDraftForced] = useState(false);
  /* Papéis da Jornada. Nome digitado, não id de ficha: o Guia pode ser um PNJ,
     e o que a mesa lê é o apelido. */
  const [draftRoles, setDraftRoles] = useState<TorRoleAssignment>({});

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const started = progress != null;

  const length = useMemo(
    () =>
      computeTorJourneyLength(
        progress
          ? {
              trechos: progress.trechos,
              hardTerrainTrechos: progress.hardTerrainTrechos,
              mounted: progress.mounted,
              forcedMarch: progress.forcedMarch,
              eventDayDelta: progress.dayDelta,
            }
          : {
              trechos: draftTrechos,
              hardTerrainTrechos: draftHard,
              mounted: draftMounted,
              forcedMarch: draftForced,
            }
      ),
    [progress, draftTrechos, draftHard, draftMounted, draftForced]
  );

  /**
   * Narra no chat e grava na sala. A ordem importa: o chat conta o que
   * aconteceu, o patch persiste o novo estado. Se o patch falhar, o erro
   * aparece — e o chat já registrou a rolagem, então nada se perde
   * silenciosamente.
   */
  const commit = useCallback(
    async (text: string, featValue: number | undefined, next: TorJourneyProgress | null) => {
      await postRoomChat(roomId, {
        kind: "chat",
        text,
        ...(featValue != null ? { torFeatDie: { sides: 12, value: featValue } } : {}),
      });
      await patchTorSession(roomId, { journey: next });
      onUpdate();
    },
    [roomId, onUpdate]
  );

  const guard = useCallback(
    async (fn: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      setErr(null);
      try {
        await fn();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Falha ao salvar");
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  const start = useCallback(
    () =>
      guard(async () => {
        const next: TorJourneyProgress = {
          trechos: draftTrechos,
          hardTerrainTrechos: Math.min(draftHard, draftTrechos),
          season: draftSeason,
          region: draftRegion,
          mounted: draftMounted,
          forcedMarch: draftForced,
          remaining: draftTrechos,
          dayDelta: 0,
          pending: null,
          roles: draftRoles,
          log: [],
        };
        // A regra do livro é checada ANTES de partir: um Guia só, e nenhum papel
        // descoberto. Sair com o Caçador vago só apareceria no primeiro evento
        // de Caçada, no meio da viagem.
        const check = validateTorRoleAssignment(draftRoles);
        if (!check.ok) throw new Error(check.reason);
        await commit(
          `Jornada iniciada — ${draftTrechos} trechos por ${TOR_REGION_META[draftRegion].label}, ` +
            `${SEASON_LABEL[draftSeason]}. Previsão: ${length.days} dia${length.days === 1 ? "" : "s"}. ` +
            TOR_JOURNEY_ROLES.map(
              (r) => `${TOR_JOURNEY_ROLE_META[r].label}: ${(draftRoles[r] ?? []).join(", ")}`
            ).join(" · "),
          undefined,
          next
        );
      }),
    [
      guard,
      commit,
      draftTrechos,
      draftHard,
      draftSeason,
      draftRegion,
      draftMounted,
      draftForced,
      draftRoles,
      length.days,
    ]
  );

  const marchingTest = useCallback(
    (guideRank: number) =>
      guard(async () => {
        if (!progress) return;
        const roll = rollTorCheck({ rank: guideRank, tn: DEFAULT_TN });
        const step = resolveTorMarchingTest({
          passed: roll.success,
          successIcons: roll.successIcons,
          season: progress.season,
          trechosRemaining: progress.remaining,
        });

        if (step.arrived) {
          await commit(
            `Teste de Marcha (Guia, Viagem): ${roll.success ? "sucesso" : "falha"} — ` +
              `avança ${step.distance} e a Companhia CHEGA ao destino.`,
            featDieRollPayload(roll.featDie).value,
            {
              ...progress,
              remaining: 0,
              pending: null,
              log: [...progress.log, `Chegou ao destino — ${length.days} dias.`],
            }
          );
          return;
        }

        const target = torEventTargetFromRoll(rollSuccessDie());
        const regionMeta = TOR_REGION_META[progress.region];
        const eventRoll = rollTorCheck({
          rank: 0,
          tn: 0,
          favoured: regionMeta.featRoll === "favoured",
          illFavoured: regionMeta.featRoll === "illFavoured",
        });
        const event = torJourneyEventFromFeatDie(eventRoll.featDie);
        const roleMeta = TOR_JOURNEY_ROLE_META[target.role];

        await commit(
          `Teste de Marcha: avança ${step.distance} trecho${step.distance === 1 ? "" : "s"}. ` +
            `Evento em ${regionMeta.label}: ${event.label} — ${roleMeta.label} rola ` +
            `${SKILL_LABEL[roleMeta.skillId as TorSkillId] ?? roleMeta.skillId}. ${event.consequence}`,
          featDieRollPayload(eventRoll.featDie).value,
          {
            ...progress,
            remaining: step.trechosRemaining,
            // Guarda só o ID do evento: o meta é código, não dado de sala.
            pending: {
              eventId: event.id,
              role: target.role,
              skillId: target.skillId,
              terrain: "normal",
            },
            log: [...progress.log, `${event.label} — ${roleMeta.label}`],
          }
        );
      }),
    [guard, commit, progress, length.days]
  );

  const resolveEvent = useCallback(
    (targetRank: number) =>
      guard(async () => {
        if (!progress?.pending) return;
        const p = progress.pending;
        const event = TOR_JOURNEY_EVENT_META[p.eventId];
        if (!event) {
          setErr(`Evento desconhecido: ${p.eventId}`);
          return;
        }

        // Terreno soma/subtrai Dado de SUCESSO (o livro dá "ganha (1d)" na
        // estrada e "perde (1d)" em terreno difícil). Quem mexe no Dado de
        // Proeza é a Região, e por isso o terreno não pode virar
        // Favorecida/Desfavorecida: as duas se cancelam, e uma estrada em Terras
        // Sombrias apagaria a penalidade da Região.
        const mod = terrainRollModifier(p.terrain);
        const roll = rollTorCheck({
          // Penalidade desce até no mínimo zero Dados de Sucesso (capítulo 2).
          rank: Math.max(0, targetRank + mod.rankDelta),
          tn: DEFAULT_TN,
        });

        const outcome = resolveTorJourneyEvent({
          event,
          target: { role: p.role, skillId: p.skillId },
          passed: roll.success,
        });

        await commit(
          formatTorJourneyEventMessage(TOR_JOURNEY_ROLE_META[p.role].label, outcome),
          featDieRollPayload(roll.featDie).value,
          { ...progress, dayDelta: progress.dayDelta + outcome.dayDelta, pending: null }
        );
      }),
    [guard, commit, progress]
  );

  const setTerrain = useCallback(
    (terrain: TorTerrainType) =>
      guard(async () => {
        if (!progress?.pending) return;
        await patchTorSession(roomId, {
          journey: { ...progress, pending: { ...progress.pending, terrain } },
        });
        onUpdate();
      }),
    [guard, progress, roomId, onUpdate]
  );

  const end = useCallback(
    () =>
      guard(async () => {
        await patchTorSession(roomId, { journey: null });
        onUpdate();
      }),
    [guard, roomId, onUpdate]
  );

  /** Resumo compartilhado entre a visão do Mestre e a do jogador. */
  const summary = progress ? (
    <>
      <p className="tor-journey__remaining">
        {progress.remaining === 0
          ? "Chegou ao destino"
          : `${progress.remaining} de ${progress.trechos} trechos restantes`}
      </p>
      <p className="tor-journey__pending-hint">
        {TOR_REGION_META[progress.region].label} · {SEASON_LABEL[progress.season]} ·{" "}
        {length.days} dia{length.days === 1 ? "" : "s"}
        {progress.forcedMarch ? " · marcha forçada" : ""}
        {progress.mounted ? " · a cavalo" : ""}
      </p>
    </>
  ) : null;

  const diary = progress && progress.log.length > 0 ? (
    <section className="tor-journey__section">
      <p className="eyebrow">Diário</p>
      <ul className="tor-journey__log">
        {progress.log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </section>
  ) : null;

  /* ── Jogador: placar somente leitura ─────────────────────────────── */
  if (!canManage) {
    if (!progress) {
      return (
        <div className="tor-journey">
          <p className="vtt-combat-hint">Nenhuma jornada em curso.</p>
        </div>
      );
    }
    return (
      <div className="tor-journey">
        <section className="tor-journey__section">
          <p className="eyebrow">Jornada</p>
          {summary}
          {progress.pending ? (
            <div className="tor-journey__pending">
              <p className="tor-journey__pending-title">
                {TOR_JOURNEY_EVENT_META[progress.pending.eventId]?.label ?? "Evento"}
              </p>
              <p className="tor-journey__pending-hint">
                {TOR_JOURNEY_ROLE_META[progress.pending.role].label} deve rolar{" "}
                {SKILL_LABEL[progress.pending.skillId as TorSkillId] ?? progress.pending.skillId}
                {(progress.roles?.[progress.pending.role] ?? []).length > 0
                  ? ` — ${(progress.roles![progress.pending.role] ?? []).join(", ")}`
                  : ""}
              </p>
            </div>
          ) : null}
        </section>
        {diary}
      </div>
    );
  }

  /* ── Mestre ───────────────────────────────────────────────────────── */
  return (
    <div className="tor-journey">
      {err ? <p className="dice-err">{err}</p> : null}

      {!started ? (
        <section className="tor-journey__section">
          <p className="eyebrow">Rota</p>
          <div className="tor-journey__grid">
            <label>
              Trechos
              <input
                type="number"
                min={1}
                max={40}
                value={draftTrechos}
                onChange={(e) => setDraftTrechos(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
            <label>
              Terreno difícil
              <input
                type="number"
                min={0}
                max={draftTrechos}
                value={draftHard}
                onChange={(e) => setDraftHard(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
            <label>
              Estação
              <select
                value={draftSeason}
                onChange={(e) => setDraftSeason(e.target.value as TorSeason)}
              >
                {TOR_SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {SEASON_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Região
              <select
                value={draftRegion}
                onChange={(e) => setDraftRegion(e.target.value as TorRegionType)}
              >
                {TOR_REGION_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {TOR_REGION_META[r].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="tor-journey__checks">
            <label>
              <input
                type="checkbox"
                checked={draftMounted}
                onChange={(e) => setDraftMounted(e.target.checked)}
              />
              A cavalo
            </label>
            <label>
              <input
                type="checkbox"
                checked={draftForced}
                onChange={(e) => setDraftForced(e.target.checked)}
              />
              Marcha forçada
            </label>
          </div>

          {/* Sem isto, o painel dizia "o Caçador rola Caçada" e a mesa tinha de
              lembrar de cabeça quem era o Caçador. */}
          <div className="tor-journey__roles">
            {TOR_JOURNEY_ROLES.map((role) => (
              <label key={role} className="vtt-field">
                {TOR_JOURNEY_ROLE_META[role].label} ({SKILL_LABEL[TOR_JOURNEY_ROLE_META[role].skillId as TorSkillId]})
                <input
                  type="text"
                  placeholder={TOR_JOURNEY_ROLE_META[role].unique ? "um herói só" : "um ou mais, separados por vírgula"}
                  value={(draftRoles[role] ?? []).join(", ")}
                  onChange={(e) =>
                    setDraftRoles((s) => ({
                      ...s,
                      [role]: e.target.value
                        .split(",")
                        .map((n) => n.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <p className="tor-journey__estimate">
            {length.days} dia{length.days === 1 ? "" : "s"}
            {length.forcedMarchFatigue > 0
              ? ` · +${length.forcedMarchFatigue} Fadiga de marcha forçada`
              : ""}
          </p>

          <button type="button" className="btn" disabled={busy} onClick={() => void start()}>
            Iniciar jornada
          </button>
        </section>
      ) : (
        <>
          <section className="tor-journey__section">
            <p className="eyebrow">Progresso</p>
            {summary}

            {progress.pending ? (
              <div className="tor-journey__pending">
                <p className="tor-journey__pending-title">
                  {TOR_JOURNEY_EVENT_META[progress.pending.eventId]?.label ?? "Evento"}
                </p>
                <p className="tor-journey__pending-hint">
                  {TOR_JOURNEY_ROLE_META[progress.pending.role].label} rola{" "}
                  {SKILL_LABEL[progress.pending.skillId as TorSkillId] ?? progress.pending.skillId}
                </p>
                <label>
                  Terreno do evento
                  <select
                    value={progress.pending.terrain}
                    disabled={busy}
                    onChange={(e) => void setTerrain(e.target.value as TorTerrainType)}
                  >
                    {TOR_TERRAIN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TERRAIN_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="tor-journey__ranks">
                  {RANKS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="btn-ghost"
                      disabled={busy}
                      onClick={() => void resolveEvent(r)}
                      title={`Rolar com graduação ${r}`}
                    >
                      {r}d
                    </button>
                  ))}
                </div>
              </div>
            ) : progress.remaining !== 0 ? (
              <div className="tor-journey__ranks">
                <p className="tor-journey__pending-hint">
                  Teste de Marcha — graduação de Viagem do Guia
                </p>
                {RANKS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="btn-ghost"
                    disabled={busy}
                    onClick={() => void marchingTest(r)}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              className="btn-ghost tor-journey__reset"
              disabled={busy}
              onClick={() => void end()}
            >
              Encerrar jornada
            </button>
          </section>

          {diary}
        </>
      )}
    </div>
  );
}
