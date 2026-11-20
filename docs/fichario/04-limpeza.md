# 03 - Levantamento de limpeza de código (Eldarin VTT / MXDRPG)

Data: 2026-11-20. Branch: `fix/login-google-e-responsivo-um-anel` (commit 21e78a6). Nada foi editado, criado ou apagado dentro de `D:\Cursor\RPG`. Os scripts de análise e as saídas brutas ficaram só no scratchpad (`analyze.cjs`, `analyze2.cjs`, `analysis.json`, `analysis2.json`, `tsc.txt`, `lint.txt`, `test.txt`).

Aviso: durante o levantamento apareceram no `git status` duas pastas não versionadas que não são minhas, `.maestri/` e `docs/fichario/` (outro agente trabalhando em paralelo). Quem for executar os lotes deve ignorá-las.

Método:
- Grafo de imports de 1.020 arquivos (app, components, lib, hooks, types, scripts, middleware.ts, next.config.ts), com imports estáticos, `import()` dinâmico, `require` e `@import` de CSS, resolvendo `@/` e caminhos relativos. Entradas: arquivos especiais do App Router (page, layout, route, error, manifest...), middleware.ts e next.config.ts. 902 de 919 arquivos de código do app são alcançáveis; 35 não são (17 raízes órfãs mais os que só elas importam, incluindo 1 `.d.ts`).
- Para cada órfão, `git grep` pelo nome do arquivo e do símbolo em todo o repositório versionado (código, scripts, package.json, .github, docs, Dockerfile, compose). Não há `import()` com template string no projeto (busquei `import(\``), então não existe carregamento por nome montado em tempo de execução.
- Exports: índice de identificadores de todos os arquivos de código; um export conta como morto quando o nome não aparece em nenhum outro arquivo. É busca textual por nome: serve de pista, não de lista de deleção (a auditoria de 08/08 já derrubou quatro falsos positivos desse mesmo tipo de varredura).

## 1. Estado de saúde

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | Passou. 0 erros (rodei com `--incremental false` para não regravar `tsconfig.tsbuildinfo`). |
| `npm run lint` | Não roda. Sai com código 1 sem analisar nada: não existe configuração de ESLint (`.eslintrc*` / `eslint.config.*`) nem o pacote `eslint` em `node_modules`. O `next lint` abre o assistente interativo "How would you like to configure ESLint?" e ainda avisa que o comando foi descontinuado e some no Next 16. Contagem de erros de lint: indisponível. |
| `npm test` | Passou. 51 de 51 scripts (48 `verify-*.mjs` da cadeia `test` + 3 do `sync:data:check`), 0 falhas. Rodei cada script separadamente, na mesma ordem da cadeia. |

Observações de saúde que não são erro, mas pesam na limpeza:
- O CI (`.github/workflows/ci.yml`) só faz `npm run build` e, quando mudam livros/dados, `sync:data` + `sync:data:check`. Não roda `npm test` nem lint. Os 48 verify só rodam na máquina de quem lembrar.
- Há 39 comentários `eslint-disable` no código (quase todos de `no-img-element` e `no-var`) para um linter que não está instalado.
- `tsconfig.json` inclui `**/*.ts` e só exclui `node_modules`, então o tsc também varre `scripts/`, `vinite/` e `archive/` (hoje sem `.ts` versionado lá, por isso não incomoda).

## 2. Candidatos a limpeza

Classes: SEGURO = apagar ou ajustar não muda comportamento e a prova está completa. CONFIRMAR = provável, mas depende de decisão do dono ou de teste no navegador. ARRISCADO = fica em área sensível (combate, PA, sync da mesa, auth, schema).

### 2.1 Arquivos de código sem nenhum importador

