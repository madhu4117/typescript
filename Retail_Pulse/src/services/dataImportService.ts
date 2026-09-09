import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export type ImportType = "products" | "customers" | "sales";

export interface PreviewRow {
  row_number: number;
  data: Record<string, any>;
  valid: boolean;
  errors: string[];
  duplicate: boolean;
  duplicate_reason?: string;
}

export interface ImportPreviewResponse {
  import_type: string;
  filename: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  required_columns: string[];
  detected_columns?: string[];
  rows: PreviewRow[];
}

export interface ImportErrorDetail {
  row_number: number;
  type: string;
  field?: string | null;
  message: string;
  row_data?: Record<string, any>;
}

export interface ImportResultResponse {
  import_id: number;
  import_type: string;
  filename: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  duplicate_records: number;
  status: string;
  errors: ImportErrorDetail[];
}

export interface ImportHistoryItem {
  id: number;
  import_type: string;
  filename: string;
  uploaded_by: number;
  uploaded_by_name?: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  duplicate_records: number;
  status: string;
  created_at?: string;
  completed_at?: string;
}

/* =========================================================
   GET AUTH TOKEN
========================================================= */

const getToken = (): string | null => {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
};

/* =========================================================
   AXIOS CONFIG
========================================================= */

const getHeaders = () => {
  const token = getToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};

/* =========================================================
   PREVIEW CSV
========================================================= */

export const previewCSV = async (
  importType: ImportType,
  file: File
): Promise<ImportPreviewResponse> => {
  const formData = new FormData();
  formData.append("import_type", importType);
  formData.append("file", file);

  const response = await axios.post<ImportPreviewResponse>(
    `${API_URL}/data-import/preview`,
    formData,
    {
      headers: {
        ...getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/* =========================================================
   IMPORT CSV
========================================================= */

export const importCSV = async (
  importType: ImportType,
  file: File
): Promise<ImportResultResponse> => {
  const formData = new FormData();
  formData.append("import_type", importType);
  formData.append("file", file);

  const response = await axios.post<ImportResultResponse>(
    `${API_URL}/data-import/import`,
    formData,
    {
      headers: {
        ...getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/* =========================================================
   DOWNLOAD SAMPLE TEMPLATE
========================================================= */

export const downloadSampleTemplate = async (
  importType: ImportType
): Promise<Blob> => {
  const response = await axios.get(
    `${API_URL}/data-import/template/${importType}`,
    {
      headers: getHeaders(),
      responseType: "blob",
    }
  );

  return response.data;
};

/* =========================================================
   IMPORT HISTORY
========================================================= */

export const getImportHistory = async (): Promise<ImportHistoryItem[]> => {
  const response = await axios.get<ImportHistoryItem[]>(
    `${API_URL}/data-import/history`,
    {
      headers: getHeaders(),
    }
  );

  return response.data;
};

/* =========================================================
   GET SINGLE IMPORT RECORD
========================================================= */

export const getImportById = async (
  importId: number
): Promise<ImportHistoryItem> => {
  const response = await axios.get<ImportHistoryItem>(
    `${API_URL}/data-import/history/${importId}`,
    {
      headers: getHeaders(),
    }
  );

  return response.data;
};

/* =========================================================
   IMPORT ERRORS
========================================================= */

export const getImportErrors = async (
  importId: number
): Promise<ImportErrorDetail[]> => {
  const response = await axios.get<ImportErrorDetail[]>(
    `${API_URL}/data-import/history/${importId}/errors`,
    {
      headers: getHeaders(),
    }
  );

  return response.data;
};

/* =========================================================
   DOWNLOAD FAILED RECORDS
========================================================= */

export const downloadFailedRecords = async (
  importId: number
): Promise<Blob> => {
  const response = await axios.get(
    `${API_URL}/data-import/history/${importId}/errors/download`,
    {
      headers: getHeaders(),
      responseType: "blob",
    }
  );

  return response.data;
};