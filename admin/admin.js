let inquiries = [];
let currentView = 'dashboard';
let currentRole = 'superadmin';
let currentInquiryId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    switchView('dashboard');
    updateRole();
});

// Load data from API
async function loadData() {
    try {
        const response = await fetch('/api/inquiries');
        if (!response.ok) throw new Error('Failed to load inquiries');

        inquiries = await response.json();
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback for demonstration if API fails
        const ls = localStorage.getItem('abest_inquiries');
        if (ls) {
            inquiries = JSON.parse(ls);
        } else {
            inquiries = [
                { id: '101', type: 'Idee', name: 'Max Mustermann', company: 'TechNova GmbH', email: 'max@technova.de', phone: '+49 170 1234567', location: 'Berlin', category: 'Technologie', budget: '500.000 EUR', message: 'Wir suchen einen Partner für unser neues KI-Startup.', looking_for: 'Investor', size: '', date: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'Neu', notes: '' }
            ];
        }
    }
    updateStats();
    if (currentView) switchView(currentView); // Refresh table
}

function saveData() {
    localStorage.setItem('abest_inquiries', JSON.stringify(inquiries));
}

function updateStats() {
    const statIdeen = inquiries.filter(i => i.type === 'Idee' && i.status === 'Neu').length;
    const statInvestoren = inquiries.filter(i => i.type === 'Investor' && i.status === 'Neu').length;
    const statMieten = inquiries.filter(i => i.type === 'Miete' && ['Neu', 'In Prüfung'].includes(i.status)).length;
    const statKaufen = inquiries.filter(i => i.type === 'Kauf' && ['Neu', 'In Prüfung'].includes(i.status)).length;
    const statPruefung = inquiries.filter(i => i.status === 'In Prüfung').length;

    document.getElementById('stat-ideen').innerText = statIdeen;
    document.getElementById('stat-investoren').innerText = statInvestoren;
    document.getElementById('stat-mieten').innerText = statMieten;
    document.getElementById('stat-kaufen').innerText = statKaufen;
    document.getElementById('stat-pruefung').innerText = statPruefung;
}

