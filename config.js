// Config
window.SUPABASE_URL = 'https://nkadsigrsfbyohahpbjp.supabase.co';
window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYWRzaWdyc2ZieW9oYWhwYmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjcxNzIsImV4cCI6MjA4MTU0MzE3Mn0.P7iN-jMF0d3MskrkSPEe7UdNnP_tkaDRJaKC9O0cSQ4';

window.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);

window.ROLES = { OWNER: 'owner', STAFF: 'staff', USER: 'user' };
window.SPECIAL_USERS = { '9p': 'owner', 'nelurio': 'staff', 'michou': 'staff', 'zaza': 'staff' };

window.getUserRole = (username) => window.SPECIAL_USERS[username.toLowerCase()] || 'user';
window.isStaff = (username) => ['owner', 'staff'].includes(window.getUserRole(username));
window.isOwner = (username) => window.getUserRole(username) === 'owner';

console.log('✅ Ready');