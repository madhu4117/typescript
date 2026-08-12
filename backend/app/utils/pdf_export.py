from io import BytesIO
from reportlab.platypus import SimpleDocTemplate, Table
from reportlab.lib import colors


def export_pdf(data: dict):

    buffer = BytesIO()

    pdf = SimpleDocTemplate(buffer)

    table_data = [["Metric", "Value"]]

    for key, value in data.items():
        table_data.append([key, str(value)])

    table = Table(table_data)

    table.setStyle([
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
    ])

    pdf.build([table])

    buffer.seek(0)

    return buffer.read()