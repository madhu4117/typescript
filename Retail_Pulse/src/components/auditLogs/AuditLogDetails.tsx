import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import PublicIcon from "@mui/icons-material/Public";
import ScheduleIcon from "@mui/icons-material/Schedule";
import DevicesIcon from "@mui/icons-material/Devices";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import type { AuditLog } from "../../services/auditLogService";

interface AuditLogDetailsProps {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

export const AuditLogDetails: React.FC<AuditLogDetailsProps> = ({
  log,
  open,
  onClose,
}) => {
  if (!log) return null;

  // Format action styling
  const getActionColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("ADD")) {
      return { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" };
    }
    if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("CLEAR")) {
      return { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5" };
    }
    if (act.includes("UPDATE") || act.includes("MODIFY") || act.includes("STATUS")) {
      return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
    }
    if (act.includes("STOCK")) {
      return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
    }
    if (act.includes("LOGIN") || act.includes("AUTH")) {
      return { bg: "#faf5ff", text: "#7c3aed", border: "#e9d5ff" };
    }
    return { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
  };

  const actionStyle = getActionColor(log.action);

  // Normalize before & after data objects
  const parsePayload = (val: any) => {
    if (!val) return null;
    if (typeof val === "object") return val;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  };

  const beforeObj = parsePayload(log.beforeData);
  const afterObj = parsePayload(log.afterData);

  // Gather diff fields
  let diffKeys: string[] = [];
  if (beforeObj && typeof beforeObj === "object" && afterObj && typeof afterObj === "object") {
    diffKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));
  } else if (beforeObj && typeof beforeObj === "object") {
    diffKeys = Object.keys(beforeObj);
  } else if (afterObj && typeof afterObj === "object") {
    diffKeys = Object.keys(afterObj);
  }

  const formatVal = (v: any) => {
    if (v === null || v === undefined) return <span style={{ color: "#94a3b8", fontStyle: "italic" }}>null</span>;
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden",
          },
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
            Audit Record Details #{log.id}
          </Typography>
          <Chip
            label={log.action}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: "0.75rem",
              bgcolor: actionStyle.bg,
              color: actionStyle.text,
              border: `1px solid ${actionStyle.border}`,
            }}
          />
          <Chip
            icon={
              log.status.toUpperCase() === "SUCCESS" ? (
                <CheckCircleOutlinedIcon sx={{ fontSize: "14px !important" }} />
              ) : (
                <HighlightOffIcon sx={{ fontSize: "14px !important" }} />
              )
            }
            label={log.status.toUpperCase()}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              bgcolor: log.status.toUpperCase() === "SUCCESS" ? "#f0fdf4" : "#fef2f2",
              color: log.status.toUpperCase() === "SUCCESS" ? "#16a34a" : "#dc2626",
              border: `1px solid ${
                log.status.toUpperCase() === "SUCCESS" ? "#bbf7d0" : "#fca5a5"
              }`,
            }}
          />
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#64748b" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 3 }}>
        {/* Info Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2.5,
            mb: 3,
          }}
        >
          {/* User Info Card */}
          <Paper
            sx={{
              p: 2,
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "none",
              bgcolor: "#f8fafc",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PersonIcon fontSize="small" sx={{ color: "#6366f1" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                User Information
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Avatar
                sx={{
                  bgcolor: "#6366f1",
                  width: 36,
                  height: 36,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {(log.userName || log.user?.name || "U").charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                  {log.userName || log.user?.name || "System User"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  {log.userEmail || log.user?.email || "N/A"}
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: "#475569", display: "block" }}>
              User ID: <span style={{ fontWeight: 600 }}>{log.userId || log.user?.id || "N/A"}</span>
              {log.user?.role && (
                <> &bull; Role: <span style={{ fontWeight: 600 }}>{log.user.role}</span></>
              )}
            </Typography>
          </Paper>

          {/* Operation & Context Card */}
          <Paper
            sx={{
              p: 2,
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "none",
              bgcolor: "#f8fafc",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <ScheduleIcon fontSize="small" sx={{ color: "#0ea5e9" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                Operation & Timing
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 0.75, rowGap: 0.5 }}>
              <Typography variant="caption" sx={{ color: "#64748b" }}>Resource:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#1e293b" }}>
                {log.resourceType || "System"} {log.resourceId ? `(ID: ${log.resourceId})` : ""}
              </Typography>

              <Typography variant="caption" sx={{ color: "#64748b" }}>Timestamp:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#1e293b" }}>
                {new Date(log.createdAt).toLocaleString()}
              </Typography>

              <Typography variant="caption" sx={{ color: "#64748b" }}>Company ID:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#1e293b" }}>
                {log.companyId}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Description & Request Metadata */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "none",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Description
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "#0f172a", fontWeight: 500 }}>
            {log.description || "No description provided."}
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <PublicIcon fontSize="small" sx={{ color: "#94a3b8" }} />
              <Typography variant="caption" color="text.secondary">
                IP Address: <span style={{ fontWeight: 600, color: "#1e293b" }}>{log.ipAddress || "Unknown"}</span>
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <DevicesIcon fontSize="small" sx={{ color: "#94a3b8" }} />
              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>
                User-Agent: <span style={{ fontWeight: 500, color: "#1e293b" }}>{log.userAgent || "Unknown"}</span>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Before and After Values Comparison (Diff Section) */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <CompareArrowsIcon fontSize="small" sx={{ color: "#6366f1" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
              Changes: Before vs. After Values
            </Typography>
          </Box>

          {diffKeys.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", width: "30%" }}>
                      Field Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#dc2626", width: "35%" }}>
                      Before Value (Old)
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#16a34a", width: "35%" }}>
                      After Value (New)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {diffKeys.map((key) => {
                    const beforeVal = beforeObj ? beforeObj[key] : undefined;
                    const afterVal = afterObj ? afterObj[key] : undefined;
                    const isChanged = beforeVal !== afterVal;

                    return (
                      <TableRow
                        key={key}
                        sx={{
                          bgcolor: isChanged ? "rgba(248, 250, 252, 0.5)" : "inherit",
                          "&:hover": { bgcolor: "#f8fafc" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: "#334155" }}>
                          {key}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              p: 0.75,
                              borderRadius: "6px",
                              bgcolor: beforeVal !== undefined ? "#fef2f2" : "transparent",
                              color: beforeVal !== undefined ? "#b91c1c" : "#94a3b8",
                              fontWeight: 500,
                              fontSize: "0.825rem",
                              display: "inline-block",
                              minWidth: 60,
                            }}
                          >
                            {beforeVal !== undefined ? formatVal(beforeVal) : "—"}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              p: 0.75,
                              borderRadius: "6px",
                              bgcolor: afterVal !== undefined ? "#f0fdf4" : "transparent",
                              color: afterVal !== undefined ? "#15803d" : "#94a3b8",
                              fontWeight: 500,
                              fontSize: "0.825rem",
                              display: "inline-block",
                              minWidth: 60,
                            }}
                          >
                            {afterVal !== undefined ? formatVal(afterVal) : "—"}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                borderRadius: "12px",
                border: "1px dashed #cbd5e1",
                bgcolor: "#fafafa",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No before or after state payload recorded for this operation.
              </Typography>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: "#6366f1",
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 600,
            "&:hover": { bgcolor: "#4f46e5" },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditLogDetails;
