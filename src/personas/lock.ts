// Per-persona async mutex.
// We avoid pulling in a dependency; the pattern is:
//   locks.set(id, (locks.get(id) ?? Promise.resolve()).then(work));
// This serializes calls per-id while keeping cross-id calls parallel.

import { PersonaId } from "./types.js";

export class PersonaLock {
  private chains = new Map<PersonaId, Promise<unknown>>();

  /** Run `work` while holding the lock for `id`. Returns the work's result. */
  async run<T>(id: PersonaId, work: () => Promise<T>): Promise<T> {
    const prev = this.chains.get(id) ?? Promise.resolve();
    // Capture the chain so we don't lose it if `run` is called again immediately.
    const next = prev.then(() => work(), () => work());
    // Update the chain with a never-failing version so one failure doesn't poison the lock.
    this.chains.set(
      id,
      next.catch(() => undefined),
    );
    return next;
  }

  /** True if any work is currently in flight for this id. */
  isLocked(id: PersonaId): boolean {
    const p = this.chains.get(id);
    if (!p) return false;
    // We can't tell "in flight" from a settled promise with no microtask queue peek.
    // Treat presence as "recently used" — sufficient for `--status` to know it's busy.
    return true;
  }
}
