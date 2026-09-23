import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  TableSortLabel,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import type { AuditLog } from "../../services/auditLogService";
import AuditLogSkeleton from "./AuditLogSkeleton";
import AuditLogEmpty from "./AuditLogEmpty";

interface AuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
  sortOrder: "desc" | "asc";
  hasFilters: boolean;
  onSortToggle: () => void;
  onSelectLog: (log: AuditLog) => void;
  onResetFilters: () => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  loading,
  sortOrder,
  hasFilters,
  onSortToggle,
  onSelectLog,
  onResetFilters,
}) => {
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
    if (act.includes("IMPORT") || act.includes("EXPORT")) {
      return { bg: "#f0f9ff", text: "#0284c7", border: "#bae6fd" };
    }
    return { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        overflow: "hidden",
        bgcolor: "#ffffff",
      }}
    >
      <Table sx={{ minWidth: 800 }}>
        <TableHead sx={{ bgcolor: "#f8fafc" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.75, width: "18%" }}>
              User
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.75, width: "12%" }}>
              Action
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.75, width: "14%" }}>
              Resource
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.75, width: "22%" }}>
              Description
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.75, width: "11%" }}>
              IP Address
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.75, width: "13%" }}>
              <TableSortLabel
                active
                direction={sortOrder}
                onClick={onSortToggle}
                sx={{
                  color: "#475569 !important",
                  "&.Mui-active": { color: "#1e293b !important" },
                }}
              >
                Timestamp
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.75, width: "7%" }}>
              Status
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", py: 1.75, width: "5%" }}>
              View
            </TableCell>
          </TableRow>
        </TableHead>

        {loading ? (
          <AuditLogSkeleton rows={6} />
        ) : logs.length === 0 ? (
          <TableBody>
            <AuditLogEmpty
              hasFilters={hasFilters}
              onResetFilters={onResetFilters}
              colSpan={8}
            />
          </TableBody>
        ) : (
          <TableBody>
            {logs.map((row) => {
              const actionStyle = getActionColor(row.action);
              const userName = row.userName || row.user?.name || "System";
              const userEmail = row.userEmail || row.user?.email || "";
              const isSuccess = (row.status || "SUCCESS").toUpperCase() === "SUCCESS";

              return (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => onSelectLog(row)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#f8fafc" },
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {/* User */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <Avatar
                        sx={{
                          bgcolor: "#aa3bff",
                          width: 32,
                          height: 32,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {userName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0, maxWidth: 140 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.875rem" }}
                        >
                          {userName}
                        </Typography>
                        {userEmail && (
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}
                          >
                            {userEmail}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Action */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Chip
                      label={row.action}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.725rem",
                        bgcolor: actionStyle.bg,
                        color: actionStyle.text,
                        border: `1px solid ${actionStyle.border}`,
                        borderRadius: "8px",
                      }}
                    />
                  </TableCell>

                  {/* Resource & ID */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>
                      {row.resourceType || "System"}
                    </Typography>
                    {row.resourceId ? (
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        ID: #{row.resourceId}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        —
                      </Typography>
                    )}
                  </TableCell>

                  {/* Description */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Tooltip title={row.description || ""} placement="top-start">
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ color: "#334155", maxWidth: 240 }}
                      >
                        {row.description || "—"}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  {/* IP Address */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#475569", fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {row.ipAddress || "—"}
                    </Typography>
                  </TableCell>

                  {/* Timestamp */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "#1e293b", fontSize: "0.825rem", fontWeight: 500 }}>
                      {new Date(row.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                      {new Date(row.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Typography>
                  </TableCell>

                  {/* Status */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Chip
                      icon={
                        isSuccess ? (
                          <CheckCircleOutlinedIcon sx={{ fontSize: "12px !important" }} />
                        ) : (
                          <HighlightOffIcon sx={{ fontSize: "12px !important" }} />
                        )
                      }
                      label={row.status || "SUCCESS"}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        bgcolor: isSuccess ? "#f0fdf4" : "#fef2f2",
                        color: isSuccess ? "#16a34a" : "#dc2626",
                        border: `1px solid ${isSuccess ? "#bbf7d0" : "#fca5a5"}`,
                        borderRadius: "6px",
                        height: 22,
                      }}
                    />
                  </TableCell>

                  {/* Action View Button */}
                  <TableCell align="right" sx={{ py: 1.5 }}>
                    <Tooltip title="View full details and changes">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLog(row);
                        }}
                        sx={{
                          color: "#6366f1",
                          "&:hover": { bgcolor: "rgba(99, 102, 241, 0.08)" },
                        }}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
    </TableContainer>
  );
};

export default AuditLogTable;
