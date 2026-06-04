# Plano de refatoração — MXDRPG / Eldarin VTT

Objetivo: **VTT em React + Tailwind (Next.js na raiz)**, regras alinhadas aos livros, mesa estável para jogar e gravar demo/vídeo. Persistência (DB) **depois**. Foundry (`vinite/`) vira **referência** para o vídeo e paridade de features — não é o produto principal.

Ritmo: **um passo por conversa** — você aprova antes do próximo.

---

## Visão (do zero, com pé no chão)

| Camada | Hoje | Alvo |
|--------|------|------|
| UI | Next.js + componentes VTT | Mesma stack; fatiar `HexBattlefield`, painel direito, ficha |
| Regras | `lib/` + JSON gerados | Pipeline `npm run sync:data` documentado; IDs canônicos |
| Sala | Memória (`lib/room/store.ts`) | Fase 5+: Postgres/Redis + sync real |
| Foundry | `vinite/` | Vídeo mostrando o que o Foundry fazia → checklist de paridade no VTT web |

**Vídeo Foundry (sua ideia):** grave 5–10 min mostrando ficha, token, combate, PA, loot, compêndio no Foundry. Usamos como **lista de aceite** para o VTT React — não precisa reimplementar o motor do Foundry.

---

## Passos

### Passo 0 — Fundação do repo ✅

- [x] Arquivar `web/` → `archive/web/`
- [x] Docs + CI (`ci.yml`)

---

### Passo 2 — Mesa VTT (código) ✅

- [x] `hooks/vtt/useTokenImages.ts` — cache de retrato
- [x] `hooks/vtt/usePortraitFocusByToken.ts`
- [x] `hooks/vtt/useBattlefieldHighlights.ts` — alcance, alvos, área
- [x] `hooks/vtt/useHexCanvas.ts` + `lib/vtt/draw-battlefield.ts`
- [x] `hooks/vtt/useBattlefieldPointer.ts`
- [x] Polish: sombra, placeholder com inicial, vinheta, barra de vida, hit-test maior
- [x] `HexBattlefield.tsx` orquestra (~400 linhas vs ~820)

**Próximo:** gravar vídeo + preencher notas em `docs/PARIDADE-FOUNDRY.md`, ou Passo 3 (`room/store`).

---

### Passo 1 — Mapa de paridade (vídeo / Foundry) ✅ (estrutura)

- [x] `docs/PARIDADE-FOUNDRY.md` — roteiro 9 cenas + checklist
- [ ] Você grava o vídeo no Foundry e preenche “Notas da gravação”
- [ ] Priorizar 3 itens ❌/🟡 para a sprint seguinte

---

---

### Passo 3 — Backend da sala ✅

- [x] `lib/room/internal/` — registry, actor-patch, token-reset
- [x] `lib/room/handlers/` — lifecycle, actors, tokens, combat-*, chat
- [x] `lib/room/store.ts` — só re-export (APIs antigas intactas)
- [x] `docs/API-SALA.md`
- Ainda em memória; comportamento igual

---

### Passo 4 — Dados e regras ✅

- [x] `npm run sync:data` + `sync:data:check` no README
- [x] `docs/DADOS-E-REGRAS.md` — fluxo livros → JSON
- [x] `lib/character/canon-ids.ts` — import único CLA/RAC/LIN
- [x] `scripts/verify-compendium-ids.mjs` — catalogId + sem `ID:` no HTML
- [x] CI job `data-sync` antes do build
- [x] UI sem `catalogId` (já ok)

---

### Passo 5 — Persistência (fundação) 🟡

- [x] Neon Postgres via `DATABASE_URL` (`lib/db/*`, `scripts/db/schema.sql`)
- [x] `npm run db:migrate` + [docs/PERSISTENCIA.md](docs/PERSISTENCIA.md)
- [x] Salas (exceto `demo`): `getRoom` / `persistRoom` / convite / criar mesa
- [x] `createRoom` falha se Postgres indisponível (sem sala só em memória)
- [x] Usuários: `lib/db/users` quando DB ativo; demo sem DB intacto
- [x] APIs da sala: `await` em handlers async do store
- [x] Personagens em `eldarin_characters` quando DB ativo (`resolveCharacter`, seed)
- [x] Gate A1: `npm run smoke:a1` — [docs/A1-NEON-SMOKE.md](docs/A1-NEON-SMOKE.md)
- [ ] Polling → SSE ou WebSocket (depois)

---

### Passo 6 — Produto e deploy

- Revisar auth (demo → produção)
- Domínio só `mxdrpg.vercel.app`
- Página `/sistema` alinhada ao que existe de fato

---

## O que não fazer agora

- Monorepo Turborepo grande
- Reescrever combate do zero
- Manter `archive/web` em sync com a raiz
- Migrar `vinite/` para React (só referência + vídeo)

---

## Decisões já tomadas (com você)

| Tema | Decisão |
|------|---------|
| Norte | Tudo, em ordem equilibrada |
| `web/` | Arquivar (`archive/web/`) |
| DB | Depois |
| Foundry | Referência + vídeo; produto = React/Tailwind na raiz |
| Ritmo | Um passo por conversa |

---

**Roadmap produto (PRD v2.1):** P0 Neon → P1 Clerk → P2 SSE → … → P9 beta. Ver [docs/PRD-ELDARIN-VTT.md](docs/PRD-ELDARIN-VTT.md).

**Neon:** adiado — [P0-NEON-SETUP.md](docs/P0-NEON-SETUP.md) quando for a vez.

**Feito recente:** P6 spawn check · P8 piloto token · mobile mesa · `/sistema` atualizado.

**Próximo:** P7 polish mobile · delegação P8 · beta [BETA-P9-CHECKLIST.md](docs/BETA-P9-CHECKLIST.md) (demo/memória OK para teste interno).

*Última atualização: alinhado PRD P0–P9*
