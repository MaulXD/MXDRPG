# Auditoria do Eldarin — 2026-08-08

> **Como isto foi produzido.** Workflow de 13 agentes em 6 frentes (compendio, legal/navegacao,
> VTT/mesa, ficha, social, motor desligado). Cada frente teve um investigador e um **cetico**
> instruido a derrubar os achados relendo o codigo — 64 achados sobreviveram, 54 abertos.
> Reverificacao da auditoria de UX externa de 2026-06-20, que tinha 49 dias.
>
> **Nao e lista de tarefas aprovada.** Varios alvos dizem explicitamente que precisam de decisao
> do dono antes de codar. Ler a secao final, "O que eu NAO recomendo fazer agora", antes de pegar
> qualquer item — ela derruba tres premissas da auditoria antiga.
>
> **Alvos 1 e 2 ja foram feitos** no commit b238e22. Ficam aqui para registro do que era.

---

# Lista de alvos — Eldarin (loop autônomo)

Convenções para todos os alvos: o critério de pronto é um `scripts/verify-*.mjs` no estilo já usado no repo (`node:assert/strict` + leitura de arquivo como texto + `assert.match`, ver `scripts/verify-culinary.mjs:1-40`), registrado no `npm test` do `package.json`. Fechar tarefa exige também entrada em `docs/HISTORICO.md`.

Verifiquei pessoalmente os alvos 1, 2, 4 e 5 (ver "conferido por mim" em cada um). Os demais reproduzo dos achados, que já passaram por dois leitores independentes — quando eu **não** confirmei, digo isso.

---

### 1. /privacidade publica texto de desenvolvedor em produção — crítico/trivial

**LEGAL. Primeiro da fila.** Duas falhas no mesmo arquivo, resolver juntas.

O que fazer:
- `app/privacidade/page.tsx:10-17` lê `docs/PRIVACIDADE-LGPD.md` via `fs.readFileSync` com `catch {}` silencioso e fallback literal `"Política em atualização. Edite docs/PRIVACIDADE-LGPD.md com e-mail do titular antes do lançamento."` (linhas 11-12). O `.dockerignore:7` lista `docs/` — logo, na imagem de produção o arquivo **nunca** existe e o fallback é o que sai no ar. Duas saídas: (a) mover o conteúdo para dentro de `app/` (ex.: `app/privacidade/conteudo.ts` ou `.mdx`), eliminando o `fs`; ou (b) manter o `.md` e removê-lo do `.dockerignore`. Prefiro (a): elimina I/O em build e a dependência de `process.cwd()`.
- Ainda em `app/privacidade/page.tsx:26-35`, o corpo é jogado num `<article>` com `whiteSpace: "pre-wrap"` sem parser — o Markdown sairia cru (`#`, `**`, tabela com pipes). **Não há dependência de Markdown no projeto** (conferi `package.json`: só `@3d-dice/dice-box, bcryptjs, html2canvas, jspdf, mysql2, next, react, react-dom, sharp, three`). Não instalar lib nova por isso: converter o documento para JSX/HTML estático é mais barato e mais seguro.
- O `catch` silencioso tem que morrer junto: se a fonte sumir, é melhor falhar o build do que publicar aviso interno.

Arquivos: `app/privacidade/page.tsx`, `.dockerignore`, `docs/PRIVACIDADE-LGPD.md`, `components/SiteFooter.tsx:18`, `components/auth/AuthTabs.tsx:61`.

**Pronto quando** `scripts/verify-legal-pages.mjs` afirmar: (a) `app/privacidade/page.tsx` **não** contém a string `Política em atualização`; (b) não contém `readFileSync` (ou, se a opção (b) for escolhida, `.dockerignore` não contém a linha `docs/`); (c) o conteúdo renderizado contém as âncoras `Base Legal`, `LGPD` e um e-mail de contato do titular; (d) nenhum `catch {}` vazio no arquivo.

Conferido por mim: li `app/privacidade/page.tsx` inteiro e `.dockerignore` inteiro — os dois batem com a descrição.

---

### 2. Nome real da conta do mestre vaza no snapshot da sala — crítico/trivial

**VAZAMENTO DE DADO PESSOAL. Viola a regra "apelido nunca nome real".** É a correção de melhor razão custo/benefício do lote inteiro: 4 linhas.

O que fazer: trocar `authorName: user?.name ?? "Mestre"` por `authorName: user?.nickname?.trim() || "Mestre"` em:
- `lib/room/handlers/combat-gm.ts:62`
- `lib/room/handlers/culinary-meal.ts:52`
- `lib/room/handlers/gm-actor-progress.ts:87`
- `lib/room/handlers/gm-saving-throw.ts:115`

O padrão correto já existe em 20+ rotas (`session.user.nickname?.trim() || "Jogador"` — ex.: `app/api/room/[roomId]/chat/route.ts:41`). Segundo o cético, a exibição visível ocorre em `culinary-meal.ts:54` (`kind:"chat"`) e `gm-saving-throw.ts:178-187` (`kind:"roll"`), mas nas 4 o nome **trafega** no snapshot para todos os participantes (`lib/room/internal/registry.ts:54`), o que já basta.

