# 11 Fila de correções

Só correções, uma por vez: Bigorna corrige, Lupa revisa, o maestro confere e commita. Itens que dependem de decisão do dono ficam fora (página 03). Agentes: só mudam a coluna Estado da própria linha.

| Ordem | ID | Sev. | O quê | Estado |
|---|---|---|---|---|
| 1 (loop) | BV-018/019 | P2 | Movimento do token não aparece até recarregar (cena pendente mais velha reaplicada com force) | parado: D-13 |
| 1 | BV-005 | P1 | Passar turno sem confirmação (contraria D27) | feito, 2266453 |
| 2 | B2 | P1 | Imagem de token não salva (ficha, token, reload) | parado: log de produção e decisão D-09 |
| 3 | BV-004 | P2 | Atalho da barra lateral (Ficha, Invocar) não abre o painel | feito, 81d5c25 |
| 4 | A-10b | P2 | Limite de fichas só recusa depois do wizard inteiro | feito, 4ffef26 |
| 4b | BV-004b | P3 | openAsPopup e restore com setState aninhado | feito, 0c662d2 |
| 5 | A-12a | P2 | Janela flutuante pode ficar fora da tela para sempre | feito, 0c662d2 |
| 6 | A-12b | P2 | Rail no celular só com ícones, sem rótulo | feito, 71b8188 |
| 7 | R-02 | P3 | Auto-passe de 150 ms; o PRD aprovado diz cerca de 1,5 s | saiu da fila: espera decisão D-10 (página 03) |
| 8 | A-22 | P3 | dangerouslySetInnerHTML sem sanitização no compêndio (feito, 90623a4) | em revisão |
| 9 | A-12c | P3 | Atalhos (Alt+clique, Ctrl+clique) fora das dicas | feito, 9df7c1c |
| 10 | A-23 | P3 | .btn-primary e .btn-primary-cta duplicados (feito, 7ede178) | em revisão |
| 11 | A-10c | P2 | Limite global de 10 fichas sem guarda antes do wizard (feito, 519741f) | aprovada pela Lupa, sem commit |
| 12 | BV-006 | P3 | Aviso de hidratação no MesaSyncIndicator (title diferente entre servidor e cliente) | diagnosticado, sem ação: NativeTitleBlockScript troca title por data-site-tip no load + 2 frames; em dev a hidratação às vezes chega depois e o React reclama. Não afeta o usuário. Conserto exigiria mudar o script do site todo. |

| 13 | N-02 | P2 | Mensagem de erro com texto de mantenedor ('Rode npm run db:migrate...') chega ao usuário (lib/character/characters.ts:225) | feito, b3f055a |
| 13b | N-02b | P3 | Texto técnico de MariaDB em /entrar, recuperação e cadastro | feito, bb8622e; API ainda aceita cadastro sem banco (D-14) |
| 14 | BAL-D6 | P1 | Feiticeiro conjura com INT no código; o livro diz Carisma (propostas/balanceamento.md, seção 2) | feito, 4a46437 |
| 14b | BAL-D6b | P2 | Magias conhecidas do Feiticeiro usam a tabela 2 + nível-1 (spell-prep.ts:55); o livro diz nível + CAR (LIVRO-DO-JOGADOR.md:3498) | aprovada pela Lupa, sem commit |
| 14c | BAL-D6c | P3 | Salvaguardas proficientes do Feiticeiro = INT + CAR (sheet-skills.ts:182); conferir no livro | aprovada pela Lupa, sem commit; INT como salvaguarda segue em aberto (sem confirmação no livro) |
| 15 | BAL-D1..D5 | P2 | Proficiência de arma: sem bônus para Guerreiro, Ladino e Mago; Clérigo com Maça de Guerra que o livro não dá | na fila |
| 16 | A-09 | P3 | bankedPa sempre 0 e aparece em três telas | parcial, 803919d (só o log do mestre); mostradores compactos dependem do cálculo (D-15) |
| 17 | A-18 | P3 | Sem robots nem sitemap; doc de cores diverge do código | feito, 4f04e3b (só as três páginas públicas; ressalva: verify não prova que abrem sem login) |
| 18 | D-02 | P3 | CONTEXTO-SESSAO-ATUAL.md aponta branch e PR antigos | feito, 3c1b16c |
| 18b | BV-008 | P2 | Botão 'Colocar na mesa' do Invocar nunca habilita: a célula alvo só é registrada durante o arraste (trackGridHover em Battlefield.tsx:952 exige spawnDragActive), então o botão depende de um hover que não acontece. Arrastar continua funcionando com mouse de verdade. | feito (ver git log, BV-008) |
| 20 | BV-014 | P2 | Ficha fora da mesa mostra PA 9/5 (atual acima do máximo); na mesa 9/9 | aprovada pela Lupa, sem commit |
| 21 | BV-010 | P2 | Chips das Adagas +1/+2/+3 mostram 1d4 sem o +N de dano | decisão D-11 (página 03); Lupa reprovou como correção, aguarda escolha do dono
| 22 | BV-013 | P2 | /compendios/monstros mostra Armas; bestiário fora do compêndio | feito: bestiário é só do mestre por desenho; a rota agora volta ao índice |
| 23 | BV-012 | P3 | Agarrão: 5 células vs 9 m no texto | feito, 29cd6c0 |
| 23b | BV-022 | P3 | Outros alcances de habilidades discordam do texto: Julgamento Ardente 9 m/9 cel., Mente Partida 18 m/6 cel., Puxão Abissal 9 m/5 cel., Carga do Juramento 12 m/6 cel. (ressalva da Lupa em BV-012) | feito, a840d6d; CATÁLOGO diz 5 para Puxão (D-16) |
| 23c | BV-023 | P3 | Correntes Infernais (3 cel. vs 3 m) e Manto de Bruma (3 cel. vs 6 m, talvez área) | na fila, conferir no livro |
| 24 | BV-011 | P3 | Textos sem acento ou concordância em magias | na fila |
| 25 | BV-015 | P3 | /termos dá 404 (é o A-03: texto jurídico depende do dono) | decisão |
| 19 | BV-* | ? | O que o Farejador achar no combate da mesa (etapa 2b) | entra conforme chega |

