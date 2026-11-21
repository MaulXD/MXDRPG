# Fichário MXDRPG - índice e andamento

Aberto em 20/11/2026, sobre o branch `fix/login-google-e-responsivo-um-anel`. As correções estão no branch local `chore/fichario-correcoes-2026-11` (sem push). Índice atualizado em 21/11/2026 (estado até `2ce299c`).

## Páginas do fichário

Hashes conferidos com `git log -1 --format='%h %ad %s' --date=short -- <arquivo>`.

| Página | Conteúdo | Último commit (hash, data) |
|---|---|---|
| [00 Índice e andamento](00-indice-e-andamento.md) | Esta página: índice, saúde, rodadas, pendências do dono e como retomar | este arquivo (atualizado em 21/11/2026) |
| [01 O que foi feito](01-feito.md) | 93 entregas em 13 áreas, linha do tempo dos commits (jun a ago), o que ficou pela metade | `791c357` (2026-11-20) |
| [02 Bugs e decisões](02-bugs-e-decisoes.md) | Bugs conferidos no código (severidade, onde, risco) e decisões levantadas | `791c357` (2026-11-20) |
| [03 Precisa de decisão](03-precisa-de-decisao.md) | Decisões que travam trabalho, com recomendação e decisões já tomadas | `f1150a7` (2026-11-21) |
| [04 Limpeza](04-limpeza.md) | Candidatos a limpeza e lotes | `791c357` (2026-11-20) |
| [05 Mapa, Um Anel, branches e docs](05-mapa-um-anel-branches-docs.md) | Rotas, módulos, banco e auth, estado do Um Anel, branches, docs desatualizados | `791c357` (2026-11-20) |
| [06 Bugs ao vivo](06-bugs-ao-vivo.md) | Bugs achados navegando no site local | `73a6dcc` (2026-11-21) |
| [07 Correções](07-correcoes.md) | Diário da Bigorna (corretora) | `73a6dcc` (2026-11-21) |
| [08 Revisão](08-revisao.md) | Pareceres da Lupa (revisora) | `73a6dcc` (2026-11-21) |
| [11 Fila de correções](11-fila-de-correcoes.md) | Ordem e estado de cada correção | `73a6dcc` (2026-11-21) |
| [12 Regras do Regente](12-regras-do-regente.md) | Regras do loop de correção orquestrado (página 12 do Regente) | `039d19c` (2026-11-20) |
| [propostas/historia.md](propostas/historia.md) | Mapa do lore, contradições entre livros e propostas de texto | `989c9a9` (2026-11-20) |
| [propostas/historia-andamento.md](propostas/historia-andamento.md) | Andamento do trabalho de história | `791c357` (2026-11-20) |
| [propostas/balanceamento.md](propostas/balanceamento.md) | Classes no nível 1, 5 e 10, divergências livro x código | `d015af1` (2026-11-20) |
| [propostas/alcances.md](propostas/alcances.md) | Varredura de alcances em células contra os metros do livro | `d262f9a` (2026-11-21) |
| [propostas/custos-e-danos.md](propostas/custos-e-danos.md) | Varredura de custo em PA, dano e CD contra o livro | `4ebfc2b` (2026-11-21) |
| [propostas/bestiario.md](propostas/bestiario.md) | Varredura do bestiário contra o livro (507 diferenças) e decisão D-20 | `a830163` (2026-11-21) |
| [propostas/um-anel-mesa.md](propostas/um-anel-mesa.md) | Como a ficha do Um Anel chega à mesa e o que acontece ao recarregar | `b059354` (2026-11-21) |
| [propostas/textos-interface.md](propostas/textos-interface.md) | Levantamento de textos de interface sem acento/erro de português | `2ce299c` (2026-11-21) |

## Saúde do código

Estado registrado em 21/11/2026 (último registro: rodada 4 e ajustes seguintes, até `2ce299c`, conforme `docs/HISTORICO.md`):

- `npm test`: passa inteiro.
- `npm run build`: passa.
- `npx tsc --noEmit`: limpo (registrado nas sessões).
- `npm run lint`: não roda (o projeto não tem ESLint configurado).

## Resumo por rodada (1 a 5)

Contagens e hashes conferidos com `git log --format='%h %ad %s' --date=short` e com `docs/HISTORICO.md`. Intervalo considerado: de `50ce7a5` (2026-11-20, B1) até `2ce299c` (2026-11-21), 101 commits no total.

