let currentUser = null;
let currentFilter = 'all';
let allTickets = [];
let realtimeChannel = null;

// Profanity filter
const PROFANITY_LIST = ['fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'nigger', 'nigga', 'cunt', 'whore', 'slut', 'faggot', 'retard', 'porn', 'sex', 'xxx'];

function filterProfanity(text) {
    if (!text) return text;
    let filtered = text;
    PROFANITY_LIST.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    return filtered;
}

window.addEventListener('DOMContentLoaded', async () => {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    
    // Check if user is banned
    const { data: bannedUser } = await window.sb.from('banned_users').select('*').eq('username', currentUser.username).limit(1);
    if (bannedUser && bannedUser.length > 0) {
        alert('❌ Your account has been banned. Reason: ' + bannedUser[0].reason);
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userRole').textContent = getRoleDisplay(currentUser.role);
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileRole').textContent = getRoleDisplay(currentUser.role);
    
    if (currentUser.created_at) {
        const date = new Date(currentUser.created_at);
        document.getElementById('profileCreated').textContent = date.toLocaleDateString('en-US');
    }
    
    const avatarElement = document.getElementById('userAvatar');
    if (currentUser.role === 'owner') {
        avatarElement.textContent = '👑';
        avatarElement.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
    } else if (currentUser.role === 'staff') {
        avatarElement.textContent = '⭐';
        avatarElement.style.background = 'linear-gradient(135deg, #a855f7, #ec4899)';
    }
    
    await loadTickets();
    setupNavigation();
    setupRealtime();
});

function getRoleDisplay(role) {
    const roles = { 'owner': '👑 Owner', 'staff': '⭐ Staff', 'user': '👤 User' };
    return roles[role] || roles.user;
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(section + 'Section').classList.add('active');
            const titles = { 'tickets': 'My Tickets', 'profile': 'My Profile' };
            document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
        });
    });
}

// Setup real-time updates
function setupRealtime() {
    if (realtimeChannel) realtimeChannel.unsubscribe();
    
    realtimeChannel = window.sb.channel('tickets-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, payload => {
            console.log('Ticket change detected:', payload);
            loadTickets();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
            console.log('Message change detected:', payload);
            // Reload messages if currently viewing this ticket
            const modal = document.getElementById('ticketDetailModal');
            if (modal.classList.contains('active')) {
                const currentTicketId = modal.dataset.currentTicketId;
                if (currentTicketId && payload.new && payload.new.ticket_id === currentTicketId) {
                    reloadMessages(currentTicketId);
                }
            }
        })
        .subscribe();
}

async function loadTickets() {
    const ticketsList = document.getElementById('ticketsList');
    ticketsList.innerHTML = '<div class="loading">Loading tickets...</div>';
    
    try {
        let query = window.sb.from('tickets').select('*');
        if (!isStaff(currentUser.username)) {
            query = query.eq('user_id', currentUser.id);
        }
        const { data: tickets, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        
        allTickets = tickets || [];
        updateStats(allTickets);
        displayTickets(allTickets);
    } catch (error) {
        console.error('Loading error:', error);
        ticketsList.innerHTML = '<div class="loading">❌ Error loading tickets: ' + error.message + '</div>';
    }
}

function updateStats(tickets) {
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'open').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    document.getElementById('totalTickets').textContent = total;
    document.getElementById('pendingTickets').textContent = pending;
    document.getElementById('closedTickets').textContent = closed;
}

