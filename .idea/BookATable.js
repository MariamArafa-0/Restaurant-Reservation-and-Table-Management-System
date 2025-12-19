// BookATable.js

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Custom Guest Dropdown Logic ---
    const dropdown = document.querySelector(".custom-dropdown");
    const selected = dropdown.querySelector(".selected");
    const list = dropdown.querySelector(".dropdown-list");
    let selectedGuests = ""; // Variable to hold the selected party size

    // Generate numbers 1 to 20 dynamically
    for (let i = 1; i <= 20; i++) {
        let li = document.createElement("li");
        li.textContent = i;
        li.addEventListener("click", () => {
            selected.textContent = li.textContent;
            selectedGuests = li.textContent; // Update our variable
            list.style.display = "none";
            selected.classList.remove("placeholder"); // Visual fix
        });
        list.appendChild(li);
    }

    selected.addEventListener("click", () => {
        list.style.display = list.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
            list.style.display = "none";
        }
    });

    // --- 2. Form Submission logic ---
    const bookingForm = document.getElementById('booking-form');

    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Stop page refresh

        // Frontend validation
        if (!selectedGuests || selectedGuests === "Choose number of guests") {
            alert("Please choose the number of guests.");
            return;
        }

        // Logical Link: Prepare data matching the backend's new requirements
        const bookingData = {
            name: document.getElementById("name").value.trim(),
            surname: document.getElementById("surname").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            email: document.getElementById("email").value.trim(),
            guests: selectedGuests,
            date: document.getElementById("date").value,
            time: document.getElementById("time").value,
            diet: document.getElementById("diet").value.trim() // 'preference' is removed
        };

        try {
            // Send to backend route defined in server.js
            const response = await fetch("/book-reservation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                // SUCCESS: Proceed to payment as requested
                window.location.href = "PaymentPage.html";
            } else {
                // FAILURE: Show server's error message (e.g., "No tables available")
                const errorMsg = await response.text();
                alert("Booking Error: " + errorMsg);
            }
        } catch (error) {
            console.error("Connection Error:", error);
            alert("Failed to connect to the server.");
        }
    });
});