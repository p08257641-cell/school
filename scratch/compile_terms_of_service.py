"""
Skoola Terms of Service — Premium PDF Generator
Uses fpdf2 with fully manual layout for a clean, professional legal document.
"""
import os
from fpdf import FPDF


class TermsOfServicePDF(FPDF):
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
        self.cell(0, 5, "Skoola Terms of Service  |  Oheneba Media", align="R")
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
    pdf = TermsOfServicePDF(orientation="P", unit="mm", format="A4")
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
    pdf.multi_cell(0, 11, "TERMS OF SERVICE", align="C")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(107, 114, 128)
    pdf.multi_cell(0, 6, "Platform Terms of Service & General Terms of Use\nGoverning Subscription, Operations, and Usage", align="C")

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
    pdf.cell(0, 5, "Official Legal Document  |  Version 2026.1", align="C")

    # ============================================================
    # PAGE 2+ — TERMS BODY
    # ============================================================
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 8, "TERMS OF SERVICE & GENERAL AGREEMENT", new_x="LMARGIN", new_y="NEXT")
    _hr(pdf, color=(67, 56, 202))
    pdf.ln(3)

    pdf.set_font("Helvetica", "I", 9.5)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 5, "Last Updated: June 25, 2026", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    _body(pdf, (
        "Welcome to Skoola, a role-based SaaS school management platform designed and owned by "
        "Mr. Oheneba Michael Baah and published by Oheneba Media (hereinafter referred to "
        "as the \"Service Provider\")."
    ))
    _body(pdf, (
        "These Terms of Service (the \"Terms\") constitute a legally binding agreement between the "
        "educational institution contracting our services (the \"Client\" or \"School\") and the "
        "Service Provider. By registering, accessing, or using Skoola, the School, its employees, "
        "agents, students, and parents agree to be bound by these Terms."
    ))

    # ── SECTION 1 ──
    _section_title(pdf, "1", "Scope of Service & Accounts")
    _bullet(pdf, (
        "1.1  Skoola is a cloud-based school management portal that enables role-based workflows for "
        "school administrators, teachers, students, and parents. The specific portal is provisioned via "
        "a customized school subdomain (e.g., schoolname.skoola.com)."
    ))
    _bullet(pdf, (
        "1.2  LICENSE GRANT: Subject to compliance with these Terms and payment of the subscription fees, "
        "the Service Provider grants the School a limited, non-exclusive, non-transferable, revocable "
        "license to access and use the platform solely for internal administrative and academic activities."
    ))
    _bullet(pdf, (
        "1.3  The School's administrator accounts are responsible for establishing user credentials and profiles "
        "for teachers, students, and parents. The School represents that it has authorized all registered accounts."
    ))

    # ── SECTION 2 ──
    _section_title(pdf, "2", "Account Security & Prohibited Activities")
    _bullet(pdf, (
        "2.1  SECURITY RESPONSIBILITY: Users are solely responsible for preserving the confidentiality of their "
        "passwords and credentials. The School agrees to assume full responsibility for all activities "
        "occurring under accounts created on its subdomain."
    ))
    _bullet(pdf, (
        "2.2  PROHIBITED ACTIONS: The School and its end users shall not: (a) reverse-engineer, decompile, "
        "duplicate, or translate the source code or proprietary design systems of Skoola; (b) share account "
        "credentials with external parties; (c) execute automated scraping tools, scripts, or spiders; or "
        "(d) upload malicious software or code onto the Platform."
    ))
    _bullet(pdf, (
        "2.3  Oheneba Media reserves the right to immediately suspend any individual account that violates "
        "these conditions or threatens platform-wide data security."
    ))

    # ── SECTION 3 ──
    _section_title(pdf, "3", "Subscription Terms & Financial Obligations")
    _bullet(pdf, (
        "3.1  ANNUAL PLAN: The platform is licensed on an annual subscription basis. Active licenses, "
        "cloud database hosting, and technical support require renewal every twelve (12) months."
    ))
    _bullet(pdf, (
        "3.2  PILOT IMPLEMENTATION: In accordance with the Pilot Program Agreement, new schools enter a 3-month "
        "pilot program. Setup requires a minimum fifty percent (50%) upfront payment. The final fifty percent "
        "(50%) balance must be cleared by the end of the 3-month pilot."
    ))
    _bullet(pdf, (
        "3.3  LATE PAYMENTS: Failure to settle invoices by due dates will trigger automatic billing notifications. "
        "Outstanding balances remaining unpaid after designated deadlines will lead to temporary account suspension."
    ))

    # ── SECTION 4 ──
    _section_title(pdf, "4", "System Uptime, SLA & Maintenance")
    _bullet(pdf, (
        "4.1  UPTIME TARGET: Oheneba Media targets a ninety-nine point five percent (99.5%) system uptime "
        "for Skoola services during normal school hours."
    ))
    _bullet(pdf, (
        "4.2  SCHEDULED MAINTENANCE: Routine server maintenance, database optimization, and feature updates "
        "will be scheduled during off-peak hours (usually between 12:00 AM and 4:00 AM GMT) to avoid disrupting "
        "school activities. Notification will be posted on the admin portal for major outages."
    ))
    _bullet(pdf, (
        "4.3  SLA EXCLUSIONS: Uptime calculations exclude interruptions caused by: (a) national internet network "
        "disruptions in Ghana; (b) failures of the School's local local networks or hardware; or (c) force "
        "majeure circumstances (e.g., power grid failure, natural disasters)."
    ))

    # ── SECTION 5 ──
    _section_title(pdf, "5", "Intellectual Property Ownership")
    _bullet(pdf, (
        "5.1  PROPRIETARY RIGHTS: All code, user interfaces, branding assets, logos, graphic elements, "
        "compiled databases, and structural designs associated with Skoola are owned solely and exclusively "
        "by Mr. Oheneba Michael Baah and Oheneba Media."
    ))
    _bullet(pdf, (
        "5.2  TRADEMARK USE: The School agrees not to display or use the 'Skoola' trademarks, logos, or "
        "Oheneba Media branding elements without prior written consent from the Service Provider."
    ))

    # ── SECTION 6 ──
    _section_title(pdf, "6", "Client Data Ownership & Rights")
    _bullet(pdf, (
        "6.1  CLIENT DATA: The School retains all rights, title, and ownership of academic records, grades, "
        "student profiles, payroll documents, and student data entered onto the Skoola platform."
    ))
    _bullet(pdf, (
        "6.2  PROCESSING LICENSE: The School grants Oheneba Media a non-exclusive, worldwide, royalty-free "
        "license to host, transmit, copy, format, and display the Client Data strictly to provide, maintain, "
        "and support the subscription services."
    ))
    _bullet(pdf, (
        "6.3  CONSENTS: The School is solely responsible for ensuring that all necessary student and parental "
        "consents are secured in compliance with the Ghana Data Protection Act 2012 before data upload."
    ))

    # ── SECTION 7 ──
    _section_title(pdf, "7", "Suspension, Grace Period, & Permanent Deletion")
    _bullet(pdf, (
        "7.1  SUSPENSION: If the second installment payment is missed or annual renewal fees are unpaid, "
        "access to the School subdomain will be suspended."
    ))
    _bullet(pdf, (
        "7.2  GRACE PERIOD: The Service Provider will keep the School database safe and backed up for a grace "
        "period of thirty (30) calendar days from the date of suspension."
    ))
    _bullet(pdf, (
        "7.3  PERMANENT DELETION: If the School fails to clear outstanding invoices or reach a written compromise "
        "within the 30-day grace period, Oheneba Media reserves the right to terminate the account "
        "permanently and wipe all databases, backups, and configurations without liability."
    ))

    # ── SECTION 8 ──
    _section_title(pdf, "8", "Warranty Disclaimer")
    _bullet(pdf, (
        "8.1  THE SOFTWARE IS PROVIDED ON AN 'AS IS' AND 'AS AVAILABLE' BASIS. THE SERVICE PROVIDER "
        "DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF "
        "MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT."
    ))
    _bullet(pdf, (
        "8.2  We do not warrant that the Platform will be entirely free of errors or that access will be "
        "completely uninterrupted. The School assumes all risks for its administrative calculations and reports."
    ))

    # ── SECTION 9 ──
    _section_title(pdf, "9", "Limitation of Liability & Indemnity")
    _bullet(pdf, (
        "9.1  LIMITATION: In no event shall the Service Provider or its proprietor, Mr. Oheneba Michael Baah, "
        "be liable for any indirect, special, punitive, exemplary, or consequential damages (including loss "
        "of data or school operational interruptions)."
    ))
    _bullet(pdf, (
        "9.2  CAP: The Service Provider's maximum aggregate financial liability under this Agreement is strictly "
        "limited to the actual subscription fees paid by the School during the twelve (12) months preceding the claim."
    ))
    _bullet(pdf, (
        "9.3  INDEMNIFICATION: The School agrees to defend, indemnify, and hold harmless the Service Provider "
        "from any claims, losses, or legal liabilities arising from the School's failure to verify grading data, "
        "regulatory non-compliance, or privacy violations by school administrators."
    ))

    # ── SECTION 10 ──
    _section_title(pdf, "10", "Governing Law & Dispute Resolution")
    _bullet(pdf, (
        "10.1  GOVERNING LAW: These Terms and any dispute arising out of them shall be governed by, interpreted, "
        "and enforced in accordance with the laws of the Republic of Ghana."
    ))
    _bullet(pdf, (
        "10.2  ARBITRATION: Any controversy, claim, or dispute arising under these Terms shall first be "
        "submitted to good-faith mediation. If mediation fails, it shall be resolved by binding arbitration "
        "under the Alternative Dispute Resolution Act, 2010 (Act 798) of Ghana, to be conducted in Accra."
    ))
    _bullet(pdf, (
        "10.3  ENTIRE AGREEMENT: These Terms, together with the Pilot Program Agreement and Privacy Policy, "
        "form the complete and exclusive agreement between the parties regarding Skoola usage."
    ))
    pdf.ln(5)

    # ── OUTPUT ──
    out_path = os.path.join(
        r"c:\Users\inspy\OneDrive\Documents\school",
        "Skoola_Terms_of_Service.pdf"
    )
    pdf.output(out_path)
    print(f"PDF generated successfully: {out_path}")


if __name__ == "__main__":
    build_pdf()
