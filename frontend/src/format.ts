const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return currency.format(value);
}

export function formatDuration(minutes: number | null): string {
  if (!minutes || minutes <= 0) {
    return 'Runtime TBA';
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }
  if (remainder === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainder}m`;
}

export function formatShowDate(value: string): string {
  const parts = value.split('-').map(Number);
  const [year, month, day] = parts;
  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(year, month - 1, day));
}

export function formatShowDateLong(value: string): string {
  const parts = value.split('-').map(Number);
  const [year, month, day] = parts;
  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function formatShowTime(value: string): string {
  const [hourPart, minutePart] = value.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart ?? 0);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(2020, 0, 1, hour, minute));
}

export function formatBookedAt(value: string): string {
  const normalized = value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function seatRow(seatNumber: string): string {
  const match = /^[A-Za-z]+/.exec(seatNumber);
  return (match?.[0] ?? '#').toUpperCase();
}

export function seatColumn(seatNumber: string): number {
  const match = /(\d+)$/.exec(seatNumber);
  return match ? Number(match[1]) : 0;
}

export function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '?';
  }
  if (words.length === 1) {
    return words[0]!.slice(0, 2).toUpperCase();
  }
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase();
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
