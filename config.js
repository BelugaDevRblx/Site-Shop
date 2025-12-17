// Supabase Configuration
const SUPABASE_URL = 'https://nkadsigrsfbyohahpbjp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYWRzaWdyc2ZieW9oYWhwYmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjcxNzIsImV4cCI6MjA4MTU0MzE3Mn0.P7iN-jMF0d3MskrkSPEe7UdNnP_tkaDRJaKC9O0cSQ4';

// Initialize using the global supabase from CDN
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Roles
const getUserRole = (username) => {
    const roles = { '9p': 'owner', 'nelurio': 'staff', 'michou': 'staff', 'zaza': 'staff' };
    return roles[username.toLowerCase()] || 'user';
};

const isStaff = (username) => ['owner', 'staff'].includes(getUserRole(username));
const isOwner = (username) => getUserRole(username) === 'owner';

console.log('✅ Config loaded');