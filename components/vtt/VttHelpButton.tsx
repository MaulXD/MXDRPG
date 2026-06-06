"use client";

import { useCallback, useEffect, useState } from "react";

export function VttHelpButton() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        className="vtt-help-trigger"
        onClick={() => setOpen(true)}
        title="Como jogar na mesa"
        aria-label="Como jogar na mesa"
      >
        ?
      </button>
      {open ? (
        <div
          className="vtt-help-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vtt-help-title"
          onClick={close}
        >
          <div className="vtt-help-panel glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 id="vtt-help-title" className="vtt-help-panel__title">
              Como jogar na mesa
            </h3>
            <ol className="vtt-help-panel__list">
              <li>
                <strong>Seu turno:</strong> quando for sua vez na iniciativa (painel ⏱), o token
                ativo ganha um anel dourado no mapa.
              </li>
              <li>
                <strong>Anel de ações:</strong> clique direito no seu personagem (ou no hex dele)
                para abrir o menu circular — mover, atacar, magias e habilidades.
              </li>
              <li>
                <strong>Detalhes:</strong> passe o mouse sobre cada botão do anel para ler a
                descrição, dano/cura, alcance e custo em PA.
              </li>
              <li>
                <strong>Executar ação:</strong> escolha uma opção no anel; o mapa entra em modo de
                alvo ou movimento — clique no hex ou inimigo válido. <kbd>Esc</kbd> cancela.
              </li>
              <li>
                <strong>Pontos de Ação (PA):</strong> cada ação gasta PA; caminhada usa faixas
                gratuitas antes de consumir PA extra. Termine com <em>Passar turno</em>.
              </li>
              <li>
                <strong>Mapa:</strong> scroll para zoom; segure <kbd>Alt</kbd> e arraste para mover
                a câmera. Botões de zoom no canto inferior direito.
              </li>
              <li>
                <strong>Ficha:</strong> lista todos os personagens jogáveis — veja qualquer ficha;
                só edite a sua. Use <em>Criar novo personagem</em> quando precisar.
              </li>
            </ol>
            <button type="button" className="btn vtt-help-panel__close" onClick={close}>
              Entendi
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
