export interface SaleItem {
  id?: number;

  productId: number;

  productName?: string;

  categoryId: number;

  categoryName?: string;

  quantity: number;

  unitPrice: number;

  discount: number;

  tax: number;

  total: number;
}

export interface Sale {
  id: number;

  invoiceNumber: string;

  customerName: string;

  saleDate: string;

  salesChannel: string;

  paymentMethod: string;

  totalAmount: number;

  createdBy?: string;

  createdAt?: string;

  updatedAt?: string;

  items: SaleItem[];
}

export interface SaleFormData {
  customerName: string;

  salesChannel: string;

  paymentMethod: string;

  items: SaleItem[];
}

export interface DashboardSummary {
  totalSales: number;

  totalRevenue: number;

  totalOrders: number;

  averageOrderValue: number;
}