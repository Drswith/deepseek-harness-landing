import { type ReactElement } from "react";

import "./hero-visual.css";

import { DotGridCanvas } from "./dot-grid-canvas";
import { FluidCanvas } from "./fluid-canvas";
import type { HeroVariant } from "./config";
import { WhalePoints } from "./whale-points";

export interface HeroVisualProps {
  variant?: HeroVariant;
}

/** Absolute visual layer for a relative hero/community parent. */
export function HeroVisual({
  variant = "hero",
}: HeroVisualProps): ReactElement {
  return (
    <div className={`hero-visual hero-visual--${variant}`} aria-hidden="true">
      <div className="hero-visual__fluid">
        <FluidCanvas variant={variant} />
      </div>
      <div className="hero-visual__grid">
        <DotGridCanvas />
      </div>
      {variant === "hero" ? (
        <div className="hero-visual__whale">
          <WhalePoints variant={variant} />
        </div>
      ) : null}
      <div className="hero-visual__shade" />
    </div>
  );
}