**Pronto quando** `scripts/verify-privacidade-apelido.mjs` varrer todos os `.ts` de `lib/room/handlers/` e `app/api/` e assertar **zero** ocorrências do regex `authorName\s*:\s*.*\buser\??\.name\b` / `session\.user\.name`. Deixar a asserção genérica (varredura de diretório, não lista fixa de 4 arquivos) — assim ela pega a reincidência.

Conferido por mim: `grep -n "authorName: user?.name" lib/room/handlers/*.ts` devolve exatamente as 4 linhas citadas.

---

### 3. Não existe Termos de Uso — médio/médio

**LEGAL.** Plataforma com contas, upload de imagem e chat entre usuários sem ToS nem aceite. O cético confirmou: zero rota `app/termos/`, zero link no rodapé (`components/SiteFooter.tsx:13-19`), zero checkbox em `components/auth/AuthTabs.tsx:60-62`.

O que fazer, **e o limite**: o loop autônomo constrói a *infra* — rota `app/termos/page.tsx` (mesmo padrão corrigido do alvo 1, sem `fs`), link no rodapé, link e checkbox de aceite no cadastro, persistência do aceite (timestamp + versão do documento) no cadastro. O **texto jurídico não é trabalho do loop**: gerar cláusulas vinculantes por conta própria é pior que não ter. Deixar o arquivo de conteúdo com um rascunho claramente marcado como PENDENTE DE APROVAÇÃO e bloquear o link até o dono aprovar.

**Pronto quando** o mesmo `verify-legal-pages.mjs` assertar: existe `app/termos/page.tsx`; `components/SiteFooter.tsx` contém `href="/termos"`; `components/auth/AuthTabs.tsx` contém um `input type="checkbox"` cujo label referencia `/termos`; e o handler de cadastro grava o aceite. Asserção extra que protege contra publicar rascunho: o conteúdo **não** pode conter a marca `PENDENTE DE APROVAÇÃO` enquanto a rota estiver linkada.

---

### 4. monstros.json (451 KB, admin-only) viaja para o navegador de todo jogador — crítico/GRANDE

> **CORRIGIDO EM 2026-08-08, ao começar a implementar.** A receita original deste alvo estava
> errada e teria quebrado o build. O que segue é a versão medida. O diagnóstico do problema se
> confirmou; a prescrição, não.

**O que foi medido (números, não estimativa):**

| Medida | Valor |
|---|---|
| `data/compendiums/monstros.json` | 451.068 bytes |
| chunk `7918-*.js` que o carrega | 659.134 bytes |
| fatia do chunk que é dado de monstro | **~295 KB, 45% do chunk** |
| rotas que carregam esse chunk | **9 de 156** |

As 9 rotas incluem `/personagem/[id]`, `/personagem/novo`, `/personagem/[id]/editar` e
`/mesa/[roomId]` — ou seja, **um jogador comum baixa ~295 KB de bestiário admin-only só para abrir
a própria ficha**. O problema é real e é dos piores da lista.

**Onde a receita original errava.** Ela mandava pôr `import "server-only"` em
`lib/compendium/registry.ts` e `lib/vtt/monsters.ts` como "trava permanente". Isso **quebraria o
build**: conferido, **dez componentes cliente** importam esses dois módulos —

- de `registry`: `CharacterSheet.tsx`, `SheetPdfCapture.tsx`, `SheetPdfDocument.tsx`,
  `SheetPopupLoadoutBar.tsx`, `wizard/WizardEquipmentStep.tsx`, `MonsterCompendiumSheet.tsx`;
- de `vtt/monsters`: `MonsterCompendiumSheet.tsx`, `MonsterSheetPopup.tsx`, `GmCreationsPanel.tsx`,
  `MonsterSpawnPanel.tsx`.

E, dos dez, **quatro precisam legitimamente do dado no cliente**: os painéis de Mestre invocam e
editam monstro no navegador. `server-only` não é "trava barata" aqui — é uma proibição do que o
produto faz.

**Qual é o defeito de verdade.** O acesso ao dado JÁ é gated por papel em tempo de execução
(`canViewPack` em `registry.ts:106` exige admin ou Mestre da sala). O que não é gated é o
**empacotamento**: o `import monstrosData` no topo de `registry.ts:5` entra no grafo estático, então
qualquer chunk que importe `registry` — inclusive o da ficha de personagem, que só quer armas e
equipamento — carrega o bestiário junto. É gating de dado sem gating de bundle.

**Correção certa: separação de chunk, não `server-only`.** Tirar `monstros` do `PACK_DATA`
estático de `registry.ts` e pô-lo num módulo próprio, carregado dinamicamente (`await import()`)
só por quem abre painel de monstro. Isso mantém os painéis de Mestre funcionando e tira os ~295 KB
das rotas de ficha.

**Por que é GRANDE e não médio:** `entriesForPack` é **síncrona** e usada em todo o registry;
torná-la assíncrona propaga por `getEntry`, `getPackEntries` e pelos call sites nos dez componentes.
A alternativa (módulo separado com acessor próprio) exige reescrever cada chamada que hoje pede
`getEntry("monstros", …)`. Qualquer um dos dois caminhos é refactor de verdade, com risco de
regressão nos painéis de invocação — e esses painéis **não têm teste**.

**Pronto quando** `scripts/verify-compendium-bundle.mjs` assertar, **sobre o build**: nenhum chunk
carregado pelas rotas `/personagem/**` contém `MON-\d{3}`; e os painéis de Mestre continuam
achando o bestiário (asserção de que o módulo dinâmico existe e é importado por eles). A asserção
tem de conferir os DOIS lados — tirar o dado de todo mundo é fácil e quebra o produto.

