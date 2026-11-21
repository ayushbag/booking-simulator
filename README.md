# CineSeat — Real-Time Movie Booking

A full-stack cinema booking app and a command-line concurrency simulator, both backed by the
existing `movie_booking` PostgreSQL database.

The web app streams live seat availability, books one seat per request inside a dedicated
PostgreSQL transaction, and lets two browser tabs race for the same seat. The database — not the
application — decides the winner through the existing partial unique index
`unique_active_show_seat`.

The original CLI simulator is still included and works against the same database.

## Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite 8, Tailwind CSS 4, `lucide-react`      |
| Backend   | Express 5, TypeScript, `pg` (no ORM), CORS                        |
| Database  | Existing PostgreSQL `movie_booking` schema                        |
| CLI       | Node.js, TypeScript, `pg`, `tsx`                                  |

## Requirements

- Node.js 20.19 or newer (Vite 8 requirement; tested on Node 24)
- npm
- PostgreSQL running with the existing `movie_booking` database and its six tables
- A database user that can read the tables and insert into `tickets`

## Environment

Create `.env` in the project root:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/movie_booking
```

Optional backend settings can be added to the same root `.env`, or to `backend/.env` if you want
backend-specific overrides:

```dotenv
PORT=3000
BOOKING_DELAY_MS=0
```

- `PORT` defaults to `3000`.
- `BOOKING_DELAY_MS` is a development-only delay inserted immediately before the booking
  `INSERT`. It defaults to `0` (disabled). `1500` gives two browser tabs a wider race window.
- Shell environment variables take precedence over values in `.env`.

See `backend/.env.example` for a copyable template.

## Install

From the project root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

If PowerShell blocks `npm.ps1` because of the execution policy, use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd install --prefix backend
npm.cmd install --prefix frontend
```

## Run the web app

Start the API and Vite dev server together:

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:3000>
- Health check: <http://localhost:3000/api/health>

Vite proxies `/api` requests from port `5173` to the backend on port `3000`, so the browser uses
same-origin requests during development.

To run them separately:

```bash
npm run dev:api   # Express API with tsx watch
npm run dev:web   # Vite dev server
```

### Using the app

1. Pick a movie from the marquee.
2. Pick a showtime, theatre, date and screen.
3. Select an available seat. The layout uses live rows, seat types, prices and booked states
   from PostgreSQL.
4. Select a moviegoer from the customer list.
5. Review the confirmation panel and press **Confirm booking**.

Seat availability is polled every two seconds without clearing your current selection. If a seat
you selected is booked by someone else, the app clears that selection and shows a notification.

Each booking reserves one seat. The confirmation modal shows the movie, theatre, show date and
time, screen, seat, price, customer, booking ID and booking timestamp.

## Two-tab concurrency test

The point of the app is to reproduce a real race without an application-level lock.

1. Enable the development delay in the root `.env`:

   ```dotenv
   BOOKING_DELAY_MS=1500
   ```

   Restart the backend after changing it. On PowerShell you can also set it for one process:

   ```powershell
   $env:BOOKING_DELAY_MS='1500'
   npm run dev:api
   ```

2. Run `npm run dev` and open <http://localhost:5173> in two browser tabs.
3. In both tabs, select the **same movie**, the **same show** and the **same free seat**.
4. Choose a customer in each tab.
5. Press **Confirm booking** in both tabs within the delay window.
6. Expected result:
   - One tab receives `201 Created` and opens the confirmation modal.
   - The other receives `409 Conflict` with:
     > Sorry, this seat was just booked by someone else.
   - The losing tab clears the selected seat, marks it booked and tells you to choose another.
   - Both tabs show the seat as booked after the next two-second poll.
7. Set `BOOKING_DELAY_MS=0` and restart when finished.

The winner is chosen by PostgreSQL. Both transactions can pass the read checks; the partial unique
index rejects the second insert with SQLSTATE `23505`.

## API

All responses are JSON and use the database's snake_case field names.

