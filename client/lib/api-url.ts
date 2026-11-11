/** Shared by server HTTP calls and the Next backend proxy. Never contains credentials. */
export function getApiBaseUrl() {
  const value = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!value) {
    throw new Error('Configure API_URL for backend requests.');
  }

  const url = new URL(value);

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error('API_URL must be an HTTP(S) base URL without credentials, query or hash.');
  }

  return value.replace(/\/+$/, '');
}
