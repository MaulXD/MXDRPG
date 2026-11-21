# Levantamento de textos de interface (app/ e components/)

Escopo: arquivos `.ts` e `.tsx` em `app/` e `components/`. Busca por textos visíveis ao usuário com problemas de acentuação/ortografia em português (ex.: `Voce`, `nao`, `Configuracao`, `Ultimo`, palavras em `-cao`/`-coes` sem cedilha/til, `magia de area`).

Critérios aplicados:
- Ignorados: comentários de código, nomes de variáveis, chaves/propriedades de objetos, pastas `livros/` e `data/`.
- Considerados apenas trechos exibidos na interface (JSX/texto de elementos e literais de UI).

## components/vtt/CulinaryMealPanel.tsx

- `components/vtt/CulinaryMealPanel.tsx:120` — texto atual: `(Coccao +{p.culinary?.coccao ?? 0})` (rótulo visível da opção; a propriedade `p.culinary.coccao` é nome de campo, não texto de UI) — texto corrigido: `(Cocção +{p.culinary?.coccao ?? 0})`
- `components/vtt/CulinaryMealPanel.tsx:128` — texto atual: `<span>Teste Coccao (total)</span>` — texto corrigido: `<span>Teste Cocção (total)</span>`

## Total

- Total de achados: **2** (1 arquivo).
- Nenhum arquivo foi editado e nenhum commit foi realizado.
