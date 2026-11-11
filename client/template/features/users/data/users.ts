import type { User } from './schema';

const names = [
  ['Olivia', 'Martin'],
  ['Jackson', 'Lee'],
  ['Isabella', 'Nguyen'],
  ['William', 'Kim'],
  ['Sofia', 'Davis'],
  ['Lucas', 'Brown'],
  ['Amelia', 'Wilson'],
  ['Ethan', 'Tran'],
  ['Mia', 'Taylor'],
  ['Noah', 'Garcia'],
];

export const users: User[] = Array.from({ length: 500 }, (_, i) => {
  const [firstName, lastName] = names[i % names.length];

  return {
    id: 'user-' + (i + 1),
    firstName,
    lastName,
    username: firstName.toLowerCase() + '.' + lastName.toLowerCase() + (i + 1),
    email: firstName.toLowerCase() + (i + 1) + '@example.com',
    phoneNumber: '+1 202 555 ' + String(i).padStart(4, '0'),
    status: (['active', 'inactive', 'invited', 'suspended'] as const)[i % 4],
    role: (['superadmin', 'admin', 'cashier', 'manager'] as const)[Math.floor(i / 4) % 4],
    createdAt: new Date(Date.UTC(2025, 0, 1 + i)),
    updatedAt: new Date(Date.UTC(2026, 0, 1 + (i % 30))),
  };
});
