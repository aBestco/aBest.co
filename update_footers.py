import os
import re

cookie_translations = {
    'en': 'Cookie Policy',
    'de': 'Cookie-Richtlinie',
    'es': 'Política de Cookies',
    'tr': 'Çerez Politikası',
    'zh': 'Cookie 政策',
    'hi': 'कुकी नीति',
    'ar': 'سياسة الكوكيز',
    'fr': 'Politique relative aux cookies',
    'ru': 'Политика использования файлов cookie',
    'pt': 'Política de Cookies',
    'ur': 'کوکی پالیسی',
    'ku': 'Siyaseta Cookie',
    'he': 'מדיניות קוקיז',
    'hy': 'Քուքիներ',
    'root': 'Cookie Policy'
}

updated_count = 0
skipped_count = 0
warning_count = 0

for root_dir, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.relpath(os.path.join(root_dir, file), '.')
            if "node_modules" in filepath or ".git" in filepath:
                continue
            
            parts = filepath.split('/')
            lang = parts[0] if len(parts) > 1 and parts[0] in cookie_translations else 'root'
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            href_target = f"/{lang}/terms.html" if lang != 'root' else "/terms.html"
            cookie_href = f"/{lang}/cookie-policy.html" if lang != 'root' else "/cookie-policy.html"
            
            if cookie_href in content:
                print(f"Skipping {filepath} - Cookie policy link already present")
                skipped_count += 1
                continue
                
            text = cookie_translations.get(lang, 'Cookie Policy')
            cookie_link_html = f'\n                <span class="footer-separator">|</span>\n                <a href="{cookie_href}" class="footer-link">{text}</a>'
            
            pattern = re.compile(r'(<a href="' + re.escape(href_target) + r'"[^>]*>.*?</a>)', re.DOTALL)
            
            if pattern.search(content):
                new_content = pattern.sub(r'\1' + cookie_link_html, content, count=1)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
                updated_count += 1
            else:
                print(f"Warning: Terms link not found in {filepath} (looked for {href_target})")
                warning_count += 1

print(f"\nDone! Updated: {updated_count}, Skipped: {skipped_count}, Warnings: {warning_count}")
