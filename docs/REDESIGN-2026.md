# MXDRPG — Brief de Redesign 2026

> Documento de referência para refatoração de design. Gerado via sessão de briefing com o dono do produto.  
> **Leia este arquivo inteiro antes de começar qualquer implementação.**

---

## 1. Visão Geral

**Direção:** Manter a identidade fantasia medieval — não trocar por SaaS clean. O problema não é o estilo, é a **execução**: inconsistência, tipografia sem sistema, ornamentos sem disciplina, espaçamento aleatório.

**Referência primária:** Baldur's Gate 3 — UI de RPG com bordas detalhadas, hierarquia clara, ícones marcantes, atmosfera imersiva sem sacrificar legibilidade.

**O que NÃO mudar:** A essência dark fantasy, o tom escuro, a ideia de pergaminho/grimório digital.

---

## 2. Sistema de Cores — Nova Paleta

### Substituição do Dourado

O `#c9a962` atual é genérico. A surpresa proposta:

**Acento primário: Verdigris (bronze antigo)**
```
--accent:        #6B9E8C   /* verde-patina, bronze envelhecido */
--accent-dim:    #4A7A6A   /* hover, estado ativo */
--accent-glow:   rgba(107, 158, 140, 0.18)  /* glow sutil */
--accent-warn:   #C97A4A   /* cobre quente — ações destrutivas, dano, alerta */
```

Justificativa: verde-patina evoca estátuas de bronze antigas, mapas velhos, alquimia — mais raro no espaço de RPG (que abusa de amarelo-dourado), premium, lê bem sobre fundos escuros.

### Fundos (Chrome System) — manter, só disciplinar uso

```
--chrome-bg:          #0e0d0b   /* base mais escura (era #111110) */
--chrome-surface:     #1a1916   /* cards, painéis (era #1e1d1a) */
--chrome-header:      #242220   /* topo de janelas, seções */
--chrome-field-bg:    #151412   /* inputs */
--chrome-border:      rgba(255,255,255,0.06)
--chrome-border-bright: rgba(255,255,255,0.12)
```

### Texto

```
--text-strong:   #ede6d8   /* títulos, labels importantes */
--text:          #c4bbaa   /* corpo */
--text-muted:    #8a7d68   /* hints, labels secundários */
--text-dim:      #5a5045   /* placeholders, desabilitado */
```

### Semânticas

```
--color-hp:      #e05c5c   /* vida, dano */
--color-pa:      #6B9E8C   /* PA (usa o acento) */
--color-magic:   #9b75d4   /* magia, habilidades arcanas */
--color-nature:  #5a9e6a   /* habilidades naturais */
--color-success: #4a9e6a
--color-danger:  #c94a4a
```

---

## 3. Tipografia — Sistema

**Problema atual:** mix de pesos e tamanhos sem escala definida, display font usada em lugares errados.

### Escala proposta (rem base = 16px)

```
--text-xs:    0.7rem    /* badges, tags, labels de formulário */
--text-sm:    0.82rem   /* corpo secundário, dicas */
--text-base:  0.9rem    /* corpo padrão */
--text-md:    1rem      /* ênfase de corpo */
--text-lg:    1.15rem   /* subheadings */
--text-xl:    1.4rem    /* headings de seção */
--text-2xl:   1.75rem   /* headings de página */
--text-3xl:   2.25rem   /* hero/display */
--text-4xl:   3rem      /* hero grande */
```

### Regras de uso

- `font-display` (Cinzel ou similar): APENAS em `eyebrow`, headings de seção, labels de sidebar. Nunca em corpo ou botões.
- Peso: 400 corpo, 600 label/ênfase, 700+ somente título.
- `letter-spacing` positivo: apenas em eyebrows e tags com uppercase — em todo o resto, 0.
- `text-transform: uppercase`: somente eyebrows e tags. Nunca em botões ou corpo de texto.

---

## 4. Site Público — Prioridade 1

### 4a. Navbar

**Problemas:** genérica, sem personalidade, não parece RPG.

