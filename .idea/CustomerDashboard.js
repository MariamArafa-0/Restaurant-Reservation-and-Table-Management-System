// CustomerDashboard.js
// Adds logout functionality for the customer dashboard.

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        window.location.href = '/login.html';
      } else {
        alert('Logout failed. Please try again.');
      }
    } catch (e) {
      alert('Network error during logout.');
    }
  });
});
