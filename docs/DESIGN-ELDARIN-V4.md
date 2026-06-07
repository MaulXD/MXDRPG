# Design Eldarin — v4
> Complementa `DESIGN-ATUAL.md` (v3). Este documento cobre apenas os elementos visuais novos ou reescritos na v4: molduras de retratos, HUD de combate, cards e superfícies, chips de status, separadores e convenções de uso. **Não altera tokens CSS existentes.**

---

## 4. Molduras de retratos

Cada retrato usa um `<div class="portrait">` com dois filhos em camadas:

```html
<div class="portrait">
  <!-- z-index: 0 — imagem ou iniciais ficam abaixo -->
  <div class="portrait-inner">
    <img src="..." alt="Nome do personagem" />
    <!-- fallback: -->
    <span class="portrait-initials">AC</span>
  </div>

  <!-- z-index: 1 — SVG da moldura sempre acima da imagem -->
  <svg class="portrait-frame" viewBox="0 0 80 80" fill="none">
    <!-- código da variante abaixo -->
  </svg>
</div>
```

```css
.portrait {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}
.portrait-inner {
  position: absolute;
  inset: 7px;
  background: var(--surface-raised);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 0;
}
.portrait-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.portrait-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* SEMPRE acima da imagem */
  pointer-events: none;
}
.portrait-initials {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-muted);
  user-select: none;
}
```

---

### 4.1 Herói (jogador) — Moldura Gótica Âmbar

Cor: `#d4a030` (âmbar). Triplo filete, arco ogival nos cantos, ponto dourado no vértice, losangos nos eixos, entalhes curtos.

```svg
<svg class="portrait-frame" viewBox="0 0 80 80" fill="none">
  <!-- filetes -->
  <rect x="4" y="4" width="72" height="72" stroke="#8a6020" stroke-width="0.5"/>
  <rect x="7" y="7" width="66" height="66" stroke="#d4a030" stroke-width="1.2"/>
  <rect x="10" y="10" width="60" height="60" stroke="#8a6020" stroke-width="0.5"/>

  <!-- canto TL -->
  <path d="M7,20 L7,7 L20,7" fill="none" stroke="#d4a030" stroke-width="2.5" stroke-linecap="square"/>
  <path d="M7,7 Q7,16 16,16 Q16,7 7,7Z" fill="#d4a030" opacity="0.25"/>
  <path d="M7,7 Q7,16 16,16 Q16,7 7,7Z" fill="none" stroke="#d4a030" stroke-width="1"/>
  <circle cx="7" cy="7" r="2.5" fill="#d4a030"/>

  <!-- canto TR -->
  <path d="M73,20 L73,7 L60,7" fill="none" stroke="#d4a030" stroke-width="2.5" stroke-linecap="square"/>
  <path d="M73,7 Q73,16 64,16 Q64,7 73,7Z" fill="#d4a030" opacity="0.25"/>
  <path d="M73,7 Q73,16 64,16 Q64,7 73,7Z" fill="none" stroke="#d4a030" stroke-width="1"/>
  <circle cx="73" cy="7" r="2.5" fill="#d4a030"/>

  <!-- canto BL -->
  <path d="M7,60 L7,73 L20,73" fill="none" stroke="#d4a030" stroke-width="2.5" stroke-linecap="square"/>
  <path d="M7,73 Q7,64 16,64 Q16,73 7,73Z" fill="#d4a030" opacity="0.25"/>
  <path d="M7,73 Q7,64 16,64 Q16,73 7,73Z" fill="none" stroke="#d4a030" stroke-width="1"/>
  <circle cx="7" cy="73" r="2.5" fill="#d4a030"/>

  <!-- canto BR -->
  <path d="M73,60 L73,73 L60,73" fill="none" stroke="#d4a030" stroke-width="2.5" stroke-linecap="square"/>
  <path d="M73,73 Q73,64 64,64 Q64,73 73,73Z" fill="#d4a030" opacity="0.25"/>
  <path d="M73,73 Q73,64 64,64 Q64,73 73,73Z" fill="none" stroke="#d4a030" stroke-width="1"/>
  <circle cx="73" cy="73" r="2.5" fill="#d4a030"/>

  <!-- losangos nos eixos -->
  <polygon points="40,2 43,5 40,8 37,5" fill="#d4a030"/>
  <polygon points="40,72 43,75 40,78 37,75" fill="#d4a030"/>
  <polygon points="2,40 5,43 8,40 5,37" fill="#d4a030"/>
  <polygon points="72,40 75,43 78,40 75,37" fill="#d4a030"/>

  <!-- entalhes curtos (1.5px para dentro) -->
  <line x1="28" y1="7" x2="28" y2="5.5" stroke="#d4a030" stroke-width="0.8" opacity=".6"/>
  <line x1="52" y1="7" x2="52" y2="5.5" stroke="#d4a030" stroke-width="0.8" opacity=".6"/>
  <line x1="28" y1="73" x2="28" y2="74.5" stroke="#d4a030" stroke-width="0.8" opacity=".6"/>
  <line x1="52" y1="73" x2="52" y2="74.5" stroke="#d4a030" stroke-width="0.8" opacity=".6"/>
  <line x1="7" y1="28" x2="5.5" y2="28" stroke="#d4a030" stroke-width="0.8" opacity=".6"/>
  <line x1="7" y1="52" x2="5.5" y2="52" stroke="#d4a030" stroke-width="0.8" opacity=".6"/>
  <line x1="73" y1="28" x2="74.5" y2="28" stroke="#d4a030" stroke-width="0.8" opacity=".6"/>
  <line x1="73" y1="52" x2="74.5" y2="52" stroke="#d4a030" stroke-width="0.8" opacity=".6"/>
</svg>
```

