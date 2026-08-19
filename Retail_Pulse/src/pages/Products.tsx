import React, { useState, useEffect } from "react";

import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Grid,
  Switch,
  Card,
  CardContent,
} from "@mui/material";

import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  SwapVert as SortIcon,
} from "@mui/icons-material";

import api from "../services/api";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  companyId: number;
  categoryId: number;
  name: string;
  sku: string;
  brand: string | null;
  description: string | null;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  unitOfMeasure: string | null;
  status: string;
  category_name: string | null;
  createdAt: string;
  updatedAt: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<string[]>([]);

  // Search, Filter, Sort State
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Dialog State
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [stockQuantity, setStockQuantity] = useState<number | "">("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [status, setStatus] = useState("Active");

  // Notifications / Errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {
        search: search || undefined,
        categoryId: filterCategory || undefined,
        status: filterStatus || undefined,
        brand: filterBrand || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      };

      const response = await api.get("/products", { params });
      const data = response.data;
      setProducts(data);

      // Collect unique brands for filter dropdown
      const uniqueBrands: string[] = Array.from(
        new Set(
          data
            .map((p: Product) => p.brand?.trim())
            .filter((b: string | undefined): b is string => !!b)
        )
      );
      setBrands(uniqueBrands);
    } catch (error) {
      console.error("Failed to load products:", error);
      showSnackbar("Failed to fetch products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [filterCategory, filterStatus, filterBrand, sortBy, sortOrder]);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      fetchProducts();
    }
  };

  const handleOpenForm = (product?: Product) => {
    setFieldErrors({});
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setSku(product.sku);
      setCategoryId(product.categoryId);
      setBrand(product.brand || "");
      setDescription(product.description || "");
      setUnitPrice(product.unitPrice);
      setCostPrice(product.costPrice);
      setStockQuantity(product.stockQuantity);
      setUnitOfMeasure(product.unitOfMeasure || "");
      setStatus(product.status);
    } else {
      setEditingProduct(null);
      setName("");
      setSku("");
      setCategoryId("");
      setBrand("");
      setDescription("");
      setUnitPrice("");
      setCostPrice("");
      setStockQuantity("");
      setUnitOfMeasure("");
      setStatus("Active");
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingProduct(null);
  };

  const handleOpenDetail = (product: Product) => {
    setViewingProduct(product);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setViewingProduct(null);
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === "Active" ? "Inactive" : "Active";
    try {
      const response = await api.put(`/products/${product.id}/status`, null, {
        params: { status: newStatus },
      });
      showSnackbar(
        `Product successfully ${newStatus === "Active" ? "activated" : "deactivated"}`,
        "success"
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? response.data : p))
      );
    } catch (error: any) {
      console.error("Failed to toggle status:", error);
      const errMsg = error.response?.data?.detail || "Status toggle failed";
      showSnackbar(errMsg, "error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = "Product name is mandatory";
    if (!sku.trim()) errors.sku = "SKU is mandatory";
    if (!categoryId) errors.categoryId = "Category is mandatory";
    if (unitPrice === "" || Number(unitPrice) <= 0) errors.unitPrice = "Unit Price must be greater than zero";
    if (costPrice === "" || Number(costPrice) < 0) {
      errors.costPrice = "Cost Price cannot be negative";
    } else if (Number(costPrice) > Number(unitPrice)) {
      errors.costPrice = "Cost Price cannot exceed Unit Price";
    }
    if (stockQuantity === "" || Number(stockQuantity) < 0) errors.stockQuantity = "Stock Quantity cannot be negative";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      categoryId: Number(categoryId),
      brand: brand.trim() || null,
      description: description.trim() || null,
      unitPrice: Number(unitPrice),
      costPrice: Number(costPrice),
      stockQuantity: Number(stockQuantity),
      unitOfMeasure: unitOfMeasure.trim() || null,
      status,
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        showSnackbar("Product updated successfully", "success");
      } else {
        await api.post("/products/", payload);
        showSnackbar("Product added successfully", "success");
      }
      handleCloseForm();
      fetchProducts();
    } catch (error: any) {
      console.error("Failed to save product:", error);
      const errMsg = error.response?.data?.detail || "Error saving product";
      showSnackbar(errMsg, "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        await api.delete(`/products/${id}`);
        showSnackbar("Product deleted successfully", "success");
        fetchProducts();
      } catch (error: any) {
        console.error("Failed to delete product:", error);
        const errMsg = error.response?.data?.detail || "Failed to delete product";
        showSnackbar(errMsg, "error");
      }
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 4,
    flexWrap: "wrap",
    gap: 2,
  }}