### Rodada 1 (20/11/2026) - análise, fichário e primeiras correções
- Commits: 19 (`50ce7a5` a `791c357`), incluindo o commit base B1.
- Principais correções: B1 dano, cura e PA sumindo ao recarregar a mesa (`50ce7a5`); N-01 vida temporária descartada ao normalizar (`fce9c0b`); BV-002/BV-003 loop de render que travava atualização ao vivo (`e98c223`); loop do store da mesa (`905daa9`); BV-005 confirmação de passar turno (`424a869`); BV-004 atalho da barra lateral (`af3a34d`); A-10b/A-10c limites de fichas antes do wizard (`7ab223f`, `677f5a5`); A-12a/BV-004b janelas flutuantes fora da tela (`bdc86a8`); A-12b rótulos do rail no celular (`2a858bb`); A-12c dicas de atalho (`bd20a83`); A-22 sanitização do compêndio (`1260bd6`); A-23 botão da ficha (`7a06d8c`).
- Limpeza/docs: órfãos e scripts de uso único, `.pyc`, links mortos, `.dockerignore`, `npm test` sem lista duplicada (`a15a45c`, `0b9969c`, `f0c908e`, `c0aab91`); fichário de progresso e histórico (`791c357`).

### Rodada 2 (20/11/2026) - loop do Regente (OpenCode)
- Commits: 22 (`d8dae41` a `5125d9e`).
- Principais correções: N-02 mensagens sem texto de mantenedor (`d8dae41`); BAL-D6/D6b Feiticeiro conjura com Carisma e magias conhecidas (`f7d037a`, `375b05c`); BV-008 botão "Colocar na mesa" do Invocar (`2ad3ed9`); BV-013 `/compendios/monstros` (`a1a304a`); BV-014 PA mostrada pelo teto (`c974a12`); BV-012 alcance do Agarrão do Pacto (`6f1f6d5`); N-02b `/entrar` e recuperação sem texto de mantenedor (`7814cee`); A-09 rótulo de pool fora do log do mestre (`380bb9b`); A-18 robots e sitemap só públicos (`74d8388`); D-02 CONTEXTO aponta o fichário (`4065f0a`); BV-022 alcances de quatro habilidades (`af856e8`).
- Docs/processo: regras do loop do Regente, fila e fichário salvo a cada item (`075fac0`, `93422ac`, `df3ed08`, `2774aa2`, `33d601d`, `a7e9553`, `53513bb`, `6876fe9`, `926818c`, `5125d9e`).

### Rodada 3 (20/11/2026, noite) - decisões delegadas e correções de regra
- Commits: 30 (`9f0f882` a `47248a7`).
- Principais correções: D-13 token não volta à célula antiga (`d798002`); D-05/D-03 `npm test` no CI e schema MariaDB no init do docker-compose local (`38cb748`); D-12 PA guardado não cortado para 5 (`9aac402`); A-10a recusa de ficha extra cita limite real (`afd1b8b`); D-11 armas aprimoradas somam +N ao dano (`b016559`); rolagem com atributo negativo (`a4e813a`); D-07 vida temporária sobrevive à subida de nível e ajuste do mestre (`1b65d9e`); D-09 aviso quando imagem não é salva na ficha (`b1abd2e`); D-14 cadastro sem banco recusado pela API (`23c2ed8`); D-15 log do mestre mostra PA com a mesma conta (`a35dd9c`); D12/D12b Espiritualista sem regras fora do livro (`7f9e371`, `1cc8695`); D11 Ataque Furtivo do Ladino (`a5201e5`); D13 Golpe Sagrado com dano radiante (`1cc8695`).
- Docs: fechamento do loop, decisões D-03 a D-16, guia/pilha real, PRD do Um Anel, propostas de história e balanceamento, plano D11/D12/D13, histórico da rodada 3 (`9f0f882`, `1973b2e`, `f19fd25`, `5f204ba`, `7270fda`, `0203328`, `c6d9d34`, `53e5e87`, `989c9a9`, `039d19c`, `4db6222`, `bd259f6`, `6b51d0c`, `0c48715`, `d015af1`, `47248a7`).

### Rodada 4 (21/11/2026, madrugada) - caça-bugs no site e varreduras contra o livro
- Commits: 27 (`98d39de` a `73a6dcc`).
- Principais correções: D-09b avisos de ficha não salva em mais caminhos (`a57d760`); BV-031/BV-027/BV-030 ficha do Um Anel no celular e textos legíveis (`2763c0c`); BV-033 aventura do Um Anel lista fichas e oculta nome real (`0eee05c`); ALC-fix alcances de magias/habilidades conforme livro (`7880231`); BV-035 card do personagem abre ficha do Um Anel (`2a21ab8`); BV-037 Jornada, Conselho e Fase de Companhia na barra lateral (`1b1a3c4`); CUS-fix custo em PA e CD conforme livro (`4ebfc2b`); BV-036/BV-038 painel do mestre do Um Anel sem ferramentas do Eldarin (`9a24fa9`); TOR-SAVE/BV-040/BV-039 avisos de gravação, card e botão de rolar (`0a23449`); NIT-15 refatoração de PA no log (`073ba2e`); BV-028 troca de arma em uso atualiza seletor (`8fc90e0`); BV-026 seed de fichas demo sem dono (`bb57cf9`); SOMBRA Sombra Etérea soma +1d6 necrótico ao Ataque Furtivo (`ef93d9a`); D13b dano radiante resiste como radiante (`02516f5`); CANAL bônus de habilidade contado uma vez só (`ed75c7d`).
- Levantamentos/docs em `docs/fichario/propostas/`: alcances (`98d39de`, `2a0c354`), custos e danos (`212d234`), bestiário e D-20 (`a830163`), ficha do Um Anel na mesa (`bd3828d`), decisões Voto de Caça e Um Anel na mesa (`f1150a7`), hashes do fichário/histórico atualizados (`b059354`, `d262f9a`), histórico e fichário da rodada (`f393c3a`, `73a6dcc`).

