import type { Task } from './schema';

const titles = [
  'Review the dashboard layout and navigation',
  'Update the account settings form',
  'Fix the mobile sidebar overflow',
  'Document the new component variants',
  'Improve the search and filtering experience',
  'Add keyboard navigation to the dialog',
  'Review the notification preferences',
  'Update the project onboarding guide',
  'Polish the analytics chart labels',
  'Verify the responsive table layout',
];

export const tasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
  id: 'TASK-' + (1000 + i),
  title: titles[i % titles.length],
  status: (['todo', 'in progress', 'done', 'canceled', 'backlog'] as const)[i % 5],
  label: (['bug', 'feature', 'documentation'] as const)[i % 3],
  priority: (['low', 'medium', 'high'] as const)[Math.floor(i / 3) % 3],
  createdAt: new Date(Date.UTC(2026, 0, 1 + i)),
  updatedAt: new Date(Date.UTC(2026, 5, 1 + (i % 30))),
  assignee: ['Olivia Martin', 'Jackson Lee', 'Isabella Nguyen', 'William Kim'][i % 4],
  description: titles[i % titles.length] + '. This is local template data.',
  dueDate: new Date(Date.UTC(2026, 10, 1 + (i % 30))),
}));
