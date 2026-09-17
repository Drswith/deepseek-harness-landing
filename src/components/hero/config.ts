export type HeroVariant = "hero" | "community";

export interface FluidParameters {
  brushRadius: number;
  brushStrength: number;
  mouseSmoothing: number;
  mouseVelocity: number;
  decay: number;
  distortBoost: number;
  noiseBoost: number;
  swirlBoost: number;
  glowIntensity: number;
  glowColors: readonly string[];
  speed: number;
  distortion: number;
  swirl: number;
  swirlIterations: number;
  scale: number;
  offset: readonly [number, number];
  grain: number;
  colors: readonly string[];
  lightPosition: readonly [number, number];
  lightCore: number;
  lightHalo: number;
  vignette: number;
  bloomThreshold: number;
  bloomRange: number;
  bloomStrength: number;
}

/**
 * Tunables extracted from the Harness hero's fluid configuration.
 * The values stay in source form so the shader has an explicit, reviewable API.
 * Offline provenance: RECON/source/page-f752721b763e9f77.js function u and
 * site/harness/_next/static/chunks/776.7b3219fa93f8a656.js function v.
 */
export const HERO_FLUID_PARAMETERS: FluidParameters = {
  brushRadius: 0.09,
  brushStrength: 1.8,
  mouseSmoothing: 0.1,
  mouseVelocity: 0.2,
  decay: 0.925,
  distortBoost: 2.2,
  noiseBoost: 0.3,
  swirlBoost: 0.8,
  glowIntensity: 0.13,
  glowColors: ["#fff7d1", "#538dca", "#2d448b"],
  speed: 28,
  distortion: 18,
  swirl: 20,
  swirlIterations: 12,
  scale: 1.77,
  offset: [-1.24, -0.48],
  grain: 0.005,
  colors: ["#000000", "#1A3870", "#204a7e", "#eed8aa", "#000000"],
  lightPosition: [0.89, 0.46],
  lightCore: 0.14,
  lightHalo: 0.2,
  vignette: 0.38,
  bloomThreshold: 0.61,
  bloomRange: 0.18,
  bloomStrength: 0.4,
};

const COMMUNITY_FLUID_PARAMETERS: FluidParameters = HERO_FLUID_PARAMETERS;

export function fluidParametersFor(variant: HeroVariant): FluidParameters {
  return variant === "community"
    ? COMMUNITY_FLUID_PARAMETERS
    : HERO_FLUID_PARAMETERS;
}

export function hexToRgb(color: string): readonly [number, number, number] {
  const value = color.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
  ];
}
