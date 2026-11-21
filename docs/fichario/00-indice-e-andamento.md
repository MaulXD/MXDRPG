# Fichário MXDRPG — índice e andamento

Aberto em 20/11/2026, sobre o branch `fix/login-google-e-responsivo-um-anel`. As correções estão no branch local `chore/fichario-correcoes-2026-11` (sem push).

## Páginas

| Página | Conteúdo |
|---|---|
| [01 O que foi feito](01-feito.md) | 93 entregas em 13 áreas, linha do tempo dos 527 commits (jun a ago), o que ficou pela metade |
| [02 Bugs e decisões](02-bugs-e-decisoes.md) | 47 bugs conferidos no código (severidade, onde, risco de corrigir) e 21 decisões levantadas |
| [03 Precisa de decisão](03-precisa-de-decisao.md) | As decisões que travam trabalho, com recomendação |
| [04 Limpeza](04-limpeza.md) | 64 candidatos a limpeza (17 seguros, 34 a confirmar, 7 arriscados) e os lotes |
| [05 Mapa, Um Anel, branches e docs](05-mapa-um-anel-branches-docs.md) | Rotas, módulos, banco e auth de verdade, estado do Um Anel, branches, docs desatualizados |
| [06 Bugs ao vivo](06-bugs-ao-vivo.md) | Bugs achados navegando no site local |
| [07 Correções](07-correcoes.md) | Diário da Bigorna (corretora) |
| [08 Revisão](08-revisao.md) | Pareceres da Lupa (revisora) |
| [11 Fila de correções](11-fila-de-correcoes.md) | Ordem e estado de cada correção |
| [propostas/historia.md](propostas/historia.md) | Mapa do lore e 19 contradições entre livros (propostas de texto ainda não feitas) |
| [propostas/balanceamento.md](propostas/balanceamento.md) | Classes no nível 1, com e sem atributo e acerto, e divergências livro x código |

## Saúde do código no fim da sessão

- `npx tsc --noEmit`: 0 erros.
- `npm test`: passa inteiro (55 scripts, incluindo 5 testes novos desta sessão).
- `npm run build`: passa.
- `npm run lint`: não roda (o projeto não tem ESLint configurado).

## Commits desta sessão (19)

Correções: B1 dano e PA sumindo ao recarregar a mesa (50ce7a5), N-01 vida temporária (fce9c0b), BV-002/BV-003 loop de render que travava a mesa ao vivo (e98c223), loop do store da mesa (905daa9), BV-005 confirmação de passar turno (424a869), BV-004 atalho da barra lateral (af3a34d), A-10b e A-10c limites de fichas antes do wizard (7ab223f, 677f5a5), A-12a e BV-004b janelas flutuantes fora da tela (bdc86a8), A-12b rótulos do rail no celular (2a858bb), A-12c dicas de atalho (bd20a83), A-22 sanitização do compêndio (1260bd6), A-23 botão da ficha (7a06d8c).

Limpeza: 11 componentes órfãos e preview da raiz (a937366), 11 scripts de uso único e .pyc (a15a45c), links mortos nos docs (0b9969c), .dockerignore (f0c908e), npm test sem lista duplicada (c0aab91).

## O que ficou parado

- B2 imagem de token que não salva: precisa do log de produção "persist sheet failed" e da decisão D-09.
- R-02 tempo do auto-passe: decisão D-10.
- Caça-bugs no site (falta combate na mesa: atacar, monstro atacar, magia), propostas de texto da história, balanceamento nos níveis 5 e 10: pausados para priorizar correções.
- Ícones com Nano Banana: adiados a pedido do dono. A lista antiga de prompts (artifact) não abre mais; refazer a partir dos compêndios.
- OpenCode: precisa de chave de API própria (`opencode auth login`); a cota grátis acabou.
