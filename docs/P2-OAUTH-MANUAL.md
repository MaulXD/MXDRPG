# P2 — OAuth manual (Google / Discord)

> Sem Clerk. Rotas: `/api/auth/oauth/{google|discord}`.

## 1. Variáveis no servidor

```env
AUTH_URL=https://www.mxdrpg.com.br
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

`/api/health` → `oauth.ready: true` quando Google ou Discord estiver configurado.

## 2. Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → APIs → OAuth consent screen
2. Credentials → **OAuth client ID** → Web application
3. **Authorized redirect URIs:**  
   `https://www.mxdrpg.com.br/api/auth/oauth/google/callback`

## 3. Discord Developer Portal

1. [discord.com/developers/applications](https://discord.com/developers/applications) → New Application
2. OAuth2 → Redirects:  
   `https://www.mxdrpg.com.br/api/auth/oauth/discord/callback`
3. Copie Client ID e Client Secret

## 4. Banco

```bash
npm run db:migrate   # migration 017 — oauth_provider, oauth_subject
```

## 5. Fluxo do usuário

1. `/entrar` → botões Google / Discord **ou** e-mail/senha
2. Primeiro login social → `/entrar/apelido` (se Postgres)
3. Sessão cookie `vinite_session` (7 dias)

## 6. Verificação

- [ ] `/entrar` mostra botões quando env está setada
- [ ] Login Google cria linha em `eldarin_users`
- [ ] Mesmo e-mail: conta e-mail existente vincula ao OAuth