**Pré-requisito recomendado:** cobrir `MonsterSpawnPanel` e `GmCreationsPanel` com asserção antes
de mexer. Refatorar caminho sem teste é o que esta lista inteira existe para evitar.

---

### 5. /personagem é 404 e é o destino pós-login de toda ficha — alto/trivial

O que fazer: `app/personagem/layout.tsx:13` usa `h.get("x-pathname") ?? h.get("x-invoke-path") ?? "/personagem"`, e o cético mostrou que nenhum dos dois headers existe (nem o middleware seta, nem o Next 15.5.19 injeta) — o fallback é sempre o efetivo. E `/personagem` não tem `page.tsx`. Pior: as páginas-filhas já fazem o redirect certo (`app/personagem/[id]/page.tsx:35`, `.../editar/page.tsx:29`) e são anuladas pelo layout-pai.

Correção preferida: **remover o gate do layout** e deixar as páginas-filhas cuidarem (elas já estão certas). Alternativa mínima: trocar o fallback por `/mesas`. Qualquer link de ficha aberto com sessão expirada hoje cai em 404 após o login.

**Pronto quando** `scripts/verify-rotas.mjs` assertar: (a) `app/personagem/layout.tsx` não contém `x-pathname`/`x-invoke-path`; (b) para todo literal `redirect("/...")` e `signInPath("/...")` estático em `app/**`, o path de destino corresponde a um `page.tsx` existente ou a um `redirects` do `next.config.ts` — asserção genérica que pega qualquer 404 interno futuro.

Conferido por mim: `ls app/personagem` devolve `[id] layout.tsx novo` — não há `page.tsx`.

---

### 6. Expurgo de texto de desenvolvedor na UI pública — médio/trivial

Três ocorrências, uma passada só, um único critério de pronto:
- `app/mesa/[roomId]/page.tsx:56-71` mostra a QUALQUER visitante: "Rode `npm run homolog:up` ou `npm run local` com `npm run dev:homolog` (MariaDB local)". É a tela de link de convite de mesa apagada. Trocar por mensagem de usuário + link para `/mesas`.
- `components/compendium/CompendiumBrowser.tsx:313-317` renderiza "Fase 2: arrastar para ficha ou mesa." para todo visitante de `/compendios`. Remover.
- `app/instalar/page.tsx:12-25` é documentação de deploy (domínio, comandos docker, nomes de env) servida sem gate. **Atenção ao enquadramento**: o cético derrubou a moldura de segurança — não há segredo, só nomes de variável, e o repositório aparenta ser público (`app/download/page.tsx:9` usa `releases/latest/download` sem auth). Tratar como limpeza, não como exposição: deletar a página ou movê-la para `docs/`.

**Pronto quando** `scripts/verify-sem-texto-dev.mjs` varrer `app/**` e `components/**` (`.tsx`) e assertar zero ocorrências de: `npm run`, `MariaDB`, `Fase 2:`, `DEPLOY.md`, `SESSION_SECRET`, `DATABASE_URL` em strings de JSX. Essa varredura genérica é a que impede reincidência.

---

### 7. Compêndio: pacote de correções no CompendiumBrowser — alto/pequeno

Cinco defeitos que vivem quase todos no mesmo componente. Uma passada, um script.
- **Painel de detalhe some ao digitar** (`CompendiumBrowser.tsx:66`): `selected` é derivado de `entries`, que já é o resultado do filtro de busca. Derivar de `data[packId]`.
- **Busca ignora `catalogId`** (`CompendiumBrowser.tsx:60-63` e `lib/compendium/registry.ts:132-137`): o código é exibido em `<code>` na linha 286-292 e digitá-lo não acha nada. 224/224 armas têm o campo. Incluir `system.catalogId` nos dois caminhos de busca.
- **Sem ordenação** (`CompendiumBrowser.tsx`, `registry.ts:82-89`): lista sai na ordem bruta do JSON. Mínimo: ordenar alfabeticamente por padrão; ideal: seletor nome/nível/PA.
- **Abas de sistema somem no pack** (`app/compendios/[packId]/page.tsx:22` chama `<CompendiumPage initialPackId={packId} />` sem `topSlot`, ao contrário de `app/compendios/page.tsx:32`) — quebra o isolamento de hub na navegação. Passar o `topSlot` e preservar `?sistema=` nos hrefs da sidebar (`CompendiumBrowser.tsx:159-166`).
- **`.comp-detail-actions` / `.comp-detail-ref` no JSX sem CSS**: o cético rebaixou para nit — `.comp-detail-body p` já dá `margin-bottom: 0.75rem` (`compendium.css:447-449`), não há bug visual. Fazer junto porque é grátis; não fazer sozinho.

**Pronto quando** `scripts/verify-compendium-ui.mjs` assertar: `CompendiumBrowser.tsx` contém `sort(`; contém `catalogId` dentro do bloco de filtro; `registry.ts` searchEntries referencia `catalogId`; `app/compendios/[packId]/page.tsx` contém `topSlot`; toda `className="comp-*"` usada nos `.tsx` de `components/compendium/` existe em `compendium.css` (varredura cruzada genérica); e a linha de `selected` **não** casa `entries.find`.

