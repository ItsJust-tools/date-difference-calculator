'use client';

import React from 'react';
import type { ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, onChange }) => {
  return (
    <div className="p-4 space-y-6 text-sm overflow-y-auto h-full" data-testid="date-sidebar">
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Options</h3>
        <label className="mb-3 flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={state.excludeWeekends}
            onChange={(e) => onChange({ ...state, excludeWeekends: e.target.checked })}
            data-testid="toggle-exclude-weekends"
          />
          Exclude weekends from business-day count
        </label>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Shift defaults</h3>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Base date
          <input
            type="date"
            value={state.shiftBaseDate}
            onChange={(e) => onChange({ ...state, shiftBaseDate: e.target.value })}
            data-testid="sidebar-shift-date"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </label>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Keyboard shortcuts</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>
            <kbd>D</kbd> — Difference mode
          </li>
          <li>
            <kbd>B</kbd> — Business days mode
          </li>
          <li>
            <kbd>S</kbd> — Add/subtract mode
          </li>
          <li>
            <kbd>C</kbd> — Copy summary
          </li>
        </ul>
      </div>
    </div>
  );
};
