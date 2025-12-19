document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".signup-form");
    const email = document.getElementById("email");
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const inputs = document.querySelectorAll(".input-wrapper input");
    const eyeIcons = document.querySelectorAll(".toggle-password");
    const serverError = document.getElementById("server-error");

    // Toggle password visibility
    eyeIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            const input = icon.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
                icon.textContent = "👁️";
            } else {
                input.type = "password";
                icon.textContent = "🙈";
            }
        });
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // STOP normal form submission
        let valid = true;

        // Reset errors
        serverError.style.visibility = "hidden";
        serverError.textContent = "";

        document.querySelectorAll(".error-message").forEach(msg => {
            msg.style.visibility = "hidden";
            msg.textContent = "";
        });

        // Empty fields check
        inputs.forEach(input => {
            const errorMsg = input.parentElement.querySelector(".error-message");
            if (input.value.trim() === "") {
                errorMsg.textContent = "This field is required";
                errorMsg.style.visibility = "visible";
                valid = false;
            }
        });

        if (password.value.length < 6) {
            serverError.textContent = "Password must be at least 6 characters";
            serverError.style.visibility = "visible";
            return;
        }

        if (password.value !== confirmPassword.value) {
            serverError.textContent = "Passwords do not match";
            serverError.style.visibility = "visible";
            return;
        }

        if (!valid) return;

        // Send data to backend
        try {
            const response = await fetch("/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                   email: email.value.trim(),
                   username: username.value.trim(),
                   password: password.value.trim(),
                   confirmPassword: confirmPassword.value.trim()
               })

            });

            const data = await response.json();

            if (!response.ok) {
                // ❌ Account already exists (or other error)
                serverError.textContent = data.message;
                serverError.style.visibility = "visible";
                return;
            }

            // ✅ Success → redirect
            window.location.href = "login.html";

        } catch (error) {
            serverError.textContent = "Server error. Please try again later.";
            serverError.style.visibility = "visible";
        }
    });
});
