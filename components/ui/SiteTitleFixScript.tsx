/** Corrige título legado da aba antes da hidratação (HTML em cache). */
export function SiteTitleFixScript() {
  const script = `(function(){try{var t=(document.title||"").trim();if(!t)return;if(/^Eldarin\\s*[—–-]\\s*VTT tático$/i.test(t)){document.title="MXDRPG";return;}if(/^Eldarin\\s*[—–-]/i.test(t)){document.title=t.replace(/^Eldarin\\s*[—–-]\\s*/i,"MXDRPG — ");}}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
