# Design atual do Eldarin — v3

Documentação de como o sistema visual do site e da mesa VTT funciona hoje — paleta, tipografia, layouts, componentes, fluxos de combate e convenções CSS.

> Complementa [UX-MESA-E-RAIL.md](./UX-MESA-E-RAIL.md) e [PARIDADE-FOUNDRY.md](./PARIDADE-FOUNDRY.md).
>
> **v4 (molduras, HUD, chips, cards):** ver [DESIGN-ELDARIN-V4.md](./DESIGN-ELDARIN-V4.md).

---

## 1. Visão geral

O Eldarin usa **dois shells de interface**:

| Contexto | Rota | Shell | Objetivo |
|----------|------|-------|----------|
| **Site** | `/`, `/biblioteca`, `/entrar`, fichas fora da mesa… | Header + footer clássicos | Marketing, compêndio, criação de personagem, portais |
| **Mesa VTT** | `/mesa/[roomId]` | `vtt-chrome` + layout Foundry | Jogo em tempo real: mapa hex, tokens, combate, chat |

Ambos compartilham **tokens CSS globais** (`app/globals.css`), mas a mesa aplica um **tema próprio** via `mesa-theme.css`.

Princípios visuais:

- Fantasia medieval legível — escuro por padrão, acentos frios (azul) na mesa, acentos quentes (pardo/ouro) no site.
- Superfícies em camadas: `glass`, `glass-panel`, bordas semitransparentes.
- Tipografia em três papéis: **Cinzel** (títulos/valores de jogo), **Lora** (corpo narrativo), **Source Sans 3** (UI densa).
- **Nunca usar emojis** em componentes de UI — apenas ícones SVG (`MesaRailIcon`, `TokenEffectIcon`, escudo CA, etc.).

---

## 2. Temas claro e escuro

### Ativação

- Atributo `data-theme="dark"` ou `data-theme="light"` no `<html>`.
- `ThemeScript` + `ThemeToggle` (`lib/theme.ts`) persistem em `localStorage`.

### Escuro (padrão)

Paleta base **ardósia + azul frio**:

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-deep` | `#0a0e14` | Fundo da página / stage do mapa |
| `--bg-mid` | `#101620` | Gradientes de fundo |
| `--surface` | `#141a24` | Cards, painéis |
| `--surface-raised` | `#1a2030` | Painéis elevados, células de atributo |
| `--accent` / `--accent-primary` | `#7aa3c9` | Links, bordas ativas, destaque |
| `--accent-secondary` | `#c9927a` | Acento mestre / warm |
| `--accent-success` | `#6b9e5a` | PA, cura, positivo |
| `--accent-warn` | `#d4a030` | Rodada, avisos |
| `--accent-danger` | `#e07070` | Erro, ataque |
| `--text` | `#e8ecf4` | Texto principal — **sem opacidade**, valor sólido |
| `--text-muted` | `#9aaabf` | Hints, labels — **mínimo 4.5:1 de contraste sobre `--surface`** |
| `--text-dim` | `#5a6a80` | Placeholders, info secundária muito discreta |
| `--border` | `#2a3a50` | Bordas de células e divisores |
| `--border-accent` | `#3a5a80` | Borda ativa / hover |

> **Regra de contraste:** qualquer texto que o jogador precise ler durante o jogo deve ter contraste mínimo WCAG AA (4.5:1) sobre o fundo onde aparece. Usar `--text-muted` em fundos mais escuros que `--surface` exige verificação — preferir `--text` nesses casos.

### Claro

- Fundos `#f4ead8` → `#faf6ee`, texto `#1e1810`, acento `#7a4f28`.
- `--text-muted` claro: `#6a5a44` (contraste verificado sobre `#f4ead8`).

---

## 3. Tipografia

Carregada em `app/layout.tsx` (Google Fonts):

| Variável | Fonte | Peso(s) | Uso |
|----------|-------|---------|-----|
| `--font-display` | **Cinzel** | 400, 600, 700 | Títulos, nomes de personagem, valores de atributo, botões `.btn` |
| `--font-body` | **Lora** | 400, 400i | Prosa, fichas, textos de regra longos |
| `--font-ui` | **Source Sans 3** | 400, 600 | Formulários, UI densa, labels de controle |

### Hierarquia de tamanhos

