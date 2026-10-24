import os
import json
import base64

files_to_pack = [
    'StockFlow/app.py',
    'StockFlow/inventory_manager.py',
    'StockFlow/storage.py',
    'StockFlow/reports.py',
    'StockFlow/test_stockflow.py',
    'StockFlow/requirements.txt',
    'StockFlow/README.md',
    'StockFlow/data/inventory.json',
    'StockFlow/data/transactions.json',
]

packed = {}
for p in files_to_pack:
    with open(p, 'rb') as f:
        packed[p] = base64.b64encode(f.read()).decode('utf-8')

template = '''# StockFlow — Automated Self-Extractor Script
# Academic Mini-Project for CSE1012: Problem Solving using Python
# Run with: python setup_project.py

import os
import base64

ARCHIVE = %s

def main():
    print("\\n" + "="*60)
    print("  StockFlow Setup: Extracting Python Project Files")
    print("="*60)
    for path, b64_data in ARCHIVE.items():
        dir_path = os.path.dirname(path)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
        raw_bytes = base64.b64decode(b64_data.encode("utf-8"))
        with open(path, "wb") as f:
            f.write(raw_bytes)
        print(f"  [+] Created: {path} ({len(raw_bytes):,} bytes)")

    print("\\n[SUCCESS] All files unpacked successfully into ./StockFlow/")
    print("\\nNext steps to run:")
    print("  1. cd StockFlow")
    print("  2. pip install -r requirements.txt")
    print("  3. python test_stockflow.py")
    print("  4. streamlit run app.py\\n")

if __name__ == "__main__":
    main()
''' % json.dumps(packed, indent=2)

with open('public/setup_project.py', 'w', encoding='utf-8') as f:
    f.write(template)

with open('setup_project.py', 'w', encoding='utf-8') as f:
    f.write(template)

print("setup_project.py generated successfully!")
