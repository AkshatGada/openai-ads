"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sendOtp, verifyOtp } from "@/app/actions";
import { EASE_OUT, DUR } from "@/motion/transitions";

type Step = "email" | "otp" | "done";

export default function WaitlistForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    const form = new FormData();
    form.set("email", email);
    const result = await sendOtp(form);
    setLoading(false);
    if (result.ok) {
      setStep("otp");
    } else {
      setError(result.error ?? "Failed");
    }
  };

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

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);
    const form = new FormData();
    form.set("email", email);
    form.set("otp", otp.join(""));
    const result = await verifyOtp(form);
    setLoading(false);
    if (result.ok) {
      setStep("done");
    } else {
      setError(result.error ?? "Invalid code");
    }
  };

  const otpValid = otp.every((d) => d !== "") && otp.length === 6;

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DUR.fast, ease: EASE_OUT }}
            className="flex flex-col gap-3"
          >
            <form
              action={handleSendOtp}
              className="flex gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 font-sans text-sm text-text caret-accent outline-none placeholder:text-text-faint focus:border-accent"
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="rounded-lg bg-accent px-5 py-3 font-sans text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "…" : "Get access"}
              </button>
            </form>
            {error && <p className="font-mono text-xs text-status-negative">{error}</p>}
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DUR.fast, ease: EASE_OUT }}
            className="flex flex-col gap-4"
          >
            <p className="font-sans text-sm text-text-muted">
              Enter the 6-digit code sent to <strong className="text-text">{email}</strong>
            </p>
            <form action={handleVerifyOtp}>
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
                    className="h-12 w-12 rounded-lg border border-border bg-surface text-center font-mono text-lg text-text caret-accent outline-none focus:border-accent"
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
            <button
              onClick={() => { setStep("email"); setError(""); setOtp(["", "", "", "", "", ""]); }}
              className="text-center font-sans text-xs text-text-faint hover:text-text-muted"
            >
              Use a different email
            </button>
            {error && <p className="font-mono text-xs text-status-negative">{error}</p>}
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-6 text-center"
          >
            <span className="font-mono text-2xl">✓</span>
            <p className="font-sans text-sm font-semibold text-text">You're on the list</p>
            <p className="font-sans text-xs text-text-muted">We'll let you know when new industries drop.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
