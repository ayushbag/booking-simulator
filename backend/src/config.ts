import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

/**
 * Load environment variables from, in order of preference:
 *   backend/.env, project root .env, and the root .env relative to this file.
 * dotenv never overrides values that are already set, so shell variables win.
 */
const envFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
];

for (const envFile of new Set(envFiles)) {
  if (fs.existsSync(envFile)) {
    loadEnv({ path: envFile, quiet: true });
  }
}

function parseInteger(raw: string | undefined, name: string, fallback: number, min: number, max: number): number {
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  if (!/^\d+$/.test(raw.trim())) {
    throw new Error(`${name} must be a whole number.`);
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}.`);
  }

  return value;
}

export const config = {
  port: parseInteger(process.env.PORT, 'PORT', 3000, 1, 65535),
  databaseUrl: process.env.DATABASE_URL ?? '',
  bookingDelayMs: parseInteger(process.env.BOOKING_DELAY_MS, 'BOOKING_DELAY_MS', 0, 0, 120_000),
};

export function assertConfig(): void {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not set. Add it to .env in the project root or in backend/.env.');
  }
}
