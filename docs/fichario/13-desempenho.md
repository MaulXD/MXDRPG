# 13 Desempenho (loop 21/11, 12:00-17:00)

Pedido do dono: o site está lento, demorado e bugando no servidor. Loop de 5 horas para melhorar.

## Medições de partida (21/11 11:50)
- Oficial (versão main be69f6f): cada pedido leva 0,6-1,4 s. Conexão + TLS ~0,4 s (servidor longe); /api/health ~0,2-0,4 s de servidor. Home 1,4 s (render dinâmico, no-store).
- Local (dev): piso fixo de ~300 ms em QUALQUER rota, até 401 sem login.
- Mesa parada, 1 jogador, 60 s: friends/messages/unread 15x, friends/invites 6x, friends/requests 6x = 27 pedidos/min só de amigos. Não pausa com a aba escondida.
- /compendios devolve ~500 KB de HTML.
- O oficial ainda não tem as correções de sincronização da mesa (emissor em globalThis etc.): publicar o branch é decisão do dono.

## Fila
- P-01 (Bigorna) Polling de amigos: juntar unread+invites+requests num pedido só, 15 s, pausar com aba escondida, atualizar ao voltar o foco; 4 s só com janela de chat aberta. Meta: mesa parada <= 4 pedidos/min de amigos.
- P-02 (maestro) Piso de 300 ms: medir em build de produção (next start) para separar o que é do modo dev.
- P-03 (Corvo) Levantamento: consultas ao banco por pedido (sessão, auth/me, presença, sala) e páginas que poderiam ser estáticas.
- P-04 /compendios com 500 KB de HTML.
- P-05 Home e páginas públicas dinâmicas (no-store) no oficial.
- P-06 (Farejador) Tempo de mover/atacar/chat na mesa, antes e depois.

## Medicoes P-06
Login farejador_teste01 OK na 3100 (etapa 22). Mesa aventura-teste-farejador-v44fo, build de producao localhost:3100. Contagem por Resource Timing: rota sem query, 3 s de espera depois de cada acao, 60 s na parada.

| Acao | Pedidos | Rotas (pedidos) | Tempo total (ms) |
|---|---|---|---|
| (a) recarregar a mesa | 16 | auth/me 2 REPETIDO, friends/messages/unread 3 REPETIDO, friends/invites 1, friends/requests 1, friends 1, notifications 1, health 1, edit-requests 1, inventory-requests 1, my-inventory-requests 1, my-edit-requests 1, room presence 1, sync-actors 1 | 405 |
| (c) chat, 1 mensagem | 4 | room POST chat 1, room GET 2 (possivel REPETIDO), sync-actors 1, friends/messages/unread 1 | 22 |
| (d) painel Ficha, sem personagem | 3 | tor-characters 2 (possivel REPETIDO), friends/messages/unread 1 | 17 |
| (e) parada 60 s, Chat aberto | 43 | friends/messages/unread 15, friends/invites 6, friends/requests 6, room presence 6, notifications 2, edit-requests 2, inventory-requests 2, my-inventory-requests 2, my-edit-requests 2 | 406 |

Observacoes:
- (b) nao medido: nenhum token no mapa (Nenhum token visivel no momento). Nao invoquei monstro para criar token.
- (d) so o painel Ficha: a mesa nao tem personagem (Nenhum aventureiro criado ainda). Ficha de personagem nao aberta.
- Parada (e) com o painel Chat aberto, que puxa unread a cada 4 s. Amigos: 27 por minuto (unread 15 + invites 6 + requests 6), o mesmo numero de antes do P-01. Nao aparece /api/friends/pulse. Ou a 3100 e build anterior ao d70bf5e, ou o P-01 nao chega aqui: conferir antes de dar P-01 como feito.
- Presenca: 6 por minuto (10 s). Acao mais cara: recarregar a mesa, 16 pedidos e 405 ms somados. Navegacao: DOMContentLoaded 39 ms, load 40 ms.
- Parada: 43 pedidos por minuto com o chat aberto.
- 


