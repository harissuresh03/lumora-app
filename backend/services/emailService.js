// backend/services/emailService.js
const nodemailer = require("nodemailer");

// Create transporter based on environment configuration
const createTransporter = () => {
  // For production, use real email service
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // For development, use Ethereal (fake email service)
    // Create a test account
    let transporter;
    nodemailer.createTestAccount((err, account) => {
      if (err) {
        console.error("❌ Failed to create Ethereal account:", err);
        return;
      }
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
      console.log("✅ Ethereal email transporter initialized");
      console.log(`📧 Test email credentials: ${account.user} / ${account.pass}`);
    });
    return transporter;
  }
};

// Initialize transporter
let transporter = createTransporter();

// Verify transporter configuration
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Email transporter error:", error);
    } else {
      console.log("✅ Email transporter ready to send emails");
    }
  });
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<Object>} - Result with success status and message info
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Check if transporter is initialized
    if (!transporter) {
      console.log("🔄 Recreating transporter...");
      transporter = createTransporter();
      if (!transporter) {
        throw new Error("Failed to create email transporter");
      }
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Lumora Mental Health" <noreply@lumora.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text fallback
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    
    // If using Ethereal, log the preview URL
    if (process.env.NODE_ENV !== 'production' && info.messageId) {
      console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return { 
      success: true, 
      messageId: info.messageId, 
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null 
    };
  } catch (error) {
    console.error("❌ Email send error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send counsellor approval email
 * @param {string} email - Recipient email address
 * @param {string} name - Counsellor's name
 * @param {string} password - Temporary password (optional)
 * @returns {Promise<Object>} - Email send result
 */
const sendCounsellorApprovalEmail = async (email, name, password = null) => {
  const subject = "🎉 Your Counsellor Application Has Been Approved!";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Approved</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 32px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; padding: 32px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .content h2 { font-size: 20px; margin-top: 0; color: #1e293b; }
        .content p { color: #475569; margin: 12px 0; }
        .content ul { color: #475569; padding-left: 20px; margin: 12px 0; }
        .content ul li { margin: 6px 0; }
        .button { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 30px; font-weight: 600; margin: 16px 0; transition: transform 0.2s; }
        .button:hover { transform: scale(1.02); }
        .credentials { background: #eef2ff; padding: 20px 24px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #6366f1; }
        .credentials strong { color: #1e293b; }
        .credentials code { background: #e2e8f0; padding: 4px 12px; border-radius: 6px; font-size: 16px; font-family: monospace; color: #1e293b; font-weight: 600; }
        .warning { background: #fef3c7; padding: 12px 16px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #f59e0b; font-size: 13px; color: #92400e; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
        .footer a { color: #6366f1; text-decoration: none; }
        .emoji { font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✨ Lumora</h1>
        <p>Mental Health Support Platform</p>
      </div>
      <div class="content">
        <h2>🎉 Welcome to the Counsellor Team!</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>We are delighted to inform you that your application to become a counsellor on the Lumora platform has been <span style="color: #22c55e; font-weight: 600;">approved</span>!</p>
        
        <p>You can now:</p>
        <ul>
          <li>✅ Access the counsellor dashboard</li>
          <li>✅ View and manage your students</li>
          <li>✅ Schedule appointments</li>
          <li>✅ Send messages to students</li>
          <li>✅ Monitor student well-being</li>
        </ul>

        ${password ? `
        <div class="credentials">
          <strong>🔑 Your Login Credentials:</strong><br>
          <strong>Email:</strong> <code>${email}</code><br>
          <strong>Password:</strong> <code>${password}</code><br>
        </div>
        <div class="warning">
          ⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.
        </div>
        ` : `
        <p style="color: #475569;">You can log in using your registered email address.</p>
        `}

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">🚀 Go to Lumora</a>
        </div>

        <p style="margin-top: 20px; color: #475569; font-size: 14px;">
          If you have any questions, please contact our support team at <a href="mailto:support@lumora.com" style="color: #6366f1;">support@lumora.com</a>
        </p>
        <p style="color: #475569; font-size: 14px; margin-bottom: 0;">
          Warm regards,<br>
          <strong style="color: #1e293b;">The Lumora Team 💙</strong>
        </p>
      </div>
      <div class="footer">
        <p>This email was sent to <a href="mailto:${email}">${email}</a>. If you did not request this, please ignore this email.</p>
        <p>© ${new Date().getFullYear()} Lumora Mental Health Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Lumora - Counsellor Application Approved!
    
    Dear ${name},
    
    We are delighted to inform you that your application to become a counsellor on the Lumora platform has been approved!
    
    You can now:
    - Access the counsellor dashboard
    - View and manage your students
    - Schedule appointments
    - Send messages to students
    - Monitor student well-being
    
    ${password ? `Your Login Credentials:
    Email: ${email}
    Password: ${password}
    
    IMPORTANT: Please change your password after your first login.` : ''}
    
    Go to Lumora: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
    
    Warm regards,
    The Lumora Team 💙
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send counsellor rejection email
 * @param {string} email - Recipient email address
 * @param {string} name - Counsellor's name
 * @param {string} reason - Rejection reason (optional)
 * @returns {Promise<Object>} - Email send result
 */
const sendCounsellorRejectionEmail = async (email, name, reason = null) => {
  const subject = "📋 Update on Your Counsellor Application";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Update</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 32px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; padding: 32px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .content h2 { font-size: 20px; margin-top: 0; color: #1e293b; }
        .content p { color: #475569; margin: 12px 0; }
        .reason-box { background: #fef2f2; padding: 16px 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444; }
        .reason-box strong { color: #ef4444; }
        .reason-box p { margin: 4px 0 0; color: #dc2626; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
        .footer a { color: #6366f1; text-decoration: none; }
        .button { display: inline-block; padding: 10px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 30px; font-weight: 600; margin: 8px 0; }
        .button:hover { background: #4f46e5; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✨ Lumora</h1>
        <p>Mental Health Support Platform</p>
      </div>
      <div class="content">
        <h2>📋 Application Update</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for your interest in becoming a counsellor on the Lumora platform.</p>
        
        <p>After careful review, we regret to inform you that your application has been <span style="color: #ef4444; font-weight: 600;">rejected</span> at this time.</p>

        ${reason ? `
        <div class="reason-box">
          <strong>📝 Reason provided by admin:</strong>
          <p>${reason}</p>
        </div>
        ` : ''}

        <p style="color: #475569; font-size: 14px;">
          We encourage you to reapply in the future. If you have any questions, please contact our support team at <a href="mailto:support@lumora.com" style="color: #6366f1;">support@lumora.com</a>
        </p>
        <p style="color: #475569; font-size: 14px; margin-bottom: 0;">
          Warm regards,<br>
          <strong style="color: #1e293b;">The Lumora Team 💙</strong>
        </p>
      </div>
      <div class="footer">
        <p>This email was sent to <a href="mailto:${email}">${email}</a>.</p>
        <p>© ${new Date().getFullYear()} Lumora Mental Health Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Lumora - Application Update
    
    Dear ${name},
    
    Thank you for your interest in becoming a counsellor on the Lumora platform.
    
    After careful review, we regret to inform you that your application has been rejected at this time.
    
    ${reason ? `Reason: ${reason}` : ''}
    
    We encourage you to reapply in the future.
    
    Warm regards,
    The Lumora Team 💙
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send account approval notification (for general user approvals)
 * @param {string} email - Recipient email address
 * @param {string} name - User's name
 * @param {string} accountType - Type of account (student/counsellor)
 * @returns {Promise<Object>} - Email send result
 */
const sendAccountApprovalEmail = async (email, name, accountType = 'student') => {
  const subject = "🎉 Your Lumora Account Has Been Approved!";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Approved</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 32px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { background: #ffffff; padding: 32px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; }
        .button { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 30px; font-weight: 600; margin: 16px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✨ Lumora</h1>
        <p>Mental Health Support Platform</p>
      </div>
      <div class="content">
        <h2>🎉 Welcome to Lumora!</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>We are excited to inform you that your ${accountType} account has been <span style="color: #22c55e; font-weight: 600;">approved</span>!</p>
        
        <p>You can now log in and start using the platform.</p>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">🚀 Login to Lumora</a>
        </div>

        <p style="color: #475569; font-size: 14px; margin-bottom: 0;">
          Warm regards,<br>
          <strong style="color: #1e293b;">The Lumora Team 💙</strong>
        </p>
      </div>
      <div class="footer">
        <p>This email was sent to ${email}.</p>
        <p>© ${new Date().getFullYear()} Lumora Mental Health Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Lumora - Account Approved!
    
    Dear ${name},
    
    We are excited to inform you that your ${accountType} account has been approved!
    
    You can now log in and start using the platform.
    
    Login: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
    
    Warm regards,
    The Lumora Team 💙
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send parent invitation email
 * @param {string} parentEmail - Parent's email address
 * @param {string} studentName - Student's name
 * @returns {Promise<Object>} - Email send result
 */
const sendParentInvitationEmail = async (parentEmail, studentName) => {
  const subject = `📋 ${studentName} has invited you to view their well-being on Lumora`;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const loginLink = `${frontendUrl}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Parent Invitation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 32px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; padding: 32px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .content h2 { font-size: 20px; margin-top: 0; color: #1e293b; }
        .content p { color: #475569; margin: 12px 0; }
        .credentials { background: #eef2ff; padding: 20px 24px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #6366f1; }
        .credentials strong { color: #1e293b; }
        .credentials code { background: #e2e8f0; padding: 4px 12px; border-radius: 6px; font-size: 16px; font-family: monospace; color: #1e293b; font-weight: 600; }
        .warning { background: #fef3c7; padding: 12px 16px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #f59e0b; font-size: 13px; color: #92400e; }
        .button { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 30px; font-weight: 600; margin: 16px 0; transition: transform 0.2s; }
        .button:hover { transform: scale(1.02); }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
        .footer a { color: #6366f1; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✨ Lumora</h1>
        <p>Mental Health Support Platform</p>
      </div>
      <div class="content">
        <h2>You've Been Invited! 👋</h2>
        <p>Dear Parent,</p>
        <p><strong>${studentName}</strong> has invited you to view their mental health and well-being summary on Lumora.</p>
        <p>This is a secure, read-only view that helps you stay informed and support your child's mental health journey.</p>
        
        <div class="credentials">
          <strong>🔑 Your Login Credentials:</strong><br>
          <strong>Email:</strong> <code>${parentEmail}</code><br>
          <strong>Password:</strong> <code>password123</code>
        </div>
        
        <div class="warning">
          ⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.
        </div>

        <div style="text-align: center;">
          <a href="${loginLink}" class="button">🚀 Go to Lumora</a>
        </div>

        <p style="color: #475569; font-size: 14px; margin-top: 20px;">
          If you did not expect this invitation, you can safely ignore this email.
        </p>
        <p style="color: #475569; font-size: 14px; margin-bottom: 0;">
          Warm regards,<br>
          <strong style="color: #1e293b;">The Lumora Team 💙</strong>
        </p>
      </div>
      <div class="footer">
        <p>This email was sent to <a href="mailto:${parentEmail}">${parentEmail}</a>.</p>
        <p>© ${new Date().getFullYear()} Lumora Mental Health Platform. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    ${studentName} has invited you to view their well-being on Lumora.

    Your Login Credentials:
    Email: ${parentEmail}
    Password: password123

    IMPORTANT: Please change your password after your first login.

    Go to Lumora: ${frontendUrl}

    If you did not expect this invitation, you can safely ignore this email.

    Warm regards,
    The Lumora Team 💙
  `;

  return await sendEmail({ to: parentEmail, subject, html, text });
};

/**
 * Send crisis alert email to counsellor
 * @param {string} counsellorEmail - Counsellor's email address
 * @param {string} counsellorName - Counsellor's name
 * @param {string} studentName - Student's name
 * @param {string} studentNickname - Student's nickname (optional)
 * @param {string} alertMessage - Crisis alert message
 * @param {string} alertType - Type of alert (e.g., "Journal Entry", "Chat Message")
 * @param {number} studentId - Student's ID for link
 * @param {string} source - Source of the alert (e.g., "journal", "chat")
 * @returns {Promise<Object>} - Email send result
 */
const sendCrisisAlertEmail = async (counsellorEmail, counsellorName, studentName, studentNickname, alertMessage, alertType, studentId, source) => {
  const subject = `🚨 CRISIS ALERT: ${studentName} Needs Immediate Attention`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Crisis Alert</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 32px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; padding: 32px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .alert-box { background: #fef2f2; padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444; margin: 16px 0; }
        .alert-box strong { color: #dc2626; }
        .alert-box p { margin: 8px 0 0; color: #475569; }
        .button { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 30px; font-weight: 600; margin: 16px 0; transition: transform 0.2s; }
        .button:hover { transform: scale(1.02); }
        .crisis-resources { background: #fef3c7; padding: 16px 20px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #f59e0b; }
        .crisis-resources strong { color: #92400e; }
        .crisis-resources ul { margin: 8px 0 0; padding-left: 20px; color: #92400e; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
        .footer a { color: #6366f1; text-decoration: none; }
        .emoji { font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 Lumora</h1>
        <p>Crisis Alert System</p>
      </div>
      <div class="content">
        <h2 style="color: #dc2626;">⚠️ Immediate Action Required</h2>
        <p>Dear <strong>${counsellorName}</strong>,</p>
        <p>A student has triggered a crisis alert in the Lumora system. Please review and respond as soon as possible.</p>

        <div class="alert-box">
          <strong>📋 Alert Details:</strong>
          <p><strong>Student:</strong> ${studentName} ${studentNickname ? `(@${studentNickname})` : ''}</p>
          <p><strong>Alert Type:</strong> ${alertType || 'Crisis Alert'}</p>
          <p><strong>Source:</strong> ${source === 'journal' ? '📓 Journal Entry' : source === 'chat' ? '💬 AI Chat' : source === 'post' ? '📢 Peer Support Post' : '⚠️ Unknown'}</p>
          <p><strong>Message:</strong> ${alertMessage || 'No additional message provided.'}</p>
        </div>

        <div class="crisis-resources">
          <strong>📞 Crisis Resources:</strong>
          <ul>
            <li>Talian Kasih: 15999 (24/7)</li>
            <li>Befrienders KL: 03-7627 2929 (24/7)</li>
            <li>Talian HEAL: 15555 (8.30 am – 11.59 pm)</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/counsellor/alerts" class="button">🛡️ View Alerts Dashboard</a>
        </div>

        <p style="color: #475569; font-size: 14px; margin-top: 16px;">
          Please log in to the counsellor dashboard to view full details and take appropriate action.
        </p>
        <p style="color: #475569; font-size: 14px; margin-bottom: 0;">
          Warm regards,<br>
          <strong style="color: #1e293b;">The Lumora Team 💙</strong>
        </p>
      </div>
      <div class="footer">
        <p>This email was sent to <a href="mailto:${counsellorEmail}">${counsellorEmail}</a> because you are a registered counsellor in the Lumora system.</p>
        <p>© ${new Date().getFullYear()} Lumora Mental Health Platform. All rights reserved.</p>
      </div>
    </html>
  `;

  const text = `
    🚨 CRISIS ALERT: ${studentName} Needs Immediate Attention

    Dear ${counsellorName},

    A student has triggered a crisis alert in the Lumora system.

    Alert Details:
    Student: ${studentName} ${studentNickname ? `(@${studentNickname})` : ''}
    Alert Type: ${alertType || 'Crisis Alert'}
    Source: ${source === 'journal' ? '📓 Journal Entry' : source === 'chat' ? '💬 AI Chat' : source === 'post' ? '📢 Peer Support Post' : '⚠️ Unknown'}
    Message: ${alertMessage || 'No additional message provided.'}

    Crisis Resources:
    - Talian Kasih: 15999 (24/7)
    - Befrienders KL: 03-7627 2929 (24/7)
    - Talian HEAL: 15555 (8.30 am – 11.59 pm)

    Please log in to the counsellor dashboard to view full details and take appropriate action.

    Warm regards,
    The Lumora Team 💙
  `;

  return await sendEmail({ to: counsellorEmail, subject, html, text });
};

module.exports = {
  sendEmail,
  sendCounsellorApprovalEmail,
  sendCounsellorRejectionEmail,
  sendAccountApprovalEmail,
  sendParentInvitationEmail,
  sendCrisisAlertEmail,
};