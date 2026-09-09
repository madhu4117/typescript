import io
import json
import main
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine
from app.models.product import Product
from app.models.customer import Customer
from app.models.category import Category
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.inventory import Inventory
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.models.import_history import ImportHistory
from app.models.import_error import ImportError
from app.services.import_service import (
    preview_import,
    process_import,
    get_sample_csv,
    REQUIRED_COLUMNS,
)

def run_tests():
    db = SessionLocal()
    company_id = 1
    user_id = 1

    print("==================================================")
    print("STARTING DATA IMPORT PIPELINE AUTOMATED TESTS")
    print("==================================================")

    # ----------------------------------------------------
    # TEST 1: Column Validation
    # ----------------------------------------------------
    print("\n--- TEST 1: Missing Required Columns Check ---")
    bad_csv = b"Product Name,Category,Unit Price\r\nTest,furniture,100"
    try:
        preview_import(db, company_id, "products", bad_csv)
        assert False, "Should have raised ValueError for missing SKU & Stock Quantity"
    except ValueError as e:
        print("PASS: Missing columns correctly rejected:", str(e))

    # ----------------------------------------------------
    # TEST 2: Sample Templates
    # ----------------------------------------------------
    print("\n--- TEST 2: Sample CSV Templates ---")
    for t in ["products", "customers", "sales"]:
        sample = get_sample_csv(t)
        assert len(sample) > 0, f"Template for {t} is empty"
        print(f"PASS: Sample template for '{t}' generated ({len(sample)} bytes)")

    # ----------------------------------------------------
    # TEST 3: Products Preview & Duplicate Detection
    # ----------------------------------------------------
    print("\n--- TEST 3: Products Preview & Validation ---")
    # Make sure category 'furniture' exists
    cat = db.query(Category).filter(Category.companyId == company_id, Category.name.ilike("furniture")).first()
    if not cat:
        cat = Category(companyId=company_id, name="furniture", description="Test furniture")
        db.add(cat)
        db.commit()

    products_csv = (
        "Product Name,SKU,Category,Unit Price,Stock Quantity,Brand\r\n"
        "Office Desk Elite,DESK-9901,furniture,12000.00,25,Ikea\r\n"
        "Ergonomic Stool,STOOL-9902,furniture,3500.00,40,Nilkamal\r\n"
        "Bad Price Product,BAD-01,furniture,-100.00,10,None\r\n"
        "Bad Stock Product,BAD-02,furniture,500.00,-5,None\r\n"
        "Missing Category Product,BAD-03,nonexistent_category_xyz,500.00,5,None\r\n"
        "Duplicate SKU Product,DESK-9901,furniture,12000.00,10,Ikea\r\n"
    ).encode("utf-8")

    preview_res = preview_import(db, company_id, "products", products_csv)
    print("Preview Result Summary:")
    print(f"  Total: {preview_res['total_records']}")
    print(f"  Valid: {preview_res['valid_records']}")
    print(f"  Invalid: {preview_res['invalid_records']}")
    print(f"  Duplicates: {preview_res['duplicate_records']}")

    assert preview_res['total_records'] == 6
    assert preview_res['valid_records'] == 2  # DESK-9901 (first) and STOOL-9902
    assert preview_res['duplicate_records'] == 1  # Duplicate SKU in CSV
    assert preview_res['invalid_records'] == 3  # Bad price, bad stock, missing category
    print("PASS: Product preview correctly identified valid, invalid, and duplicate records!")

    # ----------------------------------------------------
    # TEST 4: Products Process Import (Partial Success)
    # ----------------------------------------------------
    print("\n--- TEST 4: Products Process Import & Savepoints ---")
    # Clean up test products if previously left over
    db.query(Product).filter(Product.sku.in_(["DESK-9901", "STOOL-9902"])).delete(synchronize_session=False)
    db.commit()

    proc_res = process_import(
        db=db,
        company_id=company_id,
        user_id=user_id,
        import_type="products",
        filename="test_products.csv",
        file_bytes=products_csv,
    )

    print("Process Result:")
    print(f"  Import ID: {proc_res['import_id']}")
    print(f"  Status: {proc_res['status']}")
    print(f"  Successful: {proc_res['successful_records']}")
    print(f"  Failed: {proc_res['failed_records']}")
    print(f"  Duplicates: {proc_res['duplicate_records']}")
    print(f"  Errors Logged: {len(proc_res['errors'])}")

    assert proc_res['successful_records'] == 2
    assert proc_res['failed_records'] == 3
    assert proc_res['duplicate_records'] == 1
    assert proc_res['status'] == "Completed with Errors"

    # Verify products are indeed in DB
    p1 = db.query(Product).filter(Product.sku == "DESK-9901", Product.companyId == company_id).first()
    assert p1 is not None, "Product DESK-9901 should be saved in DB"
    assert p1.stockQuantity == 25

    p2 = db.query(Product).filter(Product.sku == "STOOL-9902", Product.companyId == company_id).first()
    assert p2 is not None, "Product STOOL-9902 should be saved in DB"

    print("PASS: Partial success import succeeded without DB corruption!")

    # ----------------------------------------------------
    # TEST 5: Customers Preview & Duplicate Detection
    # ----------------------------------------------------
    print("\n--- TEST 5: Customers Preview & Duplicate Detection ---")
    customers_csv = (
        "Name,Email,Phone,City\r\n"
        "Robert Brown,robert.test@example.com,9123456780,Bengaluru\r\n"
        "Sarah Connor,sarah.test@example.com,9123456781,Delhi\r\n"
        "Invalid Email User,invalid_email_no_at,9123456782,Chennai\r\n"
        "Invalid Phone User,good.email@example.com,123,Mumbai\r\n"
        "Duplicate Email In File,robert.test@example.com,9999999999,Bengaluru\r\n"
    ).encode("utf-8")

    cust_preview = preview_import(db, company_id, "customers", customers_csv)
    print("Customer Preview Summary:")
    print(f"  Total: {cust_preview['total_records']}")
    print(f"  Valid: {cust_preview['valid_records']}")
    print(f"  Invalid: {cust_preview['invalid_records']}")
    print(f"  Duplicates: {cust_preview['duplicate_records']}")

    assert cust_preview['valid_records'] == 2
    assert cust_preview['invalid_records'] == 2
    assert cust_preview['duplicate_records'] == 1
    print("PASS: Customers preview correctly validated email, phone, and duplicate keys!")

    # ----------------------------------------------------
    # TEST 6: Customers Process Import
    # ----------------------------------------------------
    print("\n--- TEST 6: Customers Process Import ---")
    # Clean up test customer
    db.query(Customer).filter(Customer.email.in_(["robert.test@example.com", "sarah.test@example.com"])).delete(synchronize_session=False)
    db.commit()

    cust_proc = process_import(
        db=db,
        company_id=company_id,
        user_id=user_id,
        import_type="customers",
        filename="test_customers.csv",
        file_bytes=customers_csv,
    )
    assert cust_proc['successful_records'] == 2
    assert cust_proc['failed_records'] == 2
    assert cust_proc['duplicate_records'] == 1
    print("PASS: Customer records committed successfully to DB!")

    # ----------------------------------------------------
    # TEST 7: Sales Preview, Stock Check, and Processing
    # ----------------------------------------------------
    print("\n--- TEST 7: Sales Preview & Inventory Stock Protection ---")
    # p1 (DESK-9901) has stockQuantity = 25
    sales_csv = (
        "Customer,Product,Quantity,Unit Price,Sale Date,Sales Channel\r\n"
        "robert.test@example.com,DESK-9901,5,12000.00,2026-09-01,In-Store\r\n"
        "robert.test@example.com,DESK-9901,10,12000.00,2026-09-02,Online\r\n"
        "robert.test@example.com,DESK-9901,20,12000.00,2026-09-03,In-Store\r\n"
        "unknown.person@nowhere.com,DESK-9901,1,12000.00,2026-09-01,Online\r\n"
        "robert.test@example.com,nonexistent_sku,1,1000.00,2026-09-01,Online\r\n"
    ).encode("utf-8")

    # Row 1 requests 5 (leaves 20) -> Valid
    # Row 2 requests 10 (leaves 10) -> Valid
    # Row 3 requests 20 (only 10 left in running stock!) -> Invalid (Insufficient stock)
    # Row 4 unknown customer -> Invalid
    # Row 5 unknown product -> Invalid

    sales_prev = preview_import(db, company_id, "sales", sales_csv)
    print("Sales Preview Summary:")
    print(f"  Total: {sales_prev['total_records']}")
    print(f"  Valid: {sales_prev['valid_records']}")
    print(f"  Invalid: {sales_prev['invalid_records']}")

    assert sales_prev['total_records'] == 5
    assert sales_prev['valid_records'] == 2
    assert sales_prev['invalid_records'] == 3
    print("PASS: Sales stock exhaustion correctly caught during preview!")

    # Now process valid sale
    valid_sales_csv = (
        "Customer,Product,Quantity,Unit Price,Sale Date,Sales Channel\r\n"
        "robert.test@example.com,DESK-9901,5,12000.00,2026-09-01,In-Store\r\n"
    ).encode("utf-8")

    old_stock = p1.stockQuantity
    sale_proc = process_import(
        db=db,
        company_id=company_id,
        user_id=user_id,
        import_type="sales",
        filename="test_sales.csv",
        file_bytes=valid_sales_csv,
    )
    assert sale_proc['successful_records'] == 1
    assert sale_proc['status'] == "Completed"

    db.refresh(p1)
    print(f"  Product stock updated: {old_stock} -> {p1.stockQuantity}")
    assert p1.stockQuantity == old_stock - 5, "Product stock should be deducted by quantity"
    print("PASS: Sale created and inventory stock correctly deducted!")

    # ----------------------------------------------------
    # TEST 8: History & Error Logs Retrieval
    # ----------------------------------------------------
    print("\n--- TEST 8: History & Error Logs Retrieval ---")
    hist_records = db.query(ImportHistory).filter(ImportHistory.company_id == company_id).all()
    assert len(hist_records) > 0
    print(f"PASS: Verified {len(hist_records)} import history records stored in database")

    errors_logged = db.query(ImportError).filter(ImportError.import_id == proc_res['import_id']).all()
    assert len(errors_logged) > 0
    print(f"PASS: Verified {len(errors_logged)} detailed import errors stored for import #{proc_res['import_id']}")

    print("\n==================================================")
    print("ALL DATA IMPORT PIPELINE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")
    db.close()

if __name__ == "__main__":
    run_tests()
