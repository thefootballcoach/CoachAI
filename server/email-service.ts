import crypto from "crypto";
import sgMail from '@sendgrid/mail';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || null;
    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
    }
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getVerificationEmailTemplate(token: string, username: string): EmailTemplate {
    const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : (process.env.CLIENT_URL || 'http://localhost:5000');
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    return {
      subject: 'Verify Your CoachAI Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0891b2; text-align: center;">Welcome to CoachAI</h1>
          <p>Hi ${username},</p>
          <p>Thanks for signing up! Please verify your email address to get started with evidence-based coaching analysis.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This verification link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account with CoachAI, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `
Welcome to CoachAI!

Hi ${username},

Thanks for signing up! Please verify your email address by visiting this link:
${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with CoachAI, you can safely ignore this email.
      `.trim()
    };
  }

  private getCoachInvitationEmailTemplate(username: string, tempPassword: string, inviterName: string, clubName: string): EmailTemplate {
    const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : (process.env.CLIENT_URL || 'http://localhost:5000');
    const loginUrl = `${baseUrl}/auth`;
    
    return {
      subject: `You've been invited to join ${clubName} on CoachAI`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0891b2; text-align: center;">Welcome to CoachAI</h1>
          <p>Hi there,</p>
          <p>${inviterName} has invited you to join <strong>${clubName}</strong> on CoachAI - the elite AI-powered coaching analysis platform.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0891b2;">Your Login Details:</h3>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          </div>
          
          <p><strong>Important:</strong> Please change your password after your first login for security.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Access Your Account
            </a>
          </div>
          
          <p>With CoachAI, you can:</p>
          <ul>
            <li>Upload coaching session recordings for AI analysis</li>
            <li>Receive detailed feedback across 7 key coaching areas</li>
            <li>Track your improvement over time</li>
            <li>Access evidence-based coaching recommendations</li>
          </ul>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you have any questions, please contact your head coach or club administrator.
          </p>
        </div>
      `,
      text: `
Welcome to CoachAI!

${inviterName} has invited you to join ${clubName} on CoachAI - the elite AI-powered coaching analysis platform.

Your Login Details:
Username: ${username}
Temporary Password: ${tempPassword}
Login URL: ${loginUrl}

Important: Please change your password after your first login for security.

With CoachAI, you can:
- Upload coaching session recordings for AI analysis
- Receive detailed feedback across 7 key coaching areas
- Track your improvement over time
- Access evidence-based coaching recommendations

If you have any questions, please contact your head coach or club administrator.
      `.trim()
    };
  }

  private getPasswordResetEmailTemplate(token: string, username: string): EmailTemplate {
    const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : (process.env.CLIENT_URL || 'http://localhost:5000');
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    return {
      subject: 'Reset Your CoachAI Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0891b2; text-align: center;">Password Reset Request</h1>
          <p>Hi ${username},</p>
          <p>We received a request to reset your password for your CoachAI account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This reset link will expire in 1 hour.</p>
          <p><strong>If you didn't request this password reset, please ignore this email.</strong> Your password will remain unchanged.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            For security reasons, this link will only work once.
          </p>
        </div>
      `,
      text: `
Password Reset Request

Hi ${username},

We received a request to reset your password for your CoachAI account.

Please visit this link to reset your password:
${resetUrl}

This reset link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

For security reasons, this link will only work once.
      `.trim()
    };
  }

  private getUserInvitationEmailTemplate(token: string, inviterName: string, clubName: string, role: string): EmailTemplate {
    const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : (process.env.CLIENT_URL || 'http://localhost:5000');
    const invitationUrl = `${baseUrl}/complete-invitation?token=${token}`;
    
    return {
      subject: `You've been invited to join ${clubName} on CoachAI`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0891b2; text-align: center;">Welcome to CoachAI</h1>
          <p>Hi there,</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${clubName}</strong> on CoachAI - the elite AI-powered coaching analysis platform.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0891b2;">Complete Your Registration</h3>
            <p>You've been invited as a <strong>${role}</strong>. Click the button below to set up your account and create your password.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Complete Registration
            </a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
          
          <p>With CoachAI, you can:</p>
          <ul>
            <li>Upload coaching session recordings for AI analysis</li>
            <li>Receive detailed feedback across 7 key coaching areas</li>
            <li>Track your improvement over time</li>
            <li>Access evidence-based coaching recommendations</li>
          </ul>
          
          <p><strong>This invitation link will expire in 7 days.</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you have any questions, please contact your head coach or club administrator.
          </p>
        </div>
      `,
      text: `
Welcome to CoachAI!

${inviterName} has invited you to join ${clubName} on CoachAI - the elite AI-powered coaching analysis platform.

You've been invited as a ${role}. Complete your registration by visiting this link:
${invitationUrl}

With CoachAI, you can:
- Upload coaching session recordings for AI analysis
- Receive detailed feedback across 7 key coaching areas
- Track your improvement over time
- Access evidence-based coaching recommendations

This invitation link will expire in 7 days.

If you have any questions, please contact your head coach or club administrator.
      `.trim()
    };
  }

  async sendUserInvitationEmail(email: string, token: string, inviterName: string, clubName: string, role: string): Promise<boolean> {
    console.log(`Email service: Attempting to send invitation email to ${email}`);
    
    if (!this.apiKey) {
      console.log('SENDGRID_API_KEY not configured. User invitation email disabled.');
      console.log(`Invitation token for ${email}: ${token}`);
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : (process.env.CLIENT_URL || 'http://localhost:5000');
      console.log(`Manual invitation URL: ${baseUrl}/complete-invitation?token=${token}`);
      return false;
    }

    const template = this.getUserInvitationEmailTemplate(token, inviterName, clubName, role);
    const result = await this.sendEmail(email, template);
    console.log(`Email service: Invitation email ${result ? 'sent successfully' : 'failed to send'} to ${email}`);
    return result;
  }

  async sendCoachInvitationEmail(email: string, username: string, tempPassword: string, inviterName: string, clubName: string): Promise<boolean> {
    const template = this.getCoachInvitationEmailTemplate(username, tempPassword, inviterName, clubName);
    return this.sendEmail(email, template);
  }

  async sendVerificationEmail(email: string, username: string, token: string): Promise<boolean> {
    console.log(`Email service: Attempting to send verification email to ${email}`);
    
    if (!this.apiKey) {
      console.log('SENDGRID_API_KEY not configured. Email verification disabled.');
      console.log(`Verification token for ${email}: ${token}`);
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : (process.env.CLIENT_URL || 'http://localhost:5000');
      console.log(`Manual verification URL: ${baseUrl}/verify-email?token=${token}`);
      return false; // Return false to indicate email wasn't sent
    }

    const template = this.getVerificationEmailTemplate(token, username);
    const result = await this.sendEmail(email, template);
    console.log(`Email service: Verification email ${result ? 'sent successfully' : 'failed to send'} to ${email}`);
    return result;
  }

  async sendPasswordResetEmail(email: string, username: string, token: string): Promise<boolean> {
    if (!this.apiKey) {
      console.log('SENDGRID_API_KEY not configured. Password reset email disabled.');
      console.log(`Password reset token for ${email}: ${token}`);
      return true; // Return true in development
    }

    const template = this.getPasswordResetEmailTemplate(token, username);
    return this.sendEmail(email, template);
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    if (!this.apiKey) {
      console.log('Email service: No API key configured');
      return false;
    }

    try {
      console.log(`Email service: Preparing to send email to ${to}`);
      
      // Use dynamic import to avoid errors when SendGrid is not available
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(this.apiKey);

      // Use a verified sender email from SendGrid
      const fromEmail = process.env.FROM_EMAIL || 'hello@profootballcoaching.com';
      
      const msg = {
        to,
        from: {
          email: fromEmail,
          name: 'Ben Gast'
        },
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      console.log(`Email service: Sending email with subject "${template.subject}" to ${to}`);
      await sgMail.default.send(msg);
      console.log(`Email service: Successfully sent email to ${to}`);
      return true;
    } catch (error: any) {
      console.error('Email service: Failed to send email:', {
        error: error.message,
        code: error.code,
        response: error.response?.body,
        details: error.response?.body?.errors
      });
      return false;
    }
  }
}

export const emailService = new EmailService();