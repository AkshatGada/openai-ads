import { useEffect, useRef } from "react";
import { Renderer, Triangle, Program, Mesh, Texture } from "ogl";
import { useMotionValue, useReducedMotion, type MotionValue } from "motion/react";
import { DITHER_FRAG, DITHER_VERT } from "./dither.frag";
import { bayerTextureData, BAYER_SIZE } from "./bayer";

interface DitherFieldProps {
  /** Animated [0..1]. Hero ≈ 0.5, dashboard end ≈ ~0.8 (drives the "develop"/invert). */
  threshold: MotionValue<number>;
  /** Animated field alpha. Hero ≈ 1.0, dashboard ≈ 0.04. */
  opacity: MotionValue<number>;
}

const MAX_RIPPLES = 6;

/**
 * Full-viewport WebGL Bayer-dither field. Mounts ONCE (no key, never inside the
 * phase AnimatePresence) so the field is continuous through the hero→dashboard
 * transition. Uniforms are driven by a rAF loop reading MotionValues — never via
 * React re-renders.
 */
export default function DitherField({ threshold, opacity }: DitherFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReduced = useReducedMotion();
  // Fallback opacity if MotionValues aren't provided (defensive).
  const fallback = useMotionValue(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // NOTE: do NOT call getContext() here to feature-detect — a canvas locks to
    // the first context type requested, so a probe call makes OGL's getContext
    // return null and the canvas paints raw white. Let OGL create the context and
    // catch failure instead.
    let renderer: Renderer;
    try {
      renderer = new Renderer({ canvas, alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
    } catch {
      canvas.style.display = "none"; // WebGL unavailable → hide; CSS grain covers atmosphere
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT); // clear immediately so no white flash before first frame

    // Bayer matrix as an 8x8 R-channel texture (NEAREST/REPEAT).
    const bayerTex = new Texture(gl, {
      image: bayerTextureData(),
      width: BAYER_SIZE,
      height: BAYER_SIZE,
      magFilter: gl.NEAREST,
      minFilter: gl.NEAREST,
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
      flipY: false,
    });

    const ripples = new Float32Array(MAX_RIPPLES * 3).fill(-1);

    const program = new Program(gl, {
      vertex: DITHER_VERT,
      fragment: DITHER_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uMouse: { value: [0.5, 0.5] },
        uThreshold: { value: 0.5 },
        uOpacity: { value: 1 },
        uContrast: { value: 0.18 },
        uBayer: { value: bayerTex },
        uRipples: { value: ripples },
      },
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // --- pointer (window-level since the canvas is pointer-events:none) ---
    const mouse = { x: 0.5, y: 0.5 };
    let mouseRaf = 0;
    const onMove = (e: PointerEvent) => {
      if (mouseRaf) return;
      mouseRaf = requestAnimationFrame(() => {
        mouse.x = e.clientX / window.innerWidth;
        mouse.y = 1 - e.clientY / window.innerHeight;
        mouseRaf = 0;
      });
    };
    const rippleTimes: number[] = new Array(MAX_RIPPLES).fill(-1);
    let nextRipple = 0;
    const onClick = (e: PointerEvent) => {
      if (prefersReduced) return;
      const i = nextRipple % MAX_RIPPLES;
      ripples[i * 3] = e.clientX / window.innerWidth;
      ripples[i * 3 + 1] = 1 - e.clientY / window.innerHeight;
      ripples[i * 3 + 2] = 0;
      rippleTimes[i] = 0;
      nextRipple++;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onClick, { passive: true });

    // --- context loss ---
    const onLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onLost);

    // --- render loop ---
    let raf = 0;
    let last = performance.now();
    const start = last;
    const render = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      program.uniforms.uTime.value = (now - start) / 1000;
      program.uniforms.uMouse.value = prefersReduced ? [0.5, 0.5] : [mouse.x, mouse.y];
      program.uniforms.uThreshold.value = threshold.get();
      program.uniforms.uOpacity.value = opacity.get();
      // advance ripples
      for (let i = 0; i < MAX_RIPPLES; i++) {
        if (rippleTimes[i]! >= 0) {
          rippleTimes[i]! += dt * 0.9;
          ripples[i * 3 + 2] = rippleTimes[i]!;
          if (rippleTimes[i]! >= 1) {
            rippleTimes[i] = -1;
            ripples[i * 3 + 2] = -1;
          }
        }
      }
      renderer.render({ scene: mesh });
      if (!prefersReduced) raf = requestAnimationFrame(render);
    };

    if (prefersReduced) {
      // one static frame, then stop
      render(performance.now());
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (mouseRaf) cancelAnimationFrame(mouseRaf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onClick);
      canvas.removeEventListener("webglcontextlost", onLost);
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    };
    // Mount once. MotionValues are stable refs; reduced-motion change reloads via key in App if needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  void fallback;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
