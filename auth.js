// IP TRACKING WITH EXTERNAL API
// Add this to your auth.js for registration

// Function to get user IP
async function getUserIP() {
    try {
        // Using ipify API (free, no key needed)
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error getting IP:', error);
        return null;
    }
}

// Modified registration with IP tracking
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (password.length < 6) return showError('Password must be 6+ characters');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const txt = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Loading...</span>';
    submitBtn.disabled = true;
    
    try {
        // Get user IP
        const userIP = await getUserIP();
        
        // Check if this IP is banned
        if (userIP) {
            const { data: bannedIP } = await window.sb
                .from('banned_users')
                .select('*')
                .eq('ip_address', userIP)
                .limit(1);
            
            if (bannedIP && bannedIP.length > 0) {
                showError('This IP address is banned. Reason: ' + bannedIP[0].reason);
                submitBtn.innerHTML = txt;
                submitBtn.disabled = false;
                return;
            }
        }
        
        // Check if username exists
        const { data: ex } = await window.sb.from('users').select('username').eq('username', username).limit(1);
        if (ex && ex.length > 0) {
            showError('Username already taken');
            submitBtn.innerHTML = txt;
            submitBtn.disabled = false;
            return;
        }
        
        const h = await hashPassword(password);
        const r = getUserRole(username);
        
        // Create user with IP
        const { data, error } = await window.sb.from('users').insert([{ 
            username: username, 
            password: h, 
            role: r,
            ip_address: userIP,
            created_at: new Date().toISOString()
        }]).select();
        
        if (error) throw error;
        
        const user = data[0];
        user.role = r;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        alert('✅ Account created!');
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error(err);
        showError('Error: ' + err.message);
        submitBtn.innerHTML = txt;
        submitBtn.disabled = false;
    }
});

// Modified login with IP check
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
        
        // Check if IP is banned
        if (userIP) {
            const { data: bannedIP } = await window.sb
                .from('banned_users')
                .select('*')
                .eq('ip_address', userIP)
                .limit(1);
            
            if (bannedIP && bannedIP.length > 0) {
                showError('This IP is banned. Reason: ' + bannedIP[0].reason);
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
        
        // Check if username is banned
        const { data: bannedUser } = await window.sb
            .from('banned_users')
            .select('*')
            .eq('username', u)
            .limit(1);
        
        if (bannedUser && bannedUser.length > 0) {
            showError('Account banned. Reason: ' + bannedUser[0].reason);
            btn.innerHTML = txt;
            btn.disabled = false;
            return;
        }
        
        const user = data[0];
        user.role = getUserRole(user.username);
        
        // Update last login IP
        if (userIP) {
            await window.sb.from('users').update({ 
                last_ip: userIP,
                last_login: new Date().toISOString()
            }).eq('id', user.id);
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