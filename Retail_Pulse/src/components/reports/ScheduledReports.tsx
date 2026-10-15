import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ScheduleIcon from "@mui/icons-material/Schedule";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

import type { ScheduledReportItem } from "../../services/reportService";
import {
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  toggleScheduledReport,
  deleteScheduledReport,
  runScheduledReportNow,
  fetchFilterMetadata,
} from "../../services/reportService";

const reportTypes = [
  { value: "sales", label: "Sales Report" },
  { value: "inventory", label: "Inventory Report" },
  { value: "customer", label: "Customer Report" },
  { value: "product_performance", label: "Product Performance Report" },
  { value: "stock_movement", label: "Stock Movement Report" },
];

interface ScheduleFormData {
  reportType: string;
  frequency: string;
  executionTime: string;
  recipients: string;
  exportFormat: string;
  isActive: boolean;
  // Filters
  fromDate?: string;
  toDate?: string;
  productId?: string;
  categoryId?: string;
  brand?: string;
  salesStatus?: string;
  stockStatus?: string;
}

const defaultForm: ScheduleFormData = {
  reportType: "sales",
  frequency: "Daily",
  executionTime: "09:00",
  recipients: "",
  exportFormat: "CSV",
  isActive: true,
  fromDate: "",
  toDate: "",
  productId: "",
  categoryId: "",
  brand: "",
  salesStatus: "",
  stockStatus: "",
};

