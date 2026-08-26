import api from "./api";

// =========================================================
// TYPES
// =========================================================

export interface ForecastSummary {
  totalProducts: number;
  productsRequiringReorder: number;
  productsAtStockoutRisk: number;
  overstockedProducts: number;
  healthyProducts: number;
}

export interface ForecastItem {
  productId: number;
  productName: string;
  sku: string;

  categoryId: number;
  categoryName: string;

  currentStock: number;
  averageDailySales: number;
  forecastedDemand: number;
  daysOfStockRemaining: number | null;

  leadTimeDays: number;
  safetyStock: number;
  reorderPoint: number;
  recommendedReorderQuantity: number;

  stockRisk: string;
  recommendation: string;
}

export interface InventoryForecastResponse {
  summary: ForecastSummary;
  items: ForecastItem[];
}

export interface StockProjectionItem {
  date: string;
  projectedStock: number;
  demand: number;
}

export type InventoryRecommendation = ForecastItem;

// =========================================================
// GET FORECAST
// =========================================================

export const getInventoryForecast = async (params?: {
  stock_risk?: string;
  category_id?: number | string;
  product_id?: number | string;
  reorder_required?: boolean;
  sort_by?: string;
  sort_order?: string;
}) => {
  const response = await api.get<InventoryForecastResponse>(
    "/inventory/forecast",
    {
      params,
    }
  );

  return response.data;
};

// =========================================================
// GET PRODUCT RECOMMENDATION
// =========================================================

export const getInventoryRecommendation = async (
  productId: number
): Promise<ForecastItem> => {
  const response = await api.get<ForecastItem>(
    `/inventory/recommendations/${productId}`
  );

  return response.data;
};

// =========================================================
// GET STOCK PROJECTION
// =========================================================

export const getStockProjection = async (
  productId: number
): Promise<StockProjectionItem[]> => {
  const response = await api.get<StockProjectionItem[]>(
    `/inventory/forecast/${productId}/projection`
  );

  return response.data;
};