# 01 - O que ja foi feito (Eldarin VTT / MXDRPG)

Levantamento de leitura, feito em 2026-11-20. Fontes: `docs/HISTORICO.md` (6.699 linhas, lidas por inteiro), `git log` (527 commits, de 2026-06-03 a 2026-08-13), `PRODUTO.md`, `docs/P9-READY.md`, `docs/BETA-P9-CHECKLIST.md`, `docs/PARIDADE-FOUNDRY.md`, `docs/AUDITORIA-ELDARIN-2026-08.md`.

## Como ler este arquivo

- "Pronto" quer dizer pronto no codigo e commitado. Quase nenhuma entrega de julho e agosto registra teste em navegador, em dispositivo ou em mesa real; o proprio diario diz "toda a validacao e estatica" (HISTORICO L663).
- "HIST Lnnn" e a linha do `docs/HISTORICO.md` onde a entrada comeca.
- O diario so comeca em 2026-06-18. Os 280 commits de 03 a 15 de junho so tem o git como fonte.
- Um `filter-branch` em 26/06 reescreveu os hashes (HIST L5018). Os hashes que o diario cita entre 18 e 24 de junho nao existem mais; os hashes abaixo sao os do git atual.

## Numeros principais

| Item | Valor |
|---|---|
| Commits | 527 (junho 416, julho 43, agosto 68) |
| Periodo com commits | 2026-06-03 a 2026-08-13. Nenhum commit depois disso |
| Entradas no diario | 178, de 2026-06-18 a 2026-08-08 |
| Branch atual | `fix/login-google-e-responsivo-um-anel`, 68 commits a frente de `main` |
| `main` (e `origin/main`) | parado em `be69f6f`, de 2026-07-31 |
| Scripts `verify-*.mjs` | 51 arquivos; o diario declara 3.087 assercoes no `npm test` (nao rodei) |
| Migrations de banco | 19 (ultima: `019_um_anel_characters.sql`) |
| Um Anel | 13/13 capitulos em PT-BR, 7/7 aventuras de Wilderland, 7/30 anos de Mirkwood, 7 packs e 148 entradas de compendio |
| Tags | `v1.0.0-mestre` a `v1.2.0-mestre` (executavel do mestre, ultima em 2026-07-01) |

Ponto de atencao: todo o trabalho de agosto (68 commits: login do Google, responsivo, quase todo o Um Anel de regras, privacidade, correcoes do Eldarin) esta na branch `fix/login-google-e-responsivo-um-anel`, enviada ao GitHub mas nao incorporada a `main`. O diario nao registra merge nem deploy dessa branch.

## 1. O que foi feito por area

