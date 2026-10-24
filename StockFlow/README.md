# StockFlow — Inventory and Stock Management System

An academic mini-project for **CSE1012: Problem Solving using Python**.

StockFlow is a complete, fully functional, and professional inventory and stock management system designed for small retail stores, shops, or storerooms. It is built in Python using Streamlit for its interactive user interface, persistent local JSON file storage, and CSV reporting.

---

## 🎯 Academic Project Details

- **Course:** CSE1012 – Problem Solving using Python
- **Project Title:** StockFlow — Inventory and Stock Management System
- **Technologies:** Python 3.10+, Streamlit, Plotly, Pandas, JSON, CSV
- **Visual Design:** Cyberpunk/Futuristic Dark Navy theme with Neon Cyan, Electric Blue, and Purple highlights inspired by modern SaaS dashboards.

---

## 🧠 Python Syllabus & Concepts Demonstrated

| Python Concept | Where & How It Is Used in StockFlow |
|---|---|
| **Dictionaries** | Each product (`product_id`, `product_name`, `unit_price`, `stock_quantity`, `reorder_level`, `category`) and transaction record is modeled as a Python dictionary. |
| **Sets** | `get_all_product_ids()` uses Python `set` for O(1) membership checking and enforcing uniqueness of Product IDs. |
| **Lists** | Product collections and chronological transaction audit logs are maintained as lists of dictionaries. |
| **Functions** | Clean, modular, and testable functions organized across `inventory_manager.py`, `storage.py`, and `reports.py`. |
| **Loops & Iteration** | `for` loops iterate through product lists to perform search matching, status filtering, category aggregations, and CSV serialization. |
| **Conditionals** | `if/elif/else` blocks classify stock status (`In Stock`, `Low Stock`, `Out of Stock`) and enforce sales constraints (no negative stock). |
| **Regular Expressions** | Python's `re` module enforces valid identifier patterns (`^[A-Za-z0-9_-]+$`) to reject invalid product IDs. |
| **Numeric Operations** | Float and integer calculations for unit values (`Price × Quantity`), inventory totals, low-stock thresholds, and reorder suggestions (`max(0, Reorder - Current)`). |
| **File Handling** | Safe JSON read/write operations using temporary file swap to prevent corruption, plus standard CSV export generation. |
| **Exception Handling** | Custom `InventoryValidationError` and structured `try...except` blocks protect the system against invalid data entry and file failures. |

---

## 📁 Project File Structure

```text
StockFlow/
├── app.py                  # Streamlit application UI, navigation, charts, and styling
├── inventory_manager.py    # Business logic, input validation, calculations, and operations
├── storage.py              # Safe JSON file persistence, atomic writes, and backups
├── reports.py              # CSV report generation (inventory, low stock, movements, valuations)
├── test_stockflow.py       # Automated unit test suite verifying all 20 required behaviors
├── requirements.txt        # Python dependency manifest
├── README.md               # Complete setup, execution, and academic viva documentation
└── data/                   # Persistent local JSON data directory
    ├── inventory.json      # Saved product catalog
    └── transactions.json   # Audit log of stock additions, sales, and adjustments
```

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.10 or higher installed on your computer.

### Step 1: Navigate to the StockFlow Directory
```bash
cd StockFlow
```

### Step 2: (Optional but recommended) Create a Virtual Environment
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate
```

### Step 3: Install Required Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the Automated Unit Tests
```bash
python test_stockflow.py
```
*You should see `12 tests in 0.01s OK` confirming all validations, calculations, and file operations pass.*

### Step 5: Start the Streamlit Application
```bash
streamlit run app.py
```

### Step 6: Open the Dashboard
Streamlit will output local URLs. Open your browser at:
`http://localhost:8501`

---

## 📊 Key Features

1. **Dashboard:** 6 real-time metric cards (Total Products, Stock Value in ₹, Low Stock, In-Stock Units, Out of Stock, Categories), trend charts, and category donut distribution.
2. **Products Catalog:** Searchable and filterable table with editable records and confirmed deletion.
3. **Add Product:** Real-time regex and positive value validation before persistent saving.
4. **Update Stock (Stock In):** Logs replenishment, previous balance, new balance, and notes to transaction audit logs.
5. **Record Sale:** Prevents overselling or negative stock; subtracts sold quantity safely.
6. **Stock Movement History:** Complete audit trail of all transactions with CSV download.
7. **Low-Stock Alerts:** Automatically flags items at or below reorder levels and computes suggested reorder quantities.
8. **Reports:** 6 distinct downloadable CSV audit sheets (Inventory, Low Stock, Out of Stock, Stock Movement, Valuation, Category Summary).
9. **Settings & Backup:** 1-click sample data loading (P001–P005), demo data cleanup without affecting custom user items, and timestamped JSON backups.
10. **Project Information:** Academic notes and viva preparation points.

---

## 🧪 Automated Testing Verification

The project includes `test_stockflow.py` with 12 comprehensive unit test cases covering:
- Product ID format regex and duplicate rejection
- Whitespace and name validation
- Numeric price validation (rejects 0, negative, NaN, Inf)
- Integer quantity validation (rejects negative numbers and non-integers)
- Stock additions with balance updates
- Sales deductions with boundary checking (no negative inventory)
- Accurate valuation calculations across categories
- JSON file serialization and recovery
- CSV report header formatting
- Sample data addition without duplication and safe cleanup
