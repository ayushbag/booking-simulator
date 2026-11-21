import 'dotenv/config';
import { Client } from 'pg';

interface BookingArgs {
  show: number;
  seat: number;
  customer: number;
  hold: number;
}

interface PostgresError {
  code?: string;
  message: string;
  detail?: string;
  constraint?: string;
  errors?: Error[];
}

const USAGE = `Usage:
  npm run book -- --show <id> --seat <id> --customer <id> [--hold <seconds>]

Options:
  --show      Show_ID to book
  --seat      Seat_ID to book
  --customer  Moviegoer_ID making the booking
  --hold      Seconds to keep the transaction open (default: 5)
  --help      Show this help

Example:
  npm run book -- --show 1 --seat 5 --customer 4 --hold 8`;

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [pid ${process.pid}] ${message}`);
}

function parseArgs(argv: string[]): BookingArgs {
  const values = new Map<string, string>();

  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined || !arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg ?? ''}\n\n${USAGE}`);
    }

    const equalsIndex = arg.indexOf('=');
    if (equalsIndex !== -1) {
      values.set(arg.slice(0, equalsIndex), arg.slice(equalsIndex + 1));
      continue;
    }

    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}\n\n${USAGE}`);
    }
    values.set(arg, value);
    i += 1;
  }

  const known = new Set(['--show', '--seat', '--customer', '--hold']);
  for (const key of values.keys()) {
    if (!known.has(key)) {
      throw new Error(`Unknown option: ${key}\n\n${USAGE}`);
    }
  }

  const readInteger = (name: string): number => {
    const raw = values.get(name);
    if (raw === undefined) {
      throw new Error(`Missing required option ${name}\n\n${USAGE}`);
    }
    if (!/^\d+$/.test(raw)) {
      throw new Error(`${name} must be a positive integer, got "${raw}"`);
    }
    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      throw new Error(`${name} must be a positive integer, got "${raw}"`);
    }
    return parsed;
  };

  const rawHold = values.get('--hold');
  let hold = 5;
  if (rawHold !== undefined) {
    if (!/^\d+(\.\d+)?$/.test(rawHold)) {
      throw new Error(`--hold must be a non-negative number of seconds, got "${rawHold}"`);
    }
    hold = Number(rawHold);
    if (!Number.isFinite(hold)) {
      throw new Error(`--hold is not a finite number: "${rawHold}"`);
    }
  }

  return {
    show: readInteger('--show'),
    seat: readInteger('--seat'),
    customer: readInteger('--customer'),
    hold,
  };
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function describeDatabaseUrl(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, '') || '(default)';
    return `${url.hostname}:${url.port || '5432'}/${database}`;
  } catch {
    return '(unparsable DATABASE_URL)';
  }
}

function logErrorDetails(error: PostgresError): void {
  const code = error.code ?? 'unknown';
  // SQLSTATE codes are five characters (for example 23505); network errors use names like ECONNREFUSED.
  const codeLabel = /^[0-9A-Z]{5}$/.test(code) ? 'PostgreSQL code' : 'Error code';
  log(`  ${codeLabel}: ${code}`);

  let message = error.message;
  if (!message && error.errors) {
    message = error.errors
      .map((nested) => nested.message)
      .filter((text) => text.length > 0)
      .join('; ');
  }
  log(`  Message: ${message || 'No message provided'}`);

  if (error.detail) {
    log(`  Detail: ${error.detail}`);
  }
  if (error.constraint) {
    log(`  Constraint: ${error.constraint}`);
  }
}

async function main(): Promise<number> {
  let args: BookingArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    log(`Invalid arguments: ${isError(error) ? error.message : String(error)}`);
    return 1;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log('Configuration error: DATABASE_URL is not set. Add it to the .env file.');
    return 1;
  }

  const { show, seat, customer, hold } = args;
  const client = new Client({ connectionString: databaseUrl });

  let connected = false;
  let inTransaction = false;
  let exitCode = 0;

  try {
    await client.connect();
    connected = true;
    log(`Connection established to ${describeDatabaseUrl(databaseUrl)}`);

    await client.query('BEGIN');
    inTransaction = true;
    log('Transaction started (BEGIN)');

    log(`Attempting booking: show=${show} seat=${seat} customer=${customer} status=Booked`);
    const result = await client.query<{ ticket_id: number; booked_at: string }>(
      `INSERT INTO tickets (show_id, seat_id, moviegoer_id, ticket_status)
       VALUES ($1, $2, $3, 'Booked')
       RETURNING ticket_id, booked_at::text AS booked_at`,
      [show, seat, customer],
    );

    const inserted = result.rows[0];
    if (!inserted) {
      throw new Error('INSERT succeeded but returned no ticket row');
    }
    log(`Insert successful: ticket_id=${inserted.ticket_id}, booked_at=${inserted.booked_at}`);

    log(`Holding transaction open for ${hold} second(s) (SELECT pg_sleep(${hold}))`);
    await client.query('SELECT pg_sleep($1)', [hold]);

    await client.query('COMMIT');
    inTransaction = false;
    log(`Booking committed: show=${show} seat=${seat} customer=${customer} ticket_id=${inserted.ticket_id}`);
  } catch (error) {
    const pgError: PostgresError = isError(error) ? error : { message: String(error) };

    if (!connected) {
      log('Connection failed: could not connect to PostgreSQL');
      logErrorDetails(pgError);
    } else {
      log('Booking rejected: the transaction could not be committed');
      logErrorDetails(pgError);

      if (pgError.code === '23505') {
        log(
          `Explanation: seat ${seat} for show ${show} was booked by another transaction. ` +
            'The unique index "unique_active_show_seat" rejected the second active booking (SQLSTATE 23505, unique_violation).',
        );
      }

      if (inTransaction) {
        try {
          await client.query('ROLLBACK');
          log('Transaction rolled back');
        } catch (rollbackError) {
          const message = isError(rollbackError) ? rollbackError.message : String(rollbackError);
          log(`Rollback failed: ${message}`);
        }
        inTransaction = false;
      }
    }

    exitCode = 1;
  } finally {
    if (connected) {
      try {
        await client.end();
        log('Connection closed');
      } catch (closeError) {
        const message = isError(closeError) ? closeError.message : String(closeError);
        log(`Failed to close connection: ${message}`);
      }
    }
  }

  return exitCode;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    const message = isError(error) ? error.message : String(error);
    log(`Unexpected failure: ${message}`);
    process.exitCode = 1;
  });
