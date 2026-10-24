"""
Inventory Manager Module for StockFlow
Academic Project: CSE1012 - Problem Solving using Python

Demonstrates fundamental Python programming concepts:
- Dictionaries: Product & transaction records
- Sets: Uniqueness checks on Product IDs
- Lists: Collections of products & transaction logs
- Functions: Modular business logic
- Loops: Iteration & filtering
- Conditionals: Status rules & error branches
- Regular Expressions: Identifier format enforcement
- Exception Handling: Graceful error recovery
"""

import re
import datetime
import math
from typing import Any, Dict, List, Optional, Set, Tuple

# Sample products for CSE1012 project demonstration
SAMPLE_PRODUCTS = [
    {
        "product_id": "P001",
        "product_name": "Notebook",
        "category": "Stationery",
        "unit_price": 50.0,
        "stock_quantity": 100,
        "reorder_level": 20,
        "date_created": "2026-10-01 10:00:00",
        "last_updated": "2026-10-01 10:00:00",
        "is_sample": True,
    },
    {
        "product_id": "P002",
        "product_name": "Pen",
        "category": "Stationery",
        "unit_price": 10.0,
        "stock_quantity": 200,
        "reorder_level": 50,
        "date_created": "2026-10-02 11:30:00",
        "last_updated": "2026-10-02 11:30:00",
        "is_sample": True,
    },
    {
        "product_id": "P003",
        "product_name": "School Bag",
        "category": "Accessories",
        "unit_price": 750.0,
        "stock_quantity": 8,
        "reorder_level": 10,
        "date_created": "2026-10-03 09:15:00",
        "last_updated": "2026-10-03 09:15:00",
        "is_sample": True,
    },
    {
        "product_id": "P004",
        "product_name": "Pencil",
        "category": "Stationery",
        "unit_price": 5.0,
        "stock_quantity": 15,
        "reorder_level": 20,
        "date_created": "2026-10-04 14:20:00",
        "last_updated": "2026-10-04 14:20:00",
        "is_sample": True,
    },
    {
        "product_id": "P005",
        "product_name": "Water Bottle",
        "category": "Home & Living",
        "unit_price": 150.0,
        "stock_quantity": 0,
        "reorder_level": 10,
        "date_created": "2026-10-05 16:45:00",
        "last_updated": "2026-10-05 16:45:00",
        "is_sample": True,
    },
]

# Validation regex for product IDs: alphanumeric, underscores, hyphens
PRODUCT_ID_REGEX = re.compile(r"^[A-Za-z0-9_-]+$")


class InventoryValidationError(ValueError):
    """Custom exception raised when an inventory validation check fails."""
    pass


def get_current_timestamp() -> str:
    """Returns current date and time formatted consistently."""
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def get_all_product_ids(products: List[Dict[str, Any]]) -> Set[str]:
    """
    Demonstrates SET usage in Python for O(1) membership tests
    and ensuring identifier uniqueness.
    """
    id_set: Set[str] = set()
    for product in products:
        if "product_id" in product:
            id_set.add(str(product["product_id"]).strip().upper())
    return id_set


def validate_product_id(
    product_id: str,
    existing_ids: Optional[Set[str]] = None,
    allow_id: Optional[str] = None
) -> str:
    """
    Validates a product identifier using regex and set uniqueness.
    """
    if not product_id or not isinstance(product_id, str):
        raise InventoryValidationError("Product ID cannot be empty.")

    clean_id = product_id.strip()

    if not PRODUCT_ID_REGEX.match(clean_id):
        raise InventoryValidationError(
            "Product ID must contain only letters, numbers, underscores, or hyphens (e.g., 'P001', 'ITEM-12')."
        )

    if existing_ids is not None:
        upper_id = clean_id.upper()
        allowed_upper = allow_id.strip().upper() if allow_id else None
        if upper_id in existing_ids and upper_id != allowed_upper:
            raise InventoryValidationError(f"Product ID '{clean_id}' already exists in inventory.")

    return clean_id


