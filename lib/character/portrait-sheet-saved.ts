/**
 * Aviso quando a imagem foi aplicada na mesa mas a ficha do personagem não grava
 * (ver updateRoomActor em lib/room/handlers/actors.ts, sheetSaved: false).
 * Módulo puro, sem imports de browser, para o verify conseguir testar.
 */
export const SHEET_NOT_SAVED_MESSAGE =
  "A imagem foi aplicada na mesa, mas não foi salva na ficha. Tente de novo.";

/** Mesmo aviso para remoção: a mesa mudou, a ficha não. */
export const SHEET_NOT_CLEARED_MESSAGE =
  "A imagem foi removida da mesa, mas não foi removida da ficha. Tente de novo.";

/**
 * Chamar depois de aplicar o resultado na mesa: lança erro com a mensagem para o
 * jogador quando a ficha não foi gravada. O editor mantém o rascunho aberto e
 * mostra o aviso no lugar de "salvo".
 */
export function assertRoomPortraitSheetSaved(
  result: { sheetSaved?: boolean } | null,
  message: string = SHEET_NOT_SAVED_MESSAGE
): void {
  if (result?.sheetSaved === false) throw new Error(message);
}
