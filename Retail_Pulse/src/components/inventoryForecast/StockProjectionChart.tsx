import {
  Paper,
  Typography,
  Box,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  ForecastItem,
} from "../../services/inventoryForecastService";

interface Props {
  items: ForecastItem[];
}

const StockProjectionChart = ({
  items,
}: Props) => {
  const chartItems = items
    .filter(
      (item) =>
        item.currentStock > 0 ||
        item.forecastedDemand > 0
    )
    .slice(0, 8);

  if (chartItems.length === 0) {
    return (
      <Paper
        sx={{
          p: 3,
          mt: 3,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "#1e293b" }}
        >
          Stock Projection
        </Typography>

        <Typography
          sx={{ mt: 2 }}
          color="text.secondary"
        >
          No forecast data available for visualization.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        mt: 3,
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: "#1e293b", mb: 3 }}
      >
        Stock vs Forecasted Demand (Top 8 Products)
      </Typography>

      <Box sx={{ width: "100%", height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartItems}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="productName" stroke="#64748b" style={{ fontSize: "11px" }} />
            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="currentStock" name="Current Stock" fill="#0284c7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="forecastedDemand" name="Forecasted Demand (30 Days)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default StockProjectionChart;