| Area | Entrega | Quando | Evidencia | Estado |
|---|---|---|---|---|
| Autenticacao e contas | Cadastro de usuario e dono de mesa por sala (estilo Roll20) | 06-03 | ec8625b | pronto |
| Autenticacao e contas | Cadastro funcional com criacao de mesa e convite de 10 caracteres | 06-06 | 6eef676 | pronto |
| Autenticacao e contas | Login social via Clerk | 06-08 | 4c5f41f, e3d7a84 | revertido (Clerk removido em 06-19) |
| Autenticacao e contas | OAuth manual Google/Discord, login real, recuperar senha | 06-17 a 06-19 | 82f61a1, 9c60c99, 077ebc4; HIST L5716 | pronto |
| Autenticacao e contas | Remocao total do Clerk; OAuth so manual | 06-19 | 1f7f0c1; HIST L5949 | pronto |
| Autenticacao e contas | Onboarding de perfil (apelido + avatar) em `/conta/bem-vindo` e correcao de "Conta nao encontrada" | 06-19 | 8bba957, 8be8dcf; HIST L5869, L5901 | pronto |
| Autenticacao e contas | Avatar da navbar lido sempre do banco | 06-20 | 01a225c, 575ec97 | pronto |
| Autenticacao e contas | Cookie de sessao assinado (HMAC) e apelido generico em toda conta nova | 07-31 | be69f6f; HIST L6683 | pronto (backfill nao testado ao vivo) |
| Autenticacao e contas | Sessao do Google que caia: parou de revalidar no banco a cada requisicao | 08-04 | e705994; HIST L4209 | pronto no codigo; efeito em producao nao confirmado |
| Painel e aventuras | Aventuras, hub de mesas com capas por RPG, cartoes com capa e jogadores | 06-04 a 06-13 | daf159f, 6066fc0, 9e33763, 3c136f1 | pronto |
| Painel e aventuras | Amigos por apelido, pedidos de amizade, convites in-app, messenger, notificacoes, presenca online | 06-08 a 06-10 | 20b2c28, bf2591e, 26602de, 1b65ab9 | pronto |
| Painel e aventuras | Admin de mesas e mesas fechadas | 06-09, 06-10 | ea187e0, 26602de | pronto |
| Painel e aventuras | Site renomeado para MXDRPG; Eldarin vira um RPG dentro do hub (`/rpg/eldarin`, hub em `/mesas`) | 06-13, 06-19 | 3da2c46, fd3761d; HIST L5764 | pronto |
| Painel e aventuras | Landing reescrita e pagina `/download` | 06-27, 06-28 | f41393f, 564ddf3; HIST L4918 | pronto |
| Painel e aventuras | Hub multi-sistema: seletor de RPG em `/mesas`, `rpg_system` na sala (migration 018) | 07-22, 07-23 | 9b5d981, 1b507c7; HIST L4492 | pronto |
| Painel e aventuras | Mesa demo removida por inteiro (cerca de 50 arquivos, bypasses de auth) | 07-24 | 95c4cc2; HIST L6233 | pronto; deixou 6 smoke scripts quebrados |
| Painel e aventuras | `/personagem` caia em 404 depois do login | 08-08 | 4804a7f; HIST L330 | pronto |
| Ficha e wizard | Wizard de criacao com tooltips de raca, linhagem, classe e antecedente; retrato com zoom e foco | 06-04, 06-05 | daf159f, 8331dc4, 3b3b5e3 | pronto |
| Ficha e wizard | Kits iniciais por classe e equipamento na ficha | 06-06 | db2013d | pronto |
| Ficha e wizard | Classes: Paladino e Bruxo; Feiticeiro e Espiritualista no lugar de Artifice e Forjado | 06-07, 06-14 | 242fdeb, 737ae21 | pronto |
| Ficha e wizard | Exportar ficha em PDF, com hyperlinks | 06-08, 06-09 | 07088c6, a22f540, ae605a8 | pronto |
| Ficha e wizard | Ficha estilo DDB (popup e pagina `/personagem/[id]`), edicao completa fora da mesa | 06-09 a 06-11 | 4f7a3ba, 86cde28, 87682f3, c153b3f | pronto |
| Ficha e wizard | Pedido de edicao de ficha com aprovacao do mestre; bestiario pessoal do jogador | 06-08, 06-09 | 5006b34, 7b584e9 | pronto |
| Ficha e wizard | Level-up na mesa, XP compacto no header e botao pulsante | 06-11, 06-20 | 202ce06, b1b5d08; HIST L6104 | pronto |
| Ficha e wizard | Talentos universais, Chi HUD, AbilityPicker, subclasses do Espiritualista, pericias de antecedente rolaveis | 07-09, 07-10 | 60893e0; HIST L4809, L4861, L4888 | pronto |
| Ficha e wizard | Regressao que apagava `featIds` ao salvar a ficha | 07-14 | 14eefee; HIST L4788 | pronto (validado so com `tsc`) |
| Ficha e wizard | Criar personagem na mesa nao aparecia sem recarregar | 08-13 | 152d6d3; HIST L107 | pronto |
| Mesa/VTT | VTT base: mesa, ping, nevoa (fog), mapa, persistencia | 06-04 | 2946875 | pronto (a nevoa nao volta a ser citada no diario; estado atual nao confirmado) |
| Mesa/VTT | Shell estilo Foundry, action ring animado, paineis separados, roster arrastavel, tamanhos de criatura | 06-05 | 0b77ec7, 1956ad6, 11e82cf | pronto |
| Mesa/VTT | Editor de masmorras, lousa do mapa, upload de piso | 06-05, 06-06 | c357747, 3acf80f, 8759b10 | pronto |
| Mesa/VTT | Ordem de turno, HUD de combate, mini-HUD no hover, painel de Status e condicoes com duracao | 06-05 a 06-07 | a674daf, 3ff476f, e2282bb | pronto |
| Mesa/VTT | Grid hexagonal trocado por grid quadrado; movimento em pes/metros (6 m e 12 m) | 06-12, 06-18 | cb89617, 215fd43, 3e2dd37; HIST L5552 | pronto |
| Mesa/VTT | Zoom unico de mapa e grid; moldura de token em um anel | 06-14 | 65975da, d3084af | pronto |
| Mesa/VTT | Menu do mestre, salvaguardas, tour guiado, PWA | 06-11 | 202ce06, 557c1d4 | pronto (o tour da demo saiu com a demo em 07-24) |
| Mesa/VTT | Sync em tempo real: SSE, delta incremental, store particionada | 06-17 a 06-21 | 9c60c99, c98c033, 348f148; HIST L6126 | pronto |
| Mesa/VTT | SSE por EventEmitter no lugar de polling | 06-25 | 91caf4e; HIST L6160 | pronto |
| Mesa/VTT | Levas de performance (lazy-load, N+1, sync durante FX, memo da ficha) | 06-21 a 07-20 | 4acf11d, b42680b, 28c5b1a, c820eee, c9a1414, a98e0c7; HIST L4636 a L4746 | pronto |
| Mesa/VTT | Timeout de 10 s nas 27 mutacoes de sala | 07-21 | 97b6457; HIST L4546 | pronto (sem teste real) |
| Mesa/VTT | Arrastar personagem/monstro para o mapa voltou a funcionar; zona morta do grid corrigida | 07-22, 07-29 | 7ed35a5, 994364b; HIST L4523, L6644 | pronto |
| Mesa/VTT | Compendio religado dentro da mesa (Eldarin e Um Anel) | 07-25 | 1bf494f; HIST L6357 | pronto |
| Combate e PA | Revisao completa de PA para PCs, monstros e mestre; XP automatico ao derrotar monstros | 06-05 | 807cf1c, 4a48310 | pronto |
| Combate e PA | Magias multi-alvo, magias de area com preview no mapa, FX de area | 06-06 a 06-12 | 5089036, e2282bb, a830804, cb89617 | pronto |
| Combate e PA | Bloqueio estrito de turno por iniciativa | 06-08 | 430ca05, a9bda26 | pronto |
| Combate e PA | PA alinhado ao livro, descontos 1x por turno, economia unificada | 06-09, 06-11 | 995014a, a7ecbac | pronto |
| Combate e PA | Motor unico de PA por fase; seletor Aventura/Combate; historico de combate; PA visivel ao mestre | 06-14, 06-15 | 3dd29c6, d2c279d, 3572407 | pronto, depois de cerca de 15 correcoes de PA em dois dias |
| Combate e PA | Regras de PA por tipo de criatura (jogador 5, monstro 6, boss 8) | 06-18 | 3e2dd37; HIST L5477 a L5649 | pronto |
| Combate e PA | Ataques com HTTP 500/400/403 corrigidos | 06-16 a 06-22 | f7a1c94, a4dd6ae, 1ac82b6, e9194bd, 11cbe18 | pronto |
| Combate e PA | Combate preso (FX pendente) corrigido | 06-27 | 7ab9504; HIST L4972 | pronto |
| Combate e PA | Toast com o motivo real das falhas de acao; cortes nos tempos de FX | 07-20, 07-21 | 6e4f61e, fa68b16; HIST L4567, L4588 | pronto |
| Combate e PA | PRD do refactor de combate (R1 a R30, epicos E1 a E4) | 06-18 | HIST L5509; `docs/PRD-COMBATE-MESA-REFACTOR.md` | parcial (plano aprovado; conclusao dos epicos nao registrada) |
| Dados 3D e rolagens | Cartoes de combate no chat com miniatura, rolagem e dano | 06-11 | a116417 | pronto |
| Dados 3D e rolagens | D20 em CSS, depois estilo BG3, depois Three.js proprio | 06-20 | 011fb9c, 7cec9b0, c76f66f; HIST L5249 a L5301 | revertido na pratica (substituido pelo dice-box) |
| Dados 3D e rolagens | `@3d-dice/dice-box` na mesa, cores por tier, modelo unico preview/mesa | 06-20, 06-21 | ec91327, a9d7cc6, 57a2a8e, cd28a80; HIST L6015 | pronto |
| Dados 3D e rolagens | Resultado so aparece depois do dado pousar; painel total contra CA/CD | 06-21 | bdf523f, 3c60200, 07f7ff2 | pronto |
| Dados 3D e rolagens | Transicao combate/aventura (nevoa vermelha com brasas, nevoa azul) | 06-14, 06-20 | 9b321eb, c8b11c3; HIST L5147 | pronto |
| Dados 3D e rolagens | Dados por sistema: sala do Um Anel so oferece d12 e d6; Olho de Sauron e tengwa nas faces | 08-06 | 8e70ab4, d4b95af; HIST L3382, L3423 | parcial (runa de Gandalf segue numerica) |
| Compendio e pipeline de dados | Script de compendio e pipeline livros -> JSON (`sync:data`) com checagem no CI | 06-03 a 06-21 | bcecc25, c810f26, cccda62 | pronto |
| Compendio e pipeline de dados | Compendio VTT, panteao, atlas do mundo, guia didatico em Sistema | 06-06 a 06-09 | 752fc5b, 242fdeb, 2b79310 | pronto |
| Compendio e pipeline de dados | Balanceamento de PA no compendio, sincronizado com livros e PDFs | 06-12 | d01be73 | pronto |
| Compendio e pipeline de dados | Compendio Chi e `talentos.json` (20 talentos); CI data-sync corrigido | 07-09, 07-20 | 60893e0, b7e2c15; HIST L4614, L4888 | pronto |
| Compendio e pipeline de dados | Compendio: busca por codigo, ordem alfabetica, detalhe que nao some, abas por sistema | 08-08 | 8600304; HIST L214 | pronto |
| Inventario, loot, culinaria | Aprovacao do mestre para itens no inventario, notificacoes, UX de pedido recusado | 06-11 | 1e3dffc, dc83119 | pronto |
| Inventario, loot, culinaria | Consumiveis: compendio, uso em combate, efeitos reais das pocoes | 06-11 | 7ee3fb1, a20b19c, 4234278, 50b9518 | pronto |
| Inventario, loot, culinaria | Culinaria estruturada | 06-11 | 8d6d011; `docs/CULINARIA-VTT.md` | parcial (auditoria de agosto: assimilacoes sao texto puro e nunca expiram, alvos 8 e 20) |
| Inventario, loot, culinaria | Loot (economia ESP/MIN/TES) | 06-07 | 663edfc; PARIDADE-FOUNDRY marca pronto | pronto (pouco detalhe no diario) |
| Um Anel | Fase 1: sistema "um-anel" no hub, capa, extracao dos livros | 07-22 a 07-24 | 9b5d981, f162ac2; HIST L4459, L4492 | pronto |
| Um Anel | Fase 2: ficha, wizard (10 passos com equipamento e retrato), tabela propria no banco | 07-24 a 07-26 | 95c4cc2, c8b0ed2, 0476fd9; HIST L6204 | pronto |
| Um Anel | Mesa narrada: motor de dados (Proeza + Sucesso), ficha interativa, redesign pergaminho | 07-24 | 95c4cc2, bff80d3; HIST L6258, L6295 | pronto |
| Um Anel | Fase 4: combate tatico v1, tokens no mapa, bestiario de 21 e painel Invocar, arrastar para o mapa | 07-25, 07-26 | 5e115b4, dc23713, daafb91, 3d5db29; HIST L6311 | pronto |
| Um Anel | Conteudo: tesouro magico, virtudes culturais, empreitadas, patronos, 7a Cultura, marcos, 8 pre-gerados | 07-25 | dc23713, 6281215, ead9834, dfbf4f8, a339eac | pronto (pre-gerados so como referencia, nao jogaveis) |
| Um Anel | PA do Eldarin parou de vazar para a mesa do Um Anel (HUD, guia, Invocar) | 07-25, 07-26 | 6aa6a44, 768f03f, fb68b08, a428ee3 | pronto |
| Um Anel | Pipeline de compendio proprio + motores de Posturas, Sombra, Jornada, Conselho e Progressao, com paineis e persistencia | 08-04 | 90b8bb1, c9801b2, 36fad8b, 466fef4, 590dbe8; HIST L4301 | pronto |
| Um Anel | Fase B: 13/13 capitulos traduzidos para PT-BR | 08-04 | f1d6033 a ce0436a; HIST L3709 | pronto |
| Um Anel | Auditorias de regra: capitulos 3, 4, 6 e 8 (23 correcoes) e bestiario campo a campo (37 divergencias) | 08-04, 08-05 | 55420b5, 281bc5b, 2157d14; HIST L3484 a L3646 | pronto |
| Um Anel | Export PDF da ficha; bugs de Exausto e Arrasado | 08-04 | 57e3ec4, a44a3a0, 6603894; HIST L4124, L4161 | pronto |
| Um Anel | Aventuras do Starter Set (5) e 3 adversarios | 08-06 | 8e70ab4; HIST L3423 | pronto |
| Um Anel | Combate completo na mesa: Posturas, Odio/Resolucao, Dano Especial (6 tipos), Tarefas de Combate, Empurrao, NA 18, Elmo, limites de engajamento | 08-08 | c4daeb8, 532298b, df21891, 21727f9, a112938, e256921, c39c32f, ff35285 | pronto |
| Um Anel | Sombra, Acesso de Loucura, descansos, Fadiga, Fontes de Dano, Olho de Mordor | 08-08 | 315c169, 0af00c4, 31525ed, 1166655, 8797e04, 637376c, 2894620 | pronto (varias partes com entrada manual do Mestre) |
| Um Anel | Esperanca por (1d), Apoio, Virtudes nas rolagens, Malfeitoria, progressao na Fase de Companhia, papeis da Jornada | 08-08 | 5ab1553, 5651169, 14c797c, 5ef9dc0, 1a13530, 95c3147 | pronto |
| Um Anel | Tabela de conversao da 1a edicao (37 entradas) e campanha Wilderland 7/7 | 08-08 | b24b8c3, 6cb3f88 a 3b3be0a; HIST L1012 a L1506 | pronto |
| Um Anel | Darkening of Mirkwood: plano, pack de Propriedades, bloco 1 e inicio do bloco 2 | 08-08 | 012356b, 1bedcf8, 67c0cca; HIST L555 a L890 | parcial (7 de 30 anos) |
| Design/UX | Design Eldarin v4 em fichas, site e mapa; design system v5 de cores | 06-06 a 06-09 | 94daf1c, ca526b3, 3864b56, 3ea8043 | pronto |
| Design/UX | Identidade MXDRPG: logos, favicon, navbar com icones, paleta sem azul | 06-09 | bca8bc5, 406c058, 4910393 | pronto |
| Design/UX | Fundos animados em todo o site, tema escuro unico | 06-13 | 092f22f, b574ee0, 7e9cab1 | pronto |
| Design/UX | Molduras e retratos (5 commits de UI/ficha) | 06-07 | 1301702 a 97146ce | revertido no mesmo dia (b1b87b3 a 200d43c) |
| Design/UX | Redesign fase 1 (tokens Verdigris), depois Amethyst Dusk | 06-20, 06-25 | HIST L5397; 4934b09 | Verdigris substituido; Amethyst pronto |
| Design/UX | Correcoes criticas da auditoria UX externa e auditoria de design (17 achados: contraste, foco, mobile) | 06-20, 06-24 | c8314b3, df2df10; HIST L5061, L5331 | pronto |
| Design/UX | Redesign visual da landing (hero em duas colunas) | 06-24 | 97416db; HIST L5103 | revertido (9243d33) |
| Design/UX | Refatoracao responsiva: PC, tablet e celular, escala unica de breakpoints, pinca e pan no mapa | 08-04 | 8d971dc; HIST L4404 | pronto no codigo; teste em dispositivo nao registrado |
| Design/UX | Texto de mantenedor removido da interface publica | 08-08 | 8600304; HIST L214 | pronto |
| Infra, deploy, banco | Deploy na Vercel (cerca de 15 commits de ajuste) | 06-03 | 56b57b2 a 2d6c104 | substituido pelo deploy em Docker/Contabo |
| Infra, deploy, banco | Build Docker, GHCR e deploy na Contabo | 06-04, 06-17 | 557df09, 82f61a1; `DEPLOY.md` | pronto |
| Infra, deploy, banco | Banco: Postgres opcional no comeco, depois MariaDB exclusivo, com SSL da Contabo | 06-08 a 06-19 | 70825b7, 1cb4420, 54a4775; HIST L5748 | pronto |
| Infra, deploy, banco | APIs e SSR toleram banco fora do ar (safe-query, fallback de login) | 06-18, 06-19 | 0cf39aa, d95046c, 466e993; HIST L5697, L5733 | pronto |
| Infra, deploy, banco | Ambiente de homologacao local com MariaDB e mesa `mesa-local` | 06-22 | b938a99; HIST L5117 | pronto (seed depende de usuario demo que nao existe mais) |
| Infra, deploy, banco | Hospedagem pelo mestre: Docker + ngrok, executavel Go, imagem pre-compilada, pagina de download | 06-27 a 07-01 | bd3d70f, 5e941a1, 6dd01d3, e87cd1b; HIST L4946, L4972 | pronto |
| Infra, deploy, banco | CI: workflows `ci.yml`, `build-image.yml`, `release-mestre.yml` | 06-07 a 06-28 | a971987, 3dfcc63 | pronto |
| Privacidade/LGPD | Politica de privacidade real e `docs/PRIVACIDADE-LGPD.md` | 06-20 | c8314b3; HIST L5331 | parcial ate agosto (em producao aparecia um texto interno) |
| Privacidade/LGPD | Apelido no lugar do nome real em chat, logs, perfil publico, amigos e membros | 07-29 | b9501c8, 050016d; HIST L6630, L6660 | pronto |
| Privacidade/LGPD | Nome real removido dos fallbacks; apelido sempre gerado | 07-31 | be69f6f; HIST L6683 | pronto |
| Privacidade/LGPD | Politica de privacidade passa a ir ao ar de verdade; nome real corrigido em 4 handlers do Mestre | 08-08 | b238e22; HIST L436 | pronto na branch (nao esta em `main`) |
| Testes e scripts | Verificadores de PA, movimento, grid, PDF, consumiveis, culinaria e pedidos de inventario | 06-09 a 06-11 | ae605a8, 4234278, e4ed047 | pronto |
| Testes e scripts | Smokes: p0-health, a1-persistence, p9-inventario, level-up, combat-core | 06-11 | e4ed047, ba4c283 | parcial (6 smokes quebrados desde a remocao da demo, HIST L6251) |
| Testes e scripts | 30 verificadores do Um Anel no `npm test`, de 416 para 3.007 assercoes | 08-04 a 08-08 | package.json; HIST L649, L4028 | pronto (numero nao conferido por execucao) |
| Testes e scripts | Guardas do Eldarin: paginas legais, apelido, rotas, texto de dev, compendio, refresh do wizard | 08-08, 08-13 | b238e22, 4804a7f, 8600304, 152d6d3 | pronto |
| Testes e scripts | Auditorias multi-agente: hub (07-31, 28 achados) e Eldarin (08-08, 64 achados, 22 alvos) | 07-31, 08-08 | HIST L6683, L436; 1a30f0c | pronto como diagnostico; maior parte dos achados em aberto |

