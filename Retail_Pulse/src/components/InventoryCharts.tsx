import {
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
} from "@mui/material";

interface Props {
  summary: {
    totalProducts: number;
    totalInventory: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
}

const InventoryCharts = ({ summary }: Props) => {
  const total =
    summary.totalProducts === 0
      ? 1
      : summary.totalProducts;

  const inStock =
    total -
    summary.lowStockProducts -
    summary.outOfStockProducts;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
            >
              Stock Status Distribution
            </Typography>

            <Box mt={3}>
              <Typography>
                In Stock ({inStock})
              </Typography>

              <LinearProgress
                variant="determinate"
                value={(inStock / total) * 100}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  mb: 2,
                }}
              />

              <Typography>
                Low Stock (
                {summary.lowStockProducts})
              </Typography>

              <LinearProgress
                color="warning"
                variant="determinate"
                value={
                  (summary.lowStockProducts /
                    total) *
                  100
                }
                sx={{
                  height: 10,
                  borderRadius: 5,
                  mb: 2,
                }}
              />

              <Typography>
                Out Of Stock (
                {summary.outOfStockProducts})
              </Typography>

              <LinearProgress
                color="error"
                variant="determinate"
                value={
                  (summary.outOfStockProducts /
                    total) *
                  100
                }
                sx={{
                  height: 10,
                  borderRadius: 5,
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
            >
              Inventory Summary
            </Typography>

            <Box mt={2}>
              <Typography
                variant="body1"
                sx={{ mb: 2 }}
              >
                📦 Total Products :
                <strong>
                  {" "}
                  {summary.totalProducts}
                </strong>
              </Typography>

              <Typography
                variant="body1"
                sx={{ mb: 2 }}
              >
                🏬 Total Inventory :
                <strong>
                  {" "}
                  {summary.totalInventory}
                </strong>
              </Typography>

              <Typography
                variant="body1"
                sx={{ mb: 2 }}
              >
                ⚠️ Low Stock :
                <strong>
                  {" "}
                  {summary.lowStockProducts}
                </strong>
              </Typography>

              <Typography variant="body1">
                ❌ Out Of Stock :
                <strong>
                  {" "}
                  {summary.outOfStockProducts}
                </strong>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default InventoryCharts;