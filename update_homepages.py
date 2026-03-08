import os
import re

# Configuration
LANGUAGES = ["en", "de", "tr", "es", "zh", "hi", "ar", "fr", "ru", "pt", "ur", "ku", "he", "hy"]
BASE_DIR = "/Users/alanbest/Projekte/aBest.co"

# Content Translations (Simplified for this script - in a real scenario we'd use a full dict)
CONTENT = {
    "de": {
        "hero_h1": 'Strategic Projects, Real Estate &<br /><span class="highlight">Business Opportunities</span>',
        "hero_subtext": 'aBest.co verbindet Ideen, Investoren, Immobilien und Geschäftsmöglichkeiten auf internationalen Märkten.',
        "btn_idea": "Projekt einreichen",
        "btn_investor": "Als Investor anfragen",
        "btn_rent": "Mieten",
        "btn_buy": "Kaufen",
        "btn_contact": "Kontakt",
        "about_title": "Über uns",
        "about_text": "aBest.co ist eine Plattform für strategische Projekte, Geschäftsentwicklung, Immobilienchancen und internationale Partnerschaften. Wir prüfen Ideen, verbinden passende Kontakte und begleiten ausgewählte Möglichkeiten.",
        "areas_title": "Unsere Bereiche",
        "area1_title": "Idee einreichen",
        "area1_text": "Für Projektideen & strategische Partnerschaften (Investor gesucht)",
        "area2_title": "Als Investor",
        "area2_text": "Für Investoren an unseren Projekten oder Grundstücken",
        "area3_title": "Mieten",
        "area3_text": "Immobilien oder Gewerbeflächen für Ihre Firma mieten",
        "area4_title": "Kaufen",
        "area4_text": "Immobilien, Grundstücke oder Beteiligungen erwerben",
        "projects_title": "Ausgewählte Projekte & Chancen",
        "contact_title": "Direkter Kontakt",
        "contact_subtitle": "Wir freuen uns über Ihre Anfrage – direkt und ohne Hürden."
    },
    "en": {
        "hero_h1": 'Strategic Projects, Real Estate &<br /><span class="highlight">Business Opportunities</span>',
        "hero_subtext": 'aBest.co connects ideas, investors, properties and business opportunities across international markets.',
        "btn_idea": "Submit Project",
        "btn_investor": "Investor Inquiry",
        "btn_rent": "Rent",
        "btn_buy": "Buy",
        "btn_contact": "Contact",
        "about_title": "About Us",
        "about_text": "aBest.co is a platform for strategic projects, business development, real estate opportunities, and international partnerships. We evaluate ideas, connect the right people, and support selected opportunities.",
        "areas_title": "Our Focus Areas",
        "area1_title": "Submit Idea",
        "area1_text": "For project ideas & strategic partnerships (Investor wanted)",
        "area2_title": "As Investor",
        "area2_text": "For investors interested in our projects or properties",
        "area3_title": "Rent",
        "area3_text": "Rent properties or commercial spaces for your company",
        "area4_title": "Buy",
        "area4_text": "Acquire real estate, land or project participations",
        "projects_title": "Featured Projects & Opportunities",
        "contact_title": "Quick Contact",
        "contact_subtitle": "We welcome your inquiry – direct and without barriers."
    }
    # Other languages would follow or use English as fallback
}

