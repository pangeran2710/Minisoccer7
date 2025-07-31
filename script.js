// Data awal kosong (akan dimuat dari localStorage)
let players = [];
let transactions = [];
let events = []; // Tambahkan array untuk events
let currentEditingPlayer = null;
let currentEditingTransaction = null;
let currentEditingEvent = null; // Tambahkan variabel untuk event

// Nama key untuk localStorage
const PLAYERS_KEY = 'minisoccerPlayers';
const TRANSACTIONS_KEY = 'minisoccerTransactions';
const EVENTS_KEY = 'minisoccerEvents'; // Tambahkan key untuk events

// --- Fungsi Penyimpanan Local Storage ---

// Simpan data ke localStorage
function saveDataToLocalStorage() {
    try {
        localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
        localStorage.setItem(EVENTS_KEY, JSON.stringify(events)); // Simpan events
        console.log("Data saved to localStorage");
    } catch (e) {
        console.error("Failed to save data to localStorage", e);
        alert("Gagal menyimpan data. Pastikan browser Anda mendukung localStorage dan tidak dalam mode private/incognito.");
    }
}

// Muat data dari localStorage
function loadDataFromLocalStorage() {
    try {
        const playersData = localStorage.getItem(PLAYERS_KEY);
        const transactionsData = localStorage.getItem(TRANSACTIONS_KEY);
        const eventsData = localStorage.getItem(EVENTS_KEY); // Muat events

        if (playersData) {
            players = JSON.parse(playersData);
            // Konversi string boolean ke boolean asli jika diperlukan
            players = players.map(p => ({
                ...p,
                paid: p.paid === true || p.paid === 'true',
                amount: parseInt(p.amount) || 0
            }));
        } else {
            // Data dummy awal jika localStorage kosong
            players = [
                { id: 1, name: 'Ahmad Fauzi', phone: '081234567890', team: 'Tim A', amount: 50000, paid: true, paymentMethod: 'BCA', paymentDate: '2024-01-15' },
                { id: 2, name: 'Budi Santoso', phone: '081234567891', team: 'Tim B', amount: 50000, paid: false, paymentMethod: null, paymentDate: null },
                { id: 3, name: 'Citra Dewi', phone: '081234567892', team: 'Tim C', amount: 50000, paid: true, paymentMethod: 'DANA', paymentDate: '2024-01-16' }
            ];
        }

        if (transactionsData) {
            transactions = JSON.parse(transactionsData);
             // Konversi amount ke integer jika diperlukan
            transactions = transactions.map(t => ({
                ...t,
                amount: parseInt(t.amount) || 0
            }));
        } else {
            // Data dummy awal jika localStorage kosong
            transactions = [
                { id: 1, type: 'income', source: 'Pembayaran Pemain - Ahmad Fauzi', amount: 100000, method: 'BCA', date: '2024-01-15', description: 'Bayar lapangan' },
                { id: 2, type: 'expense', source: 'Sewa Lapangan', amount: 75000, method: 'DANA', date: '2024-01-16', description: 'Sewa lapangan futsal' },
                { id: 3, type: 'income', source: 'Pembayaran Pemain - Citra Dewi', amount: 50000, method: 'DANA', date: '2024-01-17', description: 'Bayar lapangan' }
            ];
        }
        
        // Muat events
        if (eventsData) {
            events = JSON.parse(eventsData);
        } else {
            events = [];
        }
        
        console.log("Data loaded from localStorage");
    } catch (e) {
        console.error("Failed to load data from localStorage", e);
        alert("Gagal memuat data dari penyimpanan lokal.");
        // Gunakan data dummy jika gagal memuat
        players = [];
        transactions = [];
        events = []; // Inisialisasi events kosong
    }
}


// --- Fungsi CRUD yang Dimodifikasi ---

// Simpan atau Update Player
function savePlayerLocally(playerData) {
    if (currentEditingPlayer && currentEditingPlayer.id) {
        // Update existing player
        const oldPlayer = players.find(p => p.id === playerData.id);
        players = players.map(p => p.id === playerData.id ? playerData : p);
        
        // Handle payment status change for transactions
        if (playerData.paid && (!oldPlayer.paid || oldPlayer.paid === 'false')) {
            addPlayerPaymentToTransactions(playerData);
        } else if (!playerData.paid && (oldPlayer.paid === 'true' || oldPlayer.paid === true)) {
            removePlayerPaymentFromTransactions(playerData.id);
        }
    } else {
        // Add new player
        const newId = players.length > 0 ? Math.max(...players.map(p => p.id)) + 1 : 1;
        playerData.id = newId;
        players.push(playerData);
        
        // If paid, add to transactions
        if (playerData.paid) {
            addPlayerPaymentToTransactions(playerData);
        }
    }
    saveDataToLocalStorage();
    renderPlayers();
    updatePlayerStats();
    renderTransactions();
    updateFinanceSummary();
    renderEvents(); // Render ulang events karena data pemain berubah
}

