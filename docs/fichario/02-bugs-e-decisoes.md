# Bugs detectados e decisões pendentes — Eldarin VTT / MXDRPG

Conferido em 20/11/2026 no checkout `fix/login-google-e-responsivo-um-anel` (HEAD `21e78a6`, de 13/08/2026). Só leitura; nada foi alterado no repositório.

## Antes de ler a tabela: o que está na branch não está em produção

`main` e `origin/main` estão em `be69f6f` (31/07/2026). O deploy só dispara com push na `main` (`.github/workflows/build-image.yml:5`). A branch atual está 68 commits à frente (233 arquivos, +49.308/-5.396) e não tem PR aberto.

Conferi com `git show main:<arquivo>` que a `main` ainda contém:

- `app/privacidade/page.tsx:12` com o recado "Política em atualização. Edite docs/PRIVACIDADE-LGPD.md..." no lugar da política;
- `app/personagem/layout.tsx:13` com o redirect que leva a 404 depois do login;
- `lib/room/handlers/combat-gm.ts:62` com `authorName: user?.name` (nome real no snapshot da sala).

Por isso a coluna "Estado hoje" separa "corrigido na branch" de "corrigido na main". Não consegui conferir o que está de fato rodando em www.mxdrpg.com.br; a afirmação é sobre o código da `main`.

## 1. Bugs detectados

Severidade: P0 trava sessão ou aplica regra errada; P1 regra do livro ausente, dado pessoal ou fluxo principal quebrado; P2 defeito com contorno; P3 acabamento e dívida.
Origem: AUD = `docs/AUDITORIA-ELDARIN-2026-08.md` (08/08/2026); HIST = `docs/HISTORICO.md`; PRD-C = `docs/PRD-COMBATE-MESA-REFACTOR.md`; UX = memória `project_auditoria_ux.md` (20/06/2026).

