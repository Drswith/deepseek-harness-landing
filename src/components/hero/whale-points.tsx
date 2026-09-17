import { useEffect, useRef, useState, type ReactElement } from "react";
import * as THREE from "three";

import type { HeroVariant } from "./config";
import { WHALE_FRAGMENT_SHADER, WHALE_VERTEX_SHADER } from "./shaders";

const WHALE_ASSET = "/images/hero-whale.svg";
const PIXEL_SAMPLE_SIZE = 60;
const MAX_DPR = 1.5;
const FRAME_INTERVAL = 1000 / 30;

interface WhalePixelData {
  positions: Float32Array;
  scatteredPositions: Float32Array;
  opacities: Float32Array;
  edges: Float32Array;
  count: number;
}

function deterministicUnit(index: number, salt: number): number {
  return (Math.sin(index * salt) * 43758.5453) % 1;
}

function sampleWhale(image: HTMLImageElement): WhalePixelData | null {
  const canvas = document.createElement("canvas");
  canvas.width = PIXEL_SAMPLE_SIZE;
  canvas.height = PIXEL_SAMPLE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#000000";
  context.fillRect(0, 0, PIXEL_SAMPLE_SIZE, PIXEL_SAMPLE_SIZE);
  const scale = Math.min(
    PIXEL_SAMPLE_SIZE / image.width,
    PIXEL_SAMPLE_SIZE / image.height,
  );
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;
  context.drawImage(
    image,
    (PIXEL_SAMPLE_SIZE - imageWidth) / 2,
    (PIXEL_SAMPLE_SIZE - imageHeight) / 2,
    imageWidth,
    imageHeight,
  );

  const pixels = context.getImageData(
    0,
    0,
    PIXEL_SAMPLE_SIZE,
    PIXEL_SAMPLE_SIZE,
  ).data;
  const luminance = new Float32Array(PIXEL_SAMPLE_SIZE * PIXEL_SAMPLE_SIZE);
  for (let index = 0; index < luminance.length; index += 1) {
    const offset = index * 4;
    luminance[index] =
      (0.299 * pixels[offset] +
        0.587 * pixels[offset + 1] +
        0.114 * pixels[offset + 2]) /
      255;
  }

  const isInterior = (x: number, y: number): boolean => {
    for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
      for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) continue;
        const neighborX = x + offsetX;
        const neighborY = y + offsetY;
        if (
          neighborX < 0 ||
          neighborY < 0 ||
          neighborX >= PIXEL_SAMPLE_SIZE ||
          neighborY >= PIXEL_SAMPLE_SIZE ||
          luminance[neighborY * PIXEL_SAMPLE_SIZE + neighborX] <= 0.2
        ) {
          return false;
        }
      }
    }
    return true;
  };

  const positions: number[] = [];
  const opacities: number[] = [];
  const edges: number[] = [];
  const scatteredPositions: number[] = [];
  const center = PIXEL_SAMPLE_SIZE / 2;
  for (let y = 0; y < PIXEL_SAMPLE_SIZE; y += 1) {
    for (let x = 0; x < PIXEL_SAMPLE_SIZE; x += 1) {
      const opacity = luminance[y * PIXEL_SAMPLE_SIZE + x];
      if (opacity <= 0.2 || isInterior(x, y)) continue;
      positions.push((x - center) * 0.18, (center - y) * 0.18, 0);
      opacities.push(opacity);

      let emptyNeighbors = 0;
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue;
          const neighborX = x + offsetX;
          const neighborY = y + offsetY;
          if (
            neighborX < 0 ||
            neighborY < 0 ||
            neighborX >= PIXEL_SAMPLE_SIZE ||
            neighborY >= PIXEL_SAMPLE_SIZE ||
            luminance[neighborY * PIXEL_SAMPLE_SIZE + neighborX] <= 0.2
          ) {
            emptyNeighbors += 1;
          }
        }
      }
      edges.push(emptyNeighbors / 8);

      const pointIndex = opacities.length - 1;
      const angle = deterministicUnit(pointIndex, 12.9898) * Math.PI * 2;
      const latitude = Math.acos(
        2 * Math.abs(deterministicUnit(pointIndex, 78.233)) - 1,
      );
      const radius =
        3 * (0.4 + 0.6 * Math.abs(deterministicUnit(pointIndex, 39.425)));
      scatteredPositions.push(
        Math.sin(latitude) * Math.cos(angle) * radius,
        Math.sin(latitude) * Math.sin(angle) * radius,
        Math.cos(latitude) * radius * 0.5,
      );
    }
  }

  return {
    positions: new Float32Array(positions),
    scatteredPositions: new Float32Array(scatteredPositions),
    opacities: new Float32Array(opacities),
    edges: new Float32Array(edges),
    count: opacities.length,
  };
}

function createWhaleMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: WHALE_VERTEX_SHADER,
    fragmentShader: WHALE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uWaveSpeed: { value: 1.5 },
      uWaveAmount: { value: 0.06 },
      uLightPos: { value: new THREE.Vector3(4.5, 5.5, 3) },
      uLightRange: { value: 14 },
      uShadeMin: { value: 0.2 },
      uShadeMax: { value: 1.116 },
      uColor: { value: new THREE.Color(0.75, 0.8, 0.9) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseRadius: { value: 4.9 },
      uMouseStrength: { value: 0.4 },
      uMouseDistort: { value: 5 },
      uAssembly: { value: 0 },
      uLoose: { value: 1 },
      uScatter: { value: 0 },
    },
  });
}

/**
 * Loads the supplied whale SVG into a 60px silhouette and renders its edge
 * pixels as an animated Three.js instanced mesh, matching the source's fish mode.
 */
export function WhalePoints({
  variant,
}: {
  variant: HeroVariant;
}): ReactElement | null {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pixelData, setPixelData] = useState<WhalePixelData | null>(null);

  useEffect(() => {
    let disposed = false;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (!disposed) setPixelData(sampleWhale(image));
    };
    image.onerror = () => {
      if (!disposed) setPixelData(null);
    };
    image.src = WHALE_ASSET;
    return () => {
      disposed = true;
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas || !pixelData || pixelData.count === 0)
      return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const coarsePointer = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;
    const mobileWidth = window.matchMedia("(max-width: 767px)").matches;
    if (mobileWidth || coarsePointer) return undefined;
    let renderer: THREE.WebGLRenderer | undefined;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch (error) {
      console.warn(
        "Hero whale WebGL unavailable; retaining the fluid fallback.",
        error,
      );
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 18;
    const group = new THREE.Group();
    const object = new THREE.Object3D();
    const geometry = new THREE.BoxGeometry(0.06, 0.06, 0.018);
    const indexArray = new Float32Array(pixelData.count);
    for (let index = 0; index < pixelData.count; index += 1) {
      indexArray[index] = index;
    }
    const mesh = new THREE.InstancedMesh(
      geometry,
      createWhaleMaterial(),
      pixelData.count,
    );
    for (let index = 0; index < pixelData.count; index += 1) {
      const offset = index * 3;
      object.position.set(
        pixelData.positions[offset],
        pixelData.positions[offset + 1],
        pixelData.positions[offset + 2],
      );
      const scale = 0.5 + Math.abs(deterministicUnit(index, 4.123)) * 1;
      object.scale.setScalar(scale);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
    }
    mesh.geometry.setAttribute(
      "aOpacity",
      new THREE.InstancedBufferAttribute(pixelData.opacities, 1),
    );
    mesh.geometry.setAttribute(
      "aIndex",
      new THREE.InstancedBufferAttribute(indexArray, 1),
    );
    mesh.geometry.setAttribute(
      "aScattered",
      new THREE.InstancedBufferAttribute(pixelData.scatteredPositions, 3),
    );
    mesh.geometry.setAttribute(
      "aEdge",
      new THREE.InstancedBufferAttribute(pixelData.edges, 1),
    );
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    scene.add(group);

    const mouse = new THREE.Vector2(0, 0);
    const mouseWorld = new THREE.Vector2(0, 0);
    let mouseActive = false;
    let mouseHasMoved = false;
    let scroll = 0;
    let visible = true;
    let running = false;
    let raf = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let previousTimestamp = performance.now();
    const material = mesh.material as THREE.ShaderMaterial;

    const resize = (): void => {
      const width = Math.max(1, wrapper.clientWidth);
      const height = Math.max(1, wrapper.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const updateMouse = (event: MouseEvent): void => {
      const rectangle = wrapper.getBoundingClientRect();
      mouse.x = ((event.clientX - rectangle.left) / rectangle.width) * 2 - 1;
      mouse.y = -(((event.clientY - rectangle.top) / rectangle.height) * 2 - 1);
      mouseActive = true;
      mouseHasMoved = true;
    };
    const clearMouse = (): void => {
      mouseActive = false;
    };
    const updateScroll = (): void => {
      scroll = Math.min(
        1,
        Math.max(0, window.scrollY / Math.max(1, window.innerHeight)),
      );
    };
    const applyFrame = (timestamp: number): void => {
      const delta = Math.min(0.1, (timestamp - previousTimestamp) / 1000);
      previousTimestamp = timestamp;
      if (!reducedMotion) elapsed += delta;
      const assemblyProgress = reducedMotion
        ? 1
        : Math.min(1, Math.max(0, (elapsed - 0.3) / 2.5));
      const assembly = 1 - Math.pow(1 - assemblyProgress, 3);
      const viewportHeight =
        2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
      const viewportWidth = viewportHeight * camera.aspect;
      const mouseX = mouse.x * viewportWidth * 0.5;
      const mouseY = mouse.y * viewportHeight * 0.5;
      mouseWorld.lerp(
        new THREE.Vector2(mouseX, mouseY),
        mouseHasMoved ? 0.2 : 1,
      );
      const activeStrength = mouseActive ? 0.8 : 0;
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uAssembly.value = assembly;
      material.uniforms.uScatter.value = 1.6 * Math.min(1, 1.5 * scroll);
      material.uniforms.uMouseRadius.value = 4.9;
      material.uniforms.uMouseStrength.value +=
        (activeStrength - material.uniforms.uMouseStrength.value) *
        (1 - Math.pow(0.05, Math.max(delta, 1 / 30)));
      material.uniforms.uMouse.value.copy(mouseWorld);
      material.uniforms.uColor.value.setRGB(
        0.75 * assembly,
        0.8 * assembly,
        0.9 * assembly,
      );
      group.rotation.z =
        elapsed * (1 - assembly) * 0.3 + 0.04 * Math.sin(0.25 * elapsed);
      group.rotation.x = 0.05 * Math.sin(0.08 * elapsed * 0.7);
      group.rotation.y = 0.1 * Math.sin(0.08 * elapsed);
      group.position.y = 0.15 * Math.sin(0.4 * elapsed) + 2.5 * scroll;
      group.scale.setScalar((0.75 + 0.25 * assembly) * (1 - 0.5 * scroll));
      renderer.render(scene, camera);
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
      applyFrame(timestamp);
    };
    const start = (): void => {
      if (running || !visible || reducedMotion) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { rootMargin: "100px" },
    );
    const resizeObserver = new ResizeObserver(resize);
    const onVisibilityChange = (): void => {
      if (document.hidden) {
        mouseActive = false;
        stop();
      } else start();
    };

    resize();
    applyFrame(performance.now());
    observer.observe(wrapper);
    resizeObserver.observe(wrapper);
    if (!reducedMotion) {
      window.addEventListener("mousemove", updateMouse, { passive: true });
      window.addEventListener("mouseleave", clearMouse);
    }
    window.addEventListener("scroll", updateScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (!reducedMotion) start();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      if (!reducedMotion) {
        window.removeEventListener("mousemove", updateMouse);
        window.removeEventListener("mouseleave", clearMouse);
      }
      window.removeEventListener("scroll", updateScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [pixelData, variant]);

  if (!pixelData) return null;
  return (
    <div ref={wrapperRef} className="hero-visual__whale-canvas">
      <canvas
        ref={canvasRef}
        className="hero-visual__canvas"
        aria-hidden="true"
      />
    </div>
  );
}
