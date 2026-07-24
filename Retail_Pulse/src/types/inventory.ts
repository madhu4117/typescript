export interface Inventory {
  id: number;

  companyId: number;

  productId: number;

  productName: string;

  sku: string;

  category: string;

  brand: string;

  currentStock: number;

  reservedStock: number;

  availableStock: number;

  reorderLevel: number;

  stockStatus: string;

  updatedAt: string;
}

export interface InventorySummary {
  totalProducts: number;

  totalInventory: number;

  lowStockProducts: number;

  outOfStockProducts: number;
}

export interface InventoryMovement {
  id: number;

  inventoryId: number;

  movementType: string;

  quantityChanged: number;

  previousQuantity: number;

  updatedQuantity: number;

  reason: string;

  remarks?: string;

  performedBy: number;

  createdAt: string;
}

export interface StockAdjustmentRequest {
  quantity: number;

  reason: string;

  remarks?: string;
}

export interface InventoryCreate {
  productId: number;

  currentStock: number;

  reservedStock: number;

  reorderLevel: number;
}