## 2. Linha do tempo

| Periodo | Foco principal | Commits |
|---|---|---|
| 03 a 04 de junho | Commit inicial, cadastro, deploy na Vercel, VTT base (mesa, ping, nevoa, mapa), build Docker | 31 |
| 05 a 07 de junho | Shell Foundry, action ring, editor de masmorras, HUD de combate, design Eldarin v4, Paladino e Bruxo | 66 |
| 08 a 11 de junho | Clerk, PDF da ficha, amigos e messenger, identidade MXDRPG, ficha DDB, inventario, consumiveis, tour | 122 |
| 12 a 15 de junho | Grid quadrado, movimento em pes, rename para MXDRPG, fundos animados, Espiritualista, motor unico de PA | 61 |
| 16 a 19 de junho | OAuth manual, MariaDB exclusivo, deploy Contabo, remocao do Clerk, hub MXDRPG, onboarding | 30 |
| 20 a 22 de junho | Dados 3D (CSS, Three.js, dice-box), ritmo de combate, sync por delta, particao da mesa, homolog local | 72 |
| 23 a 28 de junho | Auditoria de design, landing (redesign revertido), performance, EventEmitter SSE, hospedagem pelo mestre | 34 |
| 01 a 15 de julho | Imagem pre-compilada do mestre; talentos universais e Chi | 2 |
| 16 a 31 de julho | Performance da mesa, hub multi-sistema, Um Anel fases 1, 2 e 4, privacidade do nome real, cookie assinado | 41 |
| 01 a 13 de agosto | Login do Google, responsivo, Um Anel (traducao, auditorias, regras na mesa, campanhas), auditoria e correcoes do Eldarin | 68 |
| Depois de 13 de agosto | Sem commits | 0 |

