import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

import auditLogService from "../services/auditLogService";
import type {
  AuditLog,
  AuditLogQueryParams,
  FilterOptions,
} from "../services/auditLogService";
import AuditLogTable from "../components/auditLogs/AuditLogTable";
import AuditLogFilters from "../components/auditLogs/AuditLogFilters";
import AuditLogPagination from "../components/auditLogs/AuditLogPagination";
import AuditLogDetails from "../components/auditLogs/AuditLogDetails";
import AuditLogExport from "../components/auditLogs/AuditLogExport";

const DEFAULT_OPTIONS: FilterOptions = {
  actions: [],
  resourceTypes: [],
  users: [],
  statuses: ["SUCCESS", "FAILED"],
};

export const AuditLogs: React.FC = () => {
  const navigate = useNavigate();

  // Authentication & Role Check
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [userChecked, setUserChecked] = useState<boolean>(false);

  // Data states
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dropdown options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(DEFAULT_OPTIONS);

  // Active query parameters
  const [queryParams, setQueryParams] = useState<AuditLogQueryParams>({
    page: 1,
    limit: 25,
    search: "",
    userId: undefined,
    action: "ALL",
    resourceType: "ALL",
    status: "ALL",
    startDate: undefined,
    endDate: undefined,
    sortOrder: "desc",
  });

  // Selected log for detailed view modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Real-time polling / auto-refresh
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const pollingTimerRef = useRef<any>(null);

  // Clear Logs confirmation modal
  const [clearDialogOpen, setClearDialogOpen] = useState<boolean>(false);
  const [clearRetentionDays, setClearRetentionDays] = useState<number | string>("all");
  const [clearConfirmed, setClearConfirmed] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);

  // Snackbar feedback
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Verify Admin authorization
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const role = (parsed.role || "").toLowerCase();
        const adminAllowed = ["company admin", "admin", "super admin"].includes(role);
        setIsAdmin(adminAllowed);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setUserChecked(true);
    }
  }, []);

  // Fetch filter dropdown choices once
  const loadFilterOptions = async () => {
    try {
      const options = await auditLogService.getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      console.error("Failed to load filter options:", err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadFilterOptions();
    }
  }, [isAdmin]);

  // Fetch audit logs with current query params
  const fetchLogs = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      setErrorMsg(null);

      try {
        const data = await auditLogService.getAuditLogs(queryParams);
        setLogs(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        console.error("Failed to fetch audit logs:", err);
        setErrorMsg(
          err.response?.data?.detail || "Failed to load audit records. Please check your connection."
        );
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [queryParams]
  );

  // Trigger fetch whenever query params change
  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [fetchLogs, isAdmin]);

  // Real-time polling effect (every 15 seconds when active)
  useEffect(() => {
    if (autoRefresh && isAdmin) {
      pollingTimerRef.current = setInterval(() => {
        fetchLogs(true);
      }, 15000);
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [autoRefresh, fetchLogs, isAdmin]);

  // Handle filter changes (resets page to 1)
  const handleFilterChange = (newFilters: Partial<AuditLogQueryParams>) => {
    setQueryParams((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setQueryParams({
      page: 1,
      limit: 25,
      search: "",
      userId: undefined,
      action: "ALL",
      resourceType: "ALL",
      status: "ALL",
      startDate: undefined,
      endDate: undefined,
      sortOrder: "desc",
    });
  };

  // Sort toggle (Timestamp)
  const handleSortToggle = () => {
    setQueryParams((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
      page: 1,
    }));
  };

  // Execute Clear Logs (Admin only)
  const handleExecuteClearLogs = async () => {
    if (!clearConfirmed) return;
    setClearing(true);

    try {
      const retentionDays =
        clearRetentionDays === "all" ? undefined : Number(clearRetentionDays);
      const res = await auditLogService.clearAuditLogs(retentionDays);

      setClearDialogOpen(false);
      setClearConfirmed(false);
      setSnackbar({
        open: true,
        message: res.message || "Audit logs cleared successfully.",
        severity: "success",
      });
      fetchLogs();
    } catch (err: any) {
      console.error("Failed to clear audit logs:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Failed to clear audit logs.",
        severity: "error",
      });
    } finally {
      setClearing(false);
    }
  };

  // Unauthorized non-admin view
  if (userChecked && !isAdmin) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <Paper
          sx={{
            maxWidth: 520,
            p: 5,
            textAlign: "center",
            borderRadius: "16px",
            border: "1px solid #fed7aa",
            bgcolor: "#fffbeb",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#92400e", mb: 1 }}>
            Admin Access Required
          </Typography>
          <Typography variant="body2" sx={{ color: "#78350f", mb: 3 }}>
            The Audit Logs & Activity Monitoring module contains sensitive security and operational
            data. Access is strictly restricted to authorized company administrators.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard")}
            sx={{
              bgcolor: "#d97706",
              textTransform: "none",
              borderRadius: "10px",
              fontWeight: 600,
              "&:hover": { bgcolor: "#b45309" },
            }}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  const hasActiveFilters = Boolean(
    queryParams.search ||
      queryParams.userId ||
      (queryParams.action && queryParams.action !== "ALL") ||
      (queryParams.resourceType && queryParams.resourceType !== "ALL") ||
      (queryParams.status && queryParams.status !== "ALL") ||
      queryParams.startDate ||
      queryParams.endDate ||
      queryParams.sortOrder === "asc"
  );

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: "#e0e7ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SecurityIcon fontSize="small" />
            </Box>
            <Typography variant="h4" sx={{ color: "#0f172a", fontWeight: 800, fontSize: "1.75rem" }}>
              Audit Logs & Activity Monitoring
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Comprehensive audit trail tracking who performed actions, affected resources, timestamps,
            before/after values, and client origins.
          </Typography>
        </Box>

        {/* Action Controls: Live Updates, Refresh, Export, Clear Logs */}
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
          {/* Live Auto-Refresh Toggle */}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#475569" }}>
                Live Updates {autoRefresh ? "(15s)" : "(Off)"}
              </Typography>
            }
            sx={{ mr: 0.5 }}
          />

          {/* Manual Refresh Button */}
          <Tooltip title="Refresh activity logs now">
            <IconButton
              onClick={() => fetchLogs()}
              disabled={loading}
              sx={{
                border: "1px solid #cbd5e1",
                bgcolor: "#ffffff",
                borderRadius: "10px",
                "&:hover": { bgcolor: "#f8fafc" },
              }}
              size="medium"
            >
              <RefreshIcon fontSize="small" sx={{ color: "#475569" }} />
            </IconButton>
          </Tooltip>

          {/* Export Logs Component (CSV & PDF) */}
          <AuditLogExport
            filters={queryParams}
            onSuccess={(msg) =>
              setSnackbar({ open: true, message: msg, severity: "success" })
            }
            onError={(msg) =>
              setSnackbar({ open: true, message: msg, severity: "error" })
            }
          />

          {/* Clear Logs Button (Admin Only) */}
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon fontSize="small" />}
            onClick={() => {
              setClearConfirmed(false);
              setClearDialogOpen(true);
            }}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#fca5a5",
              color: "#dc2626",
              bgcolor: "#ffffff",
              "&:hover": {
                borderColor: "#dc2626",
                bgcolor: "#fef2f2",
              },
            }}
          >
            Clear Logs
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {errorMsg && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: "12px" }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchLogs()}>
              Retry
            </Button>
          }
        >
          {errorMsg}
        </Alert>
      )}

      {/* Filter Bar Component */}
      <AuditLogFilters
        filters={queryParams}
        options={filterOptions}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Audit Log Table Component */}
      <AuditLogTable
        logs={logs}
        loading={loading}
        sortOrder={queryParams.sortOrder || "desc"}
        hasFilters={hasActiveFilters}
        onSortToggle={handleSortToggle}
        onSelectLog={(log) => setSelectedLog(log)}
        onResetFilters={handleResetFilters}
      />

      {/* Pagination Component */}
      <AuditLogPagination
        page={queryParams.page || 1}
        limit={queryParams.limit || 25}
        total={total}
        totalPages={totalPages}
        onPageChange={(newPage) => setQueryParams((prev) => ({ ...prev, page: newPage }))}
        onLimitChange={(newLimit) =>
          setQueryParams((prev) => ({ ...prev, limit: newLimit, page: 1 }))
        }
      />

      {/* Detailed View Modal (Before/After Diff) */}
      <AuditLogDetails
        log={selectedLog}
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />

      {/* Clear Logs Double-Confirmation Modal */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => !clearing && setClearDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: "#fef2f2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WarningAmberIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
            Confirm Clear Audit Logs
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <DialogContentText sx={{ color: "#475569", mb: 2 }}>
            You are about to delete audit logs for your company. This is a sensitive action. A permanent
            record of this clearing action itself will be automatically generated and preserved in the audit database.
          </DialogContentText>

          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <InputLabel id="retention-select-label">Retention Period</InputLabel>
            <Select
              labelId="retention-select-label"
              label="Retention Period"
              value={clearRetentionDays}
              onChange={(e) => setClearRetentionDays(e.target.value)}
              sx={{ borderRadius: "10px" }}
            >
              <MenuItem value="all">Clear All Company Logs</MenuItem>
              <MenuItem value={30}>Clear Logs Older Than 30 Days</MenuItem>
              <MenuItem value={60}>Clear Logs Older Than 60 Days</MenuItem>
              <MenuItem value={90}>Clear Logs Older Than 90 Days</MenuItem>
            </Select>
          </FormControl>

          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              bgcolor: "#fff1f2",
              border: "1px solid #fecdd3",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Checkbox
              checked={clearConfirmed}
              onChange={(e) => setClearConfirmed(e.target.checked)}
              color="error"
              sx={{ p: 0 }}
            />
            <Typography variant="body2" sx={{ color: "#9f1239", fontWeight: 600 }}>
              I understand that cleared audit logs cannot be recovered.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setClearDialogOpen(false)}
            disabled={clearing}
            sx={{ textTransform: "none", color: "#64748b", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExecuteClearLogs}
            disabled={!clearConfirmed || clearing}
            variant="contained"
            color="error"
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#dc2626",
              "&:hover": { bgcolor: "#b91c1c" },
            }}
          >
            {clearing ? "Clearing Records..." : "Confirm & Clear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "10px", fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AuditLogs;
