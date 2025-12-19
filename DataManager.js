// DataManager.js

// Import all object classes
const Customer = require('./Customer');
const Manager = require('./Manager');
const Table = require('./Table');
const Reservation = require('./Reservation');
const Payment = require('./Payment');
const Feedback = require('./Feedback');

// Storage Arrays
const customers = [];
const managers = [];
const tables = [];
const reservations = [];
const payments = [];
const feedbacks = [];

// INITIALIZATION
function initializeData() {
    // Standard table setup
    for (let i = 1; i <= 20; i++) {
        let capacity = (i % 5 === 0) ? 8 : (i % 3 === 0) ? 6 : (i % 2 === 0) ? 2 : 4;
        tables.push(new Table(`T-${i}`, capacity));
    }

    managers.push(new Manager('Boss (Wo)Man', '12345678', 'Manager@Eden.org'));
    console.log(`DataManager initialized with ${tables.length} tables and ${managers.length} manager account.`);
}

function saveCustomer(customer) {
    customers.push(customer);
}

function findCustomerByEmail(email) {
    return customers.find(C => C.email === email);
}

function findManagerByEmail(email) {
    return managers.find(m => m.email === email);
}

function saveReservation(reservation) {
    reservations.push(reservation);
}

// RESERVATION MANAGEMENT

/**
 * Creates a new reservation and marks the table as RESERVED
 *
 */
function makeReservation(customer, partySize, date, time, comment) {
    // 1. Find a table with enough capacity that is AVAILABLE
    const availableTable = tables.find(t =>
        t.Capacity >= partySize && t.Tablestatus === 'AVAILABLE'
    );

    if (!availableTable) {
        return { success: false, message: "No tables available for this time/size." };
    }

    // 2. Create the Reservation (Status starts as PENDING)
    const newRes = new Reservation(
        customer.id,
        availableTable.TableID,
        partySize,
        date,
        time,
        comment
    );

    // 3. Save and Update Status
    reservations.push(newRes);
    availableTable.Tablestatus = 'RESERVED';

    return { success: true, reservation: newRes };
}

/**
 * Handles editing an existing reservation.
 * FIXED: Temporarily frees current table to prevent "No table available" error.
 */
function editReservation(reservationId, newDetails) {
    const reservation = reservations.find(r => r.reservationId === reservationId);
    if (!reservation) return { success: false, message: "Reservation not found." };

    // 1. Find the current table assigned to this reservation
    const currentTable = tables.find(t => t.TableID === reservation.tableId);

    // 2. Temporarily mark it AVAILABLE so the search logic can see it as an option
    if (currentTable) currentTable.Tablestatus = 'AVAILABLE';

    // 3. Try to find a table for the NEW requirements
    const partySize = parseInt(newDetails.guests || reservation.partySize);
    const availableTable = tables.find(t =>
        t.Capacity >= partySize && t.Tablestatus === 'AVAILABLE'
    );

    if (!availableTable) {
        // If no table found, re-lock the old table and fail
        if (currentTable) currentTable.Tablestatus = 'RESERVED';
        return { success: false, message: "No tables available for these new requirements." };
    }

    // 4. Success: Update reservation and lock the (potentially new) table
    reservation.date = newDetails.date || reservation.date;
    reservation.time = newDetails.time || reservation.time;
    reservation.partySize = partySize;
    reservation.comment = newDetails.comment || reservation.comment;
    reservation.tableId = availableTable.TableID;

    availableTable.Tablestatus = 'RESERVED';
    return { success: true };
}

/**
 * Manager-only edit for a reservation.
 * Allows updating: date, time, partySize, comment, status, and/or specific table.
 *
 * Keeps table allocation consistent by releasing the old table and reserving the new one.
 *
 * @param {number} reservationId
 * @param {{date?:string,time?:string,guests?:string|number,comment?:string,status?:string,tableId?:string}} newDetails
 * @returns {{success:boolean,message?:string}}
 */
