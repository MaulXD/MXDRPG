# 08 Revisão

Pareceres do Revisor: APROVADO ou REPROVADO, com achados.

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

