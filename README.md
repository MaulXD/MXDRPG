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

Login demo: `/entrar` — `jogador@vinite.local` ou `mestre@vinite.local` · senha **`vinite-dev`**.

Mesa de teste: [http://localhost:3000/mesa/demo](http://localhost:3000/mesa/demo)

## Deploy na Vercel

1. Importe o repositório `MaulXD/MXDRPG`.
2. **Root Directory:** `web` (obrigatório).
3. Framework: Next.js (detectado automaticamente).
4. Variável opcional: `ELDARIN_DEMO_PASSWORD=vinite-dev`

Se a raiz do projeto na Vercel for `/` (padrão), o build falha — não há `package.json` na raiz.

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `web/` | VTT Eldarin (Next.js 15) |
| `vinite/` | Sistema Foundry VTT (instalar separado) |
| `livros/` | Livro do Jogador / Mestre, PDFs, guias |

## Git

Branch principal: `main` — [github.com/MaulXD/MXDRPG](https://github.com/MaulXD/MXDRPG)

`node_modules` e `.next` não vão para o Git (`.gitignore`). Após clone, sempre `npm install` dentro de `web/`.
