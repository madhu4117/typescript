import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import api from "../sevices/api";

interface AuditLog {
  id: number;
  companyId: number;
  targetName: string;
  action: string;
  performedBy: string;
  timestamp: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/audit-logs");
      setLogs(response.data);
    } catch (error: any) {
      console.error("Failed to load audit logs:", error);
      setErrorMsg("Failed to fetch audit logs");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case "Category Created":
      case "Product Created":
        return { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" };
      case "Category Updated":
      case "Product Updated":
        return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
      case "Category Deleted":
      case "Product Deleted":
        return { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5" };
      case "Product Activated":
        return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
      case "Product Deactivated":
        return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
      default:
        return { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.targetName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: "#0f172a", mb: 0.5, fontWeight: "bold" }}>
            Security Audit Trail
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View full historical log records of data modification actions, creator identities, and operation timestamps.
          </Typography>
        </Box>
        <Tooltip title="Reload logs">
          <IconButton onClick={fetchAuditLogs} sx={{ border: "1px solid #cbd5e1" }} size="medium">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Toolbar / Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "none" }}>
        <TextField
          size="small"
          placeholder="Filter logs by name, action, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
      </Paper>

      {/* Table Container */}
      <TableContainer component={Paper} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "none", overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Target Name (Product/Category)</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Action Performed</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Performed By</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={30} sx={{ color: "#6366f1" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading audit trail logs...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: "bold" }}>
                    No audit logs recorded
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Perform actions on categories or products to populate this log.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((row) => {
                const style = getActionColor(row.action);
                return (
                  <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#f8fafc" }, transition: "background-color 0.2s" }}>
                    <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>{row.targetName}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.action}
                        size="small"
                        sx={{
                          fontWeight: "bold",
                          bgcolor: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#334155" }}>{row.performedBy}</TableCell>
                    <TableCell sx={{ color: "#64748b" }}>
                      {new Date(row.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Snackbar Alert */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AuditLogs;
