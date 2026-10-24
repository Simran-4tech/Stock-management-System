/**
 * StockFlow Type Definitions
 * Directly maps to Python dictionary schema in inventory_manager.py
 */

export interface Product {
  product_id: string;
  product_name: string;
  category: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  date_created: string;
  last_updated: string;
  is_sample?: boolean;
}

export type MovementType = 'Stock In' | 'Sale' | 'Adjustment';

export interface Transaction {
  transaction_id: string;
  timestamp: string;
  product_id: string;
  product_name: string;
  movement_type: MovementType;
  quantity_changed: number;
  previous_quantity: number;
  new_quantity: number;
  notes: string;
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface InventoryMetrics {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  total_units: number;
  out_of_stock_count: number;
  in_stock_products_count: number;
  total_categories: number;
  categories_list: string[];
  category_valuation: Record<string, {
    category: string;
    product_count: number;
    total_units: number;
    total_value: number;
  }>;
}