Totais por quinzena: junho 1a 280, junho 2a 136, julho 1a 2, julho 2a 41, agosto 1a 68.

## 3. Parcial ou em aberto segundo o proprio diario

### Bugs conhecidos e nao corrigidos

- Monstro acerta o jogador e a vida nao muda. Diagnosticado em 28/06 (HIST L6170 a L6188) e de novo em agosto (HIST L164 a L182; AUDITORIA "B1"). Hipotese: o handler de ataque nao persiste a ficha e o sync ficha -> sala sobrescreve a vida. Nao corrigido.
- Imagem de token nao salva nos tres fluxos (HIST L144 a L162; AUDITORIA "B2"). Mecanismo localizado em `portrait-sync.ts` e `sync.ts`. Nao corrigido; depende de decisao do dono sobre a prioridade retrato/token.

### Dependem de decisao do dono

- Backlog da auditoria de 2026-08-08: 22 alvos, 54 achados abertos. Feitos os alvos 1, 2, 5, 6 e 7. Abertos, entre outros: Termos de Uso inexistente (3), bestiario de 451 KB indo para o navegador de todo jogador (4), assimilacoes culinarias que nunca expiram e sem efeito em combate (8 e 20), `bankedPa` fantasma (9), limite de fichas com tres fontes da verdade (10), mesa nova nasce vazia (11), resistencias do bestiario (14), debito de PA por reacao (15), Fome e Estudo de Anatomia sem runtime (16), ficha fora do design system (21). Fonte: `docs/AUDITORIA-ELDARIN-2026-08.md`; HIST L443.
- Remover a paleta azul legada e os componentes de PDF v2: confirmar antes se o PDF v2 esta planejado (AUDITORIA, "O que eu NAO recomendo fazer agora").
- Indice de banco para a busca em `member_ids` (hoje varredura completa): exige decisao de schema (HIST L4679, L4715).
- Auditoria do hub de 07-31: 28 achados, so 3 frentes corrigidas; o resto nao tem destino registrado (HIST L6685).

