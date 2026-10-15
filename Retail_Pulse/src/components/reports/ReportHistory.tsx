import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PersonIcon from "@mui/icons-material/Person";

import type { ReportHistoryItem } from "../../services/reportService";
import {
  getReportHistory,
  downloadHistoryReport,
} from "../../services/reportService";

interface ReportHistoryProps {
  onViewReport?: (reportType: string, filters: Record<string, any>) => void;
}

const ReportHistory: React.FC<ReportHistoryProps> = ({ onViewReport }) => {
  const [items, setItems] = useState<ReportHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadHistory = async (selectedPage = 1) => {
    try {
      setLoading(true);
      setError("");

      const result = await getReportHistory(selectedPage, 15);
      setItems(result.items || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
      setPage(selectedPage);
    } catch (err) {
      console.error("Failed to load report history:", err);
      setError("Unable to load report history. Please check the backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory(1);
  }, []);

  const handleDownload = async (item: ReportHistoryItem) => {
    try {
      setDownloadingId(item.id);
      setError("");
      await downloadHistoryReport(item.id, item.reportName, item.format);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Could not download report file. It may no longer be available.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = (item: ReportHistoryItem) => {
    if (!onViewReport) return;
    let parsedFilters: Record<string, any> = {};
    if (item.filters) {
      try {
        parsedFilters = JSON.parse(item.filters);
      } catch (e) {
        parsedFilters = {};
      }
    }
    onViewReport(item.reportType, parsedFilters);
  };

  const parseFilterChips = (filterStr?: string) => {
    if (!filterStr) return <Typography variant="caption" color="text.secondary">None</Typography>;
    try {
      const obj = JSON.parse(filterStr);
      const keys = Object.keys(obj);
      if (keys.length === 0) return <Typography variant="caption" color="text.secondary">None</Typography>;

      return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5, maxWidth: 220 }}>
          {keys.map((k) => (
            <Chip
              key={k}
              size="small"
              label={`${k}: ${obj[k]}`}
              sx={{ fontSize: "0.7rem", height: 20, bgcolor: "#f1f5f9" }}
            />
          ))}
        </Stack>
      );
    } catch (e) {
      return <Typography variant="caption">{filterStr}</Typography>;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Report Generation & Export History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Audit trail of all generated, scheduled, and exported reports with download and view access.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(15,23,42,0.05)" }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress sx={{ color: "#7c3aed" }} />
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <HistoryIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
              <Typography variant="h6" color="text.secondary">
                No report history recorded
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate or export a report to see historical audit entries here.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Report Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Generated By</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Applied Filters</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Format</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Details / Error</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {items.map((item) => (
                      <TableRow hover key={item.id}>
                        <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                          {item.reportName}
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", color: "#475569" }}>
                            <PersonIcon fontSize="inherit" sx={{ mr: 0.5, color: "#94a3b8" }} />
                            <Typography variant="body2">
                              {item.generatedBy || `User #${item.userId}`}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ color: "#64748b", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                        </TableCell>

                        <TableCell>{parseFilterChips(item.filters)}</TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={item.format}
                            sx={{
                              bgcolor:
                                item.format === "PDF"
                                  ? "#fee2e2"
                                  : item.format === "CSV"
                                  ? "#e0f2fe"
                                  : "#f3e8ff",
                              color:
                                item.format === "PDF"
                                  ? "#991b1b"
                                  : item.format === "CSV"
                                  ? "#0369a1"
                                  : "#6b21a8",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={item.status}
                            icon={
                              item.status.toLowerCase() === "success" ? (
                                <CheckCircleIcon fontSize="inherit" />
                              ) : (
                                <ErrorIcon fontSize="inherit" />
                              )
                            }
                            color={item.status.toLowerCase() === "success" ? "success" : "error"}
                          />
                        </TableCell>

                        <TableCell sx={{ maxWidth: 220 }}>
                          {item.errorMessage ? (
                            <Tooltip title={item.errorMessage} arrow>
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {item.errorMessage}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Completed successfully
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ textAlign: "center" }}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {onViewReport && (
                              <Tooltip title="View Report">
                                <IconButton
                                  size="small"
                                  onClick={() => handleView(item)}
                                  sx={{ color: "#7c3aed" }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title={item.format === "VIEW" ? "Export & Download" : "Download File"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownload(item)}
                                  disabled={
                                    downloadingId === item.id ||
                                    item.status.toLowerCase() !== "success"
                                  }
                                  sx={{ color: "#0284c7" }}
                                >
                                  {downloadingId === item.id ? (
                                    <CircularProgress size={18} color="inherit" />
                                  ) : (
                                    <FileDownloadIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  borderTop: "1px solid #f1f5f9",
                  flexWrap: "wrap",
                  gap: 1.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing {items.length} of {total} history entries
                </Typography>

                {totalPages > 1 && (
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, selectedPage) => loadHistory(selectedPage)}
                    sx={{
                      "& .Mui-selected": {
                        bgcolor: "#7c3aed !important",
                        color: "#fff",
                      },
                    }}
                  />
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportHistory;