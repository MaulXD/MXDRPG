# Vercel — Eldarin (MXDRPG)

## Settings (raiz do repo)

| Campo | Valor |
|-------|--------|
| **Root Directory** | *(vazio)* |
| **Framework** | Next.js |
| **Output Directory** | *(vazio — sem `public`)* |
| **Node.js** | 20.x |

`vercel.json` na raiz: `{ "framework": "nextjs" }`

**Redeploy** com **Clear Build Cache**.

## Teste

```
/api/health  →  {"ok":true,"app":"eldarin-vtt"}
```

## Domínios

- `mxdrpg.vercel.app` — projeto deve importar **MaulXD/MXDRPG**
- `drpg.vercel.app` — se mostrar "React App", é outro projeto; reconecte ou use só mxdrpg

## Erro `public`

Framework **Other** + Output `public` → apague override e use **Next.js**.
