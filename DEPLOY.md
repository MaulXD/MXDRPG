# Deploy Vercel — Eldarin (MXDRPG)

## Diagnóstico: `drpg.vercel.app` mostra 404 ou "React App"

Se `/api/health` dá **404 NOT_FOUND** ou a home mostra **"React App"** / `create-react-app`, o domínio está ligado a **outro projeto** (CRA estático em `/DRPG/`), **não** a este repositório Next.js.

Este repo é **Next.js em `web/`**. Teste correto após deploy:

```text
GET /api/health  →  {"ok":true,"app":"eldarin-vtt"}
```

## Passo a passo (dashboard Vercel)

### Opção A — Reconfigurar o projeto `drpg` (mantém o domínio)

1. [vercel.com](https://vercel.com) → projeto **drpg** → **Settings** → **Git**
2. **Connect Git Repository** → `MaulXD/MXDRPG` (branch `main`)
3. Se já estiver ligado a outro repo, **Disconnect** e conecte `MXDRPG`
4. **Settings** → **Build and Deployment**:

| Campo | Valor |
|-------|--------|
| Root Directory | `web` |
| Framework Preset | **Next.js** |
| Build Command | *(vazio)* |
| Install Command | *(vazio)* |
| Output Directory | *(vazio — sem `public`, Override desligado)* |

5. **Deployments** → **Redeploy** → marque **Clear Build Cache**
6. Abra o deployment **Ready** e teste a URL que a Vercel mostra (ex. `xxx.vercel.app/api/health`)
7. Só então use `drpg.vercel.app` de novo

### Opção B — Projeto novo (mais simples)

1. **Add New** → **Project** → importar **MXDRPG**
2. Root Directory: **`web`**
3. Deploy → testar `/api/health`
4. **Settings** → **Domains** → adicionar `drpg.vercel.app` (remove do projeto antigo se pedir)

## O que o log de build deve mostrar (certo)

- `npm ci` ou install dentro de `web/`
- `next build` (Next.js 15.x)
- **Sem** erro `No Output Directory named "public"`
- Commit recente (`eed2085` ou mais novo)

## O que indica deploy errado

- Home: **React App**, paths `/DRPG/static/...`
- Build: `npm run build --prefix web` na **raiz** com Framework **Other**
- Output Directory = `public`

## Repositório

- GitHub: https://github.com/MaulXD/MXDRPG.git
- App: pasta `web/`
- Config: `web/vercel.json` (com Root Directory = `web`) ou `vercel.json` na raiz (se Root Directory vazio)
