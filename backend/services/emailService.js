import nodemailer from 'nodemailer';

// Initialize nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'abrarmughal4481@gmail.com',
    pass: 'pmvhrmrndipyddbv', // App password
  },
});

class EmailService {
  constructor() {
    this.primaryService = 'nodemailer'; // Use Nodemailer only
  }

  // Generate OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Modern HTML template for OTP
  createOTPTemplate(otp, name, email) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #6366F1, #8B5CF6);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          .logo {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 500;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 16px;
            font-weight: 700;
          }
          .message {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .otp-container {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            display: inline-block;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 800;
            color: #6366F1;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 0;
          }
          .otp-label {
            color: #6b7280;
            font-size: 14px;
            margin-top: 10px;
            font-weight: 500;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
            color: #92400e;
            font-size: 14px;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
          }
          .security-badge {
            display: inline-flex;
            align-items: center;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 20px;
          }
          .security-icon {
            margin-right: 6px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 Installment Tracker</div>
            <div class="subtitle">Secure Account Verification</div>
          </div>
          
          <div class="content">
            <h1 class="title">Your Verification Code</h1>
            <p class="message">
              ${name ? `Hi <strong>${name}</strong>,` : 'Hello,'}<br>
              We received a request to verify your account. Use the code below to complete your registration:
            </p>
            
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
              <div class="otp-label">Verification Code</div>
            </div>
            
            <div class="warning">
              ⏰ <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
            </div>
            
            <div class="security-badge">
              <span class="security-icon">🛡️</span>
              Secure & Encrypted
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 Installment Tracker. All rights reserved.</p>
            <p style="margin-top: 8px;">If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send OTP using Nodemailer (Gmail)
  async sendOTPNodemailer(email, otp, name) {
    try {
      const mailOptions = {
        from: `"Installment Tracker" <abrarmughal4481@gmail.com>`,
        to: email,
        subject: '🔐 Your Verification Code - Installment Tracker',
        html: this.createOTPTemplate(otp, name, email),
        text: `
Installment Tracker - Account Verification

${name ? `Hi ${name},` : 'Hello,'}

Your verification code is: ${otp}

This code will expire in 10 minutes.
If you didn't request this code, please ignore this email.

© 2024 Installment Tracker. All rights reserved.
        `
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, service: 'nodemailer' };
    } catch (error) {
      console.error('Nodemailer error:', error);
      throw error;
    }
  }

  // Main send OTP method using Nodemailer
  async sendOTP(email, otp, name) {
    try {
      return await this.sendOTPNodemailer(email, otp, name);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send OTP. Please try again later.');
    }
  }

  // Send welcome email after successful registration
  async sendWelcomeEmail(email, name) {
    const welcomeTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Installment Tracker</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px; text-align: center; color: white; }
          .content { padding: 40px; text-align: center; }
          .title { font-size: 28px; font-weight: 800; color: #1f2937; margin-bottom: 16px; }
          .message { color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
          .cta-button { background: #6366F1; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Installment Tracker!</h1>
          </div>
          <div class="content">
            <h2 class="title">Account Created Successfully</h2>
            <p class="message">
              Hi <strong>${name}</strong>,<br>
              Your account has been created successfully! You can now manage your installments with ease.
            </p>
            <a href="#" class="cta-button">Get Started</a>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const mailOptions = {
        from: `"Installment Tracker" <abrarmughal4481@gmail.com>`,
        to: email,
        subject: '🎉 Welcome to Installment Tracker!',
        html: welcomeTemplate,
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, service: 'nodemailer' };
    } catch (error) {
      console.error('Welcome email error:', error);
      // Don't throw error for welcome email
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, name, newPassword, type = 'password_reset') {
    const passwordResetTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Installment Tracker</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          .logo {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 500;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 16px;
            font-weight: 700;
          }
          .message {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .password-box {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
          }
          .password-label {
            color: #0c4a6e;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .password-value {
            color: #0c4a6e;
            font-size: 24px;
            font-weight: 800;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
            color: #92400e;
            font-size: 14px;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
          }
          .security-badge {
            display: inline-flex;
            align-items: center;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 20px;
          }
          .security-icon {
            margin-right: 6px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 Installment Tracker</div>
            <div class="subtitle">${type === 'email_changed' ? 'Email Updated' : 'Password Reset'}</div>
          </div>
          
          <div class="content">
            <h1 class="title">${type === 'email_changed' ? 'Email Updated Successfully' : 'Password Reset Complete'}</h1>
            <p class="message">
              Hi <strong>${name}</strong>,<br>
              ${type === 'email_changed' 
                ? 'Your email address has been updated and a new password has been generated for your account.'
                : 'Your password has been reset. Please use the new password below to log in.'
              }
            </p>
            
            <div class="password-box">
              <div class="password-label">Your New Password</div>
              <div class="password-value">${newPassword}</div>
            </div>
            
            <div class="warning">
              🔒 <strong>Security Notice:</strong> Please change this password after your first login for security reasons.
            </div>
            
            <div class="security-badge">
              <span class="security-icon">🛡️</span>
              Your account is secure
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 Installment Tracker. All rights reserved.</p>
            <p style="margin-top: 8px;">This is an automated security notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const mailOptions = {
        from: `"Installment Tracker" <abrarmughal4481@gmail.com>`,
        to: email,
        subject: `🔐 ${type === 'email_changed' ? 'Email Updated' : 'Password Reset'} - Installment Tracker`,
        html: passwordResetTemplate,
        text: `
Installment Tracker - ${type === 'email_changed' ? 'Email Updated' : 'Password Reset'}

Hi ${name},

${type === 'email_changed' 
  ? 'Your email address has been updated and a new password has been generated for your account.'
  : 'Your password has been reset. Please use the new password below to log in.'
}

Your new password is: ${newPassword}

Please change this password after your first login for security reasons.

© 2024 Installment Tracker. All rights reserved.
        `
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, service: 'nodemailer' };
    } catch (error) {
      console.error('Password reset email error:', error);
      // Don't throw error for notification email
    }
  }
}

export default new EmailService();
