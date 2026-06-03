# Eldarin — produto correto

## O que é

**Virtual Tabletop proprietário** rodando no browser, hospedado na Vercel.

Não é módulo Foundry. Não exige instalar Foundry VTT.

## Onde está o código

| Pasta | Função |
|-------|--------|
| `web/` | **Produto** — site, auth, mesa hex, futuro multiplayer |
| `vinite/` | Legado Foundry (ignorar) |
| `livros/` | Regras / lore em Markdown |

## Stack alvo

- **Frontend:** Next.js, Canvas (hex), React
- **Backend (próximo):** API Routes + WebSocket (salas, sync tokens)
- **Auth:** demo cookie hoje → Clerk/Auth0 + DB
- **Deploy:** Vercel (`web/` como root)

## Mesa demo

`/mesa/demo` — grid hex, 2 tokens, PA, caminhada/corrida.

## Papéis

- **Admin** — plataforma, usuários, mundos
- **Mestre** — campanhas, cenas, NPCs
- **Jogador** — personagens, token na mesa
