# Deploy Vercel — MXDRPG

## Configuração (uma vez)

**Project → Settings → Build and Deployment**

| Campo | Valor |
|-------|--------|
| **Root Directory** | `web` |
| **Framework Preset** | Next.js |
| **Build Command** | *(vazio)* |
| **Output Directory** | *(vazio — sem override, sem `public`)* |
| **Install Command** | *(vazio)* |

Clique **Save**.

## Deploy

1. Push no GitHub (`main`)
2. **Deployments** → aguarde **Ready** (verde)
3. Abra a URL do deploy (ex. `mxdrpg-xxx.vercel.app`)

## Testar

- `/` — landing
- `/api/health` — deve retornar `{"ok":true,"app":"eldarin-vtt"}`
- `/entrar` — login

## Erros comuns

### `No Output Directory named "public"`
**Output Directory** no dashboard está `public`. Apague / desligue override. Framework = Next.js.

### `404: NOT_FOUND` na URL do site
Quase sempre **Root Directory não é `web`** (builda repo errado) ou deploy antigo falho.

1. Confirme **Root Directory = `web`**
2. Remova `vercel.json` com `builds` (repo atual não usa)
3. **Redeploy** sem cache
4. Teste `/api/health` na URL do deploy

### `multiple lockfiles`
Só deve existir `web/package-lock.json` (não há lockfile na raiz do repo).
