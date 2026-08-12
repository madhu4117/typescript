import api from "./api";

// ============================================================
// GENERATE FORECAST
// ============================================================

export const generateForecast = async (
  period: string = "30"
) => {
  const response = await api.post(
    `/demand-forecast/generate?period=${period}`
  );

  return response.data;
};

// ============================================================
// PRODUCT FORECASTS
// ============================================================

export const getProductForecasts = async (
  period: string = "30"
) => {
  const response = await api.get(
    `/demand-forecast/products?period=${period}`
  );

  return response.data;
};

// ============================================================
// CATEGORY FORECASTS
// ============================================================

export const getCategoryForecasts = async (
  period: string = "30"
) => {
  const response = await api.get(
    `/demand-forecast/categories?period=${period}`
  );

  return response.data;
};

// ============================================================
// INVENTORY RECOMMENDATIONS
// ============================================================

export const getInventoryRecommendations =
  async (period: string = "30") => {
    const response = await api.get(
      `/demand-forecast/recommendations?period=${period}`
    );

    return response.data;
  };

// ============================================================
// FORECAST DASHBOARD
// ============================================================

export const getForecastDashboard = async (
  period: string = "30"
) => {
  const response = await api.get(
    `/demand-forecast/dashboard?period=${period}`
  );

  return response.data;
};