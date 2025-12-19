// ----- PASSWORD TOGGLE -----
document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const input = document.getElementById(toggle.dataset.target);
        input.type = input.type === 'password' ? 'text' : 'password';
        toggle.innerHTML = `<i class="fas fa-eye${input.type === 'password' ? '' : '-slash'}"></i>`;
    });
});


// ----- PERSONAL INFO FORM -----
document.getElementById("personalInfoForm").addEventListener("submit", (e) => {
    e.preventDefault();

    showSuccess("Personal info updated successfully!");
});


// ----- PASSWORD UPDATE -----
document.getElementById("passwordForm").addEventListener("submit", (e) => {
    e.preventDefault();

    let newPass = document.getElementById("newPassword").value;
    let confirmPass = document.getElementById("confirmPassword").value;

    if (newPass !== confirmPass) {
        document.getElementById("confirmPasswordError").innerText = "Passwords do not match!";
        document.getElementById("confirmPasswordError").classList.add("show");
        return;
    }

    showSuccess("Password updated successfully!");
});


// ----- SHOW SUCCESS MODAL -----
function showSuccess(msg) {
    document.getElementById("successMessage").innerText = msg;
    let modal = new bootstrap.Modal(document.getElementById("successModal"));
    modal.show();
}
