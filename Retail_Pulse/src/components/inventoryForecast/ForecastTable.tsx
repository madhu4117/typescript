import { useEffect, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Box,
  TablePagination,
} from "@mui/material";

import type {
  ForecastItem,
} from "../../services/inventoryForecastService";

interface Props {
  items: ForecastItem[];
  loading: boolean;
  onSelect: (item: ForecastItem) => void;
}

const getRiskColor = (
  risk: string
) => {
  switch (risk) {
    case "Out of Stock":
      return "error";

    case "Stockout Risk":
      return "error";

    case "Low Stock":
      return "warning";

    case "Overstock":
      return "info";

    case "Healthy":
      return "success";

    default:
      return "default";
  }
};

const ForecastTable = ({
  items,
  loading,
  onSelect,
}: Props) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset page when items list changes
  useEffect(() => {
    setPage(0);
  }, [items]);

  const paginatedItems = items.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper
      elevation={2}
      sx={{
        mt: 3,
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell>
                <b>Product</b>
              </TableCell>

              <TableCell>
                <b>SKU</b>
              </TableCell>

              <TableCell align="right">
                <b>Current Stock</b>
              </TableCell>

              <TableCell align="right">
                <b>Daily Sales</b>
              </TableCell>

              <TableCell align="right">
                <b>Forecast Demand (30d)</b>
              </TableCell>

              <TableCell align="right">
                <b>Days Remaining</b>
              </TableCell>

              <TableCell align="right">
                <b>Reorder Point</b>
              </TableCell>

              <TableCell align="right">
                <b>Recommended Qty</b>
              </TableCell>

              <TableCell align="center">
                <b>Risk</b>
              </TableCell>

              <TableCell align="center">
                <b>Action</b>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  align="center"
                >
                  <Box sx={{ py: 6 }}>
                    <CircularProgress size={35} />

                    <Typography
                      sx={{ mt: 2 }}
                      color="text.secondary"
                    >
                      Calculating inventory forecast...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  align="center"
                >
                  <Typography
                    sx={{
                      py: 6,
                    }}
                    color="text.secondary"
                  >
                    No inventory forecast data available.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow
                  key={item.productId}
                  hover
                >
                  <TableCell>
                    <Typography fontWeight={600} color="#0f172a">
                      {item.productName}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {item.categoryName}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ fontFamily: "monospace" }}>
                    {item.sku}
                  </TableCell>

                  <TableCell align="right">
                    {item.currentStock}
                  </TableCell>

                  <TableCell align="right">
                    {item.averageDailySales.toFixed(2)}
                  </TableCell>

                  <TableCell align="right">
                    {item.forecastedDemand.toFixed(2)}
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {item.daysOfStockRemaining === null
                      ? "N/A"
                      : `${item.daysOfStockRemaining.toFixed(
                          1
                        )} days`}
                  </TableCell>

                  <TableCell align="right">
                    {item.reorderPoint.toFixed(1)}
                  </TableCell>

                  <TableCell align="right">
                    <Typography
                      fontWeight={700}
                      color={
                        item.recommendedReorderQuantity > 0
                          ? "error.main"
                          : "text.primary"
                      }
                    >
                      {item.recommendedReorderQuantity}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={item.stockRisk}
                      color={
                        getRiskColor(
                          item.stockRisk
                        ) as any
                      }
                      size="small"
                      sx={{ fontWeight: "bold" }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        onSelect(item)
                      }
                      sx={{ textTransform: "none", borderRadius: 1.5 }}
                    >
                      Analyze
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {!loading && items.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={items.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      )}
    </Paper>
  );
};

export default ForecastTable;