---

### 8. Assimilações culinárias nunca expiram — alto/pequeno

`lib/culinary/apply-meal.ts:70` grava `expiresAt = acquiredAt + MEAL_DURATION_MS` (24h, `:21`) e nenhum código no repo compara isso com `Date.now()` — o cético refez o grep e as 7 ocorrências fora de culinary são de `MapMarkup`, tipo diferente. O filtro de `apply-meal.ts:83-85` é dedupe por `entryId`, não expiração. Resultado: assimilações se acumulam para sempre na ficha.

O que fazer: podar `activeAssimilations` por `expiresAt` na normalização da ficha (`lib/character/normalize.ts`, que já faz pass-through do campo) e na leitura da UI. Decidir com o dono se a poda é por tempo real (24h de relógio) ou por descanso longo — hoje o código diz relógio.

**Pronto quando** `scripts/verify-culinary.mjs` (já existe, estender) assertar: uma assimilação com `expiresAt` no passado é removida pela função de normalização, e uma com `expiresAt` futuro sobrevive. Teste de função pura, não de string.

---

### 9. `bankedPa` fantasma: sempre 0, mas exibido em 3 telas — médio/pequeno

Todas as gravações reais são zero (`lib/vtt/player-token.ts:34`, `lib/combat/pa-token-state.ts:14`, `lib/combat/pa-turn.ts:58/68/78/213/220/235/258/308`), as constantes `PA_BANK_MAX`/`PA_BANK_STACK_MAX` (`pa-turn.ts:24-25`) estão `@deprecated`, e mesmo assim `components/vtt/ActiveCharactersPanel.tsx:133`, `components/vtt/MapTokenList.tsx:54` e `components/vtt/GmCombatLogPanel.tsx:104` renderizam `+${t.bankedPa} pool`. É legado do banco de PA substituído por pool unificado.

O que fazer: remover a exibição nas 3 telas e o campo do fluxo de sync, ou (se o dono quiser o banco de volta) abrir tarefa própria. Default: remover.

**Pronto quando** `scripts/verify-pa-bank.mjs` (já existe) assertar zero ocorrências de `bankedPa` em `components/vtt/`.

---

### 10. Limite de fichas por aventura: três fontes da verdade e guarda que nunca dispara — médio/pequeno

Duas metades do mesmo problema:
- **Discordância**: `lib/character/adventure-bind.ts:4` diz `= 3`; a mensagem de erro em `lib/character/characters.ts:269` diz "Você já tem **um** personagem nesta aventura"; `docs/CLAUDE-PROJETO.md:168` diz `= 1`. **Precisa de decisão do dono** — o loop não deve escolher sozinho qual dos três é o produto.
- **Guarda morta**: `app/mesa/[roomId]/page.tsx:196-197` fixa `characterSlotsLeft = maxCharactersPerUser` e `charactersInAdventure = 0` (constantes), então as duas guardas de `components/vtt/MesaWorkspace.tsx:441-442` nunca disparam e a rejeição só vem depois do wizard inteiro preenchido (`characters.ts:265-270`). Essa metade **não** depende da decisão: basta carregar a contagem real.

**Pronto quando**: (a) o script assertar que a constante, o texto da mensagem e o número em `docs/CLAUDE-PROJETO.md:168` casam entre si (extrair o número dos três e comparar); (b) `app/mesa/[roomId]/page.tsx` não contém `charactersInAdventure = 0` literal.

---

### 11. Toda mesa Eldarin nova nasce com grid vazio, sem mapa e sem token — alto/médio

`lib/room/adventure-room.ts:25-30` monta a cena com `{...DEFAULT_SCENE_TEMPLATE, id, name, tokens: []}` e sem `mapImageUrl`; o template (`:21`) é só `{gridRadius: 24, cellSize: 36}`. Não há biblioteca de mapas embutida — segundo o achado, `find public -ipath "*map*"` volta vazio (**não conferi esse find**). Upload e URL externa existem (`components/vtt/DungeonEditorPanel.tsx:84-97`, `components/vtt/MapScenePanel.tsx:56-63`), mas o mestre parte do zero absoluto na primeira sessão — é o pior momento de retenção do produto.

O que fazer: 2 a 3 mapas de piso enxutos em `public/`, referenciados por um catálogo, e `createRoomForAdventure` escolhendo um default. Não gerar arte improvisada — usar textura de piso neutra, e marcar como placeholder até a arte real.

**Pronto quando** o script assertar: `lib/room/adventure-room.ts` seta `mapImageUrl` (ou `sceneTemplateId`) não-vazio no template default, e o arquivo referenciado existe em `public/`.

---

### 12. Usabilidade da mesa: janela perdida, rail mobile mudo, atalhos invisíveis — médio/pequeno

