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

/* =========================================================================
 * LUMORA EMAIL DESIGN SYSTEM
 * Shared style tokens + HTML fragment helpers so every template (approvals,
 * invitations, crisis alerts, OTP codes, etc.) shares one consistent,
 * professional, calming visual identity. Plain inline-style-friendly
 * HTML/CSS for compatibility with Gmail, Outlook, and mobile clients.
 * Purely presentational — does not touch transporter setup, sendEmail(),
 * function signatures, dynamic variables, or the exports at the bottom.
 * ========================================================================= */

const LUMORA_COLORS = {
  navy: '#1e2a4a',
  navyDark: '#141c33',
  slate: '#3d4a63',
  slateLight: '#64748b',
  muted: '#94a3b8',
  blue: '#3b5bdb',
  purple: '#6c4fd6',
  purpleDark: '#5638b8',
  white: '#ffffff',
  bgLight: '#f3f5fb',
  border: '#e2e8f0',
  success: '#0f8a4b',
  successBg: '#e6f6ec',
  successBorder: '#0f9d58',
  warning: '#92400e',
  warningBg: '#fef3e2',
  warningBorder: '#f59e0b',
  crisis: '#b91c1c',
  crisisDark: '#7f1d1d',
  crisisBg: '#fdecec',
  crisisBorder: '#dc2626',
  neutralBg: '#f1f4f9',
  neutralBorder: '#94a3b8',
};

const LUMORA_FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Shared base styles injected into every template's <style> block.
const lumoraBaseStyles = `
  body { margin:0; padding:0; background:${LUMORA_COLORS.bgLight}; font-family:${LUMORA_FONT_STACK}; }
  .email-wrapper { max-width:640px; margin:0 auto; padding:28px 16px; }
  .email-card { background:${LUMORA_COLORS.white}; border-radius:16px; overflow:hidden; border:1px solid ${LUMORA_COLORS.border}; box-shadow:0 4px 18px rgba(15,23,42,0.06); }
  .email-header { padding:36px 32px; text-align:center; color:${LUMORA_COLORS.white}; }
  .email-header .brand { margin:0; font-size:24px; font-weight:700; letter-spacing:-0.3px; }
  .email-header .tagline { margin:6px 0 0; font-size:13px; opacity:0.88; font-weight:400; }
  .email-body { padding:36px 32px; color:${LUMORA_COLORS.slate}; font-size:15px; line-height:1.65; }
  .email-body h2 { margin:0 0 16px; font-size:20px; color:${LUMORA_COLORS.navy}; font-weight:700; }
  .email-body p { margin:0 0 14px; color:${LUMORA_COLORS.slate}; }
  .email-body ul { margin:0 0 14px; padding-left:20px; color:${LUMORA_COLORS.slate}; }
  .email-body ul li { margin:6px 0; }
  .btn { display:inline-block; padding:13px 34px; border-radius:8px; color:${LUMORA_COLORS.white} !important; text-decoration:none; font-weight:600; font-size:15px; }
  .box { border-radius:10px; padding:18px 20px; margin:18px 0; border-left:4px solid; }
  .box-label { font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; }
  .otp-code { font-size:36px; font-weight:700; letter-spacing:10px; font-family:'Courier New', monospace; color:${LUMORA_COLORS.purple}; }
  .email-footer { text-align:center; padding:24px 16px 4px; font-size:12px; color:${LUMORA_COLORS.muted}; }
  .email-footer a { color:${LUMORA_COLORS.blue}; text-decoration:none; }
  @media only screen and (max-width:480px) {
    .email-body, .email-header { padding:26px 20px !important; }
    .otp-code { font-size:28px; letter-spacing:6px; }
  }
`;

// Renders the branded header. variant controls the gradient ('brand' | 'crisis').
const renderLumoraHeader = (variant, icon, subtitle) => {
  const gradients = {
    brand: `linear-gradient(135deg, ${LUMORA_COLORS.navy} 0%, ${LUMORA_COLORS.purple} 100%)`,
    crisis: `linear-gradient(135deg, ${LUMORA_COLORS.crisisDark} 0%, ${LUMORA_COLORS.crisisBorder} 100%)`,
  };
  return `
    <div class="email-header" style="background:${gradients[variant] || gradients.brand};">
      <p class="brand">${icon} Lumora</p>
      <p class="tagline">${subtitle}</p>
    </div>
  `;
};

