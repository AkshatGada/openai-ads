"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "../lib/theme";

export default function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const draw = () => {
      const w = window.innerWidth;
      const h = document.documentElement.scrollHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, w, h);

      const spacing = 40;
      const isDark = theme === "dark";

      ctx.strokeStyle = isDark
        ? "rgba(255, 255, 255, 0.10)"
        : "rgba(0, 0, 0, 0.12)";
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x <= w; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= h; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Intersection dots — single path batch
      ctx.fillStyle = isDark
        ? "rgba(255, 255, 255, 0.18)"
        : "rgba(0, 0, 0, 0.16)";
      ctx.beginPath();
      for (let x = 0; x <= w; x += spacing) {
        for (let y = 0; y <= h; y += spacing) {
          ctx.moveTo(x + 1.5, y);
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    };

    const handleResize = () => {
      // Use rAF to debounce
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
