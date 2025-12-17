// IP BAN FUNCTIONS FOR DASHBOARD
// Add these functions to your dashboard.js

// Ban user by username AND IP
async function banUser(username) {
    const reason = prompt('Reason for ban:');
    if (!reason) return;
    
    if (!confirm(`Ban user ${username} and their IP? Reason: ${reason}`)) return;
    
    try {
        // Get user's IP from users table
        const { data: userData } = await window.sb
            .from('users')
            .select('ip_address, last_ip')
            .eq('username', username)
            .limit(1);
        
        const userIP = userData && userData.length > 0 ? (userData[0].last_ip || userData[0].ip_address) : null;
        
        // Ban username + IP
        const { error } = await window.sb.from('banned_users').insert([{
            username: username,
            ip_address: userIP,
            banned_by: currentUser.username,
            reason: reason,
            banned_at: new Date().toISOString()
        }]);
        
        if (error) throw error;
        
        // Log the ban
        if (userIP) {
            await window.sb.from('ip_ban_logs').insert([{
                ip_address: userIP,
                username: username,
                banned_by: currentUser.username,
                reason: reason
            }]);
        }
        
        alert(`✅ User ${username} banned!\nIP: ${userIP || 'Unknown'}`);
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error banning user: ' + error.message);
    }
}

// Ban by IP address directly
async function banIP() {
    const ipAddress = prompt('Enter IP address to ban:');
    if (!ipAddress) return;
    
    const reason = prompt('Reason for IP ban:');
    if (!reason) return;
    
    if (!confirm(`Ban IP ${ipAddress}? Reason: ${reason}`)) return;
    
    try {
        const { error } = await window.sb.from('banned_users').insert([{
            ip_address: ipAddress,
            username: null,
            banned_by: currentUser.username,
            reason: reason,
            banned_at: new Date().toISOString()
        }]);
        
        if (error) throw error;
        
        // Log the ban
        await window.sb.from('ip_ban_logs').insert([{
            ip_address: ipAddress,
            username: null,
            banned_by: currentUser.username,
            reason: reason
        }]);
        
        alert(`✅ IP ${ipAddress} has been banned!`);
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error banning IP: ' + error.message);
    }
}

// View all IPs for a user
async function viewUserIPs(username) {
    try {
        const { data, error } = await window.sb
            .from('users')
            .select('ip_address, last_ip, last_login, created_at')
            .eq('username', username)
            .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            const user = data[0];
            const message = `
User: ${username}
Registration IP: ${user.ip_address || 'Unknown'}
Last IP: ${user.last_ip || 'Unknown'}
Last Login: ${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
Registered: ${new Date(user.created_at).toLocaleString()}
            `;
            alert(message);
        } else {
            alert('User not found');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
    }
}

// View all users with the same IP
async function findUsersByIP(ipAddress) {
    try {
        const { data, error } = await window.sb
            .from('users')
            .select('username, created_at')
            .or(`ip_address.eq.${ipAddress},last_ip.eq.${ipAddress}`);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            const userList = data.map(u => `- ${u.username} (${new Date(u.created_at).toLocaleDateString()})`).join('\n');
            alert(`Users with IP ${ipAddress}:\n\n${userList}`);
        } else {
            alert('No users found with this IP');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
    }
}

// Add these buttons to your ticket detail modal admin actions section:
/*
<button class="btn btn-danger" onclick="banUser('${ticket.username}')">
    <span>🚫 Ban User + IP</span>
</button>
<button class="btn btn-danger" onclick="viewUserIPs('${ticket.username}')">
    <span>🔍 View User IPs</span>
</button>
<button class="btn btn-danger" onclick="banIP()">
    <span>🚫 Ban IP Address</span>
</button>
*/