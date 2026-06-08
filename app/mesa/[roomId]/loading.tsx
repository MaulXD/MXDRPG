export default function MesaRoomLoading() {
  return (
    <div className="vtt-page vtt-page--mesa" style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
      <p className="eyebrow" style={{ justifyContent: "center" }}>
        Mesa virtual
      </p>
      <p style={{ color: "var(--text-muted)", margin: 0 }}>Carregando mapa e painéis…</p>
    </div>
  );
}
