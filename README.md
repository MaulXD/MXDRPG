# MXDRPG — Eldarin / Vinite

Repositório completo: livros, módulo Foundry (`vinite/`) e **app web** (`web/`).

## Rodar o site (Next.js)

O `package.json` fica em **`web/`**, não na raiz do repositório.

```bash
git clone https://github.com/MaulXD/MXDRPG.git
cd MXDRPG/web
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Contas: `/entrar` — **criar conta** ou login. Demo: `jogador@vinite.local` · senha **`vinite-dev`**.

Painel: [http://localhost:3000/painel](http://localhost:3000/painel) — criar mesa, código convite (Roll20-style). Mestre **só** na mesa que você criou.

Mesa demo pública: [http://localhost:3000/mesa/demo](http://localhost:3000/mesa/demo)

## Deploy na Vercel

### Se aparecer `404: NOT_FOUND` (como na captura)

A Vercel está servindo a **raiz do repo** sem o app Next.js. Corrija assim:

1. [Vercel Dashboard](https://vercel.com) → projeto **MXDRPG** → **Settings** → **General**
2. **Root Directory** → **Edit** → digite `web` → **Save**
3. **Deployments** → último deploy → **⋯** → **Redeploy** (marque *Use existing Build Cache* se quiser)

Alternativa na importação: ao conectar o GitHub, em **Root Directory** clique **Edit** e escolha `web` **antes** do primeiro deploy.

### Configuração recomendada

| Campo | Valor |
|-------|--------|
| Root Directory | `web` |
| Framework | Next.js |
| Build Command | `npm run build` (padrão dentro de `web/`) |
| Install Command | `npm install` |

Variável opcional: `ELDARIN_DEMO_PASSWORD` = `vinite-dev`

Há também `package.json` + `vercel.json` na raiz do repo (workspaces) para monorepo; mesmo assim, **Root Directory = `web`** é o mais confiável.

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `web/` | VTT Eldarin (Next.js 15) |
| `vinite/` | Sistema Foundry VTT (instalar separado) |
| `livros/` | Livro do Jogador / Mestre, PDFs, guias |

## Git

Branch principal: `main` — [github.com/MaulXD/MXDRPG](https://github.com/MaulXD/MXDRPG)

`node_modules` e `.next` não vão para o Git (`.gitignore`). Após clone, sempre `npm install` dentro de `web/`.
