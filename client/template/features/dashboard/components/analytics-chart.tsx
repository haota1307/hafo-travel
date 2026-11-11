'use client';

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { useI18n } from '@/template/i18n/provider';

const data = [
  {
    name: 'Mon',
    clicks: 780,
    uniques: 540,
  },
  {
    name: 'Tue',
    clicks: 620,
    uniques: 450,
  },
  {
    name: 'Wed',
    clicks: 890,
    uniques: 620,
  },
  {
    name: 'Thu',
    clicks: 740,
    uniques: 490,
  },
  {
    name: 'Fri',
    clicks: 950,
    uniques: 710,
  },
  {
    name: 'Sat',
    clicks: 650,
    uniques: 430,
  },
  {
    name: 'Sun',
    clicks: 810,
    uniques: 590,
  },
];

export function AnalyticsChart() {
  const { t, number } = useI18n();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <XAxis
          dataKey="name"
          tickFormatter={(value) => t(String(value))}
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(value) => number(Number(value))}
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="currentColor"
          className="text-primary"
          fill="currentColor"
          fillOpacity={0.15}
        />
        <Area
          type="monotone"
          dataKey="uniques"
          stroke="currentColor"
          className="text-muted-foreground"
          fill="currentColor"
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
