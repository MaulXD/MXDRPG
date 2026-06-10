/** Evita atalhos globais do mapa enquanto o usuário edita campos de texto. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

/** Ficha popup, modais e painéis flutuantes — não disparar atalhos de combate/mapa. */
export function isVttOverlayTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      ".foundry-window, .sheet-shell--popup, .picker-overlay, .vtt-modal-backdrop, [role='dialog'][aria-modal='true']"
    )
  );
}

/** Item selecionado na ficha aberta (Delete deve remover do inventário, não do mapa). */
export function isCharacterSheetInventoryDeleteIntent(): boolean {
  return Boolean(document.querySelector(".foundry-window--character .inv-row--selected"));
}

/**
 * Bloqueia atalhos do hex (Delete no token, etc.) quando a ficha ou UI modal está em uso.
 * Não há atalho de teclado para passar turno — apenas clique explícito.
 */
export function shouldIgnoreBattlefieldShortcut(target: EventTarget | null): boolean {
  if (isTypingTarget(target)) return true;
  if (isVttOverlayTarget(target)) return true;
  if (isCharacterSheetInventoryDeleteIntent()) return true;
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.closest(".foundry-window--character")) {
    return true;
  }
  return false;
}
