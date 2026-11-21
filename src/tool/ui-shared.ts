import { DEFAULT_STATE, type CalcMode, type ToolState } from './types';

export const MODES: { value: CalcMode; label: string; hint: string }[] = [
  { value: 'difference', label: 'Difference', hint: 'total days, weeks and calendar breakdown' },
  { value: 'calendar', label: 'Calendar', hint: 'years, months and days breakdown' },
  { value: 'business', label: 'Business days', hint: 'count weekdays between dates' },
  { value: 'shift', label: 'Add / subtract', hint: 'shift a date by an amount' },
];

export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return (
    typeof v.startDate === 'string' &&
    typeof v.endDate === 'string' &&
    typeof v.mode === 'string' &&
    DEFAULT_STATE !== undefined
  );
}
