import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  Paper,
  Typography,
  Box,
} from "@mui/material";

interface TopProduct {
  product: string;
  quantity: number;
}

interface Props {
  data: TopProduct[];
}

export default function TopProductsChart({ data }: Props) {
  return (
    <Paper
      sx={{
        p: 2,
        height: 350,
        width: "100%",
      }}
    >
      <Typography
        variant="h6"
        mb={2}
        textAlign="center"
      >
        Top Selling Products
      </Typography>

      {data && data.length > 0 ? (
        <ResponsiveContainer
          width="100%"
          height="85%"
        >
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 10,
              bottom: 30,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="product"
              angle={-20}
              textAnchor="end"
              interval={0}
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="quantity"
              fill="#1976d2"
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Box
          sx={{
            height: "80%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography color="text.secondary">
            No top product data available
          </Typography>
        </Box>
      )}
    </Paper>
  );
}