class EmailVerificationService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async verifyEmail(email) {
    // For now, let's simulate email verification to avoid API issues
    // You can replace this with actual MailerSend API calls once you have credits

    console.log(`Simulating email verification for: ${email}`);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { status: "syntax_error" };
    }

    // Check for common disposable email domains
    const disposableDomains = [
      "10minutemail.com",
      "tempmail.org",
      "guerrillamail.com",
      "mailinator.com",
      "temp-mail.org",
      "throwaway.email",
    ];

    const domain = email.split("@")[1];
    if (disposableDomains.includes(domain)) {
      return { status: "disposables" };
    }

    // Check for common valid domains
    const trustedDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "icloud.com",
      "protonmail.com",
      "aol.com",
    ];

    if (trustedDomains.includes(domain)) {
      return { status: "valid" };
    }

    // For other domains, mark as unknown (risky but allowed)
    return { status: "unknown" };
  }

  isEmailValid(verificationResult) {
    const validStatuses = ["valid"];
    const riskyStatuses = [
      "catch_all",
      "mailbox_full",
      "role_based",
      "unknown",
    ];
    const invalidStatuses = [
      "syntax_error",
      "typo",
      "mailbox_not_found",
      "disposables",
      "mailbox_blocked",
      "failed",
    ];

    return {
      isValid: validStatuses.includes(verificationResult.status),
      isRisky: riskyStatuses.includes(verificationResult.status),
      isInvalid: invalidStatuses.includes(verificationResult.status),
      status: verificationResult.status,
    };
  }

  async verifyEmailWithMailerSend(email) {
    try {
      const response = await fetch(
        "https://api.mailersend.com/v1/email-verification/verify",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      if (response.status === 402) {
        throw new Error("Not enough credits for email verification");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("MailerSend verification error:", error);
      throw error;
    }
  }
}

module.exports = EmailVerificationService;
