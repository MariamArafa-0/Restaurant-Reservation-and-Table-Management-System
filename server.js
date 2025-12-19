// server.js
// Hesham was ABSOLUTELY GIGANTIC HUMONGOUS INTERPLANETARY COSMIC GALACTIC CELESTIALLY here :)

const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();
const port = 3000;

// Import the modules we created
const DataManager = require('./DataManager');
const Customer = require('./Customer');
const Payment = require('./Payment');
const Feedback = require('./Feedback');

// =======================================================
// MIDDLEWARE & CONFIGURATION
// =======================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'a-very-secret-key-that-should-be-long-and-random',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Serve static files from the .idea directory
app.use(express.static(path.join(__dirname, '.idea')));

// Initialize the DataManager (load tables, create manager account, etc.)
DataManager.initializeData();

// Middleware to check if the user is logged in
function requireLogin(req, res, next) {
    if (req.session.isLoggedIn) {
        next();
    } else {
        // If this is an API call, return JSON instead of redirecting to an HTML page.
        // Redirects break fetch() flows because the login HTML is returned as a 200 OK.
        const acceptsJson = (req.get('accept') || '').includes('application/json');
        const isApi = req.path.startsWith('/api/');
        if (isApi || acceptsJson) {
            return res.status(401).json({ message: 'Not authenticated. Please log in.' });
        }
        return res.redirect('/login.html');
    }

}

// Useful for front-end guards (e.g., feedback window) to verify session state
app.get('/api/session', (req, res) => {
    res.json({
        isLoggedIn: !!req.session.isLoggedIn,
        role: req.session.role || null,
        username: req.session.username || null,
        userId: req.session.userId || null
    });
});
// Logout endpoint for AJAX calls (destroys session and clears cookie)
app.post("/api/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie("connect.sid");
        return res.json({ ok: true });
    });
});


// Middleware to check if the user is a manager
function requireManager(req, res, next) {
    if (req.session.isLoggedIn && req.session.role === 'manager') {
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden: manager access required.' });
    }
}

// =======================================================
// AUTHENTICATION ROUTES
// =======================================================

app.post('/signup', (req, res) => {
    const { email, username, password, confirmPassword } = req.body;

    if (!email || !username || !password || password !== confirmPassword) {
        return res.status(400).json({ message: "Registration failed: Missing data or passwords do not match." });
    }

    const existingCustomer = DataManager.findCustomerByEmail(email);
    if (existingCustomer) {
        return res.status(409).json({ message: "This email is already in use." });
    }

    const newCustomer = Customer.register(username, password, email, 'N/A');
    DataManager.saveCustomer(newCustomer);

    console.log(`SUCCESS: New Customer Registered: ${newCustomer.usernameCus}`);
    return res.status(201).json({ message: "Signup successful" });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send("Login failed: Missing email or password.");
    }

    let user = DataManager.findCustomerByEmail(email);
    let role = 'customer';

    if (!user) {
        user = DataManager.findManagerByEmail(email);
        role = 'manager';
    }

    if (user && user.login(password, email)) {
        req.session.isLoggedIn = true;
        req.session.role = role;
        req.session.username = user.usernameCus || user.username;
        req.session.userId = user.id || user.employeeID;

        console.log(`SUCCESS: ${role.toUpperCase()} ${req.session.username} logged in!`);

        const redirectPath = role === 'manager' ? '/manager-dashboard.html' : '/CustomerDashboard.html';
        return res.status(200).send(redirectPath);
    } else {
        return res.status(401).send("Login failed: Invalid email or password.");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.send("Error logging out.");
        res.clearCookie('connect.sid');        res.redirect('/login.html');
        res.redirect("/login.html");
    });
});

// =======================================================
// RESERVATION & API ROUTES
// =======================================================

app.post('/book-reservation', requireLogin, (req, res) => {
    const customerId = req.session.userId;
    const { guests, date, time, diet } = req.body;
    const partySize = parseInt(guests);

    if (isNaN(partySize) || !date || !time) {
        return res.status(400).send("Booking failed: Invalid data.");
    }

    const result = DataManager.makeReservation({ id: customerId }, partySize, date, time, diet || '');

    if (result.success) {
        console.log(`SUCCESS: Reservation ${result.reservation.reservationId} created.`);
        return res.status(200).send("Success");
    } else {
        return res.status(400).send(result.message);
    }
});


app.post('/api/feedback', requireLogin, (req, res) => {
    const customerId = req.session.userId;
    const { rating, text, date } = req.body;

    if (!rating || Number.isNaN(Number(rating))) {
        return res.status(400).json({ message: 'Invalid rating.' });
    }

    const fb = new Feedback(customerId, rating, text || '', date);
    DataManager.saveFeedback(fb);
    return res.status(201).json({ message: 'Feedback saved.', feedback: fb });
});

app.get('/api/my-feedback', requireLogin, (req, res) => {
    const customerId = req.session.userId;
    return res.json(DataManager.getFeedbackByCustomer(customerId));
});

