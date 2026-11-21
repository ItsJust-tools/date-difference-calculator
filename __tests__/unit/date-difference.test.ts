import { describe, it, expect } from 'vitest';
import {
  businessDaysBetween,
  dateDifference,
  daysInMonth,
  isLeapYear,
  isoFromMs,
  parseIsoDate,
  shiftDate,
  summaryText,
} from '@/tool/types';
import { deserializeState, serializeState } from '@/tool/tool-definition';
import { DEFAULT_STATE, type ToolState } from '@/tool/types';

describe('date helpers', () => {
  it('computes days in month', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
  });

  it('detects leap years', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2026)).toBe(false);
  });

  it('parses valid ISO dates and rejects invalid ones', () => {
    expect(parseIsoDate('2026-02-28')).not.toBeNull();
    expect(parseIsoDate('2024-02-29')).not.toBeNull();
    expect(parseIsoDate('2026-02-29')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('2026-00-10')).toBeNull();
    expect(parseIsoDate('2026-1-1')).toBeNull();
    expect(parseIsoDate('nonsense')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });

  it('round-trips ISO from ms', () => {
    expect(isoFromMs(Date.UTC(2026, 10, 21))).toBe('2026-11-21');
  });
});

describe('dateDifference', () => {
  it('counts across month and year boundaries', () => {
    const diff = dateDifference('2025-12-31', '2026-01-01', false);
    expect(diff.valid).toBe(true);
    expect(diff.totalDays).toBe(1);
    expect(diff.months).toBe(0);
    expect(diff.days).toBe(1);
    const yr = dateDifference('2025-01-01', '2026-01-01', false);
    expect(yr.totalDays).toBe(365);
    expect(yr.years).toBe(1);
    expect(yr.months).toBe(0);
    expect(yr.days).toBe(0);
  });

  it('include end day adds one day', () => {
    const incl = dateDifference('2026-01-01', '2026-01-03', true);
    expect(incl.totalDays).toBe(3);
    const excl = dateDifference('2026-01-01', '2026-01-03', false);
    expect(excl.totalDays).toBe(2);
  });

  it('handles leap-year February', () => {
    const diff = dateDifference('2024-02-01', '2024-03-01', false);
    expect(diff.totalDays).toBe(29);
    const nonLeap = dateDifference('2026-02-01', '2026-03-01', false);
    expect(nonLeap.totalDays).toBe(28);
  });

  it('reversed dates return positive absolute difference', () => {
    const fwd = dateDifference('2026-01-01', '2026-01-31', false);
    const rev = dateDifference('2026-01-31', '2026-01-01', false);
    expect(rev.reversed).toBe(true);
    expect(rev.totalDays).toBe(fwd.totalDays);
    expect(rev.totalDays).toBe(30);
  });

  it('breaks down weeks and remaining days', () => {
    const diff = dateDifference('2026-01-01', '2026-01-25', false);
    expect(diff.totalDays).toBe(24);
    expect(diff.weeks).toBe(3);
    expect(diff.remainingDays).toBe(3);
  });

  it('calendar decomposition spans years and months', () => {
    const diff = dateDifference('2024-01-15', '2026-03-14', false);
    expect(diff.years).toBe(2);
    expect(diff.months).toBe(1);
    // 2024-01-15 -> 2026-03-14: 2y1m then 15 -> 14 rolls one extra borrowed month
    expect(diff.totalMonths).toBeGreaterThanOrEqual(25);
  });

  it('invalid inputs report invalid', () => {
    const diff = dateDifference('nope', '2026-01-01', false);
    expect(diff.valid).toBe(false);
    expect(diff.totalDays).toBe(0);
  });
});

describe('businessDaysBetween', () => {
  it('counts weekdays between two dates', () => {
    // 2026-11-16 is a Monday; through 2026-11-20 Friday = 5 business days
    expect(businessDaysBetween('2026-11-16', '2026-11-20', true, [])).toBe(5);
  });

  it('excludes weekends', () => {
    // A full Sat+Sun week has 5 business days
    expect(businessDaysBetween('2026-11-16', '2026-11-22', true, [])).toBe(5);
    // Including weekends -> 7 days
    expect(businessDaysBetween('2026-11-16', '2026-11-22', false, [])).toBe(7);
  });

  it('excludes listed holidays', () => {
    // 2026-11-18 (Wed) as holiday removes it from Mon-Fri count
    expect(businessDaysBetween('2026-11-16', '2026-11-20', true, ['2026-11-18'])).toBe(4);
    // Invalid holiday strings are ignored, not errors
    expect(businessDaysBetween('2026-11-16', '2026-11-20', true, ['garbage'])).toBe(5);
  });

  it('is order-independent', () => {
    expect(businessDaysBetween('2026-11-20', '2026-11-16', true, [])).toBe(5);
  });

  it('returns null on invalid dates', () => {
    expect(businessDaysBetween('bad', '2026-11-20', true, [])).toBeNull();
  });
});

