import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ArrowDownToLine,
  ShoppingCart,
  History,
  AlertTriangle,
  FileText,
  Settings as SettingsIcon,
  GraduationCap,
  Search,
  Bell,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Box,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  RefreshCw,
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Product, Transaction, MovementType, StockStatus } from './types';
import {
  loadStoredProducts,
  saveStoredProducts,
  loadStoredTransactions,
  saveStoredTransactions,
  calculateMetrics,
  formatINR,
  getStockStatus,
  downloadFile,
  download7zArchive,
  downloadSetupPythonScript,
  generateCSVReport,
  INITIAL_SAMPLE_PRODUCTS,
} from './storage';
import { PYTHON_FILES } from './pythonCode';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'products'
    | 'add_product'
    | 'update_stock'
    | 'record_sale'
    | 'stock_history'
    | 'alerts'
    | 'reports'
    | 'settings'
    | 'project_info'
  >('dashboard');

  // Application Data State
  const [products, setProducts] = useState<Product[]>(() => loadStoredProducts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadStoredTransactions());

  // Search & Filter State
  const [globalSearch, setGlobalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('All');

  // Notification Modal / Dropdown
  const [showNotifications, setShowNotifications] = useState(false);

  // Modals for Products
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);

  // Form State for Add Product
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Stationery');
  const [newPrice, setNewPrice] = useState('50');
  const [newQuantity, setNewQuantity] = useState('20');
  const [newReorder, setNewReorder] = useState('10');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form State for Stock In
  const [stockInProductId, setStockInProductId] = useState<string>('');
  const [stockInQty, setStockInQty] = useState('10');
  const [stockInNotes, setStockInNotes] = useState('');
  const [stockInMsg, setStockInMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for Record Sale
  const [saleProductId, setSaleProductId] = useState<string>('');
  const [saleQty, setSaleQty] = useState('1');
  const [saleNotes, setSaleNotes] = useState('');
  const [saleMsg, setSaleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for Stock Adjust
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Python Code Viewer State
  const [selectedPythonFile, setSelectedPythonFile] = useState<keyof typeof PYTHON_FILES>('app.py');
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync state to localStorage whenever modified
  const updateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveStoredProducts(newProducts);
  };

  const updateTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    saveStoredTransactions(newTransactions);
  };

  // Metrics
  const metrics = useMemo(() => calculateMetrics(products), [products]);

  // Alerts
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level),
    [products]
  );
  const outOfStockProducts = useMemo(
    () => products.filter((p) => p.stock_quantity === 0),
    [products]
  );
  const totalAlerts = lowStockProducts.length + outOfStockProducts.length;

  // Filtered Products Catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = globalSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.product_id.toLowerCase().includes(q) ||
        p.product_name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;

      const status = getStockStatus(p.stock_quantity, p.reorder_level);
      const matchStatus = statusFilter === 'All' || status === statusFilter;

      return matchSearch && matchCat && matchStatus;
    });
  }, [products, globalSearch, categoryFilter, statusFilter]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = historyTypeFilter === 'All' || t.movement_type === historyTypeFilter;
      const q = globalSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.product_id.toLowerCase().includes(q) ||
        t.product_name.toLowerCase().includes(q) ||
        t.transaction_id.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [transactions, historyTypeFilter, globalSearch]);

  // Handlers
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Regex check: ^[A-Za-z0-9_-]+$
    const cleanId = newId.trim();
    if (!cleanId) {
      setFormError('Product ID cannot be empty.');
      return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(cleanId)) {
      setFormError('Product ID must contain only letters, numbers, underscores, or hyphens (e.g. P006, ITEM-12).');
      return;
    }
    if (products.some((p) => p.product_id.toUpperCase() === cleanId.toUpperCase())) {
      setFormError(`Product ID '${cleanId}' already exists. Choose a unique ID.`);
      return;
    }

    const cleanName = newName.trim();
    if (!cleanName) {
      setFormError('Product Name cannot be empty.');
      return;
    }

    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      setFormError('Unit Price must be a valid positive number greater than 0.');
      return;
    }

    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      setFormError('Stock Quantity must be a whole non-negative integer (>= 0).');
      return;
    }

    const reorder = parseInt(newReorder, 10);
    if (isNaN(reorder) || reorder < 0) {
      setFormError('Reorder Level must be a whole non-negative integer (>= 0).');
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newProduct: Product = {
      product_id: cleanId,
      product_name: cleanName,
      category: newCategory.trim() || 'General',
      unit_price: Number(price.toFixed(2)),
      stock_quantity: qty,
      reorder_level: reorder,
      date_created: now,
      last_updated: now,
      is_sample: false,
    };

    const nextProducts = [...products, newProduct];
    updateProducts(nextProducts);

    // Also record transaction if initial stock > 0
    if (qty > 0) {
      const initialTx: Transaction = {
        transaction_id: `TX-ADD-${Date.now()}`,
        timestamp: now,
        product_id: cleanId,
        product_name: cleanName,
        movement_type: 'Stock In',
        quantity_changed: qty,
        previous_quantity: 0,
        new_quantity: qty,
        notes: 'Initial inventory registration',
      };
      updateTransactions([initialTx, ...transactions]);
    }

    setFormSuccess(`✓ Product "${cleanName}" (${cleanId}) registered successfully!`);
    setNewId('');
    setNewName('');
    setNewPrice('50');
    setNewQuantity('20');
    setNewReorder('10');
  };

  const handleStockIn = (productId: string, quantityToAdd: number, notes: string) => {
    if (quantityToAdd <= 0) {
      setStockInMsg({ type: 'error', text: 'Quantity added must be a positive integer.' });
      return;
    }
    const target = products.find((p) => p.product_id === productId);
    if (!target) {
      setStockInMsg({ type: 'error', text: 'Selected product was not found.' });
      return;
    }

    const prevQty = target.stock_quantity;
    const newQty = prevQty + quantityToAdd;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updated = products.map((p) =>
      p.product_id === productId ? { ...p, stock_quantity: newQty, last_updated: now } : p
    );
    updateProducts(updated);

    const tx: Transaction = {
      transaction_id: `TX-IN-${Date.now()}`,
      timestamp: now,
      product_id: productId,
      product_name: target.product_name,
      movement_type: 'Stock In',
      quantity_changed: quantityToAdd,
      previous_quantity: prevQty,
      new_quantity: newQty,
      notes: notes || 'Stock replenishment',
    };
    updateTransactions([tx, ...transactions]);
    setStockInMsg({
      type: 'success',
      text: `✓ Added ${quantityToAdd} units to ${target.product_name}. New Balance: ${newQty} units.`,
    });
    setStockInNotes('');
  };

  const handleRecordSale = (productId: string, quantitySold: number, notes: string) => {
    if (quantitySold <= 0) {
      setSaleMsg({ type: 'error', text: 'Sale quantity must be a positive integer.' });
      return;
    }
    const target = products.find((p) => p.product_id === productId);
    if (!target) {
      setSaleMsg({ type: 'error', text: 'Selected product was not found.' });
      return;
    }
    if (quantitySold > target.stock_quantity) {
      setSaleMsg({
        type: 'error',
        text: `Cannot sell ${quantitySold} units! Only ${target.stock_quantity} units available. (Negative stock prevented)`,
      });
      return;
    }

    const prevQty = target.stock_quantity;
    const newQty = prevQty - quantitySold;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updated = products.map((p) =>
      p.product_id === productId ? { ...p, stock_quantity: newQty, last_updated: now } : p
    );
    updateProducts(updated);

    const tx: Transaction = {
      transaction_id: `TX-OUT-${Date.now()}`,
      timestamp: now,
      product_id: productId,
      product_name: target.product_name,
      movement_type: 'Sale',
      quantity_changed: -quantitySold,
      previous_quantity: prevQty,
      new_quantity: newQty,
      notes: notes || 'Customer retail sale',
    };
    updateTransactions([tx, ...transactions]);
    setSaleMsg({
      type: 'success',
      text: `✓ Sold ${quantitySold} units of ${target.product_name}. Remaining stock: ${newQty} units.`,
    });
    setSaleNotes('');
  };

  const handleManualAdjust = (productId: string, newTotalQty: number, notes: string) => {
    if (newTotalQty < 0) return;
    const target = products.find((p) => p.product_id === productId);
    if (!target) return;

    const prevQty = target.stock_quantity;
    const diff = newTotalQty - prevQty;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updated = products.map((p) =>
      p.product_id === productId ? { ...p, stock_quantity: newTotalQty, last_updated: now } : p
    );
    updateProducts(updated);

    const tx: Transaction = {
      transaction_id: `TX-ADJ-${Date.now()}`,
      timestamp: now,
      product_id: productId,
      product_name: target.product_name,
      movement_type: 'Adjustment',
      quantity_changed: diff,
      previous_quantity: prevQty,
      new_quantity: newTotalQty,
      notes: notes || 'Physical inventory reconciliation',
    };
    updateTransactions([tx, ...transactions]);
    setAdjustingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.product_id !== productId);
    updateProducts(updated);
    setDeletingProduct(null);
  };

  const handleLoadSampleData = () => {
    const existingIds = new Set(products.map((p) => p.product_id.toUpperCase()));
    const toAdd = INITIAL_SAMPLE_PRODUCTS.filter((s) => !existingIds.has(s.product_id.toUpperCase()));
    if (toAdd.length > 0) {
      updateProducts([...products, ...toAdd]);
    }
  };

  const handleClearDemoData = () => {
    const sampleIds = new Set(INITIAL_SAMPLE_PRODUCTS.map((s) => s.product_id.toUpperCase()));
    const remaining = products.filter((p) => !p.is_sample && !sampleIds.has(p.product_id.toUpperCase()));
    updateProducts(remaining);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_FILES[selectedPythonFile]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#061426] text-[#F1F7FF] font-sans antialiased selection:bg-[#00D4FF] selection:text-[#061426]">
      {/* =========================================================================
          1. SIDEBAR NAVIGATION
          ========================================================================= */}
      <aside className="w-64 flex-shrink-0 flex flex-col justify-between bg-[#081A2F] border-r border-[#174567] relative z-20">
        <div>
          {/* Logo Branding */}
          <div className="p-5 border-b border-[#174567]/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] via-[#168BFF] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_18px_rgba(0,212,255,0.45)]">
              <Box className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight leading-none text-[#F1F7FF] flex items-center gap-1.5">
                StockFlow
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30">
                  CSE1012
                </span>
              </div>
              <p className="text-[11px] font-medium tracking-wider uppercase text-[#00D4FF] mt-1">
                Inventory Management
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'products', label: 'Products', icon: Package, badge: products.length },
              { id: 'add_product', label: 'Add Product', icon: PlusCircle },
              { id: 'update_stock', label: 'Update Stock', icon: ArrowDownToLine },
              { id: 'record_sale', label: 'Record Sale', icon: ShoppingCart },
              { id: 'stock_history', label: 'Stock History', icon: History },
              { id: 'alerts', label: 'Low-Stock Alerts', icon: AlertTriangle, badge: totalAlerts, alertBadge: true },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
              { id: 'project_info', label: 'Academic & Python Code', icon: GraduationCap },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#168BFF] to-[#8B5CF6] text-white shadow-[0_0_15px_rgba(22,139,255,0.4)]'
                      : 'text-[#94A9C3] hover:text-[#F1F7FF] hover:bg-[#102A46]/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-[#00D4FF] group-hover:text-white'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.alertBadge && item.badge > 0
                          ? 'bg-[#FF4D79]/20 text-[#FF4D79] border border-[#FF4D79]/40'
                          : 'bg-[#102A46] text-[#94A9C3] border border-[#174567]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Status and Wave Aesthetic */}
        <div className="p-3 border-t border-[#174567]/60 bg-[#061426]/60">
          <div className="bg-[#0B2038] border border-[#174567] rounded-xl p-3 text-xs space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between text-[#94A9C3]">
              <span className="font-semibold text-[#00D4FF] uppercase tracking-wider text-[10px]">
                Storage Mode
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#00D6A3] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D6A3] animate-pulse"></span>
                JSON Active
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#7186A3]">Active Items:</span>
              <span className="text-white font-bold">{products.length}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#7186A3]">Audit Records:</span>
              <span className="text-white font-bold">{transactions.length}</span>
            </div>
            {/* Subtle decorative cyan wave */}
            <div className="absolute -bottom-2 -right-4 w-24 h-12 bg-[#00D4FF]/10 rounded-full blur-xl pointer-events-none"></div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA WITH TOP HEADER
          ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 bg-[#081A2F]/90 backdrop-blur-md border-b border-[#174567] px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Search Bar */}
          <div className="relative w-96">
            <Search className="w-4 h-4 text-[#7186A3] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, category or ID..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-[#102A46] border border-[#174567] rounded-xl pl-9 pr-4 py-2 text-sm text-[#F1F7FF] placeholder-[#7186A3] focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-all"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7186A3] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Header: Alerts, Academic Tag & User Profile */}
          <div className="flex items-center gap-3">
            {/* Download .7z Button in Header */}
            <button
              onClick={() => download7zArchive('StockFlow_Project.7z')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#00D4FF] to-[#168BFF] text-[#061426] hover:brightness-110 px-3 py-1.5 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(0,212,255,0.35)] transition-all cursor-pointer"
              title="Download StockFlow as 7-Zip Archive (.7z)"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Download .7z (7-Zip)</span>
            </button>

            {/* Download Python Auto-Setup Script */}
            <button
              onClick={() => downloadSetupPythonScript()}
              className="hidden lg:flex items-center gap-1.5 bg-[#102A46] hover:bg-[#174567] text-[#00D6A3] border border-[#00D6A3]/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              title="Download 1-File Setup Script (No 7-Zip Needed)"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Setup Script (.py)</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-[#102A46] border border-[#174567] text-[#94A9C3] hover:text-[#00D4FF] transition-colors"
                title="Stock Alerts"
              >
                <Bell className="w-4 h-4" />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF4D79] text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {totalAlerts}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0B2038] border border-[#174567] rounded-2xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#174567] mb-3">
                    <span className="font-bold text-sm text-white">Inventory Notifications</span>
                    <span className="text-[11px] text-[#94A9C3]">{totalAlerts} active alerts</span>
                  </div>
                  {totalAlerts === 0 ? (
                    <div className="py-6 text-center text-[#94A9C3] text-xs">
                      <CheckCircle2 className="w-8 h-8 text-[#00D6A3] mx-auto mb-2" />
                      All products have healthy inventory!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {outOfStockProducts.map((p) => (
                        <div
                          key={p.product_id}
                          className="p-2.5 rounded-lg bg-[#FF4D79]/10 border border-[#FF4D79]/30 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-[#FF4D79]">{p.product_name}</div>
                            <div className="text-[10px] text-[#94A9C3]">0 Units left (Stockout)</div>
                          </div>
                          <button
                            onClick={() => {
                              setQuickRestockProduct(p);
                              setShowNotifications(false);
                            }}
                            className="text-[10px] bg-[#FF4D79] text-white px-2 py-1 rounded font-semibold hover:bg-[#FF4D79]/80"
                          >
                            Restock
                          </button>
                        </div>
                      ))}
                      {lowStockProducts.map((p) => (
                        <div
                          key={p.product_id}
                          className="p-2.5 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/30 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-[#FFB020]">{p.product_name}</div>
                            <div className="text-[10px] text-[#94A9C3]">
                              {p.stock_quantity} left (Reorder: {p.reorder_level})
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setQuickRestockProduct(p);
                              setShowNotifications(false);
                            }}
                            className="text-[10px] bg-[#FFB020] text-[#061426] px-2 py-1 rounded font-bold hover:bg-[#FFB020]/80"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab('alerts');
                      setShowNotifications(false);
                    }}
                    className="w-full mt-3 py-1.5 text-center text-xs font-semibold text-[#00D4FF] hover:underline"
                  >
                    Open Low-Stock Center →
                  </button>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 border-l border-[#174567]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#168BFF] to-[#00D4FF] flex items-center justify-center font-bold text-xs text-white shadow-[0_0_10px_rgba(0,212,255,0.3)]">
                AD
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold text-white">Hello, Admin</div>
                <div className="text-[10px] text-[#7186A3]">{todayStr}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* ===================================================================
              PAGE 1: DASHBOARD
              =================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Intro */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
                  <p className="text-xs text-[#94A9C3]">
                    Overview of your inventory valuation, movements, and stock health
                  </p>
                </div>
                {/* Quick Action Ribbon */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('add_product')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#168BFF] to-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] hover:brightness-110 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add New Product</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('update_stock')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#102A46] text-[#00D4FF] border border-[#174567] hover:border-[#00D4FF]/60 transition-all"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Stock In</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('record_sale')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#102A46] text-[#8B5CF6] border border-[#174567] hover:border-[#8B5CF6]/60 transition-all"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Record Sale</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#102A46] text-[#00D6A3] border border-[#174567] hover:border-[#00D6A3]/60 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Reports</span>
                  </button>
                </div>
              </div>

              {/* 6 Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* 1. Total Products */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#00D4FF] transition-all rounded-2xl p-4 shadow-lg group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A9C3]">
                      Total Products
                    </span>
                    <div className="p-1.5 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF]">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white group-hover:text-[#00D4FF] transition-colors">
                    {metrics.total_products}
                  </div>
                  <div className="text-[10px] text-[#7186A3] mt-1">Catalog items</div>
                </div>

                {/* 2. Stock Value (₹) */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#8B5CF6] transition-all rounded-2xl p-4 shadow-lg group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A9C3]">
                      Stock Value
                    </span>
                    <div className="p-1.5 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6]">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white group-hover:text-[#8B5CF6] transition-colors truncate">
                    {formatINR(metrics.total_stock_value)}
                  </div>
                  <div className="text-[10px] text-[#7186A3] mt-1">Total valuation (₹)</div>
                </div>

                {/* 3. Low Stock */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#FFB020] transition-all rounded-2xl p-4 shadow-lg group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A9C3]">
                      Low Stock
                    </span>
                    <div className="p-1.5 rounded-lg bg-[#FFB020]/10 text-[#FFB020]">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#FFB020]">
                    {metrics.low_stock_count}
                  </div>
                  <div className="text-[10px] text-[#7186A3] mt-1">At/under threshold</div>
                </div>

                {/* 4. In Stock Units */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#00D6A3] transition-all rounded-2xl p-4 shadow-lg group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A9C3]">
                      In Stock Units
                    </span>
                    <div className="p-1.5 rounded-lg bg-[#00D6A3]/10 text-[#00D6A3]">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#00D6A3]">
                    {metrics.total_units}
                  </div>
                  <div className="text-[10px] text-[#7186A3] mt-1">Physical inventory units</div>
                </div>

                {/* 5. Out of Stock */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#FF4D79] transition-all rounded-2xl p-4 shadow-lg group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A9C3]">
                      Out of Stock
                    </span>
                    <div className="p-1.5 rounded-lg bg-[#FF4D79]/10 text-[#FF4D79]">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#FF4D79]">
                    {metrics.out_of_stock_count}
                  </div>
                  <div className="text-[10px] text-[#7186A3] mt-1">0 units remaining</div>
                </div>

                {/* 6. Categories */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#168BFF] transition-all rounded-2xl p-4 shadow-lg group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A9C3]">
                      Categories
                    </span>
                    <div className="p-1.5 rounded-lg bg-[#168BFF]/10 text-[#168BFF]">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white group-hover:text-[#168BFF] transition-colors">
                    {metrics.total_categories}
                  </div>
                  <div className="text-[10px] text-[#7186A3] mt-1">Product groupings</div>
                </div>
              </div>

              {/* Analytics Section: Stock Movement Trend & Category Distribution Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Stock Movement Visualizer */}
                <div className="lg:col-span-7 bg-[#0B2038] border border-[#174567] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF]"></span>
                          Stock Movement Overview
                        </h3>
                        <p className="text-xs text-[#94A9C3]">
                          Chronological inbound replenishment vs customer sales
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 text-[#00D6A3]">
                          <span className="w-2 h-2 rounded-full bg-[#00D6A3]"></span> Inbound
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#FF4D79]">
                          <span className="w-2 h-2 rounded-full bg-[#FF4D79]"></span> Sales
                        </span>
                      </div>
                    </div>

                    {/* Interactive Chart Container */}
                    <div className="h-48 w-full flex items-end gap-2 pt-6 pb-2 px-2 bg-[#081A2F] border border-[#174567]/60 rounded-xl overflow-x-auto">
                      {transactions.slice(0, 10).reverse().map((t, idx) => {
                        const isPositive = t.quantity_changed > 0;
                        const heightPercent = Math.min(
                          100,
                          Math.max(15, (Math.abs(t.quantity_changed) / 100) * 85)
                        );
                        return (
                          <div
                            key={t.transaction_id || idx}
                            className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group min-w-[38px]"
                          >
                            <span className="text-[10px] font-semibold text-[#94A9C3] opacity-0 group-hover:opacity-100 transition-opacity">
                              {isPositive ? `+${t.quantity_changed}` : t.quantity_changed}
                            </span>
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-t-lg transition-all ${
                                isPositive
                                  ? 'bg-gradient-to-t from-[#00D6A3]/60 to-[#00D6A3] shadow-[0_0_8px_rgba(0,214,163,0.3)]'
                                  : 'bg-gradient-to-t from-[#FF4D79]/60 to-[#FF4D79] shadow-[0_0_8px_rgba(255,77,121,0.3)]'
                              }`}
                            ></div>
                            <span className="text-[9px] text-[#7186A3] truncate max-w-[42px]">
                              {t.product_name.slice(0, 5)}
                            </span>
                          </div>
                        );
                      })}
                      {transactions.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#7186A3]">
                          No stock movement transactions recorded yet.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#174567]/60 flex items-center justify-between text-xs text-[#94A9C3]">
                    <span>Showing last 10 transactions</span>
                    <button
                      onClick={() => setActiveTab('stock_history')}
                      className="text-[#00D4FF] hover:underline font-semibold flex items-center gap-1"
                    >
                      View full movement log →
                    </button>
                  </div>
                </div>

                {/* Donut Chart: Product Distribution by Category */}
                <div className="lg:col-span-5 bg-[#0B2038] border border-[#174567] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
                          Product Distribution
                        </h3>
                        <p className="text-xs text-[#94A9C3]">Inventory share by category</p>
                      </div>
                    </div>

                    {/* Donut representation */}
                    <div className="flex items-center justify-center py-2">
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          {(() => {
                            const cats = Object.values(metrics.category_valuation);
                            const total = metrics.total_products || 1;
                            let cumulativePercent = 0;
                            const colors = ['#00D4FF', '#8B5CF6', '#168BFF', '#00D6A3', '#FFB020', '#FF4D79'];

                            return cats.map((cat, i) => {
                              const pct = (cat.product_count / total) * 100;
                              const strokeDasharray = `${pct} ${100 - pct}`;
                              const strokeDashoffset = -cumulativePercent;
                              cumulativePercent += pct;
                              return (
                                <circle
                                  key={cat.category}
                                  cx="50"
                                  cy="50"
                                  r="38"
                                  fill="transparent"
                                  stroke={colors[i % colors.length]}
                                  strokeWidth="15"
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={strokeDashoffset}
                                  pathLength="100"
                                  className="transition-all hover:stroke-width-18"
                                />
                              );
                            });
                          })()}
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-black text-white">{metrics.total_products}</span>
                          <span className="text-[10px] uppercase font-bold text-[#7186A3]">Items</span>
                        </div>
                      </div>
                    </div>

                    {/* Category Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#174567]/60">
                      {Object.values(metrics.category_valuation).map((cat, i) => {
                        const colors = ['#00D4FF', '#8B5CF6', '#168BFF', '#00D6A3', '#FFB020', '#FF4D79'];
                        return (
                          <div key={cat.category} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-[#94A9C3] truncate">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: colors[i % colors.length] }}
                              ></span>
                              <span className="truncate">{cat.category}</span>
                            </span>
                            <span className="font-bold text-white ml-2">{cat.product_count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Section: Recent Products & Critical Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Products */}
                <div className="lg:col-span-7 bg-[#0B2038] border border-[#174567] rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#00D4FF]" />
                      Recent Products
                    </h3>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="text-xs text-[#00D4FF] hover:underline font-semibold"
                    >
                      View All Products →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#174567] text-[#7186A3] font-semibold uppercase tracking-wider">
                          <th className="pb-2.5">Product</th>
                          <th className="pb-2.5">Category</th>
                          <th className="pb-2.5">Price</th>
                          <th className="pb-2.5">Stock</th>
                          <th className="pb-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#174567]/40">
                        {products.slice(0, 5).map((p) => {
                          const status = getStockStatus(p.stock_quantity, p.reorder_level);
                          return (
                            <tr key={p.product_id} className="hover:bg-[#102A46]/40 transition-colors">
                              <td className="py-2.5">
                                <div className="font-bold text-white">{p.product_name}</div>
                                <div className="text-[10px] text-[#00D4FF] font-mono">{p.product_id}</div>
                              </td>
                              <td className="py-2.5 text-[#94A9C3]">{p.category}</td>
                              <td className="py-2.5 font-bold text-white">{formatINR(p.unit_price)}</td>
                              <td className="py-2.5 font-bold text-white">{p.stock_quantity}</td>
                              <td className="py-2.5">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    status === 'In Stock'
                                      ? 'bg-[#00D6A3]/15 text-[#00D6A3] border border-[#00D6A3]/30'
                                      : status === 'Low Stock'
                                      ? 'bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30'
                                      : 'bg-[#FF4D79]/15 text-[#FF4D79] border border-[#FF4D79]/30'
                                  }`}
                                >
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Stock Alerts Feed */}
                <div className="lg:col-span-5 bg-[#0B2038] border border-[#174567] rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#FFB020]" />
                      Stock Action Alerts
                    </h3>
                    <span className="text-xs text-[#94A9C3]">{totalAlerts} items</span>
                  </div>

                  <div className="space-y-2.5">
                    {totalAlerts === 0 ? (
                      <div className="p-6 text-center text-xs text-[#00D6A3] bg-[#00D6A3]/10 border border-[#00D6A3]/30 rounded-xl">
                        ✓ All stock levels are above reorder thresholds!
                      </div>
                    ) : (
                      <>
                        {outOfStockProducts.slice(0, 2).map((p) => (
                          <div
                            key={p.product_id}
                            className="p-3 rounded-xl bg-[#FF4D79]/10 border border-[#FF4D79]/30 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[#FF4D79] flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {p.product_name}
                              </div>
                              <div className="text-[11px] text-[#94A9C3] mt-0.5">
                                0 on hand • Suggested Order: {Math.max(1, p.reorder_level)}
                              </div>
                            </div>
                            <button
                              onClick={() => setQuickRestockProduct(p)}
                              className="px-2.5 py-1 bg-[#FF4D79] hover:bg-[#FF4D79]/90 text-white rounded-lg text-xs font-bold"
                            >
                              Restock
                            </button>
                          </div>
                        ))}
                        {lowStockProducts.slice(0, 2).map((p) => (
                          <div
                            key={p.product_id}
                            className="p-3 rounded-xl bg-[#FFB020]/10 border border-[#FFB020]/30 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[#FFB020] flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {p.product_name}
                              </div>
                              <div className="text-[11px] text-[#94A9C3] mt-0.5">
                                {p.stock_quantity} left • Reorder point: {p.reorder_level}
                              </div>
                            </div>
                            <button
                              onClick={() => setQuickRestockProduct(p)}
                              className="px-2.5 py-1 bg-[#FFB020] hover:bg-[#FFB020]/90 text-[#061426] rounded-lg text-xs font-bold"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className="w-full mt-4 py-2 rounded-xl text-xs font-semibold bg-[#102A46] text-[#00D4FF] border border-[#174567] hover:border-[#00D4FF]/60 transition-all text-center block"
                  >
                    View All Low & Out of Stock Alerts →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              PAGE 2: PRODUCTS CATALOG
              =================================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Product Catalog</h1>
                  <p className="text-xs text-[#94A9C3]">
                    Search, filter, edit, adjust stock, and manage your inventory items
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add_product')}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#168BFF] to-[#8B5CF6] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(22,139,255,0.35)]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Filter Controls Bar */}
              <div className="bg-[#0B2038] border border-[#174567] rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7186A3] font-medium">Category:</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-[#102A46] border border-[#174567] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00D4FF]"
                    >
                      <option value="All">All Categories</option>
                      {metrics.categories_list.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7186A3] font-medium">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#102A46] border border-[#174567] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00D4FF]"
                    >
                      <option value="All">All Statuses</option>
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs text-[#00D4FF] font-semibold">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-[#0B2038] border border-[#174567] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#081A2F] border-b border-[#174567] text-[#7186A3] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Product ID</th>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Unit Price</th>
                        <th className="py-3 px-4">Stock Qty</th>
                        <th className="py-3 px-4">Reorder Pt</th>
                        <th className="py-3 px-4">Total Value</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#174567]/50">
                      {filteredProducts.map((p) => {
                        const status = getStockStatus(p.stock_quantity, p.reorder_level);
                        const val = p.unit_price * p.stock_quantity;
                        return (
                          <tr key={p.product_id} className="hover:bg-[#102A46]/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#00D4FF]">{p.product_id}</td>
                            <td className="py-3 px-4 font-bold text-white">{p.product_name}</td>
                            <td className="py-3 px-4 text-[#94A9C3]">{p.category}</td>
                            <td className="py-3 px-4 font-bold text-white">{formatINR(p.unit_price)}</td>
                            <td className="py-3 px-4 font-bold text-white">{p.stock_quantity}</td>
                            <td className="py-3 px-4 text-[#94A9C3]">{p.reorder_level}</td>
                            <td className="py-3 px-4 font-bold text-[#8B5CF6]">{formatINR(val)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                                  status === 'In Stock'
                                    ? 'bg-[#00D6A3]/15 text-[#00D6A3] border border-[#00D6A3]/30'
                                    : status === 'Low Stock'
                                    ? 'bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30'
                                    : 'bg-[#FF4D79]/15 text-[#FF4D79] border border-[#FF4D79]/30'
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setQuickRestockProduct(p)}
                                  title="Quick Stock In"
                                  className="p-1.5 rounded-lg bg-[#102A46] text-[#00D4FF] hover:bg-[#174567] transition-colors"
                                >
                                  <ArrowDownToLine className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingProduct(p)}
                                  title="Edit Product"
                                  className="p-1.5 rounded-lg bg-[#102A46] text-[#8B5CF6] hover:bg-[#174567] transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setAdjustingProduct(p);
                                    setAdjustQty(p.stock_quantity.toString());
                                    setAdjustNotes('');
                                  }}
                                  title="Traceable Stock Adjustment"
                                  className="p-1.5 rounded-lg bg-[#102A46] text-[#FFB020] hover:bg-[#174567] transition-colors"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingProduct(p)}
                                  title="Delete Product"
                                  className="p-1.5 rounded-lg bg-[#102A46] text-[#FF4D79] hover:bg-[#174567] transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-xs text-[#7186A3]">
                            No products match your current search or filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              PAGE 3: ADD PRODUCT
              =================================================================== */}
          {activeTab === 'add_product' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Add New Product</h1>
                <p className="text-xs text-[#94A9C3]">
                  Register a new item into persistent inventory with full academic validation checks
                </p>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-[#FF4D79]/15 border border-[#FF4D79]/40 text-[#FF4D79] text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3.5 rounded-xl bg-[#00D6A3]/15 border border-[#00D6A3]/40 text-[#00D6A3] text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddProduct} className="bg-[#0B2038] border border-[#174567] rounded-2xl p-6 shadow-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product ID */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                      Product ID <span className="text-[#00D4FF]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. P006, ITEM_12, SKU-99"
                      value={newId}
                      onChange={(e) => setNewId(e.target.value)}
                      className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                      required
                    />
                    <span className="text-[10px] text-[#7186A3] mt-0.5 block">
                      Format: alphanumeric, underscores, hyphens
                    </span>
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                      Product Name <span className="text-[#00D4FF]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gel Pen Blue 0.5mm"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                      Category <span className="text-[#00D4FF]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stationery, Electronics, Hardware"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                      required
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                      Unit Price (₹) <span className="text-[#00D4FF]">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="50.00"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                      required
                    />
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                      Initial Quantity <span className="text-[#00D4FF]">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="20"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                      required
                    />
                  </div>

                  {/* Reorder Level */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                      Reorder Threshold Level <span className="text-[#00D4FF]">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="10"
                      value={newReorder}
                      onChange={(e) => setNewReorder(e.target.value)}
                      className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#174567] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewId('');
                      setNewName('');
                      setFormError('');
                      setFormSuccess('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs text-[#94A9C3] hover:text-white"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#168BFF] to-[#8B5CF6] text-white shadow-[0_0_15px_rgba(22,139,255,0.4)] hover:brightness-110"
                  >
                    Save &amp; Register Product
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================================================================
              PAGE 4: UPDATE STOCK (STOCK IN)
              =================================================================== */}
          {activeTab === 'update_stock' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Stock Addition (Stock In)</h1>
                <p className="text-xs text-[#94A9C3]">
                  Record supplier shipments, replenishment batches, and stock receipts
                </p>
              </div>

              {stockInMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    stockInMsg.type === 'success'
                      ? 'bg-[#00D6A3]/15 border border-[#00D6A3]/40 text-[#00D6A3]'
                      : 'bg-[#FF4D79]/15 border border-[#FF4D79]/40 text-[#FF4D79]'
                  }`}
                >
                  {stockInMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{stockInMsg.text}</span>
                </div>
              )}

              <div className="bg-[#0B2038] border border-[#174567] rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                    Select Target Product
                  </label>
                  <select
                    value={stockInProductId || (products[0] ? products[0].product_id : '')}
                    onChange={(e) => setStockInProductId(e.target.value)}
                    className="w-full bg-[#102A46] border border-[#174567] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00D4FF]"
                  >
                    {products.map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.product_id} — {p.product_name} ({p.stock_quantity} in stock)
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const currentPid = stockInProductId || (products[0] ? products[0].product_id : '');
                  const selProd = products.find((p) => p.product_id === currentPid);
                  if (!selProd) return null;
                  const addNum = parseInt(stockInQty, 10) || 0;
                  const projectedTotal = selProd.stock_quantity + addNum;

                  return (
                    <>
                      {/* Product Preview Card */}
                      <div className="p-4 rounded-xl bg-[#081A2F] border border-[#174567] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{selProd.product_name}</div>
                          <div className="text-xs text-[#94A9C3]">
                            Category: {selProd.category} • Price: {formatINR(selProd.unit_price)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#7186A3] block uppercase font-bold">
                            Current Stock
                          </span>
                          <span className="text-xl font-black text-[#00D6A3]">
                            {selProd.stock_quantity} units
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                            Quantity to Add (Positive Integer)
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={stockInQty}
                            onChange={(e) => setStockInQty(e.target.value)}
                            className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                            Shipment Notes / Batch Reference
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Supplier Batch #892, Weekly restock"
                            value={stockInNotes}
                            onChange={(e) => setStockInNotes(e.target.value)}
                            className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                          />
                        </div>
                      </div>

                      {/* Calculation Preview */}
                      <div className="p-3 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-xl text-xs flex items-center justify-between text-[#00D4FF]">
                        <span>Projected Balance After Addition:</span>
                        <span className="font-bold text-sm">
                          {selProd.stock_quantity} + {addNum} = {projectedTotal} units
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStockIn(selProd.product_id, addNum, stockInNotes)}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#168BFF] to-[#00D4FF] text-white shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:brightness-110"
                      >
                        Confirm Stock In Transaction
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ===================================================================
              PAGE 5: RECORD SALE
              =================================================================== */}
          {activeTab === 'record_sale' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Record Product Sale</h1>
                <p className="text-xs text-[#94A9C3]">
                  Subtract customer sales from inventory with automatic negative stock boundary guards
                </p>
              </div>

              {saleMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    saleMsg.type === 'success'
                      ? 'bg-[#00D6A3]/15 border border-[#00D6A3]/40 text-[#00D6A3]'
                      : 'bg-[#FF4D79]/15 border border-[#FF4D79]/40 text-[#FF4D79]'
                  }`}
                >
                  {saleMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{saleMsg.text}</span>
                </div>
              )}

              <div className="bg-[#0B2038] border border-[#174567] rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                    Select Product Sold
                  </label>
                  <select
                    value={saleProductId || (products[0] ? products[0].product_id : '')}
                    onChange={(e) => setSaleProductId(e.target.value)}
                    className="w-full bg-[#102A46] border border-[#174567] text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#8B5CF6]"
                  >
                    {products.map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.product_id} — {p.product_name} ({p.stock_quantity} units available)
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const currentPid = saleProductId || (products[0] ? products[0].product_id : '');
                  const selProd = products.find((p) => p.product_id === currentPid);
                  if (!selProd) return null;
                  const saleNum = parseInt(saleQty, 10) || 0;
                  const remaining = selProd.stock_quantity - saleNum;
                  const isInsufficient = saleNum > selProd.stock_quantity;

                  return (
                    <>
                      {/* Product Preview Card */}
                      <div className="p-4 rounded-xl bg-[#081A2F] border border-[#174567] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{selProd.product_name}</div>
                          <div className="text-xs text-[#94A9C3]">
                            Category: {selProd.category} • Price: {formatINR(selProd.unit_price)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#7186A3] block uppercase font-bold">
                            Available Stock
                          </span>
                          <span
                            className={`text-xl font-black ${
                              selProd.stock_quantity === 0 ? 'text-[#FF4D79]' : 'text-[#00D6A3]'
                            }`}
                          >
                            {selProd.stock_quantity} units
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                            Units Sold (Positive Integer)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={selProd.stock_quantity}
                            step="1"
                            value={saleQty}
                            onChange={(e) => setSaleQty(e.target.value)}
                            className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                            Customer / Bill Remarks
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Counter sale, Bill #104"
                            value={saleNotes}
                            onChange={(e) => setSaleNotes(e.target.value)}
                            className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                          />
                        </div>
                      </div>

                      {/* Calculation Preview */}
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                          isInsufficient
                            ? 'bg-[#FF4D79]/10 border border-[#FF4D79]/40 text-[#FF4D79]'
                            : 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#8B5CF6]'
                        }`}
                      >
                        <span>Remaining Balance After Sale:</span>
                        <span className="font-bold text-sm">
                          {selProd.stock_quantity} - {saleNum} = {isInsufficient ? 'Error: Negative' : `${remaining} units`}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isInsufficient || selProd.stock_quantity === 0}
                        onClick={() => handleRecordSale(selProd.product_id, saleNum, saleNotes)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isInsufficient || selProd.stock_quantity === 0
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#168BFF] to-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:brightness-110'
                        }`}
                      >
                        {isInsufficient ? 'Insufficient Stock to Fulfill Sale' : 'Confirm Sale Transaction'}
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ===================================================================
              PAGE 6: STOCK HISTORY & TRANSACTIONS
              =================================================================== */}
          {activeTab === 'stock_history' && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Stock Movement History</h1>
                  <p className="text-xs text-[#94A9C3]">
                    Traceable chronological audit log of all stock receipts, sales, and inventory adjustments
                  </p>
                </div>
                <button
                  onClick={() => {
                    const csv = generateCSVReport('movements', products, transactions);
                    downloadFile(csv, `StockFlow_Transactions_${todayStr}.csv`, 'text/csv');
                  }}
                  className="flex items-center gap-2 bg-[#102A46] text-[#00D4FF] border border-[#00D4FF]/40 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[#174567] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Transactions CSV</span>
                </button>
              </div>

              {/* Filter Row */}
              <div className="bg-[#0B2038] border border-[#174567] rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#7186A3] font-medium">Movement Type:</span>
                  <select
                    value={historyTypeFilter}
                    onChange={(e) => setHistoryTypeFilter(e.target.value)}
                    className="bg-[#102A46] border border-[#174567] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00D4FF]"
                  >
                    <option value="All">All Movements</option>
                    <option value="Stock In">Stock In</option>
                    <option value="Sale">Sale</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>
                <div className="text-xs text-[#00D4FF] font-semibold">
                  Showing {filteredTransactions.length} transactions
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-[#0B2038] border border-[#174567] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#081A2F] border-b border-[#174567] text-[#7186A3] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Transaction ID</th>
                        <th className="py-3 px-4">Date &amp; Time</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Movement</th>
                        <th className="py-3 px-4">Qty Changed</th>
                        <th className="py-3 px-4">Previous Qty</th>
                        <th className="py-3 px-4">New Balance</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#174567]/50">
                      {filteredTransactions.map((t) => {
                        const isPositive = t.quantity_changed > 0;
                        return (
                          <tr key={t.transaction_id} className="hover:bg-[#102A46]/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-[#00D4FF] font-semibold">
                              {t.transaction_id}
                            </td>
                            <td className="py-3 px-4 text-[#94A9C3] font-mono">{t.timestamp}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-white">{t.product_name}</span>
                              <span className="text-[10px] text-[#7186A3] ml-1.5">({t.product_id})</span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                  t.movement_type === 'Stock In'
                                    ? 'bg-[#00D6A3]/15 text-[#00D6A3] border border-[#00D6A3]/30'
                                    : t.movement_type === 'Sale'
                                    ? 'bg-[#FF4D79]/15 text-[#FF4D79] border border-[#FF4D79]/30'
                                    : 'bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30'
                                }`}
                              >
                                {t.movement_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold font-mono">
                              <span className={isPositive ? 'text-[#00D6A3]' : 'text-[#FF4D79]'}>
                                {isPositive ? `+${t.quantity_changed}` : t.quantity_changed}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#94A9C3]">{t.previous_quantity}</td>
                            <td className="py-3 px-4 font-bold text-white">{t.new_quantity}</td>
                            <td className="py-3 px-4 text-[#94A9C3] max-w-[200px] truncate">{t.notes}</td>
                          </tr>
                        );
                      })}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-xs text-[#7186A3]">
                            No transactions found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              PAGE 7: LOW-STOCK & REORDER ALERTS
              =================================================================== */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Low-Stock &amp; Reorder Alerts</h1>
                <p className="text-xs text-[#94A9C3]">
                  Automated reorder thresholds calculated to prevent store stockouts
                </p>
              </div>

              {totalAlerts === 0 ? (
                <div className="bg-[#0B2038] border border-[#00D6A3]/30 rounded-2xl p-12 text-center shadow-xl">
                  <CheckCircle2 className="w-12 h-12 text-[#00D6A3] mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">All Stock Levels Healthy!</h3>
                  <p className="text-xs text-[#94A9C3] mt-1 max-w-md mx-auto">
                    Every product in your inventory currently has units safely above its designated reorder threshold.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Out of Stock Section */}
                  {outOfStockProducts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#FF4D79]">
                        <AlertCircle className="w-4 h-4" />
                        <span>Critical Out of Stock ({outOfStockProducts.length})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {outOfStockProducts.map((p) => {
                          const suggested = Math.max(1, p.reorder_level);
                          return (
                            <div
                              key={p.product_id}
                              className="bg-[#0B2038] border border-[#FF4D79]/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-xs text-[#00D4FF] font-bold">
                                    {p.product_id}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FF4D79]/20 text-[#FF4D79] border border-[#FF4D79]/40">
                                    0 Left
                                  </span>
                                </div>
                                <h4 className="font-bold text-white text-base">{p.product_name}</h4>
                                <div className="text-xs text-[#94A9C3] mt-1">
                                  Category: {p.category} • Price: {formatINR(p.unit_price)}
                                </div>
                                <div className="mt-3 p-2.5 rounded-xl bg-[#081A2F] border border-[#174567] text-xs flex justify-between">
                                  <span className="text-[#7186A3]">Suggested Reorder:</span>
                                  <span className="font-bold text-[#00D4FF]">{suggested} units</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setQuickRestockProduct(p)}
                                className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-[#FF4D79] hover:bg-[#FF4D79]/90 text-white shadow-[0_0_12px_rgba(255,77,121,0.4)]"
                              >
                                Restock Now
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Low Stock Warning Section */}
                  {lowStockProducts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#FFB020]">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Low Stock Warnings ({lowStockProducts.length})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lowStockProducts.map((p) => {
                          const suggested = Math.max(0, p.reorder_level - p.stock_quantity);
                          return (
                            <div
                              key={p.product_id}
                              className="bg-[#0B2038] border border-[#FFB020]/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-xs text-[#00D4FF] font-bold">
                                    {p.product_id}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/40">
                                    {p.stock_quantity} Remaining
                                  </span>
                                </div>
                                <h4 className="font-bold text-white text-base">{p.product_name}</h4>
                                <div className="text-xs text-[#94A9C3] mt-1">
                                  Category: {p.category} • Reorder Threshold: {p.reorder_level}
                                </div>
                                <div className="mt-3 p-2.5 rounded-xl bg-[#081A2F] border border-[#174567] text-xs flex justify-between">
                                  <span className="text-[#7186A3]">Replenishment Needed:</span>
                                  <span className="font-bold text-[#00D4FF]">{suggested} units</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setQuickRestockProduct(p)}
                                className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-[#FFB020] hover:bg-[#FFB020]/90 text-[#061426] shadow-[0_0_12px_rgba(255,176,32,0.4)]"
                              >
                                Replenish Stock
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              PAGE 8: REPORTS & EXPORTS
              =================================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Reports &amp; Data Exports</h1>
                <p className="text-xs text-[#94A9C3]">
                  Generate, inspect, and download official CSV spreadsheets for management audits
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Complete Inventory */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#00D4FF] transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">Complete Inventory Report</h3>
                    <p className="text-xs text-[#94A9C3] mt-1">
                      Full catalog sheet with product IDs, categories, prices, quantities, valuations, and stock statuses.
                    </p>
                    <div className="mt-4 text-[11px] text-[#7186A3] space-y-1">
                      <div>Total Items: <b className="text-white">{products.length}</b></div>
                      <div>Total Valuation: <b className="text-[#00D4FF]">{formatINR(metrics.total_stock_value)}</b></div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const csv = generateCSVReport('inventory', products, transactions);
                      downloadFile(csv, `StockFlow_Complete_Inventory_${todayStr}.csv`, 'text/csv');
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-[#102A46] hover:bg-[#00D4FF] text-[#00D4FF] hover:text-[#061426] border border-[#00D4FF]/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Inventory CSV</span>
                  </button>
                </div>

                {/* 2. Low-Stock Report */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#FFB020] transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-[#FFB020]/10 text-[#FFB020] flex items-center justify-center mb-3">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">Low-Stock &amp; Reorder Report</h3>
                    <p className="text-xs text-[#94A9C3] mt-1">
                      Lists items under threshold with suggested order quantities and capital required to restock.
                    </p>
                    <div className="mt-4 text-[11px] text-[#7186A3] space-y-1">
                      <div>Items at Risk: <b className="text-[#FFB020]">{lowStockProducts.length}</b></div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const csv = generateCSVReport('low_stock', products, transactions);
                      downloadFile(csv, `StockFlow_LowStock_${todayStr}.csv`, 'text/csv');
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-[#102A46] hover:bg-[#FFB020] text-[#FFB020] hover:text-[#061426] border border-[#FFB020]/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Low-Stock CSV</span>
                  </button>
                </div>

                {/* 3. Out-of-Stock Report */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#FF4D79] transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-[#FF4D79]/10 text-[#FF4D79] flex items-center justify-center mb-3">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">Out-of-Stock Sheet</h3>
                    <p className="text-xs text-[#94A9C3] mt-1">
                      Identifies stockouts (0 units available) requiring emergency purchasing orders.
                    </p>
                    <div className="mt-4 text-[11px] text-[#7186A3] space-y-1">
                      <div>Stockout Count: <b className="text-[#FF4D79]">{outOfStockProducts.length}</b></div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const csv = generateCSVReport('out_of_stock', products, transactions);
                      downloadFile(csv, `StockFlow_OutOfStock_${todayStr}.csv`, 'text/csv');
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-[#102A46] hover:bg-[#FF4D79] text-[#FF4D79] hover:text-white border border-[#FF4D79]/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Out-of-Stock CSV</span>
                  </button>
                </div>

                {/* 4. Stock Movement Audit */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#8B5CF6] transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center mb-3">
                      <History className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">Stock Movement Audit Log</h3>
                    <p className="text-xs text-[#94A9C3] mt-1">
                      Full historical audit trail of all transactions, movements, previous balances, and user remarks.
                    </p>
                    <div className="mt-4 text-[11px] text-[#7186A3] space-y-1">
                      <div>Logged Movements: <b className="text-[#8B5CF6]">{transactions.length}</b></div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const csv = generateCSVReport('movements', products, transactions);
                      downloadFile(csv, `StockFlow_Movements_${todayStr}.csv`, 'text/csv');
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-[#102A46] hover:bg-[#8B5CF6] text-[#8B5CF6] hover:text-white border border-[#8B5CF6]/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Movement CSV</span>
                  </button>
                </div>

                {/* 5. Category Valuation */}
                <div className="bg-[#0B2038] border border-[#174567] hover:border-[#00D6A3] transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-[#00D6A3]/10 text-[#00D6A3] flex items-center justify-center mb-3">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">Category Valuation Summary</h3>
                    <p className="text-xs text-[#94A9C3] mt-1">
                      Breakdown of capital distribution across stationery, accessories, electronics, and home living.
                    </p>
                    <div className="mt-4 text-[11px] text-[#7186A3] space-y-1">
                      <div>Categories: <b className="text-[#00D6A3]">{metrics.total_categories}</b></div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const csv = generateCSVReport('valuation', products, transactions);
                      downloadFile(csv, `StockFlow_Valuation_${todayStr}.csv`, 'text/csv');
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-[#102A46] hover:bg-[#00D6A3] text-[#00D6A3] hover:text-[#061426] border border-[#00D6A3]/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Valuation CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              PAGE 9: SETTINGS & BACKUP
              =================================================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">System Settings &amp; Storage</h1>
                <p className="text-xs text-[#94A9C3]">
                  Manage demonstration datasets, persistent JSON backups, and system defaults
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Demo Data Management */}
                <div className="bg-[#0B2038] border border-[#174567] rounded-2xl p-5 shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#00D4FF]" />
                    Academic Sample Data
                  </h3>
                  <p className="text-xs text-[#94A9C3]">
                    Pre-populate the system with the 5 standard CSE1012 demonstration products (P001 to P005). Does not overwrite your existing custom items.
                  </p>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleLoadSampleData}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#102A46] text-[#00D4FF] border border-[#00D4FF]/40 hover:bg-[#00D4FF] hover:text-[#061426] transition-colors"
                    >
                      📥 Load Demo Products (P001 - P005)
                    </button>
                    <button
                      onClick={handleClearDemoData}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-[#102A46] text-[#FF4D79] border border-[#FF4D79]/40 hover:bg-[#FF4D79]/20 transition-colors"
                    >
                      🧹 Remove Demo Data (Protects User Items)
                    </button>
                  </div>
                </div>

                {/* Backup & Snapshot */}
                <div className="bg-[#0B2038] border border-[#174567] rounded-2xl p-5 shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
                    Backup &amp; Export
                  </h3>
                  <p className="text-xs text-[#94A9C3]">
                    Download a full JSON snapshot of your current inventory and transaction history.
                  </p>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        const payload = JSON.stringify({ products, transactions, exported_at: new Date().toISOString() }, null, 2);
                        downloadFile(payload, `StockFlow_Backup_${Date.now()}.json`, 'application/json');
                      }}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#168BFF] to-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:brightness-110"
                    >
                      📦 Download Complete JSON Backup
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to restore default sample dataset?')) {
                          updateProducts(INITIAL_SAMPLE_PRODUCTS);
                          saveStoredProducts(INITIAL_SAMPLE_PRODUCTS);
                        }
                      }}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-[#102A46] text-[#94A9C3] hover:text-white transition-colors"
                    >
                      Restore Factory Demo State
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              PAGE 10: PROJECT INFORMATION & PYTHON CODE CENTER
              =================================================================== */}
          {activeTab === 'project_info' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    Academic Specification &amp; Python Code Center
                  </h1>
                  <p className="text-xs text-[#94A9C3]">
                    CSE1012: Problem Solving using Python • Source Code Inspector &amp; Viva Documentation
                  </p>
                </div>
              </div>

              {/* Download Options Panel (7-Zip, Auto-Extractor, Standard Zip) */}
              <div className="bg-[#0B2038] border-2 border-[#00D4FF]/60 rounded-2xl p-6 shadow-[0_0_25px_rgba(0,212,255,0.2)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#174567] gap-3 mb-5">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                      Laptop Download Center
                    </span>
                    <h2 className="text-lg font-black text-white mt-1.5 flex items-center gap-2">
                      <Download className="w-5 h-5 text-[#00D4FF]" />
                      Download StockFlow for Your Laptop
                    </h2>
                    <p className="text-xs text-[#94A9C3]">
                      Choose your preferred format to run the complete Python Streamlit project locally.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* OPTION 1: 7-ZIP ARCHIVE (.7z) */}
                  <div className="bg-[#081A2F] border border-[#00D4FF]/50 rounded-xl p-4 flex flex-col justify-between hover:border-[#00D4FF] transition-all group">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#00D4FF] uppercase tracking-wider">
                          7-Zip Format
                        </span>
                        <span className="text-[10px] bg-[#00D4FF]/20 text-[#00D4FF] px-2 py-0.5 rounded font-mono font-bold">
                          .7z (27 KB)
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#00D4FF] transition-colors">
                        StockFlow_Project.7z
                      </h4>
                      <p className="text-[11px] text-[#94A9C3] mt-1.5">
                        Compressed using 7-Zip high-ratio algorithm. Extracts with 7-Zip, WinRAR, or Linux <code className="text-[#00D4FF]">7z x</code>.
                      </p>
                    </div>
                    <button
                      onClick={() => download7zArchive('StockFlow_Project.7z')}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#00D4FF] to-[#168BFF] text-[#061426] shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:brightness-110 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Download .7z Archive</span>
                    </button>
                  </div>

                  {/* OPTION 2: ZERO-SOFTWARE PYTHON AUTO-EXTRACTOR (.py) */}
                  <div className="bg-[#081A2F] border border-[#00D6A3]/50 rounded-xl p-4 flex flex-col justify-between hover:border-[#00D6A3] transition-all group">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#00D6A3] uppercase tracking-wider">
                          Zero-Software Setup
                        </span>
                        <span className="text-[10px] bg-[#00D6A3]/20 text-[#00D6A3] px-2 py-0.5 rounded font-mono font-bold">
                          setup_project.py
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#00D6A3] transition-colors">
                        Auto-Extract Python Script
                      </h4>
                      <p className="text-[11px] text-[#94A9C3] mt-1.5">
                        No 7-Zip or WinRAR needed! Just download and run <code className="text-[#00D6A3]">python setup_project.py</code> to automatically extract all files.
                      </p>
                    </div>
                    <button
                      onClick={() => downloadSetupPythonScript()}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-[#00D6A3] text-[#061426] shadow-[0_0_15px_rgba(0,214,163,0.3)] hover:brightness-110 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Download setup_project.py</span>
                    </button>
                  </div>

                  {/* OPTION 3: STANDARD ZIP (.zip) */}
                  <div className="bg-[#081A2F] border border-[#8B5CF6]/50 rounded-xl p-4 flex flex-col justify-between hover:border-[#8B5CF6] transition-all group">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider">
                          Standard Archive
                        </span>
                        <span className="text-[10px] bg-[#8B5CF6]/20 text-[#8B5CF6] px-2 py-0.5 rounded font-mono font-bold">
                          .zip (32 KB)
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#8B5CF6] transition-colors">
                        StockFlow_Project.zip
                      </h4>
                      <p className="text-[11px] text-[#94A9C3] mt-1.5">
                        Standard zip format compatible with native Windows File Explorer, macOS Archive Utility, and Linux.
                      </p>
                    </div>
                    <a
                      href="/StockFlow_Project.zip"
                      download="StockFlow_Project.zip"
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-[#102A46] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white border border-[#8B5CF6]/50 transition-all"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Download .zip Archive</span>
                    </a>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#174567] text-[11px] text-[#94A9C3] flex flex-wrap items-center justify-between gap-2">
                  <span>
                    💡 <b className="text-white">Tip:</b> If your laptop browser blocks archive downloads, click <b className="text-[#00D6A3]">Download setup_project.py</b> and run <code className="text-[#00D4FF] bg-[#102A46] px-1 py-0.5 rounded">python setup_project.py</code> in your command prompt.
                  </span>
                </div>
              </div>

              {/* Academic Concept Alignment Card */}
              <div className="bg-[#0B2038] border border-[#174567] rounded-2xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-[#00D4FF] uppercase tracking-wider mb-3">
                  CSE1012 Syllabus Concept Demonstration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#081A2F] border border-[#174567]">
                    <b className="text-white">1. Dictionaries:</b>
                    <p className="text-[#94A9C3] mt-1">Used for each product record and transaction audit entry.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#081A2F] border border-[#174567]">
                    <b className="text-white">2. Sets:</b>
                    <p className="text-[#94A9C3] mt-1">Unique Product ID membership checking &amp; category set deduplication.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#081A2F] border border-[#174567]">
                    <b className="text-white">3. Lists:</b>
                    <p className="text-[#94A9C3] mt-1">Dynamic product catalog lists and chronological transaction logs.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#081A2F] border border-[#174567]">
                    <b className="text-white">4. Functions:</b>
                    <p className="text-[#94A9C3] mt-1">Clean modular architecture in inventory_manager.py, storage.py, reports.py.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#081A2F] border border-[#174567]">
                    <b className="text-white">5. Regular Expressions:</b>
                    <p className="text-[#94A9C3] mt-1"><code>^[A-Za-z0-9_-]+$</code> enforces valid product ID format.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#081A2F] border border-[#174567]">
                    <b className="text-white">6. Exception Handling:</b>
                    <p className="text-[#94A9C3] mt-1">Custom <code>InventoryValidationError</code> and try/except recovery blocks.</p>
                  </div>
                </div>
              </div>

              {/* Local Execution Steps Card */}
              <div className="bg-[#0B2038] border border-[#174567] rounded-2xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-[#8B5CF6] uppercase tracking-wider mb-2">
                  How to Run the Python Project Locally
                </h3>
                <div className="p-4 rounded-xl bg-[#061426] border border-[#174567] font-mono text-xs text-[#00D4FF] space-y-1">
                  <div><span className="text-[#7186A3]"># 1. Unzip StockFlow_Project.zip and navigate into folder</span></div>
                  <div>cd StockFlow</div>
                  <div className="pt-1"><span className="text-[#7186A3]"># 2. Install dependencies</span></div>
                  <div>pip install -r requirements.txt</div>
                  <div className="pt-1"><span className="text-[#7186A3]"># 3. Run automated unit test suite (12 tests)</span></div>
                  <div>python test_stockflow.py</div>
                  <div className="pt-1"><span className="text-[#7186A3]"># 4. Launch the Streamlit application</span></div>
                  <div>streamlit run app.py</div>
                </div>
              </div>

              {/* Python Source Code Inspector */}
              <div className="bg-[#0B2038] border border-[#174567] rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#174567] gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-[#00D4FF]" />
                    <span className="font-bold text-white text-sm">Source Code Inspector</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* File Selector Tabs */}
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(PYTHON_FILES).map((fileName) => (
                        <button
                          key={fileName}
                          onClick={() => setSelectedPythonFile(fileName as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                            selectedPythonFile === fileName
                              ? 'bg-[#00D4FF] text-[#061426] font-bold'
                              : 'bg-[#102A46] text-[#94A9C3] hover:text-white'
                          }`}
                        >
                          {fileName}
                        </button>
                      ))}
                    </div>
                    {/* Copy Button */}
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg bg-[#102A46] text-[#00D4FF] hover:bg-[#174567] transition-colors ml-2"
                      title="Copy File Code"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-[#00D6A3]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Code Window */}
                <pre className="p-4 rounded-xl bg-[#061426] border border-[#174567] text-xs font-mono text-[#F1F7FF] overflow-x-auto max-h-96 leading-relaxed">
                  <code>{PYTHON_FILES[selectedPythonFile]}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          MODALS & OVERLAYS
          ========================================================================= */}

      {/* Quick Restock Modal */}
      {quickRestockProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B2038] border border-[#00D4FF] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-[#00D4FF]" />
              Replenish {quickRestockProduct.product_name}
            </h3>
            <div className="text-xs text-[#94A9C3]">
              Current stock: <b className="text-white">{quickRestockProduct.stock_quantity} units</b> • Reorder threshold: {quickRestockProduct.reorder_level}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A9C3] mb-1">Quantity to Add</label>
              <input
                type="number"
                min="1"
                step="1"
                defaultValue={Math.max(10, quickRestockProduct.reorder_level - quickRestockProduct.stock_quantity)}
                id="quickRestockInput"
                className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setQuickRestockProduct(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#94A9C3] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('quickRestockInput') as HTMLInputElement;
                  const qty = parseInt(input?.value || '10', 10);
                  handleStockIn(quickRestockProduct.product_id, qty, 'Quick restock from alert');
                  setQuickRestockProduct(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#00D4FF] text-[#061426] hover:brightness-110"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B2038] border border-[#8B5CF6] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#8B5CF6]" />
              Edit Product ({editingProduct.product_id})
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#94A9C3] mb-1">Product Name</label>
                <input
                  type="text"
                  defaultValue={editingProduct.product_name}
                  id="editNameInput"
                  className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#94A9C3] mb-1">Category</label>
                <input
                  type="text"
                  defaultValue={editingProduct.category}
                  id="editCategoryInput"
                  className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94A9C3] mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={editingProduct.unit_price}
                    id="editPriceInput"
                    className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#94A9C3] mb-1">Reorder Level</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    defaultValue={editingProduct.reorder_level}
                    id="editReorderInput"
                    className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#174567]">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#94A9C3] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = (document.getElementById('editNameInput') as HTMLInputElement)?.value.trim();
                  const cat = (document.getElementById('editCategoryInput') as HTMLInputElement)?.value.trim();
                  const price = parseFloat((document.getElementById('editPriceInput') as HTMLInputElement)?.value);
                  const reorder = parseInt((document.getElementById('editReorderInput') as HTMLInputElement)?.value, 10);

                  if (!name || isNaN(price) || price <= 0 || isNaN(reorder) || reorder < 0) {
                    alert('Please enter valid product values.');
                    return;
                  }

                  const updated = products.map((p) =>
                    p.product_id === editingProduct.product_id
                      ? {
                          ...p,
                          product_name: name,
                          category: cat || 'General',
                          unit_price: Number(price.toFixed(2)),
                          reorder_level: reorder,
                          last_updated: new Date().toISOString().replace('T', ' ').slice(0, 19),
                        }
                      : p
                  );
                  updateProducts(updated);
                  setEditingProduct(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#8B5CF6] text-white hover:brightness-110"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B2038] border border-[#FF4D79] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#FF4D79] flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Confirm Product Deletion
            </h3>
            <p className="text-xs text-[#94A9C3]">
              Are you sure you want to permanently delete <b>{deletingProduct.product_name}</b> ({deletingProduct.product_id})? This action will remove it from persistent storage.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#94A9C3] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deletingProduct.product_id)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#FF4D79] text-white hover:bg-[#FF4D79]/90"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B2038] border border-[#FFB020] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#FFB020]" />
              Physical Audit Adjustment
            </h3>
            <div className="text-xs text-[#94A9C3]">
              Product: <b className="text-white">{adjustingProduct.product_name}</b> ({adjustingProduct.product_id})
              <br />
              Current System Balance: <b className="text-[#00D4FF]">{adjustingProduct.stock_quantity} units</b>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A9C3] mb-1">
                New Actual Physical Count (&gt;= 0)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FFB020]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A9C3] mb-1">Audit Notes / Reason</label>
              <input
                type="text"
                placeholder="e.g. Month-end physical recount, Damaged units discarded"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                className="w-full bg-[#102A46] border border-[#174567] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FFB020]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#174567]">
              <button
                onClick={() => setAdjustingProduct(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#94A9C3] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = parseInt(adjustQty, 10);
                  if (isNaN(val) || val < 0) {
                    alert('Please enter a valid non-negative integer.');
                    return;
                  }
                  handleManualAdjust(adjustingProduct.product_id, val, adjustNotes);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#FFB020] text-[#061426] hover:brightness-110"
              >
                Record Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
