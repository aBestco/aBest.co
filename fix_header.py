import os
import re

folders = ['en', 'es', 'de', 'tr']

for folder in folders:
    for filename in os.listdir(folder):
        if filename.endswith(".html"):
            filepath = os.path.join(folder, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remove the language switcher from the header.
            pattern = re.compile(r'\s*<div class="language-switcher"[^>]*>.*?</div>\s*</div>\s*(?=<div class="nav-icon" id="menu-btn">)', re.DOTALL)
            content = pattern.sub('\n            ', content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                
print("Header switchers removed.")