const ScheduledReports: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduledReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  // Metadata for filter dropdowns
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    void loadSchedules();
    fetchFilterMetadata().then((data) => {
      setCategories(data.categories || []);
      setProducts(data.products || []);
    });
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getScheduledReports(1, 100);
      const items = Array.isArray(res) ? res : res.items || [];
      setSchedules(items);
    } catch (err: any) {
      console.error("Failed to load schedules:", err);
      setError("Unable to load scheduled reports. Please verify your permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setOpenDialog(true);
  };

  const handleOpenEdit = (schedule: ScheduledReportItem) => {
    setEditingId(schedule.id);
    const recipientStr = Array.isArray(schedule.recipients)
      ? schedule.recipients.join(", ")
      : schedule.recipients;

    let parsedFilters: Record<string, any> = {};
    if (typeof schedule.filters === "string") {
      try {
        parsedFilters = JSON.parse(schedule.filters);
      } catch (e) {
        parsedFilters = {};
      }
    } else if (typeof schedule.filters === "object" && schedule.filters !== null) {
      parsedFilters = schedule.filters;
    }

    setFormData({
      reportType: schedule.reportType,
      frequency: schedule.frequency,
      executionTime: schedule.executionTime,
      recipients: recipientStr || "",
      exportFormat: schedule.exportFormat || "CSV",
      isActive: schedule.isActive,
      fromDate: parsedFilters.fromDate || "",
      toDate: parsedFilters.toDate || "",
      productId: parsedFilters.productId ? String(parsedFilters.productId) : "",
      categoryId: parsedFilters.categoryId ? String(parsedFilters.categoryId) : "",
      brand: parsedFilters.brand || "",
      salesStatus: parsedFilters.salesStatus || "",
      stockStatus: parsedFilters.stockStatus || "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    const emailList = formData.recipients
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (emailList.length === 0) {
      setError("Please specify at least one recipient email address.");
      return;
    }

    const invalid = emailList.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalid) {
      setError("One or more recipient email addresses are invalid.");
      return;
    }

    const filters: Record<string, any> = {};
    if (formData.fromDate) filters.fromDate = formData.fromDate;
    if (formData.toDate) filters.toDate = formData.toDate;
    if (formData.productId) filters.productId = Number(formData.productId);
    if (formData.categoryId) filters.categoryId = Number(formData.categoryId);
    if (formData.brand) filters.brand = formData.brand;
    if (formData.salesStatus) filters.salesStatus = formData.salesStatus;
    if (formData.stockStatus) filters.stockStatus = formData.stockStatus;

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        reportType: formData.reportType,
        frequency: formData.frequency,
        executionTime: formData.executionTime,
        recipients: emailList,
        exportFormat: formData.exportFormat,
        isActive: formData.isActive,
        filters,
      };

      if (editingId !== null) {
        await updateScheduledReport(editingId, payload);
        setSuccess("Scheduled report updated successfully.");
      } else {
        await createScheduledReport(payload);
        setSuccess("Scheduled report created successfully.");
      }

      handleCloseDialog();
      await loadSchedules();
    } catch (err: any) {
      console.error("Save schedule error:", err);
      setError(err?.response?.data?.detail || "Failed to save scheduled report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (schedule: ScheduledReportItem) => {
    try {
      setError("");
      await toggleScheduledReport(schedule.id, !schedule.isActive);
      await loadSchedules();
    } catch (err) {
      setError("Failed to update schedule status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this scheduled report?")) return;
    try {
      setError("");
      await deleteScheduledReport(id);
      setSuccess("Scheduled report deleted.");
      await loadSchedules();
    } catch (err) {
      setError("Failed to delete scheduled report.");
    }
  };

  const handleRunNow = async (id: number) => {
    try {
      setRunningId(id);
      setError("");
      setSuccess("");
      await runScheduledReportNow(id);
      setSuccess("Scheduled report executed successfully! Check Report History for results.");
      await loadSchedules();
    } catch (err: any) {
      console.error("Run schedule error:", err);
      setError(err?.response?.data?.detail || "Failed to execute report.");
    } finally {
      setRunningId(null);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Automated & Recurring Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure automated daily, weekly, or monthly delivery directly to stakeholder inboxes.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: "#7c3aed",
            fontWeight: 600,
            "&:hover": { bgcolor: "#6d28d9" },
          }}
        >
          Create Schedule
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(15,23,42,0.05)" }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress sx={{ color: "#7c3aed" }} />
            </Box>
          ) : schedules.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <ScheduleIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
              <Typography variant="h6" color="text.secondary">
                No scheduled reports configured yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                Create automated reports to be periodically generated and exported.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{ borderColor: "#7c3aed", color: "#7c3aed" }}
              >
                Create First Schedule
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Report Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Frequency</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Exec Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Format</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Recipients</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Run</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {schedules.map((schedule) => {
                    const typeLabel =
                      reportTypes.find((t) => t.value === schedule.reportType)?.label ||
                      schedule.reportType;

                    const recipientText = Array.isArray(schedule.recipients)
                      ? schedule.recipients.join(", ")
                      : String(schedule.recipients || "");

                    return (
                      <TableRow hover key={schedule.id}>
                        <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                          {typeLabel}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={schedule.frequency}
                            sx={{ bgcolor: "#e0e7ff", color: "#4338ca", fontWeight: 600 }}
                          />
                        </TableCell>

                        <TableCell sx={{ color: "#475569" }}>
                          {schedule.executionTime}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={schedule.exportFormat}
                            sx={{
                              bgcolor: schedule.exportFormat === "PDF" ? "#fee2e2" : "#e0f2fe",
                              color: schedule.exportFormat === "PDF" ? "#991b1b" : "#0369a1",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ maxWidth: 200 }}>
                          <Tooltip title={recipientText} arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                color: "#475569",
                              }}
                            >
                              <EmailIcon fontSize="inherit" sx={{ mr: 0.5, color: "#94a3b8" }} />
                              {recipientText}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        <TableCell sx={{ color: "#64748b", fontSize: "0.8rem" }}>
                          {schedule.lastRunAt
                            ? new Date(schedule.lastRunAt).toLocaleString()
                            : "Never"}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={schedule.lastStatus || "Pending"}
                            icon={
                              schedule.lastStatus?.toLowerCase() === "success" ? (
                                <CheckCircleIcon fontSize="inherit" />
                              ) : schedule.lastStatus?.toLowerCase() === "failed" ? (
                                <ErrorIcon fontSize="inherit" />
                              ) : undefined
                            }
                            color={
                              schedule.lastStatus?.toLowerCase() === "success"
                                ? "success"
                                : schedule.lastStatus?.toLowerCase() === "failed"
                                ? "error"
                                : "default"
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <Switch
                            size="small"
                            checked={schedule.isActive}
                            onChange={() => handleToggle(schedule)}
                            color="secondary"
                          />
                        </TableCell>

                        <TableCell sx={{ textAlign: "center" }}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Run Immediately">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRunNow(schedule.id)}
                                  disabled={runningId === schedule.id}
                                  sx={{ color: "#7c3aed" }}
                                >
                                  {runningId === schedule.id ? (
                                    <CircularProgress size={18} color="inherit" />
                                  ) : (
                                    <PlayArrowIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Edit Schedule">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEdit(schedule)}
                                sx={{ color: "#0284c7" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Schedule">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(schedule.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Schedule Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingId ? "Edit Scheduled Report" : "Create New Scheduled Report"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: "#475569" }}>
                1. Schedule Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={formData.reportType}
                      label="Report Type"
                      onChange={(e) =>
                        setFormData({ ...formData, reportType: e.target.value })
                      }
                    >
                      {reportTypes.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={formData.frequency}
                      label="Frequency"
                      onChange={(e) =>
                        setFormData({ ...formData, frequency: e.target.value })
                      }
                    >
                      <MenuItem value="Daily">Daily</MenuItem>
                      <MenuItem value="Weekly">Weekly</MenuItem>
                      <MenuItem value="Monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    label="Execution Time"
                    value={formData.executionTime}
                    onChange={(e) =>
                      setFormData({ ...formData, executionTime: e.target.value })
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Recipient Emails"
                    placeholder="finance@company.com, ceo@company.com"
                    value={formData.recipients}
                    onChange={(e) =>
                      setFormData({ ...formData, recipients: e.target.value })
                    }
                    helperText="Comma-separated email addresses"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Export Format</InputLabel>
                    <Select
                      value={formData.exportFormat}
                      label="Export Format"
                      onChange={(e) =>
                        setFormData({ ...formData, exportFormat: e.target.value })
                      }
                    >
                      <MenuItem value="CSV">CSV</MenuItem>
                      <MenuItem value="PDF">PDF</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }} sx={{ display: "flex", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ mr: 1, color: "#475569" }}>
                    Active Status:
                  </Typography>
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    color="secondary"
                  />
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: "#475569" }}>
                2. Report Pre-filters (Optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filter Category</InputLabel>
                    <Select
                      value={formData.categoryId || ""}
                      label="Filter Category"
                      onChange={(e) =>
                        setFormData({ ...formData, categoryId: e.target.value })
                      }
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filter Product</InputLabel>
                    <Select
                      value={formData.productId || ""}
                      label="Filter Product"
                      onChange={(e) =>
                        setFormData({ ...formData, productId: e.target.value })
                      }
                    >
                      <MenuItem value="">All Products</MenuItem>
                      {products.map((p) => (
                        <MenuItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Filter Brand"
                    value={formData.brand || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sales Status</InputLabel>
                    <Select
                      value={formData.salesStatus || ""}
                      label="Sales Status"
                      onChange={(e) =>
                        setFormData({ ...formData, salesStatus: e.target.value })
                      }
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stock Status</InputLabel>
                    <Select
                      value={formData.stockStatus || ""}
                      label="Stock Status"
                      onChange={(e) =>
                        setFormData({ ...formData, stockStatus: e.target.value })
                      }
                    >
                      <MenuItem value="">All Stock Statuses</MenuItem>
                      <MenuItem value="In Stock">In Stock</MenuItem>
                      <MenuItem value="Low Stock">Low Stock</MenuItem>
                      <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
            sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" } }}
          >
            {submitting ? "Saving..." : editingId ? "Update Schedule" : "Create Schedule"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduledReports;