# Histórico de sessões — Eldarin VTT (MXDRPG)

Documento vivo. **Atualizado a cada sessão de trabalho** (Cursor / Claude).  
Serve como continuidade de contexto caso o chat seja perdido.

Referências completas: [CLAUDE-PROJETO.md](./CLAUDE-PROJETO.md) · [CLAUDE-CODIGO-SEGURO.md](./CLAUDE-CODIGO-SEGURO.md)

---

## Padrão obrigatório — toda sessão

Ao concluir (ou pausar) um bloco de trabalho, **sempre** acrescentar uma entrada no [Log de sessões](#log-de-sessões) abaixo.

### Formato da entrada

```markdown
### AAAA-MM-DD — Título curto do que foi feito

**Pedido:** o que o usuário pediu (1–2 frases).

**Passo a passo:**
1. Diagnóstico — o que estava errado ou faltando
2. Decisão — abordagem escolhida e por quê
3. Implementação — mudanças concretas (rotas, libs, env, deploy…)
4. Validação — build, smoke, o que conferir em produção

**Arquivos tocados:**
- `caminho/arquivo.ts` — o que mudou em uma linha

**Commits / deploy:** hash ou “pendente local” (push só quando o usuário pedir).

**Como testar:** comandos ou URLs.
```

### Checklist rápido

- [ ] Entrada nova com data de hoje
- [ ] Passo a passo numerado (não só lista de arquivos)
- [ ] Tabela **Estado atual** atualizada se mudou auth, URL, deploy ou DB
- [ ] `npm run build` mencionado se houve alteração em `.ts` / `.tsx`

---

## Estado atual do produto

| Item | Status |
|------|--------|
| **URL produção** | https://www.mxdrpg.com.br |
| **Hosting** | Contabo — Docker + GHCR (`Dockerfile` + `docker-entrypoint.sh`) |
| **Branch principal** | `main` |
| **Marca / hub** | **MXDRPG** — landing em `/`; `/mesas` redireciona para `/rpg/eldarin` (único sistema ativo) |
| **Auth** | OAuth Google/Discord + e-mail/senha em `/entrar`; demo `mestre`/`jogador` senha `123` — **sem Clerk** |
| **DB** | MariaDB (`DATABASE_URL=mysql://…`) — em produção: SSL self-signed exige `MARIADB_SSL_REJECT_UNAUTHORIZED=0` ou `?sslaccept=accept_invalid_certs` |
| **Stack** | Next.js 15, React 19, TypeScript strict |
| **Rotas canônicas** | Login `/entrar` · Onboarding `/conta/bem-vindo` · Hub `/mesas` · Eldarin `/rpg/eldarin` |

---

## Resumo de funcionamento (para retomar sem contexto)

### Hierarquia de domínio

```
Aventura (campanha persistente)
  └── Mesa / Sala (RoomState — VTT ao vivo)
        └── Atores (fichas instanciadas na sala)
```

- **Mestre** = `ownerId` da aventura/sala — sem role global mestre/jogador.
- **Jogador** entra via `inviteCode`; passa a integrar `memberIds` para sempre (nunca removido).
- **Demo** = `roomId === "demo"`, sempre em memória, regras especiais — não misturar com salas reais.

### Regras de ouro (nunca violar)

1. PA/combate calculado **só no servidor** (`lib/combat/` + handlers) — cliente faz preview apenas.
2. Mutações de sala **só via** `lib/room/handlers/` + `persistRoom` — nunca mutar `room` direto na route.
3. `memberIds` **só cresce** — jogador nunca é removido da aventura.
4. `data/compendiums/*.json` são **gerados** — editar `livros/` e rodar `npm run sync:data`.
5. **Nunca** `title` nativo em HTML — usar `data-site-tip` / `.site-tooltip`.
6. Commit/push **só quando o usuário pedir**.

### Zonas de risco

| Zona | Arquivos | Regra |
|------|----------|-------|
| Vermelho | `lib/combat/`, `pa-*.ts`, `lib/auth/`, `middleware.ts`, `scripts/db/` | Não tocar sem pedido explícito |
| Amarelo | `MesaWorkspace.tsx`, `Battlefield.tsx`, `lib/adventure/`, `lib/room/settings.ts` | Ler vizinhos antes |
| Verde | `app/**/page.tsx`, `components/home/`, `docs/`, CSS de página | Relativamente seguro |

### Validação obrigatória

```bash
npm run build                 # sempre após TS/TSX
npm run lint                  # alterações em vários arquivos
npm run test                  # PA, movimento, grid
npm run sync:data:check       # após editar livros/
```

---

## Log de sessões

<!-- Ver "Padrão obrigatório" no topo: Pedido → Passo a passo → Arquivos → Commits → Como testar -->

---

### 2026-08-08 — `/personagem` mandava todo mundo pra um 404, e o alvo seguinte tinha receita errada

**Pedido:** rodada 2 do loop do Eldarin — alvos 5 e 4 do backlog.

**Passo a passo:**

1. **ALVO 5 — o layout de `/personagem` anulava as guardas certas das filhas.**
   `app/personagem/layout.tsx:13` fazia:

   ```ts
   const path = h.get("x-pathname") ?? h.get("x-invoke-path") ?? "/personagem";
   redirect(signInPath(path.startsWith("/personagem") ? path : "/personagem"));
   ```

   **Nenhum dos dois cabeçalhos existe** — confirmei que `middleware.ts` não os
   define e o Next não os injeta. Então o `?? "/personagem"` era o único ramo
   alcançável. E **`/personagem` não tem `page.tsx`** (confirmei: o diretório tem
   só `[id]`, `layout.tsx` e `novo`). Resultado: quem abrisse um link de ficha com
   a sessão vencida ia para o login e, depois de autenticar, caía num **404**.

   Pior: as três páginas-filhas **já fazem o redirect certo**, com o caminho exato
   de volta (`/personagem/[id]`, `/personagem/[id]/editar?requestId=…`,
   `/personagem/novo`) — e o layout roda antes, anulando todas.

   O gate saiu do layout. Sem sessão, ele devolve `children` cru e a filha assume.
   Não dava para simplesmente apagar o `getSession()`: o `PortalShell` precisa de
   `session.user`, então a correção é `if (!session) return <>{children}</>`.

2. **`scripts/verify-rotas.mjs` — a guarda é GENÉRICA de propósito.** Proibir os
   dois cabeçalhos consertaria o caso e deixaria a classe do problema em pé. O
   teste varre **todo** `redirect("/…")` e `signInPath("/…")` literal em `app/**`
   (17 destinos hoje) e exige que cada um resolva para um `page.tsx` existente,
   um segmento dinâmico, ou um redirect do `next.config.ts`. Qualquer 404 interno
   futuro quebra o teste.

   A função `rotaExiste` tem **cinco casos de sanidade próprios**, incluindo o que
   motivou tudo: ela precisa *recusar* `/personagem`. Sem isso, uma função quebrada
   faria a varredura passar sempre.

   E há uma asserção que **conta os destinos encontrados** antes de checá-los. Sem
   ela, o dia em que alguém trocar aspas por crase o regex para de casar,
   `quebrados` fica vazio, e o teste diz "tudo certo" sem ter olhado nada — a
   armadilha da checagem negativa que não roda.

   Como o gate saiu do layout, o teste também exige que **toda página sob
   `/personagem` tenha guarda própria** (varre diretório, não lista), e que o
   layout **não volte** a redirecionar.

3. **ALVO 4 — comecei a implementar e a receita do backlog estava errada.** Ela
   mandava pôr `import "server-only"` em `lib/compendium/registry.ts` e
   `lib/vtt/monsters.ts` como "trava permanente, esforço médio". Isso **quebraria o
   build**: **dez componentes cliente** importam esses dois módulos, e **quatro
   deles precisam legitimamente do dado no navegador** — os painéis de Mestre
   invocam e editam monstro no cliente. `server-only` ali não é trava barata, é
   proibir o que o produto faz.

   O diagnóstico, esse sim, se confirmou — e agora com números:

   | Medida | Valor |
   |---|---|
   | `monstros.json` | 451.068 bytes |
   | chunk `7918-*.js` | 659.134 bytes |
   | fatia de dado de monstro no chunk | **~295 KB, 45%** |
   | rotas que carregam o chunk | **9 de 156** |

   Não é "o bundle público" inteiro, como a auditoria dizia — mas as 9 rotas
   incluem `/personagem/[id]`, `/personagem/novo`, `/personagem/[id]/editar` e
   `/mesa/[roomId]`. Ou seja: **um jogador comum baixa ~295 KB de bestiário
   admin-only só para abrir a própria ficha.**

   O defeito real é **gating de dado sem gating de bundle**: o acesso já é
   protegido por papel em tempo de execução (`canViewPack`, `registry.ts:106`),
   mas o `import` no topo entra no grafo estático, então o chunk da ficha carrega
   o bestiário junto. A correção certa é **separação de chunk** (`await import()`),
   não `server-only`.

   **Não implementei**, e por regra minha: `entriesForPack` é síncrona e usada em
   todo o registry, então o refactor propaga pelos dez componentes — e os painéis
   de invocação **não têm teste nenhum**. Refatorar caminho sem cobertura é
   exatamente o que este backlog existe para evitar. O alvo foi **reclassificado de
   médio para GRANDE** e a entrada foi corrigida no lugar onde ela está, com um
   pré-requisito explícito: cobrir `MonsterSpawnPanel` e `GmCreationsPanel` antes
   de mexer.

**O que ficou de fora:** o alvo 4 não foi implementado — só medido, rediagnosticado
e reespecificado. Está dito na entrada do backlog e aqui.

**Validação:** a varredura de rotas foi quebrada de propósito (troquei o destino de
`/personagem/novo` para `/personagem`) e acusou `app/personagem/novo/page.tsx →
/personagem`; revertida com Edit, nunca `git checkout`. `npx tsc --noEmit` limpo ·
`npm run build` compila · `npm run test` verde com **3052 asserções**
(`verify-rotas: 15 ok`).

**Arquivos tocados:**
- `app/personagem/layout.tsx` — gate removido, com o porquê no arquivo
- `scripts/verify-rotas.mjs` — **novo**, 15 asserções
- `package.json` — teste registrado no portão
- `docs/AUDITORIA-ELDARIN-2026-08.md` — alvo 4 corrigido no lugar, com os números

**Commits / deploy:** ver commit desta rodada na branch `fix/login-google-e-responsivo-um-anel`.

**Como testar:** `node scripts/verify-rotas.mjs` · abrir um link de ficha com sessão
vencida e confirmar que o login devolve para a ficha, não para um 404.

---

### 2026-08-08 — Volta ao Eldarin: a política de privacidade que não ia ao ar, e o nome real vazando de novo

**Pedido:** o usuário pediu para virar o loop para o **Eldarin**. Antes de escolher
alvos, reverificar a auditoria de UX de 20/06 (49 dias) contra o código de hoje.

**Passo a passo:**

1. **Auditoria multi-agente: 13 agentes, 6 frentes, cada achado lido por dois
   leitores independentes** (um investigador e um cético instruído a *derrubar* o
   achado). Resultado: **64 achados, 54 abertos**, sintetizados em 22 alvos
   priorizados — mais uma lista explícita do que **não** fazer agora.

   **Dez itens da auditoria antiga já tinham caído** e foram removidos da lista:
   cards do compêndio clicáveis, `/mundo` na navbar, persistência das janelas
   flutuantes, badge de não-lida, labels do rail no desktop, e a mesa demo — que
   foi **removida por inteiro** em 24/07, então o item "demo com grid vazio" nem
   se aplica mais.

2. **Contexto que a auditoria não tinha: o Eldarin está parado desde ~28/06.**
   Tudo de 24/07 em diante foi Um Anel. O desequilíbrio aparece no teste — contando
   chamadas de asserção no código dos scripts:

   | Sistema | Chamadas de asserção |
   |---|---|
   | Um Anel | **1390** |
   | Eldarin + comum | **12** |

   O sistema proprietário, que é o carro-chefe, praticamente não tem rede estática.

3. **ALVO 1 (crítico/legal) — a política de privacidade não ia ao ar.**
   `app/privacidade/page.tsx` lia `docs/PRIVACIDADE-LGPD.md` com `fs.readFileSync`
   dentro de um `try/catch {}` silencioso, com fallback literal. Mas **`docs/` está
   no `.dockerignore`** — na imagem de produção o arquivo nunca existe, o `catch`
   engolia a falha, e o que a plataforma publicava como política de privacidade era:

   > *"Política em atualização. Edite docs/PRIVACIDADE-LGPD.md com e-mail do titular
   > antes do lançamento."*

   Um recado interno de desenvolvedor no lugar de um documento com efeito legal. E,
   mesmo em desenvolvimento, o markdown era jogado num `<article>` com
   `white-space: pre-wrap` **sem parser** — saíam `#`, `**` e a tabela de pipes crus.

   Convertido para JSX em `app/privacidade/conteudo.tsx`: sem `fs`, sem `catch`, sem
   fallback, com tabela e listas de verdade. **Nenhuma dependência nova** — instalar
   um parser de markdown por causa de uma página é caro demais. O markdown continua
   como texto autoral de referência, agora com aviso no topo de que editá-lo não muda
   o site, e uma asserção amarra os dois.

4. **O texto legal também estava ilegível — e agora a conta está no teste.** O corpo
   usava `var(--text-muted)`. Calculado pela fórmula WCAG dentro do próprio script:

   | Token | Sobre `--glass` (#1a1916) | AA (4.5:1) |
   |---|---|---|
   | `--text-muted` (#8a7d68) | **4.36:1** | **reprova** |
   | `--text` (#d4ccbe) | 11.03:1 | passa |
   | `--text-strong` (#ede6d8) | 14.16:1 | passa |

   O corpo passou a usar `--text`. A fórmula é aritmética pura, então está
   **implementada no script**, não afirmada por mim — inclusive com dois casos de
   sanidade (preto/branco = 21, mesma cor = 1), porque uma fórmula errada faria todas
   as asserções de contraste passarem sempre.

5. **ALVO 2 (crítico/privacidade) — o nome real da conta vazando pela quarta vez.**
   Quatro handlers de Mestre gravavam `authorName: user?.name ?? "Mestre"` no
   snapshot da sala, que é distribuído a **todos** os participantes:
   `combat-gm.ts:62`, `culinary-meal.ts:52`, `gm-actor-progress.ts:87`,
   `gm-saving-throw.ts:115`. Corrigido para `user?.nickname?.trim() || "Mestre"`, que
   é o padrão já usado em 20+ rotas.

   Este vazamento já tinha sido corrigido **três vezes** (29/07 no chat e nos logs de
   combate, 29/07 no perfil/amigos, 31/07 nos fallbacks) e voltou. Por isso a guarda
   nova varre **diretório** (`lib/room/handlers/` e `app/api/`, 132 arquivos), não
   lista fixa: um handler criado amanhã com o padrão errado quebra o teste sem
   ninguém lembrar de atualizá-lo. A guarda proíbe o nome real preenchendo campo
   **público** (`authorName`, `displayName`, `senderName`…) e continua permitindo
   `user.name` nas telas do próprio dono e no admin — banir a palavra inteira seria
   mais estrito que a regra.

6. **Seis testes de Eldarin existiam, passavam, e não rodavam no portão:**
   `verify-combat-dice-sync`, `verify-combat-fx-live`, `verify-combat-roll-display`,
   `verify-culinary`, `verify-turn-guard`, `verify-xp`. É o padrão "motor pronto e
   desligado" aplicado ao próprio teste. Registrados no `npm test`.

   **Falso alarme evitado:** `verify-inventory-requests` também está fora, mas rodei
   e ele falha com `ECONNREFUSED 127.0.0.1:3306` — precisa de MySQL. É teste de
   integração e fica fora do portão estático **com razão**. Não foi registrado.

7. **Uma asserção minha nasceu errada, do jeito já catalogado: casou com o
   COMENTÁRIO.** A primeira versão de `verify-legal-pages.mjs` acusou
   `conteudo.tsx` de conter o texto de fallback e de chamar `readFileSync` — as duas
   coisas estavam no comentário que explica por que o arquivo existe. Corrigido com
   `stripComments`, que já existia noutros testes deste repositório.

**Validação:** as duas guardas foram quebradas de propósito e confirmadas disparando
— reintroduzi o fallback e o `catch {}` na página (as duas acusaram), e reverti um dos
quatro handlers para `user?.name` (a varredura apontou `combat-gm.ts:62` **e** a
contagem de handlers corretos caiu de 4 para 3). Revertidas com Edit, nunca
`git checkout`. `npx tsc --noEmit` limpo · `npm run build` compila · `npm run test`
verde com **3037 asserções** (`verify-legal-pages: 21 ok`,
`verify-privacidade-apelido: 7 ok`).

**Arquivos tocados:**
- `app/privacidade/conteudo.tsx` — **novo**, a política em JSX
- `app/privacidade/page.tsx` — sem `fs`, sem `catch`, sem fallback
- `app/globals.css` — bloco `.legal-doc` com o token de contraste aprovado
- `lib/room/handlers/combat-gm.ts`, `culinary-meal.ts`, `gm-actor-progress.ts`,
  `gm-saving-throw.ts` — apelido no lugar do nome real
- `scripts/verify-legal-pages.mjs`, `scripts/verify-privacidade-apelido.mjs` — **novos**
- `package.json` — 8 testes registrados no portão
- `docs/PRIVACIDADE-LGPD.md` — aviso de que editá-lo não muda o site

**Commits / deploy:** ver commit desta rodada na branch `fix/login-google-e-responsivo-um-anel`.

**Como testar:** `node scripts/verify-legal-pages.mjs` (imprime as razões de contraste
medidas) · `node scripts/verify-privacidade-apelido.mjs` · abrir `/privacidade` e ver o
documento formatado, com tabela.

---

### 2026-08-08 — Mirkwood 2951–2953, o Espírito da Floresta no bestiário, e o contador que mentia

**Pedido:** continuar o loop — atacar o bloco 2 da campanha em fatias. Ao final da
rodada o usuário pediu para **encerrar o loop** e subir tudo.

**Passo a passo:**

1. **`livros/um-anel/23-mirkwood-02-o-retorno-da-sombra.md`** — **novo, e declaradamente
   PARCIAL**. O bloco 2 tem **dez anos e mais de quarenta páginas** de fonte, mais que
   qualquer aventura de *Tales from Wilderland*. Não cabe num turno, então vai em
   fatias. Esta rodada entregou **2951, 2952 e 2953**:

   | Ano | Fase de aventura |
   |---|---|
   | 2951 | O Elmo da Paz |
   | 2952 | O Cajado do Guardião da Estrada |
   | 2953 | A Besta da Floresta |

   **Faltam 2954 a 2960.** O arquivo abre com um aviso de conversão parcial listando os
   dois conjuntos, e **três asserções novas** garantem que ele não minta: o aviso tem de
   listar exatamente os anos que faltam, exatamente os já convertidos, e **nenhum ano
   fora da lista pode ter seção no arquivo**. Um ano convertido sem ser anunciado quebra
   o teste.

2. **`espirito-da-floresta` entrou no bestiário — inteiro.** Foi o critério que já tinha
   deixado Sarqin e Tyulqin de fora: **todas** as cinco Habilidades Especiais do bloco de
   1ª edição precisam converter. Aqui convertem — quatro já existiam na 2ª edição
   ("Natural da Escuridão" = **Habitante das Trevas**, "Poltrão" = **Covarde**,
   "Amedrontar" = **Infundir Medo**, "Medo de Fogo" = **Medo do Fogo**) e a quinta,
   **Horror da Floresta**, é descrita pelo próprio original.

   A conversão de Horror da Floresta exigiu aritmética declarada: o original **soma +5 ao
   NA**, e as âncoras da régua são **+4 = perde (1d)** e **+6 = perde (2d)**. O +5 cai
   exato no meio, e a conversão **sobe** — a mesma regra que já vale para a Empreitada,
   porque arredondar para baixo facilita a cena em silêncio.

3. **Lacuna nova registrada: o bloco do Lobisomem da Floresta das Trevas.** *A Besta da
   Floresta* é uma aventura inteira construída em torno dele, e o original remete à
   "página 83 do Livro do Mestre" da **1ª edição**. O bestiário traduzido da 2ª **não
   traz Lobisomem**, e nenhum capítulo do corpus traz. Registrado, **não estimado** — mas
   o que a fonte **dá** está convertido: ele foge se Ferido ou a 0 de Resistência, e se
   morto abandona o corpo de lobo para possuir outro.

4. **Os três Espectros do Anel chegam em 2951 e continuam pendentes.** O apêndice tem
   estatísticas para os três, mas cada um depende de ao menos uma Habilidade Sinistra que
   é lacuna: **"Investida Selvagem"**, **"Desnortear"**, **"Encarnação do Horror"**. Mesmo
   critério de Sarqin e Tyulqin.

5. **AUDITORIA — padrão 8 (texto livre usado como contador): o contador de progresso do
   teste estava mentindo.** Ele imprimia `blocos convertidos: 2/5`, o que soa como 40% da
   campanha. Mas o bloco 2 tem **três de dez anos** convertidos — o número real era
   **7 anos de 30**, ou 23%. Trocado por um contador de **anos**, que é a unidade honesta,
   com o de blocos separando **inteiros** de **parciais**:

   ```
   anos convertidos: 7/30 — faltam 23
   blocos inteiros: 1/5 (+1 parcial)
   ```

6. **A escala invertida das Propriedades apareceu TRÊS vezes em 2952, e duas delas se leem
   ao contrário.** A feira de negócios "reduz a classificação em 2" — o que na escala
   invertida é **melhorar**, um presente. O inverno "aumenta a classificação em 1" — o que
   é **piorar**. E a Propriedade da Velha Estrada começa em **Valor 8** e "cai 1 por ano"
   até 5 — de novo, **melhorar**. As três estão escritas dizendo o que significam de
   verdade, e cada uma tem asserção própria.

7. **Piso de citação da régua virou declaração por bloco.** A checagem exigia ≥8 entradas
   CVR de todo arquivo. Uma fatia de três anos toca legitimamente menos regras que um
   bloco inteiro com um Debate dentro, e um mínimo global obrigaria a **inflar citação
   para bater a conta**. Agora cada bloco declara seu próprio piso (`minCVR`), o que é uma
   afirmação explícita sobre quanto aquele bloco converte.

**Validação:** as asserções novas foram quebradas de propósito e confirmadas disparando —
o aviso de anos faltantes (removi 2954 e ele acusou), `armour` errado e `might` fora do
padrão no bloco do Espírito — depois revertidas com Edit, nunca `git checkout`. Duas
falhas legítimas apareceram no caminho e foram corrigidas no **texto**, não afrouxando o
teste: uma frase minha explicando os testes de fadiga não dizia no que eles viraram, e o
arquivo citava poucas entradas da régua. `npx tsc --noEmit` limpo · `npm run build`
compila · `npm run test` verde com **3007 asserções**
(`verify-um-anel-campanha-mirkwood: 146 ok`).

**Arquivos tocados:**
- `livros/um-anel/23-mirkwood-02-o-retorno-da-sombra.md` — **novo**, 2951–2953
- `lib/character/um-anel/adversaries.ts` — bloco `espirito-da-floresta`
- `scripts/verify-um-anel-campanha-mirkwood.mjs` — bloco 2 na lista, contador de anos,
  piso de CVR por bloco

**Commits / deploy:** ver commit desta rodada na branch `fix/login-google-e-responsivo-um-anel`.

**Como testar:** `node scripts/verify-um-anel-campanha-mirkwood.mjs` — ele imprime
`anos convertidos: 7/30`.

---

### Estado ao encerrar o loop (2026-08-08)

O loop autônomo do Um Anel foi encerrado a pedido do usuário nesta rodada. Estado para
quem retomar:

- **Sistema:** combate, Sombra, progressão, Jornada, Fase de Companhia, Esperança,
  Malfeitoria, engajamento, descansos, Conselho, Fadiga, Fontes de Dano, Veneno, Olho de
  Mordor e Elmo removível — **todos ligados**.
- **Livros:** *Tales from Wilderland* **inteira** (7/7). *The Darkening of Mirkwood*
  **7 anos de 30**: bloco 1 completo, bloco 2 nos três primeiros anos.
- **Régua CVR:** 37 entradas. **Packs:** 7, 148 entradas.
- **Testes:** 3007 asserções verdes, tsc limpo, build compila.
- **Próximo passo natural:** fatia 2954–2956 do bloco 2, no mesmo arquivo, estendendo o
  campo `anos` da entrada do bloco 2 em `verify-um-anel-campanha-mirkwood.mjs`.
- **Nada foi testado em dispositivo real nem em mesa.** Toda a validação é estática.

---

### 2026-08-08 — Bloco 1 de Mirkwood convertido (2947–2950), e duas varreduras acharam erro meu

**Pedido:** continuar o loop — converter o primeiro bloco da campanha de trinta anos e
criar o teste próprio dela.

**Passo a passo:**

1. **`livros/um-anel/22-mirkwood-01-os-ultimos-bons-anos.md`** — os quatro anos
   completos (páginas impressas 8–20), cada um com **Eventos**, **Fase de aventura** e
   **Fase de Companhia**:

   | Ano | Fase de aventura |
   |---|---|
   | 2947 | Homem do Mago |
   | 2948 | O Debate-do-Povo em Rhosgobel |
   | 2949 | Caçada ao Animal |
   | 2950 | Segredos Enterrados |

2. **`scripts/verify-um-anel-campanha-mirkwood.mjs`** — teste próprio, no mesmo formato
   de lista do de Wilderland, **78 asserções**. Não estende o de Wilderland porque lá
   cada arquivo é uma aventura solta e aqui é um **bloco de anos**: o teste cobra que
   cada ano tenha as três partes, que os anos estejam em ordem crescente, e imprime
   `blocos convertidos: 1/5 — faltam 4`, para o número nunca ficar calado.

   Ele também **varre o diretório** procurando `/^\d\d-mirkwood-.*\.md$/` e exige que
   todo arquivo encontrado esteja na lista `BLOCOS`. Lista fixa já deixou passar dívida
   duas vezes neste repositório; aqui um bloco novo convertido sem entrar na lista
   **quebra o teste** em vez de passar despercebido.

3. **As conversões que exigiram decisão:**

   - **O Debate-do-Povo virou um Conselho** (CVR-020): três propostas correndo no mesmo
     encontro, cada uma com placar próprio, e a tabela de *Julgamento* do original
     traduzida como o resultado de cada placar.
   - **NA 14 e NA 18 sumiram** (CVR-017): falar sobre Ceawin ou Mogdred rola **normal**
     (o NA 14 já era o nível padrão); incutir dúvida sobre Amaleoda é **Complicação —
     *perde (1d)***, porque quase todos já a apoiam. E o NA 20 dos pântanos virou a
     Complicação máxima, ***perde (2d)*** — o teto.
   - **Prestígio aparece em três cenas do original e não converte em nenhuma**
     (CVR-030): o anúncio de Ingomer, os heróis élficos enviados a Beorn, e a recompensa
     pelo cervo branco. Em cada uma ficou só a metade que existe na 2ª edição — VALOR, a
     relação com os Beornings, e o Tesouro.
   - **A Empreitada de 5 sucessos não existe.** A exploração da Fortaleza Alta pedia
     *cinco* testes de Investigação, e a 2ª edição só tem **3, 6 e 9**. A conversão
     **sobe para 6** em vez de descer para 3 — descer tornaria a cena mais fácil do que
     foi escrita, e arredondar para baixo em silêncio é exatamente o que a régua existe
     para impedir. A decisão está escrita no arquivo, e o teste exige que esteja.
   - **O ponto de Sombra do cervo escuro ganhou fonte** (CVR-024). O original dá o ponto
     **sem teste nenhum**, e a 2ª edição não ganha Sombra do nada. Matar uma criatura
     encantada que protegia a companheira e o filhote é **Malfeito** — e Sombra por
     Malfeito **não se reduz**, que é justamente o peso que a cena quer ter.
   - **O bônus de +2 na Propriedade** (2947) só faz sentido sabendo que **a tabela de
     Propriedades é lida no sentido NORMAL** — resultado maior que o Valor rende Tesouro
     (PRO-011). É o **oposto** da tabela de Fontes de Dano. O aviso está no arquivo e o
     teste cobra que esteja.
   - **O arco Penbregol perdeu o Gume 8** (CVR-008): na 2ª edição o limiar do Golpe
     Perfurante é fixo em 10 ou [Runa], e manter um Gume próprio criaria um segundo
     limiar. **Nenhuma qualidade foi inventada no lugar** — sobrevive a salva inicial
     adicional, que é propriedade de arco da floresta e não depende de Gume.

4. **Um bloco de estatística convertido: o Servo da Colina do Tirano**, com duas lacunas
   declaradas dentro do próprio bloco. O **Vigor** não existe nos blocos de 1ª edição e
   o texto da cena não resolve. E a **Armadura `2d+2`**: os `2d` convertem, o **`+2`
   não** — ao contrário de `3d+4 (Mail shirt and Helm)`, onde o parêntese nomeia o
   equipamento e permite decompor a soma, aqui **nada é nomeado**. O *Desarma* do
   original também não converteu: a lista de Dano Especial da 2ª edição tem quatro itens
   e Desarmar não é um deles — ficou **Quebrar Escudo**.

   A habilidade **"Sem trégua"** ficou **pendente**: o original a lista e **não a
   descreve em lugar nenhum**. Uma asserção exige que ela apareça como pendente e que
   **não** exista um "Habilidade Sinistra — Sem trégua" com efeito inventado.

5. **AUDITORIA — duas varreduras existentes acharam erro meu no arquivo novo, sem eu
   procurar:**

   - **O teste de Wilderland bane "Fase em Sociedade"** — é termo de 1ª edição, e a 2ª
     chama de **Fase de Companhia** (CVR-032). Eu tinha copiado o nome do original em
     **sete** lugares. Corrigido por script que conta as substituições
     (`7 substituições, todas conferidas`).
   - **O teste de glossário acusou `não usa "CAÇA" (a Perícia é "Caçada") — 3×`.** Eu
     tinha escrito o nome da Perícia errado em três lugares. Corrigido por script que
     conta, e que confere **os dois lados**: o termo errado sumiu **e** o certo apareceu
     exatamente três vezes.

   Nenhum dos dois foi achado por mim relendo — foram guardas antigas disparando num
   arquivo que nem existia quando elas foram escritas. É o argumento inteiro a favor de
   varrer diretório em vez de lista.

6. **Regex mais estrita que a regra, décima segunda vez — e agora com cura geral.** Três
   asserções novas falharam contra texto **correto**, todas pelo mesmo motivo: o regex
   atravessava a quebra de linha do markdown, e dentro de citação em bloco a linha
   seguinte ainda começa com `> `. `/sentido normal do jogo/` não casa com
   `"sentido normal\n> do jogo"`.

   Em vez de afrouxar cada regex, o teste ganhou um helper **`liso()`** que achata a
   quebra de linha numa linha só, usado **só em checagem de prosa** — quem depende de
   âncora de linha continua lendo o texto cru. É a cura da família inteira, não do caso.

   A quarta falha foi diferente e mais interessante: a varredura de "Prestígio" corta
   frases por **ponto**, e a seção de *Lacunas* explica a lacuna ao longo de vários
   períodos — os fragmentos do meio ficavam sem a palavra que os inocenta. A correção
   foi **escopo**: a varredura roda no corpo da conversão (onde um "Prestígio 3" solto
   seria instrução), e a seção de lacunas ganhou **asserção própria** exigindo que
   declare as três cenas, que Prestígio não existe na 2ª edição, e que nada foi
   inventado. Nada deixou de ser vigiado — ficou mais vigiado que antes.

**Validação:** as asserções novas foram quebradas de propósito e confirmadas disparando
— `Resistência` errada, `Vigor` virando número, e a Empreitada fora da escala (`fora de
escala: 5`) — depois revertidas com Edit, nunca `git checkout`. `npx tsc --noEmit` limpo
· `npm run build` compila · `npm run test` verde com **2923 asserções**
(`verify-um-anel-campanha-mirkwood: 78 ok`, `verify-um-anel-glossario: 421 ok`).

**Arquivos tocados:**
- `livros/um-anel/22-mirkwood-01-os-ultimos-bons-anos.md` — **novo**, os quatro anos
- `scripts/verify-um-anel-campanha-mirkwood.mjs` — **novo**, 78 asserções
- `package.json` — teste novo registrado em `test` e `test:um-anel`

**Commits / deploy:** ver commit desta rodada na branch `fix/login-google-e-responsivo-um-anel`.

**Como testar:** `node scripts/verify-um-anel-campanha-mirkwood.mjs` — ele imprime
quantos blocos da campanha já foram convertidos e quantos faltam.

---

### 2026-08-08 — A lacuna do bloco de Aranha FECHOU, e uma asserção antiga estava passando errado

**Pedido:** continuar o loop — ler o apêndice de criaturas de *The Darkening of
Mirkwood* **antes** do bloco 1, porque ele podia fechar as lacunas de Aranha e Troll da
Colina.

**Passo a passo:**

1. **Apêndice lido (páginas impressas 126–137).** Traz os três Nazgûl de Dol Guldur
   (Tenente, Fantasma da Floresta, Mensageiro de Mordor), cinco PNJs em formato de
   Personagem do Mestre (Bofri, Geirbald, Halbrech, Mogdred, Valdis), Goblin da
   Floresta, Espírito da Floresta e — o que interessava — **cinco blocos de Aranha**:
   Aranhas Caçadoras e as três Crias de Shelob (Gorda Sarqin, Selvagem Tauler, Negra
   Tyulqin).

   - **Lacuna da Aranha: FECHADA.**
   - **Lacuna do Troll da Colina: continua aberta** — não há bloco de Troll no
     apêndice.

2. **Dois blocos convertidos, dois deliberadamente não.** Entraram no bestiário
   `aranha-cacadora` (**Aranha Caçadora**) e `tauler-o-cacador` (**Selvagem Tauler**),
   porque **todas** as Habilidades Sinistras deles mapeiam para o corpus da 2ª edição.
   **Sarqin e Tyulqin ficaram de fora**, e o motivo está escrito em CVR-035: as
   habilidades delas ("Odor Nauseabundo", "Encarnação do Horror", e o efeito "Abatido"
   dos Muitos Venenos) são **lacunas de fonte já registradas**. Converter os números sem
   elas produziria um bloco que finge estar completo.

   A Aranha Caçadora é exatamente o bloco que as aventuras 1 e 2 de Wilderland pediam —
   a aventura 2 descreve a aranha da caverna como tendo **Grande Salto** no lugar de
   Habitante das Trevas, e é o que o bloco tem.

3. **Duas regras de conversão novas, ambas ancoradas no corpus da 2ª edição:**

   - **CVR-036 — Envenena.** O Ataque Direcionado "Envenena" da 1ª edição **não pode**
     virar Dano Especial: a 2ª edição só tem quatro (Quebrar Escudo, Golpe Pesado,
     Perfurar, Agarrar). Virou Habilidade Sinistra acionando a **Fonte de Dano Veneno**,
     cujo exemplo de nível **Gravíssimo** na própria tabela da 2ª edição é, literalmente,
     **"Veneno de Aranha"** — e é assim que o motor já está escrito
     (`lib/combat/um-anel/hazards.ts`). O gatilho reusa a frase do "Veneno de Orc" que já
     existia no bestiário, em vez de inventar um.
   - **CVR-037 — Derruba.** A **Tabela 7. Formas de Ataque** da 2ª edição dá, para
     "Esmagar (cascos, patas)": Dano = **Nível de Atributo**, Ferimento **14**, Dano
     Especial **Sobrepujar**. O Pisotear das Crias de Shelob tem Dano = **Atributo** e
     Trauma **14** — os mesmos dois números. A equivalência não foi estimada.

4. **AUDITORIA — padrão 18 (mesma guarda escrita duas vezes) + regex mais estrita que a
   regra, a décima primeira vez.** Ao marcar Tauler como criatura grande, o teste de
   engajamento acusou "os 5 blocos de Troll estão marcados como grandes — achou 6". Mas a
   asserção seguinte, **"só Trolls estão marcados como grandes", PASSOU** — e não devia.
   O regex dela era `id: "..."` + **exatamente uma linha** + `large: true`. O bloco de
   Tauler tem **duas linhas de comentário** entre os dois, então a janela fixa de linhas
   simplesmente não viu o marcador: a asserção afirmou "só Trolls" **com um não-Troll
   marcado**. É a mesma família da janela fixa de caracteres, agora em linhas.

   Reescrita: o recorte agora é **por bloco** (split no `id:`), não por deslocamento de
   linhas. E a regra que ela guarda mudou junto — o livro diz "criaturas grandes (**como
   Trolls**)", onde Trolls são **exemplo**, não a lista inteira. A checagem passou a ser
   "todo bloco grande que não é Troll cita a fonte que o qualifica" (o rótulo **Grande
   Tamanho** do bloco de 1ª edição), mais uma lista fechada de ids esperados.

5. **Padrão 21 outra vez: um palpite meu virou asserção e caiu na hora.** Escrevi a lista
   de ids de Troll de cabeça (`hill-troll`, `cave-troll`, `stone-troll`,
   `troll-chieftain`) — **nenhum dos quatro existe**. Os reais são
   `grande-troll-das-cavernas`, `cave-troll-furtivo`, `ladrao-troll-de-pedra`,
   `chefe-troll-de-pedra`. A asserção imprimiu os dois lados e o erro morreu no mesmo
   minuto.

6. **Os três lados da lacuna foram virados juntos.** Fechar uma lacuna não é só adicionar
   o bloco: as seções "Lacunas registradas" das aventuras 1 e 2 ainda mandavam o Mestre
   buscar estatística fora do corpus. Agora apontam para `aranha-cacadora`, e uma asserção
   nova impede que o texto volte a **afirmar a ausência** sem dizer que aquilo era o
   estado anterior. As **outras quatro** lacunas de CVR-030 (Vigor, NA fixo, Tolerância,
   Prestígio) ganharam asserção própria para não serem arrastadas junto.

**Validação:** as asserções negativas de Aranha **falharam de propósito** quando o bloco
entrou (era o projeto delas) e foram viradas para o outro lado. As novas foram quebradas
de propósito e confirmadas disparando — `endurance` errado, `might` fora do padrão, e
"Envenena" virando Dano Especial — depois revertidas com Edit, nunca `git checkout`. A
guarda contra afirmação obsoleta também foi testada quebrando o texto da aventura 2.
`npx tsc --noEmit` limpo · `npm run build` compila · `npm run test` verde com **2831
asserções** (`verify-um-anel-conversao: 127 ok`,
`verify-um-anel-aventuras-wilderland: 471 ok`) · `gen-um-anel: 7 packs, 148 entradas`.

**Arquivos tocados:**
- `lib/character/um-anel/adversaries.ts` — blocos `aranha-cacadora` e `tauler-o-cacador`
- `livros/um-anel/compendio/conversao-primeira-edicao.md` — CVR-030 reescrita, CVR-035/036/037
- `scripts/verify-um-anel-conversao.mjs` — +26 asserções, campo a campo nos dois blocos
- `scripts/verify-um-anel-posturas-mesa.mjs` — recorte por bloco no lugar da janela de linhas
- `scripts/verify-um-anel-aventuras-wilderland.mjs` — lacuna virada para o lado positivo
- `livros/um-anel/15-…`, `16-…` — as seções de lacuna agora apontam para o bloco
- `data/compendiums/um-anel/` — regerado (148 entradas)

**Commits / deploy:** ver commit desta rodada na branch `fix/login-google-e-responsivo-um-anel`.

**Como testar:** `node scripts/verify-um-anel-conversao.mjs` · **Aranha Caçadora** e
**Selvagem Tauler** aparecem na lista de adversários do Mestre numa mesa do Um Anel.

---

### 2026-08-08 — Abrindo *The Darkening of Mirkwood*: o PLANO, o pack de Propriedades e cinco vazamentos de moeda

**Pedido:** continuar o loop — abrir a campanha de 30 anos, **decidir e escrever o plano
de conversão antes de converter em massa**, e registrar o porquê aqui.

**Passo a passo:**

1. **Leitura de reconhecimento (páginas 1–12).** *The Darkening of Mirkwood* NÃO é
   sete aventuras soltas como *Tales from Wilderland*: é **uma campanha de 30 anos,
   2947–2977, organizada ANO A ANO**. Cada ano tem a mesma forma —
   `Ano` → `Eventos` → `Fase de aventura` → `Fase em sociedade`. Os 30 anos vêm
   agrupados pelo próprio livro em **cinco blocos**:

   | Bloco | Anos | Página | Título |
   |---|---|---|---|
   | 1 | 2947–2950 | 8 | Os Últimos Bons Anos |
   | 2 | 2951–2960 | 21 | O Retorno da Sombra |
   | 3 | 2961–2966 | 63 | Congregação da Escuridão |
   | 4 | 2967–2974 | 84 | Os Anos da Praga |
   | 5 | 2975–2977 | 116 | O Escurecimento da Floresta das Trevas |

   Mais **Apêndices** na página 125 (Nazgûl de Dol Guldur; Personagens e Criaturas).

2. **DECISÃO — cinco arquivos, um por bloco do livro. Não um por ano.**

   Considerei três formas e descartei duas:

   - **Um arquivo por ano (30 arquivos)** — descartado. Um ano do livro costuma ser
     meia página; 30 arquivos de meia página quebram a leitura corrida da campanha,
     e a maioria dos ganchos atravessa vários anos (a Sombra sobe *entre* anos). O
     índice ficaria maior que o conteúdo.
   - **Um índice mestre + um arquivo por episódio** — descartado. Não existe
     "episódio" no livro: existe **ano**. Recortar por episódio seria inventar uma
     estrutura que a fonte não tem, e a régua CVR não ajuda a decidir onde cortar.
   - **✔ Um arquivo por bloco (cinco arquivos)** — **escolhido**, porque é o
     agrupamento **que o próprio livro já fez**, com título e página de abertura
     próprios. Cada bloco vira `22-mirkwood-01-…` … `26-mirkwood-05-…`, continuando
     a numeração de Wilderland (que terminou em `21-`). Tamanho estimado por
     arquivo: 13–40 páginas de fonte, a mesma ordem de grandeza de uma aventura de
     Wilderland — que já provou caber numa rodada.

   **Os Apêndices NÃO viram um sexto arquivo de campanha**: as criaturas vão para o
   bestiário (`lib/rpg/um-anel/adversaries.ts`), que é onde o resto do sistema
   procura por bloco de adversário. Ler o apêndice **primeiro**, antes do bloco 1 —
   ele pode fechar as lacunas de **Aranha** e **Troll da Colina**, e nesse dia as
   asserções negativas de CVR-030 vão falhar **de propósito**.

   **Teste:** um segundo `scripts/verify-um-anel-campanha-mirkwood.mjs`, no mesmo
   formato de lista (`cvrObrigatorias`, `adversarios`, `blocosEsperados`, `extra`)
   do de Wilderland — não estender o de Wilderland, porque lá as checagens são de
   aventura solta (uma trama, um clímax) e aqui são de linha do tempo.

3. **Regra de campanha convertida na mesma rodada: Propriedades** (páginas 5–6, antes
   do ano 2947). Novo pack `livros/um-anel/compendio/propriedades.md`, 14 entradas
   `PRO-001`…`PRO-014`. O que a conversão precisou resolver:

   - **A escala do Valor é INVERTIDA** — 4 é *Rico*, 9 é *Modesto*; quanto menor o
     número, melhor a propriedade. Está escrito em voz alta no arquivo porque é o
     tipo de coisa que uma mesa lê ao contrário.
   - **Esta tabela lê o Dado de Proeza no sentido NORMAL** (Runa = melhor, Olho =
     pior) — o **oposto** da tabela de Fontes de Dano (CVR-028), onde a Runa é
     *Ileso* e o Olho **reduz a zero**. Duas tabelas do mesmo corpus lidas em
     direções contrárias; o aviso está nos dois lados.
   - **Metade da regra não converte, e ficou registrado que não converte.** A
     Pontuação Mínima da 1ª edição limita por **Prestígio** dentro da terra natal e
     por **VALOR** fora dela. Prestígio não existe no corpus traduzido da 2ª edição
     (CVR-030) — então sobra o VALOR nos dois casos. **Nada foi inventado para
     substituir o Prestígio.**
   - "Novo Afazer: Tratar das Terras" → **Empreitada** da Fase de Companhia; "rolar
     duas vezes e escolher o melhor" → **rolagem Favorecida**, dita com esse nome
     para a mesa saber que a mecânica já existe.

4. **Duas entradas novas na régua CVR**, com fonte em `03-aventureiros.md:1083`
   ("existem dois tipos de pontos de Experiência: pontos de Perícia… e pontos de
   Aventura…"):

   - **CVR-033** — "Ponto de Avanço" → **ponto de Perícia**.
   - **CVR-034** — "Ponto de Experiência" → **ponto de Aventura**, marcado como
     *armadilha de nome*: o termo da 1ª edição ainda existe na 2ª, mas como
     **guarda-chuva** das duas moedas, não como moeda. Traduzir literal troca a
     recompensa errada.

5. **AUDITORIA — padrão 21 (afirmação minha virando asserção): cinco vazamentos de
   moeda de 1ª edição nas aventuras já convertidas.** "ponto de avanço" e "ponto de
   Experiência" tinham passado nas aventuras 3, 4 e 6. Corrigidos por script que
   **conta** as substituições (`4 substituições, todas conferidas.`) — e então a
   varredura nova, que percorre o **diretório** `livros/um-anel/` procurando
   `/^\d\d-wilderland-/` em vez de consultar uma lista fixa, achou um **quinto** em
   `livros/um-anel/18-wilderland-04-aqueles-que-nao-permanecem-mais.md:206` que o
   meu grep manual tinha deixado passar. É a segunda vez que varrer diretório acha o
   que lista fixa não acha.

6. **Uma regex mais estrita que a regra (a décima).** A asserção da escala invertida
   procurava `/\*\*quanto MENOR o número, melhor a[\s>]*propriedade\*\*/`, mas o
   negrito do markdown começa **antes** de "quanto" — o regex esperava o `**` no
   lugar errado. Corrigido no regex, não no texto.

**Validação:** as duas asserções novas de Propriedades foram **quebradas de
propósito** e confirmadas disparando (`Valor 4 é Rico` e `Tratar das Terras vira
rolagem Favorecida`), depois revertidas com Edit — nunca `git checkout`. A varredura
de moeda de experiência não precisou ser quebrada: **disparou de verdade** nesta
rodada. `npx tsc --noEmit` limpo · `npm run build` compila · `npm run test` verde com
**2797 asserções** (`verify-um-anel-conversao: 101 ok`,
`verify-um-anel-aventuras-wilderland: 463 ok`) · `gen-um-anel: 7 packs, 145 entradas`.

**Arquivos tocados:**
- `livros/um-anel/compendio/propriedades.md` — **novo**: 14 entradas PRO-001…PRO-014
- `livros/um-anel/compendio/conversao-primeira-edicao.md` — CVR-033 e CVR-034
- `scripts/gen-um-anel.mjs` — pack `propriedades` registrado (7 packs)
- `scripts/verify-um-anel-conversao.mjs` — +15 asserções: varredura de moeda por
  diretório e as checagens do pack de Propriedades
- `livros/um-anel/17-…`, `18-…`, `20-…` — cinco termos de moeda de 1ª edição corrigidos
- `data/compendiums/um-anel/propriedades.json`, `index.json`,
  `conversao-primeira-edicao.json` — regerados

**Commits / deploy:** ver commit desta rodada na branch `fix/login-google-e-responsivo-um-anel`.

**Como testar:** `node scripts/verify-um-anel-conversao.mjs` · o pack aparece em
`/compendio` do Um Anel como **Propriedades**.

---

### 2026-08-08 — "A Torre de Urzal Seco": Wilderland fechada, sete de sete

**Pedido:** continuar o loop — converter as campanhas de 1ª edição.

**Passo a passo:**

1. **Aventura 7 convertida, e com ela *Tales from Wilderland* está inteira** — seis
   partes e epílogo, das páginas 132–151, em
   `livros/um-anel/21-wilderland-07-a-torre-de-urzal-seco.md`. **Sete aventuras,
   sete arquivos, 459 asserções só sobre a campanha.**

2. **Um Conselho em que a audiência é um adversário.** A negociação com **Raenar,
   o Grande Dragão de Gelo**, é o encontro social mais estranho da campanha: a
   Companhia tenta convencer um dragão vivo a não matá-los e, se possível, a
   ajudá-los. Converte para Conselho sem forçar nada — atitude **Relutante**, e
   escolher um anão ou elfo como porta-voz faz Raenar **tentar matar o porta-voz na
   hora** (CVR-020).

3. **A Armadura com dois valores.** O bloco de Raenar traz `6d/1d*` — 6 dados
   normalmente, **1 no ponto fraco**. A 2ª edição escreve Armadura como número de
   dados, e os dois cabem: quem decide qual usar é a habilidade **Ponto Fraco**. Há
   asserção exigindo que a linha guarde os **dois** valores — reduzi-la a um número
   só apagaria a regra que torna o dragão derrotável.

4. **"Agarrar Vítima" não é habilidade na 2ª edição.** O Troll da Neve tem a
   habilidade no bloco de 1ª edição, mas na 2ª isso é a opção de **Dano Especial
   Agarrar**, gasta com um ícone de Sucesso (CVR-010). Três das quatro habilidades
   dele já existiam no bestiário com nome próprio: **Força Horrenda**, **Infundir
   Medo**, e **Criatura grande**.

5. **Quatro aventuras dependem agora das mesmas duas descrições ausentes.**
   "Investida Selvagem" e "Encarnação do Horror" aparecem nas aventuras 3, 5, 6 e 7
   — sempre apenas **nomeadas**, nunca descritas. É a lacuna mais repetida da
   conversão.

6. **Uma observação que só aparece no fim.** Esta é a **única das sete aventuras**
   em que a lacuna de **Prestígio** não precisou ser contornada — nas outras seis,
   ela aparece de uma a cinco vezes cada.

7. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2759 asserções**. Uma asserção foi quebrada de
   propósito — a Armadura de dois valores virando um número só — e falhou como devia.

**Arquivos tocados:**
- `livros/um-anel/21-wilderland-07-a-torre-de-urzal-seco.md` — **novo**
- `scripts/verify-um-anel-aventuras-wilderland.mjs` — a aventura 7 na lista

**Como testar:** ler o arquivo. A Parte VI traz a torre inteira, o Uivo da Montanha
(uma armadilha que a própria Companhia pode armar) e as duas formas de derrotar um
espírito que não pode ser atacado.

**Falta:** *The Darkening of Mirkwood* — campanha de 30 anos, estrutura ano a ano,
que pede planejamento antes da conversão. Dez Vigores, bloco de Aranha e de Troll da
Colina (lacunas de fonte); glyph da runa de Gandalf.

---

### 2026-08-08 — "A Travessia do Celduin": torneios, veneno e o Rei Enforcado

**Pedido:** continuar o loop — converter as campanhas de 1ª edição.

**Passo a passo:**

1. **Aventura 6 de *Tales from Wilderland* convertida por inteiro** — oito partes,
   das páginas 103–130, em
   `livros/um-anel/20-wilderland-06-a-travessia-do-celduin.md`. É a maior da
   campanha, e a que fecha o arco do Rei Enforcado.

2. **Duas moedas diferentes no mesmo bloco.** Os PNJs heroicos de 1ª edição —
   Gerold, Elstan, os Seguidores — têm **Esperança** no bloco, como heróis. A 2ª
   edição não dá Esperança a adversário: dá **Ódio ou Resolução**, e Homens
   não-monstruosos ficam com **Resolução** (CVR-004). O valor passa direto; o nome
   muda. O Rei Enforcado, que já tinha Ódio, fica com Ódio.

3. **A "Força Tremenda" de Gerold já era o Golpe Pesado — e o número prova.** O
   original diz "reduza um ponto de Esperança para aumentar seu dano em **7**
   pontos", e o Nível de Atributo dele é **7**. O Golpe Pesado da 2ª edição
   "inflige uma perda adicional de Resistência igual ao Nível de Atributo do
   atacante" e **todo adversário já pode acioná-lo**. Não virou habilidade nova:
   virou nota, com asserção exigindo que a coincidência dos números continue
   escrita.

4. **As vitórias de torneio viraram atitude.** O original dá "+1 de tolerância por
   competição vencida" em Valle e Cidade do Lago até o ano seguinte. Como a
   Tolerância virou Conselho, isso vira **um degrau de atitude da audiência por
   competição vencida**, com teto em Amigável (CVR-020).

5. **Três lacunas de Vigor de uma vez, e uma delas é conceitual.** Gerold, Elstan e
   o Rei Enforcado não têm o campo. Para o espírito, o texto diz explicitamente que
   **destruir o corpo não o destrói, apenas o bane** — que é o oposto de um número
   de Ferimentos para abater. Asserção conta os três `| Vigor |` e exige que
   **nenhum** vire número.

6. **A lacuna do Troll da Colina reapareceu, e é a mesma da aventura 4.** O
   segundo assalto pede um Troll das Colinas de Mordor, e o bestiário traduzido tem
   Trolls das Cavernas e de Pedra, não da Colina. Duas aventuras agora dependem do
   mesmo bloco ausente — se ele aparecer, as duas seções mudam juntas.

7. **"Desnortear" e "Encarnação do Horror"** juntam-se a "Sem Trégua" e "Investida
   Selvagem" na lista de habilidades que o original apenas **nomeia**, sem efeito
   descrito. Por CVR-012, viram lacuna — e há asserção negativa garantindo que
   ninguém as inventou no bestiário.

8. **A Empreitada de Resistência 9 apareceu pela primeira vez.** Empurrar a
   carruagem do Rei Enforcado para o rio pedia "8 jogadas" no original; a 2ª edição
   só oferece 3, 6 e 9, e **9 é o degrau imediatamente acima**. Nas cinco aventuras
   anteriores só tinham aparecido 3 e 6 — e numa delas o 6 bateu exato.

9. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2674 asserções**. Uma asserção foi quebrada de
   propósito — o Vigor do Rei Enforcado virando número — e falhou como devia.

**Arquivos tocados:**
- `livros/um-anel/20-wilderland-06-a-travessia-do-celduin.md` — **novo**
- `scripts/verify-um-anel-aventuras-wilderland.mjs` — a aventura 6 na lista

**Como testar:** ler o arquivo. A Parte II (os torneios) é a mais mecânica da
campanha inteira, e a Parte VIII fecha o arco do Rei Enforcado com fogo ou água,
como o corvo avisa.

**Falta:** aventura 7 de Wilderland; *The Darkening of Mirkwood*; oito Vigores,
bloco de Aranha e de Troll da Colina (lacunas de fonte); glyph da runa de Gandalf.

---

### 2026-08-08 — "A Escuridão nos Pântanos": as bênçãos do mago e a Caçada

**Pedido:** continuar o loop — converter as campanhas de 1ª edição.

**Passo a passo:**

1. **Aventura 5 de *Tales from Wilderland* convertida por inteiro** — oito partes e
   epílogo, das páginas 79–102, em
   `livros/um-anel/19-wilderland-05-a-escuridao-nos-pantanos.md`. É a mais longa da
   conversão até agora.

2. **As bênçãos de Radagast precisaram da mesma tradução mecânica da aventura 3.**
   O original dá "um bônus de Atributo livre" em cada uma. A 2ª edição não tem bônus
   de Atributo gasto em rolagens — o que existe é o bônus de **Esperança**. A
   conversão fiel é **dar o dado sem cobrar o ponto**: *ganha (1d)* de graça na
   perícia que a bênção protege.

3. **O veneno da cobra fechou outro ciclo.** O original só diz "o personagem é
   envenenado, ver as regras de veneno" e improvisa um limite de tentativas de Cura.
   A 2ª edição tem a regra inteira, e ela entrou no motor há cinco rodadas: não pode
   descansar, rola perda de Resistência ao fim de cada dia, uma Runa cura, e a
   rolagem de Cura cura perdendo (1d) ou (2d) conforme o nível.

4. **A Caçada da Parte VII é um subsistema próprio da aventura, e sobreviveu
   inteiro.** A Vantagem começa igual ao maior Viagem da Companhia, cai a cada teste
   de jornada falhado, e sobe com Caçada e Exploração. Só os NAs viraram degraus de
   Complicação (CVR-016, CVR-017) — a estrutura é da aventura e não conflita com
   nada da 2ª edição.

5. **Três das quatro Habilidades Sinistras de Ghor já existiam com nome da 2ª
   edição.** "Voz Imperiosa" é **Grito de Triunfo**, "Resiliência Terrível" é
   **Rijeza Hedionda**, "Força Aterradora" é **Força Horrenda** — todas no bestiário.
   A quarta, "Investida Selvagem", é a **mesma lacuna já registrada com Oderic** na
   aventura 3: o original só a nomeia, sem descrever efeito.

6. **A Armadura de Ghor sai da mesma derivação de Valter.** Cota de Malha (3d) +
   Elmo (+1d) = **4**, lido na tabela da 2ª edição. A asserção confere **tabela e
   texto ao mesmo tempo** — se o Elmo mudar de valor, as contas escritas nas duas
   aventuras falham juntas.

7. **"Considerados Exaustos" outra vez, e outra vez não era Exausto.** No templo, o
   original diz que os companheiros ficam "assustados e são considerados Exaustos".
   Na 2ª edição Exausto é derivado de Carga+Fadiga e **não se atribui**; o efeito
   descrito — medo que tolhe — é o de **Arrasado**, que vem de Sombra. Virou Teste de
   Sombra (Pavor/VALOR).

8. **A guarda de "Tolerância" pegou o mesmo tropeço da aventura 3.** O parágrafo da
   lacuna de Prestígio citava "na Tolerância de Radagast, na de Hartfast" sem dizer
   no que a Tolerância virou. Reescrito — e vale notar que a guarda pegou o mesmo
   erro em duas aventuras seguidas, o que é exatamente o que ela existe para fazer.

9. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2589 asserções**. Uma asserção foi quebrada de
   propósito — o Vigor de Ghor virando número — e falhou como devia.

**Arquivos tocados:**
- `livros/um-anel/19-wilderland-05-a-escuridao-nos-pantanos.md` — **novo**
- `scripts/verify-um-anel-aventuras-wilderland.mjs` — a aventura 5 na lista

**Como testar:** ler o arquivo. A Parte VI (o assalto furtivo ao Chifre da
Feitiçaria) é a mais mecânica, e a Caçada da Parte VII roda sozinha com a régua de
Vantagem.

**Falta:** aventuras 6 e 7 de Wilderland; *The Darkening of Mirkwood*; cinco
Vigores, bloco de Aranha e de Troll da Colina (lacunas de fonte); glyph da runa de
Gandalf.

---

### 2026-08-08 — "Aqueles Que Não Permanecem Mais": o Conselho que é por herói, e o sonho

**Pedido:** continuar o loop — converter as campanhas de 1ª edição.

**Passo a passo:**

1. **Aventura 4 de *Tales from Wilderland* convertida por inteiro** — sete partes,
   das páginas 59–77, em
   `livros/um-anel/18-wilderland-04-aqueles-que-nao-permanecem-mais.md`.

2. **O Conselho que é avaliado POR HERÓI.** O encontro com a Senhora Irimë é o
   único da conversão em que o placar não é da Companhia: o original manda o
   Mestre registrar quantos sucessos **cada companheiro** alcança, porque o
   resultado decide a relação de cada um com ela, não se a missão é aceita. A 2ª
   edição comporta isso sem alteração — o Conselho já soma sucessos por rolagem, e
   aqui eles ficam separados por quem rolou.

3. **O "teste de Medo" não tinha equivalente, e o que faltava era ler o efeito.**
   A 2ª edição não tem teste de medo. Mas o efeito que o original descreve —
   falhar impede invocar bônus pelo resto da luta — é **exatamente** o que
   **Arrasado** produz na 2ª edição, e Arrasado vem de **Sombra**. Então o teste
   virou **Teste de Sombra (Pavor, resistido com VALOR)**, e a conversão está
   escrita no arquivo com asserção conferindo que continua lá.

4. **A regra de fronteira do sonho.** A Parte VI inteira se passa num sonho, e o
   original define o que atravessa o despertar: Esperança gasta e Sombra ganha
   **ficam**; Resistência, Fadiga e Feridas **somem**. Virou tabela no arquivo, com
   asserção nos dois lados — se alguém trocar um "Sim" por "Não", o teste pega.

5. **As duas Habilidades Sinistras do original já existiam com nome da 2ª
   edição.** *Strike Fear* e *Vitalidade Sobrenatural* dos guerreiros mortos-vivos
   são **Infundir Medo** e **Imorredouro**, ambas no bloco do **Tumulário**. A
   conversão as reaproveita (CVR-012), com asserção lendo o bloco do bestiário —
   se o Tumulário perder qualquer uma, a aventura fica sem base.

6. **"Torná-lo Exausto" precisou de tradução mecânica.** O original diz que quem
   morre no sonho desperta "com perda de Resistência suficiente para torná-lo
   Exausto". Na 2ª edição Exausto é **derivado** e não pode ser atribuído: a forma
   fiel é reduzir a Resistência **até a Carga total do herói**, o que produz a
   condição pelas regras normais.

7. **Duas lacunas próprias, além das já conhecidas.** O **Troll da Colina** da
   arena não tem bloco no bestiário traduzido (que tem Trolls das Cavernas e de
   Pedra) e o original só o nomeia. E o **"Foco de Companhia" como fonte de
   esperança**, que o resultado 0–3 do Conselho com Irimë bloqueia, não é descrito
   no corpus da 2ª edição — o efeito ficou escrito como o original diz, sem ser
   mecanizado.

8. **Três asserções falharam, e uma delas era boa demais.** O rótulo estava no
   plural ("Arqueiros Goblins") e o teste procura o rótulo exato do bestiário —
   erro meu no texto, corrigido. O regex do "teste de medo" esperava o negrito em
   volta de menos palavras do que eu escrevi. **E a guarda de "comitiva" pegou dois
   usos legítimos da palavra em português comum** — o séquito do vereador e um
   grupo de viajantes. Como a guarda não distingue o termo de regra do
   substantivo, reescrevi as duas frases: manter a guarda cega e forte vale mais
   que ganhar duas palavras.

9. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2507 asserções**. Uma asserção foi quebrada de
   propósito — a tabela de fronteira do sonho — e falhou como devia.

**Arquivos tocados:**
- `livros/um-anel/18-wilderland-04-aqueles-que-nao-permanecem-mais.md` — **novo**
- `scripts/verify-um-anel-aventuras-wilderland.mjs` — a aventura 4 na lista

**Como testar:** ler o arquivo. A Parte VI é a mais longa e a mais mecânica da
conversão até agora — a escada de Sombra é o que sustenta a cena inteira.

**Falta:** aventuras 5 a 7 de Wilderland; *The Darkening of Mirkwood*; quatro
Vigores, bloco de Aranha e bloco de Troll da Colina (lacunas de fonte); glyph da
runa de Gandalf.

---

### 2026-08-08 — "Assassinato e Mau Agouro": nove partes, e Resolução vira o assunto

**Pedido:** continuar o loop — converter as campanhas de 1ª edição.

**Passo a passo:**

1. **Aventura 3 de *Tales from Wilderland* convertida por inteiro** — **nove
   partes**, das páginas 36–58 do PDF, em
   `livros/um-anel/17-wilderland-03-assassinato-e-mau-agouro.md`. É a maior das
   três até agora.

2. **Aqui a distinção Ódio × Resolução deixa de ser detalhe de bloco e vira o
   tema.** A aventura termina com Beorn julgando se um homem merece morrer, e
   **todo inimigo humano dela tem Resolução** — bandidos, Faron, Valter e o
   próprio Oderic. O livro manda avaliar como **Malfeitoria** atacar ou matar
   quem tem Resolução, então uma Companhia que mate Oderic a caminho da Carrocha
   fez exatamente aquilo que o julgamento existia para evitar. Os únicos inimigos
   de Ódio são os Orcs que já estão mortos quando a aventura começa.

3. **Seis Tolerâncias viraram seis Conselhos**, e o julgamento final é o mais
   interessante: os argumentos a favor de Oderic somam sucessos, e **companheiros
   que falam contra ele subtraem**. É o único Conselho da conversão em que a
   Companhia pode jogar contra si mesma — e o veredito sai direto do placar.

4. **Dois números derivados, e a asserção lê os dois lados.** O bloco de Valter
   diz "Parry 5 + 3 (Great Shield)" e "Armour 3d+4 (Mail shirt and Helm)". Na 2ª
   edição o Bloqueio do adversário é **um número só**, então virou **8** (5 + os
   3 do Grande Escudo, valor da tabela de escudos), e a Armadura virou **4**
   (Cota de Malha 3d + Elmo +1d, lidos na tabela de armaduras). Nenhum dos dois
   foi estimado — os dois saem de tabelas da 2ª edição, e há asserção conferindo
   **a tabela e o texto ao mesmo tempo**: se o Grande Escudo mudar de valor, a
   conta escrita na aventura falha.

5. **Duas lacunas de Vigor, e uma família de habilidades sem equivalente.**
   Nem Valter nem Oderic têm Vigor no bloco original, e o texto não resolve —
   para Oderic ele dá **três** condições de derrota, mas nenhuma diz quantos
   Ferimentos o abatem. Os dois campos ficam declarados como lacuna, com asserção
   contando os `| Vigor |` e exigindo que **nenhum** vire número. E "Sem Trégua"
   e "Investida Selvagem" são apenas **nomeadas** no original, sem efeito
   descrito: por CVR-012 viram lacuna, não habilidade nova — com asserção negativa
   garantindo que ninguém as inventou no bestiário.

6. **"Arquearia Mortal" já existia com outro nome.** A habilidade dos Arqueiros
   Foragidos — gastar Ódio para somar o Nível de Atributo ao dano — é exatamente
   o Dano Especial **Golpe Pesado** da 2ª edição, que **todo** adversário já pode
   acionar. Não virou habilidade: virou nota.

7. **Quatro asserções minhas falharam, e três eram cedo demais generalizadas.**
   O teste genérico exigia de **toda** aventura um Teste de Sombra e a declaração
   da lacuna da Aranha — e a aventura 3 não tem nem corrupção nem aranhas. As duas
   viraram condicionais (`CVR-024` em `cvrObrigatorias`, e uma marca `aranhas`).
   A quarta foi a **mesma lição da rodada passada, repetida**: a busca por NA fixo
   delimitava a frase por quebra de linha, e "(CVR-017; o\noriginal subia o NA de
   12 para 16)" ficava sem a palavra que a inocenta. Delimitar por **ponto**
   resolveu — de novo.

8. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2436 asserções**. Três asserções foram quebradas de
   propósito — Vigor virando número, Bloqueio derivado errado, e o NA fixo — e
   falharam como deviam.

**Arquivos tocados:**
- `livros/um-anel/17-wilderland-03-assassinato-e-mau-agouro.md` — **novo**
- `scripts/verify-um-anel-aventuras-wilderland.mjs` — a aventura 3 na lista, e as
  três checagens que viraram condicionais

**Como testar:** ler o arquivo. Os blocos de Valter e Oderic estão prontos para a
mesa exceto pelo Vigor, marcado como lacuna de propósito.

**Falta:** aventuras 4 a 7 de Wilderland; *The Darkening of Mirkwood*; Vigor de
três blocos e bloco de Aranha (lacunas de fonte); glyph da runa de Gandalf.

---

### 2026-08-08 — "Sobre Ervas e Hobbits Cozidos", e o teste que virou genérico

**Pedido:** continuar o loop — converter as campanhas de 1ª edição.

**Passo a passo:**

1. **Aventura 2 de *Tales from Wilderland* convertida por inteiro** — cinco partes
   e o epílogo, das páginas 17–35 do PDF, em
   `livros/um-anel/16-wilderland-02-sobre-ervas-e-hobbits-cozidos.md`.

2. **Aqui os inimigos são de ÓDIO — o oposto da aventura 1.** Orcs e Goblins são
   lacaios do Inimigo, e matá-los **não** levanta Malfeitoria (CVR-004). O que
   levanta é matar os caçadores Homens da Floresta da Parte II, e ali o original
   já dizia "delito de pelo menos três pontos de sombra" — que na 2ª edição é
   **Malfeito**, a única fonte que o Teste de Sombra não reduz.

3. **O veneno fechou um ciclo.** A flecha que feriu Iwgar estava envenenada, e a
   regra de **Veneno** entrou no motor há duas rodadas: o envenenado não pode
   descansar, rola perda de Resistência ao fim de cada dia, uma Runa cura, e a
   rolagem de **Cura** cura perdendo (1d) ou (2d) conforme o nível. O original só
   dizia "a não ser que a Companhia disponha de um herói capaz de preparar um
   antídoto". E o **Arqueiro Goblin** do bestiário já tem a Habilidade Sinistra
   **Veneno de Orc**, que é de onde a flecha veio.

4. **A lacuna do Vigor apareceu de novo — e desta vez o texto NÃO resolveu.** Na
   aventura 1, a Coisa do Fosso ganhou Vigor 2 porque o texto dizia "se for Ferida
   duas vezes". O **Fantasma da Noite** não tem nada equivalente: o texto diz que
   a luta acaba quando o **Ódio** chega a zero e ele foge. O campo ficou
   **declarado como lacuna** no bloco, e há asserção exigindo que ele **não** seja
   um número. Quebrei de propósito pondo "Vigor 2" e a asserção pegou.

5. **Uma diferença de regra escrita em voz alta.** O "Medo do Fogo" de 1ª edição
   tirava Ódio **uma vez**, ao fim da primeira rodada; a habilidade de mesmo nome
   no bestiário da 2ª edição tira **1 por rodada**. A régua manda reaproveitar a
   habilidade equivalente (CVR-012), e foi o que se fez — mas isso muda o ritmo da
   luta, então a diferença está avisada no arquivo, com asserção conferindo que o
   aviso continua lá.

6. **O teste virou genérico.** Em vez de um script por aventura — sete cópias que
   divergiriam na primeira melhoria —, `verify-um-anel-aventuras-wilderland.mjs`
   roda as checagens comuns sobre uma lista de aventuras, cada uma com as suas em
   `extra`. O script da aventura 1 foi removido e a entrada do `package.json`
   trocada por substituição contada.

7. **Três erros de asserção, todos do mesmo feitio: a regex era mais estrita que
   a regra.**
   - `blocoAdversario` cortava 800 caracteres fixos, e a segunda Habilidade
     Sinistra do Arqueiro Goblin caía fora — a asserção acusava ausência de algo
     que estava lá. Passou a cortar no início do bloco seguinte.
   - "Fase em Sociedade" e "Called Shot" estavam na lista de proibidos absolutos,
     mas a aventura 2 precisa citá-los para dizer no que viraram. Foram para a
     lista condicional.
   - A frase era delimitada por quebra de linha, e o markdown quebra no meio:
     "O `Called Shot`" ficava separado da explicação da linha seguinte. Passou a
     ser delimitada por **ponto**.

8. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2350 asserções**. A guarda de nomes antigos do
   glossário passou na aventura sem exceção nenhuma.

**Arquivos tocados:**
- `livros/um-anel/16-wilderland-02-sobre-ervas-e-hobbits-cozidos.md` — **novo**
- `scripts/verify-um-anel-aventuras-wilderland.mjs` — **novo**, genérico
- `scripts/verify-um-anel-aventura-wilderland-01.mjs` — **removido**, absorvido

**Como testar:** ler o arquivo da aventura. O bloco do Fantasma da Noite está
pronto para a mesa exceto pelo Vigor, que está marcado como lacuna de propósito.

**Falta:** aventuras 3 a 7 de Wilderland; *The Darkening of Mirkwood*; bloco de
Aranha e Vigor do Fantasma (lacunas de fonte); glyph da runa de Gandalf.

---

### 2026-08-08 — "Não Desvie da Trilha": a primeira aventura convertida

**Pedido:** continuar o loop — converter as campanhas de 1ª edição.

**Passo a passo:**

1. **Aventura 1 de *Tales from Wilderland* convertida por inteiro** — seis partes
   e o epílogo, das páginas 2–16 do PDF, em
   `livros/um-anel/15-wilderland-01-nao-desvie-da-trilha.md`. Cada conversão não
   óbvia cita o id da entrada da tabela (CVR-xxx) que a sustenta.

2. **O que a conversão mudou de verdade:**
   - os **NAs fixos sumiram** — a dificuldade virou Complicação/Vantagem em Dados
     de Sucesso (CVR-016, CVR-017);
   - os **testes de corrupção** viraram **Testes de Sombra** com fonte declarada:
     Pavor na floresta, **Malfeito** ao matar o eremita na própria casa — e
     Malfeito não pode ser reduzido por teste;
   - as duas **Tolerâncias** (Dindar e o Eremita) viraram **Conselhos** de
     Resistência 3, com a atitude da audiência substituindo os ajustes de ±1;
   - os **testes de fadiga por estação** viraram **Eventos de Jornada** em Terras
     Sombrias, com o Dado de Proeza Desfavorecido;
   - as **ações prolongadas** da escalada e da ponte de teia viraram
     **Empreitadas de Perícia** de Resistência 3 (CVR-019);
   - as **perdas fixas de Resistência** (queda de 3/6/9 metros, galho caindo)
     viraram **Fontes de Dano** de nível moderado/severo/gravíssimo (CVR-028).

3. **Os bandidos são Resolução, e isso muda a cena.** O bloco `Thug` de 1ª edição
   tem Nível de Atributo 2, Ódio 2 e a habilidade *Poltrão* — que é exatamente o
   **Salteador** da 2ª edição, com a habilidade **Covarde**. E como Homens Maus
   têm **Resolução**, atacá-los ou matá-los passa a ser avaliado como
   **Malfeitoria** (CVR-004). Eles se rendem: é o caso que o livro manda pesar.

4. **O Vigor da Coisa do Fosso não precisou ser estimado.** CVR-003 registra que
   a 2ª edição não dá regra de conversão de Vigor — mas o **texto da própria
   aventura** diz que a criatura some "se for Ferida **duas vezes**", e Vigor é
   exatamente o número de Ferimentos para abater. **Vigor 2**, derivado da fonte,
   com a justificativa escrita no arquivo e asserção exigindo que ela esteja lá.
   Uma asserção negativa impede que esse caso vire fórmula para os outros.

5. **A lacuna das Aranhas continua lacuna.** As Partes III e IV pedem aranhas e o
   bestiário traduzido não tem o bloco. As cenas foram convertidas
   narrativamente, a lacuna está declarada no fim do arquivo, e há asserção
   contando os blocos de estatísticas: **só pode existir um**, o da Coisa do
   Fosso. Um segundo bloco seria estatística inventada.

6. **Duas entradas novas na régua:** CVR-031 (comitiva → **Companhia**) e CVR-032
   (Fase em Sociedade → **Fase de Companhia**). A primeira é a substituição mais
   frequente do texto de cena depois dos nomes de perícia.

7. **A lição do "Parada" se repetiu, e o teste já sabia.** Banir "comitiva",
   "Tolerância" e "teste de corrupção" do arquivo falharia contra o próprio
   resumo da conversão, que precisa nomeá-los para dizer no que viraram. As
   asserções fixam **contexto**: toda frase que cita o termo antigo tem de dizer
   "virou" ou "original". O mesmo para NA numérico — e ali foi preciso restringir
   a **dois dígitos**, senão "a 2ª edição rola contra o NA do Atributo" era
   acusada por causa do "2ª".

8. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2269 asserções** (65 novas + 14). Três asserções
   foram quebradas de propósito — NA fixo introduzido, bloco de Aranha
   improvisado, justificativa do Vigor removida — e falharam como deviam. A
   guarda de nomes antigos do glossário, que varre `livros/um-anel/*.md`, passou
   na aventura sem exceção nenhuma: nenhum nome de perícia de 1ª edição sobreviveu.

**Arquivos tocados:**
- `livros/um-anel/15-wilderland-01-nao-desvie-da-trilha.md` — **novo**
- `livros/um-anel/compendio/conversao-primeira-edicao.md` — CVR-031 e CVR-032
- `data/compendiums/um-anel/{conversao-primeira-edicao,index}.json` — gerados
- `scripts/verify-um-anel-aventura-wilderland-01.mjs` — **novo**, 65 asserções

**Como testar:** ler o arquivo da aventura de cabo a rabo — cada parte traz a
conversão explicada no lugar onde ela importa, e o bloco da Coisa do Fosso está
pronto para a mesa.

**Falta:** aventuras 2 a 7 de Wilderland; *The Darkening of Mirkwood*; o bloco de
Aranha (lacuna de fonte); glyph da runa de Gandalf.

---

### 2026-08-08 — Tabela de conversão da 1ª edição: a régua antes das aventuras

**Pedido:** continuar o loop — converter *Tales from Wilderland* e *The Darkening
of Mirkwood*.

**Passo a passo:**

1. **A régua vem primeiro.** As duas campanhas são de 1ª edição e vão ser
   convertidas aventura por aventura. Sem uma tabela única, **cada aventura
   inventaria a própria conversão**, e a segunda discordaria da primeira sem que
   ninguém notasse. A tabela virou pack do compêndio
   (`livros/um-anel/compendio/conversao-primeira-edicao.md`, 30 entradas), então
   fica a um clique da ficha para quem estiver mestrando.

2. **O que muda de verdade.** Não é tradução, é conversão de camada de regras:
   - **Fio da lâmina (`Edge`) some** — na 2ª edição o Golpe Perfurante sai em
     "10 ou [Rune]" para toda arma. Manter o Edge criaria um segundo limiar.
   - **Tiro Certeiro vira Dano Especial**, e as listas de herói (cap. 6) e de
     adversário (cap. 8) são **diferentes**.
   - **Ódio vira Ódio ou Resolução**, e a escolha tem consequência: matar quem tem
     Resolução pode ser Malfeitoria.
   - **NA fixo some.** A 2ª edição rola contra o NA do Atributo do herói; a
     dificuldade passa a ser Complicação/Vantagem em Dados de Sucesso.
   - **Tolerância vira Conselho** (Resistência 3/6/9 + atitude da audiência).
   - Seis perícias mudaram de nome: Assombro→Fascínio, Atenção→Vigilância,
     Cantigas→Música, Intuição→Discernimento, Investigação→Busca,
     Conhecimento→História — mais Enigmas→Enigma e Caça→Caçada.

3. **Cinco lacunas registradas, nenhuma preenchida.** A 2ª edição não dá regra de
   conversão para **Vigor** de bloco de 1ª edição, para **NA fixo**, para
   **Tolerância**, e **Prestígio** não existe no corpus traduzido. Pior: o
   **bestiário traduzido não tem bloco de Aranha** — Aranhas aparecem como *tipo
   de inimigo* (Conhecimento do Inimigo, armas de Perdição, "Veneno de Aranha"),
   mas sem estatísticas. Isso bloqueia a Parte IV da primeira aventura de
   Wilderland, que se passa num castelo de aranhas. Fica registrado, não estimado.

4. **A asserção derrubou uma afirmação minha.** Escrevi que "no bestiário, os
   chefes têm Vigor 2" e pus uma asserção conferindo isso contra
   `adversaries.ts`. Ela falhou: **Jack, o Troll de Pedra, é chefe com Vigor 1**.
   A frase estava errada e foi corrigida antes de existir por cinco minutos — o
   Vigor mede Ferimentos para abater, não porte nem importância na cena.

5. **Uma asserção que NÃO disparou, e o que se aprendeu.** Ao testar, troquei
   "Bloqueio" por "Parada" **na prosa** de uma entrada e nada falhou: a asserção
   olhava só o campo `- **2ª edição:**`. Campo certo com prosa errada é pior que
   erro visível. Banir a palavra do arquivo inteiro também não servia — a entrada
   precisa citar "Parada" para dizer que **não** existe. A asserção final fixa as
   duas coisas: aparece uma vez só, e essa vez é o aviso.

6. **A guarda de nomes antigos precisou de recorte cirúrgico.**
   `verify-um-anel-glossario.mjs` proíbe "Caça", "Percepção" etc. em qualquer
   arquivo do compêndio — e a entrada de equivalência precisa escrever exatamente
   esses nomes. Em vez de isentar o arquivo inteiro (que deixaria a tabela
   derivar), o teste recorta **só a entrada CVR-013**, com asserção provando que o
   recorte aconteceu. E o teste novo fecha o outro lado: nome antigo no sentido de
   Perícia fora de CVR-013 falha.

7. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2190 asserções** (79 novas + 11). O JSON do
   compêndio foi regerado por `node scripts/gen-um-anel.mjs`, e há asserção
   conferindo que markdown e JSON têm os mesmos ids na mesma ordem.

**Arquivos tocados:**
- `livros/um-anel/compendio/conversao-primeira-edicao.md` — **novo**, 30 entradas
- `data/compendiums/um-anel/{conversao-primeira-edicao,index}.json` — gerados
- `scripts/gen-um-anel.mjs` — o pack novo
- `scripts/verify-um-anel-conversao.mjs` — **novo**, 79 asserções
- `scripts/verify-um-anel-glossario.mjs` — recorte de CVR-013

**Como testar:** abrir o compêndio do Um Anel na mesa — o pack "Conversão da 1ª
edição" aparece com as 30 entradas, cada uma citando o trecho da 2ª edição que a
sustenta.

**Falta:** converter as aventuras (bloqueada a Parte IV de Wilderland pela lacuna
das Aranhas); glyph da runa de Gandalf.

---

### 2026-08-08 — O ⊘ rolado sobe o Olho sozinho: o gancho estava a uma rota de distância

**Pedido:** continuar o loop.

**Passo a passo:**

1. **A dívida da rodada anterior.** Deixei registrado que "+1 de Atenção do Olho
   por ⊘ fora do combate" dependia de o Mestre clicar, porque as rolagens de
   Jornada e Conselho acontecem no cliente. A saída que eu tinha imaginado era
   mover as duas para o servidor — refatoração grande.

2. **Não era preciso.** Toda rolagem de Dado de Proeza de painel e de ficha já
   passa por **uma rota só**: `POST /chat`, com `torFeatDie`. São exatamente três
   chamadores — Jornada, Conselho e a ficha do herói —, todos rolagens de jogador
   fora do combate. O ataque **não** passa por ali, e é justamente o caso que o
   livro exclui. O gancho é uma chamada, no lugar que já vê tudo.

3. **A face, não o valor.** O que trafega para o chat é a **face física** do d12
   (11 = Olho, 12 = Runa), não o valor de jogo — o Olho vale **zero** e a Runa
   vale 10, então olhar o valor não distinguiria o Olho de um zero qualquer.
   `TOR_EYE_FEAT_FACE = 11` mora em `eye.ts` e há asserção conferindo que bate com
   `featDiePhysicalFace` em `dice.ts`: duas constantes divergentes fariam o gancho
   nunca disparar, em silêncio.

4. **Roda depois de gravar.** O gancho só age com a rolagem já persistida — não
   pode desfazer o que a mesa já leu. Tem asserção de ordem.

5. **As duas fontes automáticas passaram a compartilhar a mesma função**
   (`applyTorEyeAutoGain`), então a guarda de "fora do combate" e a de "regra
   desligada" valem para as duas sem serem escritas duas vezes — que é
   exatamente o erro que a guarda do NA 18 cometeu.

6. **O julgamento do livro precisou de sinal negativo.** O livro dá ao Mestre o
   direito de subir para 2 numa cena grave **ou anular num lugar seguro**. Com o
   +1 automático já lançado, anular exige poder **tirar** — então o handler passou
   a aceitar ajuste negativo (com piso em zero) e o painel virou "+1 (cena grave)"
   e "−1 (lugar seguro)". Sem isso o julgamento só funcionaria numa direção.

7. **Asserção antiga trancando a forma, não a regra (11ª vez).** A negativa "o
   painel não oferece botão manual de Sombra" casava com
   `filter((s) => s !== "sombra")`, que sumiu quando o ⊘ rolado também virou
   automático. Reescrita para provar a regra direto: o painel não posta
   `source: "sombra"` em lugar nenhum.

8. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2100 asserções**. Quatro asserções foram quebradas
   de propósito e falharam como deviam.

**Arquivos tocados:**
- `lib/combat/um-anel/eye.ts` — `TOR_EYE_FEAT_FACE`
- `lib/room/handlers/tor-eye.ts` — `applyTorEyeAutoGain`, `applyTorEyeRolledEye`,
  `appendTorEyeFromFeatDie`, e o ajuste negativo
- `app/api/room/[roomId]/chat/route.ts` — o gancho
- `components/vtt/TorEyePanel.tsx` — ajuste nos dois sentidos
- `scripts/verify-um-anel-olho-de-mordor.mjs` — 10 asserções novas

**Como testar:** com o Olho de Mordor ligado e sem combate em curso, rolar
qualquer Perícia pela ficha até sair o Olho — a Atenção sobe sozinha, com uma
segunda linha no chat. Com a fila de iniciativa montada, o mesmo Olho não sobe
nada.

**Falta:** campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Elmo removível: a fotografia do token que envelhecia

**Pedido:** continuar o loop.

**Passo a passo:**

1. **A jogada que faltava.** O livro trata tirar o Elmo como tática: "às vezes,
   durante o combate, um herói pode recorrer a descartá-lo para reduzir a Carga
   carregada e evitar ficar Exausto muito cedo". `removable: true` estava em
   `data.ts` desde o começo, com **um único consumidor**: uma dica de tooltip no
   compêndio.

2. **O achado maior veio junto — e era pior.**
   `token.torCombat.protectionDice` é uma **fotografia** tirada quando o herói
   entra em cena, e o Teste de Proteção lia essa foto. Exausto, ao contrário, é
   derivado e lido da ficha a cada ataque. Resultado: tirar o Elmo pela ficha
   aliviava a Carga **e mantinha o dado de Proteção** — os dois benefícios de
   graça. Trocar de armadura no meio da luta tinha o mesmo efeito.

   Corrigido lendo `computeProtectionDice(defSheet.armour)` para heróis; o
   adversário, que não tem ficha, continua com o valor do token. Tem asserção
   **negativa** impedindo que alguém "otimize" isso de volta para o token, e
   asserção de **ordem** garantindo que a ficha é lida antes de montar os
   parâmetros do motor.

   É a mesma família do bônus de escudo, que já foi valor guardado e já divergiu.

3. **As duas metades custam ações diferentes** (capítulo 6): tirar é **ação
   secundária**, recuperar é **ação principal**. Tratar as duas igual apagaria o
   custo da volta, que é o que equilibra a jogada — sair do Exausto é barato,
   voltar ao Elmo é caro. O botão diz qual ação cada metade custa. O app **não
   policia** a economia de ações: a mesa conta principal e secundária, o app diz
   o preço.

4. **Uma verdade só.** O handler grava em `armour` na **ficha** — Carga, Exausto
   e Proteção saem todos dali. E inverte o estado atual em vez de receber o alvo
   do cliente: receber o alvo deixaria duas telas discordarem sobre o estado. O
   token recebe um **espelho de exibição** (`helm`, `protectionDice`) só para o
   botão saber o que dizer, e o comentário no tipo diz isso em voz alta.

5. **A Carga que decide Exausto é a TOTAL** — equipamento + Fadiga. Tem asserção
   com um caso em que os 2 pontos de Fadiga são a diferença entre estar Exausto e
   não estar; comparar só com o equipamento erraria exatamente esse caso.

6. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2090 asserções** (52 novas). Oito asserções foram
   quebradas de propósito e falharam como deviam.

**Arquivos tocados:**
- `lib/combat/um-anel/gear-in-combat.ts` — **novo**: a troca e o custo em ação
- `lib/room/handlers/tor-helm.ts` — **novo**
- `lib/room/handlers/tor-combat-attack.ts` — Proteção do herói sai da ficha
- `app/api/room/[roomId]/tor-helm/route.ts` — **novo**
- `lib/vtt/types.ts` + `lib/vtt/tor-player-token.ts` — espelho `helm` no token
- `components/vtt/TorHelmControl.tsx` — **novo**
- `components/vtt/TokenStatusBody.tsx` — o controle entra no token do herói
- `hooks/useRoomSync.ts` — `postRoomTorHelm`
- `scripts/verify-um-anel-elmo.mjs` — **novo**, 52 asserções

**Como testar:** com um herói de Cota de Malha + Elmo perto do limite de Carga,
abrir o token e clicar em "Tirar o Elmo" — o chat mostra a Carga nova, a Proteção
nova e, se for o caso, "deixa de estar EXAUSTO". O próximo Golpe Perfurante contra
ele rola com **um dado a menos**, que antes não acontecia.

**Falta:** gancho automático do Olho rolado; campanhas de 1ª edição; glyph da
runa de Gandalf.

---

### 2026-08-08 — Olho de Mordor: Atenção do Olho, limiar da Caçada e Revelação

**Pedido:** continuar o loop.

**Passo a passo:**

1. **O achado.** O capítulo 8 traz o **Olho de Mordor** inteiro — Atenção do
   Olho, limiar da Caçada, episódio de Revelação — e nada disso existia. Uma
   Companhia podia atravessar Terras Sombrias derramando Sombra sem que o Inimigo
   jamais reparasse.

2. **É regra OPCIONAL, e o livro diz isso em voz alta:** "particularmente
   adequadas para serem introduzidas mais tarde no jogo (…) acrescentam uma
   camada de complexidade que não todo grupo achará do seu gosto". Por isso o
   estado nasce **ausente** — e ausente tem de ser distinguível de zero, senão
   toda mesa do Um Anel ganharia um placar que ninguém pediu.

3. **Três armadilhas, uma asserção cada:**
   - a entrada de Cultura é a **mais alta**, não a soma. Anão + Elfo dá 2, não 3
     — e o erro cresce com o tamanho do grupo, que é onde ele passa despercebido;
   - **igualar** o limiar já revela. `>` deixaria a Companhia escondida exatamente
     no ponto em que o livro manda revelá-la;
   - depois do episódio a contagem volta ao valor **inicial**, não a zero — zerar
     apagaria a Atenção que a composição da Companhia sempre dá.

4. **O gancho automático.** "Sempre que um herói-jogador ganha 1 ou mais pontos de
   Sombra fora do combate, aumente o nível de Atenção do Olho em quantidade
   igual." Ficou dentro do handler de Sombra, usando o ganho **efetivo** (o Teste
   de Sombra pode ter reduzido o pedido) e só quando **não há fila de iniciativa
   montada** — que é o sinal de "fora do combate" que a mesa já usa. E o painel do
   Olho **não** tem botão manual de Sombra, com asserção negativa: teria contado
   em dobro.

5. **O app avisa, não decide.** O episódio de Revelação é do Mestre por escrito no
   livro ("deveria ponderar as circunstâncias atuais da Companhia"). O app anuncia
   no instante em que o limiar é alcançado e devolve a contagem ao inicial quando
   o Mestre disser que já interpretou. Asserção negativa garante que não há sorteio.

6. **Uma região só.** O limiar sai da região atravessada, que é a mesma que a
   Jornada escolhe — iniciar uma jornada sincroniza a região do Olho. Sem isso a
   Companhia entraria em Terras Sombrias com o limiar das Fronteiriças.

7. **Auditoria da rodada — e uma afirmação minha que estava errada.**
   `applyTorSessionPatch` descartava o estado inteiro quando não havia
   jornada/conselho/companhia. `normalizeTorSession` já preservava
   `attributeTnBase` sozinho: **duas leituras opostas da mesma condição, em
   arquivos vizinhos**, e a que roda no save era a errada. Ou seja: a mesa que
   ligava só o NA 18 perdia a opção na gravação — exatamente o bug que a entrada
   do Empurrão/NA 18 dizia ter evitado. **Corrigi a afirmação no lugar onde ela
   está**, e a asserção antiga (10ª vez que uma trancava a regra errada) virou
   duas: uma para a leitura e uma para a gravação.

8. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **2038 asserções** (69 novas + 1). Seis asserções
   foram quebradas de propósito e falharam como deviam.

**Lacuna deliberada, registrada:** o **Olho rolado** ("+1 sempre que uma rolagem
de jogador fora do combate produzir o ícone") ainda depende de o Mestre clicar. As
rolagens de Jornada e Conselho acontecem no cliente e só chegam ao servidor como
texto de chat, então não há um ponto único onde enganchar. O painel oferece os
botões com os valores do livro; o gancho automático fica para quando as rolagens
passarem pelo servidor.

**Arquivos tocados:**
- `lib/combat/um-anel/eye.ts` — **novo**: tabelas, limiar, Revelação
- `lib/combat/um-anel/session-state.ts` — estado do Olho + a guarda corrigida
- `lib/room/handlers/tor-eye.ts` — **novo**: aumento, Revelação e o gancho de Sombra
- `lib/room/handlers/tor-shadow.ts` — Sombra fora do combate chama o Olho
- `app/api/room/[roomId]/tor-eye/route.ts` — **novo**
- `app/api/room/[roomId]/tor-session/route.ts` — ligar/desligar a regra opcional
- `components/vtt/TorEyePanel.tsx` — **novo**
- `components/vtt/TorJourneyPanel.tsx` — renderiza o painel e sincroniza a região
- `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`
- `hooks/useRoomSync.ts` — `postRoomTorEye` e `eye` no patch de sessão
- `scripts/verify-um-anel-olho-de-mordor.mjs` — **novo**, 69 asserções
- `scripts/verify-um-anel-session-state.mjs` — asserção da guarda desdobrada em duas
- `docs/HISTORICO.md` — correção da afirmação errada sobre o NA 18

**Como testar:** no painel de Jornada, montar a Companhia e ligar o Olho de
Mordor — a conta inicial aparece parcela a parcela. Atribuir Sombra a um herói
pelo painel do token **fora de combate**: a Atenção sobe sozinha na mesma
mensagem. Ao alcançar o limiar, o chat anuncia a Revelação e o botão de "episódio
interpretado" aparece.

**Falta:** Elmo removível; gancho automático do Olho rolado; campanhas de 1ª
edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Fontes de Dano: o capítulo 8 inteiro que não tinha caminho até a mesa

**Pedido:** continuar o loop.

**Passo a passo:**

1. **O achado.** Fui atrás do **Veneno** e encontrei o sistema em volta dele:
   **Fontes de Dano** — Frio Extremo, Queda, Fogo, Asfixia e Veneno, com níveis
   de perda e cadência de rolagem. **Nada disso estava no motor.** A única forma
   de um herói perder Resistência no app era levar um golpe: afogar, queimar,
   cair e envenenar não existiam.

2. **A armadilha é a INVERSÃO da tabela.** Na Perda de Resistência o Dado de
   Proeza é lido **ao contrário** do resto do jogo:

   | Dado de Proeza | O herói está… | Efeito |
   |---|---|---|
   | Olho | Desacordado | reduzido a **zero** |
   | 1–10 | Machucado | perde o resultado numérico |
   | Runa | Ileso | sai incólume |

   Logo **Favorecida ajuda o herói** aqui — e é por isso que a perda **moderada**
   rola Favorecida e a **gravíssima** rola Desfavorecida. Trocar os dois faria o
   dano leve doer mais que o mortal. Tem asserção com esse texto exato ao lado.

   Duas leituras a mais que a intuição erra: o Olho é *reduzido a zero*, não
   "perde 0" nem "perde 10" — por isso `reducedToZero` é campo separado de
   `loss`; e a **Runa vale 10 no resto do motor** e aqui é Ileso, com asserção
   negativa provando que a perda não sai 10.

3. **Veneno.** "Não pode descansar e deve rolar a perda de Resistência ao fim de
   cada dia — se a rolagem produzir um ᛥ, o herói não sofre dano e não está mais
   envenenado." O nível fica no token (não um booleano) porque é ele que penaliza
   a rolagem de **CURA** que cura: *perde (1d)* no Severo, *(2d)* no Gravíssimo.
   Entra como Dado de Sucesso negativo, **não** como Desfavorecida — Desfavorecida
   se cancela com Favorecida, o dado de Sucesso soma. A rolagem de CURA é de quem
   **trata**, então o painel pede a graduação de quem cuida, não a do doente.

   O bloqueio de descanso entrou em `tor-recovery` **antes** da conta de
   recuperação, com asserção de ordem — barrar depois de calcular seria
   decorativo. Vale para os **dois** descansos: o livro diz "não pode descansar",
   sem distinguir.

4. **A zero de Resistência a fonte muda o desfecho.** Regra geral do capítulo 6:
   zero derruba inconsciente. A tabela acrescenta: Queda e Fogo deixam **Ferido**;
   Frio, Asfixia e Veneno deixam **Morrendo**. Está na tabela de fontes, campo a
   campo, com asserção por fonte.

5. **O Dado de Proeza rola no servidor**, como no ataque — é ele que grava a
   Resistência na ficha, e número vindo do cliente é número que o cliente escolhe.

6. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1968 asserções** (65 novas). Cinco asserções foram
   quebradas de propósito e falharam como deviam — incluindo a inversão
   Favorecida/Desfavorecida, a Runa lida como 10, e a de ordem do bloqueio.

**Arquivos tocados:**
- `lib/combat/um-anel/hazards.ts` — **novo**: níveis, fontes, tabela, veneno
- `lib/room/handlers/tor-hazard.ts` — **novo**: rolagem e escrita na ficha
- `app/api/room/[roomId]/tor-hazard/route.ts` — **novo**
- `lib/room/handlers/tor-recovery.ts` — envenenado não descansa
- `lib/vtt/types.ts` — `poison` no token, opcional (sala salva não migra)
- `components/vtt/TorHazardPanel.tsx` — **novo**
- `components/vtt/TokenStatusBody.tsx` — o painel entra no token do herói
- `hooks/useRoomSync.ts` — `postRoomTorHazard`
- `scripts/verify-um-anel-fontes-de-dano.mjs` — **novo**, 65 asserções

**Como testar:** abrir o painel de um herói, escolher Fogo/Gravíssimo e rolar — o
d12 sai no chat e a Resistência cai na ficha. Escolher Veneno deixa o herói
ENVENENADO, e a partir daí o Descanso Curto e o Prolongado são recusados até uma
rolagem de CURA bem-sucedida (ou uma Runa na rolagem do fim do dia).

**Falta:** Consciência do Olho; Elmo removível; campanhas de 1ª edição; glyph da
runa de Gandalf.

---

### 2026-08-08 — Fadiga: existia quem tira, não existia quem põe

**Pedido:** continuar o loop.

**Passo a passo:**

1. **O achado — regra implementada numa direção só.** O motor tinha **três**
   formas de TIRAR Fadiga (Descanso Prolongado, Vigor da montaria, rolagem de
   VIAGEM no fim da jornada) e **nenhuma de pôr**. `resolveTorJourneyEvent` já
   calculava `fatigueAll` e `fatigueTarget`; `computeTorJourneyLength` já
   calculava `forcedMarchFatigue` — e os três só viravam **texto no chat**. O
   único jeito de a Fadiga subir era alguém digitar o número no contador da
   ficha.

   O efeito era silencioso e grave: **Exausto** é derivado de
   `Resistência ≤ Carga + Fadiga`, então a condição que a Fadiga existe para
   produzir **nunca disparava sozinha**.

2. **Duas Virtudes Culturais viviam só como descrição.** É por isso que o ganho
   é **por herói** e não um número só para a Companhia:

   - **Cram** (Bardos): "Cada vez que você ganha Fadiga por um Evento de Jornada,
     você ganha 1 ponto menos" — **só** Evento de Jornada; marcha forçada não é
     evento, e a asserção prova a diferença;
   - **Resistência do Ranger** (Rangers do Norte): "armadura de Couro ou nenhuma
     armadura, e não carregar escudo" → **nunca ganha Fadiga**. O Elmo não entra:
     o livro nomeia armadura e escudo, e nada mais. Armadura que a tabela não
     conhece conta como **pesada** — errar para o lado de conceder daria de graça
     o que a Virtude cobra um grau de SABEDORIA para ter.

3. **A soma mora ao lado de quem tira.** `applyTorFatigueGain` foi para
   `shadow.ts`, colada em `applyTorProlongedRest` e `applyTorJourneyEndRecovery`
   — as duas direções da mesma regra juntas, que é o que faltava enxergar. Ela
   compara Exausto **antes e depois** para a mesa ler no chat o momento exato da
   virada. `fatigue.ts` ficou sem import de runtime de propósito, para o teste
   poder importar o arquivo e conferir a aritmética com números de verdade.

4. **Quem aplica.** `POST /tor-fatigue` é do **Mestre** — a Fadiga vem do Evento
   que ele resolveu, da marcha que ele contou, ou da cena que ele narrou. A
   Companhia é resolvida **no servidor**, a partir dos tokens da cena, porque o
   ganho depende da ficha de cada herói. O painel de Jornada dispara sozinho nos
   dois casos automáticos do livro (todo Evento; a marcha forçada na chegada,
   antes da recuperação de fim de jornada). A Fadiga **extra do alvo** de um
   Contratempo fica **de fora de propósito**: o alvo é um *papel* preenchido com
   nomes digitados, não um token — o app não sabe qual herói rolou, e chutar
   cobraria do herói errado. Vai pelo painel do token, com asserção **negativa**
   garantindo que o app não age sozinho ali.

5. **Auditoria da mesma rodada — a Fadiga não sai na estrada.** O livro:
   os pontos "não podem ser removidos enquanto a jornada durar", e o Descanso
   Prolongado que tira Fadiga é o feito "em um refúgio abrigado e seguro (isto é,
   não 'na estrada')". O handler tirava 1 de Fadiga em qualquer Descanso
   Prolongado, inclusive no meio da viagem. Corrigido: com a Companhia ainda
   viajando (`journey.remaining > 0`), o descanso devolve **Resistência** mas não
   tira Fadiga. O livro trava só a Fadiga — travar a Resistência junto seria
   inventar, e tem asserção para isso.

6. **Asserção antiga trancando a regra errada (9ª vez).**
   `verify-um-anel-sombra-mesa.mjs` casava com `prolongado ?` exatamente como
   estava; a condição ganhou uma segunda metade e a asserção precisou ser
   corrigida junto, com o porquê escrito ao lado.

7. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1903 asserções** (62 novas). Cinco asserções foram
   quebradas de propósito e voltaram a falhar como deviam — incluindo a negativa
   do alvo e a de "gravar o TOTAL, não o ganho".

**Arquivos tocados:**
- `lib/combat/um-anel/fatigue.ts` — **novo**: fontes, Cram, Resistência do Ranger
- `lib/combat/um-anel/shadow.ts` — `applyTorFatigueGain` ao lado de quem tira
- `lib/room/handlers/tor-fatigue.ts` — **novo**: Companhia ou herói só
- `app/api/room/[roomId]/tor-fatigue/route.ts` — **novo**
- `lib/room/handlers/tor-recovery.ts` — Fadiga não sai na estrada
- `components/vtt/TorJourneyPanel.tsx` — Evento e marcha forçada aplicam sozinhos
- `components/vtt/TorShadowPanel.tsx` — Fadiga de um herói só
- `hooks/useRoomSync.ts` — `postRoomTorFatigue`
- `scripts/verify-um-anel-fadiga.mjs` — **novo**, 62 asserções
- `scripts/verify-um-anel-sombra-mesa.mjs` — asserção do descanso corrigida

**Como testar:** iniciar uma jornada com marcha forçada, resolver um Evento — a
Fadiga de todos na cena sobe na hora, e quem passar da Carga total é anunciado
como EXAUSTO no chat. Um Ranger de couro sem escudo aparece com "não ganha
Fadiga". Um Descanso Prolongado no meio da viagem devolve Resistência e avisa que
a Fadiga só sai num refúgio.

**Falta:** Veneno (cap. 8); Consciência do Olho; Elmo removível; campanhas de 1ª
edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Atitude da audiência: a penalidade que faltava

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Duas buscas, um achado.** Fui atrás do **Empenho de Perícia** e do emissor
   de **penalidade** em Dados de Sucesso, e os dois caminhos terminaram no mesmo
   lugar: o Conselho.

2. **A atitude da audiência não existia.** "Suas rolagens de Perícia são
   modificadas pela atitude das pessoas que encontram" — **Relutante** *perde
   (1d)*, **Aberta** nada, **Amigável** *ganha (1d)*. Não estava no motor, nem no
   estado da sala, nem no painel. Era o único emissor de penalidade que faltava
   fora do combate: `bonusDice` já aceitava negativo e nada o alimentava.

   Vale para **todas** as rolagens do Conselho, inclusive a Introdução — o livro
   não exclui nenhuma, e aplicar só na Interação daria a vantagem pela metade. A
   Interação lê a atitude **guardada na sala**, não o rascunho do formulário:
   usar o rascunho ignoraria a atitude do Conselho em andamento se o Mestre
   mexesse no seletor. Cada uma tem asserção própria.

   Duas Virtudes Culturais dependiam disto existir: "Amigável e Familiar" e
   "Amigo dos Anões", que garantem atitude Amigável.

3. **Falso alarme conferido:** o Conselho parecia ter mais buracos, mas as sete
   funções de `council.ts` têm consumidor real no painel. Só a atitude faltava.

4. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1841 asserções**. A asserção da atitude guardada
   foi conferida trocando por `draftAttitude` — falhou como devia.

**Lacuna de fonte registrada:** o **Empenho de Perícia** aparece uma única vez no
corpus traduzido — em `12-o-mundo-eriador.md`, como "Empenho de Perícia,
Resistência 6" — e **a regra em si não está traduzida em capítulo nenhum**. Sem o
texto, não dá para mecanizar sem inventar. Fica anotado, como a taxa de
Companhia→Esperança da rodada anterior.

**Arquivos tocados:**
- `lib/combat/um-anel/council.ts` — as três atitudes e o modificador
- `lib/combat/um-anel/session-state.ts` — atitude no estado, recortada na leitura
- `components/vtt/TorCouncilPanel.tsx` — seletor e aplicação nas duas rolagens
- `scripts/verify-um-anel-council.mjs` — 14 asserções novas

**Como testar:** abrir um Conselho com audiência Relutante e rolar — a Introdução
sai com um Dado de Sucesso a menos. Amigável, um a mais. Trocar o seletor com o
Conselho já aberto não muda as Interações em andamento, que é o correto.

**Falta:** Fadiga que sobe (marcha forçada e eventos); Elmo removível; campanhas
de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Descanso: a Resistência que ninguém devolvia

**Pedido:** continuar o loop.

**Passo a passo:**

1. **O achado.** O capítulo 4 diz como o herói recupera Resistência — e a regra
   **não tinha chegado ao motor**. `applyTorProlongedRest` só tirava 1 de Fadiga,
   que é a regra da **jornada** (JOR-M02), e nada em lugar nenhum devolvia
   Resistência. Na prática, um herói machucado nunca se curava pelo app.

2. **Ferido inverte o sentido das duas formas — e é aí que o erro mora.**

   - **Descanso Curto:** recupera pontos iguais à FORÇA, mas "heróis Feridos não
     recuperam ponto algum" — Ferido **zera**;
   - **Descanso Prolongado:** recupera **tudo**, "ou um número igual à FORÇA se a
     caixa Ferido estiver assinalada" — Ferido **limita**.

   Tratar as duas do mesmo jeito erra uma delas, e a que erra **a favor** do
   herói é a mais fácil de não notar numa mesa. Cada uma tem asserção própria.

3. **Uma Virtude que faltava entrar na conta.** Duro como Raiz Velha diz "dobre
   seu valor de FORÇA ao calcular a Resistência recuperada em descanso" — a
   segunda metade da Virtude, que até agora só valia na Severidade da Ferida.
   Resolvida no handler, onde a ficha é conhecida; o motor recebe o número pronto.

4. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1827 asserções**. A asserção do Ferido no Descanso
   Curto foi conferida removendo a condição — falhou como devia.

**Registrado como lacuna de fonte, não implementado:** o capítulo 3 diz que
"durante a Fase de Aventura, os heróis podem gastar pontos de Companhia para
recuperar pontos de Esperança ao descansar (ver capítulo 4)" — e o capítulo 4
**não traz a taxa de conversão**. Sem o número na fonte, inventar seria pior que
deixar a mesa combinar. A reserva de Companhia já existe e é gastável à mão.

**Arquivos tocados:**
- `lib/combat/um-anel/shadow.ts` — `torRestEnduranceRecovery`
- `lib/room/handlers/tor-recovery.ts` · `app/api/room/[roomId]/tor-recovery/route.ts` — ação `short-rest`
- `components/vtt/TorShadowPanel.tsx` · `hooks/useRoomSync.ts`
- `scripts/verify-um-anel-sombra-mesa.mjs` — 9 asserções novas

**Como testar:** ferir um herói até metade da Resistência e usar "Descanso Curto"
— sobe pela FORÇA. Marcar Ferido na ficha e repetir: não sobe nada. "Descanso
Prolongado" enche a Resistência, e com Ferido sobe só a FORÇA.

**Falta:** Empenho de Perícia; penalidades em Dados de Sucesso; Elmo removível;
campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Limites de engajamento: os quatro tetos que ninguém conferia

**Pedido:** continuar o loop.

**Passo a passo:**

1. **O achado da rodada anterior, agora resolvido.** `TOR_ENGAGEMENT_LIMITS`
   tinha os quatro tetos do livro escritos — 3 heróis por inimigo humano, 6 por
   grande, 3 inimigos humanos por herói, 2 grandes — e **consumidor nenhum**. Dez
   heróis podiam cercar um Orc e nada acusava.

2. **Avisa, não barra.** Quem engaja quem é decisão do Mestre, e a leitura do app
   é célula adjacente, que é aproximação. Barrar o ataque puniria uma arrumação
   de tokens que pode estar certa na cabeça da mesa; calar deixaria a regra
   invisível. O teste tranca as duas coisas: que os limites são consultados **e**
   que estourá-los não devolve erro.

3. **Precisou de um dado que faltava: tamanho.** O teto depende de a criatura ser
   maior que humana — 3 humanos **ou** 2 grandes sobre um herói, e um grande
   aceita o dobro de cercadores. O bloco do adversário não tinha esse campo.

   **Marquei só onde o livro diz.** O texto dá "criaturas grandes (**como
   Trolls**)" como único critério explícito, então os cinco blocos de Troll foram
   marcados e mais nada. Vigor 2 seria um atalho tentador e **errado**: mede
   Ferimentos para abater, não tamanho, e há adversários de Vigor 2 do tamanho de
   um homem. O teste garante os dois lados — os cinco Trolls marcados, e nenhum
   não-Troll marcado.

4. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1818 asserções**. A asserção do teto por tamanho foi
   conferida fixando o teto humano — falhou como devia.

**Arquivos tocados:**
- `lib/character/um-anel/adversary-types.ts` · `adversaries.ts` — campo `large`, 5 Trolls
- `lib/character/um-anel/adversary-token.ts` · `lib/vtt/types.ts` — o tamanho viaja com o token
- `lib/room/handlers/tor-combat-attack.ts` — avisos de limite estourado
- `scripts/verify-um-anel-posturas-mesa.mjs` — 12 asserções novas

**Como testar:** pôr quatro heróis adjacentes a um Rufião e atacar — a mensagem
avisa que o livro permite três. Trocar o Rufião por um Grande Troll das Cavernas:
o aviso some, porque o teto de um grande é seis.

**Falta:** Fadiga por Carga e descanso (cap. 4); Empenho de Perícia; penalidades
em Dados de Sucesso; Elmo removível; campanhas de 1ª edição; glyph da runa de
Gandalf.

---

### 2026-08-08 — Varredura de constantes: a Falha sem nome e a tabela de custo duplicada

**Pedido:** continuar o loop.

**Passo a passo:**

1. **A varredura, agora por constante.** Contei consumidores de toda `export
   const` do Um Anel — o mesmo método que achou as tabelas de Pavor e Malfeitos.
   Catorze sem consumidor externo, e a maioria é falso positivo do método: união
   de tipos consumida no próprio arquivo (`TOR_COMBAT_TASKS`, `TOR_ROUND_EFFECTS`,
   `TOR_MAX_RATING`) ou mapa `*_BY_ID` de conveniência. **Dois eram reais.**

2. **A Falha do Acesso de Loucura nunca era nomeada.**
   `applyTorBoutOfMadness(state, shadowPathId, pathFlaws = {})` recebe o mapa de
   Falhas num terceiro argumento **com valor padrão**. Chamei com dois argumentos
   na rodada 11: compila, roda, e devolve `flawName: null` **sempre**. O anúncio
   dizia "ganha a 1ª Falha" sem dizer qual — justamente o que o Caminho da Sombra
   existe para dizer, e o motivo de `SHADOW_PATH_FLAWS` existir.

   Parâmetro opcional com padrão silencioso é armadilha: não há erro de tipo, e o
   comportamento degrada sem sinal nenhum.

3. **Tabela de custo de avanço duplicada.** `TOR_EXPERIENCE_COSTS`
   (undertakings.ts) repetia à mão os mesmos números de `TOR_XP_COST_BY_LEVEL`
   (progression.ts). Duas fontes de verdade para o mesmo preço — e a cópia era
   justamente a que ninguém consultava, então corrigir um degrau na tabela viva e
   esquecer da morta passaria despercebido **porque a morta não quebra nada**.
   Agora é derivada da única fonte.

4. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1806 asserções**. As duas asserções novas foram
   conferidas quebrando de propósito.

**Registrado, não corrigido:** `TOR_ENGAGEMENT_LIMITS` (3 heróis por inimigo
humano, 6 por inimigo grande, e os recíprocos) não tem consumidor **nenhum** — os
limites de engajamento não são verificados em lugar algum. É posicional e depende
de julgamento do Mestre sobre quem está engajando quem; fica anotado como o
próximo alvo em vez de ser mecanizado às pressas.

**Arquivos tocados:**
- `lib/room/handlers/tor-recovery.ts` — passa `SHADOW_PATH_FLAWS` ao Acesso de Loucura
- `lib/character/um-anel/undertakings.ts` — custo derivado, não redigitado
- `scripts/verify-um-anel-sombra-mesa.mjs` · `verify-um-anel-avanco.mjs` — 4 asserções novas

**Como testar:** levar a Sombra ao máximo e usar "Acesso de Loucura" — a mensagem
agora nomeia a Falha do Caminho da Sombra do herói (ex.: "Rancoroso", da Maldição
da Vingança).

**Falta:** limites de engajamento; Elmo removível; campanhas de 1ª edição; glyph
da runa de Gandalf.

---

### 2026-08-08 — Malfeitoria: o aviso que o livro manda dar

**Pedido:** continuar o loop.

**Passo a passo:**

1. **O achado.** "O ato de atacar ou matar um adversário com **Resolução**
   deveria sempre ser avaliado pelo Mestre como possível Malfeitoria." O motor de
   Sombra já tinha a fonte `malfeito`, o token do adversário já sabia
   `hateKind: "resolve"` — e **nada ligava as duas pontas**. No chat, um Rufião
   morto era indistinguível de um Orc morto, e a regra simplesmente não
   acontecia na mesa.

2. **O que o app faz, e o que não faz.** Não atribui Sombra sozinho: quem julga é
   o Mestre, e o próprio livro manda **advertir os jogadores antes**. O ataque
   passa a avisar quando o alvo tem Resolução, distinguindo **atacar** de
   **matar** — porque pesam diferente na tabela de Malfeitos —, e o Mestre decide
   no painel de Sombra. O teste garante as duas metades: que o aviso existe e que
   o ataque **não** chama `applyTorShadowGain`.

3. **Duas tabelas do livro estavam sem consumidor.** `TOR_DREAD_TABLE` e
   `TOR_MISDEED_TABLE` — as escalas que dizem quanto vale cada Pavor e cada
   Malfeito — existiam e não apareciam em lugar nenhum. O Mestre teria de lembrar
   de cabeça, e o contador de pontos viraria chute. Agora aparecem no painel,
   trocando conforme a fonte escolhida; Ganância e Feitiçaria não têm tabela fixa
   no livro e não mostram nada.

4. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1802 asserções**. A asserção do "só com Resolução"
   foi conferida removendo a condição — falhou como devia.

**Arquivos tocados:**
- `lib/room/handlers/tor-combat-attack.ts` — aviso de possível Malfeitoria
- `components/vtt/TorShadowPanel.tsx` — tabelas de Pavor e Malfeitos
- `scripts/verify-um-anel-sombra-mesa.mjs` — 9 asserções novas

**Como testar:** atacar um Rufião (Resolução) com um herói — a mensagem traz o
aviso de possível Malfeitoria; matá-lo troca "atacar" por "matar". Atacar um Orc
(Ódio) não avisa nada. No painel de Sombra, escolher "Malfeito" mostra a tabela
com os cinco degraus e a Cicatriz do mais grave.

**Falta:** Elmo removível; campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Apoio: o companheiro que gasta a própria Esperança

**Pedido:** continuar o loop.

**Passo a passo:**

1. **O achado.** Auditando o capítulo 2 regra a regra, o **Apoio** — parágrafo
   imediatamente seguinte à Inspiração — também não existia no motor: "o
   personagem que apoia pode gastar 1 ponto de Esperança para que o herói ativo
   *ganhe (1d)*". Mesma família do Bônus de Esperança da rodada anterior: o
   rastro terminava antes do código.

2. **Detalhe que muda o desenho: o ponto sai de QUEM APOIA.** Não é o herói ativo
   que paga. Por isso `supported` não desconta nada na ficha de quem foi apoiado
   — marcar ali só reconhece o (1d) que já foi pago do outro lado. E é **booleano,
   não contador**: "apenas um herói-jogador pode gastar Esperança para apoiar o
   herói ativo".

3. **Cumulativos, não excludentes.** O livro é explícito: Dados de Sucesso de
   fontes diferentes **somam** ("ganha (1d) de um companheiro, ganha (2d)
   gastando Esperança enquanto Inspirado, perde (1d) de penalidade → ganha
   (2d)"), ao contrário de Favorecida/Desfavorecida, que se cancelam. O campo
   novo é genérico e aceita negativo, que é como a penalidade entra, com piso em
   zero.

4. **Um bug que quase entrou.** A função que limpa as marcas depois da rolagem
   saía cedo quando não havia gasto de Esperança — o "Apoiado" ficaria marcado
   para a rolagem **seguinte**, dando um (1d) que ninguém pagou. As marcas valem
   para uma rolagem só e agora desmarcam sempre.

5. **De quebra, duas ocorrências que a renomeação de Perícias tinha deixado
   passar:** "Perícia de Saber" e "Perícia de Caça". Meus padrões cobriam
   "Perícia Saber", não a forma com "de" no meio. Corrigidas.

6. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1793 asserções**. A asserção da limpeza das marcas
   foi conferida restaurando o `return` antecipado — falhou como devia.

**Uma asserção antiga travou a forma errada** — a que fixava a soma do rank, que
ganhou o termo do Apoio. Oitava vez; segue sendo mudança de assinatura/forma o
gatilho.

**Arquivos tocados:**
- `lib/character/um-anel/dice.ts` — `bonusDice` cumulativo e `supported`
- `components/character/sheet/TorCharacterSheetView.tsx` — caixa de Apoio, limpeza das marcas
- `livros/um-anel/02-resolucao-de-acoes.md` · `12-o-mundo-eriador.md` — nome de Perícia
- `scripts/verify-um-anel-dice.mjs` — 8 asserções novas

**Como testar:** na ficha, marcar "Apoiado por um companheiro" e rolar — a
mensagem traz "[Apoio +1d]" e a rolagem leva um Dado de Sucesso a mais, **sem**
descontar Esperança de quem rolou. Marcar Apoio e Esperança juntos: os dois
somam.

**Falta:** Malfeitoria (cap. 8); Elmo removível; campanhas de 1ª edição; glyph da
runa de Gandalf.

---

### 2026-08-08 — Gastar Esperança por (1d): a ação mais usada do jogo não existia

**Pedido:** continuar o loop.

**Passo a passo:**

1. **O achado.** Fui auditar o capítulo 4 — Características Distintivas dão
   **Inspirado** — e o rastro terminou antes: **o Bônus de Esperança não existia
   no motor**. `rollTorCheck` não tinha por onde receber o bônus, então "gaste 1
   ponto de Esperança para *ganhar (1d)*" — a ação mais usada de qualquer mesa
   de Um Anel — simplesmente não era possível. E como Inspirado só **dobra** esse
   bônus, ele também não existia: as cinco Virtudes Culturais que concedem
   Inspiração eram texto sem efeito, e invocar um Traço Distintivo não fazia nada.

2. **Dois erros fáceis, os dois travados por teste.**

   - **É Dado de Sucesso, não de Proeza.** Soma ao rank, nunca a `favoured` —
     confundir daria dois Dados de Proeza a quem tem direito a um Dado de Sucesso
     extra. Foi o mesmo erro que evitei quando decidi não mecanizar as Virtudes
     de Inspiração, na rodada 1; agora está travado no motor.
   - **Inspirado sem gasto vale zero.** "Inspirados dobram o benefício de gastar
     um ponto" — sem o ponto, não há benefício para dobrar. A asserção foi
     conferida fazendo Inspirado render 1d sozinho: falhou como devia.

   E o teto é 2: o livro fecha em um ponto por rolagem ("não é possível gastar
   múltiplos pontos para ganhar múltiplos Dados de Sucesso bônus").

3. **O ponto sai da ficha.** Na ficha e no ataque em mesa, e só se houver ponto —
   marcar a caixa com Esperança zerada não pode virar saldo negativo. O motor
   continua puro: quem persiste é quem tem a ficha.

4. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1785 asserções**.

**Duas asserções antigas passaram a trancar a forma errada:** as que fixavam
`attributeTnBase` como parâmetro **posicional** de `rollTorSkillCheck`. A
assinatura virou objeto de opções para caber o Bônus de Esperança; a garantia
que elas protegem é a mesma e foi reescrita na forma nova. Sétima vez que este
padrão aparece — mudança de assinatura é o gatilho mais comum.

**Arquivos tocados:**
- `lib/character/um-anel/dice.ts` — `hopeBonusDice` no motor, `TorRollOptions`, `torHopeBonusDice`
- `components/character/sheet/TorCharacterSheetView.tsx` · `tor-sheet.css` — caixas antes da rolagem
- `lib/room/handlers/tor-combat-attack.ts` · `lib/combat/um-anel/resolve-attack.ts` — ataque em mesa
- `app/api/room/[roomId]/combat/attack/route.ts` · `hooks/useRoomSync.ts` · `components/vtt/TorAttackPopup.tsx`
- `scripts/verify-um-anel-dice.mjs` — 12 asserções novas · `verify-um-anel-empurrao-na18.mjs` atualizado

**Como testar:** na ficha, marcar "Gastar 1 Esperança" e rolar uma Perícia — a
mensagem traz "[Esperança +1d]", a rolagem leva um Dado de Sucesso a mais e a
Esperança cai 1. Marcar também "Inspirado": vira "+2d" pelo mesmo ponto. Marcar
só Inspirado, sem Esperança: não muda nada, que é o correto.

**Falta:** Elmo removível; campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Reserva de Companhia e crônica: a dívida zera (e um bug meu aparece)

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Reserva de Companhia.** "O valor inicial é igual ao número de
   heróis-jogadores; pode ser aumentado por Virtudes ou Bênçãos Culturais e por
   um bônus do Patrono. Os pontos são plenamente renovados ao fim de cada sessão"
   (cap. 3). O **máximo é derivado, nunca guardado** — guardar o total daria duas
   fontes de verdade que divergem assim que um herói entra ou sai da Companhia.
   O estado guarda só o **gasto**.

2. **Crônica.** Uma linha por Fase encerrada: ano, Fase, Yule, resultado e
   Empreitadas. Um detalhe que quase saiu errado: a linha descreve a Fase que
   **acabou**, então usa o ano/Fase de **antes** de avançar o calendário —
   escrever com o calendário já avançado datava tudo um passo à frente.

3. **Um bug meu, da rodada 10, apareceu aqui.** Ao ligar a crônica vi que
   `closePhase` espalha `...state` e carregava as **compras da Fase** adiante.
   Ou seja: o limite de "um grau por Perícia por Fase" **nunca zerava** — um herói
   que subisse Vigilância na primeira Fase não poderia subi-la de novo na
   campanha inteira.

   E o pior: na rodada 10 eu escrevi que "fechar a Fase constrói um estado novo,
   então o limite zera sozinho". **Estava errado** — o painel espalha o estado
   anterior. A afirmação agora está corrigida no histórico daquela rodada, com o
   `purchases: {}` no lugar e uma asserção que falha se sumir.

4. **A dívida zerou.** As duas listas — Sombra e progressão — estão vazias, e
   todas as funções que estavam nelas têm asserção exigindo consumidor real. A
   estrutura fica: é o que impede a próxima dívida de virar código morto
   silencioso.

5. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1773 asserções**. A asserção do `purchases: {}` foi
   conferida removendo a linha — falhou como devia.

**Arquivos tocados:**
- `lib/combat/um-anel/session-state.ts` — reserva, bônus, crônica, todos recortados
- `components/vtt/TorFellowshipPanel.tsx` — reserva, crônica, e o zeramento das compras
- `scripts/verify-um-anel-avanco.mjs` — asserções invertidas + reserva e crônica

**Como testar:** com a Fase aberta, gastar pontos de Companhia e conferir que o
disponível cai; "Renovar" volta ao máximo. Fechar a Fase: aparece uma linha na
Crônica com o ano e as Empreitadas daquela Fase. Subir a mesma Perícia na Fase
seguinte tem de ser **permitido** — era o bug.

**Falta:** Elmo removível; campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Áreas Perigosas e recuperação de fim de jornada: a dívida da Sombra zera

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Áreas Perigosas (JOR-M05).** "A Companhia para na Área Perigosa tão logo
   entre nela. Antes que os heróis possam deixar a área, devem enfrentar um
   número de Eventos igual ao seu índice de Perigo." A regra tem **duas metades**,
   e uma sem a outra não vale nada: o Teste de Marcha fica **barrado** enquanto
   houver Evento pendente, e cada Evento resolvido **desconta um** do Perigo. Sem
   a primeira, a Companhia atravessa a área sem pagar; sem a segunda, nunca sai.
   As duas têm asserção própria.

   Quem informa o Perigo é o Mestre: Áreas Perigosas não estão no mapa
   hexagonado, então não há como o app deduzir que a Companhia entrou numa.

2. **Recuperação de fim de jornada (JOR-M02).** Tira Fadiga pelo Vigor da
   montaria e depois pela rolagem de Viagem (1 no sucesso + 1 por ícone). Os dois
   números vêm da mesa — o painel do token não sabe se a Companhia viajou montada
   nem o que o Guia rolou —, e chegam recortados na rota.

3. **A dívida da Sombra zerou.** As quatro funções que estavam na lista foram
   todas ligadas, e a asserção inverteu: agora cada uma precisa **ter** consumidor
   real. A lista ficou vazia mas o mecanismo permanece — é o que impede a próxima
   dívida de virar código morto silencioso.

4. **Auditoria de vazamento de id.** Depois do `roleMeta.skillId` da rodada
   anterior, varri o restante à procura de outros ids impressos em vez de
   rótulos, tanto na UI quanto nas mensagens de chat montadas nos motores.
   Nenhum outro — os poucos usos de id em `.tsx` são chaves de lista e props de
   componente. Sétimo falso alarme evitado por conferir antes de mexer.

5. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1765 asserções**. A asserção do bloqueio da Marcha
   foi conferida trocando o `throw` por `console.warn` — falhou como devia.

**Arquivos tocados:**
- `lib/combat/um-anel/session-state.ts` — `perilousRemaining` na jornada
- `components/vtt/TorJourneyPanel.tsx` — entrada na área, bloqueio da Marcha, desconto por Evento
- `lib/room/handlers/tor-recovery.ts` · `app/api/room/[roomId]/tor-recovery/route.ts` — ação `journey-end`
- `components/vtt/TorShadowPanel.tsx` · `hooks/useRoomSync.ts`
- `scripts/verify-um-anel-journey.mjs` · `verify-um-anel-sombra-mesa.mjs` — asserções invertidas

**Como testar:** com uma jornada em andamento, clicar "Entrar em Área Perigosa"
com Perigo 2 — o Teste de Marcha some e o painel passa a cobrar os dois Eventos.
Resolver os dois e a Marcha volta. No painel do token, informar Vigor da montaria
e a rolagem de Viagem e clicar "Recuperação de fim de jornada".

**Falta:** crônica da Companhia e `torFellowshipLevel`; Elmo removível; campanhas
de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Papéis da Jornada + o id da Perícia vazando pro chat

**Pedido:** continuar o loop.

**Passo a passo:**

1. **A varredura, agora por função em todo o Um Anel.** Dezesseis funções sem
   consumidor externo — mas a leitura crua engana: a varredura exclui o arquivo
   que **define** a função, então uso no próprio módulo aparece como zero.
   Conferindo um a um, `featDiePhysicalFace`, `torRoundEffectIsConsumed` e
   `isColdSeason` são usados dentro do próprio arquivo e estão certos. Sobraram
   dois achados de verdade em `journey.ts`.

2. **Os papéis da Jornada não existiam na mesa.** O motor sempre soube que o
   evento cai sobre um **papel**, e o painel já dizia "o Caçador rola Caçada" —
   mas **ninguém era atribuído a papel nenhum**, e `validateTorRoleAssignment`,
   que exige um Guia só e nenhum papel descoberto, não tinha consumidor. A mesa
   guardava de cabeça quem era o Caçador, e partir com um papel vago só aparecia
   no primeiro evento daquele papel, no meio da viagem.

   Agora os quatro papéis são preenchidos ao montar a rota, a validação **barra**
   a partida (validar sem barrar seria decorativo, e o teste exige o `throw`), e
   o evento pendente mostra **quem** deve rolar.

3. **Bug encontrado de quebra: o id da Perícia ia cru pro chat.** O painel
   imprimia `roleMeta.skillId` — o Mestre lia *"Caçador rola caca"* e o jogador
   procurava "caca" numa ficha que diz **Caçada**. Mesma divergência id × rótulo
   que já tinha sido unificada nos capítulos, vazando por um caminho que a
   varredura de texto dos capítulos não alcançava. Três pontos corrigidos, com
   asserção proibindo o id cru voltar.

4. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1762 asserções**. A asserção do bloqueio foi
   conferida trocando o `throw` por um `console.warn` — falhou como devia.

**Dívida registrada:** `torPerilousAreaEventCount` (Áreas Perigosas, JOR-M05 — a
Companhia para ao entrar e enfrenta um evento por ponto de Perigo) segue sem
chamador, com asserção que acusa quando for ligado. Junto com
`applyTorJourneyEndRecovery`, `appendTorChronicle` e `torFellowshipLevel`.

**Arquivos tocados:**
- `lib/combat/um-anel/session-state.ts` — papéis na jornada, recortados na leitura
- `components/vtt/TorJourneyPanel.tsx` — atribuição, validação bloqueante, rótulo da Perícia
- `components/vtt/tor-journey.css`
- `scripts/verify-um-anel-journey.mjs` — 11 asserções novas

**Como testar:** montar uma rota deixando o Caçador em branco — a partida tem de
ser recusada dizendo qual papel está descoberto. Pôr dois nomes em Guia: recusa
também. Com tudo preenchido, o evento pendente passa a dizer "Caçador rola
Caçada — Fulano".

**Falta:** Áreas Perigosas; recuperação de fim de jornada; crônica; Elmo
removível; campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Acesso de Loucura, descansos e recuperação: a Sombra ganha saída

**Pedido:** continuar o loop.

**Passo a passo:**

1. **O buraco que importava.** Um herói cuja Sombra alcançasse a Esperança
   máxima ficava **Desfavorecido para sempre** — dois Dados de Proeza, fica o
   pior, em toda rolagem, sem saída. O **Acesso de Loucura** é a única regra que
   zera a Sombra nesse ponto, e existia no motor sem chamador nenhum.

2. **Quatro ações ligadas:** recuperação espiritual da Fase (devolve Esperança —
   cheia no Yule, senão até o CORAÇÃO — e tira Sombra até o limite do resultado
   da Fase), Descanso Prolongado (−1 Fadiga), Acesso de Loucura (Sombra a zero,
   +1 Falha) e curar Cicatriz (5 Pontos de Aventura, só no Yule).

3. **Um campo que faltava.** O Acesso de Loucura precisa de um **contador** de
   Falhas — na quarta o herói sucumbe e sai de jogo. A ficha só tinha `flaws`,
   que é o **texto livre** que o jogador escreve. Contar palavras nesse texto
   erraria na primeira Falha com vírgula, então entrou `shadowFlaws: number`,
   recortado 0–4 na normalização.

4. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila, com
   `/api/room/[roomId]/tor-recovery` registrada · `npm run test` verde com
   **1751 asserções**.

**O erro desta rodada foi meu, no mecanismo de dívida.** As listas de "funções
sem consumidor" gravadas nos dois testes deveriam falhar ao serem pagas — e
**não falharam**. A varredura olhava uma lista **fixa** de arquivos, e as funções
foram ligadas num handler novo (`tor-recovery.ts`) que não estava nela. A dívida
seguiria marcada como pendente depois de paga, que é pior que não ter registro:
dá a impressão de que ainda falta.

É exatamente o defeito que venho caçando — **a asserção provava um texto, não um
fato** —, agora na ferramenta que criei para vigiar isso. Quinta ocorrência da
família. A varredura passou a percorrer os diretórios inteiros
(`lib/room/handlers/`, `components/vtt/`, `lib/combat/um-anel/`), e cada função
paga ganhou a asserção **oposta**: precisa TER consumidor. Sem ela, a lista
poderia esvaziar por engano e ninguém notaria.

**Dívida que sobra:** `applyTorJourneyEndRecovery` (recuperação de fim de
jornada), `appendTorChronicle` e `torFellowshipLevel` — agora com varredura que
acusa de verdade quando forem ligadas.

**Arquivos tocados:**
- `lib/room/handlers/tor-recovery.ts` · `app/api/room/[roomId]/tor-recovery/route.ts` — **novos**
- `lib/character/um-anel/types.ts` · `normalize.ts` · `build-from-wizard.ts` — `shadowFlaws`
- `components/vtt/TorShadowPanel.tsx` · `TorAdvancePanel.tsx` · `hooks/useRoomSync.ts`
- `scripts/verify-um-anel-sombra-mesa.mjs` · `verify-um-anel-avanco.mjs` — varredura ampla e asserção oposta

**Como testar:** levar a Sombra de um herói até a Esperança máxima — as rolagens
passam a sair Desfavorecidas. Clicar "Acesso de Loucura": a Sombra zera e ele
ganha a 1ª Falha do Caminho da Sombra. Repetir até a quarta: a mensagem avisa que
o herói sucumbiu. No Yule, "Curar Cicatriz" cobra 5 Pontos de Aventura.

**Falta:** recuperação de fim de jornada; crônica; Elmo removível; campanhas de
1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Progressão: o herói acumulava pontos e não tinha como gastar

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Diagnóstico.** Segunda metade do achado da auditoria anterior:
   `progression.ts` tinha **11 das 16 funções sem consumidor**. Todo o preço de
   avanço — Perícia, Proficiência de Combate, Valor, Sabedoria — estava pronto,
   testado e desligado. O herói acumulava Pontos de Perícia e de Aventura e a
   única forma de subir um grau era editar a ficha na mão.

2. **Dois erros fáceis, os dois travados por teste.**

   - **Duas moedas.** Perícia custa Pontos de **Perícia**; Proficiência de
     Combate, Valor e Sabedoria custam Pontos de **Aventura**. Trocar as duas
     passaria despercebido até alguém ficar sem pontos do lado errado — conferi
     quebrando de propósito e a asserção pegou.
   - **O limite é por Fase de Companhia**, não por sessão nem por personagem:
     um grau em cada Perícia e em cada Proficiência por Fase, e Valor e Sabedoria
     competem entre si — só um dos dois.

3. **Onde guardar o que já foi comprado.** No estado da **Fase**, não na ficha:
   o limite do livro é por Fase, e na ficha alguém teria de lembrar de zerar. O
   recorte na leitura limita a 1 grau por Perícia já na normalização, senão um
   estado adulterado deixaria o limite passar na próxima leitura.

   > **Correção, escrita na rodada seguinte:** aqui eu afirmei que "fechar a Fase
   > constrói um estado novo, então o limite zera sozinho". **Estava errado.** O
   > painel espalha o estado anterior (`...state`) e carregava as compras adiante
   > — o limite nunca zerava, e um herói que subisse Vigilância na primeira Fase
   > não poderia subi-la de novo na campanha inteira. Corrigido com
   > `purchases: {}` ao fechar a Fase, com asserção própria.

4. **O prêmio do novo grau.** Valor concede uma Recompensa; Sabedoria, uma
   Virtude — e a Cultural só a partir de Sabedoria 2. A escolha em si é do
   jogador, na ficha; o app anuncia no chat que há uma escolha pendente, em vez
   de escolher por ele.

5. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila, com
   `/api/room/[roomId]/tor-advance` registrada · `npm run test` verde com **1751
   asserções**.

**A dívida segue registrada dentro do teste:** `applyTorSpiritualRecovery`,
`appendTorChronicle` e `torFellowshipLevel` continuam sem consumidor, numa lista
com asserção que falha quando alguém ligar alguma — do mesmo jeito que as quatro
funções de Sombra que sobraram da rodada anterior.

**Arquivos tocados:**
- `lib/room/handlers/tor-advance.ts` · `app/api/room/[roomId]/tor-advance/route.ts` — **novos**
- `components/vtt/TorAdvancePanel.tsx` — **novo**, dentro da Fase de Companhia
- `lib/combat/um-anel/session-state.ts` — compras da Fase, normalizadas
- `components/vtt/TorFellowshipPanel.tsx` · `mesa/MesaFoundryFloatingWindows.tsx` · `hooks/useRoomSync.ts`
- `scripts/verify-um-anel-avanco.mjs` — **novo**, 41 asserções

**Como testar:** abrir a Fase de Companhia com heróis no mapa. O painel lista
cada herói com as duas moedas separadas e o custo do próximo grau ao lado de cada
Perícia. Comprar a mesma Perícia duas vezes na mesma Fase tem de recusar; comprar
Valor e depois Sabedoria na mesma Fase também.

**Falta:** recuperação espiritual e crônica da Fase; Acesso de Loucura e
descansos; Elmo removível; campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Auditoria de cobertura: o motor de Sombra estava desligado

**Pedido:** continuar o loop.

**Passo a passo:**

1. **A auditoria.** Varri `lib/combat/um-anel/` e `lib/character/um-anel/`
   contando consumidores reais de cada módulo e de cada função exportada — o
   padrão que mais rendeu nas rodadas anteriores. Nenhum módulo é órfão, mas duas
   coisas apareceram:

   - **`shadow.ts`: 6 das 9 funções sem consumidor nenhum** — `hardenTorWill`,
     `applyTorBoutOfMadness`, `applyTorProlongedRest`,
     `applyTorJourneyEndRecovery`, `healTorShadowScar`,
     `formatTorShadowGainMessage`. E `applyTorShadowGain` só era referenciada
     dentro de `progression.ts`, que também não chega à mesa.
   - **`progression.ts`: 11 das 16 sem consumidor** — todo o preço de avanço
     (`priceTorSkillRank`, `canBuyTorSkillThisPhase`, `torRankGrant`), a
     recuperação espiritual e a crônica.

2. **Por que a Sombra é a mais grave.** O combate consulta **a cada rolagem**
   duas condições que nascem dela: **Arrasado** (o Olho vira falha automática) e
   **Desfavorecido** (dois Dados de Proeza, fica o pior). Sem caminho para
   atribuir Sombra, essas condições só mudavam se alguém editasse a ficha na
   mão — o motor mais central do jogo ficava de enfeite, e passando nos testes,
   porque `verify-um-anel-shadow.mjs` testa o motor, não o caminho.

3. **Implementação.** Handler + rota + painel no token do herói, que é onde o
   Mestre já clica. Ganho por fonte (Pavor, Ganância, Malfeito, Feitiçaria) com
   Cicatrizes, e **Endurecer a Vontade**.

   As duas ações têm **donos diferentes**, e é isso que decide a arquitetura:
   ganhar Sombra é do Mestre (é ele quem narra o Pavor e julga o Malfeito),
   endurecer a vontade é de quem joga o herói. Por isso a rota não usa
   `requireRoomManage` — quem separa é o handler, que conhece a ficha.

   O painel **não rola o Teste de Sombra**: o teste é uma rolagem de Perícia
   comum, feita pela ficha, e o Mestre informa aqui o que sobrou. Fingir que o
   painel sabe o resultado seria pior que pedir o número.

4. **Uma armadilha de unidade.** `TorSpiritState.load` é a Carga do
   **equipamento**, sem a Fadiga — quem soma as duas é `totalTorLoad`, dentro do
   motor. Passar a Carga já somada contaria a Fadiga duas vezes e deixaria heróis
   Exaustos cedo demais. O teste trava a forma.

5. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila, com
   `/api/room/[roomId]/tor-shadow` registrada · `npm run test` verde com **1710
   asserções**.

**Outra asserção que não podia falhar.** A que exige "só anuncia no chat depois
de gravar na ficha" comparava as posições de `patchTorCharacterResources` e
`appendRoomChatMessage` — mas o primeiro nome também aparece na linha de
`import`, no topo. Comparando com a importação, a asserção passaria **sempre**.
Ancorei na chamada (`patchTorCharacterResources(sheet.id`) e aí falhou como
devia quando inverti a ordem de propósito. Quarto caso desta família.

**Dívida registrada no próprio teste:** as quatro funções de Sombra que seguem
sem consumidor (Acesso de Loucura, Descanso Prolongado, recuperação de fim de
jornada, curar Cicatriz) estão numa lista com asserção — quando alguém ligar
alguma, o teste falha e obriga a atualizar a lista. É o registro de dívida ficar
onde não dá para esquecer.

**Arquivos tocados:**
- `lib/room/handlers/tor-shadow.ts` · `app/api/room/[roomId]/tor-shadow/route.ts` — **novos**
- `components/vtt/TorShadowPanel.tsx` — **novo**
- `components/vtt/TokenStatusBody.tsx` · `components/vtt/vtt.css` · `hooks/useRoomSync.ts`
- `scripts/verify-um-anel-sombra-mesa.mjs` — **novo**, 29 asserções

**Como testar:** clicar num token de herói, escolher Pavor e 2 pontos, atribuir —
o chat traz a linha da Sombra com o total, e a ficha guarda. Levar a Sombra até a
Esperança atual e conferir que o Olho passa a falhar automaticamente nas
rolagens. "Endurecer a Vontade" zera a Sombra e soma 1 Cicatriz.

**Falta:** progressão (11 funções sem consumidor — preço de avanço, crônica);
Acesso de Loucura e descansos; Elmo removível; campanhas de 1ª edição; glyph da
runa de Gandalf.

---

### 2026-08-08 — Empurrão e a variante de NA 18: o combate fecha

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Empurrão — por que não cabia no fluxo normal.** A escolha é de quem **levou**
   o golpe, mas o ataque é uma requisição só, mandada por quem **atacou**. Não dá
   para pedir a decisão no meio. Solução: o ataque grava uma **oferta** no token
   do herói (a perda e a rodada), e uma rota própria a aceita. Sem a oferta
   gravada, o defensor não teria sobre o que decidir.

2. **O arredondamento é do que fica, não do que volta.** "Reduzir à metade,
   arredondando frações para cima": perder 7 deixa **4** de perda e devolve 3.
   Arredondar o valor devolvido daria 4 — meio ponto de vantagem em toda perda
   ímpar, sempre a favor do herói. O teste confere a aritmética de verdade,
   importando a função e checando 0, 1, 3, 7 e 8.

3. **Um detalhe que passaria batido:** se o golpe zerou a Resistência, amortecer
   devolve o herói ao combate — a marca de derrotado precisa sair junto, senão
   ele fica de pé com Resistência positiva **e** marcado como fora.

4. **O custo que o app não cobra.** O livro cobra a próxima ação principal, e a
   VTT não modela ação principal no Um Anel. Em vez de fingir, a mensagem do chat
   diz o custo para a mesa cobrar — e o teste exige que a frase continue lá.

5. **NA 18 — opção de mesa, não da ficha.** O mesmo herói pode jogar uma one-shot
   e uma campanha longa, então a variante mora no `torSession` da sala, com
   controle no painel de campanha (que já é o de escopo de campanha: calendário e
   Yule) e só para o Mestre. Desligar **apaga** em vez de gravar 20 — gravar 20
   deixaria "nunca mexeu" e "desligou" indistinguíveis.

6. **Bug real que a mudança expôs:** `resolve-attack.ts` tinha a fórmula do NA
   **duplicada** (`return 20 - strength`). Com a base virando opção, as duas
   cópias divergiriam na primeira mesa que ligasse 18 — o ataque continuaria em
   20 enquanto todo o resto ia para 18. Passou a importar de `rules.ts`, com
   asserção proibindo a duplicata voltar.

7. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila, com
   `/api/room/[roomId]/tor-push` registrada · `npm run test` verde com **1681
   asserções**.

**Duas asserções antigas passaram a trancar a regra errada** — a que exigia
`return 20 - score;` literal em `attributeTN` (o 20 virou o padrão do parâmetro,
o que preserva exatamente a mesma garantia) e a da sessão vazia, que precisava
passar a contar `attributeTnBase`: uma mesa que só ligou a regra opcional, sem
jornada nem conselho, **precisa** gravar estado, senão a opção se perderia no
próximo save. Quinta vez que este padrão aparece.

> **Correção (2026-08-08, rodada do Olho de Mordor).** A frase acima descreve o
> que eu *queria* que acontecesse, não o que acontecia. Só `normalizeTorSession`
> (a LEITURA) ganhou `attributeTnBase` na guarda. `applyTorSessionPatch` — a
> função que roda no **save** — continuou com `if (!next.journey &&
> !next.council && !next.fellowship) return undefined;`, então uma mesa que
> ligasse só o NA 18 realmente **perdia a opção na gravação**, exatamente o bug
> que este parágrafo dizia ter evitado. A asserção da época cobria só a leitura,
> e por isso não acusou. Corrigido junto com a entrada do Olho de Mordor, com
> uma asserção nova para a gravação.

**Cuidado com o teste, não com o código:** o teste importa `push.ts` para conferir
a conta, e o `catch` do import poderia apagar as cinco checagens em silêncio.
Acrescentei uma asserção que falha se o import não vier — teste que some sozinho
é pior que teste que não existe.

**Limite conhecido:** a ficha aberta **fora** de uma sala não conhece a mesa e
cai no NA 20. O parâmetro existe para quem conhece passar (ataque e Tarefa de
Combate já passam); a ficha avulsa não tem como saber.

**Arquivos tocados:**
- `lib/combat/um-anel/push.ts` — **novo**: a conta do Empurrão e seus limites
- `lib/room/handlers/tor-push.ts` · `app/api/room/[roomId]/tor-push/route.ts` — **novos**
- `lib/room/handlers/tor-combat-attack.ts` — grava a oferta e usa a base de NA da mesa
- `lib/combat/um-anel/session-state.ts` — `attributeTnBase` no estado da mesa
- `lib/character/um-anel/rules.ts` · `dice.ts` · `lib/combat/um-anel/resolve-attack.ts` — base do NA
- `app/api/room/[roomId]/tor-session/route.ts` · `hooks/useRoomSync.ts`
- `components/vtt/TorFellowshipPanel.tsx` · `TorAttackPopup.tsx` · `mesa/MesaFoundryFloatingWindows.tsx`
- `scripts/verify-um-anel-empurrao-na18.mjs` — **novo**, 38 asserções
- `scripts/verify-um-anel-pregens.mjs` · `verify-um-anel-session-state.mjs` — asserções atualizadas

**Como testar:** bater num herói e conferir que aparece "Ser empurrado (+N)" no
popup dele, com N = metade da perda arredondada para baixo. Aceitar, e a
Resistência sobe. Tentar de novo na mesma rodada: recusa. No painel de campanha,
marcar "Números-Alvo derivados de 18" e conferir que o NA de ataque cai 2.

**Falta:** Elmo removível em combate; converter as campanhas de 1ª edição; glyph
da runa de Gandalf (bloqueado na fonte).

---

### 2026-08-08 — Os quatro Danos Especiais que faltavam (Aparar, Investida de Escudo, Quebrar Escudo, Agarrar)

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Diagnóstico.** As quatro estavam de fora por falta de onde guardar estado. O
   substrato da rodada anterior resolveu metade; a outra metade precisava de
   campos que **duram além da rodada**.

2. **Decisão — três durações, não duas.** Aparar e Investida de Escudo são
   efeito de **rodada** (`bloqueio` e `empurrado`, ambos de duração e não de uso
   único: o Bloqueio aparado vale contra todos os ataques daquela rodada). Já
   Quebrar Escudo e Agarrar **não** são efeito de rodada — o livro não dá prazo
   para nenhum dos dois. Viraram campos próprios no token (`shieldBroken`,
   `grappled`), e Agarrar só sai gastando um ícone.

3. **Uma peça que faltava para o Bloqueio.** O token guardava `parry` já somado
   com o escudo, então não havia como Quebrar Escudo subtrair a parcela certa.
   Passou a guardar `shieldParryBonus` à parte.

4. **Ordem de gasto, quando os ícones não dão para tudo.** Fica explícita e
   testada: escapar do Agarrão primeiro (é a única opção que devolve o herói ao
   jogo — preso, ele só luta em Avançada com Briga), depois Perfurar (decide o
   Golpe Perfurante), depois Agarrar e Quebrar Escudo (mudam o estado além da
   rodada), depois Aparar e Investida de Escudo, e por último Golpe Pesado, que
   só soma Resistência.

5. **Condições que o livro exige e são fáceis de perder.** Investida de Escudo
   pede escudo **e** FORÇA maior que o Nível de Atributo do alvo — sem a
   comparação, o empurrão sairia de graça. Quebrar Escudo não funciona em escudo
   com Recompensa ("um escudo aprimorado por Recompensas ou qualidades mágicas
   não pode ser quebrado"): o vínculo possível hoje é a Recompensa *Reforçado* na
   ficha. E Aparar vale para qualquer arma de corpo a corpo, mas **não** com
   Arco.

6. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1643 asserções**.

**Uma asserção que não podia falhar.** Ao conferir se a restrição do Agarrado
disparava, pus um `false &&` na frente da condição — e o teste **continuou
passando**, porque a regex casava com a expressão, que seguia no arquivo, só que
morta. Ancorei no `if (` e aí falhou como devia. É o mesmo defeito de fundo do
comentário que casava com a asserção da rota: a asserção precisa provar que o
código **age**, não que o texto existe.

**Cinco asserções antigas passaram a trancar a regra errada** — as quatro que
diziam "Aparar/Investida/Quebrar Escudo/Agarrar NÃO são aplicados pelo motor" e
a que exigia `!/machados:/` em `special-damage.ts` (agora `machados` existe, na
tabela de **Aparar**, que é outra coisa). Todas reescritas, a última escopada à
tabela certa. Quarta vez que este padrão aparece.

**Arquivos tocados:**
- `lib/combat/um-anel/special-damage.ts` — as quatro opções, tabela de Aparar e a ordem de gasto
- `lib/combat/um-anel/round-effects.ts` — `bloqueio` e `empurrado`
- `lib/combat/um-anel/resolve-attack.ts` — disponibilidade de cada opção e o texto da mensagem
- `lib/room/handlers/tor-combat-attack.ts` — condições do livro, Bloqueio efetivo e gravação do estado
- `lib/vtt/types.ts` · `lib/vtt/tor-player-token.ts` — `shieldParryBonus`, `shieldBroken`, `grappled`
- `app/api/room/[roomId]/combat/attack/route.ts` — recorte do plano com os campos novos
- `hooks/useRoomSync.ts` · `components/vtt/TorAttackPopup.tsx` · `components/vtt/TokenStatusBody.tsx`
- `scripts/verify-um-anel-dano-especial.mjs` — 69 asserções · `verify-um-anel-tarefas-combate.mjs` atualizado

**Como testar:** herói com escudo e Espada contra um Rufião — marcar "Aparar" e
conferir que o Bloqueio sobe naquela rodada e volta na seguinte. Adversário cujo
bloco liste "Quebrar Escudo" atacando esse herói: o escudo se parte e o Bloqueio
cai exatamente o valor do escudo. Herói Agarrado não consegue atacar de espada —
só de Briga — e escapa marcando "Escapar do Agarrão".

**Falta:** Empurrão; variante de NA 18; Elmo removível; campanhas de 1ª edição;
glyph da runa de Gandalf.

---

### 2026-08-08 — Tarefas de Combate executáveis + efeitos com duração de rodada

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Diagnóstico.** `TOR_STANCE_META.combatTask` guardava só o **nome** das
   quatro tarefas — nenhuma era executável. E faltava a peça de que todas
   dependem: um lugar para guardar efeito que dura uma rodada.

2. **Decisão — substrato próprio, não o do Eldarin.** `lib/combat/timed-effects.ts`
   fala em turnos, PA e condições que não existem aqui. Além do isolamento de
   hub, a unidade é outra: no Um Anel a rodada é simultânea, então "dura uma
   rodada" não é "até o meu próximo turno". Novo `round-effects.ts`, e a única
   mudança em arquivo compartilhado (`combat-turn.ts`) entrou guardada por
   `rpgSystemId`.

3. **A distinção que o livro faz e é fácil perder.** Há **duas** durações:

   - *até ser usado* — "ficam Exaustos em sua **próxima rolagem de ataque**", "o
     **próximo ataque** dirigido ao protegido perde (1d)", "ganha (1d) em seu
     **próximo ataque** à distância";
   - *pela rodada* — "ganham (1d) em suas rolagens de ataque **na rodada
     seguinte**".

   Tratar tudo como uso único faria o bônus de Reunir Companheiros sumir no
   primeiro ataque; tratar tudo como duração daria Tiro Preparado em **todos** os
   ataques da rodada. O teste tranca cada tipo no seu comportamento.

4. **Detalhes que o livro fecha e o código respeita.** Reunir Companheiros é uma
   vez por rodada em toda a Companhia — a marca vence na própria rodada, porque
   se durasse mais a tarefa ficaria travada para sempre. Reunir nunca alcança a
   Retaguarda, que é a postura à distância e o livro fecha em "postura de Combate
   Corpo a Corpo". Proteger Companheiro recusa alvo em Retaguarda e recusa o
   próprio herói. E Tiro Preparado só é gasto num ataque **à distância** — um
   golpe corpo a corpo não queima a mira.

5. **Bug real encontrado ao ligar as peças.** O desconto de Ódio espalhava o
   `atkCombat` **original** ao gravar o token. Um adversário Intimidado que
   também gastasse Ódio teria o efeito **ressuscitado** no mesmo ataque em que
   foi consumido — ficaria Exausto de novo na rodada seguinte, de graça. Passou a
   partir do token já atualizado, com asserção nomeando o caso.

6. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila, com
   `/api/room/[roomId]/tor-task` registrada · `npm run test` verde com **1622
   asserções**. As três asserções críticas conferidas quebrando de propósito.

**Detalhe de teste que quase passou batido:** a asserção "a rota NÃO exige
`requireRoomManage`" casava com o **comentário** da própria rota, que explica por
que ela não usa. Sem `stripComments`, o teste passaria mesmo se o código
passasse a exigir. Sexta vez que esse padrão aparece.

**Arquivos tocados:**
- `lib/combat/um-anel/round-effects.ts` — **novo**: substrato de efeitos de rodada, com as duas durações
- `lib/combat/um-anel/combat-tasks.ts` — **novo**: as quatro tarefas, postura, Perícia e escalonamento por ícones
- `lib/room/handlers/tor-combat-task.ts` — **novo**: execução, permissão, postura exigida, uma-vez-por-rodada
- `app/api/room/[roomId]/tor-task/route.ts` — **novo**: rota (apelido como autor)
- `lib/room/handlers/tor-combat-attack.ts` — os quatro efeitos entram e são gastos no ataque
- `lib/room/handlers/combat-turn.ts` — efeitos vencidos limpos na virada de rodada
- `lib/vtt/types.ts` · `hooks/useRoomSync.ts` · `components/vtt/TorAttackPopup.tsx`
- `scripts/verify-um-anel-tarefas-combate.mjs` — **novo**, 72 asserções
- `package.json` — novo teste na suíte

**Como testar:** dois heróis e três Rufiões. Herói em Avançada → "Tentar
Intimidar Inimigo": com sucesso, os Rufiões de Vigor 1 ficam Exaustos no próximo
ataque deles. Outro herói em Aberta → "Reunir Companheiros": só um por rodada, e
o bônus vale a rodada seguinte inteira, não só o primeiro ataque. Em Retaguarda,
"Preparar Tiro" some ao usar o arco — e não some se o ataque for corpo a corpo.

**Falta:** Aparar, Investida de Escudo, Quebrar Escudo e Agarrar (agora **têm**
onde ser guardados, mas cada uma mexe em coisa diferente); Empurrão; variante de
NA 18; Elmo removível; campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — 10 das 18 Perícias tinham nome diferente no livro e na ficha

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Diagnóstico.** Ia começar as Tarefas de Combate e parei na primeira linha:
   "Preparar Tiro — o jogador faz uma rolagem de **VASCULHAR**". Na ficha do
   jogador essa Perícia se chama **Busca**. Varri as 18 contra os capítulos e
   **10 divergiam**:

   | capítulos | ficha (data.ts) |
   |---|---|
   | VASCULHAR | Busca |
   | IMPONÊNCIA | Fascínio |
   | ENCORAJAR | Indução |
   | PERCEPÇÃO | Vigilância |
   | SABER | História |
   | CANTO (e "Canção") | Música |
   | CAÇA | Caçada |
   | VIAJAR | Viagem |
   | EXPLORAR | Exploração |
   | PERSPICÁCIA | Discernimento |

   **418 ocorrências em 11 capítulos**, mais o compêndio. Um Mestre lendo "role
   VASCULHAR" e um jogador olhando "Busca" na ficha não tinham como saber que era
   a mesma Perícia — e isso vale para 10 das 18, inclusive as quatro que as
   Tarefas de Combate usam.

2. **Decisão.** Vence o **rótulo da ficha**. O próprio glossário registra que os
   termos foram reconciliados com a ficha oficial editável em PT-BR e que, onde
   divergissem, adota-se o da ficha. Os nomes antigos coincidem com os `id`
   internos (`vasculhar`, `imponencia`…) — que continuam intactos, porque são
   chave estável; o que não pode é o id vazar como **nome** no texto da mesa.

3. **Como fiz sem repetir o desastre.** Duas passadas com script que **conta e
   reporta cada substituição**, nunca `sed` largo, e que aborta se qualquer
   arquivo encolher. Só troquei em contextos que são inequivocamente nome de
   Perícia — negrito-caixa, célula de tabela, par nome+graduação, chamadas de
   rolagem, itálico. Prosa solta ficou de fora de propósito: "saber", "canto",
   "caça", "viajar" e "explorar" são palavras comuns. As últimas 12 ocorrências
   em prosa foram conferidas uma a uma e trocadas com contagem exata.

   **Uma exceção salvou um nome:** `VERSOS DE SABER` é Característica Distintiva
   (`versos-de-saber` em data.ts), não a Perícia — sem a exclusão viraria "VERSOS
   DE HISTÓRIA", que não existe em lugar nenhum. E "Compor uma Canção", "Canção de
   Vitória" e "Canção de Reis" são Empreitada e itens: continuam "Canção".

4. **Segunda divergência, no mesmo padrão.** O código chamava a Habilidade
   Sinistra de **"Velocidade de Serpente"** (6×) e o capítulo 8 — que é o capítulo
   dos adversários e a fonte dos blocos — de **"Velocidade Serpentina"** (6×). E o
   exemplo do capítulo 6 inventou **"Força Horrível"** para a "Força Horrenda" que
   todo o resto usa. Unificado pelo capítulo 8.

5. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1550 asserções** (o teste novo sozinho responde por
   ~240 delas: cada capítulo × cada nome antigo). `gen-um-anel.mjs` rodado e o
   JSON do compêndio commitado junto.

**Falso alarme conferido:** as Tarefas de Combate são "ação **principal** da
rodada" no capítulo 6, enquanto três Virtudes dizem "como ação **secundária**".
Parecia contradição — não é: o padrão é custar a ação principal, e a Virtude é
justamente a exceção que deixa fazer junto com o ataque. Nada a corrigir.

**Arquivos tocados:**
- 11 capítulos em `livros/um-anel/` — 418 ocorrências de nome de Perícia
- `livros/um-anel/compendio/` (conselho, jornada, sombra) — 14 ocorrências
- `data/compendiums/um-anel/` — regenerado por `gen-um-anel.mjs`
- `lib/character/um-anel/adversaries.ts` — "Velocidade Serpentina"
- `scripts/verify-um-anel-glossario.mjs` — teste por capítulo × nome antigo, mais o compêndio e as Habilidades Sinistras

**Como testar:** abrir qualquer capítulo e a ficha lado a lado — toda chamada de
rolagem agora usa o mesmo nome que aparece na ficha do jogador.

**Falta:** as Tarefas de Combate em si (era o alvo desta rodada, e a troca de
nomes veio antes porque elas dependem justamente desses quatro nomes); efeitos
com duração de rodada, que destravam Aparar, Investida de Escudo, Quebrar Escudo
e Agarrar; Empurrão; variante de NA 18; Elmo removível; campanhas de 1ª edição.

---

### 2026-08-08 — Dano Especial: Golpe Pesado e Perfurar (e a Mão Firme deixa de ser inerte)

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Diagnóstico.** `specialDamage` era `string[]` decorativo no bloco do
   adversário, e o herói não tinha como gastar ícone de Sucesso nenhum. Junto
   disso, a Virtude **Mão Firme** existia em `STARTING_VIRTUES` desde sempre e
   **não fazia absolutamente nada**.

2. **Achado de leitura — são duas listas, não uma.** O capítulo 6 dá as opções do
   **herói** (Golpe Pesado, Aparar, Perfurar, Investida de Escudo) e o capítulo 8
   as do **adversário** (Quebrar Escudo, Golpe Pesado, Perfurar, Agarrar). Elas
   dividem dois nomes e diferem nos outros dois — tratar como lista única daria
   ao herói um "Agarrar" que ele não tem e ao adversário um "Aparar" que não
   existe. E há um par ainda mais traiçoeiro: **Perfurar** (Dano Especial, soma no
   Dado de Proeza) × **Golpe Perfurante** (resultado 10/Runa que obriga o Teste de
   Proteção).

3. **Mão Firme era um no-op por causa desse par.** O texto diz "+1 ao resultado
   numérico do Dado de Proeza **em um Golpe Perfurante**". Só que, uma vez
   disparado o Golpe Perfurante, o valor do Dado de Proeza não é mais consultado —
   o que decide dali em diante é o Teste de Proteção contra o Ferimento da arma.
   Lido ao pé da letra, o +1 não muda **nada**. A frase abre com "Ao infligir
   **Dano Especial**", e o Dano Especial que soma no Dado de Proeza é Perfurar —
   única leitura em que a metade da Virtude tem efeito, e onde ela é forte, porque
   pode levar um 9 a 10 e disparar o Golpe. Registrei a interpretação como **nota
   de leitura no capítulo** (sem apagar a frase original) e ajustei a descrição em
   `data.ts`, que repetia o texto inerte.

4. **Implementação.** Motor novo e puro em `special-damage.ts` com as duas opções
   que se resolvem inteiras dentro do ataque. Três decisões que o teste tranca:

   - **Dano Especial é resolvido ANTES do Golpe Perfurante.** Calcular depois
     tornaria Perfurar inútil justamente onde ele mais importa.
   - **Perfurar é atendido antes do Golpe Pesado** quando há menos ícones que o
     pedido: Perfurar decide o Golpe Perfurante, o Golpe Pesado só soma
     Resistência.
   - **Arma que não perfura não consome ícone** — gastar em nada é pior que não
     oferecer. Machados e Briga ficam fora porque o livro nomeia só Arcos, Lanças
     e Espadas (+2/+3/+1).

   O plano é declarado **antes** da rolagem, porque o ataque é uma requisição só;
   o motor gasta o que os dados realmente derem.

5. **Regra que quase se perdeu:** "todos os adversários podem sempre escolher
   acionar Golpe Pesado" — o bloco lista só os **extras**. Condicionar a
   `action.specialDamage` (o reflexo natural, e o que Perfurar de fato exige)
   tiraria uma opção que é universal. O teste trava os dois lados.

6. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1316 asserções**. As quatro asserções críticas
   foram conferidas quebrando de propósito.

**Duas asserções antigas tiveram de mudar, e por bom motivo:** `verify-um-anel-stances`
exigia `featDie.numeric === 10` para o Golpe Perfurante. Com Perfurar somando no
Dado de Proeza, a igualdade estrita faria um 9 + 2 dar 11 e **não** disparar o
Golpe — exatamente o efeito que Perfurar existe para produzir. Virou `>= 10`,
com o comentário explicando por quê. E `verify-um-anel-pregens` exigia a frase
inerte da Mão Firme; agora exige a segunda metade com o nome certo do gasto.

**Arquivos tocados:**
- `lib/combat/um-anel/special-damage.ts` — **novo**: motor puro do gasto de ícones
- `lib/combat/um-anel/resolve-attack.ts` — plano de gasto, ordem correta, Olho/Runa fora do bônus
- `lib/room/handlers/tor-combat-attack.ts` — FORÇA/Nível de Atributo, Proficiência, 2 mãos, Mão Firme
- `app/api/room/[roomId]/combat/attack/route.ts` — recorte do plano recebido
- `hooks/useRoomSync.ts` · `components/vtt/TorAttackPopup.tsx` · `components/vtt/vtt.css` — UI do gasto
- `livros/um-anel/05-valor-e-sabedoria.md` — nota de leitura da Mão Firme
- `lib/character/um-anel/data.ts` — descrição da Mão Firme sem o no-op
- `scripts/verify-um-anel-dano-especial.mjs` — **novo**, 48 asserções
- `scripts/verify-um-anel-stances.mjs` · `verify-um-anel-pregens.mjs` — asserções atualizadas
- `package.json` — novo teste na suíte

**Como testar:** herói com Espada (Perfurar +1) atacando e pedindo 1 ícone em
Perfurar — se o Dado de Proeza sair 9, tem de virar Golpe Perfurante. O mesmo
herói com Mão Firme faz o 8 já bastar. Com Machado, o campo Perfurar aparece
desabilitado.

**Falta:** Aparar, Investida de Escudo, Quebrar Escudo e Agarrar (duram a rodada
— precisam de estado que ainda não existe); tarefas de combate; variante de NA
18; Elmo removível; campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Ódio/Resolução e Habilidades Sinistras chegam à mesa

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Diagnóstico.** `hate`, `hateKind` e `fellAbilities` estavam em
   `adversaries.ts` e **não apareciam em mais lugar nenhum do app**. O token não
   carregava, nenhuma tela mostrava, nada consumia — metade do bloco do
   adversário era decorativa, e o Mestre não tinha onde ver nem como gastar. É o
   mesmo padrão das posturas: dado pronto e desligado, passando nos testes porque
   ninguém testava o **caminho**.

2. **Decisão — o que mecanizar.** Lendo o capítulo 8, quase toda Habilidade
   Sinistra é gasto **opcional** ("gaste 1 de Ódio para tornar a rolagem
   Desfavorecida"): Gente Feroz, Velocidade Serpentina, Força Horrenda, Grito de
   Triunfo. Mesmo critério das Virtudes — o que é opcional não dispara sozinho, e
   o app põe o texto e o contador na frente de quem decide. O teste garante que
   nenhum desses nomes apareça no handler.

   Só duas coisas o servidor faz sozinho, e as duas estão no livro em texto
   fechado: o gasto de 1 ponto para *ganhar (1d)* (oferecido como opção do
   ataque) e a **Exaustão sem pontos**.

3. **A sutileza da Exaustão.** "Se uma criatura começa uma rodada sem pontos de
   Ódio ou Resolução, ela é considerada Exausta." A tentação é derivar de
   `hate <= 0` na hora da rolagem — e estaria errado: o livro garante ao Mestre
   "o direito de fazer uso de uma Habilidade Sinistra mesmo quando ela exige o
   gasto do último ponto". Derivar na hora puniria exatamente esse gasto, na
   mesma rodada em que ele foi feito. Então a flag é gravada no token na **virada
   de rodada**, e o ataque só lê. O teste trava as duas metades: exige a leitura
   da flag *e* proíbe recalcular pelo Ódio.

   A Exaustão vale também para a **Proteção** do adversário — a condição não é
   privilégio do herói, e sem isso zerar o Ódio de um Troll não mudava nada na
   defesa dele.

4. **Bug de porteiro evitado.** O gasto de Ódio é ato do Mestre. O reflexo era
   usar `canBypassCombatTurn`, que é o guarda usado ao lado no mesmo arquivo —
   mas ele hoje é um **stub que devolve `false` sempre**, e o gasto simplesmente
   nunca funcionaria, em silêncio. Trocado por `canManageRoom`, com asserção
   nomeando o stub para ninguém voltar atrás.

5. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila ·
   `npm run test` verde com **1267 asserções**. As três asserções críticas foram
   conferidas quebrando de propósito: derivar Exausto na hora, usar o stub como
   porteiro, e o gasto sem permissão de Mestre — as três falharam como deviam.

**Falso alarme conferido:** o capítulo 8 traz "RESULTADOS DO DADO DE PROEZA PARA
ADVERSÁRIOS", que inverte os dois ícones especiais (Olho vira sucesso automático,
runa vira 0) e diz que o adversário causa Golpe Perfurante com "10 ou ⊘". Parecia
divergir do motor, que exige numeric 10. Mas o texto abre com "pode ser
considerado mais apropriado ao tema" — é variante opcional, não a regra padrão.
Nada a corrigir.

**Arquivos tocados:**
- `lib/vtt/types.ts` — `hate`, `hateMax`, `hateKind`, `fellAbilities`, `weary` no token
- `lib/character/um-anel/adversary-token.ts` — spawn copia o bloco inteiro
- `lib/room/handlers/tor-combat-attack.ts` — gasto opcional de Ódio (+1d), Exausto no ataque e na Proteção
- `lib/room/handlers/combat-turn.ts` — Exaustão marcada na virada de rodada, guardada por `rpgSystemId`
- `app/api/room/[roomId]/combat/attack/route.ts` — `torSpendHate` só pra quem gerencia a mesa
- `hooks/useRoomSync.ts` — `torSpendHate` no cliente
- `components/vtt/TorAttackPopup.tsx` — contador, caixa de gasto e lista das Habilidades Sinistras
- `components/vtt/TokenStatusBody.tsx` — contador no status do token
- `components/vtt/vtt.css` — `.vtt-inline-check` e `.vtt-fell-abilities`
- `scripts/verify-um-anel-odio.mjs` — **novo**, 40 asserções
- `package.json` — novo teste na suíte

**Como testar:** invocar um Rufião (Resolução 3) e atacar um herói marcando
"Gastar 1 de Resolução" — a mensagem tem de dizer o gasto e o contador cair pra
2. Zerar a Resolução e passar a rodada: na rodada seguinte ele fica Exausto e os
Dados de Sucesso de 1 a 3 passam a valer zero, tanto no ataque quanto na Proteção.

**Falta:** variante de NA 18; Elmo removível; Dano Especial (Quebrar Escudo,
Golpe Pesado, Perfurar, Agarrar); tarefas de combate (Intimidar Inimigo etc.);
converter as campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Posturas de Combate chegam à mesa (D17 sai do papel)

**Pedido:** continuar o loop.

**Passo a passo:**

1. **Diagnóstico.** `lib/combat/um-anel/stances.ts` estava pronto e testado desde
   o D17 — e era **código morto**. A palavra `stance` não aparecia em lugar
   nenhum de `lib/room/`: sem campo no token, sem rota, sem UI. Todo ataque
   resolvia como Aberta × Aberta, então Avançada, Defensiva e Retaguarda não
   existiam na prática. E o motor passava nos testes o tempo todo — teste de
   motor puro não pega fiação desligada, que era exatamente o problema.

2. **Decisão.** Campo `stance` **opcional** no token: quem foi gravado antes lê
   como Aberta, que é neutra em todos os modificadores, então nenhuma sala salva
   precisa de migração. O teste fixa essa neutralidade — se alguém der um bônus à
   Aberta, muda em silêncio o resultado de salas antigas.

   Rota própria `/tor-stance`, **sem** `requireRoomManage`: a postura é escolha do
   jogador ("todos os jogadores selecionam uma postura para seus heróis no início
   de cada rodada"), e exigir Mestre tiraria a decisão de quem joga. Quem valida é
   o handler, conferindo o dono da ficha. O `override` do requisito da Retaguarda
   ("o Mestre pode liberar por terreno") só é honrado para quem gerencia a mesa —
   sem isso um jogador burlaria o limite chamando a API direto.

3. **Implementação.** Token → rota → handler → motor, e agora `attackIsRanged`
   pode ser ligado, o que a rodada anterior tinha bloqueado de propósito. O
   seletor entra no popup de ataque com a tarefa de combate de cada postura, e a
   postura aparece no status do token — quem só olha o token precisa ver, senão
   descobre que o alvo estava em Retaguarda só quando o ataque é barrado.

   **Engajamento.** A Defensiva perde 1d por oponente que engaja. O livro trata
   engajamento de forma abstrata; aqui a mesa é posicional, então a leitura do app
   é **célula adjacente** — é a única definição observável no mapa. Sem ela a
   Defensiva não teria custo nenhum e seria estritamente melhor que a Aberta.

4. **Auditoria da rodada.** Três achados e um falso alarme evitado:

   - **Adversário com Arco não alcançava a Retaguarda.** `TorAdversaryAction` não
     distinguia alcance, então todo adversário contava como corpo a corpo — e o
     **Arqueiro Goblin** ficava sem poder atingir justamente o alvo que é o dele.
     Marquei as quatro ações de Arco do bestiário com `ranged`.
   - **"Preparar Disparo" × "Preparar Tiro".** O capítulo 6, que *descreve* a
     tarefa, usava um nome; o glossário, o compêndio, `stances.ts` e a Virtude
     Arco Mortal usavam outro — quem lesse a Virtude não achava a tarefa no
     capítulo. Mesma classe do "Porrete".
   - **Falso alarme conferido antes de virar bug:** os limites de engajamento
     (3 heróis por inimigo humano, 6 por inimigo grande) pareciam brigar com o
     "três aventureiros para um inimigo humano, cinco para um maior" do texto de
     Retaguarda. São regras diferentes — engajamento × relaxamento da Retaguarda.
     Nada a corrigir.

5. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila, com a rota
   `/api/room/[roomId]/tor-stance` registrada · `npm run test` verde com **1227
   asserções**.

**Erro cometido e contido:** ao marcar as ações de Arco, testei a asserção
negativa com um `sed` largo que casou `specialDamage: ["Perfurar"] }` em toda
ação — marcou Lança, Mordida e Presas como armas à distância. A asserção
"nenhuma ação corpo a corpo virou à distância" pegou na hora. Restaurei do git e
reapliquei com o script preciso (que aborta se não fizer exatamente 4 trocas).
É a terceira vez que um patch em massa por regex larga estraga um arquivo de
dados — o antídoto que funcionou de novo foi a asserção que vigia o lado oposto
da mudança.

**Arquivos tocados:**
- `lib/vtt/types.ts` — campo `stance` opcional no token
- `lib/vtt/tor-player-token.ts` — herói nasce em Aberta
- `lib/room/handlers/tor-stance.ts` — **novo**: troca de postura, permissão e requisito da Retaguarda
- `app/api/room/[roomId]/tor-stance/route.ts` — **novo**: rota (apelido como autor, nunca nome real)
- `lib/room/handlers/tor-combat-attack.ts` — posturas, alcance e contagem de engajadores no ataque
- `lib/character/um-anel/adversary-types.ts` — `ranged` na ação de adversário
- `lib/character/um-anel/adversaries.ts` — 4 ações de Arco marcadas
- `hooks/useRoomSync.ts` — `postRoomTorStance`
- `components/vtt/TorAttackPopup.tsx` — seletor de postura
- `components/vtt/TokenStatusBody.tsx` — postura no status do token
- `components/vtt/vtt.css` — `.vtt-field__hint`
- `livros/um-anel/06-fases-de-aventura-combate.md` — "Preparar Tiro"
- `scripts/verify-um-anel-posturas-mesa.mjs` — **novo**, 46 asserções (o caminho, não a tabela)
- `scripts/verify-um-anel-virtudes.mjs` / `verify-um-anel-glossario.mjs` — asserções atualizadas
- `package.json` — novo teste na suíte

**Como testar:** colocar dois heróis e três adversários no mapa. Tentar
Retaguarda com um herói só em corpo a corpo — tem de recusar dizendo quantos
faltam. Pôr dois em corpo a corpo e o terceiro consegue recuar. Atacar o recuado
com um Rufião de espada: barrado. Atacar com o Arqueiro Goblin: passa.

**Falta:** Habilidades Sinistras; variante de NA 18; Elmo removível em combate;
converter as campanhas de 1ª edição; glyph da runa de Gandalf.

---

### 2026-08-08 — Virtudes entram nas rolagens + auditoria de terminologia (glossário e nomes de Virtude)

**Pedido:** continuar e criar um loop.

**Passo a passo:**

1. **Diagnóstico.** `sheet.virtues` era uma lista de ids decorativa: aparecia na
   ficha e nunca chegava a `rollTorCheck`. O caso que expôs o buraco é o Bilbo
   pré-gerado, que tem "Certeiro no Alvo" ("todos os seus ataques à distância são
   Favorecidos") e atirava de arco com rolagem normal — `dice.ts` tinha
   `favoured: false` fixo, com um comentário admitindo a pendência.

   Auditando em volta, apareceram cinco divergências que ninguém tinha conferido:

   - **Glossário nunca foi cruzado com o código.** `Might → Poder`, enquanto o
     capítulo 8, o bestiário, o token e a ficha usam **Vigor** — o Mestre lendo
     "criaturas com Poder 2 ou mais" não tinha como ligar ao "Vigor 2" do bloco do
     adversário. E `Rally Comrades → Reanimar Companheiros`, nome já corrigido em
     `stances.ts` numa rodada anterior: o glossário ficou sendo a última fonte do
     nome errado. Mais as posturas no masculino contra o feminino da UI.
   - **14 nomes de Virtude divergentes entre livro e app** — mesma classe do
     "Porrete" que motivou `verify-um-anel-equipamento.mjs`, agora em Virtudes:
     "MIRA CERTEIRA" (cap. 5) × "Certeiro no Alvo" (código e ficha do Bilbo no
     cap. 11); "RESISTENTE COMO RAÍZES ANTIGAS" (cap. 5) × "Duro como Raiz de
     Árvore Velha" (cap. 12) × "Duro como Raiz Velha" (código) — **três** nomes
     para a mesma Virtude; "PERÍCIA DOS ELDAR" (cap. 10) × "Habilidade dos Eldar"
     (código), sendo que "Habilidade" já é Habilidade Sinistra.
   - **Virtude Cultural sumia da ficha.** `TorCharacterSheetView` resolvia só
     contra `STARTING_VIRTUES` e o `filter(Boolean)` engolia o que não achasse.
   - **PDF imprimia o id cru** ("agilidade-de-aparar") em Virtudes e Recompensas,
     enquanto a tela mostrava o nome.
   - **Bônus fixos de Esperança das Virtudes Culturais** não eram somados: quatro
     delas dizem literalmente "aumente sua Esperança máxima em 1", e o herói ficava
     1 abaixo do livro — o que também desloca o limiar de Desfavorecido, que usa
     `hopeMax`.

2. **Decisão.** Módulo novo `virtues.ts` com uma função pura que recebe os ids e o
   contexto da rolagem. Só entram as Virtudes cujo gatilho o servidor decide
   sozinho. Ficam de fora, com teste que garante isso:

   - as **opcionais** ("uma vez por combate, você PODE tornar Favorecida") —
     ligar automaticamente queimaria o uso do jogador sem ele pedir;
   - as que dependem de **circunstância narrada** (estar no escuro, subterrâneo);
   - as que dão **Inspirado**, que não é Favorecida — Inspirado dobra o bônus de
     Esperança (*ganha (2d)* em vez de *(1d)*, cap. 2). Confundir os dois daria um
     segundo Dado de Proeza a quem só tem direito a Dados de Sucesso extras.

   Nos nomes divergentes, o critério foi a consistência com o vocabulário já
   estabelecido, caso a caso: doze foram para o nome do app (é o que o jogador vê
   no compêndio, na ficha e nos pré-gerados, e o cap. 11 já usava), e dois foram
   para o do livro — "Estranho como **Notícias** de Bri" porque o dito é citado
   assim no próprio capítulo, e "**Perícia** dos Eldar" porque Skill = Perícia no
   glossário. Os `id` não mudaram: são chave estável e renomear quebra ficha salva.

3. **Implementação.** `torVirtueRollEffect(virtueIds, ctx)` cobre Certeiro no Alvo
   (ataque à distância), Matador de Dragões (alvo com Vigor ≥ 2), Duro como Pedra
   (Proteção, exceto Arrasado), Duro como Raiz Velha (Severidade da Ferida) e
   Contra o Invisível (Teste de Sombra por Pavor). O motor `resolve-attack.ts`
   ganhou `defenderProtectionFavoured` e `defenderWoundSeverityFavoured` como
   booleanos prontos — segue sem conhecer ficha. Quem decide é o handler, único
   lugar que conhece arma, ficha e alvo ao mesmo tempo. A Virtude que disparou vai
   no texto da mensagem: sem isso o chat diz "(Favorecida)" e ninguém na mesa sabe
   de onde veio.

4. **Validação.** `npx tsc --noEmit` limpo · `npm run build` compila · `npm run
   test` verde com **1175 asserções**. Os dois testes novos foram conferidos com
   asserção negativa: quebrei de propósito `attackIsRanged` e `baruk-khazad` e
   ambos falharam como deviam, depois reverti.

**Cuidado que evitou uma regressão:** `attackIsRanged` continua **desligado** de
propósito, com teste que falha se alguém ligar. Passá-lo hoje barraria **todo**
ataque de arco: a postura não é escolhida em lugar nenhum (D17 é motor isolado —
`stance` não aparece em `lib/room/`, não há campo no token nem UI), cai sempre em
Aberta, e `canAttackFromStance` responde "ataques à distância exigem a postura de
Retaguarda". A Virtude usa o mesmo dado (`weapon.ranged`) sem passar por esse
portão. Ligar os dois é a próxima rodada.

**Arquivos tocados:**
- `lib/character/um-anel/virtues.ts` — **novo**: Virtude → Favorecida por contexto, e resolução de nome de Virtude (inicial + Cultural)
- `lib/character/um-anel/dice.ts` — rolagem de Proficiência consulta as Virtudes; só Arcos conta como à distância na rolagem avulsa (Lanças têm arremesso opcional)
- `lib/character/um-anel/rules.ts` — soma o +1 de Esperança máxima das quatro Virtudes Culturais incondicionais; Alto Destino fica de fora por ser condicional
- `lib/character/um-anel/cultural-virtues.ts` — "Notícias de Bri" e "Perícia dos Eldar"
- `lib/combat/um-anel/resolve-attack.ts` — Proteção e Severidade aceitam Favorecida
- `lib/room/handlers/tor-combat-attack.ts` — calcula Favorecida do atacante e do defensor pelas Virtudes; nomeia a Virtude na mensagem
- `components/character/sheet/TorCharacterSheetView.tsx` — Virtude Cultural não some mais da ficha
- `components/character/TorSheetPdfDocument.tsx` — PDF imprime nome, não id (Virtudes e Recompensas)
- `livros/um-anel/00-glossario-termos.md` — Vigor, Reunir Companheiros, posturas no feminino
- `livros/um-anel/05-valor-e-sabedoria.md` — 12 títulos de Virtude alinhados; "Vigor (Might)"
- `livros/um-anel/12-o-mundo-eriador.md` — Pequeno Povo, Duro como Raiz Velha
- `scripts/verify-um-anel-virtudes.mjs` — **novo**, 142 asserções
- `scripts/verify-um-anel-glossario.mjs` — **novo**, 50 asserções
- `package.json` — os dois entram em `test` e `test:um-anel`

**Como testar:** criar um herói Hobbit com "Certeiro no Alvo", atacar de arco pela
ficha e conferir que a mensagem traz "(Favorecida) [Certeiro no Alvo]" e dois
Dados de Proeza. Um Anão com "Duro como Pedra" deve ter o Teste de Proteção
Favorecido — e perder isso ao ficar Arrasado.

**Falta:** posturas de combate chegarem à mesa (campo no token + UI + wiring, e
aí `attackIsRanged`); Habilidades Sinistras; variante de NA 18 como opção de
campanha; Elmo removível em combate; converter as campanhas de 1ª edição.

---

### 2026-08-04 — D19: Olho de Sauron e tengwa nas faces do dado 3D

**Pedido:** prosseguir.

**O bloqueio de arte era parcial, e a parte destravada foi feita.** Na rodada anterior registrei que os
glyphs do mini-dado **não exigem arquivo de arte**, porque `DiceWebGL` desenha as faces com `fillText`
num canvas — é tipografia. Agora está implementado: **Olho de Sauron (⊘) na face 11** do Dado de Proeza
e **tengwa élfico (ᛥ) na face 6** do Dado de Sucesso, os caracteres que o próprio livro traduzido usa.
"11" e "6" não significam nada no Um Anel.

**A runa de Gandalf (face 12) segue mostrando o número, de propósito.** O material extraído **não
especifica caractere** para ela — o livro dá ⊘ para o Olho e ᛥ para o tengwa, e nada para a runa.
Escolher um glyph seria inventar notação, e o Mestre não teria como saber que foi invenção. **Há teste
negativo específico** que falha se alguém acrescentar a entrada 12 sem a fonte passar a especificá-la.

**Dois pontos de desenho que valem registrar:**

1. **Passei um mapa de glyphs, não um nome de sistema.** `DiceWebGL` recebe
   `faceGlyphs?: Record<number, string>` e só sabe "nesta face, desenhe este caractere" — segue
   agnóstico de sistema de RPG. Quem decide é `torFaceGlyphs(sides)`, que devolve `undefined` para
   qualquer dado que não seja d12 ou d6, de modo que **um d20 do Eldarin nunca ganha Olho de Sauron**.
2. **A marcação do sistema ficou na ROTA, não no cliente.** A rota já tem a sala, então marca
   `system: room.rpgSystemId` em qualquer rolagem — cobre o Dado de Proeza anexado a mensagem de chat E
   as rolagens diretas de d6 do rolador, sem plumbing nenhum do lado do cliente.

**Dois detalhes que quebrariam silenciosamente e foram cobertos:** `faceGlyphs` entrou nas
**dependências dos dois efeitos** de `DiceWebGL` (sem isso, trocar de sistema não redesenha a textura e
o dado apareceria com número), e o **sublinhado de 6/9** — convenção de dado numérico para distinguir os
dois — deixou de ser desenhado quando a face leva glyph.

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (**942 asserções**, zero falhas) ·
`npm run build` compila. **5 testes negativos**, todos acusando: glyph inventado para a runa, glyph
vazando para d20 do Eldarin, `makeFaceTex` ignorando o glyph, `faceGlyphs` fora das deps, e a rota
deixando de marcar o sistema.

**D19 fechado até onde a fonte permite.** Falta apenas o glyph da runa de Gandalf, que depende de a arte
real chegar ou de a fonte especificar um caractere. As texturas do dice-box grande (combate do Eldarin)
seguem numéricas e não são usadas pelo Um Anel.

---

### 2026-08-04 — Fase J: aventuras do Starter Set (D31) + dados por sistema (D19 parcial)

**Pedido:** fazer a Fase J.

**D19 está bloqueado por ARTE, e isso foi apurado antes de codificar.** A cadeia do Dado de Proeza já
funciona ponta a ponta: `dice.ts` codifica Olho como face física 11 e Runa como 12, a rota do chat
converte `torFeatDie` em `roll: 1d12`, e o chat desenha o dado 3D. **O que falta é só a textura** — os
números estão assados nos PNGs do tema. Fazer Olho de Sauron e runa de Gandalf exige autorar imagem, e
há regra registrada do usuário: "Sem SVG temporário p/ ícones novos — esperar ícones reais do Midjourney".

Cheguei a criar um tema `um-anel` de dice-box para receber a arte, **e o removi**: descobri que as
rolagens do Um Anel vão para o mini-dado do chat (`DiceWebGL`, canvas `three`), e o dice-box grande só
serve ao combate do Eldarin. O tema não teria consumidor — seria config morta apresentada como progresso.

**O que fechou de D19, sem arte:** o rolador da mesa passou a respeitar o sistema. Em sala do Um Anel os
atalhos são **Dado de Proeza (1d12) e Dados de Sucesso (1d6 a 6d6)**; d20, d10, d8 e d4 **não existem no
sistema** e ofereciam ao Mestre um dado que nenhuma regra do livro usa. `verify-um-anel-dados.mjs` (28
asserções) proíbe o retorno deles e trava o mapeamento valor-de-jogo × face-física (Olho vale 0 e mostra
face 11; Runa vale 10 e mostra face 12).

**Caminho restante de D19, documentado no teste:** o mini-dado desenha faces com `fillText`, então os
glyphs **não exigem arquivo de arte** — exigem (a) um marcador de sistema do chat até `makeFaceTex`, que
hoje não existe, e (b) decidir o caractere da runa de Gandalf, que **o material extraído não
especifica** (o livro dá ⊘ para o Olho e ᛥ para o tengwa, e nada para a runa). Não escolhi um por chute.

**D31 mudou de plano com base na fonte.** O plano dizia converter *Tales from Wilderland* e *The
Darkening of Mirkwood*, ambas 1ª edição. Mas o acervo tem `TOR_Starter_Set_The_Adventures.pdf`, que é
**2ª edição — compatível direto, zero risco de conversão**. Extraí essa primeiro.

**`livros/um-anel/14-aventuras-starter-set.md`** (novo): as **cinco aventuras** completas em PT-BR, com
todas as cenas, todas as rolagens nomeadas, as tabelas e os epílogos — *Uma Conspiração das Mais
Rachadas*, *Caçadores de Tesouro Experientes*, *Fogos de Artifício Mais Excelentes*, *Carteiros
Involuntários* e *Para Acalmar uma Fera Selvagem* — mais a ordem encadeada que a introdução define.

**Três adversários novos** saíram das aventuras: **Jack, o Troll de Pedra** (Nível 8, Resistência 34),
**Veterano Orc** (Nível 4, Resistência 16) e **Fera Queimada** (Nível 5, Resistência 20, aparece em
**par**). Entraram com as habilidades de família das respectivas famílias — Trolls com Rijeza Hedionda e
Cabeça-dura, Orc com Odeia a Luz do Sol — evitando na entrada a lacuna que a rodada anterior corrigiu em
7 blocos.

**Formato simplificado, registrado em vez de preenchido por chute:** os blocos das aventuras **não
trazem Vigor, Ódio/Resolução nem Traços**. Vigor ausente virou **1** (o padrão do motor) e o Ódio foi
derivado do Nível de Atributo, que é a convenção do próprio livro nos blocos completos. O teste trava
`might: 1` para os três, justamente para ninguém subir por intuição.

**Divergência da fonte registrada:** o livro de aventuras diz **nove** pré-gerados; o livreto de fichas
traz **oito**, e `pregens.ts` implementa oito. Os seis Hobbits iniciais + Balin + Bilbo dão oito — o
nono não aparece em nenhum dos dois materiais extraídos.

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (**923 asserções**, zero falhas) ·
`npm run build` compila. **5 testes negativos**, todos acusando. O harness de negativos agora proíbe
string vazia e aborta acima de 200 KB — a proteção que entrou depois de eu ter destruído
`adversaries.ts` na rodada anterior.

**Falta:** os glyphs do mini-dado (precisa do marcador de sistema + decidir o caractere da runa);
converter *Tales from Wilderland* e *The Darkening of Mirkwood* de 1ª edição; e as lacunas funcionais
já registradas (Virtudes fora das rolagens, variante de NA 18, Elmo removível, Habilidades Sinistras não
mecanizadas).

---

### 2026-08-04 — Auditoria campo a campo do bestiário (D20): 21 blocos, 37 divergências

**Pedido:** mini loop — um workflow, um commit, parar.

**Workflow de 152 agentes** (5 auditores de família + 147 refutadores) conferiu **os 21 blocos do Livro
Básico campo a campo**: traços, Nível de Atributo, Resistência, Vigor, Ódio/Resolução, Bloqueio,
Armadura, as duas Proficiências de Combate (graduação, Dano, Ferimento, Dano Especial) e as Habilidades
Sinistras. **49 candidatas → 37 confirmadas, 12 refutadas.**

**Todos os números batem.** Nenhum Dano, Ferimento, Resistência, Vigor, Ódio, Bloqueio ou Armadura
divergiu em nenhum dos 21 blocos, nem nenhuma graduação de Proficiência. O mapeamento Bloqueio "–" para
`parry: 0` está correto em todos os casos, e `hateKind` acerta os 21 (Resolução para Homens Maus,
Ódio para o resto). As 37 divergências são de **nome e de texto**, não de mecânica.

**Textos que mudavam o que acontece na mesa (4):**
1. **Imorredouro sem a cláusula de família** em 2 dos 3 Mortos-vivos: "ineficaz contra arma mágica
   encantada pra Perdição dos Mortos-Vivos" é a **única contrapartida dos jogadores** contra a
   ressurreição. `barrow-wight` já tinha o texto completo — inconsistência interna.
2. **Cabeça-dura omitia "como ação principal da rodada"**, que é o único custo da tarefa: o Mestre podia
   deixar o herói rolar ENIGMA de graça. Os outros 3 Trolls tinham o texto certo.
3. **Ferida Mortal com "Desfavorecida" no substantivo errado** — no livro é a *rolagem* do Dado de
   Proeza que é Desfavorecida; o código lia como se existisse "Ferida Desfavorecida".
4. **Espectro Funesto com "Lâmina Cravejada"** onde o livro diz "Lâmina Corroída" — e o próprio arquivo
   já usava "Lâmina Corroída" com estatísticas idênticas no bloco da Elwen.

**Política de nomenclatura decidida e travada em teste.** 33 das 37 eram nome. Regra:
- **Habilidade Sinistra e nome de exibição: vence o LIVRO** (precedente já aceito em Rijeza Hedionda,
  Cabeça-dura, Infundir Medo, Tumulário). Renomeados: Habitante das Trevas, Imorredouro, Força Horrenda,
  Couro Grosso, Ódio Mortal (Anões), Gente Feroz, Veneno de Orc; e Saqueador Sulista, Campeão Sulista,
  Salteador, Chefe dos Rufiões, Ladrão de Estrada, Cão de Sauron, Chefe dos Lobos. Os `id` ficam
  inalterados — são chave estável.
- **Traço: vence o rótulo canônico de `data.ts` quando existe; senão, o livro.** "Precavido" e "Sombrio"
  não existem em `data.ts` (o canônico é Cauteloso e Severo, que é o que o livro usa) — o código era o
  outlier. Já **"Veloz" e "Cruel" SÃO canônicos e o livro é que difere** ("Rápido", "Vicioso"): ali o
  código fica, e o teste trava isso pra que ninguém "corrija" pro livro sem discutir.

**Rejeitada explicitamente:** "Ferozes, Furtivos" (plural) nos Habitantes do Pântano — o plural concorda
com o nome plural da criatura, e `traits` é texto de sabor.

**Dois erros meus nesta rodada, ambos consertados:**
1. Um patch em massa casou o bloco errado e **apagou a imunidade a Intimidar Inimigo da Elwen** — ela
   combina Imorredouro e imunidade no mesmo texto, sem "Sem Coração" separado. Restaurada, e agora há
   asserção específica pra isso não repetir.
2. **O harness de teste negativo destruiu `adversaries.ts`**, inflando de 33 KB para 2,5 MB: usei string
   vazia como valor "ruim", e `split("")` quebra em caracteres, reinserindo o texto entre cada um.
   Restaurado do commit e reaplicado. O harness agora **proíbe string vazia** e aborta se o arquivo
   passar de 200 KB — simular remoção usa marcador, não `""`.

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (**895 asserções**, zero falhas) ·
`npm run build` compila. **8 testes negativos**, todos acusando.

**D20 fechado:** os 21 blocos do Livro Básico estão conferidos campo a campo, mais os 3 de Eriador e a
Elwen. Falta na Fase J: dados 3D com faces do Um Anel (D19) e aventuras (D31 — 1ª edição, converter não
copiar).

---

### 2026-08-04 — Pendência do filtro de Cultura + Fase J começa (3 adversários de Eriador)

**Pedido:** loop contínuo. Rodada sem workflow, de propósito: a fase que precisava de leque
multi-agente (auditoria dos 4 capítulos densos) terminou, e adicionar 3 blocos de bestiário e um filtro
de UI é trabalho serial. Lançar 40 agentes aqui seria desperdício.

**1. Honrada a pendência que eu mesmo registrei.** O editor de equipamento da ficha listava as 16 armas
e os 3 escudos **sem** os filtros de Cultura que o wizard aplica — depois da criação, um Anão equipava
Grande Escudo e um Hobbit um Grande Machado. **Naugrim** e **Pequenos** são proibições permanentes, não
regras só de criação, e a Carga e o Bloqueio recalculados em `normalize` entravam com o número errado no
token de combate.

Novo `weaponsForCulture()` em `data.ts` (o `weaponsForProficiency` existente serve ao wizard, que
escolhe uma arma por Proficiência; a ficha precisa da lista completa). Duas camadas:
- o `<select>` passou a listar só o permitido;
- **e `addWeapon()` ganhou guarda própria** — filtrar só a UI deixaria a porta aberta pra um id antigo
  ou forjado equipar arma vetada. Filtro de `<select>` é UI; regra tem de estar em quem grava.

**2. Fase J começou: os 3 adversários nomeados de Eriador.** Estavam traduzidos em
`12-o-mundo-eriador.md` e não existiam no bestiário:
- **Rei-Tumulário** (Chefe, Nível 9, Resistência 45, Vigor 2, Proteção 4) — com as **três habilidades de
  Mortos-vivos** de família além das quatro do próprio bloco. O Bloqueio "–" do livro virou 0.
- **Búrzgul** (Elite, Nível 5, Resistência 22, Bloqueio +3) — Cacique Orc do Portão dos Goblins.
- **Ash** (Elite, Nível 4, Resistência 20) — o Warg dele, com **Grande Salto** de família.

`id` em inglês (chave estável — renomear quebraria salas salvas), `name` em PT-BR (aparece no nameplate
do token).

**Overbear não foi mecanizado.** O "Sobrepujar" do Búrzgul entra como texto de Dano Especial sempre
disponível, porque o efeito de *Overbear* **não está definido em nenhum ponto do material extraído** —
já registrado no markdown. Inventar um efeito criaria regra falsa indistinguível das verdadeiras.

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (**775 asserções**, zero falhas) ·
`npm run build` compila. **4 testes negativos**: tirar o filtro, tirar a guarda de `addWeapon`, errar a
Resistência do Rei-Tumulário ou tirar o Grande Salto do Ash faz o teste correspondente acusar.

**Falta na Fase J:** auditar campo a campo os 21 blocos do Livro Básico contra o capítulo 8 (partição
pronta, 6 famílias); dados 3D com faces do Um Anel (D19); aventuras (D31 — *Tales from Wilderland* e
*Darkening of Mirkwood* são 1ª edição, converter não copiar). Lacunas funcionais registradas: Virtudes
não entram nas rolagens; variante de NA 18 como opção de campanha; Elmo removível em combate;
Habilidades Sinistras não mecanizadas.

---

### 2026-08-04 — Auditoria dos capítulos 3 e 8 CONCLUÍDA: 11 divergências, 11 correções

**Pedido:** loop contínuo, opção A — fechar a auditoria de regra dos 4 capítulos densos.

**Com isso os 4 capítulos densos estão auditados.** 13 candidatas → **11 confirmadas, 2 refutadas**.
O capítulo 8 rendeu onde eu havia apostado: o bestiário, que tinha cobertura de teste quase nula.

**O achado mais grave: Vigor era ignorado no combate.** O livro diz que "o Vigor indica o número de
Ferimentos necessários para abater um inimigo de vez", e o campo `might` existia nos 22 blocos — mas
nunca era copiado para o token, e o motor eliminava QUALQUER adversário no primeiro Ferimento. Os 8
adversários de Vigor 2 morriam com metade do necessário: o **Grande Troll das Cavernas (Resistência 80,
Proteção 3d) saía do combate num único Golpe Perfurante**. Corrigido com `might` e `wounds` no token, a
decisão de abate no motor puro (que conhece Vigor e Ferimentos anteriores) e o `vitals` apenas contando
— uma implementação da regra, não duas.

**Habilidades de família não propagadas (7 blocos).** O livro diz "todos" para cada uma:
- 3 dos 4 Trolls sem **Rijeza Hedionda** (que na prática dobra a Resistência) e **Cabeça-dura**;
- os 3 Mortos-vivos sem **Infundir Medo** — a principal fonte de Sombra da família, 3 pontos de Pavor
  em todos os heróis à vista;
- o **Cão de Sauron** sem **Grande Salto**, justamente o mais perigoso da família (Vigor 2, Nível 5).
  Sem ela, a postura de Retaguarda virava esconderijo seguro contra ele.

**Nomes de Habilidade Sinistra que não existem no livro** — achado meu, no scan, não dos agentes: o app
mostrava "Resistência Hedionda", "Obtuso" e "Golpe de Pavor" onde o livro diz **Rijeza Hedionda**,
**Cabeça-dura** e **Infundir Medo**. Mesmo modo de falha do bug de "Reanimar Companheiros": o Mestre
procura a habilidade no livro pelo nome que o app exibe e não encontra.

**Criação de personagem (capítulo 3), 5 correções:**
1. **Proficiência de Combate 2+1 = 3.** A escolha A usava `Math.max(…, 2)` e a B `+= 1` — escolher a
   MESMA Proficiência nas duas dava graduação 3 de graça, o mesmo degrau que custaria 6 dos 10 pontos
   de Experiência Prévia. A Cultura **copia** graduações da tabela, não incrementa.
2. **Virtude inicial não somava nas derivadas.** Herói criado com Confiança ficava com Esperança máxima
   2 abaixo do livro — e o limiar de Desfavorecido, que usa `hopeMax`, saía errado junto. As fichas do
   Starter Set dizem "já contado no total" justamente porque a derivada é anotada com o efeito.
3. **Campeão saía com 4 Traços Distintivos em vez de 3**, gravando o genérico e o especializado.
4. **+1 de Atributo amarrado ao id `rangers`** — os Altos-Elfos de Valfenda, cuja Bênção tem a mesma
   mecânica, perdiam o ponto (e com ele 1 de NA e 1 na derivada). Virou flag `blessingAttributeBonus`.
5. **Traço dos Hobbits exibido como "Meios-Homens"**, string que não existe em `livros/um-anel/`. O
   livro chama de **Pequenos**.

**Refutadas (2):** "Reforçado Superior substitui o +2" e "todos os Orcs têm Odeia a Luz do Sol", ambas
2/3.

**Guarda nova: `scripts/verify-um-anel-bestiario.mjs`** (34 asserções) — trava o Vigor nos cinco pontos
da cadeia (tipo do token, criação, motor, handler, vitals), exige as habilidades de família em todos os
blocos de cada família, e proíbe o retorno dos nomes que não existem no livro.

**Não corrigido, e por quê:** o editor de equipamento da ficha (`TorCharacterSheetView.tsx`) lista as 16
armas e os 3 escudos **sem** aplicar os filtros de Cultura que o wizard usa — depois da criação, um Anão
consegue equipar Grande Escudo e um Hobbit um Grande Machado, e os números errados entram no token via
`normalize`. É divergência confirmada 0/3, mas o conserto é UI num componente grande e fica para a
rodada seguinte, não por esquecimento.

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (**735 asserções**) · `npm run build`
compila. **7 testes negativos** novos: reintroduzir cada correção faz o teste acusar.

**Falta:** o filtro de Cultura no editor de equipamento; e a Fase J (bestiário completo com os 3
faltantes, dados 3D, aventuras).

---

### 2026-08-04 — Auditoria dos capítulos 4 e 6: 12 divergências, 12 correções

**Pedido:** listar as melhores alternativas e já executar a melhor. Escolhida a **opção A** — fechar a
auditoria de regra dos 4 capítulos densos, que nunca foram confrontados com o código.

**Verificação adversarial: 13 candidatas → 12 confirmadas, 1 refutada.** Taxa muito acima da rodada 6
(onde 5 de 9 caíram), e por um motivo concreto: `04` e `06` são os dois capítulos mais densos em regra
e **nunca tinham sido auditados**. A rodada 6 cobria capítulos cujas regras já haviam passado por
revisão indireta via o capítulo 9 (o resumo condensado do Starter Set).

**Bugs de motor (5):**

1. **`attackerIllFavoured` nunca era preenchido** (`tor-combat-attack.ts`) — **TERCEIRO sítio** da
   confusão Arrasado × Desfavorecido, que eu já havia declarado resolvida duas vezes. O campo existia
   em `TorAttackParams` e já era usado na rolagem, mas o handler só preenchia o do DEFENSOR: o mesmo
   herói ficava Desfavorecido ao se defender e **não ao atacar**. Confirmado por leitura própria, antes
   dos agentes. O teste agora tranca os **três** sítios juntos.
2. **Terreno de jornada virava Favorecida/Desfavorecida** (`journey.ts`) em vez de ±1 Dado de Sucesso.
   O livro dá *perde (1d)* / *ganha (1d)*, e o capítulo 2 separa as duas mecânicas de propósito. Havia
   um segundo dano: quem mexe no Dado de Proeza é a **Região**, e Favorecida + Desfavorecida se
   **cancelam** — então uma estrada em Terras Sombrias apagava a penalidade da Região.
   **Duas asserções antigas trancavam a regra errada** e foram substituídas: um teste que fixa o
   comportamento errado é pior que nenhum, porque defende o bug.
3. **Desastre do conselho sem o gatilho de zero sucessos** (`council.ts`). O livro dá dois gatilhos
   independentes; só o segundo estava implementado. Companhia que abre bem o conselho e depois falha em
   TODAS as tentativas recebia "fracasso" onde o livro manda Desastre.
4. **`shieldParryBonus` persistido em vez de derivado** (`normalize.ts`). A Carga já era recalculada de
   `armour`, mas o bônus de escudo ficava guardado e só a criação o escrevia — trocar de escudo deixava
   o Bloqueio com o bônus do escudo **antigo**.
5. **Nomes de arma e armadura divergindo entre capítulos.** O capítulo 6 chamava de "Porrete" a arma de
   Dano 3, enquanto o capítulo 3 e o código usam esse nome para a de Dano 4. **Mesmo nome, arma
   diferente** — um Mestre cruzando os capítulos aplicaria o dano errado. Sete itens alinhados no
   capítulo 6 (Cacete/Porrete, Cota de Malha/Sobretudo de Malha, Camisa e Couraça de Couro, Grande
   Lança/Machado/Arco). A causa raiz é estrutural: **capítulos traduzidos por agentes diferentes
   escolhem palavras diferentes para o mesmo termo.**

**Bugs de texto (5)** — o app *dizia* a regra errada: o PDF rotulava o Número-Alvo como "ND"
(vocabulário do outro sistema do repo) e imprimia o Bloqueio **sem** o modificador do escudo, então o
bônus não aparecia em nenhum número da ficha que o jogador leva pra mesa; o compêndio chamava a
Proficiência das armas de briga de "Desarmado", falso para Adaga/Cacete/Porrete e escondendo a regra
que importa; a doc do flag `weary` descrevia "Fadiga ≥ Resistência atual" — o bug já corrigido escrito
ao contrário, a 30 linhas do código certo, convidando alguém a "consertar" o código pra bater com o
comentário; e a doc de `injury` de adversário chamava o valor de limiar do Golpe Perfurante, quando é o
NA do Teste de Proteção.

**Guarda nova contra a causa raiz: `scripts/verify-um-anel-equipamento.mjs`** (121 asserções). Cruza as
tabelas de arma e armadura do livro com `data.ts` em três direções: números iguais para o mesmo nome;
nenhum nome significando duas coisas entre capítulos; e — o furo que eu tapei depois de ver que o teste
passava em branco no couro — **item com os mesmos números sob nome diferente**, detectado pelos números
em vez do rótulo.

**Refutada (1):** o nome da tarefa de combate da Retaguarda ("Preparar Disparo" vs "Preparar Tiro"),
derrubada 3/3.

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (**694 asserções**) · `npm run build`
compila. **7 testes negativos**: reintroduzir cada bug faz o teste correspondente acusar, nenhum passa
em branco.

**Falta:** auditar `03-aventureiros` e `08-mestre-e-adversarios` (traduzidos, sem auditoria) e a Fase J
inteira.

---

### 2026-08-04 — Fase B CONCLUÍDA: 13/13 capítulos do Um Anel em PT-BR

**Pedido:** continuar o loop e subir o que estiver feito.

**Feito:** traduzidos os dois últimos e maiores capítulos — `03-aventureiros` (1159 linhas) e
`08-mestre-e-adversarios` (1780 linhas). Com isso a **Fase B fecha em 13 de 13 capítulos**.

1. **O modo de falha invertido funcionou.** Depois de a rodada 7 perder dois capítulos por truncamento,
   os tradutores passaram a escrever em `.tmp-traducao/`, nunca sobre o original. Ambos entregaram
   estrutura **exata**: `03` com 119 headings e 221 linhas de tabela, `08` com 69 e 285 — os mesmos
   números do inglês. Só então movi para `livros/`. `.tmp-traducao/` entrou no `.gitignore`, porque eu
   uso `git add -A` e rascunho de tradução não pode virar commit por descuido.

2. **Verificação antes de mover, não depois.** Conferi headings, linhas de tabela, ausência do marcador
   de pendência e proporção de palavras funcionais portuguesas (1628 em `03`, 3304 em `08`, contra 1
   palavra inglesa em cada) antes de tocar em `livros/`.

3. **Armadilha do pipeline, terceira e última cobrança.** Traduzir `08` quebrou 2 asserções e traduzir
   `03` quebrou **20** — este último porque `verify-um-anel-pregens.mjs` fazia *parsing* do capítulo com
   âncoras inglesas (`## Hobbits of the Shire`, `| Endurance | STRENGTH + 18 |`, `### Attributes`).

   Em vez de só traduzir as âncoras, **tornei o parsing orientado a dados**: o mapa de Culturas agora é
   derivado do campo `name` de `data.ts`, com os nomes em inglês como alternativa. Isso resolve duas
   coisas de uma vez — acompanha futuras traduções sozinho, e passa a **exigir que o heading do livro e
   o rótulo exibido no app sejam a mesma string**, acusando renomeação feita só num lado. Os rótulos das
   tabelas ficaram bilíngues (`Resistência|Endurance`, `FORÇA|STRENGTH`, …).

**Teste negativo:** corromper `enduranceBonus` dos Hobbits de 18 para 19 produz 8 falhas — a checagem da
Cultura mais as 7 Resistências dos pré-gerados Hobbit. O parser está lendo o livro PT-BR de verdade, não
passando por vacuidade.

**Arquivos tocados:**
- `livros/um-anel/{03-aventureiros,08-mestre-e-adversarios}.md` — traduzidos, marcadores removidos
- `scripts/verify-um-anel-pregens.mjs` — parsing orientado a `data.ts` e rótulos bilíngues
- `scripts/verify-um-anel-stances.mjs` — 2 asserções do capítulo 8 reancoradas bilíngues
- `.gitignore` — `.tmp-traducao/`

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (**573 asserções**) · `npm run build` compila.

**Falta:** auditoria de regra de `03`, `04`, `06` e `08` — os quatro capítulos mais densos, traduzidos
mas ainda não confrontados com o código (o workflow em curso cobre `04` e `06`). Depois, a Fase J
inteira: bestiário completo (D20), dados 3D (D19), aventuras (D31).

---

### 2026-08-04 — Fase B, rodada 7: 2 capítulos + bônus de Yule por herói + guarda de truncamento

**Pedido:** loop contínuo, workflow por rodada, verificação adversarial antes de tocar em produção.

**Resultado parcial, e o motivo.** O workflow de 4 capítulos bateu no **limite de sessão** e perdeu 4
de 6 agentes. Entregue: `04-caracteristicas` (610 linhas, 22/22 headings) e `06-fases-de-aventura-combate`
(1164 linhas, 48/48). Perdidos: as traduções de `03-aventureiros` e `08-mestre-e-adversarios`, e as
auditorias de 04 e 06. **Restam 2 capítulos traduzidos de 13, e 2 traduzidos mas ainda não auditados.**

1. **Os dois capítulos mortos ficaram TRUNCADOS no working tree** — `03` com 487 linhas de 1160 (58 de
   119 headings) e `08` com 330 de 1779 (13 de 69). Esses arquivos são a fonte da verdade das regras:
   commitar assim apagaria metade das regras sem quebrar nenhum gate. Restaurados de `HEAD` antes de
   qualquer outra coisa.

2. **Guarda permanente contra isso: `scripts/verify-um-anel-traducao-completa.mjs`.** Compara a
   contagem de **headings** e de **linhas de tabela** de cada capítulo com a versão do commit anterior.
   Heading é métrica melhor que linha porque sobrevive à variação natural de comprimento entre inglês e
   português. Também checa que, removido o marcador de pendência, o corpo está de fato em PT-BR (conta
   palavras funcionais portuguesas) — pega o caso "removeu o marcador e deixou o texto em inglês".
   Uma tradução que resume em vez de traduzir é a falha mais perigosa da Fase B: ela não quebra nada
   visivelmente, só apaga regras.

3. **Bônus de Perícia do Yule agora é por herói.** Era a divergência confirmada 3/3 que ficou em aberto
   na rodada 6. `TorFellowshipProgress` guardava um `witsScore` único pra Companhia inteira; o livro dá
   a cada herói pontos iguais à ASTÚCIA **dele**. Numa Companhia mista (Bardo 3, Anão 4, Elfo 7,
   Hobbit 6) o número único errava a maioria, todo ano. Agora `heroes: TorFellowshipHero[]`, com o
   tamanho da Companhia derivado de `heroes.length` — some o segundo campo que podia discordar.
   `advanceTorCalendar` devolve `bonusSkillPointsByHero`, e o anúncio no chat nomeia quem recebeu o quê.
   `normalizeHeroes` migra sala gravada por versão anterior, preservando os números que estavam lá.

4. **Defeito de portabilidade nos testes, encontrado por acidente e real.** Ao restaurar `03` do git, o
   arquivo voltou com **CRLF** e 20 asserções caíram: âncoras como `\n## Título\n` não casam quando vem
   `\r` antes do `\n`. Isso significa que **qualquer clone novo no Windows** (ou qualquer checkout com
   `core.autocrlf`) faria a suíte falhar — os greens anteriores eram artefato de as ferramentas que
   escreveram os arquivos usarem LF. Os 14 testes que casam conteúdo passaram a normalizar CRLF → LF na
   leitura. Comparar conteúdo não deve depender de fim de linha.

5. **Erro meu no caminho, e como foi consertado.** O primeiro patch em massa dos 14 testes os
   corrompeu: a string de substituição continha a sequência dólar-backtick, que em `String.replace`
   significa "o texto antes do match" — o cabeçalho de cada arquivo foi reinjetado no meio do bloco
   novo, e os `\n` escapados viraram quebras de linha reais dentro do literal do regex. Reparado com um
   script que localiza o bloco corrompido pelo marcador e o substitui por uma versão correta,
   preservando a linha de import (inclusive onde importa `readdirSync` junto).

**Reancoragens da armadilha do pipeline:** traduzir 04 e 06 quebrou 3 asserções que citavam o inglês
deles (`verify-um-anel-stances.mjs` no Golpe Perfurante; `verify-um-anel-sheet-conditions.mjs` em
Exausto e Fadiga). Todas reancoradas em regex **bilíngue**, que aceita as duas formas e continua
acusando se a REGRA mudar.

**Arquivos tocados:**
- `livros/um-anel/{04-caracteristicas,06-fases-de-aventura-combate}.md` — traduzidos
- `lib/combat/um-anel/session-state.ts` — `TorFellowshipHero`, `heroes[]`, `normalizeHeroes` com migração
- `lib/combat/um-anel/progression.ts` — `bonusSkillPointsByHero`, anúncio nominal
- `components/vtt/TorFellowshipPanel.tsx` — lista de heróis (nome + Astúcia) no lugar dos dois campos
- `scripts/verify-um-anel-traducao-completa.mjs` — **novo**, guarda de truncamento
- 14 `scripts/verify-*.mjs` — normalização de CRLF na leitura
- `scripts/verify-um-anel-{stances,sheet-conditions}.mjs` — reancoragem bilíngue
- `scripts/verify-um-anel-{session-state,progression}.mjs` — asserções do bônus por herói
- `package.json` — o novo guard entrou nos dois scripts de teste

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (**567 asserções**) · `npm run build`
compila. A correção de CRLF foi provada com `03-aventureiros.md` ainda em CRLF: o teste que falhava 20
vezes passa 79/79 sem tocar no arquivo.

**Falta:** traduzir `03-aventureiros` (1160) e `08-mestre-e-adversarios` (1779); auditar `04` e `06`,
que estão traduzidos mas sem auditoria; e a Fase J inteira.

**Como testar:** `npm run test:um-anel`

---

### 2026-08-04 — Fase B, rodada 6/12: 3 capítulos em paralelo (workflow) + 6 bugs de regra

**Pedido:** loop contínuo, com ultracode ligado — orquestrar com workflow e verificar divergências
adversarialmente antes de tocar em código.

**Como foi feito (mudança de método):** um workflow de **33 agentes** traduziu `09-starter-set`,
`07-fases-de-companhia-jornada` e `05-valor-e-sabedoria` em paralelo; cada capítulo foi auditado assim
que sua tradução terminou (pipeline, sem barreira); e **cada divergência candidata enfrentou 3
refutadores com lentes distintas** — leitura-do-livro, leitura-do-código e consequência-numérica —
com padrão "refutada = true". Os auditores só relatam; todas as edições de código foram feitas por mim,
serializadas, depois da verificação.

**Resultado da verificação adversarial: 9 candidatas → 4 sobreviveram, 5 refutadas (56% mortas).**
A proporção bate com o histórico de falsos alarmes do projeto e valida o desenho: sem essa camada, 5
mudanças desnecessárias teriam entrado em código de produção.

**Bugs corrigidos (6):**

1. **Ataques de Briga rolavam rank 0** (`tor-combat-attack.ts`). O livro manda rolar a Proficiência de
   Combate **mais alta** do herói perdendo (1d); o código fixava 0 para as 4 armas de briga
   (Desarmado, Adaga, Cacete, Porrete). Com rank 0 o total máximo é 10, abaixo de qualquer NA de FORÇA
   típico (18 + Bloqueio) — **a chance de acerto ia a zero fora da Runa de Gandalf**, e o herói também
   perdia toda chance de ícone de Sucesso, logo de Dano Especial. Corrigido com `torBrawlingRank()`.
2. **Teto da ASTÚCIA no bônus de Yule** (`session-state.ts`). `normalizeFellowship` clampava em 6, mas
   os arrays de Atributo de `data.ts` dão ASTÚCIA 7 a Elfos de Lindon, Hobbits do Condado e
   Altos-Elfos. O 7 digitado voltava 6 do normalizador: cada herói perdia 1 ponto de Perícia por ano.
   O teste amarra o teto ao maior `argucia` de `data.ts`, então um suplemento com 8 acusa sozinho.
3. **Virtude Mão Firme perdia metade do efeito** (`data.ts`). Guardava só "+1 ao dano de um Golpe
   Pesado" e apagava "+1 ao resultado numérico do Dado de Proeza em um Golpe Perfurante" — a metade
   que mais pesa, porque leva um 9 a 10 e dispara o Golpe Perfurante.
4. **Recompensa Cruel perdia a cláusula de mão-e-meia** (`data.ts`) — afeta as 3 armas com dois
   valores de Ferimento (espada longa, lança, machado de cabo longo).
5. **Confiança e Robustez diziam "sua Esperança/Resistência"** em vez de "seu valor **máximo**"
   (`data.ts`) — é o que distingue o máximo do atual.
6. **`healTorShadowScar` não cobrava os 5 pontos de Aventura** (`shadow.ts`). Código morto hoje, então
   nenhuma Cicatriz saiu de graça em mesa — mas quem fosse ligá-la entregaria a Empreitada sem cobrar.
   Corrigido antes de existir chamador, que é a hora barata.

**Onde discordei dos refutadores.** Os itens 4 e 5 foram **refutados 3/3**, com o argumento — factualmente
correto — de que o texto do código é transcrição literal do capítulo 3. Mas o capítulo 3 é resumo de
criação de personagem e o **capítulo 5 é quem define** Virtudes e Recompensas; copiar o resumo perde
conteúdo mecânico. Como eu já havia aplicado esse critério ao Mão Firme (item 3), aceitar a refutação
deixaria o mesmo defeito tratado de dois jeitos no mesmo commit. Os refutadores acertaram os fatos e
erraram o padrão; a decisão de padrão é minha. Ficou fixada em teste: `data.ts` carrega o texto do
capítulo 5, e `pregens.ts` é a exceção — reproduz a ficha do Starter Set, que traz o resumo curto.

**Também corrigido:** a Virtude Cultural "Realeza Revelada" mandava tentar "Reanimar Companheiros",
nome que não existe em nenhum outro ponto do app — a tarefa da postura Aberta é "Reunir Companheiros"
em `stances.ts` e no compêndio. Refutado 2/3 como cosmético, mas o Mestre procurava uma tarefa
inexistente. O teste agora lê o nome do motor e exige que a Virtude use o mesmo.

**As 4 refutações que aceitei:** Empreitada grátis adicional (o livro dá dois slots, só o segundo é
restrito); custo de Curar Cicatrizes reportado como bug de mesa (é código morto — corrigi como
prevenção, não como bug ativo); e duas alegações cujo "impacto" era impossível porque a string citada
é texto de UI, não caminho de cálculo.

**Arquivos tocados:**
- `livros/um-anel/{09-starter-set-regras-condensadas,07-fases-de-companhia-jornada,05-valor-e-sabedoria}.md`
  — traduzidos, marcadores removidos
- `livros/um-anel/12-o-mundo-eriador.md` — linha do Búrzgul: "Marca especial: Sobrepujar" virou "Dano
  Especial sempre disponível", com nota de que *Overbear* **não** é nenhuma das 4 opções do capítulo 8
  e não tem efeito definido na fonte — registrado em vez de mecanizado por chute
- `lib/character/um-anel/rules.ts` — `torBrawlingRank()`
- `lib/room/handlers/tor-combat-attack.ts` — usa o helper em vez de 0
- `lib/combat/um-anel/session-state.ts` — teto 6 → 7
- `lib/character/um-anel/data.ts` — Mão Firme, Cruel, Confiança, Robustez
- `lib/character/um-anel/cultural-virtues.ts` — nome da tarefa alinhado ao motor
- `lib/combat/um-anel/shadow.ts` — `TOR_HEAL_SCAR_COST` e cobrança
- `components/vtt/TorFellowshipPanel.tsx` — `max` do input de Astúcia
- `scripts/verify-um-anel-{dice,pregens,session-state,shadow}.mjs` — asserções novas

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (**542 asserções**) · `npm run build`
compila. Testes negativos rodados nas 3 primeiras correções: reintroduzir cada bug produz exatamente
as falhas esperadas (2, 1 e 1) e nenhuma outra.

**Em aberto, decidido conscientemente:** o bônus de Perícia do Yule é **por herói** conforme a ASTÚCIA
de cada um, e o estado guarda um número único para a Companhia inteira. Divergência confirmada 3/3 e
**não corrigida nesta rodada** — o conserto certo é computar no servidor a partir das fichas da sala
(o handler já resolve fichas), o que refatora o fluxo de encerrar Fase. Fica como próxima tarefa, não
como esquecimento.

**Como testar:** `npm run test:um-anel`

---

### 2026-08-04 — Fase B, rodada 5/12: tradução de 02-resolucao-de-acoes.md + 7º bug de regra

**Pedido:** loop contínuo — traduzir do menor para o maior, auditando as regras contra o código.

**Passo a passo:**

1. **Bug encontrado — o mesmo de antes, em outro sítio.** `rollTorSkillCheck` e
   `rollTorCombatProficiencyCheck` em `lib/character/um-anel/dice.ts` passavam
   `illFavoured: character.conditions.miserable`. É exatamente a confusão Arrasado × Desfavorecido
   corrigida na rodada 3 no Teste de Proteção — **sobreviveu nas rolagens de Perícia e de
   Proficiência de Combate**, que são as mais frequentes da mesa. Efeito: todo herói Arrasado rolava
   **dois Dados de Proeza ficando com o pior** em cada rolagem de Perícia, além da falha automática
   no Olho que já é o efeito correto. Dupla penalidade.

2. **O livro é explícito, e em dois lugares.** O passo 4 do box *Procedimento de Rolagem*: "Se sair
   uma runa de Gandalf, a ação é automaticamente um sucesso. Se você está Arrasado e sai um Olho de
   Sauron, você falha automaticamente em vez disso" — nada sobre desfavorecer. E o passo 3 só manda
   pegar dois Dados de Proeza "se a rolagem for Favorecida ou Desfavorecida". Desfavorecido é a
   condição separada: "heróis-jogadores cuja pontuação de Sombra iguala sua **Esperança máxima**".

3. **Correção com fórmula única.** A comparação estava inline em `tor-combat-attack.ts` e ia virar uma
   segunda cópia em `dice.ts`. Extraí `isTorIllFavouredByShadow()` em
   `lib/character/um-anel/rules.ts` e apontei os dois para ela — uma fórmula, um lugar.

4. **Verificação limpa no ponto de maior risco.** A regra que implementações ingênuas erram é o
   cancelamento Favorecida × Desfavorecida: o livro manda **resolver normal, com 1 dado**, e diz
   explicitamente que não depende da contagem de fontes. `rollTorCheck` já cancelava certo
   (`favoured && !illFavoured` nos dois sentidos). Também limpos: Olho → 0, Runa → sucesso
   automático, ordem de força do `featDieRank` (Olho −1, Runa 11), Exausto zerando 1–3, graus de
   sucesso, e clamp de rank negativo.

5. **Armadilha sistêmica do pipeline, resolvida.** As asserções "livro:" casam com o texto do
   markdown — e traduzir um capítulo troca o idioma dele, quebrando todo teste que citava o inglês.
   Aconteceu nesta rodada: 16 asserções do teste novo e 2 do de pré-gerados caíram assim que a
   tradução entrou. Reancorei tudo no PT-BR, deixei a contagem de NA **bilíngue** (para não quebrar
   de novo a cada tradução) e registrei o aviso no cabeçalho do teste, nomeando as asserções em
   inglês que ainda vão quebrar (`verify-um-anel-stances.mjs` aponta para os capítulos 6 e 8).

6. **`fnBody()` errado duas vezes antes de acertar.** Contar profundidade de chave desde a declaração
   pega a chave do **tipo do parâmetro** (`rollTorCheck(opts: { … })`), e "primeira `}` na coluna 0"
   pega o fechamento desse mesmo tipo multilinha (`}): TorRollOutcome {`). A versão final pula a
   lista de parâmetros contando parênteses e depois pula anotações de tipo de retorno casando chaves.
   Sem escopo correto, as asserções negativas passariam vazias.

**Arquivos tocados:**
- `livros/um-anel/02-resolucao-de-acoes.md` — traduzido (365 linhas), marcador removido; 6 notas de
  implementação ligando cada regra ao ponto do código
- `lib/character/um-anel/rules.ts` — `isTorIllFavouredByShadow()`, com as duas condições contrastadas
- `lib/character/um-anel/dice.ts` — o bug corrigido nas duas funções de rolagem
- `lib/room/handlers/tor-combat-attack.ts` — passou a usar o helper em vez da fórmula inline
- `scripts/verify-um-anel-dice.mjs` — **novo**, 43 asserções
- `scripts/verify-um-anel-pregens.mjs`, `scripts/verify-um-anel-stances.mjs` — reancorados
- `package.json` — o teste novo entrou nos dois scripts

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (502 asserções) · `npm run build` compila.
Teste negativo conferido: reintroduzir `illFavoured: character.conditions.miserable` produz exatamente
4 falhas, duas por função, e nenhuma outra.

**Como testar:** `node scripts/verify-um-anel-dice.mjs`

---

### 2026-08-04 — Fase B, rodada 4/12: tradução de 11-personagens-exemplo.md + NA 18 explicado

**Pedido:** loop contínuo — traduzir os capítulos do Um Anel do menor para o maior, auditando as
regras contra o código na mesma rodada.

**Passo a passo:**

1. **Diagnóstico.** O capítulo dos 8 pré-gerados do Starter Set já vinha com um alerta da extração:
   as fichas imprimem **NA = 18 − Atributo**, e não o **20 − Atributo** que o livro afirma. A extração
   não soube decidir qual estava certo e deixou a dúvida em aberto — `pregens.ts` herdou um comentário
   com o diagnóstico incompleto.

2. **O NA 18 não é erro — é regra opcional oficial.** A tradução do capítulo 2 (rodada 5, na mesma
   sessão) trouxe o box *Tweaking the Target Numbers*: "para campanhas mais curtas ou jogos de uma
   sessão, os jogadores e o Mestre podem combinar derivar os NAs subtraindo os Atributos de **18**".
   O Starter Set é exatamente um produto de campanha curta, então suas fichas usam a variante
   corretamente — **os dois números estão certos, cada um no seu contexto**. A VTT implementa o padrão
   (20 − Atributo), então estas 8 fichas aparecem com NA 2 acima do PDF, o que é correto. Registrei
   minha primeira conclusão como errada: eu havia chamado o 18 de erro de impressão antes de traduzir
   o capítulo que o documenta. **A variante 18 como opção de campanha fica em aberto, não implementada.**

3. **A coluna de Valor está comprovadamente certa, independente disso.** Os **7 pré-gerados Hobbit
   usam exatamente os 6 conjuntos oficiais de Atributos** da tabela de Hobbits do Condado
   (`03-aventureiros.md`), cada conjunto uma vez, Bilbo repetindo o de Drogo. Transcrição errada da
   arte da ficha não cairia toda dentro de uma tabela fechada de 6 linhas. E **Balin, o único Anão,
   fecha exato nas três derivadas** com as bases do Povo de Durin (+22/+8/+10) — é o controle que
   isola o desvio de Resistência às fichas Hobbit.

4. **A divergência de verdade, essa não resolvível pela fonte.** A Resistência das 7 fichas Hobbit está exatamente
   **+2 acima** da fórmula cultural (Hobbits: FORÇA + 18). Esperança (+10) e Bloqueio (+12) fecham
   exatos nas 7, inclusive somando as 3 Virtudes que alteram estatística (Confiança de Drogo, Agilidade
   de Paladin, Robustez de Rorimac). O livreto condensado do Starter Set não traz bloco de criação de
   personagem, então não há como saber se é erro de impressão ou base diferente. **Valores impressos
   preservados por fidelidade**, com a relação fixada em teste pra ninguém "corrigir" recalculando.

5. **Cruzamento maior de brinde.** O teste passou a comparar as **6 culturas do capítulo 3 × 3
   derivadas = 18 valores** contra `data.ts`. Todas batem — Bardos 20/8/12, Anões 22/8/10, Elfos de
   Lindon 20/8/12, Hobbits 18/10/12, Homens de Bri 20/10/10, Rangers 20/6/14.

6. **Gap de gate corrigido.** `verify-um-anel-compendium.mjs` (a guarda de divergência entre o markdown
   e o JSON gerado) estava só no `test:um-anel`, fora do `npm run test`. Um JSON obsoleto passaria pelo
   gate principal. Entrou nos dois.

**Dois falsos alarmes evitados** (conferidos antes de reportar): a suposta inconsistência interna das
tabelas de NA — eram as Virtudes Proeza de Esmeralda (−1 NA de Força) e de Primula (−1 NA de Astúcia);
e "Astúcia" em vez de "Argúcia" em `pregens.ts` — `data.ts:57` define `argucia: "Astúcia"`, é o rótulo
canônico do projeto.

**Arquivos tocados:**
- `livros/um-anel/11-personagens-exemplo.md` — traduzido (347 linhas), marcador removido; a nota de
  divergência reescrita com o diagnóstico resolvido e a tabela de conjuntos oficiais
- `lib/character/um-anel/pregens.ts` — comentário de cabeçalho corrigido: separa as duas divergências,
  cada uma com seu diagnóstico e o motivo de não recalcular
- `scripts/verify-um-anel-pregens.mjs` — **novo**, 58 asserções
- `package.json` — pregens e compendium entraram no `npm run test`

**Validação:** `npx tsc --noEmit` limpo · `npm run test` verde (416 asserções) · `npm run build` compila.
Teste negativo conferido: zerar `HOBBIT_ENDURANCE_OFFSET` produz exatamente 7 falhas (as 7 Resistências
Hobbit), então as asserções são vivas e não vácuo.

**Como testar:** `node scripts/verify-um-anel-pregens.mjs`

---

### 2026-08-03 — Fase B, rodada 3/12: tradução de 13-apendice-patronos-e-ficha.md

**Feito:** apêndice traduzido (342 linhas) — os 6 Patronos do Core com biografia, ficha, Bônus de
Companhia e Vantagem; o sistema de **Marcos** (formato de 6 partes); o Marco de exemplo *A Estrela na
Bruma* com o bloco da Elwen; o gerador de **Coisas Sem Nome** (8 tabelas completas, inclusive as
Tabelas 6-8 de estatísticas, formas de ataque e Habilidades Sinistras); e o layout completo da **ficha
oficial** e do **Diário de Jornada**. Restam **9** capítulos em inglês.

**Auditoria — nenhuma divergência. Três verificações mecânicas, todas limpas:**

1. **Bônus de Companhia dos 7 Patronos** (`patrons.ts`): Balin +1, Bilbo **+2**, Círdan +1, Gandalf
   **+2**, Gilraen +1, Bombadil **+2**, Elrond +1 — todos corretos, e os nomes de Vantagem batem. São
   os 6 do Core mais Elrond, que vem do suplemento de Valfenda.
2. **Bloco da Elwen** (`adversaries.ts`): Nível 5, Resistência 24, Vigor 2, Ódio 5, Bloqueio +2,
   Proteção 2, as duas armas com dano/ferimento/especial corretos, e as 4 Habilidades Sinistras com
   texto fiel — exato.
3. **Tabela 6 das Coisas Sem Nome** (`nameless-things.ts`): as 7 faixas do Dado de Proeza, com Nível,
   Proteção, Bloqueio, Resistência, Vigor, Proficiência e número de Habilidades — linha por linha
   correta.

**Falso alarme que evitei reportar:** a estrutura de Marcos parecia ter 7 passos e o livro define 6 —
mas o sétimo `step:` que o grep achou era a linha da **declaração de tipo**, não uma entrada. Conferi
antes de abrir bug. Registro porque é o tipo de "achado" que viraria ruído se eu não tivesse olhado.

**Nota de tradução (D22):** a folha oficial de Diário de Jornada usa grade hexagonal no Percurso.
Anotei a adaptação para **trecho** dentro do próprio capítulo traduzido, para quem lê o livro no repo
não estranhar a divergência com o código.

**Validação:** `tsc` limpo · build compila · `npm run test` verde.

---

### 2026-08-03 — Fase B, rodada 2/12: tradução de 12-o-mundo-eriador.md + 2 nomes em inglês corrigidos

**Feito:** `livros/um-anel/12-o-mundo-eriador.md` traduzido (293 linhas) — o capítulo de cenário
inteiro: Condado, Lago Crepúsculo, Terras de Bri em detalhe, Estrada do Leste, Caminho Verde, Colinas
dos Túmulos, Colinas do Norte e do Sul, Colinas do Tempo, Angmar, Ettenmoors, Monte Gram, Matas dos
Trolls, Tharbad, Lindon, Montanhas Azuis, mais as 6 tabelas de encontro por Dado de Proeza e a seção
"Aventurar-se na Terra-média". Restam **10** capítulos em inglês.

**Auditoria — 2 achados corrigidos e 1 lacuna registrada:**

1. **Dois nomes de adversário estavam em inglês**, violando a convenção de UI em PT-BR
   (`docs/CLAUDE-PROJETO.md`). E nome de adversário aparece no compêndio **e** no nameplate do token
   no mapa, então vazava direto para a mesa:
   - `"Barrow-wight"` → **"Tumulário"**
   - `"Cave-troll Furtivo"` (meio em inglês) → **"Troll das Cavernas Furtivo"** — o vizinho já usava
     a forma PT-BR "Grande Troll das Cavernas"

   Os `id` continuam em inglês de propósito: são chave estável, e renomear quebraria salas salvas.
   20 dos 22 nomes já estavam certos, o que explica os dois terem passado.

2. **Teste novo** que impede nome em inglês de voltar, com lista de marcadores. Não inclui Orc,
   Goblin, Troll nem Warg, que ficam no original de propósito na tradução brasileira de Tolkien.

3. **Lacuna da Fase J registrada:** três adversários nomeados deste capítulo **não estão** no
   bestiário — **Rei-Tumulário** (Nível 9, Resistência 45, 4 Habilidades Sinistras), **Búrzgul**
   (Nível 5) e **Ash**, o Warg dele (Nível 4). Os blocos completos agora estão traduzidos no
   markdown, prontos para importar em D20.

**Sexto erro meu do mesmo tipo:** ao escrever o teste de nomes, usei `Guard` sem fronteira de
palavra no final — casou com "**Guarda** Orc" e "**Guarda**-costas Grande Orc", que são português.
`Bandit` teria casado com "Bandido" também. Os seis erros desta sessão foram todos asserção
negativa com regex casando fora do escopo. Adicionei a fronteira nas duas pontas e comentei o porquê
no próprio teste.

**Validação:** `tsc` limpo · build compila · `npm run test` verde (39 testes em stances, era 33).

---

### 2026-08-03 — Fase B, rodada 1/12: tradução de 10-rivendell.md + auditoria

**Pedido:** loop auto-pace traduzindo um capítulo por rodada, auditando as regras contra o código na mesma passada.

**Feito:** `livros/um-anel/10-rivendell.md` traduzido (294 linhas) — cenário de Imladris, plantas, os 5 PNJs notáveis com blocos de estatística, e a Cultura jogável dos Altos-Elfos de Valfenda. Marcador "aguardando tradução colaborativa" removido. Restam **11** capítulos em inglês.

**Auditoria — nenhuma divergência encontrada.** Conferi contra o código:
- Patrono Elrond (`patrons.ts`): bônus de Companhia +1, "Maior dos Mestres do Saber", +1 no Dado de Proeza de eventos de jornada, Chamados Erudito/Guardião — **tudo correto**
- Cultura Altos-Elfos (`data.ts`): os 6 conjuntos de atributos, Resistência +22, Esperança +6, Bloqueio +12, bênção "Sábio-Élfico", Padrão Próspero — **tudo correto**

A extração anterior deste capítulo foi feita com cuidado. Vale registrar o resultado limpo: a auditoria embutida não é teatro, e quando não acha nada isso também é informação.

**Nota de tradução:** a regra de achar Valfenda usa SCAN no original, traduzido como **VASCULHAR** — que é o id real da perícia em `data.ts`. Traduzir como "Percepção" teria criado divergência com o código.

**Validação:** `tsc` limpo · build compila · `npm run test` verde.

---

### 2026-08-03 — feat(um-anel): export PDF da ficha + guard de cor virou real

**Pedido:** corrigir os bugs existentes e voltar à construção.

**Passo a passo:**

1. **Export PDF da ficha do Um Anel (fecha D32).** `TorSheetPdfDocument` + `TorSheetPdfExportButton`, reaproveitando o motor do Eldarin (`exportSheetPdf`: html2canvas → jsPDF). O que é próprio do sistema é só o layout — o motor de captura é infraestrutura sem conteúdo de jogo, então usá-lo não fere o isolamento de hub.

2. **Layout segue os agrupamentos da ficha oficial** (identidade, Atributos com ND, Recursos, Perícias por grupo com marca de Favorecida, Proficiências, Equipamento de Guerra, armadura, Traços/Recompensas/Virtudes). **Não reproduz a arte** — a arte é da Free League; o que o jogador leva para a mesa são os valores.

3. **A Carga total aparece no PDF com a conta explícita** (`equipamento + Fadiga`) e a regra de Exausto escrita embaixo. É o mesmo bug corrigido hoje: quem imprime a ficha precisa saber por que está Exausto.

4. **Proteção é derivada, não campo.** `tsc` pegou: eu tinha escrito `character.protectionDice`, que não existe — o valor sai de `computeProtectionDice(armour)`.

5. **O guard de cor do PDF era decorativo — virou real.** `verify-sheet-pdf` definia `UNSAFE_COLOR_VALUE` (bloqueia `color-mix()`, `oklch()`, `color()`…) e testava o **regex contra strings de exemplo**, mas **nunca varria os CSS**. Ou seja: a proteção existia no papel e uma cor insegura entraria sem ninguém notar — e o bloco sairia transparente no PDF capturado. Agora varre os 3 arquivos de layout de impressão, e também acusa `var(--token)` em propriedade de cor (os tokens do site resolvem para `color-mix()` em vários casos).

6. **Quinta vez no mesmo padrão de erro meu:** o scan novo acusou o **próprio comentário** do CSS, que documenta a restrição citando `color-mix()` e `oklch()` por nome. Filtrar por prefixo `*` não resolvia — linhas de continuação de bloco `/* … */` não começam com `*`. Agora remove comentários de verdade, trocando por espaços para os números de linha continuarem batendo com o arquivo.

7. **Host de captura é montado só durante a exportação.** Manter o layout de impressão sempre no DOM custaria render em toda ficha aberta, e a ficha da mesa já é o componente mais pesado. Desmonta inclusive no erro — host oculto esquecido atrapalharia a próxima captura.

8. **Import dinâmico do botão** — `jspdf` + `html2canvas` são pesados e não devem entrar no bundle de quem só abre a ficha.

**Arquivos tocados:**
- `components/character/TorSheetPdfDocument.tsx` + `tor-sheet-pdf.css` — **novos:** layout de impressão
- `components/character/TorSheetPdfExportButton.tsx` — **novo:** botão + host de captura
- `components/character/sheet/TorCharacterSheetView.tsx` + `tor-sheet.css` — botão no cabeçalho, responsivo
- `scripts/verify-sheet-pdf.mjs` — guard aplicado aos CSS de verdade (31 → 37 testes)

**Commits / deploy:** branch `fix/login-google-e-responsivo-um-anel`.

**Como testar:**
- Abrir ficha do Um Anel → "Exportar PDF" → o arquivo deve trazer todos os campos, sem bloco transparente
- `node scripts/verify-sheet-pdf.mjs` → 37 testes, incluindo a varredura dos 3 CSS
- Adicionar `color-mix(...)` em `tor-sheet-pdf.css` → o teste deve **falhar** apontando a linha

---

### 2026-08-03 — fix(um-anel): três bugs de regra nas condições Exausto e Arrasado

**Pedido:** avançar para a Fase I (ficha interativa). Ao auditar a ficha antes de mexer, achei que boa parte de D32 já existia — rolagem por clique, steppers, pills de condição. O que **não** estava certo eram as fórmulas das condições derivadas.

**Passo a passo:**

1. **Bug 1 (meu, introduzido na Fase D).** `shadow.ts` calculava `weary: state.fatigue >= state.enduranceValue` — Resistência contra a Fadiga **isolada**, ignorando a Carga do equipamento. E os 54 testes da Fase D **trancaram a regra errada**, que é o pior tipo de teste: dá confiança falsa.

2. **A regra real, conferida no livro antes de mexer:** `04-caracteristicas.md` diz *"Heroes become Weary if their Current Endurance score becomes equal to or lower than their total Load"* e *"Fatigue points temporarily raise a travelling Player-hero's total Load"*. Ou seja **Exausto ⟺ Resistência ≤ (Carga + Fadiga)**. A Fadiga **soma** à Carga, não substitui. Adicionei `totalTorLoad()` e o campo `load` em `TorSpiritState`.

3. **Bug 2 (pré-existente, `normalize.ts`).** `weary: endurance.value <= load` — mesma omissão da Fadiga, no lado da ficha. Efeito prático: herói acabado de Fadiga no fim de uma jornada **não ficava Exausto**, que é exatamente o efeito que a Fadiga existe para produzir. A Fadiga era cosmética.

4. **Bug 3 (pré-existente, `normalize.ts`).** `miserable: shadow >= hope.value` ignorava `shadowScars`. Cicatriz conta como ponto de Sombra normal para todos os efeitos (SOM-R06), então quem trocou Sombra por Cicatriz em "Endurecer a Vontade" **saía de Arrasado sem ter melhorado de verdade** — virava um exploit silencioso.

5. **Normalização defensiva:** `shadowScars` e `fatigue` passam a ser normalizados com default e escritos explicitamente no retorno. Sem isso, ficha legada sem os campos daria `NaN` nas comparações — e `NaN` em comparação devolve `false`, então o herói simplesmente **nunca** ficaria Exausto, sem erro nenhum no console.

6. **Ferido continua manual** — é evento de jogo (Golpe Perfurante), não consequência de número.

7. **`computeLoad` segue sendo só equipamento.** A Fadiga é somada fora dela, porque a Carga é persistida na ficha: somar dentro faria a Fadiga entrar duas vezes. Há um teste garantindo que `computeLoad` não menciona Fadiga.

8. **16 testes novos** em `verify-um-anel-sheet-conditions.mjs`, incluindo dois que verificam **a regra no próprio livro** — se a extração mudar e a regra sumir, o teste avisa em vez de validar uma fórmula sem fonte. Também checam que motor e ficha não divergem (duas implementações da mesma regra é aceitável; divergir não é).

**Arquivos tocados:**
- `lib/combat/um-anel/shadow.ts` — `totalTorLoad()`, campo `load`, fórmula de Exausto corrigida
- `lib/character/um-anel/normalize.ts` — Exausto com Fadiga, Arrasado com Cicatrizes, defaults explícitos
- `scripts/verify-um-anel-shadow.mjs` — teste que trancava a regra errada, corrigido
- `scripts/verify-um-anel-sheet-conditions.mjs` — **novo:** 16 testes
- `package.json` — verificador no `test` e no `test:um-anel`

**Commits / deploy:** ver branch `fix/login-google-e-responsivo-um-anel`.

**Bug 4 (pré-existente, mesma sessão) — Arrasado tratado como Desfavorecido:**

9. O Teste de Proteção do Golpe Perfurante passava `illFavoured: params.defenderMiserable`, aplicando ao defensor Arrasado uma penalidade que **o livro não dá**. As duas condições são distintas: Arrasado faz o Olho de Sauron virar falha automática (linha 363 de `08-mestre-e-adversarios.md`); **Desfavorecido** é a condição pior e separada, ao a Sombra alcançar a Esperança **máxima** (linha 367), ou por uma Falha que afete a rolagem.

10. Efeito prático: quem estava Arrasado sofria duas penalidades pelo preço de uma — o Olho virava falha (correto) **e** rolava 2 Dados de Proeza pegando o pior (incorreto). Num Teste de Proteção, isso é a diferença entre levar um Ferimento e não levar.

11. Adicionado `defenderIllFavoured` como parâmetro próprio, derivado no handler de `shadow + shadowScars >= hope.max` — mesma fórmula de `deriveTorSpiritFlags`. 9 testes novos, incluindo dois que verificam **as duas frases do livro** e um que confirma a ordem de leitura (o estado do defensor é lido **antes** de aplicar o dano, porque "the Protection Test is made *before* the Weariness sets in").

12. **Verificado e correto, não mexi:** o Golpe Perfurante testa `featDie.numeric === 10`, e o livro diz "a Piercing Blow on a **10 or [Rune]** result" — a Runa tem `numeric: 10`, então a checagem cobre os dois de propósito. Também confirmei que o efeito de Exausto no motor de dados está certo (zera Dados de Sucesso 1–3) e que Arrasado é auto-falha só no Olho.

**Como testar:**
- `npm run test:um-anel`
- Na ficha: herói com Resistência 20, Carga 8 e Fadiga 15 deve aparecer **Exausto** (20 ≤ 23). Antes não aparecia.
- Herói com Esperança 6, Sombra 3 e 3 Cicatrizes deve aparecer **Arrasado** (6 ≥ 6). Antes não aparecia.

---

### 2026-08-03 — fix(auth): login do Google caindo — sessão OAuth revalidava no banco a cada requisição

**Pedido:** "tá caindo tanto o login do Google, por quê?" → diagnóstico, e depois "repare os erros identificados".

**Passo a passo:**

1. **Diagnóstico — por que só o Google.** `resolveSessionUser` (`lib/auth/session-user.ts`) decidia materializar a conta por `oauthIdentityFromSession(user)`. Essa função devolve identidade sempre que `oauthProvider` + `oauthSubject` estão presentes na sessão — o que é **sempre verdade para um usuário Google**, inclusive um já materializado com id `usr_` válido. Consequência: toda requisição de sessão OAuth rodava `ensureUserFromOAuth(..., { strict: true })`:
   - `fetchUserByOAuthIdentity` (query 1)
   - `fetchUserById` (query 2)
   - às vezes `fetchUserByEmail` (query 3)
   - e um `UPDATE` quando a URL do avatar do Google diferia

   Sessão por senha fazia **1 query** (`fetchUserByIdStrict`). Mesma rota, metade do custo e nenhuma escrita.

2. **Por que derrubava.** Com `strict: true`, qualquer exceção cai no catch de `ensureUserFromOAuth`, que devolve sessão efêmera; `materializeOAuthUser` então vê `isOAuthEphemeralSessionId` e **lança** → usuário deslogado. Um soluço de banco de 3s derrubava quem entrou com Google e não derrubava quem entrou com senha.

3. **O multiplicador.** 16 call sites, incluindo `/api/auth/me` e `/api/notifications` — e `NotificationsProvider` faz poll a cada **30 segundos** por cliente logado. Com `connectionLimit: 10`, `connectTimeout: 3000` e timeout de query de 5s, alguns jogadores numa mesa bastavam para esgotar o pool.

4. **Correção (1 condição).** Materializar só quando a linha realmente não existe — id efêmero `google-…`/`discord-…`, que só acontece se o banco estava fora no momento do login. Com id `usr_` já válido, cai no caminho barato de 1 query, igual à senha. A ordem importa e está testada: id efêmero é checado **antes** de `usr_`.

5. **O que se perde (nada relevante).** O retrato do Google deixa de ser reconferido a cada requisição. Mas `oauthAvatarUrl` vem do **cookie**, que só muda quando o usuário loga de novo — e é aí que `completeOAuthLogin` grava o valor novo. Na prática o `UPDATE` já era one-shot; o que existia era o custo de comparar em toda requisição.

6. **Quarto erro meu em teste na mesma sessão.** A asserção negativa "não decide por `oauthIdentityFromSession`" falhava porque casava com o **comentário** que documenta o bug antigo. O comentário é deliberado — é o que impede alguém de "restaurar" o comportamento. Adicionei `stripComments()` e passei as asserções negativas a rodar só sobre código. **Padrão observado:** meus 4 erros de teste nesta sessão foram todos em asserções negativas com regex casando fora do escopo pretendido (arquivo inteiro em vez da função, ou comentário em vez de código).

7. **Validação:** `tsc` limpo · build compila · `npm run test` verde com **12 testes novos** de custo de sessão OAuth.

**Na mesma sessão — primeira UI de motor: painel de Jornada**

8. **`components/vtt/TorJourneyPanel.tsx`** — o primeiro dos motores do Um Anel a ficar realmente jogável. Configura a rota (trechos, terreno difícil, estação, região, a cavalo, marcha forçada), mostra a duração calculada, e conduz o loop: Teste de Marcha do Guia → avança na rota → sorteia alvo e determina o evento pela região → resolve com a rolagem do alvo. Cada passo publica no chat com o d12 anexado (D12), então a mesa toda acompanha.

9. **Bug que peguei antes de terminar:** na primeira versão do `resolveEvent` eu reconstruía um `TorJourneyEventMeta` parcial (`fatigue: 0, triggersOn: "failure"`) em vez de guardar o real. Isso resolveria **ao contrário** os três eventos de `triggersOn: "success"` — Atalho, Encontro Fortuito e Visão Alegre passariam a disparar na falha. Passei a guardar o meta inteiro no estado `pending`.

10. **Ícone provisório, conforme a convenção do projeto.** `MesaRailIcon` não tem glyph genérico de fallback (`default: return null` daria botão invisível), então adicionei um marcador geométrico mínimo para `torJourney`, comentado explicitamente como **não-final** — a regra do projeto é não inventar ilustração enquanto a arte real não chega.

11. **Integração completa:** novo `MesaWindowId`, layout padrão, entrada em `FOUNDRY_DOCK_PANEL_IDS`, painel no dock e em janela flutuante, e ícone no rail — tudo condicionado a `rpgSystemId === "um-anel"` **e** ser Mestre, respeitando o despacho por sistema (D10). CSS responsivo desde o início, com container query (o painel vive tanto no dock estreito quanto em janela redimensionável) e alvos de toque de 44px nos botões de graduação.

**Na mesma sessão — painel de Conselho**

12. **`components/vtt/TorCouncilPanel.tsx`** — segundo motor a ficar jogável. O Mestre fixa a Resistência (3/6/9), o porta-voz rola a Introdução (que define o limite de tempo), e cada tentativa de Interação acumula sucessos. O painel mostra `sucessos/Resistência` e tentativas restantes, avisa quando a Introdução falhou (Conselho passa a arriscar Desastre) e trava ao terminar. Tudo publicado no chat com o d12 anexado.

13. **Prop renomeada por honestidade:** `showJourney` passou a controlar dois painéis, então virou `showTorGmTools` — o nome antigo mentiria sobre o escopo e alguém acabaria adicionando um terceiro painel sob um nome que fala de Jornada.

**Na mesma sessão — painel de Fase de Companhia (fecha os três motores com UI)**

14. **`components/vtt/TorFellowshipPanel.tsx`** — Yule é **derivado do calendário**, não um botão: o painel mostra `Ano N · Fase X/3` e avisa quando encerrar vai virar o ano. Orçamento de Empreitadas se ajusta sozinho (Fase comum: 1 + 1 grátis; Yule: 1 por herói + 1 grátis), e as marcadas (Yule) aparecem desabilitadas fora do Yule em vez de escondidas — o jogador precisa saber que existem e por que não pode escolher agora. Validação usa `validateTorUndertakings`, então estourar orçamento ou repetir Empreitada não-Yule bloqueia o botão. Tabela de custos de XP num `<details>`, com o lembrete dos bolsos separados e do "Valor OU Sabedoria".

**~~Limitação conhecida dos três painéis~~ — RESOLVIDA na mesma sessão (ver abaixo).**

15. **Persistência do estado de sessão em `RoomState`.** A limitação acima (estado no `useState` do Mestre, perdido ao recarregar) foi fechada: novo campo `RoomState.torSession` com Jornada, Conselho e Fase de Companhia. `eldarin_rooms` guarda a mesa como JSONB, então **não houve migração**.

16. **O campo entra também no `RoomSnapshot`** — e isso é o ponto, não um detalhe: sem estar no snapshot, os jogadores continuariam vendo só o texto do chat. Agora o placar da Jornada (trechos restantes, evento pendente, diário) chega a todos por SSE. `snapshotForViewer` usa `{ ...snapshot }`, então o campo passa sem alteração ali.

17. **Nada confia no que leu do JSONB.** `normalizeTorSession` recorta faixas (`int`), enums (`oneOf`) e tamanho de lista (`strList`): mesa escrita por versão anterior do código continua carregando. Sessão vazia devolve `undefined` para não inflar o JSON da sala.

18. **`null` apaga, ausente mantém.** O patch usa `"campo" in patch` em vez de truthiness — sem essa distinção não haveria como encerrar uma jornada sem apagar o Conselho em andamento.

19. **Decisão de modelagem:** o evento pendente guarda só o `eventId`; o `TorJourneyEventMeta` é resolvido em código na leitura. Guardar o meta inteiro congelaria texto de regra dentro do banco, e mudar a tabela do livro deixaria salas antigas com a versão velha.

20. **`started` deriva de `progress`**, não de um `useState` paralelo — duas fontes de verdade fariam o painel discordar da sala depois de um SSE. O jogador sem permissão passa a ver o placar em modo leitura em vez de uma mensagem de "só o Mestre".

21. **Autorização:** handler exige `canManageRoom` **e** `rpgSystemId === "um-anel"` — o campo nunca aparece num estado do Eldarin.

22. **Os três painéis ligados à persistência.** Jornada, Conselho e Fase de Companhia leem do snapshot e escrevem via `patchTorSession`. Nenhum deles mantém `useState` paralelo do que a sala já sabe: `started` deriva de `progress`, `outcome` deriva de `council`, e o Yule deriva de `phasesThisYear` do calendário persistido. Local ficou só o que é rascunho antes de gravar (configuração da rota, Resistência escolhida, perícia selecionada).

23. **O calendário da campanha é o dado que mais importava persistir** — é ele que decide quando cai o Yule. Perder isso desalinharia a progressão de Valor/Sabedoria de toda a Companhia, e nenhum jogador teria como notar.

24. **Jogador sem permissão passa a ver placar em leitura** nos três painéis, em vez da mensagem "só o Mestre conduz". 48 testes cobrem normalização, semântica do patch, autorização, isolamento e o acoplamento painel↔sala nos três.

**Ainda pendente do mesmo diagnóstico (depende do servidor, não do código):**

- **`SESSION_SECRET` estável em produção.** O commit `be69f6f` (31/07) passou a exigir HMAC no cookie e rejeita o formato antigo de propósito — isso deslogou todo mundo **uma vez**, o que é esperado. Se estiver repetindo a cada deploy, o segredo não está estável no Contabo (`scripts/local/setup.sh` gera um aleatório; se algo parecido roda no servidor, cada recriação invalida todas as sessões).
- **Diagnóstico rápido:** `curl https://www.mxdrpg.com.br/api/health` → `oauth.ready`, `oauth.missing`, `db`, `buildSha`. Se `db: false` ou `oauth.missing` vier preenchido, o problema é de configuração, não de código.

**Arquivos tocados:**
- `lib/auth/session-user.ts` — gatilho da materialização passa a ser o id efêmero, não a identidade OAuth
- `scripts/verify-oauth-session-cost.mjs` — **novo:** 12 testes que trancam a regressão
- `components/vtt/TorJourneyPanel.tsx` + `tor-journey.css` — **novos:** painel de Jornada jogável
- `lib/vtt/foundry-window-placement.ts` · `hooks/vtt/useFoundryWindows.ts` — janela `torJourney`
- `components/vtt/foundry/MesaRailIcon.tsx` — glyph provisório `torJourney`
- `components/vtt/foundry/MesaIconBar.tsx` · `MesaFoundrySidebar.tsx` — prop `showJourney`
- `components/vtt/mesa/MesaFoundryDockRail.tsx` · `MesaFoundryFloatingWindows.tsx` — painel no dock e flutuante
- `package.json` — verificador no `test`; atalho `test:auth`

**Commits / deploy:** pendente local (push só quando o usuário pedir).

**Como testar:**
- `npm run test:auth` → 12 testes
- Em produção, depois do deploy: entrar com Google e navegar/deixar aberto — a sessão não deve mais cair sozinha
- Confirmar no log do servidor que `[materializeSessionUser] oauth materialize failed` parou de aparecer

---

### 2026-08-03 — Um Anel: pipeline de compêndio + posturas de combate (PRD v2.0, Fases A e C)

**Pedido:** extrair o livro do Um Anel subdividido em compêndios (não publicar o livro inteiro) e começar a implantar o resto das 20 decisões do discovery.

**Passo a passo:**

1. **Discovery — 20 perguntas selecionáveis**, registradas como D13–D33 no [PRD-MESA-UM-ANEL.md](./PRD-MESA-UM-ANEL.md) v2.0.

2. **Auditoria que motivou:** 13 capítulos extraídos (~7.900 linhas), mas **12 dos 13 ainda em inglês**; **nenhum script lia `livros/um-anel/`** (transcrição manual para TS, markdown só citado em comentário); Posturas, Jornada, Conselho **inexistentes** no código; `vitals.ts` com 41 linhas; capítulo `01-` ausente (numeração salta 00 → 02).

3. **Fase A — pipeline (D13/D15).** Criado `livros/um-anel/compendio/` com 4 arquivos markdown PT-BR **estruturados** (formato determinístico `## ID — Nome` + `- **Campo:** valor` + `> Descrição:`), extraídos e traduzidos dos capítulos em inglês. `scripts/gen-um-anel.mjs` parseia e gera `data/compendiums/um-anel/*.json` + `index.json`. **67 entradas em 4 packs.**

4. **Guarda contra divergência** — o problema que D13 existe para matar: `scripts/verify-um-anel-compendium.mjs` regenera em memória e compara contagens, então markdown editado sem rodar `sync:data` **falha o check**. Testado na prática: adicionei uma entrada no markdown, o check acusou `8 → 9` e saiu com exit 1.

5. **Isolamento de hub respeitado** (princípio fundacional do PRD v1.0): `lib/character/um-anel/compendium.ts` é registry próprio. **Não** toquei em `lib/compendium/registry.ts`, que é do Eldarin.

6. **Compêndio de 6 → 10 categorias.** `TorCompendiumPage` ganhou `GeneratedPackSection`, uma renderização única que serve os 4 packs gerados — adicionar pack novo no script não exige tocar no componente.

7. **Fase C — posturas (D17).** `lib/combat/um-anel/stances.ts`: as 4 posturas com efeito real na rolagem. Nota importante do livro: `(1d)` é **Dado de Sucesso** (d6), não Dado de Proeza — então postura mexe em `rank`, nunca em favoured/illFavoured. Avançada +1d no ataque e +1d para quem te ataca; Defensiva −1d para quem te ataca e −1d por engajador; Retaguarda restringe alcance nos dois sentidos (barra o ataque antes de rolar). Ligado em `resolveTorAttack` com `stanceEffect` na mensagem de chat.

8. **D18 já estava pronto.** Conferi `resolve-attack.ts`: Golpe Perfurante, teste de Proteção vs Ferimento da arma, severidade (moderado/grave/gravíssimo), adversário eliminado com 1 Ferida, herói na 2ª Ferida morrendo — tudo implementado e correto. Não mexi.

9. **Adaptação registrada (D22 — sem hex):** o livro conta jornada em *hexes*; o compêndio usa **trecho** (1 trecho = 1 hex). A matemática é idêntica (as regras só contam unidades ao longo da rota), e o projeto purgou hexágonos.

10. **Validação:** `npx tsc --noEmit` limpo · `npm run build` compila · `npm run test` verde, agora com **24 testes novos de postura** · `sync:data:check` valida os 4 packs.

**Escopo NÃO entregue (registrado no PRD):** D14 (tradução dos 13 capítulos — maior item isolado), D19 (dados 3D), D20 (bestiário completo), D21/D23/D24 (Jornada jogável), D27 (motor de Sombra), D28 (Conselho jogável), D29 (progressão), D31 (aventuras), D32 (ficha + PDF). Os dados de Jornada, Sombra e Conselho **já estão no compêndio como referência**; falta a implementação jogável.

**D33 — divergência registrada:** o dono selecionou "leitor público dos capítulos". Não implementei público: o Eldarin é livro dele, o Um Anel é da Free League. Depois o dono esclareceu que **não quer publicar o livro**, só extrair para compêndios — que é exatamente o que foi feito. Divergência resolvida.

**Arquivos tocados:**
- `livros/um-anel/compendio/posturas.md` · `jornada.md` · `sombra.md` · `conselho.md` — **novos:** fonte da verdade PT-BR estruturada
- `scripts/gen-um-anel.mjs` — **novo:** parser markdown → JSON
- `scripts/verify-um-anel-compendium.mjs` — **novo:** guarda de divergência
- `scripts/verify-um-anel-stances.mjs` — **novo:** 24 testes da tabela de posturas
- `lib/character/um-anel/compendium.ts` — **novo:** registry isolado do Eldarin
- `lib/combat/um-anel/stances.ts` — **novo:** as 4 posturas + limites de engajamento
- `lib/combat/um-anel/resolve-attack.ts` — posturas ligadas na resolução; `blocked` e `stanceEffect`
- `components/compendium/TorCompendiumPage.tsx` — 4 categorias novas via `GeneratedPackSection`
- `data/compendiums/um-anel/*.json` — **gerados** (não editar à mão)
- `package.json` — `gen-um-anel` no `sync:data`; verificadores no `sync:data:check` e `test`; `sync:um-anel` e `test:um-anel`
- `docs/PRD-MESA-UM-ANEL.md` — PRD v2.0 com D13–D33

**Fase D (mesma sessão) — motor de Sombra (D25/D27):**

11. **`lib/combat/um-anel/shadow.ts`** — substitui o vazio deixado por `vitals.ts` (41 linhas, que só sabia aplicar dano de ataque). Implementa: 4 fontes de Sombra com resistibilidade correta (**Malfeito é a única não resistível** — regra que se erra com facilidade), Teste de Sombra reduzindo 1 + 1 por ícone, teto de Sombra na Esperança máxima com `overflow` registrado, Miserável (Sombra ≥ Esperança **atual**), Desfavorecido (Sombra ≥ Esperança **máxima**), Exausto (Fadiga ≥ Resistência), Endurecer a Vontade, Acesso de Loucura, Sucumbir à Sombra, e as três formas de recuperação (Descanso Prolongado, fim de jornada com Vigor de montaria + rolagem de Viagem, Curar Cicatrizes só em Yule).

12. **Condições são derivadas, não armazenadas.** `deriveTorSpiritFlags` calcula `miserable`/`weary`/`illFavoured`/`succumbed` a partir dos números. Guardar as duas coisas abriria espaço para dessincronizar — e Cicatrizes contam no total de Sombra para todos os efeitos, o que é fácil esquecer.

13. **As 24 Falhas dos Caminhos da Sombra** (6 caminhos × 4) extraídas para o compêndio e para `SHADOW_PATH_FLAWS` em `data.ts`. Os 6 caminhos e o mapeamento Vocação→Caminho já existiam; **as Falhas não** — e são justamente o que o Acesso de Loucura concede.

14. **Bug meu, pego pelo teste:** escrevi "Tesoureiro" como Vocação do Mal do Dragão; o nome real no código é **Caçador de Tesouros**. O teste que cruza compêndio × `data.ts` acusou. Corrigido.

15. **Teste meu estava errado, não o código:** a asserção negativa "Descanso não remove Cicatriz" usava `/applyTorProlongedRest[\s\S]*?shadowScars:/`, e o `[\s\S]*?` atravessa o arquivo casando com outra função abaixo. Adicionei `fnBody()` para escopar ao corpo da função. O código sempre esteve certo.

16. **Validação da Fase D:** `npm run test` verde com **54 testes novos de Sombra**. Compêndio subiu para **74 entradas**.

**Fase E (mesma sessão) — Jornada (D21/D23/D24):**

17. **`lib/combat/um-anel/journey.ts`** — sistema que não existia em código nenhum. Papéis (Guia único + Batedor/Olheiro/Caçador) com a perícia certa e validação de cobertura; Teste de Marcha (sucesso 3 + ícones; falha 2 trechos, ou 1 em estação fria); alvo do evento por Dado de Sucesso (o **Guia nunca é alvo** — é quem rola a Marcha); região definindo Favorecido/normal/Desfavorecido; tabela dos 7 eventos com Fadiga e consequência; terreno (estrada +1d, difícil −1d); duração, marcha forçada, áreas perigosas.

18. **Armadilha real que o teste tranca:** em `dice.ts` a Runa de Gandalf tem `numeric: 10`, o **mesmo** valor do 10 numérico. No Golpe Perfurante isso é conveniente de propósito (ambos perfuram). Na tabela de eventos são resultados **diferentes** — Visão Alegre vs Encontro Fortuito. Então `kind` tem de ser checado **antes** de `numeric`, e o teste compara os índices das duas checagens no fonte para garantir a ordem.

**Fase F (mesma sessão) — Conselho (D28):**

19. **`lib/combat/um-anel/council.ts`** — terceiro pilar, também inexistente. Resistência 3/6/9; Introdução definindo o limite de tempo (sucesso = Resistência + ícones; falha = Resistência **e** carrega Desastre para o fim); Interação acumulando 1 + ícones, com a tentativa contando mesmo na falha.

20. **Ordem que importa:** em `torCouncilOutcome`, alcançar a Resistência é checado **antes** de esgotar o limite — ganhar na última tentativa vale. Invertido, a vitória no limite viraria falha. O teste compara os índices.

21. **Teste meu estava estrito demais:** a asserção "sem hex no motor" (D22) falhava por causa do comentário que **documenta** a adaptação trecho↔hex. Passei a checar só o código, e adicionei uma asserção que exige que a explicação continue no comentário.

22. **Isolamento de hub verificado:** os 5 módulos novos do Um Anel não importam nada fora de `um-anel/`. Confirmado por grep.

**Fase G (mesma sessão) — progressão e Fase de Companhia (D29):**

23. **`lib/combat/um-anel/progression.ts`** — tabela de custos de Experiência (4/8/12/20/26/30 para atingir os níveis 1–6), limites por Fase, ganhos por novo grau, recuperação espiritual, calendário com Yule, Empreitadas e Nível de Companhia. Novo pack `progressao` no compêndio (23 entradas), que subiu para **5 packs / 97 entradas**.

24. **Três regras que se erram com facilidade, agora trancadas por teste:**
    - **Bolsos separados:** Perícia gasta pontos de *Perícia*; Proficiência, Valor e Sabedoria gastam pontos de *Aventura*. O teste verifica que cada função de preço **não** menciona o bolso errado.
    - **Valor OU Sabedoria:** comprar qualquer um dos dois bloqueia os dois na mesma Fase. `canBuyTorValourOrWisdomThisPhase` **não recebe** `which` de propósito — o parâmetro sugeriria uma checagem por eixo que não existe.
    - **Cicatrizes não saem na Fase.** A recuperação espiritual devolve Esperança e remove 1–3 Sombra conforme o resultado da Fase de Aventura, mas Cicatriz só pela Empreitada Curar Cicatrizes, em Yule. O teste usa `fnBody` para garantir que `applyTorSpiritualRecovery` nunca toca `shadowScars`.

25. **Yule modelado como consequência do calendário**, não como flag manual: `advanceTorCalendar` conta as Fases, e a terceira do ano vira o ano, envelhece todos em 1 e concede pontos de Perícia iguais à Astúcia.

26. **Empreitadas:** orçamento é 1 base + 1 grátis na Fase comum (máx. 2), e 1 por herói + 1 grátis no Yule. Duplicatas só são permitidas nas marcadas (Yule) — que é exatamente o que o livro abre.

27. **Terceiro erro meu em teste nesta sessão:** a asserção de isolamento de hub usava `/^import .*$/gm`, que pega só a primeira linha de um import multi-linha (`import {`) e não vê o `from "…/um-anel/shadow"` embaixo. Passei a extrair os especificadores de módulo via `from "…"`, e adicionei uma asserção de sanidade do próprio teste (tem de existir ao menos um import de `um-anel`) para o teste não passar por vacuidade.

28. **Validação final:** `tsc` limpo · build compila · `npm run test` verde com **263 testes novos do Um Anel** nesta sessão (24 posturas + 54 Sombra + 78 Jornada + 40 Conselho + 67 progressão).

**Nota de escopo importante:** os motores das Fases E, F e G estão prontos e testados, mas **sem UI**. As regras estão corretas e chamáveis; o jogador ainda não tem painel de Jornada, Conselho ou Fase de Companhia na mesa. Não confundir "motor pronto" com "jogável".

**Commits / deploy:** pendente local (push só quando o usuário pedir).

**Como testar:**
- `npm run sync:um-anel` → deve imprimir 4 packs, 74 entradas
- `npm run test:um-anel` → 263 testes (24 posturas + 54 Sombra + 78 Jornada + 40 Conselho + 67 progressão) + verificação dos packs
- Editar qualquer `livros/um-anel/compendio/*.md` **sem** rodar `sync:data` → `sync:data:check` deve **falhar**
- `/compendios` numa mesa do Um Anel → 10 categorias, com Combate e Posturas, Jornada, Conselho, Sombra e Miséria
- Na mesa: atacar com herói em Retaguarda usando arma corpo a corpo → deve ser **barrado** com mensagem, sem rolar dados

---

### 2026-08-03 — Refatoração responsiva: PC, tablet e celular

**Pedido:** refatorar design e funcionamento do MXDRPG para PC, celular e tablet.

**Passo a passo:**

1. **Diagnóstico (auditoria do repo inteiro):**
   - **Bloqueador crítico:** `isPanButton` em `useBattlefieldView.ts` exigia botão do meio ou Alt/Shift+clique. Em toque, `button === 0` sem modificador → **era impossível mover o mapa em celular ou tablet**. Zoom só por `wheel`, sem pinça. Zero ocorrências de `onTouchStart`/`touchstart` no projeto. A dica da toolbar admitia: "Scroll zoom · Alt pan".
   - **Zero consciência de dispositivo:** nenhum `isMobile`/`isTablet`/`pointer: coarse`. Todo responsivo era largura-only; o React nunca sabia se estava num dedo.
   - **17 breakpoints ad-hoc:** 380, 400, 420, 480, 520, 560, 600, 640, 720, 768, 800, 900, 1100, 22rem + um `min-width: 900px` isolado. Cada arquivo inventou o seu.
   - **Mesa virava página rolável em tablet:** `@media (max-width: 1100px)` fazia `.vtt-chrome { height: auto; overflow: auto }` e empilhava stage (52dvh) + dock (40dvh) + sidebar (38dvh). Pegava **iPad em paisagem (1024px)** — o aparelho com mais espaço sobrando.
   - **`env(safe-area-inset-*)` era no-op:** o projeto usava em vários lugares, mas sem `viewport-fit=cover` essas variáveis resolvem sempre 0.
   - **Três blocos de CSS morto:** (a) drawer do dock em ≤480px que nunca aparecia — o bloco de 720px aplicava `display: none` no mesmo elemento; (b) `@media 640px` do HUD mirando `.vtt-combat-hud__body/__actions/__portrait`, nomes de uma versão anterior — o HUD **nunca** se adaptou a celular; (c) regras do layout de mesa pré-Foundry (`.mesa-stage`, `.mesa-workspace-body`, `.mesa-dock--*`, `.vtt-sidebar`), inalcançáveis porque `MesaBattlefieldStage` sempre passa `foundryLayout`.

2. **Decisão:** mapa em tela cheia + bottom sheets (escolha do dono do produto entre 3 opções). Escala canônica de 5 degraus. Layout de PC estendido até 768px — iPad em paisagem passa a usar o layout de desktop, não o empilhado.

3. **Implementação:**
   - **Gestos:** pinça (zoom ancorado no ponto médio + pan no mesmo gesto) e `pointercancel` em `useBattlefieldView.ts`; ferramenta de mão opcional na toolbar (um dedo arrasta o mapa) com ícone `pan`. Um dedo sem a ferramenta continua indo para token/célula — nada de gameplay mudou.
   - **Long-press** já existia (520ms + vibração) e estava correto. Mas a pinça o quebrava: o `pointerup` do 1º dedo passa a ser reivindicado pela vista, então o timer nunca era limpo e o menu abria no meio do gesto. Corrigido abortando o estado transiente do ponteiro quando a vista assume o gesto.
   - **Escala canônica:** `479 / 767 / 1023 / 1279` + consultas de capacidade. 46 breakpoints normalizados por script; 2 colisões de seletor que a normalização criou em `friends.css` detectadas por script e corrigidas (o bloco de `lg` do `.friends-page__grid` tinha virado código morto).
   - **Mesa:** `.vtt-chrome` fica `100dvh` + `overflow: hidden` em todo tamanho. md (768–1023): dock sobrepõe o mapa. sm (≤767): dock vira folha inferior — antes era `display: none`, e os painéis ficavam **inalcançáveis** no celular.
   - **HUD:** responsivo reescrito nas classes reais (`hud-*`) em `eldarin-v4.css`, com caso de paisagem curta (linha única, retrato 60px) e `--safe-bottom`.
   - **Novo:** `app/responsive.css` (tokens por degrau, higiene touch, primitivas de drawer/sheet) e `hooks/useDeviceProfile.ts`.

4. **Validação:** `npx tsc --noEmit` limpo · `npm run build` compila · `npm run test` verde (PA, movimento, grid, PDF, consumíveis, compêndios, 83 monstros) · script de colisão de `@media` sem achados. `npm run lint` **não roda neste repo** (ESLint não configurado, abre prompt interativo) — condição pré-existente.

**Arquivos tocados:**
- `app/globals.css` — escala canônica documentada, tokens de toque/safe-area/gutter/mesa; `--gutter` ligado ao `.page-wrap`
- `app/responsive.css` — **novo:** tokens por degrau, higiene touch, `.r-drawer` / `.r-sheet` / `.r-scrim`
- `app/layout.tsx` — `export const viewport` com `viewportFit: cover` e `interactiveWidget: resizes-content`
- `hooks/useDeviceProfile.ts` — **novo:** tamanho, toque, orientação (SSR-safe)
- `hooks/vtt/useBattlefieldView.ts` — pinça, pan de um dedo, ferramenta de mão, `pointercancel`
- `hooks/vtt/useBattlefieldPointer.ts` — `openTokenMenuAt` extraído (clique direito e long-press pelo mesmo caminho)
- `components/vtt/battlefield/BattlefieldMapCanvas.tsx` — `pointercancel`, aborta long-press quando a vista assume o gesto
- `components/vtt/MapToolbar.tsx` / `MapToolbarIcon.tsx` — ferramenta de mão + ícone `pan`; dica por dispositivo via CSS
- `components/vtt/vtt.css` — bloco da mesa reescrito só com seletores vivos; CSS morto do HUD removido
- `components/vtt/foundry/foundry.css` — dock sobreposto (md), folha inferior (sm), paisagem curta; cascade morta de ≤480px removida
- `components/vtt/eldarin-v4.css` — HUD responsivo nas classes reais
- `components/vtt/whiteboard.css` — alvos de toque; paleta horizontal em paisagem curta
- `components/character/sheet-v2.css` — `min-width: 780px` → `min(780px, 100vw - 1.25rem)`
- `components/friends/friends.css` — popup vira folha no celular; colisão de `lg` corrigida
- `components/compendium/compendium.css` + 6 arquivos — 12 grids `auto-fill` com `min(100%, …)` anti-overflow

**Commits / deploy:** pendente local (push só quando o usuário pedir).

**Como testar:**
- **iPad paisagem (1024px):** a mesa **não** deve rolar verticalmente; layout de PC com rail + mapa + dock
- **iPad retrato (768–834px):** abrir um painel do rail → dock sobrepõe o mapa, mapa mantém a largura toda
- **Celular retrato (390px):** rail vira faixa no topo; painel do rail sobe como folha de baixo; HUD empilha as ações
- **Celular deitado (~390px de altura):** topbar some, paleta do mapa vira faixa horizontal no rodapé, HUD em linha única
- **Gestos (qualquer touch):** pinça dá zoom; dois dedos movem o mapa; toque longo no token abre o menu de ações; pinçar durante um toque longo **não** deve abrir o menu
- **Ficha em celular:** janela não estoura a tela na horizontal

---

### 2026-07-24 — Extração dos livros do "O Um Anel" + capa real do sistema

**Pedido:** "subi dentro da pasta os livros do TOR ou the one ring, quero que extraia tudo para montar o RPG dele também... quando você exportar toda essa parte a gente trabalha na tradução" + depois "usa essa imagem como capa do RPG de o um anel, recorte a imagem pra deixar perfeitamente quadrada".

**Passo a passo:**
1. **Extração** — usuário subiu 11 PDFs em `the one ring/` (Core Rules 248p, Rivendell 16p, Starter Set Rules 28p, Pre-generated Characters 16p, Stance/Journey Card 2p, + módulos de aventura/mapas fora do escopo desta leva). Lido o sumário do Core Rules pra mapear capítulos por página, e disparados 5 agentes em paralelo cobrindo o essencial pra ficha/habilidades/personagens/combate (capítulos 2 a 8 do Core Rules + Starter Set + Rivendell + personagens de exemplo) — módulos de aventura e o capítulo de lore do mundo ficaram de fora por enquanto (não pedidos explicitamente). Resultado: 10 arquivos markdown em `livros/um-anel/`, ~450KB, quase 7 mil linhas, conteúdo em inglês (tradução é etapa colaborativa futura). Confirmado que a discrepância de fórmula de TN entre as fichas de exemplo (TN=18−Atributo) e o livro de regras (TN=20−Atributo) não é erro — é uma variante oficial pra campanhas curtas que o Starter Set escolheu usar.
2. **Capa do sistema** — usuário mandou uma foto do Um Anel dourado no chat (sem arquivo acessível em disco) e depois subiu um arquivo diferente (`the one ring/capatheonering.png`, a capa oficial do livro "The One Ring", já 524×524px quadrada). Usado `sharp` (já instalado no projeto) pra recomprimir/normalizar (448KB→146KB, compatível com o tamanho das outras capas do hub) e salvo em `public/brand/rpg/um-anel-cover.png`, substituindo o placeholder SVG genérico criado na Fase 1.

**Arquivos tocados:**
- `livros/um-anel/02-*.md` a `livros/um-anel/11-*.md` — extração dos livros (novo)
- `public/brand/rpg/um-anel-cover.png` — capa real (novo, substitui `um-anel-cover.svg` removido)
- `lib/rpg/systems.ts` — `UM_ANEL_DEFAULT_COVER_SRC` apontando pro PNG novo

**Commits / deploy:** pendente local (aguardando push).

**Como testar:** `/mesas` deve mostrar a capa oficial do livro no card "O Um Anel" em vez do placeholder genérico.

---

### 2026-07-22 (2) — Ativar rpg_system em lib/db/rooms.ts (migration confirmada em produção)

**Pedido:** usuário rodou `npm run db:migrate` direto num pod de produção (`kubectl exec`) — saída confirmou schema aplicado sem erro. Ativar a leitura/escrita real da coluna, conforme TODO deixado na sessão anterior.

**Passo a passo:** removidos os 2 comentários TODO e reincluído `rpg_system` no SELECT de `fetchRoom` e no INSERT/VALUES de `saveRoom` em `lib/db/rooms.ts` — sem esses TODOs a coluna já existe em produção, então a leitura/escrita real é segura agora.

**Arquivos tocados:** `lib/db/rooms.ts`.

**Commits / deploy:** pendente local (aguardando push).

**Como testar:** criar uma mesa em "O Um Anel", recarregar a página e confirmar que o sistema persiste como `"um-anel"` (não regride pra `"eldarin"`); confirmar que mesas Eldarin existentes continuam carregando normalmente.

---

### 2026-07-22 — Fase 1 de "O Um Anel" (hub multi-sistema) + fix do seletor de RPG em /mesas

**Pedido:** "adicione agora a possibilidade de um RPG de O Um Anel também" — planejado antes de codar (ver `C:\Users\Raul\.claude\plans\peaceful-puzzling-hopper.md`). Depois, ainda na mesma leva: "tem que colocar também, pra escolher qual o RPG que vai jogar no hub, ta abrindo diretamente o Eldarin sem sequer antes selecionar a mesa".

**Passo a passo:**
1. **Investigação (3 agentes de exploração + 1 de design, plan mode)** — mapeado o quanto do código é genérico vs. específico do Eldarin: `RoomState`/chat/presença/revisão são reaproveitáveis; `CharacterSheet`, o wizard de criação, `lib/character/rules.ts` e `lib/combat/` são 100% Eldarin, sem camada de abstração. Já existia um scaffold cosmético de multi-sistema (`lib/rpg/systems.ts`: `RpgSystemId`, `Adventure.rpgSystemId`) nunca ligado a sala/ficha/combate. Plano completo em 5 fases aprovado antes de implementar.
2. **Fase 1 implementada** — novo membro `"um-anel"` em `RpgSystemId`/`RPG_SYSTEMS` (`available: true`, capa SVG própria); `app/rpg/um-anel/{layout,page}.tsx` espelhando `app/rpg/eldarin/`; `AdventureLobby` generalizado pra aceitar `rpgSystemId` como prop em vez de fixar `"eldarin"`; `RoomState.rpgSystemId` novo (copiado da aventura na criação da sala, tratado como imutável); links "voltar às mesas" em `app/aventura/[adventureId]/page.tsx` corrigidos pra apontar pro sistema certo (antes todos hardcoded pra `/rpg/eldarin`).
3. **Achado à parte — bug real no `/mesas`** — ao testar, o usuário notou que o hub abria direto no Eldarin sem escolher sistema. Investigação (workflow com 3 agentes: investigar → implementar → verificar) achou a causa: commit `f41393f` (28/06) tinha removido de propósito um seletor que já existia (`RpgSystemCoverCard` + `mesas-hub.css`, ambos ainda no código mas órfãos), justificado por "único sistema disponível" — premissa que deixou de valer com "um-anel" disponível. `app/mesas/page.tsx` restaurado como seletor real, mas agora inteligente: só redireciona direto se houver exatamente 1 sistema `available`, senão mostra o grid de cartas (Eldarin, O Um Anel, + "Em breve" pros placeholders).
4. **Risco de produção identificado e contido** — a coluna nova `eldarin_rooms.rpg_system` (pra Fase 1) não tem migration automática no deploy (`npm run db:migrate` roda só manual, o pipeline de CI não chama). Pra não quebrar a leitura de toda mesa em produção (Eldarin incluído) até a migration rodar, a leitura/escrita real do SQL em `lib/db/rooms.ts` foi deixada **defensiva de propósito** (TODO marcado no código): a coluna existe no tipo `RoomState` e é copiada em memória, mas o SELECT/INSERT ainda não referenciam `rpg_system` — `normalizeRpgSystemId(undefined)` resolve pra `"eldarin"` com segurança. Ativar de verdade é uma mudança de 2 linhas depois que a migration `018_room_rpg_system.sql` (já escrita, também embutida em `scripts/db/schema.mariadb.sql` via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) rodar em produção.
5. **Validação** — `tsc --noEmit` limpo em cada etapa. Testado em memória (`ELDARIN_DISABLE_DB=1`) via Puppeteer: criação de aventura "O Um Anel" com o sistema certo persistido, navegação `/aventura/[id]` voltando pro hub certo, `/mesas` mostrando as duas opções lado a lado, clique em cada uma levando pro lugar certo, mesa demo do Eldarin sem nenhuma regressão visual ou funcional.

**Arquivos tocados:**
- `lib/rpg/systems.ts` — sistema `"um-anel"` novo
- `app/rpg/um-anel/{layout,page}.tsx` — novo
- `app/mesas/page.tsx` — seletor restaurado (era redirect fixo pro Eldarin)
- `components/adventure/AdventureLobby.tsx` — `rpgSystemId` como prop
- `app/aventura/[adventureId]/page.tsx` — links "voltar às mesas" dinâmicos
- `lib/room/types.ts`, `lib/room/adventure-room.ts`, `lib/room/sync.ts` — `RoomState.rpgSystemId`
- `lib/db/rooms.ts` — plumbing pronto, SQL ainda defensivo (ver TODO no código)
- `scripts/db/schema.mariadb.sql`, `scripts/db/migrations/018_room_rpg_system.sql` — coluna nova (fresh installs + upgrade incremental)
- `public/brand/rpg/um-anel-cover.svg` — capa placeholder simples (mesmo padrão dos outros sistemas "em breve")

**Commits / deploy:** pendente local (aguardando push). **Pendência real:** rodar a migration `018_room_rpg_system.sql` (ou `npm run db:migrate`) em produção antes de ativar a leitura/escrita de `rpg_system` em `lib/db/rooms.ts` — combinar com o usuário antes desse próximo passo específico.

**Como testar:**
- `/mesas` autenticado deve mostrar as duas capas (Eldarin, O Um Anel) lado a lado, não redirecionar direto.
- Criar uma aventura em cada sistema e confirmar que "voltar às mesas" leva pro hub certo em cada caso.
- Mesa demo do Eldarin (`/mesa/demo`) continua idêntica.

---

### 2026-07-21 — Fix: arrastar personagem/monstro pro mapa não fazia nada (img sem draggable=false)

**Pedido:** "não estou conseguindo arrastar os personagens para a mesa nem monstros" — testado como mestre e como jogador, no Chrome, sem erro no console, sem nenhum feedback visual (cursor não muda, sem miniatura acompanhando o mouse).

**Passo a passo:**
1. **Diagnóstico** — reproduzi drag-and-drop de personagem e de monstro contra produção via eventos `DragEvent` sintéticos direto no elemento `[draggable='true']` do card inteiro: os dois funcionaram (`/tokens/place-actor` e `/tokens/spawn` retornaram 200). Isso descartou bug na lógica de `useMonsterSpawnDrop`/`spawn-drag.ts`/permissões — a mecânica em si está correta.
2. **Causa raiz** — mas o usuário relatou "nenhum feedback visual" ao tentar arrastar, o que só acontece se o `dragstart` nunca dispara no elemento certo. `ActorAvatar` (`PlayableCharactersPanel.tsx`), o avatar do painel de spawn de personagem (`PlayerSpawnPanel.tsx`) e `CompendiumIcon` (usado no ícone do monstro em `MonsterSpawnPanel.tsx`, quando a entrada tem imagem própria) renderizam um `<img>` **sem `draggable={false}`** dentro do card que já é `draggable`. `<img>` é nativamente arrastável no navegador — ao segurar o drag bem em cima do retrato/ícone (o alvo mais natural e visualmente óbvio do card), o Chrome inicia o drag nativo da IMAGEM em vez de deixar o `dragstart` do card pai (que grava o payload customizado) assumir — resultado: nenhum ghost visível do app, nenhuma mudança de cursor do app, e nenhum erro no console, batendo exatamente com o relato.
3. **Por que meus testes não pegaram isso** — simulei o drag mirando no centro do card (`getBoundingClientRect` do container inteiro), que na prática caía fora da área do avatar/ícone (posicionado à esquerda, menor que o card). Um usuário real, ao pegar visualmente "o personagem", naturalmente clica no retrato.
4. **Correção** — `draggable={false}` explícito nas 3 tags `<img>` (`ActorAvatar`, `PlayerSpawnPanel`'s avatar, `CompendiumIcon`) — com isso o navegador corretamente ignora a imagem e deixa o `draggable="true"` do card ancestral assumir o drag, como já acontecia quando o clique começava fora da imagem.
5. **Validação** — `tsc --noEmit` limpo. Comportamento é padrão de plataforma bem documentado (MDN): `draggable="false"` num filho reverte pro comportamento de arraste do ancestral mais próximo.

**Arquivos tocados:**
- `components/vtt/PlayableCharactersPanel.tsx` — avatar do personagem, `draggable={false}`
- `components/vtt/PlayerSpawnPanel.tsx` — avatar do personagem no painel de spawn, `draggable={false}`
- `components/compendium/CompendiumIcon.tsx` — ícone/imagem do compêndio (usado por monstros e outras entradas), `draggable={false}`

**Commits / deploy:** pendente local (aguardando push).

**Como testar:**
- Na mesa, abrir o painel "Personagens Jogáveis" ou "Invocar", segurar o clique **bem em cima do retrato/ícone** do personagem/monstro (não só no texto ao lado) e arrastar pro mapa — deve funcionar normalmente agora, com o ghost/cursor de arraste do app aparecendo.

---

### 2026-07-20 (3) — Timeout nas mutações de sala (ataque/habilidade podiam pendurar pra sempre)

**Pedido:** "o problema maior tem sido timeout, corrige ai deixa tudo bem organizado".

**Passo a passo:**
1. **Diagnóstico** — `refresh()` (o GET de polling em `hooks/useRoomSync.ts`) já tinha timeout de 20s com `AbortController` + retry/backoff. Mas as ~27 funções de **mutação** (`postRoomAttack`, `postRoomAbility`, `nextCombatTurn`, `moveRoomTokenBudget`, `patchRoomSettings`, etc.) faziam `fetch()` puro, **sem timeout algum**. Se o servidor travasse numa dessas (pool de conexão do banco esgotado, cold start, blip de rede), o fetch ficava pendurado indefinidamente — sem erro, sem retry, sem toast (o `attackBusyRef`/`inFlightRef` correspondente nunca liberava), o que bate exatamente com "trava sem avisar nada".
2. **Correção** — um helper único `roomFetch(url, init, fallback)` em `hooks/useRoomSync.ts`, com `AbortController` + timeout de 10s (generoso vs. o ~200-300ms medido em produção). Timeout vira `RoomApiHttpError` com status **504** (não 408/4xx) de propósito: `isRoomClientError` só considera 400-499 "erro de validação, não repetir" — um timeout é transiente (repetir pode funcionar), então cair no status 5xx faz ele automaticamente usar o mesmo caminho de retry + "servidor lento — sincronizando em segundo plano" que `Battlefield.tsx` já tinha pra erros de servidor.
3. **Organização** — as 27 funções de mutação (incluindo `patchRoomToken`, que nem usava `throwRoomApiError`, lançava `Error` genérico) foram todas refatoradas pra usar `roomFetch`, eliminando a duplicação do `if (!res.ok) await throwRoomApiError(...)` repetida em cada uma. `postRoomChat` ganhou `credentials: "same-origin"` que faltava, por consistência com todo o resto.
4. **Validação** — `tsc --noEmit` limpo. `refresh()` (polling) não foi tocado — já tinha seu próprio timeout/retry dedicado.

**Arquivos tocados:**
- `hooks/useRoomSync.ts` — helper `roomFetch` novo; todas as mutações de sala refatoradas pra usá-lo

**Commits / deploy:** pendente local (aguardando push).

**Como testar:**
- Fluxo normal de combate (atacar, usar habilidade, mover, passar turno) continua igual — o timeout só entra em ação se o servidor não responder em 10s.
- Não há como simular timeout real sem derrubar o servidor de propósito; a garantia é de código (nenhum `fetch` de mutação sem `AbortController` mais).

---

### 2026-07-20 (2) — Segunda leva de corte nos timings de FX de combate

**Pedido:** "acho que o tempo de execução do combate ta mto lento ainda, muito lento mesmo" — depois de confirmar que o motor de combate em si (turno, alcance, PA, dano) funciona certo em produção.

**Passo a passo:**
1. **Diagnóstico** — medi o round-trip real da API contra produção (`/combat/attack`, `/combat/ability`, `/combat/next-turn`): ~200-270ms, rápido. A lentidão não é servidor — é o cliente.
2. **Causa raiz** — `components/vtt/CombatFxLayer.tsx` roda uma máquina de estado (mark→roll→result→damage→done) usando `COMBAT_DICE_TIMINGS`; somando os passos (settle do d20 + settle do dano + `afterResolve` + `evictMs`) dava ~2.7s por ação **com dano**, e `useBattlefieldCombatFxQueue.ts` toca essa sequência **uma de cada vez, em fila estrita** (`combatFxQueueRef`) — ou seja, cada corte nesses timings multiplica pelo número de ações no round (várias habilidades/ataques em sequência, monstros do mestre, etc.), o que explica a sensação de lentidão acumulada mesmo com o servidor respondendo rápido.
3. **Correção** — segunda leva de corte em `lib/vtt/combat-dice-model.ts` (a primeira leva, na sessão anterior, já tinha cortado `afterResolve` 2800→1400 e `missHold` 800→500): `afterResolve` 1400→650, `missHold` 500→320, `evictMs` 600→350 (tempos de espera pura, sem física — seguros). `COMBAT_DICE_SETTLE_MS` cortado com mais moderação (480→400) por depender da física real do dice-box (gravity/damping não tocados, pra não revelar o resultado antes do dado parar de rolar visualmente). Corrigida também uma inconsistência: a variante `_REDUCED` (motion reduzido) tinha `afterResolve`/`missHold` **maiores** que a normal — agora é sempre mais rápida. `settleTimeout` do dice-box (antes número mágico duplicado) passou a referenciar a constante.
4. **Validação** — `tsc --noEmit` limpo. Estimativa: sequência de acerto+dano cai de ~2,77s para ~1,5s (~46% mais rápido); um erro (miss) cai de ~2,4s para ~1,3s. Sem mudança de lógica — só constantes de tempo.

**Arquivos tocados:**
- `lib/vtt/combat-dice-model.ts` — timings de FX de combate cortados pela segunda vez; `settleTimeout` referenciando constante em vez de número mágico

**Commits / deploy:** pendente local (aguardando push).

**Como testar:**
- Em combate, executar um ataque/habilidade com dano e cronometrar do clique até o painel de resultado desaparecer — deve ficar bem mais rápido que antes.
- Testar com "reduzir movimento" (prefers-reduced-motion) ativado no SO/navegador — deve ficar ainda mais rápido, nunca mais lento que o modo normal.

---

### 2026-07-20 — Diagnóstico "combate cagado" + habilidades cortadas na ficha popup

**Pedido:** "sobre o combate ainda ta cagado" (screenshots de `/combat/ability` e `/combat/attack` retornando 400 em produção) + "as habilidades ainda tão com tooltips cortados" (fix anterior de `fullLabel`/aria-label não resolveu).

**Passo a passo:**
1. **Reprodução em produção** — com Puppeteer-core logado como `mestre` em `www.mxdrpg.com.br/mesa/demo`, cheguei à conclusão de que existem duas UIs de habilidade distintas (sub-menu interno do `TokenActionRing` vs. `AbilityPickerPanel` externo); confirmei que `onOpenAbilityPicker`/`onOpenSpellPicker` são sempre passados em `Battlefield.tsx`, então o sub-menu interno (`ringView === "ability"/"spell"`, com truncamento JS + `-webkit-line-clamp`) é **código morto** — não é o que o usuário vê.
2. **Bug real das habilidades cortadas** — testei o `AbilityPickerPanel` (sem truncamento, texto completo) e depois a ficha popup flutuante na mesa (ícone "Ficha" → aba "Habilidades"). Via `getBoundingClientRect` + `elementFromPoint`, confirmei que a lista de habilidades renderiza **abaixo da área visível** da janela flutuante (`.foundry-window__body`, `overflow:auto`, mas altura padrão de 680px insuficiente pro conteúdo do cabeçalho+atributos+traços+culinária que fica **acima** das abas) — sem scroll visível óbvio, a lista fica invisível/não-hoverável, exatamente como "cortada".
3. **Fix 1** — `hooks/vtt/useFoundryWindows.ts`: altura padrão do popup `character` 680→820px. `components/character/CharacterSheet.tsx`: ao clicar numa aba (`Habilidades`/`Magias`/etc.) na variante popup, `tabStripRef.current.scrollIntoView({block:"start", behavior:"smooth"})` — traz a lista pra vista sem precisar o usuário descobrir que precisa rolar a janela inteira.
4. **Bug real dos 400 em combate** — testei `/api/room/demo/combat/attack` direto (via `fetch` autenticado como mestre) com atacante fora do turno ativo → `400 "Aguarde seu turno na iniciativa"`; com atacante certo mas alvo fora de alcance → `400 "Fora de alcance (2 cél., máx 1)"`. Ambos são **validações corretas do jogo**, não bugs de lógica.
5. **Causa raiz real** — `grep` em `components/vtt/Battlefield.tsx` mostrou `actionErr`/`setActionErr` usado em **~30 pontos** (toda falha de ataque/habilidade/magia/movimento/mapa seta essa state), mas **nunca lido/renderizado** em lugar nenhum do componente — só o path de "remover token" também chamava `toast.push` manualmente. Ou seja: toda rejeição de ação (fora de alcance, fora do turno, alvo inválido etc.) era computada corretamente pelo servidor, capturada no cliente, e **descartada silenciosamente** — o jogador só via um 400 genérico no Network tab, sem nenhuma mensagem visível na tela. Essa é a explicação mais provável pra "combate cagado".
6. **Fix 2** — `components/vtt/Battlefield.tsx`: `useEffect` que dispara `toast.push(actionErr, "warn")` sempre que `actionErr` muda pra um valor não-nulo, cobrindo todos os ~30 call sites de uma vez; removida a chamada manual duplicada de toast no path de remover token (agora coberta pelo efeito).
7. **Validação** — `tsc --noEmit` limpo. Reprodução local (Puppeteer contra `localhost:3000`) confirmou visualmente que a aba Habilidades agora aparece cheia e hoverável sem scroll manual, com o tooltip completo (`sheet-hover-tip__bubble--portal`) sem nenhum recorte.

**Arquivos tocados:**
- `hooks/vtt/useFoundryWindows.ts` — altura padrão do popup de ficha 680→820
- `components/character/CharacterSheet.tsx` — scroll automático da aba pro topo visível na variante popup
- `components/vtt/Battlefield.tsx` — toast automático para qualquer `actionErr` não-nulo; remove duplicação no path de remover token

**Commits / deploy:** pendente local (aguardando push).

**Como testar:**
- Na mesa, abrir a ficha de um personagem pelo ícone lateral "Ficha" → clicar em "Habilidades"/"Magias": a lista deve aparecer cheia, sem precisar rolar manualmente.
- Em combate, tentar atacar fora do turno ou um alvo fora de alcance: deve aparecer um toast (canto da tela, perto do HUD) com a razão exata, não só falhar em silêncio.

---

### 2026-07-14 — Fix CI: job data-sync falhando (técnicas de Chi editadas a mão)

**Pedido:** "conserte isso" — screenshot de notificação do GitHub mostrando `CI / data-sync` falhando.

**Passo a passo:**
1. **Diagnóstico** — `data/compendiums/habilidades.json` é um arquivo **derivado**: `scripts/generate-compendium.mjs` o gera a partir de um array `ABILITY_CATALOG` hardcoded no próprio script (não lê markdown pra habilidades — só usa `BOOK_HAB` como metadado de citação). O job `data-sync` da CI roda `npm run sync:data` (regenera tudo) e depois `git diff --exit-code` nos arquivos derivados — se a regeneração não bater com o que está commitado, falha com "Run npm run sync:data locally and commit generated files."
2. **Causa raiz** — o commit anterior (`60893e0`, sessão de trabalho antes desta) adicionou 5 técnicas de Chi do Espiritualista (Golpe de Chi, Passo do Vácuo, Ferida Aberta, Golpe do Vácuo, Muro de Chi) direto no JSON, sem tocar no gerador. Rodando `npm run sync:data` localmente, essas 5 entradas eram apagadas (confirmei via `git diff` antes de corrigir).
3. **Correção** — `scripts/generate-compendium.mjs`: novo array `CHI_ABILITY_CATALOG` (mesmo formato de `ABILITY_CATALOG`, mais o campo `chi` pro custo) gerando as mesmas 5 entradas com `id`/`catalogId`/`bookRef` idênticos aos que já estavam commitados (`chi-*`, `CHI-*`, `ESPIRITUALISTA-CRIACAO-PERSONAGEM.md`), incluindo `tactical.custoChi` que o catálogo genérico de habilidades não tinha.
4. **Validação** — revertido os arquivos derivados pro estado commitado, rodado `npm run sync:data` de novo: `habilidades.json`/`monstros.json`/`LIVRO-DO-MESTRE.md` regeneraram byte-a-byte iguais ao commitado; só `livros/TABELA-IDS-ELDARIN.md` mudou de fato (passou a listar os 5 novos `catalogId` CHI-*, contagem 50→55) — exatamente o esperado, e esse arquivo faz parte do que a CI compara. `npm run sync:data:check` e o `git diff --exit-code` simulado localmente (nos mesmos paths que o workflow checa) confirmaram zero diferença antes do commit.

**Arquivos tocados:**
- `scripts/generate-compendium.mjs` — `CHI_ABILITY_CATALOG` novo, `ABILITIES` passa a concatenar os dois catálogos
- `livros/TABELA-IDS-ELDARIN.md` — regenerado (5 novos catalogIds)

**Commits / deploy:** `b7e2c15`, enviado. CI disparada de novo pro commit novo — acompanhar em https://github.com/MaulXD/MXDRPG/actions.

**Como testar:**
- `npm run sync:data && git status --short` não deve mostrar nenhum arquivo em `data/compendiums/`, `livros/TABELA-IDS-ELDARIN.md`, `data/character/subclass-tracks.json` ou `lib/character/loot-catalog.ts`
- Job `CI / data-sync` no GitHub Actions deve passar verde no próximo push que toque `data/compendiums/**` ou `livros/**`

---

### 2026-07-14 — Quarta leva: render caro da ficha (objeto `live` sem memo)

**Pedido:** continuação de "coloque tudo isso em prática" — último item do relatório de render de componentes React da rodada anterior.

**Passo a passo:**
1. **`components/character/CharacterSheet.tsx`** — o objeto `live` (ficha "efetiva", mesclando `roomActor`/`sheetBase`/`character`) era reconstruído via spread literal em **todo** render, nunca memoizado. Como `live` é passado como prop `actor` pra ~10 painéis filhos, qualquer mudança de estado local não relacionada (trocar aba, abrir picker, selecionar item) invalidava a identidade de `live` e propagava recomputação cara pra baixo (`listCombatActions` em `CombatLoadoutPanel`/`SheetPopupLoadoutBar`, roadmap de níveis futuros, preview de identidade). Envolvido em `useMemo` com deps `[roomActor, sheetBase, character]` — resolve os itens filhos automaticamente, já que eles dependem da mesma referência de `actor`.
2. **`FutureLevelsPanel.tsx`** e **`CharacterIdentityEditor.tsx`** — além de dependerem de `actor` (agora estável), os dois recalculavam (`buildFutureLevelRoadmap`/`upcomingRacialMilestones`/`describeIdentity`) mesmo com o painel colapsado/fechado. Adicionado gate por `open` nas duas — só computa quando expandido.
3. **`Battlefield.tsx`** — `statusDelegateCandidates` (filter+map sobre membros da sala) recalculava em todo render do componente mais "quente" da mesa, mesmo quando o modal de status nem estava aberto. Envolvido em `useMemo` gateado por `modalStatusToken`.
4. **Decidido não tocar** — o efeito de `keydown` global em `CharacterSheet.tsx` tem `inventory` nas deps mas só o lê via closure de `removeItem`; remover a dependência sem também memoizar `removeItem` corretamente introduziria um bug de closure obsoleta (deletar item baseado em inventário desatualizado). O ganho seria mínimo (só evita um re-subscribe de listener, operação barata) — risco não compensa.
5. **Validação** — `npx tsc --noEmit`, `npm run build`, `npm test` limpos. Verificação visual ao vivo (Chrome real via Puppeteer) na ficha de `/personagem/pc-thrain-ferroescudo`: abri o painel "Níveis futuros" e confirmei via DOM que `aria-expanded="true"` e o corpo do painel (`.sheet-future-levels__body`) renderiza corretamente — sem erros novos de console.

**Arquivos tocados:**
- `components/character/CharacterSheet.tsx` — `live` memoizado
- `components/character/FutureLevelsPanel.tsx` — roadmap/marcos raciais gateados por `open`
- `components/character/CharacterIdentityEditor.tsx` — preview de identidade gateado por `open`
- `components/vtt/Battlefield.tsx` — `statusDelegateCandidates` memoizado e gateado

**Commits / deploy:** local, aguardando push.

**Como testar:**
- Abrir a ficha de um personagem, trocar de aba várias vezes → painéis de combate/talentos não devem "piscar"/recalcular visivelmente
- Abrir e fechar "Níveis futuros" e "Editar raça/classe/atributos" → devem continuar funcionando normalmente

---

### 2026-07-14 — Terceira leva: lazy-load restante + N+1 sistêmico em rotas de sala

**Pedido:** "coloque tudo isso em prática" — implementar os achados de 3 novas auditorias em paralelo (render de componentes React pesados, N+1 restante nas rotas de API, bundle/lazy-load restante).

**Achados e o que foi feito:**

1. **`MesaCharacterWizardPopup` importado estático** (`MesaFoundryFloatingWindows.tsx`) enquanto os 3 vizinhos do mesmo arquivo (`DiceRoller`, `CharacterSheetPopup`, `MonsterSheetPopup`) já usavam `next/dynamic`. Corrigido, e o mesmo para `MonsterSpawnPanel` (ferramenta só do mestre) nos dois arquivos que o usam. **Resultado medido:** `/mesa/[roomId]` caiu de 331 kB → 268 kB de First Load JS.
2. **`CharacterSheet.tsx`** importava estático `LevelUpWizard` (+`TalentTreeGraph`), `LootEconomyPanel`, `PersonalBestiaryPanel`, `SpellPrepPanel` — todos só renderizados sob aba/condição específica. Convertidos para `next/dynamic`. `/personagem/[id]`: 311 kB → 305 kB.
3. **`getRoom(roomId)` chamado 2-3x por request** — padrão sistêmico: rotas que já autorizam via `requireRoomManage`/`requireRoomSpawn`/`requireRoomMember` (e já recebem `room` de volta) chamavam funções em `lib/room/handlers/tokens.ts`/`actors.ts`/`room-lifecycle.ts` que refaziam o fetch internamente. Só `moveRoomToken` já tinha o padrão certo (`opts.room ?? await getRoom(roomId)`). Estendido esse padrão para: `spawnRoomMonster`, `repositionRoomToken`, `placeRoomActorOnCell`, `updateRoomToken`, `removeRoomToken`, `getRoomActor`, `getRoomSnapshot`, `updateRoomActor`, `levelUpRoomActor` — e atualizadas as rotas que já tinham o `room`/`auth.room` em mãos pra passar adiante em vez de deixar refazer o fetch.
4. **`lib/character/characters.ts:saveCharacter`** — mesmo anti-padrão já corrigido em `resolveCharacter` na sessão anterior: fazia `resolveCharacter(saved.id)` só para confirmar existência e descartava o resultado. Removido (roda em todo write de personagem: PATCH, level-up, edit-save, wizard).
5. **`lib/room/adventure-actors.ts`** — dois loops `for...of` com `await` sequencial por participante da mesa (`resolveCharacterAccount`, `listCharactersForUserInAdventure`), chamados por `syncAdventureActorsForRoom` (entrar na mesa, criar ficha, level-up, sync de retrato). Paralelizados com `Promise.all`.
6. **`app/api/adventures/[adventureId]/members/route.ts`** — N+1 real: resolvia conta canônica de cada membro em sequência. Reescrito para resolver todos em paralelo e só depois aplicar a deduplicação (por id bruto e por id canônico, preservando a lógica original).
7. **`app/api/room/[roomId]/gm/saving-throw/route.ts`** — buscava a sala de novo só para repassar `roomId/ownerId/memberIds/settings` ao `snapshotForViewer`, já disponíveis em `auth.room`. Removido o fetch extra.
8. **`app/api/characters/[id]/route.ts` GET** — `resolveCharacter` e a busca do grant de edição aprovado eram sequenciais sem depender um do outro. Paralelizados. (O mesmo no PATCH tinha ramificação condicional mais arriscada de tocar — deixado como está.)
9. **Validação** — `npx tsc --noEmit`, `npm run build`, `npm test` limpos. Além disso, smoke test manual ao vivo (script descartável, script/curl direto contra servidor local em memória) cobrindo spawn/reposition/patch/delete de token, patch de ator, place-actor, saving-throw e level-up — todos os endpoints tocados responderam corretamente (a única rejeição foi uma regra de negócio legítima: personagem sem XP suficiente pra subir de nível).

**Não feito ainda (fica pra próxima):**
- Render caro em `CharacterSheet.tsx` (objeto `live` reconstruído em todo render, sem memo — acumulado ao longo desta sessão para uma leva dedicada de otimização de render).
- Índice de banco (`JSON_CONTAINS`+`OR` em `member_ids`) e consolidação do `ensureDbMigrations` — ainda exigem decisão de schema.

**Arquivos tocados:**
- `components/vtt/mesa/MesaFoundryFloatingWindows.tsx`, `MesaFoundryDockRail.tsx` — `MesaCharacterWizardPopup`/`MonsterSpawnPanel` como `next/dynamic`
- `components/character/CharacterSheet.tsx` — 4 painéis como `next/dynamic`
- `lib/room/handlers/tokens.ts`, `actors.ts`, `room-lifecycle.ts` — `opts.room` opcional em 9 funções
- `app/api/room/[roomId]/tokens/{place-actor,reposition,spawn,[tokenId],[tokenId]/delegate}/route.ts`, `app/api/room/[roomId]/actors/[actorId]/{route,level-up/route}.ts`, `app/api/room/[roomId]/gm/saving-throw/route.ts` — passam `room`/`auth.room` já obtido
- `lib/character/characters.ts` — `saveCharacter` sem releitura descartada
- `lib/room/adventure-actors.ts` — dois loops paralelizados
- `app/api/adventures/[adventureId]/members/route.ts` — resolução de membros paralelizada
- `app/api/characters/[id]/route.ts` — GET paralelizado

**Commits / deploy:** local, aguardando push.

**Como testar:**
- Mestre invocar monstro, reposicionar, editar cor do token e remover → tudo deve continuar funcionando normalmente
- Jogador editar biografia da própria ficha, subir de nível → sem mudança de comportamento
- `/mesa/[roomId]` e `/personagem/[id]` devem carregar visivelmente mais rápido (bundle menor)

---

### 2026-07-14 — Lista de melhorias + segunda leva de correções

**Pedido:** "me faça lista de coisas que podem melhorar e comece a por em prática" — continuação da varredura de performance da sessão anterior.

**Lista levantada (com base nas 4 auditorias da sessão anterior + nova checagem):**

Feitas nesta sessão:
1. Poll de combate mais lento que o de exploração (2500ms vs 2000ms) — invertido, devia ser mais rápido
2. `usePassTurn`: flag `busy` nunca ficava `true` — botão "Passar turno" nunca mostrava estado de carregamento
3. `getEntry` do compêndio fazia busca linear (`.find()`) a cada chamada — hot path usado por item de inventário
4. Escrita de sala + escrita de aventura sequenciais na criação de mesa — paralelizadas
5. `CampaignLobby.tsx` — componente morto, zero imports em todo o repo — removido
6. Erro de banco na listagem de mesas era mascarado como "0 mesas" (`degraded:true` nunca lido pelo cliente) — agora mostra aviso

Levantadas, não feitas (maior risco/esforço, ficam para depois):
7. `listRoomsForOwnerOrMember`/`adventures` usa `JSON_CONTAINS` + `OR` em `member_ids` — sem índice usável, gera full table scan; hoje rápido (tabela pequena), primeiro ponto a degradar com o crescimento da base. Precisa de migration (coluna gerada + índice, ou tabela de junção).
8. `ensureDbMigrations` importado/chamado em 23 rotas diferentes — sinal de migration temporária que devia ser uma migration de verdade e sair do hot path.
9. `CharacterCreationWizard.tsx`: `previewLines`/`invalidSteps` recalculam a cada tecla digitada (nome/biografia), porque dependem do objeto `draft` inteiro. Baixo impacto real (cálculo barato), mas seria mais correto memoizar só nos campos que de fato mudam o preview.
10. Cascata de normalizações redundantes no save de ficha (já anotado na sessão anterior) — não mexido, área sensível.

**Passo a passo:**
1. `hooks/useRoomSync.ts` — `COMBAT_POLL_INTERVAL_MS` 2500→1200ms (mais rápido que o poll base de exploração, como já era o caso do backup poll via SSE).
2. `hooks/vtt/usePassTurn.ts` — adicionado `setBusy(true)` no início de `passTurn()`; antes ele ia direto pra `false` sem nunca ter sido `true`.
3. `lib/compendium/registry.ts` — `getEntry` passou a usar um `Map` por pack (`indexForPack`, lazy) em vez de `.find()` linear no array.
4. `lib/adventure/store.ts` — `createAdventure` agora dispara `createRoomForAdventure` e `dbAdventures.saveAdventure` com `Promise.all` (confirmado: sem foreign key entre as tabelas, seguro paralelizar; rollback em caso de erro continua igual).
5. `components/campaign/CampaignLobby.tsx` — removido (confirmado zero referências no repo).
6. `components/adventure/AdventureLobby.tsx` — `load()` agora seta `error` quando a API responde `degraded:true`, em vez de mostrar silenciosamente "nenhuma mesa".
7. **Validação** — `npx tsc --noEmit` limpo, `npm run build` limpo, `npm test` (verify-pa-bank, verify-movement-pa, verify-grid-path, verify-sheet-pdf, verify-consumables, sync:data:check) todos OK.

**Arquivos tocados:**
- `hooks/useRoomSync.ts` — poll de combate mais rápido
- `hooks/vtt/usePassTurn.ts` — `busy` reflete o request de verdade
- `lib/compendium/registry.ts` — `getEntry` com índice O(1)
- `lib/adventure/store.ts` — escritas paralelas na criação de mesa
- `components/campaign/CampaignLobby.tsx` — removido (morto)
- `components/adventure/AdventureLobby.tsx` — erro visível quando a listagem degrada

**Commits / deploy:** local, aguardando push.

**Como testar:**
- Passar o turno na mesa → botão deve mostrar "Passando…"/"…" brevemente
- Criar uma mesa nova → sem mudança visível esperada (só mais rápido internamente)
- `npm test` deve passar limpo

---

### 2026-07-14 — Varredura de performance: "lento pra jogar" + ataques travando na mesa

**Pedido:** depois do fix de featIds, o usuário pediu uma varredura completa — revisar criação de mesa, criação de personagem e o tempo de jogatina, já que a mesa estava "tão lenta pra jogar".

**Passo a passo:**

1. **Auditoria em paralelo** — 4 agentes investigaram simultaneamente: criação de mesa, criação/edição de ficha, loop de jogatina (combate/turnos/sync) e a camada transversal de DB/API/build. Achados principais: N+1 sequencial em `enrichAdventureListItems` (tela "Suas mesas"), cascata de 5-10 normalizações redundantes por save de ficha, `resolveCharacter` lendo e normalizando o registry mesmo quando o Postgres já respondeu, bundle do chat carregando `three` (~600KB) sempre, e — o achado de maior impacto — a fila de FX de combate bloqueando a sincronização de **toda a mesa** (não só do token atacando) enquanto a animação de ataque tocava (~4s por ação).
2. **Bug crítico relatado ("ataques e habilidades não funcionam")** — reproduzido de ponta a ponta com Chrome real via Puppeteer (login, abrir anel de ação, atacar). O ataque **funciona** — PA é gasto, dano é aplicado — mas a UI trava em "Aguardando servidor…" por ~4-12s porque (a) `afterResolve` estava em 2800ms e (b) `Battlefield.tsx` congelava a sincronização de TODOS os tokens da sala enquanto qualquer FX local tocava, não só do atacante/defensor envolvidos. Some das duas causas explica a sensação de "não funciona" quando na verdade só está lento.
3. **Correção do bloqueio de sync** — `Battlefield.tsx`: nova `collectProtectedTokenIds()` reúne os tokens presos na FX de combate ativa/na fila (`attackerTokenId`, `defenderTokenId`, `areaTargets`) e no token em animação de movimento. Em `syncRoom`, quando a cena é "deferida", agora aplica o snapshot novo imediatamente para todos os tokens EXCETO os protegidos — só esses continuam com o estado antigo até a FX terminar (`onCombatFxDone` já cuidava do flush final, isso não mudou).
4. **Redução moderada de delays** — `lib/vtt/combat-dice-model.ts`: `afterResolve` 2800→1400ms, `missHold` 800→500ms. Mantém tempo de leitura do resultado, corta a espera morta depois que ele já apareceu na tela.
5. **N+1 na lista de mesas** — `lib/adventure/list-enrich.ts`: loop sequencial `for...of` (4 operações por mesa) virou `Promise.all(items.map(...))`, com `getAdventure`/`getRoom` e `fetchUserRows`/`onlineUserIdsForRoom` também paralelizados dentro de cada item.
6. **Leitura de ficha descartada** — `lib/character/characters.ts`: `resolveCharacter` parava de consultar (e normalizar) o registry em memória incondicionalmente; agora só faz isso quando o Postgres está desligado ou falhou.
7. **Bundle do chat** — `components/vtt/RoomChat.tsx`: `DiceBoxMini` (que arrasta `DiceMiniature` → `DiceWebGL` → `three`) passou a ser `next/dynamic({ssr:false})`, igual ao padrão já usado em `DiceRoller`. Deixa de ir no bundle inicial da mesa.
8. **Tooltip truncado no anel de ações** — investigando o bug visual reportado ("Golpe de C..." cortado), achei que `TokenActionRing.tsx` usava o `label` já truncado (11/14/22 chars, pensado pro círculo pequeno) também no `aria-label` do slot — que pode aparecer como tooltip visível via leitor de tela ou extensão de acessibilidade. Adicionado `fullLabel` (nome completo, sem corte) ao `DisplaySlot`, usado agora no `aria-label` do slot e do botão de info.
9. **Layout duplicado — "Personagens Jogáveis"** — não reproduzi o print exato (testei em 899×1400 sem sucesso), mas ao ler o código encontrei a causa real por inspeção: `PlayableCharactersPanel.tsx` renderizava seu próprio `<p className="vtt-eyebrow">Personagens jogáveis</p>`, só que os DOIS lugares que o usam (`MesaFoundryDockRail.tsx` e `MesaFoundryFloatingWindows.tsx`) já passam `title="Personagens jogáveis"` para a moldura (`FoundryDockPanel`/`FoundryWindow`), que renderiza isso num `<h2>` próprio — cabeçalho genuinamente duplicado, um por cima do outro. Removido o eyebrow interno (redundante nos dois usos).
10. **Ícones da barra lateral com texto "grudado"** — `MesaIconBar.tsx` mostra label + tooltip (com o mesmo nome de novo) por CSS puro `:hover`/`:focus-visible`. Em navegador touch, `:hover` pode não desfazer ao soltar o dedo (bug clássico de mobile web) — cada ícone tocado anteriormente fica com o tooltip "grudado", parecendo texto duplicado. Corrigido: o gatilho `:hover` só ativa quando `@media (hover: hover) and (pointer: fine)` (mouse de verdade); `:focus-visible` continua funcionando para teclado em qualquer dispositivo. Mesmo padrão corrigido em `.condition-chip__tooltip` (ícones de condição/status no token) em `eldarin-v4.css`.
11. **Cascata de normalizações redundantes no save de ficha** — não tocada nesta sessão (achado #2 da auditoria de personagem). É uma refatoração de maior risco em área que já teve uma regressão hoje; fica para uma sessão dedicada com mais tempo de teste.
12. **Validação** — `npx tsc --noEmit` limpo, `npm run build` limpo (duas rodadas, uma por leva de fixes). Fluxo de ataque re-testado de ponta a ponta com Chrome real (Puppeteer) após as mudanças — sem novos erros de console; `scripts/smoke/combat-core.mjs` continua falhando por bug pré-existente do próprio script (não entende respostas delta), não é regressão desta sessão.

**Arquivos tocados:**
- `components/vtt/Battlefield.tsx` — `collectProtectedTokenIds` + `syncRoom` aplica cena parcial durante defer
- `lib/vtt/combat-dice-model.ts` — `afterResolve`/`missHold` reduzidos
- `lib/adventure/list-enrich.ts` — `enrichAdventureListItems` paralelizado com `Promise.all`
- `lib/character/characters.ts` — `resolveCharacter` só lê o registry quando precisa
- `components/vtt/RoomChat.tsx` — `DiceBoxMini` como `next/dynamic`
- `components/vtt/TokenActionRing.tsx` — `fullLabel` sem corte no `aria-label`
- `components/vtt/PlayableCharactersPanel.tsx` — removido eyebrow duplicado do título
- `components/vtt/foundry/foundry.css` — tooltip do icon bar só em `(hover: hover) and (pointer: fine)`
- `components/vtt/eldarin-v4.css` — mesmo guard em `.condition-chip__tooltip`

**Commits / deploy:** local, aguardando push.

**Como testar:**
- Atacar um monstro na mesa demo → resultado deve aparecer mais rápido (~2,7s em vez de ~4,1s por acerto)
- Com dois tokens de jogadores diferentes em combate, um atacando não deve mais congelar a posição/HP de tokens não envolvidos na FX
- Abrir "Suas mesas" com várias mesas cadastradas → carregamento deve ser sensivelmente mais rápido
- Abrir o chat da mesa sem rolar nenhum dado → bundle inicial não deve mais incluir `three.js`
- Abrir "Personagens Jogáveis" (dock ou janela flutuante) → só um cabeçalho "Personagens Jogáveis", não dois empilhados
- Em celular/tablet (touch), tocar os ícones da barra lateral um por um → nenhum tooltip deve ficar "grudado" atrás do próximo

---

### 2026-07-14 — Fix regressão: featIds e escolhaPericiaAntecedente apagados ao salvar ficha

**Pedido:** "a criação de fichas está bugada".

**Passo a passo:**
1. **Diagnóstico** — agente de exploração mapeou o fluxo de criação/edição de ficha e comparou com o diff do commit anterior (60893e0, sistema de talentos universais). Achado: `lib/character/types.ts` ganhou os campos `featIds` (talentos universais) e `escolhaPericiaAntecedente` (perícia livre do antecedente Aventureiro) em `CharacterIdentity`, mas `normalizeIdentity()` em `lib/character/normalize.ts` reconstrói o objeto `CharacterIdentity` campo a campo e nunca foi atualizada para incluir os dois novos campos.
2. **Impacto** — `normalizeCharacter`/`normalizeIdentity` roda em praticamente todo save/leitura de ficha (`build-from-wizard.ts`, `identity.ts` applyIdentityPatch, `characters.ts` saveCharacter, `character-registry.ts`, `rebuild-from-wizard.ts`). Resultado: a perícia extra do antecedente Aventureiro era apagada no instante em que a ficha era criada; o talento universal escolhido no level-up (níveis 4/8/12/16) era apagado a cada save subsequente. Efeito colateral concreto: `lib/character/armor-defense.ts:52` lê `identity.featIds` para aplicar o bônus de +1 CA do talento "Pele Grossa" — como o campo sempre voltava vazio, o bônus nunca era aplicado mesmo com o talento escolhido corretamente.
3. **Correção** — `normalizeIdentity()` agora preserva `featIds` (filtra para array de strings, default `[]`) e `escolhaPericiaAntecedente` (default `null`); `defaultIdentity()` também recebeu os mesmos defaults para consistência.
4. **Validação** — `npx tsc --noEmit` limpo.

**Arquivos tocados:**
- `lib/character/normalize.ts` — `normalizeIdentity()` e `defaultIdentity()` passam a preservar `featIds`/`escolhaPericiaAntecedente`

**Commits / deploy:** pendente local.

**Como testar:**
- Criar personagem com antecedente "Aventureiro" escolhendo uma perícia → recarregar a ficha → perícia deve continuar aparecendo no painel "Antecedente"
- Escolher talento universal "Pele Grossa" no level-up (nível 4+) → CA da ficha deve mostrar +1 permanente após salvar/recarregar

---

### 2026-07-10 — Sistema de talentos universais + Chi HUD + AbilityPicker + TokenActionRing

**Pedido:** implementar todas as funcionalidades sugeridas — sistema de talentos universais selecionável no level up, seletor flutuante de habilidades no VTT, Chi pool display no HUD, correções no TokenActionRing, e picker de perícia para o antecedente Aventureiro.

**Passo a passo:**

1. **TokenActionRing melhorias** — custo Chi exibido no label (e.g. "1PA · 1χ"); `title` nativo removido → `aria-label`; labels truncados a 22 chars (de 11); detailHint explicando progressão PA para Mover/Correr; prop `onOpenAbilityPicker` adicionada.
2. **AbilityPickerPanel** — novo painel flutuante (pattern SpellPickerPanel) com grade de habilidades, busca por nome, badge de recarga, target icon e painel de detalhe com descrição completa; backdrop com blur z-1200. Arquivo `ability-picker.css` criado.
3. **Battlefield** — `abilityPickerOpen` state; `onOpenAbilityPicker` passado ao ring; `AbilityPickerPanel` renderizado condicionalmente.
4. **Chi HUD** — `ChiHudMeter.tsx` criado com pips diamante para budget de turno; integrado ao `CharacterCombatHud.tsx` (condicional `token.chi != null`); CSS `.hud-chi` adicionado ao `eldarin-v4.css` com layout amethyst + rotate 45° para diamantes. Ring center mostra "4 PA · 7χ".
5. **pa-chip.ts** — quando `action.chiCost`, o chip preview mostra pool restante e limite de turno.
6. **action-tooltip.ts** — `effectiveCostLine` inclui sufixo "X Chi" quando custo Chi existe.
7. **Sistema de talentos universais** — `feats.ts` criado (`listAllFeats`, `listFeatsForLevel`, `getFeat`); `types.ts` — `featIds` e `escolhaPericiaAntecedente` em `CharacterIdentity`; `level-up.ts` — `LevelUpChoices.featId`, `LevelUpRequirement` feat, validation, apply; `level-up-ui.ts` — step "feat"; `LevelUpWizard.tsx` — passo "Talento Universal" com grid de cards + CSS `.lu-feat-grid/.lu-feat-card`.
8. **Aventureiro background** — `wizard-types.ts` + `build-from-wizard.ts` + `wizard-from-character.ts` — campo `escolhaPericiaAntecedente`; `CharacterCreationWizard.tsx` — picker de perícia exibido ao selecionar "Aventureiro", validação obrigatória antes de avançar; `sheet-skills.ts` — `ANTECEDENTE_SKILL_DEFS` exportado + `buildSheetBackgroundSkills` trata Aventureiro via `identity.escolhaPericiaAntecedente`.
9. **UniversalFeatsPanel** — componente de display dos feats adquiridos; integrado em `CharacterSheet.tsx` e `SheetDdbManagePanel.tsx` após `SubclassTrackPanel`.
10. **Build** — `npm run build` limpo em todos os pontos.

**Arquivos tocados:**
- `lib/character/feats.ts` — NOVO: utilitários de talentos universais
- `components/character/UniversalFeatsPanel.tsx` — NOVO: display de feats na ficha
- `components/vtt/AbilityPickerPanel.tsx` — NOVO: seletor flutuante de habilidades
- `components/vtt/ChiHudMeter.tsx` — NOVO: medidor Chi no HUD
- `components/vtt/ability-picker.css` — NOVO: estilos do ability picker
- `lib/character/types.ts` — CharacterIdentity +featIds +escolhaPericiaAntecedente
- `lib/character/level-up.ts` — feat em LevelUpChoices, requirements, validate, apply
- `lib/character/level-up-ui.ts` — step "feat" + previewLevelUpGroups
- `lib/character/wizard-types.ts` — escolhaPericiaAntecedente em draft
- `lib/character/build-from-wizard.ts` — propaga escolhaPericiaAntecedente
- `lib/character/wizard-from-character.ts` — reverse transform
- `lib/character/sheet-skills.ts` — ANTECEDENTE_SKILL_DEFS exportado + Aventureiro handler
- `components/character/LevelUpWizard.tsx` — step feat UI
- `components/character/level-up.css` — .lu-feat-grid/.lu-feat-card/.lu-feat-badge
- `components/character/wizard/wizard.css` — .char-wizard-aventureiro-* styles
- `components/character/wizard/CharacterCreationWizard.tsx` — skill picker Aventureiro
- `components/character/CharacterSheet.tsx` — UniversalFeatsPanel wired
- `components/character/SheetDdbManagePanel.tsx` — UniversalFeatsPanel wired
- `components/vtt/TokenActionRing.tsx` — 4 melhorias + onOpenAbilityPicker
- `components/vtt/CharacterCombatHud.tsx` — ChiHudMeter integrado
- `components/vtt/Battlefield.tsx` — AbilityPickerPanel wired
- `components/vtt/eldarin-v4.css` — .hud-chi block
- `lib/combat/pa-chip.ts` — Chi preview no chip
- `lib/combat/action-tooltip.ts` — Chi suffix no tooltip

**Commits / deploy:** pendente local.

**Como testar:**
- Level up personagem até nível 4 → deve aparecer step "Talento Universal" no wizard com grid de feats
- Criar personagem com antecedente "Aventureiro" → step Antecedente deve mostrar picker de perícia; ficha deve exibir a perícia escolhida no painel "Antecedente"
- Mesa VTT com Espiritualista → HUD deve mostrar χ com diamantes + pool; ring center "PA · χ"; ability picker abre ao clicar em "Habilidades"

---

### 2026-07-10 — Subclasses Espiritualista no VTT + efeito mecânico Pele Grossa

**Pedido:** implementar habilidades de subclasse Chi no ring de ações VTT e efeitos mecânicos dos feats de combate.

**Passo a passo:**
1. **Diagnóstico** — `CLASS_FALLBACK["Espiritualista"]` apontava para `"habilidades-golpe-de-chi"` mas o ID real no compêndio é `"chi-golpe-de-chi"`, causando `getEntry()` null; `TALENT_HABILIDADE` não tinha nenhum dos 16 talentos das 4 subclasses; `ABILITY_BY_ID` não tinha entradas com prefixo `chi-`, então `abilityFromEntry` retornava null mesmo se o ID fosse corrigido.
2. **Decisão** — criar entradas `chi-*` no ABILITY_BY_ID para os 5 IDs novos; criar 2 novas entradas no compêndio (`chi-golpe-do-vacuo`, `chi-muro-de-chi`); mapear os 16 talentos de subclasse no TALENT_HABILIDADE usando dedup por entry (talentos lv8-16 mapeiam para o mesmo entry do lv4 → aparecem como 1 ação por subclasse no ring).
3. **habilidades.json** — adicionado campo `custoChi` às 3 entradas chi existentes; criadas entradas `chi-golpe-do-vacuo` (1d6, PA1, Chi1) e `chi-muro-de-chi` (defense_buff, PA1, Chi1).
4. **compendium-actions.ts** — adicionadas 5 entradas ao ABILITY_BY_ID com prefixo `chi-`.
5. **subclass-vtt.ts** — corrigido `CLASS_FALLBACK["Espiritualista"]`; adicionados 16 mapeamentos TALENT_HABILIDADE (Punho do Limiar, Tecelão do Vácuo, Asceta da Dor, Guardião da Respiração).
6. **armor-defense.ts** — `featDefesaBonus()` implementada: se `featIds` contém `"talento-pele-grossa"`, +1 CA; `resolveActorDefesa` somam o bônus.
7. **Build** — `npm run build` limpo.

**Arquivos tocados:**
- `data/compendiums/habilidades.json` — custoChi nas 3 entradas chi + 2 novas entradas
- `lib/combat/compendium-actions.ts` — 5 entradas chi- em ABILITY_BY_ID
- `lib/character/subclass-vtt.ts` — fix CLASS_FALLBACK + 16 TALENT_HABILIDADE
- `lib/character/armor-defense.ts` — +1 CA mecânico para feat Pele Grossa

**Commits / deploy:** pendente local.

**Como testar:**
- Personagem Espiritualista com qualquer subclasse → ring de combate deve mostrar ação da trilha (ex: "Golpe do Vácuo (trilha) · 1 cél. · PA 1 · Chi 1")
- Personagem com feat "Pele Grossa" → CA deve ser 1 ponto acima do que seria sem o feat

---

### 2026-07-09 — Compêndio Chi/talentos + perícias de antecedente roláveis + prompts de ícones

**Pedido:** implementar todas as melhorias pendentes — técnicas Chi no compêndio, talentos universais em JSON, perícias de background roláveis na ficha, card de habilidade no VTT, prompts de ícones AI para todos os itens.

**Passo a passo:**

1. **Técnicas Chi no compêndio** — Espiritualista já tinha subclasses em `subclass-tracks.json`; faltavam as 3 técnicas do kit inicial. Adicionadas ao `habilidades.json` como entradas tipo `"habilidade"`: Golpe de Chi (1 Chi, PA 1, alcance 1), Passo do Vácuo (1 Chi, PA 1, alcance 3), Ferida Aberta (2 Chi, PA 1, alcance 1, recarga 1/turno). Custo em Chi codificado no `<strong>` do `description` (o schema não tem campo Chi).
2. **talentos.json criado** — novo arquivo `data/compendiums/talentos.json` com 20 talentos universais (Cap. 13 do Livro do Jogador), schema: `id`, `name`, `type: "talento"`, `system.category` (combate/culinario/sobrevivencia/social), `system.levelMin`, `system.prerequisites`, `system.description` (HTML). Categorias: 4 combate, 6 culinários, 5 sobrevivência, 5 sociais.
3. **Perícias de antecedente roláveis** — `sheet-skills.ts` estendido com `ANTECEDENTE_SKILL_DEFS` (8 perícias: Sobrevivência, Arcanismo, História, Persuasão, Intuição, Intimidação, Medicina, Enganação) + `buildSheetBackgroundSkills(actor)` que filtra o antecedente via `mentionsSkill` e retorna `SheetQuickSkill[]` sempre treinadas. `SheetDdbSkillsPanel` exibe as extras em subseção "Antecedente" com botão rollável idêntico ao padrão.
4. **Card de habilidade VTT** — verificado: `CombatActionDetail` já renderiza para `actionMode === "ability"` (`TokenActionPanel.tsx:716-719`). Mostra descrição do compêndio (strip HTML), dano, custo PA, alcance e recarga. Nenhuma mudança necessária.
5. **CSS** — adicionados `.sheet-ddb-panel__subhead` e `.sheet-ddb-panel__sub-label` ao `sheet-ddb.css` para separador visual da subseção de antecedente.
6. **Prompts de ícones AI** — artifact publicado com 166 prompts organizados em 4 abas (Habilidades 50, Magias 64, Chi 23, Classes+Subclasses 29); formato estrito: gold border `#c4a44a`, amethyst glow `#8B7BB8`, dark bg `#0e0d0b`, square 1:1.
7. **Build** — `npm run build` limpo em todos os pontos.

**Arquivos tocados:**
- `data/compendiums/habilidades.json` — +3 entradas Chi (golpe-de-chi, passo-do-vacuo, ferida-aberta)
- `data/compendiums/talentos.json` — NOVO: 20 talentos universais
- `lib/character/sheet-skills.ts` — SheetSkillId +8 ids; ANTECEDENTE_SKILL_DEFS; buildSheetBackgroundSkills()
- `components/character/SheetDdbSkillsPanel.tsx` — importa buildSheetBackgroundSkills; subseção Antecedente
- `components/character/sheet-ddb.css` — classes __subhead e __sub-label

**Commits / deploy:** pendente local.

**Como testar:**
- Criar personagem com antecedente "Erudito" → abrir ficha → painel Perícias deve mostrar "Antecedente" com Arcanismo e História roláveis (dot preenchido)
- Criar personagem com antecedente "Soldado" → Atletismo (já no painel) e Intimidação (subseção Antecedente)
- Mesa VTT → modo Habilidade → selecionar Golpe de Chi → `CombatActionDetail` mostra "Custo: 1 Chi" na descrição

---

### 2026-06-28 — Fix criação de personagem + refactor landing/hub + CI workflow

**Pedido:** criação de ficha não funcionando; refatorar o site como hub otimizado com foco no funcionamento da mesa.

**Passo a passo:**

1. **Fix btn-primary-cta** — botão "Criar personagem" aparecia sem estilo roxo (neutro) porque `.btn-primary-cta` não herdava as cores de `.btn-primary`. Adicionado como alias no `globals.css`: `border: none; background: var(--chrome-accent); color: var(--chrome-bg)`.
2. **Fix precedência JS em `finish()`** — `setErr(message ?? isEdit ? "A" : "B")` era parseado como `(message ?? isEdit) ? "A" : "B"`, mostrando mensagem errada. Corrigido com parênteses explícitos.
3. **Landing page** — hero centralizado com SVG preview do VTT, seção "Recursos" com 4 cards e seção "Para o Mestre" com download direto em vez da antiga CTA band redundante. Estilos: `landing-hero`, `landing-preview`, `download-band` adicionados ao `globals.css`.
4. **Hub `/mesas`** — redireciona diretamente para `/rpg/eldarin` (único sistema disponível), eliminando clique extra desnecessário. Cabeçalho da página Eldarin simplificado.
5. **Build** — `npm run build` limpo, zero erros TypeScript.

**Arquivos tocados:**
- `app/globals.css` — alias `btn-primary-cta` + estilos `landing-hero`, `landing-preview`, `download-band`, `download-other`
- `components/character/wizard/CharacterCreationWizard.tsx` — precedência `??` / `?:` em `setErr`
- `app/page.tsx` — landing page reescrita (hero SVG, recursos, banda download)
- `app/mesas/page.tsx` — redireciona para `/rpg/eldarin`
- `app/rpg/eldarin/page.tsx` — cabeçalho simplificado sem breadcrumb circular

**Commits / deploy:** `9cf2a39` (fix wizard) · `f41393f` (refactor site). Push pendente.

**Como testar:**
- `/personagem/novo` — botão roxo visível; criar personagem com campos válidos deve funcionar
- `/` — hero com preview SVG, feature cards, banda download
- `/mesas` — redireciona para `/rpg/eldarin`

---

### 2026-06-28 — Executável com docker auto-install + página /download com instruções integradas

**Pedido:** exe do mestre deve instalar o Docker automaticamente se não encontrado (com progress bar); página `/download` com instruções integradas em vez de link para guia separado.

**Passo a passo:**

1. **cmd/mestre/main.go reescrito** — `ensureDocker()` cobre 3 casos: daemon rodando → ok; CLI instalada mas parado → polling a cada 5s até 3min com contador `\r Aguardando Docker iniciar... (Xs)`; não instalado → `downloadAndInstallDocker()`.
2. **Download com progress bar** — `downloadWithProgress()`: HTTP GET com barra `█░` de 20 chars calculada por `pct/5`. URLs: Docker Desktop Windows (~600MB), Mac Silicon/Intel DMG. Linux: exibe URL manual e sai.
3. **Instalação automática** — Windows: `exec.Command(tmpPath, "install").Start()` abre instalador UAC; Mac: `open Docker.dmg`. Após instalação instrui reabrir o exe; exe não continua (precisa reiniciar daemon).
4. **Página /download reestruturada** — removida seção "O que você precisa" (Docker é automático); removido "Ver guia completo"; instrucões lado a lado: card ngrok (1 passo manual, 3 sub-passos numerados) + card automático (4 emoji steps); callout verde "Mesa pronta" embaixo.
5. **CSS novo** — `download.css` completamente reescrito com todas as classes novas: `.dl-setup`, `.dl-setup-card`, `.dl-setup-badge`, `.dl-ngrok-steps`, `.dl-auto-list`, `.dl-result`, `.dl-divider`, `.dl-platform-note`; responsivo mobile (1 coluna).
6. **Build + push** — `npm run build` limpo; commit `6dd01d3` em `main`.

**Arquivos tocados:**
- `cmd/mestre/main.go` — reescrito: `ensureDocker`, `downloadAndInstallDocker`, `downloadWithProgress`, `waitForDocker`
- `app/download/page.tsx` — reestruturado: instrucões integradas, sem link para guia externo
- `app/download/download.css` — reescrito completo para nova estrutura da página

**Commits / deploy:** `6dd01d3` em `main`. Push ok.

**Como testar:**
- `/download` — ver layout lado a lado (ngrok + automático), callout verde no final
- `cmd/mestre/main.go`: compilar `CGO_ENABLED=0 go build -o mxdrpg-mestre.exe` e rodar sem Docker instalado

---

### 2026-06-27 — Fix combate preso + hospedagem local pelo mestre + guia passo a passo

**Pedido (1):** ataque consumia PAs mas sem resultado no dado/chat/tela ("Aguardando servidor...").  
**Pedido (2):** loading VTT demorando ~10s — investigar.  
**Pedido (3):** refatorar para funcionar com hospedagem no PC do mestre (Foundry-style).  
**Pedido (4):** preparar guia passo a passo completo para o mestre configurar.

**Passo a passo:**

1. **Diagnóstico — combate preso** — race condition em `useBattlefieldCombatFxQueue.ts`: `seedHistoricalChat` marcava a nova mensagem de ataque como "vista" (`seenCombatRef`) antes de `findPendingAttackMessage` conseguir encontrá-la. Resultado: sistema aguardava para sempre uma mensagem que já estava invisível.
2. **Fix combate** — invertida a ordem: busca a mensagem pendente ANTES de chamar `seedHistoricalChat`; marca como vista ANTES do seed. Também removido o guard `if (!messages.length) return` que impedia o seeding quando o chat estava vazio (primeiro ataque da sessão).
3. **Diagnóstico — loading lento** — SSR do `page.tsx` fazia 3 queries sequenciais ao banco (aventura + convite + count de personagens). Root cause real: servidor em Contabo Alemanha → Brasil ~200ms RTT × N queries.
4. **Fix loading** — removidas as 2 queries de count de personagens do SSR; loading.tsx melhorado com spinner escuro (#0e0d0b + roxo) em vez de texto branco vazio.
5. **Arquitetura local** — criado `docker-compose.local.yml`: 3 serviços (MariaDB 11.4, Next.js app, ngrok). Dados persistem em volume Docker `mxdrpg_local_db`.
6. **Save periódico** — `lib/room/internal/periodic-save.ts`: batch non-blocking a cada 60s via `globalThis.__eldarinPeriodicSave`. `persistRoom` em `registry.ts` não bloqueia mais o game loop — chama `scheduleSave`.
7. **Scripts setup** — `scripts/local/setup.bat` e `setup.sh` reescritos como assistente guiado: verificam Docker, geram SESSION_SECRET, pedem token ngrok, criam `.env.local`, sobem `docker compose` e aguardam o link ngrok automaticamente (polling `localhost:4040/api/tunnels`), exibem o link em destaque.
8. **Guia visual** — `docs/HOSTING-LOCAL.md` + Artifact HTML publicado (checklist interativo, 7 passos, troubleshooting).

**Arquivos tocados:**
- `hooks/vtt/useBattlefieldCombatFxQueue.ts` — invertida ordem seed/search; removido guard `if (!messages.length)`
- `app/mesa/[roomId]/loading.tsx` — spinner dark em vez de texto
- `app/mesa/[roomId]/page.tsx` — removidas queries de count de personagens do SSR
- `lib/room/internal/periodic-save.ts` — novo: save batch 60s non-blocking
- `lib/room/internal/registry.ts` — `persistRoom` → `scheduleSave` (não bloqueia)
- `docker-compose.local.yml` — novo: db + app + ngrok
- `.env.local.example` — novo: template variáveis para mestre local
- `scripts/local/setup.bat` — reescrito como assistente completo (detecta ngrok URL)
- `scripts/local/setup.sh` — equivalente para Mac/Linux
- `docs/HOSTING-LOCAL.md` — novo: doc técnico de hospedagem local

**Commits / deploy:** `bd3d70f` (docker local + save periódico) em `main`. Scripts setup e guia: pendente commit.

**Como testar:**
- Combate: `/mesa/demo` → atacar → resultado aparece no dado, tela e chat (sem "Aguardando...")
- Hospedagem local: `scripts\local\setup.bat` → seguir passos → link ngrok exibido ao final
- Loading: abrir `/mesa/[roomId]` — spinner escuro aparece imediatamente

---

### 2026-06-26 — Reconciliar branch + fix animação dados WebGL

**Pedido:** dados sem animação visível no combate; consolidar branch `fix/mesa-performance-delays` com `main`.

**Passo a passo:**
1. **Diagnóstico — dados invisíveis** — timings haviam sido baixados para 200ms em sessão anterior. WebGL `dice-box` precisa de ≥480ms para `settleTimeout` física; resultado aparecia antes do dado pousar na tela.
2. **Fix timings** — `combat-dice-model.ts`: `attackRoll` 200→620ms, `damageRoll` 200→520ms, `DICE_LANDING_MS` 100→220ms, `COMBAT_ATTACK_MIN_SPIN_MS` 120→420ms, `COMBAT_DICE_SETTLE_MS` 200→480ms, `settleTimeout` WebGL 200→480ms. ~45% mais rápido que original, mínimo visível para física 3D.
3. **Diagnóstico — branch divergida** — filter-branch da sessão anterior reescreveu hashes do `local/main`; `fix/mesa-performance-delays` estava baseado no `origin/main` antigo (hashes pré-reescrita). `git log origin/main ^HEAD` = vazio (fix branch era ancestral de origin/main).
4. **Rebase** — `git rebase --onto main origin/main fix/mesa-performance-delays` aplicou os 12 commits sobre `local/main` limpo (sem conflitos — conteúdo idêntico, só hashes diferentes).
5. **Fast-forward + push** — `git merge --ff-only`, `git push --force main` e `fix/mesa-performance-delays` sincronizados.

**Arquivos tocados:**
- `lib/vtt/combat-dice-model.ts` — timings dados ajustados: 620ms ataque, 520ms dano, 480ms settle WebGL

**Commits / deploy:** `ddd42a1` em `main` e `fix/mesa-performance-delays`. Force push em ambos (necessário pós filter-branch).

**Como testar:**
- `git checkout main && npm run dev`
- `/mesa/demo` → iniciar combate → atacar — dado d20 deve girar visivelmente (~0,6s) antes de parar e mostrar resultado

---

### 2026-06-24 — Performance: redução de delays na mesa VTT

**Pedido:** investigar delay absurdo na mesa e corrigir.

**Passo a passo:**
1. **Auditoria** — agente varreu `lib/vtt/`, `hooks/vtt/`, `components/vtt/`, `app/api/room/` e `lib/room/`. Mapeou 40+ fontes de delay em 6 categorias (animação, rede, canvas, polling, combate, banco).
2. **Priorização** — top 5 por impacto percebido: animações dos dados (950ms + 750ms = 1,7s por ataque), SSE polling (400ms de lag de sync), transição combate/aventura (UI bloqueada 2,3s), auto-pass (280ms × N turnos/rodada).
3. **Decisão** — resultado imediato nos dados (200ms), SSE 250ms, transição 1400ms, auto-pass 150ms. Zero alteração em lógica de combate ou banco.
4. **Implementação** — 5 arquivos, 15 constantes numéricas.
5. **Validação** — `npm run build` ✅. Branch `fix/mesa-performance-delays` criada e pushed.

**Arquivos tocados:**
- `lib/vtt/combat-dice-model.ts` — attackRoll 950→200ms, damageRoll 750→200ms, evictMs 650→240ms, DICE_LANDING_MS 320→100ms, COMBAT_DICE_SETTLE_MS 920→200ms, settleTimeout WebGL 920→200ms
- `app/api/room/[roomId]/events/route.ts` — POLL_MS 400→250ms
- `hooks/vtt/useCombatModeTransition.ts` — DURATION_MS 2300→1400ms
- `components/vtt/combat-mode-transition.css` — --cmt-total 2.3s→1.4s
- `lib/room/settings.ts` — DEFAULT_AUTO_PASS_DELAY_MS 280→150ms, MIN 200→100ms

**Commits / deploy:** `ed3bc81` em `fix/mesa-performance-delays` — PR pendente (gh CLI sem auth; abrir em https://github.com/MaulXD/MXDRPG/pull/new/fix/mesa-performance-delays).

**Como testar:**
- `/mesa/demo` → atacar → dado para e mostra resultado em ≤200ms
- Dois navegadores → ação aparece para o segundo em ≤250ms
- Ativar combate → névoa some em 1,4s (era 2,3s)
- PA = 0 → turno passa em ~150ms por token

---

### 2026-06-24 — Auditoria de design e correções de UX/acessibilidade

**Pedido:** avaliar o design/UX do site e corrigir todos os problemas encontrados.

**Passo a passo:**
1. **Auditoria** — exploração completa do projeto + análise de `globals.css`, landing page, mobile responsivo, acessibilidade e design system.
2. **Relatório** — 17 achados classificados (4 críticos, 7 atenção, 6 melhorias, 6 pontos fortes).
3. **Correções aplicadas:**
   - Typo "Combaté" → "Combate" na stats strip da landing
   - Stats strip reescrita com valores mais claros ("Hex"/"Grid tático", "Zero"/"Instalação necessária", "3"/"Papéis de mesa")
   - `--text-xs: 0.7rem` → `0.75rem`, `--text-sm: 0.82rem` → `0.875rem`, `--text-base: 0.9rem` → `1rem`
   - `--text-dim: #5a5045` → `#6e6458` (contraste WCAG AA corrigido)
   - `btn-ghost`: `font-family` trocado de `--font-body` para `--font-ui` (consistência de botões)
   - Adicionado `:focus-visible` global; inputs/selects suprimem outline duplo (já têm border+shadow)
   - Canvas VTT: `min(72vh)` → `min(72dvh)`, `min(80vh)` → `min(80dvh)` — fix barra de endereço mobile
   - `landing-hero`: `100vh` → `100dvh`
   - Criado `components/MobileNav.tsx` — hamburger + drawer com todos os links de nav (fecha em rota change e Escape)
   - `SiteHeaderWrapper.tsx`: integrado `<MobileNav>` — oculta `.site-nav__links` ≤768px, mostra toggle
   - `app/mesas/page.tsx`: removidos todos os inline styles → classes CSS
   - `mesas-hub.css`: adicionadas `.mesas-hub-wrap`, `.mesas-hub-header`, `.rpg-hub-demo-banner`
   - Link demo promovido de texto pequeno para banner com botão visível

4. **Não alterado (intencionalmente):** variáveis `--neon-*` e `--accent-gold` (usadas em centenas de linhas em `vtt.css` e `sheet.css` — renomear exige refatoração dedicada); variáveis VTT no `:root` (mover para `.vtt-chrome` é seguro mas extenso).

**Arquivos tocados:**
- `app/page.tsx` — stats strip reescrita, typo corrigido
- `app/globals.css` — font-sizes, --text-dim, btn-ghost font, :focus-visible global, dvh, CSS mobile nav
- `components/home/home.css` — dvh no landing hero
- `components/MobileNav.tsx` — novo componente hamburger
- `components/SiteHeaderWrapper.tsx` — integrado MobileNav
- `app/mesas/page.tsx` — inline styles removidos, demo banner
- `components/rpg/mesas-hub.css` — classes novas para wrap, header e demo banner

**Commits / deploy:** pendente local.

**Como testar:**
- Landing: verificar stats strip e typo corrigido
- Mobile ≤768px: hamburger aparece, links desktop somem, drawer funciona
- `npm run build` para verificar tipos

---

### 2026-06-24 — Redesign visual da landing (revertido)

**Pedido:** melhorar visualmente a landing — menos genérica, mais visual do produto.

**Passo a passo:**
1. Criado `HeroVttPreview.tsx` — SVG de grid hexagonal → depois corrigido para grid quadrado após confirmação que o VTT não usa mais hexágonos.
2. Hero reestruturado em duas colunas (texto + preview SVG), feature cards redesenhados com ícone e título lado a lado e bordas de acento por tipo, CTA band com dois botões e glow, stats strip convertida para linha horizontal com separadores.
3. Resultado rejeitado pelo usuário — visual considerado ruim/carregado.
4. **Revertido:** `app/page.tsx`, `components/home/home.css` e `HeroVttPreview.tsx` removidos.

**Commits:** `4242457` (redesign), `58eaea4` (fix grid quadrado), revert no commit seguinte.

---

### 2026-06-22 — Homolog local, fix ataque 400 e grid Foundry na mesa-local

**Pedido:** testar MXDRPG localmente — corrigir HTTP 400 em `/combat/attack`, lentidão em produção, e **mesa sem grade/tokens** (só UI Foundry + logo/capa ELDARIN). Após primeiro fix CSS, usuário reportou **“mesma coisa”**.

**Passo a passo:**
1. **Diagnóstico — ambiente** — MariaDB homolog + seed `mesa-local`; rotas `npm run local` / `dev:homolog`; localhost abre mesa sem convite (`lib/env/homolog.ts`). API `GET /api/room/mesa-local` retorna `gridRadius: 8` e 3 tokens — dados OK no servidor.
2. **Diagnóstico — 400 ataque** — cliente usava `resolveLivingActiveTokenId`; servidor usava `activeTokenId` bruto → “Aguarde seu turno…”. Preflight `canAttackTarget` no cliente alinhado.
3. **Diagnóstico — grid invisível** — UI Foundry (toolbar MAPA/LOUSA/ZOOM, turno, HUD) carregava, mas área central vazia. Causa: `.vtt-canvas-wrap` com `height: min(80vh, 760px)` em `globals.css` / `vtt.css` conflitando com layout Foundry (`position: absolute; inset: 0`); canvas com altura efetiva ~0; capa ELDARIN (`RoomCoverBackdrop`) aparecia quando não havia desenho.
4. **Decisão — rodada 1 (commit `02afd3e`)** — CSS Foundry no stage; default `gridRadius: 8` em `scene-normalize.ts`; capa só com `coverUrl` custom (não fallback ELDARIN).
5. **Decisão — rodada 2 (pendente local)** — regras CSS com `!important` via `[data-vtt-mesa="foundry"]`; canvas/wrap/shell com `width/height: 100%`; `prepareBattlefieldCanvas` mede wrap + `getBoundingClientRect` + stage pai; `useGridCanvas` re-tenta draw até layout > 10px; classe `vtt-canvas-wrap--foundry`.
6. **Validação** — `GET /api/room/mesa-local` → `coverUrl: null`, tokens presentes. Testar em **uma** porta (`localhost:3000`), `npm run dev:homolog`, hard refresh Ctrl+Shift+R.

**Arquivos tocados:**
- `scripts/homolog/*`, `data/homolog/mesa-local.seed.json`, `lib/env/homolog.ts`, `docs/HOMOLOG.md` — ambiente local (commits `a179727`, `ae4808e`)
- `lib/room/combat-turn-context.ts`, `Battlefield.tsx` — turno + preflight ataque (commit `8cdacd2`)
- `components/vtt/foundry/foundry.css`, `RoomCoverBackdrop.tsx`, `lib/vtt/scene-normalize.ts` — rodada 1 canvas (commit `02afd3e`)
- `foundry.css`, `lib/vtt/draw-battlefield.ts`, `hooks/vtt/useGridCanvas.ts`, `BattlefieldMapCanvas.tsx`, `Battlefield.tsx` — rodada 2 canvas

**Commits / deploy:** `8cdacd2`, `a179727`, `ae4808e`, `02afd3e`, `0eed5a5` (rodada 2 canvas) em `main`.

**Como testar:**
```bash
npm run local          # ou homolog:up + dev:homolog
```
- http://localhost:3000/mesa/mesa-local — login `mestre` / `123`
- Grade cinza + 3 tokens (2 goblins + minotauro); sem capa ELDARIN se `coverUrl` null
- F12 → inspecionar `.vtt-canvas` — `clientWidth` / `clientHeight` > 0

---

### 2026-06-20 — Redesign transição Combate/Aventura: névoa vermelha + brasas / névoa azul suave

**Pedido:** substituir animação de espadas cruzando + bússola por: (1) modo combate = névoa vermelha + "Combate Ativado" centralizado + brasas subindo; (2) modo aventura = névoa azul + "Modo Aventura" fade-in suave → fade-out suave. Sem as animações antigas.

**Passo a passo:**
1. **Diagnóstico** — `CombatModeTransition.tsx` usava `CombatModeSword` (espadas cruzando) + bússola SVG, vignette, dim, flash e múltiplas camadas de background. CSS complexo com ~20 keyframes.
2. **Decisão** — reescrever do zero. Estrutura nova: apenas `.cmt-overlay__bg` (camada de névoa), 18× `.cmt-ember` (brasas, somente no combate) e `.cmt-overlay__label`. Ember positions, durations e delays variados inline via `style={}`.
3. **Implementação** — `CombatModeTransition.tsx`: removidos `CombatModeSword`, `useId`; adicionado array `EMBERS` com 18 entradas `{ left, size, dur, delay, dx }`; embers renderizados só em `isIn`. CSS: névoa crimson para combate (`radial-gradient` vermelho+escuro), névoa índigo para aventura; `cmt-ember-rise` usa `--cmt-ember-dx` CSS var para drift horizontal por partícula; embers só animam quando `.cmt-overlay--playing` está ativo.
4. **Validação** — sem mudanças em tipos/lógica; `npm run build` a executar.

**Arquivos tocados:**
- `components/vtt/CombatModeTransition.tsx` — reescrito: sem espadas, brasas via array EMBERS
- `components/vtt/combat-mode-transition.css` — reescrito: névoa vermelha/azul, brasas, sem keyframes antigos

**Commits / deploy:** pendente push.

**Como testar:** mesa → ativar combate → overlay vermelho com brasas subindo + "Combate Ativado"; sair do combate → overlay azul + "Modo Aventura" fade suave.

---

### 2026-06-20 — Assets dice-box, tema default, skills Clerk, tooltips nav

**Pedido:** "suba tudin" — commitar tudo que estava pendente.

**Passo a passo:**
1. Identificados 3 arquivos modificados (title→data-site-tip em FriendsNavIcon, FriendsNavMessages, MesasNavLink) e 4 untracked (`.agents/`, `public/assets/ammo/`, `public/assets/themes/`, `skills-lock.json`).
2. `public/assets/ammo/ammo.wasm.wasm` — binário Bullet Physics necessário para dice-box funcionar offline (sem CDN).
3. `public/assets/themes/default/` — tema visual padrão do dice-box (textures PBR + config JSON).
4. `.agents/skills/clerk-*` + `skills-lock.json` — skills do agente para integração Clerk (auto-gerados pelo ambiente).
5. `title=` → `data-site-tip=` nos três ícones de navegação (regra de ouro do projeto: nunca usar `title` nativo).

**Arquivos tocados:**
- `components/friends/FriendsNavIcon.tsx` — title → data-site-tip
- `components/friends/FriendsNavMessages.tsx` — title → data-site-tip
- `components/nav/MesasNavLink.tsx` — title → data-site-tip
- `public/assets/ammo/ammo.wasm.wasm` — NOVO binário Bullet Physics
- `public/assets/themes/default/*` — NOVO tema dice-box (textures + config)
- `.agents/skills/clerk-*/` — NOVO skills Clerk (~160 arquivos)
- `skills-lock.json` — NOVO lock de versão das skills

**Commits / deploy:** `f145d1c` → `cursor/dice-box-combat` → pushed.

---

### 2026-06-20 — Reduz delay de dados no combate + pré-carga dice-box

**Pedido:** delay muito grande entre atacar e o dado aparecer.

**Passo a passo:**
1. **Diagnóstico** — três causas independentes: (a) `DiceMiniature` usava `useState(null)` + `useEffect` para detectar WebGL — 1 ciclo de render extra; (b) `ensureAttackBox` tinha `waitMs(120)` artificial antes de criar a instância; (c) bundle `/vendor/dice-box/dice-box.es.min.js` era carregado com `dynamic import` só na 1ª luta (200–500ms).
2. **Fix (a)** — lazy init: `useState(() => typeof window === "undefined" ? null : supportsWebGL())` + `useEffect` condicional só dispara em SSR.
3. **Fix (b)** — removidos `await waitMs(120)` de `ensureAttackBox` e `await waitMs(80)` de `ensureDamageBox`.
4. **Fix (c)** — `useEffect(() => { void loadDiceBox(); }, [])` no mount do `DiceCombatPanel` pré-carrega o bundle imediatamente.

**Arquivos tocados:**
- `components/vtt/DiceMiniature.tsx` — lazy init WebGL detection
- `components/vtt/DiceCombatPanel.tsx` — removidos waitMs + pre-load useEffect

**Commits / deploy:** `e70cc6b` → `cursor/dice-box-combat` → pushed. PR #3 criado.

---

### 2026-06-20 — Ritmo combate: 2s D20 + 2s dano, painel dual, chat e token juntos

**Pedido:** visualização combate bugada e lenta/confusa; reorganizar dados — 2s rolando e parando no número; se acertou +2s dado de dano (D20 fica); ao fim dados saem, token anima dano e chat mostra dano no mesmo instante.

**Passo a passo:**
1. **Diagnóstico** — tempos espalhados (700 ms / 420 ms / 360 ms); D20 sumia ao iniciar dano; número flutuante no hex sumia antes do CSS; `applyState` no meio da animação; rolagem WebGL mecânica (Euler fixo).
2. **Decisão** — fonte única `lib/vtt/combat-fx-timings.ts`; janelas fixas **2000 ms** ataque e **2000 ms** dano; pouso nos últimos 450 ms de cada janela; single attack sem número flutuante no mapa (chat + flash no token); resolve único no fim.
3. **Implementação:**
   - `combat-fx-timings.ts` — `COMBAT_ATTACK_ROLL_MS`, `COMBAT_DAMAGE_ROLL_MS`, `DICE_LANDING_MS`, `attackLandAt` / `damageLandAt`
   - `CombatFxLayer.tsx` — sequência: mark 180 ms → roll 2s → result + dano 2s (painel dual) → resolve: esconde dados + `applyState` + `playTokenFx` + `revealChat("damage")`
   - `DiceWebGL.tsx` — tumble quaternion + ease-out-back no pouso + bounce escala; `reducedMotion` prop
   - `DiceMiniature` / `Dice3DCSS` — pouso alinhado a `DICE_LANDING_MS`
   - `vtt.css` — `.combat-fx-dice-row`, `.combat-fx-panel--dual-dice`
4. **Validação** — `npm run build` ✅

**Arquivos tocados:**
- `lib/vtt/combat-fx-timings.ts` — NOVO
- `components/vtt/CombatFxLayer.tsx`, `DiceWebGL.tsx`, `DiceMiniature.tsx`, `Dice3DCSS.tsx`, `vtt.css`

**Commits / deploy:** `9bc6782` → `main`

**Como testar:** `/mesa/demo` ou mesa real → combate → atacar → 2s D20 → ACERTO → D20 + D8 lado a lado 2s → dados somem + token flash + card chat com dano/HP. Erro: 2s D20 → ERROU ~0,5s → resolve.

---

### 2026-06-20 — Fix dado WebGL idle + lock transição combate

**Pedido:** ajuste fino pós-WebGL — D12 textura errada; UI bloqueada 2,3s na transição combate.

**Passo a passo:**
1. **Diagnóstico** — D12 `vertsPerFace` 3 (certo 9); dado parado sem animação idle; `COMBAT_MODE_TRANSITION_LOCK_MS` = duração total CSS.
2. **Implementação** — modo `idle` no `DiceWebGL`; lock 400 ms, animação CSS segue 2,3 s.
3. **Validação** — build ✅

**Commits / deploy:** `0c71d62` → `main`

**Como testar:** entrar/sair combate — UI clicável em ~400 ms; D12 e idle visíveis no painel.

---

### 2026-06-20 — Dados 3D WebGL: Three.js IcosahedronGeometry + OctahedronGeometry para D20 e dado de dano

**Pedido:** "Cada dado tem que ser 3D" — o usuário queria modelos 3D reais para os dados de combate.

**Passo a passo:**
1. **Pesquisa** — Avaliou 3 opções: (a) `@3d-dice/dice-box-threejs` (lib pronta, mas overlay complexo de integrar); (b) modelos GLTF do Sketchfab (download manual, licença incerta por modelo); (c) Three.js programático com geometrias nativas. Escolheu opção (c): Three.js já está no projeto (`^0.184.0`), zero dependência nova, controle total de timing e aparência.
2. **Design das texturas** — Canvas 2D de 256×256 por face, fundo escuro, triângulo decorativo interno, número grande com sombra, sublinhado automático para 6 e 9. 4 variantes de cor: `attack` (verdigris), `damage` (vermelho), `heal` (verde), `crit` (dourado).
3. **Geometria** — `IcosahedronGeometry(1,0).toNonIndexed()` para D20 (20 faces triangulares planas), `OctahedronGeometry(1,0).toNonIndexed()` para dado de dano (D8, 8 faces). Grupos adicionados com `addGroup()` para material por face.
4. **Animação** — Rolling: incremento de Euler X/Y/Z em velocidades diferentes (1.9×, 2.7×, 1.1×) para tumbling realista. Landing: `slerpQuaternions()` em 420ms com ease-out cúbico. Quaternion de pouso calculado por `setFromUnitVectors(faceNormal, cameraDir)`.
5. **Fallback** — `DiceMiniature` verifica WebGL com `getContext("webgl2")` antes de renderizar. Se indisponível: usa `Dice3DCSS` para D20, `Dice2DFallback` para outros.
6. **Integração** — `DamageDiePanel` (antes CSS) agora usa `DiceWebGL` com D8. `DiceMiniature` usa `DiceWebGL` para size="lg". CSS simplificado para apenas wrapper + label.

**Arquivos tocados:**
- `components/vtt/DiceWebGL.tsx` — NOVO: Three.js D20/D8/D6/D12/D4 com texturas canvas por face, animação rolling/landing via RAF
- `components/vtt/DiceMiniature.tsx` — detecta WebGL, usa DiceWebGL para lg, fallback CSS/2D
- `components/vtt/CombatFxLayer.tsx` — DamageDiePanel agora usa DiceWebGL D8 em vez de CSS gem
- `components/vtt/vtt.css` — CSS dmg-die simplificado (gem CSS removida, canvas WebGL estilizado)

**Commits / deploy:** `8ca7a4e` → `main`

**Como testar:** Atacar em mesa → D20 3D WebGL; fallback CSS/2D se sem WebGL. Nat20/crit: variantes douradas.

---

### 2026-06-20 — Animações de combate BG3-style: dado de dano rolando, D20 decagon, sem painel de probabilidade

**Pedido:** O usuário reportou que: (1) o painel de % de chance ao clicar era redundante — já aparece no hover; (2) o timing de ~3.6s estava cansativo; (3) os dados estavam feios. Queria algo como Baldur's Gate 3: dado de ataque rolando → dado de dano rolando → dano aparecendo animado no mapa.

**Passo a passo:**
1. **Diagnóstico** — Fase `"prob"` adicionada anteriormente exibia um painel de probabilidade por 1.2s antes do D20, mas essa info já existe no hover do alvo. O D20 usava triângulo SVG simples (pouco reconhecível). Não havia dado de dano — após o D20 o dano aparecia diretamente flutuante.
2. **Decisão BG3-style** — Remover completamente a fase `"prob"` e seus dados. Novo fluxo: mark (80ms) → D20 girando (700ms) → D20 mostra resultado (420ms) → dado de dano girando (620ms) → dano flutuante (360ms). Total ~2.1s para acerto com dano, ~1.2s para erro.
3. **Implementação:**
   - `combat-fx-types.ts`: removeu `"prob"` do `CombatFxPhase` e os 6 campos `prob*` de `CombatFxState`
   - `combat-fx-sequence.ts`: removeu funções `simpleHitChance()` e `extractModsLabel()`, e os campos `prob*` do objeto base
   - `Dice3DCSS.tsx`: D20 redesenhado — polígono decagonal (10 lados, mais parecido com d20 real) + números ciclando via `setInterval` a 75ms durante o roll (efeito caça-níquel)
   - `CombatFxLayer.tsx`: reescrito — removeu `ProbPanel`, adicionou `DamageDiePanel` (componente inline com gem octagonal, scramble de números e flash ao revelar), novo estado `showDamageRoll`, timing limpo por modo (single/area-target/area-simultaneous/area-intro)
   - `vtt.css`: removidos todos os `.combat-prob-*` (barra, fórmula, %, label); adicionados `.dmg-die-*` (gem octagonal com clip-path, flash colorido por tipo, label); `fill: none` no `.d20-css-inner-line` para o polígono interno do decagon não ser preenchido
4. **Validação** — `tsc --noEmit` sem erros. Testar em mesa ativa: atacar → D20 gira com números mudando rapidamente → D20 para mostrando ACERTO/ERROU → gem octagonal aparece e gira com números → gem para e flash → número flutuante no alvo.

**Arquivos tocados:**
- `lib/vtt/combat-fx-types.ts` — remove fase "prob" e campos prob* do type
- `lib/vtt/combat-fx-sequence.ts` — remove simpleHitChance, extractModsLabel, campos prob* do base
- `components/vtt/Dice3DCSS.tsx` — polígono decagonal + scramble por setInterval (sem Math.random no ciclo)
- `components/vtt/CombatFxLayer.tsx` — remove ProbPanel; adiciona DamageDiePanel; refatora timing BG3-style com showDamageRoll
- `components/vtt/vtt.css` — remove combat-prob-* CSS; adiciona dmg-die-* CSS; fix fill:none em d20-css-inner-line

**Commits / deploy:** `f8ee5c7` → `main`

**Como testar:** (supersedido pelo fluxo 2s+2s — ver entrada “Ritmo combate” acima.) Histórico: removeu fase prob; D20 decagonal CSS; DamageDiePanel.

---

### 2026-06-20 — Redesign combate: D20 CSS, fluxo sequencial, animações de projétil

**Pedido:** Tela de combate estava bugada e a animação dos dados ruim. Usuário queria: D20 3D em CSS (sem WebGL), fluxo visual sequencial (probabilidade → dado → resultado → chat) com timing Médio (~3.5s), e animações de ataque sobrepostas ao canvas: talho, flecha, orbe mágico (fogo/arcano), raio ziguezague, área (explosão radial), cura, e texto "ERROU!" com desvio para erros.

**Passo a passo:**
1. **Diagnóstico** — D20 usava Three.js WebGL (`Dice3DScene.tsx`) com limites de contexto, causando bugs visuais. O `CombatFxLayer` não tinha fase de probabilidade e o timing era muito rápido (~1s total). Animações de projétil inexistentes — só efeito no token após impacto.
2. **Decisão** — Substituir WebGL por CSS puro (preserve-3d + keyframes). Adicionar fase `"prob"` ao `CombatFxPhase`. Calcular chance de acerto retroativamente (attackTotal - attackNatural = bonus, então simpleHitChance). Adicionar SVG projectile overlay no `CombatFxLayer`. Detectar tipo de animação por `castFxKind` estendido com `"arrow"` e `"lightning"`.
3. **Implementação:**
   - `token-cast-fx.ts`: novos kinds `"arrow"` e `"lightning"`, detecção por keywords no nome da arma/magia
   - `combat-fx-types.ts`: fase `"prob"` adicionada; campos `probHitChance`, `probBonus`, `probAc`, `probDc`, `probModsLabel`, `probSaveFailChance`
   - `combat-fx-sequence.ts`: função `simpleHitChance()` + `extractModsLabel()` + população dos campos `prob*`
   - `Dice3DCSS.tsx` (NOVO): D20 triangular CSS puro, rotação 3D com preserve-3d, Nat20 dourado, Nat1 vermelho
   - `DiceMiniature.tsx`: usa `Dice3DCSS` para tamanho "lg" (combate), mantém 2D fallback para sm/md
   - `CombatFxLayer.tsx`: fase `"prob"` (1.2s) antes do `"mark"`, painel de probabilidade com barra animada, animações SVG de projétil (flecha, orbe, raio, talho, miss), timing atualizado (prob:1200ms + mark:150ms + roll:1000ms + result:720ms + done:480ms ≈ 3.6s)
   - `vtt.css`: CSS para `.d20-css*` (rotação 3D), `.combat-prob-panel` (painel prob com barra), `.proj-*` (animações projétil SVG); 62 ocorrências de `rgba(201,169,98,...)` → `rgba(107,158,140,...)` (verdigris)
4. **Validação** — `tsc --noEmit` sem erros. Testar em mesa ativa: verificar que sequência prob→dado→resultado→chat aparece, D20 gira suavemente, flechas/orbes/raios aparecem sobre o grid.

**Arquivos tocados:**
- `lib/vtt/token-cast-fx.ts` — novos kinds arrow/lightning + detecção por keywords + castFxDuration atualizado
- `lib/vtt/combat-fx-types.ts` — fase "prob" + 6 novos campos probData
- `lib/vtt/combat-fx-sequence.ts` — funções simpleHitChance + extractModsLabel + população prob
- `components/vtt/Dice3DCSS.tsx` — NOVO componente D20 CSS puro 3D
- `components/vtt/DiceMiniature.tsx` — usa Dice3DCSS para lg/d20 em vez de Three.js
- `components/vtt/CombatFxLayer.tsx` — reescrito: fase prob, painel ProbPanel, ProjectileAnim SVG, AoeExplosion, timing médio
- `components/vtt/vtt.css` — 500+ linhas adicionadas: D20 CSS, prob panel, projétil SVG; 62 rgba(ouro) → verdigris

**Commits / deploy:** `9c04e2a` → `main`

---

### 2026-06-20 — Correções críticas de auditoria UX (privacidade, navbar, compêndio, demo)

**Pedido:** corrigir os 4 bugs críticos apontados pela auditoria de agente: página de privacidade exposta com texto de dev, `/mundo` ausente na navbar, cards do compêndio sem detalhe visível, e mesa demo sem tokens de monstros.

**Passo a passo:**
1. **Privacidade** — `docs/PRIVACIDADE-LGPD.md` tinha campos `[placeholder]` expostos publicamente na rota `/privacidade`. Substituído por política completa em PT-BR com dados reais do controlador (ti@thep.com.br), bases legais LGPD corretas e direitos do titular.
2. **Navbar `/mundo`** — Criado `IconGlobe` em `EldarinIcons.tsx` (círculo + meridianos SVG). Adicionado link `{ href: "/mundo", label: "Mundo", icon: IconGlobe }` entre Compêndios e Sistema em `SiteNavLinks.tsx`.
3. **Compêndio clicável** — Cards eram `<button>` mas `CompendiumDetail` renderizava abaixo de 200+ cards, impossível de ver sem scroll. Adicionado `useRef` + `useEffect` para `scrollIntoView({ behavior: "smooth" })` ao selecionar card na view page.
4. **Demo tokens** — `createDemoRoom()` passava `tokens: []` para `syncLinkedTokens`, zerando os tokens de monstros do `DEMO_SCENE`. `syncLinkedTokens` preserva tokens não-linkados, então basta passar `DEMO_SCENE` sem sobrescrever tokens.

**Arquivos tocados:**
- `docs/PRIVACIDADE-LGPD.md` — política real substituindo rascunho com placeholders
- `components/ui/EldarinIcons.tsx` — novo `IconGlobe`
- `components/SiteNavLinks.tsx` — link `/mundo` adicionado
- `components/compendium/CompendiumBrowser.tsx` — `useRef` + scroll-to-detail, `useRef` no import
- `lib/room/sync.ts` — `createDemoRoom`: `{ ...DEMO_SCENE, tokens: [] }` → `DEMO_SCENE`

**Commits / deploy:** pendente local.

**Como testar:**
- `/privacidade` — deve mostrar política limpa sem "[placeholder]"
- Navbar — deve exibir link "Mundo" com ícone de globo entre Compêndios e Sistema
- `/compendios` → clicar num card → página scrolla suavemente para o detalhe
- `/mesa/demo` → tokens de Goblin, Esqueleto, Minotauro e Escorpião devem aparecer no grid

---

### 2026-06-20 — Remove auto-abertura do painel de convite ao entrar na mesa

**Pedido:** ao abrir a mesa, o painel de "CONVITE" abre automaticamente; usuário quer mesa limpa ao entrar.

**Passo a passo:**
1. Diagnóstico — `useEffect` em `MesaWorkspace.tsx` (~linha 395) abria `windows.openInDock("invite")` uma vez por sessão via `sessionStorage` quando o mestre entrava numa sala com código de convite.
2. Decisão — remover o `useEffect` inteiro; o painel continua acessível pelo dock quando o mestre quiser.
3. Implementação — deleção do bloco de 7 linhas do `useEffect`.
4. Validação — sem mudança em `.ts` de lógica; sem build necessário.

**Arquivos tocados:**
- `components/vtt/MesaWorkspace.tsx` — removido `useEffect` que abria painel de convite automaticamente

**Commits / deploy:** pendente.

**Como testar:** entrar na mesa como mestre → painel de convite não deve abrir; acessar pelo ícone no dock ainda deve funcionar.

---

### 2026-06-20 — Fix avatar não refletia seleção do usuário na navbar

**Pedido:** navbar mostrava avatar automático (OAuth/gerado) mesmo após usuário salvar foto personalizada.

**Passo a passo:**
1. Diagnóstico — `SiteHeaderWrapper` só chamava `safeMaterializeSessionUser` quando `avatarSource === "custom" && !avatarUrl`; para usuários custom com URL https:// (não data URL), a condição era FALSE e usava o cookie diretamente, que poderia estar stale. Além disso, `/api/auth/me` retornava apenas o cookie sem material DB.
2. Decisão — ampliar a condição: sempre chamar `safeMaterializeSessionUser` para `avatarSource === "custom"` (independente de ter URL no cookie); atualizar `/api/auth/me` com a mesma lógica para cobrir o fallback client-side.
3. Implementação — `SiteHeaderWrapper.tsx`: removida a parte `&& !session.user.avatarUrl`; `app/api/auth/me/route.ts`: importado `safeMaterializeSessionUser` e aplicado para usuários custom.
4. Validação — fluxo: salvar foto custom → PATCH atualiza cookie + DB → `router.refresh()` → SiteHeaderWrapper lê cookie (custom) → DB fetch → avatar correto na navbar.

**Arquivos tocados:**
- `components/SiteHeaderWrapper.tsx` — condição broadened: qualquer custom source sempre lê do DB
- `app/api/auth/me/route.ts` — materializa user do DB para custom avatar

**Commits / deploy:** pendente.

**Como testar:** `/conta` → selecionar "Foto personalizada" → salvar → navbar deve mostrar o avatar escolhido imediatamente.

---

### 2026-06-20 — Redesign Phase 1: tokens Verdigris + sweep de dourado

**Pedido:** iniciar redesign do site conforme `docs/REDESIGN-2026.md`; fase 1 = trocar sistema de cores.

**Passo a passo:**
1. Decisão — acento primário `#6B9E8C` (Verdigris, bronze envelhecido) substituindo `#b8922e` (dourado genérico); fundos chrome mais escuros; escala tipográfica + cores semânticas novas.
2. Implementação — reescrita completa do bloco `:root` em `app/globals.css`: novos tokens de chrome, acento verdigris, `--accent-dim`, `--accent-warn` (#C97A4A cobre quente), `--accent-glow`, escala `--text-xs` a `--text-4xl`, cores `--color-hp/pa/magic/success/danger`; substituição de todos os `rgba(184, 146, 46, ...)` no corpo do arquivo.
3. Sweep — grep de `b8922e|c9a962|d4a030|a07c28|c9a84c|c9a227` em 15+ arquivos CSS; PowerShell replace para → `#6B9E8C`; SVG data URLs URL-encoded (`%23d4a030` → `%236B9E8C`) em `compendium.css` e `eldarin-v4.css`.
4. Validação — grep final retornou 0 ocorrências hardcoded fora de `var()` fallbacks.

**Arquivos tocados:**
- `app/globals.css` — bloco `:root` completo reescrito; rgba no corpo substituídos
- `components/character/sheet-ddb.css`, `sheet-popup.css`, `sheet.css`, `sheet-v2.css`, `sheet-pdf.css`, `sheet-pdf-capture.css`, `level-up.css` — sweep de dourado → verdigris
- `components/auth/auth-forms.css`, `components/friends/friends.css`, `components/notifications/notifications.css`, `components/pwa/pwa-install.css`, `components/rpg/mesas-hub.css` — sweep
- `components/ui/site-tooltip.css`, `components/vtt/combat-mode-transition.css`, `components/vtt/eldarin-v4.css`, `components/vtt/mesa-theme.css`, `components/vtt/vtt.css`, `components/vtt/whiteboard.css` — sweep incluindo SVG URL-encoded
- `components/compendium/compendium.css` — SVG corner URLs atualizadas

**Commits / deploy:** pendente.

**Como testar:** abrir qualquer página → todos os acentos aparecem em verde-patina Verdigris `#6B9E8C` em vez de dourado; mesa com tokens tem ring verdigris.

---

### 2026-06-20 — Refatoração CSS da toolbar lateral (MapToolbar)

**Pedido:** sidebar do VTT com espaçamento estranho e layout bugado; refatorar `whiteboard.css` para ficar bonita e responsiva sem criar novos containers.

**Passo a passo:**
1. Diagnóstico — CSS tinha três problemas: `max-width: min(3.25rem, 14vw)` que colapsava em viewports pequenas; `.map-toolbar__btn` com `display: inline-flex` e `display: grid` duplicado (a segunda declaração sobrescreve a primeira); `gap: 0.3rem` uniforme em `.map-toolbar` criava ritmo irregular entre labels, grupos e divisores.
2. Decisão — reescrever `whiteboard.css` inteiro com: largura fixa `2.75rem` no lugar do `min()` problemático; `gap: 0` no container + `margin` semântica nos filhos; `.map-toolbar__btn` com `display: grid; place-items: center` único; efeito visual de separação nos `section-label` via `::before`/`::after` (hairlines laterais) sem alterar HTML.
3. Implementação — reescrita completa do arquivo mantendo todos os nomes de classe; botões passaram a `2.15rem × 2.15rem` (caem exato no padding do container); espaçamento hierárquico: `margin-top: 0.5rem` no section-label (exceto `:first-child`), `margin: 0.35rem 0` no divisor; seção flyout preservada com os mesmos seletores do MapToolbar.tsx.
4. Validação — CSS puro, sem mudança em `.tsx`; nenhum build TypeScript necessário; verificar visualmente na mesa.

**Arquivos tocados:**
- `components/vtt/whiteboard.css` — reescrita completa; mesma API de classes, layout e espaçamento corrigidos

**Commits / deploy:** pendente.

**Como testar:** abrir mesa → toolbar aparece na lateral esquerda → seções MAPA / LOUSA / ZOOM alinhadas com ritmo uniforme; seção-labels exibem `━━ MAPA ━━` com hairlines laterais; botões quadrados sem corte; flyout de lousa abre ao lado do toolbar sem overlap.

---

### 2026-06-19 — Fix ataques retornando HTTP 500

**Pedido:** ataques não funcionam; console mostra 20+ erros 500 em `/api/room/[roomId]/combat/attack`.

**Passo a passo:**
1. Diagnóstico — prints do console confirmaram que o ataque chega ao servidor mas retorna 500 (não 400). A rota não tinha try/catch, então qualquer exceção virava 500 silencioso sem mensagem de erro.
2. Causas identificadas — três pontos de falha: (a) `actor.inventory` podendo ser `undefined` em dados legados → `TypeError` no `for...of` de `listCombatActions`; (b) `resolveRoomAttackAction` fora de try/catch na função `executeRoomAttack` → qualquer throw virava 500; (c) `resolveCombatAction` jogava exceção quando a ação específica (packId+entryId) não era encontrada, em vez de fazer fallback.
3. Implementação — (a) `actor.inventory ?? []` em `listCombatActions`, `listCombatAbilities` e `listActorConsumables`; (b) try/catch envolvendo `resolveRoomAttackAction` nos dois fluxos de `combat-attack.ts`, retornando `{ok: false}` em vez de propagar; (c) `resolveCombatAction` agora loga aviso e faz fallback para ação default em vez de jogar exceção; (d) try/catch global na rota com `console.error` para logar causa real no servidor.
4. Validação — `tsc --noEmit` sem erros.

**Arquivos tocados:**
- `app/api/room/[roomId]/combat/attack/route.ts` — try/catch global + console.error para debug
- `lib/room/handlers/combat-attack.ts` — try/catch em `resolveRoomAttackAction` nos dois fluxos
- `lib/combat/attack.ts` — `inventory ?? []` em `listCombatActions`; fallback em `resolveCombatAction`
- `lib/combat/ability.ts` — `inventory ?? []` em `listCombatAbilities`
- `lib/combat/consumables.ts` — `inventory ?? []` em `listActorConsumables`

**Commits / deploy:** pendente push.

**Como testar:** abrir mesa real → selecionar token PC → ring de ação → Atacar → selecionar alvo → ataque deve processar (resultado no chat); se ainda falhar, erro agora aparece na UI em vez de 500 silencioso.

---

### 2026-06-18 — Leitura inicial e criação do histórico

**Pedido:** estudar o documento completo do projeto e criar histórico vivo.

**O que foi feito:**
- Leitura completa de `docs/CLAUDE-PROJETO.md` e `docs/CLAUDE-CODIGO-SEGURO.md`.
- Criação deste arquivo `docs/HISTORICO.md`.

**Arquivos tocados:**
- `docs/HISTORICO.md` (criado)

**Nada alterado no código.**

---

### 2026-06-18 — Correção das regras de PA

**Pedido:** correção das regras de PA que estavam erradas na documentação.

**Regra correta:**
- Base: **5 PA/turno**
- Acúmulo: pode salvar até **5 PA** não usados entre turnos
- Pool total máxima: **9 PA** (não 11)
- Atordoado: zera o acúmulo

**Arquivos corrigidos:**
- `docs/CLAUDE-PROJETO.md` — seção 8 (PA) e seção 15 (D14)

**Nada alterado no código.**

---

### 2026-06-18 — Regras de PA por tipo de criatura

**Pedido:** complemento das regras de PA para monstros, minibosses e bosses.

**Regras adicionadas:**
- **Monstros:** 6 PA/turno, não acumulam entre turnos
- **Minibosses / Bosses:** acumulam PA até o máximo de **8 PA**

**Arquivos corrigidos:**
- `docs/CLAUDE-PROJETO.md` — seção 8 (PA) e seção 15 (D14)

**Nada alterado no código.**

---

### 2026-06-18 — Planejamento: refatoração do combate na mesa

**Pedido:** refatorar o sistema de combate da mesa VTT.

**Status:** PRD aprovado (`docs/PRD-COMBATE-MESA-REFACTOR.md`, decisões R1–R30). Implementação a iniciar.

**Regras completas de PA (consolidadas):**

| Quem | PA base/turno | Acúmulo | Pool máx |
|------|--------------|---------|---------|
| Jogador | +5/turno | até 5 PA | **9** (11 c/ talento Lobo Solitário) |
| Monstro | 6/turno | **não acumula** | 6 |
| Miniboss / Boss | — | sim | **8** |

**Custo de ações:**
| Ação | Custo |
|------|-------|
| Ataque básico | 2 PA |
| Ataque Extra (Guerreiro 5+) | 2 PA/golpe |
| Estribilho (magia nv.0) | 1 PA, máx 2 iguais/turno |
| Ação rápida (ex-bônus) | 1 PA |
| Segundo Fôlego | 1 PA, 1×/combate |
| Ajudar / Evadir / Disparada | 1 PA cada |
| Reação | 1 PA (débito se pool vazio → recupera 4 no próximo turno) |
| Movimento (1 bloco) | 1 PA → 6 m (4 células) |
| Correr | 2 PA → 12 m (8 células) |
| Magia / Habilidade | variável por compêndio |
| Falar / Olhar | **gratuito** |

**Fora de combate:** movimento livre, magias sem PA.

**Épicos P0 (prioridade máxima):**
- E1: PA v4 + Estribilho + ação rápida
- E2: Modo combate/exploração (GM toggle, `room.mode`)
- E3: Iniciativa (1d20+DES), d100 empate, entrada tardia, reações v1, débito PA
- E4: Morte (0 HP → inconsciente, 10 rodadas → morto), XP configurável, friendly fire confirm

**Já implementado (P5):** formas de área (burst/wall/cone/line/cube), action-preview, BattlefieldActionHud, highlights.

**Referências:** `docs/PRD-COMBATE-MESA-REFACTOR.md` · `docs/VTT-ACOES-PA-AREAS.md` · `docs/P5-COMBAT-UX.md`

---

### 2026-06-18 — Correção: grid do mapa é quadrado, não hexagonal

**Pedido:** confirmação de que o mapa usa grid quadrado.

**Regra:** grid **quadrado**, 1 célula = 1,5 m (já no PRD R28). Memória do projeto estava errada ("hexagonal").

**Arquivos corrigidos:**
- `memory/project_eldarin_vtt.md` — removida menção a "hex canvas" e "Grid hexagonal"

---

### 2026-06-18 — Correção: movimentação 6m/12m e confirmação grid quadrado (sem hex)

**Pedido:** remover toda referência a "hex", ajustar caminhada para 6m e corrida para 12m.

**Resultado do grep:** código já estava limpo (scripts de purge-hex já tinham sido rodados). Hex só aparecia em docs/HISTORICO.md (entradas de histórico — esperado) e PDFs intocáveis.

**Movimentação corrigida:**
- Caminhada: 1 PA → **6 m** (4 células) — era 9m
- Corrida: 2 PA → **12 m** (8 células) — era 18m
- 1 célula = 1,5 m (inalterado)

**Arquivos tocados:**
- `lib/vtt/movement.ts` — `BASE_MOVEMENT_METERS` 9 → 6; default `movementRunMax` 6 → 8 células; comentário corrigido
- `docs/HISTORICO.md` — tabela de movimentação
- `docs/CLAUDE-PROJETO.md` — seção PA e movimentação

**Como testar:** `npm run build` + `/mesa/demo` → mover token e verificar alcance.

---

### 2026-06-18 — Diagnóstico: estado atual do VTT (testes com Playwright)

**Pedido:** rodar o app, fazer testes e reportar resultados.

**Ambiente:** dev local sem DB (Neon ETIMEDOUT), sem Clerk keys — auth por cookie demo.

**Performance (dev mode):**
| Página | Status | Tempo |
|--------|--------|-------|
| Landing `/` | 200 ✅ | ~630ms |
| Mesa Demo `/mesa/demo` | 200 ✅ | ~630ms |
| Biblioteca `/biblioteca` | 200 ✅ | ~4.4s ⚠️ (compêndio pesado) |
| Painel `/painel` | redirect → /entrar | esperado sem auth |

**Testes unitários:** todos passando (31 testes sheet-pdf + 24 consumíveis + compêndios OK + 83 monstros spawnáveis).

**Problemas encontrados:**
1. `room.mode = undefined` — campo não existe no estado da sala (Epic E2 não implementado)
2. `tokens = 0` — atores demo existem (4 PCs) mas nenhum está posicionado no mapa
3. `paState = {}` — PA não inicializado nos atores
4. `character = {}` — dados de ficha não mesclados no ator demo (HP, atributos ausentes)
5. 13 erros 401 — Clerk chamadas falhando (esperado sem keys, mas polui console)
6. Sem mapa na demo — `mapImageUrl` vazio, grid vazio cinza

**APIs de combate (caminhos corretos):**
- `POST /api/room/[id]/combat/roll-initiative` — 401 (precisa ser GM)
- `POST /api/room/[id]/combat/next-turn` — 403 (precisa de auth)
- `POST /api/room/[id]/combat/gm` — 400 (endpoint existe, parâmetro errado)
- `POST /api/room/[id]/combat/attack` — existe ✅
- `POST /api/room/[id]/combat/ability` — existe ✅
- `POST /api/room/[id]/combat/area` — existe ✅

**Nada alterado no código nesta sessão.**

---

### 2026-06-18 — Decisões de UX da mesa (respostas do usuário)

**Decisões confirmadas:**
- Tokens não precisam de posição padrão na demo, mas posições devem ser **salvas e sincronizadas em tempo real** entre jogadores e mestre
- Sem mapa na demo por enquanto
- Pill "Aventura/Combate" só visível para o **mestre** — jogadores não veem o toggle
- Action ring **já existe** (clique direito no token da vez)
- **Clique esquerdo** no token deve abrir o action ring no **modo máximo** (não o menu de contexto)

---

### 2026-06-18 — Fix: clique esquerdo no token abre action ring

**Pedido:** clicar num token deve abrir o action ring no modo máximo (antes só abria no clique direito).

**O que mudou:**
- `hooks/vtt/useBattlefieldPointer.ts` — no handler `onPointerUp`, após selecionar o token via clique esquerdo, agora chama `onActionRingRequest` se o token puder abrir o ring (mesma lógica do clique direito / `onContextMenu`)
- Adicionado `canOpenActionRing`, `onActionRingRequest`, `onActionRingBlocked`, `tokenScreenCenter` às dependências do `useCallback`

**Regra:**
- Clique esquerdo em token → seleciona + abre action ring
- Clique direito em token → continua abrindo normalmente (onContextMenu)
- Em modo ataque/área → comportamento original preservado

**Validação:** `npm run build` ✅ (compiled in 23.9s, 0 errors)

**Como testar:** `/mesa/demo` → colocar um token no mapa → clicar nele com botão esquerdo → action ring deve aparecer centralizado no token.

---

### 2026-06-18 — Estudo de docs/COMBATE-MESA.md + correção MONSTER_PA_BOSS

**Pedido:** estudar `docs/COMBATE-MESA.md` (guia técnico completo do combate).

**O que aprendi (não estava na memória):**
- Três fases de PA: `exploration` (sem débito) → `combat_free` → `combat_turn`
- `room.mode` não é campo direto — fase é derivada de `settings.combatActive` + `combat.order`
- Auto-pass: 500ms no código vs 1,5s no PRD (lacuna conhecida)
- Reações v1: débito de PA existe no código mas **sem triggers** nas rotas ainda
- Entrada tardia: spawn entra na ordem imediatamente (não no fim da rodada como PRD diz)

**Correção feita:**
- `lib/combat/pa-economy.ts`: `MONSTER_PA_BOSS` 9 → **8** (alinhado com regra do usuário)

**Lacunas conhecidas (sem implementação):**
- Reações v1 (oportunidade, Escudo, Contramágica) — triggers ausentes nas rotas
- Entrada tardia na iniciativa (R20)
- Delay auto-pass 500ms ≠ 1,5s do PRD
- Surpresa — não implementada

**Arquivos tocados:**
- `lib/combat/pa-economy.ts` — `MONSTER_PA_BOSS` 9 → 8
- `docs/CLAUDE-PROJETO.md` — seção PA atualizada com fases e boss

**Validação:** `npm run build` ✅

---

### 2026-06-18 — Alinhamento docs + updates Claude (PA boss, movimento, mesa)

**Pedido:** alinhar `HISTORICO.md` e `COMBATE-MESA.md` com o código; commitar updates pendentes.

**O que mudou:**
- `docs/HISTORICO.md` — DB → MariaDB; ataque básico = 2 PA (código)
- `docs/COMBATE-MESA.md` — miniboss/boss: **8 PA** (`MONSTER_PA_BOSS`)
- Updates Claude já no working tree: clique esquerdo → action ring, movimento 6m/12m, `MONSTER_PA_BOSS=8`, guard Postgres no client MariaDB

**Arquivos no commit:**
- `docs/CLAUDE-PROJETO.md`, `docs/COMBATE-MESA.md`, `docs/HISTORICO.md`
- `hooks/vtt/useBattlefieldPointer.ts`
- `lib/combat/pa-economy.ts`, `lib/combat/combat-pa-engine.ts`
- `lib/vtt/movement.ts`, `lib/db/client-mariadb.ts`
- `scripts/install-wsl.ps1`

**Como testar:** `npm run build` · `/mesa/demo` → clique esquerdo no token abre action ring · `/api/health` → `persistence: mariadb` com `DATABASE_URL` mysql

---

### 2026-06-19 — Login quebrado com MariaDB inacessível

**Pedido:** login não funcionava em produção.

**Passo a passo:**
1. **Diagnóstico** — com `DATABASE_URL` definida mas MariaDB fora/SSL inválido, `resolveUserForLogin` só consultava o DB e não caía no registry demo (`mestre`/`jogador`).
2. **Decisão** — manter DB como fonte principal, mas **fallback** para registry local quando a query falha ou retorna vazio.
3. **Implementação** — `fetchUserByLogin` aceita apelido; helper `dbSqlReady()` (`lib/db/sql-ready.ts`) para saber se SQL está utilizável; fluxo de login com fallback explícito.
4. **Validação** — login demo e e-mail quando DB degradado.

**Arquivos tocados:**
- `lib/auth/user-store.ts`, `lib/db/sql-ready.ts`

**Commits:** `c9be247` (login fallback)

**Como testar:** sem DB → `/entrar` com `mestre`/`123`; com DB → usuário persistido.

---

### 2026-06-19 — OAuth Google/Discord em destaque + health

**Pedido:** confirmar OAuth nativo (sem Clerk) e melhorar UX/docs.

**Passo a passo:**
1. Botões Google/Discord no topo de `/entrar` (`OAuthSignInButtons`, `AuthTabs`).
2. `oauthSetupStatus()` em `/api/health` — `oauth.ready`, `oauth.missing`, flags por provedor.
3. Guia manual: `docs/P2-OAUTH-MANUAL.md` (credenciais Google Cloud, callbacks, env).

**Env necessária:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_URL`, `SESSION_SECRET`.

**Commits:** `5d33c0d`

**Como testar:** `/api/health` → `oauth.ready: true`; `/entrar` → botão Google.

---

### 2026-06-19 — Erro 500 após login (APIs + loop de rotas)

**Pedido:** site 500 depois do login Google.

**Passo a passo:**
1. **Diagnóstico** — APIs de amigos/aventuras sem try/catch quando MariaDB falha; possível loop `/eldarin` ↔ `/entrar/apelido`.
2. **Implementação** — `lib/db/safe-query.ts`; APIs degradam para listas vazias; `/eldarin` usa `dbNicknameFlowEnabled()` antes de forçar apelido.
3. **Validação** — login não derruba o app com `db: false`.

**Commits:** `521240f`

**Como testar:** login com `db: false` no health → `/mesas` carrega sem 500.

---

### 2026-06-19 — MariaDB SSL (Contabo)

**Pedido:** `db: false` em produção (`self-signed certificate in certificate chain`).

**Passo a passo:**
1. Cliente MariaDB aceita certificado self-signed via `MARIADB_SSL_REJECT_UNAUTHORIZED=0` ou `?sslaccept=accept_invalid_certs` na URL.
2. Health usa ping real para `persistentAccounts`.

**Commits:** `af674b7`

**Pendente no servidor:** setar env SSL + `npm run db:migrate` no container.

**Como testar:** `/api/health` → `db: true`, `persistentAccounts: true`.

---

### 2026-06-19 — Eldarin deixa de ser “o site” → hub MXDRPG

**Pedido:** Eldarin é RPG dentro do hub, não nome do site.

**Passo a passo:**
1. Mesas Eldarin: **`/rpg/eldarin`** (antes `/eldarin`).
2. Pós-login padrão: **`/mesas`** (hub de RPGs).
3. `/eldarin` legado → redirect para `/rpg/eldarin`.
4. Constantes em `lib/rpg/systems.ts`: `MESAS_HUB_PATH`, `ELDARIN_MESAS_PATH`, `rpgMesasPath()`.
5. `DEFAULT_POST_AUTH_PATH = /mesas` em `lib/auth/post-auth-redirect.ts`.

**Commits:** `ad76c51`

**Como testar:** login → `/mesas` → card Eldarin → `/rpg/eldarin`.

---

### 2026-06-19 — Ajuste de links do site

**Pedido:** unificar links para rotas canônicas do hub.

**Passo a passo:**
1. Criado `lib/site-paths.ts` — `ENTRAR_PATH`, re-export de paths do hub/Eldarin.
2. Substituído `/sign-in` → `/entrar` (home, header, footer, mesa, privacidade, conta, compêndios…).
3. Substituído `/painel` → `/mesas` (configurar aventura, personagem/novo, `PortalShell`).
4. Rotas legadas `/painel`, `/jogador`, `/mestre` redirecionam para `/mesas`.
5. Footer ganhou link **Mesas**; página `/sistema` separa hub e Eldarin.
6. `STATIC_TAB_TITLES` em `lib/site-metadata.ts` alinhado.

**Arquivos tocados (principal):**
- `lib/site-paths.ts` (novo)
- `components/SiteFooter.tsx`, `SiteHeaderWrapper.tsx`, `HeaderUserMenu.tsx`
- `app/page.tsx`, `app/sistema/page.tsx`, `app/privacidade/page.tsx`
- `app/painel/*`, `app/jogador/*`, `app/mestre/*`
- APIs login/register — mensagens com `/entrar`

**Commits:** pendente local (junto com fixes Docker/OAuth abaixo)

**Como testar:** navegar site logado/deslogado — nenhum link público deve apontar para `/sign-in` ou `/painel`.

---

### 2026-06-19 — Docker: cache de imagens Next.js

**Pedido:** erro `ENOENT mkdir '/app/.next/cache/images'` no container.

**Passo a passo:**
1. **Diagnóstico** — otimizador de imagens do Next precisa gravar em `.next/cache/images`; pasta não existia ou não era gravável no runtime.
2. **`docker-entrypoint.sh`** — cria `.next/cache/images` e `.next/cache/fetch-cache` antes de `npm start`.
3. **`Dockerfile`** — `mkdir -p` após `npm run build` + `ENTRYPOINT` do script.
4. **`DEPLOY.md`** — nota sobre volume `emptyDir` em `/app/.next/cache` se filesystem for read-only.

**Arquivos tocados:**
- `docker-entrypoint.sh` (novo), `Dockerfile`, `DEPLOY.md`

**Como testar:** rebuild imagem → abrir página com `next/image` → sem erro no log.

---

### 2026-06-19 — OAuth: “Sessão expirada” + 401 no console

**Pedido:** após Google, mensagem *Sessão OAuth expirada* e 401 em `/api/auth/me`, `/api/friends/*`.

**Passo a passo:**
1. **Diagnóstico** — cookie `eldarin_oauth` não voltava no callback (host `www` ≠ apex, ou `cookies().set()` não anexado ao redirect 302 no App Router).
2. **Cookies no redirect** — `applyOAuthStateCookie()` no início OAuth; `applySessionCookie()` no fim do callback (`completeOAuthLogin`).
3. **Host canônico** — `middleware.ts` redireciona apex ↔ `www` para o host de `AUTH_URL` (cookie é host-specific).
4. **`consumeOAuthState`** — falhas tipadas (`missing`, `expired`, `mismatch`) + log no servidor.
5. **Ruído no console** — `/api/auth/me` retorna `200` + `{ user: null }` quando deslogado (amigos ainda 401 — esperado).
6. **Health** — campo `authOrigin` para conferir `AUTH_URL` em produção.

**Arquivos tocados:**
- `lib/auth/oauth/state.ts`, `lib/auth/oauth/complete-login.ts`
- `lib/auth/session.ts` — `buildSessionCookie`, `applySessionCookie`
- `app/api/auth/oauth/[provider]/route.ts`, `callback/route.ts`
- `app/api/auth/me/route.ts`, `app/api/health/route.ts`
- `middleware.ts`, `DEPLOY.md`

**Checklist produção:**
- `AUTH_URL=https://www.mxdrpg.com.br` (mesmo host que o usuário abre)
- Callback Google = `https://www.mxdrpg.com.br/api/auth/oauth/google/callback`
- `SESSION_SECRET` estável (não rotacionar no meio do fluxo)

**Commits:** pendente local

**Como testar:** `/entrar` → Google → cair em `/mesas` ou `/entrar/apelido` sem `error=oauth_state`; `/api/health` → `authOrigin` correto.

---

### 2026-06-19 — Padrão de histórico passo a passo

**Pedido:** melhorar o arquivo de atualizações e **sempre** documentar assim.

**Passo a passo:**
1. Seção **Padrão obrigatório — toda sessão** no topo deste arquivo (formato + checklist).
2. Tabela **Estado atual** atualizada (MXDRPG hub, OAuth, rotas canônicas, Docker).
3. Entradas retroativas da sessão 2026-06-19 com passo a passo numerado.

**Arquivos tocados:**
- `docs/HISTORICO.md`

**Como testar:** ao fim de cada chat, verificar se há entrada nova com data, passos e “como testar”.

---

### 2026-06-19 — Onboarding de perfil no primeiro acesso

**Pedido:** após criar conta/login, no primeiro acesso ir para perfil: apelido obrigatório + foto (Google, sugerida pelo apelido ou upload).

**Passo a passo:**
1. **Diagnóstico** — fluxo antigo só pedia apelido em `/entrar/apelido`, sem escolha de avatar no mesmo passo.
2. **Decisão** — página única de onboarding em `/conta/bem-vindo`; após salvar, redireciona para `/mesas` (ou destino pedido).
3. **Implementação:**
   - `ProfileOnboardingForm` — apelido + 3 opções de foto: Google, avatar sugerido (DiceBear por apelido), upload/URL.
   - `POST /api/auth/onboarding` — salva apelido + avatar e atualiza sessão numa chamada.
   - `avatarSource: generated` em `user-avatar.ts` — URL derivada do apelido em runtime.
   - `postAuthRedirect` → `/conta/bem-vindo` quando sem apelido (MariaDB ativo).
   - `/entrar/apelido` legado → redirect para `/conta/bem-vindo`.
   - `/conta` — `AvatarProfileForm` ganhou opção “Avatar sugerido”.
4. **Validação** — `npm run build` ✅.

**Arquivos tocados:**
- `app/conta/bem-vindo/page.tsx`, `components/auth/ProfileOnboardingForm.tsx`
- `app/api/auth/onboarding/route.ts`, `lib/auth/profile-onboarding.ts`
- `lib/avatar/nickname-avatar.ts`, `lib/db/user-avatar.ts`, `lib/auth/post-auth-redirect.ts`
- `app/entrar/apelido/page.tsx` (legado), `components/auth/AvatarProfileForm.tsx`

**Como testar:**
1. Login Google (conta nova ou sem apelido) → deve abrir `/conta/bem-vindo`.
2. Digitar apelido → preview do avatar sugerido atualiza.
3. Escolher Google / sugerido / upload → **Continuar** → `/mesas`.
4. Editar depois em `/conta`.

**Commits:** pendente local

---

### 2026-06-19 — Fix: “Conta não encontrada” ao salvar apelido (OAuth)

**Pedido:** screenshot em `/entrar/apelido` — erro ao salvar apelido; 400 em `/api/auth/nickname`; 500 em `/api/notifications`; regex inválido no `pattern` do input.

**Passo a passo:**
1. **Diagnóstico** — login Google com DB falhando deixava sessão com id efêmero `google-…` / `discord-…`. `materializeSessionUser` não criava linha em `eldarin_users`; `setUserNickname` falhava com “Conta não encontrada”.
2. **Decisão** — ao materializar sessão OAuth, chamar `ensureUserFromOAuth` em modo **strict** (erro claro se DB cair, sem fallback silencioso).
3. **Implementação:**
   - `lib/auth/oauth-session-id.ts` — parse de ids `google-*` / `discord-*`.
   - `materializeSessionUser` — cria/recupera usuário OAuth no MariaDB; fallback por e-mail para `usr_*` órfão.
   - `POST /api/auth/nickname` — `createSession` após salvar (cookie passa a `usr_*`).
   - `/api/notifications` — `safeDbRead` (sem 500 quando DB falha).
   - `pattern` do apelido: `[a-zA-Z0-9_\-]{3,24}` (hífen escapado — Chrome `/v` quebrava `[a-zA-Z0-9_-]*`).
4. **Validação** — `npm run build` ✅.

**Arquivos tocados:**
- `lib/auth/session-user.ts`, `lib/auth/oauth-session-id.ts`, `lib/db/users.ts`
- `app/api/auth/nickname/route.ts`, `app/api/notifications/route.ts`
- `components/auth/NicknameForm.tsx`, `ProfileOnboardingForm.tsx`, `RegisterForm.tsx`

**Produção ainda precisa:** `db: true` no health (SSL MariaDB) + deploy com `/conta/bem-vindo`.

**Como testar:** login Google → salvar apelido → sem “Conta não encontrada”; cookie atualizado; `/api/notifications` retorna `{ items: [], count: 0 }` se DB off.

**Commits:** `2e78ac0` (bundle anterior)

---

### 2026-06-19 — Fix reforçado: apelido após OAuth (sessão órfã)

**Pedido:** ainda “Conta não encontrada” ao salvar apelido (ex.: MaulXD).

**Passo a passo:**
1. **Diagnóstico** — `fetchUserById` usava `safeDbRead` e devolvia `null` em falha SSL; `usr_*` órfão caía sem recriar usuário OAuth; cookie sem `oauthProvider`/`oauthSubject`.
2. **Decisão** — priorizar identidade OAuth na materialização; gravar provider/subject na sessão; leitura strict antes de UPDATE.
3. **Implementação:**
   - `SessionUser` + cookie: `oauthProvider`, `oauthSubject`.
   - `oauthIdentityFromSession()` — id efêmero ou campos da sessão.
   - `materializeSessionUser` — OAuth primeiro; sem retorno silencioso de id inválido.
   - `fetchUserByIdStrict` + `setUserNickname` usa leitura direta (erro real do MariaDB).
4. **Validação** — `npm run build` ✅.

**Como testar:** **Sair** → entrar de novo com Google → `/conta/bem-vindo` → salvar apelido. Exige `db: true` no health.

**Commits:** pendente local

---

### 2026-06-12 — Remoção do Clerk + estabilização da mesa em produção

**Pedido:** remover Clerk de vez; corrigir mesa que não abre (erro SSR) e deploy desatualizado em www.mxdrpg.com.br.

**Passo a passo:**
1. **Diagnóstico** — pod em imagem antiga (`/api/health` sem `buildSha`); erros SQL (`ER_PARSE_ERROR`, `Promise` em queries); mesa derrubava SSR ao sincronizar fichas incompletas (`inventory`/`identity` undefined); 404 em `arcane-cover.png` (cosmético).
2. **Decisão** — auth só OAuth manual + cookie `vinite_session`; manter coluna `clerk_id` e aliases `clerk-*` só como legado de dados; sync da mesa tolerante a fichas inválidas; `releaseId` no health para confirmar deploy.
3. **Implementação:**
   - Removido `@clerk/nextjs`, componentes `Clerk*`, webhook `/api/webhooks/clerk`, `clerk-sync`, docs `P1-CLERK-SETUP.md`.
   - `middleware.ts` sem `clerkMiddleware`; sessão só `vinite_session`.
   - SQL usuários: `queryOneUserRow` com `sql.unsafe`; SSL MariaDB Contabo por padrão.
   - Mesa: `listCharactersForSessionUserSafe`, `safeMaterializeSessionUser`; `arcane-cover.png` em `public/brand/rpg/`.
   - Sync atores: `mergePortraitFromRoom` com `inventory?.length`; `toRoomActor` e `syncAdventureActorsForRoom` com try/catch; página `/mesa/[roomId]` não derruba em join/bind.
   - Capa da mesa: fallback para `eldarin-cover.png` se imagem 404.
4. **Validação** — `npm run build` ✅ em cada commit.

**Arquivos tocados (principais):**
- `package.json`, `middleware.ts`, `lib/auth/session.ts`, `lib/db/users.ts`
- `app/mesa/[roomId]/page.tsx`, `lib/room/adventure-actors.ts`
- `components/vtt/RoomCoverBackdrop.tsx`, `lib/release.ts`
- `.env.example`, `DEPLOY.md`

**Commits / deploy:** `f11d1f9` (remove Clerk) · `dd9b457` (mesa SSR segura) — **push em `main`** · imagem `ghcr.io/maulxd/mxdrpg:sha-dd9b457` · `releaseId`: `mesa-sync-safe-2026-06-12`

**Como testar:**
```bash
curl -s https://www.mxdrpg.com.br/api/health   # buildSha=dd9b457, db=true
# Login Google → criar/abrir mesa → mapa e painéis carregam
kubectl -n raul set image deployment/mxdrpg mxdrpg=ghcr.io/maulxd/mxdrpg:sha-dd9b457   # se health antigo
```

---

---

### 2026-06-19 — Fix: action ring aparece e desaparece (v2 — causa raiz SSE)

**Pedido:** o action ring abre e fecha imediatamente sem o jogador fazer nada.

**Passo a passo:**
1. **Diagnóstico v1** — Race condition concurrent mode: `setSelectedId` + `setActionRingAt` no mesmo batch → effect `[selectedId]` limpava `actionRingAt`. Fix inicial: `pendingRingRef` para preservar o ring por um ciclo.
2. **Diagnóstico v2 (causa raiz real)** — SSE/sync da sala muda `turnActiveId` (ou `round`) durante ou logo após a abertura do ring. O effect `[selectedId, turnActiveId, round]` dispara uma **segunda vez** com `pendingRingRef.current = null` (já consumido na primeira vez) e chama `setActionRingAt(null)` — fechando o ring mesmo que o token ainda pudesse agir.
3. **Decisão** — Separar responsabilidades dos effects:
   - `useEffect([selectedId])`: só fecha o ring se o token selecionado mudou para um token **diferente** do que abriu o ring (`ringTokenIdRef.current !== selectedId`).
   - `useEffect([selectedId, turnActiveId, round])`: só reseta modo de combate (idle/ação/PA) — não toca mais em `actionRingAt`.
   - `useEffect([actionRingAt, selected, canOpenActionRing])`: já existia — fecha ring se o token perder permissão de agir.
   - Removido `pendingRingRef` (não mais necessário).
4. **Implementação:**
   - `Battlefield.tsx` — `ringTokenIdRef = useRef(null)`; `onActionRingRequest` seta `ringTokenIdRef.current = token.id`; effect `[selectedId]` fecha ring só se `ringTokenIdRef.current !== selectedId`; effect `[turnActiveId, round]` não limpa mais `actionRingAt`.
   - `TokenActionRing.tsx` — `backdropReady` guard 150ms mantido (proteção contra click fantasma).
5. **Validação** — `npx tsc --noEmit` ✅ zero erros.

**Arquivos tocados:**
- `components/vtt/Battlefield.tsx` — substituído `pendingRingRef` por `ringTokenIdRef`, effects refatorados

**Commits / deploy:** `d0ec533` → `main` (push em 2026-06-19)

**Como testar:**
1. `/mesa/demo` → clicar token com turno ativo
2. Ring deve abrir e **ficar aberto** — mesmo com SSE ativo atualizando a sala
3. Clicar fora do ring → fecha normalmente
4. Clicar **outro token** → ring fecha, token novo seleciona
5. ESC → fecha normalmente

---

### 2026-06-20 — Combate na mesa com @3d-dice/dice-box

**Pedido:** levar o preview dice-box 3D para a mesa, com cores por tier (jogador/monstro/elite/miniboss/boss), slot de dano só no acerto, ataque travado, expulsão forçada no resolve — mantendo timings e regras de acerto do `CombatFxLayer`.

**Passo a passo:**
1. **Preview** — `public/preview-combate-dados.html` com dois slots lazy-init, física ajustada, expulsão animada.
2. **Mesa** — `DiceCombatPanel` + `lib/vtt/dice-combat-box.ts` substituem `DiceWebGL`/`DiceMiniature` no painel de combate.
3. **Regras** — timings `COMBAT_FX_TIMINGS` intactos; dano só se `showDamageRoll`; resolve = applyState + token + chat + evict 340ms; `attackerTokenId` no FX state para cor do d20.
4. **Validação** — `npm run build` ✅

**Arquivos tocados:**
- `components/vtt/DiceCombatPanel.tsx` — dice-box ataque/dano
- `components/vtt/CombatFxLayer.tsx` — integração + evict
- `lib/vtt/dice-combat-box.ts` — cores tier e opts física
- `public/assets/dice-box/` — assets WASM/tema

**Commits / deploy:** `bd7ed03` — branch `cursor/dice-box-combat` (push origin)

**Como testar:** `/mesa/[roomId]` → ataque no combate; preview em `/preview-combate-dados.html`

---

### 2026-06-20 — Fix ataque ao alvo e sync da mesa (500/403)

**Pedido:** erros ao atacar alvo na mesa — `500` em `/combat/attack`, `/tokens/spawn`, `/tokens/reposition`; `403` ao salvar loadout; aviso `habilidades-golpe-de-chi não encontrada`; toast “Sync demorou demais”.

**Passo a passo:**
1. **Diagnóstico** — Golpe de Chi no `combatLoadout` sem entrada no inventário da ficha; mestre tentava salvar loadout de jogador (403); `persistRoom`/XP pós-derrota sem tratamento gerava 500 em cascata.
2. **Decisão** — sincronizar habilidades de classe em `listCombatActions`; permitir PATCH só de loadout para mestre; falhas de persistência não derrubam o ataque.
3. **Implementação** — `syncCombatAbilitiesToInventory` + fallback compêndio em `resolveCombatAction`; `canPatchRoomActorLoadout`; try/catch em rotas spawn/reposition/ability e `finishCombatAttack`.
4. **Validação** — `npm run build` ✅

**Arquivos tocados:**
- `lib/combat/attack.ts` — sync classe + resolve compêndio
- `lib/auth/room-access.ts` — permissão loadout mestre
- `lib/room/handlers/combat-attack.ts` — persistência segura
- `app/api/room/[roomId]/actors/[actorId]/route.ts` — PATCH loadout

**Commits / deploy:** `b8b4626` — `origin/cursor/dice-box-combat`

**Como testar:** mesa real → Espiritualista com Golpe de Chi → atacar alvo; mestre escolhe habilidade no token do jogador (sem 403).

---

### 2026-06-20 — Dice-box da mesa alinhado ao preview (cores por tier)

**Pedido:** combate na mesa mostrava d20 escuro genérico (`Dice3DCSS`/fallback), diferente do preview com slots coloridos separados (ataque por tier + dano vermelho).

**Passo a passo:**
1. **Diagnóstico** — `main` ainda usa `DiceMiniature`; na branch dice-box, import npm quebrava workers/assets; faltavam bordas, labels e glow por tier do preview.
2. **Decisão** — carregar o **mesmo bundle** do preview (`/vendor/dice-box/`), estilizar slots com `--dice-tier-color` e labels “Ataque d20 · Jogador” / “Dano d8”.
3. **Implementação** — `DiceCombatPanel` via vendor; `DICE_TIER_LABELS` + bordas em `dice-combat-box.ts`; CSS slots com glow; legenda “Rolando ataque…” discreta.
4. **Validação** — `npm run build` ✅

**Arquivos tocados:**
- `components/vtt/DiceCombatPanel.tsx` — vendor + slots tier/dano
- `lib/vtt/dice-combat-box.ts` — labels e bordas por tier
- `components/vtt/vtt.css` — painel e slots como preview
- `components/vtt/CombatFxLayer.tsx` — legenda de rolagem

**Commits / deploy:** `1095931` — `origin/cursor/dice-box-combat` (PR pendente merge → `main`)

**Como testar:** deploy branch → `/mesa/[roomId]` combate vs `/preview-combate-dados.html` (mesmas cores: azul jogador, amarelo monstro, vermelho dano).

### 2026-06-20 — Reduz delay de dados + fix WebGL idle + preview transições redesenhado

**Pedido:** (1) Dado fica rolando o tempo todo — precisa girar e parar no número tirado. (2) Muito delay entre atacar e o dado aparecer. (3) Prévia de animações de modo ficou feia — recriar com visual de qualidade.

**Passo a passo:**
1. **Diagnóstico dado girando** — `DiceWebGL` iniciava com `mode: "rolling"` hardcoded; quando `sides` muda (nova fórmula), componente remonta e reinicia em rolling. D12 usava `vertsPerFace=3` mas dodecaedro tem faces pentagonais = 9 verts cada.
2. **Fix DiceWebGL** — modo inicial `rolling ? "rolling" : "idle"`; modo `"idle"` com rotação lenta decorativa (× 0.003 vs 0.055); D12 `vertsPerFace=9`; type union inclui `"idle"`.
3. **Diagnóstico delay** — `DiceMiniature`: `webGLOk` inicia `null` via `useState(null)` e só é resolvido depois de um `useEffect` → primeiro render monta div vazia, DiceWebGL só aparece no segundo render. `DiceCombatPanel`: `waitMs(120)` hardcoded antes de inicializar o dice-box; bundle `/vendor/dice-box/dice-box.es.min.js` é importado dinamicamente só quando o primeiro ataque dispara.
4. **Fix delay** — `DiceMiniature`: lazy initializer `useState(() => typeof window === "undefined" ? null : supportsWebGL())` elimina re-render extra em navegação CSR; `useEffect` permanece como fallback SSR mas só roda se `null`. `DiceCombatPanel`: removido `waitMs(120)` e `waitMs(80)` dos `ensure*Box`; adicionado `useEffect([], void loadDiceBox)` que pré-carrega o módulo no mount do painel antes de qualquer ataque.
5. **Transition lock** — `COMBAT_MODE_TRANSITION_LOCK_MS` separado de `DURATION_MS`; UI libera em 400ms, animação CSS segue até 2300ms.
6. **Preview animações** — redesenhado com estética de códex arcano: fundo `#08080e`, título em Georgia dourado, seções com ◆, cards com número em Courier New, preview 192px com ambient gradient por animação, labels com bloom multi-camada; 16 animações CSS preservadas (C1–C8 + A1–A8).
7. **Validação** — `npm run build` ✅ (a executar)

**Arquivos tocados:**
- `components/vtt/DiceWebGL.tsx` — modo `"idle"`, initial mode closure, D12 vertsPerFace=9
- `components/vtt/DiceMiniature.tsx` — webGLOk lazy init, useEffect condicional
- `components/vtt/DiceCombatPanel.tsx` — remove waitMs, pré-carrega dice-box no mount
- `hooks/vtt/useCombatModeTransition.ts` — lock 400ms, animação 2300ms

**Commits / deploy:** pendente local.

**Como testar:** Mesa → combate → atacar — dado deve aparecer sem delay visível (< 50ms extra); dado de dano rola e para no número; fora do combate dado gira lentamente; D12 com faces corretas; UI interativa 400ms após transição modo combate/aventura.

---

### 2026-06-20 — Ficha DDB: XP compacto no header + botão de level-up piscando

**Pedido:** remover a barra gigante de “Progressão de nível” (duplicava o XP do header); manter só o indicador ao lado do nível; botão “Subir de nível” no header, piscando quando pronto.

**Passo a passo:**
1. **Diagnóstico** — `LevelUpWizard` renderizava `sheet-ddb-progression` com barra + botão largo; header já tinha nível + `400/100` + barra fina.
2. **Decisão** — `LevelUpWizard` com `variant="compact"`: só botão + modal; botão visível apenas quando `canLevelUp`.
3. **Implementação** — botão no `sheet-ddb-header__meta`; animação `sheet-level-up-pulse`; bloco `progression` removido de `SheetPopupDdbView`.
4. **Validação** — `npm run build` ✅

**Arquivos tocados:**
- `components/character/LevelUpWizard.tsx` — variant compact + modal extraído
- `components/character/SheetPopupDdbView.tsx` — prop `levelUp` no header
- `components/character/CharacterSheet.tsx` — `variant="compact"`
- `components/character/sheet-ddb.css` — botão header + pulse

**Commits / deploy:** pendente push branch `cursor/dice-box-combat`

**Como testar:** ficha popup DDB com XP ≥ threshold (ex. 400/100 nv1) → botão verde “Subir nv 2” piscando ao lado do XP; sem caixa verde no meio.

---

### 2026-06-21 — Merge `cursor/dice-box-combat` → main (dice-box + mesa rápida)

**Pedido:** mergear PR #3, deploy Contabo e checklist de validação pós-deploy.

**Entregas (branch → main @ `e90d38b`):**
- Dice-box 3D no combate (cores por tier, fila FX, pending ≤300 ms)
- Sync incremental (delta GET/SSE, journal de revisions)
- Store particionada da mesa (`MesaSyncProvider`, slices chat/mapa/combate)
- Shell Foundry extraído + `BattlefieldMapCanvas` / fila FX
- Fix re-render do mapa em sync só-chat (`e5f97e6`)
- `sync:data` — IDs monstros PT-BR canônicos (`e90d38b`)

**Commits / deploy:** `e90d38b` → **`main`** (push 2026-06-21) · imagem `ghcr.io/maulxd/mxdrpg:sha-e90d38b` · workflow build-image #284

**Como testar (grupo 2–3 jogadores, www.mxdrpg.com.br):**

| # | Cenário | Passa se… |
|---|---------|-----------|
| A1 | Primeiro ataque | Dado visível ≤ 300 ms do clique |
| A2 | Ataque acerto | HP no mapa ≤ 1 s após POST |
| A4 | 3 ataques seguidos | FX enfileirados |
| A5 | Mover token | Token na célula ≤ 200 ms |
| A7 | Jogador B vê A | ≤ 2 s |
| Chat | Mensagens/dados no chat | **Mapa não trava** (fix slice) |

```bash
curl -s https://www.mxdrpg.com.br/api/health   # buildSha=e90d38b, db=true
# Se buildSha antigo:
kubectl -n raul set image deployment/mxdrpg mxdrpg=ghcr.io/maulxd/mxdrpg:sha-e90d38b
kubectl -n raul rollout status deployment/mxdrpg
```

---

### 2026-06-28 — Design: EventEmitter SSE, Amethyst Dusk, micro-interactions, transition/dock + bug monstro

**Pedido:** "Continue" da sessão anterior (performance VTT) + relato de que dano de monstro não é computado.

**Passo a passo:**

1. **EventEmitter SSE** — criado `lib/room/notifier.ts` com `EventEmitter`; `persistRoom` em `registry.ts` emite `"room-updated"`; rota `app/api/room/[roomId]/events/route.ts` escuta e envia revisões via SSE, eliminando polling e debounce do cliente.
2. **Accent Amethyst Dusk** — `#6B9E8C` → `#8B7BB8` em 19 arquivos CSS; texto base `#c4bbaa` → `#d4ccbe`; `font-weight: 500` no body; hardcoded rgba convertido para `color-mix()`.
3. **Micro-interactions** — spinner overlay no `TokenActionPanel`; fade-in nas abas `mesa-rail-panel`; ripple de clique no canvas (`BattlefieldMapCanvas`).
4. **Transition + Dock** — `SiteShell` refatorado com fade site→VTT; `MesaIconBar` abrindo dock no clique esquerdo e popup menu no direito.
5. **Bug: dano de monstro** — análise estática completa do fluxo `resolveMonsterAttack` → `executeRoomAttack` → `patchTokenVitals` → `persistRoom` → `syncLinkedTokens` → SSE. O código aparentemente está correto: `resolveMonsterAttack` calcula dano, o handler atualiza token (L277-282) e actor (L302-319), `persistRoom` persiste, e o delta captura a diferença. **Não foi identificada causa raiz definitiva.** Suspeitas:
   - Condição de corrida no SSE (notificação chega antes do `recordRevisionEntry`)
   - PA insuficiente do monstro (`canAttackTarget` falha com "PA insuficiente" no servidor)
   - Erro silencioso em `canActOnCombatTurn` para monstros fora de iniciativa
   - Bug no frontend ao aplicar delta (`useRoomSync.ts`)

**Arquivos tocados:**
- `lib/room/notifier.ts` — NOVO: EventEmitter + notificação SSE
- `app/api/room/[roomId]/events/route.ts` — NOVA: rota SSE
- `lib/room/internal/registry.ts` — `persistRoom` emite `"room-updated"`
- `app/globals.css` — Amethyst Dusk + peso 500 + `color-mix()`
- `components/vtt/foundry/SiteShell.tsx` — transição fade
- `components/vtt/foundry/MesaIconBar.tsx` — dock esquerdo/popup direito
- `components/vtt/panels/TokenActionPanel.tsx` — spinner
- `components/vtt/panels/rail/mesa-rail-panel.css` — fade-in
- `components/vtt/BattlefieldMapCanvas.tsx` — ripple
- +16 arquivos CSS com substituição de cor

**Commits / deploy:** `91caf4e` (EventEmitter) · `4934b09` (Amethyst Dusk) · `bc2fb67` (micro-interactions) · `b2b35e1` (transition+dock). Push pendente junto com correção do bug do monstro.

**Como testar (design):**
- Abrir VTT → verificar cor roxa `#8B7BB8` em botões, links, acentos
- Atacar → spinner aparece no `TokenActionPanel` durante resolução
- Clicar ícone na `MesaIconBar` → dock abre; botão direito → popup menu
- Navegar site→VTT → fade suave

**Bug monstro — como reproduzir:**
1. Criar sala com monstro e PC
2. Iniciar combate, dar PA ao monstro
3. Atacar PC com o monstro
4. Observar: chat mostra "acerta N dano" mas HP do PC não reduz

---

### 2026-07-24 — O Um Anel: extração de regras + Fase 2 (personagem mínimo)

**Pedido:** extrair 100% das regras de criação de personagem do PDF "The One Ring 2e Core Rules" (Culturas, Vocações, Perícias, Proficiências de Combate, Armas/Armaduras) e, em paralelo ("faça ambos se puder"), implementar a Fase 2 do plano aprovado (`peaceful-puzzling-hopper.md`): tipo de ficha, wizard de criação e ficha de visualização do Um Anel — corrigindo também o bug em que uma mesa "tor" abria o wizard/ficha do Eldarin.

**Extração (livros/um-anel/):**
- `00-glossario-termos.md` — glossário PT-BR construído do zero (não reaproveita a terminologia 1e dos livros já traduzidos por Mateus Soares — mecanicamente incompatível com a 2e).
- `03-aventureiros.md` / `04-caracteristicas.md` — já extraídos em rodada anterior, usados como fonte dos números abaixo.
- `12-o-mundo-eriador.md` / `13-apendice-patronos-e-ficha.md` — Cap.9 (Eriador/Bree) + Apêndice A (Patronos, Landmarks) + layout oficial da Ficha de Personagem (p.239) e do Journey Log (p.240), campo por campo.

**Engenharia (Fase 2 — personagem mínimo, zero regressão no Eldarin):**
1. `lib/character/types.ts` — extraído `BaseCharacterFields` (id/ownerId/adventureId/nome/retrato...); `CharacterSheet` passa a estendê-lo e ganha discriminante opcional `system?: RpgSystemId` (default `"eldarin"` em `normalizeCharacter`).
2. `lib/character/um-anel/{types,data,rules,normalize,wizard-types,build-from-wizard}.ts` — `TorCharacterSheet` completo (Cultura, Vocação, 3 Atributos+TN, 18 Perícias, 4 Proficiências de Combate, Resistência/Esperança/Aparar/Carga, Sombra/Fadiga/Condições, Valor/Sabedoria/Recompensas/Virtudes, Equipamento de Guerra); dados reais das 6 Culturas e 6 Vocações (atributos, perícias base, bônus de Cultura, traços distintivos, armas/armaduras/escudos); fórmula de NA (`20 − Atributo`) e derivados por Cultura.
3. **Storage isolado, tabela própria** — `um_anel_characters` (schema + `scripts/db/migrations/019_um_anel_characters.sql`), `lib/db/um-anel-characters.ts` + `lib/character/um-anel/{registry,characters}.ts`: descartada a ideia inicial de reaproveitar `eldarin_characters` (arriscava fichas TOR contaminarem a listagem/normalize do Eldarin já que o `normalizeCharacter` eldarin não sabe ler atributos de outro formato).
4. `app/api/tor-characters/route.ts` (POST) — espelha `app/api/characters/route.ts`.
5. `components/character/wizard/TorCharacterCreationWizard.tsx` — casco reaproveitado do CSS/padrão do wizard Eldarin (`wizard.css`, `WizardProgress`), 8 passos próprios (Conceito → Cultura → Atributos → Vocação → Combate → Traços → Dádivas → Revisão).
6. `components/character/sheet/TorCharacterSheetView.tsx` — ficha de leitura própria (CSS dedicado `tor-sheet.css`).
7. **Dispatch por `rpgSystemId`** em 3 pontos, sem branch dentro do código Eldarin: `/personagem/[id]` (prefixo de id `tor-` vs `pc-`), `/aventura/[id]/personagem/novo` (via `adventure.rpgSystemId`), popup de criação na mesa (`rpgSystemId` propagado `mesa/[roomId]/page.tsx` → `MesaWorkspace` → `MesaFoundryFloatingWindows` → `MesaCharacterWizardPopup`).

**Escopo explicitamente fora desta fase:** personagem Um Anel ainda não vira `RoomActor`/token na mesa (isso é Fase 4 — combate); ao criar pela mesa, abre a ficha em nova aba em vez de popup na mesa.

**Verificação:**
- `tsc --noEmit` limpo.
- Teste de lógica pura (`tsx` temporário, script descartado) cobrindo `buildTorCharacterFromWizard`/`normalizeTorCharacter`/`attributeTN` para Hobbit e Ranger (bônus de atributo condicional) + integridade das 6 Culturas/6 Vocações — todas as asserções passaram.
- Teste E2E via Puppeteer (Chrome local, `ELDARIN_DISABLE_DB=1`): login → criar mesa "O Um Anel" → wizard completo (8 passos, validação bloqueando passo incompleto corretamente) → submit. A chamada `POST /api/tor-characters` falhou com 400 nesse modo específico — rastreado até `materializeSessionUser` (variante que lança, não a "safe") lançando `DATABASE_URL não configurada`; confirmado que `POST /api/characters` (Eldarin) usa a **mesma** função e falharia da mesma forma nesse modo — não é regressão, é limitação pré-existente do modo sem banco para rotas de criação de personagem (não coberta antes). Fluxo completo requer MariaDB real (`npm run local`, indisponível neste ambiente por falta de Docker).

**Pendente para a próxima sessão:** validar a criação ponta-a-ponta contra um MariaDB real; Fase 3 (compêndio) e Fase 4 (combate/token na mesa) do plano; tradução PT-BR do conteúdo já extraído em `livros/um-anel/*.md`.

---

### 2026-07-24 (cont.) — Remoção completa da mesa demo + correção de nome "Espada & Arcano"→D&D

**Pedido:** "cada tipo de RPG tem que ter seu VTT, sua mesa, fichas separados... remova a mesa demo, cada um que quiser testar crie a sua, se achar algo de mesa demo no site, remova!" — e, à parte, reverter o placeholder "Espada & Arcano" de volta para "Dungeons & Dragons" (decisão informada do usuário, ciente do risco de marca registrada da Wizards of the Coast).

**Pesquisa prévia (workflow com 3 agentes paralelos):** mapeamento completo confirmou que "demo" não era um recurso isolado — estava hard-coded em ~50 arquivos em 4 camadas: bypass de autenticação (>15 pontos com `roomId === "demo"` liberando ações sem login/dono), dado semeado (`DEMO_CHARACTERS`/`DEMO_SCENE` reaproveitados como infraestrutura geral — não só da demo), pontos de entrada de UI (7 CTAs), e scripts/docs de QA.

**Correção do nome do sistema:** `lib/rpg/systems.ts` — `RpgSystemId` volta a ter `"dnd"` (era `"arcane"` desde o commit `1cb4420` de 18/06, que renomeou por precaução de marca registrada); `name`/`shortName`/`coverAlt` voltam a "Dungeons & Dragons"/"D&D"; assets `dnd-cover.png/svg` já existiam no repo. `normalizeRpgSystemId` mantém compat reversa (`"arcane"` → `"dnd"`).

**Remoção da mesa demo — por camada:**
1. **Núcleo (risco alto, tratado à mão, não deletado):** `lib/room/internal/registry.ts` (`shouldPersistToDb`, criação automática de sala demo, `refreshDemoActorsIfStale` — ~100 linhas), `lib/adventure/store.ts` (`ensureDemoAdventure` e sua injeção forçada em toda listagem de mesas — o ponto de maior impacto pra "a demo aparecer pra todo mundo"), `lib/room/sync.ts` (`createDemoRoom`), `lib/character/character-registry.ts` (parou de usar `DEMO_CHARACTERS` como seed-base do registro em memória), `lib/character/adventure-bind.ts` (`!bound ? adventureId === "demo" : ...` → `false` — essa era a convenção que fazia fichas avulsas serem editáveis; ajustado junto em `CharacterSheet.tsx`/`app/personagem/[id]/page.tsx` pra usar `roomId` genuinamente opcional com `useRoomSync(..., {disabled: true})` em vez de fingir uma sala "demo").
2. **Bypasses de autenticação:** removidos de `lib/auth/{room-access,room-access-server,combat-turn-access,adventure-room-access,presence-access}.ts`, `lib/room/handlers/{combat-gm,gm-actor-progress,gm-saving-throw,culinary-meal}.ts`, e 6 rotas `app/api/room/[roomId]/...` — cada um era um `if (roomId === "demo")` adicional antes da checagem normal de dono/membro, que permanece intacta.
3. **Componentes de UI da mesa:** `Battlefield.tsx`, `MesaWorkspace.tsx`, `ActiveCharactersPanel.tsx`, `EndTurnBar.tsx`, `MesaVisitorNotice.tsx` (prop `isDemo` removida), `app/mesa/[roomId]/page.tsx`.
4. **Arquivos deletados** (após checar/limpar todos os consumidores): `lib/character/demo-characters.ts`, `lib/vtt/demo-scene.ts` (template de grid/cellSize extraído pra `DEFAULT_SCENE_TEMPLATE` em `lib/room/adventure-room.ts` antes de apagar), `lib/room/demo-character-sync.ts`, `components/vtt/DemoGuidedTour.tsx` + `lib/vtt/demo-guided-tour.ts` (guards mortos removidos de `MesaGuidedTour.tsx`/`VttMapGuideCluster.tsx` — CSS `.demo-guided-tour__*` **mantido**, é reaproveitado pelo tour real), `lib/auth/demo-users.ts`, `docs/DEMO-GUIADO.md`, `scripts/db/purge-users-except-demo.mjs` + entrada `db:purge-users` do `package.json`.
5. **Login "Demo Mestre"/"Demo Jogador"** (decisão à parte, confirmada explicitamente pelo usuário — "remover tudo junto"): botões removidos de `LoginForm.tsx`, seção "Contas demo" removida de `app/entrar/page.tsx`, `authenticateDemo` (dead code) removido de `user-store.ts`, `data/users/registry.seed.json` esvaziado (`[]`).
6. **CTAs de UI** removidos de `app/page.tsx`, `app/mesa/page.tsx`, `app/sistema/page.tsx` (4º passo do guia repontado pro hub de mesas em vez de deletado, preservando "Quatro etapas"), `app/mesas/page.tsx` (+ CSS morto), `SiteFooter.tsx`, `PortalShell.tsx`, `AdventureLobby.tsx`.
7. **Docs vivos** atualizados: `CLAUDE-PROJETO.md`, `COMBATE-MESA.md`, `CLAUDE-CODIGO-SEGURO.md`, `PERSISTENCIA.md`, `API-SALA.md`, `POSTGRES.md`, `P0-NEON-SETUP.md`, `A1-NEON-SMOKE.md`, `P8-PILOTO-TOKEN.md`, `HOMOLOG.md`. Docs de fase histórica (P2/P9/PRD/UX-MESA-E-RAIL/PARIDADE-FOUNDRY/ELDARIN-SITE-JOGAVEL, que também citam a demo) foram **deixados intactos** — são registro histórico de quando cada fase foi construída, mesma convenção do changelog.

**Débito técnico sinalizado (não corrigido nesta sessão):**
- 6 scripts em `scripts/smoke/*.mjs` (`combat-core`, `inventory-request-flow`, `level-up-pa-sync`, `p9-inventory-five-steps`, `pa-combat-spend`, `pa-turn-flow`) dependiam funcionalmente da sala/login demo via HTTP — vão quebrar (404/401) até serem reescritos pra criar uma aventura/mesa real + conta real antes de rodar.
- `data/homolog/mesa-local.seed.json` (fixture de teste local MariaDB, não relacionado à sala demo mas com o mesmo `ownerId: usr_demo_mestre`) precisa de uma conta real cadastrada antes de continuar funcionando — anotado em `docs/HOMOLOG.md`.

**Verificação:** `tsc --noEmit` limpo após cada etapa (núcleo, auth, UI, deleções, login, docs); grep final em todo `app/lib/components/scripts/data` por `"demo"`/`usr_demo` não encontrou nenhuma referência restante em código (só nos 6 smoke scripts sinalizados acima e nos docs históricos).

---

### 2026-07-24 (cont.) — O Um Anel: mesa jogável em modo narrado (sem combate tático)

**Pedido:** "deixe a mesa pronta pra pelo menos jogar narrado" — sem grid tático/tokens, mas com ficha visível na mesa, rolagem de dados do sistema e ajuste de recursos (Resistência/Esperança/Sombra) durante a sessão.

**Pesquisa prévia (2 workflows paralelos, ver journal.jsonl em subagents/workflows/wf_2386aff6-074 e wf_88647256-008):** mecânica exata de resolução (Dado de Proeza d12 + Dados de Sucesso d6, extraída de `livros/um-anel/02-resolucao-de-acoes.md` linha a linha) e mapeamento de risco de duas integrações possíveis com a mesa (RoomActor como union vs. painel/API totalmente separados) — confirmado que `RoomActor` tem acoplamento profundo (226 acessos a `identity`/`attributes`/`resources` em 48 arquivos do motor Eldarin), então a fase foi implementada com painel e storage 100% isolados, sem tocar `RoomActor`/`Battlefield.tsx`.

**Engenharia:**
1. `lib/character/um-anel/dice.ts` — motor de resolução: Feat Die (1-10 numérico, 11=Olho de Sauron=0, 12=Runa de Gandalf=sucesso automático), Dados de Sucesso somam valor de face (6 conta como "ícone de sucesso" pro grau), Favorecida/Desfavorecida (2 dados de proeza, cancelam se ambas se aplicam), Cansado zera dados de sucesso 1-3, Deplorável vira falha automática no Olho de Sauron. Testado com script de lógica pura (20k rolagens, distribuição de faces ~1/12 cada, todas as regras de cancelamento/auto-sucesso/auto-falha validadas).
2. `lib/character/um-anel/normalize.ts` — Cansado (`Resistência ≤ Carga`) e Deplorável (`Sombra ≥ Esperança atual`) passam a ser **derivados automaticamente**, não mais um toggle manual — evita ficha desatualizada.
3. `lib/character/um-anel/characters.ts` — `listTorCharactersForAdventure` (fan-out por todos os membros da aventura, espelha `lib/room/adventure-actors.ts::resolvedParticipantIds`) e `patchTorCharacterResources` (dono da ficha ou mestre da aventura podem ajustar Resistência/Esperança/Sombra/Fadiga/Ferido/Tesouro/Companhia, com clamps).
4. `app/api/tor-characters/route.ts` (GET por `adventureId`, checa membership) e `app/api/tor-characters/[id]/route.ts` (novo — GET individual + PATCH de recursos).
5. `TorCharacterSheetView` ganhou modo `interactive` (opt-in via prop — a página solo `/personagem/[id]` continua só-leitura): botão "Rolar" por Perícia/Proficiência de Combate, steppers +/- pra Resistência/Esperança/Sombra/Fadiga/Tesouro, toggle de Ferido.
6. `TorPlayableCharactersPanel.tsx` (lista os aventureiros da aventura) e `TorCharacterSheetPopup.tsx` (ficha interativa em janela — busca/PATCH via as rotas acima, posta resultado de rolagem no chat via `postRoomChat` já existente, **sem** criar um novo `kind` de mensagem nem tocar no motor de dados 3D do Eldarin).
7. Duas janelas novas registradas em `lib/vtt/foundry-window-placement.ts`/`hooks/vtt/useFoundryWindows.ts` (`torParty`, `torFicha`) — renderizadas em `MesaFoundryFloatingWindows.tsx` só quando `rpgSystemId === "um-anel"`; `MesaWorkspace.tsx` ganhou `openTorSheet`/`closeTorSheet` espelhando `openSheet`/`closeSheet` do Eldarin. Criar personagem pela mesa agora abre a ficha no popup próprio (antes abria em aba nova).

**Fora de escopo (proposital):** combate tático, tokens no mapa, iniciativa — nada disso foi tocado; a mesa do Um Anel continua sem grid, adequada só pra jogo narrado/theater-of-mind.

**Verificação:** `tsc --noEmit` limpo; teste de lógica pura do motor de dados (12 grupos de asserção, 0 falhas); smoke test via Puppeteer confirmou que a mesa carrega sem erro de página com o novo painel presente (o único 500 observado foi o mesmo problema pré-existente de `materializeSessionUser` em modo sem banco, já documentado na entrada anterior — não uma regressão nova).

---

### 2026-07-24 (cont.) — Correção da criação de personagem + tooltips + compêndio/mundo por sistema (commit `c8b0ed2`)

**Pedido:** usuário reportou erro em produção (`Table 'mxdrpg.um_anel_characters' doesn't exist` — resolvido via migração rodada pelo administrador de infra do usuário) e que "a criação de personagem tá meio fraca, tá bem diferente a ficha"; também pediu tooltips em tudo (classes/vocações, armas, perícias) e reforçou que compêndio/mundo precisam ser separados por sistema (MXDRPG é hub, não só Eldarin).

**Passo a passo:**
1. Diagnóstico — o wizard nunca coletava arma/armadura/elmo/escudo iniciais: toda ficha nascia com `warGear: []` e `armour` vazia, por isso a ficha parecia "fraca" comparada à ficha completa esperada.
2. Adicionado passo **"Equipamento"** ao wizard (`TorCharacterCreationWizard.tsx`, 8→9 passos): grades de escolha por Proficiência de Combate (`weaponsForProficiency`), armadura/elmo/escudo (`ARMOURS`/`HELM`/`shieldsForCulture`), respeitando restrições de Cultura (Anões sem grande arco/lança/escudo, Hobbits só com armas pequenas).
3. Tooltips nativos (`title`) em nomes de Perícia, Proficiência de Combate e linhas de Equipamento de Guerra na ficha e no wizard, via `WizardHoverTip` já existente.
4. `/compendios` e `/mundo` reescritos para despachar por `?sistema=` (`RpgSystemContentTabs` novo, reaproveitável) — `TorCompendiumPage`/`TorWorldLore` novos, conteúdo curado de Eriador (Condado, Bri, Lago Evendim etc.) só aparecem quando `sistema=um-anel`; Eldarin continua como estava.

**Verificação:** `tsc --noEmit` + `npm run build` limpos antes do push (CSS import faltante de `tor-compendium.css` pego a tempo pelo build, não pelo tsc).

**Commits:** `c8b0ed2`.

---

### 2026-07-24 (cont.) — Ficha do Um Anel: reconciliação de termos PT-BR + redesign visual pergaminho/tinta vermelha

**Pedido:** usuário subiu a ficha editável oficial (fã-tradução PT-BR) do Um Anel como referência e pediu "veja o que precisa pra fazer uma ficha bonita e funcional" no mesmo estilo visual.

**Passo a passo:**
1. Comparação da ficha de referência com o glossário próprio (`livros/um-anel/00-glossario-termos.md`) revelou termos divergentes — decisão: adotar os termos da ficha oficial onde os dois glossários conflitavam (é a referência que o usuário quer replicar). Trocados **apenas labels visíveis** (`data.ts`, mensagens de validação do wizard, glossário) — ids internos (`argucia`, `imponencia` etc.) não mudaram, zero risco de migração de dados: Argúcia→Astúcia, Aparar→Bloqueio, Vocação→Chamado, Cansado→Exausto, Deplorável→Arrasado, e 9 nomes de Perícia (Imponência→Fascínio, Percepção→Vigilância, Caça→Caçada, Canto→Música, Encorajar→Indução, Viajar→Viagem, Perspicácia→Discernimento, Vasculhar→Busca, Explorar→Exploração, Saber→História).
2. Descoberto que `app/globals.css` já reserva tokens `--content-bg`/`--content-bg-elevated`/`--content-border`/`--content-ink` explicitamentente pra "pergaminho, fichas, compêndio" — nunca usados em nenhum componente. `TorCharacterSheetView`/`tor-sheet.css` reescritos pra usá-los: folha clara com tinta vermelha (`--tor-red: #7a1e1e`) sempre, independente do tema escuro do resto do site (igual um PDF impresso sobre uma mesa escura).
3. Layout reorganizado mais perto do original: cabeçalho com regra dupla, bênção da Cultura + Caminho da Sombra logo abaixo do nome, 3 colunas de Atributo com selo em losango (valor do Atributo) + NA, Perícias com **losangos de graduação** (`RatingPips`, até 6 losangos preenchidos + "+N" se exceder) em vez de número cru — Perícia/Proficiência Favorecida ganha destaque (fundo rosado + losangos com glow).
4. Verificação visual: HTML estático espelhando a marcação real + `tor-sheet.css` real, screenshot via Puppeteer/Chrome local (padrão já usado na sessão) — confirmado visualmente antes de finalizar; puppeteer-core removido depois (`git status` limpo em package.json/lock).

**Arquivos tocados:** `components/character/sheet/{TorCharacterSheetView.tsx,tor-sheet.css}` (reescrita), `lib/character/um-anel/{data,types,normalize,dice,wizard-types}.ts`, `components/character/wizard/TorCharacterCreationWizard.tsx`, `components/compendium/TorCompendiumPage.tsx`, `app/aventura/[adventureId]/personagem/novo/page.tsx`, `livros/um-anel/00-glossario-termos.md`.

**Verificação:** `tsc --noEmit` limpo, `npm run build` limpo, screenshot conferido visualmente.

---

### 2026-07-25 — O Um Anel: Fase 4, combate tático no mapa (v1)

**Pedido:** usuário confirmou querer "tudo do Um Anel" — a última peça faltante pro sistema ser jogável de ponta a ponta era combate tático (tokens no mapa hex existente, resolução de ataque com a matemática do livro), que ainda não existia (só a mesa narrada sem grid, da sessão anterior).

**Pesquisa/plano prévio:** Explore agent + leitura direta de código confirmaram que não existe nenhum ponto de dispatch por sistema no pipeline tático (`RoomActor`/`BattleToken`/motor de ataque/iniciativa são um único tipo "gordo" 100% Eldarin). Decisão de arquitetura (validada por um Plan agent + leitura direta): `BattleToken` ganha `torCombat?: TorCombatTokenFields` opcional — um "bag" leve no mesmo espírito de `gmCreatureStats` (criaturas de mestre sem ficha completa), em vez de unionizar `RoomActor`/`CharacterSheet` (custaria dezenas de callsites em `lib/combat/attack.ts` sem ganho, já que o resto do pipeline — canvas, `CombatTrack` — já é agnóstico o bastante). Plano salvo em `C:\Users\Raul\.claude\plans\peaceful-puzzling-hopper.md`.

**Risco de segurança identificado e neutralizado (não era só polimento):** `canOpenActionRing`/`onActionRingRequest` em `Battlefield.tsx` não checavam sistema — `listTokenCombatActions` cai em `[UNARMED]` pra qualquer token sem `actor`/`gmCreationId`/`monsterEntryId` (exatamente a forma de um token do Um Anel). Sem gate, o anel de ação **Eldarin** abriria num token do Um Anel e rodaria `resolveTokenAttack` (d20 vs `defesa`) errado. Corrigido no ponto de renderização do ring: `selected.torCombat ? <TorAttackPopup> : <TokenActionRing>` — tratado como bloqueante da mesma sub-fase em que tokens do Um Anel passam a existir no mapa, não deixado pra depois.

**Engenharia (mecânica RAW extraída de `livros/um-anel/06-fases-de-aventura-combate.md` e `08-mestre-e-adversarios.md`):**
1. `lib/character/um-anel/{adversary-types,adversaries}.ts` — 4 Adversários de exemplo (Soldado Orc, Cacique Orc, Warg, Grande Troll das Cavernas) com Nível de Atributo/Vigor/Ódio/Bloqueio/Proteção/Habilidades Sinistras (texto, não mecanizadas no v1).
2. `lib/vtt/types.ts` — `BattleToken.torCombat?` (kind hero/adversary, parry, protectionDice, strength/attributeLevel, wounded, eliminated, actions[] pra adversário).
3. `lib/vtt/tor-player-token.ts` / `lib/character/um-anel/adversary-token.ts` — adapters `TorCharacterSheet`/`TorAdversaryStats` → `BattleToken` (PA fixado em 999 — Um Anel não tem orçamento de PA de movimento, e sem isso o token trava no mapa via `checkCanSpendPa`).
4. `lib/room/handlers/tor-tokens.ts` + 2 rotas novas (`tokens/place-tor-character`, `tokens/spawn-tor-adversary`) — colocar herói/invocar adversário, espelhando `placeRoomActorOnCell`/`spawnRoomMonster` sem editá-los.
5. `lib/combat/um-anel/resolve-attack.ts` (puro) — TN = `20-Força+Bloqueio do alvo` (herói atacando) ou `Bloqueio do alvo` puro (adversário atacando); Golpe Perfurante em Proeza 10 ou Runa (`numeric===10` cobre os dois, já codificado em `dice.ts`); teste de Proteção; tabela de Severidade da Ferida (Moderado/Grave+dias/Gravíssimo); adversário eliminado em qualquer Ferida. Testado com 6 cenários do livro via script descartável (18 asserções, `Math.random` mockado) — não commitado.
6. `lib/combat/um-anel/vitals.ts` — aplica resultado direto em `vida`/`defeated`/`torCombat`, **nunca** via `patchTokenVitals` (injeta condição Eldarin `"inconsciente"` + contador de morte de 10 rodadas que não existem no livro).
7. `lib/room/handlers/tor-combat-attack.ts` + branch de 1 linha em `app/api/room/[roomId]/combat/attack/route.ts` (`room.rpgSystemId === "um-anel" ? executeRoomTorAttack : executeRoomAttack`) — sincroniza Resistência/Ferida de volta pra `um_anel_characters` via `patchTorCharacterResources` (ganhou campo `injury` novo).
8. `components/vtt/TorAttackPopup.tsx` — escolher arma/ação + alvo, mostra resultado formatado no chat.
9. `TurnOrderPanel.tsx` — esconde "Rolar iniciativa" (Um Anel usa ordem por colocação no mapa, já suportado sem código novo via `applyMapPlacementCombatOrder`).

**Verificação:** `tsc --noEmit` + `npm run build` limpos a cada sub-fase. Regressão Eldarin testada **de ponta a ponta com um smoke test real** (não só análise estática): `ELDARIN_DISABLE_DB=1 npm run dev` + Puppeteer/Chrome local — criou conta, criou mesa Eldarin, invocou 2 Goblins, confirmou visualmente que o `TokenActionRing` original abre normalmente (não `TorAttackPopup`) num token sem `torCombat`, ativou modo Combate, e resolveu um ataque de verdade via API (`Goblin 1 acerta Goblin 2: 12 vs CA 12`, d20+CA+dano 1d6 intactos) — zero erros de página em toda a sessão. Ambiente de teste limpo depois (puppeteer-core desinstalado, scripts/screenshots descartados, dev server encerrado).

**Fora de escopo (deferido pra v1.1, documentado no plano — não omitido em silêncio):** Posturas de Combate (Forward/Open/Defensive/Rearward) e suas Tarefas de Combate, Dano Especial completo (Golpe Pesado/Aparar/Perfurar/Investida de Escudo), Recuo, regras de Engajamento por contagem (v1 é "levemente posicional" — qualquer token ataca qualquer outro no mapa), bestiário arrastável (v1 usa lista simples com botão "Invocar" dentro do painel de personagens).

**Arquivos tocados:** ver lista completa no plano; novos principais — `lib/character/um-anel/{adversary-types,adversaries,adversary-token}.ts`, `lib/combat/um-anel/{resolve-attack,vitals}.ts`, `lib/room/handlers/{tor-tokens,tor-combat-attack}.ts`, `lib/vtt/tor-player-token.ts`, `components/vtt/TorAttackPopup.tsx`, 2 rotas de API novas; editados — `lib/vtt/types.ts`, `lib/room/store.ts`, `app/api/room/[roomId]/combat/attack/route.ts`, `components/vtt/{Battlefield,MesaWorkspace,TurnOrderPanel,TorPlayableCharactersPanel}.tsx`, `components/vtt/mesa/{MesaBattlefieldStage,MesaFoundryFloatingWindows}.tsx`, `hooks/useRoomSync.ts`, `lib/character/um-anel/{characters,rules,types}.ts`.

---

### 2026-07-25 (cont.) — Bestiário completo (21 adversários) + Tesouro Mágico do Um Anel

**Pedido:** usuário apontou que os 4 adversários da Fase 4 eram só amostra ("isso era o básico") e pediu extração completa do bestiário e dos itens do livro, reforçando que a mesa do Um Anel não pode puxar nada do Eldarin.

**Passo a passo:**
1. Releitura integral de `livros/um-anel/08-mestre-e-adversarios.md` (~1780 linhas) pra cobrir as seções ainda não extraídas: Homens Maus (5), Orcs (7, incluindo os 2 já feitos), Trolls (4, incluindo o já feito), Mortos-Vivos (3), Lobos Selvagens (2, incluindo o já feito) e Lobisomens (1) — total 21 adversários únicos em `lib/character/um-anel/adversaries.ts` (era 4).
2. Extraído também o capítulo de Tesouro (`lib/character/um-anel/{treasure-types,treasure}.ts`, novo): tabela de Tesouros (Menor/Maior/Maravilhoso), 20 Recompensas Encantadas (qualidades mágicas de Armas/Armaduras Famosas — Ajuste Ancestral, Afiado Superior, Extermínio de Inimigos, Armadura de Mithril etc.), 6 categorias de Bênçãos (36 combinações Perícia+tipo de item pra Artefatos Maravilhosos/Itens Prodigiosos), 9 Itens Amaldiçoados (Maldição da Fraqueza, Escurecer, Caçado, Má Sorte, Mau Presságio, Malícia, Possuído, Mancha da Sombra, Enfraquecimento). Ficou de fora deliberadamente: geração procedural de Objetos Preciosos (tabelas de Forma/Material) e o sistema de "Olho de Mordor"/Caçada (mecânica de campanha separada, não é bestiário nem item) — não pedidos, não mecanizados.
3. `TorCompendiumPage.tsx` ganhou 3 seções novas (Tesouro, Bênçãos, Recompensas Encantadas, Itens Amaldiçoados) lendo os arrays acima — mesmo padrão das seções existentes, sem tocar em `CompendiumPackId`/compêndio Eldarin.
4. Verificação explícita de isolamento (pedido reforçado do usuário): `grep` em todo `lib/character/um-anel/`, `lib/combat/um-anel/` e componentes TOR por imports de `lib/vtt/monsters`, `monstros.json`, `lib/compendium/*`, `lib/combat/attack.ts` — zero ocorrências (o único import de fora é `BaseCharacterFields` de `lib/character/types.ts`, os ~7 campos genéricos compartilhados por design desde a Fase 2, não conteúdo de jogo do Eldarin).
5. Bug reportado separadamente pelo usuário e corrigido de passagem: painel de Convite (`RoomInvitePanel`) tinha `aspect-ratio: 1` forçando quadrado + `justify-content: center` em `.mesa-panel-scroll--invite`/`.foundry-window--invite .foundry-window__body` — com conteúdo mais alto que o quadrado, a centralização cortava/sobrepunha o topo (bug clássico de flexbox "overflow + center"). Corrigido: removido o `aspect-ratio`, `justify-content` trocado pra `flex-start` + `overflow-y: auto` no body da janela. Não relacionado à Fase 4 (pré-existente).

**Deferido (não investigado ainda):** ícone de dado pequeno não aparece no chat pra rolagens (`1d10 → 1`) — vive em `DiceBoxMini`/`combat-dice-model.ts`/`dice-combat-box.ts`, um sistema de dados 3D (WebGL) via lib vendor, completamente separado do trabalho desta sessão. Reportado pelo usuário, não investigado a fundo ainda (provável falha de asset/render específica de d10 na lib 3D, não confirmado).

**Verificação:** `tsc --noEmit` + `npm run build` limpos.

**Arquivos tocados:** `lib/character/um-anel/adversaries.ts` (4→21 entradas), `lib/character/um-anel/{treasure-types,treasure}.ts` (novos), `components/compendium/{TorCompendiumPage.tsx,tor-compendium.css}`, `components/vtt/vtt.css` (fix painel de convite).

---

### 2026-07-25 (cont.) — Compêndio dentro da mesa (painel "Compêndio" no rail, Eldarin + Um Anel)

**Pedido:** usuário reportou "compêndio não funcional pros jogadores verem o que precisarem dos personagens" — na prática, "não acho o menu"/"não carrega" dentro da mesa.

**Diagnóstico:** `/compendios` (página avulsa) sempre funcionou sem trava de acesso. O problema real: existe desde antes desta sessão um componente `components/vtt/MesaCompendiumPanel.tsx` (wrapper de `CompendiumBrowser` pro rail da mesa), mas ele ficava pendurado num rail antigo (`MesaSideRail.tsx`) que não é mais renderizado em lugar nenhum — sobrou órfão quando a mesa foi redesenhada pro layout "Foundry" atual (`MesaFoundryDockRail`/`MesaFoundryFloatingWindows`). Ou seja: o acesso ao compêndio *de dentro da mesa* foi derrubado silenciosamente numa refatoração anterior, pro Eldarin e pro Um Anel igual — não é bug desta sessão, mas a causa raiz da reclamação.

**Correção:**
1. Novo ícone "Compêndio" no rail (`MesaRailIcon.tsx`/`MesaIconBar.tsx`), sempre visível (jogador e mestre, sem gate de `showGm`).
2. Novo `MesaWindowId` `"compendium"` (`foundry-window-placement.ts`/`useFoundryWindows.ts`, dockável e flutuante — clique normal abre no rail, clique direito abre janela).
3. Conteúdo despachado por `rpgSystemId` em `MesaFoundryDockRail.tsx` e `MesaFoundryFloatingWindows.tsx`: Um Anel → `TorCompendiumPage` direto (zero dependência de servidor, já é só dado estático); Eldarin → `MesaEldarinCompendiumPanel.tsx` (novo) buscando `/api/compendium?roomId=...` (nova rota, novo) — reaproveita `getVisiblePacks`/`getPackEntries` já existentes, mas calcula `isRoomGm` **por sala** (`canManageRoom`) em vez de só o papel global, porque o pacote "monstros" só aparece pro mestre daquela mesa especificamente (mesma regra da página avulsa).
4. Verificado que isso não reabre a porta pro Um Anel puxar dado do Eldarin: o branch é `rpgSystemId === "um-anel" ? <TorCompendiumPage/> : <MesaEldarinCompendiumPanel/>` — cada um só importa o próprio lado.

**Verificação:** `tsc --noEmit` + `npm run build` limpos.

**Arquivos tocados:** novos — `app/api/compendium/route.ts`, `components/vtt/MesaEldarinCompendiumPanel.tsx`; editados — `components/vtt/foundry/{MesaRailIcon,MesaIconBar}.tsx`, `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`, `components/vtt/MesaWorkspace.tsx`, `hooks/vtt/useFoundryWindows.ts`, `lib/vtt/foundry-window-placement.ts`.

---

### 2026-07-25 (cont.) — Mais 4 capítulos do livro extraídos: Virtudes Culturais, Empreitadas, Patronos, Coisas Sem Nome

**Pedido:** usuário confirmou querer a extração de "tudo que sobrou do livro" pro compêndio.

**Passo a passo:**
1. Releitura de `05-valor-e-sabedoria.md` — Recompensas/Virtudes genéricas já estavam 100% capturadas (`STARTING_REWARDS`/`STARTING_VIRTUES`, 6+6). O que faltava: **36 Virtudes Culturais** (6 por Cultura, escolhidas a partir de Sabedoria 2) — novo `lib/character/um-anel/cultural-virtues.ts`.
2. `07-fases-de-companhia-jornada.md` — 9 Empreitadas da Fase de Companhia (Reunir Boatos, Curar Cicatrizes, Encontrar Patrono etc., algumas só-Yule, algumas grátis por Chamado) + tabela de custo em XP — novo `lib/character/um-anel/undertakings.ts`.
3. `13-apendice-patronos-e-ficha.md` — 6 Patronos (Balin, Bilbo, Círdan, Gandalf, Gilraen, Tom Bombadil/Baga de Ouro, cada um com bônus de Companhia + vantagem nomeada) — novo `lib/character/um-anel/patrons.ts`. Também o gerador de "Coisas Sem Nome" (adversário único procedural — 8 tabelas de Dado de Proeza/Sucesso) — novo `lib/character/um-anel/nameless-things.ts`. **Não** extraído: a seção "Landmarks"/"The Star of the Mist" (uma mini-aventura específica, não é catálogo de sistema) e o Índice alfabético (nota do próprio livro dizendo que não tem regra nova).
4. `TorCompendiumPage.tsx` ganhou 4 seções novas (Virtudes Culturais, Coisas Sem Nome, Empreitadas da Fase de Companhia, Patronos) lendo os arrays acima.
5. **Achado importante durante a releitura de `10-rivendell.md` (ainda não extraído):** o capítulo tem uma **7ª Cultura jogável completa** (Altos-Elfos de Valfenda, com atributos/perícias/proficiências/traços/virtudes próprios) que não existe no sistema, mais PNJs notáveis (Elrond, Arwen, Elladan/Elrohir, Erestor, Glorfindel) com stat blocks. `11-personagens-exemplo.md` tem 8 pré-prontos (Drogo Bolseiro, Esmeralda Took, Lobelia Sacola-Luva, Paladin Took II, Primula Brandebuque, Rorimac Brandebuque, Balin, Bilbo). Nenhum dos dois foi extraído ainda nesta entrada — fica pra próxima, porque uma 7ª Cultura mexe em `TorCultureId` (tipo usado no wizard/normalize/rules), risco maior que as adições puramente aditivas de compêndio feitas até aqui.

**Verificação:** `tsc --noEmit` + `npm run build` limpos.

**Arquivos tocados:** novos — `lib/character/um-anel/{cultural-virtues,undertakings,patrons,nameless-things}.ts`; editado — `components/compendium/TorCompendiumPage.tsx`.

---

### 2026-07-25 (cont.) — 7ª Cultura jogável (Altos-Elfos de Valfenda) + PNJs notáveis + Elrond como Patrono

**Pedido:** continuação de "puxe tudo que sobrou do livro" — chegou a vez de `10-rivendell.md`, que tinha ficado marcado como pendente na entrada anterior por envolver risco maior (nova Cultura mexe em `TorCultureId`, tipo usado no wizard/normalize/rules).

**Verificação de risco antes de mexer:** `grep` confirmou que só existe UMA especialização por Cultura em todo o código (`cultureId === "anoes"`, redução de Carga de armadura, em `rules.ts`) — nem o wizard (mapeia `CULTURES` genericamente), nem `normalize.ts` têm qualquer lógica hardcoded pra Cultura específica. Adicionar uma 7ª Cultura era, portanto, uma mudança aditiva de baixo risco, confirmada por `tsc --noEmit` limpo (nenhum switch exaustivo quebrou) logo depois de editar `TorCultureId`.

**Passo a passo:**
1. `TorCultureId` ganhou `"altos-elfos-de-valfenda"`; nova entrada em `CULTURES` (`data.ts`) com todos os campos do livro — Bênção Cultural (Sábio-Élfico: sucesso Mágico gastando Esperança se não Arrasado + 1 ponto extra de Atributo), traço extra (Marcado pelo Pesar: só remove Sombra em Yule), Padrão de Vida Próspero, 6 conjuntos de Atributos, perícias-base, e as mesmas 8 opções de Traço Distintivo do livro (todas já existiam no sistema — Belo, Olhos de Lince, Nobre, Curioso, Jovial, Orgulhoso, Sutil, Obstinado).
2. 4 Virtudes Culturais próprias (Artífice de Eregion, Beleza das Estrelas, Poder dos Primogênitos, Habilidade dos Eldar) em `cultural-virtues.ts` — mais uma 5ª habilidade de Conselho que o livro descreve na mesma seção sem nome próprio claro, anexada como parágrafo extra em vez de inventar um nome. O livro diz que Altos-Elfos **também** escolhem da lista dos Elfos de Lindon — em vez de duplicar as 6 entradas, `TOR_CULTURAL_VIRTUES_BY_CULTURE["altos-elfos-de-valfenda"]` concatena as duas listas na leitura.
3. Elrond adicionado como **7º Patrono** em `patrons.ts` (é o único PNJ do capítulo com tabela formal de Patrono no livro — Nível de Companhia +1, vantagem "Maior dos Mestres do Saber").
4. Os outros PNJs notáveis do capítulo (Arwen, Elladan e Elrohir, Erestor, Glorfindel) — sem tabela de Patrono, só descrição — foram pra um tipo novo e mais simples, `lib/character/um-anel/notable-npcs.ts`.
5. `TorCompendiumPage.tsx`: seção "Culturas" e "Virtudes Culturais" já eram genéricas (mapeiam `CULTURES`) — passaram a mostrar a 7ª Cultura sem nenhuma edição além de trocar o filtro raso por `TOR_CULTURAL_VIRTUES_BY_CULTURE` (pra herdar as virtudes dos Elfos de Lindon corretamente). Nova seção "PNJs Notáveis de Valfenda".

**Deferido:** `11-personagens-exemplo.md` (8 pré-prontos: Drogo Bolseiro, Esmeralda Took, Lobelia Sacola-Luva, Paladin Took II, Primula Brandebuque, Rorimac Brandebuque, Balin, Bilbo) e o "Landmarks"/"Star of the Mist" — ambos ficam pra uma próxima passada.

**Verificação:** `tsc --noEmit` + `npm run build` limpos (confirmando que nenhuma lógica de Cultura hardcoded quebrou em lugar nenhum do wizard/normalize/rules).

**Arquivos tocados:** novo — `lib/character/um-anel/notable-npcs.ts`; editados — `lib/character/um-anel/{types,data,patrons,cultural-virtues}.ts`, `components/compendium/TorCompendiumPage.tsx`.

---

### 2026-07-25 (cont.) — Upload de retrato/token pra fichas do Um Anel + 8 Personagens Pré-Gerados do Starter Set

**Pedido:** "cria ai, e bota opção de subir imagem do personagem + token" — as duas tarefas deixadas pendentes na entrada anterior.

**Upload de retrato/token (Um Anel não tinha, só Eldarin tinha):**
1. `TorResourcePatch` (`lib/character/um-anel/types.ts`) ganhou os 5 campos de retrato (`portraitUrl`, `tokenImageUrl`, `portraitFocus`, `coverFocus`, `tokenFocus` — todos já existem em `BaseCharacterFields`, só faltava o patch aceitar); `patchTorCharacterResources` (`characters.ts`) passou a aplicá-los no merge, junto dos campos de recurso já existentes. Zero migração de banco — a ficha inteira é um blob JSON (`um_anel_characters.data`), então os campos novos persistem sozinhos.
2. Novo par de funções em `lib/character/portrait-persist-client.ts` — `persistPortraitBundleToTorCharacter`/`clearPortraitOnTorCharacter` — espelham as versões Eldarin, mas batem em `/api/tor-characters/[id]` (rota que já existia, só passou a aceitar esses campos a mais no corpo do PATCH).
3. `TorCharacterSheetView.tsx` ganhou um cabeçalho com retrato (reaproveita `SheetPopupPortrait` — mesmo componente do Eldarin, no modo `onPersistBundle` sob medida, sem precisar estender o union fechado `mode: "room"|"character"` de `PortraitEditorFields`). Novo prop `canEditPortrait`. Como o componente Eldarin herda um clip-path de brasão (`components/vtt/eldarin-v4.css`, carregado global no layout), a ficha do Um Anel sobrescreve pra um quadro liso em `tor-sheet.css` (`.tor-sheet__masthead-portrait ...`) — sem vazar visual do Eldarin pra ficha do Um Anel.
4. Ligado em dois lugares: popup da mesa (`TorCharacterSheetPopup.tsx`, sempre `canEditPortrait` — igual ao padrão já existente dos steppers de recurso, que confiam na checagem de permissão do servidor `isOwner || isGm`) e na página avulsa `/personagem/[id]` (`canEditPortrait = torCharacter.ownerId === session.user.id`, já que essa página não tem conceito de mestre de sala fora de uma mesa). Spawn de token no mapa (`lib/vtt/tor-player-token.ts`) já lia `tokenImageUrl` da ficha desde a Fase 4 — o retrato novo chega automaticamente no token, sem tocar nesse arquivo.

**8 Personagens Pré-Gerados (`livros/um-anel/11-personagens-exemplo.md`):**
- Novo `lib/character/um-anel/pregens.ts` — Drogo Bolseiro, Esmeralda Took, Lobelia Bracegirdle, Paladin Took II, Primula Brandybuck, Rorimac Brandybuck, Balin filho de Fundin, Bilbo Bolseiro. Cada um com atributos, as 18 perícias, proficiências de combate, recompensas/virtudes, equipamento de guerra/armadura/escudo, equipamento de viagem, citação e histórico — tudo traduzido pro PT-BR, reaproveitando ids já existentes de `DISTINCTIVE_FEATURE_BY_ID`/`STARTING_VIRTUES`/Virtudes Culturais em vez de duplicar texto (ex.: Balin usa as mesmas Virtudes Culturais Anãs já extraídas — "Escuro pra Trabalho Escuro", "Caminho de Durin" — e Bilbo usa as mesmas de Hobbit — "Bravo no Aperto", "Certeiro no Alvo").
- **Decisão consciente de não tornar isso fichas 100% jogáveis via assistente:** o PDF do Starter Set não tem Vocação/Caminho da Sombra/Padrão de Vida (campos só do Livro Básico, obrigatórios em `TorCharacterSheet`) — inventar esses valores seria fabricar conteúdo que o livro não define. Por isso os 8 viraram referência de compêndio (nova seção "Personagens Pré-Gerados (Starter Set)" em `TorCompendiumPage.tsx`), não registros de `TorCharacterSheet` gerados por `createTorCharacterFromWizard`.
- **Discrepância do próprio material-fonte, não repetida:** o markdown de extração já sinalizava que os NAs de Atributo impressos nas 8 fichas seguem `NA = 18 − Atributo`, enquanto `attributeTN()` (usado no resto do sistema) é `NA = 20 − Atributo`. Os NAs exibidos no compêndio são sempre calculados ao vivo com `attributeTN()`, não copiados do PDF — consistência interna do sistema priorizada sobre uma discrepância não resolvida da fonte.
- Nomes de família Took/Brandybuck/Bracegirdle/Sackville mantidos em inglês (só "Baggins→Bolseiro" traduzido, por ser tradução oficial brasileira de alta confiança e já usada em `patrons.ts` pro próprio Bilbo) — evita arriscar uma grafia oficial incerta pros sobrenomes menos comuns.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Smoke test com Chrome real via `puppeteer-core` (instalado com `--no-save`, desinstalado depois — `git status` confirmou `package.json`/`package-lock.json` sem diff): `/compendios?sistema=um-anel` renderizou a seção "Personagens Pré-Gerados (Starter Set)" com os 8 cards esperados, sem erros de console. O fluxo completo de upload de retrato (registrar usuário → criar personagem → subir imagem) não pôde ser testado ponta a ponta neste sandbox — o MariaDB local do `.env.local` não estava de pé (`ECONNREFUSED 127.0.0.1:3306`), e a resolução de conta (`fetchUserByIdStrict`) exige banco real mesmo com `ELDARIN_DISABLE_DB=1` (comportamento pré-existente do app, não desta sessão). Recomendado um teste manual do upload numa ficha real assim que o banco de dev estiver acessível.

**Arquivos tocados:** novo — `lib/character/um-anel/pregens.ts`; editados — `lib/character/um-anel/{types,characters}.ts`, `lib/character/portrait-persist-client.ts`, `components/character/sheet/{TorCharacterSheetView.tsx,tor-sheet.css}`, `components/vtt/TorCharacterSheetPopup.tsx`, `app/personagem/[id]/page.tsx`, `components/compendium/TorCompendiumPage.tsx`.

---

### 2026-07-25 (cont.) — Marcos (Landmarks) + Coisas Sem Nome completo + compêndio do Um Anel reorganizado em abas (sidebar), igual ao Eldarin

**Pedido:** "próximo passo?" seguido de "compendium do eldarin ta todo dividido e bem bonito, deixe assim também o de senhor dos anéis" — o compêndio do Um Anel era uma única página com ~19 seções empilhadas em rolagem contínua, sem a navegação lateral por categorias que o Eldarin já tem.

**Investigação paralela (agente em background, concluída, correção ainda não aplicada):** bug relatado anteriormente ("dado pequeno não aparece no chat") — causa raiz confirmada: todo roll do Um Anel (`TorCharacterSheetPopup.tsx`, `tor-combat-attack.ts`) posta no chat com `kind: "chat"` (texto pré-formatado), nunca `kind: "roll"` com um `message.roll = {formula, rolls, total}`. O gate que monta o `DiceBoxMini` em `RoomChat.tsx` exige exatamente `kind==="roll" && message.roll` — então o componente de dado nunca é montado pro Um Anel (não é bug de CSS/tamanho, é ausência total de instanciação). Causa estrutural: o dado do Um Anel (Dado de Proeza d12 com faces Olho/Runa + N Dados de Sucesso d6) não tem representação no formato `NdM` que o parser genérico (`lib/dice/roll.ts`) entende, e o schema `ChatMessage.combat` também é todo desenhado pro Eldarin (`attackerTokenId`, `defenderAc` etc.). Corrigir exige desenhar uma representação de dado própria do Um Anel — deferido pra uma próxima sessão (não é mudança pequena).

**Lacunas encontradas na extração de "Coisas Sem Nome" (capítulo já extraído antes, mas incompleto):** ao reler `13-apendice-patronos-e-ficha.md` pra pegar Marcos, notei que as Tabelas 3 (No Primeiro Encontro), 4 (Um Boato) e 5 (Onde É Lembrada) do gerador de Coisas Sem Nome nunca tinham sido extraídas (só as Tabelas 1-2 e 6-8 existiam). Completadas agora em `nameless-things.ts` (`TOR_NAMELESS_BEFORE_SEEN`, `TOR_NAMELESS_FIRST_SEEN`, `TOR_NAMELESS_RUMOURS`, `TOR_NAMELESS_LORE_SOURCES`) e exibidas no compêndio — o gerador agora está 100% completo (8 tabelas, não mais 5).

**Marcos (novo, `lib/character/um-anel/landmarks.ts`):** a estrutura de 6 partes que todo Marco publicado segue (Nome/Boato/Antecedentes/Mapa/Locais/Tramas e Problemas), mais o Marco de exemplo completo do livro, "A Estrela na Bruma" (Boato, Saber Antigo, Antecedentes, Locais, e as 3 tramas — Bandidos, Anões Traiçoeiros, Encurralados). A adversária única do Marco, Elwen a Espectra Funesta, virou uma entrada de verdade em `adversaries.ts` (tier `"boss"`, com Habilidades Sinistras próprias) em vez de só texto solto — assim ela também pode ser invocada na mesa como qualquer outro adversário, e o compêndio faz join direto com `TOR_ADVERSARY_BY_ID` pra mostrar o stat block dela junto do Marco.

**Reorganização visual do compêndio (`TorCompendiumPage.tsx`):** a página virou Client Component com navegação lateral (reaproveitando `OrnamentCard` + as classes `comp-shell`/`comp-sidebar`/`comp-pack-list`/`comp-main` já existentes em `compendium.css`, o mesmo CSS que o Eldarin usa — zero CSS novo pro "esqueleto" da navegação). As ~19 seções foram agrupadas em 6 categorias (mesma contagem do Eldarin): Personagem, Equipamento, Adversários, Tesouro, Companhia & Mundo, Personagens Prontos — cada categoria mostra suas seções internas normalmente, só a troca entre categorias é que é client-side (sem rota nova, ao contrário do Eldarin que tem `/compendios/[packId]`).

**Bug real encontrado e corrigido no caminho — BOM (byte-order-mark) em `compendium.css`:** ao verificar visualmente com Puppeteer + Chrome local, a barra lateral apareceu ocupando a largura inteira (grid quebrado, `display` computado como `block` em vez de `grid`). Investigação via CSSOM mostrou que o arquivo `compendium.css` começa com 3 bytes de BOM UTF-8 (`EF BB BF`) antes do primeiro seletor — o Turbopack preserva esse caractere invisível dentro do texto do primeiro seletor da regra, corrompendo `.comp-shell` (que é literalmente a primeira regra do arquivo) o suficiente pra o navegador não reconhecer o seletor. Esse bug já existia antes desta sessão; só não tinha aparecido porque no bundle do Eldarin outro CSS entra antes na concatenação (o BOM cai no meio do texto, inofensivo), enquanto no bundle novo do Um Anel `compendium.css` acabou sendo o primeiro arquivo — expondo o defeito latente. Corrigido removendo os 3 bytes do BOM (`git diff` confirma: só a invisível marca some, nenhum conteúdo visível muda) — conserta os dois sistemas.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Teste visual de ponta a ponta com `puppeteer-core` (instalado `--no-save`, desinstalado depois, `git status` limpo em `package.json`/`package-lock.json`) contra um `npm run dev` real: screenshot da categoria "Personagem" confirma sidebar estreita (220px) + grid de conteúdo ao lado, igual ao Eldarin; clique em cada uma das 6 categorias funcionou sem erro de console; categoria "Companhia & Mundo" confirmada mostrando Empreitadas, Patronos, PNJs Notáveis e a nova seção Marcos (estrutura de 6 partes + Estrela na Bruma) corretamente. Os únicos erros de console foram 401 de rotas que exigem sessão (esperado, página acessada sem login).

**Arquivos tocados:** novos — `lib/character/um-anel/landmarks.ts`; editados — `lib/character/um-anel/{nameless-things,adversaries}.ts`, `components/compendium/{TorCompendiumPage.tsx,compendium.css}`.

---

### 2026-07-25 (cont.) — Ícone de dado no chat do Um Anel + painel "Personagens jogáveis" mostrando Eldarin numa mesa de Um Anel

**Dado no chat, correção aplicada (antes só diagnosticada):** a causa raiz já tinha sido confirmada antes (todo roll do Um Anel posta `kind:"chat"`, o gate do `DiceBoxMini` em `RoomChat.tsx` exigia `kind==="roll"`). Corrigido sem tocar no formato rico de texto do Um Anel (que é bem mais descritivo que o "1d20+5 → 23" genérico do Eldarin):
1. `lib/character/um-anel/dice.ts` ganhou `featDiePhysicalFace`/`featDieRollPayload` — converte o resultado do Dado de Proeza (Olho/Runa/número) na face física do d12 (Olho→11, Runa→12, número→ele mesmo) pro visual do dado, sem mexer no valor de jogo (`numeric`, que já zera o Olho e conta a Runa como 10).
2. `TorCharacterSheetView.tsx`/`TorCharacterSheetPopup.tsx`: `onRoll` agora também carrega o payload do dado; `postRoomChat` ganhou um campo `torFeatDie` novo.
3. `app/api/room/[roomId]/chat/route.ts`: quando `torFeatDie` vem no corpo, anexa `roll:{formula:"1d12", rolls:[valor], total:valor}` numa mensagem que continua `kind:"chat"` (o servidor só repassa o valor já calculado no cliente — **não** re-rola como faz pro Eldarin, que usa `rollDice(formula)` server-side; mesmo nível de confiança que o chat livre já tinha, não é uma regressão de segurança nova).
4. `RoomChat.tsx`: o gate do dado mudou de `kind==="roll" && message.roll` pra só `message.roll` (qualquer kind) — quando `kind==="chat"`, mostra o texto completo do Um Anel do lado do dado; quando `kind==="roll"` (Eldarin), continua mostrando só fórmula/total como antes. Zero mudança de comportamento pro Eldarin.
5. `lib/room/handlers/tor-combat-attack.ts`: o ataque tático também anexa o dado (Dado de Proeza do ataque) na mensagem de combate.

**Bug novo reportado pelo usuário durante teste ao vivo — "a ficha não aparece no painel da esquerda":** print mostrando uma ficha do Um Anel aberta ("ER", Bardo/Mensageiro) mas o painel "Personagens jogáveis" da lateral dizendo "Nenhum personagem de jogador nesta aventura ainda". Causa raiz: o painel dock "ficha" em `MesaFoundryDockRail.tsx` renderizava `<PlayableCharactersPanel>` (Eldarin) **sem checar `rpgSystemId`** — igual ao bug do compêndio corrigido antes nesta sessão, só que dessa vez no painel de personagens, e só no modo dock (clique esquerdo); no modo flutuante (clique direito) o Um Anel tinha uma janela **paralela e não-relacionada**, `"torParty"`, que abria certo mas nunca foi exposta em nenhum ícone do rail — ficava sempre aberta por padrão (`DEFAULT_OPEN`/`DEFAULT_FLOATING` em `useFoundryWindows.ts`) só pra mesas do Um Anel, uma segunda janela flutuando sem controle nenhum do usuário.

**Correção:** unificado no padrão já validado pelo compêndio — **uma única janela `"ficha"`**, dockável ou flutuante, com o conteúdo despachado por `rpgSystemId` nos dois arquivos (`MesaFoundryDockRail.tsx` e `MesaFoundryFloatingWindows.tsx`): `rpgSystemId === "um-anel" ? <TorPlayableCharactersPanel/> : <PlayableCharactersPanel/>`. A janela `"torParty"` (duplicada, sem ícone de acesso, sempre aberta por padrão) foi removida por completo — `MesaWindowId`, `DEFAULT_LAYOUTS`, `DEFAULT_OPEN`, `DEFAULT_FLOATING` (`lib/vtt/foundry-window-placement.ts`/`hooks/vtt/useFoundryWindows.ts`) e o bloco JSX correspondente.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Teste ao vivo (login + banco real) não foi feito neste sandbox — mesmo bloqueio já registrado antes (MariaDB local do `.env.local` inacessível). Pedido ao usuário reproduzir num refresh da mesa afetada.

**Arquivos tocados:** editados — `lib/character/um-anel/dice.ts`, `components/character/sheet/TorCharacterSheetView.tsx`, `components/vtt/{TorCharacterSheetPopup,RoomChat}.tsx`, `hooks/useRoomSync.ts`, `app/api/room/[roomId]/chat/route.ts`, `lib/room/handlers/tor-combat-attack.ts`, `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`, `hooks/vtt/useFoundryWindows.ts`, `lib/vtt/foundry-window-placement.ts`.

---

### 2026-07-25 (cont.) — PRD da mesa do Um Anel, páginas do hub deixam de falar só de Eldarin, PA vazando pra tokens do Um Anel

**Pedido:** "commita e ajuste, faça uma revisão do código, do hub, ajuste as páginas do hub que fala que é sobre eldarin, sendo que o MXDRPG é um HUB (...) o action ring pra o que entra dentro do sistema" — quatro pedidos numa mensagem: (1) commitar o trabalho pendente, (2) revisão de código do hub, (3) corrigir páginas do hub que se apresentam como só-Eldarin, (4) confirmar que o anel de ação/sistema de magias da mesa do Um Anel não vaza conceito do Eldarin. Também pediu um PRD da mesa do Um Anel (pedido em mensagem anterior).

**PRD:** novo `docs/PRD-MESA-UM-ANEL.md`, mesmo formato do `PRD-ELDARIN-VTT.md` — registro de decisões arquiteturais (sem PA, motor de dado próprio, `torCombat` como bag no token, isolamento de hub), Epics 1-7 (o que já está pronto) e Epic 8 (backlog v1.1: Posturas de Combate, Dano Especial, Recuo, Engajamento por contagem, Jornada), mais uma tabela de rastreio dos bugs de vazamento cruzado já corrigidos.

**Investigação do anel de ação / sistema de magias (conclusão: já estava correto):** conferido que `Battlefield.tsx` já teria de fato o gate certo — `canOpenActionRing`/`onActionRingRequest` checam `token.torCombat` antes de decidir entre `TorAttackPopup` (Um Anel) e `TokenActionRing` (Eldarin, com `SpellPickerPanel`/`AbilityPickerPanel`). Como `TokenActionRing` é o único lugar que consegue abrir os pickers de magia/habilidade, e ele nunca é renderizado quando `token.torCombat` existe, o sistema de magias do Eldarin **nunca** aparece numa mesa do Um Anel — que, aliás, não tem sistema de magias no livro (o mais próximo, Feitiçaria, é só narrativo/arbitrado pelo Mestre, não uma lista de feitiços selecionável). `TorAttackPopup` já era, e continua sendo, só arma + alvo, sem nenhuma opção de magia. Nenhuma mudança necessária aqui — o que faltava (Habilidades Sinistras de adversário como ação selecionável) já estava documentado como backlog no Epic 8 do PRD.

**Páginas do hub corrigidas (paravam de reconhecer que o MXDRPG serve dois sistemas):**
1. `app/page.tsx` (home): texto do hero citava "pontos de ação" como se fosse universal — trocado por copy neutra ("cada sistema de RPG com sua própria ficha e suas próprias regras de combate"), acrescentado um par de chips linkando os dois sistemas (`RPG_SYSTEMS`) logo abaixo do CTA, e a prévia SVG (que mostra "ATAQUE d20"/PA — só faz sentido pro Eldarin) ganhou uma legenda honesta ("Exemplo: combate tático do sistema Eldarin") em vez de ser apresentada como *a* experiência do hub. Card "Grid tático" também parou de citar "PA automático".
2. `app/manifest.ts` (descrição do PWA instalável): "combate em grid, Pontos de Ação, fichas e compêndios Eldarin v4" → texto neutro citando os dois sistemas.
3. `app/layout.tsx` (meta description raiz, usada como fallback SEO em toda página): mesma correção.
4. `app/sistema/page.tsx` ("Como jogar", item de navegação do topo): era 100% conteúdo do Eldarin (h1 "Como jogar no Eldarin VTT", passos, cards da mesa e roadmap todos citando PA/CA), sem nenhuma versão pro Um Anel. Reescrito no mesmo padrão já usado em `/compendios` e `/mundo` — `RpgSystemContentTabs` no topo + branch por `?sistema=` — com conteúdo próprio do Um Anel (Cultura/Vocação, Dado de Proeza, sem Pontos de Ação, bestiário/Marcos/Coisas Sem Nome no lugar do bestiário/magias do Eldarin). `lib/site-metadata.ts` ganhou a entrada que faltava pro título da aba de `/rpg/um-anel`.

**Revisão de código do hub — achado real (corrigido, não só cosmético):** pedi uma revisão focada em achar outras instâncias do mesmo padrão de bug já corrigido nesta sessão (componente compartilhado sem checar `rpgSystemId`/`torCombat`). Achado mais sério: `lib/combat/exploration-pa.ts` (`applyExplorationPaDisplayToToken`/`previewExplorationPaTokens`, chamadas ao alternar Aventura/Combate) sobrescrevia `pa`/`paMax` de **todos** os tokens da sala, sem exceção — inclusive tokens do Um Anel, que dependem de `pa`/`paMax` numa constante alta fixa (`TOR_TOKEN_PA`) só pra não travar `checkCanSpendPa`. Cada vez que o Mestre alternasse o modo da mesa, um token do Um Anel podia ter seu PA resetado pra um valor baixo (regra de recuperação do Eldarin) e ficar travado pra se mover — exatamente o risco #2 já documentado no plano original da Fase 4, que se materializou porque essa função nova (fora do escopo da Fase 4) nunca tinha sido revisada. Corrigido com um early-return em `token.torCombat`. Achados secundários (cosméticos, também corrigidos): `CharacterCombatHud.tsx` mostrava o medidor de PA (`PaHudMeter`) em qualquer token com `pa` definido, incluindo tokens do Um Anel — ganhou o mesmo guard; `GmMesaModeToggle`/`MesaModeIndicator` tinham tooltips fixos citando "PA" — ganharam `rpgSystemId` (`MesaFoundryStageHeader` → `MesaWorkspace`, que já tinha o valor) e texto alternativo pro Um Anel. Checagem programática de BOM em todos os `.css` de `components/vtt`, `components/compendium` e `components/character` (feita pelo agente de revisão): nenhum outro arquivo tem o problema — o BOM do `compendium.css` corrigido antes nesta sessão era isolado.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Teste visual com `puppeteer-core` (instalado `--no-save`, desinstalado depois, `git status` limpo em `package.json`/`package-lock.json`) contra `npm run dev` real: screenshot da home confirma os chips de sistema e a legenda da prévia; `/sistema` e `/sistema?sistema=um-anel` renderizados lado a lado — conteúdo, abas e links corretos nos dois, zero menção a PA/CA/d20 na variante do Um Anel. Console sem erros além dos 401 esperados (chamadas que exigem login). Não foi possível testar a correção do PA-na-troca-de-modo dentro de uma mesa de verdade (exige banco de dados real, indisponível neste sandbox) — recomendado um teste manual: numa mesa do Um Anel com um token no mapa, alternar Aventura↔Combate e confirmar que o token continua se movendo livremente depois.

**Arquivos tocados:** novo — `docs/PRD-MESA-UM-ANEL.md`; editados — `app/{page,layout,manifest,sistema/page}.tsx`, `components/home/home.css`, `lib/site-metadata.ts`, `lib/combat/exploration-pa.ts`, `components/vtt/{CharacterCombatHud,GmMesaModeToggle,MesaWorkspace}.tsx`, `components/vtt/mesa/MesaFoundryStageHeader.tsx`.

---

### 2026-07-25 (cont.) — Resto do HUD/medidor de PA vazando pra tokens do Um Anel

**Pedido:** usuário reportou (bem irritado, com razão) que ainda tinha HUD de PA aparecendo na mesa do Um Anel depois da correção anterior — o fix passado só cobriu `CharacterCombatHud.tsx`, faltavam outros pontos que também desenham o medidor.

**Achados e correção — cada widget de PA ganhou guard `!token.torCombat` no ponto exato de renderização:**
- `components/vtt/MapTokenList.tsx` — a lista "No mapa" (visível na lateral, era exatamente o "8 PA" que apareceu no print do usuário junto de um token).
- `components/vtt/ActiveCharactersPanel.tsx` — mesma lista, variante "Ativos agora".
- `components/vtt/TokenStatusBody.tsx` — modal de status do token, renderizava `<PaHudMeter>` sem nenhum guard (nem checava `canViewTokenPa`).
- `components/vtt/EndTurnConfirmDialog.tsx` — modal de "Passar turno" podia mostrar uma mensagem de "PA guardado" calculada em cima de `token.paMax` (a constante alta do Um Anel), sem sentido pro sistema.
- `components/vtt/Battlefield.tsx` — o fallback de `canViewTokenPaFn` (usado quando a prop não é passada) também ganhou o guard.

**Erro cometido e revertido no caminho — importante registrar:** a primeira tentativa foi um fix central em `lib/auth/combat-turn-access.ts::canViewTokenPa`, fazendo a função retornar `false` sempre que `token.torCombat` existisse. Passou no `tsc`/`build`, mas era **errado**: essa mesma função é usada por `lib/room/snapshot-for-viewer.ts` pra decidir se **zera** `pa`/`paMax` (`redactTokenPa`, seta os dois pra `0`) antes de mandar o snapshot pro cliente — não é só um gate de exibição de UI, é também redação de dado no servidor. Com o fix central, todo token do Um Anel passaria a receber `pa:0/paMax:0` de verdade, o que quebraria a garantia de `TOR_TOKEN_PA` (constante alta pra nunca travar `checkCanSpendPa`) e travaria o movimento de qualquer token do Um Anel assim que a mesa carregasse. Revertido antes de commitar; a correção certa é sempre no **componente que desenha o widget**, nunca na função que decide se o dado cru trafega ou é redigido.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Não testado contra uma mesa real com banco (mesmo bloqueio de sempre — sem MariaDB local neste sandbox). Recomendado ao usuário: abrir uma mesa do Um Anel com token no mapa e conferir que nenhum "PA" aparece em nenhum lugar (lista lateral, modal de status, ao passar turno) — e que o token continua se movendo normalmente.

**Arquivos tocados:** editados — `components/vtt/{MapTokenList,ActiveCharactersPanel,TokenStatusBody,EndTurnConfirmDialog,Battlefield}.tsx`.

---

### 2026-07-26 — Ícone "Invocar" mostrava o bestiário do Eldarin numa mesa do Um Anel

**Pedido:** "por que no TOR ta usando o bestiário de eldarin? me explica" — usuário viu monstros do Eldarin ao clicar em invocar numa mesa do Um Anel.

**Causa raiz:** mesmo padrão de bug já corrigido várias vezes nesta sessão (painel/ícone compartilhado sem checar `rpgSystemId`). O ícone "Invocar" do rail (`MesaIconBar.tsx`) sempre aparecia pra qualquer mestre (`show: showGm`, sem checar sistema), e o painel por trás dele (`MonsterSpawnPanel`, tanto no dock quanto na janela flutuante) é 100% Eldarin — lê `lib/vtt/monsters.ts`/`monstros.json`, nunca `TOR_ADVERSARIES`. O Um Anel já tem sua própria forma de invocar adversário — a seção "Adversários" dentro do painel "Ficha" (`TorPlayableCharactersPanel`, corrigido numa entrada anterior) — só que ninguém tinha reparado que o ícone "Invocar" continuava ali do lado, apontando pro bestiário errado.

**Correção:** ícone "Invocar" escondido pra `rpgSystemId === "um-anel"` (`MesaIconBar.tsx` ganhou prop `rpgSystemId`, repassada por `MesaFoundrySidebar.tsx` → `MesaFoundryDockRail.tsx`, que já tinha o valor). Como defesa extra, o conteúdo do painel "spawn" em si (dock **e** flutuante) também ganhou o mesmo guard — mesmo se alguém reabrir a janela por algum estado antigo salvo, o `MonsterSpawnPanel` não renderiza mais fora do Eldarin.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Não testado contra uma mesa real (mesmo bloqueio de sempre — sem banco neste sandbox).

**Arquivos tocados:** editados — `components/vtt/foundry/{MesaIconBar,MesaFoundrySidebar}.tsx`, `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`.

---

### 2026-07-26 (cont.) — Push pendente + varredura final de PA (achado: guia de ajuda "?" também era só-Eldarin)

**Contexto:** usuário testou em produção e viu tudo igual — porque os últimos 6 commits nunca tinham sido enviados (`git push`), só existiam localmente neste sandbox. Dado push (`ead9834..a428ee3`). Depois pediu confirmação explícita: "tirou o PA de tudo que se trata de TOR? inclusive hud e td mais?" — refeita uma varredura completa em vez de responder de cabeça.

**Reconfirmado (já corrigido em entradas anteriores):** `CharacterCombatHud`, `TokenStatusBody`, `MapTokenList`, `ActiveCharactersPanel` e `EndTurnConfirmDialog` — todos com guard `!token.torCombat` intacto.

**Achado novo:** o botão de ajuda "?" no canto do mapa (`VttHelpButton.tsx`) nunca tinha recebido `rpgSystemId` — guia inteiro hardcoded pro Eldarin (título "Mesa Eldarin", seção inteira "Pontos de Ação (PA) e movimento", "anel de ações (mover, atacar, magia, habilidade)", ícone "Invocar" que nem existe mais no Um Anel). Corrigido com o mesmo padrão de sempre: `rpgSystemId` encadeado por 4 componentes (`Battlefield.tsx` → `BattlefieldMapCanvas.tsx` → `VttMapGuideCluster.tsx` → `VttHelpButton.tsx`, reaproveitando o objeto `mapGuide` já existente) e o conteúdo do guia reescrito com uma versão própria do Um Anel: sem PA, ordem de turno por posição no mapa, popup de ataque (arma+alvo), Dado de Proeza + Sucesso, seção "Adversários" no lugar do ícone "Invocar".

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Não testado contra uma mesa real (mesmo bloqueio de sempre — sem banco neste sandbox).

**Arquivos tocados:** editados — `components/vtt/{Battlefield,VttHelpButton,VttMapGuideCluster}.tsx`, `components/vtt/battlefield/BattlefieldMapCanvas.tsx`.

---

### 2026-07-26 (cont.) — Painel "Invocar" dedicado pro bestiário do Um Anel (era escondido dentro da Ficha)

**Contexto:** usuário viu um monstro Eldarin ("Fênix de Caverna") com PA numa mesa de teste do Um Anel e concluiu (razoavelmente, dado o histórico de bugs desta sessão) que o bestiário do Um Anel não existia de verdade. Confirmado com prova concreta que **existe** — `lib/character/um-anel/adversaries.ts` tem 22 entradas reais, nenhuma chamada "Fênix de Caverna" (esse token era um monstro Eldarin de verdade, colocado na mesa antes do ícone "Invocar" ter sido escondido pro Um Anel numa correção anterior — não um bug novo, só sobra de teste).

Aproveitando o esclarecimento, atendido o pedido de melhorar de verdade a UX: até agora, invocar adversário do Um Anel vivia **escondido** dentro do painel "Ficha" (seção "Adversários", junto da lista de personagens jogáveis) — o ícone dedicado "Invocar" do rail, que o Eldarin sempre teve, tinha sido só **escondido** pro Um Anel na correção anterior, em vez de ganhar conteúdo próprio.

**Refatoração:**
1. Novo `components/vtt/TorAdversaryPanel.tsx` — painel dedicado, busca por nome/traço, cards com nível de atributo/resistência/bloqueio/proteção e badge de tier (Bando/Elite/Chefe), botão Invocar por adversário. Reaproveita `spawnRoomTorAdversary` (já existia) — nenhuma mudança no motor de invocação, só na UI.
2. Ícone "Invocar" volta a aparecer pra mestres do Um Anel (`MesaIconBar.tsx` simplificado — remove a lógica `showSpawn` que escondia); o conteúdo por trás dele agora despacha por `rpgSystemId` (`TorAdversaryPanel` vs `MonsterSpawnPanel` do Eldarin), no mesmo padrão já usado pra "ficha" e "compêndio".
3. Seção "Adversários" removida de dentro de `TorPlayableCharactersPanel.tsx` (evita duplicar a mesma função em dois lugares) — esse painel volta a ser só a lista de personagens jogáveis, como o nome sempre disse.
4. Texto do guia de ajuda "?" ajustado de volta (a versão anterior apontava pra "Ficha → Adversários" porque o ícone estava escondido; agora descreve o ícone "Invocar" dedicado, igual ao Eldarin).

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Teste visual com `puppeteer-core` (instalado/desinstalado, `git status` limpo) confirmou que as classes CSS reaproveitadas (`.comp-search`, `.tor-compendium__tier`) renderizam certo na categoria "Adversários" do compêndio — não achei uma forma de testar o painel `TorAdversaryPanel` dentro de uma mesa de verdade neste sandbox (sem banco de dados), então recomendo ao usuário abrir o ícone "Invocar" numa mesa do Um Anel e confirmar que a lista aparece e o Invocar funciona.

**Arquivos tocados:** novo — `components/vtt/TorAdversaryPanel.tsx`; editados — `components/vtt/TorPlayableCharactersPanel.tsx`, `components/vtt/foundry/{MesaIconBar,MesaFoundrySidebar}.tsx`, `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`, `components/vtt/VttHelpButton.tsx`.

---

### 2026-07-26 (cont.) — Fix "não permite criar ficha" + bestiário ordenado por dificuldade

**Pedido 1:** usuário reportou "não tá permitindo criar ficha" — print mostrava o painel "Personagens Jogáveis" corretamente despachado pro Um Anel (confirma que o fix anterior funcionou), mas **sem nenhum botão** de criar personagem, mesmo dizendo no texto "use 'Novo personagem' pra criar o primeiro".

**Causa raiz:** `TorPlayableCharactersPanel.tsx` nunca teve o botão "+ Criar novo personagem" — ao contrário do painel Eldarin (`PlayableCharactersPanel.tsx`), que sempre teve esse botão (com callback pro wizard em popup, ou link de fallback pra `/aventura/[id]/personagem/novo`). Quando o painel "ficha" mostrava (incorretamente) o painel Eldarin numa mesa do Um Anel, o botão aparecia mas criava personagem Eldarin; depois do fix que despachou corretamente pro painel do Um Anel, sobrou sem nenhum botão — o painel do Um Anel nunca tinha sido construído com essa função.

**Achado extra no caminho:** `app/mesa/[roomId]/page.tsx` calculava `characterSlotsLeft` sempre com `MAX_CHARACTERS_PER_USER` (constante do Eldarin), independente do `rpgSystemId` da sala — corrigido pra usar `MAX_TOR_CHARACTERS_PER_USER` numa mesa do Um Anel.

**Correção:** `TorPlayableCharactersPanel.tsx` ganhou `canCreateCharacter`/`onCreateCharacter` (mesmo formato do painel Eldarin — callback pro wizard em popup, com fallback de `Link` pra página de criação) e o botão "+ Criar novo personagem", encadeado nos dois lugares que renderizam esse painel (`MesaFoundryDockRail.tsx`/`MesaFoundryFloatingWindows.tsx`, reaproveitando `canCreateCharacter`/`onOpenCharacterWizard` que já existiam no escopo).

**Pedido 2:** "coloca a ordem do bestiário pelo nível de dificuldade e força pra melhorar tudo".

**Correção:** `lib/character/um-anel/adversaries.ts` — array bruto renomeado pra `TOR_ADVERSARIES_RAW` (mantém a ordem de extração do livro por categoria, com os comentários originais intactos); o export público `TOR_ADVERSARIES` agora é essa mesma lista **ordenada** por tier (Bando → Elite → Chefe) e, dentro de cada tier, por Nível de Atributo crescente. Como `TOR_ADVERSARY_BY_ID`, `TorAdversaryPanel.tsx` e a seção "Adversários" do compêndio já consomem `TOR_ADVERSARIES` direto (sem assumir uma ordem específica), o novo ordenamento passou a valer em todo lugar automaticamente, sem editar mais nada.

**Verificação:** `tsc --noEmit` + `npm run build` limpos nas duas correções. Ordem final conferida com um script Node descartável (não commitado) — bate com a expectativa (mob nível 2-4, elite 4-8, boss 5-10). Não testado o clique do botão "Criar novo personagem" dentro de uma mesa real (sem banco neste sandbox).

**Arquivos tocados:** editados — `components/vtt/TorPlayableCharactersPanel.tsx`, `components/vtt/mesa/{MesaFoundryDockRail,MesaFoundryFloatingWindows}.tsx`, `app/mesa/[roomId]/page.tsx`, `lib/character/um-anel/adversaries.ts`.

---

### 2026-07-26 (cont.) — Equipamento do compêndio em cards+tooltip; adicionar/remover Equipamento de Guerra na ficha

**Pedido:** usuário pediu (a) separar cada arma/armadura do compêndio com tooltip em vez de tabela, e (b) mestre e jogador poderem "importar o item pra mesa". Pesquisei primeiro como o Eldarin resolve um pedido parecido (arrastar personagem pro mapa, adicionar item do compêndio no inventário, retrato no assistente) pra reaproveitar os mesmos padrões em vez de inventar do zero — essa pesquisa também orienta os próximos itens da lista (arrastar e retrato no wizard).

**Achado:** no Eldarin, "importar item" não é um drag-and-drop pro mapa — é um botão + modal na própria ficha (`CharacterSheet.tsx::addFromCompendium`), que adiciona ao `inventory` do personagem. O Um Anel não tem essa infraestrutura pra `warGear`/`armour` (só é setado uma vez no assistente) — repliquei o mesmo padrão (ação na ficha, não no compêndio) em vez de inventar um mecanismo novo de arrastar item pro mapa (que nem o Eldarin tem).

**Correção:**
1. `TorCompendiumPage.tsx`: seção "Armas" e "Armaduras e Escudos" viram grids de cards (`.tor-compendium__card`, mesmo estilo já usado em Adversários/Marcos/etc.), com `data-site-tip` (o sistema de tooltip global já usado no resto do site) mostrando empunhadura, arremesso/alcance e notas de cada arma.
2. `TorResourcePatch` ganhou `warGear`/`armour` (substituição completa, mesmo padrão dos outros campos) — `patchTorCharacterResources` aplica e `normalizeTorCharacter` já recalcula Carga automaticamente.
3. `TorCharacterSheetView.tsx`: quando `interactive` + `onResourceChange` (mesma checagem de permissão — dono ou mestre, validada no servidor), a tabela de Equipamento de Guerra ganha botão de remover por linha e um `<select>` + "Adicionar arma"; Armadura/Escudo viram `<select>`, Elmo vira um botão de vestir/tirar.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Não testado dentro de uma mesa real (sem banco neste sandbox).

**Arquivos tocados:** editados — `components/compendium/TorCompendiumPage.tsx`, `lib/character/um-anel/{types,characters}.ts`, `components/character/sheet/{TorCharacterSheetView,tor-sheet.css}`.

---

### 2026-07-26 (cont.) — Arrastar personagem/adversário do Um Anel pro mapa

**Pedido:** "Quero a possibilidade de arrastar os personagens para a mesa" — hoje só dava pra colocar via botão "Colocar no mapa"/"Invocar" depois de passar o mouse na célula.

**Implementação — mesmo mecanismo de arrastar-e-soltar do Eldarin, dado próprio pro Um Anel:**
1. `lib/vtt/spawn-drag.ts` ganhou dois pares novos de payload+MIME (`TOR_CHARACTER_SPAWN_DRAG_MIME`/`TOR_ADVERSARY_SPAWN_DRAG_MIME`), espelhando o padrão já usado por monstro/ator/criação-GM do Eldarin; `isBoardSpawnDrag` passou a reconhecer os dois novos tipos.
2. Novo `lib/vtt/tor-spawn-drag-ui.ts` — mesma função de "ghost" de arrasto do Eldarin (`actor-spawn-drag-ui.ts`), em arquivo próprio pra não misturar import de um sistema com o outro.
3. `hooks/vtt/useMonsterSpawnDrop.ts` ganhou `allowTorCharacterDrop`/`allowTorAdversaryDrop` — no `performDrop`, os payloads novos são lidos com a mesma prioridade dos existentes e despacham pra `placeRoomTorCharacterOnCell`/`spawnRoomTorAdversary` (endpoints que já existiam, usados até agora só pelo fluxo de clique).
4. `Battlefield.tsx`: os flags que já existiam (`enabled`/`allowActorDrop`, controlando monstro/ator do Eldarin) ganharam `&& rpgSystemId !== "um-anel"` — sem isso, uma mesa do Um Anel aceitaria (silenciosamente, sem nunca disparar antes) um drop de monstro/ator do Eldarin também; os dois novos flags (`allowTorCharacterDrop`/`allowTorAdversaryDrop`) só ativam quando `rpgSystemId === "um-anel"`.
5. `TorPlayableCharactersPanel.tsx`/`TorAdversaryPanel.tsx`: cards ganharam `draggable`/`onDragStart`/`onDragEnd`, reaproveitando a mesma classe CSS `vtt-playable-card--draggable` que o Eldarin já usa — nenhum CSS novo.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Não testado o arrasto de verdade dentro de uma mesa (sem banco neste sandbox) — recomendado testar arrastando um personagem e um adversário pro mapa numa mesa do Um Anel.

**Arquivos tocados:** novo — `lib/vtt/tor-spawn-drag-ui.ts`; editados — `lib/vtt/spawn-drag.ts`, `hooks/vtt/useMonsterSpawnDrop.ts`, `components/vtt/{Battlefield,TorPlayableCharactersPanel,TorAdversaryPanel}.tsx`.

---

### 2026-07-26 (cont.) — Passo "Retrato" no assistente de criação do Um Anel

**Pedido:** "...adicione a opção de adicionar na ficha e na criação a imagem do personagem" — a ficha já permitia trocar retrato/token (sessão anterior); faltava o mesmo durante a criação (assistente), igual o Eldarin já faz.

**Implementação — reaproveitando o passo de retrato do Eldarin tal qual, sem inventar componente novo:**
1. `lib/character/um-anel/wizard-types.ts`: `TorCharacterWizardDraft` (e `EMPTY_TOR_WIZARD_DRAFT`) ganharam os 5 campos de retrato (`portraitUrl`, `tokenImageUrl`, `portraitFocus`, `coverFocus`, `tokenFocus`) — mesmos campos que `TorCharacterSheet` já suporta desde a sessão anterior.
2. `components/character/wizard/TorCharacterCreationWizard.tsx`: novo passo "Retrato" inserido entre "Equipamento" e "Revisão" (9→10 passos), renderizando `WizardPortraitStep` (componente já existente e agnóstico de sistema, usado pelo Eldarin) com o padrão de "flush pendente": `next()`/`finish()` agora são `async` e chamam `flushPortraitStep()` (via `portraitStepRef`/`useImperativeHandle`) antes de avançar, garantindo que uma imagem sendo processada não se perca se o usuário clicar "Próximo"/"Criar" rápido demais — mesmo mecanismo do wizard do Eldarin, copiado, não reinventado. Revisão ganhou uma miniatura do retrato quando presente.
3. `lib/character/um-anel/build-from-wizard.ts`: `buildTorCharacterFromWizard` para de gravar `portraitUrl: null` fixo e passa a ler os 5 campos direto do `draft`.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Não testado ao vivo (upload real de imagem dentro do assistente) — criar personagem exige login, e o passo de retrato reaproveita 100% o `WizardPortraitStep`/`PortraitEditorPanel` já validados visualmente em produção pelo Eldarin; risco de integração já coberto pelo `tsc` (props tipadas estritamente) e pelo build.

**Arquivos tocados:** editados — `lib/character/um-anel/{wizard-types,build-from-wizard}.ts`, `components/character/wizard/TorCharacterCreationWizard.tsx`.

---

### 2026-07-29 — Vazamento de nome real no chat e nos logs de combate

**Pedido:** usuário reportou (com print mostrando "Raul Luz" no chat da mesa) que o chat mostra o nome real em vez do apelido — "isso é dado pessoal perigoso".

**Causa raiz:** `authorName` das mensagens de chat e das entradas de log de combate (ataque, área, habilidade, consumo de item) usava `session.user.name` direto — o nome real vindo do provedor OAuth (Google/Discord) — em vez do apelido público que o usuário escolhe no cadastro (`session.user.nickname`). O padrão correto já existia e era usado em outros lugares do próprio código (`MesaWorkspace.tsx`, `presence-enrich.ts`, `events/route.ts`: `nickname?.trim() || name`) — só não tinha sido aplicado nesses 9 pontos.

**Correção:** `authorName: session.user.nickname?.trim() || session.user.name` nos 9 call sites — `app/api/room/[roomId]/chat/route.ts` e os 4 pares (2 cada) em `combat/{attack,area,ability,consume}/route.ts`. Mensagens já enviadas antes da correção continuam com o nome real gravado (não há reescrita retroativa de histórico); a partir do deploy, toda mensagem nova usa o apelido.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Confirmado por grep que não sobrou nenhum outro `authorName: session.user.name` no projeto.

**Arquivos tocados:** editados — `app/api/room/[roomId]/chat/route.ts`, `app/api/room/[roomId]/combat/{attack,area,ability,consume}/route.ts`.

---

### 2026-07-29 (cont.) — Drag-and-drop bloqueado com "Célula bloqueada, ocupada ou sem espaço"

**Pedido:** usuário reportou (print do toast de erro) que arrastar um adversário e um personagem pro mapa falha sempre com esse erro.

**Investigação:** reproduzido ao vivo (conta de teste + mesa "O Um Anel" nova, `ELDARIN_DISABLE_DB=1`, Chrome real via Puppeteer). Chamar `spawn-tor-adversary`/`place-tor-character` direto via API com `q:0,r:0` funcionava — descartando bug no motor de posicionamento (`resolveSpawnAnchor`) em si. Screenshot da mesa mostrou o grid quadriculado preenchendo o canvas inteiro (686×828px), sem nenhuma borda visível — mas o grid **desenhado** e o grid **válido pra colocar token** são raios diferentes por design: `lib/vtt/grid-cells.ts::displayGridRadius` desenha o quadriculado expandido até preencher o viewport (raio até `DISPLAY_GRID_RADIUS_CAP = 24`, "evita borda do grid andando" no zoom/pan), enquanto a validação de posicionamento (`cellInGridBounds`) usa o `scene.gridRadius` real da mesa — que uma mesa nova cria com **8** (`DEFAULT_SCENE_TEMPLATE` em `lib/room/adventure-room.ts`). Resultado: qualquer célula visualmente normal fora do quadrado central 17×17 (raio 8) parece válida mas sempre falha — uma "zona morta" invisível que cobre a maior parte do canvas em qualquer tela normal. Confirmado o diagnóstico repetindo o spawn em `q:15,r:15` (fora do raio 8, dentro do raio 24) — falhava antes da correção.

**Correção:**
1. `lib/room/adventure-room.ts`: `DEFAULT_SCENE_TEMPLATE.gridRadius` 8→24 (mesas novas já nascem com raio real ≥ raio desenhado).
2. `lib/room/internal/registry.ts::getRoom`: mesas já existentes (raio < 24 persistido) são reparadas na leitura (`MIN_SAFE_GRID_RADIUS = 24`) — sem precisar recriar a mesa nem rodar migração; o valor corrigido persiste no próximo `persistRoom` natural (ex: o próprio spawn que disparou a leitura).

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Reproduzido e confirmado ao vivo: spawn em `q:15,r:15` numa mesa já existente (criada antes da correção, portanto com `gridRadius:8` salvo) passou a funcionar e a resposta já vem com `scene.gridRadius:24`, sem precisar recriar a mesa.

**Arquivos tocados:** editados — `lib/room/adventure-room.ts`, `lib/room/internal/registry.ts`.

---

### 2026-07-29 (cont.) — Auditoria: nome real exposto a outros usuários (perfil, amigos, membros da aventura)

**Pedido:** usuário pediu explicitamente, após o fix do chat, garantia de que nada de conta dá pra acessar via console/rede — "não quero que possa acessar nada das contas via console".

**Achados (auditoria de toda resposta JSON que inclui dado de outro usuário):**
1. `GET /api/users/[userId]` (`getUserPublicProfile`, `lib/friends/store.ts`) devolvia `name` (nome real) pra **qualquer** usuário logado que soubesse/adivinhasse o ID de outro — inclusive `relationship: "none"` (estranhos, não só amigos). `PlayerProfileCard.tsx` renderizava esse nome como subtítulo visível sempre que a pessoa tinha apelido, sem checar se era o próprio dono do perfil — ou seja, não era só um vazamento de rede, aparecia na tela.
2. `listFriends`/`addFriendByNickname`/`addFriendByUserId` (mesma lib) — lista de amigos também devolvia `name` cru de cada amigo.
3. `GET /api/adventures/[adventureId]/members` — qualquer membro da aventura (não só o mestre) conseguia ver o nome real de todo mundo; usado pelo diálogo de transferir/apagar personagem (`CharacterManageDialog.tsx`).

**Correção — mesmo padrão já usado em `presence-enrich.ts`/`list-enrich.ts` (nickname sempre, nome real nunca como campo próprio pra terceiros):**
1. `lib/friends/types.ts`: `FriendSummary.name` → `displayName` (calculado, nickname-first); `PublicUserProfile.name` vira opcional e só vem preenchido no branch `relationship: "self"`.
2. `lib/friends/store.ts`: `friendSummaryFromUserId`, `listFriends` e o branch não-self de `getUserPublicProfile` param de mandar `name` — mandam só `displayName`/`nickname`. Branch `self` continua com `name` (é o próprio usuário vendo o próprio dado).
3. `components/friends/{friend-label,PlayerProfileCard,SendMesaInvitePicker}.tsx`: usam `displayName` em vez de `name`; o subtítulo de nome real no card de perfil agora só aparece quando `isSelf`.
4. `app/api/adventures/[adventureId]/members/route.ts` + `components/character/CharacterManageDialog.tsx`: endpoint devolve `displayName` (nickname-first) em vez de `nickname`+`name` separados.

**Fora do escopo da correção (avaliado e considerado aceitável):** `lib/admin/mesas.ts` (`AdminMemberSummary.name`) continua expondo nome real — mas só pra `role: "admin"`, gate confirmado em `app/api/admin/adventures/route.ts::requireRole(["admin"])`; é a mesma exceção que qualquer painel de suporte/moderação tem. `presence-enrich.ts`/`list-enrich.ts`/`events`/`presence` route já seguiam o padrão certo (nickname-first) desde antes, só usam nome real como último fallback interno pra montar uma única string, nunca como campo separado.

**Verificação:** `tsc --noEmit` + `npm run build` limpos — a mudança de tipo (`name` obrigatório→opcional/removido) não quebrou nenhum consumidor por acidente porque o compilador teria acusado. Grep final em `app/api/**` confirmou que todo `.name` restante já segue o padrão `nickname || name || "Jogador"` interno (sem expor campo próprio).

**Arquivos tocados:** editados — `lib/friends/{types,store}.ts`, `components/friends/{friend-label,PlayerProfileCard,SendMesaInvitePicker}.tsx`, `app/api/adventures/[adventureId]/members/route.ts`, `components/character/CharacterManageDialog.tsx`.

---

### 2026-07-31 — Auditoria multi-agente completa do hub + 3 correções: cookie de sessão forjável, apelido sempre gerado, nome real removido de vez dos fallbacks

**Pedido:** usuário pediu uma auditoria completa do hub inteiro (mesa Eldarin, mesa Um Anel, compêndio, social, contas/admin, segurança), rodada via `Workflow` com 6 frentes em paralelo e verificação adversarial de cada achado (35 agentes, 726 leituras de código). Resultado: 28 achados confirmados (4 críticos, 7 altos, 11 médios, 4 baixos), publicado como artifact filtrável. A partir do relatório, o usuário pediu 3 correções imediatas: (1) corrigir o cookie de sessão forjável; (2) fechar de vez o vazamento de nome real que sobrevivia nos 9 pontos de chat/combate corrigidos hoje mais cedo; (3) gerar apelido genérico numerado pra toda conta nova, pra nunca mais precisar do nome real em lugar nenhum.

**1. Cookie de sessão sem assinatura (crítico, achado 2× por frentes independentes):** `lib/auth/session.ts` gerava `vinite_session` só como `base64url(JSON.stringify(payload))` — sem HMAC, então qualquer um podia forjar um cookie (`{user:{id:'x',role:'admin'}}`) e virar admin ou qualquer usuário. Corrigido espelhando o padrão que `lib/auth/oauth/state.ts` já usava pro cookie de OAuth state (`createHmac('sha256', SESSION_SECRET)` + `timingSafeEqual`): `encode()` agora produz `<payload>.<assinatura>`, `decode()` rejeita qualquer cookie sem assinatura válida (formato antigo incluso — força relogin geral, resposta correta depois de um forjamento de sessão). Testado ao vivo: cookie forjado no formato antigo agora recebe 403 em `/api/admin/adventures` em vez de acesso total.

**2 e 3. Apelido sempre gerado + nome real fora dos fallbacks de vez:** em vez de caçar cada fallback `nickname || name` um por um pra sempre (que é o que já tinha sido feito hoje mais cedo e a auditoria mostrou que não fechava a causa raiz — apelido continuava opcional), a correção foi na raiz:
- `lib/auth/nickname.ts`: nova `generateUniqueDefaultNickname()` — gera `jogador` + 6 dígitos aleatórios, checa unicidade via callback injetado (SQL ou registry local), até 10 tentativas.
- Aplicado nos 4 pontos reais de criação de conta: `lib/db/users.ts::insertUser` (cadastro por senha, com banco), `lib/db/users.ts::ensureUserFromOAuth` (Google/Discord, ponto único compartilhado pelos dois provedores), `lib/db/users.ts::oauthSessionFallback` (sessão OAuth efêmera sem banco) e `lib/auth/user-store.ts::registerUser` (fallback local em JSON quando `ELDARIN_DISABLE_DB=1`). Toda conta nova nasce com apelido — nunca mais `null`.
- **Backfill pra contas antigas:** `lib/db/users.ts::backfillDefaultNickname` (novo) + `lib/auth/session-user.ts::materializeSessionUser` reestruturada — a função original virou `resolveSessionUser` interna, e o wrapper público checa `if (!resolved.nickname) backfillDefaultNickname(...)` antes de devolver. Repara a conta na primeira requisição autenticada depois do deploy, sem migração manual nem downtime; guard `nickname IS NULL` no UPDATE evita sobrescrever uma troca concorrente feita pelo próprio usuário em `/conta`.
- **Removido o `|| name` de todo fallback que exibe pra outros usuários** (não só "esperar" que o apelido sempre exista agora — eliminar a possibilidade categoricamente): `lib/friends/store.ts`, `lib/room/presence-enrich.ts`, `lib/adventure/{list-enrich,join-requests}.ts`, `lib/room/handlers/ping.ts`, `lib/notifications/store.ts`, `app/api/adventures/[adventureId]/members/route.ts`, `app/api/adventure/[adventureId]/player-bestiary/route.ts`, `app/api/room/[roomId]/{chat,events,presence}/route.ts`, `app/api/room/[roomId]/combat/{attack,area,ability,consume}/route.ts` — todos passam a cair em `"Jogador"` se por algum motivo o apelido não existir, nunca no nome real. `/conta` (troca de apelido a qualquer momento) e o onboarding em `/conta/bem-vindo` continuam funcionando sem alteração — `needsProfileOnboarding` simplesmente passa a retornar `false` sempre, porque a condição que ele checa (`!nickname`) deixa de ocorrer.

**Verificação:** `tsc --noEmit` + `npm run build` limpos. Testado ao vivo (`ELDARIN_DISABLE_DB=1`): cadastro sem apelido devolveu `nickname:"jogador180127"` na resposta e no cookie, nome real ("Fulano da Silva Real") não aparece em nenhum campo de exibição; cookie forjado no formato pré-fix rejeitado com 403. Backfill de contas legadas não testado ao vivo (exige linha real com `nickname NULL` em MariaDB, não reproduzível neste sandbox) — lógica espelha `setUserNickname`, já em produção.

**Arquivos tocados:** novo — nenhum arquivo novo (só funções novas em arquivos existentes); editados — `lib/auth/{session,session-user,user-store,nickname}.ts`, `lib/db/users.ts`, `lib/friends/store.ts`, `lib/room/{presence-enrich,handlers/ping}.ts`, `lib/adventure/{list-enrich,join-requests}.ts`, `lib/notifications/store.ts`, `app/api/adventures/[adventureId]/members/route.ts`, `app/api/adventure/[adventureId]/player-bestiary/route.ts`, `app/api/room/[roomId]/{chat,events,presence}/route.ts`, `app/api/room/[roomId]/combat/{attack,area,ability,consume}/route.ts`.

---
