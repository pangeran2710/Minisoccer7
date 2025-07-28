// Konfigurasi Google Apps Script API URL
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbya9N7gmZBDPfGQI-heq1H1vmX0i1XSTuYbhKo3vRN9JThe8hGSoMbma0Ad762YsZcTQA/exec'; // GANTI DENGAN URL WEB APP ANDA

// Data awal kosong
let players = [];
let transactions = [];
let currentEditingPlayer = null;
let currentEditingTransaction = null;

// DOM Elements
const playersTab = document.getElementById('players-tab');
const financeTab = document.getElementById('finance-tab');
const navButtons = document.querySelectorAll('.nav-button');
const addPlayerBtn = document.getElementById('add-player-btn');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const playerModal = document.getElementById('player-modal');
const transactionModal = document.getElementById('transaction-modal');
const cancelPlayerBtn = document.getElementById('cancel-player-btn');
const cancelTransactionBtn = document.getElementById('cancel-transaction-btn');
const savePlayerBtn = document.getElementById('save-player-btn');
const saveTransactionBtn = document.getElementById('save-transaction-btn');
const playerForm = document.getElementById('player-form');
const transactionForm = document.getElementById('transaction-form');

// Event Listeners
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

cancelPlayerBtn.addEventListener('click', () => {
    closePlayerModal();
});

cancelTransactionBtn.addEventListener('click', () => {
    closeTransactionModal();
});

savePlayerBtn.addEventListener('click', () => {
    savePlayer();
});

saveTransactionBtn.addEventListener('click', () => {
    saveTransaction();
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

// Fungsi untuk menampilkan loading indicator
function showLoading(show) {
    const loadingElement = document.getElementById('loading-indicator');
    if (show) {
        if (!loadingElement) {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loading-indicator';
            loadingDiv.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                            background: rgba(0,0,0,0.5); display: flex; align-items: center; 
                            justify-content: center; z-index: 9999;">
                    <div style="background: white; padding: 20px; border-radius: 10px; 
                                text-align: center;">
                        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; 
                                    border-radius: 50%; width: 40px; height: 40px; 
                                    animation: spin 1s linear infinite; margin: 0 auto;"></div>
                        <p style="margin-top: 10px;">Menyimpan data...</p>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loadingDiv);
        } else {
            loadingElement.style.display = 'block';
        }
    } else if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Fungsi untuk memuat data dari Google Apps Script
async function loadDataFromGAS() {
    try {
        showLoading(true);
        
        // Load Players
        const playersResponse = await fetch(`${GAS_API_URL}?action=getPlayers`);
        players = await playersResponse.json();
        
        // Load Transactions
        const transactionsResponse = await fetch(`${GAS_API_URL}?action=getTransactions`);
        transactions = await transactionsResponse.json();
        
        // Render data
        renderPlayers();
        renderTransactions();
        updateFinanceSummary();
        updatePlayerStats();
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading ', error);
        alert('Gagal memuat data dari Google Sheets. Pastikan URL Web App sudah benar dan access diatur ke "Anyone".');
        showLoading(false);
    }
}

// Fungsi untuk menyimpan data ke Google Apps Script
async function saveDataToGAS(action, data) {
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, ...data })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save data');
        }
        
        return await response.text();
    } catch (error) {
        console.error('Error saving ', error);
        alert('Gagal menyimpan data ke Google Sheets');
        return null;
    }
}

// Functions
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
        document.getElementById('player-amount').value = 50000;
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

async function savePlayer() {
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
        if (currentEditingPlayer && currentEditingPlayer.id) {
            // Update existing player
            await saveDataToGAS('updatePlayer', { player: playerData });
            
            // Handle payment status change
            if (paid && (!currentEditingPlayer.paid || currentEditingPlayer.paid === 'false')) {
                await addPlayerPaymentToTransactions(playerData);
            } else if (!paid && (currentEditingPlayer.paid === 'true' || currentEditingPlayer.paid === true)) {
                await removePlayerPaymentFromTransactions(currentEditingPlayer.id);
            }
        } else {
            // Add new player
            const newId = players.length > 0 ? Math.max(...players.map(p => parseInt(p.id) || 0)) + 1 : 1;
            playerData.id = newId;
            await saveDataToGAS('addPlayer', { player: playerData });
            
            // If paid, add to transactions
            if (paid) {
                await addPlayerPaymentToTransactions(playerData);
            }
        }
        
        closePlayerModal();
        await loadDataFromGAS();
    } catch (error) {
        console.error('Error saving player:', error);
        alert('Gagal menyimpan data pemain');
    }
}

