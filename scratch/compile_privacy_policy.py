"""
Skoola Privacy Policy — Premium PDF Generator
Uses fpdf2 with fully manual layout for a clean, professional legal document.
"""
import os
from fpdf import FPDF


class PrivacyPolicyPDF(FPDF):
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
        self.cell(0, 5, "Skoola Data Protection & Privacy Policy  |  Oheneba Media", align="R")
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


def build_pdf():
    pdf = PrivacyPolicyPDF(orientation="P", unit="mm", format="A4")
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
    pdf.multi_cell(0, 11, "DATA PROTECTION &\nPRIVACY POLICY", align="C")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(107, 114, 128)
    pdf.multi_cell(0, 6, "Platform Privacy Guidelines & Regulatory Compliance\nunder the Ghana Data Protection Act, 2012 (Act 843)", align="C")

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
    pdf.cell(0, 5, "PUBLISHED & MAINTEINED BY OHENEBA MEDIA", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 5, "Official Compliance Document  |  Version 2026.1", align="C")

    # ============================================================
    # PAGE 2+ — POLICY BODY
    # ============================================================
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 8, "DATA PROTECTION & PRIVACY POLICY", new_x="LMARGIN", new_y="NEXT")
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(3)

    pdf.set_font("Helvetica", "I", 9.5)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 5, "Effective Date: June 25, 2026", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    _body(pdf, (
        "This Data Protection & Privacy Policy (the \"Policy\") outlines the commitment of "
        "Oheneba Media, owned by Mr. Oheneba Michael Baah (referred to as the "
        "\"Service Provider\"), to protect the privacy and personal data processed through "
        "the Skoola School Management System (the \"Software\" or \"Platform\")."
    ))
    _body(pdf, (
        "This Policy applies to all administrators, teachers, students, parents, and other "
        "authorized users of Skoola. By using the Platform, the contracting School agrees to "
        "comply with and enforce these privacy standards within its academic community."
    ))

    # ── SECTION 1 ──
    _section_title(pdf, "1", "Regulatory Compliance & Legal Framework")
    _bullet(pdf, (
        "1.1  The Service Provider warrants that all personal data collection, processing, "
        "and storage activities conducted on Skoola are designed in accordance with the "
        "Data Protection Act, 2012 (Act 843) of the Republic of Ghana."
    ))
    _bullet(pdf, (
        "1.2  For the purposes of this Policy, the Client (the School) acts as the Data Controller, "
        "determining the purposes and means of processing student, staff, and parent data. "
        "Oheneba Media acts as the Data Processor, processing information strictly on "
        "behalf of, and under instructions from, the School."
    ))
    _bullet(pdf, (
        "1.3  Both parties agree to uphold the 8 basic principles of data protection as defined by "
        "Ghanaian law: accountability, lawfulness, specification of purpose, compatibility of further "
        "processing, quality of information, openness, data security safeguards, and data subject participation."
    ))

    # ── SECTION 2 ──
    _section_title(pdf, "2", "Types of Information Collected")
    _body(pdf, "Skoola collects and processes only the information necessary for administrative, academic, and financial operations. This includes:")
    _bullet(pdf, (
        "2.1  ADMINISTRATIVE DATA: Full name, official email address, phone number, and designation of "
        "the school's system administrators to enable portal setup and management."
    ))
    _bullet(pdf, (
        "2.2  STAFF & TEACHER DATA: Name, contact details, employee identification number, professional "
        "qualifications, and classroom assignments."
    ))
    _bullet(pdf, (
        "2.3  STUDENT RECORDS: Full name, date of birth, gender, class/grade placement, admission number, "
        "attendance logs, exam marks, grades, progress reports, and disciplinary logs."
    ))
    _bullet(pdf, (
        "2.4  PARENT & GUARDIAN DATA: Full name, relationship to student, telephone number, email "
        "address, residential address, and school bill payment history."
    ))
    _bullet(pdf, (
        "2.5  USAGE & SYSTEM LOGS: IP addresses, login timestamps, browser types, and database transaction "
        "logs. These are stored for security auditing, diagnostic logging, and to prevent unauthorized access."
    ))

    # ── SECTION 3 ──
    _section_title(pdf, "3", "Enhanced Protection for Minors")
    _bullet(pdf, (
        "3.1  The Service Provider acknowledges that student records processed on the system often belong "
        "to minors (children under the age of 18). Enhanced security controls are maintained to safeguard "
        "this information."
    ))
    _bullet(pdf, (
        "3.2  The School, as the Data Controller, represents and warrants that it has secured the necessary "
        "parental or guardian consents before entering any minor's personal data into the Skoola platform."
    ))
    _bullet(pdf, (
        "3.3  Oheneba Media will never utilize minor data for advertising, profiling, or behavioral "
        "marketing, and will never contact student users directly unless explicitly authorized for tech support."
    ))

    # ── SECTION 4 ──
    _section_title(pdf, "4", "Purpose & Use of Data")
    _body(pdf, "All personal and organizational data processed through Skoola is used strictly to:")
    _bullet(pdf, "4.1  Create, customize, and operate the School's dedicated subdomain portal.")
    _bullet(pdf, "4.2  Process student enrollments, academic transcripts, class schedules, and report cards.")
    _bullet(pdf, "4.3  Deliver system alerts, report cards, and payment receipts to parents via SMS or email.")
    _bullet(pdf, "4.4  Enable administrators and teachers to track fee payments and general accounts.")
    _bullet(pdf, "4.5  Diagnose technical glitches, optimize system speeds, and resolve customer support tickets.")
    _bullet(pdf, "4.6  Conduct internal audits to ensure platform integrity and compliance with security regulations.")

    # ── SECTION 5 ──
    _section_title(pdf, "5", "Data Storage, Location, and Backups")
    _bullet(pdf, (
        "5.1  All data processed by Skoola is stored in secure cloud database servers with physical "
        "and logical access control restricted strictly to authorized engineering staff of Oheneba Media."
    ))
    _bullet(pdf, (
        "5.2  Automated incremental database backups are executed daily. Backup files are encrypted "
        "and transferred to a secondary secure cloud location to protect against catastrophic server failures."
    ))
    _bullet(pdf, (
        "5.3  The School's operational databases are kept isolated to prevent cross-tenant data leakage "
        "between different educational institutions hosted on Skoola."
    ))

    # ── SECTION 6 ──
    _section_title(pdf, "6", "Third-Party Data Sharing Limits")
    _bullet(pdf, (
        "6.1  Oheneba Media will never sell, lease, trade, rent, or monetize school data, student "
        "information, or parent contact details to any third-party marketing firms or external organizations."
    ))
    _bullet(pdf, (
        "6.2  Data is shared only with certified infrastructural partners necessary to provide the service "
        "(e.g., hosting providers and SMS gateway providers for student notification delivery). These "
        "partners are contractually bound to the same data security rules."
    ))
    _bullet(pdf, (
        "6.3  The Service Provider will only disclose data to government bodies or law enforcement authorities "
        "when legally compelled to do so by a valid court order or official directive issued under the laws "
        "of the Republic of Ghana."
    ))

    # ── SECTION 7 ──
    _section_title(pdf, "7", "Rights of Data Subjects")
    _bullet(pdf, (
        "7.1  Pursuant to Act 843, students, staff, and parents maintain rights to access, correct, or "
        "request the deletion of their personal information held on the Skoola system."
    ))
    _bullet(pdf, (
        "7.2  Individuals wishing to exercise these rights must contact the School administrator (Data Controller) "
        "directly. The School administrator has full authority to edit, archive, or delete user records "
        "via the admin dashboard. Oheneba Media will assist the School in fulfilling such requests "
        "if technical intervention is required."
    ))

    # ── SECTION 8 ──
    _section_title(pdf, "8", "Technical & Administrative Security Measures")
    _bullet(pdf, (
        "8.1  ENCRYPTION: Skoola utilizes industry-standard Secure Socket Layer / Transport Layer Security "
        "(SSL/TLS) encryption for all data in transit between users and the platform, and robust encryption "
        "for sensitive data stored at rest."
    ))
    _bullet(pdf, (
        "8.2  ACCESS CONTROLS: Role-based authorization ensures users (admins, teachers, students, parents) "
        "can only access the specific information blocks required to execute their system functions."
    ))
    _bullet(pdf, (
        "8.3  LOGGING: All login attempts, data updates, and administrative changes are recorded in an "
        "immutable audit log to track and investigate potential unauthorized operations."
    ))

    # ── SECTION 9 ──
    _section_title(pdf, "9", "Data Breach Protocols")
    _bullet(pdf, (
        "9.1  Oheneba Media maintains a robust incident response protocol to address any potential "
        "unauthorized database access, leakage, or security breach."
    ))
    _bullet(pdf, (
        "9.2  Upon confirming a data breach affecting the School's records, Oheneba Media shall notify "
        "the School's designated administrator in writing within seventy-two (72) hours."
    ))
    _bullet(pdf, (
        "9.3  The notification shall describe the nature of the breach, the classes of records involved, the "
        "immediate containment steps implemented, and recommendations for user password resets or account locks."
    ))

    # ── SECTION 10 ──
    _section_title(pdf, "10", "Data Retention, Purging, & Contact Information")
    _bullet(pdf, (
        "10.1  DATA PURGING: Upon termination of the School's subscription agreement, the Service Provider "
        "will preserve the database for a grace period of thirty (30) days to allow for data export. "
        "After this grace period, all operational tables, files, and backups will be permanently and "
        "irrecoverably purged from our primary and secondary storage disks."
    ))
    _bullet(pdf, (
        "10.2  POLICY AMENDMENTS: Oheneba Media reserves the right to update this policy to align with "
        "changing regulatory standards. Significant updates will be communicated to the School's administrator."
    ))
    _bullet(pdf, (
        "10.3  CONTACT DETAILS: For queries regarding data protection, please contact the software proprietor:"
    ))
    pdf.ln(2)
    pdf.set_x(25)
    pdf.set_font("Helvetica", "B", 9.5)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 5, "Proprietor: Mr. Oheneba Michael Baah", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(25)
    pdf.cell(0, 5, "Company: Oheneba Media", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(25)
    pdf.cell(0, 5, "Support Email: support@skoola.com", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(25)
    pdf.cell(0, 5, "Official Website: www.decorumit.com", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # ── OUTPUT ──
    out_path = os.path.join(
        r"c:\Users\inspy\OneDrive\Documents\school",
        "Skoola_Privacy_Policy.pdf"
    )
    pdf.output(out_path)
    print(f"PDF generated successfully: {out_path}")


if __name__ == "__main__":
    build_pdf()