Três itens de VTT que cabem numa passada:
- **Janela fora da tela para sempre**: o clamp de `hooks/vtt/useFoundryWindows.ts:160-179` roda uma vez por rAF com deps `[hydrated, floating, roomId]`; não há listener de `resize` no fluxo de janelas, e não existe reset pela UI (o único `localStorage.removeItem` é o do tour, `lib/vtt/mesa-guided-tour.ts:130`). Adicionar listener de resize chamando `clampWindowLayout` + botão "resetar layout".
- **Rail mobile sem rótulo**: `components/vtt/foundry/foundry.css:2445-2447` esconde `.foundry-icon-bar__label` no `@media (max-width: 767px)`, e o tooltip só existe sob `@media (hover: hover) and (pointer: fine)` (`:736-742`) — no celular sobram 6 a 13 glifos sem texto algum, só com `aria-label` (`MesaIconBar.tsx:50`). Mostrar label curto no rail mobile.
- **Atalhos fora dos tooltips**: `components/vtt/MapToolbar.tsx:52-67` tem `title` em prosa sem tecla; os atalhos que existem são de modificador (Alt+clique = ping, Ctrl+clique = revelar — `hooks/vtt/useBattlefieldPointer.ts:1225/1230`) e só aparecem em `components/vtt/VttHelpButton.tsx:305-318`. Colocar o atalho no `title` da ferramenta correspondente. Não inventar atalhos de tecla única agora (eles não existem — seria feature nova, não correção).

**Pronto quando** o script assertar: `hooks/vtt/useFoundryWindows.ts` contém `addEventListener("resize"`; `foundry.css` não esconde `.foundry-icon-bar__label` no bloco mobile (ou define substituto); e os `title` de `MapToolbar.tsx` que têm atalho contêm `Alt+`/`Ctrl+`.

---

### 13. Filtros avançados do compêndio — alto/médio

Item 2 da auditoria, ainda aberto, com os dados já prontos: `lib/compendium/format.ts:50-90` já lê `tactical.custoPontosAcao`, `tactical.alcanceCells`, `weapon.dano.tipo`, `spell.nivel`, `spell.escola`. Não há **nenhum** controle de filtro na UI (`compendium.css`, 462 linhas, zero `.comp-filter`/`.comp-chip`/`select`). É só expor. Fazer depois do alvo 7 porque mexe no mesmo componente.

**Pronto quando** o script assertar: `CompendiumBrowser.tsx` referencia `spell.nivel`/`escola` e `custoPontosAcao` fora do bloco de exibição, e `compendium.css` define as classes dos controles novos.

---

### 14. Adversários do bestiário nunca são resistentes a nada — alto/médio

`lib/combat/damage-resist.ts:27` (`resistedDamageAmount`) está ligado de verdade — `lib/combat/attack.ts:24` e `lib/combat/spell.ts:7` importam. Mas depende de `token.damageResist` (`lib/vtt/types.ts:104`), e o único escritor é `lib/combat/consumable-effects.ts:269` (poção). `createMonsterToken` (`lib/vtt/monsters.ts:137-170`) monta walk/run/pa/vida/defesa/tier/size e não seta o campo; e `monstros.json` não tem chave estruturada de resistência — as menções a "resistência" são prosa dentro de labels de `Assimilacao:`.

O que fazer: campo estruturado de resistência no JSON de monstro (gerado pelo pipeline `sync:data`, não editado à mão), lido em `createMonsterToken`. Trabalho de dados + 1 linha de motor.

**Pronto quando** `scripts/verify-monster-spawn.mjs` (já existe) assertar: pelo menos N monstros do bestiário têm `damageResist` no JSON, e `createMonsterToken` propaga o campo para o token.

---

### 15. Débito de PA por reação nunca dispara — alto/médio

`lib/combat/pa-turn.ts:244` lê `token.paRecoveryDebt` no início de todo turno e reduz a recuperação na linha 249; o único escritor de valor não-zero é `applyReactionPaDebt` (`pa-turn.ts:316-322`), que **não tem chamador** em nenhum `.ts/.tsx/.js/.mjs` do repo. Logo `debt` é sempre 0 e a regra do livro não existe em mesa. **Precisa de decisão**: ou ligar (chamar no ponto onde a reação é consumida) ou remover campo+função. O caminho de leitura rodando toda rodada é o que faz isso passar despercebido.

**Pronto quando** `scripts/verify-pa-bank.mjs` assertar, no cenário ligado: token que usou reação recupera `recoveryPerTurn - debt` no turno seguinte, e `debt` volta a 0. No cenário removido: zero ocorrências de `paRecoveryDebt` no repo.

---

### 16. Fome e Estudo de Anatomia: dois capítulos do livro sem runtime — médio/médio

- `daysWithoutMeal` (`lib/culinary/types.ts:19`, comentado como "Cap. 5 — exaustão por fome") aparece em exatamente 4 linhas: declaração, dois defaults zero e um reset zero (`apply-meal.ts:102`). Nenhum incremento, nenhuma penalidade.
- `lib/culinary/anatomy.ts` é órfão (zero importadores) e `studiedAnatomyCatalogIds` (`types.ts:16`) nunca recebe um `MON-###`; nada verifica se o monstro foi estudado antes da refeição. Bônus: `druidAutoKnowsFloraFungi(raca, classe)` ignora `raca` (`anatomy.ts:13-15`).

Ambos exigem gatilho de tempo de jogo (descanso longo / passagem de dia), que não existe hoje. **Decisão do dono antes de codar**: implementar a regra ou apagar o campo. Não deixar como está — campo declarado que nunca roda é o padrão que produziu metade desta lista.

**Pronto quando** `verify-culinary.mjs` assertar: (implementar) N dias sem refeição produz nível de exaustão, e refeição sem anatomia estudada é rejeitada; (apagar) zero ocorrências de `daysWithoutMeal`, `studiedAnatomyCatalogIds` e do arquivo `anatomy.ts`.

