'use client';

import React, { useCallback } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { summaryText } from '../tool-definition';
import type { ToolState } from '../types';

interface ToolCanvasProps {
  state: ToolState;
  fontSize?: number;
  readOnly?: boolean;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  onStateChange?: (updater: (prev: ToolState) => ToolState) => void;
  onClear?: () => void;
  onCopySummary?: () => void;
}

export function ToolCanvas({
  state,
  readOnly = false,
  canvasRef,
  onStateChange,
  onClear,
  onCopySummary,
}: ToolCanvasProps) {
  const handleChange = useCallback(
    (updater: (prev: ToolState) => ToolState) => {
      onStateChange?.(updater);
    },
    [onStateChange]
  );

  // Keyboard shortcuts: D/B/S modes, C copy summary.
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const key = event.key.toLowerCase();
      if (key === 'd') {
        onStateChange?.((prev) => ({ ...prev, mode: 'difference' }));
      } else if (key === 'b') {
        onStateChange?.((prev) => ({ ...prev, mode: 'business' }));
      } else if (key === 's') {
        onStateChange?.((prev) => ({ ...prev, mode: 'shift' }));
      } else if (key === 'c') {
        void navigator.clipboard.writeText(summaryText(state)).catch(() => {});
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onStateChange, state]);

  void readOnly;

  return (
    <div
      ref={canvasRef}
      className="date-canvas"
      role="application"
      aria-label="Date difference calculator canvas"
    >
      {onClear ? (
        <Toolbar
          state={state}
          onChange={handleChange as unknown as (next: ToolState) => void}
          onClear={onClear}
          onSwap={
            state.mode === 'shift'
              ? undefined
              : () =>
                  handleChange((prev) => ({
                    ...prev,
                    startDate: prev.endDate,
                    endDate: prev.startDate,
                  }))
          }
          onCopy={onCopySummary}
        />
      ) : null}
      <Canvas state={state} onChange={handleChange as unknown as (next: ToolState) => void} />
    </div>
  );
}
