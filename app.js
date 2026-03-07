document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Logic
    const menuBtn = document.getElementById('menu-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            mobileNav.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuBtn.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // 2. Sticky Glass Header Logic
    const header = document.querySelector('.app-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('sticky');
            } else {
                header.classList.remove('sticky');
            }
        });
    }

    // 3. Scroll Animations (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const animateOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    // Initial load animations (remove inline animation-delay logic and use class toggle instead)
    document.querySelectorAll('.fade-in-up').forEach((el, index) => {
        // We set transition delay dynamically instead of inline HTML styling to make it scalable
        el.style.transitionDelay = `${index * 0.15}s`;
        animateOnScroll.observe(el);
    });

    // 4. Cursor Spotlight Effect for Glass Cards
    const interactiveCards = document.querySelectorAll('.interactive');
    interactiveCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set CSS variables for the spotlight position on each card
            card.style.setProperty('--spotlight-x', `${x}px`);
            card.style.setProperty('--spotlight-y', `${y}px`);
        });
    });

    // 5. Button Ripple Effect
    document.body.addEventListener('click', function (e) {
        if (e.target.classList.contains('ripple')) {
            const button = e.target;
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripples = document.createElement('span');
            ripples.style.left = x + 'px';
            ripples.style.top = y + 'px';
            ripples.classList.add('ripple-effect');
            button.appendChild(ripples);

            setTimeout(() => {
                ripples.remove()
            }, 600);
        }
    });

    // 6. Modal Logic (mostly used in Project pages)
    const modal = document.getElementById('project-modal');
    const modalClose = document.getElementById('modal-close');
    const modalBody = document.getElementById('modal-body');
    const exploreBtn = document.querySelector('.js-explore-btn');

    const openModal = (content) => {
        if (!modal || !modalBody) return;
        modalBody.innerHTML = content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            const projectTitle = document.querySelector('.featured-header h3').innerText;
            const projectTags = document.querySelector('.project-tags').innerText;
            const projectImg = document.querySelector('.image-preview img').src;

            const content = `
                <img src="${projectImg}" alt="${projectTitle}" style="width:100%; border-radius:16px; margin-bottom:1.5rem;">
                <h2 style="margin-bottom:0.5rem;">${projectTitle}</h2>
                <p style="color:var(--text-accent); margin-bottom:1rem;">${projectTags}</p>
                <p>Detailed project insights: This flagship development incorporates state-of-the-art infrastructure. The project emphasizes sustainable architecture and modern urban lifestyle.</p>
                <div class="divider" style="margin: 1.5rem 0;"></div>
                <button class="glass-button ripple" onclick="location.reload()">Back to Dashboard</button>
            `;
            openModal(content);
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
});

// Language Switcher Logic
function setLang(lang) {
    localStorage.setItem('aBest_lang', lang);
}

document.addEventListener('click', function (event) {
    var isClickInsideBtn = event.target.closest('.lang-btn');
    var isClickInsideDropdown = event.target.closest('.lang-dropdown');

    // Select all dropdowns (though usually only one is visible)
    var dropdowns = document.querySelectorAll('.lang-dropdown');

    dropdowns.forEach(function (dropdown) {
        if (isClickInsideBtn && dropdown.previousElementSibling === event.target) {
            // Toggle the clicked one
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
                setTimeout(() => dropdown.classList.remove('show'), 10);
            } else {
                dropdown.style.display = 'block';
                setTimeout(() => dropdown.classList.add('show'), 10);
            }
        } else if (!isClickInsideDropdown) {
            // Close if clicked outside
            dropdown.classList.remove('show');
            setTimeout(() => dropdown.style.display = 'none', 300); // Wait for transition
        }
    });
});

// Contact Form Logic
function handleContactSubmit(event) {
    event.preventDefault();

    var form = event.target;
    var btn = form.querySelector('button[type="submit"]');
    var originalText = btn.innerText;

    btn.innerText = "...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    var name = form.querySelector('#name').value;
    var email = form.querySelector('#email').value;
    var message = form.querySelector('#message').value;

    fetch("https://formsubmit.co/ajax/i@aBest.co", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            email: email,
            message: message
        })
    })
        .then(response => response.json())
        .then(data => {
            btn.innerText = "✓";
            btn.style.background = "rgba(40, 167, 69, 0.4)";

            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = "";
                btn.style.opacity = "1";
                btn.disabled = false;
                form.reset();
            }, 4000);
        })
        .catch(error => {
            btn.innerText = "Error";
            btn.style.background = "rgba(220, 53, 69, 0.4)";

            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = "";
                btn.style.opacity = "1";
                btn.disabled = false;
            }, 4000);
        });
}

// 7. OpenStreetMap Initialization (Leaflet + Nominatim Geocoding)
const osmMaps = document.querySelectorAll('.osm-map');

if (osmMaps.length > 0 && typeof L !== 'undefined') {
    osmMaps.forEach(mapDiv => {
        const query = mapDiv.getAttribute('data-query');
        if (!query) return;

        // Free OSM Nominatim API to get coordinates from the query string
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const lat = data[0].lat;
                    const lon = data[0].lon;

                    // Initialize Leaflet map
                    const map = L.map(mapDiv, {
                        zoomControl: false // optional, gives a cleaner look like the google map embed
                    }).setView([lat, lon], 12);

                    // Use standard OSM tiles
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(map);

                    // Add a pin/marker
                    L.marker([lat, lon]).addTo(map);

                    // Optionally add zoom controls manually if you want them styled differently
                    L.control.zoom({
                        position: 'bottomright'
                    }).addTo(map);
                } else {
                    console.error('Nominatim found no results for:', query);
                    mapDiv.innerHTML = '<p style="text-align:center; padding-top:180px;">Map location not found.</p>';
                }
            })
            .catch(err => {
                console.error('Error fetching map data:', err);
            });
    });
}
