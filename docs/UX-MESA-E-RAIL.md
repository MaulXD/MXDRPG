# UX — Mesa lateral (rail) e navegação

> Complementa **Epic 4.6–4.8** e **Epic 10** do [PRD-ELDARIN-VTT.md](./PRD-ELDARIN-VTT.md).  
> Decisões: **D30**, **D32**.

---

## 1. Estrutura da mesa

```
┌─────────────────────────────────────────────────────────────┐
│ vtt-topbar: ELDARIN | Mesas · Compêndios · Minhas mesas | ☀  │
├──────────────────────────────┬──────────────────────────────┤
│ Battlefield + sidebar VTT │ mesa-rail (~380px)           │
│                              │  tabs: Chat | Dados | Ficha  │
│                              │  painel ativo (flex column)  │
└──────────────────────────────┴──────────────────────────────┘
```

- `mesa-rail-panel`: `display: flex; flex-direction: column; overflow: hidden; min-width: 0`
- Cada aba preenche altura com `flex: 1; min-height: 0`

---

## 2. Compêndio (variant `rail`)

**Não usar** na mesa:

- `comp-shell` em grid `220px 1fr`
- `comp-grid` com `minmax(220px, 1fr)` (gera scroll horizontal e cards espremidos)

**Usar:**

| Bloco | Classe | Comportamento |
|-------|--------|----------------|
| Shell | `comp-shell--rail` | Coluna flex, `width: 100%` |
| Pacotes | `comp-rail-pack-chip` | Wrap, chips ativos em ouro |
| Lista | `comp-rail-list` | Scroll Y; cards `flex-shrink: 0` |
| Card | `comp-card--rail` | Row: ícone 36px + corpo |
| Detalhe | `comp-detail--rail` | Até ~38% altura, scroll próprio |

**Bug evitado:** lista flex com muitos filhos sem `flex-shrink: 0` → cards com ~20px de altura.

---

## 3. Outras abas do rail

| Aba | Componente | Classes |
|-----|------------|---------|
| Chat | `RoomChat` | `room-chat--rail` (cards por tipo: combate, rolagem, derrota) |
| Dados | `DiceRoller` + `DiceMiniature` | `dice-roller--rail` |
| Ficha | `MesaSheetPanel` | `mesa-panel-scroll--rail mesa-sheet-embed` |
| Invocar | `MonsterSpawnPanel` | `mesa-panel-scroll--rail` |

Compêndio na mesa: usar link do topo do site (**Compêndios** → `/biblioteca`), não duplicar no rail nem na sidebar esquerda.

Scrollbars: finas, `scrollbar-color` ouro em `vtt.css`.

---

## 4. Navegação do site (fora da mesa)

- `SiteHeaderWrapper`: Início, Sistema, Compêndios, Mesa, Entrar/Portal
- `SiteShell`: em `/mesa/[id]` usa `vtt-chrome` (topbar reduzida)
- Landing `/`: CTA **Jogar demo ao vivo** → `/mesa/demo`

---

## 5. Legibilidade (checklist visual)

- [ ] Grid célula visível (`--vtt-cell-stroke` ≥ 0.4 opacidade no escuro)
- [ ] Tags do compêndio rail: wrap, contraste `text-muted` legível
- [ ] Condições: fonte ≥0.72rem, chip com borda visível
- [ ] Nenhum `overflow-x: auto` involuntário no rail
- [ ] Mobile ≤1100px: rail `max-height: 42dvh`, tabs ≥44px altura

---

## 6. Arquivos

| Arquivo | Papel |
|---------|--------|
| `components/compendium/CompendiumBrowser.tsx` | `variant="page" \| "rail"` |
| `components/compendium/compendium.css` | Estilos rail |
| `components/vtt/MesaCompendiumPanel.tsx` | Wrapper `mesa-compendium-rail` |
| `components/vtt/MesaSideRail.tsx` | Tabs |
| `components/vtt/vtt.css` | `mesa-rail`, scrollbars, condições |
| `app/globals.css` | Tokens VTT célula, nav, tema |

---

*Spec v1.0 — alinhada PRD v2.2.*