---

### 17. Varredura de código morto — confirmado item a item — baixo/trivial

Só o que o cético leu e confirmou individualmente. Remover em um commit, com o script de guarda no fim.
- `lib/combat/spell-channel.ts:12` `CHANNEL_SPELL_ENTRY_IDS` (duplica a fonte da verdade data-driven de `magias.json`, 10 = 10) e `parseChannelExtraPa` (`:41`).
- `lib/combat/buff-durations.ts:89` `BOOK_CONDITION_SUGGESTED_DURATIONS` (14 entradas) e `formatDurationSpec` (`:106`). **Não** apagar `DurationSpec` nem `BuffDurationRule` — o cético mostrou que são usados internamente (`:13, :19, :28, :37, :43, :50, :68`).
- `lib/combat/ability.ts:143` `listCombatAbilities`, `:173` `isEnemyToken`, `:255` `flankingAttackBonus` (esse último codifica um `+2` que **não** é a regra vigente — flanqueio real é vantagem, `lib/combat/conditions.ts:149`).
- `lib/combat/combat-pa-engine.ts:439` `pushTurnStartNotice` e `:446` `refreshActiveTokenAtTurnStart`. **Só esses dois** — `applyCombatSpendablePaIfDue` (`:441`) e `prepareSpawnedTokenPa` (`:442`) têm consumidores reais via o barrel `lib/combat/turn-economy.ts`.
- `lib/character/subclass-tracks.ts`: `SUBCLASS_TRACKS` (`:47`), `getTrackForClass` (`:66`), `describeTrackProgress` (`:159`), `subclassMatchesClass` (`:184`). **Não** tocar em `getTalentById` nem `TALENT_WINDOW_LEVELS` — estão vivos (`:94`, `:138`) e `TALENT_WINDOW_LEVELS` é o portão que decide a janela [4,8,12,16].
- `lib/room/reset-room-board.ts` (zero importadores).
- **Delta canônico**: `lib/room/internal/registry.ts:130` paga `buildRoomDelta(before, after)` em TODA persistência de sala e ninguém lê — `getDeltaAtRevision` (`revision-journal.ts:85`), `getCanonicalDeltasSince` (`:91`), `hasSnapshotAtRevision` (`:108`), `clearRevisionJournal` (`:120`) são todos mortos. O cético mostrou que esse delta **nunca** poderá substituir o do sync (é pré-filtragem por viewer, e `sync-response.ts:18-25` precisa passar por `snapshotForViewer`). Logo: **remover o cálculo**, é ganho de CPU por mutação, não otimização pendente.
- IDs de janela mortos `actors`/`whiteboard`/`tokens` (`lib/vtt/foundry-window-placement.ts:2,5,6` + `hooks/vtt/useFoundryWindows.ts:33,36,37`), que hoje são gravados no localStorage de toda sala.
- `defaultActorId = "pc-thrain-ferroescudo"` (`components/vtt/MesaWorkspace.tsx:126`) — personagem apagado; hoje inofensivo (todos os call sites passam id), bomba silenciosa amanhã.
- Rotas legadas sombreadas por `next.config.ts:23-24,27`: `app/biblioteca/page.tsx`, `app/biblioteca/[packId]/page.tsx`, `app/rpg/page.tsx` são código inalcançável.

**NÃO remover**: `lib/character/canon-ids.ts`. O cético mostrou que é alias deliberado e prescrito por `docs/DADOS-E-REGRAS.md:42` e `docs/CLAUDE-PROJETO.md:330`. O que existe ali é divergência doc↔código (docs mandam importar do barrel, código importa de `rules.ts`) — decisão do dono, não lixo.

**Pronto quando** o script assertar: zero ocorrências (fora de `docs/`) de cada símbolo removido; `registry.ts` não chama `buildRoomDelta`; `npm test` passa inteiro.

---

### 18. Deriva de documentação — baixo/trivial

- `docs/DESIGN-ELDARIN-V5-CORES.md:54,65,184` diz que o acento é `#b8922e` (ouro); `app/globals.css:12,27` usa `#8B7BB8` (Amethyst Dusk). **A correção é no documento, não no código** — no código `--chrome-accent` e `--content-accent` continuam iguais entre si, que é a regra real. Doc desatualizado induz quem for corrigir cor da ficha a errar.
- `robots.ts` e `sitemap.ts` não existem (cético verificou os 4 caminhos possíveis, inclusive `public/`). Sem sitemap, as órfãs do próximo item não têm rota de descoberta; sem robots, nada impede indexar `/instalar`.
- Órfãs com conteúdo real: `/instalar`, `/mesa` e `/download/guia` não são linkadas de lugar nenhum. `/instalar` some no alvo 6. `/mesa` (`app/mesa/page.tsx`, landing real) e `/download/guia` precisam de link — o guia inclusive linka **de volta** para `/download` (`:13`, `:121`) e não recebe link de lá.
- Órfãs de redirect sem entrada (`app/painel`, `app/jogador`, `app/mestre`, `app/eldarin`, `app/sign-in`, `app/sign-up`, `app/mesa/[roomId]/configurar`): manter. São redirects funcionais que protegem links antigos; custo zero, risco de remover > benefício.

