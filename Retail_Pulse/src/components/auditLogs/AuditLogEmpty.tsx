import React from "react";
import { Box, Typography, Button, TableCell, TableRow } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

interface AuditLogEmptyProps {
  hasFilters?: boolean;
  onResetFilters?: () => void;
  colSpan?: number;
}

export const AuditLogEmpty: React.FC<AuditLogEmptyProps> = ({
  hasFilters = false,
  onResetFilters,
  colSpan = 8,
}) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 9, border: "none" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: 420,
            mx: "auto",
          }}
        >
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              bgcolor: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              color: "#94a3b8",
            }}
          >
            {hasFilters ? (
              <FilterAltOffIcon sx={{ fontSize: 36 }} />
            ) : (
              <SearchOffIcon sx={{ fontSize: 36 }} />
            )}
          </Box>

          <Typography
            variant="h6"
            sx={{ color: "#1e293b", fontWeight: 700, mb: 0.75, fontSize: "1.1rem" }}
          >
            {hasFilters
              ? "No activity found for the selected filters."
              : "No audit records recorded yet"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: hasFilters && onResetFilters ? 2.5 : 0 }}
          >
            {hasFilters
              ? "Try adjusting your search keywords, clearing status/action filters, or selecting a broader date range."
              : "As users and administrators perform actions like creating products, adjusting stock, or logging in, records will appear here automatically."}
          </Typography>

          {hasFilters && onResetFilters && (
            <Button
              variant="outlined"
              size="small"
              onClick={onResetFilters}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                color: "#6366f1",
                borderColor: "#c7d2fe",
                "&:hover": {
                  borderColor: "#6366f1",
                  bgcolor: "rgba(99, 102, 241, 0.04)",
                },
              }}
            >
              Clear All Filters
            </Button>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default AuditLogEmpty;
