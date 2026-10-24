"""
Reports module for StockFlow Inventory & Stock Management System.
Generates CSV reports and tabular data for export and download.
Academic Project: CSE1012 - Problem Solving using Python
"""

import csv
import io
from typing import Any, Dict, List
from inventory_manager import (
    calculate_product_value,
    determine_stock_status,
    calculate_inventory_metrics,
)


def generate_inventory_report_csv(products: List[Dict[str, Any]]) -> str:
    """
    Generates a CSV string for the Complete Inventory Report.
    Columns: Product ID, Product Name, Category, Unit Price (₹), Stock Quantity,
             Reorder Level, Inventory Value (₹), Stock Status, Date Created, Last Updated
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Product ID",
        "Product Name",
        "Category",
        "Unit Price (₹)",
        "Stock Quantity",
        "Reorder Level",
        "Inventory Value (₹)",
        "Stock Status",
        "Date Created",
        "Last Updated",
    ])

    for p in products:
        qty = p.get("stock_quantity", 0)
        price = p.get("unit_price", 0.0)
        reorder = p.get("reorder_level", 0)
        val = calculate_product_value(price, qty)
        status = determine_stock_status(qty, reorder)

        writer.writerow([
            p.get("product_id", ""),
            p.get("product_name", ""),
            p.get("category", ""),
            f"{price:.2f}",
            qty,
            reorder,
            f"{val:.2f}",
            status,
            p.get("date_created", ""),
            p.get("last_updated", ""),
        ])

    return output.getvalue()


def generate_low_stock_report_csv(products: List[Dict[str, Any]]) -> str:
    """
    Generates a CSV string for Products with Low Stock (0 < qty <= reorder_level).
    Columns: Product ID, Product Name, Category, Current Quantity, Reorder Level,
             Suggested Reorder Quantity, Unit Price (₹), Valuation At Risk (₹)
    """
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Product ID",
        "Product Name",
        "Category",
        "Current Quantity",
        "Reorder Level",
        "Suggested Reorder Quantity",
        "Unit Price (₹)",
        "Valuation At Risk (₹)",
    ])

    for p in products:
        qty = p.get("stock_quantity", 0)
        reorder = p.get("reorder_level", 0)
        if 0 < qty <= reorder:
            price = p.get("unit_price", 0.0)
            suggested = max(0, reorder - qty)
            val = calculate_product_value(price, qty)

            writer.writerow([
                p.get("product_id", ""),
                p.get("product_name", ""),
                p.get("category", ""),
                qty,
                reorder,
                suggested,
                f"{price:.2f}",
                f"{val:.2f}",
            ])

    return output.getvalue()


def generate_out_of_stock_report_csv(products: List[Dict[str, Any]]) -> str:
    """
    Generates a CSV string for Out of Stock products (quantity == 0).
    Columns: Product ID, Product Name, Category, Reorder Level, Suggested Reorder, Unit Price (₹)
    """
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Product ID",
        "Product Name",
        "Category",
        "Current Quantity",
        "Reorder Level",
        "Suggested Reorder Quantity",
        "Unit Price (₹)",
    ])

    for p in products:
        qty = p.get("stock_quantity", 0)
        if qty == 0:
            reorder = p.get("reorder_level", 0)
            suggested = max(1, reorder)
            price = p.get("unit_price", 0.0)

            writer.writerow([
                p.get("product_id", ""),
                p.get("product_name", ""),
                p.get("category", ""),
                0,
                reorder,
                suggested,
                f"{price:.2f}",
            ])

    return output.getvalue()


def generate_stock_movement_report_csv(transactions: List[Dict[str, Any]]) -> str:
    """
    Generates a CSV string for the Stock Movement (Audit Log) History.
    Columns: Transaction ID, Date and Time, Product ID, Product Name, Movement Type,
             Quantity Changed, Previous Quantity, New Quantity, Notes
    """
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Transaction ID",
        "Date and Time",
        "Product ID",
        "Product Name",
        "Movement Type",
        "Quantity Changed",
        "Previous Quantity",
        "New Quantity",
        "Notes",
    ])

    for tx in transactions:
        writer.writerow([
            tx.get("transaction_id", ""),
            tx.get("timestamp", ""),
            tx.get("product_id", ""),
            tx.get("product_name", ""),
            tx.get("movement_type", ""),
            tx.get("quantity_changed", 0),
            tx.get("previous_quantity", 0),
            tx.get("new_quantity", 0),
            tx.get("notes", ""),
        ])

    return output.getvalue()


def generate_valuation_report_csv(products: List[Dict[str, Any]]) -> str:
    """
    Generates Category Valuation Summary CSV.
    Columns: Category, Product Count, Total Units, Total Inventory Value (₹), Percentage of Value
    """
    metrics = calculate_inventory_metrics(products)
    total_val = metrics["total_stock_value"]
    cat_vals = metrics["category_valuation"]

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Category",
        "Product Count",
        "Total Units",
        "Total Inventory Value (₹)",
        "Share of Total Value (%)",
    ])

    for cat_name, data in sorted(cat_vals.items()):
        val = data["total_value"]
        pct = (val / total_val * 100.0) if total_val > 0 else 0.0
        writer.writerow([
            cat_name,
            data["product_count"],
            data["total_units"],
            f"{val:.2f}",
            f"{pct:.2f}%",
        ])

    return output.getvalue()
