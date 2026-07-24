# Guia seguro para Claude editar o MXDRPG

**Objetivo:** permitir que Claude (ou outro assistente) altere arquivos **sem quebrar** VTT, combate, auth, persistência ou UX já acordada.

**Leitura obrigatória antes de qualquer mudança:**

1. Este arquivo (`docs/CLAUDE-CODIGO-SEGURO.md`) — regras e checklist
2. `docs/CLAUDE-PROJETO.md` — arquitetura, domínio, glossário
3. Arquivos **vizinhos** ao que vai ser editado (estilo, padrões, imports)

**Como o usuário deve invocar o assistente:**

```
Leia docs/CLAUDE-CODIGO-SEGURO.md e docs/CLAUDE-PROJETO.md antes de editar.
Siga o checklist. Mudanças mínimas. Não faça commit/push sem eu pedir.
Tarefa: [descreva]
```

---

## 1. Fluxo obrigatório (antes → durante → depois)

### Antes de editar

| Passo | Ação |
|-------|------|
| 1 | Entender **escopo exato** do pedido — não expandir para refatoração |
| 2 | Localizar **um** ponto de entrada (rota, handler, componente) |
| 3 | Ler quem **chama** e quem é **chamado** pelo arquivo |
| 4 | Verificar se a área é **verde**, **amarela** ou **vermelha** (seção 2) |
| 5 | Se tocar regras de jogo → ler trecho em `livros/` ou `docs/VTT-ACOES-PA-AREAS.md` |

### Durante a edição

- **Diff mínimo** — só o necessário para o pedido
- **Reutilizar** funções e componentes existentes; não duplicar lógica
- **PT-BR** em textos de UI
- Imports com alias `@/`
- `"use client"` só onde já há hooks/browser APIs
- `server-only` em módulos que acessam DB ou estado global de sala
- **Nunca** usar atributo HTML `title` para tooltips — usar `.site-tooltip`, `.foundry-icon-bar__tooltip`, etc. (`NativeTitleBlockScript` remove `title` nativo)

### Depois de editar (validação)

```bash
npm run build          # obrigatório se mexeu em TS/TSX
npm run lint           # se alterou vários arquivos
npm run test           # se mexeu em PA, movimento ou grid
npm run sync:data:check # só se mexeu em livros/ ou scripts de dados
```

**Smoke manual rápido (quando relevante):**

| Área alterada | Testar em |
|---------------|-----------|
| Site / layout | `/`, `/mesas`, `/eldarin` |
| VTT | `/mesa/[roomId]` — mover token, combate, chat |
| Ficha | `/personagem/[id]` ou wizard em aventura |
| API sala | DevTools → rede ao agir na mesa |
| Fundos animados | site qualquer; preview em `/backgrounds-preview.html` |

---

## 2. Mapa de risco por área

### Verde — relativamente seguro

| Pasta / arquivo | Pode mexer se… |
|-----------------|----------------|
| `app/**/page.tsx` (conteúdo, metadata) | Usar `pageMetadata()` de `lib/site-metadata.ts` |
| `components/home/`, `components/rpg/` | Só UI do hub |
| `components/backgrounds/*.tsx` | Só animação visual; não alterar `lib/backgrounds.ts` sem motivo |
| `components/ui/SiteTooltipLayer.tsx` | Manter padrão de tooltip customizado |
| `public/brand/**` | Assets estáticos |
| `docs/**` | Documentação |
| CSS de página (`*.css` em `components/`) | Sem remover variáveis de `globals.css` |

### Amarelo — cuidado; ler código relacionado

