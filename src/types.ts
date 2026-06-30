export type UserRole = "Admin" | "Manager" | "Accountant" | "Cashier" | "Storekeeper";

export interface SystemUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  unit: string;
  price: number;
  purchasePrice?: number;
  minStock: number;
}
