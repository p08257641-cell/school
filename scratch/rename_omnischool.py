import re

def rename_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace OmniSchool with Skoola
    # Replace OMNISCHOOL with SKOOLA
    updated = content.replace('OmniSchool', 'Skoola')
    updated = updated.replace('OMNISCHOOL', 'SKOOLA')
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(updated)
    print(f"Updated {filepath}")

if __name__ == '__main__':
    rename_in_file(r'src/lib/LanguageContext.tsx')
    rename_in_file(r'src/components/AdminModules.tsx')
