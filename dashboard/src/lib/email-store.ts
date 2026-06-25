/**
 * Email storage abstraction.
 *
 * Swap GOOGLE_SHEETS_ENABLED=true to write verified emails to a Google Sheet.
 * Otherwise falls back to Vercel KV.
 *
 * Required env vars for Google Sheets:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL — from Google Cloud Console
 *   GOOGLE_PRIVATE_KEY — PEM key (with \n newlines)
 *   GOOGLE_SHEET_ID — the sheet ID from the URL (e.g. 1BxiMVs...)
 */

import { kv } from "@vercel/kv";

const IS_VERCEL = !!process.env.VERCEL;
const GOOGLE_SHEETS = process.env.GOOGLE_SHEETS_ENABLED === "true";

export async function storeEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  if (GOOGLE_SHEETS) {
    // Late import so the googleapis dependency isn't required at cold start unless enabled
    try {
      const { google } = await import("googleapis");
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "",
          private_key: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const sheets = google.sheets({ version: "v4", auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID ?? "",
        range: "Sheet1!A:C",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[email, new Date().toISOString(), "verified"]],
        },
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Google Sheets error" };
    }
  }

  // Default: Vercel KV
  if (!IS_VERCEL) {
    // Local dev fallback — store in memory via KV (works with local KV)
  }
  try {
    await kv.sadd("verified_emails", email);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "KV error" };
  }
}

export async function getVerifiedEmails(): Promise<string[]> {
  if (!IS_VERCEL) return [];
  try {
    return await kv.smembers("verified_emails");
  } catch {
    return [];
  }
}
