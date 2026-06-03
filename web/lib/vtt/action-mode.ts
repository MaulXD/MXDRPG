export type TokenActionMode = "idle" | "move-walk" | "move-run" | "attack" | "spell" | "ability";

export const ACTION_MODE_LABEL: Record<TokenActionMode, string> = {
  idle: "Escolher ação…",
  "move-walk": "Mover (caminhada)",
  "move-run": "Correr (gasta PA além da caminhada)",
  attack: "Atacar",
  spell: "Conjurar",
  ability: "Habilidade",
};

export function isMoveMode(mode: TokenActionMode): mode is "move-walk" | "move-run" {
  return mode === "move-walk" || mode === "move-run";
}

export function isTargetMode(mode: TokenActionMode): boolean {
  return mode === "attack" || mode === "spell" || mode === "ability";
}
