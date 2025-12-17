// Configuration Supabase
// ⚠️ IMPORTANT: Remplacez ces valeurs par vos propres identifiants Supabase
const SUPABASE_URL = 'VOTRE_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'VOTRE_SUPABASE_ANON_KEY';

// Initialiser le client Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rôles et permissions
const ROLES = {
    OWNER: 'owner',
    STAFF: 'staff',
    USER: 'user'
};

// Utilisateurs avec permissions spéciales
const SPECIAL_USERS = {
    '9p': ROLES.OWNER,
    'nelurio': ROLES.STAFF,
    'michou': ROLES.STAFF
};

// Fonction pour obtenir le rôle d'un utilisateur
function getUserRole(username) {
    return SPECIAL_USERS[username.toLowerCase()] || ROLES.USER;
}

// Fonction pour vérifier si l'utilisateur est staff
function isStaff(username) {
    const role = getUserRole(username);
    return role === ROLES.OWNER || role === ROLES.STAFF;
}

// Fonction pour vérifier si l'utilisateur est owner
function isOwner(username) {
    return getUserRole(username) === ROLES.OWNER;
}

/*
INSTRUCTIONS POUR CONFIGURER SUPABASE:

1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Copiez l'URL et la clé ANON depuis Settings > API
4. Remplacez les valeurs ci-dessus

5. Créez les tables suivantes dans SQL Editor:

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

-- Index pour améliorer les performances
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);

-- Activer Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour users (tout le monde peut lire et créer)
CREATE POLICY "Users can read all" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert" ON users FOR INSERT WITH CHECK (true);

-- Politiques RLS pour tickets
CREATE POLICY "Users can read own tickets" ON tickets FOR SELECT USING (true);
CREATE POLICY "Users can insert tickets" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own tickets" ON tickets FOR UPDATE USING (true);

-- Politiques RLS pour messages
CREATE POLICY "Users can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (true);
*/