Loop de 2 h (15:45 a 17:45 de 20/11): Bigorna e Lupa na fila, Farejador testando combate no portal.

## Rodada 3 (20/11, 22:40 em diante) — decisões tomadas, ver página 03
| ID | O quê | Quem | Estado |
|---|---|---|---|
| D-13 | Movimento só aparece depois de recarregar (BV-018/019) | Claude Code + Lupa | feito, 87c2613 |
| D-12 | PA guardado cortado para 5 ao salvar a ficha | Bigorna | feito, df56873 |
| D-11 | Dano do +N das armas aprimoradas | Bigorna | feito, 06a0a7a |
| D-07 | Vida temporária na subida de nível | Bigorna | feito, 0fd848f |
| D-09 | updateRoomActor engole erro de gravação (B2) | Bigorna | em andamento |
| D-14 | Cadastro sem banco aceito pela API | Bigorna | na fila |
| D-15 | Log do mestre mostra pa + bankedPa | Bigorna | na fila |
| D-16 + A-10a | Catálogo do Puxão Abissal; mensagem e docs do limite 3 por aventura | Bigorna | na fila |
| D-05 + D-03 | npm test no CI; init MariaDB no docker-compose.local | Claude Code | feito, 369ab6f |
| D-10 + D-04 | Docs do auto-passe; CLAUDE-PROJETO.md com a pilha real | OpenCode | feito, 6b23519 e 930eb68 |

