import { OTP } from "otplib";
import * as QRCode from "qrcode";

// Emulator bypass code - "000000" bypasses MFA in emulator mode
const EMULATOR_BYPASS_CODE = "000000";

// Create OTP instance for TOTP
const totp = new OTP({ strategy: "totp" });

/**
 * Generate a new TOTP secret for a user
 */
export function generateMFASecret(): string {
  return totp.generateSecret(20);
}

/**
 * Generate a QR code data URL for the TOTP secret
 * Encodes: otpauth://totp/Emulator:{username}?secret={secret}&issuer=Emulator
 */
export async function generateQRCode(username: string, secret: string): Promise<string> {
  const otpauthUri = totp.generateURI({
    issuer: "Emulator",
    label: username,
    secret: secret,
    algorithm: "sha1",
    digits: 6,
    period: 30,
  });

  return QRCode.toDataURL(otpauthUri, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Verify a TOTP code against a secret
 * Returns true if the code is valid or if it's the emulator bypass code (in emulator mode)
 */
export function verifyTOTP(secret: string, code: string): boolean {
  // Emulator bypass: accept "000000" as valid code for testing
  if (code === EMULATOR_BYPASS_CODE) {
    return true;
  }

  // Validate code format (must be 6 digits)
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    return false;
  }

  try {
    const result = totp.verifySync({
      secret,
      token: code,
      epochTolerance: 1, // Allow 1 time step tolerance (30 seconds)
    });

    return result.valid;
  } catch {
    return false;
  }
}
