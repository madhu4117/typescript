import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { fetchFilterMetadata } from "../../services/reportService";

export interface ReportFiltersValue {
  fromDate?: string;
  toDate?: string;
  productId?: number;
  categoryId?: number;
  brand?: string;
  customerId?: number;
  salesStatus?: string;
  stockStatus?: string;
}

interface ReportFiltersProps {
  reportType: string;
  filters: ReportFiltersValue;
  onReportTypeChange: (value: string) => void;
  onFiltersChange: (filters: ReportFiltersValue) => void;
  onGenerate: () => void;
  onReset: () => void;
  loading?: boolean;
}

export const reportTypes = [
  { value: "sales", label: "Sales Report" },
  { value: "inventory", label: "Inventory Report" },
  { value: "customer", label: "Customer Report" },
  { value: "product_performance", label: "Product Performance Report" },
  { value: "stock_movement", label: "Stock Movement Report" },
];

const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportType,
  filters,
  onReportTypeChange,
  onFiltersChange,
  onGenerate,
  onReset,
  loading = false,
}) => {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: number; firstName: string; lastName: string }[]>([]);

  // Track date input focus to remove the native browser "dd-mm-yyyy" placeholder watermark when empty
  const [fromDateFocused, setFromDateFocused] = useState(false);
  const [toDateFocused, setToDateFocused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchFilterMetadata().then((data) => {
      if (isMounted) {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setCustomers(data.customers || []);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const update = (key: keyof ReportFiltersValue, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === "" || value === undefined ? undefined : value,
    });
  };

  return (
    <Box>
      <Stack spacing={2.5}>
        <Grid container spacing={2}>
          {/* Report Type */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Report Type"
              value={reportType}
              onChange={(e) => onReportTypeChange(e.target.value)}
              sx={{ bgcolor: "#faf5ff" }}
            >
              {reportTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* From Date */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type={fromDateFocused || Boolean(filters.fromDate) ? "date" : "text"}
              label="From Date"
              placeholder=""
              value={filters.fromDate ?? ""}
              onFocus={() => setFromDateFocused(true)}
              onBlur={() => setFromDateFocused(false)}
              onChange={(e) => update("fromDate", e.target.value)}
              slotProps={{
                inputLabel: {
                  shrink: fromDateFocused || Boolean(filters.fromDate),
                },
              }}
            />
          </Grid>

          {/* To Date */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type={toDateFocused || Boolean(filters.toDate) ? "date" : "text"}
              label="To Date"
              placeholder=""
              value={filters.toDate ?? ""}
              onFocus={() => setToDateFocused(true)}
              onBlur={() => setToDateFocused(false)}
              onChange={(e) => update("toDate", e.target.value)}
              slotProps={{
                inputLabel: {
                  shrink: toDateFocused || Boolean(filters.toDate),
                },
              }}
            />
          </Grid>

          {/* Product Select */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Product"
              value={filters.productId ?? ""}
              onChange={(e) =>
                update("productId", e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <MenuItem value="">All Products</MenuItem>
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Category Select */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={filters.categoryId ?? ""}
              onChange={(e) =>
                update("categoryId", e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Brand */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Brand"
              placeholder="e.g. Apple, Samsung, Nike"
              value={filters.brand ?? ""}
              onChange={(e) => update("brand", e.target.value)}
            />
          </Grid>

          {/* Customer Select */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Customer"
              value={filters.customerId ?? ""}
              onChange={(e) =>
                update("customerId", e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <MenuItem value="">All Customers</MenuItem>
              {customers.map((cust) => (
                <MenuItem key={cust.id} value={cust.id}>
                  {cust.firstName} {cust.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Sales Status */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Sales Status"
              value={filters.salesStatus ?? ""}
              onChange={(e) => update("salesStatus", e.target.value)}
            >
              <MenuItem value="">All Sales Statuses</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </TextField>
          </Grid>

          {/* Stock Status */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Stock Status"
              value={filters.stockStatus ?? ""}
              onChange={(e) => update("stockStatus", e.target.value)}
            >
              <MenuItem value="">All Stock Statuses</MenuItem>
              <MenuItem value="In Stock">In Stock</MenuItem>
              <MenuItem value="Low Stock">Low Stock</MenuItem>
              <MenuItem value="Out of Stock">Out of Stock</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={() => {
              setFromDateFocused(false);
              setToDateFocused(false);
              onReset();
            }}
            disabled={loading}
            sx={{
              borderColor: "#cbd5e1",
              color: "#475569",
              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f1f5f9" },
            }}
          >
            Reset Filters
          </Button>

          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={onGenerate}
            disabled={loading}
            sx={{
              bgcolor: "#7c3aed",
              fontWeight: 600,
              px: 3,
              "&:hover": { bgcolor: "#6d28d9" },
            }}
          >
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ReportFilters;