const renderLumoraFooter = (recipientLine) => `
  <div class="email-footer">
    <p>${recipientLine}</p>
    <p>© ${new Date().getFullYear()} Lumora Mental Health Platform. All rights reserved.</p>
  </div>
`;

// variant: 'success' | 'warning' | 'crisis' | 'info' | 'neutral'
const renderLumoraBox = (variant, label, contentHtml) => {
  const variants = {
    success: { bg: LUMORA_COLORS.successBg, border: LUMORA_COLORS.successBorder, text: LUMORA_COLORS.success },
    warning: { bg: LUMORA_COLORS.warningBg, border: LUMORA_COLORS.warningBorder, text: LUMORA_COLORS.warning },
    crisis: { bg: LUMORA_COLORS.crisisBg, border: LUMORA_COLORS.crisisBorder, text: LUMORA_COLORS.crisis },
    info: { bg: '#eef1fb', border: LUMORA_COLORS.purple, text: LUMORA_COLORS.navy },
    neutral: { bg: LUMORA_COLORS.neutralBg, border: LUMORA_COLORS.neutralBorder, text: LUMORA_COLORS.slate },
  };
  const v = variants[variant] || variants.info;
  return `
    <div class="box" style="background:${v.bg}; border-left-color:${v.border};">
      ${label ? `<div class="box-label" style="color:${v.text};">${label}</div>` : ''}
      <div style="margin-top:${label ? '6px' : '0'}; color:${v.text === LUMORA_COLORS.navy ? LUMORA_COLORS.slate : v.text};">${contentHtml}</div>
    </div>
  `;
};

// rows: [{ label, value }]
const renderLumoraCredentials = (rows) => `
  <div class="box" style="background:#eef1fb; border-left-color:${LUMORA_COLORS.purple};">
    <div class="box-label" style="color:${LUMORA_COLORS.navy};">🔑 Your Login Credentials</div>
    <div style="margin-top:8px;">
      ${rows.map(r => `<p style="margin:4px 0; color:${LUMORA_COLORS.slate};"><strong>${r.label}:</strong> <code style="background:#e2e8f0; padding:3px 10px; border-radius:6px; font-family:'Courier New', monospace; font-size:14px; color:${LUMORA_COLORS.navy}; font-weight:600;">${r.value}</code></p>`).join('')}
    </div>
  </div>
`;

const renderLumoraOtpBox = (otp, label) => `
  <div style="background:#eef1fb; border-radius:12px; padding:26px 20px; text-align:center; margin:20px 0; border:1px solid #dde3f7;">
    <div style="font-size:13px; color:${LUMORA_COLORS.slateLight}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:10px; font-weight:600;">${label}</div>
    <div class="otp-code">${otp}</div>
  </div>
`;

// variant: 'primary' | 'crisis'
const renderLumoraButton = (href, label, variant) => `
  <div style="text-align:center; margin:24px 0;">
    <a href="${href}" class="btn" style="background:${variant === 'crisis' ? LUMORA_COLORS.crisisBorder : LUMORA_COLORS.purple};">${label}</a>
  </div>
`;

