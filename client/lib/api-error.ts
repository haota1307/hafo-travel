import { EntityError, HttpError } from './http';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getDetails(error: unknown): unknown {
  if (!(error instanceof HttpError) || !isRecord(error.payload) || !isRecord(error.payload.error)) {
    return undefined;
  }

  return error.payload.error.details;
}

export function getApiValidationErrors(error: unknown): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  const details = getDetails(error);

  if (!(error instanceof EntityError) || !isRecord(details) || !Array.isArray(details.message)) {
    return fields;
  }

  for (const issue of details.message) {
    if (!isRecord(issue) || typeof issue.message !== 'string') {
      continue;
    }

    const path = Array.isArray(issue.path) ? issue.path.join('.') : issue.path;

    if (
      typeof path !== 'string' ||
      !path ||
      ['__proto__', 'constructor', 'prototype'].includes(path)
    ) {
      continue;
    }

    fields[path] = [...(Object.hasOwn(fields, path) ? fields[path] : []), issue.message];
  }

  return fields;
}

export function getApiErrorCode(error: unknown): string | undefined {
  const details = getDetails(error);

  const messages = [
    error instanceof HttpError && isRecord(error.payload) ? error.payload.message : undefined,
    isRecord(details) ? details.message : undefined,
    ...Object.values(getApiValidationErrors(error)).flat(),
  ];

  return messages.find(
    (message): message is string =>
      typeof message === 'string' && /^[A-Z][A-Z0-9_]*$/.test(message),
  );
}

/** The caller supplies a translated fallback; never expose transport/internal errors. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpError) || error.status >= 500 || !isRecord(error.payload)) {
    return fallback;
  }

  const message = error.payload.message;

  if (
    typeof message !== 'string' ||
    !message ||
    getApiErrorCode(error) ||
    message.startsWith('Error.') ||
    /^(HTTP \d+|Bad Request|Unprocessable Entity|Unauthorized|Forbidden|Not Found|Too Many Requests|Validation failed)$/i.test(
      message,
    )
  ) {
    return fallback;
  }

  return message;
}
