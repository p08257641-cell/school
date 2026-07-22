"""
Skoola Platform Features Reference Guide — Premium PDF Generator
Uses fpdf2 with fully manual layout for a clean, professional product guide.
"""
import os
from fpdf import FPDF


class FeaturesGuidePDF(FPDF):
    """Custom PDF with branded header/footer on content pages."""

    def header(self):
        if self.page_no() <= 1:
            return  # skip header on cover page
        # Thin indigo accent bar
        self.set_fill_color(67, 56, 202)  # indigo-700
        self.rect(0, 0, 210, 3.5, "F")
        # Header text
        self.set_y(6)
        self.set_font("Helvetica", "I", 7.5)
        self.set_text_color(160, 160, 170)
        self.cell(0, 5, "Skoola Platform Features Reference Guide  |  Product Documentation", align="R")
        self.ln(10)

    def footer(self):
        if self.page_no() <= 1:
            return
        self.set_y(-14)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(170, 170, 180)
        self.cell(95, 5, "Confidential  -  Oheneba Media  -  Skoola SaaS Platform", align="L")
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


def _bullet(pdf, title, desc, indent=25):
    """Render a bold-title bulleted item description."""
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(17, 24, 39)
    pdf.set_x(indent)
    pdf.cell(45, 5.5, title + ": ", new_x="LMARGIN", new_y="LAST")
    
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(55, 65, 81)
    pdf.set_x(indent + 45)
    pdf.multi_cell(0, 5.5, desc, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1.5)


