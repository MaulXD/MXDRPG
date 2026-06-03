"use client";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
};

export function MesaDrawer({ open, title, onClose, children, wide }: Props) {
  if (!open) return null;

  return (
    <div className="mesa-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className={`mesa-drawer glass ${wide ? "wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mesa-drawer-head">
          <h2>{title}</h2>
          <button type="button" className="mesa-drawer-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <div className="mesa-drawer-body">{children}</div>
      </aside>
    </div>
  );
}
