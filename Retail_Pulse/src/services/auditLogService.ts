import api from "./api";

export interface AuditLogUser {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface AuditLog {
  id: number;
  companyId: number;
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
  action: string;
  resourceType: string;
  resourceId?: number | null;
  description?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  beforeData?: any;
  afterData?: any;
  status: string;
  createdAt: string;
  user?: AuditLogUser | null;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: number;
  action?: string;
  resourceType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: "desc" | "asc";
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  actions: string[];
  resourceTypes: string[];
  users: { id: number; name: string; email: string; role?: string }[];
  statuses: string[];
}

export const auditLogService = {
  // Fetch paginated, filtered, and searched logs
  async getAuditLogs(params: AuditLogQueryParams): Promise<AuditLogListResponse> {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "ALL") {
        cleanParams[key] = val;
      }
    });

    const response = await api.get<AuditLogListResponse>("/audit-logs", {
      params: cleanParams,
    });
    return response.data;
  },

  // Fetch single audit log details
  async getAuditLogById(id: number): Promise<AuditLog> {
    const response = await api.get<AuditLog>(`/audit-logs/${id}`);
    return response.data;
  },

  // Fetch filter dropdown options
  async getFilterOptions(): Promise<FilterOptions> {
    const response = await api.get<FilterOptions>("/audit-logs/filters");
    return response.data;
  },

  // Export audit logs (CSV or PDF)
  async exportAuditLogs(format: "csv" | "pdf", params: AuditLogQueryParams): Promise<Blob> {
    const cleanParams: Record<string, any> = { format };
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "ALL") {
        // Exclude pagination parameters for export so that all filtered logs are exported
        if (key !== "page" && key !== "limit") {
          cleanParams[key] = val;
        }
      }
    });

    const response = await api.get("/audit-logs/export", {
      params: cleanParams,
      responseType: "blob",
    });
    return response.data;
  },

  // Clear audit logs (Admin only)
  async clearAuditLogs(retentionDays?: number): Promise<{ message: string; clearedCount: number }> {
    const response = await api.post("/audit-logs/clear", {
      retention_days: retentionDays,
      confirm: true,
    });
    return response.data;
  },
};

export default auditLogService;
