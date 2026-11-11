'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { useI18n } from '@/template/i18n/provider';

const data = [
  {
    name: 'Jan',
    total: 4200,
  },
  {
    name: 'Feb',
    total: 3100,
  },
  {
    name: 'Mar',
    total: 2800,
  },
  {
    name: 'Apr',
    total: 5100,
  },
  {
    name: 'May',
    total: 3900,
  },
  {
    name: 'Jun',
    total: 4700,
  },
  {
    name: 'Jul',
    total: 3200,
  },
  {
    name: 'Aug',
    total: 5500,
  },
  {
    name: 'Sep',
    total: 4100,
  },
  {
    name: 'Oct',
    total: 3600,
  },
  {
    name: 'Nov',
    total: 4900,
  },
  {
    name: 'Dec',
    total: 5800,
  },
];

export function Overview() {
  const { t, number } = useI18n();

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          tickFormatter={(value) => t(String(value))}
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          direction="ltr"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            number(Number(value), {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            })
          }
        />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  );
}
