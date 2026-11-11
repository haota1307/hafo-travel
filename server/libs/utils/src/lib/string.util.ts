import { randomUUID } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';

export const getProcessId = (prefix?: string) => {
  return prefix ? `${prefix}-${randomUUID()}` : randomUUID();
};

export function parseToken(token: string): string {
  if (!token?.trim()) {
    throw new UnauthorizedException('Token is required');
  }

  if (token.includes(' ')) {
    return token.split(' ')[1];
  }

  return token;
}
