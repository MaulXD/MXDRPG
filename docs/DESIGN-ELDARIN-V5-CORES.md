# Design System Eldarin v5 — Paleta de Cores

> Foco inicial: tokens de cor para `globals.css` e `mesa-theme.css`.  
> Referência: Foundry VTT (chrome escuro) + identidade Eldarin (pergaminho, ouro envelhecido, ferro).  
> Restrições: sem neon, sem musgo, sem gradientes, WCAG AA no pergaminho.

---

## Camada 1 — `chrome-*`
> Navbar, rail, sidebar, header de janelas flutuantes, dock

| Token | Hex | Uso |
|---|---|---|
| `--chrome-bg` | `#111110` | Fundo base do app, sidebar, dock |
| `--chrome-surface` | `#1e1d1a` | Painéis laterais, rails, tooltips de UI |
| `--chrome-header` | `#2a2820` | Header de janelas flutuantes |
| `--chrome-border` | `#38342a` | Divisores, bordas de painel, separadores |
| `--chrome-accent` | `#b8922e` | Hover, foco, indicador ativo, logo |
| `--chrome-accent-hover` | `#d4aa52` | Estado hover do acento |
| `--chrome-text` | `#c8bfa8` | Texto de UI no chrome |
| `--chrome-text-muted` | `#6b6050` | Labels secundários, ícones inativos |

```css
/* globals.css — :root */
--chrome-bg:           #111110;
--chrome-surface:      #1e1d1a;
--chrome-header:       #2a2820;
--chrome-border:       #38342a;
--chrome-accent:       #b8922e;
--chrome-accent-hover: #d4aa52;
--chrome-text:         #c8bfa8;
--chrome-text-muted:   #6b6050;
```

**Regras de uso:**
- `--chrome-bg` nunca como fundo de conteúdo legível — apenas estrutura
- `--chrome-accent` é o único amarelo/dourado no chrome; não criar variantes
- Hover de links de navegação: `color: --chrome-accent`, sem background

---

## Camada 2 — `content-*`
> Fichas de personagem, compêndio, modais de lore, painéis de leitura

| Token | Hex | Uso |
|---|---|---|
| `--content-bg` | `#f6f0e4` | Fundo pergaminho principal |
| `--content-bg-elevated` | `#faf6ee` | Cards e painéis elevados sobre pergaminho |
| `--content-border` | `#c8b48a` | Bordas internas de seções, divisores |
| `--content-border-strong` | `#8c7a5e` | Bordas de ênfase, separadores de header |
| `--content-text` | `#1e1a14` | Texto principal, valores de atributo |
| `--content-text-muted` | `#5a4e38` | Labels, meta-texto, placeholders |
| `--content-ink` | `#3d2e1a` | Títulos, nomes, números de ficha |
| `--content-accent` | `#b8922e` | Acento dourado no pergaminho (mesmo tom do chrome) |

```css
/* globals.css — :root */
--content-bg:           #f6f0e4;
--content-bg-elevated:  #faf6ee;
--content-border:       #c8b48a;
--content-border-strong:#8c7a5e;
--content-text:         #1e1a14;
--content-text-muted:   #5a4e38;
--content-ink:          #3d2e1a;
--content-accent:       #b8922e;
```

**Regras de uso:**
- Todo texto sobre `--content-bg` usa `--content-text` ou `--content-ink` — nunca preto puro `#000`
- `--content-accent` e `--chrome-accent` são o mesmo hex `#b8922e` — isso é intencional, cria unidade visual entre contextos
- `--content-bg-elevated` apenas para elevação real (cards sobre pergaminho), não como variação decorativa

---

## Camada 3 — `stage-*`
> Canvas do mapa, grid, fog of war — manter escuro, não alterar

| Token | Hex | Uso |
|---|---|---|
| `--stage-bg` | `#0e0e0c` | Fundo do canvas de jogo |
| `--stage-grid` | `#1c1c18` | Linhas de grid |
| `--stage-fog` | `rgba(10,10,8,0.85)` | Fog of war |
| `--stage-token-ring` | `#b8922e` | Anel de token selecionado |
| `--stage-ruler` | `#c8bfa8` | Régua de distância |

