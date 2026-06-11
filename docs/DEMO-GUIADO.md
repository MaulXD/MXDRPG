# Demo guiada — roteiro manual

Tour interativo em `/mesa/demo` (botão **Tour** no header). Este documento é o script para apresentar ao vivo.

## Contas locais (desenvolvimento)

1. Abra `/mesa/demo` como visitante ou vá em **Entrar na conta**.
2. Na tela de login, use **Demo Jogador** ou **Demo Mestre** (preenche usuário e senha `123`).
3. Volte para `/mesa/demo` após login.

Em **produção** (Clerk), jogadores e mestres usam conta real; não há botões Demo na tela de login.

## Fluxo visitante (~2 min)

- Mostrar mapa, mover o Aventureiro.
- Explicar limitações: sem chat, sem pedido de consumível.
- Apontar o botão **Tour** e o link para entrar na conta.

## Fluxo jogador (~5 min)

1. **Ficha** — ícone na coluna esquerda → abrir personagem.
2. **Inventário** → **+ Consumível** → descrever item (ex.: poção de cura).
3. Mostrar aviso de pendência na ficha.
4. Pedir ao mestre que aprove (outra aba/conta ou mesma máquina).
5. **Sino (frasco)** no header — notificação de aprovado/recusado.
6. **Combate** — iniciativa (mestre); no turno do jogador: clique direito no token → **Consumível** → usar item.

## Fluxo mestre (~4 min)

1. **Sino** com badge quando chega pedido de inventário.
2. **Aprovar** ou **Aprovar todos**.
3. Opcional: painel **Turno** → rolar iniciativa.
4. Conferir **Visão jogador** no header se quiser ver a UI do jogador.

## Reiniciar o tour

No console do navegador:

```js
localStorage.removeItem("eldarin-demo-guided-tour-v1");
```

Recarregue `/mesa/demo` — o tour abre sozinho após ~1,5 s.