| Área | Risco | O que preservar |
|------|-------|-----------------|
| `components/vtt/MesaWorkspace.tsx` | Layout mesa quebra fácil | Permissões GM/jogador, convite, sync |
| `components/vtt/Battlefield.tsx` | Canvas + zoom + grid | `lib/vtt/grid-layout.ts` — mapa e grid no mesmo transform |
| `lib/adventure/` | Convites e membros | `memberIds` **só cresce**; não remover jogador |
| `lib/room/settings.ts` | Settings mestre | `coverUrl`, HP monstro, ping |
| `lib/rpg/systems.ts` | Capas e hub RPG | `resolveMesaCoverSrc()`, IDs `eldarin`/`dnd`/`vtm` |
| `lib/site-metadata.ts` | Títulos das abas | Formato `MXDRPG — [página]` |
| `app/layout.tsx` | Shell global | `BackgroundWrapper`, `SiteTabTitle`, providers |

### Vermelho — não alterar sem pedido explícito e leitura profunda

| Área | Por quê |
|------|---------|
| `lib/combat/**`, `lib/room/handlers/combat-*` | PA, dano, áreas — bugs P0 |
| `lib/combat/pa-*.ts` | Acúmulo, teto 11, Atordoado |
| `lib/vtt/grid-*.ts`, `movement-pa.ts` | Movimento e custo PA |
| `lib/room/store.ts` + `handlers/*` | Única via correta de mutar sala |
| `lib/room/snapshot-for-viewer.ts` | Jogador não vê HP de monstro sem setting |
| `data/compendiums/*.json` | **Gerados** — usar `npm run sync:data` |
| `livros/**` | Fonte de regras — exige sync após editar |
| `archive/web/`, `vinite/` (como produto) | Legado / referência |
| `middleware.ts`, `lib/auth/**` | Sessão, Clerk, permissões |
| `scripts/db/**` | Schema e migrações Postgres |

---

## 3. Decisões de produto que não podem regredir

| Tema | Regra atual |
|------|-------------|
| **Marca do site** | Nome **MXDRPG** (`lib/site-metadata.ts`, `app/manifest.ts`) |
| **Sistema de regras** | **Eldarin v4** no VTT ativo; fantasia clássica e VTM no hub = **Em breve** |
| **Tema** | Só **escuro** — sem alternância claro/escuro |
| **Fundos animados** | Em todo o site **exceto** grade VTT em `/mesa/:roomId` |
| **Rotação de fundos** | A cada **hora** (`lib/backgrounds.ts`) |
| **Capas de mesa** | Padrão por `rpgSystemId`; mapa **não** é thumb de capa |
| **Tooltips** | Customizados no DOM — **nunca** `title` nativo para UX |
| **Barra ícones mesa** | Só ícones + tooltip `.foundry-icon-bar__tooltip` |
| **Grid do mapa** | Alinhado à imagem de piso (`lib/vtt/grid-layout.ts`) |
| **Mestre vs jogador** | `ownerId` da aventura/sala — **sem** role global mestre/jogador |
| **Git** | **Não** commit/push até o usuário pedir |

---

## 4. Onde mexer por tipo de tarefa

| Pedido do usuário | Começar aqui | Não duplicar em |
|-------------------|--------------|-----------------|
| Texto / cor de página | `app/.../page.tsx`, CSS do componente | `globals.css` inteiro |
| Título da aba | `pageMetadata()` na page + `STATIC_TAB_TITLES` se rota estática | string solta `"Eldarin…"` |
| Card do hub `/mesas` | `lib/rpg/systems.ts`, `RpgSystemCoverCard.tsx` | |
| Lista de mesas Eldarin | `AdventureLobby.tsx`, `AdventureTableCard.tsx`, `list-enrich.ts` | |
| Capa na VTT | `RoomCoverBackdrop.tsx`, `resolveMesaCoverSrc()` | `scene.mapImageUrl` |
| Novo fundo animado | `components/backgrounds/Novo.tsx` + registrar em `BackgroundWrapper.tsx` e `lib/backgrounds.ts` | |
| Ajuste visual de fundo | Só o `.tsx` do fundo + `BACKGROUND_ANIM_SPEED` em `canvas-loop.ts` | |
| Regra de combate | `lib/combat/` + handler + teste | lógica só no cliente |
| Campo na ficha | `lib/character/types.ts`, wizard, API characters | |
| Nova rota API sala | `app/api/room/...` chama handler em `lib/room/handlers/` | lógica inline na route |
| Dado de magia/arma | `livros/` → `npm run sync:data` | JSON manual |

