import React from "react";
import {
  Box,
  Typography,
  Pagination,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";

interface AuditLogPaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export const AuditLogPagination: React.FC<AuditLogPaginationProps> = ({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}) => {
  if (total === 0) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <Box
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        borderTop: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
      }}
    >
      {/* Left side: Rows per page & showing range */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <FormControl size="small">
            <Select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              sx={{
                height: 32,
                fontSize: "0.875rem",
                borderRadius: "8px",
                "& .MuiSelect-select": { py: 0.5, px: 1.5 },
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Showing <span style={{ fontWeight: 600, color: "#1e293b" }}>{startRecord}</span> to{" "}
          <span style={{ fontWeight: 600, color: "#1e293b" }}>{endRecord}</span> of{" "}
          <span style={{ fontWeight: 600, color: "#1e293b" }}>{total}</span> entries
        </Typography>
      </Box>

      {/* Right side: Page navigation */}
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, newPage) => onPageChange(newPage)}
        color="primary"
        shape="rounded"
        size="small"
        showFirstButton
        showLastButton
        sx={{
          "& .MuiPaginationItem-root": {
            borderRadius: "8px",
          },
          "& .Mui-selected": {
            bgcolor: "#6366f1 !important",
            color: "#ffffff",
          },
        }}
      />
    </Box>
  );
};

export default AuditLogPagination;
