# Deploy na Vercel (MXDRPG)

## Configuração obrigatória no dashboard

Abra o projeto → **Settings** → **Build and Deployment**:

| Campo | Valor correto |
|-------|----------------|
| **Root Directory** | `web` |
| **Framework Preset** | Next.js |
| **Build Command** | *(vazio — padrão)* |
| **Output Directory** | *(vazio — apague `public` se existir)* |
| **Install Command** | *(vazio — padrão)* |

> Se **Output Directory** = `public`, o build quebra com  
> `No Output Directory named "public" found`.  
> Next.js publica via `.next`, não pasta `public` como output.

## Depois de salvar

**Deployments** → último deploy → **Redeploy**.

## Estrutura

Só `web/package-lock.json` deve existir (não há `package-lock.json` na raiz do repo).

## Variáveis (opcional)

`ELDARIN_DEMO_PASSWORD` = `vinite-dev`