**Pronto quando**: `verify-rotas.mjs` assertar existência de `app/robots.ts` e `app/sitemap.ts`, e que toda rota com `page.tsx` em `app/` que não é redirect aparece no sitemap OU tem pelo menos um `href` apontando para ela em `components/`/`app/`. E o hex `#b8922e` não aparece mais em `docs/DESIGN-ELDARIN-V5-CORES.md` como valor de `--content-accent`.

---

### 19. Indicador online/offline na lista de amigos — médio/médio

Não existe presença global: `FriendSummary` (`lib/friends/types.ts:3-11`) não tem campo, `listFriends` (`lib/friends/store.ts:281-288`) não monta, a API (`app/api/friends/route.ts:15-16`) não traz. A infra é por sala (`lib/db/room-presence.ts:41-44`, tabela `eldarin_room_presence`, TTL 40s), já consumida na lista de mesas (`lib/adventure/list-enrich.ts:94-97`).

**Ressalva do cético que muda o custo**: a tabela já tem `user_id` e `last_seen`, então presença global aproximada sai de uma query sem filtro de `room_id` — não precisa de tabela nova, só de **índice novo** (o índice atual começa por `room_id`, então a query global seria full scan). Ou seja, é menor do que o achado sugeriu.

**Pronto quando**: existir função `listGlobalPresence`/equivalente com teste de unidade (usuário visto há 10s → online; há 5min → offline), `FriendSummary` tiver o campo, e a migração criar o índice por `last_seen`.

---

### 20. Assimilações culinárias são texto puro — nenhum efeito chega ao combate — crítico/grande

O maior buraco de produto da lista, e o de pior razão custo/benefício — por isso está aqui embaixo, não porque é pequeno.

`effectLabel` (`lib/culinary/types.ts:7`) é preenchido em `apply-meal.ts:67` e tem exatamente **dois** leitores no repo, ambos renderizando string (`components/character/SheetPopupDdbView.tsx:385`, `components/vtt/CulinaryMealPanel.tsx:185`). `grep -i "assimil"` em `lib/combat/` e `hooks/`: zero. Os ~60 labels em `monstros.json` são mecânicos e específicos ("50% de resistência a dano necrótico (24h)", "+3 CA; resistência a perfurante e cortante não-mágico (24h)", "Cone 9m, 8d6 fogo") e nenhum número é parseado. O motor de refeição está ligado e grava certo — o **consumidor nunca foi construído**.

Como fazer (não fazer de uma vez): **Fase A** — schema estruturado de efeito nas ações `assim-*` do JSON, gerado pelo pipeline `sync:data`, com `effectLabel` virando texto derivado, não fonte. **Fase B** — consumidor em `lib/combat/` lendo `culinaryProgress.activeAssimilations` nos pontos onde bônus já entram hoje. Só começar depois que os alvos 8 (expiração) e 14 (`damageResist`) estiverem prontos — eles são pré-requisitos naturais: sem expiração, o efeito estruturado vira permanente; e `damageResist` é o veículo de boa parte das assimilações.

**Pronto quando**: Fase A — `verify-culinary.mjs` assertar que 100% das ações `assim-*` de `monstros.json` têm campo estruturado válido e que o `effectLabel` renderizado é derivado dele. Fase B — teste de função pura: ator com assimilação de resistência a necrótico recebe metade do dano necrótico; sem ela, dano cheio.

---

### 21. Ficha Eldarin fora do design system — alto/grande

`components/character/sheet-ddb.css` mantém uma paleta paralela `--ddb-*` em hex fixo: **0** ocorrências de `var(--content-*)` ou `var(--chrome-*)` contra 151 literais hex (48 únicos); `sheet-popup.css` 0/44; `sheet-v2.css` 0/28. E os valores **divergem** dos documentados (`--ddb-panel: #faf7f0` vs `--content-bg-elevated: #faf6ee` em `app/globals.css:21`; `--ddb-ink: #1e1814` vs `--content-ink: #3d2e1a` em `:26`). O próprio QA do design system marca isso como pendente (`docs/DESIGN-ELDARIN-V5-CORES.md:182`). Some-se: o bloco `--ddb-*` está **duplicado 4 vezes** dentro do mesmo arquivo (linhas 44-58, 1330-1342, 1360-1368, 1970-1980 — só o caso do portal tem justificativa documentada), então todo ajuste de cor precisa ser feito em 4 lugares.

Ordem correta de ataque, porque a ordem inversa desperdiça trabalho:
1. **Deduplicar** os 3 blocos copiados (médio, mecânico, sem risco visual).
2. **Corrigir o muted** `--ddb-muted: #6a5c4e` (`:51`) para o sancionado `#5a4e38` (`app/globals.css:25`) — mais escuro, melhora contraste de ~30 rótulos de uma vez. Caso extremo a medir junto: `.sheet-ddb-assim-list li small` com `#7a6f62` a `0.6rem` (`:1284-1285`).
3. **Medir** os 3 pares suspeitos do header/toolbar escuros que ninguém calculou: `rgba(248,242,234,0.35)` sobre `#2d0c12` a `0.72rem` (`:182`), `rgba(248,242,234,0.55)` a `0.62rem` (`:42`), `rgba(248,242,234,0.78)` sobre gradiente (`:280`). Os dois primeiros são texto pequeno → exigem 4.5:1.
4. Só então trocar hex por token.

