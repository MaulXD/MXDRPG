# 06 Bugs ao vivo

Bugs achados navegando no site local. Um bloco por bug, ID BV-001 em diante.

Conta de teste (dados ficticios): e-mail farejador.teste01@example.com | senha Teste12345 | apelido farejador_teste01 | nome Farejador Teste | CPF 12345 | nascimento 1995-05-10.
Conta jogador (dados ficticios, ETAPA 9): e-mail jogador.teste02@example.com | senha Teste12345 | apelido jogador_teste02 | nome Jogador Teste Dois | CPF 12345 | nascimento 1996-07-22.

Andamento:
- ETAPA 1 em curso: cadastro ok (vai para /mesas); sair e entrar ok; /painel redirecionaria para /mesas (rota legada por desenho, nao e bug); aventura criada pelo lobby de /rpg/eldarin (aventura-teste-farejador-8sghq) ok; wizard de personagem concluido (Lira Teste Farejador: Humano, Guerreiro, Explorador, Espada e cota, Sem Deus, sem retrato); ao criar, redireciona para /mesa/aventura-teste-farejador-8sghq com tour '1 / 5' (Pular/Anterior/Proximo); ficha aberta em /personagem/pc-mwp8u5ew sem erro no console (Vida 13 = d10 + CON; salvaguardas e pericias batem com os atributos).

ETAPA 1 concluida: cadastro, sair e entrar, pagina inicial, painel (redireciona para /mesas, legado), aventura, wizard ate o fim e ficha. Bugs de severidade alta: nenhum. Dev only: 1 aviso de console (BV-001).

## BV-001 Aviso de console: scroll-behavior no html (P3)
- Severidade: P3 (so aparece em npm run dev)
- Passos: criar aventura em /rpg/eldarin e entrar na sala /mesa/aventura-teste-farejador-8sghq; ler o console.
- Esperado: nenhum aviso.
- Obtido: aviso do Next.js sobre scroll-behavior smooth no html.
- Erro do console: [warn] Detected `scroll-behavior: smooth` on the `<html>` element. In a future version, Next.js will no longer automatically disable smooth scrolling during route transitions. To prepare for this change, add `data-scroll-behavior="smooth"` to your <html> element.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

### BV-020 (P2) Aviso de hidratação no título da mesa (dev) — DUPLICATA de BV-006/BV-009
Regente (16:22): não é bug novo. NativeTitleBlockScript troca title por data-site-tip no load; em dev a hidratação às vezes chega depois. Sem ação.
- Passos: abrir http://localhost:3000/mesa/aventura-teste-farejador-8sghq e ler o console (logs-start ativo antes da navegação).
- Esperado: a página hidrata sem divergência entre HTML do servidor e cliente. O projeto proíbe o atributo title nativo (NativeTitleBlockScript o remove).
- Obtido: erro no console: A tree hydrated but some attributes ... didn't match. Diferença: no cliente aparece title="Estado da conexão ao vivo com a mesa" no <p class="mesa-sync-indicator mesa-sync-indicator--loading">, que não existe no HTML do servidor.
- Erro do console: hydration-mismatch (react.dev/link/hydration-mismatch), ao carregar a mesa.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq
- Observação: teste de combate (item 2 da fila) interrompido antes do fim; ver relato ao Regente. Não confirmado: mover a Lira com drag ou clique+hover+clique não mudou a posição (status mostrou "Mesma célula", PA 0). Pode ser gesto do portal, não bug do site; a investigar.

## BV-018 Atacar com a Lira ao lado do Goblin 2 responde Alvo invalido; a area de ataque fica no ponto antigo (P1, a confirmar)
- Severidade: P1 (impede atacar um monstro adjacente no combate)
- Passos: Lira em q-7, r-1 e Goblin 2 em q-3, r-1. Mover a Lira para q-4, r-1 (Mover pelo anel, clique direito no token). Clique direito na Lira de novo, clicar Atacar. Clicar no Goblin 2.
- Esperado: alvo valido; Goblin 2 perde HP; Lira gasta 2 PA.
- Obtido: a area vermelha de ataque aparece centrada em q-7, r-1 (onde a Lira estava antes de mover), nao em q-4, r-1. Clicar no Goblin 2 mostra 'Alvo invalido para esta acao' (2 vezes). Goblin 2 segue 8/8.
- Erro do console: nenhum (logs-start ativo).
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-019 PA da Lira nao cai apos mover (P2, a confirmar)
- Severidade: P2 a confirmar; se o PA gasto aparece so no fim do turno, nao e bug
- Passos: Lira com 9 PA; clique direito, Mover (anel mostra 1 PA); clicar na celula a 3 cel. (q-4, r-1).
- Esperado: a Lira anda 3 cel. e o HUD mostra PA 8/9 (ou o gasto de 1 PA da Caminhada).
- Obtido: a previa dizia 'PA: 1 - Restam 8/9', mas depois do movimento o HUD inferior e o anel continuam em 9 PA.
- Erro do console: nenhum (logs-start ativo).
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq
ETAPA 2 em curso (mesa, conta de teste ja logada, aventura aventura-teste-farejador-8sghq): tour da mesa pulado; mapa vazio, sem tokens. Janela Personagens jogaveis lista Lira Teste Farejador (13/13 PV). Tentei colocar Lira no mapa por arrastar e por clicar celula+ficha: nao apareceu token. Tentei invocar Goblin por arrastar: nao apareceu. Ver BV-002 a BV-004. Atualizacao: Lira apareceu no mapa (token L) depois de entrar em combate; nao confirmei se foi o arrasto ou o modo combate. Feito: token da Lira (confirmado na tela), modo combate, ordem de turno, aplicar vida 13 para 7 e 9 e recarregar (9/13 persistiu, ficha mostra 9/13), rolagem de salvaguarda CON, chat (mensagem e recarga), Passar turno (R1 para R2 sem confirmacao). Nao testado ainda: mover token gastando PA, invocar monstro no mapa, atacar, monstro atacar Lira, magia ou habilidade. Por isso ETAPA 2 esta PARCIAL.

## BV-002 Render em loop na mesa: 'Maximum update depth exceeded' (P1)
- Severidade: P1 (flood de erros e possivel travamento; so aparece em npm run dev)
- Passos: entrar como mestre em /mesa/aventura-teste-farejador-8sghq; deixar parado 10 s; ler o console. Depois clicar no mapa e abrir janelas (Invocar, Ferramentas do mestre, Chat).
- Esperado: nenhum erro parado.
- Obtido: ao ficar parado, cerca de 140 erros a cada 5 s, sem nenhuma acao. Centenas no total na sessao.
- Erro do console: [error] Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-003 Mesa nao atualiza ao vivo: vida e chat so aparecem depois de recarregar (P1)
- Severidade: P1 (se outros jogadores tambem nao veem, contraria o uso de mesa; nao testei com segunda conta)
- Passos: como mestre, na janela Ferramentas do mestre, digitar 7 em Vida atual e clicar APLICAR VIDA. Olhar o card de Lira na janela Personagens jogaveis por 4 s. Depois digitar uma mensagem no Chat e clicar ENVIAR.
- Esperado: card mostra 7/13 na hora; mensagem aparece na lista do chat na hora.
- Obtido: card continua 13/13 depois de aplicar 7; depois de aplicar 9 continua 7/13. Cada valor so aparece no card depois de recarregar (7/13, depois 9/13). Mensagem some do campo mas nao aparece na lista. Depois de recarregar, aparecem as duas mensagens, a rolagem de salvaguarda (1d20=20+5=25) e a vida 9/13. Os dados foram gravados; so a tela nao atualiza.
Status ETAPA 13: PARCIAL. Chat corrigido ao vivo: mensagem do mestre e do jogador aparece no outro lado em ate 1 s, com o chat aberto nos dois. Vida: nao testavel ao vivo, porque o APLICAR VIDA nao gravou (ver BV-051).
- Erro do console: nenhum proprio (ver BV-002).
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-004 Atalho da barra lateral nao abre painel (Invocar e Ficha) (P2, a confirmar)
- Severidade: P2; confirmar se o desenho exige outro gesto
- Passos: clicar no icone Ficha ou Invocar na barra lateral esquerda (clique simples). Ler o aria-pressed do botao.
- Esperado: o painel abre na barra lateral (dica do icone: 'Clique: barra lateral').
- Obtido: aria-pressed continua false, o painel nao abre. Clique direito abre a janela flutuante normalmente.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-005 Passar turno sem tela de confirmacao (P2, a confirmar com o livro)
- Severidade: P2; se o desenho exige confirmacao, vira P1
- Passos: com Lira em combate (R1, 'Seu turno'), clicar PASSAR na barra inferior.
- Esperado: pedido de confirmacao antes de passar.
- Obtido: passou direto. A ordem foi para R2 e Lira ficou AGORA. Sem dialogo.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

ETAPA 2b em curso (como mestre, conta Farejador). Passo 1 (invocar monstro) nao concluido: ao clicar Invocar na barra lateral, a mesa mostrou "erro ao carregar" (console: [error] [mesa] erro ao carregar: {}, 2 vezes), com botao TENTAR DE NOVO. Depois de recarregar, a pagina inteira virou Build Error do Next.js (ver BV-007). Passos 2 a 7 nao executados ate o servidor voltar.

## BV-007 Pagina da mesa vira Build Error do Next.js (fonte Cinzel) (ambiente, nao e bug do app)
- Severidade: era P0 no dev; RESOLVIDO COMO AMBIENTE, nao e bug do app. Causa (informada pelo Raul): cache do servidor de desenvolvimento misturado com um build de producao. Limpo e religado; a mesa abre normal.
- Passos: abrir /mesa/aventura-teste-farejador-8sghq; clicar Invocar na barra lateral; ver "erro ao carregar" e TENTAR DE NOVO; recarregar a pagina.
- Esperado: mesa carrega; Invocar abre o painel.
- Obtido: overlay vermelho do Next.js "Build Error" em toda a pagina: Module not found: Cannot resolve @vercel/turbopack-next/internal/font/google/font, em [next]/internal/font/google/cinzel_93ec4639.module.css, importado por ./app/layout.tsx. Mensagem: "next/font/google queries have exactly one entry". Repetiu em 2 recargas.
- Erro do console: [error] [mesa] erro ao carregar: {} (x2, antes do overlay).
- Nota: app/layout.tsx nao tem mudanca nao commitada (git status limpo nesse arquivo); suspeita de cache do Turbopack ou falha ao buscar a fonte do Google no ambiente. Nao mexi em codigo.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

BV-007 marcado como ambiente, nao e bug do app (o Raul informou: cache do dev server misturado com build de producao; limpo e religado).

ETAPA 2b, passo 1 (invocar): Goblin escolhido em Invocar, preview ok, mas COLOCAR NA MESA fica disabled mesmo com Goblin selecionado. Arrastar a linha do Goblin ate uma celula ao lado da Lira (portal drag) nao colocou token; clicar na celula tambem nao. Pode ser limitacao do portal com arrastar (HTML5), ou bug do fluxo de invocar. A confirmar. Passo 2 (mover Lira gastando PA): clique no token e na celula ao lado nao moveu; PA continua 9 no HUD. Ainda a tentar.

## BV-008 Passar o mouse no mapa nao gera celula alvo (COLOCAR NA MESA e mover token ficam travados pelo portal) (P2, a confirmar)
- Severidade: P2; se o hover do mapa for o unico jeito de colocar token, vira P1 (bloqueia invocar e mover).
- Passos: Invocar, clicar Goblin na lista, passar o mouse numa celula vazia perto da Lira (portal hover 870,595 e 872,597); ler o texto Celula alvo no painel e o botao COLOCAR NA MESA.
- Esperado: aparece Celula alvo: q.., r.. e COLOCAR NA MESA habilita (MonsterSpawnPanel.tsx:262, spawnAxial).
- Obtido: nenhum texto Celula alvo; COLOCAR NA MESA continua disabled (confirmado pelo DOM). Mover Lira com hover no token, click, hover na celula, click: Lira nao andou, PA 9/9.
- Duvida: o portal pode nao disparar mousemove no canvas. Nao confirmado se e limitacao do portal ou bug do app.

ETAPA 3 em curso (fora do mapa, conta Farejador). Passo 1 (compendios Eldarin): aba Armas aberta, card Adaga de Masmorra clicado, detalhe aparece embaixo da grade (abaixo dos cards, precisa rolar). Console com erro de hidratacao em todos os cards (BV-009).

## BV-009 Compendio: erro de hidratacao em todos os cards (title e data-site-tip) (P3, so em npm run dev)
- Severidade: P3 (aviso no console; texto do tooltip pode diferir entre servidor e cliente)
- Passos: abrir http://localhost:3000/compendios/armas com logs-start antes da navegacao; ler o console.
- Esperado: nenhum aviso de hidratacao.
- Obtido: erro de hidratacao em cada CompendiumIcon (span.comp-icon-art): no cliente vem title="Arco"/"Lanca" e data-site-tip, no servidor title=null e sem data-site-tip.
- Erro do console: [error] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties... (diff: + title="Lanca" / - title={null} / - data-site-tip="Lanca")
- URL: http://localhost:3000/compendios/armas

Passo 1 concluido (compendios Eldarin, 3 ou 4 entradas por aba, lidas pelo detalhe embaixo da grade): Armas (Adaga de Masmorra, +1, +2, +3), Habilidades (3), Magias (3), Equipamentos (3), Consumiveis (3). Console sem erro novo nas abas (so BV-009 em Armas). Bestiario ainda nao localizado. Bugs de texto e de dados abaixo (BV-010 e BV-011).

## BV-010 Armas +1/+2/+3: a linha de dano nao mostra o bonus de aprimoramento (P2, a confirmar com o livro)
- Severidade: P2; se o livro manda somar o dano na ficha/lista, vira P1 (dano errado na mesa)
- Passos: /compendios/armas, clicar Adaga de Masmorra, Adaga de Masmorra +1, +2 e +3; ler a linha de chips e o texto do detalhe.
- Esperado: a linha de dano mostra o bonus (ex.: Dano 1d4+1 perfurante), coerente com o texto 'Aprimoramento +1: soma +1 ao ataque e +1 ao dano'.
- Obtido: chips dizem 'Dano 1d4 perfurante' nas tres; so o texto corrido fala em +1, +2 e +3 de dano. Ataque +1/+2/+3 aparece certo nos chips.
- Erro do console: nenhum.
- URL: http://localhost:3000/compendios/armas

