/** Remove `title` nativo antes da hidratação (evita tooltip do SO/navegador). */
export function NativeTitleBlockScript() {
  const script = `(function(){function h(e){return e.querySelector("[role='tooltip'],.wizard-hover-tip__bubble,.foundry-icon-bar__tooltip,.action-hover-tip__bubble,.sheet-hover-tip__bubble");}function m(e){var t=e.getAttribute("title");if(!t||!t.trim())return;if(h(e)){e.removeAttribute("title");return;}if(!e.dataset.siteTip)e.dataset.siteTip=t;e.removeAttribute("title");}function s(r){if(r.querySelectorAll)r.querySelectorAll("[title]").forEach(m);if(r.getAttribute&&r.getAttribute("title"))m(r);}try{s(document.documentElement);new MutationObserver(function(ms){ms.forEach(function(mu){if(mu.type==="attributes"&&mu.attributeName==="title"&&mu.target&&mu.target.getAttribute)m(mu.target);mu.addedNodes.forEach(function(n){if(n.nodeType===1)s(n);});});}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["title"]});}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
