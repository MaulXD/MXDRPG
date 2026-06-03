# Vercel — MXDRPG

## Configuração (copie exatamente)

| Campo | Valor |
|-------|--------|
| **Root Directory** | `web` |
| **Framework Preset** | Next.js |
| **Build Command** | *(vazio)* |
| **Install Command** | *(vazio)* |
| **Output Directory** | *(vazio — NUNCA `public`)* |

Salve → **Deployments** → **Redeploy** (desmarque cache).

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
