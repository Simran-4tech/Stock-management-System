/**
 * Client storage & reports utility for StockFlow
 * Mirrors storage.py and reports.py
 */

import { Product, Transaction, StockStatus, InventoryMetrics } from './types';

export const INITIAL_SAMPLE_PRODUCTS: Product[] = [
  {
    product_id: 'P001',
    product_name: 'Notebook',
    category: 'Stationery',
    unit_price: 50.0,
    stock_quantity: 100,
    reorder_level: 20,
    date_created: '2026-10-01 10:00:00',
    last_updated: '2026-10-01 10:00:00',
    is_sample: true,
  },
  {
    product_id: 'P002',
    product_name: 'Pen',
    category: 'Stationery',
    unit_price: 10.0,
    stock_quantity: 200,
    reorder_level: 50,
    date_created: '2026-10-02 11:30:00',
    last_updated: '2026-10-02 11:30:00',
    is_sample: true,
  },
  {
    product_id: 'P003',
    product_name: 'School Bag',
    category: 'Accessories',
    unit_price: 750.0,
    stock_quantity: 8,
    reorder_level: 10,
    date_created: '2026-10-03 09:15:00',
    last_updated: '2026-10-03 09:15:00',
    is_sample: true,
  },
  {
    product_id: 'P004',
    product_name: 'Pencil',
    category: 'Stationery',
    unit_price: 5.0,
    stock_quantity: 15,
    reorder_level: 20,
    date_created: '2026-10-04 14:20:00',
    last_updated: '2026-10-04 14:20:00',
    is_sample: true,
  },
  {
    product_id: 'P005',
    product_name: 'Water Bottle',
    category: 'Home & Living',
    unit_price: 150.0,
    stock_quantity: 0,
    reorder_level: 10,
    date_created: '2026-10-05 16:45:00',
    last_updated: '2026-10-05 16:45:00',
    is_sample: true,
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    transaction_id: 'TX-INIT-001',
    timestamp: '2026-10-01 10:00:00',
    product_id: 'P001',
    product_name: 'Notebook',
    movement_type: 'Stock In',
    quantity_changed: 100,
    previous_quantity: 0,
    new_quantity: 100,
    notes: 'Initial inventory setup',
  },
  {
    transaction_id: 'TX-INIT-002',
    timestamp: '2026-10-02 11:30:00',
    product_id: 'P002',
    product_name: 'Pen',
    movement_type: 'Stock In',
    quantity_changed: 200,
    previous_quantity: 0,
    new_quantity: 200,
    notes: 'Initial inventory setup',
  },
  {
    transaction_id: 'TX-INIT-003',
    timestamp: '2026-10-03 09:15:00',
    product_id: 'P003',
    product_name: 'School Bag',
    movement_type: 'Stock In',
    quantity_changed: 15,
    previous_quantity: 0,
    new_quantity: 15,
    notes: 'Initial shipment batch',
  },
  {
    transaction_id: 'TX-INIT-004',
    timestamp: '2026-10-03 14:00:00',
    product_id: 'P003',
    product_name: 'School Bag',
    movement_type: 'Sale',
    quantity_changed: -7,
    previous_quantity: 15,
    new_quantity: 8,
    notes: 'Customer retail sale',
  },
  {
    transaction_id: 'TX-INIT-005',
    timestamp: '2026-10-04 14:20:00',
    product_id: 'P004',
    product_name: 'Pencil',
    movement_type: 'Stock In',
    quantity_changed: 15,
    previous_quantity: 0,
    new_quantity: 15,
    notes: 'Initial shipment',
  },
  {
    transaction_id: 'TX-INIT-006',
    timestamp: '2026-10-05 16:45:00',
    product_id: 'P005',
    product_name: 'Water Bottle',
    movement_type: 'Sale',
    quantity_changed: -25,
    previous_quantity: 25,
    new_quantity: 0,
    notes: 'Stockout sale',
  },
];

const STORAGE_KEYS = {
  PRODUCTS: 'stockflow_products_v1',
  TRANSACTIONS: 'stockflow_transactions_v1',
};

export function loadStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      saveStoredProducts(INITIAL_SAMPLE_PRODUCTS);
      return INITIAL_SAMPLE_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_PRODUCTS;
  } catch {
    return INITIAL_SAMPLE_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save products to localStorage', e);
  }
}

export function loadStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      saveStoredTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TRANSACTIONS;
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e);
  }
}

