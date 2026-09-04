CREATE DATABASE mindease;

-- Connect to the mindease database before running the rest of the schema.


CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE journals (
    journal_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    journal_text TEXT NOT NULL,
    overall_mood VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_journal_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


CREATE TABLE journal_emotions (
    journal_emotion_id SERIAL PRIMARY KEY,
    journal_id INTEGER NOT NULL,
    emotion VARCHAR(50) NOT NULL,
    percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),

    CONSTRAINT fk_journal_emotion
        FOREIGN KEY (journal_id)
        REFERENCES journals(journal_id)
        ON DELETE CASCADE
);


CREATE TABLE selfies (
    selfie_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    image_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_selfie_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


CREATE TABLE daily_tasks (
    task_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task TEXT NOT NULL,
    deadline TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    CONSTRAINT fk_task_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


CREATE INDEX idx_journals_user_date
ON journals(user_id, created_at);


CREATE INDEX idx_selfies_user_date
ON selfies(user_id, created_at);


CREATE INDEX idx_tasks_user_date
ON daily_tasks(user_id, created_at);