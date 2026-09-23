import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import type { FilterOptions, AuditLogQueryParams } from "../../services/auditLogService";

interface AuditLogFiltersProps {
  filters: AuditLogQueryParams;
  options: FilterOptions;
  onFilterChange: (newFilters: Partial<AuditLogQueryParams>) => void;
  onResetFilters: () => void;
}

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  filters,
  options,
  onFilterChange,
  onResetFilters,
}) => {
  const [datePreset, setDatePreset] = useState<string>("all");

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "all") {
      onFilterChange({ startDate: undefined, endDate: undefined });
    } else if (preset === "today") {
      const todayStr = formatDate(now);
      onFilterChange({ startDate: todayStr, endDate: todayStr });
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      onFilterChange({ startDate: formatDate(past), endDate: formatDate(now) });
    } else if (preset === "30days") {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      onFilterChange({ startDate: formatDate(past), endDate: formatDate(now) });
    }
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.userId ||
      (filters.action && filters.action !== "ALL") ||
      (filters.resourceType && filters.resourceType !== "ALL") ||
      (filters.status && filters.status !== "ALL") ||
      filters.startDate ||
      filters.endDate ||
      filters.sortOrder === "asc"
  );

  return (
    <Paper
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        bgcolor: "#ffffff",
      }}
    >
      {/* Top row: Search and primary selects */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "2fr 1fr 1fr 1fr",
          },
          gap: 2,
          alignItems: "center",
          mb: 2,
        }}
      >
        {/* Search Input */}
        <TextField
          size="small"
          placeholder="Search by user, action, resource, ID, description..."
          value={filters.search || ""}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
              endAdornment: filters.search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onFilterChange({ search: "" })}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              bgcolor: "#f8fafc",
            },
          }}
        />

        {/* User filter */}
        <FormControl size="small">
          <InputLabel id="user-filter-label">User</InputLabel>
          <Select
            labelId="user-filter-label"
            label="User"
            value={filters.userId || ""}
            onChange={(e) =>
              onFilterChange({
                userId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            sx={{ borderRadius: "10px" }}
          >
            <MenuItem value="">All Users</MenuItem>
            {options.users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name} ({u.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action filter */}
        <FormControl size="small">
          <InputLabel id="action-filter-label">Action</InputLabel>
          <Select
            labelId="action-filter-label"
            label="Action"
            value={filters.action || "ALL"}
            onChange={(e) => onFilterChange({ action: e.target.value })}
            sx={{ borderRadius: "10px" }}
          >
            <MenuItem value="ALL">All Actions</MenuItem>
            {options.actions.map((act) => (
              <MenuItem key={act} value={act}>
                {act}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Resource Type filter */}
        <FormControl size="small">
          <InputLabel id="resource-filter-label">Resource</InputLabel>
          <Select
            labelId="resource-filter-label"
            label="Resource"
            value={filters.resourceType || "ALL"}
            onChange={(e) => onFilterChange({ resourceType: e.target.value })}
            sx={{ borderRadius: "10px" }}
          >
            <MenuItem value="ALL">All Resources</MenuItem>
            {options.resourceTypes.map((res) => (
              <MenuItem key={res} value={res}>
                {res}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Second row: Status, Date Presets, Custom Dates, Sort and Reset */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
          {/* Status filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              label="Status"
              value={filters.status || "ALL"}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              sx={{ borderRadius: "10px", height: 36 }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              {options.statuses.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date range presets */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="date-preset-label">Date Range</InputLabel>
            <Select
              labelId="date-preset-label"
              label="Date Range"
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              sx={{ borderRadius: "10px", height: 36 }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          {/* Custom Date Pickers */}
          {datePreset === "custom" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                type="date"
                size="small"
                label="Start Date"
                value={filters.startDate || ""}
                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 145, "& .MuiOutlinedInput-root": { borderRadius: "10px", height: 36 } }}
              />
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                to
              </Typography>
              <TextField
                type="date"
                size="small"
                label="End Date"
                value={filters.endDate || ""}
                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 145, "& .MuiOutlinedInput-root": { borderRadius: "10px", height: 36 } }}
              />
            </Box>
          )}

          {/* Sort order toggle */}
          <FormControl size="small" sx={{ minWidth: 135 }}>
            <InputLabel id="sort-order-label">Sort By</InputLabel>
            <Select
              labelId="sort-order-label"
              label="Sort By"
              value={filters.sortOrder || "desc"}
              onChange={(e) =>
                onFilterChange({ sortOrder: e.target.value as "desc" | "asc" })
              }
              sx={{ borderRadius: "10px", height: 36 }}
            >
              <MenuItem value="desc">Newest First</MenuItem>
              <MenuItem value="asc">Oldest First</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            size="small"
            variant="text"
            startIcon={<FilterAltOffIcon fontSize="small" />}
            onClick={() => {
              setDatePreset("all");
              onResetFilters();
            }}
            sx={{
              color: "#64748b",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.04)" },
            }}
          >
            Reset Filters
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default AuditLogFilters;
