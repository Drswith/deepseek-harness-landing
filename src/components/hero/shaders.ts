export const FULLSCREEN_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 vUv;

void main() {
  vUv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

/** The low-resolution mouse field is advected through two alternating textures. */
export const FLOW_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec2 vUv;
uniform sampler2D u_prev;
uniform vec2 u_mouse;
uniform vec2 u_velocity;
uniform float u_brushRadius;
uniform float u_brushStrength;
uniform float u_decay;
out vec4 fragColor;

void main() {
  vec4 previous = texture(u_prev, vUv);
  previous.r *= u_decay;
  previous.gb = mix(vec2(0.5), previous.gb, u_decay);

  float distanceToMouse = distance(vUv, u_mouse);
  float influence = exp(-distanceToMouse * distanceToMouse /
    (u_brushRadius * u_brushRadius * 0.5));
  influence = max(0.0, influence - 0.01);

  float speed = length(u_velocity);
  float stationaryPresence = u_brushStrength * 0.3;
  float velocityBonus = min(speed * 3.0, 0.7) * u_brushStrength;
  float strength = stationaryPresence + velocityBonus;

  previous.r = max(previous.r, influence * strength);
  float blendAmount = influence * min(strength, 0.4) * 0.3;
  previous.g = mix(previous.g,
    clamp(u_velocity.x * 2.0 + 0.5, 0.0, 1.0), blendAmount);
  previous.b = mix(previous.b,
    clamp(u_velocity.y * 2.0 + 0.5, 0.0, 1.0), blendAmount);

  fragColor = previous;
}`;

/**
 * The visible field combines simplex noise, curl-like warping, the mouse field,
 * multi-stop color blending, grain, bloom, and the warm fixed light.
 */
export const FLUID_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec2 vUv;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_scale;
uniform vec2 u_offset;
uniform float u_grain;
uniform sampler2D u_flowmap;
uniform float u_distortBoost;
uniform float u_swirlBoost;
uniform float u_glowIntensity;
uniform vec3 u_glowColor1;
uniform vec3 u_glowColor2;
uniform vec3 u_glowColor3;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
uniform vec3 u_c5;
uniform vec2 u_lightPos;
uniform float u_lightCore;
uniform float u_lightHalo;
uniform float u_vignette;
uniform float u_bloomThreshold;
uniform float u_bloomRange;
uniform float u_bloomStrength;
out vec4 fragColor;

vec3 mod289(vec3 value) {
  return value - floor(value * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 value) {
  return value - floor(value * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 value) {
  return mod289(((value * 34.0) + 1.0) * value);
}

vec4 inverseSqrtTaylor(vec4 value) {
  return 1.79284291400159 - 0.85373472095314 * value;
}

float simplexNoise(vec3 value) {
  const vec2 skew = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 offsets = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 cell = floor(value + dot(value, skew.yyy));
  vec3 local = value - cell + dot(cell, skew.xxx);
  vec3 greater = step(local.yzx, local.xyz);
  vec3 lesser = 1.0 - greater;
  vec3 first = min(greater.xyz, lesser.zxy);
  vec3 second = max(greater.xyz, lesser.zxy);
  vec3 local1 = local - first + skew.xxx;
  vec3 local2 = local - second + skew.yyy;
  vec3 local3 = local - offsets.yyy;
  cell = mod289(cell);

  vec4 permutation = permute(permute(permute(
    cell.z + vec4(0.0, first.z, second.z, 1.0)) +
    cell.y + vec4(0.0, first.y, second.y, 1.0)) +
    cell.x + vec4(0.0, first.x, second.x, 1.0));
  float inverseSeven = 0.142857142857;
  vec3 gradientScale = inverseSeven * offsets.wyz - offsets.xzx;
  vec4 hashed = permutation - 49.0 * floor(permutation *
    gradientScale.z * gradientScale.z);
  vec4 xIndex = floor(hashed * gradientScale.z);
  vec4 yIndex = floor(hashed - 7.0 * xIndex);
  vec4 x = xIndex * gradientScale.x + gradientScale.yyyy;
  vec4 y = yIndex * gradientScale.x + gradientScale.yyyy;
  vec4 height = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 signHeight = -step(height, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * signHeight.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * signHeight.zzww;
  vec3 gradient0 = vec3(a0.xy, height.x);
  vec3 gradient1 = vec3(a0.zw, height.y);
  vec3 gradient2 = vec3(a1.xy, height.z);
  vec3 gradient3 = vec3(a1.zw, height.w);
  vec4 normalizer = inverseSqrtTaylor(vec4(
    dot(gradient0, gradient0), dot(gradient1, gradient1),
    dot(gradient2, gradient2), dot(gradient3, gradient3)));
  gradient0 *= normalizer.x;
  gradient1 *= normalizer.y;
  gradient2 *= normalizer.z;
  gradient3 *= normalizer.w;
  vec4 attenuation = max(0.6 - vec4(
    dot(local, local), dot(local1, local1),
    dot(local2, local2), dot(local3, local3)), 0.0);
  attenuation *= attenuation;
  return 42.0 * dot(attenuation * attenuation, vec4(
    dot(gradient0, local), dot(gradient1, local1),
    dot(gradient2, local2), dot(gradient3, local3)));
}

float hash(vec2 point) {
  vec3 value = fract(vec3(point.xyx) * 0.1031);
  value += dot(value, value.yzx + 33.33);
  return fract((value.x + value.y) * value.z);
}

float fbm(vec3 point) {
  float value = 0.0;
  float amplitude = 0.6;
  vec3 shift = vec3(100.0);
  // One octave matches the source's intentionally broad, slow field.
  for (int octave = 0; octave < 1; octave++) {
    value += amplitude * simplexNoise(point);
    point = point * 2.0 + shift;
    amplitude *= 0.4;
  }
  return value;
}

float fluidNoise(vec2 point, float time) {
  float noise1 = fbm(vec3(point * 0.6, time * 0.06));
  float noise2 = fbm(vec3(point * 0.6 + 5.2, time * 0.06 + 1.3));
  vec2 warp1 = vec2(noise1, noise2) * 0.6;
  float noise3 = fbm(vec3((point + warp1) * 0.7 + 1.7,
    time * 0.05 + 3.1));
  float noise4 = fbm(vec3((point + warp1) * 0.7 + 9.2,
    time * 0.05 + 5.7));
  vec2 warp2 = vec2(noise3, noise4) * 0.5;
  return fbm(vec3((point + warp1 + warp2) * 0.5, time * 0.04));
}

vec2 curlish(vec2 point, float time) {
  float epsilon = 0.02;
  float center = simplexNoise(vec3(point * 0.8, time));
  float x = simplexNoise(vec3((point + vec2(epsilon, 0.0)) * 0.8, time));
  float y = simplexNoise(vec3((point + vec2(0.0, epsilon)) * 0.8, time));
  return vec2(-(y - center) / epsilon, (x - center) / epsilon) * 0.003;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 fieldUv = vec2(uv.x * aspect, uv.y) * u_scale + u_offset;
  vec4 flow = texture(u_flowmap, uv);
  float influence = flow.r;
  vec2 flowDirection = (flow.gb - 0.5) * 2.0;
  fieldUv += flowDirection * influence * u_distortBoost * 0.8;

  float swirlAngle = influence * u_swirlBoost * 2.5;
  float cosine = cos(swirlAngle);
  float sine = sin(swirlAngle);
  vec2 delta = fieldUv - vec2(uv.x * aspect, uv.y) * u_scale;
  fieldUv += (mat2(cosine, sine, -sine, cosine) * delta - delta) * influence;

  vec2 curl = curlish(fieldUv, u_time * 0.04);
  vec2 distortedUv = fieldUv + curl * 12.0;
  float field = fluidNoise(distortedUv, u_time);
  float swirl = simplexNoise(vec3(distortedUv * 0.8 + field * 1.5,
    u_time * 0.035)) * 0.5 + 0.5;
  float normalizedField = field * 0.5 + 0.5;

  vec3 color = mix(u_c1, u_c2, smoothstep(0.2, 0.5, normalizedField));
  color = mix(color, u_c3,
    smoothstep(0.35, 0.65, normalizedField + swirl * 0.25));
  color = mix(color, u_c4, smoothstep(0.6, 0.85, swirl) * 0.55);
  color = mix(color, u_c5,
    smoothstep(0.5, 0.8, normalizedField * swirl) * 0.35);

  float glow = smoothstep(0.0, 0.8, influence);
  float glowNoise = simplexNoise(vec3(distortedUv * 1.5, u_time * 0.08)) * 0.5 + 0.5;
  float glowDistance = smoothstep(0.0, 1.0, influence);
  vec3 glowColor = mix(u_glowColor3, u_glowColor2, glowDistance);
  glowColor = mix(glowColor, u_glowColor1, glowDistance * glowNoise);
  color = mix(color, glowColor, glow * u_glowIntensity);

  if (u_grain > 0.0) {
    vec2 flowOffset = (distortedUv - fieldUv) * u_resolution.y;
    vec2 grainPoint = floor((gl_FragCoord.xy + flowOffset) / 5.0);
    color += (hash(grainPoint) * 2.0 - 1.0) * u_grain;
  }

  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  float bloom = smoothstep(u_bloomThreshold - u_bloomRange,
    u_bloomThreshold + u_bloomRange, luminance);
  color += (color * 0.85 + vec3(0.15, 0.145, 0.13)) * bloom * u_bloomStrength;

  float lightDistance = length((uv - u_lightPos) * vec2(aspect, 1.0));
  float core = exp(-lightDistance * lightDistance * 4.5);
  float halo = exp(-lightDistance * 1.8);
  color += vec3(1.0, 0.97, 0.9) * core * u_lightCore;
  color += vec3(0.72, 0.8, 1.0) * halo * u_lightHalo;

  float vignette = 1.0 - smoothstep(0.35, 0.75, length(uv - 0.5));
  color = mix(color * (1.0 - u_vignette), color, vignette);
  fragColor = vec4(color, 1.0);
}`;

export const WHALE_VERTEX_SHADER = `
attribute float aOpacity;
attribute float aIndex;
attribute float aEdge;
attribute vec3 aScattered;

uniform float uTime;
uniform float uWaveSpeed;
uniform float uWaveAmount;
uniform vec2 uMouse;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uMouseDistort;
uniform float uAssembly;
uniform float uLoose;
uniform float uScatter;
uniform vec3 uLightPos;
uniform float uLightRange;
uniform float uShadeMin;
uniform float uShadeMax;

varying float vOpacity;
varying vec3 vWorldPos;
varying float vAssembly;
varying float vLight;

void main() {
  vOpacity = aOpacity;
  vAssembly = uAssembly;
  vec3 targetCenter = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 localOffset = (instanceMatrix * vec4(position, 1.0)).xyz - targetCenter;
  float assembly = smoothstep(0.0, 1.0, uAssembly);
  vec3 center = mix(aScattered, targetCenter, assembly);
  vec3 finalPosition = center + localOffset;

  float looseness = uLoose * mix(0.25, 1.0, aEdge) * assembly;
  if (looseness > 0.001) {
    vec3 jitter = vec3(
      fract(sin(aIndex * 12.9898) * 43758.5453) - 0.5,
      fract(sin(aIndex * 78.2330) * 12543.1230) - 0.5,
      fract(sin(aIndex * 39.4250) * 26711.7700) - 0.5);
    finalPosition += jitter * 0.05 * looseness;
    finalPosition.x += sin(uTime * 0.50 + aIndex * 0.53) * 0.06 * looseness;
    finalPosition.y += cos(uTime * 0.42 + aIndex * 0.71) * 0.06 * looseness;
    finalPosition.z += sin(uTime * 0.36 + aIndex * 0.91) * 0.08 * looseness;

    float tail = smoothstep(0.5, 4.5, targetCenter.x) * uLoose * assembly;
    finalPosition.y += sin(uTime * 1.1 - targetCenter.x * 0.7) * 0.1 * tail;
    finalPosition.z += cos(uTime * 0.9 - targetCenter.x * 0.55) * 0.06 * tail;
  }

  if (uScatter > 0.001) {
    float disperse = uScatter * mix(0.5, 1.0, aEdge);
    finalPosition += (aScattered - center) * disperse;
    finalPosition.z += sin(uTime * 0.6 + aIndex * 0.3) * disperse * 0.6;
  }

  if (assembly > 0.95) {
    float effectStrength = (assembly - 0.95) * 20.0;
    float distanceFromCenter = length(center.xy);
    float waveFade = smoothstep(0.0, 3.0, distanceFromCenter);
    finalPosition.z += sin(distanceFromCenter * 3.0 - uTime * uWaveSpeed) *
      uWaveAmount * effectStrength * waveFade;
  }

  if (assembly > 0.8) {
    float mouseEffect = (assembly - 0.8) * 5.0;
    vec2 toMouse = center.xy - uMouse;
    float mouseDistance = length(toMouse);
    if (mouseDistance < uMouseRadius && mouseDistance > 0.001) {
      float falloff = 1.0 - mouseDistance / uMouseRadius;
      float force = falloff * falloff * falloff * mouseEffect * uMouseStrength;
      vec2 radial = toMouse / mouseDistance;
      float noiseAngle = sin(aIndex * 0.37 + uTime * 0.5) * uMouseDistort;
      float cosine = cos(noiseAngle);
      float sine = sin(noiseAngle);
      vec2 push = vec2(radial.x * cosine - radial.y * sine,
        radial.x * sine + radial.y * cosine);
      finalPosition.xy += push * force * 2.0;
      finalPosition.z += sin(aIndex * 1.7 + uTime) * force * 0.8;
    }
  }

  if (assembly < 0.9) {
    float scatter = smoothstep(0.9, 0.0, assembly);
    finalPosition.x += sin(uTime * 0.5 + aIndex * 0.1) * 0.2 * scatter;
    finalPosition.y += cos(uTime * 0.4 + aIndex * 0.07) * 0.2 * scatter;
    finalPosition.z += sin(uTime * 0.3 + aIndex * 0.13) * 0.15 * scatter;
  }

  vec4 worldPosition = modelMatrix * vec4(finalPosition, 1.0);
  vWorldPos = worldPosition.xyz;
  float lightDistance = distance(worldPosition.xyz, uLightPos);
  float lit = clamp(1.0 - lightDistance / uLightRange, 0.0, 1.0);
  vLight = mix(uShadeMin, uShadeMax, lit * lit);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
}`;

export const WHALE_FRAGMENT_SHADER = `
varying float vOpacity;
varying vec3 vWorldPos;
varying float vAssembly;
varying float vLight;

uniform float uTime;
uniform vec3 uColor;

void main() {
  float distanceFromCenter = length(vWorldPos.xy);
  float glow = smoothstep(8.0, 0.0, distanceFromCenter) * 0.3 * vAssembly;
  float alpha = vOpacity * (mix(0.45, 0.75, vAssembly) + glow);
  float shimmer = sin(uTime * 1.5 + vWorldPos.x * 5.0 + vWorldPos.y * 3.0) * 0.1 + 0.9;
  alpha *= shimmer * min(vLight, 1.0);
  vec3 color = (uColor + glow * vec3(0.2, 0.3, 0.5)) * vLight;
  color = mix(color, color * vec3(1.07, 1.02, 0.94),
    clamp(vLight - 1.0, 0.0, 1.0));
  gl_FragColor = vec4(color, alpha);
}`;