| Papel | Fonte | Tamanho | Peso | Cor recomendada |
|-------|-------|---------|------|-----------------|
| Nome de personagem (HUD/ficha) | Cinzel | 20–24px | 700 | `--text` |
| Valor de atributo base | Cinzel | 26–28px | 700 | `--text` |
| Modificador de atributo | Cinzel | 13px | 600 | positivo: `--accent-success` · negativo: `--accent-danger` · zero: `--text-dim` |
| Label de atributo (FOR/DES…) | Cinzel | 8px | 600 | `--text-dim`, `letter-spacing: .16em` |
| Valor de combate (CA, PA, PV) | Cinzel | 16–20px | 700 | `--text` |
| Label de seção (separador) | Cinzel | 8px | 600 | `--text-muted`, `letter-spacing: .18em`, uppercase |
| Nome de perícia / habilidade | Lora | 11–12px | 400i | `--text-muted` |
| Bônus de perícia | Cinzel | 12px | 700 | `--text` |
| Texto de regra / lore | Lora | 13–14px | 400 | `--text` |
| Label de controle de UI | Source Sans 3 | 11–12px | 400 | `--text-muted` |

### Regras de legibilidade

- **Nunca usar opacidade em texto** que o jogador precisa ler durante sessão — usar valor de cor sólido.
- Valor base do atributo (ex: `8`) deve ser tão legível quanto o modificador (`−1`) — não reduzir abaixo de 12px nem usar cor mais fraca que `--text-muted`.
- Labels de 8px só são aceitáveis em contextos onde funcionam como **título de seção**, nunca como valor de jogo.

Classes utilitárias em `globals.css`:

- `.display-xl` / `.display-lg` — hero e seções.
- `.eyebrow` — rótulo superior com traço decorativo (`letter-spacing` largo, uppercase).
- `.neon-title` — logo ELDARIN (Cinzel, acento, tracking largo).
- `.lead` — parágrafo introdutório muted.

---

## 4. Componentes base (site)

### Superfícies

```css
.glass        /* header, topbar — fundo semitransparente + borda */
.glass-panel  /* painéis internos — surface-raised + inset highlight */
```

### Botões

- `.btn` — primário (gradiente surface, Cinzel, uppercase, sem emoji).
- `.btn-ghost` — contorno leve, sem preenchimento forte.
- Estados: hover com `translateY(-1px)` e borda `--accent`.

### Molduras medievais

`MedievalFrame` (`components/ui/MedievalFrame.tsx` + `medieval-borders.css`):

Variantes: `parchment`, `iron`, `gothic`, `royal`, `celtic`, `rune`.

Cantos decorativos SVG (`.mf-corner`) + corpo `.mf-body`. Sem emojis decorativos — usar SVG inline ou `MesaRailIcon`.

---

## 5. Mesa VTT — shell Foundry

### Estrutura visual

```
┌──────────────────────────────────────────────────────────────────┐
│ vtt-topbar: ELDARIN | Mesas · Compêndios · Minhas mesas | sol    │
├──────────┬─────────────────────────────────────────────────────┤
│ Icon bar │  Mapa hex (stage — foundry-mesa__stage)              │
│ + dock   │  · MapToolbar (esquerda)                             │
│ (altura  │  · TurnHandoffOverlay (anúncio de turno)              │
│  100%)   │  · Toasts (#foundry-mesa-toasts, acima do HUD)       │
│          │  · CharacterCombatHud (baixo centro, z-index 7)      │
│          │  · Janelas flutuantes (#foundry-mesa-windows)        │
└──────────┴─────────────────────────────────────────────────────┘
```

### Sidebar e dock

- **Icon bar** fixa à esquerda (`foundry-icon-bar`); ícones SVG + rótulo curto.
- **Dock** (`foundry-sidebar__dock`) expande com `width: clamp(248px, 28vw, 340px)` quando um painel está aberto.
- Painéis dock (`FoundryDockPanel`) usam `position: absolute; inset: 0` na coluna e **preenchem a altura** (`flex: 1` na cadeia `__body` → `mesa-panel-scroll--rail`).
- Ordem de turno no dock: lista compacta com scroll interno (`vtt-turn-list--compact`), rodapé de navegação fixo embaixo.
- Janelas flutuantes reutilizam o mesmo conteúdo via portal em `#foundry-mesa-windows`.

### Camadas z-index (mesa)

