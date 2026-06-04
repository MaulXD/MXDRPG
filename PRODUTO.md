# Eldarin — produto correto

## O que é

**Virtual Tabletop proprietário** no browser (React + Tailwind via Next.js), hospedado na Vercel.

Não é módulo Foundry. Não exige instalar Foundry VTT.

## Onde está o código

| Pasta | Função |
|-------|--------|
| `app/`, `components/`, `lib/` | **Produto** — site, auth, mesa hex, combate, ficha |
| `livros/` | Regras / lore em Markdown |
| `data/` | Compêndios e trilhas gerados |
| `scripts/` | Geradores livros → JSON/TS |
| `vinite/` | Legado Foundry — referência e roteiro de vídeo de paridade |
| `archive/web/` | Legado — app duplicado pré-migração (**não editar**) |

## Stack

- **Frontend:** Next.js 15, React 19, CSS (VTT canvas + UI)
- **Backend hoje:** API Routes + salas em memória; **Postgres opcional** com `DATABASE_URL` ([docs/POSTGRES.md](docs/POSTGRES.md), [docs/PERSISTENCIA.md](docs/PERSISTENCIA.md))
- **Backend depois:** sync em tempo real (WebSocket / SSE)
- **Auth:** demo cookie hoje → produção quando priorizar
- **Deploy:** Vercel, raiz do repo (Root Directory vazio)

## Mesa

`/mesa/[roomId]` — grid hex, tokens, PA, chat, compêndio no painel direito.

## Papéis

- **Admin** — plataforma
- **Mestre** — sala, spawn, combate
- **Jogador** — ficha, token na mesa

## Refatoração

Plano passo a passo: [REFATORACAO.md](REFATORACAO.md)

## Estruturar RPG jogável no site

Guia completo (camadas, roadmap, fluxos, DoD): [docs/ELDARIN-SITE-JOGAVEL.md](docs/ELDARIN-SITE-JOGAVEL.md)

PRD produto (v2.2): [docs/PRD-ELDARIN-VTT.md](docs/PRD-ELDARIN-VTT.md) · UX mesa: [docs/UX-MESA-E-RAIL.md](docs/UX-MESA-E-RAIL.md) · Privacidade: [docs/PRIVACIDADE-LGPD.md](docs/PRIVACIDADE-LGPD.md)
