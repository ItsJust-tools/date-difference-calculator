import type { ToolConfig } from '@itsjust/core';

const toolConfig = {
  id: '1795280694',
  name: 'Date Difference Calculator',
  description:
    'Calculate the difference between two dates in days, weeks, months, and years, with business-day counting, holiday exclusion, and date add/subtract utilities.',
  version: '1.0.0',
  exportFormats: ['png', 'jpeg', 'webp', 'pdf'],
  features: {
    export: true,
    autoSave: true,
    undoRedo: false,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    accent: '#3b82f6',
    accentHover: '#2563eb',
    accentSubtle: 'rgba(59, 130, 246, 0.12)',
    brand: 'Date Difference Calculator',
    icon: '📅',
  },
  shortcuts: [
    {
      title: 'Date Difference Calculator',
      shortcuts: [
        { keys: 'D', label: 'Difference', description: 'switch to difference mode' },
        { keys: 'B', label: 'Business days', description: 'switch to business-day mode' },
        { keys: 'S', label: 'Shift', description: 'switch to add/subtract mode' },
        {
          keys: 'C',
          label: 'Copy summary',
          description: 'copy the result summary to the clipboard',
        },
      ],
    },
  ],
} satisfies ToolConfig;

export default toolConfig;