**Mudanças:**
- Logo: adicionar sutil ornamento ou moldura lateral que evoque grimório.
- Links de navegação: adicionar um underline animado com a cor `--accent` (verdigris) no hover, mais espesso e orgânico do que o atual.
- Menu do usuário (avatar): substituir o círculo genérico por token ring — bordas do mesmo estilo dos tokens na mesa. Raio com borda `--accent`.
- Fundo da navbar: `--chrome-bg` com `backdrop-filter: blur(12px)` e borda inferior fina `--chrome-border-bright`.
- Links ativos: usar `--accent` mais `font-weight: 700`, não só cor.
- Breakpoint mobile: hamburger com ícone de pergaminho enrolado (SVG personalizado).

**Arquivo:** `components/SiteHeaderWrapper.tsx`, `components/SiteNavLinks.tsx`, CSS correspondente.

### 4b. Landing Page — Hero

**Problema:** sem impacto, CTA fraco, sem sequência narrativa.

**Estrutura proposta:**
1. **Hero:** frase curta (máx 8 palavras), fundo com textura sutil de pedra/couro (CSS noise ou SVG pattern), CTA primário em `--accent`. Sem carrossel. Uma só tela, uma só ideia.
2. **Seção de produto:** screenshot/gif da mesa em ação — mostrar tokens, combate, fichas. Não texto, imagem.
3. **Features:** 3 colunas com ícone grande + título + 2 linhas de texto. Ícones de `EldarinIcons`, coloridos por categoria.
4. **Social proof / call-to-action final:** número de mesas criadas ou personagens, CTA secundário para o compêndio.

**Nota:** substituir texto "MXDRPG" genérico por tagline como *"Sua mesa. Sua história."* ou *"RPG de mesa, direto no browser."*

### 4c. Cards do Compêndio

**Problema:** 224+ itens com ícone único genérico — monótono.

**Solução:**
- Por tipo de item, usar paleta de cor diferente no ícone (`compendiumTypeColor` já existe, só disciplinar).
- Adicionar ícone SVG específico por categoria (Armas → espada, Magias → chama/círculo arcano, Habilidades → raio/estrela, etc.) usando `EldarinIcons`.
- Estado `active` do card: borda lateral esquerda `4px solid var(--accent)` + `background` levemente mais claro — mais impacto que borda full.
- Hover: `translateY(-2px)` + `box-shadow` com `--accent-glow`. Remover o `translateY(-1px)` atual (muito sutil).
- `CompendiumDetail`: quando selecionado, mostrar num drawer lateral direito (CSS: `position: sticky; top: 0; max-height: calc(100vh - 4rem)`) em vez de abaixo do grid.

**Arquivo:** `components/compendium/CompendiumBrowser.tsx`, `compendium.css`.

### 4d. Tipografia nas Páginas Públicas

- Todos os eyebrows: `font-size: var(--text-xs); letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent)`.
- H1 das páginas: `font-size: var(--text-3xl); font-weight: 700; line-height: 1.15`.
- `lead`: `font-size: var(--text-lg); color: var(--text-muted); line-height: 1.65`.
- Remover todas as instâncias de `font-size` inline nos JSX — centralizar nos CSS tokens.

---

## 5. Mesa VTT — Prioridade 2

### 5a. Sistema de Janelas Flutuantes

**Feeling alvo:** Pergaminho digital — borda ornamentada sutil no header da janela, corpo limpo e legível.

**Estrutura visual de cada janela:**

```
┌─────────────────────────────────────┐  ← borda fina --accent (1px)
│ ▪ TÍTULO DA JANELA      [─][□][×]  │  ← header: --chrome-header, font-display uppercase xs
│──────────────────────────────────── │  ← separador --chrome-border-bright
│                                     │
│  corpo da janela — --chrome-surface │
│  padding: 0.75rem 1rem              │
│                                     │
└─────────────────────────────────────┘
```

