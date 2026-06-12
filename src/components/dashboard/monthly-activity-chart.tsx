"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  month: string;
  checkouts: number;
}

export function MonthlyActivityChart({ data }: { data: MonthlyData[] }) {
  return (
    <div className="vault-card h-full">
      <h3 className="text-sm font-semibold text-arnifi-ink mb-1">
        Checkout Activity
      </h3>
      <p className="text-xs text-arnifi-muted mb-4">
        Documents removed over the last 6 months
      </p>

      {data.every((d) => d.checkouts === 0) ? (
        <div className="flex items-center justify-center h-40 text-arnifi-muted text-sm">
          No activity recorded yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                fontSize: "12px",
              }}
              cursor={{ fill: "rgba(79,70,229,0.04)" }}
            />
            <Bar
              dataKey="checkouts"
              fill="#4F46E5"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
