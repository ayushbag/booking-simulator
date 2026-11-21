import { createApp } from './app';
import { assertConfig, config } from './config';
import { closePool } from './db';

assertConfig();

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`[api] CineSeat backend listening on http://localhost:${config.port}`);
  if (config.bookingDelayMs > 0) {
    console.log(`[api] BOOKING_DELAY_MS=${config.bookingDelayMs} (development booking delay enabled)`);
  }
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`[api] ${signal} received, shutting down`);

  const forceExit = setTimeout(() => {
    console.error('[api] shutdown timed out');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async () => {
    try {
      await closePool();
    } catch (error) {
      console.error('[api] error closing database pool:', error);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
