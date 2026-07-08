"""
Skoola Invoice Template — Premium PDF Generator
Uses fpdf2 with fully manual layout for a clean, professional single-page invoice.
"""
import os
from fpdf import FPDF


class InvoicePDF(FPDF):
    """Custom PDF subclass for invoice."""
    pass


def build_pdf():
    pdf = InvoicePDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=False)
    pdf.add_page()
    pdf.set_margins(20, 20, 20)

    # ============================================================
    # TOP HEADER AREA
    # ============================================================
    pdf.set_y(15)
    
    # Left: Brand logo & name
    pdf.set_font("Helvetica", "B", 26)
    pdf.set_text_color(67, 56, 202)  # indigo-700
    pdf.cell(100, 10, "Skoola", align="L")
    
    # Right: Document Type
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(17, 24, 39)  # zinc-900
    pdf.cell(70, 10, "INVOICE / RECEIPT", align="R", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_y(23)
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(107, 114, 128)  # gray-500
    pdf.cell(100, 5, "ROLE-BASED SCHOOL MANAGEMENT SYSTEM", align="L")
    pdf.cell(70, 5, "Official Payment Billing Template", align="R", new_x="LMARGIN", new_y="NEXT")
    
    # Thin divider line
    pdf.ln(2)
    y = pdf.get_y()
    pdf.set_draw_color(229, 231, 235)  # gray-200
    pdf.set_line_width(0.4)
    pdf.line(20, y, 190, y)
    pdf.set_y(y + 4)

    # ============================================================
    # SENDER vs INVOICE METADATA (TWO COLUMN LAYOUT)
    # ============================================================
    y_start = pdf.get_y()
    
    # Left Column: From (Sender)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(85, 5, "FROM (SERVICE PROVIDER)", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("Helvetica", "B", 10.5)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(85, 5.5, "Oheneba Media", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(75, 85, 99)
    pdf.cell(85, 5, "Proprietor: Mr. Oheneba Michael Baah", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(85, 5, "Email: billing@skoola.com / info@decorumit.com", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(85, 5, "Website: www.decorumit.com", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(85, 5, "Location: Accra, Republic of Ghana", new_x="LMARGIN", new_y="NEXT")
    
    # Right Column: Invoice Details (drawn on the same y coordinates)
    pdf.set_y(y_start)
    pdf.set_x(110)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(80, 5, "INVOICE DETAILS", align="R", new_x="LMARGIN", new_y="NEXT")
    
    details = [
        ("Invoice Number:", "GHS-2026-________"),
        ("Date Issued:", "____ / ____ / 2026"),
        ("Due Date:", "____ / ____ / 2026"),
    ]
    
    for label, blank in details:
        pdf.set_x(110)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(75, 85, 99)
        pdf.cell(40, 5, label, align="R")
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(40, 5, blank, align="R", new_x="LMARGIN", new_y="NEXT")
        
    # Status Checkboxes
    pdf.ln(1)
    pdf.set_x(110)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(75, 85, 99)
    pdf.cell(80, 4, "PAYMENT STATUS:", align="R", new_x="LMARGIN", new_y="NEXT")
    
    status_boxes = [
        "[  ] PENDING",
        "[  ] 50% PILOT INITIAL",
        "[  ] PAID IN FULL"
    ]
    for status in status_boxes:
        pdf.set_x(110)
        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(80, 4.5, status, align="R", new_x="LMARGIN", new_y="NEXT")

    # Thin divider line
    pdf.ln(2)
    y = pdf.get_y()
    pdf.set_draw_color(229, 231, 235)
    pdf.line(20, y, 190, y)
    pdf.set_y(y + 4)

    # ============================================================
    # CUSTOMER / BILL TO SECTION
    # ============================================================
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(0, 5, "BILL TO (CLIENT SCHOOL)", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    
    # Bordered Card for Client Info
    y_card = pdf.get_y()
    pdf.set_draw_color(209, 213, 219)  # gray-300
    pdf.set_line_width(0.3)
    pdf.rect(20, y_card, 170, 26)  # 26mm high box
    
    pdf.set_y(y_card + 2)
    client_fields = [
        ("School Name:", "____________________________________________________________________"),
        ("Authorized Rep:", "____________________________________________________________________"),
        ("Address / Location:", "____________________________________________________________________"),
        ("Contact Email / Tel:", "____________________________________________________________________"),
    ]
    for label, underline in client_fields:
        pdf.set_x(23)
        pdf.set_font("Helvetica", "B", 8.5)
        pdf.set_text_color(75, 85, 99)
        pdf.cell(30, 5.5, label, align="L")
        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(156, 163, 175)
        pdf.cell(130, 5.5, underline, align="L", new_x="LMARGIN", new_y="NEXT")
        
    pdf.set_y(y_card + 29)

    # ============================================================
    # LINE ITEMS TABLE
    # ============================================================
    # Table Header
    pdf.set_fill_color(67, 56, 202)  # indigo-700
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 9)
    
    # Columns: Desc (100), Qty (10), Unit Price (32), Total (28)
    pdf.cell(100, 7, "  ITEM DESCRIPTION", fill=True)
    pdf.cell(10, 7, "QTY", fill=True, align="C")
    pdf.cell(32, 7, "UNIT PRICE (GHS)", fill=True, align="R")
    pdf.cell(28, 7, "TOTAL (GHS)  ", fill=True, align="R", new_x="LMARGIN", new_y="NEXT")
    
    # Table Rows
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(55, 65, 81)
    
    rows = [
        (
            " Skoola SaaS Annual Subscription License (Pilot Phase - 50% Initial Payment)",
            "1",
            "_______________",
            "_______________"
        ),
        (
            " Skoola SaaS Annual Subscription License (Pilot Phase - 50% Final Payment)",
            "1",
            "_______________",
            "_______________"
        ),
        (
            " System Customization, Dedicated Subdomain setup & School Data Migration",
            "1",
            "COMPLIMENTARY",
            "0.00"
        ),
    ]
    
    row_idx = 0
    for desc, qty, unit, total in rows:
        # Alternating background colors
        if row_idx % 2 == 1:
            pdf.set_fill_color(249, 250, 251)  # gray-50
        else:
            pdf.set_fill_color(255, 255, 255)
            
        y_before = pdf.get_y()
        # Render cells with height 7.5
        pdf.cell(100, 7.5, desc, fill=True)
        pdf.cell(10, 7.5, qty, fill=True, align="C")
        
        # If it is numeric/blank, style accordingly
        if unit == "COMPLIMENTARY":
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_text_color(16, 185, 129)  # green-500
        pdf.cell(32, 7.5, unit, fill=True, align="R")
        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(55, 65, 81)
        
        pdf.cell(28, 7.5, total + "  ", fill=True, align="R", new_x="LMARGIN", new_y="NEXT")
        
        # Draw bottom thin border for each row
        pdf.set_draw_color(243, 244, 246)  # gray-100
        pdf.line(20, pdf.get_y(), 190, pdf.get_y())
        row_idx += 1
        
    # Table border line
    y_table_end = pdf.get_y()
    pdf.set_draw_color(209, 213, 219)
    pdf.line(20, y_table_end, 190, y_table_end)
    pdf.ln(3)

    # ============================================================
    # BANK DETAILS (LEFT) & INVOICE SUMMARY (RIGHT)
    # ============================================================
    y_blocks = pdf.get_y()
    
    # Left: Bank details
    pdf.set_font("Helvetica", "B", 8.5)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(90, 5, "PAYMENT INSTRUCTIONS & BANK DETAILS", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(75, 85, 99)
    pdf.cell(90, 4, "Please make all direct bank deposits or wire transfers to:", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    
    bank_fields = [
        ("Account Name:", "Oheneba Media"),
        ("Bank Name:", "________________________________________"),
        ("Branch Name:", "________________________________________"),
        ("Account Number:", "________________________________________"),
    ]
    for label, val in bank_fields:
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(107, 114, 128)
        pdf.cell(26, 4.5, label)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(64, 4.5, val, new_x="LMARGIN", new_y="NEXT")
        
    # Right: Summary block
    pdf.set_y(y_blocks)
    summary_fields = [
        ("Subtotal:", "____________________"),
        ("VAT / Taxes:", "____________________"),
        ("TOTAL AMOUNT DUE:", "____________________"),
        ("Total Amount Paid:", "____________________"),
        ("OUTSTANDING BALANCE:", "____________________"),
    ]
    
    for label, val in summary_fields:
        pdf.set_x(110)
        # Emphasize Total Due and Outstanding Balance
        if "TOTAL" in label or "OUTSTANDING" in label:
            pdf.set_font("Helvetica", "B", 8.5)
            pdf.set_text_color(17, 24, 39)
        else:
            pdf.set_font("Helvetica", "", 8.5)
            pdf.set_text_color(75, 85, 99)
            
        pdf.cell(45, 5, label, align="R")
        pdf.set_font("Helvetica", "B", 8.5)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(35, 5, val + "  ", align="R", new_x="LMARGIN", new_y="NEXT")

    # Divider
    pdf.ln(2)
    y = pdf.get_y()
    pdf.set_draw_color(229, 231, 235)
    pdf.line(20, y, 190, y)
    pdf.set_y(y + 4)

    # ============================================================
    # SIGNATURE BLOCK & STAMP AREA
    # ============================================================
    y_sig = pdf.get_y()
    
    # Left: School Stamp / Date area
    pdf.set_font("Helvetica", "B", 8.5)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(90, 5, "OFFICIAL STAMP / CONFIRMATION", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    
    y_stamp_box = pdf.get_y()
    pdf.set_draw_color(209, 213, 219)
    pdf.rect(20, y_stamp_box, 50, 26)  # stamp box
    
    pdf.set_y(y_stamp_box + 2)
    pdf.set_x(74)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(15, 5, "Date Paid:")
    y_d = pdf.get_y()
    pdf.line(90, y_d + 4, 115, y_d + 4)
    
    pdf.set_y(y_stamp_box + 10)
    pdf.set_x(74)
    pdf.cell(15, 5, "Receipt No:")
    y_r = pdf.get_y()
    pdf.line(90, y_r + 4, 115, y_r + 4)

    # Right: Oheneba Media authorized signature
    pdf.set_y(y_sig)
    pdf.set_x(120)
    pdf.set_font("Helvetica", "B", 8.5)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(70, 5, "FOR OHENEBA MEDIA", align="R", new_x="LMARGIN", new_y="NEXT")
    
    pdf.ln(8)
    pdf.set_x(120)
    pdf.set_draw_color(67, 56, 202)
    y_line = pdf.get_y()
    pdf.line(130, y_line, 190, y_line)
    
    pdf.ln(1.5)
    pdf.set_x(120)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(70, 4, "Authorized Signature", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(120)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(70, 4, "Mr. Oheneba Michael Baah (Proprietor)", align="R", new_x="LMARGIN", new_y="NEXT")

    # ============================================================
    # FOOTER
    # ============================================================
    pdf.set_y(265)
    pdf.set_draw_color(229, 231, 235)
    pdf.line(20, 264, 190, 264)
    
    pdf.set_font("Helvetica", "I", 7.5)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 5, "Thank you for choosing Skoola. Oheneba Media, Accra, Ghana.", align="C")

    # ── OUTPUT ──
    out_path = os.path.join(
        r"c:\Users\inspy\OneDrive\Documents\school",
        "Skoola_Invoice_Template.pdf"
    )
    pdf.output(out_path)
    print(f"PDF generated successfully: {out_path}")


if __name__ == "__main__":
    build_pdf()
