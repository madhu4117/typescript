import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { SelectChangeEvent } from "@mui/material/Select";

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

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningIcon from "@mui/icons-material/Warning";
import AssessmentIcon from "@mui/icons-material/Assessment";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";

import {
  generateForecast,
  getProductForecasts,
  getCategoryForecasts,
  getInventoryRecommendations,
  getForecastDashboard,
} from "../services/demandForecastService";

/* =========================================================
   COLORS
========================================================= */

const PURPLE = "#7c3aed";
const PURPLE_HOVER = "#6d28d9";
const PURPLE_LIGHT = "rgba(124, 58, 237, 0.10)";

const BLUE = "#1976d2";
const GREEN = "#16a34a";
const RED = "#dc2626";

/* =========================================================
   TYPES
========================================================= */

interface DashboardData {
  totalPredictedDemand: number;
  productsExpectedToRunOut: number;
  highGrowthProducts: number;
  slowMovingProducts: number;
  forecastAccuracy: number;
  forecastPeriod: string;
}

interface ProductForecast {
  id: number;
  productId: number;
  productName: string;
  brand?: string;
  categoryId?: number;
  currentStock: number;
  historicalSales?: number;
  predictedDemand: number;
  forecastPeriod: string;
  confidenceLevel: number;
}

interface CategoryForecast {
  categoryId: number;
  categoryName?: string;
  historicalSales: number;
  predictedDemand: number;
  expectedGrowthPercentage: number;
}

interface Recommendation {
  productId: number;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  recommendation: string;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function DemandForecasting() {
  const [period, setPeriod] = useState<string>("30");

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [products, setProducts] =
    useState<ProductForecast[]>([]);

  const [categories, setCategories] =
    useState<CategoryForecast[]>([]);

  const [recommendations, setRecommendations] =
    useState<Recommendation[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  const [generating, setGenerating] =
    useState<boolean>(false);

  const [error, setError] = useState<string>("");

  const [success, setSuccess] = useState<string>("");

  /* =========================================================
     LOAD ALL FORECAST DATA
  ========================================================= */

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        dashboardData,
        productData,
        categoryData,
        recommendationData,
      ] = await Promise.all([
        getForecastDashboard(period),
        getProductForecasts(period),
        getCategoryForecasts(period),
        getInventoryRecommendations(period),
      ]);

      setDashboard(dashboardData || null);

      setProducts(
        Array.isArray(productData)
          ? productData
          : []
      );

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : []
      );