| ID | Tipo | Caminho | O que é | Prova | Classe | Tamanho |
|---|---|---|---|---|---|---|
| L-001 | componente | `components/adventure/AdventureCoverManager.tsx` | Gerenciador de capa da aventura | 0 importadores no grafo; `git grep AdventureCoverManager` só acha o próprio arquivo; 0 menções em docs | SEGURO | 41 linhas |
| L-002 | componente | `components/character/SheetPopupQuickBar.tsx` | Barra rápida da ficha popup | Idem: só o próprio arquivo, 0 docs | SEGURO | 157 linhas |
| L-003 | componente | `components/friends/FriendsNavLink.tsx` | Link de amigos na navegação (existe `FriendsNavIcon`/`FriendsNavMessages` em uso) | Idem | SEGURO | 20 linhas |
| L-004 | componente | `components/vtt/ActionHoverTip.tsx` | Dica flutuante de ação | Idem | SEGURO | 36 linhas |
| L-005 | componente | `components/vtt/BattlefieldViewControls.tsx` | Controles de zoom/visão do mapa | Idem | SEGURO | 77 linhas |
| L-006 | componente | `components/vtt/GmMenuPanel.tsx` | Menu antigo do mestre (os painéis que ele agrupa continuam vivos por outro caminho) | Idem | SEGURO | 141 linhas |
| L-007 | componente | `components/vtt/MesaDrawer.tsx` | Gaveta lateral genérica | Idem; o arquivo não importa nada | SEGURO | 31 linhas |
| L-008 | componente | `components/vtt/PlayerEditRequestNotice.tsx` | Aviso de pedido de edição | Idem | SEGURO | 40 linhas |
| L-009 | componente | `components/vtt/TokenStatusModal.tsx` | Modal de status do token | Idem | SEGURO | 135 linhas |
| L-010 | hook | `hooks/vtt/useMesaPanelLayout.ts` | Hook de layout de painéis | Idem. Depois de apagar, `lib/vtt/mesa-panel-layout.ts` fica sem importador (não apagar junto; reavaliar) | SEGURO | 62 linhas |
| L-011 | barrel | `components/backgrounds/index.ts` | Reexporta os 7 fundos | Ninguém importa `@/components/backgrounds` nem `./backgrounds`; todos importam os arquivos direto (`BackgroundWrapper.tsx`) | SEGURO | 8 linhas |
| L-012 | componente | `components/vtt/CombatActionBar.tsx` | Barra de ações de combate antiga | 0 importadores, 0 menções. Fica em CONFIRMAR por ser UI de combate e ter 257 linhas de lógica de cliente | CONFIRMAR | 257 linhas |
| L-013 | componente | `components/vtt/TokenActionPanel.tsx` | Painel de ações do token (parece substituído por `TokenActionRing`) | 0 importadores; mas é citado como atual em `docs/COMBATE-MESA.md`, `docs/ELDARIN-SITE-JOGAVEL.md`, `docs/PRD-ELDARIN-VTT.md` | CONFIRMAR | 867 linhas |
| L-014 | componente | `components/vtt/EndTurnConfirmDialog.tsx` | Diálogo de confirmação ao passar turno | 0 importadores; citado em `docs/PRD-ELDARIN-VTT.md`. A confirmação ao passar turno é decisão de produto (D24-D27): conferir onde ela vive hoje antes de apagar | CONFIRMAR | 100 linhas |
| L-015 | componente | `components/vtt/CombatModeSword.tsx` | Ícone/animação do modo combate | 0 importadores; só `docs/HISTORICO.md` | CONFIRMAR | 91 linhas |
| L-016 | componentes | `components/vtt/MesaCompendiumPanel.tsx`, `MesaSheetPanel.tsx`, `MesaSideRail.tsx` | Rail lateral da mesa | 0 importadores; `docs/UX-MESA-E-RAIL.md` descreve os três como o desenho vigente. Ou o doc está velho, ou o rail saiu sem querer | CONFIRMAR | 20 + 45 + 52 linhas |
| L-017 | componentes | `components/vtt/ActiveCharactersPanel.tsx` + `components/vtt/PlayerSpawnPanel.tsx` | Painel de personagens ativos; o segundo só é importado pelo primeiro | Raiz com 0 importadores; citados em `docs/HISTORICO.md` e na auditoria | CONFIRMAR | 149 + 320 linhas |
| L-018 | componente + lib | `components/vtt/Dice3DScene.tsx` + `lib/vtt/dice-face-texture.ts`, `lib/vtt/dice-orientations.ts`, `lib/vtt/webgl-dice-pool.ts` | Cena 3D de dados em three.js; os três módulos de lib só são importados por ela | Raiz com 0 importadores; citada em `docs/PRD-MESA-UM-ANEL.md`. `three` continua necessário por `DiceWebGL.tsx` | CONFIRMAR | 176 + 74 + 26 + 21 linhas |
| L-019 | componentes | `components/character/SheetPdfCapture.tsx` + `CharacterSheetPopupHero.tsx` + `SheetPopupCombatStrip.tsx` | Caminho antigo de PDF por captura de tela | Raiz com 0 importadores. A auditoria de 08/08 pediu para confirmar com o dono se o PDF v2 volta (o botão `SheetPdfExportButton` está vivo) | CONFIRMAR | 336 + 145 + 89 linhas |
| L-020 | componente | `components/auth/DeleteAccountButton.tsx` | Botão "excluir conta" | 0 importadores. A rota `DELETE /api/auth/account` existe e hoje não tem botão que a chame. Pode ser função de LGPD que ficou sem ligar, não lixo | CONFIRMAR | 44 linhas |
| L-021 | hook | `hooks/useDeviceProfile.ts` | Perfil de dispositivo (responsivo) | 0 importadores; citado em `docs/DESIGN-ATUAL.md`; última alteração em 04/08, perto do trabalho de responsivo desta branch | CONFIRMAR | 106 linhas |
| L-022 | lib | `lib/culinary/anatomy.ts` | Anatomia estudada (culinária) | 0 importadores. Item 16 da auditoria: decidir entre implementar a regra ou apagar | CONFIRMAR | 16 linhas |
| L-023 | lib | `lib/vtt/token-integrity.ts` | `repairDuplicateTokenIds`: conserta IDs de token duplicados | 0 importadores, 0 menções. O comentário diz que duplicata quebra ordem de turno; parece correção nunca ligada | CONFIRMAR | 89 linhas |
| L-024 | lib | `lib/room/reset-room-board.ts` | Zera tabuleiro e combate | 0 importadores; já confirmado na auditoria (item 17). Fica em área de sala/PA | ARRISCADO | 36 linhas |
| L-025 | barrel | `lib/auth/index.ts` | Barrel de auth | Ninguém importa `@/lib/auth` (todos importam `@/lib/auth/arquivo`). Área de auth | ARRISCADO | 12 linhas |
| L-026 | lib | `lib/character/canon-ids.ts` | Alias dos IDs canônicos | 0 importadores, mas `docs/DADOS-E-REGRAS.md` e `docs/CLAUDE-PROJETO.md` mandam importar daqui. A auditoria decidiu NÃO remover | CONFIRMAR (manter) | 14 linhas |
| L-027 | tipos + dep | `types/dice-box.d.ts` e a dependência `@3d-dice/dice-box` | Declaração de módulo e pacote npm | Nenhum arquivo importa `@3d-dice/dice-box`. O app carrega a cópia em `public/vendor/dice-box/` por URL (`lib/vtt/dice-combat-box.ts:61-68`), e essa cópia é diferente da que está em `node_modules` (md5 distinto). O pacote só serve de origem para a cópia manual | CONFIRMAR | 26 linhas + 1 dep |

### 2.2 Exports, logs, marcações

| ID | Tipo | Caminho | O que é | Prova | Classe | Tamanho |
|---|---|---|---|---|---|---|
| L-028 | exports mortos | 45 símbolos em `lib/character` (33), `lib/backgrounds.ts` (2), `lib/bestiary` (2), `lib/media` (2), `lib/world` (2), `lib/adventure` (1), `lib/culinary` (1), `lib/notifications` (1), `components/character` (1) | Funções, constantes e tipos exportados cujo nome não aparece em nenhum outro arquivo nem é usado no próprio | Índice textual de identificadores. Lista completa no Apêndice A | CONFIRMAR | 45 símbolos |
| L-029 | exports mortos | 100 símbolos em `lib/vtt` (42), `lib/combat` (29), `lib/room` (13), `lib/auth` (8), `lib/db` (4), `hooks/vtt` (4) | Idem, em área sensível. Inclui os 14 que a auditoria já confirmou um a um (`spell-channel`, `buff-durations`, `ability`, `combat-pa-engine`, `revision-journal`) | Idem. Lista no Apêndice A | ARRISCADO | 100 símbolos |
| L-030 | export desnecessário | 524 símbolos em app/components/lib/hooks | Exportados, mas só usados dentro do próprio arquivo (234 tipos, 192 funções, 94 constantes, 4 reexports). Bastaria tirar o `export` | Mesmo índice. Só registro: ganho pequeno, diff grande | CONFIRMAR | 524 símbolos |
| L-031 | log de depuração | `lib/combat/attack.ts:774`, `:891`, `:904` | `console.log("[monsterAttack] ...")` a cada ataque de monstro, no servidor | Únicos `console.log/debug/info` em app/components/lib/hooks (os outros 95 são `warn`/`error`). Trivial, mas é arquivo de combate | ARRISCADO | 3 linhas |
| L-032 | marcação | 40 `@deprecated` em app/components/lib/hooks | Aliases e campos legados. Vários já aparecem em L-028/L-029 como mortos (ex.: `lib/backgrounds.ts:34,39`, `lib/combat/pa-turn.ts:20,31,123`, `lib/vtt/ranged-weapon-range.ts:72`) | `git grep "@deprecated"` | CONFIRMAR | 40 marcações |
| L-033 | TODO/FIXME/HACK | nenhum | As 4 ocorrências de "TODO" (`components/vtt/vtt.css:2923`, `scripts/verify-rotas.mjs:12`, `scripts/verify-um-anel-aventuras-wilderland.mjs:310`, `scripts/verify-um-anel-virtudes.mjs:192`) são a palavra "todo" em maiúsculas, não pendência | `git grep -E "\b(TODO|FIXME|HACK|XXX)\b"` | nada a fazer | 0 |
| L-034 | código comentado | nenhum | A varredura por blocos de 4 ou mais linhas `//` com cara de código só achou `lib/character/um-anel/adversaries.ts:822-826`, que é texto explicativo. Também não há `debugger`, `@ts-ignore` nem `@ts-expect-error` | Script `analyze2.cjs` + `git grep` | nada a fazer | 0 |