function managerEditReservation(reservationId, newDetails) {
    const reservation = reservations.find(r => r.reservationId === reservationId);
    if (!reservation) return { success: false, message: 'Reservation not found.' };

    // Current table
    const currentTable = tables.find(t => t.TableID === reservation.tableId);

    // Update party size (needed for capacity checks)
    const partySize = parseInt(newDetails.guests ?? reservation.partySize);
    if (Number.isNaN(partySize) || partySize <= 0) {
        return { success: false, message: 'Invalid party size.' };
    }

    // Determine desired table (optional explicit tableId)
    const desiredTableId = newDetails.tableId || null;

    // Temporarily free current table so it can be selected again if needed
    if (currentTable) currentTable.Tablestatus = 'AVAILABLE';

    let chosenTable = null;

    if (desiredTableId) {
        const t = tables.find(x => x.TableID === desiredTableId);
        if (!t) {
            if (currentTable) currentTable.Tablestatus = 'RESERVED';
            return { success: false, message: 'Selected table not found.' };
        }
        if (t.Capacity < partySize) {
            if (currentTable) currentTable.Tablestatus = 'RESERVED';
            return { success: false, message: 'Selected table capacity is not enough.' };
        }
        // allow choosing the old table even if it was reserved by this reservation
        if (t.Tablestatus !== 'AVAILABLE' && t !== currentTable) {
            if (currentTable) currentTable.Tablestatus = 'RESERVED';
            return { success: false, message: 'Selected table is not available.' };
        }
        chosenTable = t;
    } else {
        // Auto-pick an available table that matches new party size
        chosenTable = tables.find(t => t.Capacity >= partySize && t.Tablestatus === 'AVAILABLE');
        if (!chosenTable) {
            if (currentTable) currentTable.Tablestatus = 'RESERVED';
            return { success: false, message: 'No tables available for these new requirements.' };
        }
    }

    // Normalize date to YYYY-MM-DD if possible (customer edit UI expects ISO date)
    const normalizeDateToISO = (d) => {
        if (!d) return null;
        const s = String(d).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        const parsed = new Date(s);
        if (Number.isNaN(parsed.getTime())) return s; // keep original if unparsable
        return parsed.toISOString().split('T')[0];
    };

    // Apply reservation updates
    reservation.date = newDetails.date ? normalizeDateToISO(newDetails.date) : reservation.date;
    reservation.time = newDetails.time || reservation.time;
    reservation.partySize = partySize;
    reservation.comment = (newDetails.comment !== undefined) ? newDetails.comment : reservation.comment;
    reservation.tableId = chosenTable.TableID;

    if (newDetails.status) {
        reservation.status = String(newDetails.status).toUpperCase();
    }

    // Lock chosen table
    chosenTable.Tablestatus = 'RESERVED';

    return { success: true };
}

/**
 * Cancels reservation and releases the table
 */
function cancelReservationSystem(reservationId) {
    const reservation = reservations.find(r => r.reservationId === reservationId);
    if (!reservation) return false;

    // Release the assigned table back to AVAILABLE
    const table = tables.find(t => t.TableID === reservation.tableId);
    if (table) {
        table.Tablestatus = 'AVAILABLE';
    }

    reservation.status = 'CANCELLED';
    return true;
}

/**
 * Delete a customer and clean up all related data.
 *
 * Notes:
 * - This project uses in-memory arrays, so delete means removing from arrays.
 * - We also release any reserved tables to keep availability consistent.
 *
 * @param {string} customerId
 * @returns {{success:boolean,message?:string}}
 */
function deleteCustomerSystem(customerId) {
    const idx = customers.findIndex(c => c.id === customerId);
    if (idx === -1) return { success: false, message: 'Customer not found.' };

    // Release tables and remove reservations for this customer
    const resIdsToRemove = new Set();
    for (let i = reservations.length - 1; i >= 0; i--) {
        const r = reservations[i];
        if (r.customerId === customerId) {
            resIdsToRemove.add(r.reservationId);

            const t = tables.find(x => x.TableID === r.tableId);
            if (t) t.Tablestatus = 'AVAILABLE';

            reservations.splice(i, 1);
        }
    }

    // Remove feedback entries
    for (let i = feedbacks.length - 1; i >= 0; i--) {
        if (feedbacks[i].customerId === customerId) {
            feedbacks.splice(i, 1);
        }
    }

    // Remove payments (best-effort: by reservationId or by username/customerId)
    for (let i = payments.length - 1; i >= 0; i--) {
        const p = payments[i];
        // Payment model is a bit inconsistent in this project, so we check multiple fields.
        if (resIdsToRemove.has(p.reservationId) || p.username === customerId || p.amount === customerId) {
            payments.splice(i, 1);
        }
    }

    // Finally remove customer
    customers.splice(idx, 1);
    return { success: true };
}

// PAYMENT MANAGEMENT
function savePayment(payment) {
    payments.push(payment);
}



// EXPORTS

/**
 * Saves a feedback entry
 */
function saveFeedback(feedback) {
    feedbacks.push(feedback);
    return feedback;
}

/**
 * Get feedback entries for a customer
 */
function getFeedbackByCustomer(customerId) {
    return feedbacks.filter(f => f.customerId === customerId);
}

module.exports = {
    initializeData,
    saveCustomer,
    findCustomerByEmail,
    findManagerByEmail,
    saveReservation,
    makeReservation,
    editReservation,
    managerEditReservation,
    cancelReservationSystem,
    deleteCustomerSystem,
    savePayment,
    // Feedback API helpers (used by server.js routes)
    saveFeedback,
    getFeedbackByCustomer,
    getAllCustomers: () => customers,
    getAllManagers: () => managers,
    getAllTables: () => tables,
    getAllReservations: () => reservations,
    getAllPayments: () => payments,
    getAllFeedbacks: () => feedbacks
};