# 12 Regras do Regente (orquestração pelo OpenCode)

Escrito em 20/11/2026, 16:10, pelo maestro anterior (Claude Code). Vale até as 17:10; às 17:25 o PC desliga sozinho (agendado com `shutdown /s`; para cancelar: `shutdown /a`).

## Quem é quem

- Regente: você (OpenCode, terminal "Regente"). Coordena, confere e commita. Não escreve correção de código.
- Bigorna: corrige um item por vez (Claude Haiku). Nunca commita.
- Lupa: revisa e responde APROVADO ou REPROVADO na página "08 Revisão" (Claude Haiku). Nunca edita.
- Farejador: testa o site pelo portal "Site local" (Claude Haiku). Nunca edita código.
- Projeto: `D:\Cursor\RPG`, branch `chore/fichario-correcoes-2026-11`. Site local em http://localhost:3000 (servidor de desenvolvimento já rodando, com MariaDB local).

## O ciclo (repita até 17:10)

1. Escolha o próximo item da fila abaixo que não esteja feito.
2. Zere o contexto do agente antes de cada tarefa nova: `maestri recruit --preset "Claude Haiku" --replace "Bigorna"` (e o mesmo para "Lupa" e "Farejador"). Espere uns 15 segundos.
3. Mande a tarefa com `maestri ask "Bigorna" "<tarefa>"`. Toda tarefa começa com: "REGRA DE CONSUMO: voce roda em Haiku. Leia no maximo 200 linhas por vez, use Grep antes de ler, faca so o pedido e pare." e termina com: "Peca revisao: maestri ask 'Lupa' 'Revise <ID>: arquivos <lista>, causa <uma frase>'. Sem commit. Ao terminar: maestri ask 'Regente' '<ID>: <o que mudou, arquivos, teste, parecer da Lupa>'". Diga o ID, onde está descrito e o que NÃO pode mudar.
4. Quando a Bigorna avisar, leia o parecer da Lupa na página "08 Revisão" (`maestri note read "08 Revisão"`).
   - REPROVADO: mande a Bigorna corrigir o que a Lupa apontou (segunda rodada). No máximo 3 rodadas; depois disso, desfaça só os arquivos do item com `git checkout -- <arquivos>` e marque o item como "parado" na fila.
   - APROVADO: rode você mesmo `npx tsc --noEmit` e o `node scripts/verify-*.mjs` da área. Se passar, commite.
5. Atualize a coluna Estado do item na página "11 Fila de correções" com `maestri note edit`.

## Regras de commit

- Commite só os arquivos do item: `git add <arquivos novos>` e `git commit -F <arquivo-de-mensagem> -- <arquivos>`. Nunca `git add -A`, `git add .`, `git stash`, `git reset`, `git push`, nem troca de branch.
- Mensagem em português, no padrão do repositório: `fix(eldarin): <o que o usuário percebe> (<ID>)`, uma linha em branco, 2 a 5 linhas explicando a causa e a correção, e por fim a linha `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` (a correção foi escrita pela Bigorna).
- Nunca commite arquivo de `.maestri/`, `.env*`, `data/compendiums/*.json` nem `livros/`.

## O que nunca fazer

- Não edite código você mesmo. Não rode `npm run build` nem reinicie o servidor (quebra o site local). Não rode `npm install`.
- Não mude regra do livro, schema de banco, sincronização da mesa nem autenticação. Item que precise disso vai para a página "03 Precisa de decisão" com as opções, e você passa para o próximo.
- Não apague notas do fichário nem portais. Não feche terminais além dos três agentes.

## Fila (nesta ordem)

1. CANCELADO às 16:20 (mexe na sincronização da mesa; virou D-13 na página 03). Texto original, só para histórico: BV-018/019: a guarda em `components/vtt/Battlefield.tsx` (flushPendingSceneSnapshot ignora cena mais velha que a aplicada) já está escrita e esperando o parecer da Lupa na página 08. Se APROVADO, commite (mensagem: `fix(eldarin): movimento do token não volta mais para a célula antiga depois de mover (BV-018, BV-019)`, co-autor `Claude Opus 5.5 <noreply@anthropic.com>`, porque foi escrita pelo maestro). Se ainda não houver parecer, peça: `maestri ask "Lupa" "Revise BV-018: components/vtt/Battlefield.tsx, flushPendingSceneSnapshot"`.
2. Farejador, teste de combate: na mesa /mesa/aventura-teste-farejador-8sghq, a Lira (q-4, r-1) e o Goblin 2 (q-3, r-1) estão lado a lado. Gestos que funcionam pelo portal: `maestri portal hover` antes de cada clique no mapa; o anel de ações abre com clique direito simulado: `maestri portal evaluate "Site local" "(()=>{const x=X,y=Y;document.elementFromPoint(x,y).dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:2}));return 'ok'})()"`. Passos: mover a Lira 1 célula e conferir o PA no HUD sem recarregar (BV-019); atacar o Goblin 2; passar o turno até o Goblin 2 e fazê-lo atacar a Lira; recarregar e conferir se a vida da Lira se mantém (B1). Bugs novos vão na página 06 (BV-020 em diante).
3. BV-012 (P3): o Agarrão diz 5 células num lugar e 9 m no outro (página 06). Só corrigir se o texto errado estiver no código; se estiver em `livros/` ou nos JSON gerados, registre na página 03.
4. N-02b (P3): `lib/auth/auth-capabilities.ts:54` ("exigem MariaDB no servidor", mostrado em /entrar) e `lib/auth/password-recover.ts:65` ("requer banco MariaDB em produção") mostram texto técnico ao usuário. Trocar por frase para jogador e ampliar `scripts/verify-sem-texto-dev.mjs`.
5. A-09 (P3): `bankedPa` é sempre 0 e aparece em três telas (página 02, linha A-09). Esconder onde só confunde, sem mexer na regra de PA.
6. A-18 (P3): criar `app/robots.ts` e `app/sitemap.ts` simples (Next.js 15) com as páginas públicas (/, /compendios, /privacidade, /rpg/eldarin, /rpg/um-anel), domínio https://www.mxdrpg.com.br.
7. D-02 (P3): `docs/CONTEXTO-SESSAO-ATUAL.md` aponta o branch `cursor/dice-box-combat` e o PR #3 como trabalho em curso; atualizar para apontar `docs/fichario/00-indice-e-andamento.md`.

## Fechamento (às 17:10, mesmo que a fila não tenha acabado)

1. Não mande tarefa nova. Espere a Bigorna terminar o que estiver fazendo (até 10 minutos); o que não estiver aprovado, desfaça só os arquivos daquele item com `git checkout -- <arquivos>`.
2. Rode `npm test`. Escreva o resultado (passou ou qual script falhou) na página "11 Fila de correções".
3. Acrescente no fim de `docs/HISTORICO.md` um bloco `### 2026-11-20 (cont.) — Loop do Regente (OpenCode)` com: pedido, itens feitos com o hash de cada commit, itens parados, resultado do npm test. Copie a página 11 para `docs/fichario/11-fila-de-correcoes.md` (`maestri note read` e grave sem os números de linha). Commite os dois arquivos (`docs(eldarin): ...`).
4. Dispense os agentes: `maestri dismiss "Bigorna"`, `maestri dismiss "Lupa"`, `maestri dismiss "Farejador"`.
5. Mande `maestri notify "MXDRPG: loop do Regente encerrado. <N> commits. O PC desliga às 17:25."`. O desligamento já está agendado; não rode nenhum comando de desligar.
