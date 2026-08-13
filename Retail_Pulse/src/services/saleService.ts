import api from "./api";

// ============================================================
// TYPES
// ============================================================

export interface SaleItem {
  id?: number;
  productId: number;
  categoryId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total?: number;
}

export interface SaleItemCreate {
  productId: number;
  categoryId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

export interface Sale {
  id: number;
  companyId: number;

  customerId: number;
  customerName: string;

  invoiceNumber: string;

  saleDate: string;

  salesChannel: string;
  paymentMethod: string;

  totalAmount: number;

  createdBy: string;
  createdAt: string;
  updatedAt: string;

  items: SaleItem[];
}

export interface SaleCreate {
  customerId: number;
  salesChannel: string;
  paymentMethod: string;
  items: SaleItemCreate[];
}

export interface SaleUpdate {
  customerId?: number;
  salesChannel?: string;
  paymentMethod?: string;
}

// ============================================================
// GET ALL SALES
// ============================================================

export const getSales = async (): Promise<Sale[]> => {
  const response = await api.get<Sale[]>("/sales/");

  return response.data;
};

// ============================================================
// GET SALE BY ID
// ============================================================

export const getSale = async (
  saleId: number
): Promise<Sale> => {
  const response = await api.get<Sale>(
    `/sales/${saleId}`
  );

  return response.data;
};

// ============================================================
// CREATE SALE
// ============================================================

export const createSale = async (
  data: SaleCreate
): Promise<Sale> => {
  const response = await api.post<Sale>(
    "/sales/",
    data
  );

  return response.data;
};

// ============================================================
// UPDATE SALE
// ============================================================

export const updateSale = async (
  saleId: number,
  data: SaleUpdate
): Promise<Sale> => {
  const response = await api.put<Sale>(
    `/sales/${saleId}`,
    data
  );

  return response.data;
};

// ============================================================
// DELETE SALE
// ============================================================

export const deleteSale = async (
  saleId: number
) => {
  const response = await api.delete(
    `/sales/${saleId}`
  );

  return response.data;
};