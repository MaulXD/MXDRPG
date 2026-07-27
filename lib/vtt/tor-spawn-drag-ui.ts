import type { DragEvent } from "react";
import {
  clearActiveTorAdversarySpawnDragPayload,
  clearActiveTorCharacterSpawnDragPayload,
  writeTorAdversarySpawnDrag,
  writeTorCharacterSpawnDrag,
} from "@/lib/vtt/spawn-drag";

/** Espelha lib/vtt/actor-spawn-drag-ui.ts (Eldarin), mas pro Um Anel — arquivo
 * próprio pra não misturar import de um sistema com o outro. */
function buildTorSpawnDragGhost(label: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "vtt-spawn-drag-ghost";
  el.textContent = label;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.top = "0";
  document.body.appendChild(el);
  return el;
}

export function startTorCharacterSpawnDrag(
  e: DragEvent,
  characterId: string,
  name: string,
  ghostRef: { current: HTMLElement | null }
): void {
  e.stopPropagation();
  writeTorCharacterSpawnDrag(e.dataTransfer, { characterId });
  ghostRef.current?.remove();
  const ghost = buildTorSpawnDragGhost(name);
  ghostRef.current = ghost;
  e.dataTransfer.setDragImage(ghost, 28, 18);
}

export function endTorCharacterSpawnDrag(ghostRef: { current: HTMLElement | null }): void {
  clearActiveTorCharacterSpawnDragPayload();
  ghostRef.current?.remove();
  ghostRef.current = null;
}

export function startTorAdversarySpawnDrag(
  e: DragEvent,
  adversaryId: string,
  name: string,
  ghostRef: { current: HTMLElement | null }
): void {
  e.stopPropagation();
  writeTorAdversarySpawnDrag(e.dataTransfer, { adversaryId });
  ghostRef.current?.remove();
  const ghost = buildTorSpawnDragGhost(name);
  ghostRef.current = ghost;
  e.dataTransfer.setDragImage(ghost, 28, 18);
}

export function endTorAdversarySpawnDrag(ghostRef: { current: HTMLElement | null }): void {
  clearActiveTorAdversarySpawnDragPayload();
  ghostRef.current?.remove();
  ghostRef.current = null;
}
