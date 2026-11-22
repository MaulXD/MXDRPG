# 03 Precisa de decisão

Itens que dependem do dono.

## Situação em 21/11/2026 (noite)
Conferido no git e no código: as seções abaixo guardam o texto original da decisão, mas boa parte já foi feita.
- Feitas: D-02 (merge na main e deploy), D-03 (ad8925f), D-04 (4c777b9, 30a2fc6), D-05 (ad8925f, npm test no CI), D-07 (e18c339), D-09 (8a75397, 9bb2ef1), D-10 (a83967e, 150 ms no livro), D-11 (9d9ec2f), D-12 (7ad1c07), D-13 (786c5e0), D-14 (dbaade2), D-15 (dfef886), D-16 (a83967e), D-24, BV-029b (91be485), BV-045b (0981ce5), parser do grimório (verify-parser-grimorio), aprovação de inventário no servidor.
- D-23: feita. (a) truques no passo Equipamento; (b) tabela de kits do Bruxo no livro e no código só com a lista Pacto até o nível 1: Mãos Ardentes · Chama de Vinha · Lâmina de Espírito e Armadura Arcana (verify-truques-wizard, verify-kits-livro). Cajado criado no compêndio (WPN-O07, 22/11) e já no kit 2.
- Itens do livro que faltavam no compêndio (07, KITS-LIVRO): Cajado (WPN-O07) e Espada Curta (WPN-S13) criados em 22/11; Bastão do Espiritualista virou Cajado no livro. Brasa Espectral saiu do livro (kit 1 do Mago corrigido junto com Bardo, Druida e Paladino: magia só da lista da classe até o nível 1).
- Seguem com o dono: D-01, D-06 (recomendação: manter), D-08, D-20, D-21, D-22, D-25, CUS-dano, BV-033 (Um Anel na mesa).

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

## D-14 Cadastro sem banco continua aceito pela API (N-02b)
A tela /entrar agora esconde Criar conta quando não há contas persistentes, mas app/api/auth/register ainda aceita cadastro pelo registro local (lib/auth/user-store.ts, ramo sem dbSqlReady). A frase Novos cadastros estão indisponíveis no momento vale só para a interface.
Opções: (a) travar a rota quando não há banco (muda autenticação, fora do escopo do Regente); (b) manter a API como está e documentar que a indisponibilidade é apenas visual. Escolha conservadora: (b) até o dono decidir. Nada foi alterado na API.

## D-15 bankedPa legado e a PA mostrada (A-09)
O rótulo do pool saiu do log do mestre, mas bankedPa continua em ActiveCharactersPanel e MapTokenList porque materializeCombatPa (lib/combat/pa-token-state.ts:10-14) soma o valor à PA exibida. Se um token antigo tiver bankedPa > 0, o log passa a mostrar uma PA menor que os mostradores compactos. Não achei dado com bankedPa diferente de 0.
Opções: (a) mostrar pa + bankedPa também no log do mestre; (b) zerar o campo legado na leitura. Escolha conservadora: (a), sem mexer na regra de PA, até o dono decidir. Nada foi alterado além do rótulo do log.

## D-16 CATÁLOGO-HABILIDADES-TÁTICAS desatualizado (BV-022)
O gerador e o JSON já usam 6 células para Puxão Abissal (9 m), conforme o LIVRO-DO-JOGADOR.md, mas livros/CATALOGO-HABILIDADES-TATICAS.md:77 ainda diz 5. A Lupa não pode editar livros/.
Opções: (a) corrigir o catálogo para 6; (b) manter como está e aceitar a divergência. Escolha conservadora: (a), mas livro é fora do escopo do Regente neste loop; nada foi alterado em livros/.