---

## 5. Arquivos “hub” — alterou um, verifique estes

### Fundos animados

```
lib/backgrounds.ts
components/backgrounds/BackgroundWrapper.tsx
components/backgrounds/BackgroundScript.tsx
components/backgrounds/animated-background-site.css
public/backgrounds-preview.html   (preview manual, opcional)
```

### Títulos e PWA

```
lib/site-metadata.ts
app/layout.tsx
app/manifest.ts
components/ui/SiteTitleFixScript.tsx
components/ui/SiteTabTitle.tsx
```

### Hub de mesas e capas

```
lib/rpg/systems.ts
lib/adventure/list-enrich.ts
components/rpg/RpgSystemCoverCard.tsx
components/adventure/AdventureTableCard.tsx
public/brand/rpg/*.png
```

### Mesa VTT (mapa + tokens)

```
components/vtt/Battlefield.tsx
lib/vtt/grid-layout.ts
lib/vtt/draw-battlefield.ts
hooks/vtt/useGridCanvas.ts
hooks/useRoomSync.ts
```

### Tooltips

```
components/ui/NativeTitleBlockScript.tsx
components/ui/SiteTooltipLayer.tsx
lib/ui/site-tooltip.ts
```

---

## 6. Erros comuns que quebram o produto

| Erro | Consequência | Evitar |
|------|--------------|--------|
| Mutar `room` direto na route API | Estado inconsistente, sem revision | Usar `lib/room/handlers` + `persistRoom` |
| PA só no cliente | Trapaça / dessync | Servidor em `lib/combat/` |
| `title="..."` em botões | Tooltip nativo do SO volta | `data-site-tip` ou componente de tooltip |
| Fundo animado em `/mesa/:id` | Atrapalha VTT | `shouldShowAnimatedBackground()` |
| Editar JSON do compêndio | IDs e sync quebram | `npm run sync:data` |
| Refatorar `MesaWorkspace` inteiro | Regressão de UX | Mudança localizada |
| Remover de `memberIds` | Modelo Roll20 violado | Só adicionar membros |
| Commit automático | Usuário não queria | Só quando pedir explicitamente |
| `git push --force` em `main` | Perda de histórico | Proibido salvo pedido explícito |

---

## 7. Template de resposta do assistente

Ao concluir uma tarefa, reportar:

1. **O que mudou** (1–3 frases)
2. **Arquivos tocados** (lista)
3. **O que foi validado** (`build`, lint, teste manual)
4. **O que não foi alterado** de propósito (escopo)
5. **Como o usuário testa** (URLs ou passos)

Se não rodou `npm run build`, dizer por quê.

---

## 8. Prompt curto (copiar no Claude)

```
Projeto: MXDRPG (Next.js 15, TypeScript, VTT Eldarin v4).
Leia: docs/CLAUDE-CODIGO-SEGURO.md + docs/CLAUDE-PROJETO.md.
Regras: diff mínimo; PA/combate só no servidor; sem title nativo; sem commit sem pedir;
npm run build antes de concluir.
Tarefa: …
```

---

## 9. Documentação relacionada

| Arquivo | Quando ler |
|---------|------------|
| [CLAUDE-PROJETO.md](./CLAUDE-PROJETO.md) | Contexto completo do repositório |
| [API-SALA.md](./API-SALA.md) | Endpoints da mesa |
| [VTT-ACOES-PA-AREAS.md](./VTT-ACOES-PA-AREAS.md) | Combate e PA |
| [UX-MESA-E-RAIL.md](./UX-MESA-E-RAIL.md) | Layout da mesa |
| [DADOS-E-REGRAS.md](./DADOS-E-REGRAS.md) | Livros → JSON |
| [PERSISTENCIA.md](./PERSISTENCIA.md) | Postgres |

---

*Atualizado: 2026-06-13 — MXDRPG, fundos horários, capas por sistema, tooltips custom, grid alinhado.*