| Camada | z-index | Elemento |
|--------|---------|----------|
| Mapa / canvas | 0 | `.vtt-canvas-wrap` |
| Toolbar / hints | 5–6 | `MapToolbar`, `vtt-turn-handoff` |
| HUD de combate | 7 | `.vtt-combat-hud` |
| Toasts de turno/PA | 12 | `.foundry-mesa__toasts` |
| Sidebar | 30 | `.foundry-sidebar` |
| Janelas Foundry | 20+ | `.foundry-window` |

---

## 6. Ficha de personagem — layout Foundry

### Estrutura de 3 colunas

```
┌─────────────────────────────────────────────────────────┐
│ BANNER (100px) — bg da classe + nome + nível hex        │
├──────────┬──────────────────────┬──────────────────────┤
│ Avatar   │ Faixa de atributos   │                      │
│ 158×178  │ FOR DES CON INT SAB  │                      │
│ chanfrado│ CAR (6 células)      │                      │
├──────────┼──────────────────────┼──────────────────────┤
│ Status   │ Tabs: Perícias /     │ Saves                │
│ Classe   │ Magias / Hab /       │ Resistências         │
│ Devoção  │ Inventário / Tesouro │ Sentidos             │
│ Tags     │                      │ Armadura / Armas     │
│          │                      │ Idiomas              │
│          │                      │ Magias rápidas       │
└──────────┴──────────────────────┴──────────────────────┘
```

### Célula de atributo (opção C — padrão)

```
┌─────────┐
│  FOR    │  ← Cinzel 8px, --text-dim, letter-spacing .16em
│         │
│   8     │  ← Cinzel 28px 700, --text (valor base LEGÍVEL)
│  ─────  │  ← divisor 1px --border
│  −1     │  ← Cinzel 13px 600, pill colorida por sinal
└─────────┘
```

Pill do modificador:
- Negativo: fundo `#200a06`, borda `1px solid #5a1a0e`, cor `--accent-danger`
- Positivo: fundo `#0a180a`, borda `1px solid #1a4a18`, cor `--accent-success`
- Zero: fundo `--surface`, borda `--border`, cor `--text-dim`
- Atributo primário da classe: valor base em `#d0c0ff` (mago/arcano) ou cor temática

### Banner da ficha

- Altura: 100px, `background-size: cover`, `background-position: center top`
- Fade para baixo: `linear-gradient(transparent, var(--bg-deep))`
- Fade lateral esquerdo: cobre o avatar sem cortar o conteúdo
- Seletor de tema: 4 pontos coloridos (border-radius 50%, borda dourada no ativo)
- Temas por classe (gradientes CSS quando sem imagem):
  - `pyromancer`: `#3a0c08 → #7a1a0a`
  - `umbral`: `#080c22 → #141840`
  - `druid`: `#081408 → #143c10`
  - `warrior`: `#1a1006 → #3c2408`
- Quando `bannerUrl` (URL de imagem) for fornecido, usa como `background-image`
- Seletor emite `onBannerChange(theme)` para persistir no banco

### Avatar

- Dimensão: 158×178px, posição absolute sobre banner e coluna esquerda
- `clip-path: polygon(0 16px, 16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px))`
- Borda: `2px solid` na cor da classe (ex: `#6644aa` mago, `#aa4420` piromante)
- Filetes dourados SVG nos 4 cantos da moldura
- Overlay escuro no hover com texto "trocar imagem" (Cinzel, sem emoji)
- Click abre `<input type="file" accept="image/*">`
- Upload: `FileReader` → preview imediato; prop `onAvatarChange(file)` para persistência

### Separadores de seção

```css
/* padrão: linha + losango + texto + losango + linha */
.section-divider {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bg-deep);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.section-divider__line { flex: 1; height: 1px; background: var(--border-accent); }
.section-divider__gem  { width: 5px; height: 5px; background: #8a6020; transform: rotate(45deg); }
.section-divider__title {
  font-family: var(--font-display);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: .18em;
  color: var(--text-muted);
  white-space: nowrap;
  text-transform: uppercase;
}
```

### Bordas e moldura geral da ficha

```css
.character-sheet {
  background: #1a1510;
  border: 3px solid #6b4f1e;
  box-shadow:
    inset 0 0 0 1px #3a2a0e,
    inset 0 0 0 4px #0e0a06,
    inset 0 0 40px rgba(0,0,0,.5);
}
/* cantos ornamentais: SVG com filetes e ponto dourado, posição absolute */
```

