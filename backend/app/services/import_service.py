import csv
import io
import json
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.import_history import ImportHistory
from app.models.import_error import ImportError
from app.models.product import Product
from app.models.customer import Customer
from app.models.category import Category
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.inventory import Inventory


# ============================================================
# REQUIRED COLUMNS (Task 12 Spec)
# ============================================================

REQUIRED_COLUMNS = {
    "products": [
        "Product Name",
        "SKU",
        "Category",
        "Unit Price",
        "Stock Quantity",
    ],
    "customers": [
        "Name",
        "Email",
        "Phone",
    ],
    "sales": [
        "Customer",
        "Product",
        "Quantity",
        "Unit Price",
        "Sale Date",
    ],
}


# ============================================================
# SAMPLE CSV TEMPLATES
# ============================================================

SAMPLE_TEMPLATES = {
    "products": (
        "Product Name,SKU,Category,Unit Price,Stock Quantity,Brand,Description\r\n"
        "Mechanical Keyboard,KB-101,Accessories,3499.00,50,Logitech,Wireless RGB Mechanical Keyboard\r\n"
        "UltraWide Monitor 34-inch,MN-202,Electronics,28999.00,20,Samsung,Curved WQHD Gaming Monitor\r\n"
        "Ergonomic Office Chair,EC-303,Furniture,8500.00,15,Godrej,High back mesh executive chair\r\n"
    ),
    "customers": (
        "Name,Email,Phone,Address,City,State,Postal Code,Customer Type\r\n"
        "John Doe,john.doe@example.com,9876543210,123 MG Road,Bengaluru,Karnataka,560001,Retail\r\n"
        "Jane Smith,jane.smith@example.com,9876543211,456 Park Street,Kolkata,West Bengal,700016,Corporate\r\n"
        "Rahul Sharma,rahul.s@example.com,9876543212,789 Linking Road,Mumbai,Maharashtra,400050,Wholesale\r\n"
    ),
    "sales": (
        "Customer,Product,Quantity,Unit Price,Sale Date,Sales Channel,Payment Method\r\n"
        "john.doe@example.com,KB-101,2,3499.00,2026-09-01,In-Store,Credit Card\r\n"
        "jane.smith@example.com,MN-202,1,28999.00,2026-09-02,Online,UPI\r\n"
    ),
}


def get_sample_csv(import_type: str) -> str:
    return SAMPLE_TEMPLATES.get(import_type, "")


# ============================================================
# HELPERS
# ============================================================

def clean(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def normalize(value: Any) -> str:
    return clean(value).lower()


def clean_phone(value: Any) -> str:
    return re.sub(r"[^\d+]", "", clean(value))


def is_valid_email(email: str) -> bool:
    email = clean(email)
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(pattern, email))


def parse_decimal(value: Any, field_name: str) -> Decimal:
    str_val = clean(value)
    if not str_val:
        raise ValueError(f"{field_name} is required")
    try:
        num = Decimal(str_val)
    except InvalidOperation:
        raise ValueError(f"{field_name} must be a valid number")
    return num


def parse_integer(value: Any, field_name: str) -> int:
    str_val = clean(value)
    if not str_val:
        raise ValueError(f"{field_name} is required")
    try:
        if "." in str_val:
            float_val = float(str_val)
            if float_val.is_integer():
                return int(float_val)
            raise ValueError()
        return int(str_val)
    except (ValueError, TypeError):
        raise ValueError(f"{field_name} must be a valid integer")


def parse_date(value: Any) -> datetime:
    str_val = clean(value)
    if not str_val:
        raise ValueError("Sale Date is required")

    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%Y-%m-%d %H:%M:%S",
        "%d-%m-%Y %H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(str_val, fmt)
        except ValueError:
            continue

    raise ValueError("Sale Date must be YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY")


# ============================================================
# CSV READER & COLUMN MATCHER
# ============================================================

def match_column_key(target_col: str, row: dict) -> Any:
    norm_target = normalize(target_col).replace(" ", "").replace("_", "")
    for key, val in row.items():
        if key is not None:
            norm_key = normalize(key).replace(" ", "").replace("_", "")
            if norm_key == norm_target:
                return val
    return None