### Um Anel

- Darkening of Mirkwood: 7 de 30 anos. Faltam 2954 a 2960 do bloco 2 e os blocos 3, 4 e 5 inteiros. Loop encerrado a pedido do dono (HIST L573, L610, L649, L661).
- Lacunas de fonte registradas e nao estimadas: bloco do Lobisomem, os tres Nazgul, Troll da Colina, Sarqin e Tyulqin, Vigor de cerca de dez PNJs, habilidades so nomeadas ("Investida Selvagem", "Desnortear", "Encarnacao do Horror", "Sem Tregua") (HIST L591 a L601, L807 a L816, L1042, L1063, L1099).
- Glyph da runa de Gandalf na face 12 do dado: aparece como "Falta" em todas as rodadas, aguardando arte (HIST L3392, L2789).
- Regras deixadas manuais de proposito: custo do Empurrao, Teste de Sombra rolado pelo Mestre, Sombra por Malfeitoria, Perigo de Areas Perigosas, recuperacao de fim de jornada, escolha de Recompensa/Virtude (HIST L2726, L2661, L2192, L2404, L2407, L2594).
- NA 18 nao vale na ficha aberta fora de uma sala (HIST L2768).
- Virtudes opcionais e Habilidades Sinistras opcionais so como texto e contador (HIST L3316, L3120). Overbear/Sobrepujar nao mecanizado (HIST L3569).
- Os 8 pre-gerados nao sao fichas jogaveis (HIST L6425). `torFeatDie` vem do cliente e o servidor nao re-rola (HIST L6460).
- Regra de Empenho de Pericia nao traduzida; "Foco de Companhia" e Prestigio sem mecanica (HIST L2006, L1249, L953).