## BV-011 Magias e catalogo: texto sem acento e concordancia (P3)
- Severidade: P3 (texto; pode ser so da fonte .md, confirmar)
- Passos: /compendios/magias, clicar Animacao de Mortos e Armadura Arcana; ler o detalhe.
- Esperado: acentos corretos e concordancia (ex.: 'Médios', 'cadáveres', 'proficiência', 'Abjuração', '1 célula').
- Obtido: 'Anima ate 2 cadaveres Medios ou menores; podem Extração com proficiencia'; no rodape da Armadura Arcana 'Abjuracao' (sem acento) enquanto o cabecalho diz 'Abjuração'; '1 células' no rodape. Na magia Aprimoramento Biomagico (corpo do texto) falta acento em 'assimilacao'.
- Erro do console: nenhum.
- URL: http://localhost:3000/compendios/magias

## BV-012 Agarrao do Pacto: alcance em cel e distancia em metros nao batem (P3, a confirmar)
- Severidade: P3 (so se o livro usar a mesma unidade)
- Passos: /compendios/habilidades, clicar Agarrao do Pacto; ler a linha de alcance e o texto.
- Esperado: alcance e texto em unidades coerentes (ou o livro explica a conversao).
- Obtido: chip 'Alcance 5 cel.' e texto 'Tentaculos 9m'. Nao sei se 9m equivale a 5 celulas no livro.
- Erro do console: nenhum.
- URL: http://localhost:3000/compendios/habilidades

## BV-023 Correntes Infernais e Manto de Bruma: alcances a conferir (P3, a confirmar)
- Severidade: P3 a confirmar; ressalva 2 da Lupa na revisao de BV-022.
- Sintoma no gerador: Correntes Infernais tem 3 celulas com texto Selo de sangue 3m (daria 2); Manto de Bruma tem 3 celulas com texto Nevoa 6m (daria 4, talvez area).
- Esperado: cada alcance em celulas bater com os metros do texto e do livro.
- Regente (16:55): conferir no LIVRO-DO-JOGADOR.md antes de corrigir; item 23c na pagina 11.
- Sem edicao de codigo neste item.

Passo 1b: bestiario nao achado. Nao ha aba Bestiario no Eldarin (abas: Armas, Habilidades, Magias, Equipamentos, Consumiveis). Ver BV-013.

## BV-013 Bestiario ausente; rota /compendios/monstros mostra Armas (P2, a confirmar)
- Severidade: P2; se o bestiario deveria estar no compendio Eldarin, vira P1
- Passos: abrir http://localhost:3000/compendios/monstros (e tambem /compendios/bestiario); ler o titulo da aba e a lista.
- Esperado: titulo Monstros e lista de monstros (bestiario). Se nao existir, a rota deveria dar erro ou voltar ao indice, nao outra categoria.
- Obtido: titulo da aba 'MXDRPG — Monstros', mas o cabecalho diz Armas e a grade mostra as armas (Adaga de Masmorra, +1, +2, +3...). /compendios/bestiario e /compendios/xyz-inexistente tambem caem em Armas (224 cards). Nao ha link de bestiario na pagina.
- Erro do console: nenhum relacionado.
- URL: http://localhost:3000/compendios/monstros

Passo 2 (compendio Um Anel, 5 entradas de Culturas: Bardos, Anoes do Povo de Durin, Elfos de Lindon, Hobbits do Condado, Homens de Bri): textos OK, console sem erro. Ponto a checar com o livro: 'Bom-senso Hobbit' diz 'ganha (1d) em todos os Testes de Sombra', a notacao (1d) parece estranha.

Passo 3 (ficha da Lira fora da mesa, /personagem/pc-mwp8u5ew): cabecalho, atributos, pericias, salvaguardas, tracos e culinaria batem entre si. Sem botao de nivel (XP 0/100, esperado). Aba Inventario abre com Espada Longa e Kit de Trinchar, sem erro. Ver BV-014.

## BV-014 Ficha fora da mesa: Pontos de acao 9/5 (atual acima do maximo) (P2, a confirmar)
- Severidade: P2; se o maximo de PA deveria ser 9 (como na mesa), vira P1 (contradiz a regra de PA)
- Passos: abrir /personagem/pc-mwp8u5ew (Lira, fora da mesa); olhar o bloco Pontos de acao.
- Esperado: PA atual nao passa do maximo; maximo igual ao da mesa.
- Obtido: Pontos de acao 9/5 (barra vermelha cheia). Na mesa, o HUD mostrava PA 9/9 (BV-002 a BV-005, passo 2). Maximo diverge entre ficha e mesa.
- Erro do console: nenhum.
- URL: http://localhost:3000/personagem/pc-mwp8u5ew

Passo 3 concluido: abas (Inventario, Tesouro, Habilidades, Magias, Bestiario Pessoal) abrem; PDF clicado sem erro no console; level-up nao aparece (XP 0/100, esperado). Ao testar o PDF, uma rodada anterior mostrou o portal em /mesa/aventura-teste-farejador-8sghq (Invocar aberto) sem explicacao; nao reproduzi depois (ver nota no fim).

Passo 4: /mesas (Escolha seu RPG, Eldarin e Um Anel) OK; /amigos OK (sem amigos; perfil so aparece dentro da tela de amigos, nao testado); /privacidade OK (LGPD, ultima atualizacao junho de 2026). /perfil e /perfil/<apelido> dao 404 sem link de perfil (provavel desenho, a confirmar). Ver BV-015.

## BV-015 Paginas legais: /termos da 404 e o rodape nao tem link de termos de uso (P3, a confirmar)
- Severidade: P3; se o site precisa de termos de uso para o cadastro, vira P2
- Passos: abrir http://localhost:3000/termos; abrir /privacidade e ler os links do rodape.
- Esperado: pagina de termos de uso acessivel e linkada no rodape junto da Privacidade.
- Obtido: /termos mostra 404. O rodape de /privacidade tem so o link Privacidade.
- Erro do console: nenhum.
- URL: http://localhost:3000/termos

Nota: o PDF e a navegacao para /mesa ocorreram em rodadas diferentes; nao reproduzido na nova tentativa (1 vez).

Passo 5 (390x844, depois voltou a 1900x1191): compendio Armas e Habilidades sem overflow horizontal (scroll 375 de 390), detalhe ocupa a largura; ficha da Lira sem overflow, abas e PDF presentes. Erro de hidratacao de BV-009 se repete no mobile (mesmo erro, nenhum novo). Fim da ETAPA 3.
- Erro do console: nenhum relacionado (logs vazios apos as acoes).
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-016 Goblin 1 nao aparece no mapa (fora da tela, nao e bug)
- Severidade: nao e bug. Goblin 1 esta na borda direita do mapa (q23, r-6), longe da Lira (q-7, r-1); com zoom 45% aparece. Confirmado pelo mestre.
- Passos: abrir /mesa/aventura-teste-farejador-8sghq com o combate ativo; olhar o mapa; reduzir o zoom com o botao -; olhar o painel Ordem de turno.
- Esperado: Goblin 1 com token no mapa, ou indicacao na Ordem de turno de que esta fora da tela.
- Obtido: a Ordem de turno lista o Goblin 1 (avatar G), mas o mapa mostra so o token da Lira, mesmo com zoom em 104%. O rotulo Ativar turno de Goblin 1 existe na arvore de acessibilidade, sem posicao no mapa.
- Passo extra: clicar no avatar G do Goblin 1 na Ordem de turno trocou o icone para um ponto vermelho. Nao e bug do mapa até prova em contrario; a confirmar.
- Erro do console: nenhum (logs-start ativo).
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-017 Mover a Lira por clique simples nao aplica o movimento (gesto e clique direito, nao e bug)
- Severidade: P2 a confirmar; se o movimento funciona so com outro gesto (arrastar), e so ajuste de passos; se nao funciona em nenhum gesto, vira P1 (turno do jogador travado)
- Passos: no turno da Lira, passar o mouse sobre a Lira (aparece o alcance de 4 cel.); clicar na Lira; passar o mouse na celula a 3 cel. dela (ao lado do Goblin 2, q-4, r-1) e clicar.
- Esperado: a Lira anda ate a celula, PA cai de 9 para 6 (ou o gasto de 3 cel. conforme a regra), e o Goblin 2 fica adjacente.
- Obtido: a Lira continua em q-7, r-1; PA 9/9; o overlay de alcance some quando o mouse sai do token. Nenhuma mensagem de erro no console.
- Erro do console: nenhum (logs-start ativo).
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-021 Previa de movimento valida, mas o clique nao confirma (P2, a confirmar)
DECISAO maestro (21/11): fica para teste com mouse de verdade (do dono). Hover e clique usam o mesmo canMoveToken; a suspeita e a celula do clique (useBattlefieldPointer.ts:1035) ou o clique sintetico do portal. Nao mexer sem reproduzir.
- Severidade: P2 a confirmar; bloqueia o teste de combate do item 2 da fila
- Passos: mesa /mesa/aventura-teste-farejador-8sghq; anel da Lira em (782,596) aberto com clique direito; escolher Mover; passar o mouse na celula vizinha (782,540) e clicar.
- Esperado: a Lira anda 1 celula e o PA do HUD muda.
- Obtido: o hover mostra Este passo 1 cel., Rota 1 passos, Apos mover 0/4 celulas; o clique normal devolve Sem rota — celula bloqueada ou fora do alcance e o dispatch de pointerdown + pointerup + click no canvas devolve Mesma celula. A Lira fica em (782,596) com 6 PA. Pode ser gesto do portal, nao confirmado como bug do app.
- Regente (16:26): reproduzido no portal Site local. Sem edicao de codigo.
VEREDITO Bigorna (21/11): (c) nao da para dizer so pelo codigo. Nao testei no Bigorna. O calculo e o mesmo no hover e no clique: ambos chamam canMoveToken com as mesmas entradas (components/vtt/Battlefield.tsx:1885 no clique; hooks/vtt/useBattlefieldHighlights.ts:314 no hover; displayScene = scene, Battlefield.tsx:360). Entao 'Sem rota' no clique so pode vir de outra celula: o clique usa axialAtScreen no pointerup (hooks/vtt/useBattlefieldPointer.ts:1035) e o hover usa outro caminho (useBattlefieldPointer.ts:667/734). Hipotese a confirmar: o clique sintetico do portal manda coordenadas erradas (o mesmo teste deu 'Mesma celula'). Para testar: hover e clique com o mouse real no Portal Bigorna; se 'Sem rota' persistir, logar axial do clique e do hover em useBattlefieldPointer.ts:1035 e useBattlefieldHighlights.ts:313.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-022 Outros alcances de habilidades podem estar errados (P3, a confirmar)
- Severidade: P3 a confirmar; ressalva 3 da Lupa na revisao de BV-012.
- Sintoma no gerador: Julgamento Ardente diz 9 m com 9 cel.; Mente Partida diz 18 m com 6 cel.; Puxao Abissal diz 9 m com 5 cel.; Carga do Juramento diz 12 m com 6 cel.
- Esperado: cada alcance em celulas bater com a distancia em metros do texto e do livro (1 cel. = 1,5 m).
- Regente (16:33): conferir no LIVRO-DO-JOGADOR.md antes de corrigir; item 23b na pagina 11.
- Sem edicao de codigo neste item.
- URL: http://localhost:3000/compendios/habilidades

ETAPA 4 em curso (Um Anel, conta Farejador, portal Site local em 1900x1183).
Passo 1a (criar aventura): /rpg/um-anel, 'Aventura Teste Farejador Um Anel' criada e aberta em /aventura/aventura-teste-farejador-v44fo. OK.
Passo 1b (wizard Um Anel): Conceito (nome Eldo Teste Farejador), Cultura (Hobbits do Condado, Perícia Favorecida Furtividade), Atributos (Conjunto 1), Chamado (Capitao, 2 perícias Batalha e Persuasao), Combate (Espadas principal, Machados adicional), Tracos (Honrado e Curioso), Dadivas (Grave e Confianca), Equipamento (Espada Curta, Camisa de Couro, Sem elmo, Sem escudo e Machado), Retrato pulado, Revisao, CRIAR PERSONAGEM. Criado: tor-mwpv6xvk-dtidfd. Sem erro de console na navegacao (so avisos abaixo).

## BV-024 Alerta 'Pendente: Equipamento' nao diz o que falta (P3, a confirmar)
- Severidade: P3; se a regra exigir uma arma de cada proficiencia, e so UX
- Passos: wizard Um Anel, passo Equipamento: escolher Espada Curta, Camisa de Couro, Sem elmo e Sem escudo; ler o alerta.
- Esperado: o alerta diz qual escolha falta (ex.: arma de Machados).
- Obtido: alerta continua 'Pendente: Equipamento' sem detalhe; so some depois de escolher o Machado tambem.
- Erro do console: nenhum.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-v44fo?personagem=criado

## BV-025 (fechado: não é bug — a tabela de Cultura, livros/um-anel/03-aventureiros.md:189-196, não exclui a principal da adicional) Proficiencia adicional lista Espadas mesmo com Espadas como principal (P3, a confirmar com o livro)
- Severidade: P3; se o livro proibir a mesma proficiencia nas duas, vira P2
- Passos: wizard Um Anel, passo Combate: escolher Espadas em Proficiencia principal; olhar a lista de Proficiencia adicional.
- Esperado: a adicional nao oferece a mesma proficiencia da principal (ou a regra explica).
- Obtido: Espadas continua na lista adicional.
- Erro do console: nenhum.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-v44fo

## BV-026 Aviso de servidor: seed de fichas demo no Postgres falhou (P3, dev)
- Severidade: P3 (aviso no console; o projeto usa MariaDB, confirmar de onde vem)
- Passos: criar personagem Um Anel pelo wizard; ler o console.
- Esperado: nenhum aviso de seed com erro de banco.
- Obtido: [warn] [eldarin] seed de fichas demo no Postgres falhou, continuando sem seed: Bind parameters must not contain undefined. To pass SQL NULL specify JS null.
- Erro do console: [warn] ... Bind parameters must not contain undefined.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-v44fo?personagem=criado&char=tor-mwpv6xvk-dtidfd

Passo 1c (ficha Um Anel, /personagem/tor-mwpv6xvk-dtidfd, Eldo): cabecalho (Hobbits do Condado, Capitao, padrao comum), Resistencia 21/21, Esperanca 18/18, Sombra 0, Fadiga 0, Bloqueio 17, Carga 6; atributos e pericias batem com o wizard (Batalha e Persuasao, Furtividade favorecidas); proficiencias Espadas 2 e Machados 1; tracos Honrado, Curioso, Lideranca; dadivas Grave e Confianca; equipamento Espada Curta e Machado, Camisa de Couro, sem elmo e escudo. Nao achei aba nem controle de posturas na ficha (so aparece na mesa, a conferir). EXPORTAR PDF clicado: sem erro no console (download nao confirmado pelo portal). Console limpo na ficha, exceto o aviso de BV-026 na criacao.

