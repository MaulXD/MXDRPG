"use client";

import type { ReactNode } from "react";

type Props = {
  /** Abas + conteúdo (inventário, magias, etc.) */
  children: ReactNode;
  /** Painel colapsável de gestão — opcional */
  manage?: ReactNode;
};

/**
 * Drawer inferior da ficha DDB: abas primeiro, gestão do personagem abaixo.
 * Espelha a hierarquia de docs/preview-ficha-ddb.html.
 */
export function SheetDdbDrawer({ children, manage }: Props) {
  return (
    <div className="sheet-ddb-drawer-inner">
      <div className="sheet-ddb-drawer__main">{children}</div>
      {manage ? (
        <details className="sheet-popup-advanced sheet-popup-advanced--ddb sheet-ddb-manage-fold">
          <summary>Gestão do personagem</summary>
          <div className="sheet-popup-advanced__body">{manage}</div>
        </details>
      ) : null}
    </div>
  );
}
