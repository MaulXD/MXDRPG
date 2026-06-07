# Design atual do Eldarin

Documentação de como o sistema visual do site e da mesa VTT funciona hoje — paleta, tipografia, layouts, componentes e convenções CSS.

> Complementa [UX-MESA-E-RAIL.md](./UX-MESA-E-RAIL.md) (navegação do rail antigo) e [PARIDADE-FOUNDRY.md](./PARIDADE-FOUNDRY.md) (painéis estilo Foundry).

---

## 1. Visão geral

O Eldarin usa **dois shells de interface**:

| Contexto | Rota | Shell | Objetivo |
|----------|------|-------|----------|
| **Site** | `/`, `/biblioteca`, `/entrar`, fichas fora da mesa… | Header + footer clássicos | Marketing, compêndio, criação de personagem, portais |
| **Mesa VTT** | `/mesa/[roomId]` | `vtt-chrome` + layout Foundry | Jogo em tempo real: mapa hex, tokens, combate, chat |

Ambos compartilham **tokens CSS globais** (`app/globals.css`), mas a mesa aplica um **tema próprio** (ardósia + azul frio) via `mesa-theme.css`.

Princípios visuais:

- Fantasia medieval **sem exagero ornamentado** — legível, escuro por padrão, acentos frios (azul) na mesa e acentos quentes (pardo/ouro) no site claro.
- Superfícies em camadas: `glass`, `glass-panel`, gradientes suaves, bordas semitransparentes.
- Tipografia em três papéis: **títulos** (Cinzel), **corpo narrativo** (Lora), **UI** (Source Sans 3).

---

## 2. Temas claro e escuro

### Ativação

- Atributo `data-theme="dark"` ou `data-theme="light"` no `<html>`.
- `ThemeScript` + `ThemeToggle` (`lib/theme.ts`) persistem preferência em `localStorage` e disparam `eldarin-theme-change`.
- Na mesa, o toggle fica na topbar VTT; no site, no header.

### Escuro (padrão)

Paleta base **ardósia + azul frio**:

| Token | Valor típico | Uso |
|-------|--------------|-----|
| `--bg-deep` | `#0a0e14` | Fundo da página / stage do mapa |
| `--bg-mid` | `#101620` | Gradientes de fundo |
| `--surface` | `#141a24` | Cards, painéis |
| `--accent` / `--accent-primary` | `#7aa3c9` | Links, bordas ativas, destaque |
| `--accent-secondary` | `#c9927a` | Acento mestre / warm |
| `--accent-success` | `#6b9e5a` | PA, cura, positivo |
| `--accent-warn` | `#d4a030` | Rodada, avisos |
| `--accent-danger` | `#e07070` | Erro, ataque |
| `--text` | `rgba(232, 236, 244, 0.94)` | Texto principal |
| `--text-muted` | `rgba(200, 210, 224, 0.68)` | Hints, labels |

### Claro

Paleta **pergaminho + marrom**:

- Fundos `#f4ead8` → `#faf6ee`, texto `#1e1810`, acento `#7a4f28`.
- Variáveis `--vtt-hex-*` do canvas mudam para traços escuros sobre mapa claro.

### Fundo global do site

Camadas fixas no `body`:

1. `.site-bg` — gradiente radial + linear.
2. `.site-noise` — textura SVG fractalNoise (~3–5% opacidade).

Na mesa VTT essas camadas ficam atrás do stage; o mapa usa `--mesa-stage-bg`.

---

## 3. Tipografia

Carregada em `app/layout.tsx` (Google Fonts):

| Variável | Fonte | Uso |
|----------|-------|-----|
| `--font-display` | **Cinzel** | Logo, títulos, botões `.btn`, nomes de personagem no HUD |
| `--font-body` | **Lora** | Prosa, fichas, textos longos |
| `--font-ui` | **Source Sans 3** | `html/body` padrão, formulários, UI densa |

Classes utilitárias em `globals.css`:

- `.display-xl` / `.display-lg` — hero e seções.
- `.eyebrow` — rótulo superior com traço decorativo (`letter-spacing` largo, uppercase).
- `.neon-title` — logo **ELDARIN** (Cinzel, acento, tracking largo).
- `.lead` — parágrafo introdutório muted.

