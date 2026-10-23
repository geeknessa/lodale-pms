import { Resend } from 'resend';

/**
 * Checks whether Resend transactional email service is configured.
 * @returns {boolean}
 */
export const isEmailEnabled = () => {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);
};

/**
 * Sends an email via Resend if configured, or logs to console in development.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.html] - HTML body
 * @param {string} [options.text] - Plain text body
 * @returns {Promise<{ success: boolean, id?: string, mode: 'resend' | 'console' }>}
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.EMAIL_FROM || 'Lodale <onboarding@resend.dev>';

  if (isEmailEnabled()) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY.trim());
      const payload = {
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {})
      };

      const { data, error } = await resend.emails.send(payload);

      if (error) {
        throw new Error(`Resend email delivery failed: ${error.message || JSON.stringify(error)}`);
      }

      return {
        success: true,
        id: data?.id,
        mode: 'resend'
      };
    } catch (err) {
      console.error('[EmailService] Failed to send email via Resend:', err.message);
      throw err;
    }
  }

  // Development fallback: Log email clearly to console
  console.log('==================================================');
  console.log('[EmailService (Console Mode)] Email dispatched:');
  console.log(`From:    ${from}`);
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  if (text) {
    console.log('--- Plaintext Body ---');
    console.log(text);
  }
  if (!text && html) {
    console.log('--- HTML Body ---');
    console.log(html);
  }
  console.log('==================================================');

  return {
    success: true,
    mode: 'console'
  };
};

/**
 * Sends a 6-digit verification code email.
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.code
 * @param {string} [options.purpose='email_change']
 * @returns {Promise<{ success: boolean, id?: string, mode: 'resend' | 'console' }>}
 */
export const sendVerificationCodeEmail = async ({ to, code, purpose = 'email_change' }) => {
  const purposeTitle = purpose === 'email_change' ? 'Email Address Change' : 'Account Verification';
  const subject = `Your Lodale Verification Code: ${code}`;

  const text = [
    `Lodale Property Management`,
    ``,
    `Your verification code for ${purposeTitle} is: ${code}`,
    ``,
    `This verification code will expire in 10 minutes.`,
    `If you did not request this action, please secure your account and disregard this email.`
  ].join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; padding: 32px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700;">Lodale Property Management</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                We received a request for ${purposeTitle}. Please use the verification code below to confirm this change:
              </p>
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${code}</span>
              </div>
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                If you did not request this verification, please disregard this email.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `.trim();

  return sendEmail({ to, subject, html, text });
};

/**
 * Sends a password reset email with both reset link and code.
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.resetUrl
 * @param {string} options.code
 * @returns {Promise<{ success: boolean, id?: string, mode: 'resend' | 'console' }>}
 */
export const sendPasswordResetEmail = async ({ to, resetUrl, code }) => {
  const subject = 'Reset Your Lodale Password';

  const text = [
    `Lodale Property Management`,
    ``,
    `We received a request to reset your password.`,
    ``,
    `Reset Link: ${resetUrl}`,
    ``,
    `Or use this 6-digit verification code: ${code}`,
    ``,
    `This link and code will expire in 15 minutes.`,
    `If you did not request a password reset, you can safely ignore this email.`
  ].join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; padding: 32px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700;">Lodale Property Management</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                We received a request to reset the password for your Lodale account. Click the button below to choose a new password:
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #2C4633; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
                  Reset Password
                </a>
              </div>
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Alternatively, you can manually enter this 6-digit verification code on the reset page:
              </p>
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px; text-align: center; margin: 12px 0 20px 0;">
                <span style="font-size: 22px; font-weight: 800; letter-spacing: 4px; color: #0f172a; font-family: monospace;">${code}</span>
              </div>
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                This link and code will expire in <strong>15 minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `.trim();

  return sendEmail({ to, subject, html, text });
};

/**
 * Sends a tenant invitation email with temporary credentials.
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.firstName
 * @param {string} options.temporaryPassword
 * @param {string} [options.loginUrl]
 * @returns {Promise<{ success: boolean, id?: string, mode: 'resend' | 'console' }>}
 */
