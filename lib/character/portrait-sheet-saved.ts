/**
 * Aviso quando a imagem foi aplicada na mesa mas a ficha do personagem não grava
 * (ver updateRoomActor em lib/room/handlers/actors.ts, sheetSaved: false).
 * Módulo puro, sem imports de browser, para o verify conseguir testar.
 */
export const SHEET_NOT_SAVED_MESSAGE =
  "A mesa foi atualizada, mas a ficha não foi salva. Tente de novo.";

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

/** Aviso para inventario, ficha, equipamento, magias e vida do mestre (mesma regra do retrato). */
export const ROOM_SHEET_NOT_SAVED_MESSAGE =
  "A mudança foi aplicada na mesa, mas não foi salva na ficha. Tente de novo.";

/** Um Anel: ataque e Fonte de Dano aplicados na mesa, mas a ficha não gravou (sheetSaved: false). */
export const TOR_SHEET_NOT_SAVED_MESSAGE =
  "O resultado foi aplicado na mesa, mas não foi salvo na ficha.";

/** Mesmo sinal de assertRoomPortraitSheetSaved, com o aviso generico por padrao. */
export function assertRoomSheetSaved(
  result: { sheetSaved?: boolean } | null,
  message: string = ROOM_SHEET_NOT_SAVED_MESSAGE
): void {
  assertRoomPortraitSheetSaved(result, message);
}
