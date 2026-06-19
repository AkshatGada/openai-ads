import { useEffect } from "react";
import { Renderer, Triangle, Program, Mesh } from "ogl";
import { useReducedMotion, type MotionValue } from "motion/react";
import { DOT_FRAG, DOT_VERT } from "./dotmatrix.frag";

interface DotFieldProps {
  /** Overall field alpha. */
  opacity: MotionValue<number>;
  /** 1 = dark landing (glowing dots), 0 = light dashboard (grey grid). */
  dark: MotionValue<number>;
}

const MAX_RIPPLES = 6;
const ACCENT: [number, number, number] = [1.0, 0.36, 0.0]; // #FF5C00

// Full-viewport animated LED dot-matrix field (Nothing-inspired). Mounts ONCE,
// above the phase AnimatePresence, so it is continuous through the transition.
// Uniforms driven by a rAF loop reading MotionValues — never React re-renders.
export default function DotMatrixField({ opacity, dark }: DotFieldProps) {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const host = document.getElementById("dotfield-host");
    if (!host) return;
    canvas.className = "h-full w-full";
    host.appendChild(canvas);

    let renderer: Renderer;
    try {
      renderer = new Renderer({ canvas, alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
    } catch {
      host.removeChild(canvas);
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const ripples = new Float32Array(MAX_RIPPLES * 3).fill(-1);
    const program = new Program(gl, {
      vertex: DOT_VERT,
      fragment: DOT_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uMouse: { value: [0.5, 0.5] },
        uOpacity: { value: opacity.get() },
        uDark: { value: dark.get() },
        uGrid: { value: 22 * Math.min(window.devicePixelRatio, 2) },
        uAccent: { value: ACCENT },
        uRipples: { value: ripples },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

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
    const rippleAge: number[] = new Array(MAX_RIPPLES).fill(-1);
    let nextRipple = 0;
    const onDown = (e: PointerEvent) => {
      if (prefersReduced) return;
      const i = nextRipple % MAX_RIPPLES;
      ripples[i * 3] = e.clientX / window.innerWidth;
      ripples[i * 3 + 1] = 1 - e.clientY / window.innerHeight;
      ripples[i * 3 + 2] = 0;
      rippleAge[i] = 0;
      nextRipple++;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    const onLost = (ev: Event) => ev.preventDefault();
    canvas.addEventListener("webglcontextlost", onLost);

    let raf = 0;
    let last = performance.now();
    const start = last;
    const render = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      program.uniforms.uTime.value = (now - start) / 1000;
      program.uniforms.uMouse.value = prefersReduced ? [0.5, 0.5] : [mouse.x, mouse.y];
      program.uniforms.uOpacity.value = opacity.get();
      program.uniforms.uDark.value = dark.get();
      for (let i = 0; i < MAX_RIPPLES; i++) {
        if (rippleAge[i]! >= 0) {
          rippleAge[i]! += dt * 0.8;
          ripples[i * 3 + 2] = rippleAge[i]!;
          if (rippleAge[i]! >= 1) { rippleAge[i] = -1; ripples[i * 3 + 2] = -1; }
        }
      }
      renderer.render({ scene: mesh });
      if (!prefersReduced) raf = requestAnimationFrame(render);
    };
    if (prefersReduced) render(performance.now());
    else raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      if (mouseRaf) cancelAnimationFrame(mouseRaf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id="dotfield-host" aria-hidden className="pointer-events-none fixed inset-0 -z-10" />;
}
