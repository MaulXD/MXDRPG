# MXDRPG — Eldarin

**Site no ar:** https://www.mxdrpg.com.br  
**Saúde:** https://www.mxdrpg.com.br/api/health  

| Pasta | O quê |
|-------|--------|
| **`app/`, `components/`, `lib/`** | App Next.js (VTT) — deploy via **Docker** (Contabo) |
| **[docs/CLAUDE-PROJETO.md](docs/CLAUDE-PROJETO.md)** | Guia completo para ensinar Claude / outros agentes de IA |
| **[docs/CLAUDE-CODIGO-SEGURO.md](docs/CLAUDE-CODIGO-SEGURO.md)** | **Checklist para editar sem quebrar** — leia antes de mexer no código |
| `livros/` | Regras e lore |
| `vinite/` | Módulo Foundry |
| `archive/web/` | Legado — não editar; app canônico na raiz |
| `docs/ELDARIN-SITE-JOGAVEL.md` | Roteiro técnico e fases do VTT |

## Local

```bash
npm ci
npm run dev
```

http://localhost:3000

**CSS quebrado?** `npm run dev:clean`

## Dados (livros → app)

Depois de editar `livros/`:

```bash
npm run sync:data
npm run sync:data:check
```

Detalhes: [docs/DADOS-E-REGRAS.md](docs/DADOS-E-REGRAS.md)

## Persistência (opcional)

MariaDB: [docs/PERSISTENCIA.md](docs/PERSISTENCIA.md) — `npm run db:setup` → `npm run smoke:p0`. Pré-beta: [docs/P9-READY.md](docs/P9-READY.md).

## Deploy (Contabo)

Imagem Docker + GHCR no push em `main`. Ver [DEPLOY.md](DEPLOY.md).

GitHub: https://github.com/MaulXD/MXDRPG.git
