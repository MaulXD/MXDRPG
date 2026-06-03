# Eldarin — Site (Vercel)

Landing e documentação do sistema Eldarin para Foundry VTT.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Deploy Vercel

1. Crie projeto na Vercel apontando para este diretório (`web/`).
2. Framework: **Next.js** (auto-detect).
3. Build: `npm run build` · Output: padrão Next.js.

Não inclua a pasta `../vinite/` neste deploy — é o pacote Foundry separado.

## Papéis (Admin · Mestre · Jogador)

| Rota | Papel | Nível |
|------|--------|-------|
| `/admin` | Administrador | 100 |
| `/mestre` | Mestre | 50 |
| `/jogador` | Jogador | 10 |

Login demo: `/entrar` — senha `vinite-dev` (env `ELDARIN_DEMO_PASSWORD` no Vercel).

```
lib/auth/          types, roles, permissions, session
middleware.ts      protege /admin, /mestre, /jogador
app/api/auth/      login, logout, me
```

Admin herda acesso às rotas de Mestre e Jogador via `roleAtLeast`.

## Estrutura

| Pasta | Uso |
|-------|-----|
| `app/` | Rotas públicas + portais |
| `lib/auth/` | RBAC |
| `components/portal/` | Shell dos painéis |
| `app/globals.css` | Tokens glass + neon |
