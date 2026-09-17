import { describe, expect, it } from "vitest";
import { isWhalePixel } from "./whale-pixels";

describe("whale silhouette samples", () => {
  it("keeps the filled body instead of hollowing out its interior", () => {
    const luminance = new Float32Array(25).fill(1);
    expect(isWhalePixel(luminance, 5, 2, 2)).toBe(true);
    expect(isWhalePixel(luminance, 5, 0, 0)).toBe(true);
  });

  it("drops isolated bright specks and background samples", () => {
    const luminance = new Float32Array(25);
    luminance[12] = 1;
    expect(isWhalePixel(luminance, 5, 2, 2)).toBe(false);
    expect(isWhalePixel(luminance, 5, 2, 1)).toBe(false);
  });

  it("keeps connected antialiased edges without wrapping across rows", () => {
    const luminance = new Float32Array(25);
    luminance[0] = 1;
    luminance[1] = 0.3;
    luminance[4] = 1;
    luminance[6] = 0.1;
    expect(isWhalePixel(luminance, 5, 0, 0)).toBe(true);
    expect(isWhalePixel(luminance, 5, 1, 0)).toBe(true);
    expect(isWhalePixel(luminance, 5, 4, 0)).toBe(false);
    expect(isWhalePixel(luminance, 5, 1, 1)).toBe(false);
  });
});
