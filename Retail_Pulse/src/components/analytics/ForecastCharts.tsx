import {
  Paper,
  Typography,
  Box,
} from "@mui/material";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ForecastChartsProps {
  productData?: any[];
  categoryData?: any[];
}

export default function ForecastCharts({
  productData = [],
  categoryData = [],
}: ForecastChartsProps) {
  const productChartData = productData.map((item) => ({
    name: item.productName,
    predicted: Number(item.predictedDemand || 0),
    stock: Number(item.currentStock || 0),
  }));

  const categoryChartData = categoryData.map((item) => ({
    name: `Category ${item.categoryId}`,
    historical: Number(item.historicalSales || 0),
    predicted: Number(item.predictedDemand || 0),
  }));

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "1fr 1fr",
        },
        gap: 3,
        mt: 3,
      }}
    >
      {/* PRODUCT DEMAND TREND */}

      <Paper sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2 }}
        >
          Product Demand Trend
        </Typography>

        {productChartData.length === 0 ? (
          <Typography color="text.secondary">
            No product forecast data available
          </Typography>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <BarChart data={productChartData}>
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="name"
                interval={0}
                angle={-20}
                textAnchor="end"
                height={80}
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="predicted"
                name="Predicted Demand"
              />

              <Bar
                dataKey="stock"
                name="Current Stock"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* CATEGORY DEMAND TREND */}

      <Paper sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2 }}
        >
          Category Demand Trend
        </Typography>

        {categoryChartData.length === 0 ? (
          <Typography color="text.secondary">
            No category forecast data available
          </Typography>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <LineChart
              data={categoryChartData}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="name"
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="historical"
                name="Historical Sales"
                stroke="#8884d8"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted Demand"
                stroke="#82ca9d"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Box>
  );
}