function switchView(view) {
    currentView = view;

    // Update Sidebar UI
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (activeItem) activeItem.classList.add('active');

    // Update Title
    const titles = {
        'dashboard': 'Dashboard Übersicht',
        'idee': 'Ideen & Projekte',
        'investor': 'Registrierte Investoren',
        'miete': 'Mietanfragen',
        'kauf': 'Kaufanfragen',
        'kontakt': 'Allgemeine Kontaktanfragen',
        'users': 'Benutzerverwaltung (Demo)',
        'docs': 'Dokumente & Uploads'
    };
    document.getElementById('topbar-title').innerText = titles[view] || 'Dashboard';

    document.getElementById('table-title').innerText = view === 'dashboard' ? 'Alle aktuellen Anfragen' : titles[view];

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }

    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('table-body');
    const statusFilter = document.getElementById('filter-status').value;
    const searchFilter = document.getElementById('search-box').value.toLowerCase();

    tbody.innerHTML = '';

    let filtered = inquiries;
    const theadTr = document.querySelector('.admin-table thead tr');

    if (currentView === 'users') {
        theadTr.innerHTML = `<th>Name</th><th>E-Mail</th><th>Rolle</th><th>Letzter Login</th><th>Status</th>`;
        const mockUsers = [
            { name: "Alan Best", email: "alan@abest.co", role: "Superadmin", status: "Aktiv", lastLogin: "Heute, 10:45" },
            { name: "Michael Schmidt", email: "m.schmidt@abest.co", role: "Manager", status: "Aktiv", lastLogin: "Gestern, 15:30" },
            { name: "Sarah Wagner", email: "s.wagner@abest.co", role: "Viewer", status: "Inaktiv", lastLogin: "Vor 5 Tagen" }
        ];
        tbody.innerHTML = mockUsers.map(u => `<tr>
            <td><strong>${u.name}</strong></td>
            <td><a href="mailto:${u.email}" style="color:var(--primary-blue)">${u.email}</a></td>
            <td>${u.role}</td>
            <td>${u.lastLogin}</td>
            <td><span class="status-badge ${u.status === 'Aktiv' ? 'bg-erledigt' : 'bg-abgelehnt'}">${u.status}</span></td>
        </tr>`).join('');
        return;
    } else if (currentView === 'docs') {
        theadTr.innerHTML = `<th>Dateiname</th><th>Typ</th><th>Größe</th><th>Datum</th><th>Hochgeladen von</th>`;
        const mockDocs = [
            { name: "Pitch Deck 2026.pdf", type: "PDF", size: "4.2 MB", date: "05.03.2026", owner: "Alan Best" },
            { name: "Investor_Relations_Q1.xlsx", type: "Excel", size: "1.1 MB", date: "01.03.2026", owner: "Michael Schmidt" },
            { name: "NDAs_Templates.zip", type: "Archiv", size: "8.5 MB", date: "28.02.2026", owner: "System" }
        ];
        tbody.innerHTML = mockDocs.map(d => `<tr>
            <td><strong>📄 ${d.name}</strong></td>
            <td>${d.type}</td>
            <td>${d.size}</td>
            <td>${d.date}</td>
            <td>${d.owner}</td>
        </tr>`).join('');
        return;
    } else {
        // Default headers for inquiries
        theadTr.innerHTML = `<th>Typ</th><th>Name / Firma</th><th>Kategorie / Ort</th><th>Datum</th><th>Status</th>`;
    }

    // View Filter
    if (currentView !== 'dashboard') {
        const typeMap = { 'idee': 'Idee', 'investor': 'Investor', 'miete': 'Miete', 'kauf': 'Kauf', 'kontakt': 'Kontakt' };
        if (typeMap[currentView]) {
            filtered = filtered.filter(i => (i.type && i.type === typeMap[currentView]) || (currentView === 'kontakt' && !i.type));
        } else {
            // views without real data yet
            filtered = [];
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px;">In diesem Bereich gibt es noch keine Daten.</td></tr>';
            return;
        }
    }

    // Status Filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(i => i.status === statusFilter);
    }

    // Search Filter
    if (searchFilter) {
        filtered = filtered.filter(i =>
            (i.name && i.name.toLowerCase().includes(searchFilter)) ||
            (i.company && i.company.toLowerCase().includes(searchFilter)) ||
            (i.location && i.location.toLowerCase().includes(searchFilter))
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px;">Keine Anfragen gefunden.</td></tr>';
        return;
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    filtered.forEach(item => {
        const d = new Date(item.date);
        const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

        let statusClass = 'bg-neu';
        if (item.status === 'In Prüfung') statusClass = 'bg-pruefung';
        if (item.status === 'Interessant') statusClass = 'bg-interessant';
        if (item.status === 'Abgelehnt') statusClass = 'bg-abgelehnt';
        if (item.status === 'Erledigt') statusClass = 'bg-erledigt';

        const tr = document.createElement('tr');
        tr.onclick = () => openModal(item.id);
        tr.innerHTML = `
            <td><strong>${item.type}</strong></td>
            <td>${item.name}<br><span style="font-size:0.8rem;color:var(--text-muted);">${item.company || '-'}</span></td>
            <td>${item.category || '-'}<br><span style="font-size:0.8rem;color:var(--text-muted);">${item.location}</span></td>
            <td>${dateStr}</td>
            <td><span class="status-badge ${statusClass}">${item.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function openModal(id) {
    const inquiry = inquiries.find(i => i.id === id);
    if (!inquiry) return;

    currentInquiryId = id;

    const d = new Date(inquiry.date);
    const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

    let detailsHtml = `
        <div class="detail-row"><div class="detail-label">Anfragetyp & Datum</div><div class="detail-value">${inquiry.type} - eingegangen am ${dateStr}</div></div>
        <div class="detail-row"><div class="detail-label">Name & Firma</div><div class="detail-value">${inquiry.name} ${inquiry.company ? `(${inquiry.company})` : ''}</div></div>
        <div class="detail-row"><div class="detail-label">Kontakt</div><div class="detail-value">E-Mail: <a href="mailto:${inquiry.email}" style="color:var(--primary-blue)">${inquiry.email}</a><br>Telefon: ${inquiry.phone || '-'}</div></div>
        <div class="detail-row"><div class="detail-label">Ort / Region</div><div class="detail-value">${inquiry.location || '-'}</div></div>
        <div class="detail-row"><div class="detail-label">Kategorie / Branche</div><div class="detail-value">${inquiry.category || '-'}</div></div>
        <div class="detail-row"><div class="detail-label">Budget / Größe</div><div class="detail-value">Budget: ${inquiry.budget || '-'}<br>Größe: ${inquiry.size || '-'}</div></div>
        <div class="detail-row"><div class="detail-label">Gesucht / Anforderung</div><div class="detail-value">${inquiry.looking_for || '-'}</div></div>
        <div class="detail-row"><div class="detail-label">Nachricht / Beschreibung</div><div class="detail-value" style="white-space: pre-wrap;">${inquiry.message || '-'}</div></div>
        <div class="detail-row">
            <div class="detail-label">Interne Notizen</div>
            <textarea id="modal-notes" class="notes-area" placeholder="Interne Bemerkungen (nur für Admin/Manager sichtbar)...">${inquiry.notes || ''}</textarea>
        </div>
    `;

    document.getElementById('modal-body').innerHTML = detailsHtml;
    document.getElementById('modal-status').value = inquiry.status;

    // Check Role
    if (currentRole === 'viewer') {
        document.getElementById('modal-status').disabled = true;
        document.getElementById('modal-notes').disabled = true;
        document.getElementById('save-btn').style.display = 'none';
    } else {
        document.getElementById('modal-status').disabled = false;
        document.getElementById('modal-notes').disabled = false;
        document.getElementById('save-btn').style.display = 'block';
    }

    document.getElementById('detail-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('detail-modal').classList.remove('active');
    currentInquiryId = null;
}

async function saveDetails() {
    if (currentRole === 'viewer') return;

    const inquiry = inquiries.find(i => i.id === currentInquiryId);
    if (!inquiry) return;

    const newStatus = document.getElementById('modal-status').value;
    const newNotes = document.getElementById('modal-notes').value;

    const updates = { status: newStatus, notes: newNotes };

    try {
        const response = await fetch(`/api/inquiries/${currentInquiryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!response.ok) throw new Error('Failed to save inquiry');

        // Update local state
        inquiry.status = newStatus;
        inquiry.notes = newNotes;

        updateStats();
        renderTable();
        closeModal();
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Fehler beim Speichern der Daten. Bitte versuchen Sie es später erneut.');

        // Fallback: save to localStorage if API fails
        inquiry.status = newStatus;
        inquiry.notes = newNotes;
        saveData();
        updateStats();
        renderTable();
        closeModal();
    }
}

function updateRole() {
    currentRole = document.getElementById('role-select').value;
    if (currentInquiryId) {
        openModal(currentInquiryId); // refresh modal permissions if open
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}