## Feito
- P-01 d70bf5e: amigos num pedido só (/api/friends/pulse) a cada 15 s, parado com aba escondida. 27 -> 4 pedidos/min. Lupa aprovou. BV-078 passa de 10 s para até 15 s (decisão do maestro).
- P-07 31e9883: convites e pedidos de amizade em lote: 2+2N -> 2 a 3 consultas. Pulso conta pela lista (não conta aventura apagada). Lupa aprovou; tsc + npm test limpos ok.
- P-08 dac6232: presença autoriza 1x por pedido (era 2x), clerk ids em lote, GET de 10 s pausa com aba escondida (SSE mantém online). Lupa aprovou; tsc + npm test limpos ok.
- P-04 4ca1c29: compêndio um pacote por vez (página e painel da mesa); /compendios anônimo 538 -> 400 KB; monstros só para o mestre. Lupa aprovou; tsc + npm test limpos ok.
- P-12 9443ef8: chat e dados aplicam a resposta do POST (2 GET da sala -> 0 por mensagem); auth/me não repete com usuário do servidor; notificações/solicitações pausam escondido. Lupa aprovou na 2a; tsc + npm test limpos ok.
- P-13 9e6f852: Conselho, Jornada, Companhia e perícias da ficha aplicam a resposta da gravação (refreshOrApply). Lupa aprovou na 2a; tsc + npm test limpos ok.
- P-14 15688c9: pedidos de ficha/inventário ao mestre pausam escondidos (5 s pendente, 30 s sem); Olho aplica a gravação. Lupa aprovou; tsc + npm test limpos ok.
- P-17 9d7e1d8: rotas da mesa devolvem a sala filtrada para quem pediu (10 tor-*, chat, ficha, subida de nível). Jogador não recebe mais desfazer/log de combate, vida/PA de monstro nem tokens sob névoa. Lupa aprovou na 2a.
- P-15 c8f352e: 10 funções do Um Anel desembrulham { snapshot }; postura, empurrão e tarefa quebravam a mesa (aplicavam o envelope como sala). Lupa aprovou na 3a; tsc + npm test limpos ok.
- P-16 829c3a2: fichas do Um Anel não recarregam a cada mensagem do chat (revisão de dados; rota do chat marca fromChatBox; revisão que sobe além da caixa recarrega). Lupa aprovou na 4a; tsc + npm test limpos ok.
- P-18 1c60778: amigos leem uma vez só ao voltar para a aba (visibilitychange + focus). Lupa aprovou; tsc + npm test limpos ok.
- P-19 c18dd21: SSE checa sala apagada a cada 30 s (era 5 s) e o passe automático não consulta o banco sem combate na memória. Lupa aprovou na 2a.
- P-20 deefd33: ação na mesa não busca a sala de novo (espera a resposta em voo); salto de revisão segura a revisão e busca o que faltou; GET entra inteiro (sem laço). Lupa aprovou na 3a; tsc + npm test limpos ok.
- P-21 45f1712: sync-actors roda ao abrir a mesa, não a cada revisão em cada jogador. Lupa aprovou; tsc + npm test limpos ok.
- BV-085 fa0d170: aplicar vida no painel do mestre funciona no 1o clique (sync não sobrescreve campo editado). Achado na regressão etapa 24c. Lupa aprovou.
- P-09 9442d10: public/ (assets, brand, icons, favicon) com cache de 1 dia + stale-while-revalidate; sw.js fora. npm test limpo ok.
- Medição: build de produção local responde em 4-30 ms; o piso de 300 ms era só do modo dev. No oficial, ~400 ms de cada pedido é conexão (RTT ~200 ms, servidor longe). Ganho maior = menos pedidos + cache. Mudar o servidor de região ou pôr CDN é decisão do dono.

