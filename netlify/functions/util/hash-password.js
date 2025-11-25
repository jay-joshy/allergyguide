// Utility script to hash passwords for use in AUTH_USERS environment variable

const bcrypt = require("bcryptjs");

/**
 * Generates a bcrypt hash for a given password.
 * Usage: `node hash-password.js <password>`
 * Or run without arguments for interactive mode.
 */

const SALT_ROUNDS = 10;

async function hashPassword(password) {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    process.exit(1);
  }
}

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.log("Password Hashing Utility for AUTH_USERS");
    console.log("=========================================\n");
    console.log("Usage: node hash-password.js <password>\n");
    console.log("Example:");
    console.log('  node hash-password.js "mySecretPassword123"\n');
    console.log("The hash can then be used in your AUTH_USERS environment variable:");
    console.log('  AUTH_USERS={"username":"$2b$10$..."}\n');
    console.log(
      "Note: Passwords should be enclosed in quotes if they contain special characters.",
    );
    process.exit(0);
  }

  console.log("Hashing password...\n");
  const hash = await hashPassword(password);

  console.log("Password hash generated successfully!");
  console.log("=====================================\n");
  console.log("Hash:", hash);
  console.log("\nAdd this to AUTH_USERS environment variable:");
  console.log(`{"username":"${hash}"}`);
}

main();
