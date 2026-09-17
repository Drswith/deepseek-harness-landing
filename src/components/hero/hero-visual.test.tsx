import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroVisual } from "./hero-visual";

describe("hero background layers", () => {
  it("renders the hero without an additional dark overlay", () => {
    const html = renderToStaticMarkup(<HeroVisual />);

    expect(html).toContain("hero-visual__fluid");
    expect(html).toContain("hero-visual__grid");
    expect(html).toContain("hero-visual__whale");
    expect(html).not.toContain("hero-visual__shade");
  });

  it("retains the community section's dark overlay", () => {
    const html = renderToStaticMarkup(<HeroVisual variant="community" />);

    expect(html).toContain("hero-visual__shade");
    expect(html).not.toContain("hero-visual__whale");
  });
});