## Rodada 4 (21/11, 00:45 em diante)
| ID | O quê | Quem | Estado |
|---|---|---|---|
| D-09b | Outros PATCH do ator (inventário, ficha, loadout, magias, set-hp) ainda engolem falha de gravação | Bigorna | em andamento |
| D13b | Dano radiante do Golpe Sagrado resistido como radiante, não com o tipo da arma | Bigorna | na fila |
| SOMBRA | Sombra Etérea (subclasse do Ladino) soma +1d6 necrótico ao Ataque Furtivo, pelo livro | Bigorna | na fila |
| NIT-15 | resolveGmLogPa usa resolvePaHudDisplay(token).spendable | Bigorna | na fila |
| ALC | Varredura: habilidades cujo alcance em células não bate com os metros do texto | Corvo | feito: 21 divergências reais em propostas/alcances.md, seção 6 |
| CUS-fix | Corrigir as 10 divergências de PA, dano e CD em propostas/custos-e-danos.md; 'dano que não existe no livro' (Ventania, Terremoto, Esporos) sai do dado | Bigorna | na fila |
| ALC-fix | Corrigir as 21 linhas do gerador e as 2 áreas (Onda de Trovão, Terremoto), regenerar com npm run sync:data | Bigorna | na fila |
| CAÇA-4 | Caça a bugs fora do mapa: Um Anel, ficha, inventário, painel, celular | Farejador | feito: BV-024 a BV-031 na página 06 |
| CSS-1 | BV-031, BV-027, BV-030 | Bigorna | feito, 2763c0c |
| D-09b | Avisos de ficha não salva em todos os caminhos | Bigorna + maestro | feito, a57d760 |
| BV-032 | Wizard do Um Anel volta para a ficha antiga | Farejador | não é bug: outro agente usava o mesmo portal |
| BV-033 | Aventura Um Anel mostra 0 fichas | Bigorna | em revisão (Lupa) |
| ALC-fix | 21 alcances e 2 áreas do gerador | Bigorna | feito, 7880231 |
| BV-033 | Aventura Um Anel mostra 0 fichas e nome real na lista | Bigorna + maestro | feito, 0eee05c |
| BV-035 | Card do Um Anel na barra lateral abria a ficha vazia | maestro | feito, 2a21ab8 |
| BV-036/038 | Painel do Mestre na mesa do Um Anel mostra ferramentas e regras do Eldarin (salvaguardas, XP, culinária, PA, auto-passe) e diz que não há personagem | Bigorna | na fila (depois do CUS-fix) |
| BV-037 | Jornada, Conselho e Companhia não abriam na barra lateral | maestro | feito (ver git log) |
| BV-039 | Botão ROLAR cortado no painel Dados | Bigorna | na fila |
| TOR-SAVE, BV-040, BV-039 | Aviso de ficha do Um Anel não salva; card acompanha a mesa; botão de rolar | Bigorna + maestro | feito, 0a23449 (falta: edição da ficha pelo mestre não muda a revisão da mesa) |
| SOMBRA, D13b, BV-028, BV-026, NIT-15 | Sombra Etérea; radiante resistido como radiante; arma em uso na hora; seed sem dono; log do mestre | Bigorna + maestro | feitos (ver git log) |
| CANAL | Canalizar Energia parece somar o bônus de dano duas vezes (combat-ability.ts:241 e attack.ts:1061) | Bigorna | na fila |
| BV-040b | PATCH /api/tor-characters/[id] pelo mestre não avisa a mesa; o card do dono fica com o número antigo. Ideia: depois do PATCH, subir a revisão da sala da aventura para o SSE avisar | Bigorna | na fila |
| BV-036/038 | Painel do mestre do Um Anel sem ferramentas do Eldarin | Bigorna | feito, 9a24fa9 |
| CUS-fix | Custo em PA e CD do livro | Bigorna | feito, 4ebfc2b |
| TOR-SAVE | Ficha do Um Anel que não grava depois de ataque passa sem aviso (patchTorCharacterResources) | Bigorna | na fila |
| BV-028 | Trocar a arma 'Em uso' na mesa só aparece depois de recarregar | Bigorna | na fila |
| BV-026 | Aviso de seed Postgres no console (projeto usa MariaDB) | Bigorna | na fila |
| BV-024/025/029 | Equipamento pendente sem dizer o quê; proficiência repetida; Guerreiro com Bola de Fogo (conferir livro) | Bigorna | na fila |

