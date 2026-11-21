import type {
  ApiErrorPayload,
  BookingResponse,
  MoviegoersResponse,
  MoviesResponse,
  ShowsResponse,
  ShowSeatsResponse,
} from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(
      'Unable to reach the booking service. Make sure the backend is running on port 3000.',
      0,
      'NETWORK_ERROR',
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorPayload = (payload ?? {}) as ApiErrorPayload;
    throw new ApiError(
      errorPayload.error ?? `The request failed with status ${response.status}.`,
      response.status,
      errorPayload.code,
    );
  }

  return payload as T;
}

export const api = {
  getMovies(signal?: AbortSignal): Promise<MoviesResponse> {
    return request<MoviesResponse>('/api/movies', { signal });
  },

  getShows(movieId: number, signal?: AbortSignal): Promise<ShowsResponse> {
    return request<ShowsResponse>(`/api/movies/${movieId}/shows`, { signal });
  },

  getShowSeats(showId: number, signal?: AbortSignal): Promise<ShowSeatsResponse> {
    return request<ShowSeatsResponse>(`/api/shows/${showId}/seats`, { signal });
  },

  getMoviegoers(signal?: AbortSignal): Promise<MoviegoersResponse> {
    return request<MoviegoersResponse>('/api/moviegoers', { signal });
  },

  createBooking(input: {
    show_id: number;
    seat_id: number;
    moviegoer_id: number;
  }): Promise<BookingResponse> {
    return request<BookingResponse>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getBooking(bookingId: number): Promise<BookingResponse> {
    return request<BookingResponse>(`/api/bookings/${bookingId}`);
  },
};

export function messageFromError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
