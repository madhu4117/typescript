
import api from "./api";

// ============================================================
// TYPES
// ============================================================

export interface Product {
  id: number;
  companyId: number;
  categoryId: number;

  name: string;
  sku: string;

  brand?: string | null;
  description?: string | null;

  unitPrice: number;
  costPrice: number;

  stockQuantity: number;

  unitOfMeasure?: string | null;

  status?: string | null;

  category_name?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCreate {
  categoryId: number;

  name: string;
  sku: string;

  brand?: string;
  description?: string;

  unitPrice: number;
  costPrice: number;

  stockQuantity: number;

  unitOfMeasure?: string;
  status?: string;
}

export interface ProductUpdate {
  categoryId?: number;

  name?: string;
  sku?: string;

  brand?: string;
  description?: string;

  unitPrice?: number;
  costPrice?: number;

  stockQuantity?: number;

  unitOfMeasure?: string;
  status?: string;
}

// ============================================================
// GET ALL PRODUCTS
// ============================================================

export const getProducts = async (
  search: string = "",
  categoryId?: number,
  status?: string,
  brand?: string,
  sortBy: string = "name",
  sortOrder: string = "asc"
): Promise<Product[]> => {
  const response = await api.get("/products/", {
    params: {
      search: search || undefined,
      categoryId: categoryId || undefined,
      status: status || undefined,
      brand: brand || undefined,
      sortBy,
      sortOrder,
    },
  });

  return response.data;
};

// ============================================================
// GET PRODUCT BY ID
// ============================================================

export const getProduct = async (
  productId: number
): Promise<Product> => {
  const response = await api.get(
    `/products/${productId}`
  );

  return response.data;
};

// ============================================================
// CREATE PRODUCT
// ============================================================

export const createProduct = async (
  data: ProductCreate
): Promise<Product> => {
  const response = await api.post(
    "/products/",
    data
  );

  return response.data;
};

// ============================================================
// UPDATE PRODUCT
// ============================================================

export const updateProduct = async (
  productId: number,
  data: ProductUpdate
): Promise<Product> => {
  const response = await api.put(
    `/products/${productId}`,
    data
  );

  return response.data;
};

// ============================================================
// CHANGE PRODUCT STATUS
// ============================================================

export const changeProductStatus = async (
  productId: number,
  status: "Active" | "Inactive"
): Promise<Product> => {
  const response = await api.put(
    `/products/${productId}/status`,
    null,
    {
      params: {
        status,
      },
    }
  );

  return response.data;
};

// ============================================================
// ACTIVATE PRODUCT
// ============================================================

export const activateProduct = async (
  productId: number
): Promise<Product> => {
  return changeProductStatus(
    productId,
    "Active"
  );
};

// ============================================================
// DEACTIVATE PRODUCT
// ============================================================

export const deactivateProduct = async (
  productId: number
): Promise<Product> => {
  return changeProductStatus(
    productId,
    "Inactive"
  );
};

// ============================================================
// DELETE PRODUCT
// ============================================================

export const deleteProduct = async (
  productId: number
): Promise<void> => {
  await api.delete(
    `/products/${productId}`
  );
};

