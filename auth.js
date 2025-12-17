// Toggle register section
function toggleRegister() {
    const registerSection = document.getElementById('registerSection');
    const isVisible = registerSection.style.display === 'block';
    registerSection.style.display = isVisible ? 'none' : 'block';
}

// Show error
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => errorDiv.classList.remove('show'), 5000);
}

// Hash password
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// LOGIN
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<span>Logging in...</span>';
    submitBtn.disabled = true;
    
    try {
        const hashedPassword = await hashPassword(password);
        
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', hashedPassword)
            .limit(1);
        
        if (error) throw error;
        
        if (!users || users.length === 0) {
            showError('Incorrect username or password');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        const user = users[0];
        user.role = getUserRole(user.username);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Login error: ' + error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// REGISTER
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<span>Registering...</span>';
    submitBtn.disabled = true;
    
    try {
        const { data: existingUsers } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .limit(1);
        
        if (existingUsers && existingUsers.length > 0) {
            showError('Username already taken');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        const hashedPassword = await hashPassword(password);
        const role = getUserRole(username);
        
        const { data, error } = await supabase
            .from('users')
            .insert([{
                username: username,
                password: hashedPassword,
                role: role
            }])
            .select();
        
        if (error) throw error;
        
        const user = data[0];
        user.role = role;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        alert('✅ Account created successfully!');
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Registration error:', error);
        showError('Registration error: ' + error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'dashboard.html';
    }
});