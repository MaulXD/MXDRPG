"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { DICE_LANDING_MS, DICE_LANDING_MS_REDUCED } from "@/lib/vtt/combat-fx-timings";

export interface DiceWebGLProps {
  /** d4 | d6 | d8 | d12 | d20 */
  sides: 4 | 6 | 8 | 12 | 20;
  /** null = dado rolando, number = valor que deve aparecer na face de frente */
  value: number | null;
  rolling: boolean;
  sizePx: number;
  /** variante de cor: "attack" (verdigris) | "damage" (vermelho) | "heal" (verde) | "crit" (dourado) */
  variant?: "attack" | "damage" | "heal" | "crit";
  /** Pouso em ms — alinhado ao ritmo do combate */
  landingMs?: number;
  reducedMotion?: boolean;
}

const VARIANT_COLORS = {
  attack: { face: "#0d1118", border: "rgba(107,158,140,0.32)", text: "#dde4ef", glow: "rgba(107,158,140,0.5)" },
  damage: { face: "#150a0a", border: "rgba(200,70,50,0.38)", text: "#f0d0c8", glow: "rgba(200,70,50,0.55)" },
  heal:   { face: "#081410", border: "rgba(70,200,130,0.38)", text: "#c4f0d4", glow: "rgba(70,200,130,0.55)" },
  crit:   { face: "#141000", border: "rgba(232,190,50,0.42)", text: "#ffe880", glow: "rgba(232,190,50,0.65)" },
};

