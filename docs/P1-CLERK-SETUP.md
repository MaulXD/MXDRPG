# P1 — Clerk + nickname + LGPD

> Depois de [P0-NEON-SETUP.md](./P0-NEON-SETUP.md). Sem Clerk configurado, o site continua com login demo (cookie `vinite_session`).

## 1. Vercel Marketplace (recomendado)

1. Vercel → projeto **Eldarin RPG** → **Integrations** → **Clerk** → Install.
2. Confirme variáveis provisionadas:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Redeploy.

## 2. URLs no Clerk Dashboard

| Variável | Valor sugerido |
|----------|----------------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/entrar/apelido` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/entrar/apelido` |

Ative provedores **Google** e **Discord** no Clerk. E-mail/senha com recuperação fica no Clerk.

## 3. Webhook (sync Postgres)

1. Clerk → **Webhooks** → endpoint: `https://SEU_DOMINIO/api/webhooks/clerk`
2. Eventos: `user.created`, `user.updated`
3. Copie **Signing Secret** → Vercel env `CLERK_WEBHOOK_SIGNING_SECRET`
4. `npm run db:migrate` (colunas `clerk_id`, `nickname`)

## 4. Login híbrido

| Modo | Quando |
|------|--------|
| Clerk (Google/Discord/e-mail Clerk) | Chaves Clerk definidas |
| E-mail ou **apelido** + senha | `POST /api/auth/login` — Postgres ou JSON local |
| Demo | `mestre` ou `jogador` / senha `123` |

Após primeiro login Clerk, usuário define **apelido** em `/entrar/apelido` (único no Postgres).

## 5. LGPD

- Página pública: `/privacidade` (conteúdo em `docs/PRIVACIDADE-LGPD.md`)
- Exclusão de conta: `DELETE /api/auth/account` (apaga fichas + linha em `eldarin_users` + usuário Clerk se aplicável)

## 6. Local (.env.local)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
DATABASE_URL=postgresql://...
```

## 7. Verificação

- [ ] `/entrar` mostra botões Clerk quando as chaves existem
- [ ] `/sign-in` abre UI Clerk
- [ ] Login demo ainda funciona **sem** chaves Clerk
- [ ] `/painel` pede apelido na primeira vez (com Postgres)
- [ ] `/privacidade` carrega o markdown
- [ ] `npm run db:check` OK após migrate

**Próximo:** [P2-SSE-CONVITE.md](./P2-SSE-CONVITE.md) (feito no código) → P4 wizard.
