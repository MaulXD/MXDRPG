/** Aplica classe do fundo animado antes da hidratação (evita flash sem canvas). */
export function BackgroundScript() {
  const script = `(function(){try{var p=location.pathname||"";if(!/^\\/mesa\\/[^/]+\\/?$/.test(p)){document.documentElement.classList.add("eldarin-has-animated-bg");}}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
