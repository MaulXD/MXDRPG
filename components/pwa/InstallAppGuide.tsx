"use client";

import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { SITE_NAME } from "@/lib/site-metadata";
import "./pwa-install.css";

export function InstallAppGuide() {
  const { state, canPrompt } = usePwaInstall();

  return (
    <article className="glass content-card pwa-install-guide">
      <h2>Instalar no Chrome</h2>
      <p className="pwa-install-guide__lead">
        Use o {SITE_NAME} como aplicativo na área de trabalho ou na barra de tarefas — sem aba do
        navegador, ícone próprio e abertura em tela cheia.
      </p>

      <div className="pwa-install-guide__actions">
        <InstallAppButton showInstalled />
      </div>

      {state === "installed" ? (
        <p className="pwa-install-guide__ok" role="status">
          Você já está usando o {SITE_NAME} instalado. Abra pelo ícone na área de trabalho ou no menu
          Iniciar.
        </p>
      ) : canPrompt ? (
        <p className="pwa-install-guide__hint">
          Clique em <strong>Instalar aplicativo</strong> acima. O Chrome pedirá confirmação.
        </p>
      ) : (
        <ol className="pwa-install-steps">
          <li>
            Abra este site no <strong>Google Chrome</strong> (ou Edge) em HTTPS — não funciona em
            aba anônima para instalar.
          </li>
          <li>
            No canto direito da barra de endereço, clique no ícone <strong>Instalar</strong> (⊕ ou
            monitor com seta), se aparecer.
          </li>
          <li>
            Ou use o menu <strong>⋮</strong> → <strong>Salvar e compartilhar</strong> →{" "}
            <strong>Instalar página como aplicativo…</strong> (ou <strong>Instalar {SITE_NAME}…</strong>
            ).
          </li>
          <li>Confirme o nome e clique em <strong>Instalar</strong>.</li>
        </ol>
      )}

      <details className="pwa-install-details">
        <summary>iPhone / iPad (Safari)</summary>
        <p>
          Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>. O
          ícone abre o site em modo app.
        </p>
      </details>
    </article>
  );
}
