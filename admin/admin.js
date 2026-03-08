let inquiries = [];
let adminUsers = [];
let adminDocs = [];
let currentView = 'dashboard';
let currentRole = 'superadmin';
let currentInquiryId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!checkToken()) return;
    loadData();
    loadUsers();
    loadDocs();
    // Read URL to activate correct view on deep-link
    var _adminPath = window.location.pathname;
    var _adminMatch = _adminPath.match(/^\/admin\/(.+)$/);
    var _initView = _adminMatch ? _adminMatch[1] : 'dashboard';
    var _validAdminViews = ['dashboard','idee','investor','miete','kauf','kontakt','users','docs'];
    if (!_validAdminViews.includes(_initView)) _initView = 'dashboard';
    switchView(_initView, true);
    updateRole();
});

window.addEventListener('popstate', function(e) {
    var s = e.state;
    if (s && s.view) switchView(s.view, true);
});

function checkToken() {
    const token = localStorage.getItem('aBest_session');
    if (!token) {
        window.location.href = '/de/'; // Redirect to home to login
        return false;
    }
    return true;
}

// Load data from API
async function loadData() {
    try {
        const token = localStorage.getItem('aBest_session');
        const response = await fetch('/api/inquiries', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('aBest_session');
            window.location.href = '/de/';
            return;
        }

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

// Load users from API
async function loadUsers() {
    try {
        const token = localStorage.getItem('aBest_session');
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            adminUsers = await response.json();
            updateStats(); // Update stats once users are loaded
            if (currentView === 'users') renderTable();
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load documents from API
async function loadDocs() {
    try {
        const token = localStorage.getItem('aBest_session');
        const response = await fetch('/api/docs', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            adminDocs = await response.json();
            if (currentView === 'docs') renderTable();
        }
    } catch (error) {
        console.error('Error loading docs:', error);
    }
}

function saveData() {
    localStorage.setItem('abest_inquiries', JSON.stringify(inquiries));
}

function updateStats() {
    const counts = { 'Idee': 0, 'Investor': 0, 'Miete': 0, 'Kauf': 0, 'In Prüfung': 0 };
    inquiries.forEach(i => {
        if (counts[i.type] !== undefined) counts[i.type]++;
        if (i.status === 'In Prüfung') counts['In Prüfung']++;
    });

    document.getElementById('stat-ideen').innerText = counts['Idee'];
    document.getElementById('stat-investoren').innerText = adminUsers.length || 0; // Show real user count
    document.getElementById('stat-mieten').innerText = counts['Miete'];
    document.getElementById('stat-kaufen').innerText = counts['Kauf'];
    document.getElementById('stat-pruefung').innerText = counts['In Prüfung'];
}

function switchView(view, _noPush) {
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
    if (!_noPush) {
        var _vSlug = view === 'dashboard' ? '' : view;
        history.pushState({view: view}, '', _vSlug ? '/admin/' + _vSlug : '/admin');
    }
}

function renderTable() {
    const tbody = document.getElementById('table-body');
    const statusFilter = document.getElementById('filter-status').value;
    const searchFilter = document.getElementById('search-box').value.toLowerCase();

    tbody.innerHTML = '';

    let filtered = inquiries;
    const theadTr = document.querySelector('.admin-table thead tr');

    if (currentView === 'users') {
        theadTr.innerHTML = `<th>Name</th><th>E-Mail</th><th>Rolle</th><th>Letzter Login</th><th>Status</th><th>Aktion</th>`;

        if (adminUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">Keine Benutzer gefunden.</td></tr>';
            return;
        }

        tbody.innerHTML = adminUsers.map(u => `<tr>
            <td><strong>${u.name}</strong></td>
            <td><a href="mailto:${u.email}" style="color:var(--primary-blue)">${u.email}</a></td>
            <td>${u.role}</td>
            <td>${u.lastLogin || '-'}</td>
            <td><span class="status-badge ${u.status === 'Aktiv' ? 'bg-erledigt' : 'bg-abgelehnt'}">${u.status}</span></td>
            <td><button class="glass-button ripple" style="padding: 4px 10px; font-size: 0.8rem;" onclick="openUserMessages('${u.email}', '${u.name}')">Nachrichten</button></td>
        </tr>`).join('');
        return;
    } else if (currentView === 'docs') {
        theadTr.innerHTML = `<th>Dateiname</th><th>Typ</th><th>Größe</th><th>Datum</th><th>Hochgeladen von</th>`;

        if (adminDocs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px;">Keine Dokumente gefunden.</td></tr>';
            return;
        }

        tbody.innerHTML = adminDocs.map(d => {
            const date = new Date(d.date).toLocaleDateString();
            return `<tr>
                <td><strong>📄 ${d.name}</strong></td>
                <td>${d.type}</td>
                <td>${d.size}</td>
                <td>${date}</td>
                <td>${d.owner}</td>
            </tr>`;
        }).join('');
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
        const token = localStorage.getItem('aBest_session');
        const response = await fetch(`/api/inquiries/${currentInquiryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });

        if (response.status === 401) {
            localStorage.removeItem('aBest_session');
            window.location.href = '/de/';
            return;
        }

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

// --- MESSAGING LOGIC FOR ADMIN ---
async function openUserMessages(email, name) {
    document.getElementById('modal-title').innerText = `Nachrichten: ${name}`;
    document.getElementById('save-btn').style.display = 'none'; // hide general save button
    document.getElementById('modal-status').disabled = true; // disable status

    let detailsHtml = `
        <div id="admin-message-thread" style="max-height: 350px; overflow-y: auto; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 15px;">
            <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">Lade Nachrichten...</div>
        </div>
        <div style="display: flex; gap: 10px;">
            <input type="text" id="admin-new-message-input" class="search-input" placeholder="Antwort schreiben..." style="flex: 1; padding: 10px;" />
            <button class="glass-button ripple" id="admin-send-message-btn" onclick="sendAdminMessage('${email}', '${name}')" style="padding: 10px 15px;">Senden</button>
        </div>
    `;
    document.getElementById('modal-body').innerHTML = detailsHtml;
    document.getElementById('detail-modal').classList.add('active');

    loadAdminMessages(email, name);
}

async function loadAdminMessages(email, name) {
    const token = localStorage.getItem('aBest_session');
    if (!token) return;

    try {
        const res = await fetch(`/api/messages/${email}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Nachrichten konnten nicht geladen werden.');

        const messages = await res.json();
        const thread = document.getElementById('admin-message-thread');

        if (thread) {
            if (messages.length === 0) {
                thread.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">Keine Nachrichten im Verlauf.</div>';
            } else {
                thread.innerHTML = messages.map(msg => {
                    const isAdmin = msg.sender === 'admin';
                    const align = isAdmin ? 'right' : 'left';
                    const bg = isAdmin ? 'var(--primary-blue)' : 'rgba(255,255,255,0.1)';
                    const date = new Date(msg.timestamp).toLocaleString();
                    const senderName = isAdmin ? 'Du (Admin)' : name;
                    return `
                        <div style="text-align: ${align}; margin-bottom: 10px;">
                            <div style="display: inline-block; padding: 10px 15px; border-radius: 8px; background: ${bg}; max-width: 80%; text-align: left;">
                                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7); margin-bottom: 4px;">${senderName} - ${date}</div>
                                <div>${msg.text}</div>
                            </div>
                        </div>
                    `;
                }).join('');
                thread.scrollTop = thread.scrollHeight;
            }
        }
    } catch (err) {
        console.error('Error loading admin messages:', err);
    }
}

async function sendAdminMessage(targetEmail, targetName) {
    const token = localStorage.getItem('aBest_session');
    const input = document.getElementById('admin-new-message-input');
    const btn = document.getElementById('admin-send-message-btn');
    if (!token || !input || !input.value.trim()) return;

    const text = input.value.trim();
    const originalText = btn.innerText;
    btn.innerText = '...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text, targetUser: targetEmail })
        });

        if (res.ok) {
            input.value = '';
            loadAdminMessages(targetEmail, targetName);
        } else {
            alert('Nachricht konnte nicht gesendet werden.');
        }
    } catch (err) {
        console.error('Error sending message as admin:', err);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}