---

### 4.2 Monstro (tier 1) — Moldura Ferrugem

Cor: `#6a5040`. Cantos em L simples com pontinho quadrado. Sem ornamento — inimigo comum descartável.

```svg
<svg class="portrait-frame" viewBox="0 0 80 80" fill="none">
  <rect x="6" y="6" width="68" height="68" stroke="#5a4030" stroke-width="1"/>
  <rect x="9" y="9" width="62" height="62" stroke="#3a2510" stroke-width="0.5"/>

  <!-- cantos: L com quadrado no vértice -->
  <line x1="6" y1="6" x2="18" y2="6" stroke="#6a5040" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="6" y1="6" x2="6" y2="18" stroke="#6a5040" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="74" y1="6" x2="62" y2="6" stroke="#6a5040" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="74" y1="6" x2="74" y2="18" stroke="#6a5040" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="6" y1="74" x2="18" y2="74" stroke="#6a5040" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="6" y1="74" x2="6" y2="62" stroke="#6a5040" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="74" y1="74" x2="62" y2="74" stroke="#6a5040" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="74" y1="74" x2="74" y2="62" stroke="#6a5040" stroke-width="1.5" stroke-linecap="square"/>

  <!-- pontos nos vértices -->
  <rect x="4.5" y="4.5" width="3" height="3" fill="#6a5040"/>
  <rect x="72.5" y="4.5" width="3" height="3" fill="#6a5040"/>
  <rect x="4.5" y="72.5" width="3" height="3" fill="#6a5040"/>
  <rect x="72.5" y="72.5" width="3" height="3" fill="#6a5040"/>
</svg>
```

---

### 4.3 Elite (tier 2) — Moldura Prata Fria

Cor: `#7aa3c9`. Cantos em L com espinho diagonal e ponto no vértice. Marcas nos eixos. Visual cortante.

```svg
<svg class="portrait-frame" viewBox="0 0 80 80" fill="none">
  <rect x="7" y="7" width="66" height="66" stroke="#4a6080" stroke-width="1"/>
  <rect x="10" y="10" width="60" height="60" stroke="#2a3a50" stroke-width="0.5"/>

  <!-- TL: L + espinho + ponto -->
  <line x1="4" y1="7" x2="20" y2="7" stroke="#7aa3c9" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="7" y1="4" x2="7" y2="20" stroke="#7aa3c9" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="7" y1="7" x2="13" y2="13" stroke="#7aa3c9" stroke-width="1" opacity=".6"/>
  <circle cx="7" cy="7" r="2" fill="#7aa3c9"/>

  <!-- TR -->
  <line x1="76" y1="7" x2="60" y2="7" stroke="#7aa3c9" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="73" y1="4" x2="73" y2="20" stroke="#7aa3c9" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="73" y1="7" x2="67" y2="13" stroke="#7aa3c9" stroke-width="1" opacity=".6"/>
  <circle cx="73" cy="7" r="2" fill="#7aa3c9"/>

  <!-- BL -->
  <line x1="4" y1="73" x2="20" y2="73" stroke="#7aa3c9" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="7" y1="76" x2="7" y2="60" stroke="#7aa3c9" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="7" y1="73" x2="13" y2="67" stroke="#7aa3c9" stroke-width="1" opacity=".6"/>
  <circle cx="7" cy="73" r="2" fill="#7aa3c9"/>

  <!-- BR -->
  <line x1="76" y1="73" x2="60" y2="73" stroke="#7aa3c9" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="73" y1="76" x2="73" y2="60" stroke="#7aa3c9" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="73" y1="73" x2="67" y2="67" stroke="#7aa3c9" stroke-width="1" opacity=".6"/>
  <circle cx="73" cy="73" r="2" fill="#7aa3c9"/>

  <!-- marcas de eixo -->
  <line x1="40" y1="7" x2="40" y2="4" stroke="#4a6080" stroke-width="1"/>
  <line x1="40" y1="73" x2="40" y2="76" stroke="#4a6080" stroke-width="1"/>
  <line x1="7" y1="40" x2="4" y2="40" stroke="#4a6080" stroke-width="1"/>
  <line x1="73" y1="40" x2="76" y2="40" stroke="#4a6080" stroke-width="1"/>
</svg>
```