| Method | Path                         | Purpose                                         |
| ------ | ---------------------------- | ----------------------------------------------- |
| GET    | `/api/health`                | Service and database connectivity check         |
| GET    | `/api/movies`                | Movies with their number of shows               |
| GET    | `/api/movies/:movieId/shows` | Shows for one movie with total/available seats  |
| GET    | `/api/shows/:showId/seats`   | Screen details and per-seat live availability   |
| GET    | `/api/moviegoers`            | Customers available for booking                 |
| POST   | `/api/bookings`              | Create one booking                              |
| GET    | `/api/bookings/:bookingId`   | Read a confirmed booking by ticket ID           |

### Create a booking

```http
POST /api/bookings
Content-Type: application/json

{
  "show_id": 2,
  "seat_id": 5,
  "moviegoer_id": 1
}
```

Successful response: `201 Created`

```json
{
  "booking": {
    "booking_id": 21,
    "ticket_status": "Booked",
    "booked_at": "2026-11-15 22:55:21",
    "show_id": 2,
    "show_date": "2026-11-16",
    "start_time": "14:00",
    "screen_no": 1,
    "movie_id": 2,
    "movie_title": "Interstellar",
    "theatre_name": "PVR Phoenix",
    "city": "Pune",
    "seat_id": 5,
    "seat_number": "C1",
    "seat_type": "Economy",
    "ticket_price": 150,
    "moviegoer_id": 2,
    "moviegoer_name": "Rahul Sharma",
    "email": "rahul@example.com"
  }
}
```

Conflict response: `409 Conflict`

```json
{
  "error": "Sorry, this seat was just booked by someone else.",
  "code": "SEAT_ALREADY_BOOKED"
}
```

Other error cases:

- `400` — invalid JSON, missing/invalid IDs, or a seat that does not belong to the show.
- `404` — movie, show, moviegoer, or booking not found.
- `500` — unexpected database or server error.

## How booking consistency works

- Read endpoints use a shared `pg.Pool`.
- Each `POST /api/bookings` opens a **new dedicated `pg.Client`** and runs:
  `BEGIN` → validate show, seat and moviegoer → optional delay → `INSERT` → `COMMIT`.
- If anything fails, the transaction is rolled back.
- The client connection is always closed in a `finally` block.
- A PostgreSQL unique violation (`23505`) is converted to the exact `409` message above.
- No tables, columns, or constraints were added or changed. The app relies on the existing
  `unique_active_show_seat` partial unique index:

```sql
unique_active_show_seat ON tickets (show_id, seat_id) WHERE ticket_status = 'Booked'
```

- Availability is always derived from `tickets` rows with `ticket_status = 'Booked'`. No seat
  availability is hardcoded or mocked.
- `tickets.ticket_id` is `GENERATED ALWAYS AS IDENTITY`, so inserts omit it and let PostgreSQL
  assign the booking ID.

## Project structure

```text
booking-simulator/
├── src/
│   └── index.ts                 # CLI concurrency simulator
├── backend/
│   ├── .env.example
│   └── src/
│       ├── app.ts               # Express app, CORS, health and route mounting
│       ├── config.ts            # DATABASE_URL, PORT, BOOKING_DELAY_MS
│       ├── db.ts                # Read pool and dedicated booking transactions
│       ├── errors.ts            # HTTP errors, ID validation, 23505 detection
│       ├── server.ts            # HTTP server and graceful shutdown
│       └── routes/              # movies, shows, moviegoers, bookings
├── frontend/
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── App.tsx              # Selection flow, polling, booking state
│   │   ├── api.ts               # Typed API client
│   │   ├── components/          # Header, hero, movie grid, seats, modal, toasts
│   │   ├── format.ts            # Currency, date, time and seat helpers
│   │   ├── hooks/useToasts.ts
│   │   └── types.ts             # API response types
│   ├── index.html
│   └── vite.config.ts           # Port 5173 and /api proxy to port 3000
├── README.md
├── package.json
└── tsconfig.json
```

## Scripts

### Root

| Script                | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| `npm run dev`         | Run backend and frontend together with `concurrently`         |
| `npm run dev:api`     | Run only the Express API                                      |
| `npm run dev:web`     | Run only the Vite frontend                                    |
| `npm run book`        | Run the CLI booking simulator with `tsx`                      |
| `npm run build`       | Build CLI, backend and frontend                               |
| `npm run build:cli`   | Compile only the CLI                                          |
| `npm start`           | Run the compiled CLI                                          |
| `npm run start:api`   | Run the compiled backend                                      |
| `npm run typecheck`   | Type-check CLI, backend and frontend                          |

