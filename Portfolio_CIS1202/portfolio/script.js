// Dark Mode Toggle using classList.toggle
// classList.toggle('dark-mode') works like a light switch:
// - If 'dark-mode' class is ON the body, it REMOVES it (Light Mode)
// - If 'dark-mode' class is NOT on the body, it ADDS it (Dark Mode)

const btn = document.getElementById('dark-mode-btn');

btn.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');

    // Update button label to match current mode
    if (document.body.classList.contains('dark-mode')) {
        btn.textContent = '☀️ Light Mode';
    } else {
        btn.textContent = '🌙 Dark Mode';
    }
});