---

### 4.4 Minichefe (tier 3) — Moldura Arcana

Cor: `#8060c0`. Triângulo lança nos cantos em roxo, losangos arcanos nos eixos, entalhes finos. Presença forte.

```svg
<svg class="portrait-frame" viewBox="0 0 80 80" fill="none">
  <rect x="4" y="4" width="72" height="72" stroke="#3a2860" stroke-width="0.5"/>
  <rect x="7" y="7" width="66" height="66" stroke="#8060c0" stroke-width="1.2"/>
  <rect x="10" y="10" width="60" height="60" stroke="#3a2860" stroke-width="0.5"/>

  <!-- cantos: triângulo lança -->
  <polygon points="7,7 20,7 7,20" fill="#12101e" stroke="#8060c0" stroke-width="1"/>
  <polygon points="7,7 16,7 7,16" fill="#8060c0" opacity=".9"/>
  <polygon points="73,7 60,7 73,20" fill="#12101e" stroke="#8060c0" stroke-width="1"/>
  <polygon points="73,7 64,7 73,16" fill="#8060c0" opacity=".9"/>
  <polygon points="7,73 20,73 7,60" fill="#12101e" stroke="#8060c0" stroke-width="1"/>
  <polygon points="7,73 16,73 7,64" fill="#8060c0" opacity=".9"/>
  <polygon points="73,73 60,73 73,60" fill="#12101e" stroke="#8060c0" stroke-width="1"/>
  <polygon points="73,73 64,73 73,64" fill="#8060c0" opacity=".9"/>

  <!-- losangos arcanos nos eixos -->
  <polygon points="40,2 44,6 40,10 36,6" fill="#8060c0"/>
  <polygon points="40,70 44,74 40,78 36,74" fill="#8060c0"/>
  <polygon points="2,40 6,44 10,40 6,36" fill="#8060c0"/>
  <polygon points="70,40 74,44 78,40 74,36" fill="#8060c0"/>

  <!-- entalhes finos -->
  <line x1="28" y1="7" x2="28" y2="5.5" stroke="#8060c0" stroke-width="0.8" opacity=".5"/>
  <line x1="52" y1="7" x2="52" y2="5.5" stroke="#8060c0" stroke-width="0.8" opacity=".5"/>
  <line x1="28" y1="73" x2="28" y2="74.5" stroke="#8060c0" stroke-width="0.8" opacity=".5"/>
  <line x1="52" y1="73" x2="52" y2="74.5" stroke="#8060c0" stroke-width="0.8" opacity=".5"/>
  <line x1="7" y1="28" x2="5.5" y2="28" stroke="#8060c0" stroke-width="0.8" opacity=".5"/>
  <line x1="7" y1="52" x2="5.5" y2="52" stroke="#8060c0" stroke-width="0.8" opacity=".5"/>
  <line x1="73" y1="28" x2="74.5" y2="28" stroke="#8060c0" stroke-width="0.8" opacity=".5"/>
  <line x1="73" y1="52" x2="74.5" y2="52" stroke="#8060c0" stroke-width="0.8" opacity=".5"/>
</svg>
```

---

### 4.5 Boss (tier 4) — Moldura Escarlate

Cor: `#c0392b`. Triplo filete, triângulo + arco gótico híbrido, losangos maiores, entalhes duplos. O mais ornamentado.

