"""
PDF Report Generator
"""

import io
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak,
)
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.legends import Legend
from reportlab.graphics import renderPDF


# ── Colour palette ────────────────────────────────────────────────────────────
DARK   = colors.HexColor("#1F2937")
BRAND  = colors.HexColor("#3B82F6")
GREEN  = colors.HexColor("#10B981")
LIGHT  = colors.HexColor("#F3F4F6")
WHITE  = colors.white
PIE_PALETTE = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
]

_W, _H = A4


def _currency(n: float) -> str:
    return f"Rs.{n:,.2f}"


def _header_style(style_name, styles):
    return ParagraphStyle(
        style_name,
        parent=styles["Heading2"],
        fontSize=12,
        textColor=DARK,
        spaceBefore=14,
        spaceAfter=6,
        fontName="Helvetica-Bold",
    )


def _pie_chart(breakdown: list[dict], width=380, height=200) -> Drawing:
    """Return a Drawing containing a pie chart + legend."""
    d = Drawing(width, height)

    pie = Pie()
    pie.x = 20
    pie.y = 20
    pie.width  = 140
    pie.height = 140
    pie.data   = [c["amount"] for c in breakdown]
    pie.labels = [""] * len(breakdown)   # labels on legend, not slices
    pie.sideLabels = 0
    pie.slices.strokeWidth = 0.5
    pie.slices.strokeColor = WHITE

    for i, _ in enumerate(breakdown):
        hex_col = PIE_PALETTE[i % len(PIE_PALETTE)]
        pie.slices[i].fillColor = colors.HexColor(hex_col)

    d.add(pie)

    # Legend
    legend = Legend()
    legend.x = 180
    legend.y = height - 20
    legend.dx = 10
    legend.dy = 10
    legend.fontName = "Helvetica"
    legend.fontSize = 8
    legend.boxAnchor = "nw"
    legend.columnMaximum = 10
    legend.strokeWidth = 0
    legend.strokeColor = WHITE
    legend.deltax = 75
    legend.deltay = 14
    legend.autoXPadding = 5
    legend.colorNamePairs = [
        (colors.HexColor(PIE_PALETTE[i % len(PIE_PALETTE)]),
         f"{c['name']} ({c['percentage']:.1f}%)")
        for i, c in enumerate(breakdown)
    ]
    d.add(legend)

    return d


