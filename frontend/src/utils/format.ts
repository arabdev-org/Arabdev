import { intlLocale, type Language } from '@/i18n';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "3 hr. ago" for recent items, a short date for older ones (X/dev.to style). */
export function formatRelativeTime(iso: string, language: Language, now: number = Date.now()): string {
  const date = new Date(iso);
  const seconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  const locale = intlLocale(language);

  if (abs < 45) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second');
  }
  if (abs < 7 * DAY) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
    if (abs < HOUR) return rtf.format(Math.round(seconds / MINUTE), 'minute');
    if (abs < DAY) return rtf.format(Math.round(seconds / HOUR), 'hour');
    return rtf.format(Math.round(seconds / DAY), 'day');
  }
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date);
}

export function formatFullDate(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(intlLocale(language), { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

export function formatMonthYear(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(intlLocale(language), { month: 'long', year: 'numeric' }).format(new Date(iso));
}

/** 1.2K style numbers for counters. */
export function formatCount(value: number, language: Language): string {
  return new Intl.NumberFormat(intlLocale(language), { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts[1][0]] : [parts[0]?.[0] ?? '?'];
  return letters.join('').toUpperCase();
}
