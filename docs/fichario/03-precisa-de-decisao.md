# 03 Precisa de decisão

Itens que dependem do dono.

## D-01 Texto de livro comercial em repositório público (urgente)
O repositório MaulXD/MXDRPG é público. livros/um-anel/ está versionado com texto corrido dos livros de O Um Anel: 12 capítulos em inglês na main e cerca de 30 arquivos (uns 19.300 linhas) em PT-BR no branch fix/login-google-e-responsivo-um-anel, já enviado ao GitHub, incluindo as aventuras de Wilderland e Mirkwood traduzidas por terceiro. Os PDFs e .tmp-traducao/ não estão no git.
Opções: (a) tornar o repositório privado; (b) tirar livros/um-anel/ do git e reescrever o histórico; (c) manter só estatísticas e resumo próprio; (d) deixar como está.
Recomendação: (a) agora, que é reversível e imediato, e decidir (b) ou (c) com calma. Nada foi alterado.

## D-02 Branch com 68 commits fora da main e fora de produção
fix/login-google-e-responsivo-um-anel está 68 commits à frente da main, sem PR. Produção roda a main de 31/07. Traz login/responsivo, quase todo o Um Anel e 5 correções do Eldarin.
Opções: abrir PR único; separar as 5 correções do Eldarin num PR pequeno e subir primeiro; esperar teste em mesa real.
Recomendação: PR pequeno com as correções do Eldarin primeiro.

## D-03 Migrações que ninguém aplica
npm run db:migrate aplica só schema.mariadb.sql; as 19 migrações em scripts/db/migrations/ não são lidas por nenhum script, e scripts/db/schema.sql é o schema Postgres antigo montado como init do MariaDB no docker-compose.local.yml.
Decidir: apagar o legado Postgres e as migrações mortas, ou manter como histórico.

## D-04 Guia dos agentes desatualizado
docs/CLAUDE-PROJETO.md (leitura obrigatória pelo AGENTS.md) ainda fala em Clerk, Postgres/Neon e não cita o Um Anel. O código usa OAuth manual + cookie assinado e MariaDB. Posso reescrever; preciso só do sim.

## D-06 Vida editada fora da mesa (consequência do B1, baixa prioridade)
Com a correção do B1 (commit 31841ac), se o máximo de vida não muda, a mesa mantém a vida dela. Então reconstruir a ficha pelo wizard ou editar a vida atual fora da mesa, sem mudar o máximo, não muda a vida de quem já está na mesa. Recomendação: manter assim (a mesa manda durante a sessão) e, se o mestre precisar, ajustar a vida pela própria mesa.

## D-07 Vida temporária na subida de nível
A ficha já não perde vida temporária ao normalizar (3b37186), mas identity.ts, level-up.ts e gm-actor-progress.ts ainda a descartam. O livro não diz se vida temporária sobrevive à subida de nível. Recomendação: sobrevive (é efeito de combate, não da ficha).

## D-08 Balanceamento (Balança, etapa 2)
No nível 1, com atributo e acerto: Bárbaro +79% e Feiticeiro +87% de dano acima da mediana; Bruxo -73%, Ladino -50%, Bardo -40%. Feiticeiro conjura com INT no código e o livro diz Carisma. Detalhes em docs/fichario/propostas/balanceamento.md. Nada muda no livro sem você.

## D-10 Tempo do auto-passe de turno (R-02)
Quando o token fica sem PA, o turno passa sozinho depois de uma pausa. O livro (LIVRO-DO-JOGADOR.md:253), o PRD e VTT-ACOES-PA-AREAS dizem cerca de 1,5 s; COMBATE-MESA.md diz 500 ms; o código usa 150 ms desde 24/06 (commit 1e34627, levada de performance que você pediu para a mesa ficar mais rápida). O mestre pode mudar por sala.
Opções: (a) padrão 1500 ms como o livro, salas existentes mantêm o que têm; (b) manter 150 ms e corrigir o livro e os docs.
Recomendação: (b), porque foi escolha sua de ritmo; só alinhar o livro e os docs. Nada foi mudado.

