// Fragment shader for the Monochrome Recon background field.
// fBm noise → mouse/ripple domain warp → Bayer 8x8 ordered dither →
// animatable threshold ("develop"/invert) → opacity. Monochrome by construction.
export const DITHER_FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;        // normalized 0..1, y up
uniform float uThreshold;    // 0..1 — drives the dark→light "develop"/invert
uniform float uOpacity;      // field alpha (hero ~1.0, dashboard ~0.03)
uniform float uContrast;     // crispness of the dither edge
uniform sampler2D uBayer;    // 8x8 ordered-dither matrix
uniform vec3  uRipples[6];   // xy = origin (normalized), z = age (0..1, <0 = inactive)

// --- hash / value noise ---
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uResolution;            // 0..1
  float aspect = uResolution.x / uResolution.y;
  vec2 auv = vec2(uv.x * aspect, uv.y);    // aspect-corrected for sampling

  // --- domain warp toward mouse ---
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  vec2 toMouse = auv - m;
  float dM = length(toMouse);
  float pull = exp(-dM * 3.5) * 0.06;
  vec2 warp = -normalize(toMouse + 1e-4) * pull;

  // --- ripple rings from clicks ---
  for (int i = 0; i < 6; i++) {
    float age = uRipples[i].z;
    if (age < 0.0) continue;
    vec2 o = vec2(uRipples[i].x * aspect, uRipples[i].y);
    float d = length(auv - o);
    float ring = sin(d * 28.0 - age * 9.0);
    float env = (1.0 - age) * exp(-d * 4.0) * 0.05;
    warp += normalize(auv - o + 1e-4) * ring * env;
  }

  vec2 sp = auv * 3.0 + warp + vec2(uTime * 0.03, uTime * -0.02);
  float n = fbm(sp);                       // 0..1 luminance field

  // --- Bayer ordered dither ---
  float bayer = texture2D(uBayer, fract(frag / 8.0)).r;

  // threshold with animatable bias; uContrast sharpens the edge
  float lit = smoothstep(bayer - uContrast, bayer + uContrast, n + (uThreshold - 0.5));

  // "develop": as uThreshold crosses, invert lit/unlit (darkroom feel)
  float invert = smoothstep(0.5, 0.85, uThreshold);
  lit = mix(lit, 1.0 - lit, invert);

  gl_FragColor = vec4(vec3(lit), lit * uOpacity);
}
`;

export const DITHER_VERT = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
