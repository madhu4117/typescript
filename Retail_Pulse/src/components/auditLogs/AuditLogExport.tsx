import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";

import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableChartIcon from "@mui/icons-material/TableChart";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import auditLogService from "../../services/auditLogService";
import type { AuditLogQueryParams } from "../../services/auditLogService";

interface AuditLogExportProps {
  filters: AuditLogQueryParams;
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
}

export const AuditLogExport: React.FC<AuditLogExportProps> = ({
  filters,
  onError,
  onSuccess,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const menuOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format: "csv" | "pdf") => {
    handleClose();
    setExporting(format);

    try {
      const blob = await auditLogService.exportAuditLogs(
        format,
        filters
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);

      link.download = `audit_logs_${timestamp}.${format}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      if (onSuccess) {
        onSuccess(
          `Audit logs exported successfully as ${format.toUpperCase()}`
        );
      }
    } catch (error) {
      console.error(
        `Failed to export audit logs as ${format}:`,
        error
      );

      if (onError) {
        onError(
          `Failed to export audit logs as ${format.toUpperCase()}`
        );
      }
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      {/* Export Button */}
      <Button
        variant="outlined"
        onClick={handleClick}
        disabled={Boolean(exporting)}
        startIcon={
          exporting ? (
            <CircularProgress
              size={16}
              color="inherit"
            />
          ) : (
            <FileDownloadIcon fontSize="small" />
          )
        }
        sx={{
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 600,
          color: "#334155",
          borderColor: "#cbd5e1",
          backgroundColor: "#ffffff",

          "&:hover": {
            borderColor: "#94a3b8",
            backgroundColor: "#f8fafc",
          },

          "&:disabled": {
            color: "#94a3b8",
            borderColor: "#e2e8f0",
          },
        }}
      >
        {exporting
          ? `Exporting ${exporting.toUpperCase()}...`
          : "Export Logs"}
      </Button>

      {/* Export Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        transformOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0",
              minWidth: 180,
            },
          },
        }}
      >
        {/* CSV */}
        <MenuItem
          onClick={() => handleExport("csv")}
          sx={{
            py: 1,
            px: 2,
          }}
        >
          <ListItemIcon
            sx={{
              color: "#16a34a",
              minWidth: 36,
            }}
          >
            <TableChartIcon fontSize="small" />
          </ListItemIcon>

          <ListItemText
            primary="Export as CSV"
            slotProps={{
              primary: {
                sx: {
                  fontSize: "0.875rem",
                  fontWeight: 500,
                },
              },
            }}
          />
        </MenuItem>

        {/* PDF */}
        <MenuItem
          onClick={() => handleExport("pdf")}
          sx={{
            py: 1,
            px: 2,
          }}
        >
          <ListItemIcon
            sx={{
              color: "#dc2626",
              minWidth: 36,
            }}
          >
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>

          <ListItemText
            primary="Export as PDF"
            slotProps={{
              primary: {
                sx: {
                  fontSize: "0.875rem",
                  fontWeight: 500,
                },
              },
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default AuditLogExport;