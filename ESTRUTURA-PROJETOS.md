# Estrutura do monorepo local (antes de separar Git)

```
RPG/
├── vinite/          → Repo futuro: sistema Foundry VTT
├── web/             → Repo futuro: site Next.js (Vercel)
├── livros/          → Repo futuro (opcional): regras Markdown
└── FICHA_*.md       → Design docs / referência
```

## Deploy

| Parte | Onde hospeda |
|-------|----------------|
| `web/` | Vercel (Root Directory = `web`) |
| `vinite/` | Foundry: cópia manual ou release ZIP no GitHub |

Nenhum push Git foi feito pelo assistente — você separa quando quiser.

## Site — papéis

- **Admin** (`/admin`) — usuários, mundos, config sistema
- **Mestre** (`/mestre`) — campanhas, cenas, compendiums
- **Jogador** (`/jogador`) — personagens, sessões, fichas

Auth atual: cookie demo (`lib/auth/demo-users.ts`). Produção: trocar por Clerk/Auth0/Neon.
