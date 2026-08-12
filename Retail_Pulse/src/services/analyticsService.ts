import api from "./api";

export const getDashboardSummary = async () => {
  const response = await api.get("/analytics/summary");
  return response.data;
};

export const getRevenueTrend = async () => {
  const response = await api.get("/analytics/revenue-trend");
  return response.data;
};

export const getTopProducts = async () => {
  const response = await api.get("/analytics/top-products");
  return response.data;
};

export const getCategorySales = async () => {
  const response = await api.get("/analytics/category-sales");
  return response.data;
};


export const getPaymentMethods = async () => {
  const response = await api.get("/analytics/payment-methods");
  return response.data;
};

export const getSalesChannel = async () => {
  const response = await api.get("/analytics/sales-channel");
  return response.data;
};

export const getInventoryStatus = async () => {
  const response = await api.get("/analytics/inventory-status");
  return response.data;
};

export const getLowStockProducts = async () => {
  const response = await api.get("/analytics/low-stock-products");
  return response.data;
};

export const getOutOfStockProducts = async () => {
  const response = await api.get(
    "/analytics/out-of-stock-products"
  );
  return response.data;
};

export const getInventoryValue = async () => {
  const response = await api.get(
    "/analytics/inventory-value"
  );

  return response.data;
};

export const exportCSV = async () => {
  const response = await api.get(
    "/analytics/export/csv",
    {
      responseType: "blob",
    }
  );

  return response.data;
};


export const exportPDF = async () => {
  const response = await api.get(
    "/analytics/export/pdf",
    {
      responseType: "blob",
    }
  );

  return response.data;
};


// =====================================================
// SALES ANALYTICS
// =====================================================

export const getSalesAnalyticsDashboard = async () => {
  const response = await api.get(
    "/sales-analytics/dashboard"
  );

  return response.data;
};


export const getSalesAnalyticsGrowth = async () => {
  const response = await api.get(
    "/sales-analytics/growth"
  );

  return response.data;
};


export const getSalesAnalyticsByChannel = async () => {
  const response = await api.get(
    "/sales-analytics/by-channel"
  );

  return response.data;
};


export const getSalesAnalyticsByPaymentMethod = async () => {
  const response = await api.get(
    "/sales-analytics/by-payment-method"
  );

  return response.data;
};

