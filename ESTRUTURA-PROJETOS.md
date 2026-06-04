# Estrutura do repositório MXDRPG

```
RPG/                          ← raiz = app Next.js (deploy Vercel)
├── app/                      → rotas (mesa, ficha, auth, API)
├── components/               → UI + VTT
├── lib/                      → regras, sala, combate, auth
├── data/                     → JSON gerados
├── livros/                   → fonte das regras
├── scripts/                  → geradores
├── vinite/                   → módulo Foundry (referência / vídeo paridade)
├── archive/web/              → legado (não editar)
└── REFATORACAO.md            → plano de refatoração
```

## Deploy

| Parte | Onde |
|-------|------|
| Raiz (`package.json`) | Vercel — Framework Next.js, Root Directory **vazio** |
| `vinite/` | Foundry local ou release ZIP (fora da Vercel) |

## Site — papéis

- **Admin** (`/admin`)
- **Mestre** — dono da sala, convite, spawn
- **Jogador** — ficha + mesa

Auth atual: demo (`lib/auth/`). Produção: fase posterior do [REFATORACAO.md](REFATORACAO.md).
