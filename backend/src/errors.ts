import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function parseRouteId(raw: string | undefined, name: string): number {
  if (raw === undefined || !/^\d+$/.test(raw)) {
    throw new HttpError(400, `${name} must be a positive integer.`, 'INVALID_INPUT');
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new HttpError(400, `${name} must be a positive integer.`, 'INVALID_INPUT');
  }

  return value;
}

export function parseBodyId(value: unknown, name: string): number {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  throw new HttpError(400, `${name} must be a positive integer.`, 'INVALID_INPUT');
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: error.message,
      ...(error.code ? { code: error.code } : {}),
    });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: unknown }).type === 'entity.parse.failed'
  ) {
    res.status(400).json({ error: 'Request body must be valid JSON.', code: 'INVALID_JSON' });
    return;
  }

  console.error('[api] unhandled error:', error);
  res.status(500).json({
    error: 'Something went wrong on the server. Please try again.',
    code: 'INTERNAL_ERROR',
  });
}
