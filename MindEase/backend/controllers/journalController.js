const OpenAI = require("openai");
const pool = require("../config/db");

const allowedEmotions = [
    "Happiness",
    "Calm",
    "Neutral",
    "Stress",
    "Sadness",
    "Anxiety",
    "Anger",
    "Fatigue",
    "Excitement",
    "Fear"
];

const analyzeJournal = async (req, res) => {
    try {
        const { journal, user_id } = req.body;

        if (!journal || journal.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "Journal text is required"
            });
        }

        if (!user_id) {
            return res.status(400).json({
                success: false,
                error: "User ID is required"
            });
        }

        const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1"
        });

        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",

            messages: [
                {
                    role: "system",
                    content: `
You are the emotion-analysis component of MindEase.

Analyze the emotional signals in the user's journal.

Return EXACTLY THREE different emotions.

Choose the three emotions that are most relevant to the emotional content of the journal.

Do not diagnose any mental health condition.

Allowed emotions:

Happiness, Calm, Neutral, Stress, Sadness, Anxiety, Anger, Fatigue, Excitement, Fear.

Percentages must represent the relative emotional evidence in the journal.

The three percentages must add up to exactly 100.

The highest percentage must be the dominant emotion.

All three emotions must be different.

Intensity must be Low, Moderate, or High.

Return only the requested JSON structure.
`
                },
                {
                    role: "user",
                    content: journal.trim()
                }
            ],

            response_format: {
                type: "json_schema",

                json_schema: {
                    name: "journal_emotion_analysis",

                    strict: true,

                    schema: {
                        type: "object",

                        properties: {
                            emotions: {
                                type: "array",

                                items: {
                                    type: "object",

                                    properties: {
                                        emotion: {
                                            type: "string",
                                            enum: allowedEmotions
                                        },

                                        percentage: {
                                            type: "integer"
                                        }
                                    },

                                    required: [
                                        "emotion",
                                        "percentage"
                                    ],

                                    additionalProperties: false
                                }
                            },

                            dominantEmotion: {
                                type: "string",
                                enum: allowedEmotions
                            },

                            intensity: {
                                type: "string",
                                enum: [
                                    "Low",
                                    "Moderate",
                                    "High"
                                ]
                            }
                        },

                        required: [
                            "emotions",
                            "dominantEmotion",
                            "intensity"
                        ],

                        additionalProperties: false
                    }
                }
            },

            temperature: 0.2,
            max_completion_tokens: 300
        });

        const content =
            response.choices[0].message.content;

        console.log("Groq Journal Response:");
        console.log(content);

        const analysis = JSON.parse(content);

        if (
            !analysis.emotions ||
            !Array.isArray(analysis.emotions)
        ) {
            throw new Error(
                "Invalid emotion analysis returned by Groq"
            );
        }

        if (analysis.emotions.length !== 3) {
            throw new Error(
                "Journal analysis must contain exactly 3 emotions"
            );
        }

        const emotionNames =
            analysis.emotions.map(
                (item) => item.emotion
            );

        const uniqueEmotionNames =
            new Set(emotionNames);

        if (uniqueEmotionNames.size !== 3) {
            throw new Error(
                "Journal analysis contains duplicate emotions"
            );
        }

        for (const emotion of analysis.emotions) {
            if (
                !allowedEmotions.includes(
                    emotion.emotion
                )
            ) {
                throw new Error(
                    "Invalid emotion returned by Groq"
                );
            }

            if (
                !Number.isInteger(
                    emotion.percentage
                ) ||
                emotion.percentage < 0 ||
                emotion.percentage > 100
            ) {
                throw new Error(
                    "Invalid emotion percentage returned by Groq"
                );
            }
        }

        const total =
            analysis.emotions.reduce(
                (sum, item) =>
                    sum + item.percentage,
                0
            );

        if (total !== 100) {
            throw new Error(
                `Emotion percentages must total 100. Received ${total}`
            );
        }

        analysis.emotions.sort(
            (a, b) =>
                b.percentage -
                a.percentage
        );

        analysis.dominantEmotion =
            analysis.emotions[0].emotion;

        if (
            ![
                "Low",
                "Moderate",
                "High"
            ].includes(analysis.intensity)
        ) {
            analysis.intensity = "Moderate";
        }

        const journalResult =
            await pool.query(
                `
                INSERT INTO journals
                (user_id, journal_text, overall_mood)
                VALUES ($1, $2, $3)
                RETURNING journal_id, created_at
                `,
                [
                    user_id,
                    journal.trim(),
                    analysis.dominantEmotion
                ]
            );

        const journalId =
            journalResult.rows[0].journal_id;

        for (const emotion of analysis.emotions) {
            await pool.query(
                `
                INSERT INTO journal_emotions
                (journal_id, emotion, percentage)
                VALUES ($1, $2, $3)
                `,
                [
                    journalId,
                    emotion.emotion,
                    emotion.percentage
                ]
            );
        }

        res.json({
            success: true,
            journal_id: journalId,
            created_at:
                journalResult.rows[0].created_at,
            analysis: analysis
        });

    } catch (error) {
        console.error(
            "Journal Analysis Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


const getJournalHistory = async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                error: "User ID is required"
            });
        }

        const result = await pool.query(
            `
            SELECT
                journal_id,
                journal_text,
                overall_mood,
                created_at
            FROM journals
            WHERE user_id = $1
            ORDER BY created_at DESC
            `,
            [user_id]
        );

        res.json({
            success: true,
            journals: result.rows
        });

    } catch (error) {
        console.error(
            "Journal History Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: "Failed to fetch journal history"
        });
    }
};


const deleteJournal = async (req, res) => {
    try {
        const { journal_id } = req.params;
        const { user_id } = req.query;

        if (!journal_id || !user_id) {
            return res.status(400).json({
                success: false,
                error: "Journal ID and User ID are required"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM journals
            WHERE journal_id = $1
            AND user_id = $2
            RETURNING journal_id
            `,
            [
                journal_id,
                user_id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Journal not found or does not belong to this user"
            });
        }

        res.json({
            success: true,
            message: "Journal deleted successfully",
            journal_id: result.rows[0].journal_id
        });

    } catch (error) {
        console.error(
            "Delete Journal Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: "Failed to delete journal"
        });
    }
};


module.exports = {
    analyzeJournal,
    getJournalHistory,
    deleteJournal
};