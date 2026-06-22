/** Erro HTTP de mutação da sala — preserva status para não retentar 4xx. */
export class RoomApiHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RoomApiHttpError";
    this.status = status;
  }
}

export function isRoomClientError(err: unknown): err is RoomApiHttpError {
  return err instanceof RoomApiHttpError && err.status >= 400 && err.status < 500;
}
