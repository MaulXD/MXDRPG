import type { RoomActor } from "./types";

type Pool = { value: number; max: number; temp?: number };

/**
 * Valor atual de um recurso (vida ou PA) ao sincronizar ficha -> sala.
 * - Se o máximo mudou na ficha (subida de nível, reconstrução), vale o valor da ficha.
 * - Senão, vale o valor da sala: dano, cura e PA gastos em combate não estão na ficha.
 * - Sempre limitado ao máximo atual.
 */
function valorDaSala(sheet: Pool, room: Pool): number {
  const valor = room.max === sheet.max ? room.value : sheet.value;
  return Math.min(valor, sheet.max);
}

/**
 * Ator que já está na sala mantém vida atual, vida temporária e PA; o máximo vem da ficha.
 * Os handlers de combate mudam esses valores só na sala e não gravam a ficha.
 * Ator novo na sala (sem `prev`) continua vindo inteiro da ficha.
 */
export function keepRoomVitals(next: RoomActor, prev?: RoomActor): RoomActor {
  if (!prev?.resources) return next;
  const { vida, pontosAcao } = next.resources;
  const prevVida = prev.resources.vida;
  const prevPa = prev.resources.pontosAcao;
  return {
    ...next,
    resources: {
      ...next.resources,
      vida: prevVida
        ? { ...vida, value: valorDaSala(vida, prevVida), temp: prevVida.temp }
        : vida,
      pontosAcao: prevPa
        ? { ...pontosAcao, value: valorDaSala(pontosAcao, prevPa) }
        : pontosAcao,
    },
  };
}