---

## 4. Componentes base (site)

### Superfícies

```css
.glass        /* header, topbar — fundo semitransparente + borda */
.glass-panel  /* painéis internos — surface-raised + inset highlight */
```

### Botões

- `.btn` — primário (gradiente surface, Cinzel, uppercase).
- `.btn-ghost` — contorno leve, sem preenchimento forte.
- Estados: hover com `translateY(-1px)` e borda `--accent`.

### Molduras medievais

`MedievalFrame` (`components/ui/MedievalFrame.tsx` + `medieval-borders.css`):

Variantes: `parchment`, `iron`, `gothic`, `royal`, `celtic`, `rune`.

Cantos decorativos (`.mf-corner`) + corpo `.mf-body`. Usado em landing, lore, seções de destaque.

### Header e footer

- **Site:** `SiteHeaderWrapper` — nav Início · Sistema · Compêndios · Entrar/Portal.
- **Mesa:** `SiteShell` detecta `/mesa/[id]` e troca para topbar reduzida (`vtt-topbar`).

---

## 5. Mesa VTT — shell Foundry

### Detecção de contexto

`SiteShell` (`components/SiteShell.tsx`):

```tsx
const isVtt = pathname.startsWith("/mesa/") && pathname !== "/mesa";
// → <div className="vtt-chrome" data-vtt-mesa="foundry">
```

### Estrutura visual

```
┌──────────────────────────────────────────────────────────────────┐
│ vtt-topbar: ELDARIN | Mesas · Compêndios · Minhas mesas | ☀      │
├──────────┬─────────────────────────────────────────────────────┤
│ Icon bar │  Mapa hex (stage)                                    │
│ + dock   │  · MapToolbar (esquerda)                             │
│ opcional │  · CharacterCombatHud (baixo centro)                 │
│          │  · Janelas flutuantes (#foundry-mesa-windows)        │
└──────────┴─────────────────────────────────────────────────────┘
```

Arquivos principais:

| Arquivo | Papel |
|---------|-------|
| `MesaWorkspace.tsx` | Orquestra sidebar, stage, HUD portal, janelas |
| `foundry/foundry.css` | Layout rail, dock, janelas, scroll de painéis |
| `mesa-theme.css` | Tokens `--mesa-*` e overrides do canvas |
| `vtt.css` | Combate, HUD, tokens, efeitos, sidebars |
| `hooks/vtt/useFoundryWindows.ts` | Posição/tamanho/abertura de cada painel |

### Barra de ícones (`MesaIconBar`)

Ícones verticais com **clique esquerdo = janela flutuante**, **clique direito = dock lateral**.

Seções:

- **Jogo:** Status, Tokens, Turno, Ficha, Chat, Dados, Lousa, Convite.
- **Mestre:** Mapa, Mestre, Invocar.

Ícones SVG em `MesaRailIcon.tsx`.

### Painéis dock vs flutuantes

- **Dock:** coluna ao lado da icon bar (`FoundryDockPanel`), largura `clamp(248px, 28vw, 340px)`.
- **Flutuante:** `FoundryWindow` — arrastável, redimensionável, z-index gerenciado.
- Estado salvo por sala em `sessionStorage` via `useFoundryWindows`.

Classes de scroll: `.mesa-panel-scroll`, `.mesa-panel-scroll--rail`.

---

## 6. Mapa hex e canvas

Renderização em **Canvas 2D** (`hooks/vtt/useHexCanvas.ts`, `lib/vtt/draw-battlefield.ts`).

### Cores do grid

Definidas em CSS, lidas em runtime por `readThemeColor()`:

- `--vtt-hex-fill` / `--vtt-hex-stroke` — grid neutro.
- `--vtt-hex-walk-*` — movimento no turno.
- `--vtt-hex-walk-paid-*` — caminhada que gasta PA extra.
- `--vtt-hex-attack-*` — alvos de ataque.
- `--vtt-hex-area-*` — magias de área.
- Paletas `--vtt-hex-on-dark-*` e `--vtt-hex-on-light-*` adaptam contraste ao **tom do mapa** (imagem de fundo escura ou clara).

