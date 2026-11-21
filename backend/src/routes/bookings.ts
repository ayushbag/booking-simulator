import { Router } from 'express';
import type { Client } from 'pg';
import { config } from '../config';
import { pool, withTransaction } from '../db';
import { HttpError, isUniqueViolation, parseBodyId, parseRouteId } from '../errors';
import type { BookingRow, MoviegoerRow, SeatRow, ShowDetailRow } from '../types';

export const bookingsRouter = Router();

interface BookingInput {
  showId: number;
  seatId: number;
  moviegoerId: number;
}

const DELAY = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

async function createBooking(input: BookingInput): Promise<BookingRow> {
  return withTransaction(async (client: Client) => {
    const showResult = await client.query<ShowDetailRow>(
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
      [input.showId],
    );

    const show = showResult.rows[0];
    if (!show) {
      throw new HttpError(404, 'Show not found.', 'SHOW_NOT_FOUND');
    }

    const seatResult = await client.query<Omit<SeatRow, 'is_booked'>>(
      `SELECT seat_id, seat_number, seat_type, ticket_price::float8 AS ticket_price
       FROM seats
       WHERE seat_id = $1
         AND theatre_id = $2
         AND screen_no = $3`,
      [input.seatId, show.theatre_id, show.screen_no],
    );

    const seat = seatResult.rows[0];
    if (!seat) {
      throw new HttpError(400, 'The selected seat does not belong to this show.', 'INVALID_SEAT');
    }

    const moviegoerResult = await client.query<MoviegoerRow>(
      `SELECT moviegoer_id, moviegoer_name, phone, email
       FROM moviegoers
       WHERE moviegoer_id = $1`,
      [input.moviegoerId],
    );

    const moviegoer = moviegoerResult.rows[0];
    if (!moviegoer) {
      throw new HttpError(404, 'Moviegoer not found.', 'MOVIEGOER_NOT_FOUND');
    }

    if (config.bookingDelayMs > 0) {
      console.log(
        `[booking] show=${input.showId} seat=${input.seatId} moviegoer=${input.moviegoerId} ` +
          `delaying INSERT by ${config.bookingDelayMs}ms`,
      );
      await DELAY(config.bookingDelayMs);
    }

    const insertResult = await client.query<{
      ticket_id: number;
      ticket_status: string;
      booked_at: string;
    }>(
      `INSERT INTO tickets (show_id, seat_id, moviegoer_id, ticket_status)
       VALUES ($1, $2, $3, 'Booked')
       RETURNING ticket_id,
                 ticket_status,
                 to_char(booked_at, 'YYYY-MM-DD HH24:MI:SS') AS booked_at`,
      [input.showId, input.seatId, input.moviegoerId],
    );

    const ticket = insertResult.rows[0];
    if (!ticket) {
      throw new Error('Ticket insert returned no row.');
    }

    return {
      booking_id: ticket.ticket_id,
      ticket_status: ticket.ticket_status,
      booked_at: ticket.booked_at,
      ...show,
      ...seat,
      ...moviegoer,
    };
  });
}

bookingsRouter.post('/', async (req, res, next) => {
  try {
    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new HttpError(400, 'Request body must be a JSON object.', 'INVALID_INPUT');
    }

    const input: BookingInput = {
      showId: parseBodyId((body as Record<string, unknown>).show_id, 'show_id'),
      seatId: parseBodyId((body as Record<string, unknown>).seat_id, 'seat_id'),
      moviegoerId: parseBodyId((body as Record<string, unknown>).moviegoer_id, 'moviegoer_id'),
    };

    console.log(
      `[booking] attempting show=${input.showId} seat=${input.seatId} moviegoer=${input.moviegoerId}`,
    );

    const booking = await createBooking(input);

    console.log(`[booking] confirmed ticket=${booking.booking_id} show=${input.showId} seat=${input.seatId}`);
    res.status(201).json({ booking });
  } catch (error) {
    if (isUniqueViolation(error)) {
      console.warn(
        `[booking] conflict: seat already booked (show=${req.body?.show_id}, seat=${req.body?.seat_id})`,
      );
      res.status(409).json({
        error: 'Sorry, this seat was just booked by someone else.',
        code: 'SEAT_ALREADY_BOOKED',
      });
      return;
    }

    next(error);
  }
});

bookingsRouter.get('/:bookingId', async (req, res, next) => {
  try {
    const bookingId = parseRouteId(req.params.bookingId, 'bookingId');

    const result = await pool.query<BookingRow>(
      `SELECT tk.ticket_id AS booking_id,
              tk.ticket_status,
              to_char(tk.booked_at, 'YYYY-MM-DD HH24:MI:SS') AS booked_at,
              s.show_id,
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
              th.address,
              se.seat_id,
              se.seat_number,
              se.seat_type,
              se.ticket_price::float8 AS ticket_price,
              mg.moviegoer_id,
              mg.moviegoer_name,
              mg.email,
              mg.phone
       FROM tickets tk
       JOIN shows s ON s.show_id = tk.show_id
       JOIN movies m ON m.movie_id = s.movie_id
       JOIN theatres th ON th.theatre_id = s.theatre_id
       JOIN seats se ON se.seat_id = tk.seat_id
       JOIN moviegoers mg ON mg.moviegoer_id = tk.moviegoer_id
       WHERE tk.ticket_id = $1`,
      [bookingId],
    );

    const booking = result.rows[0];
    if (!booking) {
      throw new HttpError(404, 'Booking not found.', 'BOOKING_NOT_FOUND');
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
});
