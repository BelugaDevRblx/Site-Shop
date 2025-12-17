let currentUser = null;
let currentFilter = 'all';
let allTickets = [];

// Check authentication
window.addEventListener('DOMContentLoaded', async () => {
    const userData = sessionStorage.getItem('currentUser');
    
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    
    // Update interface with user info
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userRole').textContent = getRoleDisplay(currentUser.role);
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileRole').textContent = getRoleDisplay(currentUser.role);
    
    if (currentUser.created_at) {
        const date = new Date(currentUser.created_at);
        document.getElementById('profileCreated').textContent = date.toLocaleDateString('en-US');
    }
    
    // Set avatar according to role
    const avatarElement = document.getElementById('userAvatar');
    if (currentUser.role === 'owner') {
        avatarElement.textContent = '👑';
        avatarElement.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
    } else if (currentUser.role === 'staff') {
        avatarElement.textContent = '⭐';
        avatarElement.style.background = 'linear-gradient(135deg, #a855f7, #ec4899)';
    }
    
    // Load tickets
    await loadTickets();
    
    // Setup navigation
    setupNavigation();
});

// Get role display name
function getRoleDisplay(role) {
    const roles = {
        'owner': '👑 Owner',
        'staff': '⭐ Staff',
        'user': '👤 User'
    };
    return roles[role] || roles.user;
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            document.querySelectorAll('.content-section').forEach(sec => {
                sec.classList.remove('active');
            });
            document.getElementById(section + 'Section').classList.add('active');
            
            // Update page title
            const titles = {
                'tickets': 'My Tickets',
                'profile': 'My Profile'
            };
            document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
        });
    });
}

// Load tickets
async function loadTickets() {
    const ticketsList = document.getElementById('ticketsList');
    ticketsList.innerHTML = '<div class="loading">Loading tickets...</div>';
    
    try {
        // Check if Supabase is initialized
        if (!window.supabase || !supabase) {
            throw new Error('Supabase not initialized. Check your configuration.');
        }
        
        let query = supabase.from('tickets').select('*');
        
        // If user is not staff, only show their tickets
        if (!isStaff(currentUser.username)) {
            query = query.eq('user_id', currentUser.id);
        }
        
        const { data: tickets, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allTickets = tickets || [];
        
        // Update stats
        updateStats(allTickets);
        
        // Display tickets
        displayTickets(allTickets);
        
    } catch (error) {
        console.error('Loading error:', error);
        ticketsList.innerHTML = '<div class="loading">❌ Error loading tickets: ' + error.message + '</div>';
    }
}

// Update statistics
function updateStats(tickets) {
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'open').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    
    document.getElementById('totalTickets').textContent = total;
    document.getElementById('pendingTickets').textContent = pending;
    document.getElementById('closedTickets').textContent = closed;
}

