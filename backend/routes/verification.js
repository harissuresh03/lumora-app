// backend/routes/verification.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createVerification, verifyOTP } = require("../services/verificationService");

const JWT_SECRET = process.env.JWT_SECRET || "lumora_secret_key";

// ============================================
// SEND EMAIL VERIFICATION (for resend)
// ============================================

router.post("/send-verification", async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ msg: "User ID is required" });
    }

    try {
        const [users] = await db.promise().query(
            "SELECT id, email, name, is_verified FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ msg: "User not found" });
        }

        const user = users[0];

        if (user.is_verified) {
            return res.status(400).json({ msg: "This email is already verified." });
        }

        const result = await createVerification(userId, 'email_verification', user.email, user.name);

        if (result.success) {
            res.json({ msg: "Verification code sent to your email." });
        } else {
            res.status(500).json({ msg: result.message || "Failed to send verification code." });
        }
    } catch (error) {
        console.error("Send verification error:", error);
        res.status(500).json({ msg: "Failed to send verification code." });
    }
});

// ============================================
// VERIFY EMAIL OTP
// ============================================

router.post("/verify-email", async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.status(400).json({ msg: "User ID and OTP are required" });
    }

    try {
        // Verify the OTP
        const result = await verifyOTP(userId, 'email_verification', otp);

        if (!result.valid) {
            return res.status(400).json({ msg: result.message });
        }

        // Mark user as verified
        await db.promise().query(
            "UPDATE users SET is_verified = TRUE WHERE id = ?",
            [userId]
        );

        res.json({
            msg: "Email verified successfully. You can now log in."
        });
    } catch (error) {
        console.error("Verify email error:", error);
        res.status(500).json({ msg: "Failed to verify email." });
    }
});

// ============================================
// FORGOT PASSWORD - Send Reset Code
// ============================================

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ msg: "Email is required" });
    }

    try {
        const [users] = await db.promise().query(
            "SELECT id, email, name FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            // Do not reveal if email exists or not (security best practice)
            return res.json({
                msg: "If an account with this email exists, a password reset code has been sent."
            });
        }

        const user = users[0];

        const result = await createVerification(user.id, 'password_reset', user.email, user.name);

        if (result.success) {
            res.json({
                msg: "If an account with this email exists, a password reset code has been sent.",
                userId: user.id // Return userId for frontend to use in the next step
            });
        } else {
            res.status(500).json({ msg: result.message || "Failed to send reset code." });
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ msg: "Failed to process request." });
    }
});

// ============================================
// VERIFY RESET CODE
// ============================================

router.post("/verify-reset-code", async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.status(400).json({ msg: "User ID and OTP are required" });
    }

    try {
        // Verify the OTP
        const result = await verifyOTP(userId, 'password_reset', otp);

        if (!result.valid) {
            return res.status(400).json({ msg: result.message });
        }

        // Generate a short-lived JWT for password reset
        const resetToken = jwt.sign(
            { userId: userId, purpose: 'password_reset' },
            JWT_SECRET,
            { expiresIn: '5m' }
        );

        res.json({
            msg: "Code verified. You can now reset your password.",
            resetToken: resetToken
        });
    } catch (error) {
        console.error("Verify reset code error:", error);
        res.status(500).json({ msg: "Failed to verify code." });
    }
});

// ============================================
// RESET PASSWORD
// ============================================

router.post("/reset-password", async (req, res) => {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
        return res.status(400).json({ msg: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ msg: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    try {
        // Verify the reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ msg: "Invalid or expired reset token. Please request a new one." });
        }

        if (decoded.purpose !== 'password_reset') {
            return res.status(400).json({ msg: "Invalid token purpose." });
        }

        const userId = decoded.userId;

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await db.promise().query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        res.json({
            msg: "Password reset successfully. You can now log in with your new password."
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ msg: "Failed to reset password." });
    }
});

// ============================================
// RESEND RESET CODE
// ============================================

router.post("/resend-reset-code", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ msg: "Email is required" });
    }

    try {
        const [users] = await db.promise().query(
            "SELECT id, email, name FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.json({
                msg: "If an account with this email exists, a new code has been sent."
            });
        }

        const user = users[0];

        const result = await createVerification(user.id, 'password_reset', user.email, user.name);

        if (result.success) {
            res.json({
                msg: "If an account with this email exists, a new code has been sent.",
                userId: user.id
            });
        } else {
            res.status(500).json({ msg: result.message || "Failed to send reset code." });
        }
    } catch (error) {
        console.error("Resend reset code error:", error);
        res.status(500).json({ msg: "Failed to process request." });
    }
});

module.exports = router;