| ID | Sev. | Área | Descrição | Onde | Origem | Estado hoje | Risco de corrigir |
|---|---|---|---|---|---|---|---|
| B1 | P0 | Combate | Monstro acerta o jogador e a vida não muda (ou volta ao valor antigo). | `lib/room/handlers/combat-attack.ts:302-319`; `lib/room/adventure-actors.ts:196-202`; `components/vtt/MesaWorkspace.tsx:227-256` | AUD B1, dono 08/08; já relatado em HIST 28/06 | Aberto. Mecanismo de reversão confirmado no código (ver nota 1). O caso "não muda nem por um instante" não foi reproduzido. | Alto: caminho quente de combate, sem teste de handler. |
| B2 | P1 | Mesa / ficha | Imagem de token não salva nos três fluxos (ficha, token, reload). | `lib/room/portrait-sync.ts:26-31`; `lib/room/sync.ts:82`; `lib/room/adventure-actors.ts:42-63`; `lib/room/handlers/actors.ts:75-77` | AUD B2, dono 08/08 | Aberto. Prioridade ator > token continua igual; ponto exato da perda não isolado (ver nota 2). | Médio: mudar a prioridade muda o que todos veem no mapa. |
| B3 | P1 | Mesa | Criar personagem na mesa só aparecia depois de recarregar. | `components/character/wizard/CharacterCreationWizard.tsx` | AUD B3 | Corrigido em `152d6d3` (só na branch). | Baixo. |
| H-01 | P0 | Login | Sessão do Google caía porque revalidava no banco a cada requisição. | `lib/auth/session-user.ts` | HIST 03/08 | Corrigido em `e705994` (só na branch). Conferi o commit e que não está na `main`; não reli a lógica. | Baixo. |
| H-02 | P0 | Segurança | Cookie de sessão sem assinatura permitia forjar admin. | `lib/auth/session.ts:10-19` | HIST 31/07 | Corrigido em `be69f6f` (main). HMAC presente. | n/a |
| H-03 | P1 | Privacidade | Nome real no chat, logs de combate, perfil, amigos e membros. | `app/api/room/**`, `lib/friends/store.ts` | HIST 29/07 e 31/07 | Corrigido em `b9501c8`, `050016d`, `be69f6f` (main). Grep por `authorName: ...user.name` e `session.user.name` em `lib/room/handlers` e `app/api` volta vazio. | n/a |
| H-04 | P1 | Mesa | Arrastar token falhava fora do quadrado central (grid real 8, desenhado 24). | `lib/room/adventure-room.ts:21`; `lib/room/internal/registry.ts:25,205` | HIST 29/07 | Corrigido em `994364b` (main). | n/a |
| H-05 | sem classe | Geral | Auditoria de 31/07 teve 28 achados (4 críticos, 7 altos); só 3 foram corrigidos naquela sessão. | lista publicada como artifact, fora do repo | HIST 31/07 | Não verificado. Falta a lista: `docs/` não tem os outros 25 achados. | n/a |
| H-06 | P2 | Um Anel | Bônus de Perícia do Yule era um número único para a Companhia, o livro manda por herói. | `lib/combat/um-anel/progression.ts:239-263` | HIST 04/08 | Corrigido em `a51750c` (só na branch). | n/a |
| H-07 | P2 | Um Anel | Funções sem chamador (`TOR_ENGAGEMENT_LIMITS`, `torPerilousAreaEventCount`, `applyTorJourneyEndRecovery`, `appendTorChronicle`, `torFellowshipLevel`). | `lib/room/handlers/tor-combat-attack.ts:117-135`; `tor-recovery.ts:113`; `components/vtt/TorFellowshipPanel.tsx:93,222`; `TorJourneyPanel.tsx:360` | HIST 08/08 (dívidas registradas) | Corrigido (só na branch): todas têm consumidor hoje. | n/a |
| A-01 | P1 | Legal | `/privacidade` publicava recado de desenvolvedor no lugar da política. | `app/privacidade/page.tsx`, `conteudo.tsx` | AUD 1; UX 2 | Corrigido em `b238e22` (só na branch). | Baixo. |
| A-02 | P1 | Privacidade | Quatro handlers de Mestre gravavam o nome real no snapshot da sala. | `lib/room/handlers/combat-gm.ts`, `culinary-meal.ts`, `gm-actor-progress.ts`, `gm-saving-throw.ts` | AUD 2 | Corrigido em `b238e22` (só na branch). | Baixo. |
| A-03 | P2 | Legal | Não existem Termos de Uso nem aceite no cadastro. | sem `app/termos/`; `components/SiteFooter.tsx:18`; `components/auth/AuthTabs.tsx:61` | AUD 3 | Aberto. | Médio: a infra é simples, o texto jurídico não é trabalho de agente. |
| A-04 | P2 | Performance | Bestiário de 451 KB entra no bundle da ficha de todo jogador. | `lib/compendium/registry.ts:5,20` | AUD 4 | Aberto. Import estático continua. | Alto: propaga por dez componentes e os painéis de invocação não têm teste. |
| A-05 | P1 | Navegação | Link de ficha com sessão vencida caía em 404 depois do login. | `app/personagem/layout.tsx` | AUD 5 | Corrigido em `4804a7f` (só na branch). | Baixo. |
| A-06 | P2 | UI | Telas mostravam comandos de terminal e nome de variável de ambiente. | `app/mesa/[roomId]/page.tsx`, `CompendiumBrowser.tsx`, `app/instalar` (removida) | AUD 6 | Corrigido em `8600304` (só na branch). Sobra N-02, fora do alcance da guarda. | Baixo. |
| A-07 | P2 | Compêndio | Detalhe sumia ao digitar, busca ignorava código, sem ordenação, abas de sistema sumiam no pack. | `components/compendium/CompendiumBrowser.tsx:61,72,81`; `app/compendios/[packId]/page.tsx:40` | AUD 7; UX | Corrigido em `8600304` (só na branch). Ordenação é só alfabética, sem seletor. | Baixo. |
| A-08 | P2 | Culinária | Assimilações nunca expiram: `expiresAt` é gravado e ninguém compara. | `lib/culinary/apply-meal.ts:70`; `lib/culinary/types.ts:11` | AUD 8 | Aberto. Só essas duas ocorrências no repo. | Baixo, depois da decisão relógio vs descanso. |
| A-09 | P3 | Mesa | `bankedPa` é sempre 0 e aparece em três telas. | `components/vtt/ActiveCharactersPanel.tsx:133`; `MapTokenList.tsx:54`; `GmCombatLogPanel.tsx:104` | AUD 9 | Aberto. | Baixo na UI; médio se tirar o campo do sync. |
| A-10a | P2 | Ficha | Limite de fichas por aventura tem três valores: constante 3, mensagem "um", doc 1. | `lib/character/adventure-bind.ts:4`; `lib/character/characters.ts:269`; `docs/CLAUDE-PROJETO.md:168,308,437` | AUD 10 | Aberto. | Baixo, depois da decisão. |
| A-10b | P2 | Mesa | Guarda de limite nunca dispara; a recusa só vem depois do assistente inteiro. | `app/mesa/[roomId]/page.tsx:199-200`; `components/vtt/MesaWorkspace.tsx:441-442` | AUD 10 | Aberto. `charactersInAdventure = 0` continua literal. | Baixo. |
| A-11 | P2 | Mesa | Mesa nova nasce com grid vazio, sem mapa. | `lib/room/adventure-room.ts:21-30`; `public/` sem mapas | AUD 11; UX 3 | Aberto. | Baixo no código; depende de arte. |
| A-12a | P2 | Mesa | Janela flutuante pode ficar fora da tela para sempre: sem listener de resize, sem reset. | `hooks/vtt/useFoundryWindows.ts` (grep por `resize` e `reset` vazio) | AUD 12 | Aberto. | Baixo. |
| A-12b | P2 | Mobile | Rail no celular fica só com ícones, sem rótulo. | `components/vtt/foundry/foundry.css:2445-2447` | AUD 12 | Aberto. | Baixo. |
| A-12c | P3 | Mesa | Atalhos (Alt+clique, Ctrl+clique) não aparecem nas dicas das ferramentas. | `components/vtt/MapToolbar.tsx:149-315` | AUD 12; UX | Aberto. | Baixo. |
| A-13 | P3 | Compêndio | Sem filtros por PA, alcance, tipo de dano, nível. | `components/compendium/CompendiumBrowser.tsx`, `compendium.css` | AUD 13; UX | Aberto. | Médio: mexe no componente recém-corrigido. |
| A-14 | P1 | Regra | Monstro do bestiário nunca resiste a dano: `damageResist` só é escrito por poção. | `lib/combat/consumable-effects.ts:269`; `lib/vtt/monsters.ts`; `data/compendiums/monstros.json` (0 ocorrências) | AUD 14 | Aberto. | Médio: trabalho de dados no pipeline `sync:data`. |
| A-15 | P1 | Regra | Débito de PA por reação (PRD R23) nunca dispara: `applyReactionPaDebt` não tem chamador. | `lib/combat/pa-turn.ts:244,316-322` | AUD 15; PRD-C R23 | Aberto. | Médio: zona vermelha (`pa-turn.ts`). |
| A-16a | P2 | Regra | Fome (Cap. 5): `daysWithoutMeal` nunca é incrementado. | `lib/culinary/types.ts:19`; `apply-meal.ts:102` | AUD 16 | Aberto. | Médio: precisa de gatilho de passagem de dia, que não existe. |
| A-16b | P2 | Regra | Estudo de Anatomia: `lib/culinary/anatomy.ts` não é importado por ninguém. | `lib/culinary/anatomy.ts`; `types.ts:16` | AUD 16 | Aberto. | Médio. |
| A-17 | P3 | Dívida | Código morto confirmado, incluindo o cálculo de delta em toda persistência de sala. | `lib/room/internal/registry.ts:130`; `lib/room/reset-room-board.ts`; `lib/combat/ability.ts:143,255`; `lib/combat/spell-channel.ts:12,41`; `components/vtt/MesaWorkspace.tsx:126`; `app/biblioteca/`, `app/rpg/page.tsx` | AUD 17 | Aberto. Todos os símbolos que conferi ainda existem. | Médio: a auditoria já errou quatro itens dessa varredura. |
| A-18 | P3 | Docs / SEO | Doc de cores diz ouro `#b8922e`, o código usa `#8B7BB8`; sem `robots` nem `sitemap`; `/download/guia` e `/mesa` sem link. | `docs/DESIGN-ELDARIN-V5-CORES.md:18-184`; sem `app/robots.ts`, `app/sitemap.ts` | AUD 18 | Aberto. | Baixo. |
| A-19 | P3 | Social | Lista de amigos não mostra online/offline. | `lib/friends/types.ts` | AUD 19; UX | Aberto. | Médio: índice novo no banco. |
| A-20 | P1 | Regra | Assimilações culinárias são só texto; nenhum efeito chega ao combate. | `lib/culinary/apply-meal.ts:67`; `lib/combat/` (zero menções a assimilação) | AUD 20 | Aberto. | Alto: schema novo no pipeline mais consumidor no combate. |
| A-21 | P2 | Design | Ficha usa paleta `--ddb-*` fixa, duplicada quatro vezes, com contraste baixo no muted. | `components/character/sheet-ddb.css:48-51,1332-1335,1360-1363,1972-1975` | AUD 21; UX | Aberto. 0 usos de `var(--content-*)`. | Médio: risco visual, sem teste de UI. |
| A-22 | P3 | Segurança | `dangerouslySetInnerHTML` sem sanitização no detalhe do compêndio (fonte hoje é estática). | `components/compendium/CompendiumBrowser.tsx:316` | AUD 22 | Aberto. | Baixo. |
| A-23 | P3 | Design | `.btn-primary` e `.btn-primary-cta` são iguais, mas só um é isentado na toolbar da ficha. | `components/character/sheet-ddb.css:1698,1712` | AUD (seção "não recomendo") | Aberto. | Baixo. |
| R-01 | P1 | Regra | Reações v1 do PRD (ataque de oportunidade, Escudo, Contramágica) não existem no motor Eldarin. | `lib/combat/` (grep por oportunidade/opportunity/contram só acha Um Anel) | PRD-C R7, RF3.3 | Aberto. Só existe `reaction_shift` (`lib/combat/ability.ts:354`). | Alto: feature de combate nova. |
| R-02 | P3 | Combate | Auto-passe padrão é 150 ms; o PRD aprovado diz cerca de 1,5 s. | `lib/room/settings.ts:24` | PRD-C R22 | Aberto (divergência doc x código; pode ser intencional). | Baixo. |
| D-01 | P2 | Docs | O guia que `AGENTS.md` manda ler primeiro descreve Clerk, Neon/Postgres e limite de 1 ficha; o código usa OAuth próprio, MariaDB e limite 3. | `docs/CLAUDE-PROJETO.md:50-52,73,168,338,480`; `docs/P9-READY.md:3,24-28`; `docs/BETA-P9-CHECKLIST.md:20` | conferência | Aberto. | Baixo. |
| D-02 | P3 | Docs | `CONTEXTO-SESSAO-ATUAL.md` aponta a branch `cursor/dice-box-combat` e o PR #3 como trabalho em curso; já foi mergeado em 21/06. | `docs/CONTEXTO-SESSAO-ATUAL.md:10,89-93` | conferência | Aberto. | Baixo. |
| P-01 | P2 | LGPD | A política promete export em JSON e retenção de logs de acesso por 6 meses; no app não achei rota de export nem log de acesso. Também não cita hospedagem na Europa. | `app/privacidade/conteudo.tsx:27-28`; `docs/PRIVACIDADE-LGPD.md:36,76,95`; `docs/INFRA-BR-AVALIACAO.md:9` | conferência | Aberto. Log pode existir no proxy do servidor, que não dá para ver daqui. | Baixo no texto; médio se for implementar export. |
| L-01 | sem classe | Latência | Critérios A1 a A11 de latência da mesa. | `docs/MESA-LATENCIA-FASES.md:39-57` | doc | Não verificado. Exige sessão real com 1 GM e 2 ou 3 jogadores em produção. | n/a |
| L-02 | sem classe | Beta | Checklist P9 (B1 a B7) está em branco; não há registro de sessão de beta. | `docs/BETA-P9-CHECKLIST.md` | doc | Não verificado. Exige rodar a sessão. | n/a |
| U-01 | P1 | Compêndio | Cards do compêndio não eram clicáveis. | `components/compendium/CompendiumBrowser.tsx:81,290-316` | UX 1 | Corrigido em `c8314b3` (main). | n/a |
| U-02 | P2 | Navegação | `/mundo` fora da navbar. | `components/SiteNavLinks.tsx:9` | UX 4 | Corrigido em `c8314b3` (main). | n/a |
| U-03 | P2 | Mesa | Mesa demo com grid vazio. | `app/mesa/` (sem `demo`) | UX 3 | Corrigido na main: a demo foi removida em 24/07. O problema migrou para A-11. | n/a |

