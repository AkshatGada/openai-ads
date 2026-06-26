"use server";

import { kv } from "@vercel/kv";
import { Resend } from "resend";
import { storeEmail } from "@/lib/email-store";

const OTP_TTL = 300; // 5 minutes

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendOtp(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const email = formData.get("email")?.toString()?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Valid email required" };
  }

  const otp = generateOtp();
  await kv.set(`otp:${email}`, otp, { ex: OTP_TTL });

  // In local dev without Resend, log OTP to console and simulate success
  if (!resend) {
    console.log(`[DEV OTP] ${email} → ${otp}`);
    return { ok: true };
  }

  try {
    await resend.emails.send({
      from: "ChatGPT Ads Library <no-reply@chatgptadslibrary.com>",
      to: email,
      subject: "Your verification code",
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:400px;margin:0 auto;padding:32px 24px;background:#0a0b0d;color:#e6e8eb;border-radius:8px;border:1px solid #1f2329">
          <h2 style="font-size:18px;margin:0 0 8px">ChatGPT Ads Library</h2>
          <p style="font-size:14px;color:#9aa1ac;margin:0 0 24px">Your verification code:</p>
          <div style="font-family:monospace;font-size:36px;letter-spacing:8px;text-align:center;padding:16px;background:#111317;border-radius:6px;margin:0 0 24px;color:#ff6b3d">${otp}</div>
          <p style="font-size:12px;color:#5c636f;margin:0">This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
    return { ok: true };
  } catch (e) {
    console.error("Resend error:", e);
    return { ok: false, error: "Failed to send email. Try again." };
  }
}

export async function verifyOtp(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const email = formData.get("email")?.toString()?.trim().toLowerCase();
  const otp = formData.get("otp")?.toString()?.trim();

  if (!email || !otp) {
    return { ok: false, error: "Missing email or code" };
  }

  const stored = await kv.get<string>(`otp:${email}`);
  if (!stored || stored !== otp) {
    return { ok: false, error: "Invalid or expired code" };
  }

  // OTP verified — delete it and store the email
  await kv.del(`otp:${email}`);

  const result = await storeEmail(email);
  if (!result.ok) {
    return { ok: false, error: result.error || "Failed to save" };
  }

  return { ok: true };
}
