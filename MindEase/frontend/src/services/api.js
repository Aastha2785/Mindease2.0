const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

export const analyzeJournal = async (journal, user_id) => {
    const response = await fetch(`${API_URL}/journal/analyze`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            journal: journal,
            user_id: user_id
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Failed to analyze journal"
        );
    }

    return data;
};

export const analyzeFace = async (image) => {
    const response = await fetch(`${API_URL}/face/analyze`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            image: image
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Failed to analyze facial expression"
        );
    }

    return data;
};