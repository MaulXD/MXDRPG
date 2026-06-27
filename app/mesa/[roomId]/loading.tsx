export default function MesaRoomLoading() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#0e0d0b",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "1.25rem",
      zIndex: 9999,
    }}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        style={{ animation: "mesa-spin 1s linear infinite" }}
      >
        <circle cx="20" cy="20" r="17" fill="none" stroke="#2a2722" strokeWidth="4" />
        <circle
          cx="20" cy="20" r="17"
          fill="none"
          stroke="#8B7BB8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="48 58"
          strokeDashoffset="0"
        />
      </svg>
      <p style={{
        margin: 0,
        color: "#6b6259",
        fontSize: "0.8rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontFamily: "var(--font-ui, sans-serif)",
      }}>
        Carregando mesa…
      </p>
      <style>{`
        @keyframes mesa-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