### 2.3 Dependências e configuração

| ID | Tipo | Caminho | O que é | Prova | Classe | Tamanho |
|---|---|---|---|---|---|---|
| L-035 | script quebrado | `package.json` script `lint` | `next lint` sem ESLint instalado nem configurado | Ver seção 1. Decidir: configurar ESLint de verdade ou tirar o script e os 39 `eslint-disable` | CONFIRMAR | 1 script |
| L-036 | dep não declarada | `server-only` | Importado em 43 arquivos e ausente do `package.json` e de `node_modules/server-only` | Funciona porque o Next resolve esse nome por conta própria no build. Declarar é o caminho recomendado, mas exige `npm install` | CONFIRMAR | 43 imports |
| L-037 | docs x código | `mysql2` é a dependência certa | `lib/db/client.ts` usa só `client-mariadb.ts` (mysql2); `scripts/db/migrate.mjs:19-22` recusa URL `postgres://` com "Postgres não é suportado". Não há import de `pg`, `postgres`, `@neondatabase/*` nem `@clerk/*` em lugar nenhum | Os docs é que estão velhos: `docs/CLAUDE-PROJETO.md` (seções 3, 6, 11), `docs/POSTGRES.md`, `docs/P0-NEON-SETUP.md`, `docs/A1-NEON-SMOKE.md` e `DEPLOY.md` falam em Neon Postgres e/ou Clerk | CONFIRMAR | 5 docs |
| L-038 | schema legado | `scripts/db/schema.sql`, `scripts/db/migrate-adventures.sql`, `scripts/db/migrate-room-settings.sql`, `scripts/db/migrations/001..019_*.sql` | Schema e migrações em SQL solto | `migrate.mjs` só lê `schema.mariadb.sql`; nenhum código lê a pasta `migrations/` (busquei `migrations/`, `readdir`, nomes dos arquivos). `schema.sql` tem cabeçalho "schema Postgres" e `TEXT PRIMARY KEY`, mas `docker-compose.local.yml:24` monta esse arquivo como init do MariaDB. As migrações misturam dialetos (001 é Postgres, 019 é MariaDB). Possível bug no ambiente local, além de lixo | ARRISCADO | 22 arquivos, ~14 KB |
| L-039 | resíduo de auth | `lib/auth/account-ownership.ts:3`, `lib/auth/account-user.ts:15` (`clerkAlias`, duplicado) e mais ~20 arquivos com "clerk" | Compatibilidade com IDs antigos do Clerk, que não é mais dependência | `git grep -il clerk` em app/components/lib. Pode haver dado antigo no banco com esse formato | ARRISCADO | ~20 arquivos |
| L-040 | deps de tipos | `@types/*`, `typescript` | Sem import direto, como esperado | Usadas pelo compilador | nada a fazer | - |

### 2.4 Scripts (140 versionados em scripts/)

78 são chamados pelo `package.json`. Dos outros 62, a maioria é módulo importado por outro script (`db/load-env.mjs`, `db/mysql-pool.mjs`, `homolog/*`, `monster-balance.mjs`, `equipment_*_data.py`) e está viva. Sobram:

| ID | Tipo | Caminho | O que é | Prova | Classe | Tamanho |
|---|---|---|---|---|---|---|
| L-041 | binário versionado | `scripts/__pycache__/build-pdfs.cpython-314.pyc` | Cache do Python commitado por engano | `git ls-files` lista o arquivo, embora `.gitignore` tenha `__pycache__/` e `*.pyc` (os outros 4 `.pyc` da pasta estão ignorados). Ação: `git rm --cached` | SEGURO | 16,6 KB |
| L-042 | scripts de uso único | `scripts/finish-hex-purge.mjs`, `scripts/fix-hex-identifiers.mjs`, `scripts/replace-vercel-docs.mjs`, `scripts/rename-vinite-to-eldarin.py`, `scripts/fix_pt_br_so_revert.py`, `scripts/purge-dnd-names.mjs`, `scripts/refactor-cooking-spells.mjs`, `scripts/bump-monster-pa.mjs`, `scripts/sync-pa-cost-default-2.mjs`, `scripts/inject-monster-xp.py`, `scripts/inject-saque-lm.py` | Substituições em massa já aplicadas em junho (purga de "hex", troca de marca, troca Vercel, ajustes pontuais em livros e JSON) | Nenhum é citado em `package.json`, `.github/`, docs, Dockerfile, compose nem por outro script (busca por nome-base em todo arquivo de texto versionado). Os três que editam JSON gerado à mão (`refactor-cooking-spells`, `bump-monster-pa`, `sync-pa-cost-default-2`) contrariam a regra do projeto, e o CI já garante que o JSON é igual à saída do `sync:data` | SEGURO | 11 arquivos, ~29 KB |
| L-043 | scripts de uso único citados | `scripts/purge-hex-all.mjs`, `scripts/rename-grid-legacy.mjs` | Purga principal de "hex" | `purge-hex-all.mjs` é citado em `docs/PRD-MESA-UM-ANEL.md:407` como registro da decisão; `rename-grid-legacy.mjs` só é mencionado pelos outros scripts de purga | CONFIRMAR | 11,5 KB |
| L-044 | ferramentas sem atalho | `scripts/gen-assimilacao-especime.py` (gera `livros/ASSIMILACAO-POR-ESPECIME.md`), `scripts/generate-subclass-track-details.mjs` (gera `data/character/subclass-track-details.json`, que `lib/character/subclass-wizard-tooltips.ts` importa), `scripts/generate-favicon.mjs`, `scripts/balance-monsters-sim.mjs`, `scripts/fix_pt_br_ortografia.py`, `scripts/build-pdfs.py` + `scripts/pdf-theme/*.css`, `scripts/install-wsl.ps1` | Geradores e utilitários reaproveitáveis, fora do `package.json` | 0 referências em package.json/CI. Não são lixo: dois deles geram arquivo que o app ou os livros usam e não entram no `sync:data`. `scripts/pdf-theme/vinite-ficha.css` não é carregado por `build-pdfs.py` (ele usa `vinite-ficha-compact.css`) | CONFIRMAR | ~95 KB |
| L-045 | smoke sem atalho | `scripts/smoke/pa-turn-refresh.mjs`, `scripts/smoke/pa-combat-spend.mjs`, `scripts/smoke/pa-turn-flow.mjs`, `scripts/smoke/combat-pa-phase.mjs` | Testes de PA fora do `package.json`. `pa-turn-refresh` e `combat-pa-phase` copiam a regra dentro do próprio teste em vez de importar de `lib/combat`, então não protegem contra regressão | 0 referências em package.json/CI; dois citados em `docs/HISTORICO.md` | ARRISCADO (PA) | ~11 KB |

