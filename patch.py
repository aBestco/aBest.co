import os
import re

folders = ['en', 'es', 'de', 'tr']

for folder in folders:
    for filename in os.listdir(folder):
        if filename.endswith(".html"):
            filepath = os.path.join(folder, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract the language switcher block
            # It starts with <div class="language-switcher"...> and ends with </div> just before <div class="nav-icon" id="menu-btn">
            pattern = re.compile(r'(\s*<div class="language-switcher".*?</div>\s*</div>\s*)(?=<div class="nav-icon" id="menu-btn">)', re.DOTALL)
            match = pattern.search(content)
            
            if match:
                switcher_block = match.group(1)
                
                # Remove inline margin-right: 20px;
                switcher_block = switcher_block.replace('margin-right: 20px;', '')
                
                # Remove it from the header
                content = content.replace(switcher_block, '\n            ')
                
                # Insert it into the footer exactly between <div class="footer-links">...</div> and <p class="copyright">
                footer_pattern = re.compile(r'(</div>\s*)(<p class="copyright">)')
                # Format block suitably
                clean_block = switcher_block.strip()
                replacement = r'\1' + '    ' + clean_block + '\n                ' + r'\2'
                content = footer_pattern.sub(replacement, content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Patched {filepath}")
