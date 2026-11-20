# 11 Fila de correções

Só correções, uma por vez: Bigorna corrige, Lupa revisa, o maestro confere e commita. Itens que dependem de decisão do dono ficam fora (página 03). Agentes: só mudam a coluna Estado da própria linha.

| Ordem | ID | Sev. | O quê | Estado |
|---|---|---|---|---|
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

Feitos fora da fila: B1 (31841ac), N-01 (3b37186), BV-002 e BV-003 loop da mesa (eb8a4bd), aviso de loop do store da mesa (eb25f17).
Pausados até as correções andarem: caça-bugs no site, história, balanceamento. OpenCode grátis esgotou a cota.