### Eldarin e mesa

- PRD de combate (R1 a R30, epicos E1 a E4) aprovado em 18/06, sem registro de conclusao. Lacunas listadas: reacoes (oportunidade, Escudo, Contramagica), entrada tardia na iniciativa, Surpresa (HIST L5513, L5656 a L5667).
- Cascata de 5 a 10 normalizacoes redundantes ao salvar ficha, deixada para "sessao dedicada" (HIST L4718, L4762).
- `ensureDbMigrations` chamado em 23 rotas, deveria virar migration de verdade (HIST L4679).
- Sub-menu morto do `TokenActionRing` identificado, sem remocao registrada (HIST L4593). `canBypassCombatTurn` e um stub que devolve sempre falso (HIST L3144).
- Renomear `--neon-*` e `--accent-gold` e mover variaveis da VTT: "exige refatoracao dedicada" (HIST L5083).
- Icones reais do compendio aguardam arte (AUDITORIA; ha 166 prompts prontos, HIST L4899).
- Mensagens antigas do chat continuam com o nome real gravado (HIST L6636).
- Executavel do mestre: depois de instalar o Docker o usuario precisa reabrir; no Linux so mostra a URL (HIST L4953).

### Testes, validacao e operacao

- "Nada foi testado em dispositivo real nem em mesa. Toda a validacao e estatica" (HIST L663). Dez entradas do Um Anel de julho pedem teste manual ao dono por falta de banco no ambiente (HIST L6468 a L6624).
- Responsivo: lista de teste em iPad e celular e manual, sem registro de execucao (HIST L4449).
- Login do Google: confirmar em producao que a sessao nao cai; `SESSION_SECRET` estavel depende do servidor (HIST L4277, L4296).
- 6 smoke scripts quebrados desde a remocao da demo; `combat-core` tambem falha por nao entender respostas delta (HIST L6251, L4763).
- `npm run lint` nao roda (ESLint nao configurado) (HIST L4428). `verify-inventory-requests` fica fora do portao por precisar de MySQL (HIST L519).
- Migration nao roda sozinha no deploy; `db:migrate` e manual (HIST L4500).
- Checklist pos-deploy com 2 a 3 jogadores (A1 a A7) listado, sem registro de execucao (HIST L6140).
- Eldarin com pouca rede de testes frente ao Um Anel (HIST L454, L298).