def read_csv(file_bytes: bytes) -> tuple[list[dict], list[str]]:
    try:
        text = file_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text = file_bytes.decode("latin-1")
        except UnicodeDecodeError:
            text = file_bytes.decode("utf-8", errors="replace")

    reader = csv.DictReader(io.StringIO(text))
    raw_headers = reader.fieldnames or []
    headers = [clean(col) for col in raw_headers if col is not None]

    rows = []
    for row in reader:
        cleaned_row = {
            clean(k): clean(v)
            for k, v in row.items()
            if k is not None
        }
        if any(v for v in cleaned_row.values()):
            rows.append(cleaned_row)

    return rows, headers


def validate_columns(import_type: str, headers: list[str]) -> list[str]:
    required = REQUIRED_COLUMNS.get(import_type)
    if not required:
        raise ValueError(f"Invalid import type: '{import_type}'")

    normalized_headers = {
        normalize(h).replace(" ", "").replace("_", ""): h for h in headers
    }

    missing = []
    for req in required:
        norm_req = normalize(req).replace(" ", "").replace("_", "")
        if norm_req not in normalized_headers:
            missing.append(req)

    return missing


# ============================================================
# PREVIEW IMPORT
# ============================================================

def preview_import(
    db: Session,
    company_id: int,
    import_type: str,
    file_bytes: bytes,
) -> dict:
    rows, headers = read_csv(file_bytes)

    missing_cols = validate_columns(import_type, headers)
    if missing_cols:
        raise ValueError(f"Missing required columns: {', '.join(missing_cols)}")

    preview_rows = []
    seen_in_csv = set()
    duplicate_count = 0
    valid_count = 0
    invalid_count = 0

    # Pre-fetch existing data for company
    if import_type == "products":
        existing_skus = {
            p.sku.lower()
            for p in db.query(Product.sku)
            .filter(Product.companyId == company_id)
            .all()
            if p.sku
        }
        categories = {
            c.name.lower(): c.id
            for c in db.query(Category.name, Category.id)
            .filter(Category.companyId == company_id)
            .all()
        }

    elif import_type == "customers":
        cust_records = db.query(Customer.email, Customer.phone).filter(
            Customer.companyId == company_id
        ).all()
        existing_emails = {c.email.lower() for c in cust_records if c.email}
        existing_phones = {clean_phone(c.phone) for c in cust_records if c.phone}

    elif import_type == "sales":
        cust_records = db.query(
            Customer.id, Customer.firstName, Customer.lastName, Customer.email
        ).filter(Customer.companyId == company_id).all()

        customers_by_email = {c.email.lower(): c for c in cust_records if c.email}
        customers_by_name = {
            f"{c.firstName} {c.lastName}".strip().lower(): c for c in cust_records
        }

        prod_records = db.query(
            Product.id, Product.name, Product.sku, Product.stockQuantity, Product.unitPrice
        ).filter(Product.companyId == company_id).all()

        prods_by_sku = {p.sku.lower(): p for p in prod_records if p.sku}
        prods_by_name = {p.name.lower(): p for p in prod_records if p.name}
        running_stock = {p.id: p.stockQuantity for p in prod_records}

    for index, row in enumerate(rows, start=2):
        row_errors = []
        is_duplicate = False
        duplicate_reason = ""

        if import_type == "products":
            name = clean(match_column_key("Product Name", row))
            sku = clean(match_column_key("SKU", row))
            cat_name = clean(match_column_key("Category", row))
            price_raw = match_column_key("Unit Price", row)
            stock_raw = match_column_key("Stock Quantity", row)

            if not name:
                row_errors.append("Product Name is required")
            if not sku:
                row_errors.append("SKU is required")
            if not cat_name:
                row_errors.append("Category is required")
            elif cat_name.lower() not in categories:
                row_errors.append(f"Category '{cat_name}' not found for this company")

            try:
                price = parse_decimal(price_raw, "Unit Price")
                if price <= 0:
                    row_errors.append("Unit Price must be greater than zero")
            except ValueError as e:
                row_errors.append(str(e))

            try:
                stock = parse_integer(stock_raw, "Stock Quantity")
                if stock < 0:
                    row_errors.append("Stock Quantity cannot be negative")
            except ValueError as e:
                row_errors.append(str(e))

            if sku:
                sku_lower = sku.lower()
                if sku_lower in seen_in_csv:
                    is_duplicate = True
                    duplicate_reason = f"Duplicate SKU '{sku}' in uploaded CSV"
                elif sku_lower in existing_skus:
                    is_duplicate = True
                    duplicate_reason = f"SKU '{sku}' already exists in database"
                else:
                    seen_in_csv.add(sku_lower)

        elif import_type == "customers":
            name = clean(match_column_key("Name", row))
            email = clean(match_column_key("Email", row))
            phone = clean(match_column_key("Phone", row))

            if not name:
                row_errors.append("Name is required")

            if not email:
                row_errors.append("Email is required")
            elif not is_valid_email(email):
                row_errors.append("Email address is invalid format")

            if not phone:
                row_errors.append("Phone is required")
            elif len(clean_phone(phone)) < 7:
                row_errors.append("Phone must contain at least 7 digits")

            email_lower = email.lower() if email else ""
            phone_norm = clean_phone(phone) if phone else ""

            dup_parts = []
            if email_lower:
                if f"email:{email_lower}" in seen_in_csv:
                    dup_parts.append(f"Duplicate email '{email}' in uploaded CSV")
                elif email_lower in existing_emails:
                    dup_parts.append(f"Email '{email}' already registered in database")
                else:
                    seen_in_csv.add(f"email:{email_lower}")

            if phone_norm:
                if f"phone:{phone_norm}" in seen_in_csv:
                    dup_parts.append(f"Duplicate phone '{phone}' in uploaded CSV")
                elif phone_norm in existing_phones:
                    dup_parts.append(f"Phone '{phone}' already registered in database")
                else:
                    seen_in_csv.add(f"phone:{phone_norm}")

            if dup_parts:
                is_duplicate = True
                duplicate_reason = "; ".join(dup_parts)

        elif import_type == "sales":
            cust_val = clean(match_column_key("Customer", row))
            prod_val = clean(match_column_key("Product", row))
            qty_raw = match_column_key("Quantity", row)
            price_raw = match_column_key("Unit Price", row)
            date_raw = match_column_key("Sale Date", row)

            customer = None
            if not cust_val:
                row_errors.append("Customer is required")
            else:
                cust_lower = cust_val.lower()
                customer = customers_by_email.get(cust_lower) or customers_by_name.get(cust_lower)
                if not customer:
                    row_errors.append(f"Customer '{cust_val}' does not exist in company records")

            product = None
            if not prod_val:
                row_errors.append("Product is required")
            else:
                prod_lower = prod_val.lower()
                product = prods_by_sku.get(prod_lower) or prods_by_name.get(prod_lower)
                if not product:
                    row_errors.append(f"Product '{prod_val}' does not exist in company inventory")

            parsed_qty = 0
            try:
                parsed_qty = parse_integer(qty_raw, "Quantity")
                if parsed_qty <= 0:
                    row_errors.append("Quantity must be greater than zero")
            except ValueError as e:
                row_errors.append(str(e))

            try:
                price = parse_decimal(price_raw, "Unit Price")
                if price <= 0:
                    row_errors.append("Unit Price must be greater than zero")
            except ValueError as e:
                row_errors.append(str(e))

            try:
                parse_date(date_raw)
            except ValueError as e:
                row_errors.append(str(e))

            if product and parsed_qty > 0:
                avail = running_stock.get(product.id, 0)
                if parsed_qty > avail:
                    row_errors.append(
                        f"Insufficient stock for '{product.name}': requested {parsed_qty}, only {avail} available"
                    )
                else:
                    running_stock[product.id] -= parsed_qty

            sale_key = f"{cust_val.lower()}|{prod_val.lower()}|{date_raw.lower()}|{qty_raw}"
            if sale_key in seen_in_csv:
                is_duplicate = True
                duplicate_reason = "Identical sale transaction repeated in uploaded CSV"
            else:
                seen_in_csv.add(sale_key)

        is_valid = len(row_errors) == 0 and not is_duplicate
        if is_duplicate:
            duplicate_count += 1
        elif is_valid:
            valid_count += 1
        else:
            invalid_count += 1

        all_errors = list(row_errors)
        if is_duplicate and duplicate_reason:
            all_errors.append(duplicate_reason)

        preview_rows.append({
            "row_number": index,
            "data": row,
            "valid": is_valid,
            "errors": all_errors,
            "duplicate": is_duplicate,
            "duplicate_reason": duplicate_reason,
        })

    return {
        "import_type": import_type,
        "filename": "",
        "total_records": len(rows),
        "valid_records": valid_count,
        "invalid_records": invalid_count,
        "duplicate_records": duplicate_count,
        "required_columns": REQUIRED_COLUMNS[import_type],
        "detected_columns": headers,
        "rows": preview_rows,
    }


