/**
 * Keeps the filled silhouette while rejecting isolated antialiasing specks.
 * @param luminance Row-major grayscale samples normalized to 0–1.
 * @param size Width and height of the square sample grid.
 * @param x Sample column.
 * @param y Sample row.
 * @returns Whether the sample belongs to a connected part of the whale.
 */
export function isWhalePixel(
  luminance: Float32Array,
  size: number,
  x: number,
  y: number,
): boolean {
  if (luminance[y * size + x] <= 0.2) return false;

  for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
    for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) continue;
      const neighborX = x + offsetX;
      const neighborY = y + offsetY;
      if (
        neighborX >= 0 &&
        neighborY >= 0 &&
        neighborX < size &&
        neighborY < size &&
        luminance[neighborY * size + neighborX] > 0.2
      ) {
        return true;
      }
    }
  }
  return false;
}