      setRecommendations(
        Array.isArray(recommendationData)
          ? recommendationData
          : []
      );
    } catch (err: any) {
      console.error(
        "Demand forecasting load error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load demand forecasting data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     GENERATE FORECAST
  ========================================================= */

  const handleGenerateForecast = async () => {
    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      await generateForecast(period);

      setSuccess(
        `Forecast generated successfully for the next ${period} days.`
      );

      await loadDashboard();
    } catch (err: any) {
      console.error(
        "Forecast generation error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Forecast generation failed."
      );
    } finally {
      setGenerating(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadDashboard();
  }, [period]);

  /* =========================================================
     PERIOD CHANGE
  ========================================================= */

  const handlePeriodChange = (
    event: SelectChangeEvent<string>
  ) => {
    setPeriod(event.target.value);
  };

  /* =========================================================
     TOP PRODUCTS
  ========================================================= */

  const topProducts = useMemo(() => {
    return [...products]
      .sort(
        (a, b) =>
          Number(b.predictedDemand || 0) -
          Number(a.predictedDemand || 0)
      )
      .slice(0, 8);
  }, [products]);

  /* =========================================================
     PRODUCT CHART DATA
  ========================================================= */

  const productChartData = useMemo(() => {
    return topProducts.map((product) => ({
      name:
        product.productName &&
        product.productName.length > 16
          ? `${product.productName.substring(
              0,
              16
            )}...`
          : product.productName,

      predictedDemand:
        Number(product.predictedDemand) || 0,

      stock:
        Number(product.currentStock) || 0,

      historicalSales:
        Number(product.historicalSales) || 0,
    }));
  }, [topProducts]);

  /* =========================================================
     CATEGORY CHART DATA
  ========================================================= */

  const categoryChartData = useMemo(() => {
    return categories.map((category) => ({
      name:
        category.categoryName ||
        `Category ${category.categoryId}`,

      historicalSales:
        Number(category.historicalSales) || 0,

      predictedDemand:
        Number(category.predictedDemand) || 0,

      growth:
        Number(
          category.expectedGrowthPercentage
        ) || 0,
    }));
  }, [categories]);

  /* =========================================================
     RECOMMENDATION COLOR
  ========================================================= */

  const getRecommendationColor = (
    recommendation: string
  ):
    | "error"
    | "warning"
    | "secondary"
    | "success"
    | "default" => {
    switch (recommendation) {
      case "Immediate Restock Required":
        return "error";

      case "Reorder Soon":
        return "warning";

      case "Overstock Risk":
        return "secondary";

      case "Stock Level Healthy":
        return "success";

      default:
        return "default";
    }
  };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        backgroundColor: "#f7f9fc",
        p: {
          xs: 2,
          md: 3,
        },
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          flexDirection: {
            xs: "column",
            md: "row",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
            }}
          >
            Demand Forecasting
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#718096",
              mt: 0.5,
            }}
          >
            Predict future demand and optimize
            inventory
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* FORECAST PERIOD */}

          <FormControl
            size="small"
            sx={{
              minWidth: 170,
            }}
          >
            <InputLabel>
              Forecast Period
            </InputLabel>

            <Select
              value={period}
              label="Forecast Period"
              onChange={handlePeriodChange}
            >
              <MenuItem value="7">
                Next 7 Days
              </MenuItem>

              <MenuItem value="30">
                Next 30 Days
              </MenuItem>

              <MenuItem value="90">
                Next 90 Days
              </MenuItem>
            </Select>
          </FormControl>

          {/* REFRESH */}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDashboard}
            disabled={loading}
            sx={{
              borderColor: PURPLE,
              color: PURPLE,
              "&:hover": {
                borderColor: PURPLE_HOVER,
                backgroundColor:
                  PURPLE_LIGHT,
              },
            }}
          >
            Refresh
          </Button>

          {/* GENERATE */}

          <Button
            variant="contained"
            startIcon={
              generating ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <AutoGraphIcon />
              )
            }
            onClick={handleGenerateForecast}
            disabled={generating}
            sx={{
              backgroundColor: PURPLE,
              "&:hover": {
                backgroundColor:
                  PURPLE_HOVER,
              },
            }}
          >
            {generating
              ? "Generating..."
              : "Generate Forecast"}
          </Button>
        </Box>
      </Box>

      {/* =====================================================
          ALERTS
      ===================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        {/* TOTAL DEMAND */}

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 2.4,
          }}
        >
          <KpiCard
            title="Total Predicted Demand"
            value={
              dashboard
                ? dashboard.totalPredictedDemand
                : 0
            }
            suffix=""
            icon={<TrendingUpIcon />}
          />
        </Grid>

        {/* RUN OUT */}

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 2.4,
          }}
        >
          <KpiCard
            title="Expected to Run Out"
            value={
              dashboard
                ? dashboard.productsExpectedToRunOut
                : 0
            }
            suffix=" products"
            icon={<WarningIcon />}
          />
        </Grid>

        {/* HIGH GROWTH */}

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 2.4,
          }}
        >
          <KpiCard
            title="High Growth Products"
            value={
              dashboard
                ? dashboard.highGrowthProducts
                : 0
            }
            suffix=" products"
            icon={<AutoGraphIcon />}
          />
        </Grid>

        {/* SLOW MOVING */}

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 2.4,
          }}
        >
          <KpiCard
            title="Slow Moving Products"
            value={
              dashboard
                ? dashboard.slowMovingProducts
                : 0
            }
            suffix=" products"
            icon={<InventoryIcon />}
          />
        </Grid>

        {/* ACCURACY */}

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 2.4,
          }}
        >
          <KpiCard
            title="Forecast Accuracy"
            value={
              dashboard
                ? dashboard.forecastAccuracy
                : 0
            }
            suffix="%"
            icon={<AssessmentIcon />}
          />
        </Grid>
      </Grid>

      {/* =====================================================
          CHARTS ROW
      ===================================================== */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        {/* ===================================================
            CATEGORY HISTORICAL VS FORECAST
        =================================================== */}

        <Grid
          size={{
            xs: 12,
            md: 7,
          }}
        >
          <Paper
            sx={{
              p: 3,
              height: 430,
              borderRadius: 2,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Historical Sales vs Forecast
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Compare historical category sales
              with predicted demand
            </Typography>

            {categoryChartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={330}
              >
                <BarChart
                  data={categoryChartData}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="historicalSales"
                    name="Historical Sales"
                    fill={BLUE}
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="predictedDemand"
                    name="Predicted Demand"
                    fill={PURPLE}
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </Paper>
        </Grid>

        {/* ===================================================
            TOP PRODUCTS
        =================================================== */}

        <Grid
          size={{
            xs: 12,
            md: 5,
          }}
        >
          <Paper
            sx={{
              p: 3,
              height: 430,
              borderRadius: 2,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Top Predicted Products
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Products with highest expected
              demand
            </Typography>

            {productChartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={330}
              >
                <BarChart
                  data={productChartData}
                  layout="vertical"
                  margin={{
                    left: 20,
                    right: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis type="number" />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="predictedDemand"
                    name="Predicted Demand"
                    fill={PURPLE}
                    radius={[
                      0,
                      4,
                      4,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* =====================================================
          PRODUCT DEMAND TREND
      ===================================================== */}

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 0.5,
          }}
        >
          Product Demand Trend
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Predicted demand compared with current
          inventory
        </Typography>

        {productChartData.length > 0 ? (
          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <LineChart
              data={productChartData}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Legend />

              {/* CURRENT STOCK - BLUE */}

              <Line
                type="monotone"
                dataKey="stock"
                name="Current Stock"
                stroke={BLUE}
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />

              {/* FORECAST - PURPLE */}

              <Line
                type="monotone"
                dataKey="predictedDemand"
                name="Predicted Demand"
                stroke={PURPLE}
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </Paper>

      {/* =====================================================
          CATEGORY DEMAND TREND
      ===================================================== */}

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 0.5,
          }}
        >
          Category Demand Trend
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Category historical sales and predicted
          demand
        </Typography>

        {categoryChartData.length > 0 ? (
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

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Legend />

              {/* HISTORICAL - BLUE */}

              <Line
                type="monotone"
                dataKey="historicalSales"
                name="Historical Sales"
                stroke={BLUE}
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />

              {/* FORECAST - PURPLE */}

              <Line
                type="monotone"
                dataKey="predictedDemand"
                name="Predicted Demand"
                stroke={PURPLE}
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </Paper>

      {/* =====================================================
          PRODUCT FORECAST TABLE
      ===================================================== */}

      <Paper
        sx={{
          mb: 3,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
            }}
          >
            Product Demand Forecast
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Product-level demand predictions
          </Typography>
        </Box>

        <Divider />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Product</b>
                </TableCell>

                <TableCell>
                  <b>Brand</b>
                </TableCell>

                <TableCell align="right">
                  <b>Current Stock</b>
                </TableCell>

                <TableCell align="right">
                  <b>Historical Sales</b>
                </TableCell>

                <TableCell align="right">
                  <b>Predicted Demand</b>
                </TableCell>

                <TableCell>
                  <b>Forecast Period</b>
                </TableCell>

                <TableCell align="right">
                  <b>Confidence</b>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                  >
                    <CircularProgress
                      sx={{
                        color: PURPLE,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                  >
                    <Typography
                      color="text.secondary"
                      sx={{ py: 4 }}
                    >
                      No forecast data available.
                      Generate a forecast first.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow
                    key={product.id}
                    hover
                  >
                    <TableCell>
                      <Typography
                        sx={{
                          fontWeight: 600,
                        }}
                      >
                        {product.productName}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {product.brand || "-"}
                    </TableCell>

                    <TableCell align="right">
                      {product.currentStock}
                    </TableCell>

                    <TableCell align="right">
                      {product.historicalSales ??
                        "-"}
                    </TableCell>

                    <TableCell align="right">
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: PURPLE,
                        }}
                      >
                        {Number(
                          product.predictedDemand
                        ).toFixed(2)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      Next{" "}
                      {product.forecastPeriod} Days
                    </TableCell>

                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={`${Number(
                          product.confidenceLevel
                        ).toFixed(0)}%`}
                        color={
                          product.confidenceLevel >=
                          80
                            ? "success"
                            : product.confidenceLevel >=
                              60
                            ? "warning"
                            : "error"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* =====================================================
          CATEGORY FORECAST TABLE
      ===================================================== */}

      <Paper
        sx={{
          mb: 3,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
            }}
          >
            Category Demand Forecast
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Category-level forecast analysis
          </Typography>
        </Box>

        <Divider />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Category</b>
                </TableCell>

                <TableCell align="right">
                  <b>Historical Sales</b>
                </TableCell>

                <TableCell align="right">
                  <b>Predicted Demand</b>
                </TableCell>

                <TableCell align="right">
                  <b>Expected Growth</b>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                  >
                    <Typography
                      color="text.secondary"
                      sx={{ py: 4 }}
                    >
                      No category forecast data
                      available.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow
                    key={category.categoryId}
                    hover
                  >
                    <TableCell>
                      {category.categoryName ||
                        `Category ${category.categoryId}`}
                    </TableCell>

                    <TableCell align="right">
                      {Number(
                        category.historicalSales
                      ).toFixed(2)}
                    </TableCell>

                    <TableCell align="right">
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: PURPLE,
                        }}
                      >
                        {Number(
                          category.predictedDemand
                        ).toFixed(2)}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={`${Number(
                          category.expectedGrowthPercentage
                        ).toFixed(2)}%`}
                        color={
                          category.expectedGrowthPercentage >
                          0
                            ? "success"
                            : "error"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* =====================================================
          INVENTORY RECOMMENDATIONS
      ===================================================== */}

      <Paper
        sx={{
          mb: 3,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
            }}
          >
            Inventory Recommendations
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Recommended inventory actions based
            on predicted demand
          </Typography>
        </Box>

        <Divider />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Product</b>
                </TableCell>

                <TableCell align="right">
                  <b>Current Stock</b>
                </TableCell>

                <TableCell align="right">
                  <b>Predicted Demand</b>
                </TableCell>

                <TableCell>
                  <b>Recommendation</b>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {recommendations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                  >
                    <Typography
                      color="text.secondary"
                      sx={{ py: 4 }}
                    >
                      No inventory recommendations
                      available.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recommendations.map(
                  (recommendation) => (
                    <TableRow
                      key={
                        recommendation.productId
                      }
                      hover
                    >
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 600,
                          }}
                        >
                          {
                            recommendation.productName
                          }
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        {
                          recommendation.currentStock
                        }
                      </TableCell>

                      <TableCell align="right">
                        {Number(
                          recommendation.predictedDemand
                        ).toFixed(2)}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            recommendation.recommendation
                          }
                          color={getRecommendationColor(
                            recommendation.recommendation
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* =====================================================
          FORECAST SUMMARY
      ===================================================== */}

      <Card
        sx={{
          borderRadius: 2,
          mb: 3,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
            }}
          >
            Forecast Summary
          </Typography>

          <Grid
            container
            spacing={3}
          >
            {/* PERIOD */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Forecast Period
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  mt: 0.5,
                  color: PURPLE,
                  fontWeight: 600,
                }}
              >
                Next {period} Days
              </Typography>
            </Grid>

            {/* PRODUCTS */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Products Forecasted
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  mt: 0.5,
                  fontWeight: 600,
                }}
              >
                {products.length}
              </Typography>
            </Grid>

            {/* CATEGORIES */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Categories Forecasted
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  mt: 0.5,
                  fontWeight: 600,
                }}
              >
                {categories.length}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

/* =========================================================
   KPI CARD
========================================================= */

interface KpiCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
}

function KpiCard({
  title,
  value,
  suffix = "",
  icon,
}: KpiCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 2,
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minHeight: 42,
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                mt: 1,
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              {Number(value).toLocaleString()}
              {suffix}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: PURPLE_LIGHT,
              color: PURPLE,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart() {
  return (
    <Box
      sx={{
        height: 320,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          textAlign: "center",
        }}
      >
        <AutoGraphIcon
          sx={{
            fontSize: 45,
            color: PURPLE,
            opacity: 0.5,
            mb: 1,
          }}
        />

        <Typography
          color="text.secondary"
        >
          No forecast data available
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Generate a forecast to view the
          analytics.
        </Typography>
      </Box>
    </Box>
  );
}