# ============================================================
# PROCESS IMPORT (WITH SAVEPOINTS & DATA INTEGRITY)
# ============================================================

def process_import(
    db: Session,
    company_id: int,
    user_id: int,
    import_type: str,
    filename: str,
    file_bytes: bytes,
) -> dict:
    rows, headers = read_csv(file_bytes)

    missing_cols = validate_columns(import_type, headers)
    if missing_cols:
        raise ValueError(f"Missing required columns: {', '.join(missing_cols)}")

    # Step 1: Create initial history record and commit it so it's immune to rollback
    history = ImportHistory(
        company_id=company_id,
        import_type=import_type,
        filename=filename,
        uploaded_by=user_id,
        total_records=len(rows),
        successful_records=0,
        failed_records=0,
        duplicate_records=0,
        status="Processing",
        created_at=datetime.utcnow(),
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    successful = 0
    failed = 0
    duplicates = 0
    errors_output = []
    seen_in_csv = set()

    # Pre-fetch lookup caches
    if import_type == "products":
        categories = {
            c.name.lower(): c.id
            for c in db.query(Category.name, Category.id)
            .filter(Category.companyId == company_id)
            .all()
        }
        existing_skus = {
            p.sku.lower()
            for p in db.query(Product.sku)
            .filter(Product.companyId == company_id)
            .all()
            if p.sku
        }

    elif import_type == "customers":
        cust_records = db.query(Customer.email, Customer.phone).filter(
            Customer.companyId == company_id
        ).all()
        existing_emails = {c.email.lower() for c in cust_records if c.email}
        existing_phones = {clean_phone(c.phone) for c in cust_records if c.phone}

    elif import_type == "sales":
        cust_records = db.query(
            Customer.id, Customer.firstName, Customer.lastName, Customer.email
        ).filter(Customer.companyId == company_id).all()
        customers_by_email = {c.email.lower(): c for c in cust_records if c.email}
        customers_by_name = {
            f"{c.firstName} {c.lastName}".strip().lower(): c for c in cust_records
        }

    # Step 2: Iterate and process each record in its own savepoint
    for row_number, row in enumerate(rows, start=2):
        row_errors = []
        is_duplicate = False
        duplicate_reason = ""

        if import_type == "products":
            name = clean(match_column_key("Product Name", row))
            sku = clean(match_column_key("SKU", row))
            cat_name = clean(match_column_key("Category", row))
            price_raw = match_column_key("Unit Price", row)
            stock_raw = match_column_key("Stock Quantity", row)
            brand = clean(match_column_key("Brand", row)) or None
            description = clean(match_column_key("Description", row)) or None

            if not name:
                row_errors.append("Product Name is required")
            if not sku:
                row_errors.append("SKU is required")
            if not cat_name:
                row_errors.append("Category is required")
            elif cat_name.lower() not in categories:
                row_errors.append(f"Category '{cat_name}' not found for this company")

            parsed_price = Decimal(0)
            try:
                parsed_price = parse_decimal(price_raw, "Unit Price")
                if parsed_price <= 0:
                    row_errors.append("Unit Price must be greater than zero")
            except ValueError as e:
                row_errors.append(str(e))

            parsed_stock = 0
            try:
                parsed_stock = parse_integer(stock_raw, "Stock Quantity")
                if parsed_stock < 0:
                    row_errors.append("Stock Quantity cannot be negative")
            except ValueError as e:
                row_errors.append(str(e))

            if sku:
                sku_lower = sku.lower()
                if sku_lower in seen_in_csv:
                    is_duplicate = True
                    duplicate_reason = f"Duplicate SKU '{sku}' in uploaded CSV"
                elif sku_lower in existing_skus:
                    is_duplicate = True
                    duplicate_reason = f"SKU '{sku}' already exists in database"
                else:
                    seen_in_csv.add(sku_lower)

            if is_duplicate:
                duplicates += 1
                err = ImportError(
                    import_id=history.id,
                    row_number=row_number,
                    error_type="Duplicate",
                    field="SKU",
                    error_message=duplicate_reason,
                    row_data=json.dumps(row),
                )
                db.add(err)
                db.commit()
                errors_output.append({
                    "row_number": row_number,
                    "type": "Duplicate",
                    "field": "SKU",
                    "message": duplicate_reason,
                })
                continue

            if row_errors:
                failed += 1
                err = ImportError(
                    import_id=history.id,
                    row_number=row_number,
                    error_type="Validation",
                    field=None,
                    error_message="; ".join(row_errors),
                    row_data=json.dumps(row),
                )
                db.add(err)
                db.commit()
                errors_output.append({
                    "row_number": row_number,
                    "type": "Validation",
                    "field": None,
                    "message": "; ".join(row_errors),
                })
                continue

            try:
                with db.begin_nested():
                    product = Product(
                        companyId=company_id,
                        categoryId=categories[cat_name.lower()],
                        name=name,
                        sku=sku,
                        brand=brand,
                        description=description,
                        unitPrice=float(parsed_price),
                        costPrice=0.0,
                        stockQuantity=parsed_stock,
                        unitOfMeasure=clean(match_column_key("Unit Of Measure", row)) or "Piece",
                        status="Active" if parsed_stock > 0 else "Out of Stock",
                    )
                    db.add(product)
                db.commit()
                existing_skus.add(sku.lower())
                successful += 1
            except Exception as e:
                db.rollback()
                failed += 1
                err = ImportError(
                    import_id=history.id,
                    row_number=row_number,
                    error_type="Database",
                    field=None,
                    error_message=str(e),
                    row_data=json.dumps(row),
                )
                db.add(err)
                db.commit()
                errors_output.append({
                    "row_number": row_number,
                    "type": "Database",
                    "field": None,
                    "message": str(e),
                })

        elif import_type == "customers":
            name = clean(match_column_key("Name", row))
            email = clean(match_column_key("Email", row))
            phone = clean(match_column_key("Phone", row))
            address = clean(match_column_key("Address", row))
            city = clean(match_column_key("City", row))
            state = clean(match_column_key("State", row))
            country = clean(match_column_key("Country", row)) or "India"
            postal_code = clean(match_column_key("Postal Code", row))
            customer_type = clean(match_column_key("Customer Type", row)) or "Retail"
            customer_segment = clean(match_column_key("Customer Segment", row)) or "New"

            if not name:
                row_errors.append("Name is required")
            if not email:
                row_errors.append("Email is required")
            elif not is_valid_email(email):
                row_errors.append("Email address is invalid format")

            if not phone:
                row_errors.append("Phone is required")
            elif len(clean_phone(phone)) < 7:
                row_errors.append("Phone must contain at least 7 digits")

            email_lower = email.lower() if email else ""
            phone_norm = clean_phone(phone) if phone else ""

            dup_parts = []
            if email_lower:
                if f"email:{email_lower}" in seen_in_csv:
                    dup_parts.append(f"Duplicate email '{email}' in uploaded CSV")
                elif email_lower in existing_emails:
                    dup_parts.append(f"Email '{email}' already registered in database")
                else:
                    seen_in_csv.add(f"email:{email_lower}")

            if phone_norm:
                if f"phone:{phone_norm}" in seen_in_csv:
                    dup_parts.append(f"Duplicate phone '{phone}' in uploaded CSV")
                elif phone_norm in existing_phones:
                    dup_parts.append(f"Phone '{phone}' already registered in database")
                else:
                    seen_in_csv.add(f"phone:{phone_norm}")

            if dup_parts:
                duplicates += 1
                reason = "; ".join(dup_parts)
                err = ImportError(
                    import_id=history.id,
                    row_number=row_number,
                    error_type="Duplicate",
                    field="Email/Phone",
                    error_message=reason,
                    row_data=json.dumps(row),
                )
                db.add(err)
                db.commit()
                errors_output.append({
                    "row_number": row_number,
                    "type": "Duplicate",
                    "field": "Email/Phone",
                    "message": reason,
                })
                continue

            if row_errors:
                failed += 1
                err = ImportError(
                    import_id=history.id,
                    row_number=row_number,
                    error_type="Validation",
                    field=None,
                    error_message="; ".join(row_errors),
                    row_data=json.dumps(row),
                )
                db.add(err)
                db.commit()
                errors_output.append({
                    "row_number": row_number,
                    "type": "Validation",
                    "field": None,
                    "message": "; ".join(row_errors),
                })
                continue

            parts = name.split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

            try:
                with db.begin_nested():
                    customer = Customer(
                        companyId=company_id,
                        firstName=first_name,
                        lastName=last_name,
                        email=email,
                        phone=phone,
                        address=address,
                        city=city,
                        state=state,
                        country=country,
                        postalCode=postal_code,
                        customerType=customer_type,
                        customerSegment=customer_segment,
                        status="Active",
                    )
                    db.add(customer)
                db.commit()
                existing_emails.add(email_lower)
                if phone_norm:
                    existing_phones.add(phone_norm)
                successful += 1
            except Exception as e:
                db.rollback()
                failed += 1
                err = ImportError(
                    import_id=history.id,
                    row_number=row_number,
                    error_type="Database",
                    field=None,
                    error_message=str(e),
                    row_data=json.dumps(row),
                )
                db.add(err)
                db.commit()
                errors_output.append({
                    "row_number": row_number,
                    "type": "Database",
                    "field": None,
                    "message": str(e),
                })

        elif import_type == "sales":
            cust_val = clean(match_column_key("Customer", row))
            prod_val = clean(match_column_key("Product", row))
            qty_raw = match_column_key("Quantity", row)
            price_raw = match_column_key("Unit Price", row)
            date_raw = match_column_key("Sale Date", row)
            sales_channel = clean(match_column_key("Sales Channel", row)) or "Import"
            payment_method = clean(match_column_key("Payment Method", row)) or "Other"

            customer = None
            if not cust_val:
                row_errors.append("Customer is required")
            else:
                cust_lower = cust_val.lower()
                customer = customers_by_email.get(cust_lower) or customers_by_name.get(cust_lower)
                if not customer:
                    row_errors.append(f"Customer '{cust_val}' not found in company records")

            product = None
            if not prod_val:
                row_errors.append("Product is required")
            else:
                product = (
                    db.query(Product)
                    .filter(
                        Product.companyId == company_id,
                        (Product.sku.ilike(prod_val) | Product.name.ilike(prod_val)),
                    )
                    .first()
                )
                if not product:
                    row_errors.append(f"Product '{prod_val}' not found in company inventory")

            parsed_qty = 0
            try:
                parsed_qty = parse_integer(qty_raw, "Quantity")
                if parsed_qty <= 0:
                    row_errors.append("Quantity must be greater than zero")
            except ValueError as e:
                row_errors.append(str(e))

            parsed_price = Decimal(0)
            try:
                parsed_price = parse_decimal(price_raw, "Unit Price")
                if parsed_price <= 0:
                    row_errors.append("Unit Price must be greater than zero")
            except ValueError as e:
                row_errors.append(str(e))

            parsed_date = None
            try:
                parsed_date = parse_date(date_raw)
            except ValueError as e:
                row_errors.append(str(e))

            if product and parsed_qty > 0:
                if parsed_qty > product.stockQuantity:
                    row_errors.append(
                        f"Insufficient stock for '{product.name}': requested {parsed_qty}, only {product.stockQuantity} available"
                    )

            sale_key = f"{cust_val.lower()}|{prod_val.lower()}|{date_raw.lower()}|{qty_raw}"
            if sale_key in seen_in_csv:
                duplicates += 1
                reason = "Identical sale transaction repeated in uploaded CSV"
                err = ImportError(
                    import_id=history.id,
                    row_number=row_number,
                    error_type="Duplicate",
                    field="Transaction",
                    error_message=reason,
                    row_data=json.dumps(row),
                )
                db.add(err)
                db.commit()
                errors_output.append({
                    "row_number": row_number,
                    "type": "Duplicate",
                    "field": "Transaction",
                    "message": reason,
                })
                continue
            seen_in_csv.add(sale_key)

            if row_errors:
                failed += 1
                err = ImportError(
                    import_id=history.id,
                    row_number=row_number,
                    error_type="Validation",
                    field=None,
                    error_message="; ".join(row_errors),
                    row_data=json.dumps(row),
                )
                db.add(err)
                db.commit()
                errors_output.append({
                    "row_number": row_number,
                    "type": "Validation",
                    "field": None,
                    "message": "; ".join(row_errors),
                })
                continue

            unit_price = float(parsed_price) if parsed_price > 0 else float(product.unitPrice)
            total_amount = unit_price * parsed_qty
            inv_suffix = f"{int(datetime.utcnow().timestamp() * 1000)}-{row_number}"
            invoice_num = f"INV-IMP-{company_id}-{inv_suffix}"

            try:
                with db.begin_nested():
                    customer_display_name = f"{customer.firstName} {customer.lastName}".strip()
                    sale = Sale(
                        companyId=company_id,
                        customerId=customer.id,
                        customerName=customer_display_name,
                        invoiceNumber=invoice_num,
                        saleDate=parsed_date,
                        salesChannel=sales_channel,
                        paymentMethod=payment_method,
                        totalAmount=total_amount,
                        createdBy=user_id,
                    )
                    db.add(sale)
                    db.flush()

                    sale_item = SaleItem(
                        saleId=sale.id,
                        productId=product.id,
                        categoryId=product.categoryId,
                        quantity=parsed_qty,
                        unitPrice=unit_price,
                        discount=0,
                        tax=0,
                        total=total_amount,
                    )
                    db.add(sale_item)

                    product.stockQuantity -= parsed_qty
                    if product.stockQuantity <= 0:
                        product.status = "Out of Stock"
                db.commit()
                successful += 1
            except Exception as e:
                db.rollback()
                failed += 1
                err = ImportError(
                    import_id=history.id,
                    row_number=row_number,
                    error_type="Database",
                    field=None,
                    error_message=str(e),
                    row_data=json.dumps(row),
                )
                db.add(err)
                db.commit()
                errors_output.append({
                    "row_number": row_number,
                    "type": "Database",
                    "field": None,
                    "message": str(e),
                })

    # Step 3: Determine final status and commit history
    if failed == 0 and duplicates == 0:
        final_status = "Completed"
    elif successful > 0:
        final_status = "Completed with Errors"
    else:
        final_status = "Failed"

    history.total_records = len(rows)
    history.successful_records = successful
    history.failed_records = failed
    history.duplicate_records = duplicates
    history.status = final_status
    history.completed_at = datetime.utcnow()
    db.commit()

    return {
        "import_id": history.id,
        "import_type": import_type,
        "filename": filename,
        "total_records": len(rows),
        "successful_records": successful,
        "failed_records": failed,
        "duplicate_records": duplicates,
        "status": history.status,
        "errors": errors_output,
    }