### Backend and frontend

```bash
npm --prefix backend run dev
npm --prefix backend run build
npm --prefix backend run typecheck

npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run typecheck
```

The production frontend build is written to `frontend/dist`. It is a static client and still needs
a backend serving `/api`; the Vite dev proxy is only configured for development.

## CLI concurrency simulator

The CLI opens its own connection, starts a transaction, inserts a real ticket, holds the
transaction open with `SELECT pg_sleep(...)`, and commits. Run it in two terminals to watch the
second insert block on the first and then fail with `23505`.

### CLI options

```bash
npm run book -- --show <id> --seat <id> --customer <id> [--hold <seconds>]
```

| Option       | Required | Description                                        |
| ------------ | -------- | -------------------------------------------------- |
| `--show`     | yes      | `shows.show_id` to book                            |
| `--seat`     | yes      | `seats.seat_id` to book                            |
| `--customer` | yes      | `moviegoers.moviegoer_id` making the booking       |
| `--hold`     | no       | Seconds to keep the transaction open (default `5`) |
| `--help`     | no       | Print usage                                        |

Options may also be written as `--show=1`.

### Two-terminal demonstration

Use a show/seat pair that is currently free. The examples below use show `1`, seat `5`, and an
8-second hold; change the IDs to any free combination in your database.

**Terminal 1 — wins the race:**

```bash
npm run book -- --show 1 --seat 5 --customer 4 --hold 8
```

**Terminal 2 — starts while Terminal 1 is still holding:**

```bash
npm run book -- --show 1 --seat 5 --customer 5 --hold 8
```

Terminal 2 connects and begins its transaction, then waits inside PostgreSQL while Terminal 1
holds its insert. When Terminal 1 commits, Terminal 2 is rejected:

```text
PostgreSQL code: 23505
Message: duplicate key value violates unique constraint "unique_active_show_seat"
Detail: Key (show_id, seat_id)=(1, 5) already exists.
Constraint: unique_active_show_seat
```

The second process exits with code `1`; the first exits with code `0`.

### Compiled CLI

```bash
npm run build
npm start -- --show 1 --seat 5 --customer 4 --hold 8
```

The CLI and the web app follow the same rule: correctness comes from the database constraint, not
from an application-level lock.

## Verification

The repository is set up so these checks pass:

```bash
npm run typecheck
npm run build
```

Manual/API checks performed against the database during development:

- All read endpoints return live rows from `movie_booking`.
- A first booking returns `201`; repeating the same show/seat returns the exact `409` message.
- Two simultaneous bookings with `BOOKING_DELAY_MS=1500` produce one `201`, one `409`, and one
  committed ticket.
- The UI shows the confirmation modal for the winner and the conflict message for the loser.
- When another client books the seat selected in a browser tab, the two-second poll clears the
  selection, marks the seat booked, and shows a toast.
- Test tickets created during verification were deleted; existing user-created ticket `15` was
  left untouched.

## Notes and limitations

- One seat per booking, matching the singular `seat_id` booking contract.
- No authentication, payments, cancellation, or seat holds.
- Polling is every two seconds, so two clients can both see a seat as free between polls. The
  database still rejects the second booking at confirmation time.
- `BOOKING_DELAY_MS` is for development demonstrations only. Leave it at `0` otherwise.
- The CLI and web app insert real rows into `tickets`. Use test data and clean up test bookings.

## Troubleshooting

- **`npm.ps1 cannot be loaded`** — use `npm.cmd` instead of `npm` in PowerShell.
- **`EADDRINUSE` on port 3000 or 5173** — stop the process using the port, or change the backend
  `PORT` and update the proxy target in `frontend/vite.config.ts`. Port 5173 is configured with
  `strictPort`, so Vite will not silently choose another port.
- **`DATABASE_URL is not set`** — create the root `.env` described above.
- **Backend starts but the UI shows a network error** — check
  <http://localhost:3000/api/health>, then confirm the Vite dev server is using its proxy by
  visiting <http://localhost:5173/api/health>.
- **CORS error** — the backend allows the dev origins `http://localhost:5173` and
  `http://127.0.0.1:5173`. Use one of those URLs during development.
