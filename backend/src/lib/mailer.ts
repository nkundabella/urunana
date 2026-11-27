import { env } from "../config/env.js";

export interface Mailer {
  sendVerificationOtp(identifier: string, code: string): Promise<void>;
  sendPasswordReset(identifier: string, token: string): Promise<void>;
}

class ConsoleMailer implements Mailer {
  async sendVerificationOtp(identifier: string, code: string): Promise<void> {
    console.log(
      `[URUNANA-OTP] Verification code for ${identifier}: ${code} (expires in 15m)`
    );
  }

  async sendPasswordReset(identifier: string, token: string): Promise<void> {
    const resetUrl = `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/forgot-password?token=${token}`;
    console.log(
      `[URUNANA-RESET] Password reset token for ${identifier}: ${token} (${resetUrl})`
    );
  }
}

export const mailer: Mailer = new ConsoleMailer();
