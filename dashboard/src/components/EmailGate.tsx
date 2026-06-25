"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sendOtp, verifyOtp } from "@/app/actions";
import { EASE_OUT, DUR } from "@/motion/transitions";

const STORAGE_KEY = "gads-verified-email";
const DELAY_MS = 10000; // 10 seconds

type Step = "email" | "otp" | "done";

export function hasVerifiedEmail(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(STORAGE_KEY);
}

export default function EmailGate() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  const [done, setDone] = useState(hasVerifiedEmail());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Show gate after 10 seconds — but only once per session
  useEffect(() => {
    if (done) return;
    const alreadyShown = sessionStorage.getItem("gads-gate-seen");
    if (alreadyShown) return;

    timerRef.current = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem("gads-gate-seen", "1");
    }, DELAY_MS);

    return () => clearTimeout(timerRef.current);
  }, [done]);

  const handleSendOtp = useCallback(async () => {
    setError("");
    setLoading(true);
    const form = new FormData();
    form.set("email", email);
    const result = await sendOtp(form);
    setLoading(false);
    if (result.ok) {
      if (result.mockOtp) setMockOtp(result.mockOtp);
      setStep("otp");
    } else {
      setError(result.error ?? "Failed");
    }
  }, [email]);

  const handleOtpChange = (i: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[i] = value;
    setOtp(next);
    if (value && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      inputsRef.current[5]?.focus();
    }
  };

  const handleVerify = useCallback(async () => {
    setError("");
    setLoading(true);
    const form = new FormData();
    form.set("email", email);
    form.set("otp", otp.join(""));
    const result = await verifyOtp(form);
    setLoading(false);
    if (result.ok) {
      localStorage.setItem(STORAGE_KEY, email);
      setStep("done");
      setTimeout(() => {
        setVisible(false);
        setDone(true);
      }, 1200);
    } else {
      setError(result.error ?? "Invalid code");
    }
  }, [email, otp]);

  const otpValid = otp.every((d) => d !== "") && otp.length === 6;

  // Don't render anything if already verified
  if (done) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-bg/85"
            style={{ backdropFilter: "blur(16px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
          >
            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: DUR.fast }}
                  className="p-8"
                >
                  <h2 className="mb-2 font-sans text-lg font-semibold text-text">
                    Unlock full access
                  </h2>
                  <p className="mb-6 font-sans text-sm text-text-muted">
                    Enter your email to access the complete ad-intelligence dashboard. No spam, ever.
                  </p>
                  <form
                    action={handleSendOtp}
                    className="flex flex-col gap-3"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoFocus
                      className="rounded-lg border border-border bg-surface-2 px-4 py-3 font-sans text-sm text-text caret-accent outline-none placeholder:text-text-faint focus:border-accent"
                    />
                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="rounded-lg bg-accent px-4 py-3 font-sans text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {loading ? "Sending code…" : "Continue"}
                    </button>
                  </form>
                  {error && (
                    <p className="mt-3 font-mono text-xs text-status-negative">{error}</p>
                  )}
                  <button
                    onClick={() => setVisible(false)}
                    className="mt-4 w-full text-center font-sans text-xs text-text-faint transition-colors hover:text-text-muted"
                  >
                    Maybe later
                  </button>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: DUR.fast }}
                  className="p-8"
                >
                  <h2 className="mb-1 font-sans text-lg font-semibold text-text">
                    Check your inbox
                  </h2>
                  <p className="mb-1 font-sans text-sm text-text-muted">
                    We sent a code to <strong className="text-text">{email}</strong>
                  </p>
                  {mockOtp && (
                    <p className="mb-5 font-mono text-xs text-accent">
                      Mock mode — use code: <strong>{mockOtp}</strong>
                    </p>
                  )}

                  <form action={handleVerify}>
                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { inputsRef.current[i] = el; }}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          maxLength={1}
                          inputMode="numeric"
                          autoFocus={i === 0}
                          className="h-12 w-12 rounded-lg border border-border bg-surface-2 text-center font-mono text-lg text-text caret-accent outline-none focus:border-accent"
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !otpValid}
                      className="mt-4 w-full rounded-lg bg-accent py-3 font-sans text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {loading ? "Verifying…" : "Verify"}
                    </button>
                  </form>
                  {error && (
                    <p className="mt-3 font-mono text-xs text-status-negative">{error}</p>
                  )}
                  <button
                    onClick={() => { setStep("email"); setError(""); setOtp(["", "", "", "", "", ""]); }}
                    className="mt-4 w-full text-center font-sans text-xs text-text-faint transition-colors hover:text-text-muted"
                  >
                    Use a different email
                  </button>
                </motion.div>
              )}

              {step === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: DUR.base, ease: EASE_OUT }}
                  className="flex flex-col items-center gap-2 p-8 text-center"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <p className="font-sans text-sm font-semibold text-text">You&apos;re in</p>
                  <p className="font-sans text-xs text-text-muted">Redirecting…</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
