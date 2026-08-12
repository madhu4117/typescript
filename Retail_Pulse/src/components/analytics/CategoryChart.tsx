import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import {
  Paper,
  Typography,
} from "@mui/material";

interface Props {
  data: any[];
}

const COLORS = [
  "#1976d2",
  "#43a047",
  "#fb8c00",
  "#8e24aa",
  "#e53935",
];

export default function CategoryChart({
  data,
}: Props) {
  return (
    <Paper sx={{ p: 2, height: 350 }}>
      <Typography variant="h6" mb={2}>
        Category Sales
      </Typography>

      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            dataKey="sales"
            nameKey="category"
            outerRadius={100}
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