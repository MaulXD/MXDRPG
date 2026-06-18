# Paridade Foundry → VTT Eldarin (React)

Use este arquivo depois de gravar o vídeo no Foundry (`vinite/`). Marque o que o **site** já faz em `/mesa/[roomId]`.

Legenda: ✅ pronto · 🟡 parcial · ❌ falta · 🎬 gravar no vídeo

---

## Roteiro sugerido do vídeo (8–12 min)

| # | Cena no Foundry | O que mostrar | Duração |
|---|-----------------|---------------|---------|
| 1 | Abrir mundo + cena | Mesa, grid, tokens posicionados | ~1 min |
| 2 | Selecionar token PC | Nome, vida, PA, portrait no token | ~1 min |
| 3 | Movimento | Caminhada vs corrida, alcance em célula | ~1,5 min |
| 4 | Ataque corpo a corpo / à distância | Rolagem, dano, chat de combate | ~2 min |
| 5 | Magia ou habilidade | Alvo, área (se houver), PA | ~1,5 min |
| 6 | Ficha do personagem | Classe, atributos, inventário, retrato | ~2 min |
| 7 | Compêndio / monstro | Spawn de NPC, stats do bestiário | ~1,5 min |
| 8 | Turno / iniciativa | Ordem de turno, token ativo | ~1 min |
| 9 | Mestre vs jogador | O que só o mestre vê/faz | ~1 min |

Grave em 1080p, narrando: *“isso o Eldarin web precisa ter igual ou melhor”*.

---

## Checklist funcional

### Mesa e mapa

| Item | Foundry (vídeo) | VTT web | Status |
|------|-----------------|---------|--------|
| Grid célula | | Canvas célula | ✅ |
| Tokens com portrait | | `imageUrl` + foco | ✅ 🟡 polish Passo 2 |
| Selecionar / listar tokens | | Sidebar + clique | ✅ |
| Sync multiusuário | | Poll 2s + revision | 🟡 |
| Névoa / LOS | | | ❌ |

### Movimento e PA

| Item | Foundry | VTT web | Status |
|------|---------|---------|--------|
| Caminhada / corrida | | `move-run` | ✅ |
| PA por ação | | `pa-economy` | ✅ |
| Preview de alcance | | Célula destacados | ✅ |

### Combate

| Item | Foundry | VTT web | Status |
|------|---------|---------|--------|
| Ataque arma | | `postRoomAttack` | ✅ |
| Habilidade | | `postRoomAbility` | ✅ |
| Magia de área | | `postRoomAreaSpell` | ✅ |
| Chat de combate | | `kind: combat` | ✅ |
| FX visual hit/crit | | `CombatFxLayer` | ✅ |
| Condições no token | | `TokenConditionsPanel` | ✅ |
| Iniciativa / turno | | `TurnOrderPanel` | ✅ |

### Ficha e personagem

| Item | Foundry | VTT web | Status |
|------|---------|---------|--------|
| Editar classe/raça | | `CharacterIdentityEditor` | ✅ |
| Level-up | | `LevelUpWizard` | ✅ |
| Inventário / loadout | | `CombatLoadoutPanel` | ✅ |
| Retrato + foco no token | | `PortraitFocusEditor` | ✅ |
| Loot (ESP/MIN/TES) | | `LootEconomyPanel` | ✅ |

### Mestre

| Item | Foundry | VTT web | Status |
|------|---------|---------|--------|
| Spawn monstro | | `MonsterSpawnPanel` + aba Invocar | ✅ |
| Controle de combate | | `canControlCombat` | ✅ |
| Convite sala | | `inviteCode` | ✅ |

### Compêndio

| Item | Foundry | VTT web | Status |
|------|---------|---------|--------|
| Bestiário | | `monstros.json` + spawn | ✅ |
| Armas / equipamentos | | `armas.json`, `equipamentos.json` | ✅ |
| Magias | | `magias.json` | ✅ |
| IDs canônicos (MON, ARC-L…) | | `catalogId` interno | ✅ |

### Plataforma

| Item | Foundry | VTT web | Status |
|------|---------|---------|--------|
| Login / registro | | `/entrar` | ✅ |
| Papéis admin/mestre/jogador | | `lib/auth` | 🟡 demo |
| Persistência de sala | | Memória | ❌ Passo 5 |
| Deploy | | Contabo `www.mxdrpg.com.br` | ✅ |

---

## Prioridade sugerida (após o vídeo)

1. Itens que você marcar **❌** e forem críticos na mesa toda semana.  
2. **🟡** sync → SSE/WebSocket (Passo 5).  
3. Nice-to-have (névoa, macros, módulos).

---

## Notas da gravação

*(Preencha depois do vídeo)*

- Data da gravação:
- Link do vídeo:
- Top 3 coisas que o Foundry faz e o web ainda não:
  1.
  2.
  3.
