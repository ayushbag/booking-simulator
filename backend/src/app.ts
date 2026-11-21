import cors from 'cors';
import express from 'express';
import { pool } from './db';
import { errorHandler } from './errors';
import { bookingsRouter } from './routes/bookings';
import { moviegoersRouter } from './routes/moviegoers';
import { moviesRouter } from './routes/movies';
import { showsRouter } from './routes/shows';

const ALLOWED_ORIGINS = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || ALLOWED_ORIGINS.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Origin is not allowed by CORS.'));
      },
    }),
  );
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', async (_req, res, next) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/movies', moviesRouter);
  app.use('/api/shows', showsRouter);
  app.use('/api/moviegoers', moviegoersRouter);
  app.use('/api/bookings', bookingsRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found.', code: 'NOT_FOUND' });
  });

  app.use(errorHandler);

  return app;
}