## Em revisão
- P-15 (Bigorna) rotas do Um Anel com envelope {snapshot}: cliente desembrulha e aplica. Lupa reprovou: as rotas devolviam a sala sem filtro por jogador.
- P-17 (maestro, prioridade) 10 rotas do Um Anel passam por viewerSnapshotResponse (jogador não recebe desfazer/log do combate nem HP/PA de monstro). tor-session e settings são só do mestre. Pré-existente no fio; o P-13 só aplicava tor-session (mestre), então nada vazou na tela.
- P-16 (Bigorna + maestro) fichas do Um Anel não recarregam a cada mensagem: revisão de dados; chat de sistema/combate (gravação narrada) ainda recarrega.
- Correção 76e7f3d: verify-p12 contava os pollings de antes do P-14 (a suíte limpa do P-14 tinha falhado; o maestro lia o código de saída errado).

## Proposta para depois
- P-22 sinos (levantamento do Corvo em propostas/desempenho.md): juntar notificações + 4 rotas de pedidos numa rota só cortaria 10 -> 2 pedidos/min no mestre e 6 -> 2 no jogador. Não feito no loop: ganho só em segundo plano (as 5 já pausam com a aba escondida desde o P-12/P-14) e o risco é de permissão (a rota única precisa devolver gm=null ao jogador e alinhar canManageRoom com canManageAdventure). Decisão do maestro: fica para uma rodada própria, com revisão de segurança.

## Débitos conhecidos
- Sala apagada: o SSE só manda 'gone' se getRoomRevision der null, mas nada tira a sala do mapa em memória (lib/room/internal/registry.ts:164); a detecção pode não acontecer. Pré-existente (Lupa, P-19).

## Próximos (do levantamento do Corvo, propostas/desempenho.md)
- P-07 (Bigorna, em curso) N+1 em convites e pedidos.
- P-08 presença: requireRoomView 2x por chamada, N+1 de clerk, poll 10 s.
- P-04 /compendios: dados por pack sob demanda em vez de 500 KB inline; página sem cookies().
- P-10 usuário materializado do banco a cada pedido (auth/me etc.): cache curto por id.
- P-11 ensureDbMigrations nas rotas de leitura.

## Medicoes P-06 depois
Etapa 23. Build de producao localhost:3100 (commit 829c3a2, P-01 a P-17). Login farejador_teste01. Mesa aventura-teste-farejador-v44fo. Resource Timing: performance.clearResourceTimings() antes de cada acao, 3 s de espera depois de cada acao, 60 s na parada (em janelas de 8,5 s, aba visivel).

| Acao | Antes (etapa 22) | Depois (etapa 23) |
|---|---|---|
| (a) recarregar a mesa, pedidos /api | 16 pedidos, 405 ms somados; DCL 39 ms, load 40 ms | 2 medicoes: 14 pedidos (1a) e 12 pedidos, 274 ms somados (2a); DCL 62 ms, load 81 ms (2a) |
| (a) repetidos | auth/me 2, friends/messages/unread 3 | auth/me 1, friends/pulse 2 (1 repetido) |
| (b) mover token | nao medido (sem token no mapa) | nao medido (sem token no mapa) |
| (c) chat, 1 mensagem: pedidos | 4, 22 ms: POST chat 1, GET room 2, sync-actors 1, unread 1 | 4, 29 ms: POST chat 1, GET room 1, sync-actors 1, friends/pulse 1 |
| (c) GET /api/room depois do POST | 2 | 1 (esperado 0) |
| (d) painel Ficha | 3 pedidos, 17 ms: tor-characters 2, unread 1 | 3 pedidos, 18 ms: tor-characters 2, friends/pulse 1 |
| (e) parada 60 s, Chat aberto, aba visivel | 43 pedidos, 406 ms: unread 15, invites 6, requests 6 (amigos 27), presence 6, notifications 2, edit/inventory/my-edit/my-inventory 2 cada | 20 pedidos, 207 ms: friends/pulse 4 (amigos 4/min, meta cumprida), presence 6, notifications 2, edit/inventory/my-edit/my-inventory 2 cada |
| (f) parada 60 s, aba escondida | nao existia | nao feito: o portal mantem document.visibilityState = visible e a propriedade nao pode ser alterada (ja testado: Cannot redefine property) |

