# Deploy na Vercel (MXDRPG)

## Configuração obrigatória no dashboard

Abra o projeto → **Settings** → **Build and Deployment**:

| Campo | Valor correto |
|-------|----------------|
| **Root Directory** | `web` |
| **Framework Preset** | Next.js |
| **Build Command** | *(vazio — padrão)* |
| **Output Directory** | *(vazio — apague `public`; desligue **Override** se estiver ligado)* |
| **Install Command** | *(vazio — padrão)* |

> Se **Output Directory** = `public`, o build quebra.  
> O repo usa `vercel.json` com `"use": "@vercel/next"` para forçar deploy Next.js.

### Se o erro `public` continuar

1. **Settings** → **Build and Deployment** → em **Output Directory**, clique para **remover o override** (não pode ficar `public`).
2. Confirme **Root Directory** = `web` (salve de novo).
3. **Deployments** → **Redeploy** (sem cache: desmarque *Use existing Build Cache*).

## Depois de salvar

**Deployments** → último deploy → **Redeploy**.

## Estrutura

Só `web/package-lock.json` deve existir (não há `package-lock.json` na raiz do repo).

## Variáveis (opcional)

`ELDARIN_DEMO_PASSWORD` = `vinite-dev`