export function getStockStatus(quantity: number, reorderLevel: number): StockStatus {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

export function calculateMetrics(products: Product[]): InventoryMetrics {
  let totalValue = 0;
  let totalUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let inStockProductsCount = 0;
  const categoriesSet = new Set<string>();
  const categoryValuation: InventoryMetrics['category_valuation'] = {};

  for (const p of products) {
    const qty = p.stock_quantity || 0;
    const price = p.unit_price || 0;
    const reorder = p.reorder_level || 0;
    const cat = p.category || 'General';

    categoriesSet.add(cat);
    const val = price * qty;
    totalValue += val;
    totalUnits += qty;

    if (qty === 0) {
      outOfStockCount++;
    } else if (qty <= reorder) {
      lowStockCount++;
      inStockProductsCount++;
    } else {
      inStockProductsCount++;
    }

    if (!categoryValuation[cat]) {
      categoryValuation[cat] = {
        category: cat,
        product_count: 0,
        total_units: 0,
        total_value: 0,
      };
    }
    categoryValuation[cat].product_count += 1;
    categoryValuation[cat].total_units += qty;
    categoryValuation[cat].total_value = Number((categoryValuation[cat].total_value + val).toFixed(2));
  }

  return {
    total_products: products.length,
    total_stock_value: Number(totalValue.toFixed(2)),
    low_stock_count: lowStockCount,
    total_units: totalUnits,
    out_of_stock_count: outOfStockCount,
    in_stock_products_count: inStockProductsCount,
    total_categories: categoriesSet.size,
    categories_list: Array.from(categoriesSet).sort(),
    category_valuation: categoryValuation,
  };
}

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
}

// Download helpers for CSV, JSON, and binary 7z
import { STOCKFLOW_7Z_BASE64 } from './archiveBase64';

export function download7zArchive(filename = 'StockFlow_Project.7z') {
  try {
    const binaryString = atob(STOCKFLOW_7Z_BASE64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/x-7z-compressed' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to download 7z archive via Blob', err);
    // Fallback to static link
    window.location.href = '/StockFlow_Project.7z';
  }
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadSetupPythonScript() {
  try {
    const res = await fetch('/setup_project.py');
    const text = await res.text();
    downloadFile(text, 'setup_project.py', 'text/x-python');
  } catch (err) {
    console.error('Failed to fetch setup script', err);
    window.location.href = '/setup_project.py';
  }
}

export function generateCSVReport(type: 'inventory' | 'low_stock' | 'out_of_stock' | 'movements' | 'valuation', products: Product[], transactions: Transaction[]): string {
  if (type === 'inventory') {
    const headers = ['Product ID', 'Product Name', 'Category', 'Unit Price (₹)', 'Stock Quantity', 'Reorder Level', 'Inventory Value (₹)', 'Stock Status', 'Date Created', 'Last Updated'];
    const rows = products.map(p => [
      p.product_id,
      `"${p.product_name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.unit_price.toFixed(2),
      p.stock_quantity,
      p.reorder_level,
      (p.unit_price * p.stock_quantity).toFixed(2),
      getStockStatus(p.stock_quantity, p.reorder_level),
      p.date_created,
      p.last_updated,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  if (type === 'low_stock') {
    const headers = ['Product ID', 'Product Name', 'Category', 'Current Quantity', 'Reorder Level', 'Suggested Reorder Quantity', 'Unit Price (₹)', 'Valuation At Risk (₹)'];
    const lowProds = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level);
    const rows = lowProds.map(p => [
      p.product_id,
      `"${p.product_name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.stock_quantity,
      p.reorder_level,
      Math.max(0, p.reorder_level - p.stock_quantity),
      p.unit_price.toFixed(2),
      (p.unit_price * p.stock_quantity).toFixed(2),
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  if (type === 'out_of_stock') {
    const headers = ['Product ID', 'Product Name', 'Category', 'Current Quantity', 'Reorder Level', 'Suggested Reorder Quantity', 'Unit Price (₹)'];
    const outProds = products.filter(p => p.stock_quantity === 0);
    const rows = outProds.map(p => [
      p.product_id,
      `"${p.product_name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      0,
      p.reorder_level,
      Math.max(1, p.reorder_level),
      p.unit_price.toFixed(2),
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  if (type === 'movements') {
    const headers = ['Transaction ID', 'Date and Time', 'Product ID', 'Product Name', 'Movement Type', 'Quantity Changed', 'Previous Quantity', 'New Quantity', 'Notes'];
    const rows = transactions.map(t => [
      t.transaction_id,
      t.timestamp,
      t.product_id,
      `"${t.product_name.replace(/"/g, '""')}"`,
      t.movement_type,
      t.quantity_changed,
      t.previous_quantity,
      t.new_quantity,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  if (type === 'valuation') {
    const metrics = calculateMetrics(products);
    const headers = ['Category', 'Product Count', 'Total Units', 'Total Inventory Value (₹)', 'Share of Total Value (%)'];
    const rows = Object.values(metrics.category_valuation).map(cat => {
      const pct = metrics.total_stock_value > 0 ? ((cat.total_value / metrics.total_stock_value) * 100).toFixed(2) : '0.00';
      return [
        `"${cat.category.replace(/"/g, '""')}"`,
        cat.product_count,
        cat.total_units,
        cat.total_value.toFixed(2),
        `${pct}%`,
      ];
    });
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  return '';
}