## D11 (Ataque Furtivo do Ladino): decidido pelo dono, nao esta mais pendente
Decisao: o furtivo vale so em ataque com arma (nunca magia de area, habilidade ou desarmado); no maximo uma vez por turno do Ladino (token.sneakAttackUsedThisTurn, zerado com o desconto de PA no inicio do turno); no ataque multiplo so o primeiro acerto do turno recebe; no critico o dado rola de novo (livro:421). O furtivo do goblin monstro continua separado (regra de monstro), com comentario apontando para lib/combat/sneak-attack.ts. Registro feito pelo Bigorna (D11 r3).

## D-19 Ataque Furtivo no combate livre: qual e a janela do 'uma vez por turno' (D11)
No combate livre (sem fila de turnos) nao ha turno nem rodada: o motor so zera o PA por turno (startTurnPaFull) e na entrada do combate (onEnterCombatFree). Por isso a flag sneakAttackUsedThisTurn do Ladino fica ate o combate acabar ou ate o token ter um inicio de turno. Hoje o Ladino ganha o furtivo uma vez por combate livre inteiro, nao uma vez por turno. A regra do D11 fala de turno e nao cobre esse modo.
Opcoes: (a) por rodada: exige um contador de rodada no combate livre, que hoje nao existe (lib/room/combat.ts:166 so avanca a rodada na fila de turnos); (b) por combate livre inteiro (comportamento atual), registrado como regra; (c) por ataque, sem limite, igual ao texto literal do livro. Recomendacao: (a) se o combate livre ganhar rodada; ate la, (b) como decisao explicita. Nada alterado no motor; verify D11 cobre a janela atual.
RESOLVIDO (decisao do dono, D11 r4): o limite de uma vez por turno so vale em combat_turn (com fila). Em combat_free e exploration nao ha turno: sem limite e sem gravar a flag. A checagem usa combatPaPhaseFromFlags (mesma regra de resolveCombatPaPhase, lib/combat/combat-pa-phase.ts) dentro de resolveAttack.

BV-033 (Bigorna, risco alto, nao corrigido): o sync da mesa (lib/room/adventure-actors.ts, syncAdventureActorsForRoom) so puxa fichas Eldarin para room.actors. Fichas do Um Anel nunca viram ator da mesa: nao aparecem como token nem no Ordem de turno da mesa. A aventura agora lista as fichas do Um Anel (correcao pequena), mas a mesa continua sem elas. Decisao: estender o sync para o Um Anel (toRoomActor do Um Anel) ou manter a mesa so Eldarin por enquanto. Sync da mesa = risco alto, por isso nao mexi.

## CUS-dano (Bigorna): dano que o dado tem e o livro nao tem
Nada removido ainda. Trechos do livro:
- Ventania (dado: 2d6 contundente). Livro, _parte_x_magias_v4_revisada.md:213-214: "STR CD ou empurrao 4,5m; apaga chamas e dispersa gases/esporos." Sem dano.
- Terremoto (dado: 6d6 contundente). Livro, LIVRO-DO-JOGADOR.md:3773: "Raio 30m: DES CD ou Prostrado; risco de colapso na masmorra." Sem dano.
- Esporos Necroticos (dado: 1d6 necrotico). Livro, LIVRO-DO-JOGADOR.md:3853: "Nuvem 1,5m: criaturas CON CD ou Envenenado 1 rodada." Sem dano.
Opcoes: (a) tirar o dano do dado, como proposto em docs/fichario/propostas/custos-e-danos.md; muda o que essas magias fazem no VTT. (b) manter o dano e aceitar a divergencia do livro. Decisao do dono.
Estado: gerador e JSON nao mudaram nesses tres. scripts/verify-custos-livro.mjs garante que o dano continua ate a decisao.
Observacao (sem mudanca): Parede de Fogo. O 2d8 radiante ja esta no texto (lore do livro), mas o campo de dano estruturado so tem 5d8 fogo. Se o radiante deve ser um dano separado, precisa de campo novo no schema: decisao, nao corrigido.

