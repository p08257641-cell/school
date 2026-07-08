import os
import re
import markdown
from fpdf import FPDF

class SkoolaPDF(FPDF):
    def header(self):
        # Draw a beautiful branded 4mm indigo strip at the absolute top of all pages (excluding cover page)
        if self.page_no() > 1:
            self.set_fill_color(79, 70, 229)  # Brand Indigo: #4f46e5
            self.rect(0, 0, 210, 4, 'F')
            
            # Running header text
            self.set_y(8)
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(156, 163, 175)
            self.cell(0, 10, 'Skoola by Oheneba Media - Reference Guide', align='R')
            self.ln(12)

    def footer(self):
        if self.page_no() > 1:
            self.set_y(-15)
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(156, 163, 175)
            # Page number cell
            self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')

def clean_unsupported_characters(text):
    replacements = {
        '\u2014': ' - ',  # em dash
        '\u2013': ' - ',  # en dash
        '\u201c': '"',    # smart left double quote
        '\u201d': '"',    # smart right double quote
        '\u2018': "'",    # smart left single quote
        '\u2019': "'",    # smart right single quote
        '\u2022': '* ',   # bullet point
        '\u2026': '...',  # ellipsis
        'GH₵': 'GHS ',    # Ghana Cedi
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

def compile_pdf(md_filepath, pdf_filepath, doc_title, doc_subtitle):
    print(f"Reading markdown file: {md_filepath}")
    with open(md_filepath, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Pre-clean markdown (remove complex mermaid blocks and custom HTML containers)
    md_content = re.sub(r'```mermaid[\s\S]*?```', '[System Flow Diagram - Refer to Playbook Source]', md_content)
    md_content = re.sub(r'>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]', r'> **\1:**', md_content)

    print("Converting Markdown to HTML...")
    html_content = markdown.markdown(
        md_content,
        extensions=['extra', 'codehilite']
    )

    # Style elements slightly for cleaner FPDF rendering with modern colors and sizes
    # Answers (the body <p> tag text) styled in a sleek 10.5pt charcoal gray for maximum readability
    html_content = html_content.replace('<h1>', '<h1 style="color: #4f46e5; font-family: Helvetica; font-weight: bold; font-size: 20px; margin-top: 15px; margin-bottom: 10px;">')
    html_content = html_content.replace('<h2>', '<h2 style="color: #111827; font-family: Helvetica; font-weight: bold; font-size: 14px; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">')
    html_content = html_content.replace('<h3>', '<h3 style="color: #374151; font-family: Helvetica; font-weight: bold; font-size: 12px; margin-top: 10px; margin-bottom: 5px;">')
    html_content = html_content.replace('<p>', '<p style="color: #374151; font-family: Helvetica; font-size: 10.5px; line-height: 1.5; margin-bottom: 10px;">')
    html_content = html_content.replace('<li>', '<li style="color: #374151; font-family: Helvetica; font-size: 10.5px; margin-bottom: 3px;">')
    
    # Run the Unicode cleanup
    html_content = clean_unsupported_characters(html_content)

    print(f"Compiling PDF: {pdf_filepath}")
    pdf = SkoolaPDF()
    pdf.alias_nb_pages()
    
    # --- 1. COVER PAGE ---
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)
    
    # Top decorative block on cover (Sleek dark brand block)
    pdf.set_fill_color(31, 41, 55)  # Dark slate gray: #1f2937
    pdf.rect(0, 0, 210, 75, 'F')
    
    # Bottom decorative accent bar (Indigo)
    pdf.set_fill_color(79, 70, 229)  # Brand Indigo: #4f46e5
    pdf.rect(0, 75, 210, 6, 'F')
    
    # Title on cover block
    pdf.set_y(28)
    pdf.set_font('Helvetica', 'B', 36)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 15, "Skoola", align='C')
    pdf.ln(15)
    
    # Cover page middle area
    pdf.set_y(105)
    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(17, 24, 39)
    pdf.multi_cell(0, 10, doc_title.upper(), align='C')
    
    pdf.ln(8)
    pdf.set_font('Helvetica', 'I', 11)
    pdf.set_text_color(107, 114, 128)
    pdf.multi_cell(0, 6, doc_subtitle, align='C')
    
    # PROMINENT OWNER DISCLOSURE AT COVER CENTER
    pdf.ln(12)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(79, 70, 229)
    pdf.cell(0, 8, "OWNER & PROPRIETOR: OHENEBA MICHAEL BAAH", align='C')
    
    # Bottom metadata on cover
    pdf.set_y(245)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(31, 41, 55)
    pdf.cell(0, 5, "PUBLISHED BY OHENEBA MEDIA", align='C')
    pdf.ln(5)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 5, "Official Enterprise Reference | Version 2026.1", align='C')
    
    # --- 2. CONTENT PAGES ---
    # Re-enable auto page breaks for standard body text
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Split content by H2 to inject clean page breaks before each main section
    sections = html_content.split('<h2>')
    for i, sec in enumerate(sections):
        if not sec.strip():
            continue
        
        pdf.add_page()
        pdf.set_font("Helvetica", size=10.5)
        pdf.set_text_color(55, 65, 81)
        
        if i > 0:
            # Re-wrap in h2 tag
            sec = '<h2>' + sec
            
        pdf.write_html(sec)
        
    # Output file
    pdf.output(pdf_filepath)
    print(f"Successfully generated PDF: {pdf_filepath}\n")

if __name__ == '__main__':
    base_dir = r"c:\Users\inspy\OneDrive\Documents\school"
    artifact_dir = r"C:\Users\inspy\.gemini\antigravity\brain\eb252566-5a01-4d23-bcf9-63b8244b3aa6"
    
    faq_md = os.path.join(artifact_dir, "skoola_faq_pdf.md")
    playbook_md = os.path.join(artifact_dir, "decorum_marketing_playbook.md")
    
    faq_pdf = os.path.join(base_dir, "Skoola_FAQ_Official_Reference.pdf")
    playbook_pdf = os.path.join(base_dir, "Skoola_Strategic_Marketing_Playbook.pdf")
    
    # Compile FAQ
    if os.path.exists(faq_md):
        try:
            compile_pdf(
                faq_md, 
                faq_pdf, 
                "Frequently Asked Questions (FAQ)", 
                "Official Product Reference & Administrative Guide"
            )
        except Exception as e:
            print(f"Failed to compile FAQ PDF: {e}")

    # Compile Playbook
    if os.path.exists(playbook_md):
        try:
            compile_pdf(
                playbook_md, 
                playbook_pdf, 
                "Strategic Marketing Playbook", 
                "The Ultimate Strategy to Market, Sell, and Scale the Skoola Platform"
            )
        except Exception as e:
            print(f"Failed to compile Playbook PDF: {e}")