// Wraps a body fragment in the full HTML document shell shared by every email.
const wrapLumoraEmail = ({ title, headerVariant, headerIcon, headerSubtitle, bodyHtml, footerLine }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>${lumoraBaseStyles}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-card">
          ${renderLumoraHeader(headerVariant || 'brand', headerIcon || '💙', headerSubtitle || 'Mental Health Support Platform')}
          <div class="email-body">
            ${bodyHtml}
          </div>
        </div>
        ${renderLumoraFooter(footerLine)}
      </div>
    </body>
    </html>
  `;

/**
 * Send counsellor approval email
 * @param {string} email - Recipient email address
 * @param {string} name - Counsellor's name
 * @param {string} password - Temporary password (optional)
 * @returns {Promise<Object>} - Email send result
 */
const sendCounsellorApprovalEmail = async (email, name, password = null) => {
  const subject = "🎉 Your Counsellor Application Has Been Approved!";

  const bodyHtml = `
    <h2>🎉 Welcome to the Counsellor Team!</h2>
    <p>Dear <strong>${name}</strong>,</p>
    <p>We are delighted to inform you that your application to become a counsellor on the Lumora platform has been <span style="color:${LUMORA_COLORS.success}; font-weight:600;">approved</span>.</p>

    <p>You now have access to:</p>
    <ul>
      <li>✅ The counsellor dashboard</li>
      <li>✅ Your assigned students' well-being overviews</li>
      <li>✅ Appointment scheduling</li>
      <li>✅ Secure messaging with students</li>
      <li>✅ Real-time well-being monitoring tools</li>
    </ul>

    ${password ? `
    ${renderLumoraCredentials([
      { label: 'Email', value: email },
      { label: 'Password', value: password },
    ])}
    ${renderLumoraBox('warning', '⚠️ Important', 'Please change your password after your first login for security purposes.')}
    ` : `
    <p>You can log in using your registered email address.</p>
    `}

    ${renderLumoraButton(process.env.FRONTEND_URL || 'http://localhost:3000', '🚀 Go to Lumora', 'primary')}

    <p style="font-size:14px;">
      If you have any questions, please contact our support team at <a href="mailto:support@lumora.com" style="color:${LUMORA_COLORS.purple};">support@lumora.com</a>.
    </p>
    <p style="font-size:14px; margin-bottom:0;">
      Warm regards,<br>
      <strong style="color:${LUMORA_COLORS.navy};">The Lumora Team 💙</strong>
    </p>
  `;

  const html = wrapLumoraEmail({
    title: 'Application Approved',
    headerVariant: 'brand',
    headerIcon: '✨',
    bodyHtml,
    footerLine: `This email was sent to <a href="mailto:${email}">${email}</a>. If you did not request this, please ignore this email.`,
  });

  const text = `
    Lumora - Counsellor Application Approved!

    Dear ${name},

    We are delighted to inform you that your application to become a counsellor on the Lumora platform has been approved!

    You now have access to:
    - The counsellor dashboard
    - Your assigned students' well-being overviews
    - Appointment scheduling
    - Secure messaging with students
    - Real-time well-being monitoring tools

    ${password ? `Your Login Credentials:
    Email: ${email}
    Password: ${password}

    IMPORTANT: Please change your password after your first login.` : 'You can log in using your registered email address.'}

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

  const bodyHtml = `
    <h2>📋 Application Update</h2>
    <p>Dear <strong>${name}</strong>,</p>
    <p>Thank you for your interest in becoming a counsellor on the Lumora platform.</p>
    <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>

    ${reason ? renderLumoraBox('neutral', '📝 Reason Provided by Admin', reason) : ''}

    <p style="font-size:14px;">
      We encourage you to reapply in the future. If you have any questions, please contact our support team at <a href="mailto:support@lumora.com" style="color:${LUMORA_COLORS.purple};">support@lumora.com</a>.
    </p>
    <p style="font-size:14px; margin-bottom:0;">
      Warm regards,<br>
      <strong style="color:${LUMORA_COLORS.navy};">The Lumora Team 💙</strong>
    </p>
  `;

  const html = wrapLumoraEmail({
    title: 'Application Update',
    headerVariant: 'brand',
    headerIcon: '✨',
    bodyHtml,
    footerLine: `This email was sent to <a href="mailto:${email}">${email}</a>.`,
  });

  const text = `
    Lumora - Application Update

    Dear ${name},

    Thank you for your interest in becoming a counsellor on the Lumora platform.

    After careful review, we regret to inform you that your application has not been approved at this time.

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

  const bodyHtml = `
    <h2>🎉 Welcome to Lumora!</h2>
    <p>Dear <strong>${name}</strong>,</p>
    <p>We are pleased to let you know that your ${accountType} account has been <span style="color:${LUMORA_COLORS.success}; font-weight:600;">approved</span>.</p>
    <p>You can now log in and start using the platform.</p>

    ${renderLumoraButton(process.env.FRONTEND_URL || 'http://localhost:3000', '🚀 Login to Lumora', 'primary')}

    <p style="font-size:14px; margin-bottom:0;">
      Warm regards,<br>
      <strong style="color:${LUMORA_COLORS.navy};">The Lumora Team 💙</strong>
    </p>
  `;

  const html = wrapLumoraEmail({
    title: 'Account Approved',
    headerVariant: 'brand',
    headerIcon: '✨',
    bodyHtml,
    footerLine: `This email was sent to ${email}.`,
  });

  const text = `
    Lumora - Account Approved!

    Dear ${name},

    We are pleased to let you know that your ${accountType} account has been approved!

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

  const bodyHtml = `
    <h2>You've Been Invited! 👋</h2>
    <p>Dear Parent,</p>
    <p><strong>${studentName}</strong> has invited you to view their mental health and well-being summary on Lumora.</p>
    <p>This is a secure, read-only view that helps you stay informed and support your child's mental health journey.</p>

    ${renderLumoraCredentials([
      { label: 'Email', value: parentEmail },
      { label: 'Password', value: 'password123' },
    ])}
    ${renderLumoraBox('warning', '⚠️ Important', 'Please change your password after your first login for security purposes.')}

    ${renderLumoraButton(loginLink, '🚀 Go to Lumora', 'primary')}

    <p style="font-size:14px;">
      If you did not expect this invitation, you can safely ignore this email.
    </p>
    <p style="font-size:14px; margin-bottom:0;">
      Warm regards,<br>
      <strong style="color:${LUMORA_COLORS.navy};">The Lumora Team 💙</strong>
    </p>
  `;

  const html = wrapLumoraEmail({
    title: 'Parent Invitation',
    headerVariant: 'brand',
    headerIcon: '✨',
    bodyHtml,
    footerLine: `This email was sent to <a href="mailto:${parentEmail}">${parentEmail}</a>.`,
  });

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

  const sourceLabel = source === 'journal' ? '📓 Journal Entry' : source === 'chat' ? '💬 AI Chat' : source === 'post' ? '📢 Peer Support Post' : '⚠️ Unknown';

  const alertDetailsHtml = `
    <p style="margin:4px 0;"><strong>Student:</strong> ${studentName} ${studentNickname ? `(@${studentNickname})` : ''}</p>
    <p style="margin:4px 0;"><strong>Alert Type:</strong> ${alertType || 'Crisis Alert'}</p>
    <p style="margin:4px 0;"><strong>Source:</strong> ${sourceLabel}</p>
    <p style="margin:4px 0;"><strong>Message:</strong> ${alertMessage || 'No additional message provided.'}</p>
  `;

  const crisisResourcesHtml = `
    <ul style="margin:8px 0 0; padding-left:20px;">
      <li>Talian Kasih: 15999 (24/7)</li>
      <li>Befrienders KL: 03-7627 2929 (24/7)</li>
      <li>Talian HEAL: 15555 (8.30 am – 11.59 pm)</li>
    </ul>
  `;

  const bodyHtml = `
    <h2 style="color:${LUMORA_COLORS.crisis};">⚠️ Immediate Action Required</h2>
    <p>Dear <strong>${counsellorName}</strong>,</p>
    <p>A student has triggered a crisis alert in the Lumora system. Please review and respond as soon as possible.</p>

    ${renderLumoraBox('crisis', '📋 Alert Details', alertDetailsHtml)}
    ${renderLumoraBox('warning', '📞 Crisis Resources', crisisResourcesHtml)}

    ${renderLumoraButton(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/counsellor/alerts`, '🛡️ View Alerts Dashboard', 'crisis')}

    <p style="font-size:14px;">
      Please log in to the counsellor dashboard to view full details and take appropriate action.
    </p>
    <p style="font-size:14px; margin-bottom:0;">
      Warm regards,<br>
      <strong style="color:${LUMORA_COLORS.navy};">The Lumora Team 💙</strong>
    </p>
  `;

  const html = wrapLumoraEmail({
    title: 'Crisis Alert',
    headerVariant: 'crisis',
    headerIcon: '🚨',
    headerSubtitle: 'Crisis Alert System',
    bodyHtml,
    footerLine: `This email was sent to <a href="mailto:${counsellorEmail}">${counsellorEmail}</a> because you are a registered counsellor in the Lumora system.`,
  });

  const text = `
    🚨 CRISIS ALERT: ${studentName} Needs Immediate Attention

    Dear ${counsellorName},

    A student has triggered a crisis alert in the Lumora system.

    Alert Details:
    Student: ${studentName} ${studentNickname ? `(@${studentNickname})` : ''}
    Alert Type: ${alertType || 'Crisis Alert'}
    Source: ${sourceLabel}
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