>
        <Box>
          <Typography variant="h4" sx={{ color: "#0f172a", mb: 0.5, fontWeight: "bold" }}>
            Product Master Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your retail catalog, monitor SKU inventory, verify bounds, and toggle transaction active states.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          sx={{
            bgcolor: "#3b82f6",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: "bold",
            px: 3,
            py: 1,
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            "&:hover": { bgcolor: "#1d4ed8" },
          }}
        >
          Add Product
        </Button>
      </Box>

      {/* Filter and Search Panel */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "none" }}>
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          {/* Search Box */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by Name, SKU, Brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          {/* Category Filter */}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Brand Filter */}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Brand</InputLabel>
              <Select
                value={filterBrand}
                label="Brand"
                onChange={(e) => setFilterBrand(e.target.value)}
              >
                <MenuItem value="">All Brands</MenuItem>
                {brands.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sorting */}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="recently_added">Recently Added</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Sort order toggle & manual refresh */}
          <Grid size={{ xs: 12, sm: 3, md: 1 }} sx={{ display: "flex", gap: 1 }}>
            <Tooltip title={`Toggle sort: ${sortOrder === "asc" ? "Descending" : "Ascending"}`}>
              <IconButton
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                sx={{ border: "1px solid #cbd5e1" }}
              >
                <SortIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Trigger search & reload">
              <IconButton onClick={() => fetchProducts()} sx={{ border: "1px solid #cbd5e1" }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Table Container */}
      <TableContainer component={Paper} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "none", overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Product Name</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>SKU</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Category</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Brand</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }} align="right">Retail Price</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }} align="right">Cost Price</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }} align="center">Stock</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={30} sx={{ color: "#3b82f6" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Fetching product catalog...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: "bold" }}>
                    No products matching search/filter found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Adjust your filters or add a new product.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map((row) => (
                <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#f8fafc" }, transition: "background-color 0.2s" }}>
                  <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>{row.name}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", color: "#475569" }}>{row.sku}</TableCell>
                  <TableCell sx={{ color: "#334155" }}>
                    {row.category_name || (
                      <Typography variant="body2" sx={{ fontStyle: "italic", color: "#94a3b8" }}>
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: "#64748b" }}>{row.brand || "—"}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "#0f172a" }}>
                    ${row.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#64748b" }}>
                    ${row.costPrice.toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "bold",
                        color: row.stockQuantity === 0 ? "#ef4444" : row.stockQuantity < 10 ? "#f59e0b" : "#10b981",
                      }}
                    >
                      {row.stockQuantity} {row.unitOfMeasure || ""}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      <Switch
                        size="small"
                        checked={row.status === "Active"}
                        onChange={() => handleToggleStatus(row)}
                        color="success"
                      />
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          bgcolor: row.status === "Active" ? "#ecfdf5" : "#f1f5f9",
                          color: row.status === "Active" ? "#059669" : "#64748b",
                          border: row.status === "Active" ? "1px solid #a7f3d0" : "1px solid #cbd5e1",
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton onClick={() => handleOpenDetail(row)} size="small" sx={{ color: "#64748b", mr: 0.5 }}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Product">
                      <IconButton onClick={() => handleOpenForm(row)} size="small" sx={{ color: "#3b82f6", mr: 0.5 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Product">
                      <IconButton onClick={() => handleDelete(row.id)} size="small" sx={{ color: "#ef4444" }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Dialog for Add/Edit Product */}
      <Dialog
        open={formOpen}
        onClose={handleCloseForm}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "16px", p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "#0f172a", pb: 1 }}>
          {editingProduct ? "Edit Product" : "Add New Product"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ py: 1 }}>
            <Grid container spacing={2}>
              {/* Product Name */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  autoFocus
                  label="Product Name *"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!fieldErrors.name}
                  helperText={fieldErrors.name}
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                />
              </Grid>

              {/* SKU & Category */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="SKU (Unique stock unit ID) *"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  error={!!fieldErrors.sku}
                  helperText={fieldErrors.sku}
                  placeholder="e.g. RTL-10001"
                  slotProps={{ htmlInput: { maxLength: 50 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth variant="outlined" error={!!fieldErrors.categoryId}>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value as number)}
                    label="Category *"
                  >
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldErrors.categoryId && (
                    <Typography variant="caption" color="error" sx={{ mx: 2, mt: 0.5 }}>
                      {fieldErrors.categoryId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Brand & Unit of Measure */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Brand"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Unit of Measure"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  placeholder="e.g. pcs, kg, box"
                  slotProps={{ htmlInput: { maxLength: 50 } }}
                />
              </Grid>

              {/* Unit Price, Cost Price, Stock */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Unit Price ($) *"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value !== "" ? Number(e.target.value) : "")}
                  error={!!fieldErrors.unitPrice}
                  helperText={fieldErrors.unitPrice}
                  slotProps={{ htmlInput: { step: "0.01", min: "0.01" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Cost Price ($) *"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value !== "" ? Number(e.target.value) : "")}
                  error={!!fieldErrors.costPrice}
                  helperText={fieldErrors.costPrice}
                  slotProps={{ htmlInput: { step: "0.01", min: "0" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Initial Stock *"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value !== "" ? Number(e.target.value) : "")}
                  error={!!fieldErrors.stockQuantity}
                  helperText={fieldErrors.stockQuantity}
                  slotProps={{ htmlInput: { min: "0" } }}
                />
              </Grid>

              {/* Description */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Product Description"
                  type="text"
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 255 } }}
                />
              </Grid>

              {/* Status */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Product Status</InputLabel>
                  <Select value={status} onChange={(e) => setStatus(e.target.value as string)} label="Product Status">
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
            <Button onClick={handleCloseForm} sx={{ color: "#64748b", textTransform: "none", fontWeight: "bold" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#3b82f6",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "bold",
                "&:hover": { bgcolor: "#1d4ed8" },
              }}
            >
              {editingProduct ? "Save Changes" : "Add Product"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Product Details Dialog */}
      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "#0f172a", pb: 1 }}>
          Product Details
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          {viewingProduct && (
            <Box>
              <Card sx={{ bgcolor: "#f8fafc", boxShadow: "none", border: "1px solid #e2e8f0", mb: 2, borderRadius: "12px" }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Product Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold", color: "#0f172a" }}>
                    {viewingProduct.name}
                  </Typography>
                </CardContent>
              </Card>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    SKU
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", fontFamily: "monospace" }}>
                    {viewingProduct.sku}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Category
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {viewingProduct.category_name || "—"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Brand
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {viewingProduct.brand || "—"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    UOM
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {viewingProduct.unitOfMeasure || "—"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Retail Price
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "#0f172a" }}>
                    ${viewingProduct.unitPrice.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Cost Price
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    ${viewingProduct.costPrice.toFixed(2)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Stock Available
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "#10b981" }}>
                    {viewingProduct.stockQuantity} {viewingProduct.unitOfMeasure || ""}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Status
                  </Typography>
                  <Chip
                    label={viewingProduct.status}
                    size="small"
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      bgcolor: viewingProduct.status === "Active" ? "#ecfdf5" : "#f1f5f9",
                      color: viewingProduct.status === "Active" ? "#059669" : "#64748b",
                      border: viewingProduct.status === "Active" ? "1px solid #a7f3d0" : "1px solid #cbd5e1",
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#475569" }}>
                    {viewingProduct.description || "No description provided."}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Registered On
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    {new Date(viewingProduct.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDetail} sx={{ color: "#3b82f6", textTransform: "none", fontWeight: "bold" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Products;