ETAPA 4 passo 2 em curso (ficha da Lira, /personagem/pc-mwp8u5ew): abas Inventario 5, Tesouro, Habilidades, Magias, Bestiario Pessoal; Em uso na mesa (Espada Longa e Cota de Malha). Inventario lido.

## BV-027 Nome dos itens do inventario quase invisivel (texto escuro no fundo escuro) (P2)
- Severidade: P2 (legibilidade; o nome so aparece no texto de descricao)
- Passos: /personagem/pc-mwp8u5ew, rolar ate a aba Inventario (aberta por padrao); olhar o titulo de cada card de item (Espada Longa, Kit de Trinchar, Tocha de Masmorra, Corda de Seda de Aranha, Cota de Malha).
- Esperado: nome do item legivel no card escuro.
- Obtido: o titulo some (cor rgb(30,24,20) sobre fundo rgb(26,25,22)); a letra do icone tambem quase nao aparece. Visto no print: so a descricao fica legivel.
- Erro do console: nenhum.
- URL: http://localhost:3000/personagem/pc-mwp8u5ew

Passo 2b (inventario da Lira): adicionar pelo + COMPENDIO (Adaga de Quelicera entrou, contador 6), remover (Tocha saiu, contador 5), Habilidades (Cancao de Cura entrou, aba 1), Magias (Bola de Fogo entrou, aba 1). Equipar: a troca do select Arma/acao em Em uso na mesa nao aparece na tela (BV-028).

## BV-028 Trocar a arma em 'Em uso na mesa' nao atualiza o select na hora; so aparece depois de recarregar (P2, a confirmar)
- Severidade: P2; se o valor salvo estiver errado no banco, vira P1 (arma errada na mesa)
- Passos: /personagem/pc-mwp8u5ew, aba Inventario com Adaga de Quelicera no inventario; no select Arma / acao (Em uso na mesa) escolher Adaga de Quelicera; esperar 2 s e ler o valor do select.
- Esperado: o select mostra Adaga de Quelicera na hora.
- Obtido: o select continuou em Espada Longa (lido por DOM 2 s depois). Depois de recarregar a pagina, o select mostra Adaga de Quelicera (salvou no servidor). Repetido: troca ok so apos recarregar.
- Erro do console: nenhum.
## BV-029 Guerreiro recebe magia Bola de Fogo sem aviso (P3, BUG CONFIRMADO pelo livro 17.7; corrigido pela Bigorna, aprovado pela Lupa, sem commit)
- Severidade: P3; se o livro restringe magia a conjuradores, vira P2
- Passos: /personagem/pc-mwp8u5ew (classe Guerreiro), aba Magias, + COMPENDIO, escolher Bola de Fogo.
- Esperado: a regra da classe impede ou avisa, ou a magia e permitida pelo livro.
- Obtido: Bola de Fogo entrou direto na aba Magias (contador 1), sem aviso.
- Erro do console: nenhum.
- URL: http://localhost:3000/personagem/pc-mwp8u5ew

## BV-030 Texto 'Gestao do personagem' quase invisivel no fim da ficha (P3)
- Severidade: P3 (visual)
- Passos: /personagem/pc-mwp8u5ew, rolar ate o fim da ficha (depois das abas).
- Esperado: texto do bloco legivel.
- Obtido: o titulo do bloco 'Gestao do personagem' aparece em dourado claro sobre fundo bege, quase sem contraste (visto no print).
- Erro do console: nenhum.
- URL: http://localhost:3000/personagem/pc-mwp8u5ew

Passo 2c (retrato da Lira): Adicionar retrato com eldarin-cover.png, Salvar retrato: imagem aparece na ficha, sem erro. OK.
Passo 2 concluido (ficha Lira 1900x1183): inventario, habilidades, magias e retrato testados; PDF exportado no bloco da ficha sem erro no console. Tesouro e Bestiario Pessoal nao abertos. Aviso: o portal mostrou o overlay do Next.js com '2 Issues' (SyntaxError do proprio portal, selector vazio, nao do app).

## BV-031 Ficha Um Anel em 390 px: botao EXPORTAR PDF estoura a largura e cria rolagem horizontal (P2)
- Severidade: P2 (mobile; o cabecalho fica espremido e sobreposto)
- Passos: resize 390x844; abrir /personagem/tor-mwpv6xvk-dtidfd; ler o cabecalho e a barra de rolagem.
- Esperado: sem rolagem horizontal (margem de 16 px); botao Exportar PDF dentro da largura; titulo e dados legiveis.
- Obtido: document.scrollWidth 442 para viewport 390 (clientWidth 375). O container tor-sheet__masthead-actions (botao EXPORTAR PDF) vai ate x=442 e fica sobre a coluna de texto 'Hobbits do Condado / Capitao / Padrao de vida'. Titulo quebra em 3 linhas e o retrato fica estreito.
- Erro do console: nenhum.
- URL: http://localhost:3000/personagem/tor-mwpv6xvk-dtidfd

Passo 4 (390x844, Site local; no fim voltou para 1900x1191): ficha Um Anel tem rolagem horizontal (BV-031). Ficha da Lira em 390 sem rolagem horizontal; abas do inventario quebram em 3 linhas, sem estouro; inventario e retrato OK; nomes dos itens continuam ilegiveis (BV-027). O wizard Um Anel NAO foi refeito inteiro em 390 (so conferido a ficha); fica a conferir.

Passo 3 (paineis, conta de teste): /mesas (Escolha seu RPG) OK; /rpg/um-anel lista a mesa Aventura Teste Farejador Um Anel com Abrir mesa, Copiar link e Excluir mesa; /conta: apelido, recuperacao de senha (CPF e nascimento) e foto (avatar ou personalizada) com botoes; /amigos: adicionar apelido inexistente responde 'Apelido nao encontrado' (ok); notificacoes: 'Nenhuma pendencia no momento'. Console sem erro nessas paginas. Nenhum bug novo nesta parte.
- Erro do console: nenhum.

ETAPA 5 em curso (Site local, 390x844 para o wizard; conta de teste).
Item 1 (ficha da Lira, 1900x1183): aba Tesouro abre com Pecas de ouro 50 po, Especiarias, Minerios e Tesouros (Nenhum item) e + ADICIONAR em cada grupo; sem erro no console. Aba Bestiario Pessoal abre com Goblin 2, Dano causado: 14 HP (Goblin 2 tem 8 HP; conferir se e acumulado de varias lutas); sem erro no console.

## BV-032 Wizard Um Anel em 390 sai sozinho e cai na ficha antiga (tor-mwpv6xvk-dtidfd); o nome novo some (interferencia do portal compartilhado, nao e bug)
- Severidade: P1 (nao da para criar segundo personagem; a ficha criada nao e a que o jogador preencheu)
- Passos: 390x844, /aventura/aventura-teste-farejador-v44fo, CRIAR PERSONAGEM. Conceito: nome Eldo Mobile Farejador. Cultura Hobbits do Condado + Furtividade. Atributos Conjunto 1. Chamado Capitao + Batalha + Persuasao. Proximo.
- Esperado: passo Chamado seguir ate Revisao e CRIAR PERSONAGEM gerar personagem novo com o nome digitado.
- Obtido: na 2a tentativa a pagina saiu do wizard sem clique em CRIAR PERSONAGEM e foi para /aventura/aventura-teste-farejador-v44fo?personagem=criado&char=tor-mwpv6xvk-dtidfd (ID da Eldo Teste Farejador da etapa 4); o nome Eldo Mobile nao aparece em lugar nenhum. Na 1a tentativa aconteceu o mesmo (ficha tor-mwpv6xvk-dtidfd, nome Eldo Teste Farejador).
- Erro do console: nenhum (logs-start ativo).
- URL: http://localhost:3000/aventura/aventura-teste-farejador-v44fo/personagem/novo
Reproducao Farejador (portal proprio, 390x844, registro fetch): wizard seguiu do Conceito ao Passo 10 sem sair; URL conferida em cada etapa ficou /personagem/novo. Ultimo passo CRIAR PERSONAGEM: POST /api/tor-characters -> 200, depois URL /aventura/aventura-teste-farejador-v44fo?personagem=criado&char=tor-mwpw1h70-wwnw3k. Personagem novo 'Eldo Mobile Farejador' aparece na aventura. Nao houve redirect para a ficha tor-mwpv6xvk-dtidfd. Conclusao: nao reproduzido; a ficha antiga foi o portal compartilhado com a Bigorna.

## BV-033 Aventura Um Anel nao lista o personagem criado: '0 fichas de jogadores' e 'Voce ainda nao tem personagem nesta mesa' (P2, a confirmar)
- Severidade: P2 (a ficha abre, mas a mesa nao reconhece o personagem da conta)
- Passos: abrir /aventura/aventura-teste-farejador-v44fo depois de criar a Eldo (ETAPA 4) e ler a area Fichas dos jogadores e Seu personagem (mestre).
- Esperado: a ficha tor-mwpv6xvk-dtidfd aparece em Fichas dos jogadores e como personagem da conta nesta mesa.
- Obtido: '0 fichas de jogadores'; 'Nenhuma ficha de jogador ainda'; 'Voce ainda nao tem personagem nesta mesa' com botao CRIAR PERSONAGEM. A ficha /personagem/tor-mwpv6xvk-dtidfd abre normal com Eldo Teste Farejador.
- Erro do console: nenhum.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-v44fo

## BV-034 Login com senha certa cai na ficha da Lira, nao em /mesas (P3, a confirmar)
- Severidade: P3; se o desenho for voltar a ultima pagina, nao e bug
- Passos: sair; abrir /entrar; e-mail farejador.teste01@example.com; senha certa; ENTRAR.
- Esperado: /mesas (como na ETAPA 1), ou a pagina de origem se for o desenho.
- Obtido: /personagem/pc-mwp8u5ew (ficha da Lira).
VEREDITO Bigorna (21/11): (b) desenho, nao bug. Teste no Portal Bigorna: saiu, abriu /entrar direto (URL limpa) e entrou com farejador.teste01: foi para /mesas. Codigo: app/entrar/page.tsx:30 e app/api/auth/login/route.ts:33 usam redirect vazio, que cai em DEFAULT_POST_AUTH_PATH (/mesas, lib/auth/post-auth-redirect.ts:10). Vai para a ficha so quando a URL tem ?redirect=/personagem/...: app/personagem/[id]/page.tsx:38 manda para /entrar?redirect= quando nao ha sessao. Prova: ficha deslogada foi para /entrar?redirect=%2Fpersonagem%2Fpc-mwp8u5ew e, ao entrar, voltou para /personagem/pc-mwp8u5ew. Sair pelo menu (HeaderUserMenu.tsx:107) vai para /entrar sem parametro. Falta: a URL exata usada antes; se a aba veio com ?redirect, e o comportamento esperado.
- Erro do console: nenhum.
- URL: http://localhost:3000/entrar

ETAPA 5 resultado (parcial):
- Item 1 (Lira, 1900): aba Tesouro e Bestiario Pessoal abrem; sem erro no console. Ver nota de Goblin 2 abaixo.
- Item 2 (wizard Um Anel em 390): NAO concluido. Ver BV-032 e BV-033.
- Item 3 (/compendios?sistema=um-anel em 390): 11 abas lidas, 4 a 5 entradas cada (Personagem, Equipamento, Combate e Posturas, Adversarios, Jornada, Conselho, Sombra e Miseria, Tesouro, Progressao e Companhia, Companhia & Mundo, Personagens Pre-Gerados). Sem erro no console. Pendente: a passagem em 1900.
- Item 4 (/privacidade, /download, /mundo): sem rolagem horizontal em 390 (scrollWidth 375) nem em 1900. Sem erro no console.
- Item 5 (sair, senha errada, entrar): senha errada mostra 'Credenciais invalidas' (ok); campos ficam limpos depois do erro. Senha certa entra (ver BV-034). Sair pela ficha (botao Sair) funcionou.
- Obs. de portal: varias vezes o portal caiu sozinho em /personagem/pc-mwp8u5ew (ficha da Lira), inclusive no meio do wizard e ao clicar abas do compendio. Nao reproduzido de forma limpa; pode ser do portal. A investigar antes de virar bug.
- Obs. a conferir: Bestiario Pessoal da Lira mostra Goblin 2 com 'Dano causado: 14 HP' (Goblin 2 tem 8 HP); pode ser acumulado de varias lutas.
- Viewport voltou para 1900x1191.
- URL: http://localhost:3000/personagem/pc-mwp8u5ew

## BV-035 Mesa Um Anel: card do Eldo no painel Personagens Jogaveis abre Ficha vazia com 'Personagem nao encontrado.' (P1) [CONFIRMADO na Etapa 7: corrigido]
- Severidade: P1 (a ficha do personagem nao abre dentro da mesa; sem ela nao da para ver nem mudar Resistencia, Esperanca, posturas)
- Passos: conta de teste, /mesa/aventura-teste-farejador-v44fo (1900x1183); clicar no botao Ficha da barra lateral; clicar no card Eldo Teste Farejador (ou Eldo Mobile Farejador).
- Esperado: a ficha do Eldo abre na mesa com Resistencia 21/21 e Esperanca 18/18 (os mesmos valores do card).
- Obtido: abre a janela Ficha (960x820) sem conteudo; so aparece o texto 'Personagem nao encontrado.' no topo do mapa, e ele continua na tela depois de trocar de painel. Mesmo resultado com os dois Eldos.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo
- Ligado a BV-033 (a mesa nao reconhece a ficha da conta).

## BV-036 Painel do Mestre diz 'Nenhum personagem de jogador na sala' com dois Eldos na mesa (P2)
- Severidade: P2
- Passos: mesa /mesa/aventura-teste-farejador-v44fo; botao Mestre; aba JOGADORES (ou a area XP, vida e salvaguardas).
- Esperado: os dois Eldos (Eldo Teste Farejador e Eldo Mobile Farejador) aparecem na lista de jogadores do mestre.
- Obtido: 'Nenhum personagem de jogador na sala.' nas duas areas. Ao mesmo tempo, o painel Ficha lista os dois cards (Resistencia 21/21, Esperanca 18/18 e Resistencia 21/21, Esperanca 16/16).
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