### Nota 1 — B1, o que o código mostra

`syncAdventureActorsForRoom` (`lib/room/adventure-actors.ts:196-202`) troca cada `room.actors[id]` pela ficha lida do banco. `toRoomActor` só preserva retrato e equipamento do ator anterior; vida e PA vêm da ficha. Em seguida `persistRoom` chama `syncLinkedTokens`, que reescreve a vida do token a partir do ator (`lib/room/sync.ts`, campo `vida: actor.resources.vida.value`).

Os handlers de ataque, habilidade, área, consumível e magia utilitária (`combat-attack.ts`, `combat-ability.ts`, `combat-area.ts`, `combat-consume.ts`, `combat-spell-utility.ts`) alteram a vida só na sala e nunca gravam a ficha. Então qualquer sincronização devolve a vida antiga.

Quem dispara a sincronização:

- todo membro que abre ou recarrega a mesa: `MesaWorkspace.tsx:227-256` faz POST em `/api/room/[roomId]/sync-actors` de 6 a 8 segundos depois de montar;
- todo jogador não-dono que carrega a página da mesa: `app/mesa/[roomId]/page.tsx:127` chama `bindPlayerToAdventure`, que chama `joinAdventureRecord` (`lib/adventure/store.ts:397-398`);
- criar, editar, transferir ou apagar uma ficha da aventura (`lib/character/characters.ts:291`, `lib/character/lifecycle.ts:117,208`, `app/api/characters/[id]/edit-save/route.ts:90`).

