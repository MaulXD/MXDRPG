# Catálogo — Habilidades táticas (HAB)

> IDs canônicos **`HAB-*`** · compendium VTT: `node scripts/generate-compendium.mjs`  
> Índice geral: `TABELA-IDS-ELDARIN.md` · regras de combate: `LIVRO-DO-JOGADOR.md`

---

## Convenção

| Campo na ficha | Significado |
|----------------|-------------|
| **Alcance** | Hexágonos a partir do token (0 = em si) |
| **PA** | Pontos de ação gastos ao usar |
| **Tipo** | `ativa`, `passiva` ou `reacao` |
| **Recarga** | Limite por turno/combate (ex.: `1/turno`) |

---

## Habilidades gerais

| ID | Nome | Alc. | PA | Tipo | Recarga | Como funciona |
|----|------|------|----|------|---------|---------------|
| HAB-investida-hexagonal | Investida Hexagonal | 2 | 1 | ativa | 1/turno | Desloca em linha reta até 2 hex sem provocar oportunidades. |
| HAB-golpe-flanqueador | Golpe Flanqueador | 1 | 2 | ativa | — | Próximo ataque corpo a corpo com vantagem se você flanquear o alvo. |
| HAB-postura-defensiva | Postura Defensiva | 0 | 1 | ativa | — | +2 defesa até o início do seu próximo turno. |
| HAB-reflexos-de-masmorra | Reflexos de Masmorra | 1 | 1 | reação | — | Reação a um ataque: desloca 1 hex (não provoca). |
| HAB-olhar-do-cacador | Olhar do Caçador | 5 | 1 | ativa | — | Marca um alvo visível; seu próximo ataque à distância contra ele ganha +2. |

## Guerreiro e combate corpo a corpo

| ID | Nome | Alc. | PA | Tipo | Recarga | Como funciona |
|----|------|------|----|------|---------|---------------|
| HAB-investida-do-guerreiro | Investida do Guerreiro | 2 | 1 | ativa | 1/turno | Corrida em linha reta até 2 hex; termine adjacente a um inimigo para atacar no mesmo turno. |
| HAB-golpe-devastador | Golpe Devastador | 1 | 2 | ativa | — | Próximo ataque corpo a corpo recebe +2 no teste de ataque. |
| HAB-esquiva-tatica | Esquiva Tática | 0 | 1 | ativa | — | +2 defesa até o início do seu próximo turno. |
| HAB-canalizar-energia | Canalizar Energia | 1 | 2 | ativa | — | Ataque corpo a corpo sagrado: +2 no ataque e +2d6 radiante no dano. |
| HAB-furia-controlada | Fúria Controlada | 0 | 1 | ativa | — | Resistência a dano contundente até o fim do seu próximo turno. |

## Arqueiro e furtividade

| ID | Nome | Alc. | PA | Tipo | Recarga | Como funciona |
|----|------|------|----|------|---------|---------------|
| HAB-tiro-certeiro | Tiro Certeiro | 5 | 1 | ativa | — | Próximo ataque à distância com vantagem. |
| HAB-emboscada | Emboscada | 1 | 2 | ativa | — | Ataque furtivo adjacente; vantagem se o alvo não viu você no início do turno. |
| HAB-finta | Finta | 1 | 1 | ativa | — | Alvo marcado tem desvantagem no próximo ataque contra você. |
| HAB-passo-das-sombras | Passo das Sombras | 2 | 1 | ativa | 1/turno | Teleporte curto de até 2 hex (conta como movimento). |

## Magia e suporte

| ID | Nome | Alc. | PA | Tipo | Recarga | Como funciona |
|----|------|------|----|------|---------|---------------|
| HAB-raio-arcano | Raio Arcano | 6 | 1 | ativa | — | Truque ofensivo: 1d10+INT de dano mágico em um alvo. |
| HAB-escudo-magico | Escudo Mágico | 0 | 1 | ativa | — | +3 defesa até o início do seu próximo turno. |
| HAB-inspiracao-de-batalha | Inspiração de Batalha | 4 | 1 | ativa | — | Aliado visível ganha vantagem no próximo ataque. |
| HAB-cancao-de-cura | Canção de Cura | 1 | 1 | ativa | — | Aliado adjacente recupera 1d6 HP. |
| HAB-barreira-de-cobre | Barreira de Cobre | 0 | 1 | ativa | — | +2 defesa contra efeitos mágicos até seu próximo turno. |

## Bárbaro e druida

| ID | Nome | Alc. | PA | Tipo | Recarga | Como funciona |
|----|------|------|----|------|---------|---------------|
| HAB-investida-barbara | Investida Bárbara | 3 | 1 | ativa | 1/turno | Corre até 3 hex em linha reta sem provocar oportunidades. |
| HAB-forma-selvagem | Forma Selvagem | 0 | 2 | ativa | — | Prepara transformação biomágica (movimento + ritual; Mestre valida forma). |
| HAB-raizes-prendentes | Raízes Prendentes | 4 | 2 | ativa | — | Restringe alvo 1 turno (save FOR); raízes no hex do alvo. |

## Artilheiro

| ID | Nome | Alc. | PA | Tipo | Recarga | Como funciona |
|----|------|------|----|------|---------|---------------|
| HAB-disparo-de-artilheiro | Disparo de Artilheiro | 6 | 1 | ativa | — | Projétil concentrado: 2d8 de dano à distância. |

---

**Referência externa na ficha:** cada entrada exibe `catalogId` (HAB-…) e o livro acima. Regenerar JSON após editar esta tabela.