## BV-037 Jornada, Conselho e Companhia: o botao acende na barra mas o painel nao aparece (P2, a confirmar) [CONFIRMADO na Etapa 7: corrigido]
- Severidade: P2 (sem painel, a Jornada e a Fase de Companhia nao podem ser usadas; a confirmar se e so a tela ou se o painel abre em outro lugar)
- Passos: mesa /mesa/aventura-teste-farejador-v44fo; clicar em JORNADA, depois em CONSELHO e em COMPANHIA na barra lateral (uma de cada vez), esperar 2 s e tirar screenshot.
- Esperado: o painel lateral abre com o conteudo (Jornada: dias, estacao, terreno, papeis e INICIAR JORNADA; Conselho e Companhia: seus conteudos).
- Obtido: o botao fica destacado e a barra mostra a dica (Jornada / Conselho / Companhia), mas nenhum painel aparece. Os paineis Chat, Ficha, Dados, Mestre e Status abrem normal. Na Jornada, a snapshot lista os campos e o botao INICIAR JORNADA, mas nada aparece na tela. Repetido 3 vezes. Nao foi possivel testar INICIAR JORNADA.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

## BV-038 Mesa Um Anel mostra regras do Eldarin no painel Mestre > Sala: PA, auto-passe e XP por monstro (P2, a confirmar com o livro)
- Severidade: P2; se o livro do Um Anel nao usa PA, a mesa mostra regra de outro sistema
- Passos: mesa /mesa/aventura-teste-farejador-v44fo; botao Mestre; aba SALA; ler Configuracao da mesa > Combate.
- Esperado: opcoes de combate do Um Anel (sem PA).
- Obtido: 'Modo combate ativo (PA, turnos e iniciativa)', 'Auto-passe quando PA = 0 (ms)' com 150, 'XP automatico ao derrotar monstros' marcado. Busca em livros/um-anel por 'pontos de acao' e PA nao achou nada.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

## BV-039 Painel Dados: botao ROLAR cortado na borda do painel (P3, visual)
- Severidade: P3
- Passos: mesa /mesa/aventura-teste-farejador-v44fo; botao Dados; ler a linha da formula '1d12' e o botao ROLAR.
- Esperado: botao ROLAR inteiro dentro do painel.
- Obtido: o botao ROLAR passa da borda direita do painel (o texto aparece cortado em ROLAR). Rolagem 2d6 funcionou: resultado 4 [3, 1] foi para o Chat.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

Etapa 6 (parcial, 1900x1183): Painel Chat OK (mensagem de teste enviada e aparece). Painel Ficha: BV-035. Painel Mestre: BV-036 e BV-038. Jornada, Conselho e Companhia: BV-037. Mapa nao usado. Nao houve edicao de Resistencia, Esperanca ou Sombra (a ficha nao abre), entao a conferencia depois do recarregar fica para a proxima passada.
Recarregado (1900x1191): Painel Ficha lista Eldo Teste (Resistencia 21/21, Esperanca 18/18) e Eldo Mobile (Resistencia 21/21, Esperanca 16/16): iguais, nada foi mudado. A ficha dentro da mesa segue sem abrir (BV-035).
Passada 390x844: sem rolagem horizontal (scrollWidth 390). Barra de baixo com Chat, Ordem, Passar e Dados. Tocar no card do Eldo Teste nao mostra nada visivel (a janela nao aparece). Badge de dev do Next (N) cobre o rotulo Chat na barra de baixo (so no modo dev, a confirmar). Viewport voltou para 1900x1191. Sombra/Olho de Mordor, Fase de Companhia e Conselho nao foram vistos (paineis nao abrem).

Etapa 7 (Site local, 1900x1183; leitura pelo DOM e snapshot):
- BV-035 CONFIRMADO corrigido: na mesa /mesa/aventura-teste-farejador-v44fo, o card Eldo Teste Farejador no painel Ficha abre a ficha com conteudo (Resistencia e Esperanca, sem 'Personagem nao encontrado').
- BV-037 CONFIRMADO corrigido: clique simples em Jornada, Conselho e Companhia abre o painel lateral. Jornada com ROTA, INICIAR JORNADA e OLHO DE MORDOR; Conselho com RESISTENCIA e INTRODUCAO; Companhia (Fase de Companhia) com Bonus do Patrono. Sem erro no console.
- Edicao na ficha do Eldo: Resistencia 21/21 para 20/21 (botao Diminuir Resistencia). Depois de recarregar a pagina, a ficha e o card da barra lateral mostram 20/21: persistiu.
- Mesa do Eldarin /mesa/aventura-teste-farejador-8sghq: os 10 paineis da barra lateral abriram com conteudo (Status, Turno, Ficha, Chat, Dados, Compendio, Convite, Mapa, Mestre, Invocar). Nenhum vazio ou que nao abriu. Compendio mostra 'Carregando...' por uns segundos e depois lista os itens (normal).
- Painel Mestre do Eldarin, abas Sala, Jogadores, Culinaria, Criaturas e Combate: todas abrem, sem erro de console (so Fast Refresh).

## BV-040 Card do Eldo na barra lateral mostra Resistencia antiga (21/21) depois de mudar na ficha, ate recarregar (P3, a confirmar)
- Severidade: P3 a confirmar; se o card nunca atualiza sem recarregar, vira P2
- Passos: mesa /mesa/aventura-teste-farejador-v44fo; botao Ficha; clicar no card Eldo Teste Farejador; na ficha, clicar Diminuir Resistencia (21 para 20); ler o texto do card Eldo na barra lateral.
- Esperado: o card mostra Resistencia 20/21, igual a ficha.
- Obtido: a ficha mostra 20/21, mas o texto do card continua 'Resistencia 21/21 · Esperanca 18/18'. Depois de recarregar a pagina, o card mostra 20/21 (persistiu no servidor).

ETAPA 8 parcial (Site local, 1900x1183, conta de teste). Feito: wizard do Eldarin ate a Revisao para Ladino e para Mago (sem criar nenhum, para nao gastar vaga). Nao feito: Paladino e Espiritualista, level-up pela ficha e inventario, por limite de consumo do agente.

## BV-041 Revisao do wizard lista 4 (Ladino) ou 5 (Mago) caminhos de nivel 2 como se todos fossem da ficha (P2, a confirmar)
- Severidade: P2 a confirmar; se a escolha de caminho existe no wizard e so a Revisao mostra as opcoes, vira P3
- Passos: /aventura/aventura-teste-farejador-8sghq/personagem/novo; Conceito com nome; Classe Ladino; PROXIMO ate PASSO 9 DE 9 Revisao.
- Esperado: a Revisao mostra o caminho escolhido (ou o wizard pede a escolha antes de criar). O texto da etapa Classe diz 'Nivel 2: escolha um Caminho de Assimilacao'.
- Obtido: linha CAMINHOS (NV 2) e SUBCLASSE (NV 2) com 'Sombra Etérea · Forma Amorfa · Assassino Venenoso · Corsário de Cripta' (Ladino). Com Mago: 'Piromante das Brasas · Criomante do Gelo · Mago Alquimico · Alquimista Acido · Mago dos Encantos'. Nao aparece nenhum campo de escolha na Revisao.
- Erro do console: nenhum (logs-start ativo).
- URL: http://localhost:3000/aventura/aventura-teste-farejador-8sghq/personagem/novo

## BV-042 Revisao do Mago lista 'Lamina de Espirito' duas vezes em EQUIPAMENTO (P3)
- Severidade: P3
- Passos: wizard Eldarin, Classe Mago, PROXIMO ate a Revisao; ler a linha EQUIPAMENTO.
- Esperado: cada item uma vez.
- Obtido: 'Adaga e truques — Lamina de Espirito · Adaga de Masmorra · Sem armadura · Chama de Fogareiro · Lamina de Espirito'.
- Erro do console: nenhum.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-8sghq/personagem/novo

VEREDITO maestro (21/11 06:10): BUG, corrigido em c78e0b9. A sessao do Um Anel (torSession) nao entrava no delta nem na fatia do mapa do store; o painel recebia sempre undefined. Conferido: depois de recarregar, a Jornada mostra '10 de 10 trechos restantes'.
## BV-073 (P1) Jornada: INICIAR JORNADA grava no chat, mas o painel continua no formulario
- Severidade: P1 (o mestre nao ve a jornada em andamento; cada clique grava outra entrada no chat)
- Status (etapa 19b, 21/11 06:20): CORRIGIDO. Painel mostra '10 de 10 trechos restantes' sem recarregar; avancar 3d mudou para '6 de 10' na hora; Encerrar volta ao formulario INICIAR JORNADA, e recarregar mantem.
- Passos: Teste maestro, mesa /mesa/aventura-teste-farejador-v44fo, 1900x1175. Abrir JORNADA. Guia: "Heroi Um". Batedor, Olheiro e Caçador: "Heroi Dois", "Heroi Tres", "Heroi Quatro". Clicar INICIAR JORNADA. Esperar 3 s. Recarregar a pagina.
- Esperado: o painel mostra a jornada em curso (dia, passo, avancar) e o botao Iniciar nao volta. Depois de recarregar, a jornada continua ativa.
- Obtido: o chat recebe "Jornada iniciada — 10 trechos por Terras Selvagens, Verão. Previsão: 12 dias...". O painel segue no formulario com INICIAR JORNADA. Depois de recarregar, o formulario volta vazio. Nesta rodada, 4 cliques geraram 4 mensagens "Jornada iniciada" no chat.
- Erro do console: nenhum. Erro na tela: nenhum.
- Codigo (para a correcao, sem edicao minha): components/vtt/TorJourneyPanel.tsx:93 (started = progress != null) e start() perto da linha 151.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

VEREDITO maestro (21/11 06:10): mesma causa do BV-073, corrigido em c78e0b9; o Conselho mostra '0/6 sucessos · 8 tentativas'.
## BV-074 (P1) Conselho: a rolagem grava no chat, mas o painel nao mostra o conselho em andamento
- Severidade: P1 (mesmo padrao do BV-073)
- Status (etapa 19b, 21/11 06:20): CORRIGIDO. Com o conselho aberto, 3d mudou o placar na hora de '0/6 sucessos · 8 tentativas' para '3/6 sucessos · 7 tentativas', sem recarregar. Encerrar conselho volta ao formulario RESISTENCIA; recarregar mantem.
- Passos: Teste maestro, mesa v44fo. Abrir CONSELHO. Clicar em 3d (Graduacao do porta-voz), uma vez pelo clique e outra pelo DOM.
- Esperado: o painel mostra o placar do conselho (tentativas, Interagir, encerrar).
- Obtido: o painel segue no formulario "Graduacao do porta-voz" (0d a 6d). O chat recebe duas mensagens "Conselho — Pedido ousado (Resistência 6). ... limite de tempo 7 tentativas" e depois 8.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

VEREDITO maestro (21/11 06:15): BUG, corrigido em e50c8bf (4 nomes do livro; os ids ficaram).
## BV-075 (P1) Fase de Companhia: 4 nomes de Empreitadas diferem do livro
- Severidade: P1 (a regra e os custos batem; so o nome muda. Pela rubrica, "contraria o livro" pode subir para P0: decidir)
- Obtido (app -> livro): "Reunir Boatos" -> "Reunir Rumores" (livros/um-anel/07-fases-de-companhia-jornada.md:226). "Contemplar Mapas Ilustrados" -> "Ponderar Mapas Historiados e Figurados" (:287). "Recontar uma História" -> "Contar uma História (Yule)" (:321). "Fortalecer a Companhia" -> "Fortalecer o Companheirismo" (:337).
- Codigo: lib/character/um-anel/undertakings.ts:23, :41, :59.
- Bate com o livro: Encontrar Patrono, Estudar Itens Mágicos, Compor uma Canção; marcas (Yule) em Curar Cicatrizes, Criar um Herdeiro e Recontar uma História.
- Esperado: nomes iguais aos do livro.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo (painel Companhia)

## Checado sem bug: NA "derivados de 18" (painel Companhia)
- O texto bate com livros/um-anel/02-resolucao-de-acoes.md:122-126 e livros/um-anel/11-personagens-exemplo.md:42 (NA = 18 − Atributo como regra opcional).

## Etapa 19 (parcial, Farejador): nao feitos: Olho/Vigilancia (passo 4) e desfazer (passo 5). Motivo: parei no limite de consumo.

## BV-043 Revisao do Mago nao mostra magias nem truques da classe (P2, a confirmar)
- Severidade: P2 a confirmar; sem essa linha nao da para conferir no wizard se as magias do Mago estao certas nem se entra magia de outra classe (caso BV-029)
- Passos: wizard Eldarin, Classe Mago, PROXIMO ate a Revisao; buscar no texto da Revisao a palavra Magia, Feiticos ou Truques.
- Esperado: a Revisao lista os truques e magias iniciais do Mago (ou diz que so aparecem na ficha).
- Obtido: nenhuma linha de magia na Revisao; so 'Chama de Fogareiro' em EQUIPAMENTO. Nao confirmado se a ficha depois da criacao mostra magias.
- Erro do console: nenhum.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-8sghq/personagem/novo

Checagem de vida (ok): Ladino d8 com CON 16 (+3) mostra Vida 11; Mago d6 mostra Vida 9; Guerreiro d10 mostra 13. Bate com a formula d + CON.
- Erro do console: nenhum (logs-start ativo).
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

ETAPA 8b (Site local, 1900x1183, conta de teste). Wizard do Eldarin ate a Revisao para Paladino e Espiritualista, sem criar nenhum (CRIAR PERSONAGEM nao clicado).
- Paladino: Revisao lista CAMINHOS (NV 2) 'Jurado do Sol · Cavaleiro do Limiar · Guardiao da Gorge', sem escolha. Mesmo padrao de BV-041. Vida 13 (d10 + CON 16) ok. Habilidade 'Voto Alimentar' e de Paladino, nenhuma linha de outra classe.
- Espiritualista: Revisao lista CAMINHOS (NV 2) 'Punho do Limiar · Tecelao do Vacuo · Asceta da Dor · Guardiao da Respiracao', tambem sem escolha. Mesmo padrao de BV-041. Vida 11 (d8 + CON 16) ok. Iniciativa +3 (DES 16) ok. Habilidade 'Respiracao de Combate' e so do Espiritualista.
- Console: so o erro de hidratacao ja registrado (BV-009/BV-020) ao abrir o wizard.