**Pronto quando** `scripts/verify-design-tokens.mjs` assertar: (a) `--ddb-panel`/`--ddb-ink` aparecem no máximo 2x cada em `sheet-ddb.css` (base + portal); (b) `--ddb-muted` = `#5a4e38`; (c) função de contraste WCAG implementada no próprio script confirma ≥4.5:1 para os pares de texto pequeno listados — isso é aritmética pura, dá para assertar sem ferramenta externa; (d) contagem de hex literais em `sheet-ddb.css` decresce monotonicamente (número travado no script, baixado a cada passada).

---

### 22. Trava preventiva no `dangerouslySetInnerHTML` do compêndio — baixo/pequeno

`CompendiumBrowser.tsx:301` injeta `entry.system.description` sem sanitização. Hoje a fonte é 100% estática e autoral (os 6 JSON em `data/compendiums`), então **não é vulnerabilidade ativa** — é uma mina para o dia em que existir editor de compêndio. Fazer junto com o alvo 7 ou 13, quando o arquivo já estiver aberto: sanitizador mínimo por allowlist de tags.

**Pronto quando** o script assertar que todo `dangerouslySetInnerHTML` em `components/compendium/` passa por uma função `sanitize*`, e o teste de unidade da função remover `<script>` e atributos `on*`.

---

## O que eu NÃO recomendo fazer agora

**Quebrar `Battlefield.tsx` (3.085 linhas / 106 KB).** Impacto declarado baixo, esforço grande, e o próprio investigador diz que não auditou o conteúdo — não há afirmação de bug lá dentro. É o coração da VTT, sem cobertura de teste de UI: um refactor cego troca dívida de manutenção por risco de regressão em combate, seleção de token, névoa e medição. Só encarar depois que existir asserção de comportamento para os fluxos que ele concentra.

**Executar o inventário de 75 símbolos mortos em bloco.** O método é textual por nome, o próprio autor marcou como "piso, não teto", e o cético já derrubou **quatro** sub-afirmações desse mesmo scan (`DurationSpec`/`BuffDurationRule` vivos; `getTalentById`/`TALENT_WINDOW_LEVELS` vivos; `applyCombatSpendablePaIfDue`/`prepareSpawnedTokenPa` vivos via barrel; `canon-ids.ts` deliberado). Taxa de erro dessa ordem em remoção automática de código é caro demais. O alvo 17 leva só o que foi lido item a item; o resto do inventário fica como pista para investigação futura, nunca como lista de deleção.

**Refatorar o sistema de botões (33 re-skins contextuais + 6 famílias bespoke).** O achado derruba a premissa da auditoria: já **existe** fonte única com hierarquia em `app/globals.css:437-496,1012-1026`, e o uso em `components/character/*.tsx` é disciplinado. O defeito real (re-skin por ancestral e ausência de primitivo `<Button>`) é dívida de arquitetura de esforço grande e impacto médio — perde para tudo acima. **Exceção que vale destacar**: a armadilha `.btn-primary` vs `.btn-primary-cta` (visualmente idênticos por `globals.css:1012-1018`, mas o `:not(.btn-primary-cta)` de `sheet-ddb.css:1698,1712` isenta só um) é pequena e traiçoeira — ou renomear para revelar que a escolha é load-bearing, ou incluir os dois no `:not()`. Cabe num alvo oportunista, não num refactor.

**Remover a paleta azul legada de `sheet-popup.css` (42 KB) agora.** A análise é boa e os dois componentes (`SheetPdfCapture.tsx`, `SheetPopupV2View.tsx`) parecem inalcançáveis. Mas `SheetPdfExportButton` está **vivo** e há um caminho de PDF em produção — antes de apagar 42 KB de CSS e dois componentes, confirmar com o dono se o PDF v2 está planejado. Deletar um caminho de exportação que alguém pretendia religar é o tipo de erro que não aparece em teste.

**Imagens reais nos ícones do compêndio.** O branch `<img>` de `CompendiumIcon.tsx:68-75` é código morto porque nenhum dos 6 JSON tem `img` preenchido — e isso é decisão registrada (esperar arte real em vez de improvisar SVG). A parte de "ícone genérico único" já está resolvida com 33 kinds distintos. Bloqueado por arte, não por código.

**Virtualização/paginação da lista do compêndio.** O achado é real (224 cards de armas montados de uma vez em `CompendiumBrowser.tsx:197-207`, sem virtualização; e `CompendiumPage.tsx:29-31` serializa **todos** os packs visíveis, não só o ativo). Mas o alvo 4 remove o chunk de 659 KB, que é a maior fatia, e os alvos 7 e 13 vão reescrever esse mesmo componente. Medir de novo **depois** deles: virtualizar antes é otimizar código que vai mudar, e pode nem ser mais necessário.

---

Já caíram e não estão nesta lista (10): cards clicáveis do compêndio, `/mundo` na navbar, mesa demo removida por inteiro, persistência de posição das janelas flutuantes, labels do rail no desktop, ficha clara como decisão de design (não regressão), badge de não-lida no chat da navbar, privacidade correta nas demais superfícies sociais (amigos/perfil/presença/pedidos/notificações), nome real e e-mail restritos a superfícies próprias e admin, e ausência de símbolos Eldarin mantidos vivos só por scripts de teste.