### Tokens no mapa

- Círculo inscrito no hex (~**84%** do raio do hex para criaturas Médio/Pequeno).
- Retrato em crop circular; anel fino de HP na borda quando visível.
- Anéis de identidade (jogador = cor da mesa; monstro = vermelho/branco) **fora** do círculo da imagem.
- Destaques: turno ativo (anel animado), seleção, alvo de ataque (pulso vermelho).

---

## 7. Barra de ferramentas do mapa (`MapToolbar`)

Barra **vertical à esquerda** do canvas (estilo Roll20), em `MapToolbar.tsx` + `whiteboard.css`.

| Seção | Ferramentas |
|-------|-------------|
| **Mapa** | Interagir · Ping · Régua · Névoa (GM) |
| **Desenho** | Selecionar · Livre · Linha · Seta · Forma · Polígono · Texto |
| **Zoom** | − · % · + · ⊙ reset |
| **Mestre** | 🏰 editor de mapa |

Ao ativar Desenho, aparecem seletor de cor, espessura e “Limpar sessão”. Modo sincronizado com `mapToolMode` em `HexBattlefield`.

---

## 8. HUD de combate (`CharacterCombatHud`)

Painel horizontal **fixo no rodapé do stage** (`#foundry-mesa-hud`), visível quando o jogador (ou GM vendo turno ativo) mantém o HUD aberto.

### Layout (modelo atual)

```
┌─────────────────────────────────────────────────────────────┐
│ [ícones de status — só se houver efeitos; some se vazio]    │
├────────┬──────────────────────────────────────┬────────────┤
│Retrato │ NOME DO PERSONAGEM          21/56    │   FICHA    │
│ 72px   │ [barra HP ─────────────────────]     │            │
│        │ 🛡 CA 22   Pontos de Ação ●●●○○…     │ PASSAR     │
│        │                                      │  TURNO     │
└────────┴──────────────────────────────────────┴────────────┘
```

Detalhes:

- **Barra de status superior:** `TokenEffectsRow` com classe `vtt-effect-chips--hud-bar`; recolhe automaticamente quando não há buffs/condições.
- **Retrato:** imagem do token ou inicial; borda na cor do token.
- **PV:** números à direita do nome; barra fina em largura total; cores por `hpBarColor()`.
- **CA:** escudo SVG com número centralizado.
- **PA:** `PaHudMeter variant="hud"` — label “Pontos de Ação” + círculos preenchidos.
- **Ficha:** abre popup da ficha (`CharacterSheetPopup`).
- **Passar turno:** botão escuro, borda azul (`--accent` frio), só no turno ativo.
- **Ocultar:** ícone de olho cortado no canto; botão “Mostrar HUD” restaura.

Estado “seu turno”: borda dourada/azul reforçada (`.vtt-combat-hud--your-turn`).

---

## 9. Ordem de turno (compacta)

`TurnOrderPanel` com `compact` — janela estreita (~196px), estilo Roll20:

- Cabeçalho: `Contar: N` · botão ⇅ (rolar iniciativa) · `R{rodada}`.
- Lista: **avatar + iniciativa**; turno ativo com fundo verde.
- Rodapé: ‹ turno anterior · ⚙ opções · › passar turno.
- Hover na linha (GM): chips ▶ PA Fim ↩.

---

## 10. Status, efeitos e tooltips

### Chips de efeito

`TokenEffectsRow` + `listTokenEffectChips()` (`lib/vtt/token-effects.ts`).

Cada chip tem:

- Ícone SVG (`TokenEffectIcon`) com fundo sólido de alto contraste.
- Badge de duração (`3R`, `2T`…) quando aplicável.
- Tooltip via `effectTipAttrs()` → atributo `data-tip`.

Formato do tooltip (`formatEffectTooltip`):

```
{Nome}: {descrição da regra} · Duração: {tempo restante}
```

CSS (`.vtt-effect-tip-wrap[data-tip]:hover::after`): balão escuro acima do ícone, `max-width: 280px`, tipografia 0.72rem.

