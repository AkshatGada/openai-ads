// AES-GCM symmetric encryption with HKDF-SHA256 key derivation.
//
// Why HKDF? The master key (`PERSONA_MASTER_KEY`) is a single 32-byte secret
// kept in env. We derive a per-persona 32-byte subkey with HKDF using the
// personaId as salt. So even if one subkey is somehow extracted from a
// leaked session.json, an attacker cannot decrypt other personas' files.

import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import { EncryptedBlob } from "./types.js";

const ALG = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

function deriveKey(masterKeyHex: string, personaId: string, info: string): Buffer {
  const master = Buffer.from(masterKeyHex, "hex");
  if (master.length !== KEY_BYTES) {
    throw new Error(
      `PERSONA_MASTER_KEY must be ${KEY_BYTES * 2} hex chars (${KEY_BYTES} bytes); got ${master.length} bytes`,
    );
  }
  // hkdfSync returns an ArrayBuffer; wrap as Buffer.
  const out = hkdfSync(
    "sha256",
    master,
    Buffer.from(personaId, "utf8"),
    Buffer.from(info, "utf8"),
    KEY_BYTES,
  );
  return Buffer.from(out);
}

export interface SealOptions {
  personaId: string;
  masterKeyHex: string;
  wraps: EncryptedBlob["wraps"];
}

export interface OpenOptions {
  personaId: string;
  masterKeyHex: string;
}

export class PersonaCrypto {
  constructor(private readonly masterKeyHex: string) {
    if (!/^[0-9a-fA-F]{64}$/.test(masterKeyHex)) {
      throw new Error(
        "PERSONA_MASTER_KEY must be 64 hex chars (32 bytes). Generate with: openssl rand -hex 32",
      );
    }
  }

  /** Encrypt a JSON-serializable object for storage. */
  seal(plaintext: unknown, opts: SealOptions): EncryptedBlob {
    const info = `persona-v2/${opts.wraps}/v2`;
    const key = deriveKey(opts.masterKeyHex, opts.personaId, info);
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALG, key, iv);
    const data = Buffer.from(JSON.stringify(plaintext), "utf8");
    const enc = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();
    if (tag.length !== TAG_BYTES) throw new Error("unexpected GCM tag length");

    return {
      ciphertext: enc.toString("base64"),
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      alg: ALG,
      kdf: { name: "hkdf-sha256", salt: opts.personaId, info },
      sealedAt: new Date().toISOString(),
      wraps: opts.wraps,
    };
  }

  /** Decrypt a previously-sealed blob. Throws on auth-tag mismatch. */
  open<T = unknown>(blob: EncryptedBlob, opts: OpenOptions): T {
    if (blob.alg !== ALG) throw new Error(`unsupported alg: ${blob.alg}`);
    if (blob.kdf.name !== "hkdf-sha256") throw new Error(`unsupported kdf: ${blob.kdf.name}`);

    const key = deriveKey(opts.masterKeyHex, opts.personaId, blob.kdf.info);
    const iv = Buffer.from(blob.iv, "base64");
    const tag = Buffer.from(blob.tag, "base64");
    const enc = Buffer.from(blob.ciphertext, "base64");
    if (tag.length !== TAG_BYTES) throw new Error("corrupt tag length");
    if (iv.length !== IV_BYTES) throw new Error("corrupt iv length");

    const decipher = createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(dec.toString("utf8")) as T;
  }
}

/** Generate a fresh master key (32 random bytes → 64 hex chars). */
export function generateMasterKey(): string {
  return randomBytes(KEY_BYTES).toString("hex");
}
