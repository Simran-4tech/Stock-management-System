"""
Storage module for StockFlow Inventory & Stock Management System.
Handles persistent JSON file storage, atomic writes, and data recovery.
Academic Project: CSE1012 - Problem Solving using Python
"""

import json
import os
import shutil
from typing import Any, Dict, List, Optional

# Constants for storage paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
INVENTORY_FILE = os.path.join(DATA_DIR, "inventory.json")
TRANSACTIONS_FILE = os.path.join(DATA_DIR, "transactions.json")


def ensure_data_directory(directory_path: str = DATA_DIR) -> None:
    """
    Ensures that the storage directory exists.
    Uses exception handling to safely create nested directories if needed.
    """
    try:
        if not os.path.exists(directory_path):
            os.makedirs(directory_path, exist_ok=True)
    except OSError as err:
        print(f"Error creating storage directory '{directory_path}': {err}")
        raise


def safe_json_dump(data: Any, file_path: str) -> bool:
    """
    Safely writes data to a JSON file using an atomic replace strategy.
    Writes first to a temporary file, then renames to avoid corrupted files on interruption.
    """
    ensure_data_directory(os.path.dirname(file_path))
    temp_path = f"{file_path}.tmp"

    try:
        with open(temp_path, "w", encoding="utf-8") as temp_file:
            json.dump(data, temp_file, indent=2, ensure_ascii=False)
            temp_file.flush()
            os.fsync(temp_file.fileno())

        # Atomic replacement of target file
        shutil.move(temp_path, file_path)
        return True
    except (OSError, TypeError, ValueError) as err:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
        print(f"Failed to safely write JSON to '{file_path}': {err}")
        return False


def safe_json_load(file_path: str, default_value: Any) -> Any:
    """
    Safely reads JSON data from a file with fallback to default_value.
    Handles empty files, missing files, and JSON decode exceptions gracefully.
    """
    if not os.path.exists(file_path):
        return default_value

    try:
        with open(file_path, "r", encoding="utf-8") as json_file:
            content = json_file.read().strip()
            if not content:
                return default_value
            return json.loads(content)
    except (json.JSONDecodeError, OSError) as err:
        print(f"Warning: Could not read or decode JSON from '{file_path}': {err}")
        # Make a backup of corrupt file for debugging
        corrupt_backup = f"{file_path}.corrupt.bak"
        try:
            shutil.copy2(file_path, corrupt_backup)
            print(f"Corrupted file backed up to '{corrupt_backup}'")
        except OSError:
            pass
        return default_value


def initialize_storage() -> None:
    """
    Initializes required JSON files if they don't already exist.
    """
    ensure_data_directory(DATA_DIR)
    if not os.path.exists(INVENTORY_FILE):
        safe_json_dump([], INVENTORY_FILE)
    if not os.path.exists(TRANSACTIONS_FILE):
        safe_json_dump([], TRANSACTIONS_FILE)


def load_products() -> List[Dict[str, Any]]:
    """
    Loads the list of product dictionaries from inventory.json.
    """
    products = safe_json_load(INVENTORY_FILE, default_value=[])
    if not isinstance(products, list):
        return []
    return products


def save_products(products: List[Dict[str, Any]]) -> bool:
    """
    Persists the list of product dictionaries to inventory.json.
    """
    return safe_json_dump(products, INVENTORY_FILE)


def load_transactions() -> List[Dict[str, Any]]:
    """
    Loads stock movement transaction history from transactions.json.
    """
    transactions = safe_json_load(TRANSACTIONS_FILE, default_value=[])
    if not isinstance(transactions, list):
        return []
    return transactions


def save_transactions(transactions: List[Dict[str, Any]]) -> bool:
    """
    Persists the list of transactions to transactions.json.
    """
    return safe_json_dump(transactions, TRANSACTIONS_FILE)


def export_backup_json(backup_dir: str) -> Dict[str, str]:
    """
    Exports a timestamped backup of both inventory and transactions.
    """
    import datetime

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    ensure_data_directory(backup_dir)

    inv_backup = os.path.join(backup_dir, f"inventory_backup_{timestamp}.json")
    tx_backup = os.path.join(backup_dir, f"transactions_backup_{timestamp}.json")

    products = load_products()
    transactions = load_transactions()

    safe_json_dump(products, inv_backup)
    safe_json_dump(transactions, tx_backup)

    return {
        "inventory_backup": inv_backup,
        "transactions_backup": tx_backup,
        "timestamp": timestamp,
    }
