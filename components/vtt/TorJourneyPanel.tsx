"use client";

import { useCallback, useMemo, useState } from "react";
import { postRoomChat } from "@/hooks/useRoomSync";
import { rollTorCheck, featDieRollPayload } from "@/lib/character/um-anel/dice";
import {
  TOR_JOURNEY_ROLE_META,
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
  type TorEventTarget,
  type TorJourneyEventMeta,
  type TorRegionType,
  type TorSeason,
  type TorTerrainType,
} from "@/lib/combat/um-anel/journey";
import "./tor-journey.css";

type Props = {
  roomId: string;
  /** Só o Mestre conduz a Jornada (rola Marcha e determina eventos). */
  canManage: boolean;
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

/** Rola um Dado de Sucesso isolado (1–6) — usado para escolher o alvo do evento. */
function rollSuccessDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

export function TorJourneyPanel({ roomId, canManage, onUpdate }: Props) {
  // Rota
  const [trechos, setTrechos] = useState(10);
  const [hardTrechos, setHardTrechos] = useState(2);
  const [season, setSeason] = useState<TorSeason>("verao");
  const [region, setRegion] = useState<TorRegionType>("selvagem");
  const [mounted, setMounted] = useState(false);
  const [forcedMarch, setForcedMarch] = useState(false);

  // Progresso
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dayDelta, setDayDelta] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /**
   * Evento pendente: alvo sorteado e evento determinado, aguardando a rolagem do
   * herói. Guarda o `TorJourneyEventMeta` **inteiro** — reconstruir um meta
   * parcial na hora de resolver perderia `fatigue` e `triggersOn`, e um evento
   * de `triggersOn: "success"` (Atalho, Encontro Fortuito, Visão Alegre) seria
   * resolvido ao contrário.
   */
  const [pending, setPending] = useState<{
    event: TorJourneyEventMeta;
    target: TorEventTarget;
    roleLabel: string;
    terrain: TorTerrainType;
  } | null>(null);

  const started = remaining !== null;

  const length = useMemo(
    () =>
      computeTorJourneyLength({
        trechos,
        hardTerrainTrechos: hardTrechos,
        mounted,
        forcedMarch,
        eventDayDelta: dayDelta,
      }),
    [trechos, hardTrechos, mounted, forcedMarch, dayDelta]
  );

  const say = useCallback(
    async (text: string, featValue?: number) => {
      try {
        await postRoomChat(roomId, {
          kind: "chat",
          text,
          ...(featValue != null ? { torFeatDie: { sides: 12, value: featValue } } : {}),
        });
        onUpdate();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Falha ao publicar no chat");
      }
    },
    [roomId, onUpdate]
  );

  const start = useCallback(async () => {
    setRemaining(trechos);
    setDayDelta(0);
    setLog([]);
    setPending(null);
    setErr(null);
    await say(
      `Jornada iniciada — ${trechos} trechos por ${TOR_REGION_META[region].label}, ${SEASON_LABEL[season]}. ` +
        `Previsão: ${length.days} dia${length.days === 1 ? "" : "s"}.`
    );
  }, [trechos, region, season, length.days, say]);

  /** Teste de Marcha do Guia: avança na rota e, se não chegou, determina o evento. */
  const marchingTest = useCallback(
    async (guideRank: number) => {
      if (remaining == null || busy) return;
      setBusy(true);
      setErr(null);
      try {
        // O Guia rola Viagem. TN 14 é o padrão de mesa quando o Mestre não define outro.
        const roll = rollTorCheck({ rank: guideRank, tn: 14 });
        const step = resolveTorMarchingTest({
          passed: roll.success,
          successIcons: roll.successIcons,
          season,
          trechosRemaining: remaining,
        });

        await say(
          `Teste de Marcha (Guia, Viagem): ${roll.success ? "sucesso" : "falha"} — ` +
            `avança ${step.distance} trecho${step.distance === 1 ? "" : "s"}` +
            (step.arrived ? " e a Companhia CHEGA ao destino." : "."),
          featDieRollPayload(roll.featDie).value
        );

        setRemaining(step.trechosRemaining);
        if (step.arrived) {
          setPending(null);
          setLog((l) => [...l, `Chegou ao destino — ${length.days} dias de viagem.`]);
          return;
        }

        // Alvo e natureza do evento.
        const target = torEventTargetFromRoll(rollSuccessDie());
        const regionMeta = TOR_REGION_META[region];
        const eventRoll = rollTorCheck({
          rank: 0,
          tn: 0,
          favoured: regionMeta.featRoll === "favoured",
          illFavoured: regionMeta.featRoll === "illFavoured",
        });
        const event = torJourneyEventFromFeatDie(eventRoll.featDie);
        const roleMeta = TOR_JOURNEY_ROLE_META[target.role];

        await say(
          `Evento em ${regionMeta.label}: ${event.label} — ${roleMeta.label} deve rolar ` +
            `${roleMeta.skillId}. ${event.consequence}`,
          featDieRollPayload(eventRoll.featDie).value
        );

        setPending({ event, target, roleLabel: roleMeta.label, terrain: "normal" });
        setLog((l) => [...l, `${event.label} — ${roleMeta.label} (${roleMeta.skillId})`]);
      } finally {
        setBusy(false);
      }
    },
    [remaining, busy, season, region, length.days, say]
  );

  /** Resolve o evento pendente com a rolagem do herói alvo. */
  const resolveEvent = useCallback(
    async (targetRank: number) => {
      if (!pending || busy) return;
      setBusy(true);
      setErr(null);
      try {
        const mod = terrainRollModifier(pending.terrain);
        const roll = rollTorCheck({
          rank: targetRank,
          tn: 14,
          favoured: mod.favoured,
          illFavoured: mod.illFavoured,
        });

        const outcome = resolveTorJourneyEvent({
          event: pending.event,
          target: pending.target,
          passed: roll.success,
        });

        await say(
          formatTorJourneyEventMessage(pending.roleLabel, outcome),
          featDieRollPayload(roll.featDie).value
        );

        if (outcome.dayDelta !== 0) setDayDelta((d) => d + outcome.dayDelta);
        setPending(null);
      } finally {
        setBusy(false);
      }
    },
    [pending, busy, say]
  );

  if (!canManage) {
    return (
      <div className="tor-journey">
        <p className="vtt-combat-hint">
          Só o Mestre conduz a Jornada. Acompanhe os eventos no chat da mesa.
        </p>
      </div>
    );
  }

  return (
    <div className="tor-journey">
      {err ? <p className="dice-err">{err}</p> : null}

      <section className="tor-journey__section">
        <p className="eyebrow">Rota</p>
        <div className="tor-journey__grid">
          <label>
            Trechos
            <input
              type="number"
              min={1}
              max={40}
              value={trechos}
              onChange={(e) => setTrechos(Math.max(1, Number(e.target.value) || 1))}
              disabled={started}
            />
          </label>
          <label>
            Terreno difícil
            <input
              type="number"
              min={0}
              max={trechos}
              value={hardTrechos}
              onChange={(e) => setHardTrechos(Math.max(0, Number(e.target.value) || 0))}
              disabled={started}
            />
          </label>
          <label>
            Estação
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as TorSeason)}
              disabled={started}
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
              value={region}
              onChange={(e) => setRegion(e.target.value as TorRegionType)}
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
              checked={mounted}
              onChange={(e) => setMounted(e.target.checked)}
            />
            A cavalo
          </label>
          <label>
            <input
              type="checkbox"
              checked={forcedMarch}
              onChange={(e) => setForcedMarch(e.target.checked)}
            />
            Marcha forçada
          </label>
        </div>

        <p className="tor-journey__estimate">
          {length.days} dia{length.days === 1 ? "" : "s"}
          {length.forcedMarchFatigue > 0
            ? ` · +${length.forcedMarchFatigue} Fadiga de marcha forçada`
            : ""}
        </p>
      </section>

      <section className="tor-journey__section">
        <p className="eyebrow">Progresso</p>
        {!started ? (
          <button type="button" className="btn" onClick={() => void start()}>
            Iniciar jornada
          </button>
        ) : (
          <>
            <p className="tor-journey__remaining">
              {remaining === 0
                ? "Chegou ao destino"
                : `${remaining} trecho${remaining === 1 ? "" : "s"} até o destino`}
            </p>

            {pending ? (
              <div className="tor-journey__pending">
                <p className="tor-journey__pending-title">{pending.event.label}</p>
                <p className="tor-journey__pending-hint">
                  {pending.roleLabel} rola {pending.target.skillId}
                </p>
                <label>
                  Terreno do evento
                  <select
                    value={pending.terrain}
                    onChange={(e) =>
                      setPending((p) =>
                        p ? { ...p, terrain: e.target.value as TorTerrainType } : p
                      )
                    }
                  >
                    {TOR_TERRAIN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TERRAIN_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="tor-journey__ranks">
                  {[0, 1, 2, 3, 4, 5, 6].map((r) => (
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
            ) : remaining !== 0 ? (
              <div className="tor-journey__ranks">
                <p className="tor-journey__pending-hint">
                  Teste de Marcha — graduação de Viagem do Guia
                </p>
                {[0, 1, 2, 3, 4, 5, 6].map((r) => (
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
              onClick={() => {
                setRemaining(null);
                setPending(null);
                setDayDelta(0);
                setLog([]);
              }}
            >
              Encerrar jornada
            </button>
          </>
        )}
      </section>

      {log.length > 0 ? (
        <section className="tor-journey__section">
          <p className="eyebrow">Diário</p>
          <ul className="tor-journey__log">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