```svg
<svg class="portrait-frame" viewBox="0 0 80 80" fill="none">
  <!-- triplo filete -->
  <rect x="2" y="2" width="76" height="76" stroke="#5a1010" stroke-width="0.5"/>
  <rect x="5" y="5" width="70" height="70" stroke="#c0392b" stroke-width="0.8"/>
  <rect x="7" y="7" width="66" height="66" stroke="#e05040" stroke-width="1.5"/>
  <rect x="10" y="10" width="60" height="60" stroke="#5a1010" stroke-width="0.5"/>

  <!-- TL: triângulo + arco gótico + ponto -->
  <polygon points="7,7 22,7 7,22" fill="#180808" stroke="#c0392b" stroke-width="1"/>
  <path d="M7,7 Q7,17 17,17 Q17,7 7,7Z" fill="#c0392b" opacity="0.3"/>
  <path d="M7,7 Q7,17 17,17 Q17,7 7,7Z" fill="none" stroke="#e05040" stroke-width="1"/>
  <line x1="2" y1="7" x2="7" y2="7" stroke="#c0392b" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="7" y1="2" x2="7" y2="7" stroke="#c0392b" stroke-width="1.5" stroke-linecap="square"/>
  <circle cx="7" cy="7" r="3" fill="#c0392b"/>

  <!-- TR -->
  <polygon points="73,7 58,7 73,22" fill="#180808" stroke="#c0392b" stroke-width="1"/>
  <path d="M73,7 Q73,17 63,17 Q63,7 73,7Z" fill="#c0392b" opacity="0.3"/>
  <path d="M73,7 Q73,17 63,17 Q63,7 73,7Z" fill="none" stroke="#e05040" stroke-width="1"/>
  <line x1="78" y1="7" x2="73" y2="7" stroke="#c0392b" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="73" y1="2" x2="73" y2="7" stroke="#c0392b" stroke-width="1.5" stroke-linecap="square"/>
  <circle cx="73" cy="7" r="3" fill="#c0392b"/>

  <!-- BL -->
  <polygon points="7,73 22,73 7,58" fill="#180808" stroke="#c0392b" stroke-width="1"/>
  <path d="M7,73 Q7,63 17,63 Q17,73 7,73Z" fill="#c0392b" opacity="0.3"/>
  <path d="M7,73 Q7,63 17,63 Q17,73 7,73Z" fill="none" stroke="#e05040" stroke-width="1"/>
  <line x1="2" y1="73" x2="7" y2="73" stroke="#c0392b" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="7" y1="78" x2="7" y2="73" stroke="#c0392b" stroke-width="1.5" stroke-linecap="square"/>
  <circle cx="7" cy="73" r="3" fill="#c0392b"/>

  <!-- BR -->
  <polygon points="73,73 58,73 73,58" fill="#180808" stroke="#c0392b" stroke-width="1"/>
  <path d="M73,73 Q73,63 63,63 Q63,73 73,73Z" fill="#c0392b" opacity="0.3"/>
  <path d="M73,73 Q73,63 63,63 Q63,73 73,73Z" fill="none" stroke="#e05040" stroke-width="1"/>
  <line x1="78" y1="73" x2="73" y2="73" stroke="#c0392b" stroke-width="1.5" stroke-linecap="square"/>
  <line x1="73" y1="78" x2="73" y2="73" stroke="#c0392b" stroke-width="1.5" stroke-linecap="square"/>
  <circle cx="73" cy="73" r="3" fill="#c0392b"/>

  <!-- losangos maiores nos eixos -->
  <polygon points="40,0 44,4 40,8 36,4" fill="#c0392b"/>
  <polygon points="40,72 44,76 40,80 36,76" fill="#c0392b"/>
  <polygon points="0,40 4,44 8,40 4,36" fill="#c0392b"/>
  <polygon points="72,40 76,44 80,40 76,36" fill="#c0392b"/>

  <!-- entalhes duplos -->
  <line x1="26" y1="7" x2="26" y2="4.5" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="28" y1="7" x2="28" y2="4.5" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="52" y1="7" x2="52" y2="4.5" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="54" y1="7" x2="54" y2="4.5" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="26" y1="73" x2="26" y2="75.5" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="28" y1="73" x2="28" y2="75.5" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="52" y1="73" x2="52" y2="75.5" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="54" y1="73" x2="54" y2="75.5" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="7" y1="26" x2="4.5" y2="26" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="7" y1="28" x2="4.5" y2="28" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="7" y1="52" x2="4.5" y2="52" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="7" y1="54" x2="4.5" y2="54" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="73" y1="26" x2="75.5" y2="26" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="73" y1="28" x2="75.5" y2="28" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="73" y1="52" x2="75.5" y2="52" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
  <line x1="73" y1="54" x2="75.5" y2="54" stroke="#c0392b" stroke-width="0.8" opacity=".7"/>
</svg>
```

