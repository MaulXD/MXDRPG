/** Cantos ornamentais da ficha (estilo Foundry / pergaminho). */
export function SheetPopupOrnaments() {
  const corner = (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden>
      <path d="M2 2 L2 16 M2 2 L16 2" stroke="#c89030" strokeWidth="2" />
      <path d="M6 6 L6 14 M6 6 L14 6" stroke="#8a6020" strokeWidth="1" />
      <circle cx="6" cy="6" r="2" fill="#c89030" />
    </svg>
  );

  return (
    <>
      <span className="sheet-popup-oc sheet-popup-oc--tl">{corner}</span>
      <span className="sheet-popup-oc sheet-popup-oc--tr">{corner}</span>
      <span className="sheet-popup-oc sheet-popup-oc--bl">{corner}</span>
      <span className="sheet-popup-oc sheet-popup-oc--br">{corner}</span>
    </>
  );
}
