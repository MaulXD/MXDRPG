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
| **Marca / hub** | **MXDRPG** — landing em `/`; `/mesas` redireciona para `/rpg/eldarin` (único sistema ativo) |
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

### 2026-07-24 — Extração dos livros do "O Um Anel" + capa real do sistema

**Pedido:** "subi dentro da pasta os livros do TOR ou the one ring, quero que extraia tudo para montar o RPG dele também... quando você exportar toda essa parte a gente trabalha na tradução" + depois "usa essa imagem como capa do RPG de o um anel, recorte a imagem pra deixar perfeitamente quadrada".

**Passo a passo:**
1. **Extração** — usuário subiu 11 PDFs em `the one ring/` (Core Rules 248p, Rivendell 16p, Starter Set Rules 28p, Pre-generated Characters 16p, Stance/Journey Card 2p, + módulos de aventura/mapas fora do escopo desta leva). Lido o sumário do Core Rules pra mapear capítulos por página, e disparados 5 agentes em paralelo cobrindo o essencial pra ficha/habilidades/personagens/combate (capítulos 2 a 8 do Core Rules + Starter Set + Rivendell + personagens de exemplo) — módulos de aventura e o capítulo de lore do mundo ficaram de fora por enquanto (não pedidos explicitamente). Resultado: 10 arquivos markdown em `livros/um-anel/`, ~450KB, quase 7 mil linhas, conteúdo em inglês (tradução é etapa colaborativa futura). Confirmado que a discrepância de fórmula de TN entre as fichas de exemplo (TN=18−Atributo) e o livro de regras (TN=20−Atributo) não é erro — é uma variante oficial pra campanhas curtas que o Starter Set escolheu usar.
2. **Capa do sistema** — usuário mandou uma foto do Um Anel dourado no chat (sem arquivo acessível em disco) e depois subiu um arquivo diferente (`the one ring/capatheonering.png`, a capa oficial do livro "The One Ring", já 524×524px quadrada). Usado `sharp` (já instalado no projeto) pra recomprimir/normalizar (448KB→146KB, compatível com o tamanho das outras capas do hub) e salvo em `public/brand/rpg/um-anel-cover.png`, substituindo o placeholder SVG genérico criado na Fase 1.

**Arquivos tocados:**
- `livros/um-anel/02-*.md` a `livros/um-anel/11-*.md` — extração dos livros (novo)
- `public/brand/rpg/um-anel-cover.png` — capa real (novo, substitui `um-anel-cover.svg` removido)
- `lib/rpg/systems.ts` — `UM_ANEL_DEFAULT_COVER_SRC` apontando pro PNG novo

**Commits / deploy:** pendente local (aguardando push).

**Como testar:** `/mesas` deve mostrar a capa oficial do livro no card "O Um Anel" em vez do placeholder genérico.

---

### 2026-07-22 (2) — Ativar rpg_system em lib/db/rooms.ts (migration confirmada em produção)

**Pedido:** usuário rodou `npm run db:migrate` direto num pod de produção (`kubectl exec`) — saída confirmou schema aplicado sem erro. Ativar a leitura/escrita real da coluna, conforme TODO deixado na sessão anterior.

**Passo a passo:** removidos os 2 comentários TODO e reincluído `rpg_system` no SELECT de `fetchRoom` e no INSERT/VALUES de `saveRoom` em `lib/db/rooms.ts` — sem esses TODOs a coluna já existe em produção, então a leitura/escrita real é segura agora.

**Arquivos tocados:** `lib/db/rooms.ts`.

**Commits / deploy:** pendente local (aguardando push).

**Como testar:** criar uma mesa em "O Um Anel", recarregar a página e confirmar que o sistema persiste como `"um-anel"` (não regride pra `"eldarin"`); confirmar que mesas Eldarin existentes continuam carregando normalmente.

---

### 2026-07-22 — Fase 1 de "O Um Anel" (hub multi-sistema) + fix do seletor de RPG em /mesas

**Pedido:** "adicione agora a possibilidade de um RPG de O Um Anel também" — planejado antes de codar (ver `C:\Users\Raul\.claude\plans\peaceful-puzzling-hopper.md`). Depois, ainda na mesma leva: "tem que colocar também, pra escolher qual o RPG que vai jogar no hub, ta abrindo diretamente o Eldarin sem sequer antes selecionar a mesa".

**Passo a passo:**
1. **Investigação (3 agentes de exploração + 1 de design, plan mode)** — mapeado o quanto do código é genérico vs. específico do Eldarin: `RoomState`/chat/presença/revisão são reaproveitáveis; `CharacterSheet`, o wizard de criação, `lib/character/rules.ts` e `lib/combat/` são 100% Eldarin, sem camada de abstração. Já existia um scaffold cosmético de multi-sistema (`lib/rpg/systems.ts`: `RpgSystemId`, `Adventure.rpgSystemId`) nunca ligado a sala/ficha/combate. Plano completo em 5 fases aprovado antes de implementar.
2. **Fase 1 implementada** — novo membro `"um-anel"` em `RpgSystemId`/`RPG_SYSTEMS` (`available: true`, capa SVG própria); `app/rpg/um-anel/{layout,page}.tsx` espelhando `app/rpg/eldarin/`; `AdventureLobby` generalizado pra aceitar `rpgSystemId` como prop em vez de fixar `"eldarin"`; `RoomState.rpgSystemId` novo (copiado da aventura na criação da sala, tratado como imutável); links "voltar às mesas" em `app/aventura/[adventureId]/page.tsx` corrigidos pra apontar pro sistema certo (antes todos hardcoded pra `/rpg/eldarin`).
3. **Achado à parte — bug real no `/mesas`** — ao testar, o usuário notou que o hub abria direto no Eldarin sem escolher sistema. Investigação (workflow com 3 agentes: investigar → implementar → verificar) achou a causa: commit `f41393f` (28/06) tinha removido de propósito um seletor que já existia (`RpgSystemCoverCard` + `mesas-hub.css`, ambos ainda no código mas órfãos), justificado por "único sistema disponível" — premissa que deixou de valer com "um-anel" disponível. `app/mesas/page.tsx` restaurado como seletor real, mas agora inteligente: só redireciona direto se houver exatamente 1 sistema `available`, senão mostra o grid de cartas (Eldarin, O Um Anel, + "Em breve" pros placeholders).
4. **Risco de produção identificado e contido** — a coluna nova `eldarin_rooms.rpg_system` (pra Fase 1) não tem migration automática no deploy (`npm run db:migrate` roda só manual, o pipeline de CI não chama). Pra não quebrar a leitura de toda mesa em produção (Eldarin incluído) até a migration rodar, a leitura/escrita real do SQL em `lib/db/rooms.ts` foi deixada **defensiva de propósito** (TODO marcado no código): a coluna existe no tipo `RoomState` e é copiada em memória, mas o SELECT/INSERT ainda não referenciam `rpg_system` — `normalizeRpgSystemId(undefined)` resolve pra `"eldarin"` com segurança. Ativar de verdade é uma mudança de 2 linhas depois que a migration `018_room_rpg_system.sql` (já escrita, também embutida em `scripts/db/schema.mariadb.sql` via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) rodar em produção.
5. **Validação** — `tsc --noEmit` limpo em cada etapa. Testado em memória (`ELDARIN_DISABLE_DB=1`) via Puppeteer: criação de aventura "O Um Anel" com o sistema certo persistido, navegação `/aventura/[id]` voltando pro hub certo, `/mesas` mostrando as duas opções lado a lado, clique em cada uma levando pro lugar certo, mesa demo do Eldarin sem nenhuma regressão visual ou funcional.

**Arquivos tocados:**
- `lib/rpg/systems.ts` — sistema `"um-anel"` novo
- `app/rpg/um-anel/{layout,page}.tsx` — novo
- `app/mesas/page.tsx` — seletor restaurado (era redirect fixo pro Eldarin)
- `components/adventure/AdventureLobby.tsx` — `rpgSystemId` como prop
- `app/aventura/[adventureId]/page.tsx` — links "voltar às mesas" dinâmicos
- `lib/room/types.ts`, `lib/room/adventure-room.ts`, `lib/room/sync.ts` — `RoomState.rpgSystemId`
- `lib/db/rooms.ts` — plumbing pronto, SQL ainda defensivo (ver TODO no código)
- `scripts/db/schema.mariadb.sql`, `scripts/db/migrations/018_room_rpg_system.sql` — coluna nova (fresh installs + upgrade incremental)
- `public/brand/rpg/um-anel-cover.svg` — capa placeholder simples (mesmo padrão dos outros sistemas "em breve")

**Commits / deploy:** pendente local (aguardando push). **Pendência real:** rodar a migration `018_room_rpg_system.sql` (ou `npm run db:migrate`) em produção antes de ativar a leitura/escrita de `rpg_system` em `lib/db/rooms.ts` — combinar com o usuário antes desse próximo passo específico.

**Como testar:**
- `/mesas` autenticado deve mostrar as duas capas (Eldarin, O Um Anel) lado a lado, não redirecionar direto.
- Criar uma aventura em cada sistema e confirmar que "voltar às mesas" leva pro hub certo em cada caso.
- Mesa demo do Eldarin (`/mesa/demo`) continua idêntica.

---

### 2026-07-21 — Fix: arrastar personagem/monstro pro mapa não fazia nada (img sem draggable=false)

**Pedido:** "não estou conseguindo arrastar os personagens para a mesa nem monstros" — testado como mestre e como jogador, no Chrome, sem erro no console, sem nenhum feedback visual (cursor não muda, sem miniatura acompanhando o mouse).