### 2.5 Raiz e arredores

Arquivos sensíveis: `git ls-files | grep -i env` devolve só `.env.example`, `.env.homolog.example`, `.env.local.example` e três arquivos de código (`lib/env/homolog.ts`, `scripts/db/load-env.mjs`, `scripts/homolog/env.mjs`). `.env.local` e `.env.homolog` existem no disco e estão ignorados. Nenhum segredo versionado por engano.

| ID | Tipo | Caminho | O que é | Prova | Classe | Tamanho |
|---|---|---|---|---|---|---|
| L-046 | raiz | `preview-combate-dados.html` | Página de redirecionamento para `/preview-combate-dados.html`. Versionada. A raiz não é servida pelo Next, então o arquivo não faz nada | Só citada em `docs/HISTORICO.md` e na versão de `public/` | SEGURO | 358 bytes |
| L-047 | raiz | `tsconfig.tsbuildinfo` | Cache incremental do tsc. Ignorado (`*.tsbuildinfo`), não versionado; o tsc recria | `git check-ignore` confirma | SEGURO (só local) | 468 KB |
| L-048 | raiz | `preview-ficha.html` | Preview local de design. Ignorado e não versionado; nada o referencia (o comentário em `SheetDdbDrawer.tsx:14` cita `docs/preview-ficha-ddb.html`, que não existe) | `.gitignore:37` | CONFIRMAR (arquivo pessoal) | 26 KB |
| L-049 | public | `public/preview-combate-dados.html`, `public/combat-dice-model.mjs`, `public/backgrounds-preview.html` | Páginas de preview de desenvolvimento servidas em produção. `combat-dice-model.mjs` é cópia manual da lógica de `lib/vtt/combat-dice-model.ts` | Nenhuma rota ou componente aponta para elas; `docs/CLAUDE-CODIGO-SEGURO.md` cita o preview de fundos como ferramenta manual | CONFIRMAR | 61 KB |
| L-050 | public | `public/assets/ammo/` e `public/assets/themes/` | Cópias byte a byte de `public/assets/dice-box/ammo/` e `public/assets/dice-box/themes/` (md5 idêntico nos 7 arquivos) | O código só aponta para `/assets/dice-box/` (`lib/vtt/combat-dice-model.ts:404`, `lib/vtt/dice-combat-box.ts:63-64`, e a string dentro do vendor). É caminho de tempo de execução: validar no navegador antes de apagar | CONFIRMAR | 605 KB |
| L-051 | public | `public/brand/rpg/arcane-cover.png`, `arcane-cover.svg`, `dnd-cover.svg`, `eldarin-cover.svg`, `vtm-cover.svg`, `public/icon.svg` | Capas sem referência no código. `arcane-cover.png` é idêntica a `dnd-cover.png` (md5 igual); `public/icon.svg` é idêntica a `app/icon.svg` | `lib/rpg/systems.ts:9-18` só usa os `.png`/`.webp`. Risco: mesa antiga com `coverUrl` gravado no banco apontando para `arcane-cover.png` | CONFIRMAR | ~104 KB |
| L-052 | ferramenta de agente | `.agents/` (149 arquivos versionados) e `skills-lock.json` | Skills do Clerk (astro, android, billing...) instaladas em 20/06 | O projeto não usa Clerk (ver L-037). Só citados em `docs/HISTORICO.md` e na lista de pastas ignoradas de `scripts/purge-dnd-names.mjs` | CONFIRMAR | 925 KB + 5 KB |
| L-053 | rascunho | `.tmp-traducao/` (2 arquivos) | Rascunho de tradução do Um Anel. Ignorado, não versionado | Os dois arquivos diferem dos que estão em `livros/um-anel/` (83.735 x 83.812 bytes e 157.222 x 157.240). Pode ser rascunho superado ou trabalho em andamento | CONFIRMAR | 244 KB |
| L-054 | fonte | `the one ring/` (13 arquivos, PDFs) | Livros comprados. Ignorado (`.gitignore:42`) e não versionado. É referência citada nos `livros/um-anel/*.md`: não é lixo | `git ls-files` vazio para a pasta | manter | 83 MB |
| L-055 | docker | `.dockerignore` | Não exclui `archive/`, `the one ring/`, `.tmp-traducao/`, `.agents/`, `.next/` | O `Dockerfile` faz `COPY . .`. No CI isso não importa (checkout limpo), mas um build local (`docker-compose.local.yml`) manda 333 MB de `archive/` e os 83 MB de PDFs comerciais para dentro da imagem | CONFIRMAR | 1 arquivo |
| L-056 | legado | `archive/` | Versionados: só `archive/README.md` e `archive/web/README.md`. No disco: `archive/web/node_modules` (142 MB) e `archive/web/.next` (191 MB), ignorados; `archive/web/lib` e `scripts` estão vazios | Nada no app importa `archive/`. O próprio README diz que pode ser removido se o dono concordar | CONFIRMAR | 333 MB no disco, 2 arquivos no git |
| L-057 | referência | `vinite/` (43 arquivos versionados) | Módulo Foundry | Nada em app/components/lib/hooks importa `vinite/`. Só docs e `scripts/purge-hex-all.mjs` o citam | manter | 201 KB |
| L-058 | vivo | `cmd/mestre/` (4 arquivos Go) | Não é lixo: `.github/workflows/release-mestre.yml` compila esse programa | `git grep cmd/mestre` | manter | 23 KB |
| L-059 | docs | links quebrados | `REFATORACAO.md` (citado em `docs/CLAUDE-PROJETO.md`, `docs/DADOS-E-REGRAS.md`, `docs/ELDARIN-SITE-JOGAVEL.md`) e `docs/P1-CLERK-SETUP.md` (citado em `docs/CLAUDE-PROJETO.md`, `docs/P0-NEON-SETUP.md`, `docs/A1-NEON-SMOKE.md`) não existem | Verificação de existência de cada link `.md` relativo | SEGURO | 6 links em 5 docs |
| L-060 | rotas | `app/biblioteca/page.tsx`, `app/biblioteca/[packId]/page.tsx`, `app/rpg/page.tsx` | Páginas inalcançáveis: `next.config.ts` redireciona `/biblioteca`, `/biblioteca/:pack` e `/rpg` antes de chegar nelas | Já apontado na auditoria (item 17). `app/rpg/eldarin` e `app/rpg/um-anel` continuam vivos | CONFIRMAR | 3 arquivos |

