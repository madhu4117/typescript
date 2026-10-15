import csv
import io
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "reports_storage"))
os.makedirs(REPORTS_DIR, exist_ok=True)


def format_filter_context(filters: Dict[str, Any]) -> List[List[str]]:
    """Format filter dictionary into a human-readable list of key-value pairs."""
    ctx = []
    from_date = filters.get("fromDate")
    to_date = filters.get("toDate")
    if from_date or to_date:
        ctx.append(["Date Range / Period", f"{from_date or 'Start'} to {to_date or 'Present'}"])
    else:
        ctx.append(["Date Range / Period", "All Time"])

    if filters.get("productId"):
        ctx.append(["Product ID", str(filters["productId"])])
    if filters.get("categoryId"):
        ctx.append(["Category ID", str(filters["categoryId"])])
    if filters.get("brand"):
        ctx.append(["Brand", str(filters["brand"])])
    if filters.get("customerId"):
        ctx.append(["Customer ID", str(filters["customerId"])])
    if filters.get("salesStatus"):
        ctx.append(["Sales Status", str(filters["salesStatus"])])
    if filters.get("stockStatus"):
        ctx.append(["Stock Status", str(filters["stockStatus"])])
    if filters.get("userId"):
        ctx.append(["User ID", str(filters["userId"])])
    return ctx


def export_report_csv(
    report_name: str,
    filters: Dict[str, Any],
    items: List[Dict[str, Any]],
    generated_at: Optional[datetime] = None,
) -> str:
    """Generate CSV text containing filter context metadata header and tabular data."""
    if generated_at is None:
        generated_at = datetime.now(timezone.utc)

    output = io.StringIO()
    writer = csv.writer(output)

    # 1. Metadata / Filter Context
    writer.writerow(["# REPORT SUMMARY"])
    writer.writerow(["Report Name", report_name])
    writer.writerow(["Generated At", generated_at.strftime("%Y-%m-%d %H:%M:%S UTC")])
    writer.writerow(["Total Records", str(len(items))])

    filter_pairs = format_filter_context(filters)
    writer.writerow(["# APPLIED FILTERS"])
    for key, val in filter_pairs:
        writer.writerow([key, val])
    writer.writerow([])  # empty separator line

    # 2. Table Data
    if items:
        headers = list(items[0].keys())
        writer.writerow(headers)
        for item in items:
            writer.writerow([item.get(h, "") for h in headers])
    else:
        writer.writerow(["No records found matching the specified filters."])

    output.seek(0)
    return output.getvalue()


def export_report_pdf(
    report_name: str,
    filters: Dict[str, Any],
    items: List[Dict[str, Any]],
    generated_at: Optional[datetime] = None,
) -> bytes:
    """Generate PDF bytes containing structured styling, filter context, and table."""
    if generated_at is None:
        generated_at = datetime.now(timezone.utc)

    buffer = io.BytesIO()
    # Choose landscape orientation for broad reports
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        leftMargin=30,
        rightMargin=30,
        topMargin=30,
        bottomMargin=30,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#4c1d95"),
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b"),
    )
    cell_style = ParagraphStyle(
        "ReportCell",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1e293b"),
    )
    header_cell_style = ParagraphStyle(
        "HeaderCell",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.white,
        fontName="Helvetica-Bold",
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph(f"<b>{report_name}</b>", title_style))
    story.append(
        Paragraph(
            f"Generated: {generated_at.strftime('%Y-%m-%d %H:%M:%S UTC')} | Total Records: {len(items)}",
            subtitle_style,
        )
    )
    story.append(Spacer(1, 10))

    # Applied Filters Box
    filter_pairs = format_filter_context(filters)
    filter_data = [
        [
            Paragraph("<b>Filter Name</b>", cell_style),
            Paragraph("<b>Selected Value</b>", cell_style),
        ]
    ]
    for key, val in filter_pairs:
        filter_data.append([Paragraph(key, cell_style), Paragraph(val, cell_style)])

    filter_table = Table(filter_data, colWidths=[150, 300])
    filter_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ]
        )
    )
    story.append(filter_table)
    story.append(Spacer(1, 15))

    # Data Table
    if items:
        raw_headers = list(items[0].keys())
        col_count = len(raw_headers)
        # Compute dynamic column widths to fit landscape printable width (~732 pt)
        avail_width = 732
        col_width = max(50, avail_width / max(1, col_count))

        table_data = [
            [Paragraph(h.replace("_", " ").title(), header_cell_style) for h in raw_headers]
        ]

        for item in items[:200]:  # limit to first 200 rows in PDF for performance
            row = []
            for h in raw_headers:
                val = item.get(h)
                if val is None:
                    row_val = "—"
                elif isinstance(val, float):
                    row_val = f"{val:,.2f}"
                else:
                    row_val = str(val)
                row.append(Paragraph(row_val, cell_style))
            table_data.append(row)

        data_table = Table(table_data, colWidths=[col_width] * col_count)
        data_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6d28d9")),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(data_table)
    else:
        story.append(Paragraph("No records found matching the applied filters.", cell_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def save_exported_file(filename: str, content: bytes) -> str:
    """Save content to storage folder and return full path."""
    filepath = os.path.join(REPORTS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return filepath