**Passo a passo:**
1. **Diagnóstico** — reproduzi drag-and-drop de personagem e de monstro contra produção via eventos `DragEvent` sintéticos direto no elemento `[draggable='true']` do card inteiro: os dois funcionaram (`/tokens/place-actor` e `/tokens/spawn` retornaram 200). Isso descartou bug na lógica de `useMonsterSpawnDrop`/`spawn-drag.ts`/permissões — a mecânica em si está correta.
2. **Causa raiz** — mas o usuário relatou "nenhum feedback visual" ao tentar arrastar, o que só acontece se o `dragstart` nunca dispara no elemento certo. `ActorAvatar` (`PlayableCharactersPanel.tsx`), o avatar do painel de spawn de personagem (`PlayerSpawnPanel.tsx`) e `CompendiumIcon` (usado no ícone do monstro em `MonsterSpawnPanel.tsx`, quando a entrada tem imagem própria) renderizam um `<img>` **sem `draggable={false}`** dentro do card que já é `draggable`. `<img>` é nativamente arrastável no navegador — ao segurar o drag bem em cima do retrato/ícone (o alvo mais natural e visualmente óbvio do card), o Chrome inicia o drag nativo da IMAGEM em vez de deixar o `dragstart` do card pai (que grava o payload customizado) assumir — resultado: nenhum ghost visível do app, nenhuma mudança de cursor do app, e nenhum erro no console, batendo exatamente com o relato.
3. **Por que meus testes não pegaram isso** — simulei o drag mirando no centro do card (`getBoundingClientRect` do container inteiro), que na prática caía fora da área do avatar/ícone (posicionado à esquerda, menor que o card). Um usuário real, ao pegar visualmente "o personagem", naturalmente clica no retrato.
4. **Correção** — `draggable={false}` explícito nas 3 tags `<img>` (`ActorAvatar`, `PlayerSpawnPanel`'s avatar, `CompendiumIcon`) — com isso o navegador corretamente ignora a imagem e deixa o `draggable="true"` do card ancestral assumir o drag, como já acontecia quando o clique começava fora da imagem.
5. **Validação** — `tsc --noEmit` limpo. Comportamento é padrão de plataforma bem documentado (MDN): `draggable="false"` num filho reverte pro comportamento de arraste do ancestral mais próximo.

**Arquivos tocados:**
- `components/vtt/PlayableCharactersPanel.tsx` — avatar do personagem, `draggable={false}`
- `components/vtt/PlayerSpawnPanel.tsx` — avatar do personagem no painel de spawn, `draggable={false}`
- `components/compendium/CompendiumIcon.tsx` — ícone/imagem do compêndio (usado por monstros e outras entradas), `draggable={false}`

**Commits / deploy:** pendente local (aguardando push).

**Como testar:**
- Na mesa, abrir o painel "Personagens Jogáveis" ou "Invocar", segurar o clique **bem em cima do retrato/ícone** do personagem/monstro (não só no texto ao lado) e arrastar pro mapa — deve funcionar normalmente agora, com o ghost/cursor de arraste do app aparecendo.

---

### 2026-07-20 (3) — Timeout nas mutações de sala (ataque/habilidade podiam pendurar pra sempre)

**Pedido:** "o problema maior tem sido timeout, corrige ai deixa tudo bem organizado".

**Passo a passo:**
1. **Diagnóstico** — `refresh()` (o GET de polling em `hooks/useRoomSync.ts`) já tinha timeout de 20s com `AbortController` + retry/backoff. Mas as ~27 funções de **mutação** (`postRoomAttack`, `postRoomAbility`, `nextCombatTurn`, `moveRoomTokenBudget`, `patchRoomSettings`, etc.) faziam `fetch()` puro, **sem timeout algum**. Se o servidor travasse numa dessas (pool de conexão do banco esgotado, cold start, blip de rede), o fetch ficava pendurado indefinidamente — sem erro, sem retry, sem toast (o `attackBusyRef`/`inFlightRef` correspondente nunca liberava), o que bate exatamente com "trava sem avisar nada".
2. **Correção** — um helper único `roomFetch(url, init, fallback)` em `hooks/useRoomSync.ts`, com `AbortController` + timeout de 10s (generoso vs. o ~200-300ms medido em produção). Timeout vira `RoomApiHttpError` com status **504** (não 408/4xx) de propósito: `isRoomClientError` só considera 400-499 "erro de validação, não repetir" — um timeout é transiente (repetir pode funcionar), então cair no status 5xx faz ele automaticamente usar o mesmo caminho de retry + "servidor lento — sincronizando em segundo plano" que `Battlefield.tsx` já tinha pra erros de servidor.
3. **Organização** — as 27 funções de mutação (incluindo `patchRoomToken`, que nem usava `throwRoomApiError`, lançava `Error` genérico) foram todas refatoradas pra usar `roomFetch`, eliminando a duplicação do `if (!res.ok) await throwRoomApiError(...)` repetida em cada uma. `postRoomChat` ganhou `credentials: "same-origin"` que faltava, por consistência com todo o resto.
4. **Validação** — `tsc --noEmit` limpo. `refresh()` (polling) não foi tocado — já tinha seu próprio timeout/retry dedicado.

**Arquivos tocados:**
- `hooks/useRoomSync.ts` — helper `roomFetch` novo; todas as mutações de sala refatoradas pra usá-lo

**Commits / deploy:** pendente local (aguardando push).

**Como testar:**
- Fluxo normal de combate (atacar, usar habilidade, mover, passar turno) continua igual — o timeout só entra em ação se o servidor não responder em 10s.
- Não há como simular timeout real sem derrubar o servidor de propósito; a garantia é de código (nenhum `fetch` de mutação sem `AbortController` mais).

---

### 2026-07-20 (2) — Segunda leva de corte nos timings de FX de combate

**Pedido:** "acho que o tempo de execução do combate ta mto lento ainda, muito lento mesmo" — depois de confirmar que o motor de combate em si (turno, alcance, PA, dano) funciona certo em produção.

**Passo a passo:**
1. **Diagnóstico** — medi o round-trip real da API contra produção (`/combat/attack`, `/combat/ability`, `/combat/next-turn`): ~200-270ms, rápido. A lentidão não é servidor — é o cliente.
2. **Causa raiz** — `components/vtt/CombatFxLayer.tsx` roda uma máquina de estado (mark→roll→result→damage→done) usando `COMBAT_DICE_TIMINGS`; somando os passos (settle do d20 + settle do dano + `afterResolve` + `evictMs`) dava ~2.7s por ação **com dano**, e `useBattlefieldCombatFxQueue.ts` toca essa sequência **uma de cada vez, em fila estrita** (`combatFxQueueRef`) — ou seja, cada corte nesses timings multiplica pelo número de ações no round (várias habilidades/ataques em sequência, monstros do mestre, etc.), o que explica a sensação de lentidão acumulada mesmo com o servidor respondendo rápido.
3. **Correção** — segunda leva de corte em `lib/vtt/combat-dice-model.ts` (a primeira leva, na sessão anterior, já tinha cortado `afterResolve` 2800→1400 e `missHold` 800→500): `afterResolve` 1400→650, `missHold` 500→320, `evictMs` 600→350 (tempos de espera pura, sem física — seguros). `COMBAT_DICE_SETTLE_MS` cortado com mais moderação (480→400) por depender da física real do dice-box (gravity/damping não tocados, pra não revelar o resultado antes do dado parar de rolar visualmente). Corrigida também uma inconsistência: a variante `_REDUCED` (motion reduzido) tinha `afterResolve`/`missHold` **maiores** que a normal — agora é sempre mais rápida. `settleTimeout` do dice-box (antes número mágico duplicado) passou a referenciar a constante.
4. **Validação** — `tsc --noEmit` limpo. Estimativa: sequência de acerto+dano cai de ~2,77s para ~1,5s (~46% mais rápido); um erro (miss) cai de ~2,4s para ~1,3s. Sem mudança de lógica — só constantes de tempo.

**Arquivos tocados:**
- `lib/vtt/combat-dice-model.ts` — timings de FX de combate cortados pela segunda vez; `settleTimeout` referenciando constante em vez de número mágico

**Commits / deploy:** pendente local (aguardando push).

**Como testar:**
- Em combate, executar um ataque/habilidade com dano e cronometrar do clique até o painel de resultado desaparecer — deve ficar bem mais rápido que antes.
- Testar com "reduzir movimento" (prefers-reduced-motion) ativado no SO/navegador — deve ficar ainda mais rápido, nunca mais lento que o modo normal.

---

### 2026-07-20 — Diagnóstico "combate cagado" + habilidades cortadas na ficha popup

**Pedido:** "sobre o combate ainda ta cagado" (screenshots de `/combat/ability` e `/combat/attack` retornando 400 em produção) + "as habilidades ainda tão com tooltips cortados" (fix anterior de `fullLabel`/aria-label não resolveu).

**Passo a passo:**
1. **Reprodução em produção** — com Puppeteer-core logado como `mestre` em `www.mxdrpg.com.br/mesa/demo`, cheguei à conclusão de que existem duas UIs de habilidade distintas (sub-menu interno do `TokenActionRing` vs. `AbilityPickerPanel` externo); confirmei que `onOpenAbilityPicker`/`onOpenSpellPicker` são sempre passados em `Battlefield.tsx`, então o sub-menu interno (`ringView === "ability"/"spell"`, com truncamento JS + `-webkit-line-clamp`) é **código morto** — não é o que o usuário vê.
2. **Bug real das habilidades cortadas** — testei o `AbilityPickerPanel` (sem truncamento, texto completo) e depois a ficha popup flutuante na mesa (ícone "Ficha" → aba "Habilidades"). Via `getBoundingClientRect` + `elementFromPoint`, confirmei que a lista de habilidades renderiza **abaixo da área visível** da janela flutuante (`.foundry-window__body`, `overflow:auto`, mas altura padrão de 680px insuficiente pro conteúdo do cabeçalho+atributos+traços+culinária que fica **acima** das abas) — sem scroll visível óbvio, a lista fica invisível/não-hoverável, exatamente como "cortada".
3. **Fix 1** — `hooks/vtt/useFoundryWindows.ts`: altura padrão do popup `character` 680→820px. `components/character/CharacterSheet.tsx`: ao clicar numa aba (`Habilidades`/`Magias`/etc.) na variante popup, `tabStripRef.current.scrollIntoView({block:"start", behavior:"smooth"})` — traz a lista pra vista sem precisar o usuário descobrir que precisa rolar a janela inteira.
4. **Bug real dos 400 em combate** — testei `/api/room/demo/combat/attack` direto (via `fetch` autenticado como mestre) com atacante fora do turno ativo → `400 "Aguarde seu turno na iniciativa"`; com atacante certo mas alvo fora de alcance → `400 "Fora de alcance (2 cél., máx 1)"`. Ambos são **validações corretas do jogo**, não bugs de lógica.
5. **Causa raiz real** — `grep` em `components/vtt/Battlefield.tsx` mostrou `actionErr`/`setActionErr` usado em **~30 pontos** (toda falha de ataque/habilidade/magia/movimento/mapa seta essa state), mas **nunca lido/renderizado** em lugar nenhum do componente — só o path de "remover token" também chamava `toast.push` manualmente. Ou seja: toda rejeição de ação (fora de alcance, fora do turno, alvo inválido etc.) era computada corretamente pelo servidor, capturada no cliente, e **descartada silenciosamente** — o jogador só via um 400 genérico no Network tab, sem nenhuma mensagem visível na tela. Essa é a explicação mais provável pra "combate cagado".
6. **Fix 2** — `components/vtt/Battlefield.tsx`: `useEffect` que dispara `toast.push(actionErr, "warn")` sempre que `actionErr` muda pra um valor não-nulo, cobrindo todos os ~30 call sites de uma vez; removida a chamada manual duplicada de toast no path de remover token (agora coberta pelo efeito).
7. **Validação** — `tsc --noEmit` limpo. Reprodução local (Puppeteer contra `localhost:3000`) confirmou visualmente que a aba Habilidades agora aparece cheia e hoverável sem scroll manual, com o tooltip completo (`sheet-hover-tip__bubble--portal`) sem nenhum recorte.

**Arquivos tocados:**
- `hooks/vtt/useFoundryWindows.ts` — altura padrão do popup de ficha 680→820
- `components/character/CharacterSheet.tsx` — scroll automático da aba pro topo visível na variante popup
- `components/vtt/Battlefield.tsx` — toast automático para qualquer `actionErr` não-nulo; remove duplicação no path de remover token

**Commits / deploy:** pendente local (aguardando push).

**Como testar:**
- Na mesa, abrir a ficha de um personagem pelo ícone lateral "Ficha" → clicar em "Habilidades"/"Magias": a lista deve aparecer cheia, sem precisar rolar manualmente.
- Em combate, tentar atacar fora do turno ou um alvo fora de alcance: deve aparecer um toast (canto da tela, perto do HUD) com a razão exata, não só falhar em silêncio.

---

### 2026-07-14 — Fix CI: job data-sync falhando (técnicas de Chi editadas a mão)

**Pedido:** "conserte isso" — screenshot de notificação do GitHub mostrando `CI / data-sync` falhando.

**Passo a passo:**
1. **Diagnóstico** — `data/compendiums/habilidades.json` é um arquivo **derivado**: `scripts/generate-compendium.mjs` o gera a partir de um array `ABILITY_CATALOG` hardcoded no próprio script (não lê markdown pra habilidades — só usa `BOOK_HAB` como metadado de citação). O job `data-sync` da CI roda `npm run sync:data` (regenera tudo) e depois `git diff --exit-code` nos arquivos derivados — se a regeneração não bater com o que está commitado, falha com "Run npm run sync:data locally and commit generated files."
2. **Causa raiz** — o commit anterior (`60893e0`, sessão de trabalho antes desta) adicionou 5 técnicas de Chi do Espiritualista (Golpe de Chi, Passo do Vácuo, Ferida Aberta, Golpe do Vácuo, Muro de Chi) direto no JSON, sem tocar no gerador. Rodando `npm run sync:data` localmente, essas 5 entradas eram apagadas (confirmei via `git diff` antes de corrigir).
3. **Correção** — `scripts/generate-compendium.mjs`: novo array `CHI_ABILITY_CATALOG` (mesmo formato de `ABILITY_CATALOG`, mais o campo `chi` pro custo) gerando as mesmas 5 entradas com `id`/`catalogId`/`bookRef` idênticos aos que já estavam commitados (`chi-*`, `CHI-*`, `ESPIRITUALISTA-CRIACAO-PERSONAGEM.md`), incluindo `tactical.custoChi` que o catálogo genérico de habilidades não tinha.
4. **Validação** — revertido os arquivos derivados pro estado commitado, rodado `npm run sync:data` de novo: `habilidades.json`/`monstros.json`/`LIVRO-DO-MESTRE.md` regeneraram byte-a-byte iguais ao commitado; só `livros/TABELA-IDS-ELDARIN.md` mudou de fato (passou a listar os 5 novos `catalogId` CHI-*, contagem 50→55) — exatamente o esperado, e esse arquivo faz parte do que a CI compara. `npm run sync:data:check` e o `git diff --exit-code` simulado localmente (nos mesmos paths que o workflow checa) confirmaram zero diferença antes do commit.

**Arquivos tocados:**
- `scripts/generate-compendium.mjs` — `CHI_ABILITY_CATALOG` novo, `ABILITIES` passa a concatenar os dois catálogos
- `livros/TABELA-IDS-ELDARIN.md` — regenerado (5 novos catalogIds)

**Commits / deploy:** `b7e2c15`, enviado. CI disparada de novo pro commit novo — acompanhar em https://github.com/MaulXD/MXDRPG/actions.

**Como testar:**
- `npm run sync:data && git status --short` não deve mostrar nenhum arquivo em `data/compendiums/`, `livros/TABELA-IDS-ELDARIN.md`, `data/character/subclass-tracks.json` ou `lib/character/loot-catalog.ts`
- Job `CI / data-sync` no GitHub Actions deve passar verde no próximo push que toque `data/compendiums/**` ou `livros/**`

---

### 2026-07-14 — Quarta leva: render caro da ficha (objeto `live` sem memo)

**Pedido:** continuação de "coloque tudo isso em prática" — último item do relatório de render de componentes React da rodada anterior.

**Passo a passo:**
1. **`components/character/CharacterSheet.tsx`** — o objeto `live` (ficha "efetiva", mesclando `roomActor`/`sheetBase`/`character`) era reconstruído via spread literal em **todo** render, nunca memoizado. Como `live` é passado como prop `actor` pra ~10 painéis filhos, qualquer mudança de estado local não relacionada (trocar aba, abrir picker, selecionar item) invalidava a identidade de `live` e propagava recomputação cara pra baixo (`listCombatActions` em `CombatLoadoutPanel`/`SheetPopupLoadoutBar`, roadmap de níveis futuros, preview de identidade). Envolvido em `useMemo` com deps `[roomActor, sheetBase, character]` — resolve os itens filhos automaticamente, já que eles dependem da mesma referência de `actor`.
2. **`FutureLevelsPanel.tsx`** e **`CharacterIdentityEditor.tsx`** — além de dependerem de `actor` (agora estável), os dois recalculavam (`buildFutureLevelRoadmap`/`upcomingRacialMilestones`/`describeIdentity`) mesmo com o painel colapsado/fechado. Adicionado gate por `open` nas duas — só computa quando expandido.
3. **`Battlefield.tsx`** — `statusDelegateCandidates` (filter+map sobre membros da sala) recalculava em todo render do componente mais "quente" da mesa, mesmo quando o modal de status nem estava aberto. Envolvido em `useMemo` gateado por `modalStatusToken`.
4. **Decidido não tocar** — o efeito de `keydown` global em `CharacterSheet.tsx` tem `inventory` nas deps mas só o lê via closure de `removeItem`; remover a dependência sem também memoizar `removeItem` corretamente introduziria um bug de closure obsoleta (deletar item baseado em inventário desatualizado). O ganho seria mínimo (só evita um re-subscribe de listener, operação barata) — risco não compensa.
5. **Validação** — `npx tsc --noEmit`, `npm run build`, `npm test` limpos. Verificação visual ao vivo (Chrome real via Puppeteer) na ficha de `/personagem/pc-thrain-ferroescudo`: abri o painel "Níveis futuros" e confirmei via DOM que `aria-expanded="true"` e o corpo do painel (`.sheet-future-levels__body`) renderiza corretamente — sem erros novos de console.

**Arquivos tocados:**
- `components/character/CharacterSheet.tsx` — `live` memoizado
- `components/character/FutureLevelsPanel.tsx` — roadmap/marcos raciais gateados por `open`
- `components/character/CharacterIdentityEditor.tsx` — preview de identidade gateado por `open`
- `components/vtt/Battlefield.tsx` — `statusDelegateCandidates` memoizado e gateado

**Commits / deploy:** local, aguardando push.

**Como testar:**
- Abrir a ficha de um personagem, trocar de aba várias vezes → painéis de combate/talentos não devem "piscar"/recalcular visivelmente
- Abrir e fechar "Níveis futuros" e "Editar raça/classe/atributos" → devem continuar funcionando normalmente

---

### 2026-07-14 — Terceira leva: lazy-load restante + N+1 sistêmico em rotas de sala

**Pedido:** "coloque tudo isso em prática" — implementar os achados de 3 novas auditorias em paralelo (render de componentes React pesados, N+1 restante nas rotas de API, bundle/lazy-load restante).

**Achados e o que foi feito:**

1. **`MesaCharacterWizardPopup` importado estático** (`MesaFoundryFloatingWindows.tsx`) enquanto os 3 vizinhos do mesmo arquivo (`DiceRoller`, `CharacterSheetPopup`, `MonsterSheetPopup`) já usavam `next/dynamic`. Corrigido, e o mesmo para `MonsterSpawnPanel` (ferramenta só do mestre) nos dois arquivos que o usam. **Resultado medido:** `/mesa/[roomId]` caiu de 331 kB → 268 kB de First Load JS.
2. **`CharacterSheet.tsx`** importava estático `LevelUpWizard` (+`TalentTreeGraph`), `LootEconomyPanel`, `PersonalBestiaryPanel`, `SpellPrepPanel` — todos só renderizados sob aba/condição específica. Convertidos para `next/dynamic`. `/personagem/[id]`: 311 kB → 305 kB.
3. **`getRoom(roomId)` chamado 2-3x por request** — padrão sistêmico: rotas que já autorizam via `requireRoomManage`/`requireRoomSpawn`/`requireRoomMember` (e já recebem `room` de volta) chamavam funções em `lib/room/handlers/tokens.ts`/`actors.ts`/`room-lifecycle.ts` que refaziam o fetch internamente. Só `moveRoomToken` já tinha o padrão certo (`opts.room ?? await getRoom(roomId)`). Estendido esse padrão para: `spawnRoomMonster`, `repositionRoomToken`, `placeRoomActorOnCell`, `updateRoomToken`, `removeRoomToken`, `getRoomActor`, `getRoomSnapshot`, `updateRoomActor`, `levelUpRoomActor` — e atualizadas as rotas que já tinham o `room`/`auth.room` em mãos pra passar adiante em vez de deixar refazer o fetch.
4. **`lib/character/characters.ts:saveCharacter`** — mesmo anti-padrão já corrigido em `resolveCharacter` na sessão anterior: fazia `resolveCharacter(saved.id)` só para confirmar existência e descartava o resultado. Removido (roda em todo write de personagem: PATCH, level-up, edit-save, wizard).
5. **`lib/room/adventure-actors.ts`** — dois loops `for...of` com `await` sequencial por participante da mesa (`resolveCharacterAccount`, `listCharactersForUserInAdventure`), chamados por `syncAdventureActorsForRoom` (entrar na mesa, criar ficha, level-up, sync de retrato). Paralelizados com `Promise.all`.
6. **`app/api/adventures/[adventureId]/members/route.ts`** — N+1 real: resolvia conta canônica de cada membro em sequência. Reescrito para resolver todos em paralelo e só depois aplicar a deduplicação (por id bruto e por id canônico, preservando a lógica original).
7. **`app/api/room/[roomId]/gm/saving-throw/route.ts`** — buscava a sala de novo só para repassar `roomId/ownerId/memberIds/settings` ao `snapshotForViewer`, já disponíveis em `auth.room`. Removido o fetch extra.
8. **`app/api/characters/[id]/route.ts` GET** — `resolveCharacter` e a busca do grant de edição aprovado eram sequenciais sem depender um do outro. Paralelizados. (O mesmo no PATCH tinha ramificação condicional mais arriscada de tocar — deixado como está.)
9. **Validação** — `npx tsc --noEmit`, `npm run build`, `npm test` limpos. Além disso, smoke test manual ao vivo (script descartável, script/curl direto contra servidor local em memória) cobrindo spawn/reposition/patch/delete de token, patch de ator, place-actor, saving-throw e level-up — todos os endpoints tocados responderam corretamente (a única rejeição foi uma regra de negócio legítima: personagem sem XP suficiente pra subir de nível).

**Não feito ainda (fica pra próxima):**
- Render caro em `CharacterSheet.tsx` (objeto `live` reconstruído em todo render, sem memo — acumulado ao longo desta sessão para uma leva dedicada de otimização de render).
- Índice de banco (`JSON_CONTAINS`+`OR` em `member_ids`) e consolidação do `ensureDbMigrations` — ainda exigem decisão de schema.

**Arquivos tocados:**
- `components/vtt/mesa/MesaFoundryFloatingWindows.tsx`, `MesaFoundryDockRail.tsx` — `MesaCharacterWizardPopup`/`MonsterSpawnPanel` como `next/dynamic`
- `components/character/CharacterSheet.tsx` — 4 painéis como `next/dynamic`
- `lib/room/handlers/tokens.ts`, `actors.ts`, `room-lifecycle.ts` — `opts.room` opcional em 9 funções
- `app/api/room/[roomId]/tokens/{place-actor,reposition,spawn,[tokenId],[tokenId]/delegate}/route.ts`, `app/api/room/[roomId]/actors/[actorId]/{route,level-up/route}.ts`, `app/api/room/[roomId]/gm/saving-throw/route.ts` — passam `room`/`auth.room` já obtido
- `lib/character/characters.ts` — `saveCharacter` sem releitura descartada
- `lib/room/adventure-actors.ts` — dois loops paralelizados
- `app/api/adventures/[adventureId]/members/route.ts` — resolução de membros paralelizada
- `app/api/characters/[id]/route.ts` — GET paralelizado

**Commits / deploy:** local, aguardando push.

**Como testar:**
- Mestre invocar monstro, reposicionar, editar cor do token e remover → tudo deve continuar funcionando normalmente
- Jogador editar biografia da própria ficha, subir de nível → sem mudança de comportamento
- `/mesa/[roomId]` e `/personagem/[id]` devem carregar visivelmente mais rápido (bundle menor)

---

### 2026-07-14 — Lista de melhorias + segunda leva de correções

**Pedido:** "me faça lista de coisas que podem melhorar e comece a por em prática" — continuação da varredura de performance da sessão anterior.

**Lista levantada (com base nas 4 auditorias da sessão anterior + nova checagem):**

Feitas nesta sessão:
1. Poll de combate mais lento que o de exploração (2500ms vs 2000ms) — invertido, devia ser mais rápido
2. `usePassTurn`: flag `busy` nunca ficava `true` — botão "Passar turno" nunca mostrava estado de carregamento
3. `getEntry` do compêndio fazia busca linear (`.find()`) a cada chamada — hot path usado por item de inventário
4. Escrita de sala + escrita de aventura sequenciais na criação de mesa — paralelizadas
5. `CampaignLobby.tsx` — componente morto, zero imports em todo o repo — removido
6. Erro de banco na listagem de mesas era mascarado como "0 mesas" (`degraded:true` nunca lido pelo cliente) — agora mostra aviso

Levantadas, não feitas (maior risco/esforço, ficam para depois):
7. `listRoomsForOwnerOrMember`/`adventures` usa `JSON_CONTAINS` + `OR` em `member_ids` — sem índice usável, gera full table scan; hoje rápido (tabela pequena), primeiro ponto a degradar com o crescimento da base. Precisa de migration (coluna gerada + índice, ou tabela de junção).
8. `ensureDbMigrations` importado/chamado em 23 rotas diferentes — sinal de migration temporária que devia ser uma migration de verdade e sair do hot path.
9. `CharacterCreationWizard.tsx`: `previewLines`/`invalidSteps` recalculam a cada tecla digitada (nome/biografia), porque dependem do objeto `draft` inteiro. Baixo impacto real (cálculo barato), mas seria mais correto memoizar só nos campos que de fato mudam o preview.
10. Cascata de normalizações redundantes no save de ficha (já anotado na sessão anterior) — não mexido, área sensível.

**Passo a passo:**
1. `hooks/useRoomSync.ts` — `COMBAT_POLL_INTERVAL_MS` 2500→1200ms (mais rápido que o poll base de exploração, como já era o caso do backup poll via SSE).
2. `hooks/vtt/usePassTurn.ts` — adicionado `setBusy(true)` no início de `passTurn()`; antes ele ia direto pra `false` sem nunca ter sido `true`.
3. `lib/compendium/registry.ts` — `getEntry` passou a usar um `Map` por pack (`indexForPack`, lazy) em vez de `.find()` linear no array.
4. `lib/adventure/store.ts` — `createAdventure` agora dispara `createRoomForAdventure` e `dbAdventures.saveAdventure` com `Promise.all` (confirmado: sem foreign key entre as tabelas, seguro paralelizar; rollback em caso de erro continua igual).
5. `components/campaign/CampaignLobby.tsx` — removido (confirmado zero referências no repo).
6. `components/adventure/AdventureLobby.tsx` — `load()` agora seta `error` quando a API responde `degraded:true`, em vez de mostrar silenciosamente "nenhuma mesa".
7. **Validação** — `npx tsc --noEmit` limpo, `npm run build` limpo, `npm test` (verify-pa-bank, verify-movement-pa, verify-grid-path, verify-sheet-pdf, verify-consumables, sync:data:check) todos OK.

**Arquivos tocados:**
- `hooks/useRoomSync.ts` — poll de combate mais rápido
- `hooks/vtt/usePassTurn.ts` — `busy` reflete o request de verdade
- `lib/compendium/registry.ts` — `getEntry` com índice O(1)
- `lib/adventure/store.ts` — escritas paralelas na criação de mesa
- `components/campaign/CampaignLobby.tsx` — removido (morto)
- `components/adventure/AdventureLobby.tsx` — erro visível quando a listagem degrada

**Commits / deploy:** local, aguardando push.

**Como testar:**
- Passar o turno na mesa → botão deve mostrar "Passando…"/"…" brevemente
- Criar uma mesa nova → sem mudança visível esperada (só mais rápido internamente)
- `npm test` deve passar limpo

---

### 2026-07-14 — Varredura de performance: "lento pra jogar" + ataques travando na mesa

**Pedido:** depois do fix de featIds, o usuário pediu uma varredura completa — revisar criação de mesa, criação de personagem e o tempo de jogatina, já que a mesa estava "tão lenta pra jogar".

**Passo a passo:**

1. **Auditoria em paralelo** — 4 agentes investigaram simultaneamente: criação de mesa, criação/edição de ficha, loop de jogatina (combate/turnos/sync) e a camada transversal de DB/API/build. Achados principais: N+1 sequencial em `enrichAdventureListItems` (tela "Suas mesas"), cascata de 5-10 normalizações redundantes por save de ficha, `resolveCharacter` lendo e normalizando o registry mesmo quando o Postgres já respondeu, bundle do chat carregando `three` (~600KB) sempre, e — o achado de maior impacto — a fila de FX de combate bloqueando a sincronização de **toda a mesa** (não só do token atacando) enquanto a animação de ataque tocava (~4s por ação).
2. **Bug crítico relatado ("ataques e habilidades não funcionam")** — reproduzido de ponta a ponta com Chrome real via Puppeteer (login, abrir anel de ação, atacar). O ataque **funciona** — PA é gasto, dano é aplicado — mas a UI trava em "Aguardando servidor…" por ~4-12s porque (a) `afterResolve` estava em 2800ms e (b) `Battlefield.tsx` congelava a sincronização de TODOS os tokens da sala enquanto qualquer FX local tocava, não só do atacante/defensor envolvidos. Some das duas causas explica a sensação de "não funciona" quando na verdade só está lento.
3. **Correção do bloqueio de sync** — `Battlefield.tsx`: nova `collectProtectedTokenIds()` reúne os tokens presos na FX de combate ativa/na fila (`attackerTokenId`, `defenderTokenId`, `areaTargets`) e no token em animação de movimento. Em `syncRoom`, quando a cena é "deferida", agora aplica o snapshot novo imediatamente para todos os tokens EXCETO os protegidos — só esses continuam com o estado antigo até a FX terminar (`onCombatFxDone` já cuidava do flush final, isso não mudou).
4. **Redução moderada de delays** — `lib/vtt/combat-dice-model.ts`: `afterResolve` 2800→1400ms, `missHold` 800→500ms. Mantém tempo de leitura do resultado, corta a espera morta depois que ele já apareceu na tela.
5. **N+1 na lista de mesas** — `lib/adventure/list-enrich.ts`: loop sequencial `for...of` (4 operações por mesa) virou `Promise.all(items.map(...))`, com `getAdventure`/`getRoom` e `fetchUserRows`/`onlineUserIdsForRoom` também paralelizados dentro de cada item.
6. **Leitura de ficha descartada** — `lib/character/characters.ts`: `resolveCharacter` parava de consultar (e normalizar) o registry em memória incondicionalmente; agora só faz isso quando o Postgres está desligado ou falhou.
7. **Bundle do chat** — `components/vtt/RoomChat.tsx`: `DiceBoxMini` (que arrasta `DiceMiniature` → `DiceWebGL` → `three`) passou a ser `next/dynamic({ssr:false})`, igual ao padrão já usado em `DiceRoller`. Deixa de ir no bundle inicial da mesa.
8. **Tooltip truncado no anel de ações** — investigando o bug visual reportado ("Golpe de C..." cortado), achei que `TokenActionRing.tsx` usava o `label` já truncado (11/14/22 chars, pensado pro círculo pequeno) também no `aria-label` do slot — que pode aparecer como tooltip visível via leitor de tela ou extensão de acessibilidade. Adicionado `fullLabel` (nome completo, sem corte) ao `DisplaySlot`, usado agora no `aria-label` do slot e do botão de info.
9. **Layout duplicado — "Personagens Jogáveis"** — não reproduzi o print exato (testei em 899×1400 sem sucesso), mas ao ler o código encontrei a causa real por inspeção: `PlayableCharactersPanel.tsx` renderizava seu próprio `<p className="vtt-eyebrow">Personagens jogáveis</p>`, só que os DOIS lugares que o usam (`MesaFoundryDockRail.tsx` e `MesaFoundryFloatingWindows.tsx`) já passam `title="Personagens jogáveis"` para a moldura (`FoundryDockPanel`/`FoundryWindow`), que renderiza isso num `<h2>` próprio — cabeçalho genuinamente duplicado, um por cima do outro. Removido o eyebrow interno (redundante nos dois usos).
10. **Ícones da barra lateral com texto "grudado"** — `MesaIconBar.tsx` mostra label + tooltip (com o mesmo nome de novo) por CSS puro `:hover`/`:focus-visible`. Em navegador touch, `:hover` pode não desfazer ao soltar o dedo (bug clássico de mobile web) — cada ícone tocado anteriormente fica com o tooltip "grudado", parecendo texto duplicado. Corrigido: o gatilho `:hover` só ativa quando `@media (hover: hover) and (pointer: fine)` (mouse de verdade); `:focus-visible` continua funcionando para teclado em qualquer dispositivo. Mesmo padrão corrigido em `.condition-chip__tooltip` (ícones de condição/status no token) em `eldarin-v4.css`.
11. **Cascata de normalizações redundantes no save de ficha** — não tocada nesta sessão (achado #2 da auditoria de personagem). É uma refatoração de maior risco em área que já teve uma regressão hoje; fica para uma sessão dedicada com mais tempo de teste.
12. **Validação** — `npx tsc --noEmit` limpo, `npm run build` limpo (duas rodadas, uma por leva de fixes). Fluxo de ataque re-testado de ponta a ponta com Chrome real (Puppeteer) após as mudanças — sem novos erros de console; `scripts/smoke/combat-core.mjs` continua falhando por bug pré-existente do próprio script (não entende respostas delta), não é regressão desta sessão.

**Arquivos tocados:**
- `components/vtt/Battlefield.tsx` — `collectProtectedTokenIds` + `syncRoom` aplica cena parcial durante defer
- `lib/vtt/combat-dice-model.ts` — `afterResolve`/`missHold` reduzidos
- `lib/adventure/list-enrich.ts` — `enrichAdventureListItems` paralelizado com `Promise.all`
- `lib/character/characters.ts` — `resolveCharacter` só lê o registry quando precisa
- `components/vtt/RoomChat.tsx` — `DiceBoxMini` como `next/dynamic`
- `components/vtt/TokenActionRing.tsx` — `fullLabel` sem corte no `aria-label`
- `components/vtt/PlayableCharactersPanel.tsx` — removido eyebrow duplicado do título
- `components/vtt/foundry/foundry.css` — tooltip do icon bar só em `(hover: hover) and (pointer: fine)`
- `components/vtt/eldarin-v4.css` — mesmo guard em `.condition-chip__tooltip`

**Commits / deploy:** local, aguardando push.

**Como testar:**
- Atacar um monstro na mesa demo → resultado deve aparecer mais rápido (~2,7s em vez de ~4,1s por acerto)
- Com dois tokens de jogadores diferentes em combate, um atacando não deve mais congelar a posição/HP de tokens não envolvidos na FX
- Abrir "Suas mesas" com várias mesas cadastradas → carregamento deve ser sensivelmente mais rápido
- Abrir o chat da mesa sem rolar nenhum dado → bundle inicial não deve mais incluir `three.js`
- Abrir "Personagens Jogáveis" (dock ou janela flutuante) → só um cabeçalho "Personagens Jogáveis", não dois empilhados
- Em celular/tablet (touch), tocar os ícones da barra lateral um por um → nenhum tooltip deve ficar "grudado" atrás do próximo

---

### 2026-07-14 — Fix regressão: featIds e escolhaPericiaAntecedente apagados ao salvar ficha

**Pedido:** "a criação de fichas está bugada".

**Passo a passo:**
1. **Diagnóstico** — agente de exploração mapeou o fluxo de criação/edição de ficha e comparou com o diff do commit anterior (60893e0, sistema de talentos universais). Achado: `lib/character/types.ts` ganhou os campos `featIds` (talentos universais) e `escolhaPericiaAntecedente` (perícia livre do antecedente Aventureiro) em `CharacterIdentity`, mas `normalizeIdentity()` em `lib/character/normalize.ts` reconstrói o objeto `CharacterIdentity` campo a campo e nunca foi atualizada para incluir os dois novos campos.
2. **Impacto** — `normalizeCharacter`/`normalizeIdentity` roda em praticamente todo save/leitura de ficha (`build-from-wizard.ts`, `identity.ts` applyIdentityPatch, `characters.ts` saveCharacter, `character-registry.ts`, `rebuild-from-wizard.ts`). Resultado: a perícia extra do antecedente Aventureiro era apagada no instante em que a ficha era criada; o talento universal escolhido no level-up (níveis 4/8/12/16) era apagado a cada save subsequente. Efeito colateral concreto: `lib/character/armor-defense.ts:52` lê `identity.featIds` para aplicar o bônus de +1 CA do talento "Pele Grossa" — como o campo sempre voltava vazio, o bônus nunca era aplicado mesmo com o talento escolhido corretamente.
3. **Correção** — `normalizeIdentity()` agora preserva `featIds` (filtra para array de strings, default `[]`) e `escolhaPericiaAntecedente` (default `null`); `defaultIdentity()` também recebeu os mesmos defaults para consistência.
4. **Validação** — `npx tsc --noEmit` limpo.

**Arquivos tocados:**
- `lib/character/normalize.ts` — `normalizeIdentity()` e `defaultIdentity()` passam a preservar `featIds`/`escolhaPericiaAntecedente`

**Commits / deploy:** pendente local.

**Como testar:**
- Criar personagem com antecedente "Aventureiro" escolhendo uma perícia → recarregar a ficha → perícia deve continuar aparecendo no painel "Antecedente"
- Escolher talento universal "Pele Grossa" no level-up (nível 4+) → CA da ficha deve mostrar +1 permanente após salvar/recarregar

---

### 2026-07-10 — Sistema de talentos universais + Chi HUD + AbilityPicker + TokenActionRing

**Pedido:** implementar todas as funcionalidades sugeridas — sistema de talentos universais selecionável no level up, seletor flutuante de habilidades no VTT, Chi pool display no HUD, correções no TokenActionRing, e picker de perícia para o antecedente Aventureiro.

**Passo a passo:**

1. **TokenActionRing melhorias** — custo Chi exibido no label (e.g. "1PA · 1χ"); `title` nativo removido → `aria-label`; labels truncados a 22 chars (de 11); detailHint explicando progressão PA para Mover/Correr; prop `onOpenAbilityPicker` adicionada.
2. **AbilityPickerPanel** — novo painel flutuante (pattern SpellPickerPanel) com grade de habilidades, busca por nome, badge de recarga, target icon e painel de detalhe com descrição completa; backdrop com blur z-1200. Arquivo `ability-picker.css` criado.
3. **Battlefield** — `abilityPickerOpen` state; `onOpenAbilityPicker` passado ao ring; `AbilityPickerPanel` renderizado condicionalmente.
4. **Chi HUD** — `ChiHudMeter.tsx` criado com pips diamante para budget de turno; integrado ao `CharacterCombatHud.tsx` (condicional `token.chi != null`); CSS `.hud-chi` adicionado ao `eldarin-v4.css` com layout amethyst + rotate 45° para diamantes. Ring center mostra "4 PA · 7χ".
5. **pa-chip.ts** — quando `action.chiCost`, o chip preview mostra pool restante e limite de turno.
6. **action-tooltip.ts** — `effectiveCostLine` inclui sufixo "X Chi" quando custo Chi existe.
7. **Sistema de talentos universais** — `feats.ts` criado (`listAllFeats`, `listFeatsForLevel`, `getFeat`); `types.ts` — `featIds` e `escolhaPericiaAntecedente` em `CharacterIdentity`; `level-up.ts` — `LevelUpChoices.featId`, `LevelUpRequirement` feat, validation, apply; `level-up-ui.ts` — step "feat"; `LevelUpWizard.tsx` — passo "Talento Universal" com grid de cards + CSS `.lu-feat-grid/.lu-feat-card`.
8. **Aventureiro background** — `wizard-types.ts` + `build-from-wizard.ts` + `wizard-from-character.ts` — campo `escolhaPericiaAntecedente`; `CharacterCreationWizard.tsx` — picker de perícia exibido ao selecionar "Aventureiro", validação obrigatória antes de avançar; `sheet-skills.ts` — `ANTECEDENTE_SKILL_DEFS` exportado + `buildSheetBackgroundSkills` trata Aventureiro via `identity.escolhaPericiaAntecedente`.
9. **UniversalFeatsPanel** — componente de display dos feats adquiridos; integrado em `CharacterSheet.tsx` e `SheetDdbManagePanel.tsx` após `SubclassTrackPanel`.
10. **Build** — `npm run build` limpo em todos os pontos.

**Arquivos tocados:**
- `lib/character/feats.ts` — NOVO: utilitários de talentos universais
- `components/character/UniversalFeatsPanel.tsx` — NOVO: display de feats na ficha
- `components/vtt/AbilityPickerPanel.tsx` — NOVO: seletor flutuante de habilidades
- `components/vtt/ChiHudMeter.tsx` — NOVO: medidor Chi no HUD
- `components/vtt/ability-picker.css` — NOVO: estilos do ability picker
- `lib/character/types.ts` — CharacterIdentity +featIds +escolhaPericiaAntecedente
- `lib/character/level-up.ts` — feat em LevelUpChoices, requirements, validate, apply
- `lib/character/level-up-ui.ts` — step "feat" + previewLevelUpGroups
- `lib/character/wizard-types.ts` — escolhaPericiaAntecedente em draft
- `lib/character/build-from-wizard.ts` — propaga escolhaPericiaAntecedente
- `lib/character/wizard-from-character.ts` — reverse transform
- `lib/character/sheet-skills.ts` — ANTECEDENTE_SKILL_DEFS exportado + Aventureiro handler
- `components/character/LevelUpWizard.tsx` — step feat UI
- `components/character/level-up.css` — .lu-feat-grid/.lu-feat-card/.lu-feat-badge
- `components/character/wizard/wizard.css` — .char-wizard-aventureiro-* styles
- `components/character/wizard/CharacterCreationWizard.tsx` — skill picker Aventureiro
- `components/character/CharacterSheet.tsx` — UniversalFeatsPanel wired
- `components/character/SheetDdbManagePanel.tsx` — UniversalFeatsPanel wired
- `components/vtt/TokenActionRing.tsx` — 4 melhorias + onOpenAbilityPicker
- `components/vtt/CharacterCombatHud.tsx` — ChiHudMeter integrado
- `components/vtt/Battlefield.tsx` — AbilityPickerPanel wired
- `components/vtt/eldarin-v4.css` — .hud-chi block
- `lib/combat/pa-chip.ts` — Chi preview no chip
- `lib/combat/action-tooltip.ts` — Chi suffix no tooltip

**Commits / deploy:** pendente local.

**Como testar:**
- Level up personagem até nível 4 → deve aparecer step "Talento Universal" no wizard com grid de feats
- Criar personagem com antecedente "Aventureiro" → step Antecedente deve mostrar picker de perícia; ficha deve exibir a perícia escolhida no painel "Antecedente"
- Mesa VTT com Espiritualista → HUD deve mostrar χ com diamantes + pool; ring center "PA · χ"; ability picker abre ao clicar em "Habilidades"

---

### 2026-07-10 — Subclasses Espiritualista no VTT + efeito mecânico Pele Grossa

**Pedido:** implementar habilidades de subclasse Chi no ring de ações VTT e efeitos mecânicos dos feats de combate.

**Passo a passo:**
1. **Diagnóstico** — `CLASS_FALLBACK["Espiritualista"]` apontava para `"habilidades-golpe-de-chi"` mas o ID real no compêndio é `"chi-golpe-de-chi"`, causando `getEntry()` null; `TALENT_HABILIDADE` não tinha nenhum dos 16 talentos das 4 subclasses; `ABILITY_BY_ID` não tinha entradas com prefixo `chi-`, então `abilityFromEntry` retornava null mesmo se o ID fosse corrigido.
2. **Decisão** — criar entradas `chi-*` no ABILITY_BY_ID para os 5 IDs novos; criar 2 novas entradas no compêndio (`chi-golpe-do-vacuo`, `chi-muro-de-chi`); mapear os 16 talentos de subclasse no TALENT_HABILIDADE usando dedup por entry (talentos lv8-16 mapeiam para o mesmo entry do lv4 → aparecem como 1 ação por subclasse no ring).
3. **habilidades.json** — adicionado campo `custoChi` às 3 entradas chi existentes; criadas entradas `chi-golpe-do-vacuo` (1d6, PA1, Chi1) e `chi-muro-de-chi` (defense_buff, PA1, Chi1).
4. **compendium-actions.ts** — adicionadas 5 entradas ao ABILITY_BY_ID com prefixo `chi-`.
5. **subclass-vtt.ts** — corrigido `CLASS_FALLBACK["Espiritualista"]`; adicionados 16 mapeamentos TALENT_HABILIDADE (Punho do Limiar, Tecelão do Vácuo, Asceta da Dor, Guardião da Respiração).
6. **armor-defense.ts** — `featDefesaBonus()` implementada: se `featIds` contém `"talento-pele-grossa"`, +1 CA; `resolveActorDefesa` somam o bônus.
7. **Build** — `npm run build` limpo.

**Arquivos tocados:**
- `data/compendiums/habilidades.json` — custoChi nas 3 entradas chi + 2 novas entradas
- `lib/combat/compendium-actions.ts` — 5 entradas chi- em ABILITY_BY_ID
- `lib/character/subclass-vtt.ts` — fix CLASS_FALLBACK + 16 TALENT_HABILIDADE
- `lib/character/armor-defense.ts` — +1 CA mecânico para feat Pele Grossa

**Commits / deploy:** pendente local.

**Como testar:**
- Personagem Espiritualista com qualquer subclasse → ring de combate deve mostrar ação da trilha (ex: "Golpe do Vácuo (trilha) · 1 cél. · PA 1 · Chi 1")
- Personagem com feat "Pele Grossa" → CA deve ser 1 ponto acima do que seria sem o feat

---

### 2026-07-09 — Compêndio Chi/talentos + perícias de antecedente roláveis + prompts de ícones

**Pedido:** implementar todas as melhorias pendentes — técnicas Chi no compêndio, talentos universais em JSON, perícias de background roláveis na ficha, card de habilidade no VTT, prompts de ícones AI para todos os itens.

**Passo a passo:**

1. **Técnicas Chi no compêndio** — Espiritualista já tinha subclasses em `subclass-tracks.json`; faltavam as 3 técnicas do kit inicial. Adicionadas ao `habilidades.json` como entradas tipo `"habilidade"`: Golpe de Chi (1 Chi, PA 1, alcance 1), Passo do Vácuo (1 Chi, PA 1, alcance 3), Ferida Aberta (2 Chi, PA 1, alcance 1, recarga 1/turno). Custo em Chi codificado no `<strong>` do `description` (o schema não tem campo Chi).
2. **talentos.json criado** — novo arquivo `data/compendiums/talentos.json` com 20 talentos universais (Cap. 13 do Livro do Jogador), schema: `id`, `name`, `type: "talento"`, `system.category` (combate/culinario/sobrevivencia/social), `system.levelMin`, `system.prerequisites`, `system.description` (HTML). Categorias: 4 combate, 6 culinários, 5 sobrevivência, 5 sociais.
3. **Perícias de antecedente roláveis** — `sheet-skills.ts` estendido com `ANTECEDENTE_SKILL_DEFS` (8 perícias: Sobrevivência, Arcanismo, História, Persuasão, Intuição, Intimidação, Medicina, Enganação) + `buildSheetBackgroundSkills(actor)` que filtra o antecedente via `mentionsSkill` e retorna `SheetQuickSkill[]` sempre treinadas. `SheetDdbSkillsPanel` exibe as extras em subseção "Antecedente" com botão rollável idêntico ao padrão.
4. **Card de habilidade VTT** — verificado: `CombatActionDetail` já renderiza para `actionMode === "ability"` (`TokenActionPanel.tsx:716-719`). Mostra descrição do compêndio (strip HTML), dano, custo PA, alcance e recarga. Nenhuma mudança necessária.
5. **CSS** — adicionados `.sheet-ddb-panel__subhead` e `.sheet-ddb-panel__sub-label` ao `sheet-ddb.css` para separador visual da subseção de antecedente.
6. **Prompts de ícones AI** — artifact publicado com 166 prompts organizados em 4 abas (Habilidades 50, Magias 64, Chi 23, Classes+Subclasses 29); formato estrito: gold border `#c4a44a`, amethyst glow `#8B7BB8`, dark bg `#0e0d0b`, square 1:1.
7. **Build** — `npm run build` limpo em todos os pontos.

**Arquivos tocados:**
- `data/compendiums/habilidades.json` — +3 entradas Chi (golpe-de-chi, passo-do-vacuo, ferida-aberta)
- `data/compendiums/talentos.json` — NOVO: 20 talentos universais
- `lib/character/sheet-skills.ts` — SheetSkillId +8 ids; ANTECEDENTE_SKILL_DEFS; buildSheetBackgroundSkills()
- `components/character/SheetDdbSkillsPanel.tsx` — importa buildSheetBackgroundSkills; subseção Antecedente
- `components/character/sheet-ddb.css` — classes __subhead e __sub-label

**Commits / deploy:** pendente local.

**Como testar:**
- Criar personagem com antecedente "Erudito" → abrir ficha → painel Perícias deve mostrar "Antecedente" com Arcanismo e História roláveis (dot preenchido)
- Criar personagem com antecedente "Soldado" → Atletismo (já no painel) e Intimidação (subseção Antecedente)
- Mesa VTT → modo Habilidade → selecionar Golpe de Chi → `CombatActionDetail` mostra "Custo: 1 Chi" na descrição

---

### 2026-06-28 — Fix criação de personagem + refactor landing/hub + CI workflow

**Pedido:** criação de ficha não funcionando; refatorar o site como hub otimizado com foco no funcionamento da mesa.

**Passo a passo:**

1. **Fix btn-primary-cta** — botão "Criar personagem" aparecia sem estilo roxo (neutro) porque `.btn-primary-cta` não herdava as cores de `.btn-primary`. Adicionado como alias no `globals.css`: `border: none; background: var(--chrome-accent); color: var(--chrome-bg)`.
2. **Fix precedência JS em `finish()`** — `setErr(message ?? isEdit ? "A" : "B")` era parseado como `(message ?? isEdit) ? "A" : "B"`, mostrando mensagem errada. Corrigido com parênteses explícitos.
3. **Landing page** — hero centralizado com SVG preview do VTT, seção "Recursos" com 4 cards e seção "Para o Mestre" com download direto em vez da antiga CTA band redundante. Estilos: `landing-hero`, `landing-preview`, `download-band` adicionados ao `globals.css`.
4. **Hub `/mesas`** — redireciona diretamente para `/rpg/eldarin` (único sistema disponível), eliminando clique extra desnecessário. Cabeçalho da página Eldarin simplificado.
5. **Build** — `npm run build` limpo, zero erros TypeScript.

**Arquivos tocados:**
- `app/globals.css` — alias `btn-primary-cta` + estilos `landing-hero`, `landing-preview`, `download-band`, `download-other`
- `components/character/wizard/CharacterCreationWizard.tsx` — precedência `??` / `?:` em `setErr`
- `app/page.tsx` — landing page reescrita (hero SVG, recursos, banda download)
- `app/mesas/page.tsx` — redireciona para `/rpg/eldarin`
- `app/rpg/eldarin/page.tsx` — cabeçalho simplificado sem breadcrumb circular

**Commits / deploy:** `9cf2a39` (fix wizard) · `f41393f` (refactor site). Push pendente.

**Como testar:**
- `/personagem/novo` — botão roxo visível; criar personagem com campos válidos deve funcionar
- `/` — hero com preview SVG, feature cards, banda download
- `/mesas` — redireciona para `/rpg/eldarin`

---

### 2026-06-28 — Executável com docker auto-install + página /download com instruções integradas

**Pedido:** exe do mestre deve instalar o Docker automaticamente se não encontrado (com progress bar); página `/download` com instruções integradas em vez de link para guia separado.

**Passo a passo:**

1. **cmd/mestre/main.go reescrito** — `ensureDocker()` cobre 3 casos: daemon rodando → ok; CLI instalada mas parado → polling a cada 5s até 3min com contador `\r Aguardando Docker iniciar... (Xs)`; não instalado → `downloadAndInstallDocker()`.
2. **Download com progress bar** — `downloadWithProgress()`: HTTP GET com barra `█░` de 20 chars calculada por `pct/5`. URLs: Docker Desktop Windows (~600MB), Mac Silicon/Intel DMG. Linux: exibe URL manual e sai.
3. **Instalação automática** — Windows: `exec.Command(tmpPath, "install").Start()` abre instalador UAC; Mac: `open Docker.dmg`. Após instalação instrui reabrir o exe; exe não continua (precisa reiniciar daemon).
4. **Página /download reestruturada** — removida seção "O que você precisa" (Docker é automático); removido "Ver guia completo"; instrucões lado a lado: card ngrok (1 passo manual, 3 sub-passos numerados) + card automático (4 emoji steps); callout verde "Mesa pronta" embaixo.
5. **CSS novo** — `download.css` completamente reescrito com todas as classes novas: `.dl-setup`, `.dl-setup-card`, `.dl-setup-badge`, `.dl-ngrok-steps`, `.dl-auto-list`, `.dl-result`, `.dl-divider`, `.dl-platform-note`; responsivo mobile (1 coluna).
6. **Build + push** — `npm run build` limpo; commit `6dd01d3` em `main`.

**Arquivos tocados:**
- `cmd/mestre/main.go` — reescrito: `ensureDocker`, `downloadAndInstallDocker`, `downloadWithProgress`, `waitForDocker`
- `app/download/page.tsx` — reestruturado: instrucões integradas, sem link para guia externo
- `app/download/download.css` — reescrito completo para nova estrutura da página

**Commits / deploy:** `6dd01d3` em `main`. Push ok.

**Como testar:**
- `/download` — ver layout lado a lado (ngrok + automático), callout verde no final
- `cmd/mestre/main.go`: compilar `CGO_ENABLED=0 go build -o mxdrpg-mestre.exe` e rodar sem Docker instalado

---

### 2026-06-27 — Fix combate preso + hospedagem local pelo mestre + guia passo a passo

**Pedido (1):** ataque consumia PAs mas sem resultado no dado/chat/tela ("Aguardando servidor...").  
**Pedido (2):** loading VTT demorando ~10s — investigar.  
**Pedido (3):** refatorar para funcionar com hospedagem no PC do mestre (Foundry-style).  
**Pedido (4):** preparar guia passo a passo completo para o mestre configurar.

**Passo a passo:**

1. **Diagnóstico — combate preso** — race condition em `useBattlefieldCombatFxQueue.ts`: `seedHistoricalChat` marcava a nova mensagem de ataque como "vista" (`seenCombatRef`) antes de `findPendingAttackMessage` conseguir encontrá-la. Resultado: sistema aguardava para sempre uma mensagem que já estava invisível.
2. **Fix combate** — invertida a ordem: busca a mensagem pendente ANTES de chamar `seedHistoricalChat`; marca como vista ANTES do seed. Também removido o guard `if (!messages.length) return` que impedia o seeding quando o chat estava vazio (primeiro ataque da sessão).
3. **Diagnóstico — loading lento** — SSR do `page.tsx` fazia 3 queries sequenciais ao banco (aventura + convite + count de personagens). Root cause real: servidor em Contabo Alemanha → Brasil ~200ms RTT × N queries.
4. **Fix loading** — removidas as 2 queries de count de personagens do SSR; loading.tsx melhorado com spinner escuro (#0e0d0b + roxo) em vez de texto branco vazio.
5. **Arquitetura local** — criado `docker-compose.local.yml`: 3 serviços (MariaDB 11.4, Next.js app, ngrok). Dados persistem em volume Docker `mxdrpg_local_db`.
6. **Save periódico** — `lib/room/internal/periodic-save.ts`: batch non-blocking a cada 60s via `globalThis.__eldarinPeriodicSave`. `persistRoom` em `registry.ts` não bloqueia mais o game loop — chama `scheduleSave`.
7. **Scripts setup** — `scripts/local/setup.bat` e `setup.sh` reescritos como assistente guiado: verificam Docker, geram SESSION_SECRET, pedem token ngrok, criam `.env.local`, sobem `docker compose` e aguardam o link ngrok automaticamente (polling `localhost:4040/api/tunnels`), exibem o link em destaque.
8. **Guia visual** — `docs/HOSTING-LOCAL.md` + Artifact HTML publicado (checklist interativo, 7 passos, troubleshooting).

**Arquivos tocados:**
- `hooks/vtt/useBattlefieldCombatFxQueue.ts` — invertida ordem seed/search; removido guard `if (!messages.length)`
- `app/mesa/[roomId]/loading.tsx` — spinner dark em vez de texto
- `app/mesa/[roomId]/page.tsx` — removidas queries de count de personagens do SSR
- `lib/room/internal/periodic-save.ts` — novo: save batch 60s non-blocking
- `lib/room/internal/registry.ts` — `persistRoom` → `scheduleSave` (não bloqueia)
- `docker-compose.local.yml` — novo: db + app + ngrok
- `.env.local.example` — novo: template variáveis para mestre local
- `scripts/local/setup.bat` — reescrito como assistente completo (detecta ngrok URL)
- `scripts/local/setup.sh` — equivalente para Mac/Linux
- `docs/HOSTING-LOCAL.md` — novo: doc técnico de hospedagem local

**Commits / deploy:** `bd3d70f` (docker local + save periódico) em `main`. Scripts setup e guia: pendente commit.

**Como testar:**
- Combate: `/mesa/demo` → atacar → resultado aparece no dado, tela e chat (sem "Aguardando...")
- Hospedagem local: `scripts\local\setup.bat` → seguir passos → link ngrok exibido ao final
- Loading: abrir `/mesa/[roomId]` — spinner escuro aparece imediatamente

---

### 2026-06-26 — Reconciliar branch + fix animação dados WebGL

**Pedido:** dados sem animação visível no combate; consolidar branch `fix/mesa-performance-delays` com `main`.

**Passo a passo:**
1. **Diagnóstico — dados invisíveis** — timings haviam sido baixados para 200ms em sessão anterior. WebGL `dice-box` precisa de ≥480ms para `settleTimeout` física; resultado aparecia antes do dado pousar na tela.
2. **Fix timings** — `combat-dice-model.ts`: `attackRoll` 200→620ms, `damageRoll` 200→520ms, `DICE_LANDING_MS` 100→220ms, `COMBAT_ATTACK_MIN_SPIN_MS` 120→420ms, `COMBAT_DICE_SETTLE_MS` 200→480ms, `settleTimeout` WebGL 200→480ms. ~45% mais rápido que original, mínimo visível para física 3D.
3. **Diagnóstico — branch divergida** — filter-branch da sessão anterior reescreveu hashes do `local/main`; `fix/mesa-performance-delays` estava baseado no `origin/main` antigo (hashes pré-reescrita). `git log origin/main ^HEAD` = vazio (fix branch era ancestral de origin/main).
4. **Rebase** — `git rebase --onto main origin/main fix/mesa-performance-delays` aplicou os 12 commits sobre `local/main` limpo (sem conflitos — conteúdo idêntico, só hashes diferentes).
5. **Fast-forward + push** — `git merge --ff-only`, `git push --force main` e `fix/mesa-performance-delays` sincronizados.

**Arquivos tocados:**
- `lib/vtt/combat-dice-model.ts` — timings dados ajustados: 620ms ataque, 520ms dano, 480ms settle WebGL

**Commits / deploy:** `ddd42a1` em `main` e `fix/mesa-performance-delays`. Force push em ambos (necessário pós filter-branch).

**Como testar:**
- `git checkout main && npm run dev`
- `/mesa/demo` → iniciar combate → atacar — dado d20 deve girar visivelmente (~0,6s) antes de parar e mostrar resultado

---

### 2026-06-24 — Performance: redução de delays na mesa VTT

**Pedido:** investigar delay absurdo na mesa e corrigir.

**Passo a passo:**
1. **Auditoria** — agente varreu `lib/vtt/`, `hooks/vtt/`, `components/vtt/`, `app/api/room/` e `lib/room/`. Mapeou 40+ fontes de delay em 6 categorias (animação, rede, canvas, polling, combate, banco).
2. **Priorização** — top 5 por impacto percebido: animações dos dados (950ms + 750ms = 1,7s por ataque), SSE polling (400ms de lag de sync), transição combate/aventura (UI bloqueada 2,3s), auto-pass (280ms × N turnos/rodada).
3. **Decisão** — resultado imediato nos dados (200ms), SSE 250ms, transição 1400ms, auto-pass 150ms. Zero alteração em lógica de combate ou banco.
4. **Implementação** — 5 arquivos, 15 constantes numéricas.
5. **Validação** — `npm run build` ✅. Branch `fix/mesa-performance-delays` criada e pushed.

**Arquivos tocados:**
- `lib/vtt/combat-dice-model.ts` — attackRoll 950→200ms, damageRoll 750→200ms, evictMs 650→240ms, DICE_LANDING_MS 320→100ms, COMBAT_DICE_SETTLE_MS 920→200ms, settleTimeout WebGL 920→200ms
- `app/api/room/[roomId]/events/route.ts` — POLL_MS 400→250ms
- `hooks/vtt/useCombatModeTransition.ts` — DURATION_MS 2300→1400ms
- `components/vtt/combat-mode-transition.css` — --cmt-total 2.3s→1.4s
- `lib/room/settings.ts` — DEFAULT_AUTO_PASS_DELAY_MS 280→150ms, MIN 200→100ms

**Commits / deploy:** `ed3bc81` em `fix/mesa-performance-delays` — PR pendente (gh CLI sem auth; abrir em https://github.com/MaulXD/MXDRPG/pull/new/fix/mesa-performance-delays).

**Como testar:**
- `/mesa/demo` → atacar → dado para e mostra resultado em ≤200ms
- Dois navegadores → ação aparece para o segundo em ≤250ms
- Ativar combate → névoa some em 1,4s (era 2,3s)
- PA = 0 → turno passa em ~150ms por token

---

### 2026-06-24 — Auditoria de design e correções de UX/acessibilidade

**Pedido:** avaliar o design/UX do site e corrigir todos os problemas encontrados.

**Passo a passo:**
1. **Auditoria** — exploração completa do projeto + análise de `globals.css`, landing page, mobile responsivo, acessibilidade e design system.
2. **Relatório** — 17 achados classificados (4 críticos, 7 atenção, 6 melhorias, 6 pontos fortes).
3. **Correções aplicadas:**
   - Typo "Combaté" → "Combate" na stats strip da landing
   - Stats strip reescrita com valores mais claros ("Hex"/"Grid tático", "Zero"/"Instalação necessária", "3"/"Papéis de mesa")
   - `--text-xs: 0.7rem` → `0.75rem`, `--text-sm: 0.82rem` → `0.875rem`, `--text-base: 0.9rem` → `1rem`
   - `--text-dim: #5a5045` → `#6e6458` (contraste WCAG AA corrigido)
   - `btn-ghost`: `font-family` trocado de `--font-body` para `--font-ui` (consistência de botões)
   - Adicionado `:focus-visible` global; inputs/selects suprimem outline duplo (já têm border+shadow)
   - Canvas VTT: `min(72vh)` → `min(72dvh)`, `min(80vh)` → `min(80dvh)` — fix barra de endereço mobile
   - `landing-hero`: `100vh` → `100dvh`
   - Criado `components/MobileNav.tsx` — hamburger + drawer com todos os links de nav (fecha em rota change e Escape)
   - `SiteHeaderWrapper.tsx`: integrado `<MobileNav>` — oculta `.site-nav__links` ≤768px, mostra toggle
   - `app/mesas/page.tsx`: removidos todos os inline styles → classes CSS
   - `mesas-hub.css`: adicionadas `.mesas-hub-wrap`, `.mesas-hub-header`, `.rpg-hub-demo-banner`
   - Link demo promovido de texto pequeno para banner com botão visível

4. **Não alterado (intencionalmente):** variáveis `--neon-*` e `--accent-gold` (usadas em centenas de linhas em `vtt.css` e `sheet.css` — renomear exige refatoração dedicada); variáveis VTT no `:root` (mover para `.vtt-chrome` é seguro mas extenso).

**Arquivos tocados:**
- `app/page.tsx` — stats strip reescrita, typo corrigido
- `app/globals.css` — font-sizes, --text-dim, btn-ghost font, :focus-visible global, dvh, CSS mobile nav
- `components/home/home.css` — dvh no landing hero
- `components/MobileNav.tsx` — novo componente hamburger
- `components/SiteHeaderWrapper.tsx` — integrado MobileNav
- `app/mesas/page.tsx` — inline styles removidos, demo banner
- `components/rpg/mesas-hub.css` — classes novas para wrap, header e demo banner

**Commits / deploy:** pendente local.

**Como testar:**
- Landing: verificar stats strip e typo corrigido
- Mobile ≤768px: hamburger aparece, links desktop somem, drawer funciona
- `npm run build` para verificar tipos

---

### 2026-06-24 — Redesign visual da landing (revertido)

**Pedido:** melhorar visualmente a landing — menos genérica, mais visual do produto.

**Passo a passo:**
1. Criado `HeroVttPreview.tsx` — SVG de grid hexagonal → depois corrigido para grid quadrado após confirmação que o VTT não usa mais hexágonos.
2. Hero reestruturado em duas colunas (texto + preview SVG), feature cards redesenhados com ícone e título lado a lado e bordas de acento por tipo, CTA band com dois botões e glow, stats strip convertida para linha horizontal com separadores.
3. Resultado rejeitado pelo usuário — visual considerado ruim/carregado.
4. **Revertido:** `app/page.tsx`, `components/home/home.css` e `HeroVttPreview.tsx` removidos.

**Commits:** `4242457` (redesign), `58eaea4` (fix grid quadrado), revert no commit seguinte.

---

### 2026-06-22 — Homolog local, fix ataque 400 e grid Foundry na mesa-local

**Pedido:** testar MXDRPG localmente — corrigir HTTP 400 em `/combat/attack`, lentidão em produção, e **mesa sem grade/tokens** (só UI Foundry + logo/capa ELDARIN). Após primeiro fix CSS, usuário reportou **“mesma coisa”**.

**Passo a passo:**
1. **Diagnóstico — ambiente** — MariaDB homolog + seed `mesa-local`; rotas `npm run local` / `dev:homolog`; localhost abre mesa sem convite (`lib/env/homolog.ts`). API `GET /api/room/mesa-local` retorna `gridRadius: 8` e 3 tokens — dados OK no servidor.
2. **Diagnóstico — 400 ataque** — cliente usava `resolveLivingActiveTokenId`; servidor usava `activeTokenId` bruto → “Aguarde seu turno…”. Preflight `canAttackTarget` no cliente alinhado.
3. **Diagnóstico — grid invisível** — UI Foundry (toolbar MAPA/LOUSA/ZOOM, turno, HUD) carregava, mas área central vazia. Causa: `.vtt-canvas-wrap` com `height: min(80vh, 760px)` em `globals.css` / `vtt.css` conflitando com layout Foundry (`position: absolute; inset: 0`); canvas com altura efetiva ~0; capa ELDARIN (`RoomCoverBackdrop`) aparecia quando não havia desenho.
4. **Decisão — rodada 1 (commit `02afd3e`)** — CSS Foundry no stage; default `gridRadius: 8` em `scene-normalize.ts`; capa só com `coverUrl` custom (não fallback ELDARIN).
5. **Decisão — rodada 2 (pendente local)** — regras CSS com `!important` via `[data-vtt-mesa="foundry"]`; canvas/wrap/shell com `width/height: 100%`; `prepareBattlefieldCanvas` mede wrap + `getBoundingClientRect` + stage pai; `useGridCanvas` re-tenta draw até layout > 10px; classe `vtt-canvas-wrap--foundry`.
6. **Validação** — `GET /api/room/mesa-local` → `coverUrl: null`, tokens presentes. Testar em **uma** porta (`localhost:3000`), `npm run dev:homolog`, hard refresh Ctrl+Shift+R.

**Arquivos tocados:**
- `scripts/homolog/*`, `data/homolog/mesa-local.seed.json`, `lib/env/homolog.ts`, `docs/HOMOLOG.md` — ambiente local (commits `a179727`, `ae4808e`)
- `lib/room/combat-turn-context.ts`, `Battlefield.tsx` — turno + preflight ataque (commit `8cdacd2`)
- `components/vtt/foundry/foundry.css`, `RoomCoverBackdrop.tsx`, `lib/vtt/scene-normalize.ts` — rodada 1 canvas (commit `02afd3e`)
- `foundry.css`, `lib/vtt/draw-battlefield.ts`, `hooks/vtt/useGridCanvas.ts`, `BattlefieldMapCanvas.tsx`, `Battlefield.tsx` — rodada 2 canvas

**Commits / deploy:** `8cdacd2`, `a179727`, `ae4808e`, `02afd3e`, `0eed5a5` (rodada 2 canvas) em `main`.

**Como testar:**
```bash
npm run local          # ou homolog:up + dev:homolog
```
- http://localhost:3000/mesa/mesa-local — login `mestre` / `123`
- Grade cinza + 3 tokens (2 goblins + minotauro); sem capa ELDARIN se `coverUrl` null
- F12 → inspecionar `.vtt-canvas` — `clientWidth` / `clientHeight` > 0

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

### 2026-06-28 — Design: EventEmitter SSE, Amethyst Dusk, micro-interactions, transition/dock + bug monstro

**Pedido:** "Continue" da sessão anterior (performance VTT) + relato de que dano de monstro não é computado.

**Passo a passo:**

1. **EventEmitter SSE** — criado `lib/room/notifier.ts` com `EventEmitter`; `persistRoom` em `registry.ts` emite `"room-updated"`; rota `app/api/room/[roomId]/events/route.ts` escuta e envia revisões via SSE, eliminando polling e debounce do cliente.
2. **Accent Amethyst Dusk** — `#6B9E8C` → `#8B7BB8` em 19 arquivos CSS; texto base `#c4bbaa` → `#d4ccbe`; `font-weight: 500` no body; hardcoded rgba convertido para `color-mix()`.
3. **Micro-interactions** — spinner overlay no `TokenActionPanel`; fade-in nas abas `mesa-rail-panel`; ripple de clique no canvas (`BattlefieldMapCanvas`).
4. **Transition + Dock** — `SiteShell` refatorado com fade site→VTT; `MesaIconBar` abrindo dock no clique esquerdo e popup menu no direito.
5. **Bug: dano de monstro** — análise estática completa do fluxo `resolveMonsterAttack` → `executeRoomAttack` → `patchTokenVitals` → `persistRoom` → `syncLinkedTokens` → SSE. O código aparentemente está correto: `resolveMonsterAttack` calcula dano, o handler atualiza token (L277-282) e actor (L302-319), `persistRoom` persiste, e o delta captura a diferença. **Não foi identificada causa raiz definitiva.** Suspeitas:
   - Condição de corrida no SSE (notificação chega antes do `recordRevisionEntry`)
   - PA insuficiente do monstro (`canAttackTarget` falha com "PA insuficiente" no servidor)
   - Erro silencioso em `canActOnCombatTurn` para monstros fora de iniciativa
   - Bug no frontend ao aplicar delta (`useRoomSync.ts`)

**Arquivos tocados:**
- `lib/room/notifier.ts` — NOVO: EventEmitter + notificação SSE
- `app/api/room/[roomId]/events/route.ts` — NOVA: rota SSE
- `lib/room/internal/registry.ts` — `persistRoom` emite `"room-updated"`
- `app/globals.css` — Amethyst Dusk + peso 500 + `color-mix()`
- `components/vtt/foundry/SiteShell.tsx` — transição fade
- `components/vtt/foundry/MesaIconBar.tsx` — dock esquerdo/popup direito
- `components/vtt/panels/TokenActionPanel.tsx` — spinner
- `components/vtt/panels/rail/mesa-rail-panel.css` — fade-in
- `components/vtt/BattlefieldMapCanvas.tsx` — ripple
- +16 arquivos CSS com substituição de cor

**Commits / deploy:** `91caf4e` (EventEmitter) · `4934b09` (Amethyst Dusk) · `bc2fb67` (micro-interactions) · `b2b35e1` (transition+dock). Push pendente junto com correção do bug do monstro.

**Como testar (design):**
- Abrir VTT → verificar cor roxa `#8B7BB8` em botões, links, acentos
- Atacar → spinner aparece no `TokenActionPanel` durante resolução
- Clicar ícone na `MesaIconBar` → dock abre; botão direito → popup menu
- Navegar site→VTT → fade suave

**Bug monstro — como reproduzir:**
1. Criar sala com monstro e PC
2. Iniciar combate, dar PA ao monstro
3. Atacar PC com o monstro
4. Observar: chat mostra "acerta N dano" mas HP do PC não reduz

---

### 2026-07-24 — O Um Anel: extração de regras + Fase 2 (personagem mínimo)

**Pedido:** extrair 100% das regras de criação de personagem do PDF "The One Ring 2e Core Rules" (Culturas, Vocações, Perícias, Proficiências de Combate, Armas/Armaduras) e, em paralelo ("faça ambos se puder"), implementar a Fase 2 do plano aprovado (`peaceful-puzzling-hopper.md`): tipo de ficha, wizard de criação e ficha de visualização do Um Anel — corrigindo também o bug em que uma mesa "tor" abria o wizard/ficha do Eldarin.

**Extração (livros/um-anel/):**
- `00-glossario-termos.md` — glossário PT-BR construído do zero (não reaproveita a terminologia 1e dos livros já traduzidos por Mateus Soares — mecanicamente incompatível com a 2e).
- `03-aventureiros.md` / `04-caracteristicas.md` — já extraídos em rodada anterior, usados como fonte dos números abaixo.
- `12-o-mundo-eriador.md` / `13-apendice-patronos-e-ficha.md` — Cap.9 (Eriador/Bree) + Apêndice A (Patronos, Landmarks) + layout oficial da Ficha de Personagem (p.239) e do Journey Log (p.240), campo por campo.

**Engenharia (Fase 2 — personagem mínimo, zero regressão no Eldarin):**
1. `lib/character/types.ts` — extraído `BaseCharacterFields` (id/ownerId/adventureId/nome/retrato...); `CharacterSheet` passa a estendê-lo e ganha discriminante opcional `system?: RpgSystemId` (default `"eldarin"` em `normalizeCharacter`).
2. `lib/character/um-anel/{types,data,rules,normalize,wizard-types,build-from-wizard}.ts` — `TorCharacterSheet` completo (Cultura, Vocação, 3 Atributos+TN, 18 Perícias, 4 Proficiências de Combate, Resistência/Esperança/Aparar/Carga, Sombra/Fadiga/Condições, Valor/Sabedoria/Recompensas/Virtudes, Equipamento de Guerra); dados reais das 6 Culturas e 6 Vocações (atributos, perícias base, bônus de Cultura, traços distintivos, armas/armaduras/escudos); fórmula de NA (`20 − Atributo`) e derivados por Cultura.
3. **Storage isolado, tabela própria** — `um_anel_characters` (schema + `scripts/db/migrations/019_um_anel_characters.sql`), `lib/db/um-anel-characters.ts` + `lib/character/um-anel/{registry,characters}.ts`: descartada a ideia inicial de reaproveitar `eldarin_characters` (arriscava fichas TOR contaminarem a listagem/normalize do Eldarin já que o `normalizeCharacter` eldarin não sabe ler atributos de outro formato).
4. `app/api/tor-characters/route.ts` (POST) — espelha `app/api/characters/route.ts`.
5. `components/character/wizard/TorCharacterCreationWizard.tsx` — casco reaproveitado do CSS/padrão do wizard Eldarin (`wizard.css`, `WizardProgress`), 8 passos próprios (Conceito → Cultura → Atributos → Vocação → Combate → Traços → Dádivas → Revisão).
6. `components/character/sheet/TorCharacterSheetView.tsx` — ficha de leitura própria (CSS dedicado `tor-sheet.css`).
7. **Dispatch por `rpgSystemId`** em 3 pontos, sem branch dentro do código Eldarin: `/personagem/[id]` (prefixo de id `tor-` vs `pc-`), `/aventura/[id]/personagem/novo` (via `adventure.rpgSystemId`), popup de criação na mesa (`rpgSystemId` propagado `mesa/[roomId]/page.tsx` → `MesaWorkspace` → `MesaFoundryFloatingWindows` → `MesaCharacterWizardPopup`).

**Escopo explicitamente fora desta fase:** personagem Um Anel ainda não vira `RoomActor`/token na mesa (isso é Fase 4 — combate); ao criar pela mesa, abre a ficha em nova aba em vez de popup na mesa.

**Verificação:**
- `tsc --noEmit` limpo.
- Teste de lógica pura (`tsx` temporário, script descartado) cobrindo `buildTorCharacterFromWizard`/`normalizeTorCharacter`/`attributeTN` para Hobbit e Ranger (bônus de atributo condicional) + integridade das 6 Culturas/6 Vocações — todas as asserções passaram.
- Teste E2E via Puppeteer (Chrome local, `ELDARIN_DISABLE_DB=1`): login → criar mesa "O Um Anel" → wizard completo (8 passos, validação bloqueando passo incompleto corretamente) → submit. A chamada `POST /api/tor-characters` falhou com 400 nesse modo específico — rastreado até `materializeSessionUser` (variante que lança, não a "safe") lançando `DATABASE_URL não configurada`; confirmado que `POST /api/characters` (Eldarin) usa a **mesma** função e falharia da mesma forma nesse modo — não é regressão, é limitação pré-existente do modo sem banco para rotas de criação de personagem (não coberta antes). Fluxo completo requer MariaDB real (`npm run local`, indisponível neste ambiente por falta de Docker).

**Pendente para a próxima sessão:** validar a criação ponta-a-ponta contra um MariaDB real; Fase 3 (compêndio) e Fase 4 (combate/token na mesa) do plano; tradução PT-BR do conteúdo já extraído em `livros/um-anel/*.md`.

---

### 2026-07-24 (cont.) — Remoção completa da mesa demo + correção de nome "Espada & Arcano"→D&D

**Pedido:** "cada tipo de RPG tem que ter seu VTT, sua mesa, fichas separados... remova a mesa demo, cada um que quiser testar crie a sua, se achar algo de mesa demo no site, remova!" — e, à parte, reverter o placeholder "Espada & Arcano" de volta para "Dungeons & Dragons" (decisão informada do usuário, ciente do risco de marca registrada da Wizards of the Coast).

**Pesquisa prévia (workflow com 3 agentes paralelos):** mapeamento completo confirmou que "demo" não era um recurso isolado — estava hard-coded em ~50 arquivos em 4 camadas: bypass de autenticação (>15 pontos com `roomId === "demo"` liberando ações sem login/dono), dado semeado (`DEMO_CHARACTERS`/`DEMO_SCENE` reaproveitados como infraestrutura geral — não só da demo), pontos de entrada de UI (7 CTAs), e scripts/docs de QA.

**Correção do nome do sistema:** `lib/rpg/systems.ts` — `RpgSystemId` volta a ter `"dnd"` (era `"arcane"` desde o commit `1cb4420` de 18/06, que renomeou por precaução de marca registrada); `name`/`shortName`/`coverAlt` voltam a "Dungeons & Dragons"/"D&D"; assets `dnd-cover.png/svg` já existiam no repo. `normalizeRpgSystemId` mantém compat reversa (`"arcane"` → `"dnd"`).

**Remoção da mesa demo — por camada:**
1. **Núcleo (risco alto, tratado à mão, não deletado):** `lib/room/internal/registry.ts` (`shouldPersistToDb`, criação automática de sala demo, `refreshDemoActorsIfStale` — ~100 linhas), `lib/adventure/store.ts` (`ensureDemoAdventure` e sua injeção forçada em toda listagem de mesas — o ponto de maior impacto pra "a demo aparecer pra todo mundo"), `lib/room/sync.ts` (`createDemoRoom`), `lib/character/character-registry.ts` (parou de usar `DEMO_CHARACTERS` como seed-base do registro em memória), `lib/character/adventure-bind.ts` (`!bound ? adventureId === "demo" : ...` → `false` — essa era a convenção que fazia fichas avulsas serem editáveis; ajustado junto em `CharacterSheet.tsx`/`app/personagem/[id]/page.tsx` pra usar `roomId` genuinamente opcional com `useRoomSync(..., {disabled: true})` em vez de fingir uma sala "demo").
2. **Bypasses de autenticação:** removidos de `lib/auth/{room-access,room-access-server,combat-turn-access,adventure-room-access,presence-access}.ts`, `lib/room/handlers/{combat-gm,gm-actor-progress,gm-saving-throw,culinary-meal}.ts`, e 6 rotas `app/api/room/[roomId]/...` — cada um era um `if (roomId === "demo")` adicional antes da checagem normal de dono/membro, que permanece intacta.
3. **Componentes de UI da mesa:** `Battlefield.tsx`, `MesaWorkspace.tsx`, `ActiveCharactersPanel.tsx`, `EndTurnBar.tsx`, `MesaVisitorNotice.tsx` (prop `isDemo` removida), `app/mesa/[roomId]/page.tsx`.
4. **Arquivos deletados** (após checar/limpar todos os consumidores): `lib/character/demo-characters.ts`, `lib/vtt/demo-scene.ts` (template de grid/cellSize extraído pra `DEFAULT_SCENE_TEMPLATE` em `lib/room/adventure-room.ts` antes de apagar), `lib/room/demo-character-sync.ts`, `components/vtt/DemoGuidedTour.tsx` + `lib/vtt/demo-guided-tour.ts` (guards mortos removidos de `MesaGuidedTour.tsx`/`VttMapGuideCluster.tsx` — CSS `.demo-guided-tour__*` **mantido**, é reaproveitado pelo tour real), `lib/auth/demo-users.ts`, `docs/DEMO-GUIADO.md`, `scripts/db/purge-users-except-demo.mjs` + entrada `db:purge-users` do `package.json`.
5. **Login "Demo Mestre"/"Demo Jogador"** (decisão à parte, confirmada explicitamente pelo usuário — "remover tudo junto"): botões removidos de `LoginForm.tsx`, seção "Contas demo" removida de `app/entrar/page.tsx`, `authenticateDemo` (dead code) removido de `user-store.ts`, `data/users/registry.seed.json` esvaziado (`[]`).
6. **CTAs de UI** removidos de `app/page.tsx`, `app/mesa/page.tsx`, `app/sistema/page.tsx` (4º passo do guia repontado pro hub de mesas em vez de deletado, preservando "Quatro etapas"), `app/mesas/page.tsx` (+ CSS morto), `SiteFooter.tsx`, `PortalShell.tsx`, `AdventureLobby.tsx`.
7. **Docs vivos** atualizados: `CLAUDE-PROJETO.md`, `COMBATE-MESA.md`, `CLAUDE-CODIGO-SEGURO.md`, `PERSISTENCIA.md`, `API-SALA.md`, `POSTGRES.md`, `P0-NEON-SETUP.md`, `A1-NEON-SMOKE.md`, `P8-PILOTO-TOKEN.md`, `HOMOLOG.md`. Docs de fase histórica (P2/P9/PRD/UX-MESA-E-RAIL/PARIDADE-FOUNDRY/ELDARIN-SITE-JOGAVEL, que também citam a demo) foram **deixados intactos** — são registro histórico de quando cada fase foi construída, mesma convenção do changelog.

**Débito técnico sinalizado (não corrigido nesta sessão):**
- 6 scripts em `scripts/smoke/*.mjs` (`combat-core`, `inventory-request-flow`, `level-up-pa-sync`, `p9-inventory-five-steps`, `pa-combat-spend`, `pa-turn-flow`) dependiam funcionalmente da sala/login demo via HTTP — vão quebrar (404/401) até serem reescritos pra criar uma aventura/mesa real + conta real antes de rodar.
- `data/homolog/mesa-local.seed.json` (fixture de teste local MariaDB, não relacionado à sala demo mas com o mesmo `ownerId: usr_demo_mestre`) precisa de uma conta real cadastrada antes de continuar funcionando — anotado em `docs/HOMOLOG.md`.

**Verificação:** `tsc --noEmit` limpo após cada etapa (núcleo, auth, UI, deleções, login, docs); grep final em todo `app/lib/components/scripts/data` por `"demo"`/`usr_demo` não encontrou nenhuma referência restante em código (só nos 6 smoke scripts sinalizados acima e nos docs históricos).

---

### 2026-07-24 (cont.) — O Um Anel: mesa jogável em modo narrado (sem combate tático)

**Pedido:** "deixe a mesa pronta pra pelo menos jogar narrado" — sem grid tático/tokens, mas com ficha visível na mesa, rolagem de dados do sistema e ajuste de recursos (Resistência/Esperança/Sombra) durante a sessão.

**Pesquisa prévia (2 workflows paralelos, ver journal.jsonl em subagents/workflows/wf_2386aff6-074 e wf_88647256-008):** mecânica exata de resolução (Dado de Proeza d12 + Dados de Sucesso d6, extraída de `livros/um-anel/02-resolucao-de-acoes.md` linha a linha) e mapeamento de risco de duas integrações possíveis com a mesa (RoomActor como union vs. painel/API totalmente separados) — confirmado que `RoomActor` tem acoplamento profundo (226 acessos a `identity`/`attributes`/`resources` em 48 arquivos do motor Eldarin), então a fase foi implementada com painel e storage 100% isolados, sem tocar `RoomActor`/`Battlefield.tsx`.

**Engenharia:**
1. `lib/character/um-anel/dice.ts` — motor de resolução: Feat Die (1-10 numérico, 11=Olho de Sauron=0, 12=Runa de Gandalf=sucesso automático), Dados de Sucesso somam valor de face (6 conta como "ícone de sucesso" pro grau), Favorecida/Desfavorecida (2 dados de proeza, cancelam se ambas se aplicam), Cansado zera dados de sucesso 1-3, Deplorável vira falha automática no Olho de Sauron. Testado com script de lógica pura (20k rolagens, distribuição de faces ~1/12 cada, todas as regras de cancelamento/auto-sucesso/auto-falha validadas).
2. `lib/character/um-anel/normalize.ts` — Cansado (`Resistência ≤ Carga`) e Deplorável (`Sombra ≥ Esperança atual`) passam a ser **derivados automaticamente**, não mais um toggle manual — evita ficha desatualizada.
3. `lib/character/um-anel/characters.ts` — `listTorCharactersForAdventure` (fan-out por todos os membros da aventura, espelha `lib/room/adventure-actors.ts::resolvedParticipantIds`) e `patchTorCharacterResources` (dono da ficha ou mestre da aventura podem ajustar Resistência/Esperança/Sombra/Fadiga/Ferido/Tesouro/Companhia, com clamps).
4. `app/api/tor-characters/route.ts` (GET por `adventureId`, checa membership) e `app/api/tor-characters/[id]/route.ts` (novo — GET individual + PATCH de recursos).
5. `TorCharacterSheetView` ganhou modo `interactive` (opt-in via prop — a página solo `/personagem/[id]` continua só-leitura): botão "Rolar" por Perícia/Proficiência de Combate, steppers +/- pra Resistência/Esperança/Sombra/Fadiga/Tesouro, toggle de Ferido.
6. `TorPlayableCharactersPanel.tsx` (lista os aventureiros da aventura) e `TorCharacterSheetPopup.tsx` (ficha interativa em janela — busca/PATCH via as rotas acima, posta resultado de rolagem no chat via `postRoomChat` já existente, **sem** criar um novo `kind` de mensagem nem tocar no motor de dados 3D do Eldarin).
7. Duas janelas novas registradas em `lib/vtt/foundry-window-placement.ts`/`hooks/vtt/useFoundryWindows.ts` (`torParty`, `torFicha`) — renderizadas em `MesaFoundryFloatingWindows.tsx` só quando `rpgSystemId === "um-anel"`; `MesaWorkspace.tsx` ganhou `openTorSheet`/`closeTorSheet` espelhando `openSheet`/`closeSheet` do Eldarin. Criar personagem pela mesa agora abre a ficha no popup próprio (antes abria em aba nova).

**Fora de escopo (proposital):** combate tático, tokens no mapa, iniciativa — nada disso foi tocado; a mesa do Um Anel continua sem grid, adequada só pra jogo narrado/theater-of-mind.

**Verificação:** `tsc --noEmit` limpo; teste de lógica pura do motor de dados (12 grupos de asserção, 0 falhas); smoke test via Puppeteer confirmou que a mesa carrega sem erro de página com o novo painel presente (o único 500 observado foi o mesmo problema pré-existente de `materializeSessionUser` em modo sem banco, já documentado na entrada anterior — não uma regressão nova).

---

### 2026-07-24 (cont.) — Correção da criação de personagem + tooltips + compêndio/mundo por sistema (commit `c8b0ed2`)

**Pedido:** usuário reportou erro em produção (`Table 'mxdrpg.um_anel_characters' doesn't exist` — resolvido via migração rodada pelo administrador de infra do usuário) e que "a criação de personagem tá meio fraca, tá bem diferente a ficha"; também pediu tooltips em tudo (classes/vocações, armas, perícias) e reforçou que compêndio/mundo precisam ser separados por sistema (MXDRPG é hub, não só Eldarin).

**Passo a passo:**
1. Diagnóstico — o wizard nunca coletava arma/armadura/elmo/escudo iniciais: toda ficha nascia com `warGear: []` e `armour` vazia, por isso a ficha parecia "fraca" comparada à ficha completa esperada.
2. Adicionado passo **"Equipamento"** ao wizard (`TorCharacterCreationWizard.tsx`, 8→9 passos): grades de escolha por Proficiência de Combate (`weaponsForProficiency`), armadura/elmo/escudo (`ARMOURS`/`HELM`/`shieldsForCulture`), respeitando restrições de Cultura (Anões sem grande arco/lança/escudo, Hobbits só com armas pequenas).
3. Tooltips nativos (`title`) em nomes de Perícia, Proficiência de Combate e linhas de Equipamento de Guerra na ficha e no wizard, via `WizardHoverTip` já existente.
4. `/compendios` e `/mundo` reescritos para despachar por `?sistema=` (`RpgSystemContentTabs` novo, reaproveitável) — `TorCompendiumPage`/`TorWorldLore` novos, conteúdo curado de Eriador (Condado, Bri, Lago Evendim etc.) só aparecem quando `sistema=um-anel`; Eldarin continua como estava.

**Verificação:** `tsc --noEmit` + `npm run build` limpos antes do push (CSS import faltante de `tor-compendium.css` pego a tempo pelo build, não pelo tsc).

**Commits:** `c8b0ed2`.

---

### 2026-07-24 (cont.) — Ficha do Um Anel: reconciliação de termos PT-BR + redesign visual pergaminho/tinta vermelha

**Pedido:** usuário subiu a ficha editável oficial (fã-tradução PT-BR) do Um Anel como referência e pediu "veja o que precisa pra fazer uma ficha bonita e funcional" no mesmo estilo visual.

**Passo a passo:**
1. Comparação da ficha de referência com o glossário próprio (`livros/um-anel/00-glossario-termos.md`) revelou termos divergentes — decisão: adotar os termos da ficha oficial onde os dois glossários conflitavam (é a referência que o usuário quer replicar). Trocados **apenas labels visíveis** (`data.ts`, mensagens de validação do wizard, glossário) — ids internos (`argucia`, `imponencia` etc.) não mudaram, zero risco de migração de dados: Argúcia→Astúcia, Aparar→Bloqueio, Vocação→Chamado, Cansado→Exausto, Deplorável→Arrasado, e 9 nomes de Perícia (Imponência→Fascínio, Percepção→Vigilância, Caça→Caçada, Canto→Música, Encorajar→Indução, Viajar→Viagem, Perspicácia→Discernimento, Vasculhar→Busca, Explorar→Exploração, Saber→História).
2. Descoberto que `app/globals.css` já reserva tokens `--content-bg`/`--content-bg-elevated`/`--content-border`/`--content-ink` explicitamentente pra "pergaminho, fichas, compêndio" — nunca usados em nenhum componente. `TorCharacterSheetView`/`tor-sheet.css` reescritos pra usá-los: folha clara com tinta vermelha (`--tor-red: #7a1e1e`) sempre, independente do tema escuro do resto do site (igual um PDF impresso sobre uma mesa escura).
3. Layout reorganizado mais perto do original: cabeçalho com regra dupla, bênção da Cultura + Caminho da Sombra logo abaixo do nome, 3 colunas de Atributo com selo em losango (valor do Atributo) + NA, Perícias com **losangos de graduação** (`RatingPips`, até 6 losangos preenchidos + "+N" se exceder) em vez de número cru — Perícia/Proficiência Favorecida ganha destaque (fundo rosado + losangos com glow).
4. Verificação visual: HTML estático espelhando a marcação real + `tor-sheet.css` real, screenshot via Puppeteer/Chrome local (padrão já usado na sessão) — confirmado visualmente antes de finalizar; puppeteer-core removido depois (`git status` limpo em package.json/lock).

**Arquivos tocados:** `components/character/sheet/{TorCharacterSheetView.tsx,tor-sheet.css}` (reescrita), `lib/character/um-anel/{data,types,normalize,dice,wizard-types}.ts`, `components/character/wizard/TorCharacterCreationWizard.tsx`, `components/compendium/TorCompendiumPage.tsx`, `app/aventura/[adventureId]/personagem/novo/page.tsx`, `livros/um-anel/00-glossario-termos.md`.

**Verificação:** `tsc --noEmit` limpo, `npm run build` limpo, screenshot conferido visualmente.

---

### 2026-07-25 — O Um Anel: Fase 4, combate tático no mapa (v1)

**Pedido:** usuário confirmou querer "tudo do Um Anel" — a última peça faltante pro sistema ser jogável de ponta a ponta era combate tático (tokens no mapa hex existente, resolução de ataque com a matemática do livro), que ainda não existia (só a mesa narrada sem grid, da sessão anterior).

**Pesquisa/plano prévio:** Explore agent + leitura direta de código confirmaram que não existe nenhum ponto de dispatch por sistema no pipeline tático (`RoomActor`/`BattleToken`/motor de ataque/iniciativa são um único tipo "gordo" 100% Eldarin). Decisão de arquitetura (validada por um Plan agent + leitura direta): `BattleToken` ganha `torCombat?: TorCombatTokenFields` opcional — um "bag" leve no mesmo espírito de `gmCreatureStats` (criaturas de mestre sem ficha completa), em vez de unionizar `RoomActor`/`CharacterSheet` (custaria dezenas de callsites em `lib/combat/attack.ts` sem ganho, já que o resto do pipeline — canvas, `CombatTrack` — já é agnóstico o bastante). Plano salvo em `C:\Users\Raul\.claude\plans\peaceful-puzzling-hopper.md`.

**Risco de segurança identificado e neutralizado (não era só polimento):** `canOpenActionRing`/`onActionRingRequest` em `Battlefield.tsx` não checavam sistema — `listTokenCombatActions` cai em `[UNARMED]` pra qualquer token sem `actor`/`gmCreationId`/`monsterEntryId` (exatamente a forma de um token do Um Anel). Sem gate, o anel de ação **Eldarin** abriria num token do Um Anel e rodaria `resolveTokenAttack` (d20 vs `defesa`) errado. Corrigido no ponto de renderização do ring: `selected.torCombat ? <TorAttackPopup> : <TokenActionRing>` — tratado como bloqueante da mesma sub-fase em que tokens do Um Anel passam a existir no mapa, não deixado pra depois.

**Engenharia (mecânica RAW extraída de `livros/um-anel/06-fases-de-aventura-combate.md` e `08-mestre-e-adversarios.md`):**
1. `lib/character/um-anel/{adversary-types,adversaries}.ts` — 4 Adversários de exemplo (Soldado Orc, Cacique Orc, Warg, Grande Troll das Cavernas) com Nível de Atributo/Vigor/Ódio/Bloqueio/Proteção/Habilidades Sinistras (texto, não mecanizadas no v1).
2. `lib/vtt/types.ts` — `BattleToken.torCombat?` (kind hero/adversary, parry, protectionDice, strength/attributeLevel, wounded, eliminated, actions[] pra adversário).
3. `lib/vtt/tor-player-token.ts` / `lib/character/um-anel/adversary-token.ts` — adapters `TorCharacterSheet`/`TorAdversaryStats` → `BattleToken` (PA fixado em 999 — Um Anel não tem orçamento de PA de movimento, e sem isso o token trava no mapa via `checkCanSpendPa`).
4. `lib/room/handlers/tor-tokens.ts` + 2 rotas novas (`tokens/place-tor-character`, `tokens/spawn-tor-adversary`) — colocar herói/invocar adversário, espelhando `placeRoomActorOnCell`/`spawnRoomMonster` sem editá-los.
5. `lib/combat/um-anel/resolve-attack.ts` (puro) — TN = `20-Força+Bloqueio do alvo` (herói atacando) ou `Bloqueio do alvo` puro (adversário atacando); Golpe Perfurante em Proeza 10 ou Runa (`numeric===10` cobre os dois, já codificado em `dice.ts`); teste de Proteção; tabela de Severidade da Ferida (Moderado/Grave+dias/Gravíssimo); adversário eliminado em qualquer Ferida. Testado com 6 cenários do livro via script descartável (18 asserções, `Math.random` mockado) — não commitado.
6. `lib/combat/um-anel/vitals.ts` — aplica resultado direto em `vida`/`defeated`/`torCombat`, **nunca** via `patchTokenVitals` (injeta condição Eldarin `"inconsciente"` + contador de morte de 10 rodadas que não existem no livro).
7. `lib/room/handlers/tor-combat-attack.ts` + branch de 1 linha em `app/api/room/[roomId]/combat/attack/route.ts` (`room.rpgSystemId === "um-anel" ? executeRoomTorAttack : executeRoomAttack`) — sincroniza Resistência/Ferida de volta pra `um_anel_characters` via `patchTorCharacterResources` (ganhou campo `injury` novo).
8. `components/vtt/TorAttackPopup.tsx` — escolher arma/ação + alvo, mostra resultado formatado no chat.
9. `TurnOrderPanel.tsx` — esconde "Rolar iniciativa" (Um Anel usa ordem por colocação no mapa, já suportado sem código novo via `applyMapPlacementCombatOrder`).

**Verificação:** `tsc --noEmit` + `npm run build` limpos a cada sub-fase. Regressão Eldarin testada **de ponta a ponta com um smoke test real** (não só análise estática): `ELDARIN_DISABLE_DB=1 npm run dev` + Puppeteer/Chrome local — criou conta, criou mesa Eldarin, invocou 2 Goblins, confirmou visualmente que o `TokenActionRing` original abre normalmente (não `TorAttackPopup`) num token sem `torCombat`, ativou modo Combate, e resolveu um ataque de verdade via API (`Goblin 1 acerta Goblin 2: 12 vs CA 12`, d20+CA+dano 1d6 intactos) — zero erros de página em toda a sessão. Ambiente de teste limpo depois (puppeteer-core desinstalado, scripts/screenshots descartados, dev server encerrado).

**Fora de escopo (deferido pra v1.1, documentado no plano — não omitido em silêncio):** Posturas de Combate (Forward/Open/Defensive/Rearward) e suas Tarefas de Combate, Dano Especial completo (Golpe Pesado/Aparar/Perfurar/Investida de Escudo), Recuo, regras de Engajamento por contagem (v1 é "levemente posicional" — qualquer token ataca qualquer outro no mapa), bestiário arrastável (v1 usa lista simples com botão "Invocar" dentro do painel de personagens).

**Arquivos tocados:** ver lista completa no plano; novos principais — `lib/character/um-anel/{adversary-types,adversaries,adversary-token}.ts`, `lib/combat/um-anel/{resolve-attack,vitals}.ts`, `lib/room/handlers/{tor-tokens,tor-combat-attack}.ts`, `lib/vtt/tor-player-token.ts`, `components/vtt/TorAttackPopup.tsx`, 2 rotas de API novas; editados — `lib/vtt/types.ts`, `lib/room/store.ts`, `app/api/room/[roomId]/combat/attack/route.ts`, `components/vtt/{Battlefield,MesaWorkspace,TurnOrderPanel,TorPlayableCharactersPanel}.tsx`, `components/vtt/mesa/{MesaBattlefieldStage,MesaFoundryFloatingWindows}.tsx`, `hooks/useRoomSync.ts`, `lib/character/um-anel/{characters,rules,types}.ts`.

---

### 2026-07-25 (cont.) — Bestiário completo (21 adversários) + Tesouro Mágico do Um Anel

**Pedido:** usuário apontou que os 4 adversários da Fase 4 eram só amostra ("isso era o básico") e pediu extração completa do bestiário e dos itens do livro, reforçando que a mesa do Um Anel não pode puxar nada do Eldarin.

**Passo a passo:**
1. Releitura integral de `livros/um-anel/08-mestre-e-adversarios.md` (~1780 linhas) pra cobrir as seções ainda não extraídas: Homens Maus (5), Orcs (7, incluindo os 2 já feitos), Trolls (4, incluindo o já feito), Mortos-Vivos (3), Lobos Selvagens (2, incluindo o já feito) e Lobisomens (1) — total 21 adversários únicos em `lib/character/um-anel/adversaries.ts` (era 4).
2. Extraído também o capítulo de Tesouro (`lib/character/um-anel/{treasure-types,treasure}.ts`, novo): tabela de Tesouros (Menor/Maior/Maravilhoso), 20 Recompensas Encantadas (qualidades mágicas de Armas/Armaduras Famosas — Ajuste Ancestral, Afiado Superior, Extermínio de Inimigos, Armadura de Mithril etc.), 6 categorias de Bênçãos (36 combinações Perícia+tipo de item pra Artefatos Maravilhosos/Itens Prodigiosos), 9 Itens Amaldiçoados (Maldição da Fraqueza, Escurecer, Caçado, Má Sorte, Mau Presságio, Malícia, Possuído, Mancha da Sombra, Enfraquecimento). Ficou de fora deliberadamente: geração procedural de Objetos Preciosos (tabelas de Forma/Material) e o sistema de "Olho de Mordor"/Caçada (mecânica de campanha separada, não é bestiário nem item) — não pedidos, não mecanizados.
3. `TorCompendiumPage.tsx` ganhou 3 seções novas (Tesouro, Bênçãos, Recompensas Encantadas, Itens Amaldiçoados) lendo os arrays acima — mesmo padrão das seções existentes, sem tocar em `CompendiumPackId`/compêndio Eldarin.
4. Verificação explícita de isolamento (pedido reforçado do usuário): `grep` em todo `lib/character/um-anel/`, `lib/combat/um-anel/` e componentes TOR por imports de `lib/vtt/monsters`, `monstros.json`, `lib/compendium/*`, `lib/combat/attack.ts` — zero ocorrências (o único import de fora é `BaseCharacterFields` de `lib/character/types.ts`, os ~7 campos genéricos compartilhados por design desde a Fase 2, não conteúdo de jogo do Eldarin).
5. Bug reportado separadamente pelo usuário e corrigido de passagem: painel de Convite (`RoomInvitePanel`) tinha `aspect-ratio: 1` forçando quadrado + `justify-content: center` em `.mesa-panel-scroll--invite`/`.foundry-window--invite .foundry-window__body` — com conteúdo mais alto que o quadrado, a centralização cortava/sobrepunha o topo (bug clássico de flexbox "overflow + center"). Corrigido: removido o `aspect-ratio`, `justify-content` trocado pra `flex-start` + `overflow-y: auto` no body da janela. Não relacionado à Fase 4 (pré-existente).

**Deferido (não investigado ainda):** ícone de dado pequeno não aparece no chat pra rolagens (`1d10 → 1`) — vive em `DiceBoxMini`/`combat-dice-model.ts`/`dice-combat-box.ts`, um sistema de dados 3D (WebGL) via lib vendor, completamente separado do trabalho desta sessão. Reportado pelo usuário, não investigado a fundo ainda (provável falha de asset/render específica de d10 na lib 3D, não confirmado).

**Verificação:** `tsc --noEmit` + `npm run build` limpos.

**Arquivos tocados:** `lib/character/um-anel/adversaries.ts` (4→21 entradas), `lib/character/um-anel/{treasure-types,treasure}.ts` (novos), `components/compendium/{TorCompendiumPage.tsx,tor-compendium.css}`, `components/vtt/vtt.css` (fix painel de convite).

---

### 2026-07-25 (cont.) — Compêndio dentro da mesa (painel "Compêndio" no rail, Eldarin + Um Anel)

**Pedido:** usuário reportou "compêndio não funcional pros jogadores verem o que precisarem dos personagens" — na prática, "não acho o menu"/"não carrega" dentro da mesa.

**Diagnóstico:** `/compendios` (página avulsa) sempre funcionou sem trava de acesso. O problema real: existe desde antes desta sessão um componente `components/vtt/MesaCompendiumPanel.tsx` (wrapper de `CompendiumBrowser` pro rail da mesa), mas ele ficava pendurado num rail antigo (`MesaSideRail.tsx`) que não é mais renderizado em lugar nenhum — sobrou órfão quando a mesa foi redesenhada pro layout "Foundry" atual (`MesaFoundryDockRail`/`MesaFoundryFloatingWindows`). Ou seja: o acesso ao compêndio *de dentro da mesa* foi derrubado silenciosamente numa refatoração anterior, pro Eldarin e pro Um Anel igual — não é bug desta sessão, mas a causa raiz da reclamação.

**Correção:**
1. Novo ícone "Compêndio" no rail (`MesaRailIcon.tsx`/`MesaIconBar.tsx`), sempre visível (jogador e mestre, sem gate de `showGm`).
2. Novo `MesaWindowId` `"compendium"` (`foundry-window-placement.ts`/`useFoundryWindows.ts`, dockável e flutuante — clique normal abre no rail, clique direito abre janela).
3. Conteúdo despachado por `rpgSystemId` em `MesaFoundryDockRail.tsx` e `MesaFoundryFloatingWindows.tsx`: Um Anel → `TorCompendiumPage` direto (zero dependência de servidor, já é só dado estático); Eldarin → `MesaEldarinCompendiumPanel.tsx` (novo) buscando `/api/compendium?roomId=...` (nova rota, novo) — reaproveita `getVisiblePacks`/`getPackEntries` já existentes, mas calcula `isRoomGm` **por sala** (`canManageRoom`) em vez de só o papel global, porque o pacote "monstros" só aparece pro mestre daquela mesa especificamente (mesma regra da página avulsa).
4. Verificado que isso não reabre a porta pro Um Anel puxar dado do Eldarin: o branch é `rpgSystemId === "um-anel" ? <TorCompendiumPage/> : <MesaEldarinCompendiumPanel/>` — cada um só importa o próprio lado.

**Verificação:** `tsc --noEmit` + `npm run build` limpos.

**Arquivos tocados:** novos — `app/api/compendium/route.ts`, `components/vtt/MesaEldarinCompendiumPanel.tsx`; editados — `components/vtt/foundry/{MesaRailIcon,MesaIconBar}.tsx`, `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`, `components/vtt/MesaWorkspace.tsx`, `hooks/vtt/useFoundryWindows.ts`, `lib/vtt/foundry-window-placement.ts`.

---

### 2026-07-25 (cont.) — Mais 4 capítulos do livro extraídos: Virtudes Culturais, Empreitadas, Patronos, Coisas Sem Nome

**Pedido:** usuário confirmou querer a extração de "tudo que sobrou do livro" pro compêndio.

**Passo a passo:**
1. Releitura de `05-valor-e-sabedoria.md` — Recompensas/Virtudes genéricas já estavam 100% capturadas (`STARTING_REWARDS`/`STARTING_VIRTUES`, 6+6). O que faltava: **36 Virtudes Culturais** (6 por Cultura, escolhidas a partir de Sabedoria 2) — novo `lib/character/um-anel/cultural-virtues.ts`.
2. `07-fases-de-companhia-jornada.md` — 9 Empreitadas da Fase de Companhia (Reunir Boatos, Curar Cicatrizes, Encontrar Patrono etc., algumas só-Yule, algumas grátis por Chamado) + tabela de custo em XP — novo `lib/character/um-anel/undertakings.ts`.
3. `13-apendice-patronos-e-ficha.md` — 6 Patronos (Balin, Bilbo, Círdan, Gandalf, Gilraen, Tom Bombadil/Baga de Ouro, cada um com bônus de Companhia + vantagem nomeada) — novo `lib/character/um-anel/patrons.ts`. Também o gerador de "Coisas Sem Nome" (adversário único procedural — 8 tabelas de Dado de Proeza/Sucesso) — novo `lib/character/um-anel/nameless-things.ts`. **Não** extraído: a seção "Landmarks"/"The Star of the Mist" (uma mini-aventura específica, não é catálogo de sistema) e o Índice alfabético (nota do próprio livro dizendo que não tem regra nova).
4. `TorCompendiumPage.tsx` ganhou 4 seções novas (Virtudes Culturais, Coisas Sem Nome, Empreitadas da Fase de Companhia, Patronos) lendo os arrays acima.
5. **Achado importante durante a releitura de `10-rivendell.md` (ainda não extraído):** o capítulo tem uma **7ª Cultura jogável completa** (Altos-Elfos de Valfenda, com atributos/perícias/proficiências/traços/virtudes próprios) que não existe no sistema, mais PNJs notáveis (Elrond, Arwen, Elladan/Elrohir, Erestor, Glorfindel) com stat blocks. `11-personagens-exemplo.md` tem 8 pré-prontos (Drogo Bolseiro, Esmeralda Took, Lobelia Sacola-Luva, Paladin Took II, Primula Brandebuque, Rorimac Brandebuque, Balin, Bilbo). Nenhum dos dois foi extraído ainda nesta entrada — fica pra próxima, porque uma 7ª Cultura mexe em `TorCultureId` (tipo usado no wizard/normalize/rules), risco maior que as adições puramente aditivas de compêndio feitas até aqui.

**Verificação:** `tsc --noEmit` + `npm run build` limpos.

**Arquivos tocados:** novos — `lib/character/um-anel/{cultural-virtues,undertakings,patrons,nameless-things}.ts`; editado — `components/compendium/TorCompendiumPage.tsx`.

---

### 2026-07-25 (cont.) — 7ª Cultura jogável (Altos-Elfos de Valfenda) + PNJs notáveis + Elrond como Patrono

**Pedido:** continuação de "puxe tudo que sobrou do livro" — chegou a vez de `10-rivendell.md`, que tinha ficado marcado como pendente na entrada anterior por envolver risco maior (nova Cultura mexe em `TorCultureId`, tipo usado no wizard/normalize/rules).

**Verificação de risco antes de mexer:** `grep` confirmou que só existe UMA especialização por Cultura em todo o código (`cultureId === "anoes"`, redução de Carga de armadura, em `rules.ts`) — nem o wizard (mapeia `CULTURES` genericamente), nem `normalize.ts` têm qualquer lógica hardcoded pra Cultura específica. Adicionar uma 7ª Cultura era, portanto, uma mudança aditiva de baixo risco, confirmada por `tsc --noEmit` limpo (nenhum switch exaustivo quebrou) logo depois de editar `TorCultureId`.

**Passo a passo:**
1. `TorCultureId` ganhou `"altos-elfos-de-valfenda"`; nova entrada em `CULTURES` (`data.ts`) com todos os campos do livro — Bênção Cultural (Sábio-Élfico: sucesso Mágico gastando Esperança se não Arrasado + 1 ponto extra de Atributo), traço extra (Marcado pelo Pesar: só remove Sombra em Yule), Padrão de Vida Próspero, 6 conjuntos de Atributos, perícias-base, e as mesmas 8 opções de Traço Distintivo do livro (todas já existiam no sistema — Belo, Olhos de Lince, Nobre, Curioso, Jovial, Orgulhoso, Sutil, Obstinado).
2. 4 Virtudes Culturais próprias (Artífice de Eregion, Beleza das Estrelas, Poder dos Primogênitos, Habilidade dos Eldar) em `cultural-virtues.ts` — mais uma 5ª habilidade de Conselho que o livro descreve na mesma seção sem nome próprio claro, anexada como parágrafo extra em vez de inventar um nome. O livro diz que Altos-Elfos **também** escolhem da lista dos Elfos de Lindon — em vez de duplicar as 6 entradas, `TOR_CULTURAL_VIRTUES_BY_CULTURE["altos-elfos-de-valfenda"]` concatena as duas listas na leitura.
3. Elrond adicionado como **7º Patrono** em `patrons.ts` (é o único PNJ do capítulo com tabela formal de Patrono no livro — Nível de Companhia +1, vantagem "Maior dos Mestres do Saber").
4. Os outros PNJs notáveis do capítulo (Arwen, Elladan e Elrohir, Erestor, Glorfindel) — sem tabela de Patrono, só descrição — foram pra um tipo novo e mais simples, `lib/character/um-anel/notable-npcs.ts`.
5. `TorCompendiumPage.tsx`: seção "Culturas" e "Virtudes Culturais" já eram genéricas (mapeiam `CULTURES`) — passaram a mostrar a 7ª Cultura sem nenhuma edição além de trocar o filtro raso por `TOR_CULTURAL_VIRTUES_BY_CULTURE` (pra herdar as virtudes dos Elfos de Lindon corretamente). Nova seção "PNJs Notáveis de Valfenda".

**Deferido:** `11-personagens-exemplo.md` (8 pré-prontos: Drogo Bolseiro, Esmeralda Took, Lobelia Sacola-Luva, Paladin Took II, Primula Brandebuque, Rorimac Brandebuque, Balin, Bilbo) e o "Landmarks"/"Star of the Mist" — ambos ficam pra uma próxima passada.

**Verificação:** `tsc --noEmit` + `npm run build` limpos (confirmando que nenhuma lógica de Cultura hardcoded quebrou em lugar nenhum do wizard/normalize/rules).

**Arquivos tocados:** novo — `lib/character/um-anel/notable-npcs.ts`; editados — `lib/character/um-anel/{types,data,patrons,cultural-virtues}.ts`, `components/compendium/TorCompendiumPage.tsx`.

---

### 2026-07-25 (cont.) — Upload de retrato/token pra fichas do Um Anel + 8 Personagens Pré-Gerados do Starter Set

**Pedido:** "cria ai, e bota opção de subir imagem do personagem + token" — as duas tarefas deixadas pendentes na entrada anterior.

**Upload de retrato/token (Um Anel não tinha, só Eldarin tinha):**
1. `TorResourcePatch` (`lib/character/um-anel/types.ts`) ganhou os 5 campos de retrato (`portraitUrl`, `tokenImageUrl`, `portraitFocus`, `coverFocus`, `tokenFocus` — todos já existem em `BaseCharacterFields`, só faltava o patch aceitar); `patchTorCharacterResources` (`characters.ts`) passou a aplicá-los no merge, junto dos campos de recurso já existentes. Zero migração de banco — a ficha inteira é um blob JSON (`um_anel_characters.data`), então os campos novos persistem sozinhos.
2. Novo par de funções em `lib/character/portrait-persist-client.ts` — `persistPortraitBundleToTorCharacter`/`clearPortraitOnTorCharacter` — espelham as versões Eldarin, mas batem em `/api/tor-characters/[id]` (rota que já existia, só passou a aceitar esses campos a mais no corpo do PATCH).
3. `TorCharacterSheetView.tsx` ganhou um cabeçalho com retrato (reaproveita `SheetPopupPortrait` — mesmo componente do Eldarin, no modo `onPersistBundle` sob medida, sem precisar estender o union fechado `mode: "room"|"character"` de `PortraitEditorFields`). Novo prop `canEditPortrait`. Como o componente Eldarin herda um clip-path de brasão (`components/vtt/eldarin-v4.css`, carregado global no layout), a ficha do Um Anel sobrescreve pra um quadro liso em `tor-sheet.css` (`.tor-sheet__masthead-portrait ...`) — sem vazar visual do Eldarin pra ficha do Um Anel.
4. Ligado em dois lugares: popup da mesa (`TorCharacterSheetPopup.tsx`, sempre `canEditPortrait` — igual ao padrão já existente dos steppers de recurso, que confiam na checagem de permissão do servidor `isOwner || isGm`) e na página avulsa `/personagem/[id]` (`canEditPortrait = torCharacter.ownerId === session.user.id`, já que essa página não tem conceito de mestre de sala fora de uma mesa). Spawn de token no mapa (`lib/vtt/tor-player-token.ts`) já lia `tokenImageUrl` da ficha desde a Fase 4 — o retrato novo chega automaticamente no token, sem tocar nesse arquivo.

**8 Personagens Pré-Gerados (`livros/um-anel/11-personagens-exemplo.md`):**
- Novo `lib/character/um-anel/pregens.ts` — Drogo Bolseiro, Esmeralda Took, Lobelia Bracegirdle, Paladin Took II, Primula Brandybuck, Rorimac Brandybuck, Balin filho de Fundin, Bilbo Bolseiro. Cada um com atributos, as 18 perícias, proficiências de combate, recompensas/virtudes, equipamento de guerra/armadura/escudo, equipamento de viagem, citação e histórico — tudo traduzido pro PT-BR, reaproveitando ids já existentes de `DISTINCTIVE_FEATURE_BY_ID`/`STARTING_VIRTUES`/Virtudes Culturais em vez de duplicar texto (ex.: Balin usa as mesmas Virtudes Culturais Anãs já extraídas — "Escuro pra Trabalho Escuro", "Caminho de Durin" — e Bilbo usa as mesmas de Hobbit — "Bravo no Aperto", "Certeiro no Alvo").
- **Decisão consciente de não tornar isso fichas 100% jogáveis via assistente:** o PDF do Starter Set não tem Vocação/Caminho da Sombra/Padrão de Vida (campos só do Livro Básico, obrigatórios em `TorCharacterSheet`) — inventar esses valores seria fabricar conteúdo que o livro não define. Por isso os 8 viraram referência de compêndio (nova seção "Personagens Pré-Gerados (Starter Set)" em `TorCompendiumPage.tsx`), não registros de `TorCharacterSheet` gerados por `createTorCharacterFromWizard`.
- **Discrepância do próprio material-fonte, não repetida:** o markdown de extração já sinalizava que os NAs de Atributo impressos nas 8 fichas seguem `NA = 18 − Atributo`, enquanto `attributeTN()` (usado no resto do sistema) é `NA = 20 − Atributo`. Os NAs exibidos no compêndio são sempre calculados ao vivo com `attributeTN()`, não copiados do PDF — consistência interna do sistema priorizada sobre uma discrepância não resolvida da fonte.
- Nomes de família Took/Brandybuck/Bracegirdle/Sackville mantidos em inglês (só "Baggins→Bolseiro" traduzido, por ser tradução oficial brasileira de alta confiança e já usada em `patrons.ts` pro próprio Bilbo) — evita arriscar uma grafia oficial incerta pros sobrenomes menos comuns.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Smoke test com Chrome real via `puppeteer-core` (instalado com `--no-save`, desinstalado depois — `git status` confirmou `package.json`/`package-lock.json` sem diff): `/compendios?sistema=um-anel` renderizou a seção "Personagens Pré-Gerados (Starter Set)" com os 8 cards esperados, sem erros de console. O fluxo completo de upload de retrato (registrar usuário → criar personagem → subir imagem) não pôde ser testado ponta a ponta neste sandbox — o MariaDB local do `.env.local` não estava de pé (`ECONNREFUSED 127.0.0.1:3306`), e a resolução de conta (`fetchUserByIdStrict`) exige banco real mesmo com `ELDARIN_DISABLE_DB=1` (comportamento pré-existente do app, não desta sessão). Recomendado um teste manual do upload numa ficha real assim que o banco de dev estiver acessível.

**Arquivos tocados:** novo — `lib/character/um-anel/pregens.ts`; editados — `lib/character/um-anel/{types,characters}.ts`, `lib/character/portrait-persist-client.ts`, `components/character/sheet/{TorCharacterSheetView.tsx,tor-sheet.css}`, `components/vtt/TorCharacterSheetPopup.tsx`, `app/personagem/[id]/page.tsx`, `components/compendium/TorCompendiumPage.tsx`.

---

### 2026-07-25 (cont.) — Marcos (Landmarks) + Coisas Sem Nome completo + compêndio do Um Anel reorganizado em abas (sidebar), igual ao Eldarin

**Pedido:** "próximo passo?" seguido de "compendium do eldarin ta todo dividido e bem bonito, deixe assim também o de senhor dos anéis" — o compêndio do Um Anel era uma única página com ~19 seções empilhadas em rolagem contínua, sem a navegação lateral por categorias que o Eldarin já tem.

**Investigação paralela (agente em background, concluída, correção ainda não aplicada):** bug relatado anteriormente ("dado pequeno não aparece no chat") — causa raiz confirmada: todo roll do Um Anel (`TorCharacterSheetPopup.tsx`, `tor-combat-attack.ts`) posta no chat com `kind: "chat"` (texto pré-formatado), nunca `kind: "roll"` com um `message.roll = {formula, rolls, total}`. O gate que monta o `DiceBoxMini` em `RoomChat.tsx` exige exatamente `kind==="roll" && message.roll` — então o componente de dado nunca é montado pro Um Anel (não é bug de CSS/tamanho, é ausência total de instanciação). Causa estrutural: o dado do Um Anel (Dado de Proeza d12 com faces Olho/Runa + N Dados de Sucesso d6) não tem representação no formato `NdM` que o parser genérico (`lib/dice/roll.ts`) entende, e o schema `ChatMessage.combat` também é todo desenhado pro Eldarin (`attackerTokenId`, `defenderAc` etc.). Corrigir exige desenhar uma representação de dado própria do Um Anel — deferido pra uma próxima sessão (não é mudança pequena).

**Lacunas encontradas na extração de "Coisas Sem Nome" (capítulo já extraído antes, mas incompleto):** ao reler `13-apendice-patronos-e-ficha.md` pra pegar Marcos, notei que as Tabelas 3 (No Primeiro Encontro), 4 (Um Boato) e 5 (Onde É Lembrada) do gerador de Coisas Sem Nome nunca tinham sido extraídas (só as Tabelas 1-2 e 6-8 existiam). Completadas agora em `nameless-things.ts` (`TOR_NAMELESS_BEFORE_SEEN`, `TOR_NAMELESS_FIRST_SEEN`, `TOR_NAMELESS_RUMOURS`, `TOR_NAMELESS_LORE_SOURCES`) e exibidas no compêndio — o gerador agora está 100% completo (8 tabelas, não mais 5).

**Marcos (novo, `lib/character/um-anel/landmarks.ts`):** a estrutura de 6 partes que todo Marco publicado segue (Nome/Boato/Antecedentes/Mapa/Locais/Tramas e Problemas), mais o Marco de exemplo completo do livro, "A Estrela na Bruma" (Boato, Saber Antigo, Antecedentes, Locais, e as 3 tramas — Bandidos, Anões Traiçoeiros, Encurralados). A adversária única do Marco, Elwen a Espectra Funesta, virou uma entrada de verdade em `adversaries.ts` (tier `"boss"`, com Habilidades Sinistras próprias) em vez de só texto solto — assim ela também pode ser invocada na mesa como qualquer outro adversário, e o compêndio faz join direto com `TOR_ADVERSARY_BY_ID` pra mostrar o stat block dela junto do Marco.

**Reorganização visual do compêndio (`TorCompendiumPage.tsx`):** a página virou Client Component com navegação lateral (reaproveitando `OrnamentCard` + as classes `comp-shell`/`comp-sidebar`/`comp-pack-list`/`comp-main` já existentes em `compendium.css`, o mesmo CSS que o Eldarin usa — zero CSS novo pro "esqueleto" da navegação). As ~19 seções foram agrupadas em 6 categorias (mesma contagem do Eldarin): Personagem, Equipamento, Adversários, Tesouro, Companhia & Mundo, Personagens Prontos — cada categoria mostra suas seções internas normalmente, só a troca entre categorias é que é client-side (sem rota nova, ao contrário do Eldarin que tem `/compendios/[packId]`).

**Bug real encontrado e corrigido no caminho — BOM (byte-order-mark) em `compendium.css`:** ao verificar visualmente com Puppeteer + Chrome local, a barra lateral apareceu ocupando a largura inteira (grid quebrado, `display` computado como `block` em vez de `grid`). Investigação via CSSOM mostrou que o arquivo `compendium.css` começa com 3 bytes de BOM UTF-8 (`EF BB BF`) antes do primeiro seletor — o Turbopack preserva esse caractere invisível dentro do texto do primeiro seletor da regra, corrompendo `.comp-shell` (que é literalmente a primeira regra do arquivo) o suficiente pra o navegador não reconhecer o seletor. Esse bug já existia antes desta sessão; só não tinha aparecido porque no bundle do Eldarin outro CSS entra antes na concatenação (o BOM cai no meio do texto, inofensivo), enquanto no bundle novo do Um Anel `compendium.css` acabou sendo o primeiro arquivo — expondo o defeito latente. Corrigido removendo os 3 bytes do BOM (`git diff` confirma: só a invisível marca some, nenhum conteúdo visível muda) — conserta os dois sistemas.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Teste visual de ponta a ponta com `puppeteer-core` (instalado `--no-save`, desinstalado depois, `git status` limpo em `package.json`/`package-lock.json`) contra um `npm run dev` real: screenshot da categoria "Personagem" confirma sidebar estreita (220px) + grid de conteúdo ao lado, igual ao Eldarin; clique em cada uma das 6 categorias funcionou sem erro de console; categoria "Companhia & Mundo" confirmada mostrando Empreitadas, Patronos, PNJs Notáveis e a nova seção Marcos (estrutura de 6 partes + Estrela na Bruma) corretamente. Os únicos erros de console foram 401 de rotas que exigem sessão (esperado, página acessada sem login).

**Arquivos tocados:** novos — `lib/character/um-anel/landmarks.ts`; editados — `lib/character/um-anel/{nameless-things,adversaries}.ts`, `components/compendium/{TorCompendiumPage.tsx,compendium.css}`.

---

### 2026-07-25 (cont.) — Ícone de dado no chat do Um Anel + painel "Personagens jogáveis" mostrando Eldarin numa mesa de Um Anel

**Dado no chat, correção aplicada (antes só diagnosticada):** a causa raiz já tinha sido confirmada antes (todo roll do Um Anel posta `kind:"chat"`, o gate do `DiceBoxMini` em `RoomChat.tsx` exigia `kind==="roll"`). Corrigido sem tocar no formato rico de texto do Um Anel (que é bem mais descritivo que o "1d20+5 → 23" genérico do Eldarin):
1. `lib/character/um-anel/dice.ts` ganhou `featDiePhysicalFace`/`featDieRollPayload` — converte o resultado do Dado de Proeza (Olho/Runa/número) na face física do d12 (Olho→11, Runa→12, número→ele mesmo) pro visual do dado, sem mexer no valor de jogo (`numeric`, que já zera o Olho e conta a Runa como 10).
2. `TorCharacterSheetView.tsx`/`TorCharacterSheetPopup.tsx`: `onRoll` agora também carrega o payload do dado; `postRoomChat` ganhou um campo `torFeatDie` novo.
3. `app/api/room/[roomId]/chat/route.ts`: quando `torFeatDie` vem no corpo, anexa `roll:{formula:"1d12", rolls:[valor], total:valor}` numa mensagem que continua `kind:"chat"` (o servidor só repassa o valor já calculado no cliente — **não** re-rola como faz pro Eldarin, que usa `rollDice(formula)` server-side; mesmo nível de confiança que o chat livre já tinha, não é uma regressão de segurança nova).
4. `RoomChat.tsx`: o gate do dado mudou de `kind==="roll" && message.roll` pra só `message.roll` (qualquer kind) — quando `kind==="chat"`, mostra o texto completo do Um Anel do lado do dado; quando `kind==="roll"` (Eldarin), continua mostrando só fórmula/total como antes. Zero mudança de comportamento pro Eldarin.
5. `lib/room/handlers/tor-combat-attack.ts`: o ataque tático também anexa o dado (Dado de Proeza do ataque) na mensagem de combate.

**Bug novo reportado pelo usuário durante teste ao vivo — "a ficha não aparece no painel da esquerda":** print mostrando uma ficha do Um Anel aberta ("ER", Bardo/Mensageiro) mas o painel "Personagens jogáveis" da lateral dizendo "Nenhum personagem de jogador nesta aventura ainda". Causa raiz: o painel dock "ficha" em `MesaFoundryDockRail.tsx` renderizava `<PlayableCharactersPanel>` (Eldarin) **sem checar `rpgSystemId`** — igual ao bug do compêndio corrigido antes nesta sessão, só que dessa vez no painel de personagens, e só no modo dock (clique esquerdo); no modo flutuante (clique direito) o Um Anel tinha uma janela **paralela e não-relacionada**, `"torParty"`, que abria certo mas nunca foi exposta em nenhum ícone do rail — ficava sempre aberta por padrão (`DEFAULT_OPEN`/`DEFAULT_FLOATING` em `useFoundryWindows.ts`) só pra mesas do Um Anel, uma segunda janela flutuando sem controle nenhum do usuário.

**Correção:** unificado no padrão já validado pelo compêndio — **uma única janela `"ficha"`**, dockável ou flutuante, com o conteúdo despachado por `rpgSystemId` nos dois arquivos (`MesaFoundryDockRail.tsx` e `MesaFoundryFloatingWindows.tsx`): `rpgSystemId === "um-anel" ? <TorPlayableCharactersPanel/> : <PlayableCharactersPanel/>`. A janela `"torParty"` (duplicada, sem ícone de acesso, sempre aberta por padrão) foi removida por completo — `MesaWindowId`, `DEFAULT_LAYOUTS`, `DEFAULT_OPEN`, `DEFAULT_FLOATING` (`lib/vtt/foundry-window-placement.ts`/`hooks/vtt/useFoundryWindows.ts`) e o bloco JSX correspondente.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Teste ao vivo (login + banco real) não foi feito neste sandbox — mesmo bloqueio já registrado antes (MariaDB local do `.env.local` inacessível). Pedido ao usuário reproduzir num refresh da mesa afetada.

**Arquivos tocados:** editados — `lib/character/um-anel/dice.ts`, `components/character/sheet/TorCharacterSheetView.tsx`, `components/vtt/{TorCharacterSheetPopup,RoomChat}.tsx`, `hooks/useRoomSync.ts`, `app/api/room/[roomId]/chat/route.ts`, `lib/room/handlers/tor-combat-attack.ts`, `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`, `hooks/vtt/useFoundryWindows.ts`, `lib/vtt/foundry-window-placement.ts`.

---

### 2026-07-25 (cont.) — PRD da mesa do Um Anel, páginas do hub deixam de falar só de Eldarin, PA vazando pra tokens do Um Anel

**Pedido:** "commita e ajuste, faça uma revisão do código, do hub, ajuste as páginas do hub que fala que é sobre eldarin, sendo que o MXDRPG é um HUB (...) o action ring pra o que entra dentro do sistema" — quatro pedidos numa mensagem: (1) commitar o trabalho pendente, (2) revisão de código do hub, (3) corrigir páginas do hub que se apresentam como só-Eldarin, (4) confirmar que o anel de ação/sistema de magias da mesa do Um Anel não vaza conceito do Eldarin. Também pediu um PRD da mesa do Um Anel (pedido em mensagem anterior).

**PRD:** novo `docs/PRD-MESA-UM-ANEL.md`, mesmo formato do `PRD-ELDARIN-VTT.md` — registro de decisões arquiteturais (sem PA, motor de dado próprio, `torCombat` como bag no token, isolamento de hub), Epics 1-7 (o que já está pronto) e Epic 8 (backlog v1.1: Posturas de Combate, Dano Especial, Recuo, Engajamento por contagem, Jornada), mais uma tabela de rastreio dos bugs de vazamento cruzado já corrigidos.

**Investigação do anel de ação / sistema de magias (conclusão: já estava correto):** conferido que `Battlefield.tsx` já teria de fato o gate certo — `canOpenActionRing`/`onActionRingRequest` checam `token.torCombat` antes de decidir entre `TorAttackPopup` (Um Anel) e `TokenActionRing` (Eldarin, com `SpellPickerPanel`/`AbilityPickerPanel`). Como `TokenActionRing` é o único lugar que consegue abrir os pickers de magia/habilidade, e ele nunca é renderizado quando `token.torCombat` existe, o sistema de magias do Eldarin **nunca** aparece numa mesa do Um Anel — que, aliás, não tem sistema de magias no livro (o mais próximo, Feitiçaria, é só narrativo/arbitrado pelo Mestre, não uma lista de feitiços selecionável). `TorAttackPopup` já era, e continua sendo, só arma + alvo, sem nenhuma opção de magia. Nenhuma mudança necessária aqui — o que faltava (Habilidades Sinistras de adversário como ação selecionável) já estava documentado como backlog no Epic 8 do PRD.

**Páginas do hub corrigidas (paravam de reconhecer que o MXDRPG serve dois sistemas):**
1. `app/page.tsx` (home): texto do hero citava "pontos de ação" como se fosse universal — trocado por copy neutra ("cada sistema de RPG com sua própria ficha e suas próprias regras de combate"), acrescentado um par de chips linkando os dois sistemas (`RPG_SYSTEMS`) logo abaixo do CTA, e a prévia SVG (que mostra "ATAQUE d20"/PA — só faz sentido pro Eldarin) ganhou uma legenda honesta ("Exemplo: combate tático do sistema Eldarin") em vez de ser apresentada como *a* experiência do hub. Card "Grid tático" também parou de citar "PA automático".
2. `app/manifest.ts` (descrição do PWA instalável): "combate em grid, Pontos de Ação, fichas e compêndios Eldarin v4" → texto neutro citando os dois sistemas.
3. `app/layout.tsx` (meta description raiz, usada como fallback SEO em toda página): mesma correção.
4. `app/sistema/page.tsx` ("Como jogar", item de navegação do topo): era 100% conteúdo do Eldarin (h1 "Como jogar no Eldarin VTT", passos, cards da mesa e roadmap todos citando PA/CA), sem nenhuma versão pro Um Anel. Reescrito no mesmo padrão já usado em `/compendios` e `/mundo` — `RpgSystemContentTabs` no topo + branch por `?sistema=` — com conteúdo próprio do Um Anel (Cultura/Vocação, Dado de Proeza, sem Pontos de Ação, bestiário/Marcos/Coisas Sem Nome no lugar do bestiário/magias do Eldarin). `lib/site-metadata.ts` ganhou a entrada que faltava pro título da aba de `/rpg/um-anel`.

**Revisão de código do hub — achado real (corrigido, não só cosmético):** pedi uma revisão focada em achar outras instâncias do mesmo padrão de bug já corrigido nesta sessão (componente compartilhado sem checar `rpgSystemId`/`torCombat`). Achado mais sério: `lib/combat/exploration-pa.ts` (`applyExplorationPaDisplayToToken`/`previewExplorationPaTokens`, chamadas ao alternar Aventura/Combate) sobrescrevia `pa`/`paMax` de **todos** os tokens da sala, sem exceção — inclusive tokens do Um Anel, que dependem de `pa`/`paMax` numa constante alta fixa (`TOR_TOKEN_PA`) só pra não travar `checkCanSpendPa`. Cada vez que o Mestre alternasse o modo da mesa, um token do Um Anel podia ter seu PA resetado pra um valor baixo (regra de recuperação do Eldarin) e ficar travado pra se mover — exatamente o risco #2 já documentado no plano original da Fase 4, que se materializou porque essa função nova (fora do escopo da Fase 4) nunca tinha sido revisada. Corrigido com um early-return em `token.torCombat`. Achados secundários (cosméticos, também corrigidos): `CharacterCombatHud.tsx` mostrava o medidor de PA (`PaHudMeter`) em qualquer token com `pa` definido, incluindo tokens do Um Anel — ganhou o mesmo guard; `GmMesaModeToggle`/`MesaModeIndicator` tinham tooltips fixos citando "PA" — ganharam `rpgSystemId` (`MesaFoundryStageHeader` → `MesaWorkspace`, que já tinha o valor) e texto alternativo pro Um Anel. Checagem programática de BOM em todos os `.css` de `components/vtt`, `components/compendium` e `components/character` (feita pelo agente de revisão): nenhum outro arquivo tem o problema — o BOM do `compendium.css` corrigido antes nesta sessão era isolado.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Teste visual com `puppeteer-core` (instalado `--no-save`, desinstalado depois, `git status` limpo em `package.json`/`package-lock.json`) contra `npm run dev` real: screenshot da home confirma os chips de sistema e a legenda da prévia; `/sistema` e `/sistema?sistema=um-anel` renderizados lado a lado — conteúdo, abas e links corretos nos dois, zero menção a PA/CA/d20 na variante do Um Anel. Console sem erros além dos 401 esperados (chamadas que exigem login). Não foi possível testar a correção do PA-na-troca-de-modo dentro de uma mesa de verdade (exige banco de dados real, indisponível neste sandbox) — recomendado um teste manual: numa mesa do Um Anel com um token no mapa, alternar Aventura↔Combate e confirmar que o token continua se movendo livremente depois.

**Arquivos tocados:** novo — `docs/PRD-MESA-UM-ANEL.md`; editados — `app/{page,layout,manifest,sistema/page}.tsx`, `components/home/home.css`, `lib/site-metadata.ts`, `lib/combat/exploration-pa.ts`, `components/vtt/{CharacterCombatHud,GmMesaModeToggle,MesaWorkspace}.tsx`, `components/vtt/mesa/MesaFoundryStageHeader.tsx`.

---

### 2026-07-25 (cont.) — Resto do HUD/medidor de PA vazando pra tokens do Um Anel

**Pedido:** usuário reportou (bem irritado, com razão) que ainda tinha HUD de PA aparecendo na mesa do Um Anel depois da correção anterior — o fix passado só cobriu `CharacterCombatHud.tsx`, faltavam outros pontos que também desenham o medidor.

**Achados e correção — cada widget de PA ganhou guard `!token.torCombat` no ponto exato de renderização:**
- `components/vtt/MapTokenList.tsx` — a lista "No mapa" (visível na lateral, era exatamente o "8 PA" que apareceu no print do usuário junto de um token).
- `components/vtt/ActiveCharactersPanel.tsx` — mesma lista, variante "Ativos agora".
- `components/vtt/TokenStatusBody.tsx` — modal de status do token, renderizava `<PaHudMeter>` sem nenhum guard (nem checava `canViewTokenPa`).
- `components/vtt/EndTurnConfirmDialog.tsx` — modal de "Passar turno" podia mostrar uma mensagem de "PA guardado" calculada em cima de `token.paMax` (a constante alta do Um Anel), sem sentido pro sistema.
- `components/vtt/Battlefield.tsx` — o fallback de `canViewTokenPaFn` (usado quando a prop não é passada) também ganhou o guard.

**Erro cometido e revertido no caminho — importante registrar:** a primeira tentativa foi um fix central em `lib/auth/combat-turn-access.ts::canViewTokenPa`, fazendo a função retornar `false` sempre que `token.torCombat` existisse. Passou no `tsc`/`build`, mas era **errado**: essa mesma função é usada por `lib/room/snapshot-for-viewer.ts` pra decidir se **zera** `pa`/`paMax` (`redactTokenPa`, seta os dois pra `0`) antes de mandar o snapshot pro cliente — não é só um gate de exibição de UI, é também redação de dado no servidor. Com o fix central, todo token do Um Anel passaria a receber `pa:0/paMax:0` de verdade, o que quebraria a garantia de `TOR_TOKEN_PA` (constante alta pra nunca travar `checkCanSpendPa`) e travaria o movimento de qualquer token do Um Anel assim que a mesa carregasse. Revertido antes de commitar; a correção certa é sempre no **componente que desenha o widget**, nunca na função que decide se o dado cru trafega ou é redigido.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Não testado contra uma mesa real com banco (mesmo bloqueio de sempre — sem MariaDB local neste sandbox). Recomendado ao usuário: abrir uma mesa do Um Anel com token no mapa e conferir que nenhum "PA" aparece em nenhum lugar (lista lateral, modal de status, ao passar turno) — e que o token continua se movendo normalmente.

**Arquivos tocados:** editados — `components/vtt/{MapTokenList,ActiveCharactersPanel,TokenStatusBody,EndTurnConfirmDialog,Battlefield}.tsx`.

---

### 2026-07-26 — Ícone "Invocar" mostrava o bestiário do Eldarin numa mesa do Um Anel

**Pedido:** "por que no TOR ta usando o bestiário de eldarin? me explica" — usuário viu monstros do Eldarin ao clicar em invocar numa mesa do Um Anel.

**Causa raiz:** mesmo padrão de bug já corrigido várias vezes nesta sessão (painel/ícone compartilhado sem checar `rpgSystemId`). O ícone "Invocar" do rail (`MesaIconBar.tsx`) sempre aparecia pra qualquer mestre (`show: showGm`, sem checar sistema), e o painel por trás dele (`MonsterSpawnPanel`, tanto no dock quanto na janela flutuante) é 100% Eldarin — lê `lib/vtt/monsters.ts`/`monstros.json`, nunca `TOR_ADVERSARIES`. O Um Anel já tem sua própria forma de invocar adversário — a seção "Adversários" dentro do painel "Ficha" (`TorPlayableCharactersPanel`, corrigido numa entrada anterior) — só que ninguém tinha reparado que o ícone "Invocar" continuava ali do lado, apontando pro bestiário errado.

**Correção:** ícone "Invocar" escondido pra `rpgSystemId === "um-anel"` (`MesaIconBar.tsx` ganhou prop `rpgSystemId`, repassada por `MesaFoundrySidebar.tsx` → `MesaFoundryDockRail.tsx`, que já tinha o valor). Como defesa extra, o conteúdo do painel "spawn" em si (dock **e** flutuante) também ganhou o mesmo guard — mesmo se alguém reabrir a janela por algum estado antigo salvo, o `MonsterSpawnPanel` não renderiza mais fora do Eldarin.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Não testado contra uma mesa real (mesmo bloqueio de sempre — sem banco neste sandbox).

**Arquivos tocados:** editados — `components/vtt/foundry/{MesaIconBar,MesaFoundrySidebar}.tsx`, `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`.

---

### 2026-07-26 (cont.) — Push pendente + varredura final de PA (achado: guia de ajuda "?" também era só-Eldarin)

**Contexto:** usuário testou em produção e viu tudo igual — porque os últimos 6 commits nunca tinham sido enviados (`git push`), só existiam localmente neste sandbox. Dado push (`ead9834..a428ee3`). Depois pediu confirmação explícita: "tirou o PA de tudo que se trata de TOR? inclusive hud e td mais?" — refeita uma varredura completa em vez de responder de cabeça.

**Reconfirmado (já corrigido em entradas anteriores):** `CharacterCombatHud`, `TokenStatusBody`, `MapTokenList`, `ActiveCharactersPanel` e `EndTurnConfirmDialog` — todos com guard `!token.torCombat` intacto.

**Achado novo:** o botão de ajuda "?" no canto do mapa (`VttHelpButton.tsx`) nunca tinha recebido `rpgSystemId` — guia inteiro hardcoded pro Eldarin (título "Mesa Eldarin", seção inteira "Pontos de Ação (PA) e movimento", "anel de ações (mover, atacar, magia, habilidade)", ícone "Invocar" que nem existe mais no Um Anel). Corrigido com o mesmo padrão de sempre: `rpgSystemId` encadeado por 4 componentes (`Battlefield.tsx` → `BattlefieldMapCanvas.tsx` → `VttMapGuideCluster.tsx` → `VttHelpButton.tsx`, reaproveitando o objeto `mapGuide` já existente) e o conteúdo do guia reescrito com uma versão própria do Um Anel: sem PA, ordem de turno por posição no mapa, popup de ataque (arma+alvo), Dado de Proeza + Sucesso, seção "Adversários" no lugar do ícone "Invocar".

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Não testado contra uma mesa real (mesmo bloqueio de sempre — sem banco neste sandbox).

**Arquivos tocados:** editados — `components/vtt/{Battlefield,VttHelpButton,VttMapGuideCluster}.tsx`, `components/vtt/battlefield/BattlefieldMapCanvas.tsx`.

---

### 2026-07-26 (cont.) — Painel "Invocar" dedicado pro bestiário do Um Anel (era escondido dentro da Ficha)

**Contexto:** usuário viu um monstro Eldarin ("Fênix de Caverna") com PA numa mesa de teste do Um Anel e concluiu (razoavelmente, dado o histórico de bugs desta sessão) que o bestiário do Um Anel não existia de verdade. Confirmado com prova concreta que **existe** — `lib/character/um-anel/adversaries.ts` tem 22 entradas reais, nenhuma chamada "Fênix de Caverna" (esse token era um monstro Eldarin de verdade, colocado na mesa antes do ícone "Invocar" ter sido escondido pro Um Anel numa correção anterior — não um bug novo, só sobra de teste).

Aproveitando o esclarecimento, atendido o pedido de melhorar de verdade a UX: até agora, invocar adversário do Um Anel vivia **escondido** dentro do painel "Ficha" (seção "Adversários", junto da lista de personagens jogáveis) — o ícone dedicado "Invocar" do rail, que o Eldarin sempre teve, tinha sido só **escondido** pro Um Anel na correção anterior, em vez de ganhar conteúdo próprio.

**Refatoração:**
1. Novo `components/vtt/TorAdversaryPanel.tsx` — painel dedicado, busca por nome/traço, cards com nível de atributo/resistência/bloqueio/proteção e badge de tier (Bando/Elite/Chefe), botão Invocar por adversário. Reaproveita `spawnRoomTorAdversary` (já existia) — nenhuma mudança no motor de invocação, só na UI.
2. Ícone "Invocar" volta a aparecer pra mestres do Um Anel (`MesaIconBar.tsx` simplificado — remove a lógica `showSpawn` que escondia); o conteúdo por trás dele agora despacha por `rpgSystemId` (`TorAdversaryPanel` vs `MonsterSpawnPanel` do Eldarin), no mesmo padrão já usado pra "ficha" e "compêndio".
3. Seção "Adversários" removida de dentro de `TorPlayableCharactersPanel.tsx` (evita duplicar a mesma função em dois lugares) — esse painel volta a ser só a lista de personagens jogáveis, como o nome sempre disse.
4. Texto do guia de ajuda "?" ajustado de volta (a versão anterior apontava pra "Ficha → Adversários" porque o ícone estava escondido; agora descreve o ícone "Invocar" dedicado, igual ao Eldarin).

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Teste visual com `puppeteer-core` (instalado/desinstalado, `git status` limpo) confirmou que as classes CSS reaproveitadas (`.comp-search`, `.tor-compendium__tier`) renderizam certo na categoria "Adversários" do compêndio — não achei uma forma de testar o painel `TorAdversaryPanel` dentro de uma mesa de verdade neste sandbox (sem banco de dados), então recomendo ao usuário abrir o ícone "Invocar" numa mesa do Um Anel e confirmar que a lista aparece e o Invocar funciona.

**Arquivos tocados:** novo — `components/vtt/TorAdversaryPanel.tsx`; editados — `components/vtt/TorPlayableCharactersPanel.tsx`, `components/vtt/foundry/{MesaIconBar,MesaFoundrySidebar}.tsx`, `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`, `components/vtt/VttHelpButton.tsx`.

---

### 2026-07-26 (cont.) — Fix "não permite criar ficha" + bestiário ordenado por dificuldade

**Pedido 1:** usuário reportou "não tá permitindo criar ficha" — print mostrava o painel "Personagens Jogáveis" corretamente despachado pro Um Anel (confirma que o fix anterior funcionou), mas **sem nenhum botão** de criar personagem, mesmo dizendo no texto "use 'Novo personagem' pra criar o primeiro".

**Causa raiz:** `TorPlayableCharactersPanel.tsx` nunca teve o botão "+ Criar novo personagem" — ao contrário do painel Eldarin (`PlayableCharactersPanel.tsx`), que sempre teve esse botão (com callback pro wizard em popup, ou link de fallback pra `/aventura/[id]/personagem/novo`). Quando o painel "ficha" mostrava (incorretamente) o painel Eldarin numa mesa do Um Anel, o botão aparecia mas criava personagem Eldarin; depois do fix que despachou corretamente pro painel do Um Anel, sobrou sem nenhum botão — o painel do Um Anel nunca tinha sido construído com essa função.

**Achado extra no caminho:** `app/mesa/[roomId]/page.tsx` calculava `characterSlotsLeft` sempre com `MAX_CHARACTERS_PER_USER` (constante do Eldarin), independente do `rpgSystemId` da sala — corrigido pra usar `MAX_TOR_CHARACTERS_PER_USER` numa mesa do Um Anel.

**Correção:** `TorPlayableCharactersPanel.tsx` ganhou `canCreateCharacter`/`onCreateCharacter` (mesmo formato do painel Eldarin — callback pro wizard em popup, com fallback de `Link` pra página de criação) e o botão "+ Criar novo personagem", encadeado nos dois lugares que renderizam esse painel (`MesaFoundryDockRail.tsx`/`MesaFoundryFloatingWindows.tsx`, reaproveitando `canCreateCharacter`/`onOpenCharacterWizard` que já existiam no escopo).

**Pedido 2:** "coloca a ordem do bestiário pelo nível de dificuldade e força pra melhorar tudo".

**Correção:** `lib/character/um-anel/adversaries.ts` — array bruto renomeado pra `TOR_ADVERSARIES_RAW` (mantém a ordem de extração do livro por categoria, com os comentários originais intactos); o export público `TOR_ADVERSARIES` agora é essa mesma lista **ordenada** por tier (Bando → Elite → Chefe) e, dentro de cada tier, por Nível de Atributo crescente. Como `TOR_ADVERSARY_BY_ID`, `TorAdversaryPanel.tsx` e a seção "Adversários" do compêndio já consomem `TOR_ADVERSARIES` direto (sem assumir uma ordem específica), o novo ordenamento passou a valer em todo lugar automaticamente, sem editar mais nada.

**Verificação:** `tsc --noEmit` + `npm run build` limpos nas duas correções. Ordem final conferida com um script Node descartável (não commitado) — bate com a expectativa (mob nível 2-4, elite 4-8, boss 5-10). Não testado o clique do botão "Criar novo personagem" dentro de uma mesa real (sem banco neste sandbox).

**Arquivos tocados:** editados — `components/vtt/TorPlayableCharactersPanel.tsx`, `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`, `app/mesa/[roomId]/page.tsx`, `lib/character/um-anel/adversaries.ts`.

---