Outras diferencas:
- Amigos na parada: 27 -> 4 por minuto. Pedidos totais na parada: 43 -> 20.
- Chat: a mensagem de teste aparece na tela (texto conferido). Ainda sobra 1 GET da sala depois do POST; o esperado e 0.
- O reload variou entre as 2 medicoes (tor-characters 2 aparece so na 1a); a 2a esta sem tor-characters.
- Sem token no mapa, nao houve medicao de mover token (b) nem de atacar/magia/turno: nao criei token para isso.
- Presenca continua 6 por minuto (10 s), a parada agora e a maior fonte de pedidos.

## Regressao etapa 24 (Farejador, parcial)
- Sessao: mestre farejador_teste01 em 'Teste maestro' (3100); jogador jogador_teste02 em 'Site local' (3100). Contas separadas, as duas logadas ao mesmo tempo (login do jogador nao derrubou o mestre).
- Mesa: /mesa/aventura-teste-farejador-v44fo. E Um Anel (titulo da pagina), nao Eldarin como dizia o roteiro.
- (1) Chat: OK. Jogador -> mestre aparece no texto do mestre em ate ~3 s; contador 'Chat, 1 mensagem nova' sobe no mestre. Mestre -> jogador: texto aparece e contador 'Chat, 1 mensagem nova' sobe no jogador (com o chat fechado).
- (2) Rolador: OK. 1d12 do jogador aparece no chat do mestre em ~3 s (13:11 jogador_teste02 1d12 -> 3).
- (3)-(6): nao feito nesta rodada. Mapa vazio, sem token; a aba Companhia nao aparece na barra do mestre, e a ficha do personagem/XP ainda nao foi localizada.
- (7) Console: logs-start ligado nos dois; leitura final pendente.

## Regressao etapa 24b (Farejador)
- Sessao: mestre farejador_teste01 em 'Teste maestro' (3100) e jogador jogador_teste02 em 'Site local' (3100), os dois logados ao mesmo tempo. Mesa /mesa/aventura-teste-farejador-v44fo.
- Login: OK nos dois lados. Site local mostra 'Online 2' com as duas contas na lista. No mestre o contador mostrou 'Online 1' numa leitura inicial e 'Online 2' depois; nao confirmado se e atraso.
- (3) XP pelo mestre: NAO FEITO. O jogador nao tem personagem nesta aventura (Personagens jogaveis vazio nos dois lados).
- (4) Vida pelo mestre: NAO FEITO. Mesmo motivo.
- (5) Token do personagem do jogador: NAO FEITO. Sem personagem. Mapa vazio, sem token.
- (6) Monstro invocado: NAO FEITO. O botao Invocar nao aparece na barra do mestre.
- (7) Console: sem erro capturado nos dois lados (logs vazios).
- Falha: BV-084 (P1). A barra do mestre nao tem o painel Mestre (Sala, Jogadores, Criaturas, Combate), que a Etapa 6 tinha encontrado. Sem ele os passos 3 a 6 nao podem ser feitos.
- Para destravar: criar um personagem para o jogador nesta aventura e confirmar onde fica o painel Mestre agora.

## Regressao etapa 24c (Farejador, passos 3-6)
Build de producao localhost:3100. Mestre farejador_teste01 (Teste maestro) e jogador jogador_teste02 (Site local), ambos em /mesa/aventura-teste-farejador-8sghq. Lira Teste Farejador e do jogador, Goblin 1 e Goblin 2 no mapa. Sem recarregar o outro lado.
- (3) OK: mestre deu 10 XP a Lira (ficha do jogador aberta). Lado do jogador: 350/200 -> 360/200 em cerca de 0,5 s. (Antes, 50 XP: 300 -> 350, nao medido ao vivo.)
- (4) OK com ressalva: mestre mudou a vida da Lira para 15. Lado do jogador: 22/22 -> 15/22 em cerca de 0,4 s, na segunda tentativa de APLICAR VIDA (ver BV-085).
- (5) NAO CONCLUIDO: arrastar a Lira no mapa e clicar-clicar no destino (lado do jogador, com hover antes) nao moveu o token; a posicao e o PA (6/9) ficaram iguais. Sem movimento nao deu para conferir o PA no HUD. Falta um gesto de movimento documentado na pagina 12, ou alguem que mova no navegador.
- (6) OK: na iniciativa do jogador, Goblin 1 e Goblin 2 aparecem so com o nome, sem numero de vida.
- (7) Console: sem erro capturado nos dois lados (logs vazios).
- Falhas: BV-085 (P3, a confirmar). Passo 5 sem resultado.