### 2.6 package.json e CSS

| ID | Tipo | Caminho | O que é | Prova | Classe | Tamanho |
|---|---|---|---|---|---|---|
| L-061 | package.json | scripts `test` e `test:um-anel` | Os 30 scripts de `test:um-anel` (1.382 caracteres) estão repetidos, um por um, dentro de `test` (2.122 caracteres). Ajuste: `test` passa a chamar `npm run test:um-anel` | Comparação das duas listas: 30 de 30 contidos. Só `verify-oauth-session-cost.mjs` fica intercalado no meio; a ordem muda, o conjunto não | SEGURO | 1 linha |
| L-062 | package.json | `test:pa`, `test:auth`, `test:move`, `test:pdf`, `test:consumables`, `test:culinary` | Atalhos para um único script que já está em `test`. Úteis para rodar um só; registro. `verify-inventory-requests.mjs` é o único verify fora de `test` (só tem o atalho `test:inventory-requests`) | Leitura do `package.json` | CONFIRMAR | 6 atalhos |
| L-063 | CSS órfão | `app/globals.css` | 14 classes que só existem no próprio arquivo: `animate-float`, `content-input`, `friends-search`, `friends-toolbar`, `hero-grid`, `hero-visual`, `room-chat-form`, `site-logo`, `site-select__control`, `stat-label`, `stat-value`, `stats-strip`, `vtt-loading`, `whiteboard-toolbar`. Outras 8 só aparecem em outros CSS, nunca em TSX: `chrome-field`, `cta-band`, `display-xl`, `grid-3`, `mesa-stage`, `neon-chip`, `vtt-mode-row`, `vtt-token-panel` | `git grep -F` de cada classe em todo o repositório. Nenhum prefixo montado dinamicamente bate com elas. CSS pede conferência visual | CONFIRMAR | 22 de 126 classes |
| L-064 | CSS órfão | demais CSS | 278 classes sem uso em TS/TSX/HTML: `components/vtt/vtt.css` 102 de 826, `components/character/sheet-popup.css` 52 de 180, `components/vtt/foundry/foundry.css` 22, `components/character/sheet.css` 20, `components/friends/friends.css` 20, `components/vtt/mesa-theme.css` 15, `components/auth/auth-forms.css` 9, resto abaixo de 9 | Mesmo método (lista em `analysis2.json`). Parte de `sheet-popup.css` é a paleta legada que a auditoria mandou não remover sem decidir o PDF | CONFIRMAR | 278 classes |

### Totais por classe

- SEGURO: 17 itens (L-001 a L-011, L-041, L-042, L-046, L-047, L-059, L-061). L-047 é arquivo local, fora do git.
- CONFIRMAR: 34 itens.
- ARRISCADO: 7 itens (L-024, L-025, L-029, L-031, L-038, L-039, L-045).
- Manter ou nada a fazer: L-033, L-034, L-040, L-054, L-057, L-058.

## 3. Proposta de divisão em agentes (só itens SEGUROS)

Cinco lotes, sem arquivo em comum. Nenhum lote mexe em `docs/HISTORICO.md`: o registro no histórico deve ser feito uma vez, por quem coordena, depois que os cinco terminarem, para não dar conflito. Nenhum lote precisa de `npm install`.

### Lote A - Componentes e hooks órfãos
Apagar (`git rm`):
- `components/adventure/AdventureCoverManager.tsx`
- `components/character/SheetPopupQuickBar.tsx`
- `components/friends/FriendsNavLink.tsx`
- `components/vtt/ActionHoverTip.tsx`
- `components/vtt/BattlefieldViewControls.tsx`
- `components/vtt/GmMenuPanel.tsx`
- `components/vtt/MesaDrawer.tsx`
- `components/vtt/PlayerEditRequestNotice.tsx`
- `components/vtt/TokenStatusModal.tsx`
- `hooks/vtt/useMesaPanelLayout.ts`
- `components/backgrounds/index.ts`

Validar: `npx tsc --noEmit` com 0 erros (um import esquecido aparece aqui); `npm test` com 51 de 51; `git grep` de cada nome de componente devolvendo vazio fora de docs. Não apagar os arquivos que só eles importavam (ex.: `lib/vtt/mesa-panel-layout.ts`); isso vira nova rodada.

### Lote B - Scripts de uso único e cache versionado
Apagar (`git rm`):
- `scripts/finish-hex-purge.mjs`
- `scripts/fix-hex-identifiers.mjs`
- `scripts/replace-vercel-docs.mjs`
- `scripts/rename-vinite-to-eldarin.py`
- `scripts/fix_pt_br_so_revert.py`
- `scripts/purge-dnd-names.mjs`
- `scripts/refactor-cooking-spells.mjs`
- `scripts/bump-monster-pa.mjs`
- `scripts/sync-pa-cost-default-2.mjs`
- `scripts/inject-monster-xp.py`
- `scripts/inject-saque-lm.py`

Tirar do índice sem apagar do disco (`git rm --cached`): `scripts/__pycache__/build-pdfs.cpython-314.pyc`.

