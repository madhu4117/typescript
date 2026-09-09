import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import type { ImportType } from "../../services/dataImportService";
import { downloadSampleTemplate } from "../../services/dataImportService";

interface Props {
  file: File | null;
  importType: ImportType;
  onFileSelect: (file: File | null) => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const CSVUpload: React.FC<Props> = ({
  file,
  importType,
  onFileSelect,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateAndSelectFile = (selectedFile: File) => {
    setUploadError(null);

    // 1. File extension validation
    const nameLower = selectedFile.name.toLowerCase();
    if (!nameLower.endsWith(".csv")) {
      setUploadError(
        `Invalid file type: "${selectedFile.name}". Only comma-separated (.csv) files are supported.`
      );
      onFileSelect(null);
      return;
    }

    // 2. File size validation
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(
        `File size exceeds 10MB limit (${formatFileSize(selectedFile.size)}). Please upload a smaller CSV file.`
      );
      onFileSelect(null);
      return;
    }

    // 3. Non-empty check
    if (selectedFile.size === 0) {
      setUploadError(
        `The selected file "${selectedFile.name}" is empty (0 bytes).`
      );
      onFileSelect(null);
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      validateAndSelectFile(selectedFile);
    }
    // Reset input value so re-selecting same file fires change event
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    setUploadError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await downloadSampleTemplate(importType);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${importType}_template.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download template:", err);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {uploadError && (
        <Alert
          severity="error"
          onClose={() => setUploadError(null)}
          sx={{ borderRadius: 2 }}
        >
          {uploadError}
        </Alert>
      )}

      <Paper
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 3,
          textAlign: "center",
          border: "2px dashed",
          borderColor: dragActive ? "#7c3aed" : file ? "#10b981" : "#d1d5db",
          borderRadius: 3,
          backgroundColor: dragActive
            ? "#f5f3ff"
            : file
            ? "#f0fdf4"
            : "#fafafa",
          transition: "all 0.2s ease-in-out",
          cursor: "pointer",
        }}
        onClick={() => {
          if (!file) {
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={handleFileChange}
        />

        {!file ? (
          <Box>
            <CloudUploadIcon
              sx={{
                fontSize: 48,
                color: dragActive ? "#7c3aed" : "#9ca3af",
                mb: 1,
              }}
            />

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "#1f2937", mb: 0.5 }}
            >
              Drag and drop your CSV file here, or click to browse
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Supports CSV files up to 10MB. Verify column headers before importing.
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                sx={{
                  backgroundColor: "#7c3aed",
                  "&:hover": { backgroundColor: "#6d28d9" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Browse Files
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadTemplate();
                }}
                disabled={downloadingTemplate}
                sx={{
                  color: "#4b5563",
                  borderColor: "#d1d5db",
                  "&:hover": {
                    borderColor: "#7c3aed",
                    backgroundColor: "#f5f3ff",
                    color: "#7c3aed",
                  },
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                {downloadingTemplate
                  ? "Downloading..."
                  : `Download ${importType} template`}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  backgroundColor: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <InsertDriveFileIcon sx={{ color: "#10b981", fontSize: 28 }} />
              </Box>

              <Box sx={{ textAlign: "left" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#111827" }}
                  >
                    {file.name}
                  </Typography>
                  <CheckCircleIcon
                    sx={{ color: "#10b981", fontSize: 18 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.size)} • Ready for preview & validation
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => inputRef.current?.click()}
                sx={{
                  textTransform: "none",
                  color: "#7c3aed",
                  fontWeight: 600,
                }}
              >
                Change File
              </Button>

              <Tooltip title="Remove file">
                <IconButton
                  onClick={handleRemoveFile}
                  size="small"
                  sx={{
                    color: "#ef4444",
                    "&:hover": { backgroundColor: "#fee2e2" },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CSVUpload;