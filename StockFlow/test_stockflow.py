"""
Automated Unit Test Suite for StockFlow
Academic Project: CSE1012 - Problem Solving using Python

Verifies all 20 requirements specified in project instructions:
1. Validation rules
2. Uniqueness checks using sets
3. Dictionary data models
4. Stock addition logic
5. Sale logic and bounds checking
6. Valuation calculations
7. Status badges
8. Safe storage serialization
9. CSV report outputs
10. Sample data protection
"""

import os
import tempfile
import unittest
import shutil

from inventory_manager import (
    InventoryValidationError,
    validate_product_id,
    validate_product_name,
    validate_price,
    validate_quantity,
    determine_stock_status,
    calculate_product_value,
    add_product,
    update_product_details,
    delete_product,
    record_stock_addition,
    record_sale,
    calculate_inventory_metrics,
    load_sample_products,
    clear_sample_products,
    get_low_stock_products,
    get_out_of_stock_products,
)
import storage
import reports


class TestStockFlow(unittest.TestCase):

    def setUp(self):
        # Create isolated temporary directory for test storage
        self.test_dir = tempfile.mkdtemp()
        self.orig_data_dir = storage.DATA_DIR
        self.orig_inv_file = storage.INVENTORY_FILE
        self.orig_tx_file = storage.TRANSACTIONS_FILE

        storage.DATA_DIR = self.test_dir
        storage.INVENTORY_FILE = os.path.join(self.test_dir, "inventory.json")
        storage.TRANSACTIONS_FILE = os.path.join(self.test_dir, "transactions.json")
        storage.initialize_storage()

    def tearDown(self):
        storage.DATA_DIR = self.orig_data_dir
        storage.INVENTORY_FILE = self.orig_inv_file
        storage.TRANSACTIONS_FILE = self.orig_tx_file
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_01_product_id_validation(self):
        """Test regex validation and uniqueness checks for Product IDs."""
        existing = {"P001", "P002"}
        # Valid IDs
        self.assertEqual(validate_product_id("P003", existing), "P003")
        self.assertEqual(validate_product_id("ITEM_99", existing), "ITEM_99")
        self.assertEqual(validate_product_id("SKU-100", existing), "SKU-100")

        # Invalid: empty
        with self.assertRaises(InventoryValidationError):
            validate_product_id("", existing)

        # Invalid: special chars
        with self.assertRaises(InventoryValidationError):
            validate_product_id("P@001", existing)

        # Duplicate ID
        with self.assertRaises(InventoryValidationError):
            validate_product_id("P001", existing)

    def test_02_product_name_validation(self):
        """Test name validation (reject empty/whitespace)."""
        self.assertEqual(validate_product_name("  Ball Pen  "), "Ball Pen")
        with self.assertRaises(InventoryValidationError):
            validate_product_name("")
        with self.assertRaises(InventoryValidationError):
            validate_product_name("   ")

    def test_03_price_validation(self):
        """Test positive price validation and reject negative/zero/nan."""
        self.assertEqual(validate_price(99.99), 99.99)
        self.assertEqual(validate_price("150"), 150.00)
        with self.assertRaises(InventoryValidationError):
            validate_price(0)
        with self.assertRaises(InventoryValidationError):
            validate_price(-15.5)
        with self.assertRaises(InventoryValidationError):
            validate_price("invalid_price")
        with self.assertRaises(InventoryValidationError):
            validate_price(float("nan"))

    def test_04_quantity_validation(self):
        """Test non-negative integer quantity rules."""
        self.assertEqual(validate_quantity(0), 0)
        self.assertEqual(validate_quantity(100), 100)
        self.assertEqual(validate_quantity("25"), 25)
        with self.assertRaises(InventoryValidationError):
            validate_quantity(-5)
        with self.assertRaises(InventoryValidationError):
            validate_quantity("10.5")

    def test_05_add_product(self):
        """Test adding products and dictionary structure."""
        products = []
        prod, products = add_product(
            products, "P101", "Wireless Mouse", "Electronics", 499.0, 50, 10
        )
        self.assertEqual(len(products), 1)
        self.assertEqual(prod["product_id"], "P101")
        self.assertEqual(prod["stock_quantity"], 50)
        self.assertEqual(prod["reorder_level"], 10)

        # Duplicate addition must fail
        with self.assertRaises(InventoryValidationError):
            add_product(products, "P101", "Duplicate Mouse", "Electronics", 300, 10, 5)

    def test_06_stock_addition(self):
        """Test stock in operation updates quantity and logs transaction."""
        products = []
        _, products = add_product(products, "P201", "Keyboard", "Electronics", 800, 20, 5)
        transactions = []

        prod, tx, products, transactions = record_stock_addition(
            products, transactions, "P201", 15, "Received from supplier"
        )
        self.assertEqual(prod["stock_quantity"], 35)
        self.assertEqual(tx["movement_type"], "Stock In")
        self.assertEqual(tx["previous_quantity"], 20)
        self.assertEqual(tx["new_quantity"], 35)
        self.assertEqual(tx["quantity_changed"], 15)

    def test_07_record_sale_and_boundary(self):
        """Test sales deduction, boundary constraint, and negative stock prevention."""
        products = []
        _, products = add_product(products, "P301", "Flash Drive", "Electronics", 350, 10, 3)
        transactions = []

        # Valid sale of 4 units
        prod, tx, products, transactions = record_sale(
            products, transactions, "P301", 4, "Customer order"
        )
        self.assertEqual(prod["stock_quantity"], 6)
        self.assertEqual(tx["movement_type"], "Sale")
        self.assertEqual(tx["previous_quantity"], 10)
        self.assertEqual(tx["new_quantity"], 6)

        # Overselling must raise exception and NOT mutate product
        with self.assertRaises(InventoryValidationError):
            record_sale(products, transactions, "P301", 10, "Attempted oversale")
        self.assertEqual(products[0]["stock_quantity"], 6)

    def test_08_stock_status_determinations(self):
        """Test status determination for zero, low-stock, and healthy stock."""
        self.assertEqual(determine_stock_status(0, 10), "Out of Stock")
        self.assertEqual(determine_stock_status(0, 0), "Out of Stock")
        self.assertEqual(determine_stock_status(5, 10), "Low Stock")
        self.assertEqual(determine_stock_status(10, 10), "Low Stock")
        self.assertEqual(determine_stock_status(11, 10), "In Stock")

    def test_09_valuation_calculations(self):
        """Test accurate total inventory and category valuation calculations."""
        products = [
            {"product_id": "A1", "product_name": "A", "category": "Cat1", "unit_price": 10.0, "stock_quantity": 5, "reorder_level": 2},
            {"product_id": "A2", "product_name": "B", "category": "Cat1", "unit_price": 20.0, "stock_quantity": 10, "reorder_level": 2},
            {"product_id": "B1", "product_name": "C", "category": "Cat2", "unit_price": 100.0, "stock_quantity": 0, "reorder_level": 5},
        ]
        metrics = calculate_inventory_metrics(products)
        # Expected: Cat1 = (10*5) + (20*10) = 250; Cat2 = 0; Total = 250.0
        self.assertEqual(metrics["total_stock_value"], 250.0)
        self.assertEqual(metrics["total_units"], 15)
        self.assertEqual(metrics["out_of_stock_count"], 1)
        self.assertEqual(metrics["total_categories"], 2)

    def test_10_safe_json_storage(self):
        """Test persistent storage save and reload."""
        products = [{"product_id": "P999", "product_name": "Test", "unit_price": 50.0, "stock_quantity": 10, "reorder_level": 2}]
        saved = storage.save_products(products)
        self.assertTrue(saved)

        loaded = storage.load_products()
        self.assertEqual(len(loaded), 1)
        self.assertEqual(loaded[0]["product_id"], "P999")

    def test_11_sample_data_protection(self):
        """Test sample data loading does not duplicate or destroy user records."""
        user_prod = {"product_id": "CUSTOM-1", "product_name": "My Custom Item", "is_sample": False, "stock_quantity": 50, "unit_price": 20.0, "reorder_level": 5}
        products = [user_prod]

        # Load samples (P001 to P005)
        count, products = load_sample_products(products)
        self.assertEqual(count, 5)
        self.assertEqual(len(products), 6)

        # Second load must not duplicate
        count2, products = load_sample_products(products)
        self.assertEqual(count2, 0)
        self.assertEqual(len(products), 6)

        # Clearing demo data must protect custom user product
        rem_count, products = clear_sample_products(products)
        self.assertEqual(rem_count, 5)
        self.assertEqual(len(products), 1)
        self.assertEqual(products[0]["product_id"], "CUSTOM-1")

    def test_12_csv_report_generation(self):
        """Test CSV report generation contains headers and expected content."""
        products = [
            {"product_id": "P001", "product_name": "Notebook", "category": "Stationery", "unit_price": 50.0, "stock_quantity": 10, "reorder_level": 20}
        ]
        csv_text = reports.generate_inventory_report_csv(products)
        self.assertIn("Product ID", csv_text)
        self.assertIn("Notebook", csv_text)
        self.assertIn("Stationery", csv_text)
        self.assertIn("50.00", csv_text)


if __name__ == "__main__":
    unittest.main()
