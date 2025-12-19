document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("password");
    const togglePassword = document.querySelector(".toggle-password");
    const loginForm = document.querySelector(".login-form");
    const emailInput = document.getElementById("email");

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                togglePassword.textContent = "👁️";
            } else {
                passwordInput.type = "password";
                togglePassword.textContent = "🙈";
            }
        });
    }

    // Form submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            // LOGIC: Check if the server performed a direct redirect
            if (response.redirected) {
                window.location.href = response.url;
                return;
            }

            // Get the response text (which is either an error message or a dashboard path)
            const resultText = await response.text();

            if (response.ok) {
                // SUCCESS LOGIC:
                // resultText contains the path from the server (e.g., "/manager-dashboard.html")
                // We use that to redirect the user to the correct role-based page.
                window.location.href = resultText;
            } else {
                // ERROR LOGIC:
                // Show the error message sent by the server (e.g., "Invalid email or password")
                alert(resultText || "Login failed. Please check your credentials.");
            }

        } catch (error) {
            alert("Error connecting to server. Please try again.");
            console.error("Login Error:", error);
        }
    });
});