class PDFReportGenerator:

    @staticmethod
    def generate(report_data: dict, user_name: str) -> bytes:
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            leftMargin=1.8 * cm, rightMargin=1.8 * cm,
            topMargin=1.5 * cm, bottomMargin=1.5 * cm,
        )

        styles  = getSampleStyleSheet()
        h_style = _header_style("H", styles)

        title_style = ParagraphStyle(
            "Title", parent=styles["Heading1"],
            fontSize=20, textColor=DARK, alignment=1, spaceAfter=4,
        )
        sub_style = ParagraphStyle(
            "Sub", parent=styles["Normal"],
            fontSize=9, textColor=colors.HexColor("#6B7280"), alignment=1, spaceAfter=2,
        )
        footer_style = ParagraphStyle(
            "Footer", parent=styles["Normal"],
            fontSize=8, textColor=colors.HexColor("#9CA3AF"), alignment=1,
        )
        cell_style = ParagraphStyle(
            "Cell", parent=styles["Normal"],
            fontSize=8, leading=10,
        )

        elems = []

        # ── Title ──────────────────────────────────────────────────────────────
        elems.append(Paragraph("Expense Report", title_style))
        period_str = (
            f"{report_data['period_start'].strftime('%d %b %Y')} "
            f"– {report_data['period_end'].strftime('%d %b %Y')}"
        )
        elems.append(Paragraph(f"{user_name}  ·  {period_str}", sub_style))
        elems.append(Paragraph(
            f"Generated on {date.today().strftime('%d %b %Y')}", sub_style,
        ))
        elems.append(Spacer(1, 0.3 * inch))

        # ── Summary boxes (3-column table) ────────────────────────────────────
        elems.append(Paragraph("Summary", h_style))
        summary_data = [[
            Paragraph(f"<b>Total Expenses</b><br/>{_currency(report_data['total_expenses'])}", cell_style),
            Paragraph(f"<b>Total Borrowed</b><br/>{_currency(report_data['total_borrowed'])}", cell_style),
            Paragraph(f"<b>Total Lent</b><br/>{_currency(report_data['total_lent'])}", cell_style),
        ]]
        col_w = (_W - 3.6 * cm) / 3
        summary_tbl = Table(summary_data, colWidths=[col_w, col_w, col_w])
        summary_tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), LIGHT),
            ("ALIGN",        (0, 0), (-1, -1), "CENTER"),
            ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
            ("ROUNDEDCORNERS", [4]),
            ("BOX",          (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("INNERGRID",    (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("TOPPADDING",   (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 10),
        ]))
        elems.append(summary_tbl)
        elems.append(Spacer(1, 0.25 * inch))

        # ── Category pie chart ────────────────────────────────────────────────
        breakdown = report_data.get("category_breakdown", [])
        if breakdown:
            elems.append(Paragraph("Spending by Category", h_style))
            elems.append(_pie_chart(breakdown))
            elems.append(Spacer(1, 0.15 * inch))

            # Category table beneath chart
            cat_data = [["Category", "Amount", "% of Total", "Expenses"]]
            for c in breakdown:
                cat_data.append([
                    c["name"],
                    _currency(c["amount"]),
                    f"{c['percentage']:.1f}%",
                    str(c["count"]),
                ])
            cat_w = _W - 3.6 * cm
            cat_tbl = Table(cat_data, colWidths=[cat_w * 0.35, cat_w * 0.25, cat_w * 0.22, cat_w * 0.18])
            cat_tbl.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, 0), BRAND),
                ("TEXTCOLOR",     (0, 0), (-1, 0), WHITE),
                ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE",      (0, 0), (-1, -1), 8),
                ("ALIGN",         (1, 0), (-1, -1), "RIGHT"),
                ("ALIGN",         (0, 0), (0, -1), "LEFT"),
                ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT]),
                ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#E5E7EB")),
                ("TOPPADDING",    (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING",   (0, 0), (-1, -1), 6),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
            ]))
            elems.append(cat_tbl)

        # ── All expenses (date-wise) ───────────────────────────────────────────
        elems.append(PageBreak())
        elems.append(Paragraph("All Expenses", h_style))

        expense_rows = report_data.get("expense_rows", [])
        if expense_rows:
            exp_data = [["Date", "Purpose", "Category", "Type", "Payment", "Amount"]]
            for e in expense_rows:
                exp_data.append([
                    e["date"],
                    Paragraph(e["purpose"], cell_style),
                    e["category"],
                    e["type"].capitalize(),
                    e["payment_method"] or "—",
                    _currency(e["amount"]),
                ])
            ew = _W - 3.6 * cm
            exp_tbl = Table(
                exp_data,
                colWidths=[ew * 0.13, ew * 0.28, ew * 0.15, ew * 0.09, ew * 0.13, ew * 0.14],
                repeatRows=1,
            )
            exp_tbl.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, 0), DARK),
                ("TEXTCOLOR",     (0, 0), (-1, 0), WHITE),
                ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE",      (0, 0), (-1, -1), 7.5),
                ("ALIGN",         (5, 0), (5, -1), "RIGHT"),
                ("ALIGN",         (0, 0), (4, -1), "LEFT"),
                ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT]),
                ("GRID",          (0, 0), (-1, -1), 0.3, colors.HexColor("#E5E7EB")),
                ("TOPPADDING",    (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING",   (0, 0), (-1, -1), 5),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 5),
                ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ]))
            elems.append(exp_tbl)
        else:
            elems.append(Paragraph("No expenses in this period.", styles["Normal"]))

        elems.append(Spacer(1, 0.4 * inch))
        elems.append(Paragraph(
            f"Tracksy.AI  ·  Generated {date.today().strftime('%d %b %Y')}",
            footer_style,
        ))

        doc.build(elems)
        buf.seek(0)
        return buf.getvalue()
