"""
Skoola Refund & Cancellation Policy — Premium PDF Generator
Uses fpdf2 with fully manual layout for a clean, professional legal document.
"""
import os
from fpdf import FPDF


class RefundPDF(FPDF):
    """Custom PDF with branded header/footer on content pages."""

    def header(self):
        if self.page_no() <= 1:
            return  # skip header on cover
        # Thin indigo accent bar
        self.set_fill_color(67, 56, 202)  # indigo-700
        self.rect(0, 0, 210, 3.5, "F")
        # Header text
        self.set_y(6)
        self.set_font("Helvetica", "I", 7.5)
        self.set_text_color(160, 160, 170)
        self.cell(0, 5, "Skoola Refund & Cancellation Policy  |  Oheneba Media", align="R")
        self.ln(10)

    def footer(self):
        if self.page_no() <= 1:
            return
        self.set_y(-14)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(170, 170, 180)
        self.cell(95, 5, "Confidential  -  Oheneba Media", align="L")
        self.cell(95, 5, f"Page {self.page_no()} of {{nb}}", align="R")


def _hr(pdf, y=None, color=(229, 231, 235)):
    """Draw a thin horizontal rule."""
    if y is None:
        y = pdf.get_y()
    pdf.set_draw_color(*color)
    pdf.set_line_width(0.3)
    pdf.line(20, y, 190, y)
    pdf.set_y(y + 3)


def _section_title(pdf, number, title):
    """Render a styled section heading."""
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(67, 56, 202)  # indigo-700
    pdf.cell(0, 7, f"SECTION {number}", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 7, title.upper(), new_x="LMARGIN", new_y="NEXT")
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(1)


def _body(pdf, text):
    """Render body paragraph text."""
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(55, 65, 81)
    pdf.multi_cell(0, 5.5, text)
    pdf.ln(2)


def _bullet(pdf, text, indent=25):
    """Render a numbered/bulleted item."""
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(55, 65, 81)
    pdf.set_x(indent)
    pdf.multi_cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1.5)


def _label_line(pdf, label, width=80):
    """Render a label with an underline blank for filling in."""
    pdf.set_font("Helvetica", "B", 9.5)
    pdf.set_text_color(100, 100, 110)
    pdf.cell(width, 6, label, new_x="LMARGIN", new_y="NEXT")
    y = pdf.get_y()
    pdf.set_draw_color(180, 180, 190)
    pdf.set_line_width(0.25)
    pdf.line(20, y + 1, 190, y + 1)
    pdf.set_y(y + 8)


