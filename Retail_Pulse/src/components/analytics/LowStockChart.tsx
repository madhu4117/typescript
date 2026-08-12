import {
  Paper,
  Typography,
} from "@mui/material";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface Props {
  data: any[];
}

export default function LowStockChart({
  data,
}: Props) {
  return (
    <Paper sx={{ p: 2, height: 350 }}>
      <Typography variant="h6" mb={2}>
        Top Low Stock Products
      </Typography>

      <ResponsiveContainer
        width="100%"
        height="90%"
      >
        <BarChart data={data}>
          <XAxis dataKey="product" />
          <YAxis />
          <Tooltip />

          <Bar
            dataKey="stock"
            fill="#f57c00"
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}