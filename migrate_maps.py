import os
import re
import glob

# The directory to search, assuming executed from /Users/alanbest/Projekte/aBest.co
base_dir = "."

# Pattern to find Google Maps iframes and capture the query "q=..."
# e.g. <iframe ... src="https://maps.google.com/maps?q=Turkey&amp;t=m&amp;z=5&amp;ie=UTF8&amp;iwloc=&amp;output=embed"></iframe>
iframe_pattern = re.compile(
    r'<iframe\s+.*?src="https://maps\.google\.com/maps\?q=([^&]+).*?".*?></iframe>', 
    re.IGNORECASE | re.DOTALL
)

# Strings to inject into <head> for Leaflet
leaflet_css = '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>'
leaflet_js = '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>'

changed_files = 0

for filepath in glob.glob(f"{base_dir}/**/*.html", recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if the file contains the Google Maps iframe
    if iframe_pattern.search(content):
        # 1. Replace the iframe with the new OSM div container, replacing '+' with ' ' in the query
        def replace_iframe(match):
            query = match.group(1).replace('+', ' ')
            return f'<div class="osm-map" data-query="{query}" style="width: 100%; height: 400px; border-radius: 12px; z-index: 1;"></div>'
            
        new_content = iframe_pattern.sub(replace_iframe, content)

        # 2. Inject Leaflet into the <head> section if not already present
        if '<link rel="stylesheet" href="https://unpkg.com/leaflet' not in new_content:
            head_end = new_content.find('</head>')
            if head_end != -1:
                injection = f'    <!-- Leaflet for OpenStreetMap -->\n    {leaflet_css}\n    {leaflet_js}\n'
                new_content = new_content[:head_end] + injection + new_content[head_end:]

        # Write the modified content back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"Updated {filepath}")
        changed_files += 1

print(f"Total files updated: {changed_files}")
