"""
Skoola Pilot Program Agreement — Premium PDF Generator
Uses fpdf2 with fully manual layout for a clean, professional legal document.
"""
import os
from fpdf import FPDF


class AgreementPDF(FPDF):
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
        self.cell(0, 5, "Skoola Pilot Program Agreement  |  Decorum IT Solutions", align="R")
        self.ln(10)

    def footer(self):
        if self.page_no() <= 1:
            return
        self.set_y(-14)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(170, 170, 180)
        self.cell(95, 5, "Confidential  -  Decorum IT Solutions", align="L")
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
    x = pdf.get_x()
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
    pdf = AgreementPDF(orientation="P", unit="mm", format="A4")
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
    pdf.multi_cell(0, 11, "PILOT PROGRAM\n& SERVICE AGREEMENT", align="C")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(107, 114, 128)
    pdf.multi_cell(0, 6, "Official 3-Month Pilot Phase Contract\n& Annual Subscription Agreement", align="C")

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
    pdf.cell(0, 5, "DEVELOPED & PUBLISHED BY DECORUM IT SOLUTIONS", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 5, "Official Business Agreement  |  Version 2026.1", align="C")

    # ============================================================
    # PAGE 2+ — AGREEMENT BODY
    # ============================================================
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Preamble
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 8, "SERVICE LEVEL & PILOT PROGRAM AGREEMENT", new_x="LMARGIN", new_y="NEXT")
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(3)

    _body(pdf, "This Agreement is made and entered into on this:")
    pdf.ln(1)
    _label_line(pdf, "Day / Month / Year")
    pdf.ln(2)

    _body(pdf, "By and between the following parties:")

    # Party 1
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(0, 7, "PARTY A  -  THE SERVICE PROVIDER", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    _body(pdf, (
        "Decorum IT Solutions, a technology solutions company, represented herein by its Owner, "
        "Proprietor, and Software Author, Mr. Oheneba Michael Baah (hereinafter referred to as "
        "the \"Service Provider\")."
    ))

    # Party 2
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(0, 7, "PARTY B  -  THE CLIENT", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    _label_line(pdf, "School Name")
    _label_line(pdf, "Representative Name")
    _label_line(pdf, "Designation / Title")
    _body(pdf, "(hereinafter referred to as the \"Client\" or the \"School\").")

    # ── SECTION 1 ──
    _section_title(pdf, "1", "Purpose & General Overview")
    _body(pdf, (
        "Decorum IT Solutions is the sole developer and proprietor of Skoola, a comprehensive "
        "role-based school management system (the \"Software\"). The School wishes to implement "
        "and utilize Skoola to automate and manage its academic, administrative, financial, and "
        "student data systems."
    ))
    _body(pdf, (
        "This Agreement sets forth the terms, conditions, payment structures, and service level "
        "guidelines under which the Service Provider will deploy Skoola for the School's use."
    ))

    # ── SECTION 2 ──
    _section_title(pdf, "2", "The 3-Month Pilot Program")
    _bullet(pdf, (
        "2.1  The Service Provider shall grant the School access to a custom-configured instance "
        "of the Skoola platform for a Pilot Period of three (3) months starting from the date "
        "of initial setup and deployment."
    ))
    _bullet(pdf, (
        "2.2  During the Pilot Period, the Service Provider will provide standard cloud hosting, "
        "system configuration, initial user training, and database initialization support at no "
        "additional charge beyond the agreed subscription fee."
    ))
    _bullet(pdf, (
        "2.3  Decorum IT Solutions will configure a custom subdomain (e.g. schoolname.skoola.com) "
        "for the School's exclusive use during and after the Pilot Period."
    ))
    _bullet(pdf, (
        "2.4  The Pilot Period serves as a mutual evaluation window. The School may assess "
        "platform suitability, and the Service Provider may refine configurations to the "
        "School's specific needs."
    ))

    # ── SECTION 3 ──
    _section_title(pdf, "3", "Subscription Fees & Payment Terms")
    _bullet(pdf, (
        "3.1  ANNUAL SUBSCRIPTION MODEL: Skoola is provided on a recurring annual subscription "
        "basis. The service license and hosting must be renewed every twelve (12) months."
    ))
    _bullet(pdf, (
        "3.2  UPFRONT PAYMENT (50%): The School is required to pay a minimum of fifty percent "
        "(50%) of the total annual subscription fee BEFORE setup on the platform and BEFORE "
        "active usage of the system is initiated. No deployment or data migration shall commence "
        "until this initial payment is confirmed."
    ))
    _bullet(pdf, (
        "3.3  PILOT PERIOD BALANCE (50%): The remaining fifty percent (50%) of the annual "
        "subscription fee must be paid in full on or before the final day of the 3-month Pilot "
        "Period."
    ))
    _bullet(pdf, (
        "3.4  SUBSEQUENT RENEWALS: In subsequent years, the full annual subscription renewal "
        "fee must be paid in full prior to the start of the renewal term to guarantee "
        "uninterrupted service and data retention."
    ))
    _bullet(pdf, (
        "3.5  AGREED ANNUAL SUBSCRIPTION FEE:"
    ))
    _label_line(pdf, "Amount (in figures)")
    _label_line(pdf, "Amount (in words)")
    _label_line(pdf, "Currency")

    # ── SECTION 4 ──
    _section_title(pdf, "4", "Default, Suspension & Data Retention")
    _bullet(pdf, (
        "4.1  If the remaining fifty percent (50%) balance is not received by Decorum IT "
        "Solutions at the conclusion of the 3-month Pilot Period, the School's access to the "
        "Skoola portal may be temporarily suspended without prior notice."
    ))
    _bullet(pdf, (
        "4.2  During a suspension period, all School data (student records, financial data, "
        "staff information) will be safely preserved and backed up for a grace period of up "
        "to thirty (30) calendar days."
    ))
    _bullet(pdf, (
        "4.3  If no payment or written arrangement is made within this 30-day grace period, "
        "Decorum IT Solutions reserves the right to permanently terminate the School's account "
        "and delete all associated data. The Service Provider shall not be liable for any data "
        "loss after this period."
    ))

    # ── SECTION 5 ──
    _section_title(pdf, "5", "Intellectual Property & Licensing")
    _bullet(pdf, (
        "5.1  All intellectual property rights, source code, user interface designs, branding, "
        "and proprietary workflows of Skoola remain the exclusive property of Mr. Oheneba "
        "Michael Baah and Decorum IT Solutions."
    ))
    _bullet(pdf, (
        "5.2  The School is granted a non-exclusive, non-transferable, revocable license to "
        "access and use the platform solely for its internal school management purposes. Under "
        "no circumstances shall the School attempt to reverse-engineer, copy, sublicense, or "
        "redistribute any part of the Software."
    ))

    # ── SECTION 6 ──
    _section_title(pdf, "6", "Data Security & Confidentiality")
    _bullet(pdf, (
        "6.1  Decorum IT Solutions shall employ industry-standard encryption, access controls, "
        "and security protocols to safeguard the School's records, student personal information, "
        "and financial data."
    ))
    _bullet(pdf, (
        "6.2  Both parties agree to maintain the confidentiality of all proprietary information "
        "exchanged under this Agreement and shall not disclose such information to third parties "
        "without prior written consent."
    ))

    # ── SECTION 7 ──
    _section_title(pdf, "7", "Support & Maintenance")
    _bullet(pdf, (
        "7.1  During the Pilot Period and throughout the active subscription term, Decorum IT "
        "Solutions will provide standard technical support via email and messaging channels "
        "during business hours."
    ))
    _bullet(pdf, (
        "7.2  System maintenance, updates, and bug fixes shall be performed by the Service "
        "Provider at its discretion and at no additional cost to the School."
    ))

    # ── SECTION 8 ──
    _section_title(pdf, "8", "Limitation of Liability")
    _bullet(pdf, (
        "8.1  Decorum IT Solutions shall not be liable for any indirect, incidental, or "
        "consequential damages arising from the use or inability to use the Skoola platform, "
        "including but not limited to loss of data caused by circumstances beyond the Service "
        "Provider's reasonable control."
    ))

    # ── SECTION 9 ──
    _section_title(pdf, "9", "Termination")
    _bullet(pdf, (
        "9.1  Either party may terminate this Agreement by providing thirty (30) days' written "
        "notice to the other party. Fees already paid are non-refundable."
    ))
    _bullet(pdf, (
        "9.2  Upon termination, the School's access shall be revoked, and data will be retained "
        "for thirty (30) days to allow the School to request data export, after which all data "
        "may be permanently deleted."
    ))

    # ── SECTION 10 ──
    _section_title(pdf, "10", "Governing Law")
    _bullet(pdf, (
        "10.1  This Agreement shall be governed by and construed in accordance with the laws "
        "of the Republic of Ghana. Any disputes arising under this Agreement shall be resolved "
        "through good-faith negotiation, and if unresolved, through the appropriate courts of "
        "jurisdiction."
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
        "agreed to all terms and conditions contained in this Agreement. Each signatory "
        "represents and warrants that they are duly authorized to execute this Agreement "
        "on behalf of their respective organization."
    ))

    pdf.ln(6)

    # Service Provider signature
    _signature_block(
        pdf,
        "FOR THE SERVICE PROVIDER  -  DECORUM IT SOLUTIONS",
        "Mr. Oheneba Michael Baah  (Owner, Proprietor & Author)",
        extra_lines=[]
    )

    pdf.ln(8)
    _hr(pdf)
    pdf.ln(6)

    # Client signature
    _signature_block(
        pdf,
        "FOR THE CLIENT  -  THE SCHOOL",
        None,
        extra_lines=["Name", "Title / Role"]
    )

    # School Stamp area
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(120, 120, 130)
    pdf.cell(0, 5, "Official School Stamp / Seal:", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    y = pdf.get_y()
    pdf.set_draw_color(200, 200, 210)
    pdf.set_line_width(0.3)
    pdf.rect(20, y, 60, 35)  # stamp box
    pdf.set_y(y + 38)

    # Final note
    pdf.ln(10)
    _hr(pdf, color=(200, 200, 210))
    pdf.ln(3)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(156, 163, 175)
    pdf.multi_cell(0, 4.5, (
        "This document constitutes the entire agreement between the parties and supersedes "
        "all prior negotiations, representations, or agreements relating to the subject matter "
        "herein. Amendments must be in writing and signed by both parties."
    ), align="C")

    # ── OUTPUT ──
    out_path = os.path.join(
        r"c:\Users\inspy\OneDrive\Documents\school",
        "Skoola_Pilot_Program_Agreement.pdf"
    )
    pdf.output(out_path)
    print(f"PDF generated successfully: {out_path}")


if __name__ == "__main__":
    build_pdf()