Validar: `npm test` com 51 de 51; `npm run sync:data:check` passando; `git grep` dos nomes-base vazio; `git ls-files scripts/__pycache__` vazio. Observação: apagar `sync-pa-cost-default-2.mjs` casa com o filtro `scripts/sync-*.mjs` do CI e dispara o job `data-sync` no PR; ele deve passar sem diferença.

### Lote C - Raiz
- Apagar (`git rm`): `preview-combate-dados.html` (o da raiz; o de `public/` fica).
- Apagar do disco: `tsconfig.tsbuildinfo` (não versionado; o próximo `tsc` recria).

Validar: `git status` mostrando só a remoção; `npx tsc --noEmit` passando.

### Lote D - Links quebrados nos docs
- `docs/CLAUDE-PROJETO.md`: tirar a linha de `REFATORACAO.md` e a de `P1-CLERK-SETUP.md` do índice da seção 14 e as duas citações a `docs/P1-CLERK-SETUP.md` nas seções 3 e 13.
- `docs/DADOS-E-REGRAS.md` e `docs/ELDARIN-SITE-JOGAVEL.md`: tirar o link para `REFATORACAO.md`.
- `docs/P0-NEON-SETUP.md` e `docs/A1-NEON-SMOKE.md`: tirar o link para `P1-CLERK-SETUP.md`.

Só remover o link morto. Reescrever o conteúdo sobre Postgres/Clerk é o item L-037, que depende do dono.

Validar: repetir a checagem de links `.md` relativos e obter zero links para arquivo inexistente.

### Lote E - package.json
- Trocar o script `test` para: os 18 verify que não são do Um Anel, depois `npm run test:um-anel`, depois `npm run sync:data:check`. O script `test:um-anel` não muda.

Validar: extrair a lista de scripts executados antes e depois e confirmar o mesmo conjunto de 51; `npm test` passando do começo ao fim. Não tocar em `dependencies` (isso é L-027 e L-036).

## 4. Duplicações e arquivos gigantes (registro, sem ação)

### 4.1 Funções com corpo idêntico em mais de um arquivo

| Função | Onde | Observação |
|---|---|---|
| `authorFromSession` | `app/api/room/[roomId]/combat/ability/route.ts:21`, `area/route.ts:23`, `attack/route.ts:61`, `consume/route.ts:21` | 4 cópias de ~500 caracteres nas rotas de combate |
| `resolveInventory` | `components/character/SheetPdfCapture.tsx:60`, `SheetPdfDocument.tsx:32`, `SheetPopupLoadoutBar.tsx:27` | 3 cópias |
| `hasTalent` | `lib/combat/pa-cost-reduce.ts:38`, `pa-economy.ts:32`, `pa-passive-effects.ts:6` | 3 cópias em PA |
| `paRulesForToken` | `lib/combat/zero-pa-options.ts:12`, `lib/room/combat-gm.ts:13` | PA |
| `attributeLabel`, `defenderHp` | `lib/combat/attack.ts:499,639` e `lib/combat/spell.ts:45,57` | combate |
| `normalizeDamageTag` | `lib/combat/damage-resist.ts:3`, `lib/combat/pa-cost-reduce.ts:60` | combate |
| `clerkAlias` | `lib/auth/account-ownership.ts:3`, `lib/auth/account-user.ts:15` | auth |
| `sign` | `lib/auth/oauth/state.ts:26`, `lib/auth/session.ts:18` | auth |
| `slugEmail` | `lib/auth/user-store.ts:32`, `lib/db/users.ts:38` | auth |
| `canWriteRegistryFile` | `lib/character/character-registry.ts:26`, `lib/character/um-anel/registry.ts:26` | mais `loadPersisted`/`savePersisted` com o mesmo nome em 3 arquivos |
| `displayName`, `displayNameFromRow` | `lib/adventure/join-requests.ts:37`, `lib/friends/store.ts:41`; `lib/adventure/list-enrich.ts:25`, `lib/room/presence-enrich.ts:39` | regra de apelido: vale centralizar por causa da privacidade |
| `isTypingTarget` | `hooks/vtt/useBattlefieldView.ts:33`, `lib/vtt/keyboard-guard.ts:2` | já existe o helper em lib |
| `stripHtml` | `lib/character/level-up-ui.ts:53`, `lib/compendium/format.ts:1` | |
| `participantIds` | `lib/room/adventure-actors.ts:20`, `lib/room/combat-xp.ts:20` | |
| `buildDragGhost` | `components/vtt/MonsterSpawnPanel.tsx:274`, `PlayerSpawnPanel.tsx:35` | some se L-017 for aprovado |
| `waitLayout` | `components/vtt/DiceBoxMini.tsx:25`, `DiceCombatPanel.tsx:25` | |
| `formatTime`, `formatWhen`, `statusTone`, `clampHorizontal`, `stopWheelBubble`, `Svg` | pares em `components/vtt` e `components/character` | utilitários de 2 a 8 linhas |

Mesmo nome com corpo diferente, a observar: `storageKey` (6 arquivos), `memoryStore` (4), `assertGm` (3 handlers), `spiritStateFromSheet` (3 handlers do Um Anel).

### 4.2 Componentes fazendo a mesma coisa

- Hover tip: `components/character/SheetHoverTip.tsx` e `components/character/wizard/WizardHoverTip.tsx` (com `clampHorizontal` idêntico), mais o órfão `components/vtt/ActionHoverTip.tsx`.
- Sinos de pedido: `MesaPlayerEditRequestsBell.tsx` e `MesaPlayerInventoryRequestsBell.tsx` (mesma estrutura, `statusTone` idêntico).
- Histórico do mestre: `GmActionHistoryPanel.tsx` e `GmCombatLogPanel.tsx`.
- Conhecimento de monstro: `MonsterKnowledgeBlock.tsx` e `MonsterKnowledgePanel.tsx`.
- Dados 3D: `DiceWebGL.tsx` (vivo), `Dice3DScene.tsx` (órfão), `DiceBoxMini.tsx` e `DiceCombatPanel.tsx` (dice-box vendorizado), `DiceMiniature.tsx` (fallback). Quatro caminhos de renderização de dado.
- Wizards: `CharacterCreationWizard.tsx` (1.189 linhas) e `TorCharacterCreationWizard.tsx` (803), um por sistema.
- Lógica de dado duplicada entre `lib/vtt/combat-dice-model.ts` e `public/combat-dice-model.mjs` (cópia manual para o preview).

### 4.3 CSS