## CUS-lore (Bigorna): texto da Terremoto nao chega ao JSON
Causa: scripts/generate-compendium.mjs (linhas 650-661) troca a descricao pelo texto do grimorio (SPELL_LORE) quando o nome bate. Por isso a descricao do gerador (agora Raio 30 m (20 celulas)) so vale para magias sem lore. O JSON de Terremoto ja traz Raio 30m do livro.
BV-029 residual (Bigorna, 2026-11-21): a guarda que recusa magia para classe sem lista (CharacterSheet.tsx addFromCompendium) e so do cliente. Fichas de Guerreiro ja salvas com magia (ex.: Bola de Fogo na Lira) continuam com ela, e app/api/characters/[id]/inventory-request/route.ts nao confere a classe. Decidir: (a) limpar magias de classes sem lista nas fichas salvas (muda dado; precisa de script com aprovacao) e (b) validar classe no servidor (nao foi feito por ser mudanca de rota de API).

Problema separado, pre-existente: o parser parseSpellLoreBook pega texto alem da entrada. magias.json, Terremoto, descricao: "... risco de colapso na masmorra. --- ### NIVEL 9 Evocacao | Acao | 150m ...". Corrigir muda todas as entradas com lore. Decisao: corrigir o parser agora ou depois.

Correção (Lupa, 21/11): a aprovação do mestre no inventário é aplicada só na interface (CharacterSheetPopup.tsx:111); o PATCH de app/api/characters/[id]/route.ts aceita inventário do dono sem a regra. Decisão do maestro: corrigir no servidor também (próxima tarefa).

## D-21 Traços de classe não aparecem na ficha (BV-056)
A aba Habilidades só lista habilidades táticas do compêndio (as que vêm da trilha de subclasse). Traços de classe do livro, como Segundo Fôlego e Estilo de Combate do Guerreiro (LIVRO-DO-JOGADOR.md:937-938) e a Passiva de Assimilação do nível 2 (:954, :2062), não existem como dado no sistema, em nenhuma classe. Não é falha de gravação: é recurso que falta.
Opções: (a) seção 'Traços de classe' só de leitura na aba Habilidades, gerada do livro por classe e nível (sync:data); (b) modelar cada traço com efeito na mesa (muito maior). Sugestão do maestro: (a) agora, (b) caso a caso. Precisa do dono porque mexe no gerador a partir dos livros.

## D-22 Nomes dos atributos culinários no livro (BV-065, BV-071)
O sistema tem 4 atributos culinários: Extração, Forrageio, Fabricação e Fortitude (lib/character/class-scales.ts:32-37). O livro mistura nomes: a maioria das classes usa Forrageio e Coccão (LIVRO-DO-JOGADOR.md:968, 1012, 1087), mas o Feiticeiro diz 'Harmonização +3, Fabricação +2' (:1137) e o Bruxo 'Harmonização +2' (:1162); a raça humana fala em Harmonização (:532). O código lê Harmonização como Forrageio e Coccão como Fabricação. Decidir: (a) o livro passa a usar só os 4 nomes do sistema; (b) Harmonização e Coccão viram atributos próprios (mexe em regra). Sugestão: (a). Enquanto isso, o wizard mostra os 4 nomes do sistema.

## D-23 Escolha de truques no wizard (BV-072)
O wizard não deixa escolher truques: a revisão só lista o que vem do kit (CharacterCreationWizard.tsx:1040-1058; starter-kits.ts). O cantripsKnown de data/.../spell-lists.json:186 (Bruxo = 2) não é lido por nenhum código. O livro dá 2 truques ao Bruxo no nível 1 (LIVRO-DO-JOGADOR.md:1248). Além disso, a tabela de kits do Bruxo (:2113) dá Raio do Limiar (nível 3 no pacto) e Sussurro de Masmorra (truque do nível 4, :3126). Decidir: (a) passo novo no wizard para escolher os truques pelo cantripsKnown de cada classe; (b) corrigir a tabela de kits do Bruxo no livro. Sugestão: (a) e (b). É recurso novo, por isso ficou para o dono.