### 4.6 Tabela resumo de molduras

| Tier | Classe CSS | Cor principal | Ornamento | Filetes | Entalhes |
|------|-----------|---------------|-----------|---------|----------|
| Herói | `.portrait-frame--hero` | `#d4a030` | Arco gótico + ponto | Triplo | Simples 1.5px |
| Monstro | `.portrait-frame--monster` | `#6a5040` | L simples + quadrado | Duplo | Nenhum |
| Elite | `.portrait-frame--elite` | `#7aa3c9` | L + espinho diagonal | Duplo | Eixo único |
| Minichefe | `.portrait-frame--miniboss` | `#8060c0` | Lança + losango | Triplo | Simples |
| Boss | `.portrait-frame--boss` | `#c0392b` | Lança + gótico + ponto | Quádruplo | Duplos |

---

## 5. HUD de combate (`CharacterCombatHud`)

### 5.1 Estrutura HTML

```html
<!-- chips de efeito FORA e ACIMA do card -->
<div class="vtt-hud-effects">
  <!-- ver seção 7 para chips de condição -->
</div>

<div class="vtt-combat-hud [vtt-combat-hud--your-turn]">
  <!-- quinas ornamentais em L (âmbar) -->
  <svg class="hud-corner hud-corner--tl" .../>
  <svg class="hud-corner hud-corner--tr" .../>
  <svg class="hud-corner hud-corner--bl" .../>
  <svg class="hud-corner hud-corner--br" .../>

  <!-- retrato quadrado com margem e moldura gótica -->
  <div class="hud-portrait-wrap">
    <div class="portrait portrait--hud">
      <div class="portrait-inner"> ... </div>
      <svg class="portrait-frame portrait-frame--hero"> ... </svg>
    </div>
  </div>

  <!-- divisor vertical -->
  <div class="hud-divider"></div>

  <!-- corpo central -->
  <div class="hud-body">
    <div class="hud-name-row">
      <span class="hud-name">Nome do Personagem</span>
      <span class="hud-hp">88 <span class="hud-hp-sep">/</span> 120</span>
    </div>
    <div class="hud-hp-track">
      <div class="hud-hp-fill" style="width: 73%"></div>
    </div>
    <div class="hud-stats">
      <!-- escudo CA -->
      <div class="hud-ca">
        <div class="hud-ca-shield">
          <svg>...</svg>
          <span class="hud-ca-value">18</span>
        </div>
        <span class="hud-ca-label">CA</span>
      </div>
      <!-- pool de PA -->
      <div class="hud-pa">
        <span class="hud-pa-label">PA</span>
        <div class="hud-pa-dots">
          <!-- sempre 9 dots; preenchidos = PA disponíveis no turno -->
          <div class="hud-pa-dot hud-pa-dot--on"></div>
          <!-- ... 9 total -->
        </div>
      </div>
    </div>
  </div>

  <!-- ações direita -->
  <div class="hud-actions">
    <button class="hud-btn">
      <!-- ícone SVG -->
      <span class="hud-btn-label">Ficha</span>
    </button>
    <button class="hud-btn">
      <!-- ícone SVG -->
      <span class="hud-btn-label">Passar</span>
    </button>
  </div>
</div>
```

### 5.2 CSS

