import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

import {
  Paper,
  Typography,
} from "@mui/material";

interface SalesPaymentChartProps {
  data: any[];
}

const COLORS = [
  "#1976d2",
  "#2e7d32",
  "#ed6c02",
  "#9c27b0",
  "#d32f2f",
  "#00838f",
];

export default function SalesPaymentChart({
  data,
}: SalesPaymentChartProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        variant="h6"
        mb={2}
      >
        Sales by Payment Method
      </Typography>

      {data.length === 0 ? (
        <Typography color="text.secondary">
          No payment data available.
        </Typography>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={350}
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="paymentMethod"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={130}
              paddingAngle={3}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    COLORS[index % COLORS.length]
                  }
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value: any) =>
                `₹ ${value}`
              }
            />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}