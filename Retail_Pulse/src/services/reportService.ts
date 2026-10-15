import api from "./api";

export interface ReportFilters {
  fromDate?: string;
  toDate?: string;
  productId?: number;
  categoryId?: number;
  brand?: string;
  customerId?: number;
  salesStatus?: string;
  stockStatus?: string;
  userId?: number;
  customerType?: string;
  customerSegment?: string;
}

export interface ReportResponse {
  reportType: string;
  reportName: string;
  filters: ReportFilters;
  items: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  generatedAt: string;
}

export interface ReportHistoryItem {
  id: number;
  companyId: number;
  userId: number;
  generatedBy?: string;
  reportType: string;
  reportName: string;
  filters?: string;
  format: string;
  status: string;
  filePath?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ScheduledReportItem {
  id: number;
  companyId: number;
  createdBy: number;
  reportType: string;
  filters?: any;
  frequency: string;
  executionTime: string;
  recipients: string[] | string;
  exportFormat: string;
  isActive: boolean;
  lastRunAt?: string | null;
  lastStatus?: string | null;
  lastError?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const generateReport = async (
  reportType: string,
  filters: ReportFilters,
  page = 1,
  limit = 20
): Promise<ReportResponse> => {
  const response = await api.post<ReportResponse>(
    `/reports/generate?page=${page}&limit=${limit}`,
    {
      reportType,
      filters,
    }
  );
  return response.data;
};

export const exportReport = async (
  reportType: string,
  filters: ReportFilters,
  format: "CSV" | "PDF"
): Promise<void> => {
  const response = await api.post(
    "/reports/export",
    {
      reportType,
      filters,
      format,
    },
    {
      responseType: "blob",
    }
  );

  // Extract filename from Content-Disposition if present
  let filename = `${reportType}_report.${format.toLowerCase()}`;
  const disposition = response.headers["content-disposition"];
  if (disposition) {
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  const blob = new Blob([response.data], {
    type: format === "CSV" ? "text/csv;charset=utf-8;" : "application/pdf",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getReportHistory = async (
  page = 1,
  limit = 20
): Promise<{ items: ReportHistoryItem[]; total: number; page: number; limit: number; totalPages: number }> => {
  const response = await api.get(`/reports/history?page=${page}&limit=${limit}`);
  return response.data;
};

export const downloadHistoryReport = async (
  historyId: number,
  reportName: string,
  format: string
): Promise<void> => {
  const response = await api.get(`/reports/history/${historyId}/download`, {
    responseType: "blob",
  });

  const ext = format.toLowerCase().includes("pdf") ? "pdf" : "csv";
  let filename = `${reportName.replace(/\s+/g, "_")}_${historyId}.${ext}`;
  const disposition = response.headers["content-disposition"];
  if (disposition) {
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  const blob = new Blob([response.data], {
    type: ext === "csv" ? "text/csv;charset=utf-8;" : "application/pdf",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Scheduled Reports APIs
export const getScheduledReports = async (page = 1, limit = 20) => {
  const response = await api.get(`/scheduled-reports?page=${page}&limit=${limit}`);
  return response.data;
};

export const createScheduledReport = async (data: {
  reportType: string;
  filters?: Record<string, any>;
  frequency: string;
  executionTime: string;
  recipients: string[];
  exportFormat: string;
  isActive?: boolean;
}) => {
  const response = await api.post("/scheduled-reports", data);
  return response.data;
};

export const updateScheduledReport = async (
  id: number,
  data: {
    reportType?: string;
    filters?: Record<string, any>;
    frequency?: string;
    executionTime?: string;
    recipients?: string[];
    exportFormat?: string;
    isActive?: boolean;
  }
) => {
  const response = await api.put(`/scheduled-reports/${id}`, data);
  return response.data;
};

export const toggleScheduledReport = async (id: number, isActive: boolean) => {
  const response = await api.patch(`/scheduled-reports/${id}`, { isActive });
  return response.data;
};

export const deleteScheduledReport = async (id: number) => {
  await api.delete(`/scheduled-reports/${id}`);
};

export const runScheduledReportNow = async (id: number) => {
  const response = await api.post(`/scheduled-reports/${id}/run`);
  return response.data;
};

// Filter dropdown helper: fetch products, categories, customers
export const fetchFilterMetadata = async () => {
  try {
    const [catsRes, prodsRes, custsRes] = await Promise.allSettled([
      api.get("/categories"),
      api.get("/products"),
      api.get("/customers"),
    ]);

    const categories =
      catsRes.status === "fulfilled"
        ? Array.isArray(catsRes.value.data)
          ? catsRes.value.data
          : catsRes.value.data?.items || []
        : [];

    const products =
      prodsRes.status === "fulfilled"
        ? Array.isArray(prodsRes.value.data)
          ? prodsRes.value.data
          : prodsRes.value.data?.items || []
        : [];

    const customers =
      custsRes.status === "fulfilled"
        ? Array.isArray(custsRes.value.data)
          ? custsRes.value.data
          : custsRes.value.data?.items || []
        : [];

    return { categories, products, customers };
  } catch (e) {
    return { categories: [], products: [], customers: [] };
  }
};