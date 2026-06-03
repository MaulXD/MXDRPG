# MXDRPG — Eldarin / Vinite

Repositório: livros, módulo Foundry (`vinite/`) e **VTT Next.js na raiz**.

## Rodar local

```bash
npm install
npm run dev
```

http://localhost:3000 — `/entrar` — demo `jogador@vinite.local` / `vinite-dev` — `/painel` — `/mesa/demo`

## Deploy Vercel

Ver [`VERCEL.md`](VERCEL.md). **Root Directory vazio** (repo root). Framework **Next.js**. **Output Directory vazio**.

Teste após deploy: `/api/health` → `{"ok":true,"app":"eldarin-vtt"}`

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `app/` | Rotas Next.js |
| `components/` | UI |
| `lib/` | Lógica combate, auth, VTT |
| `data/` | Compêndios JSON |
| `vinite/` | Foundry (separado) |
| `livros/` | Fontes Eldarin |

GitHub: https://github.com/MaulXD/MXDRPG.git
