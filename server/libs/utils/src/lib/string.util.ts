import { randomUUID } from 'node:crypto';

export const getProcessId = (prefix?: string) => {
  return prefix ? `${prefix}-${randomUUID()}` : randomUUID();
};