## Rodada 5 (21/11, 02:20 até 08:00)
| ID | O quê | Quem | Estado |
|---|---|---|---|
| BV-040b | Mestre edita ficha do Um Anel (PATCH /api/tor-characters/[id]) e a mesa não é avisada | Bigorna | feito, 07cad10 |
| BV-024/025/029 | Equipamento pendente sem dizer o quê; proficiência repetida; Guerreiro com Bola de Fogo | Bigorna + maestro | feito: 0cde7be (BV-024), d81a482 e be62ab6 (BV-029); BV-025 fechado na página 06 |
| BV-041/043/042 | Revisão do wizard: caminhos de nível 2 sem escolha; Mago sem magias na revisão; Lâmina de Espírito duplicada | Bigorna | feito, 612d128 |
| BV-029 | Guerreiro ganha Bola de Fogo no nível 2 (conferir no livro) | Bigorna | feito, d81a482 e be62ab6 |
| BV-044 | Paladino com magias (Curar Ferimentos, Raio do Limiar) listadas em EQUIPAMENTO na revisão | Bigorna | feito, d81a482 |
| BV-045 | Fluxo de pedir item ao mestre não aparece na ficha nem no painel do mestre (o sistema existe: inventário com aprovação) | Bigorna | não é bug na mesa; fora da mesa virou BV-045b |
| BV-045b | Inventário fora da mesa exige pedido ao mestre | Bigorna | feito, 10c70ba e a41feb0; testado com 2 contas: pedido, aprovação e item entrando OK |
| BV-046 | Wizard dentro da mesa: botão PRÓXIMO do passo Raça fica fora do painel | Bigorna | feito, dd429b4 |
| BV-047 | 'Too many connections': pool do MariaDB recriado a cada recarga do servidor de desenvolvimento | Bigorna | feito, 363d9d6; confirmado pelo Farejador |
| OBS-FICHA | Jogador vê a ficha de outro jogador só para leitura | maestro | decidido: intencional (o grupo vê as fichas uns dos outros, sem editar) |
| NITS-D13 | Cabeçalho do golpe-sagrado.ts; dica do buff sem 'radiante' | Bigorna | feito, 0cde7be |
| ACENTO | Varredura de textos de interface sem acento ou com erro de português (BV-011 e afins), só em app/ e components/ | Corvo + maestro | feito: 2 achados, corrigidos em 2ce299c |
| CAÇA-8 | Level-up, inventário com pedido ao mestre, wizard Eldarin de cada classe | Farejador | feito: BV-041 a BV-045 |
| CAÇA-10 | Um Anel com duas contas: convite, wizard, card | Farejador | feito: BV-047 e BV-048 |
| BV-048 | Mestre muda a Resistência pela ficha e o card do jogador só atualiza ao recarregar | maestro | feito, 1adc9ba (revisão sozinha não avisava a mesa); reconferência na ETAPA 11 |
| BV-009/020 | Erro de hidratação: title nativo trocado por data-site-tip antes do React | Bigorna | feito, 5a05b79 (107 elementos; Lupa aprovou na 2a rodada) |
| BV-048 (2) | O aviso da sala vindo da rota da ficha não chegava ao SSE: emissor por cópia de módulo | maestro | feito, 9d96a8d (provado no site local: 0 ouvintes antes, evento chega depois) |
| BV-050 | Ficha do Um Anel aberta no popup não acompanhava o que outra pessoa grava | maestro | feito, 5ec05fe |
| CAÇA-12 | Reconferir BV-048/049/050 com duas contas | Farejador | feito: tudo chega ao vivo em 3,5 a 5 s |
| BV-049/050b | Espera de agrupamento do card e da ficha de 1,5 s para 0,6 s | maestro | feito, 08b347b |
| SINGLETON | Outros estados de módulo que quebram entre rotas: revision-cache | Bigorna | feito, e8edf50 (5 caches e o lado cliente só listados) |
| BV-001 | Aviso do Next sobre scroll-behavior | maestro | feito, 60b92d0 |
| CAÇA-13 | Mesa Eldarin ao vivo com duas contas | Farejador | parcial: chat ao vivo em até 1 s; XP em ~5 s; BV-051 e BV-052 não reproduzidos (portal); falta condição em token |
| BV-051 | Aviso de vida mostrava o digitado, não o gravado | maestro | feito, 0d3a153 |
| CAÇA-13b | Vida ao vivo e condição em token | Farejador | feito: vida chega em até 1 s; BV-053 |
| BV-053 | Tirar a condição deixava o contador 2R no token (timedEffects sumia do JSON) | maestro | feito (ver git log); verify entra no npm test junto com o TOR-SAVE-TESTE |
| TOR-SAVE-TESTE | Teste de comportamento do aviso de ficha não salva (ataque e Fonte de Dano) | Bigorna | feito, 0c1df06; caso da Esperança em 22b158e |
| ROTA-TOKEN | PATCH de token aceitava pedido sem login e qualquer campo do jogador | maestro + Lupa | feito, 10fbb09 |
| ROTAS | Levantamento de permissão das 119 rotas | Corvo | feito: propostas/rotas-permissao.md (heurística; só o bugs/report público como alerta) |
| SNAPSHOT-ATORES | Snapshot da sala compartilhava o mapa de atores com a sala viva | maestro | feito, 6502a92 |
| CAÇA-14 | BV-053 na tela, Brann, XP, chat fechado | Farejador | feito: BV-053 ok; BV-054 (XP não chega à ficha aberta), BV-055 (sem aviso de chat novo, UX) |
| CAÇA-15 | Reproduzir BV-054 com o caminho exato de abertura da ficha | Farejador | feito: não reproduzido depois de 6502a92 (XP chega em 2 a 3 s pelos dois caminhos); obs.: janela da ficha fechou sozinha uma vez |
| CAÇA-16 | Level-up do Brann pelo jogador na mesa | Farejador | feito: vida, Extração e nível ao vivo batem com o livro; BV-056 (D-21), BV-057 (desenho), BV-058 |
| BV-055 | Contador de mensagens novas no botão Chat | Bigorna + maestro | feito, 2d9a65e |
| BV-058 | Level-up recarregava PA | maestro | feito, 2c88ef0 |
| CAÇA-17 | Celular: mesa, ficha, páginas | Farejador | feito: quase tudo cabe; BV-059, BV-060, BV-061 (desenho) |
| BV-059/060 | Tabela de armas do Um Anel e ficha atrás do painel no celular | maestro | feito, 66a9969 |
| ROTA-TOKEN-TESTE | Teste que executa o PATCH de token | Bigorna + Lupa | feito, 401cddf; nameplateMode validado em f2f7fba |
| CAÇA-18 | Wizard das 12 classes até a revisão | Farejador | feito: BV-062 a BV-072 |
| BV-062 | Passivo do Bárbaro com nome errado | maestro | feito, 6fcc498 |
| CLASSES-TEXTO | Passivo e proficiências das 12 classes pelo livro | Bigorna + Lupa | feito, 55b601e |
| KITS-LIVRO | 36 kits iniciais pela tabela do livro (BV-070) | Bigorna + maestro + Lupa | feito, 3400a60 |
| BV-072 | Bruxo sem truques: o wizard não tem escolha de truque | Bigorna | diagnóstico feito; decisão D-23 na página 03 |
| KITS-TESTE | Teste confere que label e resumo citam só itens do kit | Bigorna + maestro + Lupa | feito, f8edd3d |
| REVISAO-RODADA5 | Revisão de regressão das 7 mudanças de risco | Lupa | feito: tudo OK; 2 ressalvas aplicadas em d0020b1 |
| BV-073/074 | Jornada e Conselho não mostravam a sessão (torSession fora do delta e do store) | maestro | feito, c78e0b9 |
| BV-075 | 4 nomes de Empreitadas | maestro | feito, e50c8bf |
| CAÇA-19 | Painéis do mestre do Um Anel (Jornada, Conselho, Companhia, Olho) | Farejador | parcial: BV-073 a BV-075 |
| CAÇA-19b | Reconferir Jornada e Conselho; Olho; encerrar o que foi aberto | Farejador | feito: BV-073 e BV-074 confirmados corrigidos ao vivo; BV-076 (não é bug), BV-077 (texto, e5d1b07) |
| CAÇA-20 | Social: amizade, mensagens, sino, nome real | Farejador | feito: nome real e e-mail não aparecem; BV-078, BV-079, BV-080 |
| BV-078/079 | Pedido de amizade em até 10 s; aceite aparece sem recarregar | maestro | feito, a711718 e e88210f; reconferido: ~10 s e ~2 s |
| BV-080 | Sino só mostra pendências | dono | recurso novo, fica para a próxima rodada |