def _signature_block(pdf, title, name_label, extra_lines=None):
    """Render a signature block with title, line, name, date."""
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    # Signature line
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(120, 120, 130)
    pdf.cell(0, 5, "Signature:", new_x="LMARGIN", new_y="NEXT")
    y = pdf.get_y()
    pdf.set_draw_color(67, 56, 202)
    pdf.set_line_width(0.4)
    pdf.line(20, y + 2, 120, y + 2)
    pdf.set_y(y + 10)

    # Name
    if name_label:
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(120, 120, 130)
        pdf.cell(0, 5, f"Name: {name_label}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

    # Extra lines (Title, etc.)
    if extra_lines:
        for line in extra_lines:
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(120, 120, 130)
            pdf.cell(30, 5, f"{line}:")
            y2 = pdf.get_y()
            pdf.set_draw_color(180, 180, 190)
            pdf.set_line_width(0.2)
            pdf.line(50, y2 + 4.5, 120, y2 + 4.5)
            pdf.ln(8)

    # Date
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(120, 120, 130)
    pdf.cell(30, 5, "Date:")
    y3 = pdf.get_y()
    pdf.set_draw_color(180, 180, 190)
    pdf.set_line_width(0.2)
    pdf.line(50, y3 + 4.5, 120, y3 + 4.5)
    pdf.ln(10)


def build_pdf():
    pdf = RefundPDF(orientation="P", unit="mm", format="A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(20, 20, 20)

    # ============================================================
    # PAGE 1 — COVER
    # ============================================================
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)

    # Dark header block
    pdf.set_fill_color(17, 24, 39)  # zinc-900
    pdf.rect(0, 0, 210, 90, "F")

    # Indigo accent bar
    pdf.set_fill_color(67, 56, 202)
    pdf.rect(0, 90, 210, 4, "F")

    # Brand name on dark block
    pdf.set_y(25)
    pdf.set_font("Helvetica", "B", 42)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 15, "Skoola", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(160, 170, 190)
    pdf.cell(0, 8, "School Management System", align="C", new_x="LMARGIN", new_y="NEXT")

    # Main title area
    pdf.set_y(115)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(17, 24, 39)
    pdf.multi_cell(0, 11, "REFUND & CANCELLATION\nPOLICY", align="C")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(107, 114, 128)
    pdf.multi_cell(0, 6, "Subscription Cancellation Terms, Refund Eligibility Rules,\nand Account Closure Guidelines", align="C")

    # Decorative line
    pdf.ln(8)
    y = pdf.get_y()
    pdf.set_draw_color(67, 56, 202)
    pdf.set_line_width(0.6)
    pdf.line(75, y, 135, y)

    # Owner
    pdf.ln(10)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(0, 6, "SOFTWARE OWNER & PROPRIETOR", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 8, "Mr. Oheneba Michael Baah", align="C", new_x="LMARGIN", new_y="NEXT")

    # Footer area on cover
    pdf.set_y(250)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 5, "PUBLISHED & MAINTAINED BY OHENEBA MEDIA", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 5, "Official Operational Policy  |  Version 2026.1", align="C")

    # ============================================================
    # PAGE 2+ — POLICY BODY
    # ============================================================
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 8, "REFUND & SUBSCRIPTION CANCELLATION POLICY", new_x="LMARGIN", new_y="NEXT")
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(3)

    pdf.set_font("Helvetica", "I", 9.5)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 5, "Effective Date: June 25, 2026", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    _body(pdf, (
        "This Refund & Cancellation Policy (\"Policy\") outlines the rules governing the cancelation "
        "of subscriptions, billing adjustments, and refund options for the Skoola School Management platform. "
        "The software is owned by Mr. Oheneba Michael Baah and operated under Oheneba Media."
    ))
    _body(pdf, (
        "By subscribing to Skoola or participating in its Pilot Program, the School (\"Client\") agrees "
        "to be bound by the terms and structures defined herein."
    ))

    # ── SECTION 1 ──
    _section_title(pdf, "1", "Subscription Cancellation Terms")
    _bullet(pdf, (
        "1.1  NOTICE PERIOD: The Client may cancel their Skoola subscription at any time. To prevent renewal "
        "and subsequent billing, the Client must provide a minimum of thirty (30) days written notice of "
        "cancellation to Oheneba Media via email at info@decorumit.com or billing@skoola.com."
    ))
    _bullet(pdf, (
        "1.2  EFFECTIVE DATE OF CANCELLATION: Cancellations submitted mid-billing cycle will become effective "
        "at the end of the current paid billing period. The Client will retain full administrative access to the "
        "Skoola portal until the active period expires."
    ))
    _bullet(pdf, (
        "1.3  RECURRING SUBSCRIPTIONS: Unless cancelled in writing according to Section 1.1, subscriptions "
        "will automatically renew for subsequent terms (monthly, termly, or annually depending on plan structure)."
    ))

    # ── SECTION 2 ──
    _section_title(pdf, "2", "Refund Eligibility Rules")
    _bullet(pdf, (
        "2.1  PILOT PROGRAM EXCLUSION: Fees paid under the 3-Month Pilot Program are non-refundable. The Pilot Program "
        "is structured to allow schools to test and evaluate the software with specialized support, and resources "
        "allocated during this setup phase are fully consumed upon account initialization."
    ))
    _bullet(pdf, (
        "2.2  STANDARD FEES: All subscription payments (monthly, termly, and annual) are non-refundable. Oheneba Media "
        "Solutions does not offer partial refunds or pro-rated adjustments for unused days in a cancelled billing cycle."
    ))
    _bullet(pdf, (
        "2.3  EXCEPTIONAL CIRCUMSTANCES: Pro-rata adjustments or refund credits may be issued solely at the discretion "
        "of the software proprietor, Mr. Oheneba Michael Baah, under documented scenarios of prolonged platform "
        "inaccessibility exceeding the SLA downtime limit. Any such adjustment must be approved in writing."
    ))

    # ── SECTION 3 ──
    _section_title(pdf, "3", "Account Suspension for Non-Payment")
    _bullet(pdf, (
        "3.1  DUE DATE: Subscription invoices must be paid within seven (7) business days of issuance. Late payments "
        "are subject to interest and administrative follow-up."
    ))
    _bullet(pdf, (
        "3.2  GRACE PERIOD & SUSPENSION: If subscription fees remain unpaid for more than fourteen (14) days past the "
        "due date, Oheneba Media reserves the right to suspend Client portal access, restricting both administrator "
        "and staff access."
    ))
    _bullet(pdf, (
        "3.3  REACTIVATION FEE: Suspended portals may require a standard reactivation fee of GHS 200, alongside full payment "
        "of outstanding arrears, to restore platform services."
    ))

    # ── SECTION 4 ──
    _section_title(pdf, "4", "Data Portability & Extraction")
    _bullet(pdf, (
        "4.1  EXTRACTION PERIOD: Upon cancellation notice, the Client has a grace period of thirty (30) calendar days from "
        "the effective cancellation date to download and extract their operational data."
    ))
    _bullet(pdf, (
        "4.2  DATA FORMATS: Standard academic data, including student profiles, teacher lists, grades, and fee histories, "
        "can be downloaded by the administrator in Microsoft Excel (.xlsx) or CSV format directly from the Skoola interface."
    ))
    _bullet(pdf, (
        "4.3  CUSTOM MIGRATION ASSISTANCE: If the Client requires Oheneba Media to compile a custom relational "
        "SQL database backup or export, such assistance will be billed as professional IT services at a rate agreed upon in writing."
    ))

    # ── SECTION 5 ──
    _section_title(pdf, "5", "Data Purging & Account Deletion")
    _bullet(pdf, (
        "5.1  PERMANENT DELETION: Thirty (30) days after the effective date of cancellation, Oheneba Media "
        "will permanently delete and purge all school records, student databases, grades, and associated media files "
        "from the primary live servers."
    ))
    _bullet(pdf, (
        "5.2  BACKUP RETENTION: Encrypted off-site database backups containing the school's historical records will "
        "be fully overwritten and cleared within sixty (60) days following account termination, in compliance with "
        "standard disaster recovery cycles."
    ))
    _bullet(pdf, (
        "5.3  NO RECOVERY: Once data has been purged under Section 5.1 and 5.2, it is completely unrecoverable. Oheneba Media "
        "Solutions accepts no liability for loss of historical school records resulting from cancellation."
    ))

    # ── SECTION 6 ──
    _section_title(pdf, "6", "Policy Amendments")
    _bullet(pdf, (
        "6.1  Oheneba Media reserves the right to amend this Policy. Notice of any updates will be provided "
        "via the admin dashboard or emailed directly to the primary school administrator thirty (30) days before "
        "the changes take effect."
    ))

    # ============================================================
    # SIGNATURES PAGE
    # ============================================================
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 10, "EXECUTION & SIGNATURES", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(3)

    _body(pdf, (
        "By signing below, both parties acknowledge that they have read, understood, and "
        "agreed to the refund limitations, cancellation rules, and data handling terms outlined in this policy."
    ))

    pdf.ln(6)

    # Provider signature
    _signature_block(
        pdf,
        "FOR OHENEBA MEDIA",
        "Mr. Oheneba Michael Baah  (Owner & Software Proprietor)",
        extra_lines=[]
    )

    pdf.ln(8)
    _hr(pdf)
    pdf.ln(6)

    # Client signature
    _signature_block(
        pdf,
        "FOR THE CLIENT SCHOOL",
        None,
        extra_lines=["School Name", "Representative Name", "Designation"]
    )

    # ── OUTPUT ──
    out_path = os.path.join(
        r"c:\Users\inspy\OneDrive\Documents\school",
        "Skoola_Refund_and_Cancellation_Policy.pdf"
    )
    pdf.output(out_path)
    print(f"PDF generated successfully: {out_path}")


if __name__ == "__main__":
    build_pdf()
