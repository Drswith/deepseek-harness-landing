import { useEffect, useRef, type ReactElement } from "react";

import { fluidParametersFor, hexToRgb, type HeroVariant } from "./config";
import {
  FLOW_FRAGMENT_SHADER,
  FLUID_FRAGMENT_SHADER,
  FULLSCREEN_VERTEX_SHADER,
} from "./shaders";

const MAX_DPR = 1.5;
const FRAME_INTERVAL = 1000 / 30;

interface FlowTarget {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
}

interface MouseState {
  x: number;
  y: number;
  smoothX: number;
  smoothY: number;
  velocityX: number;
  velocityY: number;
  smoothVelocityX: number;
  smoothVelocityY: number;
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error("Hero fluid shader:", gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  console.error("Hero fluid program:", gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
}

function createFlowTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
): FlowTarget | null {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) {
    if (texture) gl.deleteTexture(texture);
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    return null;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { framebuffer, texture };
}

function clearFlowTarget(
  gl: WebGL2RenderingContext,
  target: FlowTarget,
  width: number,
  height: number,
): void {
  const initial = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    initial[index * 4 + 1] = 128;
    initial[index * 4 + 2] = 128;
    initial[index * 4 + 3] = 255;
  }
  gl.bindTexture(gl.TEXTURE_2D, target.texture);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0,
    0,
    width,
    height,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    initial,
  );
}

function deleteFlowTarget(
  gl: WebGL2RenderingContext,
  target: FlowTarget | undefined,
): void {
  if (!target) return;
  gl.deleteFramebuffer(target.framebuffer);
  gl.deleteTexture(target.texture);
}

function setRgb(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  color: readonly [number, number, number],
): void {
  gl.uniform3f(
    gl.getUniformLocation(program, name),
    color[0],
    color[1],
    color[2],
  );
}

/**
 * Runs the original hero's WebGL2 fluid field with a low-resolution ping-pong
 * mouse buffer. It owns its RAF, framebuffer textures, and global pointer hook.
 */