export const sendTenantInviteEmail = async ({ to, firstName, temporaryPassword, loginUrl }) => {
  const subject = 'Welcome to Lodale - Your Tenant Account Invitation';
  const targetLoginUrl = loginUrl || process.env.FRONTEND_URL || 'http://localhost:5173/login';

  const text = [
    `Hello ${firstName ? firstName : 'there'},`,
    ``,
    `You have been invited by your landlord to join the Lodale Property Management platform.`,
    ``,
    `Your temporary login credentials:`,
    `Email: ${to}`,
    `Temporary Password: ${temporaryPassword}`,
    ``,
    `Sign in here: ${targetLoginUrl}`,
    ``,
    `For your security, please change your password after logging in.`
  ].join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; padding: 32px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700;">Lodale Property Management</h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                Hello ${firstName ? firstName : 'there'},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                You have been invited by your landlord to access your tenancy details on Lodale. Here are your temporary login details:
              </p>
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569;"><strong>Email:</strong> ${to}</p>
                <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
              </div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${targetLoginUrl}" style="display: inline-block; background-color: #2C4633; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
                  Sign In to Lodale
                </a>
              </div>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                For your security, we recommend updating your password once you sign in.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `.trim();

  return sendEmail({ to, subject, html, text });
};

/**
 * Sends an official rent receipt email to tenant.
 * @param {Object} options
 * @param {string} options.to - Tenant email
 * @param {string} options.tenantName - Tenant full name
 * @param {string} options.landlordName - Landlord full name
 * @param {string} options.propertyTitle - Property title
 * @param {number|string} options.amount - Amount in Naira
 * @param {string} options.paymentDate - Payment date
 * @param {string} options.paymentMethod - Payment method (Paystack, Bank Transfer, etc.)
 * @param {string} options.reference - Payment / transaction reference
 * @param {string} options.receiptNumber - Official receipt number
 * @param {string} [options.signedBy] - Landlord signature name if signed
 * @param {string} [options.signedAt] - Timestamp of signature
 * @returns {Promise<{ success: boolean, id?: string, mode: 'resend' | 'console' }>}
 */
export const sendReceiptEmail = async ({
  to,
  tenantName,
  landlordName,
  propertyTitle,
  amount,
  paymentDate,
  paymentMethod = 'Paystack',
  reference = 'N/A',
  receiptNumber = 'LOD-REC',
  signedBy,
  signedAt
}) => {
  const formattedAmount = Number(amount || 0).toLocaleString();
  const subject = `Official Rent Payment Receipt - ${receiptNumber} (${propertyTitle})`;

  const text = [
    `Lodale Property Management - Official Rent Receipt`,
    ``,
    `Receipt Number: ${receiptNumber}`,
    `Date Paid: ${paymentDate}`,
    `Tenant: ${tenantName || 'Valued Tenant'}`,
    `Property: ${propertyTitle}`,
    `Amount Paid: NGN ${formattedAmount}`,
    `Payment Method: ${paymentMethod}`,
    `Reference: ${reference}`,
    signedBy ? `Signed by Landlord: ${signedBy} on ${new Date(signedAt || Date.now()).toLocaleDateString('en-GB')}` : `Status: Verified by Landlord`,
    ``,
    `Thank you for your timely payment. This document serves as your official payment receipt.`
  ].join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f4; margin: 0; padding: 28px 16px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #13231B; padding: 24px 32px; color: #ffffff;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Lodale</span>
                    <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #E5C583; margin-top: 2px;">Property Management</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #244533; border: 1px solid #366046; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #E5C583;">OFFICIAL RECEIPT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Receipt Details -->
          <tr>
            <td style="padding: 32px;">
              <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Receipt Number</p>
                <p style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; font-family: monospace;">${receiptNumber}</p>
              </div>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" valign="top">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Issued To (Tenant)</p>
                    <p style="margin: 0 0 2px 0; font-size: 15px; font-weight: 700; color: #0f172a;">${tenantName || 'Valued Tenant'}</p>
                    <p style="margin: 0; font-size: 13px; color: #475569;">${propertyTitle}</p>
                  </td>
                  <td width="50%" valign="top" align="right">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Issued By (Landlord)</p>
                    <p style="margin: 0 0 2px 0; font-size: 15px; font-weight: 700; color: #0f172a;">${landlordName || 'Property Owner'}</p>
                    <p style="margin: 0; font-size: 13px; color: #475569;">Verified via Lodale PMS</p>
                  </td>
                </tr>
              </table>

              <!-- Payment Summary Box -->
              <div style="background-color: #F8FAF8; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom: 10px; font-size: 13px; color: #64748b;">Payment Date:</td>
                    <td align="right" style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #0f172a;">${paymentDate}</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 10px; font-size: 13px; color: #64748b;">Payment Method:</td>
                    <td align="right" style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #0f172a;">${paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 14px; font-size: 13px; color: #64748b;">Transaction Reference:</td>
                    <td align="right" style="padding-bottom: 14px; font-size: 12px; font-family: monospace; font-weight: 600; color: #0f172a;">${reference}</td>
                  </tr>
                  <tr style="border-top: 1px solid #cbd5e1;">
                    <td style="padding-top: 14px; font-size: 16px; font-weight: 800; color: #13231B;">Total Amount Paid:</td>
                    <td align="right" style="padding-top: 14px; font-size: 20px; font-weight: 800; color: #1B4D35;">NGN ${formattedAmount}</td>
                  </tr>
                </table>
              </div>

              <!-- Landlord Stamp / Signature area -->
              <div style="border: 2px dashed ${signedBy ? '#2C4633' : '#cbd5e1'}; background-color: ${signedBy ? '#f0fdf4' : '#fafafa'}; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; text-align: center;">
                ${
                  signedBy
                    ? `<p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #166534;">OFFICIALLY SIGNED & VERIFIED</p>
                       <p style="margin: 0; font-size: 14px; font-weight: 700; color: #14532d;">${signedBy}</p>
                       <p style="margin: 2px 0 0 0; font-size: 11px; color: #15803d;">Date: ${new Date(signedAt || Date.now()).toLocaleDateString('en-GB')}</p>`
                    : `<p style="margin: 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">VERIFIED LODALE PAYMENT RECORD</p>`
                }
              </div>

              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                This receipt was automatically generated and authenticated by Lodale Property Management System.<br>
                For any inquiries regarding this receipt, please contact your landlord or support@lodale.com.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `.trim();

  return sendEmail({ to, subject, html, text });
};

