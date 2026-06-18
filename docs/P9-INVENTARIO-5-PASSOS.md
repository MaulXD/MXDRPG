# P9 — Inventário e consumíveis (5 passos)

Roteiro para validar o fluxo completo antes do beta. Tour interativo: `/mesa/demo` → botão **Tour**.

## Automático (local)

```powershell
npm run dev
# outro terminal:
npm run smoke:p9-inventory
npm run smoke:level-up-pa
```

Produção exige contas Clerk reais — o smoke de login demo não roda em `www.mxdrpg.com.br`.

## Manual (2 browsers)

| Passo | Quem | Ação |
|-------|------|------|
| 1 | Ambos | Login → mesma aventura/mesa |
| 2 | Jogador | Ficha → Inventário → **+ Consumível** → pendência visível |
| 3 | Mestre | Sino (badge) → **Aprovar** |
| 4 | Jogador | Sino (frasco) → notificação; combate: clique direito no token → **Consumível** |
| 5 | Ambos | Reload (F5) — item no inventário, mesa e ficha intactas |

## Level-up (passo seguinte)

| Quem | Ação |
|------|------|
| Mestre | Conceder XP ou jogador com XP suficiente |
| Jogador | Ficha → **Subir de nível** → confirmar |
| Todos | Token no mapa: `nivel` e `PA máx` batem com a ficha após sync |
