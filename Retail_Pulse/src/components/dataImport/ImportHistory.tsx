import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";

import type {
  ImportHistoryItem,
  ImportErrorDetail,
} from "../../services/dataImportService";
import {
  downloadFailedRecords,
  getImportErrors,
} from "../../services/dataImportService";

interface Props {
  history: ImportHistoryItem[];
  onRefresh?: () => void;
}

const ImportHistory: React.FC<Props> = ({ history, onRefresh }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Error details dialog state
  const [selectedImport, setSelectedImport] = useState<ImportHistoryItem | null>(null);
  const [dialogErrors, setDialogErrors] = useState<ImportErrorDetail[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const getStatusChip = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") {
      return (
        <Chip
          label={status}
          size="small"
          color="success"
          sx={{ fontWeight: 600, fontSize: 12 }}
        />
      );
    }
    if (s.includes("error") || s === "completed with errors") {
      return (
        <Chip
          label={status}
          size="small"
          color="warning"
          sx={{ fontWeight: 600, fontSize: 12 }}
        />
      );
    }
    if (s === "failed") {
      return (
        <Chip
          label={status}
          size="small"
          color="error"
          sx={{ fontWeight: 600, fontSize: 12 }}
        />
      );
    }
    if (s === "processing") {
      return (
        <Chip
          label={status}
          size="small"
          color="info"
          sx={{ fontWeight: 600, fontSize: 12 }}
        />
      );
    }
    return (
      <Chip
        label={status}
        size="small"
        sx={{ fontWeight: 600, fontSize: 12, backgroundColor: "#e2e8f0" }}
      />
    );
  };

  const handleDownloadErrors = async (item: ImportHistoryItem) => {
    setDownloadingId(item.id);
    try {
      const blob = await downloadFailedRecords(item.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `failed_${item.import_type}_import_${item.id}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewErrors = async (item: ImportHistoryItem) => {
    setSelectedImport(item);
    setOpenDialog(true);
    setLoadingErrors(true);
    try {
      const errors = await getImportErrors(item.id);
      setDialogErrors(errors);
    } catch (err) {
      console.error("Failed to fetch errors:", err);
      setDialogErrors([]);
    } finally {
      setLoadingErrors(false);
    }
  };

  const paginatedHistory = history.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper
      sx={{
        mt: 4,
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      }}
    >
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f1f5f9",
          backgroundColor: "#ffffff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <HistoryIcon sx={{ color: "#7c3aed", fontSize: 26 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
              Import History & Audit Trail
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Chronological log of file imports, batch outcomes, and error reports
            </Typography>
          </Box>
        </Box>

        {onRefresh && (
          <Button
            size="small"
            variant="text"
            onClick={onRefresh}
            sx={{ textTransform: "none", color: "#7c3aed", fontWeight: 600 }}
          >
            Refresh
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, width: 70 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Filename</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Uploaded By</TableCell>
              <TableCell sx={{ fontWeight: 700, align: "right" }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 700, align: "right" }}>Success</TableCell>
              <TableCell sx={{ fontWeight: 700, align: "right" }}>Duplicates</TableCell>
              <TableCell sx={{ fontWeight: 700, align: "right" }}>Failed</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No import history found. Upload a CSV file above to start importing data.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedHistory.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>
                    #{item.id}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={item.import_type.toUpperCase()}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 700,
                        fontSize: 11,
                        textTransform: "uppercase",
                        borderColor:
                          item.import_type === "products"
                            ? "#818cf8"
                            : item.import_type === "customers"
                            ? "#34d399"
                            : "#f472b6",
                        color:
                          item.import_type === "products"
                            ? "#4338ca"
                            : item.import_type === "customers"
                            ? "#065f46"
                            : "#9d174d",
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ fontWeight: 500, color: "#1e293b", maxWidth: 180 }}>
                    <Tooltip title={item.filename}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontSize: 13, fontWeight: 500 }}
                      >
                        {item.filename}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  <TableCell sx={{ color: "#475569", fontSize: 13 }}>
                    {item.uploaded_by_name || `User #${item.uploaded_by}`}
                  </TableCell>

                  <TableCell sx={{ fontWeight: 600 }}>
                    {item.total_records.toLocaleString()}
                  </TableCell>

                  <TableCell sx={{ color: "#047857", fontWeight: 700 }}>
                    {item.successful_records.toLocaleString()}
                  </TableCell>

                  <TableCell sx={{ color: "#b45309", fontWeight: 600 }}>
                    {item.duplicate_records.toLocaleString()}
                  </TableCell>

                  <TableCell
                    sx={{
                      color: item.failed_records > 0 ? "#b91c1c" : "#64748b",
                      fontWeight: item.failed_records > 0 ? 700 : 500,
                    }}
                  >
                    {item.failed_records.toLocaleString()}
                  </TableCell>

                  <TableCell>{getStatusChip(item.status)}</TableCell>

                  <TableCell sx={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                  </TableCell>

                  <TableCell sx={{ textAlign: "center", whiteSpace: "nowrap" }}>
                    <Box sx={{ display: "inline-flex", gap: 0.5 }}>
                      {item.failed_records > 0 || item.duplicate_records > 0 ? (
                        <>
                          <Tooltip title="View error details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewErrors(item)}
                              sx={{ color: "#6366f1" }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Download failed records CSV">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadErrors(item)}
                              disabled={downloadingId === item.id}
                              sx={{ color: "#ef4444" }}
                            >
                              {downloadingId === item.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <DownloadIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 600 }}>
                          Clean
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={history.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      {/* View Errors Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Import #{selectedImport?.id} Error Log
            </Typography>
            <Typography variant="caption" color="text.secondary">
              File: {selectedImport?.filename} ({selectedImport?.import_type}) •{" "}
              {selectedImport?.failed_records} Failed, {selectedImport?.duplicate_records}{" "}
              Duplicates
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpenDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {loadingErrors ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : dialogErrors.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No error records found for this import.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 70 }}>Row</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 110 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Field</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Error Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dialogErrors.map((err, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontWeight: 600 }}>{err.row_number}</TableCell>
                      <TableCell>
                        <Chip
                          label={err.type}
                          size="small"
                          color={err.type === "Duplicate" ? "warning" : "error"}
                          sx={{ fontSize: 11, height: 22, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{err.field || "-"}</TableCell>
                      <TableCell sx={{ color: "#b91c1c", fontWeight: 500 }}>
                        {err.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          {selectedImport && (
            <Button
              startIcon={<DownloadIcon />}
              color="error"
              variant="outlined"
              onClick={() => handleDownloadErrors(selectedImport)}
              disabled={downloadingId === selectedImport.id}
            >
              Download Errors CSV
            </Button>
          )}
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ImportHistory;