export type CalcMode = 'difference' | 'calendar' | 'business' | 'shift';

export interface ToolState {
  /** ISO date (YYYY-MM-DD) of the start date input, as typed/selected. */
  startDate: string;
  /** ISO date (YYYY-MM-DD) of the end date input. */
  endDate: string;
  /** Which calculator view is active. */
  mode: CalcMode;
  /** In 'difference': include the end date itself (inclusive counting). */
  includeEndDay: boolean;
  /** In 'business': skip Saturdays and Sundays. */
  excludeWeekends: boolean;
  /** Custom holiday ISO dates excluded from business-day counting. */
  holidays: string[];
  /** In 'shift': the base date to add/subtract from. */
  shiftBaseDate: string;
  /** In 'shift': signed amount of units to add (negative = subtract). */
  shiftAmount: number;
  /** In 'shift': unit for the amount. */
  shiftUnit: 'day' | 'week' | 'month' | 'year';
  /** In 'shift': land on business days only. */
  shiftBusinessOnly: boolean;
}

export const DEFAULT_STATE: ToolState = {
  startDate: '',
  endDate: '',
  mode: 'difference',
  includeEndDay: true,
  excludeWeekends: true,
  holidays: [],
  shiftBaseDate: '',
  shiftAmount: 14,
  shiftUnit: 'day',
  shiftBusinessOnly: false,
};

/** Days in a month for a given (possibly non-leap) year. */
export function daysInMonth(year: number, month: number): number {
  // month is 1-based; day 0 of next month = last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** True when the given year is a leap year in the Gregorian calendar. */
export function isLeapYear(year: number): boolean {
  return daysInMonth(year, 2) === 29;
}

export interface DateDifference {
  /** Total elapsed days between start and end (inclusive when includeEnd is true). */
  totalDays: number;
  /** Calendar weeks + remaining days decomposition. */
  weeks: number;
  remainingDays: number;
  /** Calendar month/year decomposition. */
  years: number;
  months: number;
  days: number;
  /** Total months between the dates. */
  totalMonths: number;
  /** Reversed result: true when end < start. */
  reversed: boolean;
  /** True when inputs are valid dates. */
  valid: boolean;
}

/** Parse an ISO date string (YYYY-MM-DD) to UTC ms, or null when invalid. */
export function parseIsoDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return Date.UTC(year, month - 1, day);
}

/** Day of week (0=Sunday..6=Saturday) for a UTC ms timestamp. */
export function dayOfWeek(ms: number): number {
  return new Date(ms).getUTCDay();
}

/**
 * Compute the difference between two ISO dates.
 * includeEnd counts the end date itself; reversed inputs are reported with a
 * positive (absolute) difference and valid output.
 */
