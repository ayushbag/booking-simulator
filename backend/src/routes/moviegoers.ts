import { Router } from 'express';
import { pool } from '../db';
import type { MoviegoerRow } from '../types';

export const moviegoersRouter = Router();

moviegoersRouter.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query<MoviegoerRow>(
      `SELECT moviegoer_id, moviegoer_name, phone, email
       FROM moviegoers
       ORDER BY moviegoer_name`,
    );

    res.json({ moviegoers: result.rows });
  } catch (error) {
    next(error);
  }
});
