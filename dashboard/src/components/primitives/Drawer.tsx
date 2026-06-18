import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { SPRING } from "../../motion/transitions";

// Right-slide drawer (probe / advertiser detail). Focus-trap-lite + Esc.
export default function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-ink-950/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-xl flex-col border-l border-ink-200 bg-paper"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRING}
          >
            <header className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
              <h3 className="font-display text-lg tracking-tightish text-ink-950">{title}</h3>
              <button
                onClick={onClose}
                className="font-mono text-xs uppercase tracking-[0.1em] text-ink-500 transition-colors hover:text-ink-950"
              >
                Close ✕
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
