// Smooth scrolling for anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Active nav link on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (navLink) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink.classList.add('active');
            } else {
                navLink.classList.remove('active');
            }
        }
    });
});

// Modal functions
function openTicket(product, price) {
    const modal = document.getElementById('ticketModal');
    document.getElementById('ticketProduct').value = product;
    document.getElementById('ticketPrice').value = price;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTicketModal() {
    const modal = document.getElementById('ticketModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('ticketForm').reset();
}

// Close modal on backdrop click
document.getElementById('ticketModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'ticketModal') {
        closeTicketModal();
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTicketModal();
    }
});

// Handle ticket form submission
document.getElementById('ticketForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Creating ticket...</span>';
    submitBtn.disabled = true;

    try {
        // Check if Supabase is initialized
        if (!window.supabase || !supabase) {
            throw new Error('Supabase not initialized. Check your configuration.');
        }
        
        // Check if user is logged in
        const currentUser = sessionStorage.getItem('currentUser');
        
        if (!currentUser) {
            alert('You must be logged in to create a ticket. Redirecting to login page...');
            window.location.href = 'login.html';
            return;
        }

        const userData = JSON.parse(currentUser);

        const ticketData = {
            user_id: userData.id,
            username: userData.username,
            product: document.getElementById('ticketProduct').value,
            price: document.getElementById('ticketPrice').value,
            roblox_username: document.getElementById('robloxUsername').value,
            contact_email: document.getElementById('contactEmail').value,
            payment_method: document.getElementById('paymentMethod').value,
            additional_message: document.getElementById('additionalMessage').value,
            status: 'open'
        };

        const { data, error } = await supabase
            .from('tickets')
            .insert([ticketData])
            .select();

        if (error) throw error;

        // Add automatic initial message
        await supabase
            .from('messages')
            .insert([{
                ticket_id: data[0].id,
                author: 'System',
                author_role: 'system',
                content: `Ticket created successfully! A member of our team will contact you soon.
                
Product: ${ticketData.product}
Price: ${ticketData.price}
Roblox Username: ${ticketData.roblox_username}
Email: ${ticketData.contact_email}
Payment Method: ${ticketData.payment_method}

${ticketData.additional_message ? 'Message: ' + ticketData.additional_message : ''}`
            }]);

        alert('✅ Ticket created successfully! You can view it in your customer area.');
        closeTicketModal();
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error creating ticket: ' + error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.product-card, .feature-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Check if user is logged in
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = sessionStorage.getItem('currentUser');
    const loginBtn = document.querySelector('.btn-login');
    
    if (currentUser && loginBtn) {
        const userData = JSON.parse(currentUser);
        loginBtn.textContent = `👤 ${userData.username}`;
        loginBtn.href = 'dashboard.html';
    }
});