- `app/globals.css`: 1.667 linhas, 37,9 KB, 126 classes; 18 seletores definidos mais de uma vez dentro do próprio arquivo.
- Total de CSS no app: 50 arquivos. Os maiores: `components/vtt/vtt.css` 8.228 linhas (174 KB), `components/character/sheet-popup.css` 2.816 (42 KB), `components/vtt/foundry/foundry.css` 2.553 (62 KB), `components/character/sheet-ddb.css` 2.265 (52 KB), `components/character/sheet.css` 1.889 (36 KB).
- 113 seletores aparecem em mais de um arquivo. Pares que mais se repetem: `portrait-focus.css` + `sheet.css` (31), `globals.css` + `vtt.css` (19), `globals.css` + `home.css` (18), `globals.css` + `responsive.css` (11, esperado), `combat-mode-transition.css` + `vtt.css` (5).
- Nenhum arquivo CSS está sem importador hoje.

### 4.4 Os 10 maiores arquivos de código (TS/TSX) em app, components, lib, hooks

| Linhas | Arquivo |
|---|---|
| 3.086 | `components/vtt/Battlefield.tsx` |
| 1.417 | `hooks/useRoomSync.ts` |
| 1.392 | `components/character/CharacterSheet.tsx` |
| 1.380 | `hooks/vtt/useBattlefieldPointer.ts` |
| 1.212 | `lib/combat/attack.ts` |
| 1.189 | `components/character/wizard/CharacterCreationWizard.tsx` |
| 1.118 | `lib/combat/ability.ts` |
| 1.015 | `components/vtt/CombatFxLayer.tsx` |
| 996 | `components/vtt/TokenActionRing.tsx` |
| 932 | `lib/character/um-anel/adversaries.ts` (dados) |

Em seguida: `lib/character/starter-kits.ts` 928 (dados), `components/vtt/TokenActionPanel.tsx` 867 (órfão, L-013), `components/vtt/TurnOrderPanel.tsx` 803, `components/character/wizard/TorCharacterCreationWizard.tsx` 803, `components/vtt/MesaWorkspace.tsx` 774. A auditoria de 08/08 já recomendou não quebrar `Battlefield.tsx` enquanto não houver teste de comportamento.

## Apêndice A - Exports sem nenhum uso (pista, não lista de deleção)

Critério: o nome aparece uma única vez no próprio arquivo (a declaração) e em nenhum outro arquivo de código versionado. Exports de arquivos já listados como órfãos em 2.1 ficaram de fora.

### L-028 - fora de área sensível (45)

- `components/character/SheetPopupIcons.tsx`: IconGear (linha 258)
- `lib/adventure/store.ts`: updateAdventureMeta (linha 507)
- `lib/backgrounds.ts`: getDailyBackgroundIndex (linha 35), getDailyBackgroundId (linha 40)
- `lib/bestiary/monster-identity.ts`: parseMonsterTypeKey (linha 10), tokensMatchingTypeKey (linha 19)
- `lib/character/armor-defense.ts`: ArmorLoadout (linha 6, tipo)
- `lib/character/character-registry.ts`: listCharactersFromRegistry (linha 68)
- `lib/character/class-scales.ts`: formatClassCulinaryScale (linha 145)
- `lib/character/feats.ts`: listAllFeats (linha 39)
- `lib/character/future-levels.ts`: isTalentLevel (linha 121)
- `lib/character/legacy-names.ts`: migrateSpellName (linha 72)
- `lib/character/level-up.ts`: levelUpPreview (linha 227)
- `lib/character/loot-storage.ts`: lootStackTotal (linha 35)
- `lib/character/ownership.ts`: isCharacterOwner (linha 16)
- `lib/character/pa-modifiers.ts`: PA_MODIFIERS_VERSION (linha 122)
- `lib/character/pantheon.ts`: ReligionId (linha 306, tipo)
- `lib/character/point-buy.ts`: suggestedPointBuyForClass (linha 138), isUnsetPointBuy (linha 152), isCompletePointBuy (linha 156)
- `lib/character/portrait-persist-client.ts`: clearPortraitOnTorCharacter (linha 99)
- `lib/character/rebuild-from-wizard.ts`: validateLastLevelReedit (linha 142)
- `lib/character/religion-tooltips.ts`: religionSheetSummary (linha 39)
- `lib/character/rules.ts`: SURVIVAL_LABELS (linha 496)
- `lib/character/spell-prep.ts`: isEstribilhoSpell (linha 38)
- `lib/character/starter-kits.ts`: previewStarterDefesa (linha 846), describeStarterKit (linha 890)
- `lib/character/subclass-tracks.ts`: SUBCLASS_TRACKS (linha 47), getTrackForClass (linha 66), describeTrackProgress (linha 159), subclassMatchesClass (linha 184)
- `lib/character/um-anel/compendium.ts`: torPackLabel (linha 50)
- `lib/character/um-anel/landmarks.ts`: TOR_LANDMARK_BY_ID (linha 89)
- `lib/character/um-anel/notable-npcs.ts`: TOR_NOTABLE_NPC_BY_ID (linha 49)
- `lib/character/um-anel/patrons.ts`: TOR_PATRON_BY_ID (linha 106)
- `lib/character/um-anel/pregens.ts`: TOR_PREGEN_CHARACTER_BY_ID (linha 323)
- `lib/character/um-anel/registry.ts`: removeTorCharacterFromRegistry (linha 79)
- `lib/character/um-anel/undertakings.ts`: TOR_UNDERTAKING_BY_ID (linha 77)
- `lib/character/wizard-types.ts`: ANTECEDENTE_OPTIONS (linha 9)
- `lib/culinary/specimen.ts`: monsterThreatLevel (linha 45)
- `lib/media/image-data-url.ts`: fileToDataUrl (linha 20)
- `lib/media/portrait-focus.ts`: resolveCoverFocus (linha 46)
- `lib/notifications/store.ts`: countNotificationsQuick (linha 185)
- `lib/world/lore.ts`: getWorldPlace (linha 412), placesByRegion (linha 416)

### L-029 - área sensível: combate, PA, sala, auth, banco, VTT (100)

