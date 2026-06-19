# P2 — OAuth manual (Google / Discord)

> **Caminho oficial** — sem Clerk. Rotas: `/api/auth/oauth/{google|discord}`.

## 1. Variáveis no servidor (Contabo)

```env
AUTH_URL=https://www.mxdrpg.com.br
SESSION_SECRET=<aleatório, mín. 16 caracteres>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
# opcional:
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DATABASE_URL=mysql://...   # recomendado — contas persistem após restart
```

**Rebuild** o container após alterar env.

Diagnóstico: `GET /api/health` → `oauth.ready: true` e `oauth.providers: ["google"]`.  
Se `oauth.missing` aparecer, falta alguma variável acima.

## 2. Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **OAuth consent screen** (External, app name MXDRPG)
2. **Credentials** → **Create credentials** → **OAuth client ID** → **Web application**
3. **Authorized JavaScript origins:** `https://www.mxdrpg.com.br`
4. **Authorized redirect URIs:**  
   `https://www.mxdrpg.com.br/api/auth/oauth/google/callback`
5. Copie **Client ID** e **Client secret** para o servidor

## 3. Discord (opcional)

1. [discord.com/developers/applications](https://discord.com/developers/applications) → New Application
2. OAuth2 → Redirects:  
   `https://www.mxdrpg.com.br/api/auth/oauth/discord/callback`
3. Copie Client ID e Client Secret

## 4. MariaDB

```bash
npm run db:migrate   # colunas oauth_provider, oauth_subject, nickname
```

Sem `DATABASE_URL`: login Google funciona na sessão atual, mas **não persiste** após restart do container.

## 5. Fluxo do usuário

1. `/entrar` → botão **Google** (ou Discord) no topo
2. Callback cria/vincula usuário em `eldarin_users`
3. Primeiro login → `/entrar/apelido` (apelido único no MariaDB)
4. Sessão cookie `vinite_session` (7 dias)

Mesmo e-mail já cadastrado com senha: conta **vincula** ao Google (não duplica).

## 6. Verificação

- [ ] `/api/health` → `oauth.ready: true`
- [ ] `/entrar` mostra botão Google
- [ ] Login Google → redireciona para `/eldarin` ou apelido
- [ ] Linha em `eldarin_users` com `oauth_provider = 'google'`

## 7. Local (.env.local)

```env
AUTH_URL=http://localhost:3000
SESSION_SECRET=dev-secret-min-16-chars
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Redirect local no Google Console: `http://localhost:3000/api/auth/oauth/google/callback`
