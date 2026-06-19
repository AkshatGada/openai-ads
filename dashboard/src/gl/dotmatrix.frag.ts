// LED dot-matrix field — Nothing-inspired. A regular grid of dots that brighten
// and grow toward the cursor (a soft spotlight), shimmer idly, ripple on click,
// and occasionally flicker orange. Monochrome off-white on black; the same field
// renders as a faint grey dot-grid behind the white dashboard (via uOpacity/uTint).
export const DOT_VERT = /* glsl */ `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

export const DOT_FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;      // normalized 0..1, y up
uniform float uOpacity;    // overall field alpha
uniform float uDark;       // 1 = dark landing (glow), 0 = light dashboard (grey grid)
uniform float uGrid;       // dot grid spacing in px
uniform vec3  uAccent;     // ember orange
uniform vec3  uRipples[6]; // xy origin (normalized), z age (0..1, <0 inactive)

float hash(vec2 p){ p = fract(p*vec2(123.34,345.45)); p += dot(p,p+34.345); return fract(p.x*p.y); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  float aspect = uResolution.x / uResolution.y;

  // cell + local dot coordinate
  vec2 cell = floor(frag / uGrid);
  vec2 cellCenterPx = (cell + 0.5) * uGrid;
  vec2 local = (frag - cellCenterPx) / (uGrid * 0.5); // -1..1 within cell
  float dist = length(local);

  // base dot radius (as fraction of half-cell)
  float baseR = 0.18;

  // cursor spotlight: dots near the mouse grow + brighten
  vec2 mousePx = vec2(uMouse.x, 1.0 - uMouse.y) * uResolution;
  float dM = distance(cellCenterPx, mousePx) / uResolution.y; // ~0..1
  float spot = exp(-dM * 4.0);

  // idle shimmer per-cell
  float rnd = hash(cell);
  float shimmer = 0.5 + 0.5 * sin(uTime * 1.2 + rnd * 6.2831);

  // click ripples
  float ripple = 0.0;
  for (int i = 0; i < 6; i++) {
    float age = uRipples[i].z;
    if (age < 0.0) continue;
    vec2 oPx = vec2(uRipples[i].x, 1.0 - uRipples[i].y) * uResolution;
    float d = distance(cellCenterPx, oPx) / uResolution.y;
    float ring = smoothstep(0.06, 0.0, abs(d - age * 0.9));
    ripple += ring * (1.0 - age);
  }

  // final dot size + brightness
  float radius = baseR * (1.0 + spot * 1.4 + ripple * 1.2);
  float dot = smoothstep(radius, radius - 0.06, dist);

  float baseBright = mix(0.06, 0.14, shimmer);          // faint idle dots
  float bright = baseBright + spot * 0.9 + ripple * 0.8;

  // color: off-white dots, orange tint near cursor / on ripple / rare cells
  float orangeMix = clamp(spot * 0.8 + ripple + step(0.985, rnd) * 0.6, 0.0, 1.0);
  vec3 lit = mix(vec3(0.92), uAccent, orangeMix);

  // dark mode = glowing dots on black; light mode = dark-grey dots on white
  vec3 col = mix(vec3(0.0), lit, uDark);                 // dark: additive-ish glow
  col = mix(vec3(0.80) - lit * 0.65, col, uDark);        // light: grey dots
  float alpha = dot * bright * uOpacity;

  gl_FragColor = vec4(col, alpha);
}
`;
