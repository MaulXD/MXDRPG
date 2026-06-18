# Estrutura do repositório MXDRPG

```
RPG/                          ← raiz = app Next.js (deploy Docker / Contabo)
├── app/                      → rotas (mesa, ficha, auth, API)
├── components/               → UI + VTT
├── lib/                      → regras, sala, combate, auth
├── data/                     → JSON gerados
├── livros/                   → fonte das regras
├── scripts/                  → geradores
├── vinite/                   → módulo Foundry (referência / vídeo paridade)
├── archive/web/              → legado (não editar)
└── docs/ELDARIN-SITE-JOGAVEL.md → roteiro do VTT web
```

## Deploy

| Parte | Onde |
|-------|------|
| Raiz (`package.json`) | Docker — imagem Next.js (`Dockerfile`) |
| `vinite/` | Foundry local ou release ZIP (fora do deploy web) |

## Site — papéis

- **Admin** (`/admin`)
- **Mestre** — dono da sala, convite, spawn
- **Jogador** — ficha + mesa

Auth atual: Clerk + demo (`lib/auth/`). Persistência: Postgres (`docs/POSTGRES.md`).
