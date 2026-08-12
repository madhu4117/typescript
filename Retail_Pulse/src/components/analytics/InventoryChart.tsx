import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
} from "recharts";

import {
  Paper,
  Typography,
} from "@mui/material";

interface Props {
  data: any[];
}

const COLORS = [
  "#4caf50",
  "#ff9800",
  "#f44336",
];

export default function InventoryChart({
  data,
}: Props) {
  return (
    <Paper sx={{ p: 2, height: 350 }}>
      <Typography variant="h6" mb={2}>
        Inventory Status
      </Typography>

      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            outerRadius={110}
            label
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
}