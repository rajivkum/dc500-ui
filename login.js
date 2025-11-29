const form = document.getElementById('loginForm');
const errorBanner = document.getElementById('errorMsg');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const btn = document.querySelector('.login-btn');
    const originalBtnText = btn.innerText;

    // Reset error
    errorBanner.style.display = 'none';

    // Loading State
    btn.disabled = true;
    btn.innerText = 'Signing in...';

    // Simulate API delay
    setTimeout(() => {
        // 1. Admin Login
        if (user === 'admin' && pass === 'admin123') {
            btn.innerText = 'Success!';
            btn.style.background = 'var(--success)';

            localStorage.setItem('dc500_session', JSON.stringify({
                name: 'Plant Manager',
                role: 'user'
            }));

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        }
        // 2. Developer Login
        else if (user === 'dev' && pass === 'dev123') {
            btn.innerText = 'Dev Mode...';
            btn.style.background = 'var(--dev-color)';

            localStorage.setItem('dc500_session', JSON.stringify({
                name: 'Senior Engineer',
                role: 'developer'
            }));

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        }
        // 3. Failed
        else {
            btn.disabled = false;
            btn.innerText = originalBtnText;
            errorBanner.style.display = 'flex';
        }
    }, 800);
});

// 3D Tilt Effect disabled