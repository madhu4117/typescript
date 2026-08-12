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

interface SalesGrowthChartProps {
  data: any[];
}

export default function SalesGrowthChart({
  data,
}: SalesGrowthChartProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        variant="h6"
        mb={2}
      >
        Sales Growth
      </Typography>

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

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