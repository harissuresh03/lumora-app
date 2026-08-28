// backend/services/verificationService.js
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { sendVerificationEmail, sendPasswordResetEmail } = require("./emailService");

/**
 * Generate a secure 6-digit OTP
 */
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP using bcrypt
 */
const hashOTP = async (otp) => {
    return await bcrypt.hash(otp, 10);
};

/**
 * Verify OTP for a user and type
 */
const verifyOTP = async (userId, type, otp) => {
    try {
        // Find active, unused, unexpired OTP
        const [rows] = await db.promise().query(
            `SELECT * FROM verification_codes 
             WHERE user_id = ? AND type = ? AND is_used = FALSE AND expires_at > NOW() 
             ORDER BY created_at DESC LIMIT 1`,
            [userId, type]
        );

        if (rows.length === 0) {
            return { valid: false, message: "No active verification code found. Please request a new code." };
        }

        const record = rows[0];
        const isValid = await bcrypt.compare(otp, record.code_hash);

        if (!isValid) {
            return { valid: false, message: "Invalid verification code. Please try again." };
        }

        // Mark as used
        await db.promise().query(
            `UPDATE verification_codes SET is_used = TRUE WHERE id = ?`,
            [record.id]
        );

        return { valid: true, record };
    } catch (error) {
        console.error("Verify OTP error:", error);
        return { valid: false, message: "Failed to verify code. Please try again." };
    }
};

/**
 * Invalidate all active OTPs for a user and type
 */
const invalidateActiveOTPs = async (userId, type) => {
    await db.promise().query(
        `UPDATE verification_codes SET is_used = TRUE 
         WHERE user_id = ? AND type = ? AND is_used = FALSE`,
        [userId, type]
    );
};

/**
 * Create and send a verification OTP
 */
const createVerification = async (userId, type, email, name) => {
    try {
        // Invalidate previous OTPs
        await invalidateActiveOTPs(userId, type);

        // Generate and hash OTP
        const otp = generateOTP();
        const hashedOTP = await hashOTP(otp);

        // Set expiration (10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Store in database
        await db.promise().query(
            `INSERT INTO verification_codes (user_id, code_hash, type, expires_at) 
             VALUES (?, ?, ?, ?)`,
            [userId, hashedOTP, type, expiresAt]
        );

        // Send email
        if (type === 'email_verification') {
            await sendVerificationEmail(email, name, otp);
        } else if (type === 'password_reset') {
            await sendPasswordResetEmail(email, name, otp);
        }

        return { success: true };
    } catch (error) {
        console.error("Create verification error:", error);
        return { success: false, message: "Failed to send verification code. Please try again." };
    }
};

module.exports = {
    generateOTP,
    hashOTP,
    verifyOTP,
    invalidateActiveOTPs,
    createVerification
};