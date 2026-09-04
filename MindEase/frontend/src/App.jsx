import { Routes, Route } from "react-router-dom";

import { useTheme } from "./context/ThemeContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Journaling from "./pages/Journaling";
import FaceScan from "./pages/FaceScan";
import AIAnalysis from "./pages/AIAnalysis";
import DailyTasks from "./pages/DailyTasks";
import WeeklyAnalysis from "./pages/WeeklyAnalysis";
import History from "./pages/History";
import Profile from "./pages/Profile";

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={
                theme === "dark"
                    ? "Switch to lavender theme"
                    : "Switch to dark theme"
            }
        >
            <span>
                {theme === "dark" ? "🪻" : "🌙"}
            </span>
        </button>
    );
}

function App() {
    return (
        <>
            <ThemeToggle />

            <Routes>
                <Route
                    path="/"
                    element={<Dashboard />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/journaling"
                    element={<Journaling />}
                />

                <Route
                    path="/face-scan"
                    element={<FaceScan />}
                />

                <Route
                    path="/ai-analysis"
                    element={<AIAnalysis />}
                />

                <Route
                    path="/daily-tasks"
                    element={<DailyTasks />}
                />

                <Route
                    path="/weekly-analysis"
                    element={<WeeklyAnalysis />}
                />

                <Route
                    path="/history"
                    element={<History />}
                />

                <Route
                    path="/profile"
                    element={<Profile />}
                />
            </Routes>
        </>
    );
}

export default App;