Cenário: o monstro tira 8 de vida do guerreiro (30 para 22). Outro jogador recarrega a aba. Segundos depois o guerreiro volta a 30 para todos. O ajuste de vida feito pelo Mestre não sofre disso porque `combat-gm.ts:347-351` grava a ficha.

### Nota 2 — B2, o que o código mostra

A prioridade `actor.tokenImageUrl`, depois `actor.portraitUrl`, depois `token.imageUrl` continua em `portrait-sync.ts:30`. Achei um caminho concreto de reversão: `updateRoomActor` engole a falha de gravação da ficha (`lib/room/handlers/actors.ts:75-77`, `.catch` com `console.error`). Se a gravação falhar, a sala fica com a imagem nova e a ficha com a antiga; na próxima sincronização `mergePortraitFromRoom` (`adventure-actors.ts:47-63`) entende que "a ficha mudou" e devolve a imagem antiga. Falta verificar em produção se a gravação está falhando (log `[updateRoomActor] persist sheet failed`) e o tamanho do payload: retrato e token são data URL dentro de colunas JSON (`scripts/db/schema.mariadb.sql:35,77-78`).

## 2. Totais

47 itens na tabela (os 5 bugs novos da seção 4 não entram na conta).

| Severidade | Total | Aberto | Corrigido só na branch | Corrigido na main | Não verificado |
|---|---|---|---|---|---|
| P0 | 3 | 1 | 1 | 1 | 0 |
| P1 | 12 | 5 | 4 | 3 | 0 |
| P2 | 19 | 13 | 4 | 2 | 0 |
| P3 | 10 | 10 | 0 | 0 | 0 |
| Sem classe | 3 | 0 | 0 | 0 | 3 |
| Total | 47 | 29 | 9 | 6 | 3 |

