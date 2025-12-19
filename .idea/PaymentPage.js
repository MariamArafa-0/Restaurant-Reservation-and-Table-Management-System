document.addEventListener('DOMContentLoaded', () => {
    const paymentForm = document.getElementById('payment-form');
    const cardInput = document.getElementById('card-number');
    const secureKeyInput = document.getElementById('secure-key');
    const expiryDateInput = document.getElementById('expiration-date');

    // Auto-format card number
    cardInput.addEventListener('input', () => {
        let value = cardInput.value.replace(/\D/g, '');
        value = value.substring(0, 16);
        const formatted = value.replace(/(.{4})/g, '$1 ').trim();
        cardInput.value = formatted;
    });

    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Stop the page from refreshing immediately

        // 1. Validation Logic
        const cardNumber = cardInput.value.replace(/\s/g, '');
        const secureKey = secureKeyInput.value.trim();
        const expiryDate = expiryDateInput.value.trim();

        if (!cardNumber || !secureKey || !expiryDate) {
            alert("Please fill in all required fields.");
            return;
        }

        if (!/^\d{16}$/.test(cardNumber)) {
            alert("Credit card number must be 16 digits.");
            return;
        }

        if (!/^\d{3}$/.test(secureKey)) {
            alert("Secure key must be 3 digits.");
            return;
        }

        // Optional: expiration date validation
        const today = new Date();
        const selectedDate = new Date(expiryDate);

        if (selectedDate < today) {
            alert("Card is expired.");
            return;
        }

        // Success
        alert("Payment information valid! Processing payment...");

        fetch('/process-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                depositAmount: 500 // Sending the deposit amount
            })
        })
        .then(response => {
            // If the server says OK (status 200)
            if (response.ok) {
                alert("Payment Successful! Your reservation is now CONFIRMED.");
                // Redirect to Customer Dashboard as requested
                window.location.href = "/CustomerDashboard.html";
            }
            // If the user isn't logged in, the server returns 401 or redirects
            else if (response.status === 401) {
                alert("Session expired. Please login again.");
                window.location.href = "/login.html";
            }
            else {
                alert("Error: No pending reservation found to pay for.");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred while connecting to the server.");
        });
    });
});