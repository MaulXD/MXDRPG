# 06 Bugs ao vivo

Bugs achados navegando no site local. Um bloco por bug, ID BV-001 em diante.

Conta de teste (dados ficticios): e-mail farejador.teste01@example.com | senha Teste12345 | apelido farejador_teste01 | nome Farejador Teste | CPF 12345 | nascimento 1995-05-10.

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
- Severidade: P2 a confirmar; bloqueia o teste de combate do item 2 da fila
- Passos: mesa /mesa/aventura-teste-farejador-8sghq; anel da Lira em (782,596) aberto com clique direito; escolher Mover; passar o mouse na celula vizinha (782,540) e clicar.
- Esperado: a Lira anda 1 celula e o PA do HUD muda.
- Obtido: o hover mostra Este passo 1 cel., Rota 1 passos, Apos mover 0/4 celulas; o clique normal devolve Sem rota — celula bloqueada ou fora do alcance e o dispatch de pointerdown + pointerup + click no canvas devolve Mesma celula. A Lira fica em (782,596) com 6 PA. Pode ser gesto do portal, nao confirmado como bug do app.
- Regente (16:26): reproduzido no portal Site local. Sem edicao de codigo.
- URL: http://localhost:3000/mesa/aventura-teste-farejador-8sghq

## BV-022 Outros alcances de habilidades podem estar errados (P3, a confirmar)
- Severidade: P3 a confirmar; ressalva 3 da Lupa na revisao de BV-012.
- Sintoma no gerador: Julgamento Ardente diz 9 m com 9 cel.; Mente Partida diz 18 m com 6 cel.; Puxao Abissal diz 9 m com 5 cel.; Carga do Juramento diz 12 m com 6 cel.
- Esperado: cada alcance em celulas bater com a distancia em metros do texto e do livro (1 cel. = 1,5 m).
- Regente (16:33): conferir no LIVRO-DO-JOGADOR.md antes de corrigir; item 23b na pagina 11.
- Sem edicao de codigo neste item.
- URL: http://localhost:3000/compendios/habilidades
