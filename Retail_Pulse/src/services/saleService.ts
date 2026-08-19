import api from "./api";


// ============================================================
// SALE ITEM
// ============================================================

export interface SaleItem {

  id?: number;

  productId: number;

  categoryId: number;

  productName?: string;

  categoryName?: string;

  quantity: number;

  unitPrice: number;

  discount: number;

  tax: number;

  total?: number;
}


// ============================================================
// SALE ITEM CREATE
// ============================================================

export interface SaleItemCreate {

  productId: number;

  categoryId: number;

  quantity: number;

  unitPrice?: number;

  discount?: number;

  tax?: number;
}


// ============================================================
// SALE
// ============================================================

export interface Sale {

  id: number;

  companyId: number;

  customerId: number;

  customerName: string;

  invoiceNumber: string;

  saleDate: string;

  salesChannel: string;

  paymentMethod: string;

  discount: number;

  tax: number;

  totalAmount: number;

  status: string;

  notes?: string | null;

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  items: SaleItem[];
}


// ============================================================
// SALE CREATE
// ============================================================

export interface SaleCreate {

  customerId: number;

  salesChannel: string;

  paymentMethod: string;

  discount?: number;

  tax?: number;

  notes?: string | null;

  items: SaleItemCreate[];
}


// ============================================================
// SALE UPDATE
// ============================================================

export interface SaleUpdate {

  customerId?: number;

  salesChannel?: string;

  paymentMethod?: string;

  discount?: number;

  tax?: number;

  notes?: string | null;

  status?: string;
}


// ============================================================
// GET ALL SALES
// ============================================================

export const getSales = async (): Promise<Sale[]> => {

  const response = await api.get<Sale[]>(
    "/sales/"
  );

  return response.data;
};


// ============================================================
// GET SALE
// ============================================================

export const getSale = async (
  saleId: number
): Promise<Sale> => {

  if (!saleId || saleId <= 0) {
    throw new Error(
      "Invalid sale ID"
    );
  }

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

  if (!saleId || saleId <= 0) {
    throw new Error(
      "Invalid sale ID"
    );
  }

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
): Promise<{
  message: string;
  invoiceNumber: string;
}> => {

  if (!saleId || saleId <= 0) {
    throw new Error(
      "Invalid sale ID"
    );
  }

  const response = await api.delete<{
    message: string;
    invoiceNumber: string;
  }>(
    `/sales/${saleId}`
  );

  return response.data;
};