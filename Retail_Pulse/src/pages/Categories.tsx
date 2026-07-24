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
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import api from "../services/api";

interface Category {
  id: number;
  companyId: number;
  name: string;
  description: string | null;
  status: string;
  product_count: number;
  createdAt: string;
  updatedAt: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");

  // Errors / Notifications
  const [fieldErrors, setFieldErrors] = useState<{ name?: string }>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchCategories = async (searchVal = search) => {
    setLoading(true);
    try {
      const response = await api.get("/categories", {
        params: { search: searchVal || undefined },
      });
      setCategories(response.data);
    } catch (error: any) {
      console.error("Failed to fetch categories:", error);
      showSnackbar("Failed to fetch categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    fetchCategories(val);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setDescription(category.description || "");
      setStatus(category.status);
    } else {
      setEditingCategory(null);
      setName("");
      setDescription("");
      setStatus("Active");
    }
    setFieldErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Client-side validations
    if (!name.trim()) {
      setFieldErrors({ name: "Category Name is required" });
      return;
    }

    try {
      if (editingCategory) {
        // Edit Category
        await api.put(`/categories/${editingCategory.id}`, {
          name: name.trim(),
          description: description.trim() || null,
          status,
        });
        showSnackbar("Category updated successfully", "success");
      } else {
        // Create Category
        await api.post("/categories/", {
          name: name.trim(),
          description: description.trim() || null,
          status,
        });
        showSnackbar("Category created successfully", "success");
      }
      handleCloseDialog();
      fetchCategories();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      const errMsg = error.response?.data?.detail || "Something went wrong";
      showSnackbar(errMsg, "error");
    }
  };

  const handleDelete = async (id: number, productCount: number) => {
    if (productCount > 0) {
      showSnackbar(`Cannot delete category. There are ${productCount} products under this category.`, "error");
      return;
    }

    if (window.confirm("Are you sure you want to delete this category? This action is permanent.")) {
      try {
        await api.delete(`/categories/${id}`);
        showSnackbar("Category deleted successfully", "success");
        fetchCategories();
      } catch (error: any) {
        console.error("Failed to delete category:", error);
        const errMsg = error.response?.data?.detail || "Failed to delete category";
        showSnackbar(errMsg, "error");
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: "#0f172a", mb: 0.5, fontWeight: "bold" }}>
            Category Directories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage target classifications, hierarchy groupings, and view product assignments.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: "#aa3bff",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: "bold",
            px: 3,
            py: 1,
            boxShadow: "0 4px 12px rgba(170, 59, 255, 0.3)",
            "&:hover": { bgcolor: "#8b27cf" },
          }}
        >
          Add Category
        </Button>
      </Box>

      {/* Toolbar / Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "none" }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Search categories by name..."
            value={search}
            onChange={handleSearchChange}
            sx={{ width: { xs: "100%", sm: 320 } }}
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
          <Tooltip title="Refresh categories">
            <IconButton onClick={() => fetchCategories()} size="medium">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Table Container */}
      <TableContainer component={Paper} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "none", overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Category Name</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Description</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }} align="center">Products Count</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Created Date</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={30} sx={{ color: "#aa3bff" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading categories...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: "bold" }}>
                    No categories found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Create a new category to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((row) => (
                <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#f8fafc" }, transition: "background-color 0.2s" }}>
                  <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>{row.name}</TableCell>
                  <TableCell sx={{ color: "#475569", maxWidth: 250 }}>
                    {row.description || (
                      <Typography variant="body2" sx={{ fontStyle: "italic", color: "#94a3b8" }}>
                        No description
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      sx={{
                        fontWeight: "bold",
                        bgcolor: row.status === "Active" ? "#ecfdf5" : "#f1f5f9",
                        color: row.status === "Active" ? "#059669" : "#64748b",
                        border: row.status === "Active" ? "1px solid #a7f3d0" : "1px solid #cbd5e1",
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 24,
                        height: 24,
                        borderRadius: "50%",
                        bgcolor: "#f1f5f9",
                        color: "#334155",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        px: 1,
                      }}
                    >
                      {row.product_count}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "#64748b" }}>
                    {new Date(row.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Category">
                      <IconButton onClick={() => handleOpenDialog(row)} size="small" sx={{ mr: 1, color: "#3b82f6" }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Category">
                      <IconButton onClick={() => handleDelete(row.id, row.product_count)} size="small" sx={{ color: "#ef4444" }}>
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

      {/* Dialog for Add/Edit Category */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: { borderRadius: "16px", p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "#0f172a", pb: 1 }}>
          {editingCategory ? "Edit Category" : "Add New Category"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ py: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Category Name"
              type="text"
              fullWidth
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
              sx={{ mb: 2 }}
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <FormControl fullWidth variant="outlined" margin="dense">
              <InputLabel>Status</InputLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value as string)} label="Status">
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} sx={{ color: "#64748b", textTransform: "none", fontWeight: "bold" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#aa3bff",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "bold",
                "&:hover": { bgcolor: "#8b27cf" },
              }}
            >
              {editingCategory ? "Save Changes" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for Notifications */}
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

export default Categories;
