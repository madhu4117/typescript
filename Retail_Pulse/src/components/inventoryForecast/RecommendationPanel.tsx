import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type {
  ForecastItem,
  StockProjectionItem,
} from "../../services/inventoryForecastService";

interface Props {
  item: ForecastItem | null;
  open: boolean;
  loading: boolean;
  error: string;
  projection: StockProjectionItem[];
  onClose: () => void;
}

const RecommendationPanel = ({
  item,
  open,
  loading,
  error,
  projection,
  onClose,
}: Props) => {
  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: "#0f172a", pb: 1 }}>
        Inventory Recommendation Details
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
            <CircularProgress size={45} />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Retrieving historical logs & forecasting requirements...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : !item ? (
          <Typography color="text.secondary">No product selected.</Typography>
        ) : (
          <Box>
            {/* Header info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a" }}>
                {item.productName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", mt: 0.5 }}>
                SKU: {item.sku} | Category: {item.categoryName || "N/A"}
              </Typography>
            </Box>

            {/* Highlighting Actions */}
            <Box sx={{ mb: 3 }}>
              {item.currentStock <= 0 ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <b>Out of Stock:</b> Immediate replenishment of <b>{item.recommendedReorderQuantity} units</b> is required.
                </Alert>
              ) : item.stockRisk === "Stockout Risk" ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <b>Critical Stockout Risk:</b> Estimated days of stock left is {item.daysOfStockRemaining?.toFixed(1) || 0} days. Reorder immediately.
                </Alert>
              ) : item.currentStock <= item.reorderPoint ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  <b>Low Stock Reorder Triggered:</b> Current stock ({item.currentStock}) is below the reorder point ({item.reorderPoint.toFixed(1)}). Recommended to purchase <b>{item.recommendedReorderQuantity} units</b>.
                </Alert>
              ) : item.stockRisk === "Overstock" ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <b>Excess Stock Detected:</b> Current stock ({item.currentStock}) exceeds forecasted demand + safety stock. Hold reorders and monitor velocity.
                </Alert>
              ) : (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  <b>Healthy Stock Level:</b> Inventory levels are within safe parameters. No replenishment needed.
                </Alert>
              )}
            </Box>

            <Grid container spacing={3}>
              {/* Metric Comparison Table */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "#1e293b" }}>
                  Metric Comparison Panel
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell sx={{ fontWeight: "bold" }}>Metric</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>Current</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>Recommended</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 500 }}>Stock Level</TableCell>
                        <TableCell align="right" sx={{ color: item.currentStock <= item.reorderPoint ? "error.main" : "text.primary", fontWeight: 600 }}>
                          {item.currentStock}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "primary.main" }}>
                          {item.currentStock + item.recommendedReorderQuantity}
                        </TableCell>
                      </TableRow>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 500 }}>Daily Demand</TableCell>
                        <TableCell align="right">{item.averageDailySales.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.averageDailySales.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 500 }}>Reorder Point</TableCell>
                        <TableCell align="right">{item.reorderPoint.toFixed(1)}</TableCell>
                        <TableCell align="right">{item.reorderPoint.toFixed(1)}</TableCell>
                      </TableRow>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 500 }}>Safety Stock</TableCell>
                        <TableCell align="right">{item.safetyStock.toFixed(1)}</TableCell>
                        <TableCell align="right">{item.safetyStock.toFixed(1)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 2.5, p: 2, bgcolor: "#f8fafc", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    Days of Stock Remaining
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: item.currentStock <= item.reorderPoint ? "error.main" : "success.main" }}>
                    {item.daysOfStockRemaining !== null ? `${item.daysOfStockRemaining.toFixed(1)} Days` : "Infinite (Zero Demand)"}
                  </Typography>
                </Box>
              </Grid>

              {/* 30-Day Projection Visualization */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "#1e293b" }}>
                  30-Day Stock Depletion Projection
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: 265 }}>
                  {projection.length === 0 ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                      <Typography variant="body2" color="text.secondary">No projection data</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ width: "100%", height: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projection} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "10px" }} />
                          <YAxis stroke="#94a3b8" style={{ fontSize: "10px" }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="projectedStock"
                            name="Projected Stock"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={false}
                          />
                          <ReferenceLine y={item.reorderPoint} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Reorder Trigger", fill: "#d97706", fontSize: 9, position: "top" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", borderRadius: 2 }}>
          Close Panel
        </Button>
        {item && item.recommendedReorderQuantity > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => alert(`Replenishment Order for ${item.recommendedReorderQuantity} units of ${item.productName} has been submitted.`)}
            sx={{ textTransform: "none", borderRadius: 2, bgcolor: "#0284c7", "&:hover": { bgcolor: "#0369a1" } }}
          >
            Create Purchase Order
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RecommendationPanel;