// Supabase Configuration
// ⚠️ IMPORTANT: Replace these values with your own Supabase credentials
const SUPABASE_URL = 'https://nkadsigrsfbyohahpbjp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYWRzaWdyc2ZieW9oYWhwYmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NDMyNTQsImV4cCI6MjA1MDAxOTI1NH0.ZFOgYJ54oaL5IFIoXQqw_v0m6jWqDpJJaVYmwjE1D_o';

// Check if Supabase is loaded
if (typeof window.supabase === 'undefined') {
    console.error('⚠️ Supabase not loaded! Make sure the CDN is loaded before config.js');
}

// Initialize Supabase client - ONLY if not already initialized
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized successfully');
} catch (error) {
    console.error('❌ Supabase initialization error:', error);
}

// Roles and permissions
const ROLES = {
    OWNER: 'owner',
    STAFF: 'staff',
    USER: 'user'
};

// Users with special permissions
const SPECIAL_USERS = {
    '9p': ROLES.OWNER,
    'nelurio': ROLES.STAFF,
    'michou': ROLES.STAFF,
    'zaza': ROLES.STAFF
};

// Function to get user role
function getUserRole(username) {
    return SPECIAL_USERS[username.toLowerCase()] || ROLES.USER;
}

// Function to check if user is staff
function isStaff(username) {
    const role = getUserRole(username);
    return role === ROLES.OWNER || role === ROLES.STAFF;
}

// Function to check if user is owner
function isOwner(username) {
    return getUserRole(username) === ROLES.OWNER;
}

/*
═══════════════════════════════════════════════════════════════════════════════
    SUPABASE SETUP INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Create an account on https://supabase.com
2. Create a new project
3. Go to Settings > API
4. Copy your project URL and anon/public key
5. Replace the values at the top of this file

6. In Supabase, go to SQL Editor and execute this code:

═══════════════════════════════════════════════════════════════════════════════
    SQL TO EXECUTE IN SUPABASE
═══════════════════════════════════════════════════════════════════════════════

-- Table users
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table tickets
CREATE TABLE tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    username TEXT NOT NULL,
    product TEXT NOT NULL,
    price TEXT NOT NULL,
    roblox_username TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    additional_message TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table messages
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    author_role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Public can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read tickets" ON tickets FOR SELECT USING (true);
CREATE POLICY "Public can insert tickets" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update tickets" ON tickets FOR UPDATE USING (true);
CREATE POLICY "Public can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Public can insert messages" ON messages FOR INSERT WITH CHECK (true);

═══════════════════════════════════════════════════════════════════════════════

7. Once tables are created, test your site!

═══════════════════════════════════════════════════════════════════════════════
*/