function toggleRegister() {
    const r = document.getElementById('registerSection');
    r.style.display = r.style.display === 'block' ? 'none' : 'block';
}

function showError(msg) {
    const e = document.getElementById('errorMessage');
    e.textContent = msg;
    e.classList.add('show');
    setTimeout(() => e.classList.remove('show'), 5000);
}

async function hashPassword(pass) {
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(pass));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value;
    const btn = e.target.querySelector('button[type="submit"]');
    const txt = btn.innerHTML;
    btn.innerHTML = '<span>Loading...</span>';
    btn.disabled = true;
    
    try {
        const h = await hashPassword(p);
        const { data, error } = await window.sb.from('users').select('*').eq('username', u).eq('password', h).limit(1);
        if (error) throw error;
        if (!data || data.length === 0) {
            showError('Wrong credentials');
            btn.innerHTML = txt;
            btn.disabled = false;
            return;
        }
        const user = data[0];
        user.role = getUserRole(user.username);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error(err);
        showError('Error: ' + err.message);
        btn.innerHTML = txt;
        btn.disabled = false;
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('registerUsername').value.trim();
    const p = document.getElementById('registerPassword').value;
    if (p.length < 6) return showError('Password must be 6+ characters');
    
    const btn = e.target.querySelector('button[type="submit"]');
    const txt = btn.innerHTML;
    btn.innerHTML = '<span>Loading...</span>';
    btn.disabled = true;
    
    try {
        const { data: ex } = await window.sb.from('users').select('username').eq('username', u).limit(1);
        if (ex && ex.length > 0) {
            showError('Username already taken');
            btn.innerHTML = txt;
            btn.disabled = false;
            return;
        }
        const h = await hashPassword(p);
        const r = getUserRole(u);
        const { data, error } = await window.sb.from('users').insert([{ username: u, password: h, role: r }]).select();
        if (error) throw error;
        const user = data[0];
        user.role = r;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        alert('✅ Account created!');
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error(err);
        showError('Error: ' + err.message);
        btn.innerHTML = txt;
        btn.disabled = false;
    }
});

window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('currentUser')) window.location.href = 'dashboard.html';
});