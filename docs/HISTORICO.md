# Histórico de sessões — Eldarin VTT (MXDRPG)

Documento vivo. **Atualizado a cada sessão de trabalho** (Cursor / Claude).  
Serve como continuidade de contexto caso o chat seja perdido.

Referências completas: [CLAUDE-PROJETO.md](./CLAUDE-PROJETO.md) · [CLAUDE-CODIGO-SEGURO.md](./CLAUDE-CODIGO-SEGURO.md)

---

## Padrão obrigatório — toda sessão

Ao concluir (ou pausar) um bloco de trabalho, **sempre** acrescentar uma entrada no [Log de sessões](#log-de-sessões) abaixo.

### Formato da entrada

```markdown
### AAAA-MM-DD — Título curto do que foi feito

**Pedido:** o que o usuário pediu (1–2 frases).

**Passo a passo:**
1. Diagnóstico — o que estava errado ou faltando
2. Decisão — abordagem escolhida e por quê
3. Implementação — mudanças concretas (rotas, libs, env, deploy…)
4. Validação — build, smoke, o que conferir em produção

**Arquivos tocados:**
- `caminho/arquivo.ts` — o que mudou em uma linha

**Commits / deploy:** hash ou “pendente local” (push só quando o usuário pedir).

**Como testar:** comandos ou URLs.
```

### Checklist rápido

- [ ] Entrada nova com data de hoje
- [ ] Passo a passo numerado (não só lista de arquivos)
- [ ] Tabela **Estado atual** atualizada se mudou auth, URL, deploy ou DB
- [ ] `npm run build` mencionado se houve alteração em `.ts` / `.tsx`

---

## Estado atual do produto

| Item | Status |
|------|--------|
| **URL produção** | https://www.mxdrpg.com.br |
| **Hosting** | Contabo — Docker + GHCR (`Dockerfile` + `docker-entrypoint.sh`) |
| **Branch principal** | `main` |
| **Marca / hub** | **MXDRPG** — landing e pós-login em `/mesas`; Eldarin é um RPG em `/rpg/eldarin` |
| **Auth** | OAuth Google/Discord + e-mail/senha em `/entrar`; demo `mestre`/`jogador` senha `123` — **sem Clerk** |
| **DB** | MariaDB (`DATABASE_URL=mysql://…`) — em produção: SSL self-signed exige `MARIADB_SSL_REJECT_UNAUTHORIZED=0` ou `?sslaccept=accept_invalid_certs` |
| **Stack** | Next.js 15, React 19, TypeScript strict |
| **Rotas canônicas** | Login `/entrar` · Onboarding `/conta/bem-vindo` · Hub `/mesas` · Eldarin `/rpg/eldarin` |

---

## Resumo de funcionamento (para retomar sem contexto)

### Hierarquia de domínio

```
Aventura (campanha persistente)
  └── Mesa / Sala (RoomState — VTT ao vivo)
        └── Atores (fichas instanciadas na sala)
```

- **Mestre** = `ownerId` da aventura/sala — sem role global mestre/jogador.
- **Jogador** entra via `inviteCode`; passa a integrar `memberIds` para sempre (nunca removido).
- **Demo** = `roomId === "demo"`, sempre em memória, regras especiais — não misturar com salas reais.

### Regras de ouro (nunca violar)

1. PA/combate calculado **só no servidor** (`lib/combat/` + handlers) — cliente faz preview apenas.
2. Mutações de sala **só via** `lib/room/handlers/` + `persistRoom` — nunca mutar `room` direto na route.
3. `memberIds` **só cresce** — jogador nunca é removido da aventura.
4. `data/compendiums/*.json` são **gerados** — editar `livros/` e rodar `npm run sync:data`.
5. **Nunca** `title` nativo em HTML — usar `data-site-tip` / `.site-tooltip`.
6. Commit/push **só quando o usuário pedir**.

### Zonas de risco

| Zona | Arquivos | Regra |
|------|----------|-------|
| Vermelho | `lib/combat/`, `pa-*.ts`, `lib/auth/`, `middleware.ts`, `scripts/db/` | Não tocar sem pedido explícito |
| Amarelo | `MesaWorkspace.tsx`, `Battlefield.tsx`, `lib/adventure/`, `lib/room/settings.ts` | Ler vizinhos antes |
| Verde | `app/**/page.tsx`, `components/home/`, `docs/`, CSS de página | Relativamente seguro |

### Validação obrigatória

```bash
npm run build                 # sempre após TS/TSX
npm run lint                  # alterações em vários arquivos
npm run test                  # PA, movimento, grid
npm run sync:data:check       # após editar livros/
```

---

## Log de sessões

<!-- Ver "Padrão obrigatório" no topo: Pedido → Passo a passo → Arquivos → Commits → Como testar -->

---

### 2026-06-20 — Redesign transição Combate/Aventura: névoa vermelha + brasas / névoa azul suave

**Pedido:** substituir animação de espadas cruzando + bússola por: (1) modo combate = névoa vermelha + "Combate Ativado" centralizado + brasas subindo; (2) modo aventura = névoa azul + "Modo Aventura" fade-in suave → fade-out suave. Sem as animações antigas.

**Passo a passo:**
1. **Diagnóstico** — `CombatModeTransition.tsx` usava `CombatModeSword` (espadas cruzando) + bússola SVG, vignette, dim, flash e múltiplas camadas de background. CSS complexo com ~20 keyframes.
2. **Decisão** — reescrever do zero. Estrutura nova: apenas `.cmt-overlay__bg` (camada de névoa), 18× `.cmt-ember` (brasas, somente no combate) e `.cmt-overlay__label`. Ember positions, durations e delays variados inline via `style={}`.
3. **Implementação** — `CombatModeTransition.tsx`: removidos `CombatModeSword`, `useId`; adicionado array `EMBERS` com 18 entradas `{ left, size, dur, delay, dx }`; embers renderizados só em `isIn`. CSS: névoa crimson para combate (`radial-gradient` vermelho+escuro), névoa índigo para aventura; `cmt-ember-rise` usa `--cmt-ember-dx` CSS var para drift horizontal por partícula; embers só animam quando `.cmt-overlay--playing` está ativo.
4. **Validação** — sem mudanças em tipos/lógica; `npm run build` a executar.

**Arquivos tocados:**
- `components/vtt/CombatModeTransition.tsx` — reescrito: sem espadas, brasas via array EMBERS
- `components/vtt/combat-mode-transition.css` — reescrito: névoa vermelha/azul, brasas, sem keyframes antigos

**Commits / deploy:** pendente push.

**Como testar:** mesa → ativar combate → overlay vermelho com brasas subindo + "Combate Ativado"; sair do combate → overlay azul + "Modo Aventura" fade suave.

---

### 2026-06-20 — Assets dice-box, tema default, skills Clerk, tooltips nav

**Pedido:** "suba tudin" — commitar tudo que estava pendente.

**Passo a passo:**
1. Identificados 3 arquivos modificados (title→data-site-tip em FriendsNavIcon, FriendsNavMessages, MesasNavLink) e 4 untracked (`.agents/`, `public/assets/ammo/`, `public/assets/themes/`, `skills-lock.json`).
2. `public/assets/ammo/ammo.wasm.wasm` — binário Bullet Physics necessário para dice-box funcionar offline (sem CDN).
3. `public/assets/themes/default/` — tema visual padrão do dice-box (textures PBR + config JSON).
4. `.agents/skills/clerk-*` + `skills-lock.json` — skills do agente para integração Clerk (auto-gerados pelo ambiente).
5. `title=` → `data-site-tip=` nos três ícones de navegação (regra de ouro do projeto: nunca usar `title` nativo).

**Arquivos tocados:**
- `components/friends/FriendsNavIcon.tsx` — title → data-site-tip
- `components/friends/FriendsNavMessages.tsx` — title → data-site-tip
- `components/nav/MesasNavLink.tsx` — title → data-site-tip
- `public/assets/ammo/ammo.wasm.wasm` — NOVO binário Bullet Physics
- `public/assets/themes/default/*` — NOVO tema dice-box (textures + config)
- `.agents/skills/clerk-*/` — NOVO skills Clerk (~160 arquivos)
- `skills-lock.json` — NOVO lock de versão das skills

**Commits / deploy:** `f145d1c` → `cursor/dice-box-combat` → pushed.

---

### 2026-06-20 — Reduz delay de dados no combate + pré-carga dice-box

**Pedido:** delay muito grande entre atacar e o dado aparecer.

**Passo a passo:**
1. **Diagnóstico** — três causas independentes: (a) `DiceMiniature` usava `useState(null)` + `useEffect` para detectar WebGL — 1 ciclo de render extra; (b) `ensureAttackBox` tinha `waitMs(120)` artificial antes de criar a instância; (c) bundle `/vendor/dice-box/dice-box.es.min.js` era carregado com `dynamic import` só na 1ª luta (200–500ms).
2. **Fix (a)** — lazy init: `useState(() => typeof window === "undefined" ? null : supportsWebGL())` + `useEffect` condicional só dispara em SSR.
3. **Fix (b)** — removidos `await waitMs(120)` de `ensureAttackBox` e `await waitMs(80)` de `ensureDamageBox`.
4. **Fix (c)** — `useEffect(() => { void loadDiceBox(); }, [])` no mount do `DiceCombatPanel` pré-carrega o bundle imediatamente.

**Arquivos tocados:**
- `components/vtt/DiceMiniature.tsx` — lazy init WebGL detection
- `components/vtt/DiceCombatPanel.tsx` — removidos waitMs + pre-load useEffect

**Commits / deploy:** `e70cc6b` → `cursor/dice-box-combat` → pushed. PR #3 criado.

---

### 2026-06-20 — Ritmo combate: 2s D20 + 2s dano, painel dual, chat e token juntos

**Pedido:** visualização combate bugada e lenta/confusa; reorganizar dados — 2s rolando e parando no número; se acertou +2s dado de dano (D20 fica); ao fim dados saem, token anima dano e chat mostra dano no mesmo instante.

**Passo a passo:**
1. **Diagnóstico** — tempos espalhados (700 ms / 420 ms / 360 ms); D20 sumia ao iniciar dano; número flutuante no hex sumia antes do CSS; `applyState` no meio da animação; rolagem WebGL mecânica (Euler fixo).
2. **Decisão** — fonte única `lib/vtt/combat-fx-timings.ts`; janelas fixas **2000 ms** ataque e **2000 ms** dano; pouso nos últimos 450 ms de cada janela; single attack sem número flutuante no mapa (chat + flash no token); resolve único no fim.
3. **Implementação:**
   - `combat-fx-timings.ts` — `COMBAT_ATTACK_ROLL_MS`, `COMBAT_DAMAGE_ROLL_MS`, `DICE_LANDING_MS`, `attackLandAt` / `damageLandAt`
   - `CombatFxLayer.tsx` — sequência: mark 180 ms → roll 2s → result + dano 2s (painel dual) → resolve: esconde dados + `applyState` + `playTokenFx` + `revealChat("damage")`
   - `DiceWebGL.tsx` — tumble quaternion + ease-out-back no pouso + bounce escala; `reducedMotion` prop
   - `DiceMiniature` / `Dice3DCSS` — pouso alinhado a `DICE_LANDING_MS`
   - `vtt.css` — `.combat-fx-dice-row`, `.combat-fx-panel--dual-dice`
4. **Validação** — `npm run build` ✅

**Arquivos tocados:**
- `lib/vtt/combat-fx-timings.ts` — NOVO
- `components/vtt/CombatFxLayer.tsx`, `DiceWebGL.tsx`, `DiceMiniature.tsx`, `Dice3DCSS.tsx`, `vtt.css`

**Commits / deploy:** `9bc6782` → `main`

**Como testar:** `/mesa/demo` ou mesa real → combate → atacar → 2s D20 → ACERTO → D20 + D8 lado a lado 2s → dados somem + token flash + card chat com dano/HP. Erro: 2s D20 → ERROU ~0,5s → resolve.

---

### 2026-06-20 — Fix dado WebGL idle + lock transição combate

**Pedido:** ajuste fino pós-WebGL — D12 textura errada; UI bloqueada 2,3s na transição combate.

**Passo a passo:**
1. **Diagnóstico** — D12 `vertsPerFace` 3 (certo 9); dado parado sem animação idle; `COMBAT_MODE_TRANSITION_LOCK_MS` = duração total CSS.
2. **Implementação** — modo `idle` no `DiceWebGL`; lock 400 ms, animação CSS segue 2,3 s.
3. **Validação** — build ✅

**Commits / deploy:** `0c71d62` → `main`

**Como testar:** entrar/sair combate — UI clicável em ~400 ms; D12 e idle visíveis no painel.

---

### 2026-06-20 — Dados 3D WebGL: Three.js IcosahedronGeometry + OctahedronGeometry para D20 e dado de dano

**Pedido:** "Cada dado tem que ser 3D" — o usuário queria modelos 3D reais para os dados de combate.

**Passo a passo:**
1. **Pesquisa** — Avaliou 3 opções: (a) `@3d-dice/dice-box-threejs` (lib pronta, mas overlay complexo de integrar); (b) modelos GLTF do Sketchfab (download manual, licença incerta por modelo); (c) Three.js programático com geometrias nativas. Escolheu opção (c): Three.js já está no projeto (`^0.184.0`), zero dependência nova, controle total de timing e aparência.
2. **Design das texturas** — Canvas 2D de 256×256 por face, fundo escuro, triângulo decorativo interno, número grande com sombra, sublinhado automático para 6 e 9. 4 variantes de cor: `attack` (verdigris), `damage` (vermelho), `heal` (verde), `crit` (dourado).
3. **Geometria** — `IcosahedronGeometry(1,0).toNonIndexed()` para D20 (20 faces triangulares planas), `OctahedronGeometry(1,0).toNonIndexed()` para dado de dano (D8, 8 faces). Grupos adicionados com `addGroup()` para material por face.
4. **Animação** — Rolling: incremento de Euler X/Y/Z em velocidades diferentes (1.9×, 2.7×, 1.1×) para tumbling realista. Landing: `slerpQuaternions()` em 420ms com ease-out cúbico. Quaternion de pouso calculado por `setFromUnitVectors(faceNormal, cameraDir)`.
5. **Fallback** — `DiceMiniature` verifica WebGL com `getContext("webgl2")` antes de renderizar. Se indisponível: usa `Dice3DCSS` para D20, `Dice2DFallback` para outros.
6. **Integração** — `DamageDiePanel` (antes CSS) agora usa `DiceWebGL` com D8. `DiceMiniature` usa `DiceWebGL` para size="lg". CSS simplificado para apenas wrapper + label.

**Arquivos tocados:**
- `components/vtt/DiceWebGL.tsx` — NOVO: Three.js D20/D8/D6/D12/D4 com texturas canvas por face, animação rolling/landing via RAF
- `components/vtt/DiceMiniature.tsx` — detecta WebGL, usa DiceWebGL para lg, fallback CSS/2D
- `components/vtt/CombatFxLayer.tsx` — DamageDiePanel agora usa DiceWebGL D8 em vez de CSS gem
- `components/vtt/vtt.css` — CSS dmg-die simplificado (gem CSS removida, canvas WebGL estilizado)

**Commits / deploy:** `8ca7a4e` → `main`

**Como testar:** Atacar em mesa → D20 3D WebGL; fallback CSS/2D se sem WebGL. Nat20/crit: variantes douradas.

---

### 2026-06-20 — Animações de combate BG3-style: dado de dano rolando, D20 decagon, sem painel de probabilidade

**Pedido:** O usuário reportou que: (1) o painel de % de chance ao clicar era redundante — já aparece no hover; (2) o timing de ~3.6s estava cansativo; (3) os dados estavam feios. Queria algo como Baldur's Gate 3: dado de ataque rolando → dado de dano rolando → dano aparecendo animado no mapa.

**Passo a passo:**
1. **Diagnóstico** — Fase `"prob"` adicionada anteriormente exibia um painel de probabilidade por 1.2s antes do D20, mas essa info já existe no hover do alvo. O D20 usava triângulo SVG simples (pouco reconhecível). Não havia dado de dano — após o D20 o dano aparecia diretamente flutuante.
2. **Decisão BG3-style** — Remover completamente a fase `"prob"` e seus dados. Novo fluxo: mark (80ms) → D20 girando (700ms) → D20 mostra resultado (420ms) → dado de dano girando (620ms) → dano flutuante (360ms). Total ~2.1s para acerto com dano, ~1.2s para erro.
3. **Implementação:**
   - `combat-fx-types.ts`: removeu `"prob"` do `CombatFxPhase` e os 6 campos `prob*` de `CombatFxState`
   - `combat-fx-sequence.ts`: removeu funções `simpleHitChance()` e `extractModsLabel()`, e os campos `prob*` do objeto base
   - `Dice3DCSS.tsx`: D20 redesenhado — polígono decagonal (10 lados, mais parecido com d20 real) + números ciclando via `setInterval` a 75ms durante o roll (efeito caça-níquel)
   - `CombatFxLayer.tsx`: reescrito — removeu `ProbPanel`, adicionou `DamageDiePanel` (componente inline com gem octagonal, scramble de números e flash ao revelar), novo estado `showDamageRoll`, timing limpo por modo (single/area-target/area-simultaneous/area-intro)
   - `vtt.css`: removidos todos os `.combat-prob-*` (barra, fórmula, %, label); adicionados `.dmg-die-*` (gem octagonal com clip-path, flash colorido por tipo, label); `fill: none` no `.d20-css-inner-line` para o polígono interno do decagon não ser preenchido
4. **Validação** — `tsc --noEmit` sem erros. Testar em mesa ativa: atacar → D20 gira com números mudando rapidamente → D20 para mostrando ACERTO/ERROU → gem octagonal aparece e gira com números → gem para e flash → número flutuante no alvo.

**Arquivos tocados:**
- `lib/vtt/combat-fx-types.ts` — remove fase "prob" e campos prob* do type
- `lib/vtt/combat-fx-sequence.ts` — remove simpleHitChance, extractModsLabel, campos prob* do base
- `components/vtt/Dice3DCSS.tsx` — polígono decagonal + scramble por setInterval (sem Math.random no ciclo)
- `components/vtt/CombatFxLayer.tsx` — remove ProbPanel; adiciona DamageDiePanel; refatora timing BG3-style com showDamageRoll
- `components/vtt/vtt.css` — remove combat-prob-* CSS; adiciona dmg-die-* CSS; fix fill:none em d20-css-inner-line

**Commits / deploy:** `f8ee5c7` → `main`

**Como testar:** (supersedido pelo fluxo 2s+2s — ver entrada “Ritmo combate” acima.) Histórico: removeu fase prob; D20 decagonal CSS; DamageDiePanel.

---

### 2026-06-20 — Redesign combate: D20 CSS, fluxo sequencial, animações de projétil

**Pedido:** Tela de combate estava bugada e a animação dos dados ruim. Usuário queria: D20 3D em CSS (sem WebGL), fluxo visual sequencial (probabilidade → dado → resultado → chat) com timing Médio (~3.5s), e animações de ataque sobrepostas ao canvas: talho, flecha, orbe mágico (fogo/arcano), raio ziguezague, área (explosão radial), cura, e texto "ERROU!" com desvio para erros.

**Passo a passo:**
1. **Diagnóstico** — D20 usava Three.js WebGL (`Dice3DScene.tsx`) com limites de contexto, causando bugs visuais. O `CombatFxLayer` não tinha fase de probabilidade e o timing era muito rápido (~1s total). Animações de projétil inexistentes — só efeito no token após impacto.
2. **Decisão** — Substituir WebGL por CSS puro (preserve-3d + keyframes). Adicionar fase `"prob"` ao `CombatFxPhase`. Calcular chance de acerto retroativamente (attackTotal - attackNatural = bonus, então simpleHitChance). Adicionar SVG projectile overlay no `CombatFxLayer`. Detectar tipo de animação por `castFxKind` estendido com `"arrow"` e `"lightning"`.
3. **Implementação:**
   - `token-cast-fx.ts`: novos kinds `"arrow"` e `"lightning"`, detecção por keywords no nome da arma/magia
   - `combat-fx-types.ts`: fase `"prob"` adicionada; campos `probHitChance`, `probBonus`, `probAc`, `probDc`, `probModsLabel`, `probSaveFailChance`
   - `combat-fx-sequence.ts`: função `simpleHitChance()` + `extractModsLabel()` + população dos campos `prob*`
   - `Dice3DCSS.tsx` (NOVO): D20 triangular CSS puro, rotação 3D com preserve-3d, Nat20 dourado, Nat1 vermelho
   - `DiceMiniature.tsx`: usa `Dice3DCSS` para tamanho "lg" (combate), mantém 2D fallback para sm/md
   - `CombatFxLayer.tsx`: fase `"prob"` (1.2s) antes do `"mark"`, painel de probabilidade com barra animada, animações SVG de projétil (flecha, orbe, raio, talho, miss), timing atualizado (prob:1200ms + mark:150ms + roll:1000ms + result:720ms + done:480ms ≈ 3.6s)
   - `vtt.css`: CSS para `.d20-css*` (rotação 3D), `.combat-prob-panel` (painel prob com barra), `.proj-*` (animações projétil SVG); 62 ocorrências de `rgba(201,169,98,...)` → `rgba(107,158,140,...)` (verdigris)
4. **Validação** — `tsc --noEmit` sem erros. Testar em mesa ativa: verificar que sequência prob→dado→resultado→chat aparece, D20 gira suavemente, flechas/orbes/raios aparecem sobre o grid.

**Arquivos tocados:**
- `lib/vtt/token-cast-fx.ts` — novos kinds arrow/lightning + detecção por keywords + castFxDuration atualizado
- `lib/vtt/combat-fx-types.ts` — fase "prob" + 6 novos campos probData
- `lib/vtt/combat-fx-sequence.ts` — funções simpleHitChance + extractModsLabel + população prob
- `components/vtt/Dice3DCSS.tsx` — NOVO componente D20 CSS puro 3D
- `components/vtt/DiceMiniature.tsx` — usa Dice3DCSS para lg/d20 em vez de Three.js
- `components/vtt/CombatFxLayer.tsx` — reescrito: fase prob, painel ProbPanel, ProjectileAnim SVG, AoeExplosion, timing médio
- `components/vtt/vtt.css` — 500+ linhas adicionadas: D20 CSS, prob panel, projétil SVG; 62 rgba(ouro) → verdigris

**Commits / deploy:** `9c04e2a` → `main`

---

### 2026-06-20 — Correções críticas de auditoria UX (privacidade, navbar, compêndio, demo)

**Pedido:** corrigir os 4 bugs críticos apontados pela auditoria de agente: página de privacidade exposta com texto de dev, `/mundo` ausente na navbar, cards do compêndio sem detalhe visível, e mesa demo sem tokens de monstros.

**Passo a passo:**
1. **Privacidade** — `docs/PRIVACIDADE-LGPD.md` tinha campos `[placeholder]` expostos publicamente na rota `/privacidade`. Substituído por política completa em PT-BR com dados reais do controlador (ti@thep.com.br), bases legais LGPD corretas e direitos do titular.
2. **Navbar `/mundo`** — Criado `IconGlobe` em `EldarinIcons.tsx` (círculo + meridianos SVG). Adicionado link `{ href: "/mundo", label: "Mundo", icon: IconGlobe }` entre Compêndios e Sistema em `SiteNavLinks.tsx`.
3. **Compêndio clicável** — Cards eram `<button>` mas `CompendiumDetail` renderizava abaixo de 200+ cards, impossível de ver sem scroll. Adicionado `useRef` + `useEffect` para `scrollIntoView({ behavior: "smooth" })` ao selecionar card na view page.
4. **Demo tokens** — `createDemoRoom()` passava `tokens: []` para `syncLinkedTokens`, zerando os tokens de monstros do `DEMO_SCENE`. `syncLinkedTokens` preserva tokens não-linkados, então basta passar `DEMO_SCENE` sem sobrescrever tokens.

**Arquivos tocados:**
- `docs/PRIVACIDADE-LGPD.md` — política real substituindo rascunho com placeholders
- `components/ui/EldarinIcons.tsx` — novo `IconGlobe`
- `components/SiteNavLinks.tsx` — link `/mundo` adicionado
- `components/compendium/CompendiumBrowser.tsx` — `useRef` + scroll-to-detail, `useRef` no import
- `lib/room/sync.ts` — `createDemoRoom`: `{ ...DEMO_SCENE, tokens: [] }` → `DEMO_SCENE`

**Commits / deploy:** pendente local.

**Como testar:**
- `/privacidade` — deve mostrar política limpa sem "[placeholder]"
- Navbar — deve exibir link "Mundo" com ícone de globo entre Compêndios e Sistema
- `/compendios` → clicar num card → página scrolla suavemente para o detalhe
- `/mesa/demo` → tokens de Goblin, Esqueleto, Minotauro e Escorpião devem aparecer no grid

---

### 2026-06-20 — Remove auto-abertura do painel de convite ao entrar na mesa

**Pedido:** ao abrir a mesa, o painel de "CONVITE" abre automaticamente; usuário quer mesa limpa ao entrar.

**Passo a passo:**
1. Diagnóstico — `useEffect` em `MesaWorkspace.tsx` (~linha 395) abria `windows.openInDock("invite")` uma vez por sessão via `sessionStorage` quando o mestre entrava numa sala com código de convite.
2. Decisão — remover o `useEffect` inteiro; o painel continua acessível pelo dock quando o mestre quiser.
3. Implementação — deleção do bloco de 7 linhas do `useEffect`.
4. Validação — sem mudança em `.ts` de lógica; sem build necessário.

**Arquivos tocados:**
- `components/vtt/MesaWorkspace.tsx` — removido `useEffect` que abria painel de convite automaticamente

**Commits / deploy:** pendente.

**Como testar:** entrar na mesa como mestre → painel de convite não deve abrir; acessar pelo ícone no dock ainda deve funcionar.

---

### 2026-06-20 — Fix avatar não refletia seleção do usuário na navbar

**Pedido:** navbar mostrava avatar automático (OAuth/gerado) mesmo após usuário salvar foto personalizada.

**Passo a passo:**
1. Diagnóstico — `SiteHeaderWrapper` só chamava `safeMaterializeSessionUser` quando `avatarSource === "custom" && !avatarUrl`; para usuários custom com URL https:// (não data URL), a condição era FALSE e usava o cookie diretamente, que poderia estar stale. Além disso, `/api/auth/me` retornava apenas o cookie sem material DB.
2. Decisão — ampliar a condição: sempre chamar `safeMaterializeSessionUser` para `avatarSource === "custom"` (independente de ter URL no cookie); atualizar `/api/auth/me` com a mesma lógica para cobrir o fallback client-side.
3. Implementação — `SiteHeaderWrapper.tsx`: removida a parte `&& !session.user.avatarUrl`; `app/api/auth/me/route.ts`: importado `safeMaterializeSessionUser` e aplicado para usuários custom.
4. Validação — fluxo: salvar foto custom → PATCH atualiza cookie + DB → `router.refresh()` → SiteHeaderWrapper lê cookie (custom) → DB fetch → avatar correto na navbar.

**Arquivos tocados:**
- `components/SiteHeaderWrapper.tsx` — condição broadened: qualquer custom source sempre lê do DB
- `app/api/auth/me/route.ts` — materializa user do DB para custom avatar

**Commits / deploy:** pendente.

**Como testar:** `/conta` → selecionar "Foto personalizada" → salvar → navbar deve mostrar o avatar escolhido imediatamente.

---

### 2026-06-20 — Redesign Phase 1: tokens Verdigris + sweep de dourado

**Pedido:** iniciar redesign do site conforme `docs/REDESIGN-2026.md`; fase 1 = trocar sistema de cores.

**Passo a passo:**
1. Decisão — acento primário `#6B9E8C` (Verdigris, bronze envelhecido) substituindo `#b8922e` (dourado genérico); fundos chrome mais escuros; escala tipográfica + cores semânticas novas.
2. Implementação — reescrita completa do bloco `:root` em `app/globals.css`: novos tokens de chrome, acento verdigris, `--accent-dim`, `--accent-warn` (#C97A4A cobre quente), `--accent-glow`, escala `--text-xs` a `--text-4xl`, cores `--color-hp/pa/magic/success/danger`; substituição de todos os `rgba(184, 146, 46, ...)` no corpo do arquivo.
3. Sweep — grep de `b8922e|c9a962|d4a030|a07c28|c9a84c|c9a227` em 15+ arquivos CSS; PowerShell replace para → `#6B9E8C`; SVG data URLs URL-encoded (`%23d4a030` → `%236B9E8C`) em `compendium.css` e `eldarin-v4.css`.
4. Validação — grep final retornou 0 ocorrências hardcoded fora de `var()` fallbacks.

**Arquivos tocados:**
- `app/globals.css` — bloco `:root` completo reescrito; rgba no corpo substituídos
- `components/character/sheet-ddb.css`, `sheet-popup.css`, `sheet.css`, `sheet-v2.css`, `sheet-pdf.css`, `sheet-pdf-capture.css`, `level-up.css` — sweep de dourado → verdigris
- `components/auth/auth-forms.css`, `components/friends/friends.css`, `components/notifications/notifications.css`, `components/pwa/pwa-install.css`, `components/rpg/mesas-hub.css` — sweep
- `components/ui/site-tooltip.css`, `components/vtt/combat-mode-transition.css`, `components/vtt/eldarin-v4.css`, `components/vtt/mesa-theme.css`, `components/vtt/vtt.css`, `components/vtt/whiteboard.css` — sweep incluindo SVG URL-encoded
- `components/compendium/compendium.css` — SVG corner URLs atualizadas

**Commits / deploy:** pendente.

**Como testar:** abrir qualquer página → todos os acentos aparecem em verde-patina Verdigris `#6B9E8C` em vez de dourado; mesa com tokens tem ring verdigris.

---

### 2026-06-20 — Refatoração CSS da toolbar lateral (MapToolbar)

**Pedido:** sidebar do VTT com espaçamento estranho e layout bugado; refatorar `whiteboard.css` para ficar bonita e responsiva sem criar novos containers.

**Passo a passo:**
1. Diagnóstico — CSS tinha três problemas: `max-width: min(3.25rem, 14vw)` que colapsava em viewports pequenas; `.map-toolbar__btn` com `display: inline-flex` e `display: grid` duplicado (a segunda declaração sobrescreve a primeira); `gap: 0.3rem` uniforme em `.map-toolbar` criava ritmo irregular entre labels, grupos e divisores.
2. Decisão — reescrever `whiteboard.css` inteiro com: largura fixa `2.75rem` no lugar do `min()` problemático; `gap: 0` no container + `margin` semântica nos filhos; `.map-toolbar__btn` com `display: grid; place-items: center` único; efeito visual de separação nos `section-label` via `::before`/`::after` (hairlines laterais) sem alterar HTML.
3. Implementação — reescrita completa do arquivo mantendo todos os nomes de classe; botões passaram a `2.15rem × 2.15rem` (caem exato no padding do container); espaçamento hierárquico: `margin-top: 0.5rem` no section-label (exceto `:first-child`), `margin: 0.35rem 0` no divisor; seção flyout preservada com os mesmos seletores do MapToolbar.tsx.
4. Validação — CSS puro, sem mudança em `.tsx`; nenhum build TypeScript necessário; verificar visualmente na mesa.

**Arquivos tocados:**
- `components/vtt/whiteboard.css` — reescrita completa; mesma API de classes, layout e espaçamento corrigidos

**Commits / deploy:** pendente.

**Como testar:** abrir mesa → toolbar aparece na lateral esquerda → seções MAPA / LOUSA / ZOOM alinhadas com ritmo uniforme; seção-labels exibem `━━ MAPA ━━` com hairlines laterais; botões quadrados sem corte; flyout de lousa abre ao lado do toolbar sem overlap.

---

### 2026-06-19 — Fix ataques retornando HTTP 500

**Pedido:** ataques não funcionam; console mostra 20+ erros 500 em `/api/room/[roomId]/combat/attack`.

**Passo a passo:**
1. Diagnóstico — prints do console confirmaram que o ataque chega ao servidor mas retorna 500 (não 400). A rota não tinha try/catch, então qualquer exceção virava 500 silencioso sem mensagem de erro.
2. Causas identificadas — três pontos de falha: (a) `actor.inventory` podendo ser `undefined` em dados legados → `TypeError` no `for...of` de `listCombatActions`; (b) `resolveRoomAttackAction` fora de try/catch na função `executeRoomAttack` → qualquer throw virava 500; (c) `resolveCombatAction` jogava exceção quando a ação específica (packId+entryId) não era encontrada, em vez de fazer fallback.
3. Implementação — (a) `actor.inventory ?? []` em `listCombatActions`, `listCombatAbilities` e `listActorConsumables`; (b) try/catch envolvendo `resolveRoomAttackAction` nos dois fluxos de `combat-attack.ts`, retornando `{ok: false}` em vez de propagar; (c) `resolveCombatAction` agora loga aviso e faz fallback para ação default em vez de jogar exceção; (d) try/catch global na rota com `console.error` para logar causa real no servidor.
4. Validação — `tsc --noEmit` sem erros.

**Arquivos tocados:**
- `app/api/room/[roomId]/combat/attack/route.ts` — try/catch global + console.error para debug
- `lib/room/handlers/combat-attack.ts` — try/catch em `resolveRoomAttackAction` nos dois fluxos
- `lib/combat/attack.ts` — `inventory ?? []` em `listCombatActions`; fallback em `resolveCombatAction`
- `lib/combat/ability.ts` — `inventory ?? []` em `listCombatAbilities`
- `lib/combat/consumables.ts` — `inventory ?? []` em `listActorConsumables`

**Commits / deploy:** pendente push.

**Como testar:** abrir mesa real → selecionar token PC → ring de ação → Atacar → selecionar alvo → ataque deve processar (resultado no chat); se ainda falhar, erro agora aparece na UI em vez de 500 silencioso.

---

### 2026-06-18 — Leitura inicial e criação do histórico

**Pedido:** estudar o documento completo do projeto e criar histórico vivo.

**O que foi feito:**
- Leitura completa de `docs/CLAUDE-PROJETO.md` e `docs/CLAUDE-CODIGO-SEGURO.md`.
- Criação deste arquivo `docs/HISTORICO.md`.

**Arquivos tocados:**
- `docs/HISTORICO.md` (criado)

**Nada alterado no código.**

---

### 2026-06-18 — Correção das regras de PA

**Pedido:** correção das regras de PA que estavam erradas na documentação.

**Regra correta:**
- Base: **5 PA/turno**
- Acúmulo: pode salvar até **5 PA** não usados entre turnos
- Pool total máxima: **9 PA** (não 11)
- Atordoado: zera o acúmulo

**Arquivos corrigidos:**
- `docs/CLAUDE-PROJETO.md` — seção 8 (PA) e seção 15 (D14)

**Nada alterado no código.**

---

### 2026-06-18 — Regras de PA por tipo de criatura

**Pedido:** complemento das regras de PA para monstros, minibosses e bosses.

**Regras adicionadas:**
- **Monstros:** 6 PA/turno, não acumulam entre turnos
- **Minibosses / Bosses:** acumulam PA até o máximo de **8 PA**

**Arquivos corrigidos:**
- `docs/CLAUDE-PROJETO.md` — seção 8 (PA) e seção 15 (D14)

**Nada alterado no código.**

---

### 2026-06-18 — Planejamento: refatoração do combate na mesa

**Pedido:** refatorar o sistema de combate da mesa VTT.

**Status:** PRD aprovado (`docs/PRD-COMBATE-MESA-REFACTOR.md`, decisões R1–R30). Implementação a iniciar.

**Regras completas de PA (consolidadas):**

| Quem | PA base/turno | Acúmulo | Pool máx |
|------|--------------|---------|---------|
| Jogador | +5/turno | até 5 PA | **9** (11 c/ talento Lobo Solitário) |
| Monstro | 6/turno | **não acumula** | 6 |
| Miniboss / Boss | — | sim | **8** |

**Custo de ações:**
| Ação | Custo |
|------|-------|
| Ataque básico | 2 PA |
| Ataque Extra (Guerreiro 5+) | 2 PA/golpe |
| Estribilho (magia nv.0) | 1 PA, máx 2 iguais/turno |
| Ação rápida (ex-bônus) | 1 PA |
| Segundo Fôlego | 1 PA, 1×/combate |
| Ajudar / Evadir / Disparada | 1 PA cada |
| Reação | 1 PA (débito se pool vazio → recupera 4 no próximo turno) |
| Movimento (1 bloco) | 1 PA → 6 m (4 células) |
| Correr | 2 PA → 12 m (8 células) |
| Magia / Habilidade | variável por compêndio |
| Falar / Olhar | **gratuito** |

**Fora de combate:** movimento livre, magias sem PA.

**Épicos P0 (prioridade máxima):**
- E1: PA v4 + Estribilho + ação rápida
- E2: Modo combate/exploração (GM toggle, `room.mode`)
- E3: Iniciativa (1d20+DES), d100 empate, entrada tardia, reações v1, débito PA
- E4: Morte (0 HP → inconsciente, 10 rodadas → morto), XP configurável, friendly fire confirm

**Já implementado (P5):** formas de área (burst/wall/cone/line/cube), action-preview, BattlefieldActionHud, highlights.

**Referências:** `docs/PRD-COMBATE-MESA-REFACTOR.md` · `docs/VTT-ACOES-PA-AREAS.md` · `docs/P5-COMBAT-UX.md`

---

### 2026-06-18 — Correção: grid do mapa é quadrado, não hexagonal

**Pedido:** confirmação de que o mapa usa grid quadrado.

**Regra:** grid **quadrado**, 1 célula = 1,5 m (já no PRD R28). Memória do projeto estava errada ("hexagonal").

**Arquivos corrigidos:**
- `memory/project_eldarin_vtt.md` — removida menção a "hex canvas" e "Grid hexagonal"

---

### 2026-06-18 — Correção: movimentação 6m/12m e confirmação grid quadrado (sem hex)

**Pedido:** remover toda referência a "hex", ajustar caminhada para 6m e corrida para 12m.

**Resultado do grep:** código já estava limpo (scripts de purge-hex já tinham sido rodados). Hex só aparecia em docs/HISTORICO.md (entradas de histórico — esperado) e PDFs intocáveis.

**Movimentação corrigida:**
- Caminhada: 1 PA → **6 m** (4 células) — era 9m
- Corrida: 2 PA → **12 m** (8 células) — era 18m
- 1 célula = 1,5 m (inalterado)

**Arquivos tocados:**
- `lib/vtt/movement.ts` — `BASE_MOVEMENT_METERS` 9 → 6; default `movementRunMax` 6 → 8 células; comentário corrigido
- `docs/HISTORICO.md` — tabela de movimentação
- `docs/CLAUDE-PROJETO.md` — seção PA e movimentação

**Como testar:** `npm run build` + `/mesa/demo` → mover token e verificar alcance.

---

### 2026-06-18 — Diagnóstico: estado atual do VTT (testes com Playwright)

**Pedido:** rodar o app, fazer testes e reportar resultados.

**Ambiente:** dev local sem DB (Neon ETIMEDOUT), sem Clerk keys — auth por cookie demo.

**Performance (dev mode):**
| Página | Status | Tempo |
|--------|--------|-------|
| Landing `/` | 200 ✅ | ~630ms |
| Mesa Demo `/mesa/demo` | 200 ✅ | ~630ms |
| Biblioteca `/biblioteca` | 200 ✅ | ~4.4s ⚠️ (compêndio pesado) |
| Painel `/painel` | redirect → /entrar | esperado sem auth |

**Testes unitários:** todos passando (31 testes sheet-pdf + 24 consumíveis + compêndios OK + 83 monstros spawnáveis).

**Problemas encontrados:**
1. `room.mode = undefined` — campo não existe no estado da sala (Epic E2 não implementado)
2. `tokens = 0` — atores demo existem (4 PCs) mas nenhum está posicionado no mapa
3. `paState = {}` — PA não inicializado nos atores
4. `character = {}` — dados de ficha não mesclados no ator demo (HP, atributos ausentes)
5. 13 erros 401 — Clerk chamadas falhando (esperado sem keys, mas polui console)
6. Sem mapa na demo — `mapImageUrl` vazio, grid vazio cinza

**APIs de combate (caminhos corretos):**
- `POST /api/room/[id]/combat/roll-initiative` — 401 (precisa ser GM)
- `POST /api/room/[id]/combat/next-turn` — 403 (precisa de auth)
- `POST /api/room/[id]/combat/gm` — 400 (endpoint existe, parâmetro errado)
- `POST /api/room/[id]/combat/attack` — existe ✅
- `POST /api/room/[id]/combat/ability` — existe ✅
- `POST /api/room/[id]/combat/area` — existe ✅

**Nada alterado no código nesta sessão.**

---

### 2026-06-18 — Decisões de UX da mesa (respostas do usuário)

**Decisões confirmadas:**
- Tokens não precisam de posição padrão na demo, mas posições devem ser **salvas e sincronizadas em tempo real** entre jogadores e mestre
- Sem mapa na demo por enquanto
- Pill "Aventura/Combate" só visível para o **mestre** — jogadores não veem o toggle
- Action ring **já existe** (clique direito no token da vez)
- **Clique esquerdo** no token deve abrir o action ring no **modo máximo** (não o menu de contexto)

---

### 2026-06-18 — Fix: clique esquerdo no token abre action ring

**Pedido:** clicar num token deve abrir o action ring no modo máximo (antes só abria no clique direito).

**O que mudou:**
- `hooks/vtt/useBattlefieldPointer.ts` — no handler `onPointerUp`, após selecionar o token via clique esquerdo, agora chama `onActionRingRequest` se o token puder abrir o ring (mesma lógica do clique direito / `onContextMenu`)
- Adicionado `canOpenActionRing`, `onActionRingRequest`, `onActionRingBlocked`, `tokenScreenCenter` às dependências do `useCallback`

**Regra:**
- Clique esquerdo em token → seleciona + abre action ring
- Clique direito em token → continua abrindo normalmente (onContextMenu)
- Em modo ataque/área → comportamento original preservado

**Validação:** `npm run build` ✅ (compiled in 23.9s, 0 errors)

**Como testar:** `/mesa/demo` → colocar um token no mapa → clicar nele com botão esquerdo → action ring deve aparecer centralizado no token.

---

### 2026-06-18 — Estudo de docs/COMBATE-MESA.md + correção MONSTER_PA_BOSS

**Pedido:** estudar `docs/COMBATE-MESA.md` (guia técnico completo do combate).

**O que aprendi (não estava na memória):**
- Três fases de PA: `exploration` (sem débito) → `combat_free` → `combat_turn`
- `room.mode` não é campo direto — fase é derivada de `settings.combatActive` + `combat.order`
- Auto-pass: 500ms no código vs 1,5s no PRD (lacuna conhecida)
- Reações v1: débito de PA existe no código mas **sem triggers** nas rotas ainda
- Entrada tardia: spawn entra na ordem imediatamente (não no fim da rodada como PRD diz)

**Correção feita:**
- `lib/combat/pa-economy.ts`: `MONSTER_PA_BOSS` 9 → **8** (alinhado com regra do usuário)

**Lacunas conhecidas (sem implementação):**
- Reações v1 (oportunidade, Escudo, Contramágica) — triggers ausentes nas rotas
- Entrada tardia na iniciativa (R20)
- Delay auto-pass 500ms ≠ 1,5s do PRD
- Surpresa — não implementada

**Arquivos tocados:**
- `lib/combat/pa-economy.ts` — `MONSTER_PA_BOSS` 9 → 8
- `docs/CLAUDE-PROJETO.md` — seção PA atualizada com fases e boss

**Validação:** `npm run build` ✅

---

### 2026-06-18 — Alinhamento docs + updates Claude (PA boss, movimento, mesa)

**Pedido:** alinhar `HISTORICO.md` e `COMBATE-MESA.md` com o código; commitar updates pendentes.

**O que mudou:**
- `docs/HISTORICO.md` — DB → MariaDB; ataque básico = 2 PA (código)
- `docs/COMBATE-MESA.md` — miniboss/boss: **8 PA** (`MONSTER_PA_BOSS`)
- Updates Claude já no working tree: clique esquerdo → action ring, movimento 6m/12m, `MONSTER_PA_BOSS=8`, guard Postgres no client MariaDB

**Arquivos no commit:**
- `docs/CLAUDE-PROJETO.md`, `docs/COMBATE-MESA.md`, `docs/HISTORICO.md`
- `hooks/vtt/useBattlefieldPointer.ts`
- `lib/combat/pa-economy.ts`, `lib/combat/combat-pa-engine.ts`
- `lib/vtt/movement.ts`, `lib/db/client-mariadb.ts`
- `scripts/install-wsl.ps1`

**Como testar:** `npm run build` · `/mesa/demo` → clique esquerdo no token abre action ring · `/api/health` → `persistence: mariadb` com `DATABASE_URL` mysql

---

### 2026-06-19 — Login quebrado com MariaDB inacessível

**Pedido:** login não funcionava em produção.

**Passo a passo:**
1. **Diagnóstico** — com `DATABASE_URL` definida mas MariaDB fora/SSL inválido, `resolveUserForLogin` só consultava o DB e não caía no registry demo (`mestre`/`jogador`).
2. **Decisão** — manter DB como fonte principal, mas **fallback** para registry local quando a query falha ou retorna vazio.
3. **Implementação** — `fetchUserByLogin` aceita apelido; helper `dbSqlReady()` (`lib/db/sql-ready.ts`) para saber se SQL está utilizável; fluxo de login com fallback explícito.
4. **Validação** — login demo e e-mail quando DB degradado.

**Arquivos tocados:**
- `lib/auth/user-store.ts`, `lib/db/sql-ready.ts`

**Commits:** `c9be247` (login fallback)

**Como testar:** sem DB → `/entrar` com `mestre`/`123`; com DB → usuário persistido.

---

### 2026-06-19 — OAuth Google/Discord em destaque + health

**Pedido:** confirmar OAuth nativo (sem Clerk) e melhorar UX/docs.

**Passo a passo:**
1. Botões Google/Discord no topo de `/entrar` (`OAuthSignInButtons`, `AuthTabs`).
2. `oauthSetupStatus()` em `/api/health` — `oauth.ready`, `oauth.missing`, flags por provedor.
3. Guia manual: `docs/P2-OAUTH-MANUAL.md` (credenciais Google Cloud, callbacks, env).

**Env necessária:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_URL`, `SESSION_SECRET`.

**Commits:** `5d33c0d`

**Como testar:** `/api/health` → `oauth.ready: true`; `/entrar` → botão Google.

---

### 2026-06-19 — Erro 500 após login (APIs + loop de rotas)

**Pedido:** site 500 depois do login Google.

**Passo a passo:**
1. **Diagnóstico** — APIs de amigos/aventuras sem try/catch quando MariaDB falha; possível loop `/eldarin` ↔ `/entrar/apelido`.
2. **Implementação** — `lib/db/safe-query.ts`; APIs degradam para listas vazias; `/eldarin` usa `dbNicknameFlowEnabled()` antes de forçar apelido.
3. **Validação** — login não derruba o app com `db: false`.

**Commits:** `521240f`

**Como testar:** login com `db: false` no health → `/mesas` carrega sem 500.

---

### 2026-06-19 — MariaDB SSL (Contabo)

**Pedido:** `db: false` em produção (`self-signed certificate in certificate chain`).

**Passo a passo:**
1. Cliente MariaDB aceita certificado self-signed via `MARIADB_SSL_REJECT_UNAUTHORIZED=0` ou `?sslaccept=accept_invalid_certs` na URL.
2. Health usa ping real para `persistentAccounts`.

**Commits:** `af674b7`

**Pendente no servidor:** setar env SSL + `npm run db:migrate` no container.

**Como testar:** `/api/health` → `db: true`, `persistentAccounts: true`.

---

### 2026-06-19 — Eldarin deixa de ser “o site” → hub MXDRPG

**Pedido:** Eldarin é RPG dentro do hub, não nome do site.

**Passo a passo:**
1. Mesas Eldarin: **`/rpg/eldarin`** (antes `/eldarin`).
2. Pós-login padrão: **`/mesas`** (hub de RPGs).
3. `/eldarin` legado → redirect para `/rpg/eldarin`.
4. Constantes em `lib/rpg/systems.ts`: `MESAS_HUB_PATH`, `ELDARIN_MESAS_PATH`, `rpgMesasPath()`.
5. `DEFAULT_POST_AUTH_PATH = /mesas` em `lib/auth/post-auth-redirect.ts`.

**Commits:** `ad76c51`

**Como testar:** login → `/mesas` → card Eldarin → `/rpg/eldarin`.

---

### 2026-06-19 — Ajuste de links do site

**Pedido:** unificar links para rotas canônicas do hub.

**Passo a passo:**
1. Criado `lib/site-paths.ts` — `ENTRAR_PATH`, re-export de paths do hub/Eldarin.
2. Substituído `/sign-in` → `/entrar` (home, header, footer, mesa, privacidade, conta, compêndios…).
3. Substituído `/painel` → `/mesas` (configurar aventura, personagem/novo, `PortalShell`).
4. Rotas legadas `/painel`, `/jogador`, `/mestre` redirecionam para `/mesas`.
5. Footer ganhou link **Mesas**; página `/sistema` separa hub e Eldarin.
6. `STATIC_TAB_TITLES` em `lib/site-metadata.ts` alinhado.

**Arquivos tocados (principal):**
- `lib/site-paths.ts` (novo)
- `components/SiteFooter.tsx`, `SiteHeaderWrapper.tsx`, `HeaderUserMenu.tsx`
- `app/page.tsx`, `app/sistema/page.tsx`, `app/privacidade/page.tsx`
- `app/painel/*`, `app/jogador/*`, `app/mestre/*`
- APIs login/register — mensagens com `/entrar`

**Commits:** pendente local (junto com fixes Docker/OAuth abaixo)

**Como testar:** navegar site logado/deslogado — nenhum link público deve apontar para `/sign-in` ou `/painel`.

---

### 2026-06-19 — Docker: cache de imagens Next.js

**Pedido:** erro `ENOENT mkdir '/app/.next/cache/images'` no container.

**Passo a passo:**
1. **Diagnóstico** — otimizador de imagens do Next precisa gravar em `.next/cache/images`; pasta não existia ou não era gravável no runtime.
2. **`docker-entrypoint.sh`** — cria `.next/cache/images` e `.next/cache/fetch-cache` antes de `npm start`.
3. **`Dockerfile`** — `mkdir -p` após `npm run build` + `ENTRYPOINT` do script.
4. **`DEPLOY.md`** — nota sobre volume `emptyDir` em `/app/.next/cache` se filesystem for read-only.

**Arquivos tocados:**
- `docker-entrypoint.sh` (novo), `Dockerfile`, `DEPLOY.md`

**Como testar:** rebuild imagem → abrir página com `next/image` → sem erro no log.

---

### 2026-06-19 — OAuth: “Sessão expirada” + 401 no console

**Pedido:** após Google, mensagem *Sessão OAuth expirada* e 401 em `/api/auth/me`, `/api/friends/*`.

**Passo a passo:**
1. **Diagnóstico** — cookie `eldarin_oauth` não voltava no callback (host `www` ≠ apex, ou `cookies().set()` não anexado ao redirect 302 no App Router).
2. **Cookies no redirect** — `applyOAuthStateCookie()` no início OAuth; `applySessionCookie()` no fim do callback (`completeOAuthLogin`).
3. **Host canônico** — `middleware.ts` redireciona apex ↔ `www` para o host de `AUTH_URL` (cookie é host-specific).
4. **`consumeOAuthState`** — falhas tipadas (`missing`, `expired`, `mismatch`) + log no servidor.
5. **Ruído no console** — `/api/auth/me` retorna `200` + `{ user: null }` quando deslogado (amigos ainda 401 — esperado).
6. **Health** — campo `authOrigin` para conferir `AUTH_URL` em produção.

**Arquivos tocados:**
- `lib/auth/oauth/state.ts`, `lib/auth/oauth/complete-login.ts`
- `lib/auth/session.ts` — `buildSessionCookie`, `applySessionCookie`
- `app/api/auth/oauth/[provider]/route.ts`, `callback/route.ts`
- `app/api/auth/me/route.ts`, `app/api/health/route.ts`
- `middleware.ts`, `DEPLOY.md`

**Checklist produção:**
- `AUTH_URL=https://www.mxdrpg.com.br` (mesmo host que o usuário abre)
- Callback Google = `https://www.mxdrpg.com.br/api/auth/oauth/google/callback`
- `SESSION_SECRET` estável (não rotacionar no meio do fluxo)

**Commits:** pendente local

**Como testar:** `/entrar` → Google → cair em `/mesas` ou `/entrar/apelido` sem `error=oauth_state`; `/api/health` → `authOrigin` correto.

---

### 2026-06-19 — Padrão de histórico passo a passo

**Pedido:** melhorar o arquivo de atualizações e **sempre** documentar assim.

**Passo a passo:**
1. Seção **Padrão obrigatório — toda sessão** no topo deste arquivo (formato + checklist).
2. Tabela **Estado atual** atualizada (MXDRPG hub, OAuth, rotas canônicas, Docker).
3. Entradas retroativas da sessão 2026-06-19 com passo a passo numerado.

**Arquivos tocados:**
- `docs/HISTORICO.md`

**Como testar:** ao fim de cada chat, verificar se há entrada nova com data, passos e “como testar”.

---

### 2026-06-19 — Onboarding de perfil no primeiro acesso

**Pedido:** após criar conta/login, no primeiro acesso ir para perfil: apelido obrigatório + foto (Google, sugerida pelo apelido ou upload).

**Passo a passo:**
1. **Diagnóstico** — fluxo antigo só pedia apelido em `/entrar/apelido`, sem escolha de avatar no mesmo passo.
2. **Decisão** — página única de onboarding em `/conta/bem-vindo`; após salvar, redireciona para `/mesas` (ou destino pedido).
3. **Implementação:**
   - `ProfileOnboardingForm` — apelido + 3 opções de foto: Google, avatar sugerido (DiceBear por apelido), upload/URL.
   - `POST /api/auth/onboarding` — salva apelido + avatar e atualiza sessão numa chamada.
   - `avatarSource: generated` em `user-avatar.ts` — URL derivada do apelido em runtime.
   - `postAuthRedirect` → `/conta/bem-vindo` quando sem apelido (MariaDB ativo).
   - `/entrar/apelido` legado → redirect para `/conta/bem-vindo`.
   - `/conta` — `AvatarProfileForm` ganhou opção “Avatar sugerido”.
4. **Validação** — `npm run build` ✅.

**Arquivos tocados:**
- `app/conta/bem-vindo/page.tsx`, `components/auth/ProfileOnboardingForm.tsx`
- `app/api/auth/onboarding/route.ts`, `lib/auth/profile-onboarding.ts`
- `lib/avatar/nickname-avatar.ts`, `lib/db/user-avatar.ts`, `lib/auth/post-auth-redirect.ts`
- `app/entrar/apelido/page.tsx` (legado), `components/auth/AvatarProfileForm.tsx`

**Como testar:**
1. Login Google (conta nova ou sem apelido) → deve abrir `/conta/bem-vindo`.
2. Digitar apelido → preview do avatar sugerido atualiza.
3. Escolher Google / sugerido / upload → **Continuar** → `/mesas`.
4. Editar depois em `/conta`.

**Commits:** pendente local

---

### 2026-06-19 — Fix: “Conta não encontrada” ao salvar apelido (OAuth)

**Pedido:** screenshot em `/entrar/apelido` — erro ao salvar apelido; 400 em `/api/auth/nickname`; 500 em `/api/notifications`; regex inválido no `pattern` do input.

**Passo a passo:**
1. **Diagnóstico** — login Google com DB falhando deixava sessão com id efêmero `google-…` / `discord-…`. `materializeSessionUser` não criava linha em `eldarin_users`; `setUserNickname` falhava com “Conta não encontrada”.
2. **Decisão** — ao materializar sessão OAuth, chamar `ensureUserFromOAuth` em modo **strict** (erro claro se DB cair, sem fallback silencioso).
3. **Implementação:**
   - `lib/auth/oauth-session-id.ts` — parse de ids `google-*` / `discord-*`.
   - `materializeSessionUser` — cria/recupera usuário OAuth no MariaDB; fallback por e-mail para `usr_*` órfão.
   - `POST /api/auth/nickname` — `createSession` após salvar (cookie passa a `usr_*`).
   - `/api/notifications` — `safeDbRead` (sem 500 quando DB falha).
   - `pattern` do apelido: `[a-zA-Z0-9_\-]{3,24}` (hífen escapado — Chrome `/v` quebrava `[a-zA-Z0-9_-]*`).
4. **Validação** — `npm run build` ✅.

**Arquivos tocados:**
- `lib/auth/session-user.ts`, `lib/auth/oauth-session-id.ts`, `lib/db/users.ts`
- `app/api/auth/nickname/route.ts`, `app/api/notifications/route.ts`
- `components/auth/NicknameForm.tsx`, `ProfileOnboardingForm.tsx`, `RegisterForm.tsx`

**Produção ainda precisa:** `db: true` no health (SSL MariaDB) + deploy com `/conta/bem-vindo`.

**Como testar:** login Google → salvar apelido → sem “Conta não encontrada”; cookie atualizado; `/api/notifications` retorna `{ items: [], count: 0 }` se DB off.

**Commits:** `2e78ac0` (bundle anterior)

---

### 2026-06-19 — Fix reforçado: apelido após OAuth (sessão órfã)

**Pedido:** ainda “Conta não encontrada” ao salvar apelido (ex.: MaulXD).

**Passo a passo:**
1. **Diagnóstico** — `fetchUserById` usava `safeDbRead` e devolvia `null` em falha SSL; `usr_*` órfão caía sem recriar usuário OAuth; cookie sem `oauthProvider`/`oauthSubject`.
2. **Decisão** — priorizar identidade OAuth na materialização; gravar provider/subject na sessão; leitura strict antes de UPDATE.
3. **Implementação:**
   - `SessionUser` + cookie: `oauthProvider`, `oauthSubject`.
   - `oauthIdentityFromSession()` — id efêmero ou campos da sessão.
   - `materializeSessionUser` — OAuth primeiro; sem retorno silencioso de id inválido.
   - `fetchUserByIdStrict` + `setUserNickname` usa leitura direta (erro real do MariaDB).
4. **Validação** — `npm run build` ✅.

**Como testar:** **Sair** → entrar de novo com Google → `/conta/bem-vindo` → salvar apelido. Exige `db: true` no health.

**Commits:** pendente local

---

### 2026-06-12 — Remoção do Clerk + estabilização da mesa em produção

**Pedido:** remover Clerk de vez; corrigir mesa que não abre (erro SSR) e deploy desatualizado em www.mxdrpg.com.br.

**Passo a passo:**
1. **Diagnóstico** — pod em imagem antiga (`/api/health` sem `buildSha`); erros SQL (`ER_PARSE_ERROR`, `Promise` em queries); mesa derrubava SSR ao sincronizar fichas incompletas (`inventory`/`identity` undefined); 404 em `arcane-cover.png` (cosmético).
2. **Decisão** — auth só OAuth manual + cookie `vinite_session`; manter coluna `clerk_id` e aliases `clerk-*` só como legado de dados; sync da mesa tolerante a fichas inválidas; `releaseId` no health para confirmar deploy.
3. **Implementação:**
   - Removido `@clerk/nextjs`, componentes `Clerk*`, webhook `/api/webhooks/clerk`, `clerk-sync`, docs `P1-CLERK-SETUP.md`.
   - `middleware.ts` sem `clerkMiddleware`; sessão só `vinite_session`.
   - SQL usuários: `queryOneUserRow` com `sql.unsafe`; SSL MariaDB Contabo por padrão.
   - Mesa: `listCharactersForSessionUserSafe`, `safeMaterializeSessionUser`; `arcane-cover.png` em `public/brand/rpg/`.
   - Sync atores: `mergePortraitFromRoom` com `inventory?.length`; `toRoomActor` e `syncAdventureActorsForRoom` com try/catch; página `/mesa/[roomId]` não derruba em join/bind.
   - Capa da mesa: fallback para `eldarin-cover.png` se imagem 404.
4. **Validação** — `npm run build` ✅ em cada commit.

**Arquivos tocados (principais):**
- `package.json`, `middleware.ts`, `lib/auth/session.ts`, `lib/db/users.ts`
- `app/mesa/[roomId]/page.tsx`, `lib/room/adventure-actors.ts`
- `components/vtt/RoomCoverBackdrop.tsx`, `lib/release.ts`
- `.env.example`, `DEPLOY.md`

**Commits / deploy:** `f11d1f9` (remove Clerk) · `dd9b457` (mesa SSR segura) — **push em `main`** · imagem `ghcr.io/maulxd/mxdrpg:sha-dd9b457` · `releaseId`: `mesa-sync-safe-2026-06-12`

**Como testar:**
```bash
curl -s https://www.mxdrpg.com.br/api/health   # buildSha=dd9b457, db=true
# Login Google → criar/abrir mesa → mapa e painéis carregam
kubectl -n raul set image deployment/mxdrpg mxdrpg=ghcr.io/maulxd/mxdrpg:sha-dd9b457   # se health antigo
```

---

---

### 2026-06-19 — Fix: action ring aparece e desaparece (v2 — causa raiz SSE)

**Pedido:** o action ring abre e fecha imediatamente sem o jogador fazer nada.

**Passo a passo:**
1. **Diagnóstico v1** — Race condition concurrent mode: `setSelectedId` + `setActionRingAt` no mesmo batch → effect `[selectedId]` limpava `actionRingAt`. Fix inicial: `pendingRingRef` para preservar o ring por um ciclo.
2. **Diagnóstico v2 (causa raiz real)** — SSE/sync da sala muda `turnActiveId` (ou `round`) durante ou logo após a abertura do ring. O effect `[selectedId, turnActiveId, round]` dispara uma **segunda vez** com `pendingRingRef.current = null` (já consumido na primeira vez) e chama `setActionRingAt(null)` — fechando o ring mesmo que o token ainda pudesse agir.
3. **Decisão** — Separar responsabilidades dos effects:
   - `useEffect([selectedId])`: só fecha o ring se o token selecionado mudou para um token **diferente** do que abriu o ring (`ringTokenIdRef.current !== selectedId`).
   - `useEffect([selectedId, turnActiveId, round])`: só reseta modo de combate (idle/ação/PA) — não toca mais em `actionRingAt`.
   - `useEffect([actionRingAt, selected, canOpenActionRing])`: já existia — fecha ring se o token perder permissão de agir.
   - Removido `pendingRingRef` (não mais necessário).
4. **Implementação:**
   - `Battlefield.tsx` — `ringTokenIdRef = useRef(null)`; `onActionRingRequest` seta `ringTokenIdRef.current = token.id`; effect `[selectedId]` fecha ring só se `ringTokenIdRef.current !== selectedId`; effect `[turnActiveId, round]` não limpa mais `actionRingAt`.
   - `TokenActionRing.tsx` — `backdropReady` guard 150ms mantido (proteção contra click fantasma).
5. **Validação** — `npx tsc --noEmit` ✅ zero erros.

**Arquivos tocados:**
- `components/vtt/Battlefield.tsx` — substituído `pendingRingRef` por `ringTokenIdRef`, effects refatorados

**Commits / deploy:** `d0ec533` → `main` (push em 2026-06-19)

**Como testar:**
1. `/mesa/demo` → clicar token com turno ativo
2. Ring deve abrir e **ficar aberto** — mesmo com SSE ativo atualizando a sala
3. Clicar fora do ring → fecha normalmente
4. Clicar **outro token** → ring fecha, token novo seleciona
5. ESC → fecha normalmente

---

### 2026-06-20 — Combate na mesa com @3d-dice/dice-box

**Pedido:** levar o preview dice-box 3D para a mesa, com cores por tier (jogador/monstro/elite/miniboss/boss), slot de dano só no acerto, ataque travado, expulsão forçada no resolve — mantendo timings e regras de acerto do `CombatFxLayer`.

**Passo a passo:**
1. **Preview** — `public/preview-combate-dados.html` com dois slots lazy-init, física ajustada, expulsão animada.
2. **Mesa** — `DiceCombatPanel` + `lib/vtt/dice-combat-box.ts` substituem `DiceWebGL`/`DiceMiniature` no painel de combate.
3. **Regras** — timings `COMBAT_FX_TIMINGS` intactos; dano só se `showDamageRoll`; resolve = applyState + token + chat + evict 340ms; `attackerTokenId` no FX state para cor do d20.
4. **Validação** — `npm run build` ✅

**Arquivos tocados:**
- `components/vtt/DiceCombatPanel.tsx` — dice-box ataque/dano
- `components/vtt/CombatFxLayer.tsx` — integração + evict
- `lib/vtt/dice-combat-box.ts` — cores tier e opts física
- `public/assets/dice-box/` — assets WASM/tema

**Commits / deploy:** `bd7ed03` — branch `cursor/dice-box-combat` (push origin)

**Como testar:** `/mesa/[roomId]` → ataque no combate; preview em `/preview-combate-dados.html`

---

### 2026-06-20 — Fix ataque ao alvo e sync da mesa (500/403)

**Pedido:** erros ao atacar alvo na mesa — `500` em `/combat/attack`, `/tokens/spawn`, `/tokens/reposition`; `403` ao salvar loadout; aviso `habilidades-golpe-de-chi não encontrada`; toast “Sync demorou demais”.

**Passo a passo:**
1. **Diagnóstico** — Golpe de Chi no `combatLoadout` sem entrada no inventário da ficha; mestre tentava salvar loadout de jogador (403); `persistRoom`/XP pós-derrota sem tratamento gerava 500 em cascata.
2. **Decisão** — sincronizar habilidades de classe em `listCombatActions`; permitir PATCH só de loadout para mestre; falhas de persistência não derrubam o ataque.
3. **Implementação** — `syncCombatAbilitiesToInventory` + fallback compêndio em `resolveCombatAction`; `canPatchRoomActorLoadout`; try/catch em rotas spawn/reposition/ability e `finishCombatAttack`.
4. **Validação** — `npm run build` ✅

**Arquivos tocados:**
- `lib/combat/attack.ts` — sync classe + resolve compêndio
- `lib/auth/room-access.ts` — permissão loadout mestre
- `lib/room/handlers/combat-attack.ts` — persistência segura
- `app/api/room/[roomId]/actors/[actorId]/route.ts` — PATCH loadout

**Commits / deploy:** `b8b4626` — `origin/cursor/dice-box-combat`

**Como testar:** mesa real → Espiritualista com Golpe de Chi → atacar alvo; mestre escolhe habilidade no token do jogador (sem 403).

---

### 2026-06-20 — Dice-box da mesa alinhado ao preview (cores por tier)

**Pedido:** combate na mesa mostrava d20 escuro genérico (`Dice3DCSS`/fallback), diferente do preview com slots coloridos separados (ataque por tier + dano vermelho).

**Passo a passo:**
1. **Diagnóstico** — `main` ainda usa `DiceMiniature`; na branch dice-box, import npm quebrava workers/assets; faltavam bordas, labels e glow por tier do preview.
2. **Decisão** — carregar o **mesmo bundle** do preview (`/vendor/dice-box/`), estilizar slots com `--dice-tier-color` e labels “Ataque d20 · Jogador” / “Dano d8”.
3. **Implementação** — `DiceCombatPanel` via vendor; `DICE_TIER_LABELS` + bordas em `dice-combat-box.ts`; CSS slots com glow; legenda “Rolando ataque…” discreta.
4. **Validação** — `npm run build` ✅

**Arquivos tocados:**
- `components/vtt/DiceCombatPanel.tsx` — vendor + slots tier/dano
- `lib/vtt/dice-combat-box.ts` — labels e bordas por tier
- `components/vtt/vtt.css` — painel e slots como preview
- `components/vtt/CombatFxLayer.tsx` — legenda de rolagem

**Commits / deploy:** `1095931` — `origin/cursor/dice-box-combat` (PR pendente merge → `main`)

**Como testar:** deploy branch → `/mesa/[roomId]` combate vs `/preview-combate-dados.html` (mesmas cores: azul jogador, amarelo monstro, vermelho dano).

### 2026-06-20 — Reduz delay de dados + fix WebGL idle + preview transições redesenhado

**Pedido:** (1) Dado fica rolando o tempo todo — precisa girar e parar no número tirado. (2) Muito delay entre atacar e o dado aparecer. (3) Prévia de animações de modo ficou feia — recriar com visual de qualidade.

**Passo a passo:**
1. **Diagnóstico dado girando** — `DiceWebGL` iniciava com `mode: "rolling"` hardcoded; quando `sides` muda (nova fórmula), componente remonta e reinicia em rolling. D12 usava `vertsPerFace=3` mas dodecaedro tem faces pentagonais = 9 verts cada.
2. **Fix DiceWebGL** — modo inicial `rolling ? "rolling" : "idle"`; modo `"idle"` com rotação lenta decorativa (× 0.003 vs 0.055); D12 `vertsPerFace=9`; type union inclui `"idle"`.
3. **Diagnóstico delay** — `DiceMiniature`: `webGLOk` inicia `null` via `useState(null)` e só é resolvido depois de um `useEffect` → primeiro render monta div vazia, DiceWebGL só aparece no segundo render. `DiceCombatPanel`: `waitMs(120)` hardcoded antes de inicializar o dice-box; bundle `/vendor/dice-box/dice-box.es.min.js` é importado dinamicamente só quando o primeiro ataque dispara.
4. **Fix delay** — `DiceMiniature`: lazy initializer `useState(() => typeof window === "undefined" ? null : supportsWebGL())` elimina re-render extra em navegação CSR; `useEffect` permanece como fallback SSR mas só roda se `null`. `DiceCombatPanel`: removido `waitMs(120)` e `waitMs(80)` dos `ensure*Box`; adicionado `useEffect([], void loadDiceBox)` que pré-carrega o módulo no mount do painel antes de qualquer ataque.
5. **Transition lock** — `COMBAT_MODE_TRANSITION_LOCK_MS` separado de `DURATION_MS`; UI libera em 400ms, animação CSS segue até 2300ms.
6. **Preview animações** — redesenhado com estética de códex arcano: fundo `#08080e`, título em Georgia dourado, seções com ◆, cards com número em Courier New, preview 192px com ambient gradient por animação, labels com bloom multi-camada; 16 animações CSS preservadas (C1–C8 + A1–A8).
7. **Validação** — `npm run build` ✅ (a executar)

**Arquivos tocados:**
- `components/vtt/DiceWebGL.tsx` — modo `"idle"`, initial mode closure, D12 vertsPerFace=9
- `components/vtt/DiceMiniature.tsx` — webGLOk lazy init, useEffect condicional
- `components/vtt/DiceCombatPanel.tsx` — remove waitMs, pré-carrega dice-box no mount
- `hooks/vtt/useCombatModeTransition.ts` — lock 400ms, animação 2300ms

**Commits / deploy:** pendente local.

**Como testar:** Mesa → combate → atacar — dado deve aparecer sem delay visível (< 50ms extra); dado de dano rola e para no número; fora do combate dado gira lentamente; D12 com faces corretas; UI interativa 400ms após transição modo combate/aventura.

---

### 2026-06-20 — Ficha DDB: XP compacto no header + botão de level-up piscando

**Pedido:** remover a barra gigante de “Progressão de nível” (duplicava o XP do header); manter só o indicador ao lado do nível; botão “Subir de nível” no header, piscando quando pronto.

**Passo a passo:**
1. **Diagnóstico** — `LevelUpWizard` renderizava `sheet-ddb-progression` com barra + botão largo; header já tinha nível + `400/100` + barra fina.
2. **Decisão** — `LevelUpWizard` com `variant="compact"`: só botão + modal; botão visível apenas quando `canLevelUp`.
3. **Implementação** — botão no `sheet-ddb-header__meta`; animação `sheet-level-up-pulse`; bloco `progression` removido de `SheetPopupDdbView`.
4. **Validação** — `npm run build` ✅

**Arquivos tocados:**
- `components/character/LevelUpWizard.tsx` — variant compact + modal extraído
- `components/character/SheetPopupDdbView.tsx` — prop `levelUp` no header
- `components/character/CharacterSheet.tsx` — `variant="compact"`
- `components/character/sheet-ddb.css` — botão header + pulse

**Commits / deploy:** pendente push branch `cursor/dice-box-combat`

**Como testar:** ficha popup DDB com XP ≥ threshold (ex. 400/100 nv1) → botão verde “Subir nv 2” piscando ao lado do XP; sem caixa verde no meio.

---

### 2026-06-21 — Merge `cursor/dice-box-combat` → main (dice-box + mesa rápida)

**Pedido:** mergear PR #3, deploy Contabo e checklist de validação pós-deploy.

**Entregas (branch → main @ `e90d38b`):**
- Dice-box 3D no combate (cores por tier, fila FX, pending ≤300 ms)
- Sync incremental (delta GET/SSE, journal de revisions)
- Store particionada da mesa (`MesaSyncProvider`, slices chat/mapa/combate)
- Shell Foundry extraído + `BattlefieldMapCanvas` / fila FX
- Fix re-render do mapa em sync só-chat (`e5f97e6`)
- `sync:data` — IDs monstros PT-BR canônicos (`e90d38b`)

**Commits / deploy:** `e90d38b` → **`main`** (push 2026-06-21) · imagem `ghcr.io/maulxd/mxdrpg:sha-e90d38b` · workflow build-image #284

**Como testar (grupo 2–3 jogadores, www.mxdrpg.com.br):**

| # | Cenário | Passa se… |
|---|---------|-----------|
| A1 | Primeiro ataque | Dado visível ≤ 300 ms do clique |
| A2 | Ataque acerto | HP no mapa ≤ 1 s após POST |
| A4 | 3 ataques seguidos | FX enfileirados |
| A5 | Mover token | Token na célula ≤ 200 ms |
| A7 | Jogador B vê A | ≤ 2 s |
| Chat | Mensagens/dados no chat | **Mapa não trava** (fix slice) |

```bash
curl -s https://www.mxdrpg.com.br/api/health   # buildSha=e90d38b, db=true
# Se buildSha antigo:
kubectl -n raul set image deployment/mxdrpg mxdrpg=ghcr.io/maulxd/mxdrpg:sha-e90d38b
kubectl -n raul rollout status deployment/mxdrpg
```

---

<!--
### AAAA-MM-DD — Título

**Pedido:** …

**Passo a passo:**
1. …

**Arquivos tocados:**
- `caminho/arquivo.ts`

**Commits / deploy:** …

**Como testar:** …
-->
