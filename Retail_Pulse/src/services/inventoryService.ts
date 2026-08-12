import api from "./api";

// ------------------------------------
// Get Inventory
// ------------------------------------

export const getInventory = async (params?: {
  search?: string;
  category?: string;
  brand?: string;
  stock_status?: string;
}) => {
  const query: Record<string, string> = {};

  if (params?.search?.trim()) {
    query.search = params.search;
  }

  if (params?.category?.trim()) {
    query.category = params.category;
  }

  if (params?.brand?.trim()) {
    query.brand = params.brand;
  }

  if (params?.stock_status?.trim()) {
    query.stock_status = params.stock_status;
  }

  const response = await api.get("/inventory/", {
    params: query,
  });

  return response.data;
};

// ------------------------------------
// Dashboard Summary
// ------------------------------------

export const getInventorySummary = async () => {
  const response = await api.get(
    "/inventory/dashboard/summary"
  );

  return response.data;
};

// ------------------------------------
// Movement History
// ------------------------------------

export const getMovementHistory = async (
  inventoryId: number
) => {
  const response = await api.get(
    `/inventory/${inventoryId}/history`
  );

  return response.data;
};

// ------------------------------------
// Add Stock
// ------------------------------------

export const addStock = async (
  inventoryId: number,
  data: {
    quantity: number;
    reason: string;
    remarks?: string;
  }
) => {
  const response = await api.put(
    `/inventory/${inventoryId}/add-stock`,
    {
      movementType: "add",
      quantity: data.quantity,
      reason: data.reason,
      remarks: data.remarks,
    }
  );

  return response.data;
};

// ------------------------------------
// Remove Stock
// ------------------------------------

export const removeStock = async (
  inventoryId: number,
  data: {
    quantity: number;
    reason: string;
    remarks?: string;
  }
) => {
  const response = await api.put(
    `/inventory/${inventoryId}/remove-stock`,
    {
      movementType: "remove",
      quantity: data.quantity,
      reason: data.reason,
      remarks: data.remarks,
    }
  );

  return response.data;
};

// ------------------------------------
// Manual Adjustment
// ------------------------------------

export const adjustStock = async (
  inventoryId: number,
  data: {
    quantity: number;
    reason: string;
    remarks?: string;
  }
) => {
  const response = await api.put(
    `/inventory/${inventoryId}/adjust`,
    {
      movementType: "adjust",
      quantity: data.quantity,
      reason: data.reason,
      remarks: data.remarks,
    }
  );

  return response.data;
};

// ------------------------------------
// Create Inventory
// ------------------------------------

export const createInventory = async (data: {
  productId: number;
  currentStock: number;
  reservedStock: number;
  reorderLevel: number;
}) => {
  const response = await api.post(
    "/inventory/",
    data
  );

  return response.data;
};