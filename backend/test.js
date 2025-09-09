const {
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  ed25519PairFromSeed,
} = require("@polkadot/util-crypto");
const { u8aToHex } = require("@polkadot/util");
const { Pool } = require("pg");
const readline = require("readline");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "polkadot_wallets",
  password: "",
  port: 5432,
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to get user input
function getUserInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to create the wallets table if it doesn't exist
async function createWalletTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      mnemonic TEXT NOT NULL,
      public_key VARCHAR(66) NOT NULL,
      secret_key VARCHAR(130) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_email ON wallets(email);
    CREATE INDEX IF NOT EXISTS idx_public_key ON wallets(public_key);
  `;

  try {
    await pool.query(createTableQuery);
    console.log("Database table ready ✓");
  } catch (error) {
    console.error("Error creating table:", error);
    throw error;
  }
}

// Function to insert wallet into PostgreSQL
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

// Function to generate wallet (your existing logic)
async function generateWallet() {
  try {
    const mnemonicAlice = mnemonicGenerate();
    console.log(`Generated mnemonic: ${mnemonicAlice}`);

    const isValidMnemonic = mnemonicValidate(mnemonicAlice);
    console.log(`isValidMnemonic: ${isValidMnemonic}`);

    const seedAlice = mnemonicToMiniSecret(mnemonicAlice);
    console.log(`Seed (hex): ${u8aToHex(seedAlice)}`);

    const { publicKey, secretKey } = ed25519PairFromSeed(seedAlice);
    console.log(`Public Key (hex): ${u8aToHex(publicKey)}`);
    console.log(`Secret Key (hex): ${u8aToHex(secretKey)}`);

    // Test mnemonic recovery
    console.log("\n--- Testing mnemonic recovery ---");
    const recoveredSeed = mnemonicToMiniSecret(mnemonicAlice);
    const { publicKey: recoveredPublicKey } =
      ed25519PairFromSeed(recoveredSeed);
    const keysMatch = u8aToHex(publicKey) === u8aToHex(recoveredPublicKey);
    console.log(`Keys match after recovery: ${keysMatch}`);

    return {
      mnemonic: mnemonicAlice,
      publicKey: u8aToHex(publicKey),
      secretKey: u8aToHex(secretKey),
      isValid: isValidMnemonic && keysMatch,
    };
  } catch (error) {
    console.error("Error generating wallet:", error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log("Polkadot Wallet Generator with PostgreSQL");
    console.log("==========================================\n");

    // Initialize database
    await createWalletTable();

    // Get email from user
    let email;
    while (true) {
      email = await getUserInput("Please enter your email address: ");

      if (!email) {
        console.log("Email is required. Please try again.\n");
        continue;
      }

      if (!isValidEmail(email)) {
        console.log("Please enter a valid email address.\n");
        continue;
      }

      break;
    }

    console.log(`\nGenerating wallet for: ${email}\n`);

    // Generate wallet
    const wallet = await generateWallet();

    // Check if wallet is valid before inserting
    if (wallet.isValid === true) {
      console.log("\n✓ Wallet validation successful!");

      // Prepare data for database
      const walletData = {
        email: email,
        mnemonic: wallet.mnemonic,
        publicKey: wallet.publicKey,
        secretKey: wallet.secretKey,
      };

      // Insert into database
      const insertResult = await insertWallet(walletData);

      console.log(`\n🎉 Wallet successfully saved to database!`);
      console.log(`Database ID: ${insertResult.id}`);
      console.log(`Created at: ${insertResult.created_at}`);

      // Show JSON format as requested
      console.log("\n📝 Wallet Data (JSON format):");
      console.log(
        JSON.stringify(
          {
            email: walletData.email,
            mnemonic: walletData.mnemonic,
            public: walletData.publicKey,
            secret: walletData.secretKey,
          },
          null,
          2,
        ),
      );
    } else {
      console.log("\n❌ Wallet validation failed. Not saving to database.");
    }
  } catch (error) {
    console.error("Application error:", error);
  } finally {
    rl.close();
    await pool.end();
    process.exit();
  }
}

// Run the application
main();
