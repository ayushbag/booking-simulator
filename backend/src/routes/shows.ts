import { Router } from 'express';
import { pool } from '../db';
import { HttpError, parseRouteId } from '../errors';
import type { SeatRow, ShowDetailRow } from '../types';

export const showsRouter = Router();

showsRouter.get('/:showId/seats', async (req, res, next) => {
  try {
    const showId = parseRouteId(req.params.showId, 'showId');

    const showResult = await pool.query<ShowDetailRow>(
      `SELECT s.show_id,
              to_char(s.show_date, 'YYYY-MM-DD') AS show_date,
              to_char(s.start_time, 'HH24:MI') AS start_time,
              s.screen_no,
              m.movie_id,
              m.movie_title,
              m.genre,
              m.language,
              m.duration_minutes,
              th.theatre_id,
              th.theatre_name,
              th.city,
              th.address
       FROM shows s
       JOIN movies m ON m.movie_id = s.movie_id
       JOIN theatres th ON th.theatre_id = s.theatre_id
       WHERE s.show_id = $1`,
      [showId],
    );

    const show = showResult.rows[0];
    if (!show) {
      throw new HttpError(404, 'Show not found.', 'SHOW_NOT_FOUND');
    }

    const seatsResult = await pool.query<SeatRow>(
      `SELECT se.seat_id,
              se.seat_number,
              se.seat_type,
              se.ticket_price::float8 AS ticket_price,
              (tk.ticket_id IS NOT NULL) AS is_booked
       FROM seats se
       LEFT JOIN tickets tk
         ON tk.show_id = $1
        AND tk.seat_id = se.seat_id
        AND tk.ticket_status = 'Booked'
       WHERE se.theatre_id = $2
         AND se.screen_no = $3
       ORDER BY se.seat_id`,
      [showId, show.theatre_id, show.screen_no],
    );

    res.json({ show, seats: seatsResult.rows });
  } catch (error) {
    next(error);
  }
});
