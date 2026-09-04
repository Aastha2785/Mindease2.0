const bcrypt = require("bcrypt");
const pool = require("../config/db");

const registerUser = async (req, res) => {
    try {
        const { username, password, confirmPassword } = req.body;

        if (!username || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: "All fields are required"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: "Passwords do not match"
            });
        }

        const existingUser = await pool.query(
            "SELECT user_id FROM users WHERE username = $1",
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: "Username already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (username, password_hash)
             VALUES ($1, $2)
             RETURNING user_id, username, created_at`,
            [username, passwordHash]
        );

        res.status(201).json({
            success: true,
            message: "Registration successful",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Registration Error:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error during registration"
        });
    }
};


const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: "Username and password are required"
            });
        }

        const result = await pool.query(
            `SELECT user_id, username, password_hash, created_at
             FROM users
             WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: "Invalid username or password"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: "Invalid username or password"
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            user: {
                user_id: user.user_id,
                username: user.username,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error("Login Error:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error during login"
        });
    }
};


module.exports = {
    registerUser,
    loginUser
};