// Supabase Configuration
const SUPABASE_URL = 'https://nkadsigrsfbyohahpbjp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYWRzaWdyc2ZieW9oYWhwYmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjcxNzIsImV4cCI6MjA4MTU0MzE3Mn0.P7iN-jMF0d3MskrkSPEe7UdNnP_tkaDRJaKC9O0cSQ4';

// Initialize Supabase - UNE SEULE FOIS !
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Roles
const ROLES = {
    OWNER: 'owner',
    STAFF: 'staff',
    USER: 'user'
};

// Special users
const SPECIAL_USERS = {
    '9p': ROLES.OWNER,
    'nelurio': ROLES.STAFF,
    'michou': ROLES.STAFF,
    'zaza': ROLES.STAFF
};

// Get user role
function getUserRole(username) {
    return SPECIAL_USERS[username.toLowerCase()] || ROLES.USER;
}

// Check if staff
function isStaff(username) {
    const role = getUserRole(username);
    return role === ROLES.OWNER || role === ROLES.STAFF;
}

// Check if owner
function isOwner(username) {
    return getUserRole(username) === ROLES.OWNER;
}

console.log('✅ Config loaded');