```css
/* wrapper externo — chips acima, card abaixo */
.vtt-hud-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vtt-hud-effects {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding-left: 2px;
}

/* card principal */
.vtt-combat-hud {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border-accent);
  border-radius: 2px;
  display: flex;
  align-items: stretch;
}

/* turno ativo: borda e quinas em âmbar reforçado */
.vtt-combat-hud--your-turn {
  border-color: var(--accent-warn);
}

/* quinas L */
.hud-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  overflow: visible;
  pointer-events: none;
}
.hud-corner--tl { top: -2px; left: -2px; }
.hud-corner--tr { top: -2px; right: -2px; }
.hud-corner--bl { bottom: -2px; left: -2px; }
.hud-corner--br { bottom: -2px; right: -2px; }

/* retrato quadrado com margem */
.hud-portrait-wrap {
  padding: 8px 0 8px 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.portrait--hud {
  width: 72px;
  height: 72px;
}

/* divisor */
.hud-divider {
  width: 1px;
  background: var(--border-accent);
  margin: 8px 0 8px 8px;
  flex-shrink: 0;
}

/* corpo */
.hud-body {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-width: 0;
}

.hud-name-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.hud-name {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* HP: sempre verde, sem variação por valor */
.hud-hp {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-success);
  white-space: nowrap;
  flex-shrink: 0;
}
.hud-hp-sep {
  color: var(--text-dim);
  font-size: 11px;
}

/* barra HP: sempre verde */
.hud-hp-track {
  height: 5px;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.hud-hp-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--accent-success); /* nunca muda de cor */
}

/* stats */
.hud-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* CA */
.hud-ca { display: flex; align-items: center; gap: 5px; }
.hud-ca-shield {
  position: relative;
  width: 28px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hud-ca-shield svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.hud-ca-value {
  position: relative;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  z-index: 1;
}
.hud-ca-label {
  font-family: var(--font-display);
  font-size: 9px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-dim);
}

/* PA — sempre 9 dots em linha única */
.hud-pa { display: flex; align-items: center; gap: 5px; }
.hud-pa-label {
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.hud-pa-dots { display: flex; gap: 3px; }
.hud-pa-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid var(--accent-warn-dim, #8a6020);
  flex-shrink: 0;
}
.hud-pa-dot--on {
  background: var(--accent-warn);
  border-color: var(--accent-warn);
}

/* ações */
.hud-actions {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-accent);
  flex-shrink: 0;
}
.hud-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  background: transparent;
  border: none;
  gap: 2px;
  cursor: pointer;
  transition: background .15s;
}
.hud-btn:hover { background: #2a1a10; }
.hud-btn + .hud-btn { border-top: 1px solid var(--border); }
.hud-btn-label {
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-muted);
  white-space: nowrap;
}

/* turno ativo: botão passar destaca em âmbar */
.vtt-combat-hud--your-turn .hud-btn--pass .hud-btn-label,
.vtt-combat-hud--your-turn .hud-btn--pass svg {
  color: var(--accent-warn);
}

/* escudo CA: borda âmbar no turno ativo */
.vtt-combat-hud--your-turn .hud-ca-shield path {
  stroke: var(--accent-warn);
}
```

### 5.3 SVG das quinas do HUD

```svg
<!-- TL -->
<svg class="hud-corner hud-corner--tl" viewBox="0 0 18 18" overflow="visible">
  <polyline points="16,2 2,2 2,16" fill="none" stroke="#d4a030" stroke-width="2" stroke-linecap="square"/>
</svg>
<!-- TR -->
<svg class="hud-corner hud-corner--tr" viewBox="0 0 18 18" overflow="visible">
  <polyline points="2,2 16,2 16,16" fill="none" stroke="#d4a030" stroke-width="2" stroke-linecap="square"/>
</svg>
<!-- BL -->
<svg class="hud-corner hud-corner--bl" viewBox="0 0 18 18" overflow="visible">
  <polyline points="16,16 2,16 2,2" fill="none" stroke="#d4a030" stroke-width="2" stroke-linecap="square"/>
</svg>
<!-- BR -->
<svg class="hud-corner hud-corner--br" viewBox="0 0 18 18" overflow="visible">
  <polyline points="2,16 16,16 16,2" fill="none" stroke="#d4a030" stroke-width="2" stroke-linecap="square"/>
</svg>
```

> No turno ativo usar `stroke-width="2.5"` nas quinas.

---

## 6. Cards e superfícies

### 6.1 Card ornamental escuro (padrão)

Usado em painéis, fichas, cards do compêndio e todos os cards do site.

```html
<div class="ornament-card">
  <!-- quinas L em cada canto -->
  <svg class="card-corner card-corner--tl" viewBox="0 0 18 18" overflow="visible">
    <polyline points="16,2 2,2 2,16" fill="none" stroke="#d4a030" stroke-width="2" stroke-linecap="square"/>
  </svg>
  <svg class="card-corner card-corner--tr" viewBox="0 0 18 18" overflow="visible">
    <polyline points="2,2 16,2 16,16" fill="none" stroke="#d4a030" stroke-width="2" stroke-linecap="square"/>
  </svg>
  <svg class="card-corner card-corner--bl" viewBox="0 0 18 18" overflow="visible">
    <polyline points="16,16 2,16 2,2" fill="none" stroke="#d4a030" stroke-width="2" stroke-linecap="square"/>
  </svg>
  <svg class="card-corner card-corner--br" viewBox="0 0 18 18" overflow="visible">
    <polyline points="2,16 16,16 16,2" fill="none" stroke="#d4a030" stroke-width="2" stroke-linecap="square"/>
  </svg>

  <!-- conteúdo -->
</div>
```

