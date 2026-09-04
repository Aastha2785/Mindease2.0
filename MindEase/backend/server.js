const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const pool = require("./config/db");

const journalRoutes = require("./routes/journalRoutes");
const faceRoutes = require("./routes/faceRoutes");
const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");

const app = express();

app.use(cors());

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use("/api/auth", authRoutes);

app.use("/api/journal", journalRoutes);

app.use("/api/face", faceRoutes);

app.use("/api/analysis", analysisRoutes);

app.get("/", (req, res) => {
    res.send("MindEase 2.0 Backend is running!");
});

app.get("/api/test-groq", async (req, res) => {
    try {
        const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1"
        });

        const response =
            await groq.chat.completions.create({
                model: "openai/gpt-oss-20b",
                messages: [
                    {
                        role: "user",
                        content:
                            "Say hello to MindEase 2.0"
                    }
                ]
            });

        res.json({
            success: true,
            response:
                response.choices[0].message.content
        });
    } catch (error) {
        console.error(
            "Groq Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get("/api/test-db", async (req, res) => {
    try {
        const result =
            await pool.query("SELECT NOW()");

        res.json({
            success: true,
            message:
                "PostgreSQL connection is working!",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error(
            "Database Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});