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

