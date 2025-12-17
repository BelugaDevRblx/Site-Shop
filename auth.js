// Toggle between login and register
function toggleRegister() {
    const r = document.getElementById('registerSection');
    r.style.display = r.style.display === 'block' ? 'none' : 'block';
}

// Show error message
function showError(msg) {
    const e = document.getElementById('errorMessage');
    e.textContent = msg;
    e.classList.add('show');
    setTimeout(() => e.classList.remove('show'), 5000);
}

// Hash password
async function hashPassword(pass) {
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(pass));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Function to get user IP using free API
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error getting IP:', error);
        return null;
    }
}

// LOGIN with IP tracking and update
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value;
    const btn = e.target.querySelector('button[type="submit"]');
    const txt = btn.innerHTML;
    btn.innerHTML = '<span>Loading...</span>';
    btn.disabled = true;
    
    try {
        // Get user IP
        const userIP = await getUserIP();
        console.log('User IP:', userIP);
        
        // Check if IP is banned
        if (userIP) {
            const { data: bannedIP } = await window.sb
                .from('banned_users')
                .select('*')
                .eq('ip_address', userIP)
                .limit(1);
            
            if (bannedIP && bannedIP.length > 0) {
                showError('❌ This IP is banned. Reason: ' + bannedIP[0].reason);
                btn.innerHTML = txt;
                btn.disabled = false;
                return;
            }
        }
        
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
        
        // Check if username is banned
        const { data: bannedUser } = await window.sb
            .from('banned_users')
            .select('*')
            .eq('username', u)
            .limit(1);
        
        if (bannedUser && bannedUser.length > 0) {
            showError('❌ Account banned. Reason: ' + bannedUser[0].reason);
            btn.innerHTML = txt;
            btn.disabled = false;
            return;
        }
        
        user.role = getUserRole(user.username);
        
        // UPDATE IP for existing users (important!)
        if (userIP) {
            const updateData = {
                last_ip: userIP,
                last_login: new Date().toISOString()
            };
            
            // If user doesn't have ip_address (old user), set it now
            if (!user.ip_address) {
                updateData.ip_address = userIP;
            }
            
            await window.sb.from('users').update(updateData).eq('id', user.id);
            console.log('✅ IP updated for user:', u, 'IP:', userIP);
        }
        
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error(err);
        showError('Error: ' + err.message);
        btn.innerHTML = txt;
        btn.disabled = false;
    }
});

// REGISTER with IP tracking
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
        // Get user IP
        const userIP = await getUserIP();
        console.log('New user IP:', userIP);
        
        // Check if IP is banned
        if (userIP) {
            const { data: bannedIP } = await window.sb
                .from('banned_users')
                .select('*')
                .eq('ip_address', userIP)
                .limit(1);
            
            if (bannedIP && bannedIP.length > 0) {
                showError('❌ This IP is banned. Reason: ' + bannedIP[0].reason);
                btn.innerHTML = txt;
                btn.disabled = false;
                return;
            }
        }
        
        // Check if username exists
        const { data: ex } = await window.sb.from('users').select('username').eq('username', u).limit(1);
        if (ex && ex.length > 0) {
            showError('Username already taken');
            btn.innerHTML = txt;
            btn.disabled = false;
            return;
        }
        
        const h = await hashPassword(p);
        const r = getUserRole(u);
        
        // Create user with IP
        const { data, error } = await window.sb.from('users').insert([{ 
            username: u, 
            password: h, 
            role: r,
            ip_address: userIP,
            last_ip: userIP,
            last_login: new Date().toISOString()
        }]).select();
        
        if (error) throw error;
        
        const user = data[0];
        user.role = r;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        console.log('✅ New user created with IP:', userIP);
        alert('✅ Account created!');
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error(err);
        showError('Error: ' + err.message);
        btn.innerHTML = txt;
        btn.disabled = false;
    }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('currentUser')) window.location.href = 'dashboard.html';
});