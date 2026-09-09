import React, { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

import { downloadFailedRecords } from "../../services/dataImportService";

interface Props {
  importId: number | null;
}

const FailedRecords: React.FC<Props> = ({ importId }) => {
  const [loading, setLoading] = useState(false);

  if (!importId) {
    return null;
  }

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await downloadFailedRecords(importId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `failed_records_import_${importId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download records:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      color="error"
      startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
      onClick={handleDownload}
      disabled={loading}
      sx={{
        mt: 2,
        fontWeight: 600,
        textTransform: "none",
        borderRadius: 2,
      }}
    >
      {loading ? "Downloading..." : "Download Failed Records (.csv)"}
    </Button>
  );
};

export default FailedRecords;