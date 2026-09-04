const OpenAI = require("openai");
const pool = require("../config/db");

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
You are the emotion-analysis component of MindEase, a mental wellness application.

Analyze ONLY the emotional signals expressed in the user's journal text.

Your task is NOT to diagnose the user and NOT to determine their mental health condition.

Identify the emotions that are actually supported by the writing.

You may identify between 2 and 5 emotions.

Use only these emotion categories:

Happiness
Calm
Neutral
Stress
Sadness
Anxiety
Anger
Fatigue
Excitement
Fear

IMPORTANT RULES FOR EMOTION ANALYSIS:

1. Base the analysis strictly on the user's words.
2. Do not invent emotions that are not supported by the text.
3. Positive and negative emotions may appear together.
4. Do not assume that a person is happy just because something good happened.
5. Do not assume that a person is stressed just because they mention work or studying.
6. Look for explicit emotional language, descriptions of feelings, concerns, reactions and emotional context.
7. If the text contains mixed emotions, represent those mixed emotions.
8. Do not diagnose depression, anxiety disorders, burnout, or any other medical condition.
9. Percentages represent the relative emotional evidence present in the text. They are NOT clinical probabilities.
10. Percentages must be integers.
11. Percentages must add up to exactly 100.
12. The highest percentage must correspond to dominantEmotion.
13. Use 2 to 5 emotions, but do not add weak or unsupported emotions just to increase the number.
14. If the journal contains very little emotional information, use Neutral as the dominant emotion.
15. Intensity should describe how strongly the emotions are expressed in the writing:
    Low
    Moderate
    High

Return ONLY valid JSON.

Required format:

{
    "emotions": [
        {
            "emotion": "Happiness",
            "percentage": 45
        },
        {
            "emotion": "Stress",
            "percentage": 35
        },
        {
            "emotion": "Fatigue",
            "percentage": 20
        }
    ],
    "dominantEmotion": "Happiness",
    "intensity": "Moderate"
}
`
                },
                {
                    role: "user",
                    content: journal.trim()
                }
            ],

            response_format: {
                type: "json_object"
            },

            temperature: 0.2,
            max_completion_tokens: 500
        });

        const content = response.choices[0].message.content;

        console.log("Groq Journal Response:");
        console.log(content);

        const analysis = JSON.parse(content);

        if (
            !analysis.emotions ||
            !Array.isArray(analysis.emotions) ||
            analysis.emotions.length === 0
        ) {
            throw new Error("Invalid emotion analysis returned by Groq");
        }

        // Clean and validate emotion values
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

        analysis.emotions = analysis.emotions
            .filter((item) => {
                return (
                    allowedEmotions.includes(item.emotion) &&
                    Number.isFinite(Number(item.percentage))
                );
            })
            .map((item) => ({
                emotion: item.emotion,
                percentage: Math.max(
                    0,
                    Math.min(100, Math.round(Number(item.percentage)))
                )
            }));

        if (analysis.emotions.length === 0) {
            throw new Error("No valid emotions returned by Groq");
        }

        // Make percentages add up to exactly 100
        let total = analysis.emotions.reduce(
            (sum, item) => sum + item.percentage,
            0
        );

        if (total <= 0) {
            analysis.emotions = [
                {
                    emotion: "Neutral",
                    percentage: 100
                }
            ];
        } else if (total !== 100) {
            analysis.emotions = analysis.emotions.map((item) => ({
                ...item,
                percentage: Math.round(
                    (item.percentage / total) * 100
                )
            }));

            const normalizedTotal = analysis.emotions.reduce(
                (sum, item) => sum + item.percentage,
                0
            );

            const difference = 100 - normalizedTotal;

            const highestIndex = analysis.emotions.reduce(
                (highestIndex, item, index, array) =>
                    item.percentage >
                    array[highestIndex].percentage
                        ? index
                        : highestIndex,
                0
            );

            analysis.emotions[highestIndex].percentage += difference;
        }

        // Sort from highest to lowest
        analysis.emotions.sort(
            (a, b) => b.percentage - a.percentage
        );

        // Dominant emotion must always match the highest percentage
        analysis.dominantEmotion =
            analysis.emotions[0].emotion;

        // Validate intensity
        if (
            !["Low", "Moderate", "High"].includes(
                analysis.intensity
            )
        ) {
            analysis.intensity = "Moderate";
        }

        // Save journal
        const journalResult = await pool.query(
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

        // Save emotion breakdown
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


module.exports = {
    analyzeJournal,
    getJournalHistory
};