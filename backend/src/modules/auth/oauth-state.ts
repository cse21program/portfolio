export type PendingOAuth = {
  verifier: string;
  redirectUri: string;
  next?: string;
  expiresAt: number;
};

const TTL_MS = 10 * 60 * 1000;
const pending = new Map<string, PendingOAuth>();

function prune(now = Date.now()) {
  for (const [state, entry] of pending) {
    if (entry.expiresAt <= now) {
      pending.delete(state);
    }
  }
}

export function rememberOAuth(
  state: string,
  values: { verifier: string; redirectUri: string; next?: string },
) {
  prune();
  pending.set(state, {
    verifier: values.verifier,
    redirectUri: values.redirectUri,
    next: values.next,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function takeOAuth(state: string) {
  prune();
  const entry = pending.get(state);
  if (!entry) {
    return undefined;
  }
  pending.delete(state);
  if (entry.expiresAt <= Date.now()) {
    return undefined;
  }
  return entry;
}
