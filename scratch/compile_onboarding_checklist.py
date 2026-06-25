"""
Skoola Onboarding & Data Migration Checklist — Premium PDF Generator
Uses fpdf2 with fully manual layout for a clean, professional operational document.
"""
import os
from fpdf import FPDF


class OnboardingPDF(FPDF):
    """Custom PDF with branded header/footer on content pages."""

    def header(self):
        if self.page_no() <= 1:
            return
        self.set_fill_color(67, 56, 202)
        self.rect(0, 0, 210, 3.5, "F")
        self.set_y(6)
        self.set_font("Helvetica", "I", 7.5)
        self.set_text_color(160, 160, 170)
        self.cell(0, 5, "Skoola School Onboarding Checklist  |  Decorum IT Solutions", align="R")
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
    if y is None:
        y = pdf.get_y()
    pdf.set_draw_color(*color)
    pdf.set_line_width(0.3)
    pdf.line(20, y, 190, y)
    pdf.set_y(y + 3)


def _section_title(pdf, number, title):
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(0, 7, f"PHASE {number}", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 7, title.upper(), new_x="LMARGIN", new_y="NEXT")
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(1)


def _body(pdf, text):
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(55, 65, 81)
    pdf.multi_cell(0, 5.5, text)
    pdf.ln(2)


def _checkbox(pdf, text, indent=25):
    """Render a checkbox item with a square box."""
    y = pdf.get_y()
    # Draw the checkbox square
    pdf.set_draw_color(180, 180, 190)
    pdf.set_line_width(0.3)
    pdf.rect(indent, y + 0.5, 4, 4)
    # Draw the text
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(55, 65, 81)
    pdf.set_x(indent + 7)
    pdf.multi_cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1.5)


def _label_line(pdf, label, width=80):
    pdf.set_font("Helvetica", "B", 9.5)
    pdf.set_text_color(100, 100, 110)
    pdf.cell(width, 6, label, new_x="LMARGIN", new_y="NEXT")
    y = pdf.get_y()
    pdf.set_draw_color(180, 180, 190)
    pdf.set_line_width(0.25)
    pdf.line(20, y + 1, 190, y + 1)
    pdf.set_y(y + 8)