```css
.ornament-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border-accent);
  border-radius: 2px;
  padding: 1.25rem;
}

.card-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  overflow: visible;
  pointer-events: none;
}
.card-corner--tl { top: -2px;    left: -2px;   }
.card-corner--tr { top: -2px;    right: -2px;  }
.card-corner--bl { bottom: -2px; left: -2px;   }
.card-corner--br { bottom: -2px; right: -2px;  }
```

### 6.2 Card pergaminho (compêndio / lore)

```html
<div class="ornament-card ornament-card--parchment">
  <!-- mesmas quinas, cor #8a6020 -->
  <svg class="card-corner card-corner--tl" viewBox="0 0 18 18" overflow="visible">
    <polyline points="16,2 2,2 2,16" fill="none" stroke="#8a6020" stroke-width="2" stroke-linecap="square"/>
  </svg>
  <!-- ... demais cantos -->
</div>
```

```css
.ornament-card--parchment {
  background: var(--parchment, #f4ead8);
  border-color: #c8a060;
  color: #2a1a0a;
}
```

---

## 7. Chips de condição / status

### 7.1 Estrutura

```html
<div class="condition-chip condition-chip--[variante]">
  <svg class="condition-chip__icon" viewBox="0 0 12 12" fill="none">
    <!-- ícone SVG da condição -->
  </svg>
  <span class="condition-chip__label">Nome</span>

  <!-- tooltip aparece no hover -->
  <div class="condition-chip__tooltip">
    <div class="condition-chip__tooltip-name">Nome da Condição</div>
    <div class="condition-chip__tooltip-desc">Descrição das penalidades e efeitos mecânicos.</div>
    <div class="condition-chip__tooltip-turns">Duração: N turnos restantes</div>
  </div>
</div>
```

### 7.2 CSS

```css
.condition-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px 3px 7px;
  border-radius: 2px;
  border: 1px solid;
  cursor: default;
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.condition-chip__icon { width: 12px; height: 12px; flex-shrink: 0; }

/* tooltip */
.condition-chip__tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  min-width: 180px;
  background: #1a1208;
  border: 1px solid var(--border-accent);
  border-radius: 3px;
  padding: 8px 10px;
  z-index: 99;
  pointer-events: none;
}
.condition-chip:hover .condition-chip__tooltip { display: block; }

.condition-chip__tooltip-name {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}
.condition-chip__tooltip-desc {
  font-family: var(--font-body);
  font-size: 11px;
  font-style: italic;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 4px;
}
.condition-chip__tooltip-turns {
  font-family: var(--font-display);
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: .08em;
}
```

### 7.3 Variantes de cor

| Variante | Classe | Background | Borda | Texto |
|----------|--------|-----------|-------|-------|
| Negativo/perigo | `--danger` | `#1a0808` | `#4a1818` | `#e07070` |
| Positivo/buff | `--success` | `#0a1a08` | `#1a4a18` | `#7ab86a` |
| Aviso/debuff | `--warn` | `#1a1000` | `#4a3010` | `#d4a030` |
| Informação | `--info` | `#0a1020` | `#1a3050` | `#7aa3c9` |

```css
.condition-chip--danger { background: #1a0808; border-color: #4a1818; color: #e07070; }
.condition-chip--success { background: #0a1a08; border-color: #1a4a18; color: #7ab86a; }
.condition-chip--warn    { background: #1a1000; border-color: #4a3010; color: #d4a030; }
.condition-chip--info    { background: #0a1020; border-color: #1a3050; color: #7aa3c9; }
```

### 7.4 Ícones SVG por condição

Cada condição tem um ícone SVG 12×12 desenhado na cor do chip (`currentColor`).