## D-24 Publicar o branch no site oficial (loop de desempenho, 21/11) — FEITO 21/11 15:45 (main 33f4299)
O oficial roda be69f6f (main). As correções de sincronização ao vivo da mesa (ficha, XP, vida, Jornada/Conselho; emissor em globalThis), segurança da rota de token e todo o loop de desempenho (P-01 a P-13) estão só no branch fix/login-google-e-responsivo-um-anel. Boa parte do 'lento e bugando' no oficial já está resolvida aqui e só chega com o merge na main e o deploy. Decisão do dono: quando publicar.

## D-25 Servidor longe dos jogadores (loop de desempenho, 21/11)
Medido daqui: RTT ~200 ms até www.mxdrpg.com.br; conexão nova (TCP+TLS) ~400 ms antes do primeiro byte; o servidor em si responde rápido (build de produção local: 4-40 ms). Cada pedido no oficial custa 0,6-1 s quase só de rede. Opções: (a) VPS em região no Brasil; (b) Cloudflare (ou outro CDN) na frente: TLS perto do jogador e cache dos arquivos fixos; (c) manter e só cortar pedidos (o que o loop já fez). Sugestão do maestro: (b) primeiro, é barato e não muda o servidor. Precisa do dono (DNS e conta).
Correção (21/11 17:10): o oficial JÁ serve HTTP/2 (ALPN h2; o navegador da mesa usa h2). O 'só HTTP/1.1' anterior era limitação do curl desta máquina, que não tem HTTP/2. Fica só a distância (RTT ~200 ms): opções (a) e (b) acima continuam valendo; a parte de HTTP/2 não precisa de nada.

## Rodada 5 (21/11), decisões do maestro
- BV-009/BV-020: o Regente tinha deixado 'sem ação'. Mudei: o erro de hidratação aparecia em todo console e atrapalhava a caça a bugs. Feito em 5a05b79.
- BV-052: XP negativo continua recusado (XP só sobe). Os 400 XP da Lira de teste ficam; é conta de teste.
- BV-057: subir um nível por vez fica (cada nível tem escolhas); com XP sobrando, o botão do próximo nível aparece em seguida.
- BV-058: level-up não recarrega PA (livro: PA só voltam no início do turno). Corrigido em 2c88ef0.
- SINGLETON: caches que só custam memória por cópia de módulo (packCache, clerkIdCache, ensured, inviteSyncCheckedAt, auto-pass-tick) ficam como estão.

BV-045b (Bigorna, risco alto: regra de permissao de inventario, nao corrigido): a ficha aberta em /personagem/[id] passa so canEdit para CharacterSheet (app/personagem/[id]/page.tsx:52-71). Dono de ficha de aventura tem canEdit true, entao inventoryEditMode cai no default direct: o pedido ao mestre (+ COMPENDIO e + CONSUMIVEL como request) nao aparece, e o dono edita o inventario direto, sem a aprovacao do mestre que a mesa aplica (requiresInventoryGmApproval). Decidir: o dono de ficha de campanha deve pedir ao mestre tambem fora da mesa? Se sim, a pagina precisa calcular o modo de inventario com a mesma regra da mesa.

BV-082 e copy de /sistema (Bigorna, 21/11): o botao Google so aparece com GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no servidor (lib/auth/oauth-config.ts); /api/health do local mostra oauth.google false. Nao e regressao de codigo. Mas app/sistema/page.tsx:49 e :192 dizem 'faca login com Google ou e-mail/senha' sem condicao. Decidir: (a) manter o texto (so o ambiente local esta sem as chaves) ou (b) fazer o texto depender de oauthProviders. Sugestao: (a).
DECIDIDO pelo maestro (21/11): (a). No site oficial o Google esta ligado, entao o texto e verdadeiro para quem le. Sem mudanca de codigo.


