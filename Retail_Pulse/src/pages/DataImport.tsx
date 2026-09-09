import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Alert,
  Paper,
  Divider,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SecurityIcon from "@mui/icons-material/Security";
import { useNavigate } from "react-router-dom";

import ImportTypeSelector from "../components/dataImport/ImportTypeSelector";
import CSVUpload from "../components/dataImport/CSVUpload";
import CSVPreview from "../components/dataImport/CSVPreview";
import ValidationSummary from "../components/dataImport/ValidationSummary";
import ImportProgress from "../components/dataImport/ImportProgress";
import ImportResult from "../components/dataImport/ImportResult";
import ImportHistory from "../components/dataImport/ImportHistory";

import {
  previewCSV,
  importCSV,
  getImportHistory,
} from "../services/dataImportService";

import type {
  ImportType,
  ImportPreviewResponse,
  ImportResultResponse,
  ImportHistoryItem,
} from "../services/dataImportService";

const DataImport: React.FC = () => {
  const navigate = useNavigate();

  const [importType, setImportType] = useState<ImportType>("products");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportResultResponse | null>(null);
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  /* =====================================================
     CHECK USER ROLE & ACCESS (Requirement 14)
  ===================================================== */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setIsAdmin(false);
      return;
    }
    try {
      const user = JSON.parse(storedUser);
      const role = (user.role || "").toLowerCase();
      const adminAllowed = ["company admin", "admin", "super admin"].includes(role);
      setIsAdmin(adminAllowed);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  /* =====================================================
     LOAD HISTORY
  ===================================================== */
  const loadHistory = async () => {
    try {
      const data = await getImportHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load import history:", err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadHistory();
    }
  }, [isAdmin]);

  /* =====================================================
     TYPE & FILE HANDLERS
  ===================================================== */
  const handleTypeChange = (newType: ImportType) => {
  setImportType(newType);
  setFile(null);
  setPreview(null);
  setResult(null);
  setError("");
};

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setPreview(null);
    setResult(null);
    setError("");
  };

  /* =====================================================
     PREVIEW & VALIDATE
  ===================================================== */
  const handlePreview = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setLoadingPreview(true);
    setError("");
    setPreview(null);
    setResult(null);

    try {
      const data = await previewCSV(importType, file);
      setPreview(data);
    } catch (err: any) {
      console.error("Preview error:", err);
      setError(
        err?.response?.data?.detail ||
          "Failed to preview and validate CSV file. Please check file format."
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  /* =====================================================
     IMPORT
  ===================================================== */
  const handleImport = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    if (!preview) {
      setError("Please preview and validate the CSV before starting import.");
      return;
    }

    if (preview.valid_records === 0) {
      setError("Cannot start import: there are no valid records to import.");
      return;
    }

    setLoadingImport(true);
    setError("");
    setResult(null);

    try {
      const data = await importCSV(importType, file);
      setResult(data);
      await loadHistory();

      // Scroll smoothly to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: any) {
      console.error("Import error:", err);
      setError(
        err?.response?.data?.detail ||
          "An error occurred while importing data. Please review file contents."
      );
    } finally {
      setLoadingImport(false);
    }
  };

  /* =====================================================
     RESET
  ===================================================== */
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  // If user is not an admin, display access restricted message
  if (isAdmin === false) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 4,
            border: "1px solid #fee2e2",
            backgroundColor: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <SecurityIcon sx={{ fontSize: 64, color: "#ef4444", mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", mb: 1 }}>
            Access Restricted: Admin Only
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: "auto" }}>
            The Data Import and Integration module is strictly restricted to authorized
            administrators. Please contact your company administrator if you require access.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/dashboard")}
            sx={{
              backgroundColor: "#7c3aed",
              "&:hover": { backgroundColor: "#6d28d9" },
              textTransform: "none",
              borderRadius: 2,
              px: 3,
            }}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 1, md: 3 } }}>
      {/* =================================================
          PAGE HEADER
      ================================================= */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
              }}
            >
              <CloudUploadIcon />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a" }}>
              Data Import & Integration
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 6.5 }}>
            Seamlessly import Products, Customers, and Sales Transactions using CSV files with
            instant validation, duplicate detection, and audit history.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadHistory}
          sx={{
            color: "#7c3aed",
            borderColor: "#c4b5fd",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 2,
            "&:hover": {
              borderColor: "#7c3aed",
              backgroundColor: "#faf5ff",
            },
          }}
        >
          Refresh History
        </Button>
      </Box>

      {/* =================================================
          GLOBAL ERROR ALERT
      ================================================= */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 3, borderRadius: 2.5, fontWeight: 500 }}
        >
          {error}
        </Alert>
      )}

      {/* =================================================
          IMPORT CONFIGURATION CARD (STEP 1)
      ================================================= */}
      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
              Step 1: Select Import Module & Upload CSV
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Choose the entity type you wish to populate and upload a compatible CSV spreadsheet.
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#334155" }}>
              1. Import Module
            </Typography>
            <ImportTypeSelector value={importType} onChange={handleTypeChange} />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#334155" }}>
              2. Upload CSV File
            </Typography>
            <CSVUpload
              file={file}
              importType={importType}
              onFileSelect={handleFileSelect}
            />
          </Box>
        </Box>

        {/* Preview Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: 3,
            pt: 2.5,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            disabled={loadingPreview || loadingImport}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              borderColor: "#cbd5e1",
              color: "#475569",
            }}
          >
            Reset
          </Button>

          <Button
            variant="contained"
            onClick={handlePreview}
            disabled={!file || loadingPreview || loadingImport}
            sx={{
              backgroundColor: "#7c3aed",
              "&:hover": { backgroundColor: "#6d28d9" },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
            }}
          >
            {loadingPreview ? "Validating..." : "Preview & Validate CSV"}
          </Button>
        </Box>

        {/* Progress bars */}
        <ImportProgress
          loading={loadingPreview}
          message="Reading file headers, validating records, and checking database duplicates..."
          activeStep={1}
        />
        <ImportProgress
          loading={loadingImport}
          message="Processing records in database transaction savepoints..."
          activeStep={2}
        />
      </Paper>

      {/* =================================================
          VALIDATION & PREVIEW (STEP 2)
      ================================================= */}
      {preview && (
        <Box sx={{ mt: 3.5 }}>
          {/* Validation KPI Summary */}
          <ValidationSummary
            total={preview.total_records}
            valid={preview.valid_records}
            invalid={preview.invalid_records}
            duplicate={preview.duplicate_records}
          />

          {/* Table Preview */}
          <CSVPreview
            rows={preview.rows}
            requiredColumns={preview.required_columns}
            detectedColumns={preview.detected_columns}
          />

          {/* Confirm & Start Import Button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 2,
              mt: 3,
              p: 2.5,
              backgroundColor: "#ffffff",
              borderRadius: 3,
              border: "1px solid #e2e8f0",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {preview.valid_records > 0
                ? `${preview.valid_records} valid record(s) will be committed into the database.`
                : "No valid records available for import. Fix the CSV and re-upload."}
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={handleImport}
              disabled={loadingImport || preview.valid_records === 0}
              sx={{
                backgroundColor: "#10b981",
                "&:hover": { backgroundColor: "#059669" },
                px: 4,
                py: 1.2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: 15,
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              {loadingImport
                ? "Processing Import..."
                : `Import ${preview.valid_records} Valid Records`}
            </Button>
          </Box>
        </Box>
      )}

      {/* =================================================
          IMPORT OUTCOME / RESULT (STEP 3)
      ================================================= */}
      <div ref={resultRef}>
        <ImportResult result={result} />
      </div>

      <Divider sx={{ my: 4 }} />

      {/* =================================================
          IMPORT HISTORY TABLE (STEP 4)
      ================================================= */}
      <ImportHistory history={history} onRefresh={loadHistory} />
    </Container>
  );
};

export default DataImport;