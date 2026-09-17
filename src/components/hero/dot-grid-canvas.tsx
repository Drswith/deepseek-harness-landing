import { useEffect, useRef, type ReactElement } from "react";

const GRID_SIZE = 90;
const MOUSE_RADIUS = 140;
const FRAME_INTERVAL = 1000 / 30;

interface GridPoint {
  restX: number;
  restY: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

/**
 * Draws the hero's desktop-only spring grid. Points and links are kept in a
 * mutable array so pointer movement never schedules a React render.
 */
export function DotGridCanvas(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const coarsePointer = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;
    if (coarsePointer) return undefined;
    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const points: GridPoint[] = [];
    const pointer = { x: Number.NaN, y: Number.NaN };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let columns = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let rebuilding: number | undefined;
    let raf = 0;
    let lastFrame = 0;
    let visible = true;
    let running = false;
    let settled = false;

    const rebuild = (): void => {
      columns = Math.ceil(width / GRID_SIZE) + 1;
      rows = Math.ceil(height / GRID_SIZE) + 1;
      const originX = (width - (columns - 1) * GRID_SIZE) / 2;
      const originY = (height - (rows - 1) * GRID_SIZE) / 2;
      points.length = 0;
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const x = originX + column * GRID_SIZE;
          const y = originY + row * GRID_SIZE;
          points.push({ restX: x, restY: y, x, y, velocityX: 0, velocityY: 0 });
        }
      }
      settled = false;
    };

    const resize = (): void => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };
    const onResize = (): void => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (rebuilding !== undefined) window.clearTimeout(rebuilding);
      rebuilding = window.setTimeout(rebuild, 150);
      start();
    };

    const draw = (): void => {
      context.clearRect(0, 0, width, height);
      context.strokeStyle = "rgba(255, 255, 255, 0.08)";
      context.lineWidth = 0.5;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns - 1; column += 1) {
          const left = points[row * columns + column];
          const right = points[row * columns + column + 1];
          const deltaX = right.x - left.x;
          const deltaY = right.y - left.y;
          const distance = Math.hypot(deltaX, deltaY);
          if (distance >= 20) {
            const unitX = deltaX / distance;
            const unitY = deltaY / distance;
            context.beginPath();
            context.moveTo(left.x + 10 * unitX, left.y + 10 * unitY);
            context.lineTo(right.x - 10 * unitX, right.y - 10 * unitY);
            context.stroke();
          }
        }
      }
      for (let column = 0; column < columns; column += 1) {
        for (let row = 0; row < rows - 1; row += 1) {
          const top = points[row * columns + column];
          const bottom = points[(row + 1) * columns + column];
          const deltaX = bottom.x - top.x;
          const deltaY = bottom.y - top.y;
          const distance = Math.hypot(deltaX, deltaY);
          if (distance >= 20) {
            const unitX = deltaX / distance;
            const unitY = deltaY / distance;
            context.beginPath();
            context.moveTo(top.x + 10 * unitX, top.y + 10 * unitY);
            context.lineTo(bottom.x - 10 * unitX, bottom.y - 10 * unitY);
            context.stroke();
          }
        }
      }

      context.fillStyle = "rgba(255, 255, 255, 0.16)";
      for (const point of points) {
        let size = 1.8;
        let opacity = 0.16;
        if (!Number.isNaN(pointer.x) && !Number.isNaN(pointer.y)) {
          const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
          const influence = Math.max(0, 1 - distance / MOUSE_RADIUS);
          size = 1.8 + 2 * influence;
          opacity += 0.4 * influence;
        }
        context.globalAlpha = opacity;
        context.fillRect(point.x - size, point.y - size, size * 2, size * 2);
      }
      context.globalAlpha = 1;
    };

    const step = (): boolean => {
      let maximumVelocity = 0;
      for (const point of points) {
        const deltaX = point.x - pointer.x;
        const deltaY = point.y - pointer.y;
        const distance = Math.hypot(deltaX, deltaY);
        if (distance < MOUSE_RADIUS && distance > 0.1) {
          const force = (1 - distance / MOUSE_RADIUS) * 30;
          point.velocityX += (deltaX / distance) * force * 0.1;
          point.velocityY += (deltaY / distance) * force * 0.1;
        }
        point.velocityX += (point.restX - point.x) * 0.05;
        point.velocityY += (point.restY - point.y) * 0.05;
        point.velocityX *= 0.85;
        point.velocityY *= 0.85;
        point.x += point.velocityX;
        point.y += point.velocityY;
        maximumVelocity = Math.max(
          maximumVelocity,
          Math.abs(point.velocityX) + Math.abs(point.velocityY),
        );
      }
      return maximumVelocity >= 0.01;
    };

    const stop = (): void => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const frame = (timestamp: number): void => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (timestamp - lastFrame < FRAME_INTERVAL) return;
      lastFrame = timestamp - ((timestamp - lastFrame) % FRAME_INTERVAL);
      settled = !step();
      draw();
      if (settled) stop();
    };
    const start = (): void => {
      if (running || !visible || reducedMotion) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const onMouseMove = (event: MouseEvent): void => {
      const rectangle = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rectangle.left;
      pointer.y = event.clientY - rectangle.top;
      start();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    const resizeObserver = new ResizeObserver(onResize);
    const onVisibilityChange = (): void => {
      if (document.hidden) stop();
      else start();
    };

    resize();
    draw();
    observer.observe(canvas);
    resizeObserver.observe(canvas);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (!reducedMotion) start();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (rebuilding !== undefined) window.clearTimeout(rebuilding);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hero-visual__canvas"
      aria-hidden="true"
    />
  );
}