export function dateDifference(
  startIso: string,
  endIso: string,
  includeEnd: boolean
): DateDifference {
  const startMs = parseIsoDate(startIso);
  const endMs = parseIsoDate(endIso);
  if (startMs === null || endMs === null) {
    return {
      totalDays: 0,
      weeks: 0,
      remainingDays: 0,
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      reversed: false,
      valid: false,
    };
  }
  const reversed = endMs < startMs;
  const a = reversed ? endMs : startMs;
  const b = reversed ? startMs : endMs;
  let totalDays = Math.round((b - a) / 86_400_000);
  if (includeEnd) totalDays += 1;

  // Calendar decomposition with UTC-safe date math.
  const aDate = new Date(a);
  const bDate = new Date(b);
  let years = bDate.getUTCFullYear() - aDate.getUTCFullYear();
  let months = bDate.getUTCMonth() - aDate.getUTCMonth();
  let days = bDate.getUTCDate() - aDate.getUTCDate();
  if (days < 0) {
    months -= 1;
    // days in the month preceding b's month
    const prevMonthDays = daysInMonth(bDate.getUTCFullYear(), bDate.getUTCMonth());
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalMonths = years * 12 + months;
  const weeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;

  return {
    totalDays,
    weeks,
    remainingDays,
    years,
    months,
    days,
    totalMonths,
    reversed,
    valid: true,
  };
}

/** ISO date string from a UTC ms timestamp. */
export function isoFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Count business days (Mon-Fri) between two ISO dates, inclusive of both ends. */
export function businessDaysBetween(
  startIso: string,
  endIso: string,
  excludeWeekends: boolean,
  holidays: string[]
): number | null {
  const startMs = parseIsoDate(startIso);
  const endMs = parseIsoDate(endIso);
  if (startMs === null || endMs === null) return null;
  const a = Math.min(startMs, endMs);
  const b = Math.max(startMs, endMs);
  const holidaySet = new Set(holidays.filter((h) => parseIsoDate(h) !== null));
  let count = 0;
  for (let ms = a; ms <= b; ms += 86_400_000) {
    const dow = dayOfWeek(ms);
    if (excludeWeekends && (dow === 0 || dow === 6)) continue;
    if (holidaySet.has(isoFromMs(ms))) continue;
    count += 1;
  }
  return count;
}

/**
 * Add (or subtract, when amount is negative) `amount` units of `unit` to an ISO
 * date. With businessOnly, weekend results roll forward to the next business day.
 */
export function shiftDate(
  baseIso: string,
  amount: number,
  unit: 'day' | 'week' | 'month' | 'year',
  businessOnly: boolean
): string | null {
  const baseMs = parseIsoDate(baseIso);
  if (baseMs === null) return null;
  const d = new Date(baseMs);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  switch (unit) {
    case 'day': {
      d.setUTCDate(day + amount);
      break;
    }
    case 'week': {
      d.setUTCDate(day + amount * 7);
      break;
    }
    case 'month': {
      const targetMonth = m + amount;
      const targetYear = y + Math.floor(targetMonth / 12);
      const normMonth = ((targetMonth % 12) + 12) % 12;
      const maxDay = daysInMonth(targetYear, normMonth + 1);
      d.setUTCFullYear(targetYear);
      d.setUTCMonth(normMonth, Math.min(day, maxDay));
      break;
    }
    case 'year': {
      const targetYear = y + amount;
      const maxDay = daysInMonth(targetYear, m + 1);
      d.setUTCFullYear(targetYear);
      d.setUTCMonth(m, Math.min(day, maxDay));
      break;
    }
  }
  let ms = d.getTime();
  if (businessOnly) {
    for (let guard = 0; guard < 3660; guard++) {
      const dow = dayOfWeek(ms);
      if (dow !== 0 && dow !== 6) break;
      ms += 86_400_000;
    }
  }
  return isoFromMs(ms);
}

/** Human-readable summary of the current difference or shift result. */
export function summaryText(state: ToolState): string {
  if (state.mode === 'shift') {
    const result = shiftDate(
      state.shiftBaseDate,
      state.shiftAmount,
      state.shiftUnit,
      state.shiftBusinessOnly
    );
    if (result === null) return 'Enter a valid base date.';
    const op = state.shiftAmount < 0 ? 'before' : 'after';
    return `${Math.abs(state.shiftAmount)} ${state.shiftUnit}(s) ${op} ${state.shiftBaseDate} is ${result}.`;
  }
  const diff = dateDifference(
    state.startDate,
    state.endDate,
    state.mode === 'difference' ? state.includeEndDay : true
  );
  if (!diff.valid) return 'Enter two valid dates.';
  const parts: string[] = [];
  if (diff.years > 0) parts.push(`${diff.years} year${diff.years === 1 ? '' : 's'}`);
  if (diff.months > 0) parts.push(`${diff.months} month${diff.months === 1 ? '' : 's'}`);
  if (diff.days > 0 || parts.length === 0)
    parts.push(`${diff.days} day${diff.days === 1 ? '' : 's'}`);
  let text = parts.join(', ');
  if (state.mode === 'business') {
    const bd = businessDaysBetween(
      state.startDate,
      state.endDate,
      state.excludeWeekends,
      state.holidays
    );
    text += ` — ${bd === null ? '?' : bd} business day${bd === 1 ? '' : 's'}`;
  } else {
    text += ` — ${diff.totalDays} day${diff.totalDays === 1 ? '' : 's'} total (${diff.weeks}w ${diff.remainingDays}d)`;
  }
  return text;
}
