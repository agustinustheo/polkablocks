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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection (same config as your CLI tool)
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "polkadot_wallets",
  password: "", // Using trust authentication
  port: 5432,
});

// Utility functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function generateWallet() {
  try {
    const mnemonic = mnemonicGenerate();
    const isValidMnemonic = mnemonicValidate(mnemonic);
    const seed = mnemonicToMiniSecret(mnemonic);
    const { publicKey, secretKey } = ed25519PairFromSeed(seed);

    // Test mnemonic recovery
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

async function insertWallet(walletData) {
  const insertQuery = `
    INSERT INTO wallets (email, mnemonic, public_key, secret_key)
    VALUES ($1, $2, $3, $4)
    RETURNING id, created_at;
  `;

  try {
    const result = await pool.query(insertQuery, [
      walletData.email,
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

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Generate wallet endpoint
app.post("/api/wallet/generate", async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Generate wallet
    const wallet = await generateWallet();

    if (!wallet.isValid) {
      return res
        .status(500)
        .json({ error: "Wallet generation failed validation" });
    }

    // Save to database
    const walletData = {
      email,
      mnemonic: wallet.mnemonic,
      publicKey: wallet.publicKey,
      secretKey: wallet.secretKey,
    };

    const insertResult = await insertWallet(walletData);

    // Return response (excluding secret key for security)
    res.json({
      success: true,
      data: {
        id: insertResult.id,
        email,
        mnemonic: wallet.mnemonic,
        publicKey: wallet.publicKey,
        createdAt: insertResult.created_at,
      },
      message: "Wallet generated and saved successfully",
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Get wallets by email
app.get("/api/wallet/:email", async (req, res) => {
  try {
    const { email } = req.params;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const query = `
      SELECT id, email, mnemonic, public_key, created_at
      FROM wallets
      WHERE email = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [email]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      message: `Found ${result.rows.length} wallet(s) for ${email}`,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Test database connection on startup
async function testConnection() {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `💰 Generate wallet: POST http://localhost:${PORT}/api/wallet/generate`,
  );
  testConnection();
});

module.exports = app;