// Display tickets based on filter
function displayTickets(tickets) {
    const ticketsList = document.getElementById('ticketsList');
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎫</div>
                <div class="empty-state-title">No tickets</div>
                <div class="empty-state-text">You don't have any tickets yet</div>
                <a href="index.html#shop" class="btn btn-primary">Create a ticket</a>
            </div>
        `;
        return;
    }
    
    ticketsList.innerHTML = tickets.map(ticket => createTicketCard(ticket)).join('');
}

// Create ticket card HTML
function createTicketCard(ticket) {
    const date = new Date(ticket.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
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
                <div class="ticket-info-item">
                    📅 ${formattedDate}
                </div>
                <div class="ticket-info-item">
                    💰 ${ticket.price}
                </div>
                <div class="ticket-info-item">
                    👤 ${ticket.roblox_username}
                </div>
                ${isStaff(currentUser.username) ? `
                    <div class="ticket-info-item">
                        🔑 Client: ${ticket.username}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Filter tickets
function filterTickets(filter) {
    currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    let filtered = allTickets;
    
    if (filter === 'open') {
        filtered = allTickets.filter(t => t.status === 'open');
    } else if (filter === 'closed') {
        filtered = allTickets.filter(t => t.status === 'closed');
    }
    
    displayTickets(filtered);
}

// Open ticket detail
async function openTicketDetail(ticketId) {
    const modal = document.getElementById('ticketDetailModal');
    const content = document.getElementById('ticketDetailContent');
    
    content.innerHTML = '<div class="loading">Loading...</div>';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    try {
        // Check if Supabase is initialized
        if (!window.supabase || !supabase) {
            throw new Error('Supabase not initialized. Check your configuration.');
        }
        
        // Load ticket
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', ticketId)
            .single();
        
        if (ticketError) throw ticketError;
        
        // Load messages
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;
        
        // Display detail
        content.innerHTML = createTicketDetailHTML(ticket, messages);
        
        // Setup reply form
        setupReplyForm(ticketId);
        
    } catch (error) {
        console.error('Error:', error);
        content.innerHTML = '<div class="loading">❌ Loading error: ' + error.message + '</div>';
    }
}

// Create ticket detail HTML
function createTicketDetailHTML(ticket, messages) {
    const date = new Date(ticket.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
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
            <div class="detail-row">
                <span class="detail-label">Price</span>
                <span class="detail-value">${ticket.price}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Roblox Username</span>
                <span class="detail-value">${ticket.roblox_username}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value">${ticket.contact_email}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment</span>
                <span class="detail-value">${ticket.payment_method}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created on</span>
                <span class="detail-value">${formattedDate}</span>
            </div>
            ${isStaff(currentUser.username) ? `
                <div class="detail-row">
                    <span class="detail-label">Client</span>
                    <span class="detail-value">${ticket.username}</span>
                </div>
            ` : ''}
        </div>
        
        <div class="messages-section">
            <h3 class="messages-title">💬 Messages</h3>
            <div class="messages-list">
                ${messages.map(msg => createMessageHTML(msg)).join('')}
            </div>
            
            ${ticket.status === 'open' ? `
                <form class="reply-form" id="replyForm">
                    <div class="form-group">
                        <label>Your reply</label>
                        <textarea id="replyMessage" class="form-input" rows="4" required placeholder="Type your message..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <span>Send</span>
                    </button>
                </form>
            ` : '<p style="text-align: center; color: var(--text-secondary);">This ticket is closed</p>'}
        </div>
        
        ${isStaff(currentUser.username) && ticket.status === 'open' ? `
            <div class="admin-actions">
                <button class="btn btn-secondary" onclick="closeTicket('${ticket.id}')">
                    <span>✓ Close ticket</span>
                </button>
            </div>
        ` : ''}
    `;
}

// Create message HTML
function createMessageHTML(message) {
    const date = new Date(message.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const isStaffMessage = message.author_role === 'staff' || message.author_role === 'owner';
    const staffClass = isStaffMessage ? 'staff' : '';
    
    return `
        <div class="message ${staffClass}">
            <div class="message-header">
                <span class="message-author">${message.author} ${getRoleEmoji(message.author_role)}</span>
                <span class="message-date">${formattedDate}</span>
            </div>
            <div class="message-content">${message.content.replace(/\n/g, '<br>')}</div>
        </div>
    `;
}

// Get role emoji
function getRoleEmoji(role) {
    const emojis = {
        'owner': '👑',
        'staff': '⭐',
        'system': '🤖',
        'user': '👤'
    };
    return emojis[role] || '';
}

// Setup reply form
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
            // Check if Supabase is initialized
            if (!window.supabase || !supabase) {
                throw new Error('Supabase not initialized. Check your configuration.');
            }
            
            const { error } = await supabase
                .from('messages')
                .insert([{
                    ticket_id: ticketId,
                    author: currentUser.username,
                    author_role: currentUser.role,
                    content: message
                }]);
            
            if (error) throw error;
            
            // Reload ticket
            await openTicketDetail(ticketId);
            
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error sending message: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Send</span>';
        }
    });
}

// Close ticket (staff only)
async function closeTicket(ticketId) {
    if (!confirm('Are you sure you want to close this ticket?')) {
        return;
    }
    
    try {
        // Check if Supabase is initialized
        if (!window.supabase || !supabase) {
            throw new Error('Supabase not initialized. Check your configuration.');
        }
        
        const { error } = await supabase
            .from('tickets')
            .update({ status: 'closed', updated_at: new Date().toISOString() })
            .eq('id', ticketId);
        
        if (error) throw error;
        
        // Add closing message
        await supabase
            .from('messages')
            .insert([{
                ticket_id: ticketId,
                author: currentUser.username,
                author_role: currentUser.role,
                content: '✓ Ticket closed by ' + currentUser.username
            }]);
        
        alert('✅ Ticket closed successfully');
        closeTicketDetail();
        await loadTickets();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error closing ticket: ' + error.message);
    }
}

// Close ticket detail modal
function closeTicketDetail() {
    const modal = document.getElementById('ticketDetailModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal on backdrop click
document.getElementById('ticketDetailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'ticketDetailModal') {
        closeTicketDetail();
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTicketDetail();
    }
});

// Logout function
function logout() {
    if (confirm('Do you really want to log out?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}