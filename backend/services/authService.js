const crypto = require("crypto");

class AuthService {
  constructor() {
    this.saltRounds = 16; // 16 bytes = 128 bits
    this.iterations = 100000; // PBKDF2 iterations
    this.keyLength = 64; // 64 bytes = 512 bits
    this.algorithm = "sha512";
  }

  // Generate a random salt
  generateSalt() {
    return crypto.randomBytes(this.saltRounds).toString("hex");
  }

  // Hash password with salt using PBKDF2
  async hashPassword(password, salt = null) {
    try {
      const useSalt = salt || this.generateSalt();

      return new Promise((resolve, reject) => {
        crypto.pbkdf2(
          password,
          useSalt,
          this.iterations,
          this.keyLength,
          this.algorithm,
          (err, derivedKey) => {
            if (err) reject(err);
            else {
              resolve({
                hash: derivedKey.toString("hex"),
                salt: useSalt,
                iterations: this.iterations,
                algorithm: this.algorithm,
              });
            }
          },
        );
      });
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  // Verify password against stored hash
  async verifyPassword(password, storedHash, storedSalt) {
    try {
      const { hash } = await this.hashPassword(password, storedSalt);
      return hash === storedHash;
    } catch (error) {
      throw new Error(`Password verification failed: ${error.message}`);
    }
  }

  // Validate password strength
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!hasLowerCase) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!hasNumbers) {
      errors.push("Password must contain at least one number");
    }
    if (!hasSpecialChar) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password),
    };
  }

  // Calculate password strength score
  calculatePasswordStrength(password) {
    let score = 0;

    // Length bonus
    score += Math.min(password.length * 2, 20);

    // Character variety bonus
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

    // Length penalties for short passwords
    if (password.length < 8) score -= 10;
    if (password.length < 6) score -= 20;

    // Common pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|password|qwerty/i.test(password)) score -= 15; // Common patterns

    score = Math.max(0, Math.min(100, score));

    if (score < 30) return "weak";
    if (score < 60) return "medium";
    if (score < 80) return "strong";
    return "very-strong";
  }

  // Generate secure session token
  generateSessionToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate secure random password (for testing or password reset)
  generateSecurePassword(length = 12) {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    const allChars = uppercase + lowercase + numbers + symbols;
    let password = "";

    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest with random characters
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }
}

module.exports = AuthService;
