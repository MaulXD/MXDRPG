# P4 — Wizard de personagem

## Rotas

| URL | Função |
|-----|--------|
| `/personagem/novo` | Wizard 7 passos (login obrigatório) |
| `POST /api/characters` | Cria ficha (`CharacterWizardDraft` JSON) |
| `GET /api/characters` | Lista fichas do usuário |
| `PATCH /api/characters/[id]` | Atualiza nome, bio, retrato |

## Passos do wizard

1. Conceito — nome, biografia  
2. Raça — 7 raças + linhagem (Meio-Humano)  
3. Classe — 9 classes (subclasse nv 2 na ficha)  
4. Atributos — compra 27 pts (8–15, tabela livro Cap. 10)  
5. Antecedente  
6. Retrato — crop + token WebP (data URL, opcional)  
7. Revisão → grava Postgres ou `DEMO_CHARACTERS`

## Limite

`MAX_CHARACTERS_PER_USER = 10` — painel mostra contador e bloqueia novo se cheio.

## Código

- `lib/character/point-buy.ts`
- `lib/character/build-from-wizard.ts`
- `components/character/wizard/CharacterCreationWizard.tsx`

**Próximo:** P5 combate UX (Epic 9) ou Blob/CDN para retratos em produção.