## BV-044 Revisao do Paladino mostra 'Curar Ferimentos' e 'Raio do Limiar' dentro de EQUIPAMENTO (P3, corrigido pela Bigorna, aprovado pela Lupa, sem commit)
- Severidade: P3 a confirmar; se essas duas sao magias ou habilidades, nao equipamento, vira P2 (magia que nao vai para a lista de magias)
- Passos: /aventura/aventura-teste-farejador-8sghq/personagem/novo; Conceito com nome; Classe Paladino; PROXIMO ate PASSO 9 DE 9 Revisao; ler a linha EQUIPAMENTO.
- Esperado: EQUIPAMENTO so com espada, cota e itens; magias e habilidades aparecem em outra linha.
- Obtido: 'Espada e cota — Espada Longa · Cota de Malha · Curar Ferimentos · Raio do Limiar'. Nao aparece nenhuma linha de magia.
- Erro do console: nenhum novo.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-8sghq/personagem/novo

ETAPA 8b, parte 2 (Site local, 1900x1183; mesa /mesa/aventura-teste-farejador-8sghq como mestre).
- Level-up: Mestre > Sala > Dar XP 300 para a Lira (APLICAR XP) aceitou ('+300 XP para Lira Teste Farejador.'). Ficha > Subir para nivel 2 > Caçador de Feras > APLICAR NIVEL 2: a Lira ficou Nv 2 · Guerreiro · Caçador de Feras (titulo, lista da barra e ficha).
- Conferido no nv 2: Vida 22/22 (13 + 9 do dado medio + CON, ok); Proficiencia +2; salvaguardas FOR +5 e CON +5; Atletismo +3; Percepcao 11. Pontos de acao 6/9 sem mudanca no nv 2 (nao sei se o certo e mudar).
- Habilidades: 1, 'Canção de Cura' (Alcance 1 cel, PA 1, aliado recupera 1d6). Nao apareceu nenhuma habilidade nova da subclasse Caçador de Feras. Nao sei se a Canção veio do nv 2 ou ja estava na ficha (nao conferi antes do level-up). Origem a confirmar.
- Magias: 1, 'Bola de Fogo' (3º circulo) para o Guerreiro. BV-029 confirmado de novo, agora no nv 2.
- Observacoes a confirmar: (a) antes do level-up a barra de XP mostrava '300/100 — Pronto para subir ao nv. 2' com a Lira em nivel 1; o rotulo mistura total e limite. (b) Na primeira tentativa o dialogo de subir de nivel fechou sozinho ao clicar numa ref antiga; o log tinha muitos 'Fast Refresh rebuilding'; nas tentativas seguintes subiu sem erro. (c) Uma vez apareceu no console 'Uncaught SyntaxError: Failed to execute querySelector ... selector is empty' (mesa:33), logo depois de um clique com ref antiga; nao consegui repetir.

## BV-045 Nao achei fluxo de pedir item ao mestre na ficha nem no painel Mestre (P3, a confirmar)
- Severidade: P3 a confirmar; se o projeto preve pedido de item ao mestre, vira P2 (jogador nao tem como pedir item)
- Passos: mesa /mesa/aventura-teste-farejador-8sghq; botao Ficha; card Lira; ABRIR FICHA; aba Inventario; ler os botoes. Depois botao Mestre; abas SALA e JOGADORES.
- Esperado: um jeito de o jogador pedir item ao mestre (botao, aprovacao ou mensagem), ou o mestre ver o pedido.
- Obtido: Inventario so tem '+ CONSUMIVEL', '+ COMPENDIO' (abre seletor de Armas, Habilidades, Magias, Equipamentos e Consumiveis) e 'Remover' por item. Painel Mestre (SALA e JOGADORES) sem texto de item, pedido ou entrega. Nao testei entrega pelo mestre porque nao achei o fluxo.
VEREDITO Bigorna: NAO E BUG na mesa; o fluxo existe. Aparece quando: a ficha e aberta pela mesa (popup), o usuario e jogador participante da sala (nao mestre, nao admin), a ficha e dele, e e de aventura pertencente a esta sala (requiresInventoryGmApproval, lib/auth/room-access.ts:246). Nesse caso '+ COMPENDIO' e '+ CONSUMIVEL' viram pedido ao mestre (inventoryEditMode request, components/vtt/CharacterSheetPopup.tsx:112). Fora disso (ficha em /personagem/[id]) o botao nao aparece: la o dono edita direto. Isso e decisao, registrada na pagina 03 (BV-045b). Nao verificado nesta rodada: a tela do mestre que recebe o pedido.
- Erro do console: nenhum nessa parte.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## ETAPA 9 (fluxo de jogador, duas contas): resultado
Conta jogador criada (ver topo). Entrou pelo convite 8KKRJU8ACX. Criou Brann Teste Dois pelo wizard (Humano, Guerreiro, Explorador, Espada e cota, Valdrun) sem erro no console. Ficha em /personagem/pc-mwq22nw1.

## BV-046 Wizard de personagem: botao PROXIMO do passo Raca fica fora da area visivel do painel; clique cai no canvas e nao avanca (P2, a confirmar barra de rolagem)
- Severidade: P2 (tem contorno: rolar o painel antes de clicar)
- Passos: logada como jogador, mesa /mesa/aventura-teste-farejador-8sghq?invite=8KKRJU8ACX, botao Ficha, CRIAR NOVO PERSONAGEM; no passo 1 Conceito preencher nome e PROXIMO; no passo 2 Raca escolher Humano e clicar PROXIMO.
- Esperado: PROXIMO visivel dentro do painel Novo personagem e avanca para Classe.
- Obtido: o painel tem 720 px e o grupo do passo Raca tem ~890 px; o botao fica em y 839, abaixo da borda do painel (798). Clique pela ref nao avanca (elementFromPoint devolve CANVAS). Depois de scrollIntoView no botao, ele avanca.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## Fluxo de item (ETAPA 9, passos 3 a 6): OK
- Remover item na ficha /personagem/pc-mwq22nw1 (Tocha de Masmorra): sumiu da lista, sem erro.
- + COMPENDIO > Equipamentos > Agulha de Zarabatana (10): aparece "Solicitacao enviada ao mestre" e "Aguardando aprovacao do mestre". Nao entra direto na lista.
- Mestre (Teste maestro): o sino de solicitacoes (botao com badge 1, no topo da mesa) mostra Brann Teste Dois, Inventario, Agulha de Zarabatana (10) com APROVAR e RECUSAR. Obs: o sino de Notificacoes diz "Nenhuma pendencia"; isso e outro painel, nao e bug.
- APROVAR: a API de pedidos volta vazia e o painel fecha.
- Jogador (reload): sem "Aguardando aprovacao"; Agulha aparece na lista de equipamento com Remover. Console sem erro.
- Observacao: a lista Personagens jogaveis da mesa mostra a Lira (de outra conta) para o jogador. Provavelmente e de proposito (grupo); a confirmar.

ETAPA 10 (Um Anel, duas contas) - parcial, parada no passo 2 por causa do BV-047.
- Passo 1 OK: codigo de convite da mesa aventura-teste-farejador-v44fo = YU7MKGE3KN (painel Convite, Teste maestro).
- Passo 2 BLOQUEADO: a conta jogador entrou pelo codigo na mesa (ok, vinculado), mas o wizard de personagem nao abre (BV-047). Passos 3 e 4 dependem de heroi novo: nao testados.
- Passo 5 OK: a conta jogador abre a ficha do Eldo Teste Farejador (tor-mwpv6xvk-dtidfd, da outra conta). Sem botoes de edicao; clicar numa bolinha de pericia (Vigilancia) so mostra a dica e nao muda o valor. Obs.: a ficha inteira fica visivel para o jogador (mesmo padrao da Lira); a confirmar se e de proposito.

## BV-047 Wizard de personagem nao abre: erro de servidor "Too many connections" (P1)
- Severidade: P1 (impede criar personagem pelo wizard; as outras paginas carregam)
- Passos: entrar com a conta jogador (jogador_teste02), abrir a aventura do Um Anel aventura-teste-farejador-v44fo e clicar CRIAR PERSONAGEM (ou abrir direto a URL abaixo). Mesmo erro na aventura Eldarin: /aventura/aventura-teste-farejador-8sghq/personagem/novo.
- Esperado: o wizard abre no passo Raca.
- Obtido: overlay de erro do Next.js com o titulo "Server Too many connections", vindo de lib\db\client-ma..., com pilha em queryOneUserRow, fetchUserByIdStrict, resolveSessionUser, materializeSessionUser, ensureSessionAdventureAccess e AventuraNovoPersonagemPage. Recarregar e navegar de novo mantem o erro. /mesas, /aventura/... (sem /personagem/novo) e /mesa/... carregam normalmente.
- Erro do console: Server Too many connections (lib\db\client-ma...). Status: corrigido em 363d9d6, confirmado (ETAPA 10b: o wizard abre e cria personagem). Hipotese original: pool de conexoes do banco esgotado (outros agentes usando o mesmo banco ao mesmo tempo); a confirmar no servidor.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-v44fo/personagem/novo

ETAPA 10b (Site local = conta jogador_teste02; Teste maestro = mestre; 1900x1175). Resultado: BV-047 confirmado corrigido. Heroi criado: Hobbit Teste Anel (Hobbits do Condado, Capitao, Resistencia 21/21, Esperanca 18/18). Card na mesa conferido pelo jogador. Mestre diminuiu a Resistencia pela ficha para 20/21: o card do mestre atualizou na hora, o card do jogador nao atualizou (ver BV-048).

## BV-048 Mudanca de Resistencia feita pelo mestre na ficha nao chega ao card do jogador na mesa; so aparece depois de recarregar (P2; mesma familia de BV-003 e BV-040)
- Severidade: P2. Nao trava a sessao. Se a sincronizacao ao vivo da mesa for exigida pelo livro ou pelo projeto, sobe para P1 junto com BV-003.
- Passos: (1) jogador_teste02 abre /mesa/aventura-teste-farejador-v44fo e fica com a barra lateral Personagens jogaveis visivel; (2) mestre (Teste maestro) abre /mesa/aventura-teste-farejador-v44fo, clica Ficha na barra lateral e clica Hobbit Teste Anel; na janela da ficha rola o conteudo ate os botoes Diminuir Resistencia (ficam abaixo da borda visivel) e clica Diminuir (21/21 para 20/21); (3) jogador confere o card Hobbit Teste Anel sem recarregar.
- Esperado: o card do jogador mostra 20/21 logo depois do clique do mestre.
- Obtido: card do mestre 20/21 na hora. Card do jogador continuou 21/21 por pelo menos 14 s. Depois de recarregar a mesa do jogador, o card mostra 20/21 (gravou no servidor). Ou seja: so o recarregar atualiza.
- Observacao: na janela da ficha os botoes Diminuir/Aumentar Resistencia ficam em y 978 com a janela terminando em y 718. Os primeiros cliques pela ref cairam no canvas, sem efeito (Eldo nao foi alterado). So funcionou depois de rolar o conteudo da janela.
- Erro do console: nenhum novo (so o erro de hidratacao ja registrado).
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo
- Status ETAPA 11 (portais recarregados, 04:28 a 04:31): NAO corrigido. Mestre diminuiu Resistencia de 20 para 19 e depois aumentou de volta para 20, pela ficha. Card do jogador continuou 20/21 e depois 19/21 por mais de 16 s (esperado: ate uns 3 s). So atualizou ao recarregar a pagina do jogador.

Status ETAPA 12 (portais recarregados; Site local = jogador_teste02, Teste maestro = mestre): CORRIGIDO NESTA RODADA, dentro do esperado. Mestre diminuiu Resistencia pela ficha (20 para 19): o card do jogador mostrou 19/21 cerca de 3,5 s apos o clique, sem recarregar. Mestre voltou para 20: jogador em cerca de 3,9 s. Observacao: o card do proprio mestre ainda mostrava 19/21 por alguns segundos depois do aumento; nao confirmado se e so atraso de tela.

## BV-049 Esperanca, Fadiga e Ferido mudados pelo mestre na ficha nao chegam ao card e a ficha do jogador ao vivo; so aparecem depois de recarregar (P2; mesma familia de BV-048)
- Severidade: P2. Nao trava a sessao.
- Passos: (1) jogador_teste02 abre /mesa/aventura-teste-farejador-v44fo com Personagens jogaveis aberta e a ficha do Hobbit Teste Anel aberta; (2) mestre (Teste maestro) abre Ficha e Hobbit Teste Anel, rola ate Esperanca e clica Diminuir (18 para 17); (3) mestre clica Aumentar Fadiga e depois Marcar Ferido; (4) jogador confere card e ficha sem recarregar.
- Esperado: card e ficha do jogador acompanham em ate uns 3 s.
- Obtido: no mestre os valores mudam na hora. No jogador, Esperanca ficou 18/18 por mais de 13 s; Fadiga ficou 0 por mais de 10 s; o status Ferido nao apareceu (o jogador ainda via o botao Marcar Ferido). Depois de recarregar, o jogador ve Esperanca 17, Fadiga 1 e status Ferido: o servidor gravou.
- Erro do console: nenhum (so Fast Refresh).
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo
- Restaurado depois do teste: mestre voltou Esperanca, Fadiga e Ferido; jogador voltou Esperanca para 18. Recarregando o jogador: Resistencia 20/21, Esperanca 18/18, Sombra 0, Fadiga 0, sem Ferido.

Status ETAPA 12: CORRIGIDO EM PARTE. Esperanca 18 para 17 (mestre, pela ficha) chegou ao card e a ficha do jogador em cerca de 3,5 s, sem recarregar; o botao Marcar Ferido sumiu do jogador no mesmo intervalo. Fadiga 0 para 1 chegou em cerca de 4,5 s. Tudo restaurado e conferido nos dois portais (Esperanca 18/18, Fadiga 0, sem Ferido). Severidade segue P2.

## BV-050 Esperanca mudada pelo jogador na propria ficha nao chega ao card e a ficha do mestre ao vivo (P2; mesma familia de BV-048)
- Severidade: P2. Nao trava a sessao.
- Passos: (1) jogador_teste02 abre a ficha do Hobbit Teste Anel e clica Diminuir Esperanca (18 para 17); (2) mestre (Teste maestro) com o card Hobbit Teste Anel visivel na lista Personagens jogaveis e a ficha do Hobbit aberta confere sem recarregar.
- Esperado: card e ficha do mestre mostram 17/18 em ate uns 3 s.
- Obtido: jogador mostrou 17/18 na hora. Mestre continuou 18/18 por mais de 12 s, no card e na ficha.

Status ETAPA 12: NAO CORRIGIDO NO PRAZO, mas chega ao vivo. Jogador baixou Esperanca 18 para 17 pela propria ficha: a ficha aberta do mestre chegou a 17/18 em cerca de 4,8 s e o card da lista em cerca de 5,0 s apos o clique, acima dos 3 s esperados. Restaurado: mestre viu 18/18 em cerca de 3,5 s. Severidade segue P2.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

