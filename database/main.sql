-- Create database (run this as postgres superuser)
CREATE DATABASE polkadot_wallets;

-- Connect to the database and create the table
\c polkadot_wallets;

-- Create wallets table
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    mnemonic TEXT NOT NULL,
    public_key VARCHAR(66) NOT NULL,
    secret_key VARCHAR(130) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_email ON wallets(email);
CREATE INDEX idx_public_key ON wallets(public_key);

-- Optional: Create a function to get wallets by email
CREATE OR REPLACE FUNCTION get_wallets_by_email(user_email VARCHAR)
RETURNS TABLE(
    id INTEGER,
    email VARCHAR,
    mnemonic TEXT,
    public_key VARCHAR,
    secret_key VARCHAR,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT w.id, w.email, w.mnemonic, w.public_key, w.secret_key, w.created_at
    FROM wallets w
    WHERE w.email = user_email
    ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a function to count wallets by email
CREATE OR REPLACE FUNCTION count_wallets_by_email(user_email VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM wallets WHERE email = user_email);
END;
$$ LANGUAGE plpgsql;