### O que os checklists marcam

- `docs/BETA-P9-CHECKLIST.md`: totalmente em branco. Nenhum item de pre-voo, roteiro ou criterio B1 a B7 marcado; nenhuma sessao beta registrada.
- `docs/P9-READY.md`: roteiro humano sem registro de execucao. Esta desatualizado: ainda exige chaves do Clerk e fala em Neon, e o projeto usa MariaDB sem Clerk.
- `docs/PARIDADE-FOUNDRY.md`: marca pronto para grid, tokens, movimento, PA, ataque, habilidade, magia de area, chat, FX, condicoes, iniciativa, ficha, level-up, inventario, loot, spawn, convite, compendios, login e deploy. Marca parcial para sync (ainda descreve "poll 2s") e papeis. Marca faltando para nevoa/linha de visao e persistencia de sala. As tres marcas negativas estao defasadas frente ao git (SSE em 06-25, MariaDB em 06-18); nevoa nao confirmada. As "Notas da gravacao" do video estao vazias.
- `PRODUTO.md`: sem checklist. Tambem defasado ("auth demo cookie", "salas em memoria").
- `REFATORACAO.md`: nao existe no repositorio. O plano equivalente e `docs/ELDARIN-SITE-JOGAVEL.md`, que marca os 8 blocos base como prontos e deixa sem marcar as listas de aceite (conta e ficha persistem, 4 jogadores por 30 minutos, combate completo).

