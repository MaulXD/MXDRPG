# MXDRPG — Avaliação infra BR (paralelo)

Decisão registrada na Fase 4 do plano de latência da mesa.

## Situação atual

| Item | Valor |
|------|--------|
| App | Contabo (EU), Docker + MariaDB |
| Latência típica BR → EU | ~180–250 ms RTT |
| Sync | SSE + poll 500 ms (combate) / 2 s (exploração) |

## Opções

| Opção | Prós | Contras | Esforço |
|-------|------|---------|---------|
| **Manter Contabo EU** | Já pago, F1–F4 reduzem bytes/round-trips | RTT físico permanece | ✅ feito |
| **VPS BR (Contabo/Hetzner SP)** | −150 ms RTT para grupo BR | Migrar DB + DNS + backup | 1–2 dias |
| **Edge só estático** | CDN para assets | API/DB ainda na EU | Baixo, ganho parcial |
| **WebSocket (R30 PRD)** | Push instantâneo | Infra + reconexão | Fase posterior |

## Recomendação (2026-06)

1. **Validar F1–F4 no Contabo EU** com grupo fixo (checklist A1–A11).
2. Se **A7** (sync entre jogadores) falhar de forma consistente → priorizar **VPS BR** com mesmo stack (MariaDB + Docker).
3. **Não** migrar antes de medir com delta + trim — boa parte do lag era payload e snapshot completo no POST.

## Métricas para decidir migração

- A7 falha em >30% das sessões de teste
- p95 POST ataque >800 ms com delta ativo
- GM reporta “mesa travada” com pill “Ao vivo” verde

## Próximo passo se migrar

1. Snapshot MariaDB Contabo → VPS BR
2. `DATABASE_URL` + redeploy imagem GHCR
3. DNS `mxdrpg.com.br` → novo IP (TTL baixo antes)
4. Revalidar A1–A11
