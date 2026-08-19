import api from "./api";

// =========================================================
// TYPES
// =========================================================

export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  totalDiscount: number;
  totalTax: number;
}

export interface RevenueTrendItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProductItem {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface CategorySaleItem {
  categoryId: number;
  categoryName: string;
  quantitySold: number;
  revenue: number;
}

export interface PaymentMethodItem {
  paymentMethod: string;
  transactions: number;
  revenue: number;
}

export interface SalesChannelItem {
  salesChannel: string;
  transactions: number;
  revenue: number;
}

export interface InventoryStatusItem {
  status: string;
  count: number;
}

export interface LowStockProductItem {
  productId: number;
  productName: string;
  stockQuantity: number;
}

export interface OutOfStockProductItem {
  productId: number;
  productName: string;
  stockQuantity: number;
}

export interface InventoryValueItem {
  categoryId: number;
  categoryName: string;
  inventoryValue: number;
}

// =========================================================
// SALES ANALYTICS TYPES
// =========================================================

export interface SalesAnalyticsDashboard {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  totalDiscount: number;
  totalTax: number;
}

export interface SalesAnalyticsGrowthItem {
  date: string;
  revenue: number;
  orders: number;
  growth?: number;
}

export interface SalesAnalyticsChannelItem {
  salesChannel: string;
  transactions: number;
  revenue: number;
}

export interface SalesAnalyticsPaymentItem {
  paymentMethod: string;
  transactions: number;
  revenue: number;
}

// =========================================================
// DASHBOARD SUMMARY
// =========================================================

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await api.get<DashboardSummary>(
    "/analytics/summary"
  );

  return response.data;
};

// =========================================================
// REVENUE TREND
// =========================================================

export const getRevenueTrend = async (
  period: "daily" | "weekly" | "monthly" = "daily"
): Promise<RevenueTrendItem[]> => {
  const response = await api.get<RevenueTrendItem[]>(
    "/analytics/revenue-trend",
    {
      params: {
        period,
      },
    }
  );

  return response.data;
};

// =========================================================
// TOP PRODUCTS
// =========================================================

export const getTopProducts = async (
  sortBy: "revenue" | "quantitySold" = "revenue",
  limit: number = 10
): Promise<TopProductItem[]> => {
  const response = await api.get<TopProductItem[]>(
    "/analytics/top-products",
    {
      params: {
        sort_by: sortBy,
        limit,
      },
    }
  );

  return response.data;
};

// =========================================================
// CATEGORY SALES
// =========================================================

export const getCategorySales = async (): Promise<
  CategorySaleItem[]
> => {
  const response = await api.get<CategorySaleItem[]>(
    "/analytics/category-sales"
  );

  return response.data;
};

// =========================================================
// PAYMENT METHODS
// =========================================================

export const getPaymentMethods = async (): Promise<
  PaymentMethodItem[]
> => {
  const response = await api.get<PaymentMethodItem[]>(
    "/analytics/payment-methods"
  );

  return response.data;
};

// =========================================================
// SALES CHANNEL
// =========================================================

export const getSalesChannel = async (): Promise<
  SalesChannelItem[]
> => {
  const response = await api.get<SalesChannelItem[]>(
    "/analytics/sales-channel"
  );

  return response.data;
};

// =========================================================
// INVENTORY STATUS
// =========================================================

export const getInventoryStatus = async (): Promise<
  InventoryStatusItem[]
> => {
  const response = await api.get<InventoryStatusItem[]>(
    "/analytics/inventory-status"
  );

  return response.data;
};

// =========================================================
// LOW STOCK PRODUCTS
// =========================================================

export const getLowStockProducts = async (): Promise<
  LowStockProductItem[]
> => {
  const response = await api.get<LowStockProductItem[]>(
    "/analytics/low-stock-products"
  );

  return response.data;
};

// =========================================================
// OUT OF STOCK PRODUCTS
// =========================================================

export const getOutOfStockProducts = async (): Promise<
  OutOfStockProductItem[]
> => {
  const response = await api.get<OutOfStockProductItem[]>(
    "/analytics/out-of-stock-products"
  );

  return response.data;
};

// =========================================================
// INVENTORY VALUE
// =========================================================

export const getInventoryValue = async (): Promise<
  InventoryValueItem[]
> => {
  const response = await api.get<InventoryValueItem[]>(
    "/analytics/inventory-value"
  );

  return response.data;
};

// =========================================================
// SALES ANALYTICS DASHBOARD
// =========================================================

export const getSalesAnalyticsDashboard =
  async (): Promise<SalesAnalyticsDashboard> => {
    const response = await api.get<SalesAnalyticsDashboard>(
      "/analytics/summary"
    );

    return response.data;
  };

// =========================================================
// SALES ANALYTICS GROWTH
// =========================================================

export const getSalesAnalyticsGrowth =
  async (
    period: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<SalesAnalyticsGrowthItem[]> => {
    const response = await api.get<SalesAnalyticsGrowthItem[]>(
      "/analytics/revenue-trend",
      {
        params: {
          period,
        },
      }
    );

    return response.data;
  };

// =========================================================
// SALES ANALYTICS BY CHANNEL
// =========================================================

export const getSalesAnalyticsByChannel =
  async (): Promise<SalesAnalyticsChannelItem[]> => {
    const response = await api.get<SalesAnalyticsChannelItem[]>(
      "/analytics/sales-channel"
    );

    return response.data;
  };

// =========================================================
// SALES ANALYTICS BY PAYMENT METHOD
// =========================================================

export const getSalesAnalyticsByPaymentMethod =
  async (): Promise<SalesAnalyticsPaymentItem[]> => {
    const response = await api.get<SalesAnalyticsPaymentItem[]>(
      "/analytics/payment-methods"
    );

    return response.data;
  };

// =========================================================
// CSV EXPORT
// =========================================================

export const exportCSV = async (): Promise<Blob> => {
  const response = await api.get(
    "/analytics/export/csv",
    {
      responseType: "blob",
    }
  );

  return response.data;
};

// =========================================================
// PDF EXPORT
// =========================================================

export const exportPDF = async (): Promise<Blob> => {
  const response = await api.get(
    "/analytics/export/pdf",
    {
      responseType: "blob",
    }
  );

  return response.data;
};

// =========================================================
// ANALYTICS CSV EXPORT
// Alias kept for existing components
// =========================================================

export const exportAnalyticsCSV = async (): Promise<Blob> => {
  return exportCSV();
};

// =========================================================
// ANALYTICS PDF EXPORT
// Alias kept for existing components
// =========================================================

export const exportAnalyticsPDF = async (): Promise<Blob> => {
  return exportPDF();
};