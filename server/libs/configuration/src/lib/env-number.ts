export function envNumber(
  name: string,
  fallback: number,
  override?: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const raw = override ?? process.env[name];
  const value = raw === undefined || raw === '' ? fallback : Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}
