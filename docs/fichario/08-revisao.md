# 08 Revisão

Pareceres do Revisor: APROVADO ou REPROVADO, com achados.

## D13b r1 — resistência radiante do Golpe Sagrado (Lupa)
Parecer: APROVADO, com 1 achado pré-existente fora do escopo e 3 nits que não bloqueiam.
- Causa conferida: o dano do Golpe Sagrado saiu do total da arma. attack.ts:1059-1065 separa golpeRadiante só quando bonusDamageType é "radiante". attack.ts:1104-1107 resiste a arma pelo tipo dela e o golpe como radiante. damage-resist.ts:31 divide por 2 só quando o defensor resiste.
- Ciclo do campo conferido: ability.ts:494 grava o tipo. attack.ts:642-644 limpa junto no acerto. timed-effects.ts:397 expira junto. consumables.ts:216 e sync.ts:77 copiam. consumable-effects.ts:236 limpa no veneno da arma, que troca a fórmula.
- Verificado aqui: node scripts/verify-d13-golpe-sagrado.mjs 10 ok, 0 falhas. npx tsc --noEmit exit 0. npm test exit 0 (cadeia completa, com sync:data:check). Nenhum arquivo do repo editado.
- Pré-existente, fora do D13b (abrir item próprio): Canalizar Energia parece somar o bônus duas vezes. combat-ability.ts:241 injeta bonusDamageFormula no atacante. attack.ts:1061 soma. ability.ts:924-930 soma de novo. Pelo código lido; não reproduzi em teste. Canalizar também é radiante (compendium-actions.ts:47) e resiste como arma.
- Nit (lib/combat/golpe-sagrado.ts:1-8): o cabeçalho do arquivo agora fica acima da constante, e não de golpeSagradoDiceForLevel. Mover a constante para depois do cabeçalho.
- Nit (janela de deploy): buff de Golpe já preparado antes do deploy não tem bonusDamageType e resiste pela arma até o fim do turno (buff-durations.ts:71, 1 turno).
- Nit (lib/vtt/token-effects.ts:386): o tooltip do buff não diz que o dano é radiante.
- Lupa, revisão em 21/11/2026.

## SOMBRA Sombra Etérea nv 2 (Lupa)
Parecer: APROVADO, com 2 nits que não bloqueiam.
- Causa conferida: livros/LIVRO-DO-JOGADOR.md:2482 diz "Dieta nv.2: Ataque Furtivo ganha +1d6 necrótico". O dado só entra quando o Furtivo se aplica: lib/combat/sneak-attack.ts:104-113 devolve undefined sem sneakFormula, e attack.ts:1079-1091 só roda dentro do bloco do Furtivo. Subclasse por migrateSubclassName (Degustador de Sombras vira Sombra Etérea) e nível mínimo 2 (sneak-attack.ts:100-102).
- Crítico: attack.ts:1086-1087 rola o dado necrótico de novo, como o Furtivo. Confere com o livro, linha 421.
- Resistência: attack.ts:1096-1099 separa o necrótico; o resto segue o tipo da arma. damage-resist.ts:31 só divide por 2 quando o defensor resiste; o necrótico cai pela metade só no dado de sombra.
- Verificado aqui: node scripts/verify-d11-ataque-furtivo.mjs 39 ok, 0 falha; npx tsc --noEmit exit 0; verify-arma-aprimorada, verify-d12, verify-d13, verify-feiticeiro-carisma, verify-pa-guardado-ficha, verify-vida-temporaria-nivel e os verify-um-anel-* que importam attack/sneak/rules: todos exit 0. Não rodei o npm test completo (o relato diz exit 0).
- Nit (attack.ts:1116): o resumo de acerto crítico soma o dado necrótico no total com o tipo da arma ("12 perfurante"). É o mesmo padrão do Furtivo e o detalhe do chat separa. Aceito.
- Nit (attack.ts:1265 e :1116): o rótulo "Sombra necrótico" soa estranho em PT-BR. "Sombra Etérea necrótico" seria mais claro. Opcional.
- Nenhum arquivo do repo editado. Sem commit.
- Lupa, revisão em 21/11/2026.

## TOR-SAVE, BV-040, BV-039 r2 (Lupa)
Parecer: REPROVADO, com 1 achado bloqueante e 2 ressalvas.
- Bloqueante, BV-040 ainda falha quando a ficha muda pelo Mestre: app/api/tor-characters/[id]/route.ts:30 chama patchTorCharacterResources, e lib/character/um-anel/characters.ts:116-119 deixa o Mestre ajustar a ficha de qualquer heroi da aventura. Esse PATCH nao mexe na sala, entao a revisao do mapa nao muda, e o card do jogador dono (components/vtt/TorPlayableCharactersPanel.tsx:68) nao recarrega. O evento local so vale na aba do Mestre. O que fazer: fazer o PATCH deixar um sinal que chegue pelo SSE (por exemplo, revisao da sala quando o heroi esta na mesa), ou outro sinal para o card, e cobrir no verify.
- Ressalva: TorPlayableCharactersPanel.tsx:68 refaz GET /api/tor-characters a cada revisao do mapa, inclusive movimento de token de qualquer um. Em combate sao varias requisicoes por jogador, cada uma com checagem de permissao. O que fazer: filtrar (so quando um heroi mudou) ou medir e registrar.
- Ressalva: TorPlayableCharactersPanel.tsx:40 usa useMesaMapSlice(roomId ?? ""), que cria store orfa com chave vazia quando nao ha sala. Nit: lib/character/portrait-sheet-saved.ts:30 segue com TOR_SHEET_NOT_SAVED_MESSAGE no modulo de retrato (pedido na r1). Nit: app/api/room/[roomId]/combat/attack/route.ts:160 mantem o check sheetSaved in result, redundante depois do if (!result.ok).
- OK: ataque e Fonte de Dano agora chegam ao card pela revisao da mesa: persistRoom grava a revisao depois da sincronia da ficha (lib/room/internal/registry.ts:92). Aviso TOR-SAVE mantido em TorAttackPopup e TorHazardPanel, sem evento. Texto do retrato trocado no modulo e no verify-d09; nao sobrou o texto antigo no repo. verify-um-anel-sheet-sync: 22 ok. verify-d09-sheet-saved: exit 0. Comentario do verify corrigido.
- Nao rodei tsc nem npm test (usei o relato de quem fez). Nenhum arquivo do repo editado.
- Lupa, revisao r2 em 21/11/2026.

## TOR-SAVE, BV-040, BV-039 r1 (Lupa)
Parecer: REPROVADO, com 1 achado bloqueante e 2 ressalvas.
- Bloqueante, BV-040 incompleto: components/vtt/TorPlayableCharactersPanel.tsx:36-41 recarrega so no evento da janela, e o evento so dispara na aba que fez a mudanca. Se o Mestre ataca ou aplica Fonte de Dano num heroi de outro jogador, a barra lateral desse jogador continua com a Resistencia antiga ate recarregar a pagina. Ataque e Fonte de Dano estao na lista de gatilhos, mas o efeito nao chega ao dono da ficha. O que fazer: o card tambem recarregar quando o snapshot da mesa muda (passar um valor que mude com a mesa por components/vtt/mesa/MesaFoundryDockRail.tsx:189 e components/vtt/mesa/MesaFoundryFloatingWindows.tsx:226, e usar como dependencia do efeito de :63), e o verify cobrir esse caminho.
- Ressalva: scripts/verify-um-anel-sheet-sync.mjs:17-18 diz que a falha de gravacao da ficha e coberta pelo verify-d09-sheet-saved. Nao e verdade: o d09 cobre updateRoomActor (retrato), nao executeRoomTorAttack nem executeRoomTorHazard. O teste novo so confere texto por regex. O que fazer: corrigir o comentario, ou testar o handler com patch que falha.
- Ressalva: lib/room/handlers/tor-combat-attack.ts:609 e :620 e tor-hazard.ts:145: sheetSaved false nao fica registrado nem tem nova tentativa. A mesa mantem o dano e a ficha o numero antigo, e o aviso nao diz o que o jogador faz. O que fazer: dizer na mensagem que a ficha precisa ser ajustada a mao, ou registrar o pendente. Decisao do Regente; nao bloqueia.
- Nit: lib/character/portrait-sheet-saved.ts:30: TOR_SHEET_NOT_SAVED_MESSAGE mora no modulo de retrato. Mover para modulo neutro. Nit: app/api/room/[roomId]/combat/attack/route.ts:160: o check sheetSaved in result e redundante depois do if (!result.ok).
- OK: TOR-SAVE: mensagem exata, sheetSaved propagado pelos dois handlers, rotas, TorAttackPopup.tsx (aviso apos onRoomSync) e TorHazardPanel.tsx. BV-039: .dice-custom input com min-width 0, e o ROLAR e o button.btn filho direto do form (components/vtt/DiceRoller.tsx:105), com flex 0 0 auto.
- Verificado: node scripts/verify-um-anel-sheet-sync.mjs 22 ok, 0 falha. Nao rodei tsc nem npm test (usei o relato de quem fez). Nenhum arquivo do repo editado.
- Lupa, revisao em 21/11/2026.

## BV-036/BV-038 r2 pos-commit 9a24fa9 (Lupa)
Parecer: APROVADO. Sem bloqueante.
- Bloqueante da r1 resolvido: components/campaign/MesaSetupClient.tsx:47 repassa rpgSystemId ao RoomSettingsPanel. app/aventura/[adventureId]/configurar/page.tsx:85 passa room.rpgSystemId. Os dois usos diretos de RoomSettingsPanel (MesaSetupClient.tsx:43 e GmToolsPanel.tsx:114) recebem o sistema.
- Teste da r1 resolvido: scripts/verify-um-anel-mesa-isolamento.mjs checks 3 e 4 cobrem configurar -> MesaSetupClient -> RoomSettingsPanel e o save sem campos do Eldarin. O nit de check 4 da r2 tambem saiu: o regex exige combatFields vazio no Um Anel.
- Ressalva da r1 resolvida: RoomSettingsPanel.tsx:66-70 monta combatFields = {} no Um Anel.
- Nit da r1 resolvido: bloco condicional indentado (RoomSettingsPanel.tsx:185-225).
- Verificado: verify-um-anel-mesa-isolamento OK no commit. No pai (9a24fa9^) o mesmo script falha em 16 checks, ou seja, pega o bug. verify-mesa-barra-lateral OK. package.json valido. tsc --noEmit exit 0 na arvore de trabalho (inclui mudancas nao commitadas de outros).
- Aberto, nao bloqueia: check 1 do script com regex nao ancorado no elemento (ja aceito na r2).
- Nenhum arquivo do repo editado.
- Lupa, revisao pos-commit em 21/11/2026.

## BV-036/BV-038 r2 - menu do mestre e configuracao da aventura no Um Anel (Lupa)
Parecer: APROVADO, com 2 nits que nao bloqueiam.
- Caminho antes sem correcao, agora coberto: components/campaign/MesaSetupClient.tsx:47 repassa rpgSystemId ao RoomSettingsPanel (padrao eldarin em :28). app/aventura/[adventureId]/configurar/page.tsx:85 passa room.rpgSystemId; getRoom (lib/room/internal/registry.ts:161) retorna RoomState, que tem rpgSystemId (lib/room/types.ts:28).
- Save: components/vtt/RoomSettingsPanel.tsx:67-73 monta combatFields vazio no Um Anel. Servidor confere: app/api/room/[roomId]/settings/route.ts:37-45 so altera campos presentes, e lib/room/handlers/settings.ts:33 e :49 mesclam com o estado atual. Sem os campos, nada muda.
- Eldarin: todos os pontos tem padrao eldarin; o patch do Eldarin tem as mesmas chaves de antes.
- Reindent (RoomSettingsPanel.tsx:185-225) feito. Sem mudanca de texto de UI, sem emoji.
- Nit: scripts/verify-um-anel-mesa-isolamento.mjs (check 4): so confere que rpgSystemId === "um-anel" aparece antes do patch. Um guarda solto passaria. Trocar por regex que exige combatActive, autoPassDelayMs e xpFromMonstersEnabled fora do patch do Um Anel.
- Nit: scripts/verify-um-anel-mesa-isolamento.mjs (check 1): o regex de RoomSettingsPanel em GmToolsPanel nao esta ancorado no elemento. Aceito pelo que cobre hoje.
- Verificado aqui: node scripts/verify-um-anel-mesa-isolamento.mjs OK; npx tsc --noEmit exit 0. Nao rodei npm test inteiro (usei o relato de quem fez). Nenhum arquivo do repo editado.
- Lupa, revisão em 21/11/2026.

## BV-036/BV-038 r1 - menu do mestre no Um Anel (Lupa)
Parecer: REPROVADO, com 1 achado bloqueante e 2 ressalvas.
- Bloqueante, caminho sem correcao: components/campaign/MesaSetupClient.tsx:40 renderiza RoomSettingsPanel sem rpgSystemId, cai no padrao eldarin e mostra a secao Combate (PA, auto-passe, XP). Esse painel e usado em app/aventura/[adventureId]/configurar/page.tsx:79, alcancado por RoomInvitePanel.tsx:103, RoomInviteBar.tsx:71 e app/aventura/[adventureId]/page.tsx:494. Aventura do Um Anel chega la. O que fazer: passar room.rpgSystemId (RoomState em lib/room/types.ts:28; room ja existe na pagina) como prop nova de MesaSetupClient (padrao eldarin) e repassar ao RoomSettingsPanel.
- Teste ausente: scripts/verify-um-anel-mesa-isolamento.mjs nao cobre esse caminho, por isso passa com o bug. O que fazer: checar que configurar/page.tsx passa rpgSystemId ao MesaSetupClient e que este repassa ao RoomSettingsPanel.
- Ressalva: components/vtt/RoomSettingsPanel.tsx:66-76 (save) ainda envia combatActive, autoPassDelayMs e xpFromMonstersEnabled com a secao oculta. Hoje regrava o valor atual, mas no Um Anel a tela nao deveria gravar campos do Eldarin. O que fazer: montar o patch sem esses campos quando rpgSystemId === "um-anel".
- Nit: components/vtt/RoomSettingsPanel.tsx:182-224: bloco condicional sem indentacao. Indentar.
- Verificado aqui: node scripts/verify-um-anel-mesa-isolamento.mjs OK; node scripts/verify-mesa-barra-lateral.mjs OK. GmToolsPanel: isUmAnel, visibleTabs e fallback para Sala conferidos. Battlefield.tsx:293 ja tem rpgSystemId no escopo. Nao rodei tsc nem npm test (usei o relato de quem fez). Nenhum arquivo do repo editado.
- Lupa, revisão em 21/11/2026.

