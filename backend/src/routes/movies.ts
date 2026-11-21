import { Router } from 'express';
import { pool } from '../db';
import { HttpError, parseRouteId } from '../errors';
import type { MovieRow, MovieSummary, ShowRow } from '../types';

export const moviesRouter = Router();

moviesRouter.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query<MovieRow>(`
      SELECT m.movie_id,
             m.movie_title,
             m.genre,
             m.language,
             m.duration_minutes,
             COUNT(DISTINCT s.show_id)::int AS show_count
      FROM movies m
      LEFT JOIN shows s ON s.movie_id = m.movie_id
      GROUP BY m.movie_id
      ORDER BY m.movie_title
    `);

    res.json({ movies: result.rows });
  } catch (error) {
    next(error);
  }
});

moviesRouter.get('/:movieId/shows', async (req, res, next) => {
  try {
    const movieId = parseRouteId(req.params.movieId, 'movieId');

    const movieResult = await pool.query<MovieSummary>(
      `SELECT movie_id, movie_title, genre, language, duration_minutes
       FROM movies
       WHERE movie_id = $1`,
      [movieId],
    );

    const movie = movieResult.rows[0];
    if (!movie) {
      throw new HttpError(404, 'Movie not found.', 'MOVIE_NOT_FOUND');
    }

    const showsResult = await pool.query<ShowRow>(
      `SELECT s.show_id,
              to_char(s.show_date, 'YYYY-MM-DD') AS show_date,
              to_char(s.start_time, 'HH24:MI') AS start_time,
              s.screen_no,
              th.theatre_id,
              th.theatre_name,
              th.city,
              th.address,
              COUNT(se.seat_id)::int AS total_seats,
              COUNT(se.seat_id) FILTER (WHERE tk.ticket_id IS NULL)::int AS available_seats
       FROM shows s
       JOIN theatres th ON th.theatre_id = s.theatre_id
       LEFT JOIN seats se
         ON se.theatre_id = s.theatre_id
        AND se.screen_no = s.screen_no
       LEFT JOIN tickets tk
         ON tk.show_id = s.show_id
        AND tk.seat_id = se.seat_id
        AND tk.ticket_status = 'Booked'
       WHERE s.movie_id = $1
       GROUP BY s.show_id, th.theatre_id
       ORDER BY s.show_date, s.start_time, s.show_id`,
      [movieId],
    );

    res.json({ movie, shows: showsResult.rows });
  } catch (error) {
    next(error);
  }
});
