import { useEffect, useMemo, useState, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TablePagination,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import ClearAllIcon from "@mui/icons-material/ClearAll";

import api from "../services/api";
import { getProducts } from "../services/productService";
import type { Product } from "../services/productService";
import { getCustomers } from "../services/customerService";
import type { Customer } from "../services/customerService";
import {
  getSalesSummary,
  getSalesTrend,
  getSalesProducts,
  getSalesCustomers,
  getSalesPaymentMethods,
  exportSalesCSV,
  exportSalesPDF,
} from "../services/salesAnalyticsService";
import type {
  SalesAnalyticsFilters,
  SalesSummary,
  SalesTrendItem,
  TopProductItem,
  CustomerContributionItem,
  PaymentMethodItem,
} from "../services/salesAnalyticsService";

interface Category {
  id: number;
  name: string;
}

const PIE_COLORS = ["#0284c7", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

// =========================================================
// HELPERS
// =========================================================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-IN").format(value || 0);
};

// =========================================================
// RENDER KPI CARD
// =========================================================

interface KpiCardProps {
  title: string;
  value: string;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

const KpiCard = ({ title, value, loading, error, onRetry }: KpiCardProps) => {
  return (
    <Card
      elevation={3}
      sx={{
        height: "100%",
        borderRadius: 3,
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        color: "#ffffff",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 20px -10px rgba(2, 132, 199, 0.3)",
          borderColor: "rgba(2, 132, 199, 0.4)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 500, mb: 1 }}>
          {title}
        </Typography>

        {error ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="caption" color="error">
              Failed to load.
            </Typography>
            <Button size="small" variant="text" onClick={onRetry} sx={{ color: "#38bdf8", alignSelf: "flex-start", p: 0 }}>
              Retry
            </Button>
          </Box>
        ) : loading ? (
          <Box sx={{ display: "flex", alignItems: "center", minHeight: 40 }}>
            <CircularProgress size={20} sx={{ color: "#38bdf8" }} />
          </Box>
        ) : (
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.5px" }}>
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// =========================================================
// RENDER EMPTY STATE
// =========================================================

const EmptyState = ({ message = "No sales data available for the selected period." }) => {
  return (
    <Box
      sx={{
        minHeight: 250,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 4,
        bgcolor: "rgba(15, 23, 42, 0.03)",
        border: "2px dashed rgba(15, 23, 42, 0.08)",
        borderRadius: 3,
      }}
    >
      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
        {message}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
        Try adjustments to your active filters or date range parameters.
      </Typography>
    </Box>
  );
};

// =========================================================
// MAIN PAGE COMPONENT
// =========================================================

export default function SalesAnalytics() {
  // Global Lookup Lists
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  // Filter Bar States
  const [dateRange, setDateRange] = useState<string>("last30");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  // Sub-Toggles / Sorts
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [productSort, setProductSort] = useState<"revenue" | "quantity">("revenue");

  // Pagination states
  const [productPage, setProductPage] = useState(0);
  const [productRowsPerPage, setProductRowsPerPage] = useState(5);
  const [customerPage, setCustomerPage] = useState(0);
  const [customerRowsPerPage, setCustomerRowsPerPage] = useState(5);

  // Main Dashboard States
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<SalesTrendItem[]>([]);
  const [products, setProducts] = useState<TopProductItem[]>([]);
  const [customers, setCustomers] = useState<CustomerContributionItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);

  // Loading Toggles
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Errors
  const [summaryError, setSummaryError] = useState("");
  const [trendError, setTrendError] = useState("");
  const [productsError, setProductsError] = useState("");
  const [customersError, setCustomersError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Internal API Client Caching
  const cache = useRef<Record<string, { timestamp: number; data: any }>>({});

  const getCachedData = (key: string) => {
    const entry = cache.current[key];
    if (entry && Date.now() - entry.timestamp < 60000) {
      return entry.data;
    }
    return null;
  };

  const setCachedData = (key: string, data: any) => {
    cache.current[key] = { timestamp: Date.now(), data };
  };

  const clearCache = () => {
    cache.current = {};
  };

  // Date Calculation logic based on range selection
  const activeDates = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (dateRange) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "last7":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "last30":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "lastMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          return { startDate: customStartDate, endDate: customEndDate };
        }
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }

    const formatDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return { startDate: formatDateString(start), endDate: formatDateString(end) };
  }, [dateRange, customStartDate, customEndDate]);

  // Validation
  const isCustomRangeInvalid = useMemo(() => {
    if (dateRange === "custom" && customStartDate && customEndDate) {
      return customStartDate > customEndDate;
    }
    return false;
  }, [dateRange, customStartDate, customEndDate]);

  // Master Filters State object
  const activeFilters = useMemo<SalesAnalyticsFilters>(() => {
    return {
      startDate: activeDates.startDate,
      endDate: activeDates.endDate,
      productId: selectedProduct?.id || null,
      categoryId: selectedCategory === "" ? null : Number(selectedCategory),
      customerId: selectedCustomer?.id || null,
      paymentMethod: selectedPaymentMethod || null,
    };
  }, [activeDates, selectedProduct, selectedCategory, selectedCustomer, selectedPaymentMethod]);

  // Load Lookups on mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [catRes, prodRes, custRes] = await Promise.allSettled([
          api.get("/categories"),
          getProducts(),
          getCustomers(),
        ]);
        if (catRes.status === "fulfilled") {
          setAllCategories(catRes.value.data);
        }
        if (prodRes.status === "fulfilled") {
          setAllProducts(prodRes.value);
        }
        if (custRes.status === "fulfilled") {
          setAllCustomers(custRes.value);
        }
      } catch (error) {
        console.error("Lookups fetch failed", error);
      }
    };
    fetchLookups();
  }, []);

  // API Call implementations
  const loadSummary = async (force = false) => {
    if (isCustomRangeInvalid) return;
    setSummaryLoading(true);
    setSummaryError("");
    const key = `summary_${JSON.stringify(activeFilters)}`;
    if (!force) {
      const cached = getCachedData(key);
      if (cached) {
        setSummary(cached);
        setSummaryLoading(false);
        return;
      }
    }
    try {
      const res = await getSalesSummary(activeFilters);
      setSummary(res);
      setCachedData(key, res);
    } catch (e: any) {
      setSummaryError(e?.message || "Failed to load summary stats.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadTrend = async (force = false) => {
    if (isCustomRangeInvalid) return;
    setTrendLoading(true);
    setTrendError("");
    const key = `trend_${period}_${JSON.stringify(activeFilters)}`;
    if (!force) {
      const cached = getCachedData(key);
      if (cached) {
        setRevenueTrend(cached);
        setTrendLoading(false);
        return;
      }
    }
    try {
      const res = await getSalesTrend(activeFilters, period);
      setRevenueTrend(res);
      setCachedData(key, res);
    } catch (e: any) {
      setTrendError(e?.message || "Failed to load revenue trend.");
    } finally {
      setTrendLoading(false);
    }
  };

  const loadProducts = async (force = false) => {
    if (isCustomRangeInvalid) return;
    setProductsLoading(true);
    setProductsError("");
    const key = `products_${productSort}_${JSON.stringify(activeFilters)}`;
    if (!force) {
      const cached = getCachedData(key);
      if (cached) {
        setProducts(cached);
        setProductsLoading(false);
        return;
      }
    }
    try {
      const res = await getSalesProducts(activeFilters, productSort, 50);
      setProducts(res);
      setCachedData(key, res);
    } catch (e: any) {
      setProductsError(e?.message || "Failed to load products distribution.");
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCustomers = async (force = false) => {
    if (isCustomRangeInvalid) return;
    setCustomersLoading(true);
    setCustomersError("");
    const key = `customers_${JSON.stringify(activeFilters)}`;
    if (!force) {
      const cached = getCachedData(key);
      if (cached) {
        setCustomers(cached);
        setCustomersLoading(false);
        return;
      }
    }
    try {
      const res = await getSalesCustomers(activeFilters, 50);
      setCustomers(res);
      setCachedData(key, res);
    } catch (e: any) {
      setCustomersError(e?.message || "Failed to load customer list.");
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadPaymentMethods = async (force = false) => {
    if (isCustomRangeInvalid) return;
    setPaymentLoading(true);
    setPaymentError("");
    const key = `payment_${JSON.stringify(activeFilters)}`;
    if (!force) {
      const cached = getCachedData(key);
      if (cached) {
        setPaymentMethods(cached);
        setPaymentLoading(false);
        return;
      }
    }
    try {
      const res = await getSalesPaymentMethods(activeFilters);
      setPaymentMethods(res);
      setCachedData(key, res);
    } catch (e: any) {
      setPaymentError(e?.message || "Failed to load payments distribution.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Trigger loads when filter dependencies change
  useEffect(() => {
    loadSummary();
    loadTrend();
    loadProducts();
    loadCustomers();
    loadPaymentMethods();

    // Reset paginations on filter changes
    setProductPage(0);
    setCustomerPage(0);
  }, [activeFilters]);

  // Separate trigger for sub-toggles (period / sort)
  useEffect(() => {
    loadTrend();
  }, [period]);

  useEffect(() => {
    loadProducts();
  }, [productSort]);

  // Refresh cache bypass action
  const handleRefresh = () => {
    clearCache();
    loadSummary(true);
    loadTrend(true);
    loadProducts(true);
    loadCustomers(true);
    loadPaymentMethods(true);
  };

  const handleClearFilters = () => {
    setDateRange("last30");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedCategory("");
    setSelectedProduct(null);
    setSelectedCustomer(null);
    setSelectedPaymentMethod("");
  };

  // Exports
  const handleExportCSV = async () => {
    if (isCustomRangeInvalid) return;
    try {
      setExportLoading(true);
      const blob = await exportSalesCSV(activeFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sales_analytics_${activeDates.startDate}_to_${activeDates.endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Failed to export analytics CSV.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (isCustomRangeInvalid) return;
    try {
      setExportLoading(true);
      const blob = await exportSalesPDF(activeFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sales_analytics_${activeDates.startDate}_to_${activeDates.endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Failed to export PDF file.");
    } finally {
      setExportLoading(false);
    }
  };

  // Table Helpers
  const paginatedProducts = useMemo(() => {
    const start = productPage * productRowsPerPage;
    return products.slice(start, start + productRowsPerPage);
  }, [products, productPage, productRowsPerPage]);

  const paginatedCustomers = useMemo(() => {
    const start = customerPage * customerRowsPerPage;
    return customers.slice(start, start + customerRowsPerPage);
  }, [customers, customerPage, customerRowsPerPage]);

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* HEADER SECTION */}
      <Stack
        spacing={2.5}
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mb: 0.5, letterSpacing: "-0.5px" }}>
            Sales Analytics & Business Intelligence
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Analyze aggregate parameters, sales performance trends, product velocity, and customer loyalty.
          </Typography>
        </Box>

        <Stack spacing={1.5} sx={{ flexDirection: "row", flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            sx={{
              borderRadius: 2.5,
              borderColor: "#cbd5e1",
              color: "#475569",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f1f5f9" },
            }}
          >
            Refresh Data
          </Button>

          <Button
            variant="outlined"
            onClick={handleExportCSV}
            disabled={exportLoading || isCustomRangeInvalid}
            startIcon={<DownloadIcon />}
            sx={{
              borderRadius: 2.5,
              borderColor: "#cbd5e1",
              color: "#475569",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f1f5f9" },
            }}
          >
            CSV
          </Button>

          <Button
            variant="contained"
            onClick={handleExportPDF}
            disabled={exportLoading || isCustomRangeInvalid}
            startIcon={<DownloadIcon />}
            sx={{
              borderRadius: 2.5,
              bgcolor: "#0284c7",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 4px 6px -1px rgba(2, 132, 199, 0.2)",
              "&:hover": { bgcolor: "#0369a1" },
            }}
          >
            PDF Executive Report
          </Button>
        </Stack>
      </Stack>

      {/* FILTER BAR CARD */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={1} sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b" }}>
              Global Report Filters
            </Typography>
            <Button
              size="small"
              onClick={handleClearFilters}
              startIcon={<ClearAllIcon />}
              sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
            >
              Clear All Filters
            </Button>
          </Stack>

          <Grid container spacing={2.5}>
            {/* Date Range Option */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Period</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Period"
                  onChange={(e) => setDateRange(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="last7">Last 7 Days</MenuItem>
                  <MenuItem value="last30">Last 30 Days</MenuItem>
                  <MenuItem value="thisMonth">This Month</MenuItem>
                  <MenuItem value="lastMonth">Last Month</MenuItem>
                  <MenuItem value="custom">Custom Range...</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Custom Dates Inputs */}
            {dateRange === "custom" && (
              <>
                <Grid size={{ xs: 12, sm: 3, md: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    size="small"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3, md: 2.5 }}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    size="small"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
              </>
            )}

            {/* Category Filter */}
            <Grid size={{ xs: 12, sm: 6, md: dateRange === "custom" ? 2 : 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value as number)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {allCategories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Product Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Autocomplete
                size="small"
                options={allProducts}
                getOptionLabel={(option) => option.name}
                value={selectedProduct}
                onChange={(_, newValue) => setSelectedProduct(newValue)}
                renderInput={(params) => <TextField {...params} label="Filter by Product" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />}
              />
            </Grid>

            {/* Customer Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Autocomplete
                size="small"
                options={allCustomers}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                value={selectedCustomer}
                onChange={(_, newValue) => setSelectedCustomer(newValue)}
                renderInput={(params) => <TextField {...params} label="Filter by Customer" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />}
              />
            </Grid>

            {/* Payment Method Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={selectedPaymentMethod}
                  label="Payment Method"
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Payment Methods</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {isCustomRangeInvalid && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              Invalid Date Range: The Start Date cannot be set chronologically after the End Date.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* KPI METRIC CARDS GRID */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            title="Total Revenue"
            value={formatCurrency(summary?.totalRevenue ?? 0)}
            loading={summaryLoading}
            error={summaryError}
            onRetry={loadSummary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            title="Total Orders"
            value={formatNumber(summary?.totalOrders ?? 0)}
            loading={summaryLoading}
            error={summaryError}
            onRetry={loadSummary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            title="Average Order Value"
            value={formatCurrency(summary?.averageOrderValue ?? 0)}
            loading={summaryLoading}
            error={summaryError}
            onRetry={loadSummary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            title="Total Items Sold"
            value={formatNumber(summary?.totalItemsSold ?? 0)}
            loading={summaryLoading}
            error={summaryError}
            onRetry={loadSummary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            title="Total Discounts"
            value={formatCurrency(summary?.totalDiscount ?? 0)}
            loading={summaryLoading}
            error={summaryError}
            onRetry={loadSummary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            title="Total Tax"
            value={formatCurrency(summary?.totalTax ?? 0)}
            loading={summaryLoading}
            error={summaryError}
            onRetry={loadSummary}
          />
        </Grid>
      </Grid>

      {/* CHARTS CONTAINER SECTION */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Sales Overview Line Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <Stack spacing={1} sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
                Sales Overview (Revenue over Time)
              </Typography>
              <FormControl size="small" sx={{ width: 120 }}>
                <Select value={period} onChange={(e) => setPeriod(e.target.value as any)} sx={{ borderRadius: 2 }}>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {trendError ? (
              <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadTrend(true)}>Retry</Button>}>
                {trendError}
              </Alert>
            ) : trendLoading ? (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            ) : revenueTrend.length === 0 ? (
              <EmptyState />
            ) : (
              <Box sx={{ width: "100%", height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#64748b" style={{ fontSize: "12px" }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={((value: any) => [formatCurrency(Number(value)), "Revenue"]) as any} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#0284c7"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sales vs Orders Dual Y-Axis Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
              Sales Volume vs Value (Revenue vs Orders)
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {trendError ? (
              <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadTrend(true)}>Retry</Button>}>
                {trendError}
              </Alert>
            ) : trendLoading ? (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            ) : revenueTrend.length === 0 ? (
              <EmptyState />
            ) : (
              <Box sx={{ width: "100%", height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "12px" }} />
                    {/* Left Axis for Revenue */}
                    <YAxis yAxisId="left" orientation="left" stroke="#0284c7" tickFormatter={(val) => `₹${val}`} style={{ fontSize: "12px" }} />
                    {/* Right Axis for Orders */}
                    <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" style={{ fontSize: "12px" }} />
                    <Tooltip formatter={((value: any, name: any) => name === "Revenue" ? [formatCurrency(Number(value)), "Revenue"] : [value, "Orders"]) as any} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* DETAILED TABLES BLOCK */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Top Performing Products Table */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <Stack spacing={2} sx={{ flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
                Top Performing Products
              </Typography>

              <FormControl size="small" sx={{ width: 160 }}>
                <InputLabel>Order Sort By</InputLabel>
                <Select
                  value={productSort}
                  label="Order Sort By"
                  onChange={(e) => setProductSort(e.target.value as any)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="revenue">Sort by Revenue</MenuItem>
                  <MenuItem value="quantity">Sort by Qty Sold</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {productsError ? (
              <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadProducts(true)}>Retry</Button>}>
                {productsError}
              </Alert>
            ) : productsLoading ? (
              <Box sx={{ minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            ) : products.length === 0 ? (
              <EmptyState />
            ) : (
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Product Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Units Sold</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Total Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProducts.map((p) => (
                      <TableRow key={p.productId} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 500, color: "#0f172a" }}>{p.productName}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatNumber(p.quantitySold)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#0284c7" }}>{formatCurrency(p.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20]}
                  component="div"
                  count={products.length}
                  rowsPerPage={productRowsPerPage}
                  page={productPage}
                  onPageChange={(_, page) => setProductPage(page)}
                  onRowsPerPageChange={(e) => {
                    setProductRowsPerPage(parseInt(e.target.value, 10));
                    setProductPage(0);
                  }}
                />
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Customer Revenue analysis */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
              Customer Revenue Analysis
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {customersError ? (
              <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadCustomers(true)}>Retry</Button>}>
                {customersError}
              </Alert>
            ) : customersLoading ? (
              <Box sx={{ minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            ) : customers.length === 0 ? (
              <EmptyState />
            ) : (
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Customer Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Orders</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Total Spend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCustomers.map((c) => (
                      <TableRow key={c.customerId} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 500, color: "#0f172a" }}>{c.customerName}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatNumber(c.orders)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#16a34a" }}>{formatCurrency(c.totalSpend)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20]}
                  component="div"
                  count={customers.length}
                  rowsPerPage={customerRowsPerPage}
                  page={customerPage}
                  onPageChange={(_, page) => setCustomerPage(page)}
                  onRowsPerPageChange={(e) => {
                    setCustomerRowsPerPage(parseInt(e.target.value, 10));
                    setCustomerPage(0);
                  }}
                />
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* PAYMENT METHOD ANALYSIS donut chart + list */}
      <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
            Payment Method Share
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {paymentError ? (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadPaymentMethods(true)}>Retry</Button>}>
              {paymentError}
            </Alert>
          ) : paymentLoading ? (
            <Box sx={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : paymentMethods.length === 0 ? (
            <EmptyState />
          ) : (
            <Grid container spacing={4} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", justifyContent: "center" }}>
                <Box sx={{ width: "100%", height: 280, maxWidth: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        dataKey="revenue"
                        nameKey="paymentMethod"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        label
                      >
                        {paymentMethods.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={((value: any) => [formatCurrency(Number(value)), "Revenue Share"]) as any} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Method Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Transactions</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Revenue Contribution</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentMethods.map((pm, idx) => (
                        <TableRow key={pm.paymentMethod} hover>
                          <TableCell sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 500 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                            {pm.paymentMethod}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{formatNumber(pm.transactions)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: "#0284c7" }}>{formatCurrency(pm.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
