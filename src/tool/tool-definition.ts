import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import { DEFAULT_STATE, parseIsoDate, type CalcMode, type ToolState } from './types';

export {
  businessDaysBetween,
  dateDifference,
  daysInMonth,
  isLeapYear,
  isoFromMs,
  parseIsoDate,
  summaryText,
  shiftDate,
  dayOfWeek,
} from './types';
export type { CalcMode, DateDifference, ToolState } from './types';

const VALID_MODES: CalcMode[] = ['difference', 'calendar', 'business', 'shift'];

/** Serialize tool state into a compact JSON string for share/import. */
export function serializeState(state: ToolState): string {
  return JSON.stringify({
    startDate: state.startDate,
    endDate: state.endDate,
    mode: state.mode,
    includeEndDay: Boolean(state.includeEndDay),
    excludeWeekends: Boolean(state.excludeWeekends),
    holidays: state.holidays,
    shiftBaseDate: state.shiftBaseDate,
    shiftAmount: Math.round(state.shiftAmount),
    shiftUnit: state.shiftUnit,
    shiftBusinessOnly: Boolean(state.shiftBusinessOnly),
  });
}

function validIsoOrEmpty(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed === '') return '';
  return parseIsoDate(trimmed) !== null ? trimmed : '';
}

/** Validate and recover tool state from an arbitrary payload. */
export function deserializeState(data: unknown): DeserializeResult<ToolState> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      success: false,
      error: 'Invalid data format: expected date difference calculator state object',
    };
  }
  const v = data as Record<string, unknown>;
  const mode: CalcMode = VALID_MODES.includes(v.mode as CalcMode)
    ? (v.mode as CalcMode)
    : DEFAULT_STATE.mode;
  const state: ToolState = {
    startDate: validIsoOrEmpty(v.startDate),
    endDate: validIsoOrEmpty(v.endDate),
    mode,
    includeEndDay:
      typeof v.includeEndDay === 'boolean' ? v.includeEndDay : DEFAULT_STATE.includeEndDay,
    excludeWeekends:
      typeof v.excludeWeekends === 'boolean' ? v.excludeWeekends : DEFAULT_STATE.excludeWeekends,
    holidays: Array.isArray(v.holidays)
      ? v.holidays.filter((h): h is string => typeof h === 'string' && parseIsoDate(h) !== null)
      : [],
    shiftBaseDate: validIsoOrEmpty(v.shiftBaseDate),
    shiftAmount:
      typeof v.shiftAmount === 'number' && Number.isFinite(v.shiftAmount)
        ? Math.round(v.shiftAmount)
        : DEFAULT_STATE.shiftAmount,
    shiftUnit:
      v.shiftUnit === 'day' ||
      v.shiftUnit === 'week' ||
      v.shiftUnit === 'month' ||
      v.shiftUnit === 'year'
        ? v.shiftUnit
        : DEFAULT_STATE.shiftUnit,
    shiftBusinessOnly:
      typeof v.shiftBusinessOnly === 'boolean'
        ? v.shiftBusinessOnly
        : DEFAULT_STATE.shiftBusinessOnly,
  };
  return { success: true, data: state };
}

export const dateDifferenceTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: { ...DEFAULT_STATE },
  serialize: serializeState,
  deserialize: deserializeState,
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};
