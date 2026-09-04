const OpenAI = require("openai");

const analyzeOverallMood = async (req, res) => {
    try {
        const {
            journalAnalysis,
            faceAnalysis
        } = req.body;

        if (!journalAnalysis && !faceAnalysis) {
            return res.status(400).json({
                success: false,
                error: "At least one analysis is required"
            });
        }

        const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1"
        });

        const inputData = {
            journalAnalysis: journalAnalysis || null,
            faceAnalysis: faceAnalysis || null
        };

        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",

            messages: [
                {
                    role: "system",
                    content: `
You are the overall emotional analysis component of MindEase.

You receive emotional analysis from one or two sources:

1. Journal analysis
2. Facial-expression analysis

Your job is to intelligently interpret the available sources together.

IMPORTANT RULES:

- Do NOT simply average percentages.
- Consider the emotional evidence from each source.
- Journal analysis represents emotions expressed in the person's writing.
- Face analysis represents ONLY visible facial-expression signals.
- Facial expression does NOT prove the person's internal emotional state.
- The sources may disagree.
- If the sources disagree, acknowledge the difference instead of forcing agreement.
- Do not diagnose mental health conditions.
- Do not use medical or clinical diagnoses.
- Do not claim certainty about someone's internal emotional state.
- Overall percentages represent an approximate synthesis of emotional evidence, NOT clinical probabilities.

Use ONLY these emotion categories:

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

Generate 2 to 6 overall emotions when the available information supports them.

Percentages must:

- Be integers.
- Be between 0 and 100.
- Add up to exactly 100.
- The highest percentage must correspond to dominantEmotion.

Determine:

1. overallEmotions
2. dominantEmotion
3. stressLevel
4. energyLevel
5. summary
6. suggestions

stressLevel must be:

Low
Moderate
High

energyLevel must be:

Low
Moderate
High

SUMMARY RULES:

- Keep the summary short.
- Maximum 2 sentences.
- Describe the strongest emotional pattern.
- If journal and face signals disagree, briefly mention the disagreement.
- Do not use clinical language.

SUGGESTION RULES:

This is extremely important.

Suggestions MUST be personalized to the emotional signals detected in the input.

Do NOT give generic wellness advice that could apply to everyone.

Look at:

- The strongest emotions.
- The stress level.
- The energy level.
- The combination of positive and negative emotions.
- Differences between journal and facial-expression signals.

Each suggestion should directly respond to something detected.

Examples:

If Stress is high:
- Suggest reducing unnecessary pressure or taking a short recovery break.

If Anxiety is high:
- Suggest a grounding activity or breaking the worrying situation into smaller steps.

If Fatigue is high or energy is low:
- Suggest rest, recovery, or reducing excessive workload.

If Sadness is high:
- Suggest a gentle activity or reaching out to someone trusted.

If Anger is high:
- Suggest pausing before reacting and creating some distance from the trigger.

If Happiness or Excitement is high:
- Suggest continuing or making time for activities that appear to be contributing to the positive mood.

If Calm is high and stress is low:
- Suggest maintaining the routine or activities associated with the calm state.

If the emotional pattern is mixed:
- Acknowledge the mixed state and suggest something appropriate to balance the strongest negative signal without ignoring the positive one.

If journal and face signals disagree:
- Do not assume either source is correct.
- Mention that the two signals differ.
- Give a suggestion that encourages the user to check in with how they actually feel.

Suggestions must:

- Contain 2 to 3 suggestions.
- Be short and practical.
- Be directly connected to the detected emotional state.
- Avoid repeating the same idea.
- Avoid generic statements such as "take care of yourself" unless they are specifically relevant.
- Never diagnose or treat a medical condition.

Do not give emergency or medical advice unless the provided text explicitly indicates an immediate safety concern.

Return ONLY valid JSON.

Required format:

{
    "overallEmotions": [
        {
            "emotion": "Happiness",
            "percentage": 42
        },
        {
            "emotion": "Calm",
            "percentage": 20
        },
        {
            "emotion": "Stress",
            "percentage": 18
        },
        {
            "emotion": "Fatigue",
            "percentage": 12
        },
        {
            "emotion": "Anxiety",
            "percentage": 8
        }
    ],
    "dominantEmotion": "Happiness",
    "stressLevel": "Moderate",
    "energyLevel": "Moderate",
    "summary": "Your mood appears mostly positive, although some stress and fatigue are also present.",
    "suggestions": [
        "Keep making time for the activities that are contributing to your positive mood.",
        "Take a short break when your workload starts to feel demanding.",
        "Continue checking in with your mood through journaling."
    ]
}
`
                },

                {
                    role: "user",
                    content: JSON.stringify(inputData)
                }
            ],

            response_format: {
                type: "json_object"
            },

            temperature: 0.2,
            max_completion_tokens: 800
        });

        const content =
            response.choices[0].message.content;

        console.log("Groq Overall Analysis Response:");
        console.log(content);

        const analysis = JSON.parse(content);

        if (
            !analysis.overallEmotions ||
            !Array.isArray(analysis.overallEmotions) ||
            analysis.overallEmotions.length === 0
        ) {
            throw new Error(
                "Invalid overall emotion analysis returned by Groq"
            );
        }

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

        analysis.overallEmotions =
            analysis.overallEmotions
                .filter((item) => {
                    return (
                        allowedEmotions.includes(item.emotion) &&
                        Number.isFinite(
                            Number(item.percentage)
                        )
                    );
                })
                .map((item) => ({
                    emotion: item.emotion,
                    percentage: Math.max(
                        0,
                        Math.min(
                            100,
                            Math.round(
                                Number(item.percentage)
                            )
                        )
                    )
                }));

        if (
            analysis.overallEmotions.length === 0
        ) {
            throw new Error(
                "No valid overall emotions returned by Groq"
            );
        }

        // Combine duplicate emotions
        const emotionMap = new Map();

        for (const item of analysis.overallEmotions) {
            const current =
                emotionMap.get(item.emotion) || 0;

            emotionMap.set(
                item.emotion,
                current + item.percentage
            );
        }

        analysis.overallEmotions =
            Array.from(emotionMap.entries()).map(
                ([emotion, percentage]) => ({
                    emotion,
                    percentage
                })
            );

        // Normalize percentages to exactly 100
        const total =
            analysis.overallEmotions.reduce(
                (sum, item) =>
                    sum + item.percentage,
                0
            );

        if (total <= 0) {
            analysis.overallEmotions = [
                {
                    emotion: "Neutral",
                    percentage: 100
                }
            ];
        } else if (total !== 100) {
            analysis.overallEmotions =
                analysis.overallEmotions.map(
                    (item) => ({
                        ...item,
                        percentage:
                            Math.round(
                                (item.percentage /
                                    total) *
                                    100
                            )
                    })
                );

            const normalizedTotal =
                analysis.overallEmotions.reduce(
                    (sum, item) =>
                        sum + item.percentage,
                    0
                );

            const difference =
                100 - normalizedTotal;

            const highestIndex =
                analysis.overallEmotions.reduce(
                    (
                        highestIndex,
                        item,
                        index,
                        array
                    ) =>
                        item.percentage >
                        array[highestIndex]
                            .percentage
                            ? index
                            : highestIndex,
                    0
                );

            analysis.overallEmotions[
                highestIndex
            ].percentage += difference;
        }

        // Sort highest percentage first
        analysis.overallEmotions.sort(
            (a, b) =>
                b.percentage - a.percentage
        );

        // Make dominant emotion consistent
        analysis.dominantEmotion =
            analysis.overallEmotions[0].emotion;

        // Validate stress level
        if (
            !["Low", "Moderate", "High"].includes(
                analysis.stressLevel
            )
        ) {
            analysis.stressLevel = "Moderate";
        }

        // Validate energy level
        if (
            !["Low", "Moderate", "High"].includes(
                analysis.energyLevel
            )
        ) {
            analysis.energyLevel = "Moderate";
        }

        // Validate summary
        if (
            typeof analysis.summary !== "string" ||
            analysis.summary.trim() === ""
        ) {
            analysis.summary =
                "Your available emotional signals show a mixed emotional picture.";
        }

        // Validate suggestions
        if (
            !Array.isArray(analysis.suggestions) ||
            analysis.suggestions.length === 0
        ) {
            analysis.suggestions = [
                "Check in with how you are feeling right now.",
                "Use your journal to track how your mood changes."
            ];
        }

        // Keep only 3 suggestions
        analysis.suggestions =
            analysis.suggestions
                .filter(
                    (suggestion) =>
                        typeof suggestion === "string" &&
                        suggestion.trim() !== ""
                )
                .slice(0, 3);

        res.json({
            success: true,
            analysis: analysis
        });

    } catch (error) {
        console.error(
            "Overall AI Analysis Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    analyzeOverallMood
};