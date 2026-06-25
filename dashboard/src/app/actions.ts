"use server";

// Mock mode: no Resend, no Vercel KV. Any OTP works.
// Flip MOCK=false in production when your env vars are set.

const MOCK = !process.env.RESEND_API_KEY;

export async function sendOtp(formData: FormData): Promise<{ ok: boolean; error?: string; mockOtp?: string }> {
  const email = formData.get("email")?.toString()?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Valid email required" };
  }

  if (MOCK) {
    // Any 6-digit code will work — use "123456" as the hint
    return { ok: true, mockOtp: "123456" };
  }

  // Production: Resend + Vercel KV
  const { kv } = await import("@vercel/kv");
  const { Resend } = await import("resend");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await kv.set(`otp:${email}`, otp, { ex: 300 });

  const resend = new Resend(process.env.RESEND_API_KEY!);
  await resend.emails.send({
    from: "ChatGPT Ads Library <no-reply@chatgptadslibrary.com>",
    to: email,
    subject: "Your verification code",
    html: `<div style="font-family:Inter,system-ui,sans-serif;max-width:400px;margin:0 auto;padding:32px 24px;background:#0a0b0d;color:#e6e8eb;border-radius:8px;border:1px solid #1f2329"><h2 style="font-size:18px;margin:0 0 8px">ChatGPT Ads Library</h2><p style="font-size:14px;color:#9aa1ac;margin:0 0 24px">Your verification code:</p><div style="font-family:monospace;font-size:36px;letter-spacing:8px;text-align:center;padding:16px;background:#111317;border-radius:6px;margin:0 0 24px;color:#ff6b3d">${otp}</div><p style="font-size:12px;color:#5c636f;margin:0">This code expires in 5 minutes.</p></div>`,
  });

  return { ok: true };
}

export async function verifyOtp(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const email = formData.get("email")?.toString()?.trim().toLowerCase();
  const otp = formData.get("otp")?.toString()?.trim();

  if (!email || !otp) return { ok: false, error: "Missing email or code" };

  if (MOCK) {
    // In mock mode, any email + any 6-digit OTP works
    if (otp.length === 6 && /^\d{6}$/.test(otp)) {
      return { ok: true };
    }
    return { ok: false, error: "Enter any 6 digits" };
  }

  // Production: verify against Vercel KV
  const { kv } = await import("@vercel/kv");
  const stored = await kv.get<string>(`otp:${email}`);
  if (!stored || stored !== otp) {
    return { ok: false, error: "Invalid or expired code" };
  }
  await kv.del(`otp:${email}`);
  return { ok: true };
}