Nenhum item ficou como "parcial".

P0 e P1 abertos: B1 (P0), B2, A-14, A-15, A-20, R-01.
P0 e P1 corrigidos mas fora da main: H-01 (P0), B3, A-01, A-02, A-05.

## 3. Precisa de decisão do dono

| Decisão | Contexto | Opções | Recomendação | O que fica travado |
|---|---|---|---|---|
| Levar a branch `fix/login-google-e-responsivo-um-anel` para a `main` | 68 commits, sem PR. Contém as correções de privacidade, do 404 de `/personagem`, da sessão do Google e quase todo o Um Anel de agosto. | (a) abrir PR único e mergear; (b) separar os commits de correção Eldarin/auth e subir primeiro; (c) deixar parado. | (a), depois de `npm run build` e `npm test` na branch. Separar 68 commits custa mais do que o risco que evita. | Produção segue com a política de privacidade errada, nome real nos handlers de Mestre, 404 pós-login e a queda de sessão do Google. |
| B1: quem manda na vida durante a sessão, a sala ou a ficha | Ver nota 1. A sincronização ficha para sala apaga o dano. | (a) a sincronização preserva vida e PA do ator que já está na sala; (b) cada handler de combate grava a ficha; (c) as duas. | (a) primeiro: uma função, fora do caminho quente. Gravar a ficha no fim do combate ou com atraso, não a cada golpe. | Sessão de combate confiável; o beta P9. |
| B2: fonte única da imagem do token | Hoje a ficha vence o token e a falha de gravação é silenciosa. | (a) a ficha é a única fonte e o token só exibe; (b) o token pode ter imagem própria que vence a ficha; (c) manter e só parar de engolir o erro. | (a) mais (c). Antes, olhar o log de produção para saber se a gravação falha. | Correção do B2. |
| Limite de fichas por jogador por aventura | Constante diz 3, mensagem diz "um", guia diz 1. | 1 ou 3. | Decidir o número; eu alinharia código, mensagem e doc no mesmo commit. Sem preferência técnica. | A-10a; texto de erro do assistente. |
| Reações e débito de PA (PRD R7, R23) | O PRD aprovado lista três reações; nenhuma existe e o débito não tem chamador. | (a) implementar as três reações com débito; (b) tirar do escopo v1 e remover o campo. | (b) agora, (a) como épico próprio depois do beta. Campo que roda todo turno sem efeito esconde o buraco. | A-15, R-01; critério de aceite "3 reações v1" do PRD. |
| Fome e Estudo de Anatomia (Cap. 5) | Campos declarados, nenhum runtime, e não há gatilho de passagem de dia. | (a) implementar com descanso longo; (b) apagar os campos. | (b) até existir descanso longo na mesa. | A-16a, A-16b. |
| Assimilações: expiração e efeito mecânico | Hoje são texto que nunca expira. | Expirar por 24 h de relógio ou por descanso longo; efeito estruturado agora ou depois. | Expirar por descanso longo (relógio real pune quem joga uma vez por semana). Efeito estruturado só depois de A-08 e A-14. | A-08, A-20. |
| Resistência de monstros no livro | `monstros.json` não tem campo de resistência; o texto está em prosa. | (a) estruturar no livro e gerar pelo `sync:data`; (b) Mestre aplica à mão. | (a), começando pelos monstros usados na campanha atual. | A-14 e metade de A-20. |
| Termos de Uso | Plataforma com contas, upload e chat, sem termos nem aceite. | (a) texto escrito ou revisado por advogado; (b) modelo adaptado pelo dono; (c) adiar. | (a) ou (b) antes de abrir ao público. A infra (rota, checkbox, registro do aceite) pode ser feita já, com link bloqueado. | A-03; lançamento público. |
| Política de privacidade: conteúdo | Contato é `ti@thep.com.br` (e-mail de outra organização); data "junho de 2026"; promete export JSON e logs por 6 meses; não cita hospedagem na Europa nem como se verifica idade mínima de 13 anos. | Trocar o contato por e-mail do projeto; ajustar as promessas ao que existe ou implementar; citar transferência internacional. | Trocar o e-mail e alinhar o texto ao que o sistema faz hoje. Export JSON manual por pedido é aceitável se estiver escrito assim. | P-01. |
| Infra: qual é a pilha oficial | `package.json` só tem `mysql2`; produção é Contabo com MariaDB. O guia dos agentes, `P9-READY`, `BETA-P9-CHECKLIST`, `POSTGRES.md`, `P0-NEON-SETUP.md` e `A1-NEON-SMOKE.md` falam em Neon/Postgres e Clerk. O código ainda carrega `clerkId` em dezenas de arquivos. | (a) declarar MariaDB + Contabo como oficial e arquivar os docs de Neon/Clerk; (b) retomar Postgres. | (a). Atualizar `docs/CLAUDE-PROJETO.md` primeiro, porque é o que todo agente lê. Limpeza de `clerkId` fica para depois; mexe em `lib/auth/`. | D-01; agentes continuam sendo instruídos com a pilha errada. |
| Servidor no Brasil | O servidor fica na Europa (180 a 250 ms). O doc de infra condiciona a migração aos testes A1 a A11, que nunca foram registrados. | (a) rodar os testes e decidir; (b) migrar já; (c) ficar. | (a). | L-01. |
| Beta P9 | O checklist está em branco. | Marcar a sessão ou assumir que o beta está suspenso. | Marcar depois de B1 e do merge. | L-02; lançamento. |
| Auditoria de 31/07 | 25 achados (incluindo críticos e altos) só existem num artifact fora do repo. | Recuperar e salvar em `docs/`, ou refazer. | Recuperar e salvar. Sem a lista não dá para saber se há crítico aberto. | H-05. |
| Um Anel: leitor de capítulos (D33) | O dono escolheu leitor público; foi entregue restrito a membros com `noindex`, porque o texto é da Free League. | Manter restrito ou abrir. | Manter restrito. | Nada; é confirmação. |
| Um Anel: PRD e perguntas abertas | PRD v1.0 está "Draft, pendente aprovação" desde 25/07. Três perguntas abertas: mecanizar a Fase de Companhia, estruturar mais Marcos, dados de Sucesso no chat. | Aprovar e responder, ou congelar. | Aprovar; as perguntas 1 e 3 já foram em boa parte atendidas pelos commits de agosto e vale só registrar. | Sign-off do PRD. |
| PDF v2 e paleta azul legada | `sheet-popup.css` (42 KB) e dois componentes parecem inalcançáveis, mas o botão de PDF está vivo. | Apagar ou manter para religar. | Perguntar antes de apagar; a auditoria fez a mesma ressalva. | Limpeza de CSS da ficha. |
| Mapas iniciais e arte de ícones | Mesa nova nasce vazia; regra registrada é esperar a arte real. | Entregar 2 ou 3 pisos neutros marcados como provisórios, ou esperar. | Pisos neutros provisórios: a primeira sessão do Mestre é o pior momento para tela vazia. | A-11. |
| Refactor do bundle do bestiário | Exige cobrir antes `MonsterSpawnPanel` e `GmCreationsPanel` com teste. | Investir agora ou adiar. | Adiar para depois de B1 e B2. | A-04. |
| Auto-passe: 150 ms ou 1,5 s | Código e PRD divergem. | Atualizar o PRD ou o padrão. | Atualizar o PRD se 150 ms foi escolha de ritmo. | R-02. |
| Branches antigas | Ver abaixo. | Apagar ou manter. | Apagar as cinco. | Nada; é limpeza. |