def build_pdf():
    pdf = FeaturesGuidePDF(orientation="P", unit="mm", format="A4")
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

    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(165, 180, 252)  # indigo-200
    pdf.cell(0, 10, "B2B School Administration & Management SaaS", align="C", new_x="LMARGIN", new_y="NEXT")

    # Document details on light background
    pdf.set_y(120)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(17, 24, 39)  # zinc-900
    pdf.multi_cell(0, 10, "PLATFORM FEATURES\nREFERENCE GUIDE", align="C")

    pdf.set_y(150)
    _hr(pdf, color=(67, 56, 202))

    pdf.set_y(160)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(75, 85, 99)
    pdf.cell(0, 6, "CONFIDENTIAL PRODUCT MANUAL", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9.5)
    pdf.cell(0, 6, "For System Administrators, Registrars, and Financial Officers", align="C", new_x="LMARGIN", new_y="NEXT")

    # Metadata at the bottom of cover
    pdf.set_y(240)
    _hr(pdf)
    pdf.set_y(245)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 5, "Proprietor: Mr. Oheneba Michael Baah", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, "Company: Oheneba Media  |  Product Support: support@skoola.com", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, "Date of Publication: July 2026  |  Version: 1.0 (Enterprise Release)", align="C", new_x="LMARGIN", new_y="NEXT")

    # ============================================================
    # PAGE 2 — DOCUMENT OVERVIEW & ARCHITECTURE
    # ============================================================
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    _section_title(pdf, "1", "Introduction & Scope")
    _body(
        pdf,
        "This features guide details the capabilities of the Skoola school administration software "
        "as of the July 2026 enterprise release. Skoola is built on a high-availability, multi-tenant "
        "SaaS architecture, enabling individual academic institutions to deploy custom subdomains, manage "
        "complex grading and reporting schemes, control financial invoicing, run online assessments, and "
        "interact with AI-assisted administrative tooling."
    )
    
    pdf.ln(5)
    _section_title(pdf, "2", "Core System Modules")
    _body(
        pdf,
        "The platform organizes educational operations into four main functional blocks, which can "
        "be fully enabled or disabled by the Super Admin in the central licensing panel:"
    )
    
    pdf.ln(2)
    _bullet(pdf, "1. Academic & Student Control", "Enrollment, course scheduling, smart timetables, class assignments, and card printing.", indent=22)
    _bullet(pdf, "2. Assessment & Grading", "Report cards, exam schedulers, remarks templates, grading rules, and academic transcripts.", indent=22)
    _bullet(pdf, "3. Business Office", "Fee structures, daily collection registry, invoices, sellable inventory, and receipts.", indent=22)
    _bullet(pdf, "4. Human Resources & Payroll", "Staff salary computation, leave approvals, attendance logs, and recruitment tracking.", indent=22)
    _bullet(pdf, "5. Interactive E-Learning", "Computer Based Testing (CBT), study material storage, assignments, and digital classrooms.", indent=22)
    _bullet(pdf, "6. Security & Whistleblowing", "Anonymous reporting, event logging, auditing, and platform security tools.", indent=22)

    # ============================================================
    # PAGE 3 — ACADEMICS & STUDENT MANAGEMENT
    # ============================================================
    pdf.add_page()
    _section_title(pdf, "3", "Academics & Student Administration")
    _body(
        pdf,
        "The Academics module forms the foundation of class organization, student registers, and "
        "daily campus logistics. All student directories dynamically link with billing and testing logs."
    )
    pdf.ln(2)

    _bullet(pdf, "Student Management", "Register students, maintain personal information, view histories, and track status (Active, Alumni, Withdrawn).")
    _bullet(pdf, "Class Management", "Group students, assign classroom teachers, and define rank orders for promotions.")
    _bullet(pdf, "Subject Management", "Create courses and assign academic subjects directly to teaching staff or class blocks.")
    _bullet(pdf, "Smart Timetable", "An automated scheduling engine that schedules classes, rooms, and staff without conflicts.")
    _bullet(pdf, "QR Attendance", "Generates student-specific barcodes/QR codes that teachers can scan to log attendance.")
    _bullet(pdf, "Student ID Cards", "Select students in bulk to format, preview, and print standardized student ID badges.")
    _bullet(pdf, "Campus Photo Gallery", "Allows staff to publish school-wide gallery images and organize them into public albums.")

    # ============================================================
    # PAGE 4 — ASSESSMENT & GRADING MODULES
    # ============================================================
    pdf.add_page()
    _section_title(pdf, "4", "Assessment, Grading & Reporting")
    _body(
        pdf,
        "The Assessment system handles grade entries, exam scheduling, and official academic records. "
        "It supports complex scaling of marks and customizable template outputs."
    )
    pdf.ln(2)

    _bullet(pdf, "Exam Schedules", "Create examinations, allot dates, configure times, and specify testing rooms.")
    _bullet(pdf, "Results Management", "Allows teachers to record class assessment scores (CA) and end-of-term exam marks.")
    _bullet(pdf, "Grading Scale rules", "Customize grade ranges (e.g. A, B, C) and minimum scores tailored to specific classes.")
    _bullet(pdf, "Report Card Builder", "Customize report card templates by dynamically toggling grids, logos, and signatures.")
    _bullet(pdf, "Remarks Template", "Provides templates of standardized teacher and principal comments to speed up report preparation.")
    _bullet(pdf, "Academic Transcripts", "Enables School Admins to generate official multi-term transcripts for selected students.")
    _bullet(pdf, "Public Report Portal", "Access and check report card records publicly using secure, expiring download links.")

    # ============================================================
    # PAGE 5 — BUSINESS OFFICE & HUMAN RESOURCES
    # ============================================================
    pdf.add_page()
    _section_title(pdf, "5", "Business Office, Finance & HR")
    _body(
        pdf,
        "The Business Office manages financial auditing, inventory, and staff rosters. "
        "It integrates billing directly with academic registers."
    )
    pdf.ln(2)

    _bullet(pdf, "Fees & Invoices", "Create fee structures (tuition, meals, sports) and assign them to specific classes or students.")
    _bullet(pdf, "Daily Collections", "Track cash, check, and digital payment receipts in a real-time ledger.")
    _bullet(pdf, "Stocks & Inventory", "Sellable item logs for textbooks, uniform sizes, and other campus inventory.")
    _bullet(pdf, "Staff Payroll", "Generate monthly salary computation reports for teaching and non-teaching personnel.")
    _bullet(pdf, "Leave Requests", "Approve, track, and record leave applications with defined vacation limits.")
    _bullet(pdf, "Recruitment Logs", "Manage job applications, schedule interviews, and transition recruits to active staff.")
    _bullet(pdf, "Exit Management", "Document resignations, terminations, clear handovers, and close system accounts.")

    # ============================================================
    # PAGE 6 — CBT & SECURITY & AI FEATURES
    # ============================================================
    pdf.add_page()
    _section_title(pdf, "6", "CBT, Security & Artificial Intelligence")
    _body(
        pdf,
        "Advanced modules designed for modern digital testing, high-level administrative audit security, "
        "and automated tasks powered by artificial intelligence."
    )
    pdf.ln(2)

    _bullet(pdf, "Computer Based Testing", "Create online exams with timers, multiple choice, or short-answer question sheets.")
    _bullet(pdf, "Whistleblower Portal", "A highly secure anonymous portal enabling students or parents to report behavior incidents.")
    _bullet(pdf, "Platform Audit Logs", "Records every administrative action, update, delete, login IP, and timestamp for auditing.")
    _bullet(pdf, "Skoola AI Assistant", "Automates summary reports, analyzes student performance, and helps draft curriculum documents.")
    _bullet(pdf, "Digital Signatures", "Upload administrative signatures to authorize transcripts and report cards automatically.")
    _bullet(pdf, "Subdomain Branding", "Set customized landing page details, gallery showcases, and brand colors per institution.")

    # ── OUTPUT TO ALL THREE DESIGNATED PATHS ──
    paths = [
        os.path.join(r"c:\Users\inspy\OneDrive\Documents\school", "Skoola_Features_Reference_Guide.pdf"),
        os.path.join(r"c:\Users\inspy\OneDrive\Documents\school\public", "Skoola_Features_Reference_Guide.pdf"),
        os.path.join(r"c:\Users\inspy\OneDrive\Documents\school\legal_documents", "Skoola_Features_Reference_Guide.pdf")
    ]
    
    # Ensure directories exist
    os.makedirs(r"c:\Users\inspy\OneDrive\Documents\school\public", exist_ok=True)
    os.makedirs(r"c:\Users\inspy\OneDrive\Documents\school\legal_documents", exist_ok=True)
    
    # Write first file
    pdf.output(paths[0])
    
    # Copy to the other paths
    import shutil
    for path in paths[1:]:
        shutil.copy2(paths[0], path)
        
    print(f"Features PDF compiled successfully in all locations: {paths}")


if __name__ == "__main__":
    build_pdf()