def validate_product_name(product_name: str) -> str:
    """Validates that product name is non-empty and stripped."""
    if not product_name or not isinstance(product_name, str):
        raise InventoryValidationError("Product name cannot be empty.")

    clean_name = product_name.strip()
    if len(clean_name) == 0:
        raise InventoryValidationError("Product name cannot contain only whitespace.")

    if len(clean_name) > 120:
        raise InventoryValidationError("Product name is too long (maximum 120 characters).")

    return clean_name


def validate_price(price: Any) -> float:
    """
    Validates unit price:
    Must be a valid positive number (price > 0), not NaN or Infinity.
    """
    try:
        numeric_price = float(price)
    except (ValueError, TypeError):
        raise InventoryValidationError(f"Invalid price value '{price}'. Must be a positive numeric value.")

    if math.isnan(numeric_price) or math.isinf(numeric_price):
        raise InventoryValidationError("Price cannot be NaN or infinite.")

    if numeric_price <= 0:
        raise InventoryValidationError("Unit price must be strictly greater than zero.")

    # Round to 2 decimal places to avoid IEEE 754 precision issues
    return round(numeric_price, 2)


def validate_quantity(quantity: Any, field_name: str = "Quantity") -> int:
    """
    Validates stock quantity or reorder level:
    Must be a non-negative integer (>= 0).
    """
    try:
        # Check if float passed with fractional part
        if isinstance(quantity, float):
            if not quantity.is_integer():
                raise InventoryValidationError(f"{field_name} must be a whole number, not a decimal.")
            int_qty = int(quantity)
        elif isinstance(quantity, str):
            clean_str = quantity.strip()
            if "." in clean_str:
                raise InventoryValidationError(f"{field_name} must be an integer, not a decimal.")
            int_qty = int(clean_str)
        else:
            int_qty = int(quantity)
    except (ValueError, TypeError):
        raise InventoryValidationError(f"Invalid {field_name.lower()} '{quantity}'. Must be a whole integer.")

    if int_qty < 0:
        raise InventoryValidationError(f"{field_name} cannot be negative.")

    return int_qty


def validate_category(category: str) -> str:
    """Validates category name with a fallback default."""
    if not category or not isinstance(category, str) or not category.strip():
        return "General"
    return category.strip().title()


def determine_stock_status(quantity: int, reorder_level: int) -> str:
    """
    Determines stock status:
    - Out of Stock: quantity == 0
    - Low Stock: 0 < quantity <= reorder_level
    - In Stock: quantity > reorder_level
    """
    if quantity <= 0:
        return "Out of Stock"
    elif quantity <= reorder_level:
        return "Low Stock"
    else:
        return "In Stock"


def calculate_product_value(unit_price: float, stock_quantity: int) -> float:
    """Calculates inventory valuation for a single product."""
    return round(float(unit_price) * int(stock_quantity), 2)


