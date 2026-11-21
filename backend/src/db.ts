import { Client, Pool } from 'pg';
import { config } from './config';

/** Shared pool for read-only API queries. */
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  application_name: 'cineseat-api',
});

/**
 * Run a unit of work in its own connection and transaction.
 * The connection is always returned to the OS, and the transaction is always
 * finished (commit on success, rollback on failure).
 */
export async function withTransaction<T>(work: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({
    connectionString: config.databaseUrl,
    application_name: 'cineseat-booking',
  });

  await client.connect();

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[db] rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    await client.end().catch((error: unknown) => {
      console.error('[db] failed to release booking connection:', error);
    });
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
