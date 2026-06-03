# PDFs — Eldarin v4.0

Arquivos gerados a partir dos Markdown oficiais.

| Arquivo | Origem |
|---------|--------|
| `Eldarin-Livro-do-Jogador-v4.pdf` | `livros/LIVRO-DO-JOGADOR.md` |
| `Eldarin-Livro-do-Mestre-v4.pdf` | `livros/LIVRO-DO-MESTRE.md` |
| `Eldarin-Edicao-Geral-v4.pdf` | Jogador + Mestre (volume único) |
| `Eldarin-Ficha-Personagem-v4.pdf` | `FICHA_PERSONAGEM_ELDARIN_v4.md` (1 folha A4, 2 colunas) |
| `Eldarin-Guias-Ecologia-Compendio-v4.pdf` | 10 folhetos reunidos |
| `guias-ecologia/Eldarin-Ecologia-01-…pdf` … `10-…` | `livros/guias-ecologia/*.md` |

## Regenerar

Na raiz do repositório:

```powershell
python scripts/build-pdfs.py
```

Um livro só:

```powershell
python scripts/build-pdfs.py --only jogador
python scripts/build-pdfs.py --only mestre
python scripts/build-pdfs.py --only ficha
python scripts/build-pdfs.py --ecologia
python scripts/build-pdfs.py --geral
python scripts/build-pdfs.py --all
```

Requisitos: Python 3, `pip install markdown playwright` e `python -m playwright install chromium`.

Design: capa escura (verde/âmbar), corpo em pergaminho, títulos **Cinzel**, texto **Lora**, tabelas com cabeçalho musgo.
