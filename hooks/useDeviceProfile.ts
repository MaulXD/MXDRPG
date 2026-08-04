"use client";

import { useEffect, useState } from "react";

/**
 * Perfil de dispositivo — largura, capacidade de toque e orientação.
 *
 * Antes deste hook o projeto não tinha nenhuma noção de dispositivo: toda
 * decisão responsiva era largura-only em CSS e o React nunca sabia se estava
 * num dedo ou num mouse. Isso impedia mudar *comportamento* (não só estilo)
 * — gestos, long-press, painel em drawer vs coluna.
 *
 * Os degraus batem com a escala canônica de `app/globals.css`:
 *   xs ≤479 · sm 480–767 · md 768–1023 · lg 1024–1279 · xl ≥1280
 */

export type DeviceSize = "xs" | "sm" | "md" | "lg" | "xl";

export type DeviceProfile = {
  size: DeviceSize;
  /** ≤767px — stage em tela cheia + bottom sheets */
  isPhone: boolean;
  /** 768–1023px — stage em tela cheia + dock como drawer sobreposto */
  isTabletPortrait: boolean;
  /** 1024–1279px — layout de PC, dock mais enxuto */
  isTabletLandscape: boolean;
  /** ≥1280px */
  isDesktop: boolean;
  /** entrada primária é dedo (não "é um celular" — um PC com tela de toque também é) */
  isTouch: boolean;
  /** existe cursor de verdade — libera hover, tooltip, atalho de teclado */
  hasMouse: boolean;
  isLandscape: boolean;
  /** celular deitado: altura curta o bastante para esconder chrome não essencial */
  isShortLandscape: boolean;
};

const QUERIES = {
  xs: "(max-width: 479px)",
  sm: "(min-width: 480px) and (max-width: 767px)",
  md: "(min-width: 768px) and (max-width: 1023px)",
  lg: "(min-width: 1024px) and (max-width: 1279px)",
  touch: "(pointer: coarse)",
  mouse: "(hover: hover) and (pointer: fine)",
  landscape: "(orientation: landscape)",
  shortLandscape: "(max-height: 500px) and (orientation: landscape)",
} as const;

/**
 * Fallback de SSR: assume desktop com mouse. É o palpite certo porque um
 * layout de PC servido a um celular se corrige no primeiro efeito, enquanto
 * o inverso faria o desktop piscar em layout de celular a cada navegação.
 */
const SSR_PROFILE: DeviceProfile = {
  size: "xl",
  isPhone: false,
  isTabletPortrait: false,
  isTabletLandscape: false,
  isDesktop: true,
  isTouch: false,
  hasMouse: true,
  isLandscape: true,
  isShortLandscape: false,
};

function readProfile(): DeviceProfile {
  const m = (q: string) => window.matchMedia(q).matches;

  const size: DeviceSize = m(QUERIES.xs)
    ? "xs"
    : m(QUERIES.sm)
      ? "sm"
      : m(QUERIES.md)
        ? "md"
        : m(QUERIES.lg)
          ? "lg"
          : "xl";

  return {
    size,
    isPhone: size === "xs" || size === "sm",
    isTabletPortrait: size === "md",
    isTabletLandscape: size === "lg",
    isDesktop: size === "xl",
    isTouch: m(QUERIES.touch),
    hasMouse: m(QUERIES.mouse),
    isLandscape: m(QUERIES.landscape),
    isShortLandscape: m(QUERIES.shortLandscape),
  };
}

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(SSR_PROFILE);

  useEffect(() => {
    const lists = Object.values(QUERIES).map((q) => window.matchMedia(q));
    const sync = () => setProfile(readProfile());

    sync();
    lists.forEach((l) => l.addEventListener("change", sync));
    return () => lists.forEach((l) => l.removeEventListener("change", sync));
  }, []);

  return profile;
}
