# Contexto da Sessão Atual — Eldarin VTT

> Criado pelo Claude em 2026-06-20. Serve para que Cursor / Open Code / outro LLM retome o trabalho sem perder contexto.  
> Referência completa do projeto: [CLAUDE-PROJETO.md](./CLAUDE-PROJETO.md) · [CLAUDE-CODIGO-SEGURO.md](./CLAUDE-CODIGO-SEGURO.md) · [HISTORICO.md](./HISTORICO.md)

---

## Branch ativa

`cursor/dice-box-combat` — 6 commits à frente de `main`. **PR #3 aberto** em `github.com/MaulXD/MXDRPG/pull/3`.

---

## O que foi feito nesta sessão

### 1. Transição Combate ↔ Aventura — redesign completo

**Arquivos:**
- `components/vtt/CombatModeTransition.tsx`
- `components/vtt/combat-mode-transition.css`

**Comportamento anterior:** espadas cruzando (mode `cmt--in-clash`) → bússola SVG (mode `cmt--out-adventure`). Estrutura com vignette, dim, flash, múltiplas camadas.

**Comportamento novo:**
- **Modo Combate** (`phase === "in"`, classe `cmt--combat`): névoa vermelha (`radial-gradient` carmesim), 18 brasas subindo com posição/tamanho/timing variados inline, label "Combate Ativado" em dourado com glow laranja.
- **Modo Aventura** (`phase === "out"`, classe `cmt--adventure`): névoa azul índigo, label "Modo Aventura" fade-in suave → fade-out suave.

**Detalhes técnicos importantes:**
- Brasas: array `EMBERS` no TSX, cada ember tem `{ left, size, dur, delay, dx }`. O `dx` é passado como CSS custom property `--cmt-ember-dx` via inline style para o keyframe `cmt-ember-rise` usar `translateX(var(--cmt-ember-dx, 0px))`.
- As brasas SÓ animam quando `.cmt--combat.cmt-overlay--playing` está ativo — assim não disparam antes do overlay aparecer.
- Duração total: `--cmt-total: 2.3s` (alinhado com `COMBAT_MODE_TRANSITION_DURATION_MS = 2300` no hook).
- UI desbloqueia em 400ms (`COMBAT_MODE_TRANSITION_LOCK_MS`) — muito antes da animação terminar. Isso é intencional.

---

### 2. Dados 3D dice-box no combate (branch inteira)

**Arquivos principais:**
- `components/vtt/DiceCombatPanel.tsx` — usa `@3d-dice/dice-box` via vendor bundle (`/vendor/dice-box/dice-box.es.min.js`), dois slots (ataque + dano), pré-carrega bundle no mount.
- `components/vtt/DiceWebGL.tsx` — renderer Three.js customizado: IcosahedronGeometry (D20), OctahedronGeometry (D8), DodecahedronGeometry (D12), etc. Modos: `"idle" | "rolling" | "landing" | "settled"`. Idle faz tumbling lento; rolling faz tumbling rápido; landing faz slerp quaternion para a face correta.
- `components/vtt/DiceMiniature.tsx` — detecta WebGL via lazy `useState` init; para `size="lg"` usa DiceWebGL; fallback: Dice3DCSS (D20) ou Dice2DFallback.
- `lib/vtt/dice-combat-box.ts` — helpers: `getAttackDieColor`, `getDamageDieColor`, `getDiceBoxBaseOptions`, `dieFaceValue`, `DICE_TIER_LABELS`.
- `public/assets/ammo/ammo.wasm.wasm` — binário Bullet Physics (necessário para dice-box funcionar).
- `public/assets/themes/default/` — tema visual dice-box.

**Regra de cores por tier do atacante:**
```
player      → #4a90d9 (azul)
elite       → #9b59d4 (roxo)
miniboss    → #e88832 (laranja)
boss        → #d43838 (vermelho)
(default)   → #d4b84a (dourado)
```

---

### 3. Delays removidos

- `DiceMiniature`: lazy init (`useState(() => typeof window === "undefined" ? null : supportsWebGL())`) elimina re-render extra em CSR.
- `DiceCombatPanel`: removidos `waitMs(120)` de `ensureAttackBox` e `waitMs(80)` de `ensureDamageBox`. Pre-load do bundle no mount.

---

## Estado do PR #3

Commits incluídos:
- `f145d1c` — chore: assets dice-box, tema, skills Clerk, tooltips nav
- `e70cc6b` — perf(vtt): reduz delay de aparição dos dados
- `1095931` — fix(vtt): alinha dice-box ao preview com cores por tier
- `b8b4626` — fix(combat): corrige ataque ao alvo e sync da mesa
- `bd7ed03` — feat(vtt): integra dice-box 3D no combate
- `6833fab` — feat(vtt): ícones nas abas do menu do mestre

> **Nota:** o commit da transição redesign (névoa/brasas) ainda está pendente de push após esta sessão.

---

## Regras críticas do projeto (não violar)

1. **Nunca** usar `title=` em HTML — usar `data-site-tip=` / `.site-tooltip`.
2. Commits só quando o usuário pedir.
3. PA/combate calculado **só no servidor** (`lib/combat/`).
4. Mutações de sala **só via** `lib/room/handlers/` + `persistRoom`.
5. Sempre atualizar `docs/HISTORICO.md` ao concluir qualquer tarefa.
6. Git user: **MaulXD** (não usar ti@thep.com.br como committer).

---

## Próximos passos pendentes

- [ ] Commit + push do redesign da transição (névoa vermelha/azul + brasas)
- [ ] Merge do PR #3 quando validado
- [ ] Testar transição em mesa real (combate → névoa vermelha; sair → névoa azul)