// =============================
// MANAGER API
// =============================
app.get('/api/manager/customers', requireManager, (req, res) => {
    const customers = DataManager.getAllCustomers().map((c, idx) => ({
        id: c.id,
        name: c.usernameCus,
        email: c.email,
        phone: c.phone || '',
        role: c.role || 'Customer'
    }));
    res.json(customers);
});

app.get('/api/manager/customers/:customerId/reservations', requireManager, (req, res) => {
    const { customerId } = req.params;
    const customer = DataManager.getAllCustomers().find(c => c.id === customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const reservations = DataManager.getAllReservations()
        .filter(r => r.customerId === customerId)
        .map(r => ({
            id: r.reservationId,
            date: r.date,
            time: r.time,
            partySize: r.partySize,
            table: r.tableId,
            status: String(r.status || '').toLowerCase(),
            specialRequests: r.comment || '',
            contactPhone: customer.phone || ''
        }));

    res.json(reservations);
});

app.get('/api/manager/customers/:customerId/feedback', requireManager, (req, res) => {
    const { customerId } = req.params;
    const customer = DataManager.getAllCustomers().find(c => c.id === customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const feedback = DataManager.getFeedbackByCustomer(customerId);
    res.json(feedback);
});

// Manager can edit ANY reservation (not only their own session user)
app.post('/api/manager/update-reservation', requireManager, (req, res) => {
    const { reservationId, date, time, guests, comment, status, tableId } = req.body;

    if (!reservationId) {
        return res.status(400).json({ message: 'Missing reservationId.' });
    }

    // Supports manager edits (including status/table) and keeps table allocation consistent
    const result = DataManager.managerEditReservation(parseInt(reservationId), {
        date,
        time,
        guests,
        comment,
        status,
        tableId
    });

    if (result.success) {
        return res.status(200).json({ message: 'Update successful' });
    }
    return res.status(400).json({ message: result.message || 'Update failed' });
});

// Manager can delete a customer (and all related reservations/feedback/payments)
app.delete('/api/manager/customers/:customerId', requireManager, (req, res) => {
    const { customerId } = req.params;

    const result = DataManager.deleteCustomerSystem(customerId);
    if (result.success) {
        return res.status(200).json({ message: 'Customer deleted.' });
    }
    return res.status(404).json({ message: result.message || 'Customer not found.' });
});

app.get('/api/my-reservations', requireLogin, (req, res) => {
    const userBookings = DataManager.getAllReservations().filter(
        r => r.customerId === req.session.userId
    );
    res.json(userBookings);
});

// FIXED: Robust Payment Processing
// server.js

// ... (existing code)

// server.js

app.post('/process-payment', requireLogin, (req, res) => {
    const customerId = req.session.userId;

    // Find latest PENDING reservation for this user
    const reservation = DataManager.getAllReservations()
        .filter(r => r.customerId === customerId && r.status === 'PENDING')
        .pop();

    if (reservation) {
        reservation.status = 'CONFIRMED';

        const depositAmount = parseFloat(req.body.depositAmount) || 500;
        DataManager.savePayment(new Payment(reservation.reservationId, depositAmount, customerId));

        console.log(`PAYMENT SUCCESS: Reservation ${reservation.reservationId} is now CONFIRMED.`);

        // CHANGE: Redirect to the Customer Dashboard instead of WelcomePage
        res.status(200).json({ success: true, redirect: '/CustomerDashboard.html' });
    } else {
        res.status(404).json({ success: false, message: "No pending reservation found." });
    }
});

// FIXED: Update Reservation Route (uses DataManager's new logic)
app.post('/api/update-reservation', requireLogin, (req, res) => {
    const { reservationId, date, time, guests, comment } = req.body;

    // Calls the DataManager fix that prevents "No Table Available" on self-edits
    const result = DataManager.editReservation(parseInt(reservationId), {
        date, time, guests, comment
    });

    if (result.success) {
        res.status(200).send("Update successful");
    } else {
        res.status(400).send(result.message);
    }
});

app.post('/api/cancel-reservation/:id', requireLogin, (req, res) => {
    const resId = parseInt(req.params.id);
    const success = DataManager.cancelReservationSystem(resId);

    if (success) {
        return res.status(200).send("Cancelled");
    }
    res.status(403).send("Unauthorized or not found");
});

// =======================================================
// PAGE ROUTING
// =======================================================

app.get('/BookATable.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, '.idea', 'BookATable.html'));
});

app.get('/CustomerDashboard.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, '.idea', 'CustomerDashboard.html'));
});

app.get('/reservation-management.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, '.idea', 'reservation-management.html'));
});

// =======================================================
// START SERVER
// =======================================================
app.listen(port, () => {
    console.log('--------------------------------------------------');
    console.log(`Server is running! http://localhost:${port}/WelcomePage.html`);
    console.log('--------------------------------------------------');
});//test