def build_pdf():
    pdf = OnboardingPDF(orientation="P", unit="mm", format="A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(20, 20, 20)

    # ============================================================
    # PAGE 1 -- COVER
    # ============================================================
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)

    pdf.set_fill_color(17, 24, 39)
    pdf.rect(0, 0, 210, 90, "F")

    pdf.set_fill_color(67, 56, 202)
    pdf.rect(0, 90, 210, 4, "F")

    pdf.set_y(25)
    pdf.set_font("Helvetica", "B", 42)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 15, "Skoola", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(160, 170, 190)
    pdf.cell(0, 8, "School Management System", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_y(115)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(17, 24, 39)
    pdf.multi_cell(0, 11, "SCHOOL ONBOARDING &\nDATA MIGRATION CHECKLIST", align="C")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(107, 114, 128)
    pdf.multi_cell(0, 6, "Step-by-Step Preparation Guide for New School Setup\nand Academic Data Import", align="C")

    pdf.ln(8)
    y = pdf.get_y()
    pdf.set_draw_color(67, 56, 202)
    pdf.set_line_width(0.6)
    pdf.line(75, y, 135, y)

    pdf.ln(10)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(0, 6, "SOFTWARE OWNER & PROPRIETOR", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 8, "Mr. Oheneba Michael Baah", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_y(250)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 5, "PUBLISHED & MAINTAINED BY DECORUM IT SOLUTIONS", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 5, "Official Onboarding Document  |  Version 2026.1", align="C")

    # ============================================================
    # PAGE 2+ -- CHECKLIST BODY
    # ============================================================
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 8, "SCHOOL ONBOARDING & DATA MIGRATION CHECKLIST", new_x="LMARGIN", new_y="NEXT")
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(3)

    # School info fields
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(0, 6, "SCHOOL INFORMATION", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    _label_line(pdf, "School Name")
    _label_line(pdf, "Designated Subdomain (e.g., schoolname.skoola.com)")
    _label_line(pdf, "Primary Administrator Name")
    _label_line(pdf, "Primary Administrator Email")
    _label_line(pdf, "Primary Administrator Phone Number")
    _label_line(pdf, "Onboarding Start Date")
    pdf.ln(2)

    # ── PHASE 1 ──
    _section_title(pdf, "1", "Pre-Onboarding Requirements")
    _body(pdf, "Before the Skoola team begins portal configuration, the School must complete the following:")
    _checkbox(pdf, "Pilot Agreement signed and returned to Decorum IT Solutions.")
    _checkbox(pdf, "Initial 50% subscription payment confirmed (receipt or proof of transfer attached).")
    _checkbox(pdf, "Preferred subdomain name selected and communicated (e.g., greenhill.skoola.com).")
    _checkbox(pdf, "Primary system administrator identified (name, email, phone number provided above).")
    _checkbox(pdf, "Data Processing Agreement (DPA) signed by the School representative.")

    # ── PHASE 2 ──
    _section_title(pdf, "2", "Student Data Preparation")
    _body(pdf, (
        "The School must prepare student data in Microsoft Excel (.xlsx) or CSV (.csv) format. "
        "Each file should contain the following columns in the exact order specified:"
    ))
    _checkbox(pdf, "Student Full Name (First Name, Middle Name, Last Name)")
    _checkbox(pdf, "Date of Birth (DD/MM/YYYY format)")
    _checkbox(pdf, "Gender (Male / Female)")
    _checkbox(pdf, "Class / Grade Level (e.g., JHS 1, SHS 2, Class 4)")
    _checkbox(pdf, "Admission Number / Student ID")
    _checkbox(pdf, "Parent / Guardian Full Name")
    _checkbox(pdf, "Parent / Guardian Phone Number (primary)")
    _checkbox(pdf, "Parent / Guardian Email (optional)")
    _checkbox(pdf, "Residential Address (optional)")
    _checkbox(pdf, "Emergency Contact Number")

    # ── PHASE 3 ──
    _section_title(pdf, "3", "Staff & Teacher Data Preparation")
    _body(pdf, "The School must provide a roster of all teaching and non-teaching staff in Excel/CSV format:")
    _checkbox(pdf, "Staff Full Name")
    _checkbox(pdf, "Role / Designation (e.g., Class Teacher, Subject Teacher, Bursar, Librarian)")
    _checkbox(pdf, "Staff ID / Employee Number")
    _checkbox(pdf, "Email Address (for portal login credentials)")
    _checkbox(pdf, "Phone Number")
    _checkbox(pdf, "Subject(s) Taught (for teachers only)")
    _checkbox(pdf, "Class(es) Assigned")

    # ── PHASE 4 ──
    _section_title(pdf, "4", "Academic Structure Setup")
    _body(pdf, "Provide the following academic configuration details for your school:")
    _checkbox(pdf, "List of all Classes / Grades offered (e.g., Creche, KG1, KG2, Primary 1-6, JHS 1-3).")
    _checkbox(pdf, "List of all Subjects per class/grade.")
    _checkbox(pdf, "Current Academic Term / Semester label (e.g., Term 1, 2025/2026).")
    _checkbox(pdf, "Grading Scale / Mark Scheme (e.g., A=80-100, B+=70-79, etc.).")
    _checkbox(pdf, "School Crest / Logo image file (PNG or JPEG, minimum 200x200px) for report cards.")

    # ── PHASE 5 ──
    _section_title(pdf, "5", "Financial Ledger Migration (Optional)")
    _body(pdf, (
        "If the School wishes to migrate existing fee records into Skoola, provide the following "
        "in Excel/CSV format:"
    ))
    _checkbox(pdf, "Student Name and ID linked to each fee record.")
    _checkbox(pdf, "Fee Category (e.g., Tuition, Feeding, Transport, PTA Levy).")
    _checkbox(pdf, "Amount Billed per student per term.")
    _checkbox(pdf, "Amount Already Paid and outstanding balance.")
    _checkbox(pdf, "Payment dates and methods (cash, bank transfer, mobile money).")

    # ── PHASE 6 ──
    _section_title(pdf, "6", "Post-Setup Verification & Sign-Off")
    _body(pdf, (
        "After Decorum IT Solutions completes portal setup and data import, the School administrator "
        "must verify the following before activating the portal for staff and students:"
    ))
    _checkbox(pdf, "All student records imported correctly (spot-check at least 10 records).")
    _checkbox(pdf, "All staff accounts created and login credentials distributed.")
    _checkbox(pdf, "Class/Grade structure and subject assignments verified.")
    _checkbox(pdf, "School logo and branding correctly displayed on report cards and dashboard.")
    _checkbox(pdf, "Administrator can successfully add a new student and record attendance.")
    _checkbox(pdf, "SMS/Email notification test sent and received successfully.")
    pdf.ln(4)

    # Sign-off block
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 7, "ADMINISTRATOR SIGN-OFF", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    _body(pdf, (
        "I confirm that I have reviewed the imported data, tested the system functionalities, "
        "and approve the activation of the Skoola portal for our school."
    ))
    pdf.ln(4)
    _label_line(pdf, "Administrator Name")
    _label_line(pdf, "Signature")
    _label_line(pdf, "Date")

    # ── OUTPUT ──
    out_path = os.path.join(
        r"c:\Users\inspy\OneDrive\Documents\school",
        "Skoola_Onboarding_Checklist.pdf"
    )
    pdf.output(out_path)
    print(f"PDF generated successfully: {out_path}")


if __name__ == "__main__":
    build_pdf()
