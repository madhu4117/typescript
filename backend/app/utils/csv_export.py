import csv
import io


def export_csv(data: list):

    output = io.StringIO()

    writer = csv.writer(output)

    if not data:
        return ""

    writer.writerow(data[0].keys())

    for row in data:
        writer.writerow(row.values())

    output.seek(0)

    return output.getvalue()