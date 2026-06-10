export function ThemeScript() {
  const script = `(function(){try{document.documentElement.setAttribute("data-theme","dark");localStorage.setItem("eldarin-theme","dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