Onde aparecem:

| Local | Classe |
|-------|--------|
| HUD (barra superior) | `vtt-effect-chips--hud-bar` |
| Lista de tokens | `vtt-effect-chips--list` |
| Ordem de turno (modo completo) | `vtt-effect-chips--turn` |
| Modal Status | `TokenStatusList` (lista expandida) |

### Modal Status

`TokenStatusModal` — janela arrastável (`FoundryWindow`), sem bloquear o resto da UI. GM aplica condições em `TokenConditionsPanel`.

---

## 11. Anel de ações e feedback de combate

- **TokenActionRing** — menu radial no clique direito do token (`token-action-ring.css`).
- **BattlefieldActionHud** — preview de PA/custo ao mirar ação.
- **CombatFxLayer** — números de dano, misses, etc. sobre o canvas.
- **VttToast** — notificações discretas na mesa.

---

## 12. Fichas e criação de personagem

| Área | CSS principal | Notas |
|------|---------------|-------|
| Ficha popup na mesa | `sheet-popup.css` | Janela grande redimensionável |
| Ficha página | `sheet.css` | Abas, inventário, atributos |
| Wizard | `wizard.css` | Passos, presets de equipamento |
| Level-up | `level-up.css` | Escolhas de subclasse |
| Retrato / foco | `PortraitFocusEditor` | Preview circular do token |

Fichas de outros jogadores abrem em **somente leitura**.

---

## 13. Outras áreas do site

| Rota / área | Estilo |
|-------------|--------|
| `/biblioteca` | `compendium.css` — browser de regras; variantes `--rail` para painéis estreitos |
| `/mundo`, lore | `world-lore.css` + `MedievalFrame` |
| `/entrar` | Formulários auth com `--font-ui` |
| Home | `home.css` + `HexPreview` animado |
| Bug report | `bug-report.css` — botão flutuante (site e VTT) |

---

## 14. Convenções para novos componentes

1. **Cores:** preferir variáveis CSS (`var(--accent)`) em vez de hex fixo; na mesa, respeitar `--mesa-*` quando dentro de `.vtt-chrome`.
2. **Canvas:** novos highlights devem ganhar par `--vtt-hex-*` em `globals.css` + `mesa-theme.css` e ser lidos via `readThemeColor`.
3. **Painéis na mesa:** usar `glass-panel` ou classes `foundry-dock-panel--*`; scroll com `mesa-panel-scroll`.
4. **Tooltips de regras:** reutilizar `effectTipAttrs` / padrão `data-tip`.
5. **Tipografia:** títulos de jogo em Cinzel; blocos de regra em Lora; controles densos em Source Sans.
6. **Responsivo:** mesa prioriza desktop; `@media (max-width: 640px)` no HUD; dock estreito em telas médias.

---

## 15. Mapa de arquivos CSS

```
app/globals.css          ← tokens globais, tema claro/escuro, botões, site-bg
components/vtt/vtt.css   ← combate, HUD, sidebars, efeitos, hex helpers UI
components/vtt/mesa-theme.css   ← override mesa Foundry + canvas
components/vtt/foundry/foundry.css   ← rail, dock, janelas
components/vtt/whiteboard.css   ← MapToolbar
components/vtt/token-action-ring.css
components/vtt/vtt-toast.css
components/vtt/bug-report.css
components/character/sheet.css
components/character/sheet-popup.css
components/character/wizard/wizard.css
components/compendium/compendium.css
components/ui/medieval-borders.css
components/home/home.css
```

---

## 16. Referências rápidas

- UX rail legado: [UX-MESA-E-RAIL.md](./UX-MESA-E-RAIL.md)
- Painéis Foundry: [PARIDADE-FOUNDRY.md](./PARIDADE-FOUNDRY.md)
- Regras de produto: [PRD-ELDARIN-VTT.md](./PRD-ELDARIN-VTT.md)
- Ajuda in-app na mesa: `VttHelpButton.tsx`

---

*Última revisão: junho 2026 — reflete HUD horizontal, MapToolbar, ordem de turno compacta e tokens maximizados no hex.*
