"use client";

import { useEffect, useRef } from "react";
import { eulerForDieValue } from "@/lib/vtt/dice-orientations";
import { faceMaterialsForDie } from "@/lib/vtt/dice-face-texture";

type Props = {
  sides: number;
  value: number | null;
  rolling: boolean;
  sizePx: number;
};

function geometryForSides(THREE: typeof import("three"), sides: number) {
  if (sides <= 4) return new THREE.TetrahedronGeometry(1, 0);
  if (sides === 6) return new THREE.BoxGeometry(1.15, 1.15, 1.15);
  if (sides === 8) return new THREE.OctahedronGeometry(1.05, 0);
  if (sides === 10) return new THREE.OctahedronGeometry(1, 0);
  if (sides === 12) return new THREE.DodecahedronGeometry(1, 0);
  return new THREE.IcosahedronGeometry(1, 0);
}

export function Dice3DScene({ sides, value, rolling, sizePx }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rollingRef = useRef(rolling);
  const valueRef = useRef(value);
  rollingRef.current = rolling;
  valueRef.current = value;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | undefined;

    void import("three").then((THREE) => {
      if (disposed || !wrapRef.current) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
      camera.position.set(0, 0.2, 3.5);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(sizePx, sizePx);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      wrap.appendChild(renderer.domElement);

      const geo = geometryForSides(THREE, sides);
      const materials = faceMaterialsForDie(THREE, sides);
      const mesh = new THREE.Mesh(geo, materials.length > 1 ? materials : materials[0]);
      scene.add(mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xc9a962, transparent: true, opacity: 0.5 })
      );
      mesh.add(edges);

      scene.add(new THREE.AmbientLight(0xfff0d8, 0.75));
      const key = new THREE.DirectionalLight(0xffe8b8, 1.2);
      key.position.set(2.5, 3, 4);
      scene.add(key);

      let vx = 0.01;
      let vy = 0.014;
      let vz = 0.008;
      let settleUntil = 0;
      let snapUntil = 0;
      let snapFrom: [number, number, number] | null = null;
      let snapTo: [number, number, number] | null = null;

      const tick = (time: number) => {
        if (disposed) return;

        if (rollingRef.current && !reduced) {
          if (settleUntil < time) {
            settleUntil = time + 820;
            vx = 0.24 + Math.random() * 0.14;
            vy = 0.3 + Math.random() * 0.16;
            vz = 0.18 + Math.random() * 0.1;
          }
          snapFrom = null;
          snapTo = null;
        } else if (!rollingRef.current && valueRef.current != null && settleUntil > 0 && time >= settleUntil) {
          if (!snapTo) {
            snapFrom = [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z];
            snapTo = eulerForDieValue(sides, valueRef.current);
            snapUntil = time + 380;
          }
        } else if (!rollingRef.current && valueRef.current == null) {
          settleUntil = 0;
          snapTo = null;
        }

        if (snapTo && snapFrom && time < snapUntil && !reduced) {
          const t = Math.min(1, (time - (snapUntil - 380)) / 380);
          const ease = 1 - Math.pow(1 - t, 3);
          mesh.rotation.x = snapFrom[0] + (snapTo[0] - snapFrom[0]) * ease;
          mesh.rotation.y = snapFrom[1] + (snapTo[1] - snapFrom[1]) * ease;
          mesh.rotation.z = snapFrom[2] + (snapTo[2] - snapFrom[2]) * ease;
          vx = vy = vz = 0;
        } else if (snapTo && time >= snapUntil) {
          mesh.rotation.set(snapTo[0], snapTo[1], snapTo[2]);
          vx = vy = vz = 0;
        } else if (time < settleUntil && !reduced) {
          vx *= 0.965;
          vy *= 0.965;
          vz *= 0.965;
        } else if (!reduced && !snapTo) {
          vx = 0.006;
          vy = 0.009;
          vz = 0.004;
        }

        if (!reduced && (!snapTo || time < snapUntil)) {
          mesh.rotation.x += vx;
          mesh.rotation.y += vy;
          mesh.rotation.z += vz;
        }

        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        renderer.dispose();
        geo.dispose();
        materials.forEach((m) => {
          m.map?.dispose();
          m.dispose();
        });
        edges.geometry.dispose();
        (edges.material as import("three").Material).dispose();
        if (renderer.domElement.parentElement === wrap) {
          wrap.removeChild(renderer.domElement);
        }
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [sides, sizePx]);

  return <div ref={wrapRef} className="dice-3d-canvas" aria-hidden />;
}