## D-11 Dano do aprimoramento +N das armas não entra na mesa (BV-010)
O chip do compêndio mostra 1d4 nas Adagas +1/+2/+3 porque o dado não tem campo de bônus de dano. O +N está só no texto ('Aprimoramento +1: soma +1 ao ataque e +1 ao dano') e em enchant (data/compendiums/armas.json, ex.: linha 6328). O motor também não aplica: lib/combat/attack.ts:185 usa só weapon.dano.formula, e enchant só é lido em lib/character/armor-defense.ts. Mostrar 1d4+1 no chip diria ao jogador um dano que a mesa não rola.
Opções: (a) o motor soma enchant ao dano da arma (attack.ts) e o chip mostra 1d4+N, com teste de dano na mesa; (b) o pipeline do livro gera um campo de dano bônus e o motor lê esse campo; (c) manter 1d4 e corrigir o texto do catálogo.
Recomendação: (a), porque o texto do catálogo diz +1 ao dano. Risco: dano errado na mesa (P1 se confirmado). Nada foi alterado.

## D-12 Clamp de PA guardado usa a recuperação (5) e não o teto (9)
lib/character/normalize.ts:124 e lib/character/identity.ts:93 limitam resources.pontosAcao.value ao paMax, que é a recuperação por turno (5). A mesa guarda até 9. Um save que passe por esses caminhos pode cortar PA guardado de 9 para 5. Não confirmei qual caminho foi visto com 9 fora da mesa (BV-014); a exibição já mostra min(atual, 9)/9 (BV-014, lib/combat/pa-economy.ts paPoolMaxForSheet).
Opções: (a) o clamp usa paPoolMaxForSheet, e resources.pontosAcao.max passa a ser 9 (muda o dado guardado e quem lê max, como combat-token-pa.ts:145 e level-up.ts:297); (b) manter max = 5 e o clamp usa o teto 9 só no valor; (c) deixar como está.
Recomendação: (b), por ser o menor passo; confirmar com um save real antes. Nada foi alterado.

## D-05 CI não roda teste
O CI roda build e sync de dados, mas não npm test nem lint (o lint nem roda hoje). Ligar no CI?

## D-09 B2: fonte da imagem do token e falha de gravação engolida
Código confirmado: updateRoomActor (lib/room/handlers/actors.ts:75-77) engole a falha de gravação da ficha e mesmo assim grava a sala. Na sincronização seguinte, mergePortraitFromRoom (lib/room/adventure-actors.ts:43-63) devolve a imagem antiga da ficha. Não isolei o motivo da falha de gravação: preciso do log de produção (persist sheet failed) e do tamanho do payload. Opções: (a) ficha é a única fonte e o token só exibe; (b) token tem imagem própria que vence a ficha; (c) propagar o erro em vez de engolir (correção mínima, faz a falha aparecer em vez de sumir). Recomendação: (c) já, e (a) depois que o log confirmar a causa. Ponto de decisão: qual fonte manda. Nada foi alterado no código.

## D-13 Movimento não aparece até recarregar (BV-018/019)
Causa provável: uma cena pendente mais velha é reaplicada com force em components/vtt/Battlefield.tsx, tanto em flushPendingSceneSnapshot quanto no pending guardado durante a FX (applyCombatSnapshot via useBattlefieldCombatFxQueue). O token volta à célula antiga e o PA ao valor anterior até recarregar.
Risco: a guarda por revisão trava a mesa quando o servidor reinicia sem banco, porque a revisão volta a 1 (lib/room/adventure-room.ts:45) enquanto o cliente fica com ~40; respostas com force passam a ser descartadas. Com banco, a revisão é monotônica na prática.
Recomendação: corrigir com o dono presente, decidindo como casar revisão e reinício sem banco. Nada foi alterado; a tentativa anterior foi desfeita.


