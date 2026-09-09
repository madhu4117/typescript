import React, { useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Tabs,
  Tab,
  Tooltip,
  TablePagination,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";

import type { PreviewRow } from "../../services/dataImportService";

interface Props {
  rows: PreviewRow[];
  requiredColumns?: string[];
  detectedColumns?: string[];
}

const CSVPreview: React.FC<Props> = ({
  rows,
  requiredColumns = [],
  detectedColumns = [],
}) => {
  const [filterTab, setFilterTab] = useState<"all" | "valid" | "invalid" | "duplicate">("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!rows.length) {
    return null;
  }

  // Get detected data column keys from first row
  const columns = Object.keys(rows[0].data);

  // Filter rows based on active tab
  const filteredRows = rows.filter((row) => {
    if (filterTab === "valid") return row.valid;
    if (filterTab === "invalid") return !row.valid && !row.duplicate;
    if (filterTab === "duplicate") return row.duplicate;
    return true;
  });

  const validCount = rows.filter((r) => r.valid).length;
  const duplicateCount = rows.filter((r) => r.duplicate).length;
  const invalidCount = rows.filter((r) => !r.valid && !r.duplicate).length;

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRows = filteredRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper
      sx={{
        mt: 3,
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header & Column Detection */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: "1px solid #f1f5f9",
          backgroundColor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
              Data Preview & Column Verification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review mapped records and verify detected headers before confirming import.
            </Typography>
          </Box>

          <Chip
            icon={<ViewColumnIcon />}
            label={`${columns.length} Columns Detected • ${rows.length} Total Rows`}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 600, borderColor: "#cbd5e1", color: "#475569" }}
          />
        </Box>

        {/* Required vs Detected Columns Chips */}
        {requiredColumns.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", mr: 0.5 }}>
              Required Columns:
            </Typography>
            {requiredColumns.map((col) => {
              const matched = detectedColumns.some(
                (d) =>
                  d.toLowerCase().replace(/[\s_]/g, "") ===
                  col.toLowerCase().replace(/[\s_]/g, "")
              ) || columns.some(
                (c) =>
                  c.toLowerCase().replace(/[\s_]/g, "") ===
                  col.toLowerCase().replace(/[\s_]/g, "")
              );

              return (
                <Chip
                  key={col}
                  size="small"
                  label={col}
                  color={matched ? "success" : "error"}
                  variant={matched ? "outlined" : "filled"}
                  icon={matched ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
                  sx={{ fontSize: 12, height: 26 }}
                />
              );
            })}
          </Box>
        )}
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, backgroundColor: "#f8fafc" }}>
        <Tabs
          value={filterTab}
          onChange={(_, val) => {
            setFilterTab(val);
            setPage(0);
          }}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 44,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 44,
              fontSize: 14,
            },
          }}
        >
          <Tab value="all" label={`All Records (${rows.length})`} />
          <Tab
            value="valid"
            label={`Valid (${validCount})`}
            sx={{ color: validCount > 0 ? "#10b981 !important" : undefined }}
          />
          <Tab
            value="invalid"
            label={`Invalid (${invalidCount})`}
            sx={{ color: invalidCount > 0 ? "#ef4444 !important" : undefined }}
          />
          <Tab
            value="duplicate"
            label={`Duplicates (${duplicateCount})`}
            sx={{ color: duplicateCount > 0 ? "#f59e0b !important" : undefined }}
          />
        </Tabs>
      </Box>

      {/* Preview Table */}
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, backgroundColor: "#f1f5f9", width: 60 }}>
                #
              </TableCell>
              <TableCell sx={{ fontWeight: 700, backgroundColor: "#f1f5f9", width: 110 }}>
                Status
              </TableCell>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{ fontWeight: 700, backgroundColor: "#f1f5f9", whiteSpace: "nowrap" }}
                >
                  {column}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 700, backgroundColor: "#f1f5f9", minWidth: 200 }}>
                Validation Notes
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 3} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No records found matching filter "{filterTab}".
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                const isDup = row.duplicate;
                const isValid = row.valid;
                const rowBg = isDup
                  ? "rgba(245, 158, 11, 0.08)"
                  : !isValid
                  ? "rgba(239, 68, 68, 0.08)"
                  : "inherit";

                return (
                  <TableRow
                    key={row.row_number}
                    sx={{
                      backgroundColor: rowBg,
                      "&:hover": {
                        backgroundColor: isDup
                          ? "rgba(245, 158, 11, 0.15)"
                          : !isValid
                          ? "rgba(239, 68, 68, 0.15)"
                          : "#f8fafc",
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: "#64748b" }}>
                      {row.row_number}
                    </TableCell>

                    <TableCell>
                      {isDup ? (
                        <Chip
                          icon={<WarningAmberIcon />}
                          label="Duplicate"
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 600, height: 24 }}
                        />
                      ) : isValid ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Valid"
                          size="small"
                          color="success"
                          sx={{ fontWeight: 600, height: 24 }}
                        />
                      ) : (
                        <Chip
                          icon={<ErrorOutlineIcon />}
                          label="Invalid"
                          size="small"
                          color="error"
                          sx={{ fontWeight: 600, height: 24 }}
                        />
                      )}
                    </TableCell>

                    {columns.map((column) => (
                      <TableCell
                        key={column}
                        sx={{
                          whiteSpace: "nowrap",
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <Tooltip title={String(row.data[column] ?? "")}>
                          <span>{String(row.data[column] ?? "")}</span>
                        </Tooltip>
                      </TableCell>
                    ))}

                    <TableCell>
                      {row.errors && row.errors.length > 0 ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                          {row.errors.map((err, i) => (
                            <Typography
                              key={i}
                              variant="caption"
                              sx={{
                                color: isDup ? "#b45309" : "#b91c1c",
                                fontWeight: 500,
                                display: "block",
                              }}
                            >
                              • {err}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: "#059669", fontWeight: 500 }}>
                          Ready to import
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default CSVPreview;