/**
 * Send email verification OTP
 */
const sendVerificationEmail = async (email, name, otp) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const subject = "Verify Your Email Address - Lumora";

  const bodyHtml = `
    <h2>Verify Your Email Address</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Thank you for registering with Lumora. Please use the verification code below to confirm your email address.</p>

    ${renderLumoraOtpBox(otp, '✉️ Your Verification Code')}

    <p>This code will expire in <strong>10 minutes</strong>.</p>
    ${renderLumoraBox('warning', '⚠️ Security Notice', 'Do not share this code with anyone. Lumora will never ask for your verification code outside of the official platform.')}

    <p>If you did not create an account on Lumora, please ignore this email.</p>
    <p style="margin-bottom:0;">
      Warm regards,<br>
      <strong style="color:${LUMORA_COLORS.navy};">The Lumora Team 💙</strong>
    </p>
  `;

  const html = wrapLumoraEmail({
    title: 'Verify Your Email',
    headerVariant: 'brand',
    headerIcon: '✨',
    bodyHtml,
    footerLine: `This email was sent to ${email}. If you did not request this, please ignore it.`,
  });

  const text = `
    Lumora - Verify Your Email Address

    Hi ${name},

    Thank you for registering with Lumora. Please use the verification code below to confirm your email address.

    Your Verification Code: ${otp}

    This code will expire in 10 minutes.

    Do not share this code with anyone. Lumora will never ask for your verification code outside of the official platform.

    If you did not create an account on Lumora, please ignore this email.

    Warm regards,
    The Lumora Team 💙
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send password reset OTP
 */
const sendPasswordResetEmail = async (email, name, otp) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const subject = "Password Reset Request - Lumora";

  const bodyHtml = `
    <h2>Password Reset Request</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received a request to reset your password. Use the verification code below to proceed.</p>

    ${renderLumoraOtpBox(otp, '🔄 Your Password Reset Code')}

    <p>This code will expire in <strong>10 minutes</strong>.</p>
    ${renderLumoraBox('warning', '⚠️ Security Notice', 'Do not share this code with anyone. If you did not request a password reset, please ignore this email.')}

    <p style="margin-bottom:0;">
      Warm regards,<br>
      <strong style="color:${LUMORA_COLORS.navy};">The Lumora Team 💙</strong>
    </p>
  `;

  const html = wrapLumoraEmail({
    title: 'Password Reset',
    headerVariant: 'brand',
    headerIcon: '✨',
    bodyHtml,
    footerLine: `This email was sent to ${email}. If you did not request this, please ignore it.`,
  });

  const text = `
    Lumora - Password Reset Request

    Hi ${name},

    We received a request to reset your password. Use the verification code below to proceed.

    Your Password Reset Code: ${otp}

    This code will expire in 10 minutes.

    Do not share this code with anyone. If you did not request a password reset, please ignore this email.

    Warm regards,
    The Lumora Team 💙
  `;

  return await sendEmail({ to: email, subject, html, text });
};

// Make sure to export the new functions
module.exports = {
  sendEmail,
  sendCounsellorApprovalEmail,
  sendCounsellorRejectionEmail,
  sendAccountApprovalEmail,
  sendParentInvitationEmail,
  sendCrisisAlertEmail,
  sendVerificationEmail,      // NEW
  sendPasswordResetEmail      // NEW
};