## CUS-fix r2 (gerador e JSON: PA, CD e texto) - Lupa
Parecer: APROVADO, com 3 nits que não bloqueiam.
- Correções da r1 conferidas: Mutação Forçada tem save constituicao no gerador (generate-compendium.mjs:459) e no JSON (magias.json:1167 bloco, CON CD, livro _parte_x_magias_v4_revisada.md:236). verify-custos-livro.mjs agora confere a Mutação na lista de CD (linha 61) e a descrição da Terremoto no JSON (linhas 105-111).
- Verificado aqui: regenerei o gerador numa cópia (scratchpad): magias.json e habilidades.json saem idênticos. node scripts/verify-custos-livro.mjs 12 ok, 0 falha. verify-compendium-ids ok. verify-alcances-livro 24 ok. package.json válido; só a linha do test mudou. Dano de Ventania, Terremoto e Esporos inalterado. Lixo "--- ### NIVEL 9" está registrado na página 03 (linhas 89-90) como decisão.
- Nit 1: scripts/generate-compendium.mjs:521: o texto novo da Terremoto é código morto, porque as linhas 650-661 sobrescrevem a descrição com o texto do livro. Reverter ou comentar, para não sugerir que a correção está em vigor.
- Nit 2: scripts/verify-custos-livro.mjs:106-111 (check 6) passa também no HEAD, porque a descrição da Terremoto no JSON não mudou. Aceito como guarda de regressão, não como prova da correção.
- Nit 3: scripts/verify-custos-livro.mjs:9-10: o cabeçalho diz CD ausente em 2 magias; agora são 3 e a lista inclui a Mutação. Atualizar.
- Lupa, revisão r2 em 21/11/2026.

## CUS-fix (gerador e JSON: PA, CD e texto) - Lupa
Parecer: REPROVADO, com 4 achados.
- scripts/generate-compendium.mjs:459 e data/compendiums/magias.json:1167: Mutação Forçada não tem CD. O livro (livros/_parte_x_magias_v4_revisada.md:236) diz CON CD ou mutação. Falta a 5ª CD (a doc fala em 4). O que fazer: save constituicao no gerador, sync, e cobrir no verify.
- scripts/generate-compendium.mjs:521 e data/compendiums/magias.json:1710: a correção do texto da Terremoto não chega ao dado. O gerador sobrescreve a descrição com o texto do livro (generate-compendium.mjs:650-661), então a linha 521 não tem efeito. O JSON segue com o lixo "--- ### NIVEL 9" do parser. O que fazer: limpar o corte do livro na origem e confirmar no JSON.
- scripts/verify-custos-livro.mjs:106 (check 6): testa só a string do gerador, não o JSON, por isso passa com o lixo acima. O que fazer: checar data/compendiums/magias.json e cobrir Mutação Forçada.
- docs/fichario/propostas/custos-e-danos.md (linha 5): diz 4 CD e 1 texto corrigidos. Com a Mutação são 5 CD, e o texto não entrou no dado. Atualizar.
- Nit: scripts/generate-compendium.mjs:459 falta espaço em 2,"Mutação".
- Fora do escopo na árvore: components/vtt/MesaWorkspace.tsx e data/compendiums/monstros.json não são desta tarefa; ficam fora do commit.
- Verificado aqui: node scripts/verify-custos-livro.mjs 11 ok, 0 falha. Gerador rodado em cópia (scratchpad): saída idêntica a magias.json e habilidades.json. Dano de Ventania 2d6, Terremoto 6d6 e Esporos 1d6 inalterado. PA 2 (Injeção, Mutação), CDs de Visão (SAB), Prisão (FOR), Correntes (DES 16) e Puxão (FOR 16) batem com o livro. Pacto de Ferro FOR CD 15 confere (LIVRO-DO-JOGADOR.md:3114).
- Lupa, revisão em 21/11/2026.

## ALC-fix (gerador e JSON, 21 alcances e 2 areas) - Lupa
Parecer: REPROVADO por um achado. Revisados: diff de scripts/generate-compendium.mjs, data/compendiums/magias.json e habilidades.json, scripts/verify-alcances-livro.mjs (24 ok agora).
- Conta floor(metros / 1,5): conferida nas 21 linhas. Todas batem com o livro (livros/_parte_x_magias_v4_revisada.md e LIVRO-DO-JOGADOR.md). Areas: Onda de Trovao cubo 4,5 m = radiusCells 3 e Terremoto raio 30 m = 20, coerentes com Ilusao Menor (cubo 1,5 m = radiusCells 1).
- Terremoto e Salto Dimensional: alcance e descricao no JSON estao coerentes (150 m = 100 celulas; teleporte 18 m).
- data/compendiums/habilidades.json, Voto de Caca: 12 celulas (18 m) vem de 'sentir mortos-vivos em 18m' (uso de descanso curto, sem alvo). O livro nao da alcance de efeito para esta habilidade. O que fazer: decidir o alcance pelo livro (provavelmente Pessoal, 0) e ajustar ABILITY_CATALOG no gerador, o JSON e a linha de Voto de Caca em scripts/verify-alcances-livro.mjs.
- Ressalva fora do achado: o verify so checa o JSON, nao o gerador. Se o gerador divergir do JSON, o teste nao pega.
- Sem commit. Arquivos da Bigorna (monstros.json, docs/fichario/propostas/um-anel-mesa.md) ignorados.

## BV-033 r2 (fichas do Um Anel na aventura) - Lupa
Parecer: APROVADO. Revisados so os 3 pontos da r1.
- AdventurePlayerSheetsList.tsx (~linha 30): fallback de nome real removido; agora nickname ou 'Jogador'. Nome real nao aparece para outro usuario.
- page.tsx:521: no Um Anel 'Ate 10 fichas do Um Anel por conta' (MAX_TOR_CHARACTERS_PER_USER); no Eldarin segue 'Max. 3 por jogador nesta mesa'. Conferido.
- verify-aventura-um-anel-fichas.mjs: 8 checks ok, incluindo os 2 novos (privacidade e texto do limite).
- npm test exit 0, zero FAIL. Arquivos da Bigorna (gerador de compendio) ignorados.

## BV-033 (fichas do Um Anel na aventura) - Lupa
Parecer: REPROVADO. Diff lido (page.tsx, AdventurePlayerSheetsList.tsx, package.json, scripts/verify-aventura-um-anel-fichas.mjs). npm test exit 0, zero FAIL, as 6 checks do script novo passam.
- components/adventure/AdventurePlayerSheetsList.tsx (resolveOwnerDisplayNames, ~linha 29): o fallback user?.name mostra o nome real da conta a outro usuario quando nao ha apelido. Regra: so apelido. O que fazer: trocar por nickname ou 'Jogador'. Pre-existente no Eldarin, mas o Um Anel passa a exibir pelo mesmo caminho.
- app/aventura/[adventureId]/page.tsx:519: o texto 'Max. 3 por jogador nesta mesa' continua aparecendo no Um Anel, contradizendo canCreateChar (sem limite por aventura). O que fazer: texto condicional, no Um Anel 'Max. 10 fichas por conta'.
- scripts/verify-aventura-um-anel-fichas.mjs: so checa strings do fonte. Nao pega o nome real nem o texto de 519. O que fazer: acrescentar check de que o fallback de nome real saiu e do texto do Um Anel.
- Conferido e OK: Eldarin mantem room.actors e o texto nv/classe (levelMeta gera o mesmo). Filtro por adventureId correto. Limite do Um Anel de 10 bate com MAX_TOR_CHARACTERS_PER_USER no servidor (characters.ts:183) e com o wizard (personagem/novo/page.tsx:74-78). Item expoe so id, nome, dono, imagens e nome da vocacao.