## 4. Promessas do diario que nao consegui confirmar no git

- Deploys em producao (imagens `sha-dd9b457` e `sha-e90d38b`, HIST L5971, L6138) e as migrations 018 e 019 "rodadas em producao" (HIST L4480, L6281): o git local nao prova. Nao confirmado.
- Cerca de 27 hashes citados entre 18 e 24 de junho nao existem mais (reescritos pelo `filter-branch`, HIST L5018). Existem commits de mesmo titulo; a equivalencia foi feita por titulo, nao por diff.
- "Encerrar o loop e subir tudo" (HIST L558): a branch esta no GitHub, mas nao ha merge em `main` nem registro de deploy. Push confirmado; "subir" para producao nao confirmado.
- Contagem de 3.087 assercoes e "`npm test` verde": nao executei a suite. Confirmei so que os 51 scripts existem e estao registrados no `package.json`.
- Clique esquerdo abre o action ring (HIST L5630): tres dias depois o commit a50bfe7 diz "action ring so abre no clique direito". O diario nao registra a mudanca; comportamento atual nao confirmado.
- Datas divergentes: a entrada "Remocao do Clerk" e datada 06-12, os commits sao de 06-19; "Tres bugs de mesa" e datada 08-08, os commits sao de 08-13; as entradas de 08-03/04 tem commits de 08-04 a 08-06.
- Caminho inconsistente: HIST L932 cita `lib/rpg/um-anel/adversaries.ts`, que nao existe; o arquivo real e `lib/character/um-anel/adversaries.ts`.
- Artifacts publicados fora do repositorio (166 prompts de icones, auditoria de 07-31, guia de hospedagem): nao verificaveis pelo git.
- Soma da auditoria de 07-31: o diario diz 28 achados, a divisao por severidade soma 26 (HIST L6683).

Conferido e batendo: os arquivos novos citados pelo diario (motores e paineis do Um Anel, migrations 018 e 019, livros 14 a 23, responsivo, hospedagem local, privacidade) existem; os arquivos que ele diz ter removido (demo, `app/instalar`, `CampaignLobby`, doc do Clerk, `HeroVttPreview`) estao ausentes; todas as entradas de agosto tem commit de mesmo titulo.
