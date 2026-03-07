import os
import glob

base_dir = "."

attribution_text_de = "<p style=\"margin-top: 1rem;\"><strong>Kartendaten und Ortssuche über OpenStreetMap / Nominatim.</strong></p>\n                "
attribution_text_en = "<p style=\"margin-top: 1rem;\"><strong>Map data and location search via OpenStreetMap / Nominatim.</strong></p>\n                "

changed_files = 0

for filepath in glob.glob(f"{base_dir}/**/impressum.html", recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '/en/' in filepath:
        attr_text = attribution_text_en
    else:
        attr_text = attribution_text_de

    if "OpenStreetMap / Nominatim" not in content:
        # Looking at impressum.html, a safe place is right before the end of the glass-panel div
        insert_marker = '</div>\n            </section>\n            <!-- Spacing'
        
        if insert_marker in content:
            new_content = content.replace(insert_marker, f'{attr_text}{insert_marker}')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
            changed_files += 1
        else:
            print(f"Could not find insert marker in {filepath}")

print(f"Total files updated: {changed_files}")