// Simpan atau Update Transaction
function saveTransactionLocally(transactionData) {
    if (currentEditingTransaction && currentEditingTransaction.id) {
        // Update existing transaction
        transactions = transactions.map(t => t.id === transactionData.id ? transactionData : t);
    } else {
        // Add new transaction
        const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
        transactionData.id = newId;
        transactions.push(transactionData);
    }
    saveDataToLocalStorage();
    renderTransactions();
    updateFinanceSummary();
}

// Hapus Player
function deletePlayerLocally(id) {
    // Hapus transaksi terkait dulu
    removePlayerPaymentFromTransactions(id);
    
    // Hapus pemain
    players = players.filter(p => p.id !== id);
    saveDataToLocalStorage();
    renderPlayers();
    updatePlayerStats();
    renderTransactions();
    updateFinanceSummary();
    renderEvents(); // Render ulang events karena data pemain berubah
}

// Hapus Transaction
function deleteTransactionLocally(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveDataToLocalStorage();
    renderTransactions();
    updateFinanceSummary();
}

// --- Fungsi untuk Events ---
// Simpan atau Update Event
function saveEventLocally(eventData) {
    if (currentEditingEvent && currentEditingEvent.id) {
        // Update existing event
        events = events.map(e => e.id === eventData.id ? eventData : e);
    } else {
        // Add new event
        const newId = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1;
        eventData.id = newId;
        events.push(eventData);
    }
    saveDataToLocalStorage();
    renderEvents();
    closeEventModal();
}

// Hapus Event
function deleteEventLocally(id) {
    if (confirm('Apakah Anda yakin ingin menghapus acara ini?')) {
        events = events.filter(e => e.id !== id);
        saveDataToLocalStorage();
        renderEvents();
    }
}

// --- Fungsi yang tetap sama (tidak perlu diubah) ---
// Fungsi seperti addPlayerPaymentToTransactions, removePlayerPaymentFromTransactions,
// renderPlayers, renderTransactions, updatePlayerStats, updateFinanceSummary
// tetap dipertahankan dan bekerja dengan data `players` dan `transactions` yang global.

// Fungsi untuk menambahkan pembayaran pemain ke transaksi
function addPlayerPaymentToTransactions(player) {
    const description = `Pembayaran dari ${player.name} (${player.team})`;
    const cleanDescription = description.trim().replace(/\s+/g, ' ');
    
    const newTransaction = {
        id: transactions.length > 0 ? Math.max(...transactions.map(t => parseInt(t.id) || 0)) + 1 : 1,
        type: 'income',
        source: `Pembayaran Pemain - ${player.name}`,
        amount: player.amount,
        method: player.paymentMethod,
        date: player.paymentDate,
        description: cleanDescription
    };
    transactions.push(newTransaction);
    saveDataToLocalStorage(); // Simpan ke localStorage
}

// Fungsi untuk menghapus pembayaran pemain dari transaksi
function removePlayerPaymentFromTransactions(playerId) {
    const playerName = players.find(p => parseInt(p.id) === playerId)?.name || 'Pemain';
    transactions = transactions.filter(t => 
        !(t.type === 'income' && t.source.includes(`Pembayaran Pemain - ${playerName}`))
    );
    saveDataToLocalStorage(); // Simpan ke localStorage
}

function togglePlayerPayment(id) {
    const player = players.find(p => parseInt(p.id) === id);
    if (!player) return;
    
    if (!player.paid || player.paid === 'false') {
        openPlayerModal({...player, paid: true});
    } else {
        // Untuk toggle ke belum bayar, kita perlu reload dulu untuk menghindari konflik
        openPlayerModal({...player, paid: false, paymentMethod: null, paymentDate: null});
    }
}