- **Border:** `1px solid var(--accent)` nas 4 bordas (sutil mas identifica como elemento VTT).
- **Header ornamento:** pseudo-elemento `::before`/`::after` nos cantos do header com SVG de canto tipo Baldur's Gate (polilinha angular, 8x8px, `--accent`). Já existe `--v4-corner` nos cards do compêndio — usar o mesmo padrão.
- **Resize handle:** borda inferior/direita com cor `--accent-dim` ao hover.
- **Box shadow:** `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px var(--chrome-border)`.
- **Fundo do corpo:** `--chrome-surface` (não transparente — as janelas flutuam sobre o mapa).

**Arquivos:** CSS global das janelas flutuantes (procurar `foundry-window`, `vtt-dock`, etc.).

### 5b. Sidebar e Toolbar — Unificação

**Problema atual:** sidebar (`foundry-icon-bar`) tem `width: 3.75rem` com ícones + labels, toolbar do mapa tem `width: 2.6rem` com só ícones. Estilos completamente divergentes.

**Proposta:**

Ambos usam o mesmo "DNA visual":
- Fundo: `--chrome-surface` com `border: 1px solid var(--chrome-border)`.
- `border-radius: 12px`.
- Botões ativos: borda lateral `3px solid var(--accent)` + `background: var(--accent-glow)`.
- Hover: `background: rgba(255,255,255,0.05)` + `transform: scale(1.04)`.
- Separadores entre grupos: linha `1px solid var(--chrome-border)` com margem `0.4rem 0`.

**Sidebar (foundry-icon-bar):**
- Manter labels abaixo dos ícones (já implementado).
- Aumentar contraste das labels: `color: var(--text-muted)` (não mais rgba com opacity).
- Ícone ativo: cor `var(--accent)` (verdigris).

**Toolbar do mapa:**
- Adicionar mini-labels APENAS no tooltip (não abaixo — toolbar é mais estreita).
- Garantir que section-labels `::before`/`::after` usem `--chrome-border-bright`.

### 5c. Ficha de Personagem

**Estilo alvo:** Foundry VTT — ícones marcantes, CA dentro de escudo, modelo atual já bom, só aprimorar.

**Mudanças específicas:**

1. **CA (Classe de Armadura):** renderizar dentro de um `<svg>` de escudo. Escudo path SVG simples, `stroke: var(--accent)`, `fill: var(--chrome-surface)`. Número centralizado dentro.
   ```
   components/character/ — procurar onde CA é exibido
   ```

2. **HP bar:** barra mais grossa (8px), com transição suave de cor: `--color-hp` pleno → laranja → vermelho escuro conforme baixa.

3. **PA (Pontos de Ação):** ícones de ponto/círculo inline em vez de texto numérico. Ex: `●●●○○` onde `●` = PA disponível (cor `--accent`) e `○` = PA gasto.

4. **Seções da ficha:** cada seção (Combate, Habilidades, Inventário, etc.) com eyebrow `font-display uppercase xs` + `color: var(--accent)` + linha separadora `--chrome-border-bright`. Nada de boxes/cards por seção — só divisão visual leve.

5. **Ícones de atributo:** cada atributo (FOR, DES, CON, INT, SAB, CAR) com ícone SVG associado, 16px, cor da escola correspondente.

6. **Tema:** dark completo — fundo `--chrome-surface`, texto `--text`, campos `--chrome-field-bg`. Sem branco, sem cinza claro.

7. **Inventário:** já refinado recentemente. Verificar se cores usam `var()` e não hardcoded.

---

## 6. Tokens de Design Global — Arquivo Central

Criar ou consolidar em `app/globals.css` (ou `styles/tokens.css`):

