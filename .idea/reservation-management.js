// Reservation Management JavaScript - Linked to Backend API
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    loadReservations();
});

let reservations = [];
let currentEditId = null;

function initializePage() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('editDate');
    if (dateInput) dateInput.setAttribute('min', today);
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchReservations');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchReservations, 300));
    }

    const saveBtn = document.getElementById('saveReservation');
    if (saveBtn) saveBtn.addEventListener('click', saveReservation);

    const cancelBtn = document.getElementById('confirmCancellation');
    if (cancelBtn) cancelBtn.addEventListener('click', confirmCancellation);
}

async function loadReservations(searchQuery = '') {
    const listElement = document.getElementById('reservationList');
    const emptyState = document.getElementById('emptyState');
    if (!listElement) return;

    listElement.innerHTML = '<p style="color: #b5935b;">Fetching your reservations...</p>';

    try {
        const response = await fetch('/api/my-reservations');

        // NEW: Redirect to login if session is expired (Unauthorized)
        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error("Failed to fetch");

        reservations = await response.json();
        listElement.innerHTML = '';

        const filteredReservations = reservations.filter(res => {
            const query = searchQuery.toLowerCase();
            const dateStr = formatDate(res.date);
            return (
                dateStr.toLowerCase().includes(query) ||
                res.status.toLowerCase().includes(query)
            );
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (filteredReservations.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        filteredReservations.forEach(res => {
            listElement.appendChild(createReservationCard(res));
        });
    } catch (error) {
        console.error("Error loading reservations:", error);
        listElement.innerHTML = '<p>Error loading your reservations. Please try again later.</p>';
    }
}

function createReservationCard(res) {
    const card = document.createElement('div');
    card.className = 'reservation-card';
    card.style.border = "1px solid #b5935b";
    card.style.margin = "10px 0";
    card.style.padding = "15px";

    const statusClass = `status-${res.status.toLowerCase()}`;
    const dateStr = formatDate(res.date);
    const timeStr = formatTime(res.time);

    card.innerHTML = `
        <div class="reservation-info">
            <h6 style="color: #b5935b; font-weight: bold;">${dateStr} at ${timeStr}</h6>
            <p>Guests: ${res.partySize}</p>
            <p class="special-requests">${res.comment || 'No special requests.'}</p>
        </div>
        <span class="reservation-status ${statusClass}" style="text-transform: uppercase; font-size: 0.8rem;">${res.status}</span>
        <div class="reservation-actions">
            ${res.status === 'PENDING' || res.status === 'CONFIRMED' ? `
                <button class="btn action-btn edit-btn" onclick="openEditModal(${res.reservationId})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn action-btn cancel-btn" onclick="openCancelModal(${res.reservationId})">
                    <i class="fas fa-times-circle"></i> Cancel
                </button>
            ` : `
                <button class="btn action-btn view-btn" disabled>
                    <i class="fas fa-check"></i> ${res.status}
                </button>
            `}
        </div>
    `;
    return card;
}

function openEditModal(id) {
    currentEditId = id;
    const res = reservations.find(r => r.reservationId === id);
    if (!res) return;

    document.getElementById('editDate').value = res.date;
    document.getElementById('editTime').value = res.time;
    document.getElementById('editGuests').value = res.partySize;
    document.getElementById('editSpecialRequests').value = res.comment || '';

    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    editModal.show();
}

async function saveReservation() {
    const id = currentEditId;
    const updatedData = {
        reservationId: id,
        date: document.getElementById('editDate').value,
        time: document.getElementById('editTime').value,
        guests: parseInt(document.getElementById('editGuests').value),
        comment: document.getElementById('editSpecialRequests').value
    };

    try {
        const response = await fetch('/api/update-reservation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
            if (editModal) editModal.hide();
            showSuccessModal('Reservation updated successfully!');
            loadReservations();
        } else {
            const errorMsg = await response.text();
            alert("Failed to update: " + errorMsg);
        }
    } catch (error) {
        console.error("Update error:", error);
    }
}

function openCancelModal(id) {
    currentEditId = id;
    const res = reservations.find(r => r.reservationId === id);
    if (!res) return;

    const details = `${formatDate(res.date)} at ${formatTime(res.time)} for ${res.partySize} guests`;
    const detailsElement = document.getElementById('cancelReservationDetails');
    if (detailsElement) detailsElement.textContent = details;

    const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
    cancelModal.show();
}

async function confirmCancellation() {
    const id = currentEditId;
    try {
        const response = await fetch(`/api/cancel-reservation/${id}`, { method: 'POST' });
        if (response.ok) {
            const cancelModal = bootstrap.Modal.getInstance(document.getElementById('cancelModal'));
            if (cancelModal) cancelModal.hide();
            showSuccessModal('Reservation cancelled successfully.');
            loadReservations();
        } else {
            alert("Failed to cancel reservation.");
        }
    } catch (error) {
        console.error("Cancellation error:", error);
    }
}

// --- Utilities ---
function formatDate(dateString) {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatTime(timeString) {
    const [hour, minute] = timeString.split(':');
    const date = new Date(2000, 0, 1, hour, minute);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
}

function searchReservations(event) {
    loadReservations(event.target.value);
}

function showSuccessModal(message) {
    const msgElem = document.getElementById('successMessage');
    if (msgElem) msgElem.textContent = message;
    const successModalElem = document.getElementById('successModal');
    if (successModalElem && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(successModalElem);
        modal.show();
    } else {
        alert(message);
    }
}

// FIXED: Completed the debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}