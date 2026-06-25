"""
Skoola SLA & Support Policy — Premium PDF Generator
Uses fpdf2 with fully manual layout for a clean, professional legal document.
"""
import os
from fpdf import FPDF


class SLAPDF(FPDF):
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
        self.cell(0, 5, "Skoola Service Level Agreement & Support Policy  |  Decorum IT Solutions", align="R")
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
    pdf = SLAPDF(orientation="P", unit="mm", format="A4")
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
    pdf.multi_cell(0, 11, "SERVICE LEVEL AGREEMENT\n& SUPPORT POLICY", align="C")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(107, 114, 128)
    pdf.multi_cell(0, 6, "Platform Uptime Commitments, Maintenance Windows,\nand Technical Support Response Guidelines", align="C")

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
    pdf.cell(0, 5, "PUBLISHED & MAINTAINED BY DECORUM IT SOLUTIONS", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 5, "Official Operational Document  |  Version 2026.1", align="C")

    # ============================================================
    # PAGE 2+ — SLA BODY
    # ============================================================
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 8, "SERVICE LEVEL & TECHNICAL SUPPORT AGREEMENT", new_x="LMARGIN", new_y="NEXT")
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(3)

    pdf.set_font("Helvetica", "I", 9.5)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 5, "Effective Date: June 25, 2026", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    _body(pdf, (
        "This Service Level Agreement & Support Policy (\"SLA\") defines the support commitments and "
        "system performance guarantees provided by Decorum IT Solutions, represented by its owner "
        "Mr. Oheneba Michael Baah (\"Service Provider\"), to the Client School (\"Client\" or \"School\")."
    ))
    _body(pdf, (
        "This SLA operates alongside the Skoola main Service License Agreement. It describes "
        "uptime targets, server maintenance windows, support ticketing, response times, and disaster recovery."
    ))

    # ── SECTION 1 ──
    _section_title(pdf, "1", "System Availability & Uptime Commitments")
    _bullet(pdf, (
        "1.1  UPTIME TARGET: The Service Provider targets a ninety-nine point five percent (99.5%) system uptime "
        "for the Skoola platform, calculated over any calendar month, excluding scheduled maintenance."
    ))
    _bullet(pdf, (
        "1.2  SERVICE CREDIT: If the platform availability drops below 99.5% in a billing cycle (excluding exclusions "
        "defined in Section 1.3), the Client may request a service credit equivalent to 5% of their monthly pro-rated "
        "subscription fee for every 1% of unscheduled downtime, capped at a maximum of 25%."
    ))
    _bullet(pdf, (
        "1.3  SLA EXCLUSIONS: Uptime calculations exclude interruptions due to: (a) national internet network "
        "failures in Ghana; (b) the School's local network or browser configuration errors; or (c) force majeure "
        "events (natural disaster, power grid failure)."
    ))

    # ── SECTION 2 ──
    _section_title(pdf, "2", "Maintenance & Upgrade Schedules")
    _bullet(pdf, (
        "2.1  SCHEDULED MAINTENANCE: Routine maintenance, database defragmentation, and patch updates are performed "
        "during off-peak hours, specifically between 12:00 AM and 4:00 AM GMT, to minimize user disruption."
    ))
    _bullet(pdf, (
        "2.2  NOTIFICATION: The Service Provider will post alert notifications in the Admin dashboard at least "
        "twenty-four (24) hours in advance of any scheduled maintenance that requires more than fifteen minutes of downtime."
    ))
    _bullet(pdf, (
        "2.3  EMERGENCY MAINTENANCE: In the event of a severe security threat or database corruption, emergency maintenance "
        "may be conducted immediately without prior notice. The Client will be notified immediately upon system restoration."
    ))

    # ── SECTION 3 ──
    _section_title(pdf, "3", "Technical Support Channels")
    _bullet(pdf, (
        "3.1  SUPPORT HOURS: Standard support is available from 8:00 AM to 5:00 PM GMT, Monday through Friday, "
        "excluding official public holidays in the Republic of Ghana."
    ))
    _bullet(pdf, (
        "3.2  COMMUNICATION PORTALS: Support tickets, requests, and general assistance are processed via:"
    ))
    pdf.ln(1)
    pdf.set_x(25)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(0, 5, "-  Official Support Email: support@skoola.com / info@decorumit.com", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(25)
    pdf.cell(0, 5, "-  Dedicated Admin Dashboard Ticket Panel", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(25)
    pdf.cell(0, 5, "-  Authorized WhatsApp / Telegram Support Numbers", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    # ── SECTION 4 ──
    _section_title(pdf, "4", "Incident Severity Tiers & Response Times")
    _body(pdf, "Support requests are classified into four severity tiers, each with dedicated response and resolution targets:")
    _bullet(pdf, (
        "4.1  SEVERITY 1 (CRITICAL): The platform is completely down or inaccessible. "
        "Response Target: 2 hours. Resolution Target: 6 hours."
    ))
    _bullet(pdf, (
        "4.2  SEVERITY 2 (HIGH): Critical features (like online fee collections, gradebook calculations, or school SMS "
        "alerts) are non-functional for multiple users. "
        "Response Target: 4 hours. Resolution Target: 12 hours."
    ))
    _bullet(pdf, (
        "4.3  SEVERITY 3 (MEDIUM): Standard system bugs, visual rendering failures, or report card styling glitches. "
        "Response Target: 12 hours. Resolution Target: 48 hours."
    ))
    _bullet(pdf, (
        "4.4  SEVERITY 4 (LOW): General queries, user manual instructions, system configuration changes, or "
        "password reset requests. "
        "Response Target: 24 hours."
    ))

    # ── SECTION 5 ──
    _section_title(pdf, "5", "Data Backups & Disaster Recovery")
    _bullet(pdf, (
        "5.1  DAILY BACKUPS: Automated database backups are executed every twenty-four (24) hours. Backups are encrypted "
        "and replicated to a separate off-site cloud hosting provider."
    ))
    _bullet(pdf, (
        "5.2  DISASTER RECOVERY: In the event of a total primary server failure, the Service Provider targets a "
        "Recovery Time Objective (RTO) of less than four (4) hours and a Recovery Point Objective (RPO) of less than twenty-four (24) hours."
    ))

    # ── SECTION 6 ──
    _section_title(pdf, "6", "Client Operational Responsibilities")
    _bullet(pdf, (
        "6.1  HARDWARE & NETWORK: The School is responsible for procuring and maintaining stable high-speed Internet connections "
        "and appropriate endpoint hardware (computers, tablets) to access the Skoola system."
    ))
    _bullet(pdf, (
        "6.2  FIRST-LINE SUPPORT: The School's designated system administrator shall serve as the first point of contact "
        "for teachers, students, and parents. Standard queries should be handled internally before escalation to Decorum IT Solutions."
    ))

    # ── SECTION 7 ──
    _section_title(pdf, "7", "SLA Amendments")
    _bullet(pdf, (
        "7.1  The Service Provider reserves the right to modify this SLA and support terms to align with system architectural "
        "refinements. Any modifications will be communicated in writing to the School's system administrator."
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
        "agreed to all support commitments and SLA standards detailed in this document."
    ))

    pdf.ln(6)

    # Processor signature
    _signature_block(
        pdf,
        "FOR DECORUM IT SOLUTIONS",
        "Mr. Oheneba Michael Baah  (Owner & Software Proprietor)",
        extra_lines=[]
    )

    pdf.ln(8)
    _hr(pdf)
    pdf.ln(6)

    # Controller signature
    _signature_block(
        pdf,
        "FOR THE CLIENT SCHOOL",
        None,
        extra_lines=["School Name", "Representative Name", "Designation"]
    )

    # ── OUTPUT ──
    out_path = os.path.join(
        r"c:\Users\inspy\OneDrive\Documents\school",
        "Skoola_SLA_and_Support_Policy.pdf"
    )
    pdf.output(out_path)
    print(f"PDF generated successfully: {out_path}")


if __name__ == "__main__":
    build_pdf()
