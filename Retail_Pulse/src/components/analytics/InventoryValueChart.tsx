import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import {
  Paper,
  Typography,
} from "@mui/material";

interface Props {
  data: any[];
}

export default function InventoryValueChart({
  data,
}: Props) {

  return (

    <Paper sx={{ p: 2, height: 350 }}>

      <Typography
        variant="h6"
        mb={2}
      >
        Inventory Value By Category
      </Typography>

      <ResponsiveContainer
        width="100%"
        height="90%"
      >

        <BarChart data={data}>

          <XAxis dataKey="category" />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="value"
            fill="#2e7d32"
          />

        </BarChart>

      </ResponsiveContainer>

    </Paper>

  );
}