## BV-051 Mestre: APLICAR VIDA nao grava (Lira segue 22/22 no jogador e no mestre) (P1, a confirmar)
VEREDITO maestro (21/11 05:00): NAO REPRODUZIDO, e do portal. A rota grava (chamada direta: 22/22 -> 15/22 com aviso no chat). Pela interface, rolando ate o botao e preenchendo com evento de input, grava e avisa. O botao fica em y 1190 com a tela em 1192, dentro de vtt-gm-tools__body (overflow auto): clique por ref sem rolar cai fora. Nenhuma tentativa do Farejador chegou ao servidor (nenhuma linha 'ajustou a vida' no chat). Achado real menor: o aviso dizia o valor digitado (18/13) e nao o gravado (13/13); corrigido em 0d3a153. Lira voltou a 22/22.
- Severidade: P1 (mesa nao muda vida do personagem; se o clique for limitacao do portal, vira P2)
- Passos: (1) mestre (Teste maestro) em /mesa/aventura-teste-farejador-8sghq, Ferramentas do mestre, select Lira Teste Farejador nv 2; (2) Vida atual 15; (3) APLICAR VIDA. Repetido 4 vezes (preenchendo por fill e por digitacao, clicando por ref e por DOM). Depois recarregar as duas paginas.
- Esperado: card da Lira no jogador mostra 15/22 em poucos segundos; campo Vida atual do mestre fica 15 apos recarregar.
- Obtido: jogador seguiu 22/22 por 10 s e depois de recarregar. Mestre, apos recarregar e selecionar Lira, mostra Vida atual 22. Nenhum erro no console.
- Ressalva: o portal deu 'setSelectionRange' em input type=number ao limpar o campo (erro do portal, nao do site). Numa tentativa o campo estava com 2215 (erro meu ao digitar) e o APLICAR VIDA foi clicado com esse valor; a vida segue 22/22, sem efeito visivel.
- Erro do console: nenhum no mestre.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-052 Dar XP com valor negativo nao reverte: Lira ficou com 400 XP (era 300) (P2, a confirmar)
VEREDITO maestro (21/11 05:00): NAO E BUG. Pela interface, -100 mostra 'Informe um valor de XP positivo' e nao grava; XP so sobe, por desenho. Os 400 XP da Lira ficam (conta de teste; decisao na pagina 03).
- Severidade: P2; se o desenho nao aceita XP negativo, e so decisao de regra (confirmar)
- Passos: mestre, select Lira, campo Dar XP -100, APLICAR XP.
- Esperado: Lira volta a 300 XP, ou o campo recusa valor negativo com aviso.
- Obtido: campo aceitou -100 e o clique nao mudou nada, sem aviso e sem entrada no feed do jogador. Efeito colateral: o +100 de teste (300 para 400) ficou gravado. Reverter pendente, precisa decisao do Raul.
- Observacao (nao e bug novo): o feed do jogador mostrou '+100 XP' em cerca de 5 s apos o APLICAR XP.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

ETAPA 13 (mesa Eldarin, duas contas, mesa aventura-teste-farejador-8sghq) em curso: (1) jogador_teste02 ja e membro, entrou sem convite; (2) APLICAR VIDA: ver BV-051; (3) chat: mestre->jogador e jogador->mestre em ate 1 s com chat aberto nos dois lados (chat fechado so mostra ao abrir); (4) XP: feed do jogador em cerca de 5 s; (5) condicao em token: nao feito por limite de tempo. Ajuste de XP: ver BV-052.

ETAPA 13b (21/11, 04:53 a 04:58; Site local = jogador_teste02, Teste maestro = mestre):
(1) Vida ao vivo: OK. Mestre, Lira nv 2, Vida atual 15, APLICAR VIDA as 04:54:46 (botao rolado antes, fill normal). Card da Lira no jogador: 15/22 na primeira leitura, em ate 1 s, sem recarregar. Mestre voltou para 22 as 04:55:18: jogador 22/22 em ate 1 s. Chat do jogador mostrou "ajustou a vida" nos dois sentidos.
(2) Condicao no token: mestre aplicou CEGO na Lira (aba Status da Lira, duracao Sug. = 2R) as 04:56:23. Jogador ve um selo 2R sobre o token L no mapa. A palavra Cego nao aparece em nenhum lugar da tela, so o selo. Tempo exato nao medido (a leitura por DOM nao pegou o selo; vi no print cerca de 20 s depois). Mestre tirou a condicao por CEGO, mas o selo continuou (ver BV-053).
(3) Jogador muda a ficha pela mesa: NAO TESTADO, sem caminho. A janela Ver ficha da Lira (pelo card) e so leitura: Pontos de vida 22/22 aparece como texto, sem campo nem botao de editar; clicar no HP fecha a janela. A pagina /personagem/pc-mwp8u5ew tambem nao tem controle de vida ou arma. Nada a verificar do lado do mestre.
Status BV-003 (ETAPA 13b): vida AO VIVO OK (1 s, nos dois sentidos); chat OK (ETAPA 13); condicao visivel no jogador (so selo); ficha pela mesa nao testavel.

VEREDITO maestro (21/11 05:15) para o BV-053 abaixo: BUG CONFIRMADO no servidor (token da Lira com conditions [] e dois timedEffects 'cego' presos). Causa: ao tirar a ultima condicao o painel mandava timedEffects undefined, que some do JSON; o servidor mantinha o antigo. Corrigido em 31bf9d0; token da Lira limpo.
## BV-053 Selo de condicao 2R continua no token da Lira depois de o mestre tirar a condicao (P2, a confirmar)
- Severidade: P2. Nao trava. Se a condicao continuar gravada para o jogador, sobe para P1.
- Passos: (1) mestre (Teste maestro), Ferramentas do mestre, Lira no mapa, aba Status da Lira, CEGO, duracao Sug.; (2) jogador (Site local) ve selo 2R sobre o token L; (3) mestre clica CEGO de novo para tirar; (4) jogador ve o token: o selo continua; depois de recarregar a pagina do jogador, continuam 2 selos 2R sobre o token L.
- Esperado: sem selo depois de tirar a condicao.
- Obtido: 2 selos 2R sobre o token L no jogador (print 04:57 e print ao recarregar, cerca de 04:58). No mestre, o botao CEGO voltou para sem destaque (tirado).
- Erro do console: nenhum lido.
- Nao confirmei no lado do mestre se a condicao ainda esta gravada no servidor (nao reli a aba Status depois de tirar).
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

ETAPA 14 (21/11, por volta de 05:00 a 05:07; Site local = jogador_teste02, Teste maestro = mestre; mesa aventura-teste-farejador-8sghq; paginas recarregadas no inicio).
(1) BV-053 retestado: mestre aplicou CEGO com duracao 2R na Lira (aba Status, clique no CEGO e depois no 2R). Jogador: a lista NO MAPA mostra Lira com 2R e o token L mostra o selo. Mestre tirou o CEGO: no jogador a lista NO MAPA voltou a mostrar so Lira, Goblin 1 e Goblin 2, sem 2R, sem recarregar. Depois de recarregar as duas paginas: token L sem selo (print), mestre sem status ativo e sem CEGO ligado.
(2) Brann Teste Dois e da conta jogador_teste02: sim (na lista de personagens do jogador aparecem ABRIR FICHA, TRANSFERIR e EXCLUIR). Jogador abriu a ficha do Brann pela mesa e trocou "Arma / acao" de Espada Longa para "- automatico -" (05:03:23). Mestre (VER FICHA do Brann): nao aparece nenhum indicador de arma em uso, nem o select; so a lista de inventario com Espada Longa. Ou seja, o mestre nao ve a troca em lugar nenhum da ficha. Volta feita: depois de recarregar, o select do jogador esta em Espada Longa (valor gravado armas:armas-wpn-s02). Nao consegui confirmar se o "automatico" chegou a gravar no servidor antes da volta.
(3) XP: mestre aplicou +50 no Brann (APLICAR XP, 05:04:59; no mestre: "+50 XP para Brann Teste Dois" e 50/100). Jogador, com a ficha do Brann aberta: XP continuou 0/100 em 05:05:10 e em 05:05:28. Depois de recarregar e reabrir a ficha: 50/100. O chat do jogador tem a linha "Mestre concedeu +50 XP a Brann Teste Dois (0 -> 50)". Ver BV-054.
(4) Chat fechado no jogador: mestre enviou "Teste farejador etapa 14..." as 05:06:06 e a mensagem chegou no chat do jogador (vista ao abrir). O botao CHAT do jogador nao mostrou nenhum aviso (sem badge, contador ou destaque), checado em 05:06:15. Anotado como BV-055 (P3 UX), nao como bug.
Status BV-053 (ETAPA 14): CORRIGIDO na tela. O selo some no jogador (ao vivo e depois de recarregar) e no mestre o CEGO fica desligado. Nao li o campo conditions no servidor (so pela tela).
Chat do jogador fechado de novo ao fim do teste.

## BV-054 XP dado pelo mestre nao atualiza a ficha aberta do jogador; so aparece depois de recarregar e reabrir (P2; mesma familia de BV-048 e BV-049)
- Severidade: P2. Nao trava. O dado e gravado e chega ao feed do chat; so o campo XP da ficha nao atualiza ao vivo.
- Passos: (1) jogador (Site local) abre a ficha do Brann pela mesa (ABRIR FICHA) e fica olhando o campo XP (0/100); (2) mestre (Teste maestro), Mestre > JOGADORES, Brann selecionado, Dar XP 50, APLICAR XP; (3) olhar o XP na ficha do jogador por cerca de 40 s, sem recarregar.
- Esperado: 50/100 em poucos segundos, como a vida (BV-003 corrigido).
- Obtido: continuou 0/100 ate recarregar a pagina; depois de recarregar e reabrir a ficha: 50/100. O feed do chat recebeu "Mestre concedeu +50 XP a Brann Teste Dois (0 -> 50)".
- Erro do console: nenhum lido.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-055 Chat fechado no jogador: mensagem nova do mestre nao acende aviso no botao CHAT (P3 UX, nao e bug)
- Severidade: P3 UX. Anotado a pedido, para decisao de design.
- Passos: (1) jogador (Site local) com o chat fechado; (2) mestre (Teste maestro) envia uma mensagem no chat as 05:06:06; (3) ler o botao CHAT do jogador em 05:06:15.
- Esperado (UX): algum sinal de mensagem nova no botao CHAT (ponto, contador ou destaque).
- Obtido: botao CHAT sem badge, contador ou destaque. A mensagem aparece ao abrir o chat.
- Erro do console: nenhum lido.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

Status BV-054 (ETAPA 15, 2026-11-21): NAO reproduzido nesta rodada. XP atualiza ao vivo nos dois caminhos, em 2 a 3 s, sem recarregar.
- Caminho B (clique direito na barra FICHA do jogador; janela flutuante): leitura 250/100 em 05:17:05; apos APLICAR XP (mestre, clique em 05:17:05) virou 300/100 em 05:17:08 e ficou ate 05:17:16.
- Caminho A (clique esquerdo na barra FICHA abre o painel PERSONAGENS JOGAVEIS na barra lateral; ABRIR FICHA abre janela flutuante sobre o mapa): aberta em 05:17:29 com 300/100; APLICAR XP em 05:17:53 virou 350/100 em 05:17:55 (2 s); reaplicado em 05:19:20 com a ficha aberta desde 05:18:19: virou 400/100 em 05:19:23 (3 s) e ficou ate 05:19:34.
- Texto do XP na ficha: a palavra XP nao existe no DOM. O valor fica ao lado do circulo de nivel e acima do botao SUBIR NV 2, no formato 200/100. O card do Brann na barra lateral nao mostra XP (so 13/13, 15 e 0/9).
- Ressalva 1: a primeira aplicacao desta etapa nao foi cronometrada; a leitura de 05:16:21 ja mostrava 250/100 (a ficha abriu em 200/100).
- Ressalva 2: em 05:17:53 a janela da ficha do jogador fechou sozinha entre 05:17:59 e 05:18:02, sem clique do jogador. No APLICAR XP seguinte (05:19:20) nao fechou. Causa nao identificada; o console do jogador nao registrou nada. Vale repetir para ver se e reproduzivel.
- Ressalva 3: um clique de 05:17:32 caiu no cabecalho da secao XP do mestre (nao no botao), sem efeito.

VEREDITO maestro (21/11 05:35) para o BV-056 abaixo: nao e falha de gravacao. Tracos de classe do livro (Segundo Folego, Estilo de Combate, Passiva de Assimilacao) nao existem como dado no sistema, em nenhuma classe; a aba Habilidades so lista habilidades taticas do compendio. Virou a decisao D-21 na pagina 03 (precisa do dono). Rebaixado de P0 para P2 (recurso que falta, nao quebra a sessao).
## BV-056 Habilidades do Brann ficam vazias: nem as de nv 1 nem a de nv 2 aparecem (P0 pelo criterio do papel: contraria o livro)
- Severidade: P0 pelo criterio do papel (contraria o livro). Nao trava a sessao.
- Passos: (1) jogador (Site local) abre a ficha do Brann (Humano, Guerreiro, nv 1) e vai na aba HABILIDADES; (2) SUBIR NV 2, escolhe Caminho Cacador de Feras, APLICAR NIVEL 2; (3) volta na aba HABILIDADES.
- Esperado: livro/LIVRO-DO-JOGADOR.md:937-938 lista nv 1 Segundo Folego e Estilo de Combate, e nv 2 Subclasse e Bonus Passivo de Assimilacao; LIVRO-DO-JOGADOR.md:2062 manda anotar a Passiva de Assimilacao; LIVRO-DO-JOGADOR.md:954 descreve a passiva do Cacador de Feras.
- Obtido: aba diz 'Nenhuma habilidade - use + Compendio ou suba de nivel na trilha de subclasse' antes e depois do nv 2. O assistente de nv 2 so mostrou 'Caminho de Assimilacao: Feras e Bestiais', sem as passivas nem o Estilo de Combate.
- Erro do console: nenhum lido.
- Nao testei se o Estilo de Combate foi escolhido na criacao do personagem.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