function renderPlayers() {
    const tbody = document.getElementById('players-table-body');
    tbody.innerHTML = '';
    
    players.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.team}</td>
            <td>${player.phone}</td>
            <td>Rp ${parseInt(player.amount).toLocaleString()}</td>
            <td>
                <span class="status-badge ${player.paid === 'true' || player.paid === true ? 'status-paid' : 'status-unpaid'}">
                    ${player.paid === 'true' || player.paid === true ? 'Sudah Bayar' : 'Belum Bayar'}
                </span>
            </td>
            <td>
                ${player.paid === 'true' || player.paid === true ? `
                    <span class="payment-method-badge">
                        ${player.paymentMethod}
                    </span>
                ` : '-'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-toggle" onclick="togglePlayerPayment(${player.id})">
                        <i class="fas ${player.paid === 'true' || player.paid === true ? 'fa-times-circle' : 'fa-check-circle'}"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="openPlayerModal(${JSON.stringify(player).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deletePlayer(${player.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updatePlayerStats();
}

function renderTransactions() {
    const tbody = document.getElementById('transactions-table-body');
    tbody.innerHTML = '';

    const sortedTransactions = [...transactions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>
                <span class="status-badge ${transaction.type === 'income' ? 'status-paid' : 'status-unpaid'}">
                    ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </span>
            </td>
            <td>${transaction.source}</td>
            <td class="${transaction.type === 'income' ? 'text-green' : 'text-red'}">
                ${transaction.type === 'income' ? '+' : '-'} Rp ${parseInt(transaction.amount).toLocaleString()}
            </td>
            <td>
                <span class="status-badge status-paid">
                    ${transaction.method}
                </span>
            </td>
            <td>${transaction.description}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-edit" onclick="openTransactionModal(${JSON.stringify(transaction).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updatePlayerStats() {
    const totalPlayers = players.length;
    const paidPlayers = players.filter(p => p.paid === 'true' || p.paid === true).length;
    const unpaidPlayers = totalPlayers - paidPlayers;
    
    document.getElementById('total-players').textContent = totalPlayers;
    document.getElementById('paid-players').textContent = paidPlayers;
    document.getElementById('unpaid-players').textContent = unpaidPlayers;
}

// --- Fungsi updateFinanceSummary yang DIPERBARUI ---
function updateFinanceSummary() {
    // Hitung total
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
    
    const balance = totalIncome - totalExpense;
    
    // Hitung per metode
    // BCA
    const incomeBCA = transactions
        .filter(t => t.type === 'income' && t.method === 'BCA')
        .reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
    
    const expenseBCA = transactions
        .filter(t => t.type === 'expense' && t.method === 'BCA')
        .reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
    
    const balanceBCA = incomeBCA - expenseBCA;
    
    // DANA
    const incomeDANA = transactions
        .filter(t => t.type === 'income' && t.method === 'DANA')
        .reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
    
    const expenseDANA = transactions
        .filter(t => t.type === 'expense' && t.method === 'DANA')
        .reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
    
    const balanceDANA = incomeDANA - expenseDANA;
    
    // Update tampilan rekapitulasi utama
    document.getElementById('total-income').textContent = `Rp ${totalIncome.toLocaleString()}`;
    document.getElementById('total-expense').textContent = `Rp ${totalExpense.toLocaleString()}`;
    document.getElementById('balance').textContent = `Rp ${balance.toLocaleString()}`;
    
    // Update tampilan rekapitulasi per metode (pastikan elemen-elemen ini ada di HTML)
    // Cek apakah elemen ada sebelum mengupdate untuk menghindari error
    const incomeBcaElement = document.getElementById('income-bca');
    const expenseBcaElement = document.getElementById('expense-bca');
    const balanceBcaElement = document.getElementById('balance-bca');
    const incomeDanaElement = document.getElementById('income-dana');
    const expenseDanaElement = document.getElementById('expense-dana');
    const balanceDanaElement = document.getElementById('balance-dana');

    if (incomeBcaElement) incomeBcaElement.textContent = `Rp ${incomeBCA.toLocaleString()}`;
    if (expenseBcaElement) expenseBcaElement.textContent = `Rp ${expenseBCA.toLocaleString()}`;
    if (balanceBcaElement) {
        balanceBcaElement.textContent = `Rp ${balanceBCA.toLocaleString()}`;
        balanceBcaElement.style.color = balanceBCA >= 0 ? '#22c55e' : '#ef4444';
    }
    
    if (incomeDanaElement) incomeDanaElement.textContent = `Rp ${incomeDANA.toLocaleString()}`;
    if (expenseDanaElement) expenseDanaElement.textContent = `Rp ${expenseDANA.toLocaleString()}`;
    if (balanceDanaElement) {
        balanceDanaElement.textContent = `Rp ${balanceDANA.toLocaleString()}`;
        balanceDanaElement.style.color = balanceDANA >= 0 ? '#22c55e' : '#ef4444';
    }

    // Update warna saldo akhir
    const balanceElement = document.getElementById('balance');
    if (balanceElement) {
        balanceElement.style.color = balance >= 0 ? '#22c55e' : '#ef4444';
    }
}

// --- Event Management Functions ---
// Render all events
function renderEvents() {
    const container = document.getElementById('events-container');
    container.innerHTML = '';
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem;">
                <p>Belum ada acara yang ditambahkan.</p>
                <button class="btn btn-primary" id="add-first-event-btn" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Tambah Acara Pertama
                </button>
            </div>
        `;
        document.getElementById('add-first-event-btn').addEventListener('click', () => {
            openEventModal();
        });
        return;
    }
    
    // Urutkan events berdasarkan tanggal (terbaru di atas)
    const sortedEvents = [...events].sort((a, b) => {
        // Jika tanggal sama, urutkan berdasarkan jam
        if (a.date === b.date) {
            return a.time.localeCompare(b.time);
        }
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedEvents.forEach(event => {
        const eventCard = createEventCard(event);
        container.appendChild(eventCard);
    });
}

// Create event card element
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    // Tentukan status acara (akan berlalu atau belum)
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set jam ke 00:00:00 untuk perbandingan tanggal saja
    const isPastEvent = eventDate < today;
    const statusText = isPastEvent ? 'Sudah Berlalu' : 'Akan Datang';
    const statusClass = isPastEvent ? 'status-unpaid' : 'status-paid';
    
    card.innerHTML = `
        <div class="event-card-header">
            <div>
                <h3>${event.venue} - Lapangan ${event.fieldNumber || 'N/A'}</h3>
                <p>${formatDate(event.date)} | ${event.time} | <span class="status-badge ${statusClass}">${statusText}</span></p>
            </div>
            <div class="action-buttons">
                <button class="action-btn btn-edit" onclick="openEventModal(${JSON.stringify(event).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn btn-delete" onclick="deleteEvent(${event.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="event-card-body">
            <div class="event-details-grid">
                <div class="event-detail-item">
                    <span class="event-detail-label">Harga Lapangan</span>
                    <span class="event-detail-value">Rp ${parseInt(event.fieldPrice || 0).toLocaleString()}</span>
                </div>
                <div class="event-detail-item">
                    <span class="event-detail-label">Harga Wasit</span>
                    <span class="event-detail-value">Rp ${parseInt(event.refereePrice || 0).toLocaleString()}</span>
                </div>
                <div class="event-detail-item">
                    <span class="event-detail-label">Harga Fotografer</span>
                    <span class="event-detail-value">Rp ${parseInt(event.photographerPrice || 0).toLocaleString()}</span>
                </div>
                <div class="event-detail-item">
                    <span class="event-detail-label">Harga Air Minum</span>
                    <span class="event-detail-value">Rp ${parseInt(event.drinkPrice || 0).toLocaleString()}</span>
                </div>
                <div class="event-detail-item">
                    <span class="event-detail-label">Total Biaya</span>
                    <span class="event-detail-value">Rp ${parseInt(event.totalPrice || 0).toLocaleString()}</span>
                </div>
            </div>
            
            ${event.description ? `
                <div class="form-group">
                    <label class="event-detail-label">Deskripsi</label>
                    <p>${event.description}</p>
                </div>
            ` : ''}
            
            <div class="event-teams-section">
                <h4>Susunan Tim</h4>
                <div class="event-teams-grid">
                    ${generateTeamSections(event)}
                </div>
            </div>
        </div>
    `;
    return card;
}

// Generate team sections for event (berdasarkan pemain terdaftar)
function generateTeamSections(event) {
    // Pastikan registeredPlayerIds ada dan merupakan array
    const registeredIds = event.registeredPlayerIds && Array.isArray(event.registeredPlayerIds) ? event.registeredPlayerIds : [];
    
    // Filter pemain yang terdaftar untuk acara ini
    const registeredPlayers = players.filter(player => registeredIds.includes(player.id));

    if (registeredPlayers.length === 0) {
        return '<p style="text-align: center; color: #6b7280;">Belum ada pemain yang didaftarkan untuk acara ini.</p>';
    }

    // Group pemain terdaftar by team
    const teams = {};
    registeredPlayers.forEach(player => {
        if (!teams[player.team]) {
            teams[player.team] = [];
        }
        teams[player.team].push(player);
    });

    let teamHtml = '';
    for (const [teamName, teamPlayers] of Object.entries(teams)) {
        teamHtml += `
            <div class="team-card">
                <div class="team-header">${teamName}</div>
                <div class="team-players">
                    ${teamPlayers.map(player => `
                        <div class="team-player-item">
                            <span>${player.name}</span>
                            <span>${player.paid ? '✅ Sudah Bayar' : '❌ Belum Bayar'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    return teamHtml;
}

// Format date for display
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}
// Fungsi untuk menghitung total harga
function calculateTotalPrice() {
    const fieldPrice = parseInt(document.getElementById('event-field-price').value) || 0;
    const refereePrice = parseInt(document.getElementById('event-referee-price').value) || 0;
    const photographerPrice = parseInt(document.getElementById('event-photographer-price').value) || 0;
    const drinkPrice = parseInt(document.getElementById('event-drink-price').value) || 0;

    const totalPrice = fieldPrice + refereePrice + photographerPrice + drinkPrice;
    document.getElementById('total-price').value = totalPrice;
}

// Fungsi untuk mengisi daftar pemain di modal acara
function populatePlayerListForEvent(registeredPlayerIds = []) {
    const playerListContainer = document.getElementById('event-player-list');

    // Pastikan elemen ada
    if (!playerListContainer) {
        console.error("Element with ID 'event-player-list' not found.");
        return;
    }

    // Kosongkan kontainer
    playerListContainer.innerHTML = '';

    if (players.length === 0) {
        playerListContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">Belum ada pemain yang terdaftar.</p>';
        return;
    }

    // Buat daftar pemain dengan checkbox
    const list = document.createElement('ul');
    players.forEach(player => {
        const listItem = document.createElement('li');
        listItem.style.padding = '0.5rem 0';
        listItem.style.borderBottom = '1px solid #e5e7eb';

        // Hapus border bawah untuk item terakhir
        if (player === players[players.length - 1]) {
            listItem.style.borderBottom = 'none';
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `event-player-${player.id}`;
        checkbox.value = player.id;
        checkbox.className = 'event-player-checkbox';
        // Tandai checkbox jika player.id ada di registeredPlayerIds
        if (registeredPlayerIds.includes(player.id)) {
            checkbox.checked = true;
        }

        const label = document.createElement('label');
        label.htmlFor = `event-player-${player.id}`;
        label.textContent = `${player.name} (${player.team})`;
        label.style.marginLeft = '0.5rem';
        label.style.cursor = 'pointer';

        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        list.appendChild(listItem);
    });

    playerListContainer.appendChild(list);
}

// Tambahkan event listener untuk menghitung total harga saat nilai berubah
document.getElementById('event-field-price').addEventListener('input', calculateTotalPrice);
document.getElementById('event-referee-price').addEventListener('input', calculateTotalPrice);
document.getElementById('event-photographer-price').addEventListener('input', calculateTotalPrice);
document.getElementById('event-drink-price').addEventListener('input', calculateTotalPrice);

// Open event modal
function openEventModal(event = null) {
    const modal = document.getElementById('event-modal');
    const title = document.getElementById('event-modal-title');
    const form = document.getElementById('event-form');
    currentEditingEvent = event; // Set current editing event

    // Reset form
    form.reset();
    document.getElementById('event-field-price').value = 0;
    document.getElementById('event-referee-price').value = 0;
    document.getElementById('event-photographer-price').value = 0;
    document.getElementById('event-drink-price').value = 0;
    document.getElementById('total-price').value = 0;

    if (event) {
        title.textContent = 'Edit Detail Acara';
        document.getElementById('event-id').value = event.id;
        document.getElementById('event-date').value = event.date;
        document.getElementById('event-time').value = event.time;
        document.getElementById('event-venue').value = event.venue;
        document.getElementById('event-field-number').value = event.fieldNumber || '';
        document.getElementById('event-field-price').value = event.fieldPrice || 0;
        document.getElementById('event-referee-price').value = event.refereePrice || 0;
        document.getElementById('event-photographer-price').value = event.photographerPrice || 0;
        document.getElementById('event-drink-price').value = event.drinkPrice || 0;
        document.getElementById('event-description').value = event.description || '';
        calculateTotalPrice(); // Hitung total harga saat modal dibuka

        // Isi daftar pemain dan tandai yang sudah terdaftar untuk acara ini
        populatePlayerListForEvent(event.registeredPlayerIds || []);
    } else {
        title.textContent = 'Tambah Detail Acara';
        form.reset();
        document.getElementById('event-field-price').value = 0;
        document.getElementById('event-referee-price').value = 0;
        document.getElementById('event-photographer-price').value = 0;
        document.getElementById('event-drink-price').value = 0;
        // Set tanggal default ke hari ini
        document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
        calculateTotalPrice(); // Hitung total harga saat modal dibuka

        // Isi daftar pemain (tidak ada yang terdaftar awalnya)
        populatePlayerListForEvent([]);
    }

    modal.classList.add('show');
}

// Close event modal
function closeEventModal() {
    document.getElementById('event-modal').classList.remove('show');
    currentEditingEvent = null;
}

// --- DOM Elements ---
const playersTab = document.getElementById('players-tab');
const financeTab = document.getElementById('finance-tab');
const eventsTab = document.getElementById('events-tab'); // Tambahkan events tab
const navButtons = document.querySelectorAll('.nav-button');
const addPlayerBtn = document.getElementById('add-player-btn');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const addEventBtn = document.getElementById('add-event-btn'); // Tambahkan button untuk events
const playerModal = document.getElementById('player-modal');
const transactionModal = document.getElementById('transaction-modal');
const eventModal = document.getElementById('event-modal'); // Tambahkan modal untuk events
const cancelPlayerBtn = document.getElementById('cancel-player-btn');
const cancelTransactionBtn = document.getElementById('cancel-transaction-btn');
const cancelEventBtn = document.getElementById('cancel-event-btn'); // Tambahkan cancel button untuk events
const savePlayerBtn = document.getElementById('save-player-btn');
const saveTransactionBtn = document.getElementById('save-transaction-btn');
const saveEventBtn = document.getElementById('save-event-btn'); // Tambahkan save button untuk events
const playerForm = document.getElementById('player-form');
const transactionForm = document.getElementById('transaction-form');
const eventForm = document.getElementById('event-form'); // Tambahkan form untuk events

// --- Event Listeners ---
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab');
        switchTab(tab);
    });
});

addPlayerBtn.addEventListener('click', () => {
    openPlayerModal();
});

addTransactionBtn.addEventListener('click', () => {
    openTransactionModal();
});

addEventBtn.addEventListener('click', () => { // Tambahkan event listener untuk events
    openEventModal();
});

cancelPlayerBtn.addEventListener('click', () => {
    closePlayerModal();
});

cancelTransactionBtn.addEventListener('click', () => {
    closeTransactionModal();
});

cancelEventBtn.addEventListener('click', () => { // Tambahkan cancel event untuk events
    closeEventModal();
});

savePlayerBtn.addEventListener('click', () => {
    savePlayer();
});

saveTransactionBtn.addEventListener('click', () => {
    saveTransaction();
});

saveEventBtn.addEventListener('click', () => { // Tambahkan save event untuk events
    saveEvent();
});

document.getElementById('player-paid').addEventListener('change', function() {
    const paymentMethodGroup = document.getElementById('payment-method-group');
    const paymentDateGroup = document.getElementById('payment-date-group');
    if (this.checked) {
        paymentMethodGroup.style.display = 'block';
        paymentDateGroup.style.display = 'block';
        if (!document.getElementById('player-payment-date').value) {
            document.getElementById('player-payment-date').value = new Date().toISOString().split('T')[0];
        }
    } else {
        paymentMethodGroup.style.display = 'none';
        paymentDateGroup.style.display = 'none';
    }
});

// --- Functions ---
function switchTab(tabName) {
    // Update active tab
    navButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Show selected tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Refresh data
    if (tabName === 'players') {
        renderPlayers();
    } else if (tabName === 'events') { // Tambahkan kondisi untuk events
        renderEvents();
    } else if (tabName === 'finance') {
        renderTransactions();
        updateFinanceSummary();
    }
}

function openPlayerModal(player = null) {
    currentEditingPlayer = player;
    
    if (player) {
        document.getElementById('player-modal-title').textContent = 'Edit Pemain';
        document.getElementById('player-id').value = player.id;
        document.getElementById('player-name').value = player.name;
        document.getElementById('player-phone').value = player.phone;
        document.getElementById('player-team').value = player.team;
        document.getElementById('player-amount').value = player.amount;
        document.getElementById('player-paid').checked = player.paid === 'true' || player.paid === true;
        
        if (player.paid === 'true' || player.paid === true) {
            document.getElementById('payment-method-group').style.display = 'block';
            document.getElementById('payment-date-group').style.display = 'block';
            document.getElementById('player-payment-method').value = player.paymentMethod || 'BCA';
            document.getElementById('player-payment-date').value = player.paymentDate || new Date().toISOString().split('T')[0];
        } else {
            document.getElementById('payment-method-group').style.display = 'none';
            document.getElementById('payment-date-group').style.display = 'none';
        }
    } else {
        document.getElementById('player-modal-title').textContent = 'Tambah Pemain';
        playerForm.reset();
        document.getElementById('player-amount').value = 40000;
        document.getElementById('payment-method-group').style.display = 'none';
        document.getElementById('payment-date-group').style.display = 'none';
        document.getElementById('player-payment-date').value = new Date().toISOString().split('T')[0];
    }
    
    playerModal.classList.add('show');
}

function closePlayerModal() {
    playerModal.classList.remove('show');
    currentEditingPlayer = null;
}

function openTransactionModal(transaction = null) {
    currentEditingTransaction = transaction;
    
    if (transaction) {
        document.getElementById('transaction-modal-title').textContent = 'Edit Transaksi';
        document.getElementById('transaction-id').value = transaction.id;
        document.getElementById('transaction-type').value = transaction.type;
        document.getElementById('transaction-source').value = transaction.source;
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-method').value = transaction.method;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-description').value = transaction.description;
    } else {
        document.getElementById('transaction-modal-title').textContent = 'Tambah Transaksi';
        transactionForm.reset();
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    }
    
    transactionModal.classList.add('show');
}

function closeTransactionModal() {
    transactionModal.classList.remove('show');
    currentEditingTransaction = null;
}

// --- Fungsi Event Handler yang Dimodifikasi ---

// Simpan Player (dipanggil saat tombol "Simpan" di modal pemain diklik)
function savePlayer() {
    const id = document.getElementById('player-id').value;
    const name = document.getElementById('player-name').value;
    const phone = document.getElementById('player-phone').value;
    const team = document.getElementById('player-team').value;
    const amount = parseInt(document.getElementById('player-amount').value);
    const paid = document.getElementById('player-paid').checked;
    const paymentMethod = paid ? document.getElementById('player-payment-method').value : null;
    const paymentDate = paid ? document.getElementById('player-payment-date').value : null;

    if (!name || !phone || !team || !amount) {
        alert('Mohon isi semua field yang wajib!');
        return;
    }

    if (paid && (!paymentMethod || !paymentDate)) {
        alert('Mohon isi metode pembayaran dan tanggal pembayaran!');
        return;
    }

    const playerData = {
        id: parseInt(id) || 0,
        name: name,
        phone: phone,
        team: team,
        amount: amount,
        paid: paid,
        paymentMethod: paymentMethod,
        paymentDate: paymentDate
    };

    try {
        savePlayerLocally(playerData);
        closePlayerModal();
    } catch (error) {
        console.error('Error saving player:', error);
        alert('Gagal menyimpan data pemain');
    }
}

// Simpan Transaction (dipanggil saat tombol "Simpan" di modal transaksi diklik)
function saveTransaction() {
    const id = document.getElementById('transaction-id').value;
    const type = document.getElementById('transaction-type').value;
    const source = document.getElementById('transaction-source').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const method = document.getElementById('transaction-method').value;
    const date = document.getElementById('transaction-date').value;
    const description = document.getElementById('transaction-description').value.trim().replace(/\s+/g, ' ');

    if (!source || !amount || !date) {
        alert('Mohon isi semua field yang wajib!');
        return;
    }

    const transactionData = {
        id: parseInt(id) || 0,
        type: type,
        source: source,
        amount: amount,
        method: method,
        date: date,
        description: description
    };

    try {
        saveTransactionLocally(transactionData);
        closeTransactionModal();
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Gagal menyimpan transaksi');
    }
}

// Simpan Event (dipanggil saat tombol "Simpan" di modal event diklik)
function saveEvent() {
    const id = document.getElementById('event-id').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const venue = document.getElementById('event-venue').value;
    const fieldNumber = document.getElementById('event-field-number').value;
    const fieldPrice = parseInt(document.getElementById('event-field-price').value) || 0;
    const refereePrice = parseInt(document.getElementById('event-referee-price').value) || 0;
    const photographerPrice = parseInt(document.getElementById('event-photographer-price').value) || 0;
    const drinkPrice = parseInt(document.getElementById('event-drink-price').value) || 0;
    const description = document.getElementById('event-description').value;

    if (!date || !time || !venue) {
        alert('Mohon isi tanggal, jam, dan tempat pertandingan!');
        return;
    }

    // --- Bagian baru untuk mengumpulkan pemain terdaftar ---
    const registeredPlayerCheckboxes = document.querySelectorAll('#event-player-list .event-player-checkbox:checked');
    const registeredPlayerIds = Array.from(registeredPlayerCheckboxes).map(cb => parseInt(cb.value));
    // ---------------------------------------------------------

    // Hitung total harga
    const totalPrice = fieldPrice + refereePrice + photographerPrice + drinkPrice;

    const eventData = {
        id: id ? parseInt(id) : Date.now(),
        date: date,
        time: time,
        venue: venue,
        fieldNumber: fieldNumber,
        fieldPrice: fieldPrice,
        refereePrice: refereePrice,
        photographerPrice: photographerPrice,
        drinkPrice: drinkPrice,
        totalPrice: totalPrice,
        description: description,
        // --- Tambahkan daftar pemain terdaftar ---
        registeredPlayerIds: registeredPlayerIds
        // ------------------------------------------
    };

    try {
        saveEventLocally(eventData);
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Gagal menyimpan acara');
    }
}

// Hapus Player
function deletePlayer(id) {
    if (confirm('Apakah Anda yakin ingin menghapus pemain ini?')) {
        try {
            deletePlayerLocally(id);
        } catch (error) {
            console.error('Error deleting player:', error);
            alert('Gagal menghapus pemain');
        }
    }
}

// Hapus Transaction
function deleteTransaction(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        try {
            deleteTransactionLocally(id);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Gagal menghapus transaksi');
        }
    }
}

// Hapus Event
function deleteEvent(id) {
    try {
        deleteEventLocally(id);
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Gagal menghapus acara');
    }
}


// --- Export/Import Functionality (All Data) ---

// Tambahkan elemen input file tersembunyi ke body jika belum ada
// Ini memastikan elemen input file ada untuk event listener
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('import-all-file')) {
        const importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.id = 'import-all-file';
        importInput.accept = '.json';
        importInput.style.display = 'none';
        document.body.appendChild(importInput);
    }
});

// Fungsi export/import
function exportDataToFile(data, filename) {
    const jsonData = JSON.stringify(data, null, 2); // Format JSON dengan indentasi
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'data.json';
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function importDataFromFile(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log("No file selected for import.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            // Basic validation
            if (!importedData.players || !importedData.transactions) {
                alert("Format file tidak valid. File harus berisi data 'players' dan 'transactions'.");
                return;
            }

            // Konversi dan validasi data
            players = importedData.players.map(p => ({
                ...p,
                id: parseInt(p.id) || 0,
                amount: parseInt(p.amount) || 0,
                paid: p.paid === true || p.paid === 'true'
            }));

            transactions = importedData.transactions.map(t => ({
                ...t,
                id: parseInt(t.id) || 0,
                amount: parseInt(t.amount) || 0
            }));

            // Handle events if they exist in the imported data
            if (importedData.events) {
                events = importedData.events.map(e => ({
                    ...e,
                    id: parseInt(e.id) || Date.now() + Math.random(),
                    fieldPrice: parseInt(e.fieldPrice) || 0,
                    refereePrice: parseInt(e.refereePrice) || 0,
                    photographerPrice: parseInt(e.photographerPrice) || 0,
                    drinkPrice: parseInt(e.drinkPrice) || 0
                }));
            } else {
                events = []; // Jika tidak ada data events, inisialisasi dengan array kosong
            }

            saveDataToLocalStorage(); // Simpan ke localStorage
            renderPlayers();
            updatePlayerStats();
            renderTransactions();
            updateFinanceSummary();
            renderEvents(); // Render events after import
            
            console.log("All data imported successfully.");
            alert("Semua data berhasil diimpor!");
        } catch (error) {
            console.error("Error importing all ", error);
            alert("Gagal mengimpor data. Pastikan file JSON valid. Error: " + error.message);
        } finally {
            // Reset input file
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// --- Export/Import Event Listeners ---
// Event listener untuk export/import akan ditambahkan di akhir file setelah DOM siap

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromLocalStorage(); // Muat data dari localStorage saat halaman dimuat
    renderPlayers();
    renderTransactions();
    updateFinanceSummary();
    updatePlayerStats();
    renderEvents(); // Render events saat halaman dimuat
    
    // Tambahkan event listener untuk export/import
    document.getElementById('export-all-btn').addEventListener('click', () => {
        const allData = {
            players: players,
            transactions: transactions,
            events: events, // Tambahkan events ke data yang diekspor
            exportDate: new Date().toISOString(),
            version: "1.0"
        };
        exportDataToFile(allData, 'minisoccer_data.json');
    });

    document.getElementById('import-all-btn').addEventListener('click', () => {
        document.getElementById('import-all-file').click();
    });

    document.getElementById('import-all-file').addEventListener('change', importDataFromFile);
});
