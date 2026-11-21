'use client';

import React from 'react';
import {
  businessDaysBetween,
  dateDifference,
  isoFromMs,
  parseIsoDate,
  shiftDate,
  summaryText,
} from '../tool-definition';
import { MODES } from '../ui-shared';
import type { ToolState } from '../types';

interface CanvasProps {
  state: ToolState;
  onChange?: (state: ToolState) => void;
  onCopySummary?: () => void;
}

const dateInputClass =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

export const Canvas: React.FC<CanvasProps> = ({ state, onChange }) => {
  const diff = dateDifference(
    state.startDate,
    state.endDate,
    state.mode === 'difference' ? state.includeEndDay : true
  );
  const businessCount =
    state.mode === 'difference' || state.mode === 'business' || state.mode === 'calendar'
      ? businessDaysBetween(state.startDate, state.endDate, true, state.holidays)
      : null;
  const shiftResult =
    state.mode === 'shift'
      ? shiftDate(state.shiftBaseDate, state.shiftAmount, state.shiftUnit, state.shiftBusinessOnly)
      : null;

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full" data-testid="date-canvas">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Calculator mode"
        data-testid="mode-tabs"
      >
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            role="tab"
            aria-selected={state.mode === mode.value}
            data-testid={`mode-tab-${mode.value}`}
            onClick={() => onChange?.({ ...state, mode: mode.value })}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
              state.mode === mode.value
                ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {state.mode === 'shift' ? (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="shift-inputs">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Base date
            <input
              type="date"
              value={state.shiftBaseDate}
              onChange={(e) => onChange?.({ ...state, shiftBaseDate: e.target.value })}
              data-testid="input-shift-date"
              className={dateInputClass}
            />
          </label>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Amount (negative to subtract)
            <input
              type="number"
              value={state.shiftAmount}
              onChange={(e) => {
                const amount = Number(e.target.value);
                if (Number.isFinite(amount)) onChange?.({ ...state, shiftAmount: amount });
              }}
              data-testid="input-shift-amount"
              className={dateInputClass}
            />
          </label>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Unit
            <select
              value={state.shiftUnit}
              onChange={(e) =>
                onChange?.({
                  ...state,
                  shiftUnit: e.target.value as ToolState['shiftUnit'],
                })
              }
              data-testid="input-shift-unit"
              className={dateInputClass}
            >
              <option value="day">Days</option>
              <option value="week">Weeks</option>
              <option value="month">Months</option>
              <option value="year">Years</option>
            </select>
          </label>
          <label className="mt-6 flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={state.shiftBusinessOnly}
              onChange={(e) => onChange?.({ ...state, shiftBusinessOnly: e.target.checked })}
              data-testid="toggle-shift-business"
            />
            Land on business days (roll forward past weekends)
          </label>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="range-inputs">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Start date
            <input
              type="date"
              value={state.startDate}
              onChange={(e) => onChange?.({ ...state, startDate: e.target.value })}
              data-testid="input-start-date"
              className={dateInputClass}
            />
          </label>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            End date
            <input
              type="date"
              value={state.endDate}
              onChange={(e) => onChange?.({ ...state, endDate: e.target.value })}
              data-testid="input-end-date"
              className={dateInputClass}
            />
          </label>
        </div>
      )}

      <div
        className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900"
        data-testid="result-card"
        role="status"
      >
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Result
        </span>
        <span className="block font-mono text-3xl font-bold" data-testid="result-main">
          {state.mode === 'shift'
            ? (shiftResult ?? '—')
            : diff.valid
              ? state.mode === 'calendar'
                ? `${diff.years}y ${diff.months}m ${diff.days}d`
                : `${diff.totalDays} days`
              : '—'}
        </span>
        <span
          className="mt-2 block text-xs text-gray-600 dark:text-gray-300"
          data-testid="result-summary"
        >
          {summaryText(state)}
        </span>
      </div>

      {state.mode !== 'shift' && diff.valid ? (
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4" data-testid="diff-stats">
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <dt className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Weeks + days
            </dt>
            <dd className="mt-1 font-mono text-lg" data-testid="stat-weeks">
              {diff.weeks}w {diff.remainingDays}d
            </dd>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <dt className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Calendar
            </dt>
            <dd className="mt-1 font-mono text-lg" data-testid="stat-calendar">
              {diff.years}y {diff.months}m {diff.days}d
            </dd>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <dt className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total months
            </dt>
            <dd className="mt-1 font-mono text-lg" data-testid="stat-total-months">
              {diff.totalMonths}
            </dd>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <dt className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Business days
            </dt>
            <dd className="mt-1 font-mono text-lg" data-testid="stat-business">
              {businessCount ?? '—'}
            </dd>
          </div>
        </dl>
      ) : null}

      {state.mode === 'business' ? (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Holidays to exclude
          </h3>
          <input
            type="date"
            data-testid="input-holiday"
            aria-label="Add holiday date"
            onChange={(e) => {
              const value = e.target.value;
              if (value && parseIsoDate(value) !== null && !state.holidays.includes(value)) {
                onChange?.({ ...state, holidays: [...state.holidays, value].sort() });
              }
            }}
            className={dateInputClass}
          />
          <ul className="mt-2 flex flex-wrap gap-2" data-testid="holiday-list">
            {state.holidays.map((h) => (
              <li key={h}>
                <button
                  type="button"
                  data-testid={`holiday-${h}`}
                  onClick={() =>
                    onChange?.({ ...state, holidays: state.holidays.filter((x) => x !== h) })
                  }
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-red-50 hover:text-red-700 dark:border-gray-700 dark:text-gray-300"
                  title="Click to remove"
                >
                  {h} ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        {diff.valid && diff.reversed && state.mode !== 'shift'
          ? 'Dates were reversed — showing the absolute difference.'
          : 'All calculations run locally in your browser; nothing is uploaded.'}
      </p>
      <span className="hidden" data-testid="iso-today">
        {isoFromMs(Date.UTC(2026, 0, 1))}
      </span>
    </div>
  );
};
