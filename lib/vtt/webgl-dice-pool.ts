/** Limit concurrent WebGL dice renderers — browsers cap ~16 contexts per tab. */
/** Só combate/roller (lg) usam WebGL — 2 é suficiente com fila de FX. */
const MAX_ACTIVE = 2;

let active = 0;

export function canCreateWebGLDiceContext(): boolean {
  return active < MAX_ACTIVE;
}

/** Call the returned function on dispose to release a slot. */
export function registerWebGLDiceContext(): () => void {
  active += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    active = Math.max(0, active - 1);
  };
}
