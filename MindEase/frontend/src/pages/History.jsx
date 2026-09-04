import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

function getCurrentUser() {
    const localUser = localStorage.getItem("mindEaseUser");
    const sessionUser = sessionStorage.getItem("mindEaseUser");

    const storedUser = localUser || sessionUser;

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch {
        return null;
    }
}

function History() {
    const { theme: currentTheme } = useTheme();

    const isLight = currentTheme === "light";

    const [journals, setJournals] = useState([]);
    const [selfies, setSelfies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = getCurrentUser();
    const userId = user?.user_id;

    const selfieStorageKey = userId
        ? `mindEaseSelfieHistory_${userId}`
        : null;

    useEffect(() => {
        const fetchJournalHistory = async () => {
            try {
                setLoading(true);
                setError("");

                const storedUser =
                    localStorage.getItem("mindEaseUser") ||
                    sessionStorage.getItem("mindEaseUser");

                if (!storedUser) {
                    setError(
                        "Please login to view your history."
                    );
                    setLoading(false);
                    return;
                }

                const user = JSON.parse(storedUser);

                if (!user.user_id) {
                    setError(
                        "User information is missing."
                    );
                    setLoading(false);
                    return;
                }

                const response = await fetch(
                    `http://localhost:5000/api/journal/history?user_id=${user.user_id}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                            "Failed to fetch journal history."
                    );
                }

                setJournals(
                    data.journals || []
                );
            } catch (error) {
                console.error(
                    "History Error:",
                    error
                );

                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchJournalHistory();

        loadSelfies();

        const handleSelfieUpdate = () => {
            loadSelfies();
        };

        window.addEventListener(
            "mindEaseSelfieHistoryUpdated",
            handleSelfieUpdate
        );

        window.addEventListener(
            "storage",
            handleSelfieUpdate
        );

        return () => {
            window.removeEventListener(
                "mindEaseSelfieHistoryUpdated",
                handleSelfieUpdate
            );

            window.removeEventListener(
                "storage",
                handleSelfieUpdate
            );
        };
    }, [userId]);

    const loadSelfies = () => {
        if (!selfieStorageKey) {
            setSelfies([]);
            return;
        }

        try {
            const storedSelfies =
                JSON.parse(
                    localStorage.getItem(
                        selfieStorageKey
                    ) || "[]"
                );

            if (Array.isArray(storedSelfies)) {
                setSelfies(storedSelfies);
            } else {
                setSelfies([]);
            }
        } catch (error) {
            console.error(
                "Selfie History Error:",
                error
            );

            setSelfies([]);
        }
    };

    const deleteSelfie = (selfieId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this selfie?"
        );

        if (!confirmed) {
            return;
        }

        if (!selfieStorageKey) {
            return;
        }

        try {
            const updatedSelfies =
                selfies.filter(
                    (selfie) =>
                        selfie.id !== selfieId
                );

            localStorage.setItem(
                selfieStorageKey,
                JSON.stringify(updatedSelfies)
            );

            setSelfies(updatedSelfies);

            window.dispatchEvent(
                new Event(
                    "mindEaseSelfieHistoryUpdated"
                )
            );
        } catch (error) {
            console.error(
                "Delete Selfie Error:",
                error
            );
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);

        return {
            date: date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            ),

            time: date.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
        };
    };

    const getMoodEmoji = (mood) => {
        const moodLower =
            mood?.toLowerCase() || "";

        if (
            moodLower.includes("happiness") ||
            moodLower.includes("happy") ||
            moodLower.includes("joy")
        ) {
            return "😊";
        }

        if (
            moodLower.includes("calm") ||
            moodLower.includes("peace")
        ) {
            return "😌";
        }

        if (
            moodLower.includes("stress") ||
            moodLower.includes("anxiety")
        ) {
            return "😟";
        }

        if (
            moodLower.includes("sad") ||
            moodLower.includes("lonely")
        ) {
            return "😔";
        }

        if (
            moodLower.includes("anger")
        ) {
            return "😠";
        }

        if (
            moodLower.includes("excited") ||
            moodLower.includes("excitement")
        ) {
            return "🤩";
        }

        if (
            moodLower.includes("fatigue") ||
            moodLower.includes("tired")
        ) {
            return "😴";
        }

        return "😐";
    };

    const theme = isLight
        ? {
              background:
                  "linear-gradient(135deg, #f7f1ff 0%, #eee3ff 45%, #f9f5ff 100%)",

              heading: "#32184f",
              text: "#4d3268",
              muted: "#8765a3",

              card: "#eadcf7",
              cardHover: "#e6d5f5",
              cardBorder: "#d6bdf0",

              iconBackground: "#d8baf2",
              iconBorder: "#c69be9",

              accent: "#a855f7",
              accentDark: "#7e22ce",

              accentSoft:
                  "rgba(168, 85, 247, 0.12)",

              accentBorder:
                  "rgba(168, 85, 247, 0.28)",

              divider:
                  "rgba(126, 34, 206, 0.13)",

              shadow:
                  "0 12px 35px rgba(126, 34, 206, 0.10)"
          }
        : {
              background:
                  "linear-gradient(135deg, #02130d 0%, #05271b 50%, #031a12 100%)",

              heading: "#f2fff8",
              text: "#d1eee0",
              muted: "#79a993",

              card: "#06251a",
              cardHover: "#073021",

              cardBorder:
                  "rgba(52, 211, 153, 0.25)",

              iconBackground:
                  "rgba(16, 185, 129, 0.14)",

              iconBorder:
                  "rgba(52, 211, 153, 0.28)",

              accent: "#34d399",
              accentDark: "#10b981",

              accentSoft:
                  "rgba(52, 211, 153, 0.11)",

              accentBorder:
                  "rgba(52, 211, 153, 0.25)",

              divider:
                  "rgba(52, 211, 153, 0.13)",

              shadow:
                  "0 15px 40px rgba(0, 0, 0, 0.28)"
          };

    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100%",
                background: theme.background,
                color: theme.heading,
                padding: "32px 20px 60px",
                transition:
                    "background 0.4s ease, color 0.3s ease"
            }}
        >
            <div className="max-w-5xl mx-auto">

                {/* HEADER */}

                <div className="mb-10">
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 14px",
                            borderRadius: "999px",
                            background:
                                theme.accentSoft,
                            border: `1px solid ${theme.accentBorder}`,
                            color:
                                theme.accentDark,
                            fontSize: "13px",
                            fontWeight: "600",
                            marginBottom: "16px"
                        }}
                    >
                        <span>📚</span>
                        Your personal timeline
                    </div>

                    <h1
                        className="text-3xl sm:text-4xl font-bold tracking-tight"
                        style={{
                            color: theme.heading
                        }}
                    >
                        History
                    </h1>

                    <p
                        className="mt-2 text-sm sm:text-base"
                        style={{
                            color: theme.muted
                        }}
                    >
                        Look back on your journal entries
                        and saved selfies.
                    </p>
                </div>

                {/* JOURNAL HISTORY */}

                <section className="mb-14">

                    <div className="flex items-center justify-between mb-6">

                        <div className="flex items-center gap-3">

                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "15px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "22px",
                                    background:
                                        theme.iconBackground,
                                    border: `1px solid ${theme.iconBorder}`
                                }}
                            >
                                📝
                            </div>

                            <div>
                                <h2
                                    className="text-lg sm:text-xl font-semibold"
                                    style={{
                                        color: theme.heading
                                    }}
                                >
                                    Journal History
                                </h2>

                                <p
                                    className="text-xs sm:text-sm mt-1"
                                    style={{
                                        color: theme.muted
                                    }}
                                >
                                    Your previous reflections
                                </p>
                            </div>
                        </div>

                        {!loading &&
                            journals.length > 0 && (
                                <div
                                    className="hidden sm:block"
                                    style={{
                                        padding: "8px 13px",
                                        borderRadius: "10px",
                                        background:
                                            theme.accentSoft,
                                        border: `1px solid ${theme.accentBorder}`,
                                        color:
                                            theme.accentDark,
                                        fontSize: "13px",
                                        fontWeight: "600"
                                    }}
                                >
                                    {journals.length}{" "}
                                    {journals.length === 1
                                        ? "entry"
                                        : "entries"}
                                </div>
                            )}
                    </div>

                    {loading && (
                        <div
                            style={{
                                background:
                                    theme.card,
                                border: `1px solid ${theme.cardBorder}`,
                                borderRadius: "20px",
                                padding: "55px 24px",
                                textAlign: "center",
                                boxShadow: theme.shadow
                            }}
                        >
                            <div className="text-4xl mb-4 animate-pulse">
                                📖
                            </div>

                            <p
                                style={{
                                    color: theme.muted
                                }}
                            >
                                Loading your journal history...
                            </p>
                        </div>
                    )}

                    {!loading && error && (
                        <div
                            style={{
                                background:
                                    theme.card,
                                border:
                                    "1px solid rgba(239, 68, 68, 0.35)",
                                borderRadius: "20px",
                                padding: "24px",
                                boxShadow: theme.shadow
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl">
                                    ⚠️
                                </span>

                                <div>
                                    <h3
                                        className="font-semibold"
                                        style={{
                                            color: theme.heading
                                        }}
                                    >
                                        Unable to load history
                                    </h3>

                                    <p
                                        className="text-sm mt-1"
                                        style={{
                                            color: "#ef6b6b"
                                        }}
                                    >
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        journals.length === 0 && (
                            <div
                                style={{
                                    background:
                                        theme.card,
                                    border: `1px solid ${theme.cardBorder}`,
                                    borderRadius: "20px",
                                    padding: "60px 24px",
                                    textAlign: "center",
                                    boxShadow: theme.shadow
                                }}
                            >
                                <div className="text-5xl mb-5">
                                    📖
                                </div>

                                <h3
                                    className="text-lg font-semibold"
                                    style={{
                                        color: theme.heading
                                    }}
                                >
                                    Your journal is waiting
                                </h3>

                                <p
                                    className="text-sm mt-2 max-w-md mx-auto"
                                    style={{
                                        color: theme.muted
                                    }}
                                >
                                    Start writing your thoughts
                                    and reflections. Your entries
                                    will appear here automatically.
                                </p>
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        journals.length > 0 && (
                            <div className="space-y-5">

                                {journals.map(
                                    (journal) => {
                                        const formatted =
                                            formatDate(
                                                journal.created_at
                                            );

                                        return (
                                            <article
                                                key={
                                                    journal.journal_id
                                                }
                                                style={{
                                                    background:
                                                        theme.card,
                                                    border: `1px solid ${theme.cardBorder}`,
                                                    borderRadius:
                                                        "20px",
                                                    padding:
                                                        "24px",
                                                    boxShadow:
                                                        theme.shadow,
                                                    transition:
                                                        "all 0.25s ease"
                                                }}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                                                    <div className="flex items-center gap-3">

                                                        <div
                                                            style={{
                                                                width: "40px",
                                                                height: "40px",
                                                                borderRadius:
                                                                    "12px",
                                                                display:
                                                                    "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                background:
                                                                    theme.iconBackground,
                                                                border: `1px solid ${theme.iconBorder}`,
                                                                fontSize:
                                                                    "17px"
                                                            }}
                                                        >
                                                            🕒
                                                        </div>

                                                        <div>
                                                            <p
                                                                className="text-sm font-semibold"
                                                                style={{
                                                                    color:
                                                                        theme.heading
                                                                }}
                                                            >
                                                                {
                                                                    formatted.date
                                                                }
                                                            </p>

                                                            <p
                                                                className="text-xs mt-1"
                                                                style={{
                                                                    color:
                                                                        theme.muted
                                                                }}
                                                            >
                                                                {
                                                                    formatted.time
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {journal.overall_mood && (
                                                        <div
                                                            className="inline-flex items-center gap-2 self-start sm:self-auto"
                                                            style={{
                                                                padding:
                                                                    "9px 15px",
                                                                borderRadius:
                                                                    "999px",
                                                                background:
                                                                    theme.accentSoft,
                                                                border: `1px solid ${theme.accentBorder}`,
                                                                color:
                                                                    theme.accentDark,
                                                                fontSize:
                                                                    "13px",
                                                                fontWeight:
                                                                    "600"
                                                            }}
                                                        >
                                                            <span>
                                                                {getMoodEmoji(
                                                                    journal.overall_mood
                                                                )}
                                                            </span>

                                                            <span>
                                                                {
                                                                    journal.overall_mood
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div
                                                    style={{
                                                        height: "1px",
                                                        background:
                                                            theme.divider,
                                                        margin:
                                                            "21px 0"
                                                    }}
                                                />

                                                <p
                                                    className="text-sm sm:text-base leading-7 whitespace-pre-wrap"
                                                    style={{
                                                        color:
                                                            theme.text
                                                    }}
                                                >
                                                    {
                                                        journal.journal_text
                                                    }
                                                </p>

                                                <div
                                                    className="flex items-center gap-2 text-xs mt-7"
                                                    style={{
                                                        color:
                                                            theme.muted
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color:
                                                                theme.accent
                                                        }}
                                                    >
                                                        ✦
                                                    </span>

                                                    <span>
                                                        Personal reflection
                                                    </span>
                                                </div>
                                            </article>
                                        );
                                    }
                                )}
                            </div>
                        )}
                </section>

                {/* SELFIE HISTORY */}

                <section>

                    <div className="flex items-center justify-between mb-6">

                        <div className="flex items-center gap-3">

                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "15px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "22px",
                                    background:
                                        theme.iconBackground,
                                    border: `1px solid ${theme.iconBorder}`
                                }}
                            >
                                📸
                            </div>

                            <div>
                                <h2
                                    className="text-lg sm:text-xl font-semibold"
                                    style={{
                                        color: theme.heading
                                    }}
                                >
                                    Selfie History
                                </h2>

                                <p
                                    className="text-xs sm:text-sm mt-1"
                                    style={{
                                        color: theme.muted
                                    }}
                                >
                                    Your saved selfies
                                </p>
                            </div>
                        </div>

                        {selfies.length > 0 && (
                            <div
                                className="hidden sm:block"
                                style={{
                                    padding: "8px 13px",
                                    borderRadius: "10px",
                                    background:
                                        theme.accentSoft,
                                    border: `1px solid ${theme.accentBorder}`,
                                    color:
                                        theme.accentDark,
                                    fontSize: "13px",
                                    fontWeight: "600"
                                }}
                            >
                                {selfies.length}{" "}
                                {selfies.length === 1
                                    ? "selfie"
                                    : "selfies"}
                            </div>
                        )}
                    </div>

                    {selfies.length === 0 ? (
                        <div
                            style={{
                                background:
                                    theme.card,
                                border: `1px solid ${theme.cardBorder}`,
                                borderRadius: "20px",
                                padding: "60px 24px",
                                textAlign: "center",
                                boxShadow: theme.shadow
                            }}
                        >
                            <div className="text-5xl mb-5">
                                📷
                            </div>

                            <h3
                                className="text-lg font-semibold"
                                style={{
                                    color: theme.heading
                                }}
                            >
                                No saved selfies
                            </h3>

                            <p
                                className="text-sm mt-2 max-w-md mx-auto"
                                style={{
                                    color: theme.muted
                                }}
                            >
                                Selfies will appear here only
                                when you choose to save them
                                from Face Scan.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                            {selfies.map(
                                (selfie) => {
                                    const formatted =
                                        formatDate(
                                            selfie.timestamp
                                        );

                                    return (
                                        <article
                                            key={
                                                selfie.id
                                            }
                                            style={{
                                                background:
                                                    theme.card,
                                                border: `1px solid ${theme.cardBorder}`,
                                                borderRadius:
                                                    "20px",
                                                padding:
                                                    "14px",
                                                boxShadow:
                                                    theme.shadow,
                                                overflow:
                                                    "hidden",
                                                transition:
                                                    "all 0.25s ease"
                                            }}
                                        >
                                            <img
                                                src={
                                                    selfie.image
                                                }
                                                alt="Saved selfie"
                                                className="w-full aspect-square object-cover rounded-xl"
                                            />

                                            <div className="flex items-center gap-3 mt-4">

                                                <div
                                                    style={{
                                                        width: "38px",
                                                        height: "38px",
                                                        borderRadius:
                                                            "11px",
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        justifyContent:
                                                            "center",
                                                        background:
                                                            theme.iconBackground,
                                                        border: `1px solid ${theme.iconBorder}`
                                                    }}
                                                >
                                                    🕒
                                                </div>

                                                <div>
                                                    <p
                                                        className="text-sm font-semibold"
                                                        style={{
                                                            color:
                                                                theme.heading
                                                        }}
                                                    >
                                                        {
                                                            formatted.date
                                                        }
                                                    </p>

                                                    <p
                                                        className="text-xs mt-1"
                                                        style={{
                                                            color:
                                                                theme.muted
                                                        }}
                                                    >
                                                        {
                                                            formatted.time
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    deleteSelfie(
                                                        selfie.id
                                                    )
                                                }
                                                className="w-full mt-4 py-2.5 rounded-xl font-semibold text-sm transition"
                                                style={{
                                                    background:
                                                        "rgba(239, 68, 68, 0.10)",
                                                    border:
                                                        "1px solid rgba(239, 68, 68, 0.30)",
                                                    color:
                                                        "#dc2626"
                                                }}
                                                onMouseEnter={(
                                                    e
                                                ) => {
                                                    e.currentTarget.style.background =
                                                        "rgba(239, 68, 68, 0.18)";
                                                }}
                                                onMouseLeave={(
                                                    e
                                                ) => {
                                                    e.currentTarget.style.background =
                                                        "rgba(239, 68, 68, 0.10)";
                                                }}
                                            >
                                                🗑️ Delete Selfie
                                            </button>
                                        </article>
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default History;