export function FluidCanvas({
  variant,
}: {
  variant: HeroVariant;
}): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return undefined;

    const parameters = fluidParametersFor(variant);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const coarsePointer = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;
    const userAgentData =
      "userAgentData" in navigator
        ? (navigator as Navigator & { userAgentData?: { platform?: string } })
            .userAgentData
        : undefined;
    const windows =
      userAgentData?.platform === "Windows" ||
      navigator.userAgent.includes("Windows");
    const interactive = !reducedMotion && !coarsePointer && !windows;
    const flowProgram = createProgram(
      gl,
      FULLSCREEN_VERTEX_SHADER,
      FLOW_FRAGMENT_SHADER,
    );
    const fluidProgram = createProgram(
      gl,
      FULLSCREEN_VERTEX_SHADER,
      FLUID_FRAGMENT_SHADER,
    );
    const quadBuffer = gl.createBuffer();
    if (!flowProgram || !fluidProgram || !quadBuffer) {
      if (flowProgram) gl.deleteProgram(flowProgram);
      if (fluidProgram) gl.deleteProgram(fluidProgram);
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      return undefined;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);

    const mouse: MouseState = {
      x: 0.5,
      y: 0.5,
      smoothX: 0.5,
      smoothY: 0.5,
      velocityX: 0,
      velocityY: 0,
      smoothVelocityX: 0,
      smoothVelocityY: 0,
    };
    let width = 1;
    let height = 1;
    let flowWidth = 1;
    let flowHeight = 1;
    let flowTargets: FlowTarget[] = [];
    let readIndex = 0;
    let raf = 0;
    let lastFrame = 0;
    let startTime = performance.now();
    let visible = true;
    let running = false;

    const recreateFlowTargets = (
      nextWidth: number,
      nextHeight: number,
    ): void => {
      flowTargets.forEach((target) => deleteFlowTarget(gl, target));
      flowTargets = [];
      const first = createFlowTarget(gl, nextWidth, nextHeight);
      const second = createFlowTarget(gl, nextWidth, nextHeight);
      if (!first || !second) {
        deleteFlowTarget(gl, first ?? undefined);
        deleteFlowTarget(gl, second ?? undefined);
        return;
      }
      flowTargets = [first, second];
      clearFlowTarget(gl, first, nextWidth, nextHeight);
      clearFlowTarget(gl, second, nextWidth, nextHeight);
      readIndex = 0;
      flowWidth = nextWidth;
      flowHeight = nextHeight;
    };

    const resize = (): void => {
      const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const nextWidth = Math.max(1, Math.round(canvas.clientWidth * nextDpr));
      const nextHeight = Math.max(1, Math.round(canvas.clientHeight * nextDpr));
      const nextFlowWidth = Math.max(1, Math.round(nextWidth / 4));
      const nextFlowHeight = Math.max(1, Math.round(nextHeight / 4));
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth;
        height = nextHeight;
        canvas.width = width;
        canvas.height = height;
      }
      if (
        flowTargets.length !== 2 ||
        nextFlowWidth !== flowWidth ||
        nextFlowHeight !== flowHeight
      ) {
        recreateFlowTargets(nextFlowWidth, nextFlowHeight);
      }
    };

    const bindQuad = (program: WebGLProgram): void => {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    };

    const render = (timestamp: number): void => {
      resize();
      if (flowTargets.length !== 2) return;
      const previous = flowTargets[readIndex];
      const next = flowTargets[1 - readIndex];
      if (interactive) {
        mouse.smoothX += (mouse.x - mouse.smoothX) * parameters.mouseSmoothing;
        mouse.smoothY += (mouse.y - mouse.smoothY) * parameters.mouseSmoothing;
        mouse.smoothVelocityX +=
          ((mouse.x - mouse.smoothX) * 0.5 - mouse.smoothVelocityX) *
          parameters.mouseVelocity;
        mouse.smoothVelocityY +=
          ((mouse.y - mouse.smoothY) * 0.5 - mouse.smoothVelocityY) *
          parameters.mouseVelocity;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, next.framebuffer);
      gl.viewport(0, 0, flowWidth, flowHeight);
      bindQuad(flowProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, previous.texture);
      gl.uniform1i(gl.getUniformLocation(flowProgram, "u_prev"), 0);
      gl.uniform2f(
        gl.getUniformLocation(flowProgram, "u_mouse"),
        mouse.smoothX,
        mouse.smoothY,
      );
      gl.uniform2f(
        gl.getUniformLocation(flowProgram, "u_velocity"),
        mouse.smoothVelocityX,
        mouse.smoothVelocityY,
      );
      gl.uniform1f(
        gl.getUniformLocation(flowProgram, "u_brushRadius"),
        parameters.brushRadius,
      );
      gl.uniform1f(
        gl.getUniformLocation(flowProgram, "u_brushStrength"),
        interactive ? parameters.brushStrength : 0,
      );
      gl.uniform1f(
        gl.getUniformLocation(flowProgram, "u_decay"),
        parameters.decay,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      const time = (timestamp - startTime) * 0.001 * (parameters.speed / 100);
      gl.viewport(0, 0, width, height);
      bindQuad(fluidProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, next.texture);
      gl.uniform1i(gl.getUniformLocation(fluidProgram, "u_flowmap"), 0);
      gl.uniform1f(gl.getUniformLocation(fluidProgram, "u_time"), time);
      gl.uniform2f(
        gl.getUniformLocation(fluidProgram, "u_resolution"),
        width,
        height,
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_scale"),
        parameters.scale,
      );
      gl.uniform2f(
        gl.getUniformLocation(fluidProgram, "u_offset"),
        parameters.offset[0],
        parameters.offset[1],
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_grain"),
        parameters.grain,
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_distortBoost"),
        parameters.distortBoost,
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_swirlBoost"),
        parameters.swirlBoost,
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_glowIntensity"),
        parameters.glowIntensity,
      );
      const lightX =
        parameters.lightPosition[0] +
        (mouse.smoothX - parameters.lightPosition[0]) *
          (interactive ? 0.63 : 0);
      gl.uniform2f(
        gl.getUniformLocation(fluidProgram, "u_lightPos"),
        lightX,
        parameters.lightPosition[1],
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_lightCore"),
        interactive ? parameters.lightCore : 0,
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_lightHalo"),
        interactive ? parameters.lightHalo : 0,
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_vignette"),
        parameters.vignette,
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_bloomThreshold"),
        parameters.bloomThreshold,
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_bloomRange"),
        parameters.bloomRange,
      );
      gl.uniform1f(
        gl.getUniformLocation(fluidProgram, "u_bloomStrength"),
        parameters.bloomStrength,
      );

      const colors = parameters.colors.map(hexToRgb);
      colors.forEach((color, index) =>
        setRgb(gl, fluidProgram, `u_c${index + 1}`, color),
      );
      const glowColors = parameters.glowColors.map(hexToRgb);
      glowColors.forEach((color, index) => {
        setRgb(gl, fluidProgram, `u_glowColor${index + 1}`, color);
      });
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      readIndex = 1 - readIndex;
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
      render(timestamp);
    };
    const start = (): void => {
      if (running || !visible || reducedMotion) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const onMouseMove = (event: MouseEvent): void => {
      const rectangle = canvas.getBoundingClientRect();
      mouse.x = (event.clientX - rectangle.left) / rectangle.width;
      mouse.y = 1 - (event.clientY - rectangle.top) / rectangle.height;
      start();
    };
    const onVisibilityChange = (): void => {
      if (document.hidden) stop();
      else start();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });

    resize();
    render(startTime);
    observer.observe(canvas);
    if (interactive)
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (!reducedMotion) start();

    return () => {
      stop();
      observer.disconnect();
      if (interactive) window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flowTargets.forEach((target) => deleteFlowTarget(gl, target));
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(flowProgram);
      gl.deleteProgram(fluidProgram);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className="hero-visual__canvas"
      aria-hidden="true"
    />
  );
}
