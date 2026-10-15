import React, { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HistoryIcon from "@mui/icons-material/History";

import ReportFilters, {
  type ReportFiltersValue,
} from "./ReportFilters";
import ReportTable from "./ReportTable";
import ScheduledReports from "./ScheduledReports";
import ReportHistory from "./ReportHistory";

import {
  generateReport,
  exportReport,
  type ReportResponse,
} from "../../services/reportService";

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Report Generator State
  const [reportType, setReportType] = useState("sales");
  const [filters, setFilters] = useState<ReportFiltersValue>({});
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const limit = 20;

  const runReport = async (
    selectedPage = 1,
    typeOverride?: string,
    filtersOverride?: ReportFiltersValue
  ) => {
    const curType = typeOverride || reportType;
    const curFilters = filtersOverride !== undefined ? filtersOverride : filters;

    if (
      curFilters.fromDate &&
      curFilters.toDate &&
      curFilters.fromDate > curFilters.toDate
    ) {
      setError("From Date cannot be later than To Date.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await generateReport(
        curType,
        curFilters,
        selectedPage,
        limit
      );

      setReport(result);
      setPage(selectedPage);
    } catch (err: any) {
      console.error("Report generation failed:", err);
      setError(
        err?.response?.data?.detail ||
          "Unable to generate the report. Please try again."
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "CSV" | "PDF") => {
    try {
      setExportingFormat(format);
      setError("");
      await exportReport(reportType, filters, format);
      setSnackbarMessage(`Report exported as ${format} successfully!`);
    } catch (err: any) {
      console.error("Export failed:", err);
      setError(err?.response?.data?.detail || `Failed to export ${format} file.`);
    } finally {
      setExportingFormat(null);
    }
  };

  const resetFilters = () => {
    setFilters({});
    setReport(null);
    setPage(1);
    setError("");
  };

  const handleViewFromHistory = (type: string, historyFilters: Record<string, any>) => {
    setReportType(type);
    setFilters(historyFilters);
    setActiveTab(0);
    void runReport(1, type, historyFilters);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: "#1e293b" }}>
          Reporting & Scheduled Reports
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Centralized business intelligence, data exports, and automated recurring delivery.
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "0.95rem",
              textTransform: "none",
              minHeight: 48,
            },
            "& .Mui-selected": {
              color: "#7c3aed !important",
            },
            "& .MuiTabs-indicator": {
              bgcolor: "#7c3aed",
              height: 3,
            },
          }}
        >
          <Tab icon={<AssessmentIcon fontSize="small" />} iconPosition="start" label="Generate Reports" />
          <Tab icon={<ScheduleIcon fontSize="small" />} iconPosition="start" label="Scheduled Reports" />
          <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Report History" />
        </Tabs>
      </Box>

      {/* Global Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* TAB 0: GENERATE REPORTS */}
      {activeTab === 0 && (
        <Box>
          <Card
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: "#334155" }}>
                Filter & Configure Report
              </Typography>

              <ReportFilters
                reportType={reportType}
                filters={filters}
                onReportTypeChange={(value) => {
                  setReportType(value);
                  setReport(null);
                  setPage(1);
                }}
                onFiltersChange={setFilters}
                onGenerate={() => runReport(1)}
                onReset={resetFilters}
                loading={loading}
              />
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 2,
              boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ color: "#334155" }}>
                  {report?.reportName ?? "Report Results"}
                </Typography>

                {report && (
                  <Typography variant="caption" color="text.secondary">
                    Generated: {new Date(report.generatedAt).toLocaleString()}
                  </Typography>
                )}
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress sx={{ color: "#7c3aed" }} />
                </Box>
              ) : report ? (
                <ReportTable
                  rows={report.items}
                  total={report.total}
                  page={page}
                  totalPages={report.totalPages}
                  filters={filters}
                  onPageChange={(selectedPage) => runReport(selectedPage)}
                  onExport={handleExport}
                  exportingFormat={exportingFormat}
                />
              ) : (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <AssessmentIcon sx={{ fontSize: 54, color: "#cbd5e1", mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Ready to generate report
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Select a report type, adjust the relevant filters above, and click Generate Report.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* TAB 1: SCHEDULED REPORTS */}
      {activeTab === 1 && <ScheduledReports />}

      {/* TAB 2: REPORT HISTORY */}
      {activeTab === 2 && (
        <ReportHistory onViewReport={handleViewFromHistory} />
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Reports;