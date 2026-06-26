import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create nodemailer transporter using credentials from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'aff50c001@smtp-brevo.com',
    pass: process.env.SMTP_PASS || 'tVsgNDXk3EcAMraf',
  },
});

export class EmailService {
  /**
   * Sends a 6-digit OTP verification code to a partner lead's email.
   * @param to The target business email
   * @param otp The 6-digit OTP code
   */
  public static async sendOTP(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: `"Skoola Support" <${process.env.SMTP_FROM || 'support@skoola.online'}>`,
      to,
      subject: 'Verify Your Email Address - Skoola Partnership',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #059669; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Skoola Partnership</h2>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Empowering schools everywhere</p>
          </div>
          
          <div style="border-top: 1px solid #f3f4f6; padding-top: 24px; margin-bottom: 24px;">
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 16px;">Hello,</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">Thank you for your interest in partnering with Skoola. To complete your partnership request, please verify your email address by entering the verification code below on the form:</p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #047857; text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.05);">${otp}</span>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; line-height: 1.5; margin-top: 24px;">This verification code is valid for <strong>10 minutes</strong>. If you did not make this request, please safely ignore this email.</p>
          </div>
          
          <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Skoola. All rights reserved.</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 4px;">support@skoola.online</p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Successfully sent OTP email to ${to}`);
    } catch (err: any) {
      console.error('[SMTP] Failed to send OTP email:', err);
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  }
}