### Rodada 5 (21/11/2026, 02:20 a 06:40) - mesa ao vivo, rota de token, wizard e kits pelo livro
- Commits: cerca de 50, de `07cad10` ao fechamento (lista completa em `docs/HISTORICO.md`, entrada da rodada 5).
- Principais correções: emissor de avisos da sala em `globalThis` e card/ficha do Um Anel ao vivo (`9d96a8d`, `1adc9ba`, `5ec05fe`; BV-048 a BV-050); Jornada e Conselho mostram a sessão (`c78e0b9`, BV-073/074); PATCH de token exige login e limita campos do jogador (`10fbb09`); passivos, proficiências e 36 kits pelo livro (`55b601e`, `3400a60`); contador do chat (`2d9a65e`); celular (`66a9969`); sem erro de hidratação (`5a05b79`).
- Levantamento: permissão das 119 rotas em `propostas/rotas-permissao.md`.
- Decisões novas para o dono: D-21 (traços de classe), D-22 (nomes culinários do livro), D-23 (escolha de truques no wizard).

## O que depende do dono

Lista copiada/alinhada à página [03 Precisa de decisão](03-precisa-de-decisao.md) (itens pendentes indicados):

- **D-01** - Texto de livro comercial em repositório público (urgente): `livros/um-anel/` com texto corrido em repositório público. Decisão: tornar privado, remover/reescrever histórico, manter só material próprio, ou deixar como está. Recomendação em 03: tornar privado agora.
- **D-02** - Branch com commits fora da `main` e fora de produção: abrir PR, separar correções do Eldarin, ou esperar teste em mesa real. Merge na `main` dispara deploy.
- **D8, D9, D10** (balanceamento, propostas/balanceamento.md seção 3.6) - livro se contradiz no PA por golpe e no +1 PA do Guerreiro, e mudar fórmula de vida altera todo personagem já criado. Ficam com o dono.
- **D-21, D-22, D-23** (rodada 5) - traços de classe na ficha (BV-056); nomes culinários do livro (Harmonização x Forrageio); escolha de truques no wizard e kit do Bruxo (BV-072). Ver página 03.
- **D-20** - Bestiário: livro ou curva de balanceamento do VTT? Varredura em `propostas/bestiario.md` achou 507 diferenças; decisão entre (a) livro manda, (b) curva manda, (c) manter como está.
- **Magias com dano fora do livro** - pendência registrada no histórico/fila (rodada 4: três magias com dano fora do livro; ver também `propostas/custos-e-danos.md` e itens de fila relacionados). Decisão/correção depende de conferência com o dono/livro.
- **Termos de Uso** - texto jurídico; depende do dono (fora do código).
- **LGPD / privacidade** - promessas da política de privacidade e servidor no Brasil; depende do dono (fora do código, conforme página 03).

Outras pendências ainda registradas em 03/06/11 (para contexto): B2 imagem de token sem log de produção definitivo, decisões menores já tratadas em parte (D-06, D-07, D-09, D-10, D-11 a D-16 com encaminhamentos), e itens de fila que exigem teste em mesa real ou decisão de regra.

## Como retomar

Comandos locais (na raiz do projeto `D:\Cursor\RPG`):

```bash
npm run local
npm test
npm run build
```

- `npm run local`: sobe o ambiente local (inclui banco local conforme configuração do projeto, ex.: MariaDB/docker-compose quando aplicável).
- `npm test`: roda a bateria de verificação registrada no projeto.
- `npm run build`: valida a compilação de produção.

Agentes no Maestri: usar os terminais/agentes definidos no fichário (ex.: Regente para orquestração, Bigorna para correções, Lupa para revisão, Farejador para testes no portal/site local), cada etapa com contexto controlado e commits/avanços registrados nas páginas do fichário (`07-correcoes.md`, `08-revisao.md`, `11-fila-de-correcoes.md`) conforme as regras da [página 12 do Regente](12-regras-do-regente.md). Commit e push só quando o dono pedir.