def add_product(
    products: List[Dict[str, Any]],
    product_id: str,
    product_name: str,
    category: str,
    unit_price: float,
    stock_quantity: int,
    reorder_level: int,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Adds a new product to the inventory list.
    Demonstrates validation, dictionary creation, and list mutation.
    """
    existing_ids = get_all_product_ids(products)
    clean_id = validate_product_id(product_id, existing_ids)
    clean_name = validate_product_name(product_name)
    clean_category = validate_category(category)
    clean_price = validate_price(unit_price)
    clean_qty = validate_quantity(stock_quantity, "Stock Quantity")
    clean_reorder = validate_quantity(reorder_level, "Reorder Level")

    now = get_current_timestamp()
    new_product: Dict[str, Any] = {
        "product_id": clean_id,
        "product_name": clean_name,
        "category": clean_category,
        "unit_price": clean_price,
        "stock_quantity": clean_qty,
        "reorder_level": clean_reorder,
        "date_created": now,
        "last_updated": now,
        "is_sample": False,
    }

    # Append to existing list
    updated_products = list(products)
    updated_products.append(new_product)
    return new_product, updated_products


def update_product_details(
    products: List[Dict[str, Any]],
    product_id: str,
    product_name: str,
    category: str,
    unit_price: float,
    reorder_level: int,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Updates editable fields of an existing product (excluding direct quantity).
    """
    clean_name = validate_product_name(product_name)
    clean_category = validate_category(category)
    clean_price = validate_price(unit_price)
    clean_reorder = validate_quantity(reorder_level, "Reorder Level")

    found = False
    updated_product: Optional[Dict[str, Any]] = None
    updated_list: List[Dict[str, Any]] = []

    for prod in products:
        if prod.get("product_id") == product_id:
            found = True
            mod_prod = dict(prod)
            mod_prod["product_name"] = clean_name
            mod_prod["category"] = clean_category
            mod_prod["unit_price"] = clean_price
            mod_prod["reorder_level"] = clean_reorder
            mod_prod["last_updated"] = get_current_timestamp()
            updated_list.append(mod_prod)
            updated_product = mod_prod
        else:
            updated_list.append(prod)

    if not found or updated_product is None:
        raise InventoryValidationError(f"Product with ID '{product_id}' not found.")

    return updated_product, updated_list


def delete_product(
    products: List[Dict[str, Any]],
    product_id: str
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Removes a product from inventory after finding it.
    """
    found_product = None
    new_list = []

    for prod in products:
        if prod.get("product_id") == product_id:
            found_product = prod
        else:
            new_list.append(prod)

    if not found_product:
        raise InventoryValidationError(f"Cannot delete: Product '{product_id}' was not found.")

    return found_product, new_list


def record_stock_addition(
    products: List[Dict[str, Any]],
    transactions: List[Dict[str, Any]],
    product_id: str,
    quantity_to_add: int,
    notes: str = ""
) -> Tuple[Dict[str, Any], Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Performs 'Stock In' addition operation.
    Validates product exists, quantity > 0, updates quantity, logs transaction.
    """
    clean_qty = validate_quantity(quantity_to_add, "Quantity to Add")
    if clean_qty <= 0:
        raise InventoryValidationError("Quantity to add must be a positive integer greater than zero.")

    product = None
    target_index = -1
    for idx, p in enumerate(products):
        if p.get("product_id") == product_id:
            product = p
            target_index = idx
            break

    if product is None or target_index == -1:
        raise InventoryValidationError(f"Product '{product_id}' does not exist.")

    prev_qty = product.get("stock_quantity", 0)
    new_qty = prev_qty + clean_qty
    now = get_current_timestamp()

    # Update product record
    updated_products = list(products)
    updated_prod = dict(product)
    updated_prod["stock_quantity"] = new_qty
    updated_prod["last_updated"] = now
    updated_products[target_index] = updated_prod

    # Create transaction record
    tx_id = f"TX-IN-{int(datetime.datetime.now().timestamp() * 1000)}"
    transaction: Dict[str, Any] = {
        "transaction_id": tx_id,
        "timestamp": now,
        "product_id": product_id,
        "product_name": product.get("product_name", ""),
        "movement_type": "Stock In",
        "quantity_changed": clean_qty,
        "previous_quantity": prev_qty,
        "new_quantity": new_qty,
        "notes": notes.strip() if notes else "Routine stock replenishment",
    }

    updated_transactions = list(transactions)
    updated_transactions.insert(0, transaction)  # Most recent first

    return updated_prod, transaction, updated_products, updated_transactions


def record_sale(
    products: List[Dict[str, Any]],
    transactions: List[Dict[str, Any]],
    product_id: str,
    quantity_sold: int,
    notes: str = ""
) -> Tuple[Dict[str, Any], Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Performs 'Sale' stock deduction operation.
    Ensures sale quantity > 0 and does not exceed available stock.
    Never allows negative stock!
    """
    clean_qty = validate_quantity(quantity_sold, "Sale Quantity")
    if clean_qty <= 0:
        raise InventoryValidationError("Sale quantity must be a positive integer greater than zero.")

    product = None
    target_index = -1
    for idx, p in enumerate(products):
        if p.get("product_id") == product_id:
            product = p
            target_index = idx
            break

    if product is None or target_index == -1:
        raise InventoryValidationError(f"Product '{product_id}' does not exist.")

    prev_qty = product.get("stock_quantity", 0)
    if clean_qty > prev_qty:
        raise InventoryValidationError(
            f"Insufficient stock for '{product.get('product_name')}'. "
            f"Available: {prev_qty} units, Requested Sale: {clean_qty} units."
        )

    new_qty = prev_qty - clean_qty
    now = get_current_timestamp()

    # Update product
    updated_products = list(products)
    updated_prod = dict(product)
    updated_prod["stock_quantity"] = new_qty
    updated_prod["last_updated"] = now
    updated_products[target_index] = updated_prod

    # Create transaction record
    tx_id = f"TX-OUT-{int(datetime.datetime.now().timestamp() * 1000)}"
    transaction: Dict[str, Any] = {
        "transaction_id": tx_id,
        "timestamp": now,
        "product_id": product_id,
        "product_name": product.get("product_name", ""),
        "movement_type": "Sale",
        "quantity_changed": -clean_qty,
        "previous_quantity": prev_qty,
        "new_quantity": new_qty,
        "notes": notes.strip() if notes else "Retail customer sale",
    }

    updated_transactions = list(transactions)
    updated_transactions.insert(0, transaction)

    return updated_prod, transaction, updated_products, updated_transactions


def record_manual_adjustment(
    products: List[Dict[str, Any]],
    transactions: List[Dict[str, Any]],
    product_id: str,
    new_quantity: int,
    notes: str = ""
) -> Tuple[Dict[str, Any], Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Performs traceable stock audit adjustment.
    """
    clean_new_qty = validate_quantity(new_quantity, "New Adjusted Quantity")

    product = None
    target_index = -1
    for idx, p in enumerate(products):
        if p.get("product_id") == product_id:
            product = p
            target_index = idx
            break

    if product is None or target_index == -1:
        raise InventoryValidationError(f"Product '{product_id}' does not exist.")

    prev_qty = product.get("stock_quantity", 0)
    qty_diff = clean_new_qty - prev_qty
    now = get_current_timestamp()

    updated_products = list(products)
    updated_prod = dict(product)
    updated_prod["stock_quantity"] = clean_new_qty
    updated_prod["last_updated"] = now
    updated_products[target_index] = updated_prod

    tx_id = f"TX-ADJ-{int(datetime.datetime.now().timestamp() * 1000)}"
    transaction: Dict[str, Any] = {
        "transaction_id": tx_id,
        "timestamp": now,
        "product_id": product_id,
        "product_name": product.get("product_name", ""),
        "movement_type": "Adjustment",
        "quantity_changed": qty_diff,
        "previous_quantity": prev_qty,
        "new_quantity": clean_new_qty,
        "notes": notes.strip() if notes else "Physical count stock audit",
    }

    updated_transactions = list(transactions)
    updated_transactions.insert(0, transaction)

    return updated_prod, transaction, updated_products, updated_transactions


def search_and_filter_products(
    products: List[Dict[str, Any]],
    search_query: str = "",
    category_filter: str = "All",
    status_filter: str = "All",
) -> List[Dict[str, Any]]:
    """
    Filters products using search queries and status criteria.
    Uses loops and conditional evaluations.
    """
    filtered = []
    clean_query = search_query.strip().lower()

    for p in products:
        pid = str(p.get("product_id", "")).lower()
        pname = str(p.get("product_name", "")).lower()
        pcat = str(p.get("category", "")).lower()

        # Search match across ID, Name, or Category
        if clean_query:
            if clean_query not in pid and clean_query not in pname and clean_query not in pcat:
                continue

        # Category filter
        if category_filter and category_filter != "All":
            if p.get("category") != category_filter:
                continue

        # Status filter
        qty = p.get("stock_quantity", 0)
        reorder = p.get("reorder_level", 0)
        status = determine_stock_status(qty, reorder)

        if status_filter and status_filter != "All":
            if status != status_filter:
                continue

        filtered.append(p)

    return filtered


def get_low_stock_products(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Returns products classified as Low Stock:
    0 < quantity <= reorder_level.
    """
    low_stock = []
    for p in products:
        qty = p.get("stock_quantity", 0)
        reorder = p.get("reorder_level", 0)
        if 0 < qty <= reorder:
            item = dict(p)
            item["suggested_reorder"] = max(0, reorder - qty)
            low_stock.append(item)
    return low_stock


def get_out_of_stock_products(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Returns products with quantity == 0.
    """
    out_of_stock = []
    for p in products:
        qty = p.get("stock_quantity", 0)
        if qty == 0:
            item = dict(p)
            item["suggested_reorder"] = max(1, p.get("reorder_level", 10))
            out_of_stock.append(item)
    return out_of_stock


def calculate_inventory_metrics(products: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates summary metrics:
    1. Total distinct products
    2. Total stock value = Sum(Unit Price * Quantity)
    3. Low stock count (0 < qty <= reorder)
    4. Total in-stock physical units
    5. Out of stock count (qty == 0)
    6. Total categories
    7. Category valuations
    """
    total_products = len(products)
    total_stock_value = 0.0
    total_units = 0
    low_stock_count = 0
    out_of_stock_count = 0
    in_stock_products_count = 0
    categories_set: Set[str] = set()
    category_valuation: Dict[str, Dict[str, Any]] = {}

    for p in products:
        qty = p.get("stock_quantity", 0)
        price = p.get("unit_price", 0.0)
        reorder = p.get("reorder_level", 0)
        cat = p.get("category", "General")

        categories_set.add(cat)
        val = calculate_product_value(price, qty)
        total_stock_value += val
        total_units += qty

        if qty == 0:
            out_of_stock_count += 1
        elif qty <= reorder:
            low_stock_count += 1
            in_stock_products_count += 1
        else:
            in_stock_products_count += 1

        # Aggregate category data
        if cat not in category_valuation:
            category_valuation[cat] = {
                "category": cat,
                "product_count": 0,
                "total_units": 0,
                "total_value": 0.0,
            }
        category_valuation[cat]["product_count"] += 1
        category_valuation[cat]["total_units"] += qty
        category_valuation[cat]["total_value"] = round(category_valuation[cat]["total_value"] + val, 2)

    return {
        "total_products": total_products,
        "total_stock_value": round(total_stock_value, 2),
        "low_stock_count": low_stock_count,
        "total_units": total_units,
        "out_of_stock_count": out_of_stock_count,
        "in_stock_products_count": in_stock_products_count,
        "total_categories": len(categories_set),
        "categories_list": sorted(list(categories_set)),
        "category_valuation": category_valuation,
    }


def load_sample_products(products: List[Dict[str, Any]]) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Loads demonstration products (P001 to P005) without duplicating existing IDs.
    Does NOT overwrite existing products.
    """
    existing_ids = get_all_product_ids(products)
    added_count = 0
    updated_products = list(products)

    for sample in SAMPLE_PRODUCTS:
        sid = sample["product_id"].strip().upper()
        if sid not in existing_ids:
            updated_products.append(dict(sample))
            existing_ids.add(sid)
            added_count += 1

    return added_count, updated_products


def clear_sample_products(products: List[Dict[str, Any]]) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Safely removes only products flagged as sample records.
    Protects all real user products from deletion.
    """
    sample_ids = {s["product_id"].strip().upper() for s in SAMPLE_PRODUCTS}
    removed_count = 0
    remaining_products = []

    for p in products:
        pid = str(p.get("product_id", "")).strip().upper()
        is_sample_flag = p.get("is_sample", False)
        if is_sample_flag or pid in sample_ids:
            removed_count += 1
        else:
            remaining_products.append(p)

    return removed_count, remaining_products
