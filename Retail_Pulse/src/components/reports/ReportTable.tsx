import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FilterListIcon from "@mui/icons-material/FilterList";
import DateRangeIcon from "@mui/icons-material/DateRange";
import type { ReportFiltersValue } from "./ReportFilters";

export type ReportRow = Record<string, unknown>;

interface ReportTableProps {
  rows: ReportRow[];
  total: number;
  page: number;
  totalPages: number;
  filters: ReportFiltersValue;
  onPageChange: (page: number) => void;
  onExport: (format: "CSV" | "PDF") => void;
  exportingFormat: string | null;
}

const ReportTable: React.FC<ReportTableProps> = ({
  rows,
  total,
  page,
  totalPages,
  filters,
  onPageChange,
  onExport,
  exportingFormat,
}) => {
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const columns = useMemo(
    () => (rows.length > 0 ? Object.keys(rows[0]) : []),
    [rows]
  );

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;

    return [...rows].sort((a, b) => {
      const first = a[sortKey];
      const second = b[sortKey];

      let result = 0;
      if (typeof first === "number" && typeof second === "number") {
        result = first - second;
      } else {
        result = String(first ?? "").localeCompare(
          String(second ?? ""),
          undefined,
          { numeric: true, sensitivity: "base" }
        );
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [rows, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Format header display label (camelCase to Title Case)
  const formatHeader = (key: string) => {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  // Format cell value
  const formatValue = (key: string, val: unknown) => {
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "number") {
      if (key.toLowerCase().includes("amount") || key.toLowerCase().includes("revenue")) {
        return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return val.toLocaleString();
    }
    return String(val);
  };

  // Build active filter summary chips
  const filterChips = useMemo(() => {
    const chips: { label: string; icon?: React.ReactElement }[] = [];
    if (filters.fromDate || filters.toDate) {
      chips.push({
        label: `Period: ${filters.fromDate || "Start"} → ${filters.toDate || "Present"}`,
        icon: <DateRangeIcon fontSize="small" />,
      });
    } else {
      chips.push({
        label: "Period: All Time",
        icon: <DateRangeIcon fontSize="small" />,
      });
    }

    if (filters.productId) chips.push({ label: `Product ID: ${filters.productId}` });
    if (filters.categoryId) chips.push({ label: `Category ID: ${filters.categoryId}` });
    if (filters.brand) chips.push({ label: `Brand: ${filters.brand}` });
    if (filters.customerId) chips.push({ label: `Customer ID: ${filters.customerId}` });
    if (filters.salesStatus) chips.push({ label: `Status: ${filters.salesStatus}` });
    if (filters.stockStatus) chips.push({ label: `Stock Status: ${filters.stockStatus}` });

    return chips;
  }, [filters]);

  if (rows.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography color="text.secondary" variant="body1">
          No records found matching the applied filters.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filter and Period Context Bar */}
      <Box
        sx={{
          p: 1.5,
          mb: 2.5,
          bgcolor: "#f8fafc",
          borderRadius: 1.5,
          border: "1px solid #e2e8f0",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", mr: 0.5, color: "#64748b" }}>
            <FilterListIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption" fontWeight={600} textTransform="uppercase">
              Applied Context:
            </Typography>
          </Box>
          {filterChips.map((chip, idx) => (
            <Chip
              key={idx}
              size="small"
              icon={chip.icon}
              label={chip.label}
              variant="outlined"
              sx={{ bgcolor: "#ffffff", borderColor: "#cbd5e1", fontSize: "0.75rem" }}
            />
          ))}
        </Stack>

        {/* Export Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={
              exportingFormat === "CSV" ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <FileDownloadIcon />
              )
            }
            onClick={() => onExport("CSV")}
            disabled={exportingFormat !== null}
            sx={{
              borderColor: "#0284c7",
              color: "#0284c7",
              "&:hover": { borderColor: "#0369a1", bgcolor: "#f0f9ff" },
            }}
          >
            Export CSV
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={
              exportingFormat === "PDF" ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PictureAsPdfIcon />
              )
            }
            onClick={() => onExport("PDF")}
            disabled={exportingFormat !== null}
            sx={{
              bgcolor: "#dc2626",
              "&:hover": { bgcolor: "#b91c1c" },
            }}
          >
            Export PDF
          </Button>
        </Stack>
      </Box>

      {/* Structured Table */}
      <TableContainer
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: 2,
          overflowX: "auto",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f1f5f9" }}>
              {columns.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 700, color: "#334155" }}>
                  <TableSortLabel
                    active={sortKey === column}
                    direction={sortKey === column ? sortDirection : "asc"}
                    onClick={() => handleSort(column)}
                  >
                    {formatHeader(column)}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedRows.map((row, index) => (
              <TableRow
                hover
                key={index}
                sx={{
                  "&:nth-of-type(even)": { bgcolor: "#fbfcfe" },
                  "&:hover": { bgcolor: "#f5f3ff !important" },
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column} sx={{ color: "#1e293b", py: 1.25 }}>
                    {formatValue(column, row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Table Footer with Total Count & Pagination */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2.5,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {rows.length} of {total} records
        </Typography>

        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, selectedPage) => onPageChange(selectedPage)}
            sx={{
              "& .Mui-selected": {
                bgcolor: "#7c3aed !important",
                color: "#fff",
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ReportTable;