function displayTickets(tickets) {
    const ticketsList = document.getElementById('ticketsList');
    if (tickets.length === 0) {
        ticketsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎫</div>
                <div class="empty-state-title">No tickets</div>
                <div class="empty-state-text">You don't have any tickets yet</div>
                <a href="index.html#shop" class="btn btn-primary">Create a ticket</a>
            </div>`;
        return;
    }
    ticketsList.innerHTML = tickets.map(ticket => createTicketCard(ticket)).join('');
}

function createTicketCard(ticket) {
    const date = new Date(ticket.created_at);
    const formattedDate = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const statusClass = ticket.status === 'open' ? 'open' : 'closed';
    const statusText = ticket.status === 'open' ? 'Open' : 'Closed';
    
    return `
        <div class="ticket-card" onclick="openTicketDetail('${ticket.id}')">
            <div class="ticket-header">
                <div>
                    <div class="ticket-id">#${ticket.id.substring(0, 8).toUpperCase()}</div>
                    <div class="ticket-product">${ticket.product}</div>
                </div>
                <div class="ticket-status ${statusClass}">${statusText}</div>
            </div>
            <div class="ticket-info">
                <div class="ticket-info-item">📅 ${formattedDate}</div>
                <div class="ticket-info-item">💰 ${ticket.price}</div>
                <div class="ticket-info-item">👤 ${ticket.roblox_username}</div>
                ${isStaff(currentUser.username) ? `<div class="ticket-info-item">🔑 Client: ${ticket.username}</div>` : ''}
            </div>
        </div>`;
}

function filterTickets(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    let filtered = allTickets;
    if (filter === 'open') filtered = allTickets.filter(t => t.status === 'open');
    else if (filter === 'closed') filtered = allTickets.filter(t => t.status === 'closed');
    displayTickets(filtered);
}

async function openTicketDetail(ticketId) {
    const modal = document.getElementById('ticketDetailModal');
    const content = document.getElementById('ticketDetailContent');
    modal.dataset.currentTicketId = ticketId;
    content.innerHTML = '<div class="loading">Loading...</div>';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    try {
        const { data: ticket, error: ticketError } = await window.sb.from('tickets').select('*').eq('id', ticketId).single();
        if (ticketError) throw ticketError;
        
        const { data: messages, error: messagesError } = await window.sb.from('messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
        if (messagesError) throw messagesError;
        
        content.innerHTML = createTicketDetailHTML(ticket, messages);
        setupReplyForm(ticketId);
    } catch (error) {
        console.error('Error:', error);
        content.innerHTML = '<div class="loading">❌ Loading error: ' + error.message + '</div>';
    }
}

function createTicketDetailHTML(ticket, messages) {
    const date = new Date(ticket.created_at);
    const formattedDate = date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const statusClass = ticket.status === 'open' ? 'open' : 'closed';
    const statusText = ticket.status === 'open' ? '⏳ Open' : '✅ Closed';
    
    return `
        <div class="ticket-detail-header">
            <div>
                <div class="ticket-id">#${ticket.id.substring(0, 8).toUpperCase()}</div>
                <h2 class="ticket-detail-title">${ticket.product}</h2>
            </div>
            <div class="ticket-status ${statusClass}">${statusText}</div>
        </div>
        <div class="ticket-detail-info">
            <div class="detail-row"><span class="detail-label">Price</span><span class="detail-value">${ticket.price}</span></div>
            <div class="detail-row"><span class="detail-label">Roblox Username</span><span class="detail-value">${ticket.roblox_username}</span></div>
            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${ticket.contact_email}</span></div>
            <div class="detail-row"><span class="detail-label">Payment</span><span class="detail-value">${ticket.payment_method}</span></div>
            <div class="detail-row"><span class="detail-label">Created on</span><span class="detail-value">${formattedDate}</span></div>
            ${isStaff(currentUser.username) ? `<div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">${ticket.username}</span></div>` : ''}
        </div>
        <div class="messages-section">
            <h3 class="messages-title">💬 Messages</h3>
            <div class="messages-list">${messages.map(msg => createMessageHTML(msg)).join('')}</div>
            ${ticket.status === 'open' ? `
                <form class="reply-form" id="replyForm">
                    <div class="form-group">
                        <label>Your reply</label>
                        <textarea id="replyMessage" class="form-input" rows="4" required placeholder="Type your message..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary"><span>Send</span></button>
                </form>` : '<p style="text-align: center; color: var(--text-secondary);">This ticket is closed</p>'}
        </div>
        ${isStaff(currentUser.username) && ticket.status === 'open' ? `
            <div class="admin-actions">
                <button class="btn btn-secondary" onclick="closeTicket('${ticket.id}')"><span>✓ Close ticket</span></button>
                <button class="btn btn-danger" onclick="banUser('${ticket.username}')"><span>🚫 Ban User</span></button>
            </div>` : ''}
        ${isStaff(currentUser.username) ? `
            <div class="admin-actions" style="margin-top: 1rem;">
                <button class="btn btn-primary" onclick="showUnbanForm()"><span>🔓 Unban User</span></button>
            </div>` : ''}`;
}

function createMessageHTML(message) {
    const date = new Date(message.created_at);
    const formattedDate = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const isStaffMessage = message.author_role === 'staff' || message.author_role === 'owner';
    const staffClass = isStaffMessage ? 'staff' : '';
    const filteredContent = filterProfanity(message.content);
    
    return `
        <div class="message ${staffClass}">
            <div class="message-header">
                <span class="message-author">${message.author} ${getRoleEmoji(message.author_role)}</span>
                <span class="message-date">${formattedDate}</span>
            </div>
            <div class="message-content">${filteredContent.replace(/\n/g, '<br>')}</div>
        </div>`;
}

function getRoleEmoji(role) {
    const emojis = { 'owner': '👑', 'staff': '⭐', 'system': '🤖', 'user': '👤' };
    return emojis[role] || '';
}

function setupReplyForm(ticketId) {
    const form = document.getElementById('replyForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = document.getElementById('replyMessage').value.trim();
        if (!message) return;
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending...</span>';
        
        try {
            const { error } = await window.sb.from('messages').insert([{
                ticket_id: ticketId,
                author: currentUser.username,
                author_role: currentUser.role,
                content: message
            }]);
            if (error) throw error;
            
            // Clear the textarea
            document.getElementById('replyMessage').value = '';
            
            // Reload messages instantly
            await reloadMessages(ticketId);
            
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Send</span>';
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error sending message: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Send</span>';
        }
    });
}

// Function to reload just the messages without closing the modal
async function reloadMessages(ticketId) {
    try {
        const { data: messages, error } = await window.sb
            .from('messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // Update just the messages list
        const messagesList = document.querySelector('.messages-list');
        if (messagesList) {
            messagesList.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');
            // Scroll to bottom
            messagesList.scrollTop = messagesList.scrollHeight;
        }
    } catch (error) {
        console.error('Error reloading messages:', error);
    }
}

async function closeTicket(ticketId) {
    if (!confirm('Are you sure you want to close this ticket?')) return;
    
    try {
        const { error } = await window.sb.from('tickets').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', ticketId);
        if (error) throw error;
        
        await window.sb.from('messages').insert([{
            ticket_id: ticketId,
            author: currentUser.username,
            author_role: currentUser.role,
            content: '✓ Ticket closed by ' + currentUser.username
        }]);
        
        alert('✅ Ticket closed successfully');
        closeTicketDetail();
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error closing ticket: ' + error.message);
    }
}

async function banUser(username) {
    const reason = prompt('Reason for ban:');
    if (!reason) return;
    
    if (!confirm(`Ban user ${username}? Reason: ${reason}`)) return;
    
    try {
        const { error } = await window.sb.from('banned_users').insert([{
            username: username,
            banned_by: currentUser.username,
            reason: reason,
            banned_at: new Date().toISOString()
        }]);
        if (error) throw error;
        
        alert(`✅ User ${username} has been banned`);
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error banning user: ' + error.message);
    }
}

function showUnbanForm() {
    const username = prompt('Username to unban:');
    if (!username) return;
    unbanUser(username);
}

async function unbanUser(username) {
    if (!confirm(`Unban user ${username}?`)) return;
    
    try {
        const { error } = await window.sb.from('banned_users').delete().eq('username', username);
        if (error) throw error;
        
        alert(`✅ User ${username} has been unbanned`);
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error unbanning user: ' + error.message);
    }
}

function closeTicketDetail() {
    const modal = document.getElementById('ticketDetailModal');
    modal.classList.remove('active');
    modal.dataset.currentTicketId = '';
    document.body.style.overflow = 'auto';
}

document.getElementById('ticketDetailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'ticketDetailModal') closeTicketDetail();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTicketDetail();
});

function logout() {
    if (confirm('Do you really want to log out?')) {
        if (realtimeChannel) realtimeChannel.unsubscribe();
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}