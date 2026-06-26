"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sendOtp, verifyOtp } from "@/app/actions";
import { EASE_OUT, DUR } from "@/motion/transitions";

const STORAGE_KEY = "gads-verified-email";
const DELAY_MS = 10000;

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

  if (done) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.slow, ease: EASE_OUT }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-bg/88"
            style={{ backdropFilter: "blur(24px) saturate(0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 16 }}
            transition={{ duration: DUR.slow, ease: EASE_OUT }}
            className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          >
            <AnimatePresence mode="wait">
              {/* ── Email step ── */}
              {step === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: DUR.fast }}
                  className="p-8"
                >
                  {/* Icon */}
                  <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-accent-soft">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </div>

                  <h2 className="mb-1.5 font-sans text-[17px] font-semibold tracking-tight text-text">
                    Unlock full access
                  </h2>
                  <p className="mb-7 font-sans text-[13px] leading-relaxed text-text-muted">
                    Enter your email to browse the complete ad intelligence library. No spam.
                  </p>

                  <form action={handleSendOtp}>
                    <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint">
                      Work email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoFocus
                      className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-[14px] text-text caret-accent outline-none ring-0 placeholder:text-text-faint transition-all duration-200 focus:border-accent focus:bg-surface-2"
                    />
                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="mt-3 w-full rounded-lg bg-accent px-4 py-2.5 font-sans text-[14px] font-medium text-accent-fg transition-all duration-200 hover:bg-accent-hover disabled:opacity-40"
                    >
                      {loading ? "Sending code…" : "Continue"}
                    </button>
                  </form>

                  {error && (
                    <p className="mt-3 font-mono text-[11px] text-status-negative">{error}</p>
                  )}

                  <div className="mt-5 pt-5 border-t border-border">
                    <button
                      onClick={() => setVisible(false)}
                      className="w-full text-center font-sans text-[12px] text-text-faint transition-colors hover:text-text-muted"
                    >
                      Skip for now
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── OTP step ── */}
              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: DUR.fast }}
                  className="p-8"
                >
                  {/* Icon */}
                  <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-accent-soft">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                      <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>

                  <h2 className="mb-1 font-sans text-[17px] font-semibold tracking-tight text-text">
                    Check your inbox
                  </h2>
                  <p className="mb-1 font-sans text-[13px] leading-relaxed text-text-muted">
                    We sent a verification code to
                  </p>
                  <p className="mb-5 font-sans text-[13px] font-medium text-text">{email}</p>

                  {mockOtp && (
                    <div className="mb-5 rounded-lg border border-accent/20 bg-accent-soft px-3 py-2">
                      <p className="font-mono text-[11px] text-accent">
                        Mock mode — use code <strong>{mockOtp}</strong>
                      </p>
                    </div>
                  )}

                  <form action={handleVerify}>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-text-faint">
                      Verification code
                    </label>
                    <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
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
                          className="h-[52px] w-[44px] rounded-lg border border-border bg-surface-2 text-center font-mono text-[18px] font-medium text-text caret-accent outline-none transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent-soft"
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !otpValid}
                      className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 font-sans text-[14px] font-medium text-accent-fg transition-all duration-200 hover:bg-accent-hover disabled:opacity-40"
                    >
                      {loading ? "Verifying…" : "Verify"}
                    </button>
                  </form>

                  {error && (
                    <p className="mt-3 font-mono text-[11px] text-status-negative">{error}</p>
                  )}

                  <div className="mt-5 pt-5 border-t border-border space-y-2">
                    <button
                      onClick={() => { setStep("email"); setError(""); setOtp(["", "", "", "", "", ""]); }}
                      className="w-full text-center font-sans text-[12px] text-text-faint transition-colors hover:text-text-muted"
                    >
                      Change email
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Done step ── */}
              {step === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: DUR.base, ease: EASE_OUT }}
                  className="flex flex-col items-center p-8 text-center"
                >
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-accent">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-fg">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </div>
                  <p className="font-sans text-[17px] font-semibold tracking-tight text-text">
                    You&apos;re in
                  </p>
                  <p className="mt-1 font-sans text-[13px] text-text-muted">
                    Loading your dashboard…
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
