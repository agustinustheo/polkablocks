const {
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  ed25519PairFromSeed,
} = require("@polkadot/util-crypto");
const { u8aToHex } = require("@polkadot/util");

async function generateWallet() {
  try {
    // Create mnemonic string for Alice using BIP39
    const mnemonicAlice = mnemonicGenerate();
    console.log(`Generated mnemonic: ${mnemonicAlice}`);

    // Validate the mnemonic string that was generated
    const isValidMnemonic = mnemonicValidate(mnemonicAlice);
    console.log(`isValidMnemonic: ${isValidMnemonic}`);

    // Create valid Substrate-compatible seed from mnemonic
    const seedAlice = mnemonicToMiniSecret(mnemonicAlice);
    console.log(`Seed (hex): ${u8aToHex(seedAlice)}`);

    // Generate new public/secret keypair for Alice from the supplied seed
    const { publicKey, secretKey } = ed25519PairFromSeed(seedAlice);

    console.log(`Public Key (hex): ${u8aToHex(publicKey)}`);
    console.log(`Secret Key (hex): ${u8aToHex(secretKey)}`);

    // Test that we can recreate the same keypair from the mnemonic
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

async function main() {
  console.log("Testing Polkadot Wallet Generation");
  console.log("==================================\n");

  // Test generating multiple wallets
  for (let i = 1; i <= 3; i++) {
    console.log(`Wallet ${i}:`);
    const wallet = await generateWallet();
    console.log(`Valid: ${wallet.isValid}\n`);
  }
}

// Run the test
main()
  .catch(console.error)
  .finally(() => process.exit());