- `hooks/vtt/useMesaRoomSlice.ts`: useMesaRoomStore (linha 13), useMesaMapSlice (linha 26), useMesaCombat (linha 44), useMesaSnapshotFull (linha 81)
- `lib/auth/account-user.ts`: characterOwnedByAccount (linha 65)
- `lib/auth/combat-turn-access.ts`: canViewTokenHp (linha 32)
- `lib/auth/invite-access.ts`: adventureInviteForRoom (linha 8), inviteValidForRoom (linha 14)
- `lib/auth/oauth/providers.ts`: oauthProviderLabel (linha 139)
- `lib/auth/room-access.ts`: canViewMonsterCompendium (linha 293), hasValidInviteForRoom (linha 363)
- `lib/auth/user-store.ts`: authenticateUser (linha 152)
- `lib/combat/ability.ts`: listCombatAbilities (linha 143), isEnemyToken (linha 173), flankingAttackBonus (linha 255)
- `lib/combat/action-preview.ts`: previewMove (linha 103)
- `lib/combat/attack.ts`: ResolvedWeapon (linha 73, tipo), resolveWeaponForActor (linha 473), getAttackableTargets (linha 1201)
- `lib/combat/buff-durations.ts`: BOOK_CONDITION_SUGGESTED_DURATIONS (linha 89), formatDurationSpec (linha 106)
- `lib/combat/chat-display.ts`: combatChatAuthorRoleLabel (linha 112), combatChatRollFormula (linha 120)
- `lib/combat/combat-pa-engine.ts`: pushTurnStartNotice (linha 439), refreshActiveTokenAtTurnStart (linha 446)
- `lib/combat/consumable-effects.ts`: CONSUMABLE_CATALOG_IDS (linha 168)
- `lib/combat/estribilho.ts`: isCantripSpell (linha 12)
- `lib/combat/exploration-pa.ts`: explorationPaForToken (linha 24)
- `lib/combat/mesa-mode.ts`: isCombatModeActive (linha 11)
- `lib/combat/pa-balance.ts`: PA_POWER_SPELL_COST (linha 11), SpellPaTier (linha 13, tipo), formatActionPaLabel (linha 49)
- `lib/combat/pa-turn.ts`: PA_SPEND_CAP_PER_TURN (linha 21), paPoolCap (linha 32), formatTurnStartPaNotice (linha 124), applyReactionPaDebt (linha 316)
- `lib/combat/spell-channel.ts`: CHANNEL_SPELL_ENTRY_IDS (linha 12), parseChannelExtraPa (linha 41)
- `lib/combat/turn-guard.ts`: gmBypassAppliesToToken (linha 14)
- `lib/combat/um-anel/progression.ts`: formatTorSpiritualRecoveryMessage (linha 383)
- `lib/combat/um-anel/round-effects.ts`: isTorRoundEffectKind (linha 78)
- `lib/db/characters.ts`: listCharactersByOwner (linha 30)
- `lib/db/normalize-url.ts`: isNeonDirectHost (linha 24), isServerlessRuntime (linha 33)
- `lib/db/um-anel-characters.ts`: deleteTorCharacter (linha 60)
- `lib/room/adventure-actors.ts`: syncCampaignActorsForRoom (linha 249)
- `lib/room/combat-chat-events.ts`: addDefeatChatMessage (linha 41)
- `lib/room/combat-undo.ts`: latestUndoForToken (linha 76)
- `lib/room/handlers/combat-consume.ts`: consumablesForActor (linha 146)
- `lib/room/handlers/tor-eye.ts`: torEyeSourceLabel (linha 156)
- `lib/room/internal/periodic-save.ts`: flushPendingSaves (linha 49)
- `lib/room/revision-cache.ts`: invalidateRevisionCache (linha 16)
- `lib/room/revision-journal.ts`: getDeltaAtRevision (linha 85), getCanonicalDeltasSince (linha 91), hasSnapshotAtRevision (linha 108), clearRevisionJournal (linha 120)
- `lib/room/room-delta.ts`: isChatOnlyDelta (linha 33)
- `lib/room/sync-response.ts`: RoomSyncMode (linha 9, tipo)
- `lib/vtt/combat-dice-model.ts`: COMBAT_ATTACK_MIN_SPIN_MS (linha 101), COMBAT_ATTACK_MIN_SPIN_MS_REDUCED (linha 102), previewTierVisual (linha 191), buildPreviewSequence (linha 370)
- `lib/vtt/combat-fx-timings.ts`: COMBAT_ATTACK_ROLL_MS (linha 14), COMBAT_ATTACK_ROLL_MS_REDUCED (linha 15), COMBAT_DAMAGE_ROLL_MS (linha 18), COMBAT_DAMAGE_ROLL_MS_REDUCED (linha 19)
- `lib/vtt/combat-mode-pending.ts`: isCombatModeTogglePending (linha 27)
- `lib/vtt/creature-size.ts`: inferMonsterCreatureSize (linha 127)
- `lib/vtt/dice-combat-box.ts`: DICE_COMBAT_EVICT_MS (linha 58), getDiceBoxBaseOptions (linha 109), verifyDiceBoxAssets (linha 161)
- `lib/vtt/draw-token-animations.ts`: drawTargetCombatPreviewLabel (linha 91)
- `lib/vtt/floor-edit.ts`: floorResizeCursor (linha 33)
- `lib/vtt/grid-layout.ts`: resolveMapFloorAnchor (linha 21), applyMapFloorTransform (linha 34), worldToMapFloorLocal (linha 43), mapFloorLocalToWorld (linha 55)
- `lib/vtt/grid-math.ts`: axialRound (linha 19)
- `lib/vtt/map-toolbar.ts`: MapDrawTool (linha 14, tipo), isDrawMapMode (linha 16)
- `lib/vtt/mesa-guided-tour.ts`: resetMesaTour (linha 127)
- `lib/vtt/monsters.ts`: MONSTER_REGISTRY (linha 118)
- `lib/vtt/movement-path.ts`: resolveMovementAnchor (linha 118), movementPathDistance (linha 173)
- `lib/vtt/movement.ts`: BASE_MOVEMENT_METERS (linha 37)
- `lib/vtt/ranged-weapon-range.ts`: DND_RANGE_SCALE (linha 73), DND_RANGED (linha 74), dndNormalRangeMeters (linha 75), dndLongRangeMeters (linha 76), dndRangeLabelMeters (linha 79)
- `lib/vtt/spawn-placement.ts`: resolveTokenSpawnPlacement (linha 36)
- `lib/vtt/status-display.ts`: formatStatusHoverLabel (linha 11)
- `lib/vtt/token-cast-fx.ts`: pruneActiveCastFx (linha 305)
- `lib/vtt/token-colors.ts`: tokenPortraitInset (linha 36), monsterTierLabel (linha 90)
- `lib/vtt/token-effect-icons.ts`: CHIP_ICON_BY_ID (linha 61)
- `lib/vtt/token-effects.ts`: hasTokenEffects (linha 468)
- `lib/vtt/token-hp-display.ts`: drawTokenHpLabel (linha 239), drawTokenWalkRemainingBadge (linha 268)
- `lib/vtt/token-occupancy.ts`: tokenFootprint (linha 17)