```css
/* mesa-theme.css — [data-vtt-mesa] */
--stage-bg:         #0e0e0c;
--stage-grid:       #1c1c18;
--stage-fog:        rgba(10,10,8,0.85);
--stage-token-ring: #b8922e;
--stage-ruler:      #c8bfa8;
```

> **Não alterar** coordenadas, z-index ou lógica de fog — apenas referências de cor.

---

## Camada 4 — `semantic-*`
> HP, defesa, estados de jogo, feedback de UI — cores sóbrias, WCAG AA sobre `--content-bg`

| Token | Hex | Contraste s/ `#f6f0e4` | Uso |
|---|---|---|---|
| `--semantic-hp` | `#7a1e1e` | 8.2:1 ✓ | HP, dano, vida |
| `--semantic-pa` | `#1a3d5c` | 7.6:1 ✓ | CA, escudo, defesa |
| `--semantic-success` | `#2a4a2c` | 7.1:1 ✓ | Buff ativo, sucesso |
| `--semantic-warn` | `#6e4800` | 6.3:1 ✓ | Atenção, condição |
| `--semantic-danger` | `#5e1a0e` | 8.8:1 ✓ | Veneno, crítico, perigo |
| `--semantic-info` | `#1a2e4a` | 8.1:1 ✓ | Info, lore, nota |
| `--semantic-gm` | `#3a1e52` | 7.4:1 ✓ | Exclusivo GM, notas secretas |

```css
/* globals.css — :root */
--semantic-hp:      #7a1e1e;
--semantic-pa:      #1a3d5c;
--semantic-success: #2a4a2c;
--semantic-warn:    #6e4800;
--semantic-danger:  #5e1a0e;
--semantic-info:    #1a2e4a;
--semantic-gm:      #3a1e52;
```

**Regras de uso:**
- Usar **apenas** como `color` de texto, `border-color` ou `background` de chips pequenos (≤ badge/pill)
- Nunca como fundo de área maior que 32×32px
- Chips sobre pergaminho: `background: --content-bg-elevated`, `border: 1px solid <semantic>`, `color: <semantic>`
- Chips sobre chrome: `background: transparent`, `border: 1px solid <semantic>`, `color` derivado mais claro

---

## Tipos de Compêndio — substituindo neon

| Tipo | Token | Hex | Regra de uso |
|---|---|---|---|
| Arma | `--type-weapon` | `#8b3a22` | `border-left: 3px solid` apenas |
| Magia | `--type-magic` | `#1a3d5c` | `border-left: 3px solid` + ícone |
| Equipamento | `--type-gear` | `#4a3820` | `border-left: 3px solid` apenas |
| Habilidade | `--type-ability` | `#6e4800` | `border-left: 3px solid` + ícone |
| Efeito | `--type-effect` | `#2a4a2c` | chip pequeno apenas |
| Monstro / NPC | `--type-creature` | `#5e1a0e` | `border-left: 3px solid` apenas |

```css
/* globals.css — :root */
--type-weapon:   #8b3a22;
--type-magic:    #1a3d5c;
--type-gear:     #4a3820;
--type-ability:  #6e4800;
--type-effect:   #2a4a2c;
--type-creature: #5e1a0e;
```

**Regra universal:** cor de tipo **nunca** como `background` em área > 32px.  
Padrão de card compêndio:

```css
.compendium-card {
  background: var(--content-bg-elevated);
  border: 1px solid var(--content-border);
  border-left: 3px solid var(--type-weapon); /* troca pelo tipo */
  border-radius: 0 4px 4px 0;
}
```

---

## Checklist de QA — Cores

- [ ] Nenhum hex hardcoded fora dos arquivos de token
- [ ] Todo `--semantic-*` com contraste ≥ 4.5:1 sobre `--content-bg` (testar com Stark / Colour Contrast)
- [ ] `--chrome-accent` e `--content-accent` mantidos como `#b8922e` — não divergir
- [ ] `icons.ts` sem nenhum valor com saturação HSL > 70% (neon check)
- [ ] Cores de tipo apenas como `border-left` ou ícone — nunca `background` > 32px
- [ ] Nenhuma cor de musgo (H: 100–140°, S > 30%) em nenhum token

---

*Próximos entregáveis: tipografia, bordas medievais, componentes.*