```css
:root {
  /* Accent novo */
  --accent:         #6B9E8C;
  --accent-dim:     #4A7A6A;
  --accent-warn:    #C97A4A;
  --accent-glow:    rgba(107, 158, 140, 0.18);

  /* Chrome */
  --chrome-bg:          #0e0d0b;
  --chrome-surface:     #1a1916;
  --chrome-header:      #242220;
  --chrome-border:      rgba(255,255,255,0.06);
  --chrome-border-bright: rgba(255,255,255,0.12);

  /* Texto */
  --text-strong:   #ede6d8;
  --text:          #c4bbaa;
  --text-muted:    #8a7d68;
  --text-dim:      #5a5045;

  /* Escala tipográfica */
  --text-xs:    0.7rem;
  --text-sm:    0.82rem;
  --text-base:  0.9rem;
  --text-md:    1rem;
  --text-lg:    1.15rem;
  --text-xl:    1.4rem;
  --text-2xl:   1.75rem;
  --text-3xl:   2.25rem;
  --text-4xl:   3rem;

  /* Cores semânticas */
  --color-hp:      #e05c5c;
  --color-pa:      #6B9E8C;
  --color-magic:   #9b75d4;
  --color-success: #4a9e6a;
  --color-danger:  #c94a4a;
}
```

**IMPORTANTE:** Auditar todos os CSS do projeto e substituir `#c9a962`, `rgba(201,169,98,...)` e variantes pelo novo `--accent`. Buscar com:
```
grep -r "c9a962\|d4a030\|b8922e\|a07c28" --include="*.css" .
```

---

## 7. Ordem de Implementação

### Fase 1 — Tokens (base para tudo, ~2h)
1. Atualizar `app/globals.css` com nova paleta e escala tipográfica
2. Grep e substituir todas as ocorrências do dourado pelos novos tokens
3. Testar visualmente no site e na mesa — nada deve quebrar, só mudar de cor

### Fase 2 — Site público (~4h)
1. **Navbar:** avatar token-style, links com underline verdigris, fundo blur refinado
2. **Landing hero:** reescrever estrutura, 1 frase forte, screenshot da mesa, 3 features
3. **Tipografia:** padronizar eyebrows, h1, lead em todas as páginas públicas
4. **Compêndio:** ícones por tipo, hover com glow, drawer lateral para detalhe

### Fase 3 — Mesa VTT (~6h)
1. **Janelas flutuantes:** header com cantos ornamentados, borda accent, shadow
2. **Sidebar:** unificar DNA visual com toolbar, cores de acento novas
3. **Toolbar do mapa:** consistency pass — mesmo border-radius, mesmos separadores
4. **Ficha:** CA em escudo, HP bar, PA em pontos, dark theme completo, seções com eyebrow

### Fase 4 — Polish (~2h)
1. Focus rings acessíveis (`outline: 2px solid var(--accent); outline-offset: 2px`)
2. Transições consistentes (`transition: 0.15s ease` everywhere)
3. Testar modo escuro em telas pequenas (768px)
4. Testar ficha dentro do VTT (janela flutuante)

---

## 8. Arquivos-Chave para Tocar

| Arquivo | O que mudar |
|---------|-------------|
| `app/globals.css` | Tokens de cor e tipografia — PRIMEIRO |
| `components/vtt/foundry/foundry.css` | Sidebar, botões, labels |
| `components/vtt/whiteboard.css` | Toolbar do mapa |
| `components/compendium/compendium.css` | Cards, grid, detail drawer |
| `components/character/sheet.css` | Ficha dark theme completo |
| `components/SiteHeaderWrapper.tsx` | Navbar |
| CSS das janelas flutuantes | Procurar: `vtt-window`, `dock-panel`, `foundry-window` |
| Landing page | `app/page.tsx` ou `app/(marketing)/page.tsx` |

---

## 9. Notas e Restrições

- **Não criar novos containers HTML** sem necessidade — usar `::before`/`::after` para ornamentos quando possível.
- **Não quebrar a ficha de personagem offline** — a ficha funciona fora da mesa também.
- **CSS custom properties obrigatórias** — zero hardcoded hex fora do `:root`. Facilita futuro tema claro.
- **Animações:** `prefers-reduced-motion` deve desabilitar todas as transições.
- O verdigris `#6B9E8C` foi escolhido como "surpresa" — evoca bronze antigo, mapas velhos, alquimia. Se o dono do produto quiser mudar depois do primeiro teste visual, as alternativas testadas foram: Cobre `#C97A4A` (mais quente), Crimson `#8B3A3A` (mais sombrio), Âmbar `#B87333` (ouro refinado).