Fechamento da rodada 5 (21/11, 06:35): build, fichário salvo em docs/fichario, HISTORICO.md atualizado.
| CAÇA-11 | Reconferir BV-048; Esperança, condições e ficha do jogador chegando ao mestre | Farejador | em andamento |

Feitos fora da fila: B1 (31841ac), N-01 (3b37186), BV-002 e BV-003 loop da mesa (eb8a4bd), aviso de loop do store da mesa (eb25f17).
Pausados até as correções andarem: caça-bugs no site, história, balanceamento. OpenCode grátis esgotou a cota.

Fechamento do loop do Regente (16:55): npm test passou (exit 0) — cadeia completa de verify-*.mjs, npm run test:um-anel e npm run sync:data:check, sem falhas. Itens parados: BV-018/019 (D-13), teste de combate do item 2 (BV-019/BV-021), N-02b API (D-14), A-09 mostradores (D-15), BV-022 catálogo (D-16).
Fechamento (16:57): merge fast-forward concluído — fix/login-google-e-responsivo-um-anel agora em 8a90e0c (sem force, sem push, sem mexer na main). `maestri dismiss` foi bloqueado neste terminal: This terminal is not the Maestro; agentes seguem conectados. Notificação de encerramento enviada com 14 commits desde 606a259.

