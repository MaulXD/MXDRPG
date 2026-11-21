/**
 * Evento de janela disparado quando a Resistência, a Esperança ou a Sombra de uma
 * ficha do Um Anel muda (ajuste na ficha, ataque, Fonte de Dano). O card de
 * personagens da barra lateral recarrega a lista ao ouvir: sem isso ele mostrava
 * o número de antes até a página ser recarregada (BV-040).
 * Módulo puro, sem imports de browser, para o verify conseguir testar.
 */
export const TOR_CHARACTER_CHANGED_EVENT = "eldarin:tor-character-changed";
