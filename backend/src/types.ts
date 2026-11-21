export interface MovieRow {
  movie_id: number;
  movie_title: string;
  genre: string | null;
  language: string | null;
  duration_minutes: number | null;
  show_count: number;
}

export interface MovieSummary {
  movie_id: number;
  movie_title: string;
  genre: string | null;
  language: string | null;
  duration_minutes: number | null;
}

export interface ShowRow {
  show_id: number;
  show_date: string;
  start_time: string;
  screen_no: number;
  theatre_id: number;
  theatre_name: string;
  city: string;
  address: string | null;
  total_seats: number;
  available_seats: number;
}

export interface ShowDetailRow {
  show_id: number;
  show_date: string;
  start_time: string;
  screen_no: number;
  movie_id: number;
  movie_title: string;
  genre: string | null;
  language: string | null;
  duration_minutes: number | null;
  theatre_id: number;
  theatre_name: string;
  city: string;
  address: string | null;
}

export interface SeatRow {
  seat_id: number;
  seat_number: string;
  seat_type: string | null;
  ticket_price: number;
  is_booked: boolean;
}

export interface MoviegoerRow {
  moviegoer_id: number;
  moviegoer_name: string;
  phone: string | null;
  email: string | null;
}

export interface BookingRow {
  booking_id: number;
  ticket_status: string | null;
  booked_at: string;
  show_id: number;
  show_date: string;
  start_time: string;
  screen_no: number;
  movie_id: number;
  movie_title: string;
  genre: string | null;
  language: string | null;
  duration_minutes: number | null;
  theatre_id: number;
  theatre_name: string;
  city: string;
  address: string | null;
  seat_id: number;
  seat_number: string;
  seat_type: string | null;
  ticket_price: number;
  moviegoer_id: number;
  moviegoer_name: string;
  email: string | null;
  phone: string | null;
}