## Medicao final etapa 25
Build 45f1712 (P-01 a P-21), localhost:3100. Mesa aventura-teste-farejador-v44fo, conta farejador_teste01 (portal Teste maestro). Resource Timing: performance.clearResourceTimings() antes de cada medicao; (c) 5 s depois do envio; (e) 60 s de parada com a aba visivel. Chat: a mensagem 'teste etapa 25' aparece na tela (conferido).

| Acao | antes (etapa 22) | meio (etapa 23) | final (etapa 25) |
|---|---|---|---|
| (a) recarregar a mesa, pedidos /api | 16 pedidos, 405 ms somados | 14 (1a) e 12 (2a), 274 ms somados (2a) | 14 pedidos, 280 ms somados: auth/me 1, notifications 1, friends/pulse 2, friends 1, health 1, edit/inventory/my-edit/my-inventory 1 cada, presence 1, tor-characters 2, sync-actors 1 |
| (c) chat, 1 mensagem: pedidos depois do POST | 3: GET room 2, sync-actors 1, unread 1 | 3: GET room 1, sync-actors 1, friends/pulse 1 | 2: GET room?since=57 1, friends/pulse 1 |
| (c) GET /api/room depois do POST | 2 | 1 (esperado 0) | 1 (esperado 0) |
| (c) sync-actors depois do POST | 1 | 1 (esperado 0) | 0 |
| (d) painel Ficha | 3 pedidos, 17 ms | 3 pedidos, 18 ms | nao medido nesta rodada |
| (e) parada 60 s: pedidos | 43 pedidos, 406 ms | 20 pedidos, 207 ms | 23 pedidos, 251 ms |
| (e) parada 60 s: amigos (friends/pulse) | 27 | 4 | 5 |
| (e) parada 60 s: presence | 6 | 6 | 7 |
| (e) parada 60 s: GET /api/room | nao contado | 0 | 1 |
| (e) parada 60 s: unread, invites, requests | 15, 6, 6 | nao aparecem | nao aparecem |
| (b) mover token, (f) aba escondida | nao medido | nao medido | nao medido: sem token no mapa; aba escondida nao reproduzivel no portal |

Leitura: a parada caiu de 43 para 23 pedidos (cerca de 47% a menos) e os amigos ficaram em 4 a 5 por minuto. Mas o final (23) ficou um pouco acima do meio (20): presence subiu para 7 e apareceu 1 GET /api/room. No chat, o sync-actors saiu, porem ainda sobra 1 GET da sala depois do POST, entao o esperado (so o POST) nao foi atingido. Uma medicao por cenario; a variacao entre reloads ja foi vista na etapa 23.

final 25b (build 6e4912e, mesa aventura-teste-farejador-v44fo, farejador_teste01, portal Teste maestro): 3 envios de chat, cada um com performance.clearResourceTimings() antes, espera de 5 s e leitura dos pedidos /api (rota sem query). GET /api/room depois do POST nas 3 vezes: 0, 0, 0. sync-actors: 0 nas 3. Pedidos depois do POST: (1) chat, presence, friends/pulse 1; (2) chat, presence, friends/pulse 2; (3) chat, presence, friends/pulse 2, notifications 1, edit-requests, inventory-requests, my-edit-requests, my-inventory-requests 1 cada. friends/pulse apareceu por coincidencia do relogio de 15 s (nas rodadas 2 e 3). presence apareceu 1 vez nas 3 (nao estava no esperado, so o POST). Limite: o Resource Timing nao mostra o metodo HTTP, entao o POST foi identificado pela rota /chat. Esperado (so o POST) atingido no GET /api/room e no sync-actors; presence e as rotas de fundo ainda aparecem.