### Branches que não são a main

| Branch | Em relação à main | PR | Recomendação |
|---|---|---|---|
| `fix/login-google-e-responsivo-um-anel` (atual, igual à remota) | 68 à frente, 0 atrás | nenhum aberto | Abrir PR e mergear (primeira linha da tabela acima). |
| `cursor/dice-box-combat` | local: 0 à frente, 98 atrás. A remota tem 361 commits com hash diferente, mas `git cherry` não acha nenhum patch que falte na main. | #3 mergeado em 21/06 | Apagar local e remota. |
| `cursor/gm-tools-tab-icons` | local: 0 à frente, 130 atrás. Remota: 329 por hash, 0 patches únicos. | sem PR próprio | Apagar local e remota. |
| `cursor/mesa-turn-hud-portraits` | local: 0 à frente, 350 atrás. Remota: 109 por hash, 0 patches únicos. | #2 mergeado em 07/06 | Apagar local e remota. |
| `fix/mesa-performance-delays` | 0 à frente, 61 atrás | #4 fechado em 25/06 | Apagar local e remota. |
| `origin/feature/build` (só remota) | 11 à frente por hash, 448 atrás; commits da época do Vercel, de 04/06 | #1 mergeado | Apagar. Não rodei `git cherry` nesta; conferir antes. |

