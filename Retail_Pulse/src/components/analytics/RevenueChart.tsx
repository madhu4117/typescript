
import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  getRevenueTrend,
  RevenueTrendItem,
} from "../../services/analyticsService";

type Period = "daily" | "weekly" | "monthly";

export default function RevenueChart() {
  const [period, setPeriod] = useState<Period>("daily");

  const [data, setData] = useState<RevenueTrendItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadRevenueTrend();
  }, [period]);

  const loadRevenueTrend = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getRevenueTrend(period);

      setData(result || []);
    } catch (err) {
      console.error("Revenue trend error:", err);

      setError(
        "Unable to load sales revenue data."
      );

      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (
    _: React.MouseEvent<HTMLElement>,
    value: Period | null
  ) => {
    if (value) {
      setPeriod(value);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 3,
        width: "100%",
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
          >
            Sales Overview
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Revenue and order performance
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
        >
          <ToggleButton value="daily">
            Daily
          </ToggleButton>

          <ToggleButton value="weekly">
            Weekly
          </ToggleButton>

          <ToggleButton value="monthly">
            Monthly
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* LOADING */}

      {loading ? (
        <Box
          sx={{
            height: 350,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : data.length === 0 ? (
        /* EMPTY STATE */

        <Box
          sx={{
            height: 350,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              color="text.secondary"
            >
              No sales data available
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              There are no sales for the selected period.
            </Typography>
          </Box>
        </Box>
      ) : (
        /* CHART */

        <Box
          sx={{
            width: "100%",
            height: 350,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "Revenue") {
                    return [
                      `₹${Number(value).toLocaleString("en-IN")}`,
                      name,
                    ];
                  }

                  return [
                    Number(value).toLocaleString("en-IN"),
                    name,
                  ];
                }}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="orders"
                name="Orders"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}

