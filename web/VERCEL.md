# Vercel — MXDRPG

## Configuração recomendada (copie exatamente)

| Campo | Valor |
|-------|--------|
| **Root Directory** | `web` ← **preferido** |
| **Framework Preset** | Next.js |
| **Build Command** | *(vazio — usa `web/vercel.json`)* |
| **Install Command** | *(vazio)* |
| **Output Directory** | *(vazio — apague `public`; desligue Override)* |
| **Node.js Version** | 20.x |

### Se Root Directory ficar vazio (raiz do repo)

O `vercel.json` na **raiz** roda `cd web && npm ci` e `next build` dentro de `web/`.  
Mesmo assim, no dashboard: **Framework = Next.js**, **Output Directory vazio**.

Após mudar settings: **Redeploy** e marque **Clear Build Cache** (remove `package-lock.json` fantasma na raiz).

Salve → **Deployments** → **Redeploy** (desmarque cache).

### Erro `No Output Directory named "public"`

Isso significa preset **Other** (ou override) com saída `public`. O app é **Next.js**, não site estático.

1. **Framework Preset:** Next.js (não Other).
2. **Output Directory:** campo **vazio** — desligue o toggle “Override” se estiver ligado.
3. O repo traz `vercel.json` com `"framework": "nextjs"` e `"outputDirectory": null` para forçar isso no deploy.

Há `vercel.json` na **raiz** (monorepo) e em **`web/`** (se Root Directory = `web`). Use **só um** cenário:

| Root Directory no dashboard | Arquivo que manda |
|-----------------------------|-----------------|
| *(vazio)* | `vercel.json` na raiz do repo |
| `web` | `web/vercel.json` |

## Por que dava 404?

1. **Output Directory = `public`** → build estático errado.
2. **Root Directory vazio** com app só em `web/` → Vercel não acha `app/`.
3. **Root Directory = `web`** mas pasta `web/` vazia (após mover app pra raiz) → deploy vazio.

Hoje o código Next está **dentro de `web/`** de novo.

## Teste

```
/api/health  →  {"ok":true,"app":"eldarin-vtt"}
/entrar
/painel
```

## Erro `public` no build

Apague **Output Directory** no dashboard (override off).