## 4. Bugs novos vistos de passagem

Só o que confirmei lendo o código.

- **N-01 (P1) — Vida temporária some ao normalizar a ficha.** `lib/character/normalize.ts:116-120` remonta `resources.vida` só com `max` e `value`; o campo `temp` (declarado em `lib/character/types.ts:33`) é descartado. `updateRoomActor` normaliza o ator (`lib/room/handlers/actors.ts:49`) e `syncLinkedTokens` copia `actor.resources.vida.temp` para o token. Cenário: personagem com vida temporária no combate; o jogador troca um item ou o retrato pela mesa; a vida temporária desaparece do token. Também nunca chega ao banco, porque `saveCharacter` normaliza antes de gravar.
- **N-02 (P2) — Texto de mantenedor ainda chega ao usuário por mensagem de erro.** `lib/character/characters.ts:225-227` lança "Não foi possível gravar a ficha no banco. Rode npm run db:migrate ou verifique DATABASE_URL." e as rotas devolvem `e.message` (`app/api/characters/route.ts:65`, `app/api/characters/[id]/edit-save/route.ts:79`). `lib/friends/store.ts:36` devolve "Amigos e convites exigem MariaDB (DATABASE_URL)." A guarda `verify-sem-texto-dev.mjs` só varre `.tsx`. Cenário: banco fora do ar e o jogador salva a ficha.
- **N-03 (P1) — O mecanismo do B1 vale para todo dano e cura de combate, não só ataque de monstro.** Mesmos arquivos da nota 1. Cenário: o clérigo cura o aliado com magia; alguém recarrega a mesa; a cura some. PA gasto fora de combate segue o mesmo caminho.
- **N-04 (P2) — Falha ao gravar a ficha a partir da mesa é silenciosa.** `lib/room/handlers/actors.ts:75-77` captura o erro de `persistActorToAdventureSheet` e segue; a resposta ao cliente é de sucesso. Cenário: o jogador edita inventário ou retrato na mesa com o banco recusando a gravação; vê a mudança, e ela é revertida na próxima sincronização (nota 2).
- **N-05 (P3) — Páginas de protótipo servidas em produção.** `public/preview-combate-dados.html` (34 KB) e `public/backgrounds-preview.html` (20 KB) estão versionadas e ficam acessíveis por URL direta. Sem segredo; é o mesmo tipo de limpeza do A-06.

Observação que não chega a ser bug confirmado: a regra do projeto proíbe `title` nativo, e `components/vtt/MapToolbar.tsx:149,175,197,213,228,240,250,304,315` usa `title=` em botões. Há 191 ocorrências de ` title=` em `.tsx`; parte é prop de componente, não contei quantas são HTML.

## O que não foi feito

- Não rodei `npm run build` nem `npm test`; o trabalho foi de leitura.
- Não abri produção nem o banco; o que digo sobre produção vem do código da `main`.
- Dos commits `fix` anteriores a 20/06 não reconferi um a um; a tabela cobre os bugs que os documentos pedidos registram.
- Das ~900 linhas finais do `HISTORICO.md`: o arquivo tem as sessões mais recentes no topo (linha 107 em diante) e uma segunda sequência no fim (19/06 a 31/07). Li as sessões Eldarin de 08/08 no topo e as de 28/06 a 31/07 no fim; das sessões de Um Anel de agosto li só as dívidas registradas.