## CSS-1 r2 (BV-027: item selecionado) - Lupa
Parecer: APROVADO, com ressalva de medição. Confiro pela cascata, não pelo navegador.
- components/character/sheet-ddb.css:1562-1567: .sheet-shell--ddb .inv-row--selected (0,2,0) vem depois de .sheet-shell--ddb .inv-row (0,2,0) e de .sheet-shell--ddb .inv-row:hover (0,3,0). O .inv-row--selected:hover (0,3,0), também depois, vence o :hover do card. Fundo e borda do selecionado ficam os da regra nova.
- Conflito conferido: .sheet-popup-center .inv-row (sheet-popup.css:1723, 0,2,0) não se aplica à ficha DDB; esse seletor é de SheetPdfCapture.tsx:238.
- Contraste do nome (--ddb-ink #1e1814) sobre 0,14 de dourado em #faf7f0: recalculei e dá cerca de 14,5:1 (o autor disse 14,6:1). Passa.
- Ressalva: a medição no portal não foi repetida. Antes de fechar BV-027, repetir: fundo do selecionado e do não selecionado, borda, e o nome do selecionado.
- Nenhum arquivo do repo editado; sem commit. As três causas estão corrigidas, mas a correção de BV-027 apaga o destaque do item selecionado.
- components/character/sheet-ddb.css (regra .sheet-shell--ddb .inv-row, ~1553): com especificidade 0,2,0 ela sobrescreve background e border-color de .inv-row--selected (components/character/sheet.css:394, 0,1,0). Na ficha DDB o item selecionado perde o fundo dourado e a borda; sobra só o box-shadow de 1px. O que fazer: acrescentar .sheet-shell--ddb .inv-row--selected com fundo e borda próprios para tema claro (ex.: fundo dourado claro e borda mais escura), e medir o item selecionado contra o não selecionado.
- BV-030 (sheet-ddb.css ~1622): o seletor .sheet-shell--ddb .sheet-popup-advanced--ddb > summary (0,2,1) vence sheet-popup.css:1779. Correto; o aviso de DDB dentro da shell está em SheetPopupDdbView.tsx:100.
- BV-031 (tor-sheet.css ~535): flex-wrap só em .tor-sheet__masthead--with-portrait, no max-width 767px; a classe existe em TorCharacterSheetView.tsx:246. Correto.
- Medidas do autor (390 px sem rolagem, PDF em x 322, contraste 16,4:1 e 16:1), tsc e npm test: aceitas pelo autor; não rodei de novo nesta revisão.
- Nenhum arquivo do repo editado; sem commit.
## D-09b r3 - revisão final do loadout (Lupa)
Parecer: REPROVADO. Os dois bloqueantes da r2 estão corrigidos, mas o teste pedido na r2 não foi feito.
- Pendente (scripts/verify-d09-sheet-saved.mjs): o caso que aprovava o defeito foi removido, mas nenhum caso novo cobre hooks/useCombatActions.ts nem components/vtt/TokenActionRing.tsx (grep sem resultado para os dois). Uma regressão em qualquer um deles passa no npm test. O que fazer: incluir um caso que exija setErr(ROOM_SHEET_NOT_SAVED_MESSAGE) e catch com setErr em useCombatActions.ts, e outro que exija res.sheetSaved === false com toast.push(ROOM_SHEET_NOT_SAVED_MESSAGE, 'warn') em TokenActionRing.tsx.
- Corrigido e conferido: TokenActionRing.tsx (~287-292) lê sheetSaved e avisa com toast; a variante 'warn' existe em components/vtt/VttToast.tsx:15. useCombatActions.ts (~351-358) tem try/catch e setErr no aviso e no erro; CombatActionBar.tsx:252 mostra err. Sem regressão em PA, combate, sync, permissões ou privacidade.
- Ressalva (pré-existente, fora deste diff): o catch vazio de saveLoadout em TokenActionRing.tsx segue silencioso para erro de rede.
- Ressalva (pré-existente): lib/room/handlers/combat-gm.ts grava a ficha duas vezes em paralelo (nit da r2). Não bloqueia.
- Verificado aqui: npm test exit 0 (log completo). Nenhum arquivo do repo editado; sem commit.
- Addendum r3 (commit a57d760): os dois casos pedidos existem (verify-d09-sheet-saved.mjs:307-317) e casam com o código. node scripts/verify-d09-sheet-saved.mjs: 22 ok, 0 falha. Pendência fechada. Parecer da r3 passa a APROVADO para o código e o teste. Ressalvas pré-existentes seguem como estão.

## D-09b r2 — set-hp, inventário, ficha, loadout e magias (Lupa)
Parecer: REPROVADO. Os 2 bloqueantes da r1 seguem abertos; a r2 acrescentou o editor de identidade, que está certo.
- Bloqueante (não corrigido): components/vtt/TokenActionRing.tsx:284-288 segue igual ao HEAD. O catch da linha 286 é vazio e a ficha que não grava passa sem aviso. Registrar como pendente não corrige. O que fazer: assertRoomSheetSaved(saved) e mostrar a mensagem no anel, como em components/vtt/TokenActionPanel.tsx:299-306.
- Bloqueante (desfeito, não corrigido): hooks/useCombatActions.ts:351 voltou ao HEAD. saveLoadout não tem try, não chama setErr e não usa assertRoomSheetSaved. O chamador components/vtt/CombatActionBar.tsx:139-143 não trata a rejeição, então o aviso se perde. O que fazer: reaplicar o assert com try/catch que chame setErr(e.message).
- Teste que aprova o defeito: scripts/verify-d09-sheet-saved.mjs (caso 'loadout pelo hook de acoes de combate nao lanca rejeicao sem tratamento') faz assert.doesNotMatch(src, /assertRoomSheetSaved/). Ele passa com o hook quebrado e codifica a ausência do tratamento. Trocar por um caso que exija o tratamento, e outro para TokenActionRing.tsx.
- Ressalva (agora aceita no CharacterIdentityEditor): components/character/CharacterIdentityEditor.tsx:84-92 grava savedRoom e chama assertRoomSheetSaved depois de onSaved. O ramo onSaveIdentity (só fora da sala, CharacterSheet.tsx:1036) não tem sheetSaved e é correto não ter. Verify só casa regex, aceito.
- Nit pré-existente segue: lib/room/handlers/combat-gm.ts:357-366 grava a ficha duas vezes em paralelo. Não bloqueia.
- Verificado aqui: node scripts/verify-d09-sheet-saved.mjs 21 ok, 0 falha; node scripts/verify-vida-temporaria-nivel.mjs 8 ok; npx tsc --noEmit exit 0. Nenhum arquivo do repo editado; sem commit. npm test não rodei de novo (a r2 diz exit 0).
- Lupa, revisão em 21/11/2026.

## D-09b r1 — set-hp, inventário, ficha, loadout e magias (Lupa)
Parecer: REPROVADO, com 2 achados bloqueantes e 2 ressalvas.
- Bloqueante: components/vtt/TokenActionRing.tsx:284 grava o loadout de combate pelo anel sem ler sheetSaved, e o catch da linha 286 é vazio. Ficha que não grava passa sem aviso. O que fazer: assertRoomSheetSaved(saved) e mostrar a mensagem no anel, como em components/vtt/TokenActionPanel.tsx:299-306.
- Bloqueante: hooks/useCombatActions.ts:351-352 lança o aviso, mas saveLoadout não tem try e não chama setErr. O chamador components/vtt/CombatActionBar.tsx:139-143 (onActionChange) não trata a rejeição, e o err da linha 252 nunca recebe o aviso. O que fazer: try/catch em saveLoadout com setErr(e.message).
- Ressalva: components/character/CharacterIdentityEditor.tsx:87-91 (identityPatch) ignora sheetSaved e mostra 'Ficha atualizada.' mesmo com a ficha sem gravar. A ressalva 'identidade' da 03 D-09 segue aberta. Corrigir aqui ou abrir item próprio, dizendo qual.
- Ressalva: scripts/verify-d09-sheet-saved.mjs:248-281 — os casos do set-hp e dos componentes são regex no texto. Passam com o texto certo mesmo se a lógica estiver errada, e nenhum simula saveCharacter falhando em executeGmCombatAction. O que fazer: um caso de comportamento, reaproveitando o harness de scripts/verify-vida-temporaria-nivel.mjs (linhas 86 e 203): saveCharacter rejeitando, set-hp com ficha ligada, esperar ok true e sheetSaved false.
- Nit pré-existente: lib/room/handlers/combat-gm.ts:357-366 chama saveCharacter duas vezes em paralelo para ficha de jogador (direto, e pelo persistActorToAdventureSheet em lib/room/adventure-actors.ts:232). Antes eram dois void; agora o Promise.all espera os dois. Não bloqueia.
- Conferido e correto: set-hp (combat-gm.ts:357-366 espera e marca sheetSaved; a rota repassa; components/vtt/TokenGmHpDialog.tsx:67 avisa). Inventário, ficha, loadout de personagem e magias avisam em CharacterSheet.tsx, CombatLoadoutPanel.tsx, SpellPrepPanel.tsx e TokenActionPanel.tsx.
- Verificado aqui: node scripts/verify-d09-sheet-saved.mjs 20 ok, 0 falha; node scripts/verify-vida-temporaria-nivel.mjs 8 ok; npx tsc --noEmit exit 0. Nenhum arquivo do repo editado; sem commit.
- Lupa, revisão em 21/11/2026.

## D12b e D13 r1 — Golpe Sagrado e Corpo Transcendente (Lupa)
Parecer: APROVADO, com 1 nit e pendências que mantêm o D13 aberto.
- Escopo combinado conferido: nome Golpe Sagrado e escala 2d8/3d8/4d8/5d8/6d8 em lib/combat/golpe-sagrado.ts, iguais à tabela do livro (linhas 1199-1203). Buff radiante em lib/combat/ability.ts:473-494, no lugar do +2 de ataque. Lâmina dos Sepulcros segue com +2 (caso do verify-d13). Corpo Transcendente saiu sem correspondente no livro. Sem resto de Golpe do Juramento fora de docs e do verify.
- Nit: lib/combat/ability.ts:475 usa actor?.identity.nivel ?? 2. Sem ficha, o Golpe sai como 2d8 em qualquer nível, sem aviso. Tratar ausência de ficha como erro ou usar o nível do token.
- Pendência (o dono deixou fora): lib/combat/attack.ts:634 consome o buff em qualquer acerto, inclusive magia e à distância, e o resumo em ability.ts:489-491 diz corpo a corpo. Não é regressão (o +2 antigo também valia para qualquer ataque), mas o texto promete o que o código não faz.
- Pendência (o dono deixou fora): attack.ts:1048-1051 soma o extra antes de resistedDamageAmount (attack.ts:1073), com o tipo da arma. O 2d8 radiante sofre resistência a cortante ou perfurante. Morto-vivo segue sem dano dobrado.
- Docs: docs/fichario/propostas/balanceamento.md:307 e secao 4.3 ainda dizem Golpe do Juramento e +2 no ataque. Atualizar com nota de status, como no D12.
- Verificado aqui: verify-d13 7 ok; verify-d12 5 ok; verify-d11 33 ok; verify-pa-bank, combat-dice-sync, combat-fx-live, combat-roll-display, turn-guard, end-turn-confirm, consumables, d15-gm-log-pa, arma-aprimorada OK; npx tsc --noEmit exit 0. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D11 r5 — decisão do dono (D-19): limite só em combate com fila (Lupa)
Parecer: APROVADO, com 2 nits.
- Decisão D-19 (página 03, resolvido): o limite de uma vez por turno vale só em combat_turn. Confere no código: sneakAttackTurnWindow (lib/combat/sneak-attack.ts) usa combatPaPhaseFromFlags (lib/combat/combat-pa-phase.ts), e resolveCombatPaPhase delega à mesma regra. A flag só é gravada com turnWindow (attack.ts, sneakAttackUsed: (sneakApplied && sneakTurnWindow)).
- A janela chega de verdade ao motor: executeRoomAttack monta o turn com combatTurnOptionsFromRoom (lib/room/combat-turn-context.ts:19), que passa combatHasOrder e combatActive. Se esse passo faltasse, o limite morreria em silêncio; ele está presente (combat-attack.ts:124 e :436).
- Handler: a checagem duplicada foi removida. Agora só resolveAttack decide, e a flag chega ao attackerAfterAttack só quando vale. Confere.
- Crítico: o dado rola de novo (attack.ts, sneakRolls); o caso 'critico no combate_turn' confirma que a flag é gravada.
- Nit 1: o limite do ataque múltiplo ('primeiro acerto') não tem caso próprio. O caso de resolveMultiAttack usa Guerreiro e prova só o laço. Hoje o Ladino tem 1 ataque, então o caminho não é alcançado; vale um caso se a regra mudar.
- Nit 2 (aceito): a marca de crítico na fórmula base não foi aplicada. O damage.formula vai para o metadado do chat e a formula é lida só pelo dado primário (combat-dice-model.ts formulaToDiceSides), então não há efeito visível. Aceito.
- Conferido: verify-d11-ataque-furtivo 33 ok, 0 falha; npx tsc --noEmit exit 0. Não rodei o npm test inteiro. Sem commit, sem edição de código.
- Lupa, revisão em 20/11/2026.

## D11 r4 — janela do combate livre e correções de r3 (Lupa)
Parecer: APROVADO, com 1 ressalva de decisão (D-19) e 1 nit.
- Bloqueante da r3 fechado em forma: a janela do combate livre (zerada na entrada e no início de turno) está registrada como D-19 na página 03, com opções (a) por rodada, (b) por combate, (c) por ataque. Conferido: lib/room/combat.ts:166 só avança a rodada na fila, então a afirmação é verdadeira. Pela regra da página 03, a decisão cabe ao dono, e a janela atual é a opção (b) registrada.
- Removido '(critico x2)': grep em lib/combat/attack.ts sem resultado.
- Comentário em lib/room/handlers/combat-attack.ts (magia multi-alvo, ~linha 524) explica por que a flag não é passada: a seleção múltipla é só de magia (:416). Confere.
- Verify ganhou casos: 1 ataque do Ladino, zeragem em startTurnPaFull, janela do combate livre. Os três passam.
- Nit: o caso 'combate livre: a flag persiste' trava o comportamento atual. Quando o dono decidir D-19, esse caso precisa mudar junto. Marcar no nome do caso que depende de D-19.
- Conferido: verify-d11-ataque-furtivo 28 ok; npx tsc --noEmit exit 0. Não rodei o npm test inteiro. Sem commit, sem edição de arquivo de código.
- Lupa, revisão em 20/11/2026.

## D11 r3 — Ataque Furtivo por turno, magia e crítico (Lupa)
Parecer: REPROVADO, com 1 achado bloqueante e 2 nits.
- Bloqueante, combate livre (lib/combat/sneak-attack.ts:67 com lib/combat/combat-pa-engine.ts:148-162): a flag sneakAttackUsedThisTurn só zera em clearPaDiscountUsed, e no combate livre (combat_free, sem fila) isso só acontece ao entrar no combate (onEnterCombatFree, :114). Não há turno nem renovação de PA por rodada nesse modo. Resultado: o Ladino ganha o furtivo uma vez por combate livre inteiro e depois nunca mais, sem aviso. A decisão D11 da página 03 fala de turno e não cobre o combate livre. O que fazer: definir a janela no combate livre (por exemplo, por rodada, se existir contagem de rodada) ou registrar na página 03 que o combate livre tem limite de uma vez por combate, e cobrir com verify.
- Nit (lib/combat/attack.ts:1066): o sufixo '(critico x2)' entra só na formula do furtivo, e a formula base do crítico não recebe marca. A formula vai para o metadado do chat (combat-attack.ts:349). Aplicar a marca de forma igual ou remover.
- Nit: o limite 'no ataque múltiplo, o primeiro acerto' (resolveMultiAttack, attack.ts:1146) está na decisão, mas nenhum caso do verify chama resolveMultiAttack. Hoje o Ladino tem 1 ataque, então não roda, mas a regra fica sem teste.
- Conferido: verify-d11-ataque-furtivo 25 ok; npx tsc --noEmit exit 0. O segundo chamador de attackerAfterAttack (combat-attack.ts:524, magia de vários alvos) não passa a flag; é seguro porque a seleção múltipla é só de magia (combat-attack.ts:416), mas vale um comentário.
- Lupa, revisão em 20/11/2026.

## D11 r2 — Ataque Furtivo com crítico e D-17/D-18 (Lupa)
Parecer: APROVADO, com 1 nit e 1 ressalva de decisão.
- Crítico: sneakAttackFormula dobra o número de dados quando critical (lib/combat/sneak-attack.ts), e resolveAttack passa critical (attack.ts:1046-1055). Livro linha 421 confere. Dois casos novos (Ladino 5 com Vantagem = 6d6; outra classe sem furtivo no crítico) falhariam sem a correção.
- Ressalva (decisão aberta, não é bug): D-17 e D-18 estão na página 03 com recomendação (a) e (b). O código hoje segue a recomendação de D-17 (a). Se você escolher (b) para D-17, será preciso estado por turno; isso é trabalho novo.
- Nit (lib/combat/sneak-attack.ts, comentário do cabeçalho): 'o dado do furtivo dobra junto com o resto do dano' não é exato. O dano de atributo e o bônus fixo não dobram (rollActionDamage dobra só os dados base). Trocar por 'o dado do furtivo dobra, como os dados base do ataque'.
- Conferido aqui: verify-d11-ataque-furtivo 18 ok; npx tsc --noEmit exit 0; verify-combat-dice-sync, verify-combat-roll-display, verify-arma-aprimorada, verify-combat-fx-live, verify-xp, verify-d12-chi-sem-fluxo e verify-d15-gm-log-pa exit 0. Não rodei o npm test inteiro. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D11 — Ataque Furtivo do Ladino (Lupa)
Parecer: REPROVADO, com 1 achado de regra e 2 decisões a registrar.
- lib/combat/attack.ts:545-549 (rollActionDamage) e attack.ts:1046-1057: o furtivo não dobra no crítico. livros/LIVRO-DO-JOGADOR.md:421 diz "Natural 20: Acerto Crítico — dano dobrado", sem exceção. O parecer do Corretor diz "o livro não diz", e isso não é exato. O que fazer: dobrar o dado do furtivo no crítico, ou registrar a decisão em 03 Precisa de decisão citando a linha 421. Não há caso de teste para o crítico.
- lib/combat/attack.ts:1151 (resolveMultiAttack) e lib/combat/area-spell.ts:235: cada ataque do ataque múltiplo e cada alvo de magia de área rolam o furtivo, sem limite por turno. O livro só diz "ao atacar". O que fazer: registrar a decisão (inclusive o efeito em área com vários alvos) em 03 antes de aprovar, ou limitar a um por turno.
- lib/combat/sneak-attack.ts:11: o comentário diz "Servidor only", mas lib/character/rules.ts:3 importa o módulo, e rules.ts é usado por componentes de cliente (CharacterSheet.tsx:69). Não quebra, porque o módulo é puro. O que fazer: trocar a frase.
- lib/combat/attack.ts:848-859 e lib/vtt/goblin-combat.ts:46: o furtivo do goblin monstro é outra implementação do mesmo conceito, com regra diferente (2d6 só com Vantagem). O que fazer: decidir se fica separado e documentar, ou unificar.
- Conferido aqui: verify-d11-ataque-furtivo 16 ok; npx tsc --noEmit exit 0; verify-combat-dice-sync, verify-combat-roll-display, verify-arma-aprimorada, verify-combat-fx-live e verify-xp exit 0. Não rodei o npm test inteiro.
- Fora do D11, para anotar: Sombra Etérea (subclasse do Ladino, livro) adiciona +1d6 necrótico a ataques furtivos. Não está implementado.
- Lupa, revisão em 20/11/2026.

## BV-018 — guarda do flush da cena pendente (Lupa)
Parecer: REPROVADO. A hipótese se sustenta e a guarda resolve o caso do flush, mas ela cobre só um caminho.
- components/vtt/Battlefield.tsx:753 — syncRoom guarda pendingCombatSnapRef sem checar revisão e chama onApplySnapshot com force (755). hooks/useRoomSync.ts:146 só descarta com force falso, então um snap velho chega à página e fica se chegar depois da resposta do movimento. O que fazer: no topo de syncRoom, if (snap.revision < appliedSceneRevisionRef.current) return; antes de guardar, de setScene e de onApplySnapshot.
- hooks/vtt/useBattlefieldCombatFxQueue.ts:136-147 — onCombatApplyState e onCombatFxDone aplicam o pending via applyCombatSnapshot (Battlefield.tsx:670-676), que faz setScene sem checar revisão. Um pending velho guardado durante FX é reaplicado ao fim do FX. O que fazer: o mesmo corte do item anterior, ou checar em applyCombatSnapshot.
- Sem teste no diff. O que fazer: verify que falhe sem a guarda (move R2 aplicado, pending R1, o flush não reaplica R1, e o FX não reaplica R1).
- Chamadores de flush: moveSelectedTo (Battlefield.tsx:1922), onRepositionToken (1979), onGmDragPreview (1994). Os três passam pela guarda; onRepositionToken ajusta applied antes, então é consistente.
- Risco (não bloqueia): a revisão pode voltar a zero (useRoomSync.ts:209 e 322 zeram revisionRef). Com applied alto, a guarda descarta todo pending até trocar de sala. Medir antes de aceitar.
- Verificado: npm run test exit 0; npx tsc --noEmit exit 0. Navegador não testado.

## BV-014 r2 — teto do pool na ficha e nos cards da mesa (Lupa)
Parecer: APROVADO, com um nit.
- components/vtt/PlayableCharactersPanel.tsx:215 e components/vtt/PlayerSpawnPanel.tsx:267 — agora usam paPoolMaxForSheet. A pendência da rodada 1 está fechada.
- scripts/verify-ficha-pa-teto.mjs — chama a função real, 3 ok, encadeado no npm test. Sem a correção (teto 5), o caso 1 falha.
- Nit: o caso 'valor 9 cabe no teto 9' repete o Math.min em vez de chamar o componente. Só o caso do teto pega regressão.
- Ressalva D-12 (página 03): clamps em normalize.ts:124 e identity.ts:93 seguem como estão, não alterados aqui.
- BV-010 segue como D-11, sem código.
- Verificado: npm run test exit 0; npx tsc --noEmit exit 0.

## BV-014 e BV-010 — PA da ficha e dano do aprimoramento (Lupa)
Parecer BV-014: REPROVADO. O teto da ficha agora é o da mesa, mas o 9/5 continua nos cards da mesa.
- components/vtt/PlayableCharactersPanel.tsx:215 e components/vtt/PlayerSpawnPanel.tsx:267 — os cards usam pontosAcao.max, que na sala é a recuperação 5 (lib/combat/combat-token-pa.ts:52). Com PA 9 na mesa, o card mostra 9/5. O que fazer: usar o mesmo teto nesses dois cards.
- Sem teste que falhe sem a correção. O que fazer: caso em scripts/ para paPoolMaxForSheet (sem talento = 9; com talento de PA = teto + bônus) e para valor acima do teto.
- Ressalva: lib/character/normalize.ts:124 e lib/character/identity.ts:93 limitam o valor guardado a 5, mas o BV-014 foi visto com 9 fora da mesa. Há um caminho sem esse limite; confirmar qual.
- Verificado: paPoolMaxForSheet = accumulationCap (lib/combat/pa-economy.ts:96), mesmo teto de dotCapacity (lib/combat/pa-display.ts:21). npm run test: exit 0. npx tsc --noEmit: exit 0.
Parecer BV-010: REPROVADO como correção. Não há mudança de código: o diff não toca armas nem lib/combat/attack.ts. O chip segue 1d4.
- lib/combat/attack.ts:185 usa só weapon.dano.formula. Diagnóstico confirmado. data/compendiums/armas.json:6325: o +1 de dano só existe no texto.
- Decisão D-11 (página 03) confere com o código. O que fazer: escolher (a), (b) ou (c). Com (a), o dano em attack.ts e o chip mudam juntos e pedem teste de dano na mesa.

## 152d6d3 — fix(eldarin): criar personagem na mesa sem recarregar (Lupa)
Parecer: APROVADO, com ressalvas que nao bloqueiam.
- components/character/wizard/CharacterCreationWizard.tsx:456 — ataca a causa: o caminho onCreated saia sem router.refresh(), e a ficha vem de Server Component. O refresh esta antes do return. OK.
- components/character/wizard/TorCharacterCreationWizard.tsx:233 — mesmo conserto, antes do return. OK.
- scripts/verify-wizard-refresh.mjs:129 — guarda fraca: exige so >= 2 chamadas de router.refresh(), mas o Eldarin tem 3 saidas. Remover o refresh da edicao salva (linha 417) passa. O que fazer: contar por assistente (3 no Eldarin, 2 no Tor).
- Navegador: nao testado (o proprio commit admite). Antes de fechar, o dono testa: criar personagem pelo assistente embutido na mesa, Eldarin e Um Anel, e ver a ficha sem recarregar.
- Verificado aqui: node scripts/verify-wizard-refresh.mjs = 10 ok, 0 falhas. Sem a correcao, a asserção do caminho da mesa falha.
- Sem regressao em PA, combate, sync, permissoes ou privacidade. Sem texto de UI novo; sem emoji.

## B1 — sincronização preserva vida e PA da sala (Lupa)
Parecer: REPROVADO. Corrige o dano que some, mas quebra a vida que a ficha muda.
- lib/room/adventure-actors.ts:155 (keepRoomVitals): mantém sempre o vida.value da sala. Mudança de vida feita na ficha não chega à sala quando o ator já está nela: subida de nível (lib/character/level-up.ts:296) e reconstrução (lib/character/rebuild-from-wizard.ts:37, vida = max). Exemplo: ficha e sala 20/20; edição sobe o max para 30; sala fica 20/30 (antes, 30/30).
- lib/room/adventure-actors.ts:155: não limita o valor ao max novo. Se o max cai, a sala fica acima do max (ex.: 25/20; identity.ts:89 faz o clamp e este caminho não). O que fazer: value = min(value, next.max) e, quando next.max muda, usar o valor da ficha.
- scripts/verify-sync-preserva-vida.mjs: só casa texto (regex). Não pegaria troca de prev/next nem falta de clamp. O que fazer: teste de comportamento do helper (exportar, rodar com tsx) cobrindo ator novo, max igual, max subiu, max caiu.
- Decisão do dono (não decido aqui): edição da ficha depois de dano (rebuild zera a vida na ficha) deve zerar a sala? Hoje a sala ignora.
- Verificado: diff lido; package.json inclui o verify; handlers e livros não tocados. Não rodei o teste nem o navegador.

## B1 — 2a rodada (Lupa)
Parecer: APROVADO, com nits e uma decisão do dono em aberto.
- lib/room/actor-vitals.ts:14 (valorDaSala): regra certa. Max mudou -> valor da ficha; max igual -> valor da sala; sempre min(valor, max). Vida temporária e PA seguem a mesma regra. Ator novo (sem prev) segue inteiro da ficha.
- scripts/verify-sync-preserva-vida.mjs: 10 casos de comportamento chamando a função real. Passou: 10 ok, 0 falha (Node 24.16). Sem o helper, o script quebra no import.
- Nit 1: o script importa um .ts direto. Node 24 aceita, mas emite aviso MODULE_TYPELESS_PACKAGE_JSON. Em Node antigo sem strip de tipos, quebra. O que fazer: confirmar a versão do Node do projeto (engines) ou mover para tsx.
- Nit 2: o caso de integração em adventure-actors.ts ainda é regex. Aceitável.
- Decisão do dono, já aceita pela regra: rebuild-from-wizard.ts:37 zera a vida na ficha quando o max não muda; a sala mantém o dano. Confirmar se é o desejado.
- Não rodei tsc --noEmit neste parecer. O risco de tipo é baixo (Pool é estrutural), mas o build deve ser rodado antes do merge.

## N-01 — vida temporária some ao normalizar a ficha (Lupa)
Parecer: APROVADO, com ressalvas que não bloqueiam.
- lib/character/normalize.ts:120 — ataca a causa no escopo pedido: resources.vida passa a levar temp quando existe. O condicional evita gravar temp undefined. OK.
- scripts/verify-vida-temporaria.mjs:104 — teste de comportamento na função real. Verificado: com o normalize do HEAD falha ('temp 4 continua 4'); com a correção, 2 ok, 0 falha.
- package.json (test) — verify encadeado antes de sync:data:check. npm test completo: exit 0. tsc --noEmit: exit 0.
- Ressalva 1: scripts/verify-vida-temporaria.mjs:31 — registerHooks só existe em Node 22.15+ / 23.5+, e package.json diz engines node >=20. Em Node 20 o npm test quebra nesse passo. Hoje não quebra: Dockerfile usa node 26 e a máquina roda 24. O que fazer: subir engines ou transpilar como verify-sync-preserva-vida.mjs. Não testei em Node 20.
- Ressalva 2: o sintoma pode continuar fora do normalize. Os mesmos caminhos descartam temp antes do normalize, e ele não recupera: lib/character/identity.ts:87 (troca de identidade), lib/character/level-up.ts:296 (subida de nível), lib/room/handlers/gm-actor-progress.ts:51 (progressão pelo GM). O que fazer: abrir item próprio. Decisão do dono: a vida temporária deve sobreviver à subida de nível? Os livros não trazem regra para isso.
- Sem commit. Sem regressão em PA, combate, sync ou privacidade. Sem texto de UI novo; sem emoji.

## BV-005 — Passar turno com modal de confirmação (Lupa)
Parecer: REPROVADO. EndTurnBar ficou certo, mas o D27 continua valendo nos outros dois botões Passar, e um deles é o que o jogador usa no fluxo comum.
- components/vtt/CharacterCombatHud.tsx:237 — botão hud-btn--pass chama handleEndTurn (linha 136) → passTurn direto, sem modal. A barra EndTurnBar só é montada quando o HUD do token está oculto (components/vtt/Battlefield.tsx:2930). Logo, ao clicar no token e passar, o bug continua. O que fazer: o HUD abrir o mesmo EndTurnConfirmDialog antes de passTurn.
- components/vtt/MesaWorkspace.tsx:556 — handleMobileEndTurn chama passMobileTurn direto; botão Passar do celular (components/vtt/MesaMobileBar.tsx:46) também pula o modal. O que fazer: mesmo modal no mobile.
- components/vtt/EndTurnBar.tsx:70 — EndTurnConfirmDialog recebe paRules nao e passado: o aviso de PA guardados usa regra de fallback (recovery = token.paMax, cap = PA_ACCUMULATION_CAP_DEFAULT = 9, lib/combat/pa-economy.ts:10). Não usa paTurnRulesForActor (lib/combat/pa-economy.ts:55) nem paTurnRulesForRoomToken (lib/combat/exploration-pa.ts:13), que levam talentos e turnStartPa. Pode mostrar PA descartado errado em ficha com talento. Não confirmei qual regra o servidor usa em nextCombatTurn. O que fazer: calcular paRules com a mesma função do servidor e passar ao dialogo.
- components/vtt/EndTurnConfirmDialog.tsx:39 — onCancel é inline em EndTurnBar.tsx:70, então o useEffect roda a cada render (cada sync da sala) e refoca o botão Confirmar. Nit. O que fazer: useCallback no onCancel.
- scripts/verify-end-turn-confirm.mjs — só casa texto de EndTurnBar.tsx. Não cobre HUD nem mobile, então passa com o bug vivo nesses caminhos. Falharia sem a correção (import e botão), o que é bom.
- Verificado aqui: node scripts/verify-end-turn-confirm.mjs = ok, exit 0. npx tsc --noEmit = exit 0.
- Não verificado: navegador. O modal fica dentro de .vtt-end-turn-bar (z-index 8; 30 no tema Foundry). Janela ou popup com z maior cobre o modal. Conferir na mesa.
- Sem commit. Sem regressão em PA, combate, sync ou privacidade. Sem texto de UI novo; sem emoji.

## BV-005 r2 — confirmação nos três botões Passar (Lupa)
Parecer: APROVADO, com ressalvas que não bloqueiam.
- hooks/vtt/useEndTurnConfirm.ts:15-22 — paRulesForToken replica paRulesForRoomToken (lib/combat/combat-pa-engine.ts:56-61): ficha linkada vira paTurnRulesForActor, o resto paTurnRulesForMonster. Confere com o servidor. Fecha a ressalva de paRules da r1.
- hooks/vtt/useEndTurnConfirm.ts:36-38 e 42-46 — requestEndTurn com !busy, onCancel estável com useCallback (fecha o nit da r1), onConfirm fecha depois do passTurn. OK.
- components/vtt/CharacterCombatHud.tsx:148 — handleEndTurn chama requestEndTurn. Modal no fim do .vtt-hud-wrapper. Hook chamado antes de qualquer return (o componente não tem return antecipado).
- components/vtt/MesaWorkspace.tsx:287 e 573-574 — requestMobileEndTurn no clique do celular; activeToken vem do snapshot; modal em :786, depois do MesaMobileBar. Sem return antes do hook.
- components/vtt/EndTurnBar.tsx — hook antes do return null; modal dentro da barra. OK.
- scripts/verify-end-turn-confirm.mjs — cobre os três caminhos e o hook. Sem a correção (HUD e celular chamando passTurn direto) falha. Passou: ok, exit 0.
- package.json — verify incluído no test. npx tsc --noEmit: exit 0.
- Ressalva 1: hooks/vtt/useEndTurnConfirm.ts:42-46 — o modal não fecha quando o turno ativo muda (SSE, outro jogador). O texto acompanha o token atual, mas o clique passa o turno de quem estiver ativo naquele momento. O que fazer: fechar o modal (setOpen(false)) quando o id do activeToken mudar.
- Ressalva 2: MesaWorkspace.tsx (mobile) — erro do passar turno é engolido no catch do hook e o celular não mostra err. Não é regressão (antes era rejeição não tratada, sem UI). O que fazer: mostrar err no celular, se quiser fechar o caso.
- Ressalva 3: navegador não testado. O modal fica dentro de .vtt-hud-wrapper e da div da mesa; .vtt-combat-hud tem isolation: isolate e não tem transform. Conferir o z-index na mesa, como na r1.
- Não verificado: lint. O projeto não tem eslint.config nem .eslintrc, então next lint não roda. A ordem dos hooks foi conferida por leitura.

## BV-004 — openInDock sem setState aninhado (Claude Code)
Parecer: APROVADO, com ressalvas que não bloqueiam.
- hooks/vtt/useFoundryWindows.ts:244-268 — ataca a causa. O setRegistry saiu de dentro do updater de setFloating; o updater de registry ficou puro; wasFloating vem do escopo; setFloating usa updater puro; deps [floating]. Conferido contra o HEAD.
- scripts/verify-mesa-barra-lateral.mjs — falha no HEAD (exit 1, as duas checagens) e passa no novo (exit 0). npm run test:mesa-barra: exit 0. Falharia sem a correção.
- package.json — JSON válido; diff de 1 linha (test:mesa-barra). npx tsc --noEmit: exit 0.
- Ressalva 1: scripts/verify-mesa-barra-lateral.mjs:28 — a regex só pega setFloating((x) => {. Um setFloating(x => { ... setRegistry ...) passa. O que fazer: aceitar as duas formas. Nit.
- Ressalva 2 (pré-existente, mesma classe): hooks/vtt/useFoundryWindows.ts:219-240 (openAsPopup) e :295-313 (restore) ainda têm setRegistry aninhado dentro de setFloating. Não são toggle; pelo que li, o efeito duplicado seria só z maior, então não bloqueiam BV-004. O que fazer: item próprio para tirar esse aninhamento.
- Ressalva 3: wasFloating vem do closure de floating. Dois cliques antes do re-render usariam o mesmo valor. Com clique discreto o React costuma renderizar antes do próximo; nit.
- Não verificado aqui: portal. A sequência de cliques OK é relato do autor; não reproduzi no navegador.

## A-10b — guarda de limite de fichas na mesa (Lupa)
Parecer: APROVADO para a guarda por aventura, com ressalvas. A-10b não deve ser fechado inteiro.
- app/mesa/[roomId]/page.tsx:202-206 — ataca a causa: a contagem usa listCharactersForSessionUserInAdventureSafe, a mesma cadeia que o servidor usa em lib/character/characters.ts:268. Falha de banco devolve 0 (fail-open); aceitável, porque o servidor recusa.
- components/vtt/MesaWorkspace.tsx:470-471 — pendência: characterSlotsLeft é constante (page.tsx:202), então a guarda do limite global de fichas continua sem disparar antes do wizard. A linha A-10b do fichário cita as duas guardas. O que fazer: item próprio para o limite global, ou fechar só a metade por aventura.
- app/mesa/[roomId]/page.tsx:199 — comentário ficou falso: diz que as contagens saíram do SSR, e logo abaixo há contagem no SSR. O que fazer: atualizar. Nit.
- app/mesa/[roomId]/page.tsx:204-206 — a contagem vale só para fichas Eldarin. Mesa um-anel usa createTorCharacterFromWizard (lib/character/um-anel/characters.ts:181-186), sem limite por aventura, e a guarda aplica o 3 a qualquer sistema. Hoje não bloqueia TOR, mas o comentário mesma contagem que o servidor só vale para Eldarin. O que fazer: condicionar a contagem a rpgSystemId diferente de um-anel, ou ajustar o comentário. Nit.
- components/vtt/MesaWorkspace.tsx:601-603 — aviso só com ?criar=personagem. Com o limite, os botões recebem onOpenCharacterWizard indefinido (MesaWorkspace.tsx:642, 697, 780). Não verifiquei se somem ou ficam mudos. O que fazer: testar no navegador; se ficarem mudos, mostrar o mesmo aviso no clique.
- scripts/verify-limite-fichas-mesa.mjs:44-47 — teste confere texto, não que charactersInAdventure chega ao MesaWorkspace (page.tsx:248). Falharia sem a correção (checks 1, 2, 4 e 5), o que é bom. Nit.
- Verificado aqui: node scripts/verify-limite-fichas-mesa.mjs = 5 ok, exit 0. npx tsc --noEmit = exit 0. package.json mudou só no test. Sem texto novo com número, sem emoji, sem nome real.
- Não verificado: navegador (ponto 5) e a parte (a) da AUD 10 (casar 3, mensagem e doc), que depende da decisão A-10a.
- Sem commit.

## A-10b r2 — guarda de limite de fichas na mesa (Lupa)
Parecer: APROVADO. Nada bloqueia.
- app/mesa/[roomId]/page.tsx:202-205 — a contagem só roda com rpgSystemId eldarin; Um Anel fica 0. Certo: createTorCharacterFromWizard (lib/character/um-anel/characters.ts:181-186) não tem limite por aventura. Comentário falso trocado; o verify checa a ausência do texto antigo.
- components/vtt/MesaWorkspace.tsx — sem mudança nesta rodada (mesmo blob f8b3645 da r1). Botões conferidos sem precisar de código novo: PlayableCharactersPanel.tsx:325 some com o botão quando canCreateCharacter é falso. PlayerSpawnPanel.tsx:172 e :299 caem no link para /aventura/[id]/personagem/novo quando onCreateCharacter é indefinido, e essa página barra por aventura (personagem/novo/page.tsx:125) e globalmente (:113). Nenhum fica mudo.
- Pendência A-10c (fila 11): confere. O botão do PlayerSpawnPanel com handler ainda abre o wizard no limite global, porque characterSlotsLeft é constante. A recusa continua depois do wizard nesse caminho.
- scripts/verify-limite-fichas-mesa.mjs: nit da r1 segue aberto. Não confere que charactersInAdventure chega ao MesaWorkspace (page.tsx, prop perto de :248).
- Verificado aqui: node scripts/verify-limite-fichas-mesa.mjs = 6 ok, exit 0. npx tsc --noEmit = exit 0. package.json é JSON válido e o test inclui verify-limite-fichas-mesa.
- Não verificado: navegador (botões e aviso).

## BV-004b + A-12a — openAsPopup/restore sem setState aninhado; clamp no resize (Lupa)
Parecer: APROVADO, com ressalvas que não bloqueiam.
- hooks/vtt/useFoundryWindows.ts:225-246 (openAsPopup) e :300-317 (restore) — ataca a causa. setRegistry saiu de dentro do updater de setFloating; updaters de registry puros; floating vem do escopo; deps [floating]. Conferido contra o HEAD. Fecha as ressalvas 1 e 2 do BV-004.
- hooks/vtt/useFoundryWindows.ts:161-185 (A-12a) — ataca a causa. Clamp por rAF e listener de resize no mesmo effect; cleanup remove os dois; deps [hydrated, floating, roomId]. OK.
- scripts/verify-mesa-barra-lateral.mjs — HEAD falha (2x BV-004b + A-12a, exit 1); árvore de trabalho passa (exit 0). Aceita as duas formas de updater.
- Ressalva 1 (decisão do dono): o clamp no resize grava no registro e no localStorage. Uma janela do navegador estreita por instantes move as janelas flutuantes e elas não voltam ao lugar ao alargar. Decidir se o resize só ajusta a exibição, sem persistir.
- Ressalva 2: verify-mesa-barra-lateral.mjs (check A-12a) só casa a string addEventListener("resize"). Não confere que o handler é o clamp nem que o removeEventListener existe. Nit.
- Ressalva 3: openAsPopup agora muda de identidade a cada mudança de floating. components/vtt/MesaWorkspace.tsx:542-550 tem openAsPopup nas deps, mas o efeito é guardado por isActive; sem loop. Nit.
- Ressalva 4: dois openAsPopup no mesmo tick leriam floating desatualizado. Nenhum chamador faz isso hoje. Nit.
- Verificado aqui: git diff lido; npx tsc --noEmit = exit 0. eslint não roda (sem eslint.config), como no BV-005.
- Não verificado: navegador (resize real com janelas flutuantes).
- Sem commit. Sem regressão em PA, combate, sync, permissões ou privacidade. Sem texto de UI novo; sem emoji.

## A-12b — rótulos da barra de ícones no celular (Lupa)
Parecer: REPROVADO. Os rótulos continuam escondidos: a faixa de 47px mostra só 2 de 10.
- components/vtt/foundry/foundry.css:288 (.foundry-icon-bar__section, causa não tocada) — no @media 767 a seção segue em coluna, então os botões empilham dentro da faixa; só Status e Mapa aparecem. Medido em Chrome headless a 390x844, GM: 2 de 10 rótulos dentro da faixa. Sem a mudança a faixa também mostrava só esses 2 ícones. O que fazer: no @media 767, .foundry-icon-bar__section { flex-direction: row; width: auto; flex-shrink: 0 } e o divisor em vertical (width 1px; height 70%). Teste fora do repo com essa linha: 8 de 10 visíveis a 390; 10 de 10 a 740x360.
- components/vtt/foundry/foundry.css:2457 (.foundry-icon-bar__label, 7.2px) — mede 45.7px num botão de 38.4px; o texto passa da caixa. O '46 de 46' não reproduziu. O que fazer: encurtar o rótulo no celular ou alargar o botão.
- components/vtt/foundry/foundry.css:2462-2468 (scrollbar oculta) — sem barra, nada indica botões à direita. Com a seção corrigida, usar overflow-y: hidden na faixa. Nit.
- Outras telas: mobile-bar (MesaMobileBar.tsx) não usa essas classes; o dock em folha não contém a faixa; 1024 e 1900 medidos iguais ao HEAD (rótulos 8px). Landscape estreito (até 767) herda o problema da seção.
- Verificado aqui: git diff lido; medição por iframe 390x844, 740x360, 1024 e 1900 em Chrome headless; screenshot 390 com e sem a mudança. Não verificado: celular real.
- Sem commit. Nenhum arquivo do repo editado.

## A-12b r2 — seção em linha no celular + rótulos (Lupa)
Parecer: APROVADO, com ressalvas que não bloqueiam.
- components/vtt/foundry/foundry.css:2473-2483 — ataca a causa. .foundry-icon-bar__section vira linha e o divisor vira vertical só em max-width 767. Medido a 390x844 com GM: 8 de 10 rótulos dentro da faixa de 47px com hit no próprio rótulo; Mapa encosta na borda (fundo em 47.4 contra 47); Mestre e Invocar à direita, por rolagem horizontal. Sem a seção, o problema era o empilhamento, não o display.
- foundry.css:2473-2478 — a rolagem horizontal fica sem barra visível, então não há pista de que Mestre e Invocar existem. Decisão do dono: sugiro manter a barra oculta só com um degradê na borda direita, ou deixar a barra fina.
- foundry.css:2456-2460 (.foundry-icon-bar__section--gm, margin-top 0.1rem da linha 294) — no celular o grupo do mestre fica 1.6px mais baixo que o da jogador. Nit.
- foundry.css:2462-2468 — a faixa rola 3px na vertical (scrollH 50, clientH 47), sem barra visível. Com overflow-y: hidden some. Nit.
- Compêndio mede 45.7px num rótulo de 41.5px e passa 2px de cada lado; os vizinhos não colidem. Nit.
- Paisagem 740x360: 7 de 10 dentro da faixa; os 3 finais por rolagem. Aceitável.
- 1024 e 1900 medidos iguais ao HEAD (10 de 10, rótulos 8px). Dock em folha e mobile-bar não usam estas classes.
- Verificado aqui: git diff lido; medição por iframe 390x844, 740x360, 1024 e 1900 em Chrome headless. Não verificado: celular real e o portal Site local.
- Sem commit. Nenhum arquivo do repo editado.

## A-12b r3 — largura mínima 3.1rem, sombra de rolagem, margin-top 0 do mestre (Lupa)
Parecer: APROVADO, com ressalvas que não bloqueiam.
- components/vtt/foundry/foundry.css (bloco 767, background em 3 camadas da .foundry-icon-bar) — ataca a causa: a seção segue em linha. Medido a 390x844 com GM e Um Anel: Status a Convite dentro da faixa de 47px; Compêndio cabe (texto 45.7px em 46.4px); Mapa, Mestre e Invocar por rolagem. Sem o overflow-y hidden, a faixa ainda rolava 3px. Margin-top do mestre zerado.
- foundry.css (sombra da borda direita, 14px, rgba(0,0,0,.5)) — sobre o fundo quase preto da faixa a sombra escurece poucos níveis. Pelo contraste calculado, a pista é fraca. Não consegui confirmar pelo screenshot. Sugestão: uma luz clara de rgba(232,224,208,.12) no lugar da sombra escura. Decisão de design, não bloqueia.
- foundry.css (camada local #12110f, opaca) — a faixa base é rgba(18,17,15,.94). Nos 14px do fim da rolagem a cor pode ficar um tom diferente. Nit.
- Paisagem 740x360: 10 de 10 dentro da faixa.
- 1024 e 1900: 10 de 10, sem mudança frente ao HEAD.
- Verificado aqui: git diff lido; medição por iframe 390x844, 740x360, 1024 e 1900 em Chrome headless; screenshots de início e de fim de rolagem. Não verificado: celular real e o portal Site local.

## R-02 — auto-passe 150 -> 1500 ms (Lupa)
Parecer: REPROVADO como correção. Não é bug de código; é decisão de ritmo que o dono precisa tomar.
- lib/room/settings.ts:24 — a troca desfaz um ajuste deliberado: 1500 -> 500 (7cb3fba, passar turno rapido), 500 -> 280 (eb4f705), 280 -> 150 (1e34627, reduzir delays da mesa). docs/HISTORICO.md:5049 registra 150 como ajuste de performance. Os 1500 são o valor antigo, não a causa.
- Efeito: com PA = 0, o turno passa 10x mais devagar em toda sala sem valor salvo.
- lib/room/adventure-room.ts:39 grava DEFAULT_ROOM_SETTINGS na criação, e lib/room/settings.ts:40-42 mantém qualquer valor salvo >= 100. Salas antigas continuam com 150; só as novas pegariam 1500. Se a decisão for 1500, falta migração ou aviso.
- Fontes divergem: livros/LIVRO-DO-JOGADOR.md:253, PRD R22 e docs/VTT-ACOES-PA-AREAS.md:19 dizem cerca de 1,5 s; docs/COMBATE-MESA.md:116 e 448 dizem 500 ms. Nenhuma fonte documenta 150. Como o livro diz 1,5 s, 150 contradiz livros/: a escolha é do dono.
- O que fazer: o dono escolhe (a) 1500 com migração das salas e docs alinhados, ou (b) manter 150 e corrigir livros/, PRD e COMBATE-MESA. R-02 sai da fila (pagina 11) e vai para a pagina 03.
- Verificado aqui: npx tsc --noEmit sem erro; verify-pa-bank, verify-movement-pa, verify-turn-guard e verify-end-turn-confirm passaram. Nenhum verify cobre o padrão.
- Sem commit. Nenhum arquivo editado.

## A-12c — atalhos nas dicas da barra de mapa (Lupa)
Parecer: REPROVADO. Retângulo está certo; Ping e Névoa prometem atalho que não funciona como dito.
- components/vtt/MapToolbar.tsx:54 (Ping) — Alt+clique marca em qualquer ferramenta, exceto Régua: falso para Névoa. hooks/vtt/useBattlefieldPointer.ts:1220 (Névoa) retorna antes do Alt (1225), então Alt+clique em Névoa revela a célula. Também falha sobre token (ramo hit, antes) e fora de actionMode idle. O que fazer: trocar por exceto Névoa e Régua, em célula vazia.
- components/vtt/MapToolbar.tsx:56 (Névoa) — Ctrl+clique revela em qualquer ferramenta, exceto Régua: falso para Ping. useBattlefieldPointer.ts:1215 (Ping) retorna antes do Ctrl (1230), então Ctrl+clique marca ping. Ctrl sobre token seleciona (ramo hit). O que fazer: trocar por exceto Ping e Régua, em célula vazia.
- components/vtt/MapToolbar.tsx:64 (Retângulo) — OK. Alt vale no início (useBattlefieldPointer.ts:447) e no arraste (771, 1054).
- Texto em português, sem emoji. O title vira data-site-tip (NativeTitleBlockScript), então a dica aparece. Não é regressão.
- Verificado aqui: tsc sem erro. Nenhum verify cobre os textos de title. Se quiser guarda, um verify que confira os atalhos da barra contra os ramos do hook.
- Sem commit. Nenhum arquivo editado.

## A-12c r2 — títulos de Ping e Névoa (Lupa)
Parecer: REPROVADO. Os dois textos estão certos nos ramos citados, mas o de Ping omite a condição actionMode idle.
- components/vtt/MapToolbar.tsx:54 (Ping) — Alt+clique marca em célula vazia, exceto com Régua ou Névoa. Falta: a regra só vale com actionMode idle (useBattlefieldPointer.ts:1225). Com Andar (move-walk/move-run), Alt+clique em célula vazia move o token (1233-1234, onMove). Com Atacar ou Magia, o Alt não marca. O que fazer: 'Alt+clique marca em célula vazia sem ação em curso, exceto com Régua ou Névoa'.
- components/vtt/MapToolbar.tsx:56 (Névoa) — OK. Ctrl+clique em célula vazia com fogEnabled (1230) vale em qualquer actionMode; Ping e Névoa retornam antes (1215, 1220); Régua excluída pela condição. Sobre token, o ramo hit seleciona antes, e o texto diz célula vazia.
- Retângulo (linha 64) sem mudança. Hook e lib/room/settings.ts sem diff; R-02 fora desta revisão.
- Sem texto fora do português, sem emoji.
- Verificado aqui: npx tsc --noEmit exit 0. Nenhum verify cobre os textos de title.
- Sem commit. Nenhum arquivo editado.
- Sem commit. Nenhum arquivo do repo editado.

## A-22 + A-23 — sanitizar descrição do compêndio e isentar .btn-primary na toolbar (Lupa)
Parecer: REPROVADO. A correção do CompendiumBrowser e a do CSS estão certas, mas a mesma causa do A-22 continua aberta em outra tela.
- components/compendium/MonsterCompendiumSheet.tsx:89 e :267 — descriptionHtml (entry.system.description ou template.description) vai cru para dangerouslySetInnerHTML. É a mesma origem do A-22. O que fazer: envolver em sanitizeCompendiumHtml na linha 89 e incluir essa tela na checagem do verify.
- lib/compendium/format.ts:16 (sanitizeCompendiumHtml) — OK. Tags fora da lista somem, atributos somem, '<' solto vira &lt;, e todo '<' de saída nasce de tag da lista, sem atributos. Os JSON do compêndio usam só p, strong, li, em, ul; a lista cobre tudo, sem perda de formatação.
- components/character/sheet-ddb.css:1698 e :1712 — OK. Sem a isenção, o gradiente da toolbar sobrescreve o fundo de app/globals.css:1012 em .btn-primary. Não verifiquei no navegador.
- scripts/verify-a22-a23-sanitize-botoes.mjs (regras A-23) — confere se o texto da regra existe no CSS, não o efeito; passaria mesmo com a regra inútil. Ressalva, não bloqueia.
- package.json (script test) — 'verify-a22-a23-sanitize-botoes.mjs &&npm' sem espaço antes do npm. Funciona no sh; nit.
- Verificado aqui: verify-a22-a23-sanitize-botoes 9 ok; verify-compendium-ui 15 ok; npx tsc --noEmit exit 0.

## A-10c — limite de fichas por conta na mesa (Claude Code)
Parecer: APROVADO, com ressalvas que não bloqueiam.
- app/mesa/[roomId]/page.tsx:219-220 — ataca a causa: characterSlotsLeft desconta accountSheets.length, contado com a mesma regra do servidor (createCharacterFromWizard em lib/character/characters.ts:245 e createTorCharacterFromWizard em lib/character/um-anel/characters.ts:185). Max por sistema correto; Math.max(0, ...) evita negativo.
- app/mesa/[roomId]/page.tsx:204-216 — contagens no mesmo Promise.all; visitante e quem não pode participar não consultam (Promise.resolve([])). A conta é materializada igual à rota (app/api/characters/route.ts:52). Nada de nome real sai para o cliente: só o número.
- lib/character/characters.ts:145-155 — ressalva: listCharactersForSessionUserSafe devolve [] se o banco falhar. Nesse caso a mesa mostra 10 vagas, o wizard abre e o servidor recusa só no fim. É o mesmo comportamento de antes, restrito a falha de banco. O que fazer: aceitar e registrar como risco, ou não mostrar vaga quando a contagem falhar.
- scripts/verify-limite-fichas-mesa.mjs:50-60 — testes são regex no código-fonte; não exercitam a contagem nem o clamp. Não são vazios: os checks de characterSlotsLeft e de listCharactersForSessionUserSafe falhariam sem a correção (o padrão antigo canParticipate ? maxCharactersPerUser : 0 é o que o primeiro rejeita). O que fazer: aceitar; teste de comportamento se houver harness.
- Git avisa LF -> CRLF em scripts/verify-limite-fichas-mesa.mjs. Nit: conferir finais de linha antes do commit.
- Verificado aqui: node scripts/verify-limite-fichas-mesa.mjs = 10 ok, 0 falha. npx tsc --noEmit = exit 0. Navegador não testado: o botão e o aviso com 10 fichas não foram conferidos na tela.
- Sem regressão em PA, combate, sync, permissões ou privacidade. Sem texto de UI novo; sem emoji. Nenhum arquivo do repo editado.
- Sem commit. Nenhum arquivo do repo editado.

## N-02 — mensagem de erro do servidor sem termo de mantenedor (Claude Code)
Parecer: APROVADO. Os 9 arquivos tiram npm run, DATABASE_URL e migrate da mensagem ao jogador; o detalhe foi para console.error com prefixo [tag]. Ressalvas que nao bloqueiam:
- lib/auth/auth-capabilities.ts:54 — 'cadastros novos exigem MariaDB no servidor' aparece para o visitante em /entrar (app/entrar/page.tsx:36). Fica fora dos 9 arquivos e a guarda nao cobre MariaDB. O que fazer: abrir item N-02b com este texto e lib/auth/password-recover.ts:65 ('requer banco MariaDB em producao').
- scripts/verify-sem-texto-dev.mjs, literaisDeCodigo — qualquer literal que comeca com [tag] sai da checagem, inclusive um throw para o jogador. Hoje nao ha caso. O que fazer: filtrar so o que esta dentro de console.error/console.warn, nao todo prefixo [tag].
- scripts/verify-sem-texto-dev.mjs, DIAGNOSTICO — lib/db/client.ts, client-mariadb.ts e enabled.ts ficam fora. GET /api/health (publico) devolve dbUrlIssue com npm run homolog:up. E de operacao, nao tela de jogador: aceitar e registrar.
- Verificado aqui: node scripts/verify-sem-texto-dev.mjs = 15 ok, 0 falhas. npx tsc --noEmit = exit 0. A guarda acusa os 8 arquivos na versao do HEAD (1 a 7 infracoes cada), entao o teste falharia sem a correcao.
- Sem commit. Nenhum arquivo do repo editado.

## BAL-D6 — Feiticeiro conjura com Carisma (Claude Code)
Parecer: APROVADO com ressalvas que não bloqueiam.
- lib/combat/attack.ts:477-489 — ataca a causa: Feiticeiro saiu do case Mago e entrou no grupo carisma. Mago segue com inteligencia.
- Atributo de conjuração: CD (lib/combat/spell.ts:66), acerto (attack.ts:495 via attackAttribute, hit-chance.ts:196), cura (attack.ts:947 e spell-utility.ts:91) e rótulo (spell.ts:50, attack.ts:504 são só mapas de nome). Todos passam por spellcastingAttribute. Nenhum decide por classe fora dele.
- Ressalva 1: lib/character/spell-prep.ts:55-57 — limite de magias conhecidas do Feiticeiro usa a tabela de data/character/spell-lists.json (2 + nível-1), não nível + CAR como manda LIVRO-DO-JOGADOR.md:1142. Fora deste diff. O que fazer: item separado.
- Ressalva 2: lib/combat/spell-parse.ts:245 — saveDc vem de spell.save.cd. Hoje nenhum dado tem cd, então não sobrepõe. Se um dia vier com CD fixa, passa por cima do cálculo com CAR. O que fazer: registrar.
- Ressalva 3: lib/character/sheet-skills.ts:182 — salvaguarda proficiente do Feiticeiro = INT + CAR. Não é conjuração e não conferi no livro. O que fazer: conferir separado.
- Verificado aqui: node scripts/verify-feiticeiro-carisma.mjs = 6 ok; npx tsc --noEmit = exit 0; npm run test:pa = OK. Os testes chamam spellcastingAttribute e computeSpellSaveDc reais; pelo código, falhariam sem a correção (CD daria 9 com INT).
- package.json: só a linha do test mudou. Não rodei o npm test completo.
- Sem commit. Nenhum arquivo do repo editado.

## BAL-D6b e D6c — revisão (Claude Code)
Parecer: D6b APROVADO. D6c REPROVADO.
- lib/character/spell-prep.ts:54-56 — D6b ataca a causa: o ramo Feiticeiro lia a tabela do JSON (known ?? ...) e nunca chegava à fórmula. Agora é max(2, nivel + CAR), igual a livros/LIVRO-DO-JOGADOR.md:1142 ('mín. 2') e :3498. Mínimo 2 confere.
- scripts/verify-feiticeiro-carisma.mjs:116-133 — nv1/nv3/nv5 com CAR 15 esperam 3/5/7; o HEAD daria 2/4/6 (tabela 2 + (nv-1)), então falham sem a correção. O caso CAR 8 só guarda o mínimo e passa nos dois lados.
- scripts/verify-feiticeiro-carisma.mjs:140-142 — D6c REPROVADO: o comentário cita livro:1135 para salvaguarda de CAR, mas o livro só diz 'Atributos Primários: Carisma'. Atributo primário não é proficiência em salvaguarda. Como sheet-skills.ts não mudou, o caso passa no HEAD também: não cobre correção nenhuma. O que fazer: tirar a afirmação de livro do comentário e do título do caso (dizer que é regra do código, não confirmada pelo livro), ou remover o caso.
- Pendente, fora de D6c: INT como salvaguarda do Feiticeiro segue sem confirmação no livro; o verify não cobre INT.
- Rodei: node scripts/verify-feiticeiro-carisma.mjs = 11 ok, 0 falha. Não rodei tsc nem npm test completo.
- Reprovação de D6c resolvida (20/11/2026): caso de salvaguarda de CAR e import de isSaveTrained removidos do verify. Verify 10 ok, 0 falha; sheet-skills.ts sem mudança. D6c APROVADO.

## BV-018 r2 — guardas por revisão (Lupa)
Parecer: REPROVADO.
- components/vtt/Battlefield.tsx:752 — a guarda de syncRoom também barra o caminho direto (ramo não deferido, linhas 790-797). Sem banco, o servidor reinicia com revision 1 (lib/room/adventure-room.ts:45 e backfill; registry.ts sem DB). O cliente segue com ~40 e descarta as respostas com force de syncRoom (Battlefield.tsx:1405, 1583, 1612, 1755) até a revisão passar de 40. No HEAD isso só acontecia no efeito da linha 1172. O que fazer: pôr a guarda só antes de pendingCombatSnapRef.current = snap (linha 757) e nos caminhos de pending (flush 1149, applyCombatSnapshot 671), ajustar o caso 2 do verify; ou registrar a limitação do modo sem banco.
- Revisão do servidor: com banco é monotônica na prática (lib/room/internal/registry.ts:172-177; revision +1 em :92). Sem banco não é.
- scripts/verify-bv018-flush-revisao.mjs: só casa texto e ordem de índice. Um comentário com a guarda, ou um return fora do ramo, passaria. Nit: caso 3b passa no HEAD, como esperado.
- Verificado aqui: verify na working copy = 8 ok, exit 0; verify contra o HEAD (git show) = falha nos casos 1, 2 e 3a. npx tsc --noEmit = exit 0. useBattlefieldCombatFxQueue.ts sem alteração. Não rodei npm test completo.
- Sem commit. Nenhum arquivo do repo editado.

## BV-018 r3 — sem parecer (Lupa)
Parecer: não emitido. Na hora da revisão, Battlefield.tsx, package.json e scripts/verify-bv018-flush-revisao.mjs não estavam mais no working tree (sem stash, sem commit). Bigorna informou que parou o pedido e avisou o Regente para desfazer.
- Snapshot de r3 guardado no scratchpad (base.tsx, 16:15). Leitura estática: guarda no ramo deferido correta; pendência: no modo sem banco, o ramo deferido ainda descarta a resposta durante FX ou movimento até a revisão passar da antiga.
- Verify: variante sem espaço e com chaves no caminho direto passaria, pois a regex exige ') return'. Pela leitura, não executado.
- Lupa, revisão em 20/11/2026.

## N-02b — textos de /entrar e recuperação (Lupa)
Parecer: REPROVADO.
- app/entrar/page.tsx:71 — ainda mostra ao jogador, na mesma tela de /entrar, 'Servidor sem banco — cadastro com e-mail funciona só enquanto o container estiver no ar.' (condição: !persistentAccounts e emailLogin). É o detalhe de mantenedor que N-02b devia tirar, e a frase nova de authLoginLead ('Novos cadastros estão indisponíveis no momento') contradiz esta: uma diz que cadastro está fora, a outra que funciona enquanto o container estiver no ar. O que fazer: trocar ou remover o parágrafo, deixando uma só mensagem coerente, e fazer o verify varrer app/entrar/page.tsx por banco, container e variável de ambiente.
- scripts/verify-sem-texto-dev.mjs (bloco N-02b): a negativa só procura as duas frases antigas. Por isso não pegou o app/entrar/page.tsx:71. O que fazer: ampliar a varredura do /entrar.
- lib/auth/password-recover.ts:49 e :54 seguem citando /conta. É rota real do jogador, então não é detalhe de mantenedor; só registrar. Já o :65 manda falar com o suporte, sem caminho de /conta. Vale confirmar que /conta não salva CPF sem banco, para justificar a diferença entre os ramos.
- Residual da mesma classe, fora do escopo: lib/auth/session-user.ts:37 'Não foi possível criar sua conta no banco' chega ao jogador.
- Verificado aqui: verify-sem-texto-dev.mjs = 19 ok, 0 falhas; npx tsc --noEmit = exit 0. Sem commit. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## BV-022 — alcance em células de quatro habilidades (Lupa)
Parecer: APROVADO com ressalvas que não bloqueiam.
- scripts/generate-compendium.mjs: Julgamento Ardente 9 para 6 (linha 583), Carga do Juramento 6 para 8 (linha 591), Mente Partida 6 para 12 (linha 595), Puxão Abissal 5 para 6 (linha 601). Conta confere com 1 célula = 1,5 m: 9m = 6, 12m = 8, 18m = 12, 9m = 6.
- Textos do livro conferidos em livros/LIVRO-DO-JOGADOR.md: Julgamento 9m (linha 3048), Carga 12m (3080), Mente Partida 18m (3100), Puxão 9m (3132).
- data/compendiums/habilidades.json: diff com 4 linhas alteradas (numstat 4/4). Só essas quatro entradas mudaram.
- npm run sync:data:check: OK, exit 0 (7 compêndios, 83 monstros, um-anel 148). tsc --noEmit: exit 0.
- Ressalva 1: livros/CATALOGO-HABILIDADES-TATICAS.md:77 ainda diz Puxão Abissal alcance 5. É o bookRef do gerador e fica em desacordo com o JSON, que agora diz 6. O que fazer: corrigir a linha do catálogo para 6 (é fonte, em livros/).
- Ressalva 2 (fora do item, para decidir): mesma classe em outras entradas. Correntes Infernais tem 3 células e 'Selo de sangue 3m' (daria 2). Manto de Bruma tem 3 células e 'Névoa 6m' (daria 4), mas pode ser área e não alcance. Decidir antes de mexer.
- Nota: HEAD já tem o Agarrão em 6 (BV-012 foi commitado por outro agente), então o diff de hoje tem só este item.
- Sem commit. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-02 — CONTEXTO-SESSAO-ATUAL.md sem branch e PR #3 em curso (Lupa)
Parecer: APROVADO com ressalvas que não bloqueiam. Só doc; git status mostra só este arquivo.
- docs/CONTEXTO-SESSAO-ATUAL.md:9-10 — 'Fonte atual do andamento' aponta para docs/fichario/00-indice-e-andamento.md, que existe. Branch e PR #3 saíram do topo; não sobrou URL de PR nem o branch cursor/dice-box-combat no topo.
- Seções 'Estado do PR #3' e 'Próximos passos' estão marcadas como registro histórico (linhas 64 e 86-94). Bem feito.
- Ressalva 1 (nit): a seção 'O que foi feito nesta sessão' (linhas 16-60) não tem marca de histórico. O aviso do topo diz que o andamento está no fichário, mas essa seção segue no tempo presente. O que fazer: acrescentar '(registro histórico)' ao título.
- Ressalva 2 (nit): linha 36 ainda diz 'branch inteira'. Texto de histórico, pouco relevante. Trocar por 'conjunto de mudanças' se quiser limpar.
- Links internos conferidos: CLAUDE-CODIGO-SEGURO.md, CLAUDE-PROJETO.md, HISTORICO.md, docs/HISTORICO.md e docs/fichario/00-indice-e-andamento.md existem.
- Sem commit. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## A-18 r2 — robots e sitemap (Lupa)
Parecer: APROVADO com ressalva que não bloqueia.
- app/sitemap.ts:6 — PAGINAS_PUBLICAS = /, /compendios, /privacidade. /rpg/eldarin e /rpg/um-anel saíram, certo: redirecionam para login sem sessão (app/rpg/eldarin/page.tsx:14-15; app/rpg/um-anel/page.tsx:14-15).
- Conferido à mão que as três são abertas: app/page.tsx, app/privacidade/page.tsx e app/compendios/page.tsx não têm redirect nem getSession. /compendios chama getSession dentro de CompendiumPage (components/compendium/CompendiumPage.tsx:25), mas sem sessão usa role null e renderiza os pacotes visíveis, sem redirecionar.
- app/robots.ts:5-8 — allow '/' com disallow /api/, /admin, /mesa/, /conta, /aventura/, /painel e /personagem/. Bate com o pedido.
- Ressalva (nit): scripts/verify-robots-sitemap.mjs confere a lista exata e os disallow, mas não que as três páginas do sitemap são abertas. Sugiro um teste que falhe se alguma tiver redirect(...) ou getSession com redirect. Hoje isso depende da leitura manual acima.
- Verificado aqui: node scripts/verify-robots-sitemap.mjs = OK, exit 0; npx tsc --noEmit = exit 0. package.json e rotas intactos. Sem commit. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## A-18 — robots e sitemap, r1 (Lupa)
Parecer: REPROVADO.
- app/sitemap.ts (lista PAGINAS_PUBLICAS) — /rpg/eldarin e /rpg/um-anel não são públicas. Sem sessão, redirecionam para o login: app/rpg/eldarin/page.tsx:14-15 e app/rpg/um-anel/page.tsx:14-15 (redirect(signInPath(...)) quando getSession() é nulo). O sitemap manda indexar URLs que só levam ao login, o que contradiz 'cinco páginas públicas'. Não há redirect em /, /compendios e /privacidade. O que fazer: tirar as duas do sitemap (ficam 3) ou torná-las públicas; e o verify deve checar que cada página do sitemap não tem redirect de sessão.
- scripts/verify-robots-sitemap.mjs — confere a existência das rotas, mas não se são públicas. Por isso não pegou o item acima.
- app/robots.ts — allow '/' sem disallow libera /api, /admin, /mesa, /conta, /aventura, /painel e /personagem. Você já marcou como ponto para decidir. Minha recomendação: manter allow '/' e acrescentar disallow para /api/, /admin, /mesa/, /conta, /aventura/, /painel e /personagem/. Assim a intenção 'indexar o público' fica explícita e o resto fica fora. A decisão é sua.
- Não há noindex nem 'robots:' em lib/app/components, e o middleware não bloqueia /robots.txt nem /sitemap.xml (middleware.ts:66). O canal de indexação está livre.
- Verificado aqui: node scripts/verify-robots-sitemap.mjs = OK, exit 0; npx tsc --noEmit = exit 0. Sem commit. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## A-09 — pool (bankedPa) fora do log do mestre (Lupa)
Parecer: APROVADO com ressalva que não bloqueia.
- components/vtt/GmCombatLogPanel.tsx:104 — tirou o ' +X pool'. Ataca a causa do que o log mostrava: o rótulo do pool legado. O gasto do turno continua.
- Conferido no código: bankedPa é campo legado (lib/combat/pa-turn.ts:37, 51 'Funde bankedPa legado no pool'); os escritores atuais gravam 0. A regra de PA ainda soma o legado: materializeCombatPa (lib/combat/pa-token-state.ts:10-14) entra em PaDotMeter, ActiveCharactersPanel e MapTokenList. Por isso manter banked nesses mostradores está certo.
- Ressalva: token antigo com bankedPa > 0 salvo em banco faria o log do mestre mostrar PA menor que os mostradores compactos. Não achei nenhum dado com bankedPa diferente de 0 em data/. Se quiser fechar, mostrar pa + bankedPa no log, ou registrar que o legado é zerado na leitura.
- scripts/verify-pa-bank.mjs: as checagens de fonte conferem o que o item diz (log sem bankedPa, ActiveCharactersPanel e MapTokenList passando banked, PaDotMeter com bankedPa). Verificado aqui: verify-pa-bank: OK, exit 0. Nit: as checagens leem fonte, não renderizam o log.
- npx tsc --noEmit = exit 0. Sem commit. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## N-02b r3 — aba Criar conta só com contas persistentes (Lupa)
Parecer: APROVADO com ressalvas que não bloqueiam.
- components/auth/AuthTabs.tsx — podeCadastrar = persistentAccounts; tabAtiva força login sem contas persistentes; o botão Criar conta e o RegisterForm ficam dentro de {podeCadastrar ? ... : null}. Ataca a causa: a aba não deve existir sem contas persistentes.
- components/auth/RegisterForm.tsx:82-86 — aviso trocado por 'Novos cadastros estão indisponíveis no momento.' Fica sem efeito na tela, porque o formulário não é renderizado sem contas persistentes; é só salvaguarda.
- Ressalva 1 (a decidir): app/api/auth/register continua aceitando cadastro sem banco, pelo registro local (lib/auth/user-store.ts, ramo sem dbSqlReady). A UI esconde a aba, mas a frase 'indisponíveis' vale só para a tela. O que fazer: ou travar a rota quando !persistentAccounts, ou registrar que a API continua aceitando por escolha (escopo fora desta correção).
- Ressalva 2: o verify confere o ternário por regex e o texto por varredura; não renderiza a página. Aceitável para o padrão do projeto. Nit.
- Verificado aqui: verify-sem-texto-dev.mjs = 30 ok, 0 falhas; npx tsc --noEmit = exit 0. Sem commit. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## N-02b r2 — /entrar sem detalhe de banco (Lupa)
Parecer: REPROVADO.
- components/auth/RegisterForm.tsx:85-87 — a aba Criar conta de /entrar (AuthTabs.tsx:39 renderiza RegisterForm sempre) mostra ao jogador, sem banco: 'O servidor está sem banco de dados: a conta criada agora pode sumir se o site reiniciar.' Em HEAD esse texto já estava ali e o r2 não tocou. Ainda expõe termo técnico e contradiz authLoginLead ('Novos cadastros estão indisponíveis'): o formulário de cadastro continua disponível na mesma tela. O verify não pega porque varre só app/entrar/page.tsx.
- O que fazer, em uma das duas direções: (a) se cadastro fica indisponível sem banco, esconder a aba ou o formulário de RegisterForm quando !persistentAccounts; ou (b) se cadastro continua, tirar a frase de authLoginLead e trocar o aviso por algo sem 'banco de dados', ex.: 'Sua conta pode sumir se o site reiniciar.'. Em qualquer caso, incluir components/auth/AuthTabs.tsx, RegisterForm.tsx e LoginForm.tsx na varredura do /entrar.
- Verificado aqui: verify-sem-texto-dev.mjs = 22 ok, 0 falhas; npx tsc --noEmit = exit 0 (app/entrar/page.tsx mudou). Sem commit. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## BV-012 — Alcance do Agarrão do Pacto 5 para 6 células (Lupa)
Parecer: APROVADO com ressalvas que não bloqueiam.
- scripts/generate-compendium.mjs:594 — ataca a causa: a linha do catálogo tinha 5 e o texto diz Tentáculos 9m. Com 1 célula = 1,5 m, 9 m = 6 células. Confere com livros/LIVRO-DO-JOGADOR.md:3098 (Nv 12). Diff de uma linha só.
- Regeneração verificada no scratchpad (cópia do gerador, sem tocar no repo): habilidades.json muda só a linha 1020, de 5 para 6.
- Ressalva 1: rodar só o gerador NÃO é seguro. Ele reescreve monstros.json sem as entradas assim-001-* (6804 linhas de diferença), que o passo sync-monster-assimilation-abilities.mjs adiciona depois. Para regenerar, usar o pipeline completo (npm run sync:data) e conferir o diff.
- Ressalva 2: nenhum teste cobre o alcance do Agarrão. O que fazer: um verify que confira 6 no habilidades.json gerado (falharia hoje, de propósito, até a regeneração).
- Ressalva 3, mesma classe, fora deste item: pelo texto do próprio gerador, Julgamento Ardente (9 m) está com 9 células, Mente Partida (18 m) com 6, Puxão Abissal (9 m) com 5 e Carga do Juramento (12 m) com 6. Conferir no livro antes de mexer.
- Verificado aqui: diff do arquivo, geração em scratchpad (exit 0). Não rodei tsc (sem mudança em TS). Sem commit. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.
- Lupa, revisão em 20/11/2026.

## D-12 — PA guardado respeita o teto do pool (Lupa)
Parecer: REPROVADO.
- lib/room/handlers/combat-gm.ts:268 — ao subir de nível pelo GM, pontosAcao.value = Math.min(current, paMax), ou seja, 5. Ficha com 8 PA cai para 5. É a mesma causa do D-12, fora dos quatro arquivos. O que fazer: usar paPoolMaxForSheet no lugar de paMax (o identity novo já está montado ali).
- lib/room/handlers/gm-actor-progress.ts:57 — mesmo problema; o normalizeCharacter chamado depois não restaura o valor. Mesmo ajuste.
- scripts/verify-pa-guardado-ficha.mjs — cobre só normalize.ts. identity.ts (applyIdentityPatch) não tem caso. Conferi à mão no scratchpad: 8 fica 8, 12 vira 9. O que fazer: incluir um caso que chame applyIdentityPatch.
- Os quatro arquivos pedidos estão corretos: npm run test:pa OK, verify-pa-guardado-ficha 3 ok 0 falha, npx tsc --noEmit exit 0. package.json tem a linha do script no test.
- components/vtt/Battlefield.tsx está modificado no working tree, fora do D-12; não revisei.
- Lupa, revisão em 20/11/2026.

## D-13 — cena velha na FX e no flush, revisão do servidor sem banco (Lupa)
Parecer: REPROVADO.
- components/vtt/Battlefield.tsx:1187-1190 — o efeito que aplica o snapshot da prop sai cedo se snap.revision <= applied. Depois de um reinício sem banco, o refresh() (linhas 672 e 1161) traz revisão menor, esse efeito descarta, e a cena nova não aparece até um syncRoom sem FX e sem movimento. Era a pendência do r3, e não foi coberta. O que fazer: quando a revisão vem de refresh e é menor que applied, tratá-la como nova referência, ou tirar essa comparação do efeito.
- components/vtt/Battlefield.tsx:757-759 — no ramo deferido, a guarda continua com applied alto. A resposta nova vai para pendingCombatSnapRef, o flush (1159-1163) a descarta e chama refresh, que cai no item anterior. O mesmo vale para moveSelectedTo (1922-1926), que só grava a cena se rev >= applied. Não confirmei pelo código se o onApplySnapshot do pai aplica o movimento nesse caso.
- components/vtt/Battlefield.tsx:804 — o caminho direto grava applied = snap.revision sem limite. Uma resposta atrasada (revisão menor, sem reinício) rebaixa a referência, e a guarda da FX deixa passar cena velha. O que fazer: só aceitar a queda quando a revisão veio confirmada pelo servidor após refresh.
- Revisão 0: isStaleSceneRevision (667-670) está certo. Nit: o caminho direto grava applied = 0 para snap sem revisão (804) e desliga a guarda até a próxima revisão.
- Loop de refresh: não encontrei. O resultado do refresh entra pelo efeito da prop (item 1), não por applyCombatSnapshot, então não gera outra cena velha. Inferido pelo código, não testado.
- Troca de sala: o efeito de roomId (1168-1171) zera applied. Ok.
- Sem verify no diff para D-13. scripts/verify-bv018-flush-revisao.mjs não existe no working tree.

## D-13 r2 — guardas com revisão monotônica (Lupa)
Parecer: REPROVADO.
- components/vtt/Battlefield.tsx:757-759 (ramo deferido de syncRoom) — a resposta de revisão 9, chegando depois da 10, grava pendingCombatSnapRef = 9 e sobrescreve a 10 pendente. applied continua 10 (759 só sobe). O flush descarta a 9 e chama refresh. O efeito da prop (mapUnchanged, perto da linha 1190) sai cedo porque 10 <= applied, então os tokens protegidos da 10 ficam com a cena antiga até a próxima revisão. Isso é o ponto 2 da minha r2 (guarda antes da linha 757), que não entrou. O que fazer: no ramo deferido, if (snap.revision < appliedSceneRevisionRef.current) return; antes de gravar o pending e de chamar onApplySnapshot, ou gravar o pending só se a revisão for maior ou igual à guardada.
- Resposta à pergunta (a): com revisão monotônica, a guarda de applyCombatSnapshot e a do flush só descartam rev menor que applied, ou seja, cena já superada. Não vi outro caso de descarte indevido. O problema é o do item acima, que é anterior à guarda.
- Resposta à pergunta (b): moveSelectedTo (1921-1926) aplica a própria resposta quando rev >= applied e sempre chama onApplySnapshot(force, immediate). Se já houver revisão maior aplicada, a resposta vai para o pai ou para syncRoom direto, que não tem guarda e pode reverter a cena para a mais antiga. Isso já existia e o diff não mexe nele. Fica como risco fora do escopo.
- Resposta à pergunta (c): não encontrei loop. Com revisão monotônica, o refresh devolve rev igual ou maior que applied. No primeiro caso o efeito retorna; no segundo aplica a cena e sobe applied. A pendência é limpa antes do refresh, e o refresh é debounced e enfileirado no useRoomSync. Inferido pelo código, não testado.
- Verificado aqui: npx tsc --noEmit exit 0. Navegador não testado. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-13 r3 — pendente só troca por revisão maior ou igual (Lupa)
Parecer: REPROVADO, com o ponto (a2) fechado.
- components/vtt/Battlefield.tsx:765-769 — fecha (a2): a resposta 9 não substitui a pendente 10, e o flush aplica a 10 quando a FX terminar. Ok.
- components/vtt/Battlefield.tsx:771-789 — a resposta 9 continua entrando no ramo deferido. Ela vai para onApplySnapshot (771) e para o merge parcial (776-789), que repinta os tokens não protegidos com a posição da 9 durante a FX. Isso é o sintoma do BV-018 (token voltando para a célula antiga), só que transitório. O que fazer: antes de onApplySnapshot e do merge parcial, if (snap.revision < appliedSceneRevisionRef.current) return; (pode manter playCombatFxFromSnapRef se for preciso). Sem isso a resposta velha ainda é aplicada ao tabuleiro.
- Verificado aqui: npx tsc --noEmit exit 0 (rodada anterior, sem mudança de tipo nesta rodada). Navegador não testado. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-13 r4 — retorno antecipado para revisão menor no ramo deferido (Lupa)
Parecer: APROVADO, com ressalvas que não bloqueiam.
- components/vtt/Battlefield.tsx:770 (if (isStaleSceneRevision(snap.revision)) return;, no início do ramo deferido) — fecha o ponto de 771-789 da r3: a resposta velha não toca pendente, onApplySnapshot, merge parcial nem FX. A guarda usa revisão > 0, então a revisão 0 passa; o applied não é rebaixado aqui.
- Ressalva 1 (sobre o efeito de pular a FX): a FX lê snap.chat (hooks/vtt/useBattlefieldCombatFxQueue.ts:70-100), e essas mensagens já foram vistas pela resposta mais nova. Isso parte de chat cumulativo no servidor, que não conferi. Se não for cumulativo, uma FX só presente na resposta velha se perde. Nit, verificar no servidor.
- Ressalva 2 (já existia, fora do trecho): o caminho direto de syncRoom, sem ramo deferido, ainda não tem guarda; grava a cena e chama onApplySnapshot mesmo com revisão menor. Não entrou neste diff e não bloqueia esta rodada.
- Verificado aqui: leitura do trecho e da FX. Não rodei tsc nesta rodada. Navegador não testado. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-12 r2 — clamps de PA guardado no level-up e na comida (Lupa)
Parecer: REPROVADO.
- lib/culinary/apply-meal.ts:96 — a refeição grava pontosAcao.value = Math.min(max, value + paRestored), com max = 5. Com 8 PA guardados, paRestoredByMealQuality (meal-rules.ts:49) devolve 0 (missing = max(0, 5 - 8) = 0), e a ficha cai para 5. É o mesmo clamp que a causa do D-12 descreve, e não está nos arquivos da lista. O que fazer: prender no teto do pool, value = Math.min(paPoolMaxForSheet(actor), value + paRestored); o paRestored pode continuar calculado contra o max. Incluir um caso no verify (8 + comum ou gourmet continua 8 ou sobe até 9).
- Ressalva 1: combat-gm.ts (level-up-all, 252-270) e gm-actor-progress.ts (applySetLevel, 38-62) estão corretos: o teto é calculado com o nível novo e os talentos após reset. Nenhum dos 5 casos do verify cobre esses dois handlers. Não bloqueia sozinho, mas é o caminho que a r1 já tinha deixado escapar.
- Ressalva 2: o verify confere normalize e applyIdentityPatch, com 8 e 12. Nada novo a apontar nele.
- Verificado aqui: node scripts/verify-pa-guardado-ficha.mjs = 5 ok, exit 0; npm run test:pa = exit 0; npx tsc --noEmit = exit 0. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-12 r3 — refeição não corta PA guardado (Lupa)
Parecer: APROVADO.
- lib/culinary/apply-meal.ts:96-102 — value = Math.max(value, Math.min(max, value + paRestored)). Com 8 PA, paRestored é 0 (missing = max(0, 5 - 8)) e o resultado fica 8. Com 3 PA e comum, paRestored é 1 e o resultado é 4. Fecha a causa: a refeição não reduz mais o PA guardado.
- scripts/verify-pa-guardado-ficha.mjs — 7 casos, incluindo os 2 de refeição (8 continua 8; 3 + comum vira 4). Confere com o comportamento acima.
- Ressalva 1: a busca por escritas em pontosAcao.value encontrou só esses pontos corrigidos. monsters.ts (NPC) está fora do escopo do D-12.
- Ressalva 2: o caso de refeição usa comum. Não há caso com gourmet e 8 PA. A matemática cobre, mas um caso a mais seria barato.
- Verificado aqui: node scripts/verify-pa-guardado-ficha.mjs = 7 ok, exit 0; npm run test:pa = exit 0; npm run test:culinary = exit 0; npx tsc --noEmit = exit 0. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.
- Verificado aqui: npx tsc --noEmit exit 0. Navegador não testado. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-11 r1 — arma aprimorada +N no dano (Lupa)
Parecer: REPROVADO, com 1 achado.
- lib/combat/attack.ts:1051 e :1197 — o resumo do crítico e o detalhe do chat imprimem só os dados e o mod de atributo. Com Adaga +2 sai "Dano 3 = 5": o +2 entra no total, mas não aparece na conta. O que fazer: incluir o +N no DamageBreakdown (campo opcional flatBonus, preenchido em rollActionDamage, attack.ts:526) e mostrar "+N" nessas duas linhas.
- scripts/verify-arma-aprimorada.mjs — os 9 casos cobrem actionFromEntry, rollActionDamage (crítico incluso) e o chip, e falhariam sem a correção. Nenhum cobre formatAttackChatDetail: incluir um caso que confira o +2 na linha de dano.
- Confirmado: +N soma uma vez no normal e no crítico (attack.ts:526-546); não entra no ataque (só ataque.bonus); tooltip (action-tooltip.ts:94) e chip (format.ts:85) corretos. Magias não têm enchant (0 em magias.json).
- Verificado aqui: verify-arma-aprimorada 9 ok; verify-compendium-ui 15 ok; npx tsc --noEmit exit 0. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-11 r2 — +N no chat e no resumo do crítico (Lupa)
Parecer: APROVADO.
- lib/combat/attack.ts:1051 e :1197 — o resumo do crítico e formatAttackChatDetail mostram +N (flatBonus). Chat: Dano 3+2 = 5.
- rollActionDamage (attack.ts:526-546): +N entra uma vez no normal e no crítico; flatBonus fica no breakdown só para exibição.
- scripts/verify-arma-aprimorada.mjs: 12 casos, incluindo a linha de dano do chat com +2 e sem +N na Adaga comum. Falhariam sem a correção.
- Ressalva (nit, não bloqueia): o crítico mostra "(3+4+-1)" quando o mod de atributo é negativo. Esse formato já existia antes do D-11.
- Verificado aqui: verify-arma-aprimorada 12 ok; verify-compendium-ui 15 ok; verify-pa-bank OK; npx tsc --noEmit exit 0. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-07 r1 — vida temporária ao subir de nível (Lupa)
Parecer: REPROVADO.
- lib/room/handlers/combat-gm.ts:267 — a ação level-up-all (GM sobe todos os personagens) remonta resources.vida só com max e value, e a vida temporária some. A causa do D-07 continua aberta aqui: é o quarto ponto do mesmo padrão, num caminho de subir de nível. O que fazer: no objeto vida, incluir ...(current.resources.vida.temp !== undefined ? { temp: current.resources.vida.temp } : {}), como em level-up.ts:299. O verify não cobre este handler.
- lib/character/rebuild-from-wizard.ts:37 (recalcResourcesAtLevel) — vida: { value, max } sem temp. Vale para prepareCharacterForLastLevelReedit (linha 73), que refaz o último nível: a vida temporária some ao reeditar. O que fazer: o mesmo spread, e um caso no verify.
- Ressalva, fora do D-07: lib/room/handlers/gm-actor-progress.ts:151 (set-hp) também grava vida sem temp. Não é subir de nível. Decidir se o GM ajustar a vida deve manter a temporária; se for bug, abrir item próprio.
- Ressalva: docs/PRD-MESA-UM-ANEL.md aparece modificado no git status e não faz parte do D-07. Não entrar no commit deste item.
- Verificado aqui: verify-vida-temporaria-nivel 5 ok; verify-vida-temporaria 2 ok; npm run test:pa OK; npx tsc --noEmit sem erros. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-07 r2 — vida temporária nos caminhos de nível e set-hp (Lupa)
Parecer: APROVADO.
- Os caminhos do D-07 copiam temp: identity.ts:92, level-up.ts:299, rebuild-from-wizard.ts:37, combat-gm.ts:270 (level-up-all), gm-actor-progress.ts:60 (applySetLevel) e :151 (set-hp). Conferido linha a linha.
- verify-vida-temporaria-nivel.mjs: 8 casos chamam os handlers reais (executeGmCombatAction level-up-all, executeGmActorProgress set-hp, prepareCharacterForLastLevelReedit). Sem a correção, cada um falha no expect de temp 4.
- Busca por outros remontes de resources.vida em lib e app: os restantes (combat-attack, combat-consume, apply-meal, keepRoomVitals) já usam spread ou temp explícito.
- Ressalva (nit): a reconstrução completa da ficha (rebuild-from-wizard.ts:139, nível 1) também mantém temp. Confirmar que é o desejado.
- Ressalva: git status mostra docs/fichario/02-bugs-e-decisoes.md modificado, fora da lista de exclusão do commit. Deve ficar fora do commit também.

## D-09 r1 — ficha não gravada avisada no editor de retrato (Lupa)
Parecer: REPROVADO, com 1 achado bloqueante e 3 ressalvas.
- lib/character/portrait-sheet-saved.ts:7 — a mensagem "A imagem foi aplicada na mesa, mas não foi salva na ficha" também aparece ao remover a imagem (PortraitEditorFields.tsx:81, clearPortraitOnRoom). Ali o texto diz que algo foi aplicado quando foi removido. O que fazer: usar um texto que sirva aos dois casos, por exemplo "A mesa foi atualizada, mas a ficha não foi salva. Tente de novo.", e ajustar a string esperada em scripts/verify-d09-sheet-saved.mjs:180-184.
- Confirmado: updateRoomActor (actors.ts:82-87) devolve sheetSaved false quando persistActorToAdventureSheet falha (adventure-actors.ts:229-233; lib/character/characters.ts:224-225 só lança com banco ligado). Sem a correção, o caso "ficha falha" do verify não passa. PortraitEditorPanel.tsx:126 mantém o rascunho quando onPersist lança, e SheetPopupPortrait.tsx:134-142 não fecha o popup. O fluxo de salvar está certo.
- Ressalva (não bloqueia, escopo): sheetSaved só é lido pelo editor de retrato. Continuam engolindo a falha: inventário (CharacterSheet.tsx:309), ficha (CharacterSheet.tsx:339), loadout, magias, identidade e set-hp (combat-gm.ts:358). Se D-09 é só retrato, abrir item próprio para o resto.
- Ressalva (pré-existente, mesmo arquivo): levelUpRoomActor (actors.ts:106-107) não tem catch. Se a ficha falhar, vira erro 500 com room.actors já trocado em memória e sem persistRoom. Não é D-09: abrir item próprio.
- Teste (nit): os casos de UI (verify-d09-sheet-saved.mjs:205-210) só procuram o texto no código-fonte. Passariam se a chamada de remoção sumisse, porque a regex acha a outra.
- Verificado aqui: npm run test:d09-sheet-saved 8 ok, 0 falha; npx tsc --noEmit exit 0. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-09 r2 — remoção com mensagem própria (Lupa)
Parecer: APROVADO.
- Achado r1 corrigido: lib/character/portrait-sheet-saved.ts:10-11 define SHEET_NOT_CLEARED_MESSAGE sem "aplicada". components/character/PortraitEditorFields.tsx:84 usa essa mensagem no onClear, via o 3o parametro de assertRoomPortraitSheetSaved (portrait-sheet-saved.ts:20). O salvar (PortraitEditorFields.tsx:74 e SheetPopupPortrait.tsx:140) segue com a mensagem padrão.
- Ressalvas da r1 seguem em aberto e não bloqueiam: sheetSaved só é lido no editor de retrato (inventário, ficha, loadout, magias, identidade, set-hp em combat-gm.ts:358); levelUpRoomActor (actors.ts:107) sem catch. Abrir item próprio para os dois.
- Verify: scripts/verify-d09-sheet-saved.mjs cobre a remoção com caso de comportamento (189-194) e regex de UI para os dois editores (213-228). A regex de remoção casa só a chamada com SHEET_NOT_CLEARED_MESSAGE, então a r1 de "a regex acha a outra" está resolvida.
- Verificado aqui: npm run test:d09-sheet-saved 10 ok, 0 falha; npx tsc --noEmit exit 0. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.
- Verificado aqui: verify-vida-temporaria-nivel 8 ok; verify-vida-temporaria 2 ok; npm run test:pa OK; npx tsc --noEmit exit 0. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

## D-14 e D-15 r1 — cadastro sem banco e PA do log do mestre (Lupa)
Parecer: APROVADO, com 2 nits que não bloqueiam.
- Causa D-14 conferida: app/api/auth/register/route.ts:9 usa getAuthCapabilities().persistentAccounts, a mesma fonte de app/entrar/page.tsx:70 e de dbSqlReady no user-store. A checagem vem antes de request.json e de registerUser.
- Causa D-15 conferida: resolveGmLogPa (lib/combat/pa-display.ts:13) faz materializeCombatPa(token, paMax), a mesma conta de PaDotMeter.tsx:50 e de resolvePaHudDisplay. ActiveCharactersPanel e MapTokenList passam banked={t.bankedPa}. O log não mostra mais t.pa cru.
- Frase preservada: authLoginLead gera o mesmo texto de antes. PT-BR, sem emoji.
- Verificado aqui: verify-d14 OK; verify-d15 OK; npm run test:pa OK; npm run test:auth 12 passaram, 0 falharam; npx tsc --noEmit exit 0. Git: só os 5 arquivos pedidos e os 2 novos; sem commit.
- Nit (lib/combat/pa-display.ts:13-17): resolveGmLogPa repete o início de resolvePaHudDisplay. Trocar o corpo por resolvePaHudDisplay(token).spendable; resultado idêntico.
- Nit (scripts/verify-d15-gm-log-pa.mjs): confere só o texto do código, não o número. O padrão do repo é esse (58 de 66 verify usam readFileSync), então aceito. Sem a correção os dois verify falham, porque o texto esperado não existe no arquivo.
- Lupa, revisão em 20/11/2026.

## D12 r2 — verify de comportamento e npm test (Lupa)
Parecer: APROVADO.
- Teste de comportamento real: classLevelFeatures do rules.ts, sem regex. Antes da correção, os casos 1 e 2 falhariam (nivel 5 anunciava 'Fluxo Marcial ... Chi a menos').
- Verificado aqui: node scripts/verify-d12-chi-sem-fluxo.mjs 3 ok; npx tsc --noEmit exit 0; npm test exit 0 (cadeia inclui o verify-d12 antes de test:um-anel).
- Nit: scripts/verify-d12-chi-sem-fluxo.mjs:58 casa só o texto 'Chi a menos'; reescrever o anuncio sem essa frase passa sem erro. Aceito.
- Nit: scripts/verify-d12-chi-sem-fluxo.mjs e nao rastreado (git status ??). Entrar no mesmo commit que rules.ts e package.json.
- Lupa, revisão em 20/11/2026.

## D12 r1 — Fluxo Marcial do Espiritualista (Lupa)
Parecer: REPROVADO, com 1 achado bloqueante e 2 ressalvas.
- Bloqueante (teste ausente): o plano em docs/fichario/propostas/balanceamento.md (secao 4.2) pede scripts/verify-d12-chi-sem-fluxo.mjs. O arquivo não existe e não está na cadeia de npm test (package.json:44). Nada trava a regressão. O que fazer: criar o verify chamando classLevelFeatures('Espiritualista', 5) e checando que não contém Fluxo Marcial (sem a correção, falha), e incluí-lo no npm test.
- Correção conferida: lib/character/rules.ts:608 removido. git grep -i 'fluxo marcial' fora de docs sem resultado. chi-economy.ts:8 mantém CHI_SPEND_CAP_PER_TURN = 2 e canSpendChi não tem desconto, então o texto era promessa sem motor. Remover é a correção certa.
- Livro confere: LIVRO-DO-JOGADOR.md:920 e :1167 dizem 10 Chi por combate, máximo 2 por turno, sem regra de nível 5. Livro não foi editado (git status só mostra rules.ts), e não precisa.
- Ressalva (docs, não bloqueia): docs/fichario/propostas/balanceamento.md:306 e secao 4.2 ainda descrevem a linha 608 como existente. Atualizar ao fechar o item.
- Ressalva (pré-existente, fora do D12): lib/character/rules.ts:611 'Corpo Transcendente, Chi máximo 12 neste combate' (nível 20) não aparece em livros/. Abrir item próprio.
- Verificado aqui: npx tsc --noEmit exit 0; npm test exit 0. Nenhum arquivo do repo editado.
- Lupa, revisão em 20/11/2026.

