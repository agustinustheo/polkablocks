const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const {
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  ed25519PairFromSeed,
} = require("@polkadot/util-crypto");
const { u8aToHex } = require("@polkadot/util");
const AuthService = require("./services/authService");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize authentication service
const authService = new AuthService();

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "polkadot_wallets",
  password: "",
  port: 5432,
});

// Create tables with user authentication
async function createTables() {
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(128) NOT NULL,
      password_salt VARCHAR(32) NOT NULL,
      session_token VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      mnemonic TEXT NOT NULL,
      public_key VARCHAR(66) NOT NULL,
      secret_key VARCHAR(130) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
    CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
    CREATE INDEX IF NOT EXISTS idx_wallets_email ON wallets(email);
    CREATE INDEX IF NOT EXISTS idx_wallets_public_key ON wallets(public_key);
  `;

  try {
    await pool.query(createTablesQuery);
    console.log("Database tables ready ✓");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

// Utility functions
async function generateWallet() {
  try {
    const mnemonic = mnemonicGenerate();
    const isValidMnemonic = mnemonicValidate(mnemonic);
    const seed = mnemonicToMiniSecret(mnemonic);
    const { publicKey, secretKey } = ed25519PairFromSeed(seed);

    const recoveredSeed = mnemonicToMiniSecret(mnemonic);
    const { publicKey: recoveredPublicKey } =
      ed25519PairFromSeed(recoveredSeed);
    const keysMatch = u8aToHex(publicKey) === u8aToHex(recoveredPublicKey);

    return {
      mnemonic,
      publicKey: u8aToHex(publicKey),
      secretKey: u8aToHex(secretKey),
      seed: u8aToHex(seed),
      isValid: isValidMnemonic && keysMatch,
    };
  } catch (error) {
    console.error("Error generating wallet:", error);
    throw error;
  }
}

async function createUser(email, password) {
  try {
    const { hash, salt } = await authService.hashPassword(password);

    const insertQuery = `
      INSERT INTO users (email, password_hash, password_salt)
      VALUES ($1, $2, $3)
      RETURNING id, email, created_at;
    `;

    const result = await pool.query(insertQuery, [email, hash, salt]);
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      throw new Error("Email already exists");
    }
    console.error("Error creating user:", error);
    throw error;
  }
}

async function getUserByEmail(email) {
  const query = "SELECT * FROM users WHERE email = $1 AND is_active = TRUE";

  try {
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
}

async function updateUserSession(userId, sessionToken) {
  const updateQuery = `
    UPDATE users
    SET session_token = $2, last_login = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email, session_token, last_login;
  `;

  try {
    const result = await pool.query(updateQuery, [userId, sessionToken]);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating user session:", error);
    throw error;
  }
}

async function getUserBySessionToken(sessionToken) {
  const query =
    "SELECT id, email, created_at, last_login FROM users WHERE session_token = $1 AND is_active = TRUE";

  try {
    const result = await pool.query(query, [sessionToken]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting user by session token:", error);
    throw error;
  }
}

async function insertWallet(userId, email, walletData) {
  const insertQuery = `
    INSERT INTO wallets (user_id, email, mnemonic, public_key, secret_key)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, created_at;
  `;

  try {
    const result = await pool.query(insertQuery, [
      userId,
      email,
      walletData.mnemonic,
      walletData.publicKey,
      walletData.secretKey,
    ]);

    return result.rows[0];
  } catch (error) {
    console.error("Error inserting wallet:", error);
    throw error;
  }
}

async function getWalletsByUserId(userId) {
  const query = `
    SELECT id, email, mnemonic, public_key, created_at
    FROM wallets
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error("Error getting wallets by user ID:", error);
    throw error;
  }
}

// Middleware to authenticate requests
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const user = await getUserBySessionToken(token);
    if (!user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Token authentication error:", error);
    res.status(500).json({ error: "Token verification failed" });
  }
}

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Register endpoint
app.post("/api/auth/register", async (req, res) => {
  try {
    console.log("Registration request:", { email: req.body.email });

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!authService.isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password strength
    const passwordValidation = authService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "Password does not meet requirements",
        details: passwordValidation.errors,
      });
    }

    // Create user
    const user = await createUser(email, password);

    // Generate session token
    const sessionToken = authService.generateSessionToken();
    await updateUserSession(user.id, sessionToken);

    console.log("User registered successfully:", user.email);

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        sessionToken,
        createdAt: user.created_at,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Registration failed",
    });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("Login request:", { email: req.body.email });

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValidPassword = await authService.verifyPassword(
      password,
      user.password_hash,
      user.password_salt,
    );
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate new session token
    const sessionToken = authService.generateSessionToken();
    await updateUserSession(user.id, sessionToken);

    console.log("User logged in successfully:", user.email);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        sessionToken,
        lastLogin: user.last_login,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

// Logout endpoint
app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    // Clear session token
    await updateUserSession(req.user.id, null);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
});

// Generate wallet endpoint (requires authentication)
app.post("/api/wallet/generate", authenticateToken, async (req, res) => {
  try {
    console.log("Wallet generation request for user:", req.user.email);

    // Generate wallet
    const wallet = await generateWallet();

    if (!wallet.isValid) {
      return res
        .status(500)
        .json({ error: "Wallet generation failed validation" });
    }

    // Save wallet to database
    const walletData = {
      mnemonic: wallet.mnemonic,
      publicKey: wallet.publicKey,
      secretKey: wallet.secretKey,
    };

    const insertResult = await insertWallet(
      req.user.id,
      req.user.email,
      walletData,
    );

    res.json({
      success: true,
      data: {
        id: insertResult.id,
        email: req.user.email,
        mnemonic: wallet.mnemonic,
        publicKey: wallet.publicKey,
        createdAt: insertResult.created_at,
      },
      message: "Wallet generated and saved successfully",
    });
  } catch (error) {
    console.error("Wallet generation error:", error);
    res.status(500).json({
      success: false,
      error: "Wallet generation failed",
      details: error.message,
    });
  }
});

// Get user's wallets endpoint
app.get("/api/wallet/my-wallets", authenticateToken, async (req, res) => {
  try {
    const wallets = await getWalletsByUserId(req.user.id);

    res.json({
      success: true,
      data: wallets,
      count: wallets.length,
      message: `Found ${wallets.length} wallet(s)`,
    });
  } catch (error) {
    console.error("Get wallets error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve wallets",
      details: error.message,
    });
  }
});

// Get user profile endpoint
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const wallets = await getWalletsByUserId(req.user.id);

    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        walletCount: wallets.length,
        lastLogin: req.user.last_login,
        createdAt: req.user.created_at,
      },
      message: "Profile retrieved successfully",
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve profile",
    });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await createTables();
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Backend API server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Register: POST http://localhost:${PORT}/api/auth/register`);
    console.log(`🔑 Login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(
      `💰 Generate wallet: POST http://localhost:${PORT}/api/wallet/generate`,
    );
  });
}

startServer();

module.exports = app;
