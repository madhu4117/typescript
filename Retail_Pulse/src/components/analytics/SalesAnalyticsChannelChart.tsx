import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  Paper,
  Typography,
} from "@mui/material";

interface SalesAnalyticsChannelChartProps {
  data: any[];
}

export default function SalesAnalyticsChannelChart({
  data,
}: SalesAnalyticsChannelChartProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        variant="h6"
        mb={2}
      >
        Sales by Channel
      </Typography>

      {data.length === 0 ? (
        <Typography color="text.secondary">
          No channel data available.
        </Typography>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={350}
        >
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="channel"
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="revenue"
              fill="#1976d2"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}