---

## 7. HUD de combate (`CharacterCombatHud`)

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ [chips de efeito — recolhe se vazio]                    │
├────────┬──────────────────────────────────┬────────────┤
│Retrato │ NOME DO PERSONAGEM      21/56    │   FICHA    │
│ 72px   │ [barra HP ──────────────────]    │            │
│        │ [escudo CA] 22   PA ■■■□□        │  PASSAR    │
│        │                                  │   TURNO    │
└────────┴──────────────────────────────────┴────────────┘
```

### Especificações visuais

- **Fundo do HUD:** chanfrado via `::before` (não clipa o conteúdo); borda `1px solid var(--border-accent)`; no turno ativo (`.vtt-combat-hud--your-turn::before`) borda `--accent-primary` reforçada
- **Nome:** Cinzel 14px 700, `--text`
- **PV:** `{atual}/{max}` — Cinzel 13px 600, cor por `hpBarColor()` (verde/amarelo/vermelho)
- **Barra HP:** altura 5px, fundo `var(--bg-deep)`, borda `1px solid var(--border)`, fill colorido
- **CA:** ícone SVG de escudo com número centralizado (Cinzel 14px 700) — sem emoji
- **PA:** `PaHudMeter` — label "PA" + dots (`PaDotMeter`); preenchido `--accent-primary`, vazio `--surface`
- **Botão "Passar Turno":** Cinzel uppercase, borda `--accent`, fundo `--bg-deep`
- **Retrato (72×72, 58×58 mobile):** `PortraitFocusFill` com `tokenFocus` / `portraitFocus` da ficha; borda na cor do token; fallback para iniciais em Cinzel

### Retratos e persistência

- **Fonte de verdade:** `actor.tokenImageUrl` → `actor.portraitUrl` → `token.imageUrl` (ver `lib/room/portrait-sync.ts`).
- **Sync ao salvar mesa:** `syncLinkedTokens` + `backfillActorPortraitsFromTokens` em `bumpRoom` evitam perder imagem ao passar turno.
- **Cliente:** `mergeScenePreservingPortraits` no `HexBattlefield` preserva `imageUrl` entre snapshots parciais de combate.
- **Enquadramento:** mesmo motor da ficha (`PortraitFocusFill` / `computeFocusImgLayout`); HUD usa `shape="square"`.

---

## 7b. Fluxos visuais de combate

### Anúncio de turno (`TurnHandoffOverlay`)

Disparado quando `activeIndex` ou rodada mudam (não na carga inicial da mesa).

```
┌────────────────────────────────────────┐
│ ░░░░░░░░░ overlay 36% preto ░░░░░░░░░ │
│                                        │
│         Vez de “Nome do Personagem”    │  ← Cinzel, --accent-primary no nome
│                                        │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│         [ HUD permanece visível ]      │  z-index 7, abaixo do overlay (6)
└────────────────────────────────────────┘
```

- Duração: ~2s visível + fade 420ms
- Classes: `.vtt-turn-handoff`, `.vtt-turn-handoff__veil`, `.vtt-turn-handoff__text`
- Substitui o banner fixo "Turno de:" no topo do mapa

### Toasts de PA/turno (`VttToast`)

- Renderizados em `#foundry-mesa-toasts` dentro do stage (portal), não no `body`
- Posição: `bottom: var(--vtt-toast-lift)` — calculado dinamicamente acima do `.vtt-combat-hud`
- Variantes: `info`, `warn` (atordoado), `success` (PA restituídos/guardados)
- Máximo 5 toasts empilhados; auto-dismiss 5,2s

---

## 8. Tokens no mapa

- Moldura hexagonal SVG com duplo anel (jogador) ou triplo anel (inimigo grande)
- Jogadores: cor da classe define o esquema do anel
- Inimigos: anel vermelho — inimigos grandes recebem terceiro anel para peso visual
- Nameplate: fita em `clip-path` rômbico embaixo do token, fundo na cor da facção
- Texto do nameplate: Cinzel 9px, sem emoji
- Anel de status: verde (na sala), vermelho pulsante (turno ativo), cinza (offline)
- Valor de HP acima do token: Cinzel 9px, cor por `hpBarColor()`

---

## 9. Convenções para novos componentes

