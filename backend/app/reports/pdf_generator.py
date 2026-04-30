"""
PDF Report Generator
Generates professional PDF reports
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from datetime import date
import io


class PDFReportGenerator:
    """Generate PDF reports."""

    @staticmethod
    def generate(report_data: dict, user_name: str) -> bytes:
        """Generate PDF report from data."""
        # Create PDF in memory
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, topMargin=0.5 * inch, bottomMargin=0.5 * inch)

        # Container for PDF content
        elements = []

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=24,
            textColor=colors.HexColor("#1F2937"),
            spaceAfter=12,
            alignment=1,  # Center
        )
        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#374151"),
            spaceAfter=10,
            spaceBefore=10,
        )

        # Title
        elements.append(Paragraph("💰 Expense Report", title_style))
        elements.append(Spacer(1, 0.2 * inch))

        # Summary Info
        summary_text = f"""
        <b>Report Generated:</b> {date.today().strftime('%B %d, %Y')}<br/>
        <b>Period:</b> {report_data['period_start'].strftime('%B %d, %Y')} - {report_data['period_end'].strftime('%B %d, %Y')}<br/>
        <b>For:</b> {user_name}
        """
        elements.append(Paragraph(summary_text, styles["Normal"]))
        elements.append(Spacer(1, 0.3 * inch))

        # Summary Table
        elements.append(Paragraph("Summary", heading_style))
        summary_data = [
            ["Metric", "Amount"],
            ["Total Expenses", f"₹{report_data['total_expenses']:.2f}"],
            ["Total Borrowed", f"₹{report_data['total_borrowed']:.2f}"],
            ["Total Lent", f"₹{report_data['total_lent']:.2f}"],
        ]
        summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F2937")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 12),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
            ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.2 * inch))

        # Category Breakdown
        if report_data["category_breakdown"]:
            elements.append(Paragraph("Category Breakdown", heading_style))
            category_data = [["Category", "Amount", "Percentage", "Count"]]
            for cat in report_data["category_breakdown"]:
                category_data.append([
                    f"{cat['icon']} {cat['name']}",
                    f"₹{cat['amount']:.2f}",
                    f"{cat['percentage']:.1f}%",
                    str(cat['count']),
                ])
            category_table = Table(category_data, colWidths=[2 * inch, 1.5 * inch, 1 * inch, 1 * inch])
            category_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3B82F6")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 11),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(category_table)
            elements.append(Spacer(1, 0.2 * inch))

        # Cash vs Digital
        elements.append(Paragraph("Payment Method Analysis", heading_style))
        type_breakdown = report_data["type_breakdown"]
        payment_data = [
            ["Type", "Amount", "Percentage", "Transactions"],
            [
                "Cash",
                f"₹{type_breakdown['CASH']['amount']:.2f}",
                f"{type_breakdown['CASH']['percentage']:.1f}%",
                str(type_breakdown['CASH']['count']),
            ],
            [
                "Digital",
                f"₹{type_breakdown['DIGITAL']['amount']:.2f}",
                f"{type_breakdown['DIGITAL']['percentage']:.1f}%",
                str(type_breakdown['DIGITAL']['count']),
            ],
        ]
        payment_table = Table(payment_data, colWidths=[1.5 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch])
        payment_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#10B981")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 11),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("BACKGROUND", (0, 1), (-1, -1), colors.lightblue),
            ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(payment_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Footer
        footer_text = f"""
        <i>This report was automatically generated by Tracksy.AI on {date.today().strftime('%B %d, %Y')}.</i>
        """
        elements.append(Paragraph(footer_text, styles["Normal"]))

        # Build PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()
