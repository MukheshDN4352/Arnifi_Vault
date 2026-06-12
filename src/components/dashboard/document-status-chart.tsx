"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  available: number;
  checkedOut: number;
}

const COLORS = {
  Available: "#10B981",
  "Checked Out": "#F59E0B",
};

export function DocumentStatusChart({ available, checkedOut }: Props) {
  const data = [
    { name: "Available", value: available },
    { name: "Checked Out", value: checkedOut },
  ].filter((d) => d.value > 0);

  const total = available + checkedOut;

  return (
    <div className="vault-card h-full">
      <h3 className="text-sm font-semibold text-arnifi-ink mb-1">
        Document Status
      </h3>
      <p className="text-xs text-arnifi-muted mb-4">
        Distribution across {total} documents
      </p>

      {total === 0 ? (
        <div className="flex items-center justify-center h-40 text-arnifi-muted text-sm">
          No documents yet
        </div>
      ) : (
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
              formatter={(value: number, name: string) => [
                `${value} documents`,
                name,
              ]}
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
      )}
    </div>
  );
}
