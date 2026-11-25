let pending: Promise<void> = Promise.resolve();

export function withSessionLock<T>(operation: () => Promise<T>) {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("auth-session", operation);
  }

  const next = pending.then(operation);
  pending = next.then(
    () => undefined,
    () => undefined,
  );

  return next;
}