VEREDITO maestro (21/11 05:35) para o BV-057 abaixo: DESENHO, fica. O sistema sobe um nivel por vez porque cada nivel tem escolhas (subclasse, talento, atributo); com XP sobrando, o botao SUBIR NV 3 aparece logo em seguida. Registrado na pagina 03.
## BV-057 Brann com 400 XP acumulado aparece como nv 1 e so sobe para nv 2; a tabela manda estar no nv 3 (P2, decisao de regra)
- Severidade: P2. Decisao de regra a confirmar, nao bug certo.
- Passos: ficha do Brann com XP 400/100 em nv 1; SUBIR NV 2; APLICAR NIVEL 2.
- Esperado: LIVRO-DO-JOGADOR.md:137-140 diz que nv 3 comeca em 300 XP acumulado; LIVRO-DO-JOGADOR.md:182 diz que o personagem sobe quando o XP acumulado atinge a linha do proximo nivel. Pela tabela, 400 XP ja e nv 3.
- Obtido: nv 1 com 400/100 e 'Pronto para subir ao nv. 2'. Depois de aplicar, nv 2 com 300/200 e botao SUBIR NV 3. O numero da barra nao e rotulado (o formato parece XP acima do nivel atual sobre o custo do proximo) e passa do limite sem travar.
- Erro do console: nenhum lido.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

VEREDITO maestro (21/11 05:35) para o BV-058 abaixo: BUG, corrigido em 2c88ef0 (o level-up gravava PA = 5; agora mantem o atual, limitado ao teto).
## BV-058 PA da ficha foram de 0/9 para 5/9 ao subir de nivel, sem combate (P2, a confirmar)
- Severidade: P2. Nao confirmei se e reset do pool fora de combate.
- Passos: ficha do Brann nv 1 com PA 0/9 fora de combate; SUBIR NV 2; APLICAR NIVEL 2.
- Esperado: LIVRO-DO-JOGADOR.md:182 diz que PA nao aumentam por nivel (teto 9 continua); LIVRO-DO-JOGADOR.md:194 e :196 dizem que a recuperacao acontece no inicio de cada turno.
- Obtido: PA 5/9 logo depois de aplicar o nv 2, sem turno e sem combate.
- Erro do console: nenhum lido.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

Status ETAPA 16 (2026-11-21): level-up feito pela ficha do jogador. HP 13/13 para 22/22 (+9 = 6 do dado fixo da tabela + 3 de CON, LIVRO-DO-JOGADOR.md:938 e :926). Extracao +3 para +4 (progressao +1 Extracao). Proficiencia +2 mantida. Mestre (Teste maestro) mostra 'Brann Teste Dois nv 2' na lista de personagens. A janela da ficha nao fechou durante o level-up; nao vi a janela fechar sozinha nesta etapa.

VEREDITO maestro (21/11): BUG, corrigido em 66a9969 (tabela encolhe e rola dentro da folha; conferido em 390x844: tabela 55-325 numa janela de 369).
## BV-059 Ficha do Hobbit (mesa Um Anel) no celular: tabela de Equipamento de Guerra passa da folha (P2)
- Severidade: P2 (layout no celular; os botoes de remover arma ficam fora do papel)
- Passos: celular 390x844 como jogador (jogador_teste02), mesa aventura-teste-farejador-v44fo, fechar o painel Personagens jogaveis se aberto, clicar no card Hobbit Teste Anel, rolar ate Equipamento de Guerra.
- Esperado: tabela e botoes de remover arma cabem dentro da folha da ficha, sem passar da largura da janela.
- Obtido: a tabela termina em x=397 e a janela da ficha em x=379 (scrollWidth da janela 369 = clientWidth, mas o conteudo fica cortado). Os X vermelhos de remover arma ficam para fora do papel, na faixa escura da direita. A ficha da Brann (pagina propria, /personagem/pc-mwq22nw1) nao estoura.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

VEREDITO maestro (21/11): BUG, corrigido em 66a9969 (no celular, abrir ficha fecha o painel lateral; conferido em 390x844).
## BV-060 Ficha do personagem abre atras do painel Personagens jogaveis no celular (P2)
- Severidade: P2 (no celular o jogador clica no card e nao ve a ficha)
- Passos: celular 390x844, mesa aventura-teste-farejador-v44fo, painel Personagens jogaveis aberto (padrao), clicar no card Hobbit Teste Anel.
- Esperado: a ficha abre na frente, ou o painel fecha ao abrir a ficha.
- Obtido: a janela Hobbit Teste Anel abre em [10,164] atras do painel Personagens jogaveis, que continua aberto e cobre a tela. So aparece depois de clicar em Fechar painel.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

VEREDITO maestro (21/11): DESENHO. MesaMobileBar.tsx:56 mostra 'Ordem' fora de combate e 'Turno' em combate; no primeiro carregamento a sala ainda nao chegou e aparece 'Ordem'. Sem acao.
## BV-061 Rotulo do botao da barra mobile muda entre Ordem e Turno (P3, a confirmar)
- Severidade: P3; a confirmar com o livro qual nome vale para iniciativa.
- Passos: celular 390x844, mesa aventura-teste-farejador-8sghq como jogador; ler a barra de baixo logo apos carregar e depois de o mapa terminar de carregar.
- Esperado: um unico nome para o botao de ordem de turno (o painel de cima diz Turno; a pagina pedia Iniciativa).
- Obtido: no primeiro carregamento o botao aparece como Ordem; depois de carregar, como Turno. Na mesa do Um Anel tambem aparece Ordem.
- Erro do console: nenhum.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

VEREDITO maestro (21/11): BUG, corrigido em 6fcc498 (Sede de Sangue, texto do livro :1065).
## BV-062 Wizard, Barbaro: nome e texto do bonus passivo diferem do livro (P2)
- Severidade: P2 (contraria o livro: o nome e a descricao do bonus de nivel 1 do Barbaro).
- Passos: Site local 1900x1175, conta jogador_teste02, aventura aventura-teste-farejador-8sghq, CRIAR PERSONAGEM; nome qualquer, PROXIMO; Humano; PROXIMO; classe Barbaro; PROXIMO; SUGESTAO PARA BARBARO; PROXIMO; antecedente Explorador; PROXIMO; PROXIMO; PROXIMO (Revisao). Nao criei.
- Esperado: LIVRO-DO-JOGADOR.md:1065 diz Sede de Sangue: consumir carne crua ou coracao de monstro recem-abatido (acao rapida 1 PA) cura 1d8+CON em HP e estende a duracao da Furia em 2 turnos.
- Obtido: Revisao mostra BONUS PASSIVO (NV 1) Sede de Batalha, assimilacao vital cura 1d8+CON e estende Furia.
- Erro do console: nenhum (so Fast Refresh).
- URL: http://localhost:3000/aventura/aventura-teste-farejador-8sghq/personagem/novo

VEREDITO maestro (21/11): NAO E BUG. Fortitude 6 = +4 da classe (livro :1062) + bonus culinario da raca (computeCulinary soma classe e raca, lib/character/rules.ts:537-559).
## BV-063 Wizard, Barbaro: culinaria inicial da Revisao difere do livro (P3, a confirmar)
- Severidade: P3; nao confirmei a origem do bonus extra.
- Passos: mesmos de BV-062, ler o bloco CULINARIA INICIAL na Revisao.
- Esperado: LIVRO-DO-JOGADOR.md:1062 diz Fortitude +4, Extracao +2.
- Obtido: Extracao 2 · Fortitude 6 na Revisao. Pode ser soma de antecedente ou raca; a conferir.
- Erro do console: nenhum.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-8sghq/personagem/novo

## BV-064 Wizard, Bardo: passivo com nome e texto diferentes do livro (P0)
- Severidade: P0 (contraria o livro).
- Passos: Novo personagem, Classe = Bardo, ir ate Revisao (passo 9), ler BONUS PASSIVO (NV 1).
- Esperado: Harmonia de Sabores, quando o Bardo come junto do grupo, a duracao dos bonus de comida de todos os membros se estende em 50%. LIVRO-DO-JOGADOR.md:1088-1090.
- Obtido: Inspiracao de Grupo, bonus de suporte do grupo duram +50%. Nome inexistente no livro (grep sem resultado).
- Erro do console: nenhum.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-8sghq/personagem/novo

## BV-065 Wizard, Bardo: culinaria inicial diferente do livro (P0)
- Severidade: P0 (contraria o livro).
- Passos: mesmos de BV-064, ler CULINARIA INICIAL.
- Esperado: Forrageio +5, Coccao +2 (LIVRO-DO-JOGADOR.md:1085).
- Obtido: Forrageio 5, Fabricacao 2, Fortitude 2. Coccao foi trocada por Fabricacao. Fortitude fica pela regra do veredito de BV-063.
- Erro do console: nenhum.

## BV-066 Wizard, Bardo: proficiencias incompletas (P0)
- Severidade: P0 (contraria o livro).
- Passos: mesmos de BV-064, ler PROFICIENCIAS.
- Esperado: Armaduras leves, armas simples, algumas marciais, todos os instrumentos musicais (LIVRO-DO-JOGADOR.md:1083).
- Obtido: Armaduras leves, armas simples, instrumentos. Faltam algumas marciais.
- Erro do console: nenhum.

## BV-067 Wizard, Bardo: magia aparece no campo EQUIPAMENTO (P1)
- Severidade: P1.
- Passos: mesmos de BV-064, ler EQUIPAMENTO na Revisao.
- Esperado: so itens no EQUIPAMENTO; a magia Inspiracao Culinaria fica em MAGIAS E TRUQUES.
- Obtido: Rapieira e inspiracao, Rapieira, Couro Curtido. O texto inspiracao e a magia dentro do equipamento.
- Obs.: o kit do livro cita a magia (LIVRO-DO-JOGADOR.md:2108). Nao achei a definicao de Inspiracao Culinaria em livros/_parte_x_magias_v4_revisada.md; a conferir.
- Erro do console: nenhum.

## BV-068 Wizard, Druida: passivo com nome e texto diferentes do livro (P0)
- Severidade: P0 (contraria o livro).
- Passos: Classe = Druida, ir ate Revisao, ler BONUS PASSIVO (NV 1).
- Esperado: Ciclo da Vida, pode se alimentar de qualquer planta, raiz ou fungo venenoso da masmorra, convertendo o veneno em nutricao sem dano (LIVRO-DO-JOGADOR.md:1113-1114).
- Obtido: Ciclo da Masmorra, toxinas naturais viram resistencia.
- Erro do console: nenhum.

## BV-069 Wizard, Druida: proficiencias sem a restricao nao metalica (P0)
- Severidade: P0 (contraria o livro).
- Passos: Classe = Druida, ler PROFICIENCIAS na Revisao.
- Esperado: Armaduras leves e medias (nao metalicas), escudos nao metalicos, armas simples nao metalicas (LIVRO-DO-JOGADOR.md:1110).
- Obtido: Armaduras leves/medias (nao metalicas), escudos, armas simples. Falta nao metalicos em escudos e armas.
- Erro do console: nenhum.

VEREDITO maestro (21/11): BUG, os kits do Feiticeiro nao batem com a tabela do livro (:2110): kit 1 traz Maos Gelidas a mais, kit 2 Chama de Fogareiro a mais, kit 3 e funda+brigandina em vez de maca+Chama de Vinha. Vai para a Bigorna (KITS-LIVRO, todas as classes).
## BV-070 Wizard, Feiticeiro: magia extra no kit e em EQUIPAMENTO (P0)
- Severidade: P0 (contraria o livro e a regra de magia fora do equipamento).
- Passos: Classe = Feiticeiro, ir ate Revisao, ler EQUIPAMENTO e MAGIAS E TRUQUES.
- Esperado: kit Adaga e Lamina de Espirito (LIVRO-DO-JOGADOR.md:2110). Sem Mãos Gelidas no kit; equipamento so com itens.
- Obtido: Truques Lamina de Espirito (certo), mais Magias Maos Gelidas. EQUIPAMENTO: Adaga e centelha, Mãos Gelidas, Adaga de Masmorra, Couro Curtido. Mãos Gelidas aparece no equipamento.
- Obs.: Mãos Gelidas existe no livro (LIVRO-DO-JOGADOR.md:294) mas nao no kit.
- Erro do console: nenhum.

VEREDITO maestro (21/11): nao e bug de codigo. O livro chama de Harmonizacao o que o sistema chama de Forrageio (decisao D-22 na pagina 03). Fortitude 2 vem da raca (ver BV-063).
## BV-071 Wizard, Feiticeiro: culinaria inicial diferente do livro (P0)
- Severidade: P0 (contraria o livro).
- Passos: mesmos de BV-070, ler CULINARIA INICIAL.
- Esperado: Harmonizacao +3, Fabricacao +2 (LIVRO-DO-JOGADOR.md:1148).
- Obtido: Forrageio 3, Fabricacao 2, Fortitude 2. Harmonizacao virou Forrageio.
- Erro do console: nenhum.

## BV-072 Wizard, Bruxo: nivel 1 sem truques e com Sussurro de Masmorra (P0)
- Severidade: P0 (contraria o livro). Pode vir do kit do Bruxo (Bigorna): confirmar.
- Passos: Site local 1900x1175, conta jogador_teste02, aventura aventura-teste-farejador-8sghq, CRIAR PERSONAGEM; nome Teste Bruxo, PROXIMO; Humano; PROXIMO; classe Bruxo; PROXIMO; PROXIMO; antecedente Explorador; PROXIMO; PROXIMO; religiao Valdrun; PROXIMO; PROXIMO; ler MAGIAS E TRUQUES na Revisao.
- Esperado: nivel 1 do Bruxo tem Pacto Arcano com 2 truques e 2 magias de nivel 1 (LIVRO-DO-JOGADOR.md:1248). Sussurro de Masmorra e truque extra do nivel 4 da subclasse Voz das Profundezas (LIVRO-DO-JOGADOR.md:3126), nao do nivel 1.
- Obtido: MAGIAS E TRUQUES mostra so "Magias: Raio do Limiar · Sussurro de Masmorra"; nenhuma linha de Truques.
DIAGNOSTICO Bigorna (21/11, 06:10): causa confirmada. Correcao maior, NAO editada, sem commit.
- Causa 1: o wizard nao tem escolha de truques. A revisao (components/character/wizard/CharacterCreationWizard.tsx:1040-1058) so lista o que esta em draft.starterEquipment.spellEntryIds, e essa lista vem so dos kits (lib/character/starter-kits.ts:575-610). Truque so aparece se o kit trouxer.
- Causa 2: os kits do Bruxo (lib/character/starter-kits.ts:452-490) trazem 0 truque (Adaga e Cajado) ou 1 (Besta: Lamina de Espirito). Com o kit Adaga, a linha Truques nao aparece.
- Causa 3: o numero 2 existe em data/character/spell-lists.json:186 (cantripsKnown do Bruxo) mas nenhum codigo le esse campo (lib/character/spell-lists.ts:13 so declara). Mago e Feiticeiro mostram truque so porque o kit traz.
- Nao e lib/character/spell-prep.ts:59: 'Bruxo' la e o limite de magias preparadas (nivel + CAR, min. 2), nao truques.
PROPOSTA (decisao para o maestro):
- (a) Passo novo de truques no wizard, lendo cantripsKnown; para o Bruxo, escolher 2 entre os truques do pacto (Lamina de Espirito e Detectar Veneno, data/character/spell-lists.json:133). Como a lista tem so 2, a escolha e fixa. Mexe em estado do wizard e na ficha: risco medio/alto.
- (b) Conflito de livro a decidir: LIVRO-DO-JOGADOR.md:2113 lista Raio do Limiar e Sussurro de Masmorra no kit do Bruxo, mas Raio do Limiar e nivel 3 na lista do pacto (spell-lists.json:137) e Sussurro e truque do nivel 4 (LIVRO-DO-JOGADOR.md:3126). Ilusao Menor (kit Besta) nao esta na lista do pacto. Isso fica com KITS-LIVRO.
- Teste: nao escrito (nao houve edicao). npm test e tsc nao rodados.
- Erro do console: nenhum.
- URL: http://localhost:3000/aventura/aventura-teste-farejador-8sghq/personagem/novo