describe('shiftDate', () => {
  it('adds and subtracts days', () => {
    expect(shiftDate('2026-01-01', 10, 'day', false)).toBe('2026-01-11');
    expect(shiftDate('2026-01-01', -10, 'day', false)).toBe('2025-12-22');
  });

  it('adds weeks', () => {
    expect(shiftDate('2026-01-01', 3, 'week', false)).toBe('2026-01-22');
  });

  it('handles month-end clamping', () => {
    expect(shiftDate('2026-01-31', 1, 'month', false)).toBe('2026-02-28');
    expect(shiftDate('2024-01-31', 1, 'month', false)).toBe('2024-02-29');
  });

  it('subtracts months across year boundary', () => {
    expect(shiftDate('2026-03-15', -3, 'month', false)).toBe('2025-12-15');
  });

  it('adds years across leap-year February', () => {
    expect(shiftDate('2024-02-29', 1, 'year', false)).toBe('2025-02-28');
    expect(shiftDate('2024-02-29', 4, 'year', false)).toBe('2028-02-29');
  });

  it('rolls forward over weekends with businessOnly', () => {
    // 2026-11-21 is a Saturday -> rolls to Monday 2026-11-23
    expect(shiftDate('2026-11-20', 1, 'day', true)).toBe('2026-11-23');
    expect(shiftDate('2026-11-20', 1, 'day', false)).toBe('2026-11-21');
  });

  it('returns null for invalid base date', () => {
    expect(shiftDate('x', 1, 'day', false)).toBeNull();
  });
});

describe('summaryText', () => {
  const base: ToolState = { ...DEFAULT_STATE };

  it('describes a simple difference', () => {
    const text = summaryText({
      ...base,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      mode: 'difference',
      includeEndDay: false,
    });
    expect(text).toContain('30 days total');
  });

  it('describes business mode with holidays', () => {
    const text = summaryText({
      ...base,
      startDate: '2026-11-16',
      endDate: '2026-11-20',
      mode: 'business',
      holidays: [],
    });
    expect(text).toContain('5 business days');
  });

  it('describes a shift result', () => {
    const text = summaryText({
      ...base,
      mode: 'shift',
      shiftBaseDate: '2026-01-01',
      shiftAmount: 10,
      shiftUnit: 'day',
    });
    expect(text).toContain('2026-01-11');
  });

  it('falls back gracefully on invalid input', () => {
    expect(summaryText({ ...base, startDate: 'bad', endDate: '2026-01-01' })).toContain(
      'valid dates'
    );
    expect(summaryText({ ...base, mode: 'shift', shiftBaseDate: 'bad' })).toContain(
      'valid base date'
    );
  });
});

describe('serialize/deserialize round-trip', () => {
  it('round-trips both dates and options', () => {
    const state: ToolState = {
      ...DEFAULT_STATE,
      startDate: '2026-01-01',
      endDate: '2026-11-21',
      mode: 'business',
      holidays: ['2026-12-25'],
      shiftBaseDate: '2026-05-05',
      shiftAmount: -3,
      shiftUnit: 'month',
      shiftBusinessOnly: true,
    };
    const restored = deserializeState(JSON.parse(serializeState(state)));
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.startDate).toBe('2026-01-01');
      expect(restored.data.endDate).toBe('2026-11-21');
      expect(restored.data.mode).toBe('business');
      expect(restored.data.holidays).toEqual(['2026-12-25']);
      expect(restored.data.shiftAmount).toBe(-3);
      expect(restored.data.shiftUnit).toBe('month');
      expect(restored.data.shiftBusinessOnly).toBe(true);
    }
  });

  it('rejects malformed payloads', () => {
    expect(deserializeState(null).success).toBe(false);
    expect(deserializeState('string').success).toBe(false);
    expect(deserializeState(['array']).success).toBe(false);
  });

  it('repairs invalid dates and modes instead of failing', () => {
    const restored = deserializeState({
      startDate: 'not-a-date',
      endDate: '2026-13-40',
      mode: 'nonsense',
      holidays: ['oops', '2026-12-25'],
    });
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.startDate).toBe('');
      expect(restored.data.endDate).toBe('');
      expect(restored.data.mode).toBe(DEFAULT_STATE.mode);
      expect(restored.data.holidays).toEqual(['2026-12-25']);
    }
  });

  it('falls back to defaults for missing numeric fields', () => {
    const restored = deserializeState({});
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.shiftAmount).toBe(DEFAULT_STATE.shiftAmount);
      expect(restored.data.shiftUnit).toBe('day');
    }
  });
});
