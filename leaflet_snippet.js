
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
