import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  Paper,
  Typography,
} from "@mui/material";

interface RevenueChartProps {
  data: any[];
}

export default function RevenueChart({
  data,
}: RevenueChartProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        variant="h6"
        mb={2}
      >
        Revenue Trend
      </Typography>

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#1976d2"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}