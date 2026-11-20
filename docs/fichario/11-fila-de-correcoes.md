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
| 16 | A-09 | P3 | bankedPa sempre 0 e aparece em três telas | na fila |
| 17 | A-18 | P3 | Sem robots nem sitemap; doc de cores diverge do código | na fila |
| 18 | D-02 | P3 | CONTEXTO-SESSAO-ATUAL.md aponta branch e PR antigos | na fila |
| 18b | BV-008 | P2 | Botão 'Colocar na mesa' do Invocar nunca habilita: a célula alvo só é registrada durante o arraste (trackGridHover em Battlefield.tsx:952 exige spawnDragActive), então o botão depende de um hover que não acontece. Arrastar continua funcionando com mouse de verdade. | feito (ver git log, BV-008) |
| 20 | BV-014 | P2 | Ficha fora da mesa mostra PA 9/5 (atual acima do máximo); na mesa 9/9 | aprovada pela Lupa, sem commit |
| 21 | BV-010 | P2 | Chips das Adagas +1/+2/+3 mostram 1d4 sem o +N de dano | decisão D-11 (página 03); Lupa reprovou como correção, aguarda escolha do dono
| 22 | BV-013 | P2 | /compendios/monstros mostra Armas; bestiário fora do compêndio | feito: bestiário é só do mestre por desenho; a rota agora volta ao índice |
| 23 | BV-012 | P3 | Agarrão: 5 células vs 9 m no texto | feito, 29cd6c0 |
| 23b | BV-022 | P3 | Outros alcances de habilidades discordam do texto: Julgamento Ardente 9 m/9 cel., Mente Partida 18 m/6 cel., Puxão Abissal 9 m/5 cel., Carga do Juramento 12 m/6 cel. (ressalva da Lupa em BV-012) | na fila, conferir no livro |
| 24 | BV-011 | P3 | Textos sem acento ou concordância em magias | na fila |
| 25 | BV-015 | P3 | /termos dá 404 (é o A-03: texto jurídico depende do dono) | decisão |
| 19 | BV-* | ? | O que o Farejador achar no combate da mesa (etapa 2b) | entra conforme chega |

Loop de 2 h (15:45 a 17:45 de 20/11): Bigorna e Lupa na fila, Farejador testando combate no portal.

Feitos fora da fila: B1 (31841ac), N-01 (3b37186), BV-002 e BV-003 loop da mesa (eb8a4bd), aviso de loop do store da mesa (eb25f17).
Pausados até as correções andarem: caça-bugs no site, história, balanceamento. OpenCode grátis esgotou a cota.

