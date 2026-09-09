import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import type { ImportResultResponse } from "../../services/dataImportService";
import { downloadFailedRecords } from "../../services/dataImportService";

interface Props {
  result: ImportResultResponse | null;
}

const ImportResult: React.FC<Props> = ({ result }) => {
  const [downloading, setDownloading] = useState(false);
  const [showErrorTable, setShowErrorTable] = useState(false);

  if (!result) {
    return null;
  }

  const isFullSuccess = result.status.toLowerCase() === "completed";
  const isPartialSuccess = result.status.toLowerCase().includes("error");
  const hasFailures = result.failed_records > 0 || result.duplicate_records > 0;

  const handleDownloadErrors = async () => {
    setDownloading(true);
    try {
      const blob = await downloadFailedRecords(result.import_id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `failed_${result.import_type}_import_${result.import_id}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download error records:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Paper
      sx={{
        mt: 3,
        p: 3.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: isFullSuccess
          ? "#a7f3d0"
          : isPartialSuccess
          ? "#fde68a"
          : "#fecaca",
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
      }}
    >
      {/* Banner */}
      <Alert
        icon={
          isFullSuccess ? (
            <CheckCircleIcon fontSize="inherit" />
          ) : isPartialSuccess ? (
            <WarningAmberIcon fontSize="inherit" />
          ) : (
            <ErrorOutlineIcon fontSize="inherit" />
          )
        }
        severity={isFullSuccess ? "success" : isPartialSuccess ? "warning" : "error"}
        sx={{
          borderRadius: 2,
          fontWeight: 600,
          fontSize: 16,
          "& .MuiAlert-icon": { fontSize: 24 },
        }}
      >
        Import {result.status} — {result.filename} ({result.import_type})
      </Alert>

      {/* Metrics Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          mt: 3,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Total Records
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#1e293b", mt: 0.5 }}>
            {result.total_records.toLocaleString()}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
          }}
        >
          <Typography variant="body2" sx={{ color: "#065f46", fontWeight: 500 }}>
            Successfully Added
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#047857", mt: 0.5 }}>
            {result.successful_records.toLocaleString()}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
          }}
        >
          <Typography variant="body2" sx={{ color: "#92400e", fontWeight: 500 }}>
            Duplicates Flagged
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#b45309", mt: 0.5 }}>
            {result.duplicate_records.toLocaleString()}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
          }}
        >
          <Typography variant="body2" sx={{ color: "#991b1b", fontWeight: 500 }}>
            Failed Records
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#b91c1c", mt: 0.5 }}>
            {result.failed_records.toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons for Errors */}
      {hasFailures && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mt: 3,
            pt: 2.5,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowErrorTable(!showErrorTable)}
              endIcon={
                showErrorTable ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
              }
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#475569",
                borderColor: "#cbd5e1",
              }}
            >
              {showErrorTable
                ? "Hide Failure Details"
                : `View Failure Details (${result.errors.length})`}
            </Button>
          </Box>

          <Button
            variant="contained"
            color="error"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadErrors}
            disabled={downloading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              backgroundColor: "#ef4444",
              "&:hover": { backgroundColor: "#dc2626" },
            }}
          >
            {downloading ? "Preparing Download..." : "Download Failed Records CSV"}
          </Button>
        </Box>
      )}

      {/* Expandable Errors Table */}
      <Collapse in={showErrorTable && result.errors.length > 0}>
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
            Detailed Error Log
          </Typography>

          <TableContainer
            sx={{
              maxHeight: 300,
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              overflow: "auto",
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: "#f8fafc" }}>
                    Row #
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: "#f8fafc" }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: "#f8fafc" }}>
                    Field
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: "#f8fafc" }}>
                    Reason / Error Message
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.errors.map((err, idx) => (
                  <TableRow key={idx}>
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
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ImportResult;