1. **Cores:** sempre `var(--token)` — nunca hex fixo em componentes; na mesa, respeitar `--mesa-*` dentro de `.vtt-chrome`.
2. **Emojis:** proibidos em qualquer componente de UI — usar SVG inline ou `MesaRailIcon`.
3. **Contraste:** texto que o jogador lê durante sessão deve ter contraste mínimo 4.5:1 (WCAG AA) — verificar sempre que usar `--text-muted` sobre fundos escuros.
4. **Atributos:** seguir spec "opção C" — valor base 28px Cinzel `--text`, pill de modificador colorida por sinal.
5. **Canvas:** novos highlights devem ganhar par `--vtt-hex-*` em `globals.css` + `mesa-theme.css`, lidos via `readThemeColor`.
6. **Painéis na mesa:** usar `glass-panel` ou classes `foundry-dock-panel--*`; scroll com `mesa-panel-scroll`.
7. **Tooltips de regras:** reutilizar `effectTipAttrs` / padrão `data-tip`.
8. **Tipografia:** Cinzel para títulos e valores de jogo; Lora para regras e lore; Source Sans 3 para controles densos.
9. **Responsivo:** mesa prioriza desktop; `@media (max-width: 640px)` no HUD; dock estreito em telas médias.

---

## 10. Mapa de arquivos

### CSS

```
app/globals.css                              ← tokens globais, tema claro/escuro, botões
components/vtt/vtt.css                       ← combate, HUD, turn handoff, sidebars
components/vtt/mesa-theme.css                ← override mesa Foundry + canvas
components/vtt/foundry/foundry.css           ← rail, dock (altura 100%), janelas
components/vtt/whiteboard.css                ← MapToolbar
components/vtt/token-action-ring.css
components/vtt/vtt-toast.css                 ← toasts acima do HUD no stage
components/vtt/bug-report.css
components/character/sheet.css               ← PortraitFocusFill (ficha)
components/character/sheet-popup.css
components/character/wizard/wizard.css
components/compendium/compendium.css
components/ui/medieval-borders.css
components/home/home.css
```

### Componentes visuais-chave (mesa)

| Componente | Arquivo | Função |
|------------|---------|--------|
| `MesaWorkspace` | `components/vtt/MesaWorkspace.tsx` | Shell Foundry, dock, toasts anchor |
| `CharacterCombatHud` | `components/vtt/CharacterCombatHud.tsx` | HUD inferior com retrato focado |
| `TurnHandoffOverlay` | `components/vtt/TurnHandoffOverlay.tsx` | Overlay "Vez de …" ao passar turno |
| `VttToast` | `components/vtt/VttToast.tsx` | Toasts PA/turno acima do HUD |
| `FoundryDockPanel` | `components/vtt/foundry/FoundryDockPanel.tsx` | Painel lateral fixo |
| `PortraitFocusFill` | `components/character/PortraitFocusFill.tsx` | Enquadramento de retrato |

### Lógica de sync (retratos)

```
lib/room/portrait-sync.ts      ← merge/preserve imageUrl
lib/room/sync.ts               ← syncLinkedTokens
lib/room/internal/registry.ts  ← bumpRoom + backfill
lib/room/adventure-actors.ts   ← merge retratos ao sync ficha DB
```

---

## 11. Referências rápidas

- UX rail legado: [UX-MESA-E-RAIL.md](./UX-MESA-E-RAIL.md)
- Painéis Foundry: [PARIDADE-FOUNDRY.md](./PARIDADE-FOUNDRY.md)
- Regras de produto: [PRD-ELDARIN-VTT.md](./PRD-ELDARIN-VTT.md)
- Combate e PA: [VTT-ACOES-PA-AREAS.md](./VTT-ACOES-PA-AREAS.md)
- UX combate: [P5-COMBAT-UX.md](./P5-COMBAT-UX.md)

---

## 12. Changelog visual

| Versão | Data | Mudanças |
|--------|------|----------|
| v3 | jun/2026 | Dock preenche altura; toasts acima do HUD; overlay de turno; retratos persistentes; HUD com PortraitFocusFill e fundo em `::before` |
| v2 | jun/2026 | Contraste WCAG, sem emojis, atributos opção C, tokens hex, ficha Foundry |
| v1 | — | Paleta ardósia/azul, shell Foundry inicial |

---

*Última revisão: junho 2026 — v3.*
