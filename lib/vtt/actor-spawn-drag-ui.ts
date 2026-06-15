import type { DragEvent } from "react";
import { clearActiveActorSpawnDragPayload, writeActorSpawnDrag } from "@/lib/vtt/spawn-drag";

export function buildActorSpawnDragGhost(label: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "vtt-spawn-drag-ghost";
  el.textContent = label;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.top = "0";
  document.body.appendChild(el);
  return el;
}

export function startActorSpawnDrag(
  e: DragEvent,
  actorId: string,
  name: string,
  ghostRef: { current: HTMLElement | null }
): void {
  e.stopPropagation();
  writeActorSpawnDrag(e.dataTransfer, { actorId });
  ghostRef.current?.remove();
  const ghost = buildActorSpawnDragGhost(name);
  ghostRef.current = ghost;
  e.dataTransfer.setDragImage(ghost, 28, 18);
}

export function endActorSpawnDrag(ghostRef: { current: HTMLElement | null }): void {
  clearActiveActorSpawnDragPayload();
  ghostRef.current?.remove();
  ghostRef.current = null;
}
