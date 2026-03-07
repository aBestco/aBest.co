import os
import re

folders = ['en', 'es', 'de', 'tr']

for folder in folders:
    for filename in os.listdir(folder):
        if filename.endswith(".html"):
            filepath = os.path.join(folder, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Clean up inline styles for language-switcher
            content = re.sub(r'<div class="language-switcher" style="[^"]*">', '<div class="language-switcher">', content)
            
            # Clean up inline styles for lang-btn
            content = re.sub(r'<button class="lang-btn" style="[^"]*"([^>]*)>', r'<button class="lang-btn"\1>', content)
            
            # Clean up inline styles for lang-dropdown
            content = re.sub(r'<div id="lang-dropdown" class="lang-dropdown" style="[^"]*">', '<div id="lang-dropdown" class="lang-dropdown">', content)
            
            # Clean up inline styles for lang-dropdown anchor tags
            content = re.sub(r'<a href="([^"]*)" style="display: block; padding: 10px 16px; color: white; text-decoration: none; border-bottom: 1px solid rgba\(255,255,255,0\.05\);">', r'<a href="\1">', content)
            content = re.sub(r'<a href="([^"]*)" style="display: block; padding: 10px 16px; color: white; text-decoration: none;">', r'<a href="\1">', content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                
print("Inline styles cleaned.")
