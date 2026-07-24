import axios from "axios";

const API = "http://127.0.0.1:8000/inventory";

// ---------------------------
// Get Inventory
// ---------------------------

export const getInventory = async (params?: {
  search?: string;
  category?: string;
  brand?: string;
  stock_status?: string;
}) => {
  const response = await axios.get(API, {
    params,
  });

  return response.data;
};

// ---------------------------
// Dashboard Summary
// ---------------------------

export const getInventorySummary = async () => {
  const response = await axios.get(
    `${API}/dashboard/summary`
  );

  return response.data;
};

// ---------------------------
// Movement History
// ---------------------------

export const getMovementHistory = async (
  inventoryId: number
) => {
  const response = await axios.get(
    `${API}/${inventoryId}/history`
  );

  return response.data;
};

// ---------------------------
// Add Stock
// ---------------------------

export const addStock = async (
  inventoryId: number,
  data: {
    quantity: number;
    reason: string;
    remarks?: string;
  }
) => {
  const response = await axios.put(
    `${API}/${inventoryId}/add-stock`,
    data
  );

  return response.data;
};

// ---------------------------
// Remove Stock
// ---------------------------

export const removeStock = async (
  inventoryId: number,
  data: {
    quantity: number;
    reason: string;
    remarks?: string;
  }
) => {
  const response = await axios.put(
    `${API}/${inventoryId}/remove-stock`,
    data
  );

  return response.data;
};

// ---------------------------
// Manual Adjustment
// ---------------------------

export const adjustStock = async (
  inventoryId: number,
  data: {
    quantity: number;
    reason: string;
    remarks?: string;
  }
) => {
  const response = await axios.put(
    `${API}/${inventoryId}/adjust`,
    data
  );

  return response.data;
};

// ---------------------------
// Create Inventory
// ---------------------------

export const createInventory = async (data: {
  productId: number;
  currentStock: number;
  reservedStock: number;
  reorderLevel: number;
}) => {
  const response = await axios.post(
    API,
    data
  );

  return response.data;
};