def update_index(lang):
    file_path = os.path.join(BASE_DIR, lang, "ideen.html")
    if lang == "": # Root index
        file_path = os.path.join(BASE_DIR, "ideen.html")
        lang = "en"
    
    if not os.path.exists(file_path):
        print(f"Skipping {lang}: {file_path} not found")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Use German or English based on availability
    l_data = CONTENT.get(lang, CONTENT["en"])

    # 1. Update Hero
    hero_pattern = r'<section class="hero fade-in-up".*?</section>'
    new_hero = f'''<section class="hero fade-in-up" style="animation-delay: 0.2s;">
                <div class="hero-content glass-chip">
                    <h1>{l_data["hero_h1"]}</h1>
                    <p class="subtext">{l_data["hero_subtext"]}</p>
                    <div class="hero-actions mt-2" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px;">
                        <a href="/{lang}/partnerschaften.html" class="glass-button ripple" style="width: auto; padding: 12px 24px; font-size: 0.9rem;">{l_data["btn_idea"]}</a>
                        <a href="/{lang}/partnerschaften.html" class="glass-button ripple" style="width: auto; padding: 12px 24px; font-size: 0.9rem;">{l_data["btn_investor"]}</a>
                        <a href="/{lang}/partnerschaften.html" class="glass-button ripple" style="width: auto; padding: 12px 24px; font-size: 0.9rem;">{l_data["btn_rent"]}</a>
                        <a href="/{lang}/partnerschaften.html" class="glass-button ripple" style="width: auto; padding: 12px 24px; font-size: 0.9rem;">{l_data["btn_buy"]}</a>
                        <a href="/{lang}/kontakt.html" class="glass-button ripple" style="width: auto; padding: 12px 24px; font-size: 0.9rem;">{l_data["btn_contact"]}</a>
                    </div>
                </div>
            </section>'''
    content = re.sub(hero_pattern, new_hero, content, flags=re.DOTALL)

    # 2. Add About Us Section (if not exists)
    if 'id="about-section"' not in content:
        about_html = f'''
            <!-- About Section -->
            <section id="about-section" class="section-spacing fade-in-up" style="animation-delay: 0.3s;">
                <div class="glass-panel">
                    <h2>{l_data["about_title"]}</h2>
                    <div class="divider mt-2"></div>
                    <p>{l_data["about_text"]}</p>
                </div>
            </section>'''
        # Insert after Hero
        content = content.replace('<!-- Countries Row -->', about_html + '\n            <!-- Countries Row -->')

    # 3. Replace Countries Row with Areas Row
    areas_pattern = r'<!-- Countries Row -->.*?<section class="countries fade-in-up".*?</section>'
    new_areas = f'''<!-- Business Areas -->
            <section class="countries fade-in-up" style="animation-delay: 0.4s;">
                <div class="glass-card country-card" onclick="location.href='/{lang}/partnerschaften.html'" style="cursor: pointer; height: auto; padding: 30px 20px; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 15px;">💡</div>
                    <h3 style="margin-bottom: 10px;">{l_data["area1_title"]}</h3>
                    <p style="font-size: 0.85rem;">{l_data["area1_text"]}</p>
                </div>
                <div class="glass-card country-card" onclick="location.href='/{lang}/partnerschaften.html'" style="cursor: pointer; height: auto; padding: 30px 20px; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 15px;">🤝</div>
                    <h3 style="margin-bottom: 10px;">{l_data["area2_title"]}</h3>
                    <p style="font-size: 0.85rem;">{l_data["area2_text"]}</p>
                </div>
                <div class="glass-card country-card" onclick="location.href='/{lang}/partnerschaften.html'" style="cursor: pointer; height: auto; padding: 30px 20px; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 15px;">🔑</div>
                    <h3 style="margin-bottom: 10px;">{l_data["area3_title"]}</h3>
                    <p style="font-size: 0.85rem;">{l_data["area3_text"]}</p>
                </div>
                <div class="glass-card country-card" onclick="location.href='/{lang}/partnerschaften.html'" style="cursor: pointer; height: auto; padding: 30px 20px; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 15px;">🏢</div>
                    <h3 style="margin-bottom: 10px;">{l_data["area4_title"]}</h3>
                    <p style="font-size: 0.85rem;">{l_data["area4_text"]}</p>
                </div>
            </section>'''
    content = re.sub(areas_pattern, new_areas, content, flags=re.DOTALL)

    # 4. Projects Section
    if 'id="projects-section"' not in content:
        projects_html = f'''
            <!-- Projects Section -->
            <section id="projects-section" class="section-spacing fade-in-up" style="animation-delay: 0.5s;">
                <div class="glass-panel">
                    <h2>{l_data["projects_title"]}</h2>
                    <div class="divider mt-2"></div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                        <div class="glass-card" style="overflow: hidden; border-radius: 16px;">
                            <img src="/assets/images/project_land.webp" alt="Land Development" style="width: 100%; height: 160px; object-fit: cover; opacity: 0.8;">
                            <div style="padding: 15px;">
                                <h4 style="margin-bottom: 5px; color: var(--text-main);">Land Development</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted);">Strategic suburban and urban expansion projects.</p>
                            </div>
                        </div>
                        <div class="glass-card" style="overflow: hidden; border-radius: 16px;">
                            <img src="/assets/images/project_hospitality.webp" alt="Hospitality" style="width: 100%; height: 160px; object-fit: cover; opacity: 0.8;">
                            <div style="padding: 15px;">
                                <h4 style="margin-bottom: 5px; color: var(--text-main);">Hospitality</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted);">Luxury resorts and boutique hotel developments.</p>
                            </div>
                        </div>
                        <div class="glass-card" style="overflow: hidden; border-radius: 16px;">
                            <img src="/assets/images/project_commercial.webp" alt="Commercial Real Estate" style="width: 100%; height: 160px; object-fit: cover; opacity: 0.8;">
                            <div style="padding: 15px;">
                                <h4 style="margin-bottom: 5px; color: var(--text-main);">Commercial Properties</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted);">Modern office spaces and retail centers.</p>
                            </div>
                        </div>
                        <div class="glass-card" style="overflow: hidden; border-radius: 16px;">
                            <img src="/assets/images/project_tech.png" alt="Future Technology &amp; AI" style="width: 100%; height: 160px; object-fit: cover; opacity: 0.8;">
                            <div style="padding: 15px;">
                                <h4 style="margin-bottom: 5px; color: var(--text-main);">Future Technology &amp; AI</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted);">Investments in innovation, artificial intelligence, and global digital ecosystems.</p>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px;">
                        <div class="glass-chip" style="padding: 10px 15px; border-radius: 10px; font-size: 0.8rem; font-weight: 500;">Strategic Partnerships</div>
                        <div class="glass-chip" style="padding: 10px 15px; border-radius: 10px; font-size: 0.8rem; font-weight: 500;">International Opportunities</div>
                        <div class="glass-chip" style="padding: 10px 15px; border-radius: 10px; font-size: 0.8rem; font-weight: 500;">Energy Infrastructure</div>
                    </div>
                </div>
            </section>'''
        # Insert before Contact/Partnership
        content = content.replace('<!-- Contact / Partnership Section -->', projects_html + '\n            <!-- Contact / Partnership Section -->')
    else:
        # Update existing section if needed - for now, we'll just skip if it exists for speed, 
        # but in turbo we want it re-applied if we have new assets.
        # Let's forcibly replace the section if it's already there to ensure new visuals.
        projects_old_pattern = r'<!-- Projects Section -->.*?<section id="projects-section".*?</section>'
        projects_html_update = f'''<!-- Projects Section -->
            <section id="projects-section" class="section-spacing fade-in-up" style="animation-delay: 0.5s;">
                <div class="glass-panel">
                    <h2>{l_data["projects_title"]}</h2>
                    <div class="divider mt-2"></div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                        <div class="glass-card" style="overflow: hidden; border-radius: 16px;">
                            <img src="/assets/images/project_land.webp" alt="Land Development" style="width: 100%; height: 160px; object-fit: cover; opacity: 0.8; transition: transform 0.5s;">
                            <div style="padding: 15px;">
                                <h4 style="margin-bottom: 5px; color: var(--text-main);">Land Development</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted);">Strategic suburban and urban expansion projects.</p>
                            </div>
                        </div>
                        <div class="glass-card" style="overflow: hidden; border-radius: 16px;">
                            <img src="/assets/images/project_hospitality.webp" alt="Hospitality" style="width: 100%; height: 160px; object-fit: cover; opacity: 0.8; transition: transform 0.5s;">
                            <div style="padding: 15px;">
                                <h4 style="margin-bottom: 5px; color: var(--text-main);">Hospitality</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted);">Luxury resorts and boutique hotel developments.</p>
                            </div>
                        </div>
                        <div class="glass-card" style="overflow: hidden; border-radius: 16px;">
                            <img src="/assets/images/project_commercial.webp" alt="Commercial Real Estate" style="width: 100%; height: 160px; object-fit: cover; opacity: 0.8; transition: transform 0.5s;">
                            <div style="padding: 15px;">
                                <h4 style="margin-bottom: 5px; color: var(--text-main);">Commercial Properties</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted);">Modern office spaces and retail centers.</p>
                            </div>
                        </div>
                        <div class="glass-card" style="overflow: hidden; border-radius: 16px;">
                            <img src="/assets/images/project_tech.png" alt="Future Technology &amp; AI" style="width: 100%; height: 160px; object-fit: cover; opacity: 0.8; transition: transform 0.5s;">
                            <div style="padding: 15px;">
                                <h4 style="margin-bottom: 5px; color: var(--text-main);">Future Technology &amp; AI</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted);">Investments in innovation, artificial intelligence, and global digital ecosystems.</p>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px;">
                        <div class="glass-chip" style="padding: 10px 15px; border-radius: 10px; font-size: 0.8rem; font-weight: 500;">Strategic Partnerships</div>
                        <div class="glass-chip" style="padding: 10px 15px; border-radius: 10px; font-size: 0.8rem; font-weight: 500;">International Opportunities</div>
                        <div class="glass-chip" style="padding: 10px 15px; border-radius: 10px; font-size: 0.8rem; font-weight: 500;">Energy Infrastructure</div>
                    </div>
                </div>
            </section>'''
        content = re.sub(projects_old_pattern, projects_html_update, content, flags=re.DOTALL)

    # 5. Direct Contact Section (Update existing footer panel)
    contact_pattern = r'<section class="section-spacing fade-in-up" style="animation-delay: 0.4s;">.*?<div class="glass-panel text-center">.*?<h2>.*?</h2>.*?<div class="divider mt-2"></div>.*?<p.*?>.*?</p>.*?<a.*?</a>.*?</div>.*?</section>'
    new_contact = f'''<section id="final-contact" class="section-spacing fade-in-up" style="animation-delay: 0.6s;">
                <div class="glass-panel text-center">
                    <h2>{l_data["contact_title"]}</h2>
                    <div class="divider mt-2"></div>
                    <p style="margin-bottom: 1.5rem;">{l_data["contact_subtitle"]}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
                        <a class="glass-button ripple" href="/{lang}/kontakt.html" style="text-decoration: none; width: auto; padding: 14px 28px;">
                            Anfrage senden
                        </a>
                        <a class="glass-button ripple" href="mailto:i@aBest.co" style="text-decoration: none; width: auto; padding: 14px 28px;">
                            i@aBest.co
                        </a>
                    </div>
                </div>
            </section>'''
    content = re.sub(contact_pattern, new_contact, content, flags=re.DOTALL)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {lang} ideen.html")

# Run updates
update_index("") # Root
for l in LANGUAGES:
    update_index(l)