const SPIN_AXIS = new THREE.Vector3();
const DELTA_Q = new THREE.Quaternion();

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function makeFaceTex(
  num: number,
  variant: keyof typeof VARIANT_COLORS
): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const ctx = c.getContext("2d")!;
  const col = VARIANT_COLORS[variant];

  ctx.fillStyle = col.face;
  ctx.fillRect(0, 0, S, S);

  ctx.strokeStyle = col.border;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, S - 8, S - 8);

  ctx.strokeStyle = col.border.replace(/[\d.]+\)$/, "0.18)");
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(S / 2, 28);
  ctx.lineTo(S - 28, S - 28);
  ctx.lineTo(28, S - 28);
  ctx.closePath();
  ctx.stroke();

  const s = String(num);
  ctx.font = `900 ${s.length > 1 ? 90 : 110}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = col.text;
  ctx.fillText(s, S / 2, S / 2 + 8);
  ctx.shadowBlur = 0;

  if (num === 6 || num === 9) {
    ctx.strokeStyle = col.text;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(S / 2 - 24, S / 2 + 66);
    ctx.lineTo(S / 2 + 24, S / 2 + 66);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(c);
}

function buildGeometry(sides: DiceWebGLProps["sides"]) {
  let base: THREE.BufferGeometry;
  let faceCount: number;
  let vertsPerFace: number;

  if (sides === 20) {
    base = new THREE.IcosahedronGeometry(1, 0);
    faceCount = 20; vertsPerFace = 3;
  } else if (sides === 12) {
    base = new THREE.DodecahedronGeometry(1, 0);
    faceCount = 12; vertsPerFace = 9;
  } else if (sides === 8) {
    base = new THREE.OctahedronGeometry(1, 0);
    faceCount = 8; vertsPerFace = 3;
  } else if (sides === 4) {
    base = new THREE.TetrahedronGeometry(1.2, 0);
    faceCount = 4; vertsPerFace = 3;
  } else {
    base = new THREE.BoxGeometry(1, 1, 1);
    faceCount = 6; vertsPerFace = 6;
  }

  const geom = base.toNonIndexed();
  geom.computeVertexNormals();
  geom.clearGroups();
  for (let i = 0; i < faceCount; i++) {
    geom.addGroup(i * vertsPerFace, vertsPerFace, i);
  }

  const normals = geom.attributes.normal;
  const faceNormals: THREE.Vector3[] = [];
  for (let i = 0; i < faceCount; i++) {
    faceNormals.push(
      new THREE.Vector3(
        normals.getX(i * vertsPerFace),
        normals.getY(i * vertsPerFace),
        normals.getZ(i * vertsPerFace)
      ).normalize()
    );
  }

  const cameraDir = new THREE.Vector3(0, 0, 1);
  const landingQuats = faceNormals.map((n) => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(n, cameraDir);
    return q;
  });

  return { geom, faceCount, landingQuats };
}

export function DiceWebGL({
  sides,
  value,
  rolling,
  sizePx,
  variant = "attack",
  landingMs: landingMsProp,
  reducedMotion = false,
}: DiceWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landingMs =
    landingMsProp ?? (reducedMotion ? DICE_LANDING_MS_REDUCED : DICE_LANDING_MS);

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    mesh: THREE.Mesh;
    materials: THREE.MeshStandardMaterial[];
    landingQuats: THREE.Quaternion[];
    faceCount: number;
    rafId: number;
    mode: "idle" | "rolling" | "landing" | "settled";
    rollTime: number;
    lastFrame: number;
    landingStart: number;
    landingFrom: THREE.Quaternion;
    landingTarget: THREE.Quaternion;
    landingMs: number;
    currentVariant: DiceWebGLProps["variant"];
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const pr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(sizePx, sizePx, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(1.5, 2, 3);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0x6699cc, 0.35);
    rim.position.set(-2, -1, 1);
    scene.add(rim);

    const { geom, faceCount, landingQuats } = buildGeometry(sides);
    const materials = Array.from({ length: faceCount }, (_, i) =>
      new THREE.MeshStandardMaterial({
        map: makeFaceTex(i + 1, variant),
        roughness: 0.38,
        metalness: 0.18,
      })
    );

    const mesh = new THREE.Mesh(geom, materials);
    scene.add(mesh);

    const state = {
      renderer,
      scene,
      camera,
      mesh,
      materials,
      landingQuats,
      faceCount,
      rafId: 0,
      mode: (rolling ? "rolling" : "idle") as "idle" | "rolling" | "landing" | "settled",
      rollTime: Math.random() * 10,
      lastFrame: performance.now(),
      landingStart: 0,
      landingFrom: new THREE.Quaternion(),
      landingTarget: new THREE.Quaternion(),
      landingMs,
      currentVariant: variant,
    };

    function animate(now: number) {
      state.rafId = requestAnimationFrame(animate);
      const dt = Math.min((now - state.lastFrame) / 1000, 0.05);
      state.lastFrame = now;

      if (state.mode === "rolling") {
        const speed = reducedMotion ? 14 : 8.5 + Math.sin(state.rollTime * 2.1) * 2.8;
        SPIN_AXIS.set(
          Math.sin(state.rollTime * 1.35) * 0.65 + 0.22,
          Math.cos(state.rollTime * 1.85) * 0.58 + 0.28,
          Math.sin(state.rollTime * 2.25) * 0.52 + 0.24
        ).normalize();
        DELTA_Q.setFromAxisAngle(SPIN_AXIS, speed * dt);
        mesh.quaternion.multiply(DELTA_Q);
        state.rollTime += dt;
        mesh.scale.setScalar(1);
      } else if (state.mode === "idle") {
        state.rollTime += dt * 0.35;
        mesh.rotation.set(
          state.rollTime * 0.35,
          state.rollTime * 0.55,
          state.rollTime * 0.18
        );
        mesh.scale.setScalar(1);
      } else if (state.mode === "landing") {
        const elapsed = now - state.landingStart;
        const t = Math.min(elapsed / state.landingMs, 1);
        const ease = easeOutBack(t);
        mesh.quaternion.slerpQuaternions(state.landingFrom, state.landingTarget, ease);
        const bounce = 1 + Math.sin(t * Math.PI) * 0.1 * (1 - t);
        mesh.scale.setScalar(bounce);
        if (t >= 1) {
          mesh.scale.setScalar(1);
          state.mode = "settled";
        }
      } else {
        mesh.scale.setScalar(1);
      }

      renderer.render(scene, camera);
    }

    state.rafId = requestAnimationFrame(animate);
    stateRef.current = state;

    return () => {
      cancelAnimationFrame(state.rafId);
      materials.forEach((m) => { m.map?.dispose(); m.dispose(); });
      geom.dispose();
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sides, sizePx]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    s.landingMs = landingMs;

    if (s.currentVariant !== variant) {
      s.currentVariant = variant;
      s.materials.forEach((mat, i) => {
        mat.map?.dispose();
        mat.map = makeFaceTex(i + 1, variant);
        mat.needsUpdate = true;
      });
    }

    if (rolling) {
      s.mode = "rolling";
      s.lastFrame = performance.now();
    } else if (value != null) {
      const faceIdx = Math.max(0, Math.min(value - 1, s.faceCount - 1));
      s.landingFrom = s.mesh.quaternion.clone();
      s.landingTarget = s.landingQuats[faceIdx].clone();
      s.landingStart = performance.now();
      s.mode = "landing";

      if (value !== faceIdx + 1) {
        const mat = s.materials[faceIdx];
        mat.map?.dispose();
        mat.map = makeFaceTex(value, variant);
        mat.needsUpdate = true;
      }
    } else if (s.mode !== "settled") {
      s.mode = "idle";
    }
  }, [rolling, value, variant, landingMs]);

  return (
    <canvas
      ref={canvasRef}
      width={sizePx}
      height={sizePx}
      style={{ display: "block", width: sizePx, height: sizePx }}
      aria-hidden
    />
  );
}
