import {
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

interface Props {
  risk: string;
  setRisk: (value: string) => void;

  reorderRequired: string;
  setReorderRequired: (value: string) => void;

  categoryId: number | "";
  setCategoryId: (value: number | "") => void;

  productId: number | "";
  setProductId: (value: number | "") => void;

  categories: Array<{ id: number; name: string }>;
  products: Array<{ id: number; name: string }>;

  sortBy: string;
  setSortBy: (value: string) => void;

  sortOrder: string;
  setSortOrder: (value: string) => void;

  onReset: () => void;
}

const ForecastFilters = ({
  risk,
  setRisk,
  reorderRequired,
  setReorderRequired,
  categoryId,
  setCategoryId,
  productId,
  setProductId,
  categories,
  products,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onReset,
}: Props) => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mt: 3,
        borderRadius: 3,
        border: "1px solid #e2e8f0",
      }}
    >
      <Grid container spacing={2.5}>
        {/* Risk */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Stock Risk</InputLabel>
            <Select
              value={risk}
              label="Stock Risk"
              onChange={(e) => setRisk(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Risks</MenuItem>
              <MenuItem value="Out of Stock">Out of Stock</MenuItem>
              <MenuItem value="Stockout Risk">Stockout Risk</MenuItem>
              <MenuItem value="Low Stock">Low Stock</MenuItem>
              <MenuItem value="Healthy">Healthy</MenuItem>
              <MenuItem value="Overstock">Overstock</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Reorder Required */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Reorder Required</InputLabel>
            <Select
              value={reorderRequired}
              label="Reorder Required"
              onChange={(e) => setReorderRequired(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Reorders</MenuItem>
              <MenuItem value="true">Required</MenuItem>
              <MenuItem value="false">Not Required</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Category */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId}
              label="Category"
              onChange={(e) => setCategoryId(e.target.value as number | "")}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Product */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Product</InputLabel>
            <Select
              value={productId}
              label="Product"
              onChange={(e) => setProductId(e.target.value as number | "")}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Products</MenuItem>
              {products.map((prod) => (
                <MenuItem key={prod.id} value={prod.id}>
                  {prod.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Sort By */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="risk">Risk Priority</MenuItem>
              <MenuItem value="currentStock">Current Stock</MenuItem>
              <MenuItem value="forecastedDemand">Forecasted Demand</MenuItem>
              <MenuItem value="daysRemaining">Days Remaining</MenuItem>
              <MenuItem value="recommendedQuantity">Recommended Reorder Qty</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Sort Order */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              label="Order"
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="desc">Descending</MenuItem>
              <MenuItem value="asc">Ascending</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Reset */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            size="medium"
            onClick={onReset}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              color: "#475569",
              borderColor: "#cbd5e1",
              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
            }}
          >
            Clear Filters
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ForecastFilters;