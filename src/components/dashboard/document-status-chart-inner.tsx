"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = {
  Available: "#10B981",
  "Checked Out": "#F59E0B",
};

// Recharts-only render body, split out so the (heavy) recharts bundle loads as a
// lazy chunk after the dashboard shell paints. Rendered via next/dynamic from
// document-status-chart.tsx.
export default function DocumentStatusChartInner({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={2}
          stroke="#fff"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={COLORS[entry.name as keyof typeof COLORS]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [`${value} documents`, name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: "11px", color: "#64748B" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
