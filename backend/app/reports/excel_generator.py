"""
Excel Report Generator
Generates Excel reports with multiple sheets
"""

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils.dataframe import dataframe_to_rows
from datetime import date
import io


class ExcelReportGenerator:
    """Generate Excel reports."""

    @staticmethod
    def generate(report_data: dict, user_name: str) -> bytes:
        """Generate Excel report from data."""
        wb = Workbook()
        wb.remove(wb.active)  # Remove default sheet

        # Define styles
        header_fill = PatternFill(start_color="1F2937", end_color="1F2937", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True, size=12)
        title_font = Font(bold=True, size=14)
        border = Border(
            left=Side(style="thin"),
            right=Side(style="thin"),
            top=Side(style="thin"),
            bottom=Side(style="thin"),
        )
        center_align = Alignment(horizontal="center", vertical="center")
        currency_format = "₹#,##0.00"

        # Summary Sheet
        ws_summary = wb.create_sheet("Summary")
        ws_summary["A1"] = "💰 Expense Report Summary"
        ws_summary["A1"].font = title_font
        ws_summary.merge_cells("A1:B1")

        ws_summary["A3"] = "Report Generated:"
        ws_summary["B3"] = date.today().strftime("%B %d, %Y")

        ws_summary["A4"] = "Period:"
        ws_summary["B4"] = f"{report_data['period_start'].strftime('%B %d, %Y')} - {report_data['period_end'].strftime('%B %d, %Y')}"

        ws_summary["A5"] = "For:"
        ws_summary["B5"] = user_name

        ws_summary["A7"] = "Metric"
        ws_summary["B7"] = "Amount"
        ws_summary["A7"].fill = header_fill
        ws_summary["A7"].font = header_font
        ws_summary["B7"].fill = header_fill
        ws_summary["B7"].font = header_font

        ws_summary["A8"] = "Total Expenses"
        ws_summary["B8"] = report_data["total_expenses"]
        ws_summary["B8"].number_format = currency_format

        ws_summary["A9"] = "Total Borrowed"
        ws_summary["B9"] = report_data["total_borrowed"]
        ws_summary["B9"].number_format = currency_format

        ws_summary["A10"] = "Total Lent"
        ws_summary["B10"] = report_data["total_lent"]
        ws_summary["B10"].number_format = currency_format

        ws_summary.column_dimensions["A"].width = 20
        ws_summary.column_dimensions["B"].width = 20

        # Category Breakdown Sheet
        ws_categories = wb.create_sheet("Categories")
        ws_categories["A1"] = "Category Breakdown"
        ws_categories["A1"].font = title_font
        ws_categories.merge_cells("A1:D1")

        headers = ["Category", "Amount", "Percentage", "Count"]
        for col, header in enumerate(headers, 1):
            cell = ws_categories.cell(row=3, column=col)
            cell.value = header
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = center_align

        row = 4
        for cat in report_data["category_breakdown"]:
            ws_categories.cell(row=row, column=1).value = f"{cat['icon']} {cat['name']}"
            ws_categories.cell(row=row, column=2).value = cat["amount"]
            ws_categories.cell(row=row, column=2).number_format = currency_format
            ws_categories.cell(row=row, column=3).value = f"{cat['percentage']:.1f}%"
            ws_categories.cell(row=row, column=4).value = cat["count"]
            row += 1

        ws_categories.column_dimensions["A"].width = 20
        ws_categories.column_dimensions["B"].width = 15
        ws_categories.column_dimensions["C"].width = 15
        ws_categories.column_dimensions["D"].width = 10

        # Payment Method Sheet
        ws_payment = wb.create_sheet("Payment Methods")
        ws_payment["A1"] = "Payment Method Analysis"
        ws_payment["A1"].font = title_font
        ws_payment.merge_cells("A1:D1")

        headers = ["Type", "Amount", "Percentage", "Transactions"]
        for col, header in enumerate(headers, 1):
            cell = ws_payment.cell(row=3, column=col)
            cell.value = header
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = center_align

        type_breakdown = report_data["type_breakdown"]
        ws_payment.cell(row=4, column=1).value = "Cash"
        ws_payment.cell(row=4, column=2).value = type_breakdown["CASH"]["amount"]
        ws_payment.cell(row=4, column=2).number_format = currency_format
        ws_payment.cell(row=4, column=3).value = f"{type_breakdown['CASH']['percentage']:.1f}%"
        ws_payment.cell(row=4, column=4).value = type_breakdown["CASH"]["count"]

        ws_payment.cell(row=5, column=1).value = "Digital"
        ws_payment.cell(row=5, column=2).value = type_breakdown["DIGITAL"]["amount"]
        ws_payment.cell(row=5, column=2).number_format = currency_format
        ws_payment.cell(row=5, column=3).value = f"{type_breakdown['DIGITAL']['percentage']:.1f}%"
        ws_payment.cell(row=5, column=4).value = type_breakdown["DIGITAL"]["count"]

        ws_payment.column_dimensions["A"].width = 15
        ws_payment.column_dimensions["B"].width = 15
        ws_payment.column_dimensions["C"].width = 15
        ws_payment.column_dimensions["D"].width = 15

        # Save to bytes
        excel_buffer = io.BytesIO()
        wb.save(excel_buffer)
        excel_buffer.seek(0)
        return excel_buffer.getvalue()