VEREDITO maestro (21/11 06:25): NAO E BUG. VALOR e campo do rascunho da tabela de herois do Olho (estado local do TorEyePanel); so grava ao aplicar o calculo. Recarregar descarta o rascunho.
## BV-076 (P2) Olho de Mordor: VALOR volta ao valor antigo depois de recarregar
- Severidade: P2 (opcional, Olho desligado; o mestre perde o numero que digitou)
- Passos: Teste maestro, mesa /mesa/aventura-teste-farejador-v44fo, 1900x1175. Abrir JORNADA. Na secao OLHO DE MORDOR (sem ligar o Olho), digitar 2 e depois 3 no campo VALOR. Esperar 3 s. Recarregar a pagina. Abrir JORNADA de novo.
- Esperado: o campo VALOR mostra 3 depois de recarregar.
- Obtido: depois de recarregar, VALOR volta a 1. Nao testei com o Olho ligado (LIGAR O OLHO DE MORDOR nao foi clicado).
- Erro do console: nenhum capturado.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

VEREDITO maestro (21/11 06:25): ajustado, o placar diz 'tentativas restantes' (ver git log).
## BV-077 (P3) Conselho: 'tentativas' sem dizer se e o total ou o que resta
- Severidade: P3 (rotulo)
- Passos: Teste maestro, mesa /mesa/aventura-teste-farejador-v44fo. Abrir CONSELHO e ler o placar. Clicar 3d em Graduacao de quem esta falando.
- Esperado: o rotulo deixa claro se o numero e o limite ou o que resta.
- Obtido: de '0/6 sucessos · 8 tentativas' para '3/6 sucessos · 7 tentativas' em uma rolagem. O numero cai e o texto nao diz 'restantes'. Decidir o rotulo.
- Erro do console: nenhum capturado.

ETAPA 20 (social, 21/11 06:22 a 06:25; Site local = jogador_teste02, Teste maestro = farejador_teste01, 1900x1175, /amigos). Resultado: pedido por apelido, aceite e mensagem funcionam; falham o tempo real (BV-078, BV-079) e o sino (BV-080). Passo 4: nome real e e-mail do outro nao aparecem em /amigos nem no painel Mensagens dos dois lados (DOM, title, data-site-tip, aria-label e perfil lateral): so o apelido.

VEREDITO maestro (21/11 06:30): consulta de pedidos e convites a cada 30 s (FriendsChatProvider.tsx:16). Baixado para 10 s (ver git log).
## BV-078 Pedido de amizade demora para chegar ao destinatario (P2, a confirmar)
- Severidade: P2; cai para P3 se o combinado for ate 1 min
- Passos: Teste maestro em /amigos, ADICIONAR com o apelido jogador_teste02 (enviado antes de 06:22:26). Site local ja aberto em /amigos, sem recarregar; ler o sino Notificacoes e a aba RECEBIDOS a cada poucos segundos.
- Esperado: o pedido aparece no sino e em RECEBIDOS em ate uns 3 s, sem recarregar.
- Obtido: em 06:22:34 e 06:22:42 o sino dizia Nenhuma pendencia no momento e RECEBIDOS Nenhum pedido recebido. Em 06:23:04 o sino mostrou Pedido de amizade: farejador_teste01 quer ser seu amigo. Atraso de cerca de 20 a 40 s.
- Erro do console: nenhum (logs-start ativo nas duas contas).
- URL: http://localhost:3000/amigos

VEREDITO maestro (21/11 06:35): a lista de amigos do remetente so recarregava ao abrir. Agora, com pedido enviado em aberto, a pagina /amigos consulta de novo a cada 10 s (ver git log). Falta conferir no site.
- Status ETAPA 20b (21/11 06:28 a 06:29): CORRIGIDO. Farejador removeu a amizade (REMOVER AMIGO, 06:28:41) e mandou pedido de novo pelo apelido (06:28:47). O pedido apareceu no sino do jogador_teste02 em cerca de 10 s (06:28:48 para 06:28:58; sino '1 notificacoes', RECEBIDOS 1). Ressalva: a pagina do jogador foi carregada em /amigos as 06:28:54, entre o envio e a leitura, entao o tempo mede o aparecimento depois da carga, nao com a aba aberta antes do envio.
## BV-079 Aceite do pedido nao chega ao vivo para quem enviou (P2)
- Severidade: P2 (o remetente fica com o pedido aguardando resposta e sem amigo ate recarregar)
- Passos: (1) Site local, /amigos, aba RECEBIDOS, ACEITAR no pedido de farejador_teste01 (06:23:11). (2) Teste maestro, mesma pagina, sem recarregar; ler ENVIADOS e AMIGOS.
- Esperado: o remetente ve a amizade em AMIGOS e o pedido sai de ENVIADOS em ate uns 3 s.
- Obtido: em 06:23:26 ENVIADOS ainda mostra @jogador_teste02 aguardando resposta. Em 06:23:43 AMIGOS mostra Nenhum amigo ainda. Depois de recarregar /amigos (06:23:54), AMIGOS mostra @jogador_teste02. No destinatario, Amizade aceita. aparece e o amigo entra na lista.
- Status ETAPA 20b (21/11 06:29): CORRIGIDO na tela. Farejador manteve /amigos aberto na aba AMIGOS, sem recarregar. jogador_teste02 aceitou em 06:29:08; o amigo apareceu na lista AMIGOS do farejador em cerca de 2 s (06:29:10), sem recarregar.
- Erro do console: nenhum.
- URL: http://localhost:3000/amigos

VEREDITO maestro (21/11 06:30): o sino so lista pendencias por desenho; mostrar amizade aceita e mensagem nova e recurso novo. Fica para o dono (pagina 03 nao precisa: e UX simples, entra na proxima rodada se o dono quiser).
## BV-080 Sino so lista pedidos pendentes: amizade aceita e mensagem nova nao aparecem (P2, a confirmar)
- Severidade: P2 a confirmar com o desenho do sino
- Passos: com as duas contas ja amigas, Teste maestro envia mensagem a jogador_teste02 (06:24:07). Site local: abrir o sino Notificacoes (06:24:35).
- Esperado: o sino avisa a mensagem nova ou a amizade aceita (a confirmar).
- Obtido: Nenhuma pendencia no momento. O aviso so aparece no botao Mensagens (1 mensagem nao lida, OK). Com o pedido pendente o sino mostrava o pedido (OK), mas depois de aceito nada aparece no sino.
- Erro do console: nenhum.
- URL: http://localhost:3000/amigos

OK (nao e bug):
- Mensagens: chega ao destinatario ao vivo; contador Mensagens, 1 mensagem nao lida em ate 4 s (06:24:07 a 06:24:11); some ao abrir a conversa (06:24:23).
- Observacao (nao e bug): a pagina traz o e-mail da propria conta no codigo (so visivel na fonte); a conversa abre com ?com= e o id interno usr_..., sem dado pessoal.
- Nao feito por limite de consumo: REMOVER AMIGO (desfazer) e refazer.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-v44fo

Etapa 21 - comparativo Site oficial x Site local (21/11, sem login, so leitura). Paginas: /, /mesas, /compendios, /mundo, /sistema, /download, /entrar, /rpg/eldarin, /rpg/um-anel, /privacidade. Sem emoji em nenhuma pagina; sem link quebrado (404) nos dois; console sem erro (no local so "Fast Refresh", ruido de dev); 390x844 sem rolagem horizontal nos dois. Falso positivo: fetch de /api/auth/oauth/google no oficial retorna ERR (redirecionamento externo para o Google, nao 404).

### BV-081 (P1) Site oficial: /privacidade mostra instrucao interna de desenvolvimento (SO NO OFICIAL; local ja tem a politica)
- Passos: abrir https://www.mxdrpg.com.br/privacidade, sem login.
- Esperado: politica de privacidade completa, como no local (controlador, dados coletados, base legal, ultima atualizacao).
- Obtido: texto "MXDRPG - mesa virtual gratuita. Politica em atualizacao. Edite docs/PRIVACIDADE-LGPD.md com e-mail do titular antes do lancamento." Expoe caminho de arquivo interno e instrucao de desenvolvedor ao publico.
- Erro do console: nenhum.
- URL: https://www.mxdrpg.com.br/privacidade (local: http://localhost:3000/privacidade, 3467 caracteres, "Ultima atualizacao: junho de 2026").
- Status (maestro): JA CORRIGIDO no branch (b238e22). O texto ainda esta em app/privacidade/page.tsx da main; some quando o dono publicar o branch (merge na main e decisao do dono).

### BV-082 (P1) Site local: botao de login com Google sumiu da tela /entrar (SO NO LOCAL, possivel regressao)
- Passos: deslogado, abrir /entrar no oficial e no local e comparar.
- Esperado: como no oficial, botao ENTRAR COM GOOGLE ("Um clique - sem senha nova") e texto "Entre com Google em um clique - ou use e-mail e senha abaixo". A pagina /sistema (igual nos dois) diz "faca login com Google ou e-mail/senha".
- Obtido: no local so e-mail e senha, com o texto "Entre com e-mail e senha - uma conta para mesas, fichas e convites." Nao ha botao Google, mas /sistema do local continua prometendo login com Google.
- Erro do console: nenhum.
- Observacao: nao sei se a remocao foi intencional; decisao do dono. Se for regressao, prioridade alta.
- URL: http://localhost:3000/entrar (oficial: https://www.mxdrpg.com.br/entrar).
- Status (maestro): NAO E REGRESSAO. O botao so aparece quando o servidor tem GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET (lib/auth/oauth-config.ts); o site local roda sem essas chaves. A logica do OAuth nao mudou entre a main e o branch. Fechado.

### BV-083 (P3) Site local: ordem dos cards em /compendios difere do oficial (confirmar se e intencional)
- Passos: abrir /compendios, aba Armas, sem filtro.
- Esperado: a mesma ordem do oficial, que abre com Arco Longo de Vinha.
- Obtido: o local abre com Adaga de Masmorra (ordem alfabetica). Os dois mostram 224 entradas.
- Observacao: nao e bug claro; pode ser mudanca intencional.
- Status (maestro): INTENCIONAL. O branch ordena o compendio em ordem alfabetica com localeCompare pt-BR (commit 8600304); a main mostra a ordem bruta do JSON. Fechado.
- URL: http://localhost:3000/compendios (oficial: https://www.mxdrpg.com.br/compendios)

### BV-084 (P1) Um Anel: painel Mestre (Sala, Jogadores, Criaturas, Combate) sumiu da barra do mestre (possivel regressao; Etapa 6 achou o painel)
- Passos: logar como mestre farejador_teste01 em http://localhost:3100/mesa/aventura-teste-farejador-v44fo e ler a barra lateral da mesa (sem clicar em nada alem disso).
- Esperado: botao Mestre na barra lateral, com as abas Sala, Jogadores, Culinaria, Criaturas e Combate (como na Etapa 6, BV-036/BV-038). Sem ele nao da para dar XP, mudar vida nem invocar monstro pelo painel.
- Obtido: a barra tem so Status, Turno, Ficha, Chat, Dados, Compendio e Convite. Nao aparece Mestre nem Invocar. No DOM nao ha texto Sala, Jogadores ou Criaturas. Clicar em Status e Ficha abre os paineis, mas nenhum tem essas abas.
- Erro do console: nenhum capturado (logs vazios nos dois portais).
- Observacao: o jogador jogador_teste02 nao tem personagem nesta aventura (Personagens jogaveis vazio nos dois lados). Isso e dado de teste, nao bug.
- URL: http://localhost:3100/mesa/aventura-teste-farejador-v44fo (mestre)
- Status (maestro): NAO E BUG. O commit 9a24fa9 (BV-036, BV-038) tirou de proposito da mesa do Um Anel as ferramentas e regras do Eldarin (XP por nivel, Criaturas, Combate de PA). A Etapa 6 era numa mesa Eldarin. O loop de desempenho de hoje nao tocou nisso. Fechado.

### BV-085 (P3, a confirmar) Mesa Eldarin: APLICAR VIDA do painel Mestre nao aplicou no primeiro clique
- Passos: mestre farejador_teste01 em http://localhost:3100/mesa/aventura-teste-farejador-8sghq, painel Mestre > aba Jogadores, personagem Lira Teste Farejador. Preencher Vida atual com 15 e clicar APLICAR VIDA (botao no fim do painel, quase na borda inferior da janela 1900x1192). Esperar 3 s e olhar a ficha da Lira no lado do jogador.
- Esperado: vida 15/22 no painel do mestre, no HUD e na ficha do jogador, sem recarregar.
- Obtido: o campo mostrou 15, mas o HUD do mestre e a ficha do jogador continuaram 22/22 por 3 s. Na tentativa seguinte, com o mesmo valor e o mesmo botao (rolado para a vista com scrollintoview), aplicou: 15/22 nos dois lados em cerca de 0,4 s. Pode ser clique que caiu fora do botao; por isso P3 a confirmar.
- Erro do console: nenhum capturado.
- URL: http://localhost:3100/mesa/aventura-teste-farejador-8sghq
- Hipotese (maestro): components/vtt/GmActorProgressPanel.tsx:33-37 reescreve o campo de vida com o valor salvo sempre que a vida do ator muda na sala; se uma sync chega entre digitar e clicar (ex.: a do XP do passo anterior), o numero digitado volta ao antigo e o clique grava o mesmo valor. Pre-existente, nao vem do loop de desempenho. Correcao possivel: so ressincronizar o campo quando o ator selecionado muda ou quando o campo nao foi editado. P3. CORRIGIDO em fa0d170 (Lupa aprovou).

