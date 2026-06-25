import os
import re
import markdown
from fpdf import FPDF

class SkoolaAgreementPDF(FPDF):
    def header(self):
        # Draw a beautiful branded 4mm indigo strip at the absolute top of all pages (excluding cover page)
        if self.page_no() > 1:
            self.set_fill_color(79, 70, 229)  # Brand Indigo: #4f46e5
            self.rect(0, 0, 210, 4, 'F')
            
            # Running header text
            self.set_y(8)
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(156, 163, 175)
            self.cell(0, 10, 'Skoola by Decorum IT Solutions - Pilot Program Agreement', align='R')
            self.ln(12)

    def footer(self):
        if self.page_no() > 1:
            self.set_y(-15)
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(156, 163, 175)
            self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')

def clean_unsupported_characters(text):
    replacements = {
        '\u2014': ' - ',
        '\u2013': ' - ',
        '\u201c': '"',
        '\u201d': '"',
        '\u2018': "'",
        '\u2019': "'",
        '\u2022': '* ',
        '\u2026': '...',
        'GH₵': 'GHS ',
        '₵': 'GHS ',
        '–': ' - ',
        '—': ' - ',
        '“': '"',
        '”': '"',
        '‘': "'",
        '’': "'",
    }
    for char, rep in replacements.items():
        text = text.replace(char, rep)
    return text.encode('latin-1', 'replace').decode('latin-1')

def main():
    md_filepath = r"c:\Users\inspy\OneDrive\Documents\school\scratch\pilot_agreement.md"
    pdf_filepath = r"c:\Users\inspy\OneDrive\Documents\school\Skoola_Pilot_Program_Agreement.pdf"

    print(f"Reading markdown file: {md_filepath}")
    with open(md_filepath, 'r', encoding='utf-8') as f:
        md_content = f.read()

    md_content = re.sub(r'>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]', r'> **\1:**', md_content)

    print("Converting Markdown to HTML...")
    html_content = markdown.markdown(md_content, extensions=['extra', 'codehilite'])

    # Style elements
    html_content = html_content.replace('<h1>', '<h1 style="color: #4f46e5; font-family: Helvetica; font-weight: bold; font-size: 18px; margin-top: 15px; margin-bottom: 10px; text-align: center;">')
    html_content = html_content.replace('<h2>', '<h2 style="color: #111827; font-family: Helvetica; font-weight: bold; font-size: 13px; margin-top: 15px; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px;">')
    html_content = html_content.replace('<h3>', '<h3 style="color: #374151; font-family: Helvetica; font-weight: bold; font-size: 11px; margin-top: 10px; margin-bottom: 5px;">')
    html_content = html_content.replace('<p>', '<p style="color: #374151; font-family: Helvetica; font-size: 10px; line-height: 1.4; margin-bottom: 8px;">')
    html_content = html_content.replace('<li>', '<li style="color: #374151; font-family: Helvetica; font-size: 10px; margin-bottom: 3px;">')
    
    html_content = clean_unsupported_characters(html_content)

    print(f"Compiling PDF: {pdf_filepath}")
    pdf = SkoolaAgreementPDF()
    pdf.alias_nb_pages()
    
    # Cover Page
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)
    
    # Header block
    pdf.set_fill_color(31, 41, 55)
    pdf.rect(0, 0, 210, 75, 'F')
    pdf.set_fill_color(79, 70, 229)
    pdf.rect(0, 75, 210, 6, 'F')
    
    pdf.set_y(28)
    pdf.set_font('Helvetica', 'B', 36)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 15, "Skoola", align='C')
    pdf.ln(15)
    
    pdf.set_y(105)
    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(17, 24, 39)
    pdf.multi_cell(0, 10, "PILOT PROGRAM & SERVICE AGREEMENT", align='C')
    
    pdf.ln(8)
    pdf.set_font('Helvetica', 'I', 11)
    pdf.set_text_color(107, 114, 128)
    pdf.multi_cell(0, 6, "Official Pilot Phase Contract & Annual Subscription Agreement", align='C')
    
    pdf.ln(12)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(79, 70, 229)
    pdf.cell(0, 8, "SOFTWARE OWNER: MR. OHENEBA MICHAEL BAAH", align='C')
    
    pdf.set_y(245)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(31, 41, 55)
    pdf.cell(0, 5, "DEVELOPED BY DECORUM IT SOLUTIONS", align='C')
    pdf.ln(5)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 5, "Official Business Agreement | Version 2026.1", align='C')
    
    # Content Page(s)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", size=10)
    pdf.set_text_color(55, 65, 81)
    
    pdf.write_html(html_content)
    
    pdf.output(pdf_filepath)
    print("Agreement PDF generated successfully.")

if __name__ == '__main__':
    main()