```svg
<!-- Atordoado: X dentro de círculo -->
<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
  <circle cx="6" cy="6" r="5"/>
  <line x1="4" y1="4" x2="8" y2="8"/>
  <line x1="8" y1="4" x2="4" y2="8"/>
</svg>

<!-- Inspirado: estrela -->
<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5"/>
</svg>

<!-- Envenenado: gota -->
<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
  <path d="M6 1 C6 1 9 3 9 6.5 C9 9 7.5 11 6 11 C4.5 11 3 9 3 6.5 C3 3 6 1 6 1Z"/>
  <path d="M4.5 6 Q6 4.5 7.5 6"/>
</svg>

<!-- Amedrontado: olho fechado -->
<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
  <path d="M1 6 Q6 1 11 6"/>
  <line x1="1" y1="6" x2="11" y2="6"/>
  <line x1="4" y1="7.5" x2="4" y2="9"/>
  <line x1="6" y1="8" x2="6" y2="10"/>
  <line x1="8" y1="7.5" x2="8" y2="9"/>
</svg>

<!-- Paralisado: raio/trovão -->
<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="7,1 4,6 7,6 5,11"/>
</svg>

<!-- Invisível: olho aberto com traço -->
<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
  <path d="M1 6 Q6 2 11 6 Q6 10 1 6Z"/>
  <circle cx="6" cy="6" r="1.5"/>
  <line x1="2" y1="2" x2="10" y2="10" stroke-width="1" opacity=".6"/>
</svg>

<!-- Concentrado: alvo/círculo com ponto -->
<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
  <circle cx="6" cy="6" r="4.5"/>
  <circle cx="6" cy="6" r="2"/>
  <circle cx="6" cy="6" r="0.8" fill="currentColor"/>
</svg>

<!-- Caído: seta para baixo -->
<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
  <line x1="6" y1="1" x2="6" y2="9"/>
  <polyline points="3,7 6,10 9,7"/>
  <line x1="3" y1="11" x2="9" y2="11"/>
</svg>
```

---

## 8. Separadores de seção

```html
<div class="section-divider">
  <div class="section-divider__line"></div>
  <div class="section-divider__gem"></div>
  <span class="section-divider__title">Nome da Seção</span>
  <div class="section-divider__gem"></div>
  <div class="section-divider__line"></div>
</div>
```

```css
/* sem alterações em relação ao v3 — mantido por referência */
.section-divider {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bg-deep);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.section-divider__line  { flex: 1; height: 1px; background: var(--border-accent); }
.section-divider__gem   { width: 5px; height: 5px; background: #8a6020; transform: rotate(45deg); flex-shrink: 0; }
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

---

## 9. Convenções de uso — v4

### Cores por contexto

| Cor | Token | Usar para | Nunca usar para |
|-----|-------|-----------|-----------------|
| Âmbar `#d4a030` | `--accent-warn` | Quinas ornamentais, dots de PA, subtítulos de cards, turno ativo, losangos | Texto de erro, dano |
| Escarlate `#c0392b` | `--accent` | Botões de ação primária, moldura Boss, HP crítico (<20%), indicador de turno ativo em inimigos | Texto corrido, subtítulos de card, decoração passiva |
| Verde `#6b9e5a` | `--accent-success` | HP (texto e barra) sempre, cura, buffs de saúde | Nunca mudar de cor por threshold de HP |
| Prata `#7aa3c9` | `--accent-primary` | Mesa VTT (herdado v3), chips info, moldura Elite | Cards do site, ornamentos de herói |
| Roxo `#8060c0` | — | Moldura Minichefe, classe mago/arcano | Elementos gerais de UI |

### Regras obrigatórias

1. **HP sempre verde** — a cor do HP (texto e barra) não muda por threshold. Sem variação amarela ou vermelha.
2. **PA sempre 9 dots** — independente de quantos PA o personagem ganha por turno, o pool visual é sempre 9 dots. Dots preenchidos = PA disponíveis.
3. **Chips de condição fora do card** — os chips ficam em `.vtt-hud-effects` acima do `.vtt-combat-hud`, nunca dentro do layout interno do HUD.
4. **SVG da moldura sempre z-index > imagem** — `portrait-frame` deve ter `z-index: 1` e `portrait-inner` deve ter `z-index: 0`.
5. **Quinas em L** — todos os cards do site usam quinas SVG em L (não diagonal, não arredondadas). Cor âmbar `#d4a030` nos temas escuros, dourado envelhecido `#8a6020` nos cards pergaminho.
6. **Escarlate só em ação/perigo** — nunca usar `#c0392b` como cor de subtítulo ou label em cards passivos.
7. **Sem emojis** — usar apenas SVG inline ou `MesaRailIcon` (herdado v3).
8. **Contraste WCAG AA** — qualquer texto lido durante sessão deve ter contraste mínimo 4.5:1 (herdado v3).

### Mapeamento de moldura por tier

```ts
export function getPortraitFrameClass(tier: 'hero' | 'monster' | 'elite' | 'miniboss' | 'boss') {
  const map = {
    hero:     'portrait-frame--hero',
    monster:  'portrait-frame--monster',
    elite:    'portrait-frame--elite',
    miniboss: 'portrait-frame--miniboss',
    boss:     'portrait-frame--boss',
  }
  return map[tier]
}
```

---

*Documento gerado em junho 2026 — v4. Complementa `DESIGN-ATUAL.md` (v3). Não substituir tokens de `globals.css`.*
