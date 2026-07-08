"""
Skoola Data Processing Agreement — Premium PDF Generator
Uses fpdf2 with fully manual layout for a clean, professional legal document.
"""
import os
from fpdf import FPDF


class DPAPDF(FPDF):
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
        self.cell(0, 5, "Skoola Data Processing Agreement  |  Oheneba Media", align="R")
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
    pdf = DPAPDF(orientation="P", unit="mm", format="A4")
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
    pdf.multi_cell(0, 11, "DATA PROCESSING\nAGREEMENT (DPA)", align="C")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(107, 114, 128)
    pdf.multi_cell(0, 6, "Standard Contractual Clauses & Compliance Addendum\nUnder the Ghana Data Protection Act, 2012 (Act 843)", align="C")

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
    pdf.cell(0, 5, "Official Compliance Document  |  Version 2026.1", align="C")

    # ============================================================
    # PAGE 2+ — DPA BODY
    # ============================================================
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 8, "DATA PROCESSING ADDENDUM (DPA)", new_x="LMARGIN", new_y="NEXT")
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(3)

    pdf.set_font("Helvetica", "I", 9.5)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 5, "Effective Date: June 25, 2026", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    _body(pdf, (
        "This Data Processing Agreement (\"DPA\") is entered into by and between the Client School "
        "(hereinafter referred to as the \"Controller\") and Oheneba Media, represented by its "
        "proprietor Mr. Oheneba Michael Baah (hereinafter referred to as the \"Processor\")."
    ))
    _body(pdf, (
        "This DPA supplements the main Skoola Service Agreement and governs the processing of "
        "personal data by the Processor on behalf of the Controller. Both parties agree to the terms "
        "below to ensure compliance with the Data Protection Act, 2012 (Act 843) of Ghana."
    ))

    # ── SECTION 1 ──
    _section_title(pdf, "1", "Purpose & Applicability")
    _bullet(pdf, (
        "1.1  The purpose of this DPA is to govern the processing of all personal data entered and "
        "stored on the Skoola platform. This includes student records, parent contact details, "
        "and staff profiles."
    ))
    _bullet(pdf, (
        "1.2  This DPA applies to all processing operations performed by the Processor to deliver "
        "the SaaS subscription service as configured in the Service Agreement."
    ))

    # ── SECTION 2 ──
    _section_title(pdf, "2", "Definitions & Interpretation")
    _bullet(pdf, (
        "2.1  'Act 843' means the Data Protection Act, 2012 of the Republic of Ghana, and any "
        "regulations issued by the Data Protection Commission (DPC)."
    ))
    _bullet(pdf, (
        "2.2  'Controller' and 'Processor' have the meanings ascribed to them under Act 843."
    ))
    _bullet(pdf, (
        "2.3  'Personal Data' refers to any information relating to an identified or identifiable "
        "individual processed on the Skoola platform."
    ))

    # ── SECTION 3 ──
    _section_title(pdf, "3", "Scope and Categories of Data")
    _bullet(pdf, (
        "3.1  CATEGORIES OF DATA SUBJECTS: The data subjects are the students (minors), parents, "
        "guardians, teachers, and school administrators of the Controller."
    ))
    _bullet(pdf, (
        "3.2  TYPES OF PERSONAL DATA: Student grades, attendance logs, biographical details (names, "
        "dates of birth), parent phone numbers, email addresses, staff employment details, and billing logs."
    ))

    # ── SECTION 4 ──
    _section_title(pdf, "4", "Obligations of the Processor")
    _bullet(pdf, (
        "4.1  INSTRUCTIONS: The Processor shall process personal data only on documented, written "
        "instructions from the Controller, unless required by Ghanaian law."
    ))
    _bullet(pdf, (
        "4.2  CONFIDENTIALITY: The Processor ensures that all personnel authorized to access and process "
        "the personal data are bound by strict contractual confidentiality agreements."
    ))
    _bullet(pdf, (
        "4.3  COMPLIANCE: The Processor will inform the Controller if, in its opinion, any instruction "
        "violates Act 843."
    ))

    # ── SECTION 5 ──
    _section_title(pdf, "5", "Sub-processors")
    _bullet(pdf, (
        "5.1  GENERAL CONSENT: The Controller grants the Processor general authorization to engage "
        "sub-processors (e.g. cloud hosting providers and SMS notification gateways) to deliver the service."
    ))
    _bullet(pdf, (
        "5.2  LIABILITY: The Processor will impose the same data protection obligations on its sub-processors "
        "and remains fully liable to the Controller for the performance of the sub-processor's obligations."
    ))

    # ── SECTION 6 ──
    _section_title(pdf, "6", "Assistance to the Controller")
    _bullet(pdf, (
        "6.1  DATA SUBJECT RIGHTS: The Processor will assist the Controller through technical measures "
        "to respond to requests from data subjects exercising their rights under Act 843 (e.g., access or deletion)."
    ))
    _bullet(pdf, (
        "6.2  SECURITY & AUDIT: The Processor will assist the Controller in ensuring compliance with security, "
        "breach notifications, and prior consultations with the Data Protection Commission."
    ))

    # ── SECTION 7 ──
    _section_title(pdf, "7", "Technical Security Measures")
    _bullet(pdf, (
        "7.1  The Processor shall implement and maintain appropriate technical and organizational measures to "
        "protect personal data against accidental loss, unauthorized disclosure, or access."
    ))
    _bullet(pdf, (
        "7.2  These measures include database encryption at rest, secure SSL/TLS protocols in transit, "
        "role-based portal logins, and daily incremental backups."
    ))

    # ── SECTION 8 ──
    _section_title(pdf, "8", "Audits & Compliance Proofs")
    _bullet(pdf, (
        "8.1  The Processor agrees to provide the Controller with all information necessary to demonstrate "
        "compliance with this DPA."
    ))
    _bullet(pdf, (
        "8.2  The Processor will allow for and contribute to audits, including inspections, conducted by the "
        "Controller or an independent auditor mandated by the Controller, at the Controller's sole expense."
    ))

    # ── SECTION 9 ──
    _section_title(pdf, "9", "Breach Notifications")
    _bullet(pdf, (
        "9.1  The Processor shall notify the Controller within seventy-two (72) hours of confirming any "
        "accidental or unauthorized access, leakage, or breach of the Controller's personal data."
    ))
    _bullet(pdf, (
        "9.2  The notification will describe the nature of the security incident, categories of data compromised, "
        "remediation steps taken, and points of contact."
    ))

    # ── SECTION 10 ──
    _section_title(pdf, "10", "Data Return & Destruction")
    _bullet(pdf, (
        "10.1  Upon termination of the main Service Agreement, the Processor shall, at the choice of the "
        "Controller, return or delete all personal data within thirty (30) days."
    ))
    _bullet(pdf, (
        "10.2  Once the deletion period is completed, all data backups and operational servers will be "
        "permanently wiped, and the Processor shall provide a certificate of destruction upon request."
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
        "agreed to all terms and conditions contained in this Data Processing Agreement."
    ))

    pdf.ln(6)

    # Processor signature
    _signature_block(
        pdf,
        "FOR THE PROCESSOR  -  OHENEBA MEDIA",
        "Mr. Oheneba Michael Baah  (Owner & Software Proprietor)",
        extra_lines=[]
    )

    pdf.ln(8)
    _hr(pdf)
    pdf.ln(6)

    # Controller signature
    _signature_block(
        pdf,
        "FOR THE CONTROLLER  -  THE SCHOOL",
        None,
        extra_lines=["School Name", "Representative Name", "Designation"]
    )

    # ── OUTPUT ──
    out_path = os.path.join(
        r"c:\Users\inspy\OneDrive\Documents\school",
        "Skoola_Data_Processing_Agreement.pdf"
    )
    pdf.output(out_path)
    print(f"PDF generated successfully: {out_path}")


if __name__ == "__main__":
    build_pdf()
