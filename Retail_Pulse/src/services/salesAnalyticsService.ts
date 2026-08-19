import api from "./api";

// =========================================================
// TYPES
// =========================================================

export interface SalesAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  productId?: number | null;
  categoryId?: number | null;
  customerId?: number | null;
  paymentMethod?: string | null;
}

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  totalDiscount: number;
  totalTax: number;
}

export interface SalesTrendItem {
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

export interface CustomerContributionItem {
  customerId: number;
  customerName: string;
  orders: number;
  totalSpend: number;
  averageOrderValue: number;
}

export interface PaymentMethodItem {
  paymentMethod: string;
  transactions: number;
  revenue: number;
}


// =========================================================
// API CLIENT METHODS
// =========================================================

export const getSalesSummary = async (
  filters: SalesAnalyticsFilters
): Promise<SalesSummary> => {
  const response = await api.get<SalesSummary>(
    "/api/analytics/sales/summary",
    {
      params: {
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        product_id: filters.productId || undefined,
        category_id: filters.categoryId || undefined,
        customer_id: filters.customerId || undefined,
        payment_method: filters.paymentMethod || undefined,
      },
    }
  );
  return response.data;
};

export const getSalesTrend = async (
  filters: SalesAnalyticsFilters,
  period: "daily" | "weekly" | "monthly" = "daily"
): Promise<SalesTrendItem[]> => {
  const response = await api.get<SalesTrendItem[]>(
    "/api/analytics/sales/trend",
    {
      params: {
        period,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        product_id: filters.productId || undefined,
        category_id: filters.categoryId || undefined,
        customer_id: filters.customerId || undefined,
        payment_method: filters.paymentMethod || undefined,
      },
    }
  );
  return response.data;
};

export const getSalesProducts = async (
  filters: SalesAnalyticsFilters,
  sortBy: "revenue" | "quantity" = "revenue",
  limit: number = 10
): Promise<TopProductItem[]> => {
  const response = await api.get<TopProductItem[]>(
    "/api/analytics/sales/products",
    {
      params: {
        sort_by: sortBy,
        limit,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        category_id: filters.categoryId || undefined,
        customer_id: filters.customerId || undefined,
        payment_method: filters.paymentMethod || undefined,
      },
    }
  );
  return response.data;
};

export const getSalesCustomers = async (
  filters: SalesAnalyticsFilters,
  limit: number = 10
): Promise<CustomerContributionItem[]> => {
  const response = await api.get<CustomerContributionItem[]>(
    "/api/analytics/sales/customers",
    {
      params: {
        limit,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        product_id: filters.productId || undefined,
        category_id: filters.categoryId || undefined,
        payment_method: filters.paymentMethod || undefined,
      },
    }
  );
  return response.data;
};

export const getSalesPaymentMethods = async (
  filters: SalesAnalyticsFilters
): Promise<PaymentMethodItem[]> => {
  const response = await api.get<PaymentMethodItem[]>(
    "/api/analytics/sales/payment-methods",
    {
      params: {
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        product_id: filters.productId || undefined,
        category_id: filters.categoryId || undefined,
        customer_id: filters.customerId || undefined,
      },
    }
  );
  return response.data;
};

export const exportSalesCSV = async (
  filters: SalesAnalyticsFilters
): Promise<Blob> => {
  const response = await api.get(
    "/api/analytics/sales/export/csv",
    {
      params: {
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        product_id: filters.productId || undefined,
        category_id: filters.categoryId || undefined,
        customer_id: filters.customerId || undefined,
        payment_method: filters.paymentMethod || undefined,
      },
      responseType: "blob",
    }
  );
  return response.data;
};

export const exportSalesPDF = async (
  filters: SalesAnalyticsFilters
): Promise<Blob> => {
  const response = await api.get(
    "/api/analytics/sales/export/pdf",
    {
      params: {
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        product_id: filters.productId || undefined,
        category_id: filters.categoryId || undefined,
        customer_id: filters.customerId || undefined,
        payment_method: filters.paymentMethod || undefined,
      },
      responseType: "blob",
    }
  );
  return response.data;
};