async function saveTransaction() {
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
        if (currentEditingTransaction && currentEditingTransaction.id) {
            // Untuk update transaction, kita bisa hapus dulu lalu tambah
            await saveDataToGAS('deleteTransaction', { id: currentEditingTransaction.id });
            await saveDataToGAS('addTransaction', { transaction: transactionData });
        } else {
            // Add new transaction
            const newId = transactions.length > 0 ? Math.max(...transactions.map(t => parseInt(t.id) || 0)) + 1 : 1;
            transactionData.id = newId;
            await saveDataToGAS('addTransaction', { transaction: transactionData });
        }
        
        closeTransactionModal();
        await loadDataFromGAS();
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Gagal menyimpan transaksi');
    }
}

async function addPlayerPaymentToTransactions(player) {
    const description = `Pembayaran dari ${player.name} (${player.team})`;
    const cleanDescription = description.trim().replace(/\s+/g, ' ');
    
    const transactionData = {
        id: transactions.length > 0 ? Math.max(...transactions.map(t => parseInt(t.id) || 0)) + 1 : 1,
        type: 'income',
        source: `Pembayaran Pemain - ${player.name}`,
        amount: player.amount,
        method: player.paymentMethod,
        date: player.paymentDate,
        description: cleanDescription
    };
    
    await saveDataToGAS('addTransaction', { transaction: transactionData });
}

async function removePlayerPaymentFromTransactions(playerId) {
    const playerName = players.find(p => parseInt(p.id) === playerId)?.name || 'Pemain';
    
    // Cari transaction yang sesuai dan hapus
    const transactionToDelete = transactions.find(t => 
        t.type === 'income' && t.source.includes(`Pembayaran Pemain - ${playerName}`)
    );
    
    if (transactionToDelete) {
        await saveDataToGAS('deleteTransaction', { id: transactionToDelete.id });
    }
}

async function deletePlayer(id) {
    if (confirm('Apakah Anda yakin ingin menghapus pemain ini?')) {
        try {
            // Hapus transaksi terkait dulu
            const playerName = players.find(p => parseInt(p.id) === id)?.name || 'Pemain';
            const transactionToDelete = transactions.find(t => 
                t.type === 'income' && t.source.includes(`Pembayaran Pemain - ${playerName}`)
            );
            
            if (transactionToDelete) {
                await saveDataToGAS('deleteTransaction', { id: transactionToDelete.id });
            }
            
            // Hapus pemain
            await saveDataToGAS('deletePlayer', { id: id });
            
            await loadDataFromGAS();
        } catch (error) {
            console.error('Error deleting player:', error);
            alert('Gagal menghapus pemain');
        }
    }
}

async function deleteTransaction(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        try {
            await saveDataToGAS('deleteTransaction', { id: id });
            await loadDataFromGAS();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Gagal menghapus transaksi');
        }
    }
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

function updateFinanceSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
    
    const balance = totalIncome - totalExpense;
    
    document.getElementById('total-income').textContent = `Rp ${totalIncome.toLocaleString()}`;
    document.getElementById('total-expense').textContent = `Rp ${totalExpense.toLocaleString()}`;
    document.getElementById('balance').textContent = `Rp ${balance.toLocaleString()}`;
    
    const balanceElement = document.getElementById('balance');
    if (balance >= 0) {
        balanceElement.style.color = '#22c55e';
    } else {
        balanceElement.style.color = '#ef4444';
    }
}

// Initialize dengan data dari Google Apps Script
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromGAS();
});