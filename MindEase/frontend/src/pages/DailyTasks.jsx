import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

function DailyTasks() {
    const { theme } = useTheme();
    const isLight = theme === "light";

    const [tasks, setTasks] = useState([]);
    const [taskText, setTaskText] = useState("");
    const [deadline, setDeadline] = useState("");
    const [loaded, setLoaded] = useState(false);

    const getCurrentUser = () => {
        const localUser = localStorage.getItem("mindEaseUser");
        const sessionUser = sessionStorage.getItem("mindEaseUser");

        const savedUser = localUser || sessionUser;

        if (!savedUser) {
            return null;
        }

        try {
            return JSON.parse(savedUser);
        } catch {
            return null;
        }
    };

    const user = getCurrentUser();

    const userId = user?.user_id;

    const storageKey = userId
        ? `mindEaseTasks_${userId}`
        : null;

    /* ================= LOAD TASKS ================= */

    useEffect(() => {
        if (!storageKey) {
            setTasks([]);
            setLoaded(true);
            return;
        }

        const savedTasks =
            localStorage.getItem(storageKey);

        if (savedTasks) {
            try {
                const parsedTasks = JSON.parse(savedTasks);

                if (Array.isArray(parsedTasks)) {
                    setTasks(parsedTasks);
                } else {
                    setTasks([]);
                }
            } catch {
                setTasks([]);
            }
        } else {
            setTasks([]);
        }

        setLoaded(true);
    }, [storageKey]);

    /* ================= SAVE TASKS ================= */

    useEffect(() => {
        if (!loaded || !storageKey) {
            return;
        }

        localStorage.setItem(
            storageKey,
            JSON.stringify(tasks)
        );

        window.dispatchEvent(
            new Event("mindEaseTasksUpdated")
        );
    }, [tasks, loaded, storageKey]);

    /* ================= ADD TASK ================= */

    const addTask = () => {
        if (!taskText.trim() || !deadline) {
            return;
        }

        const newTask = {
            id: Date.now(),
            task: taskText.trim(),
            deadline: deadline,
            completed: false,
            createdAt: new Date().toISOString()
        };

        setTasks((prevTasks) => [
            ...prevTasks,
            newTask
        ]);

        setTaskText("");
        setDeadline("");
    };

    /* ================= TOGGLE TASK ================= */

    const toggleTask = (id) => {
        setTasks((prevTasks) =>
            prevTasks.map((task) =>
                task.id === id
                    ? {
                          ...task,
                          completed: !task.completed
                      }
                    : task
            )
        );
    };

    /* ================= DELETE TASK ================= */

    const deleteTask = (id) => {
        setTasks((prevTasks) =>
            prevTasks.filter(
                (task) => task.id !== id
            )
        );
    };

    /* ================= STATISTICS ================= */

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
        (task) => task.completed
    ).length;

    const pendingTasks =
        totalTasks - completedTasks;

    const completionPercentage =
        totalTasks === 0
            ? 0
            : Math.round(
                  (completedTasks / totalTasks) * 100
              );

    /* ================= THEME ================= */

    const pageClass = isLight
        ? "min-h-screen bg-[#f5efff] text-[#2d1747]"
        : "min-h-screen bg-black text-white";

    const headerText = isLight
        ? "text-[#32174d]"
        : "text-white";

    const secondaryText = isLight
        ? "text-[#80639b]"
        : "text-emerald-100/60";

    const mutedText = isLight
        ? "text-[#987eae]"
        : "text-emerald-100/40";

    const accentText = isLight
        ? "text-[#9148d1]"
        : "text-emerald-300";

    const cardClass = isLight
        ? "bg-[#e9ddf7] border border-[#d4bceb] shadow-[0_12px_30px_rgba(111,60,150,0.10)]"
        : "bg-emerald-950/90 border border-emerald-700/60 shadow-xl";

    const iconBoxClass = isLight
        ? "bg-[#dcc8f0] border border-[#c49ee5]"
        : "bg-emerald-800 border border-emerald-600/50";

    const inputClass = isLight
        ? "bg-[#f8f3ff] border-[#ceb4e8] text-[#32174d] placeholder-[#a88ebc] focus:border-[#a855f7] focus:ring-[#a855f7]/10"
        : "bg-emerald-900/80 border-emerald-700/60 text-white placeholder-emerald-100/30 focus:border-emerald-400 focus:ring-emerald-400/10";

    const buttonClass = isLight
        ? "bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-lg shadow-purple-300/30"
        : "bg-emerald-400 hover:bg-emerald-300 text-emerald-950 shadow-lg";

    const progressBackground = isLight
        ? "bg-[#d4c1e8] border-[#c3a9df]"
        : "bg-emerald-900 border-emerald-800";

    /* ================= UI ================= */

    return (
        <div className={pageClass}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                {/* HEADER */}

                <div className="mb-10">
                    <p
                        className={`text-sm font-semibold uppercase tracking-[0.25em] mb-3 ${
                            isLight
                                ? "text-[#9b4de0]"
                                : "text-emerald-300"
                        }`}
                    >
                        MindEase
                    </p>

                    <h1
                        className={`text-4xl md:text-5xl font-bold mb-3 ${headerText}`}
                    >
                        Daily Tasks
                    </h1>

                    <p
                        className={`max-w-2xl ${secondaryText}`}
                    >
                        Plan your day, track your progress,
                        and build productive habits.
                    </p>
                </div>

                {/* STATISTICS */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

                    <div
                        className={`${cardClass} rounded-3xl p-6`}
                    >
                        <div className="flex items-center justify-between">
                            <p
                                className={`text-sm ${secondaryText}`}
                            >
                                Total Tasks
                            </p>

                            <span className="text-2xl">
                                📋
                            </span>
                        </div>

                        <p
                            className={`text-4xl font-bold mt-3 ${accentText}`}
                        >
                            {totalTasks}
                        </p>
                    </div>

                    <div
                        className={`${cardClass} rounded-3xl p-6`}
                    >
                        <div className="flex items-center justify-between">
                            <p
                                className={`text-sm ${secondaryText}`}
                            >
                                Completed
                            </p>

                            <span className="text-2xl">
                                ✅
                            </span>
                        </div>

                        <p
                            className={`text-4xl font-bold mt-3 ${accentText}`}
                        >
                            {completedTasks}
                        </p>
                    </div>

                    <div
                        className={`${cardClass} rounded-3xl p-6`}
                    >
                        <div className="flex items-center justify-between">
                            <p
                                className={`text-sm ${secondaryText}`}
                            >
                                Completion Rate
                            </p>

                            <span className="text-2xl">
                                📈
                            </span>
                        </div>

                        <p
                            className={`text-4xl font-bold mt-3 ${accentText}`}
                        >
                            {completionPercentage}%
                        </p>
                    </div>
                </div>

                {/* ADD TASK */}

                <div
                    className={`${cardClass} rounded-3xl p-6 mb-8`}
                >
                    <div className="flex items-center gap-3 mb-5">

                        <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${iconBoxClass}`}
                        >
                            ➕
                        </div>

                        <div>
                            <h2
                                className={`text-xl font-bold ${headerText}`}
                            >
                                Add a Task
                            </h2>

                            <p
                                className={`text-sm ${mutedText}`}
                            >
                                What would you like to accomplish today?
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3">

                        <input
                            type="text"
                            placeholder="What do you want to accomplish?"
                            value={taskText}
                            onChange={(e) =>
                                setTaskText(e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    addTask();
                                }
                            }}
                            className={`w-full rounded-xl px-4 py-3 outline-none border focus:ring-2 ${inputClass}`}
                        />

                        <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) =>
                                setDeadline(e.target.value)
                            }
                            className={`w-full rounded-xl px-4 py-3 outline-none border focus:ring-2 ${inputClass}`}
                        />

                        <button
                            onClick={addTask}
                            className={`px-6 py-3 font-bold rounded-xl transition ${buttonClass}`}
                        >
                            Add Task
                        </button>
                    </div>
                </div>

                {/* PROGRESS */}

                {totalTasks > 0 && (
                    <div
                        className={`${cardClass} rounded-3xl p-6 mb-8`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p
                                    className={`font-semibold ${headerText}`}
                                >
                                    Today's Progress
                                </p>

                                <p
                                    className={`text-sm mt-1 ${mutedText}`}
                                >
                                    Keep going — you're making progress.
                                </p>
                            </div>

                            <span
                                className={`font-bold text-lg ${accentText}`}
                            >
                                {completedTasks}/{totalTasks}
                            </span>
                        </div>

                        <div
                            className={`w-full h-4 rounded-full overflow-hidden border ${progressBackground}`}
                        >
                            <div
                                className={
                                    isLight
                                        ? "h-full bg-gradient-to-r from-[#c084fc] to-[#9333ea] rounded-full transition-all duration-500"
                                        : "h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500"
                                }
                                style={{
                                    width: `${completionPercentage}%`
                                }}
                            />
                        </div>

                        <p
                            className={`text-right text-sm mt-2 ${accentText}`}
                        >
                            {completionPercentage}% complete
                        </p>
                    </div>
                )}

                {/* TASK LIST */}

                <div>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2
                                className={`text-2xl font-bold ${headerText}`}
                            >
                                Today's Tasks
                            </h2>

                            <p
                                className={`text-sm mt-1 ${mutedText}`}
                            >
                                Stay consistent, one task at a time.
                            </p>
                        </div>

                        {pendingTasks > 0 && (
                            <span
                                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                    isLight
                                        ? "bg-[#e5d5f4] border border-[#cdb1e9] text-[#9148d1]"
                                        : "bg-emerald-950/90 border border-emerald-700/60 text-emerald-300"
                                }`}
                            >
                                {pendingTasks} pending
                            </span>
                        )}
                    </div>

                    {tasks.length === 0 ? (
                        <div
                            className={`${cardClass} rounded-3xl p-12 text-center`}
                        >
                            <div className="text-6xl mb-5">
                                🌱
                            </div>

                            <h3
                                className={`text-xl font-semibold mb-2 ${headerText}`}
                            >
                                No tasks yet
                            </h3>

                            <p className={mutedText}>
                                Add your first task and start
                                building your productive day.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tasks.map((task) => {
                                const deadlineDate =
                                    new Date(task.deadline);

                                return (
                                    <div
                                        key={task.id}
                                        className={`rounded-2xl p-5 flex items-center gap-4 transition border ${
                                            isLight
                                                ? task.completed
                                                    ? "bg-[#e3d7ed] border-[#d0bfdf] opacity-60"
                                                    : "bg-[#e9ddf7] border-[#d4bceb] hover:bg-[#e4d5f3]"
                                                : task.completed
                                                ? "bg-emerald-950/90 border-emerald-800 opacity-60"
                                                : "bg-emerald-950/90 border-emerald-700/60 hover:bg-emerald-950"
                                        }`}
                                    >
                                        {/* CHECKBOX */}

                                        <button
                                            onClick={() =>
                                                toggleTask(task.id)
                                            }
                                            className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 transition ${
                                                task.completed
                                                    ? isLight
                                                        ? "bg-[#a855f7] border-[#a855f7] text-white"
                                                        : "bg-emerald-400 border-emerald-400 text-emerald-950"
                                                    : isLight
                                                    ? "border-[#b88bdd] hover:border-[#9333ea] hover:bg-[#ddc9ef]"
                                                    : "border-emerald-600 hover:border-emerald-400 hover:bg-emerald-800"
                                            }`}
                                        >
                                            {task.completed &&
                                                "✓"}
                                        </button>

                                        {/* TASK */}

                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`font-medium ${
                                                    task.completed
                                                        ? isLight
                                                            ? "line-through text-[#927ca3]"
                                                            : "line-through text-emerald-100/40"
                                                        : isLight
                                                        ? "text-[#32174d]"
                                                        : "text-emerald-50"
                                                }`}
                                            >
                                                {task.task}
                                            </p>

                                            <p
                                                className={`text-sm mt-1 ${mutedText}`}
                                            >
                                                Deadline:{" "}
                                                {deadlineDate.toLocaleString()}
                                            </p>
                                        </div>

                                        {/* STATUS */}

                                        <span
                                            className={`hidden sm:block text-xs px-3 py-1.5 rounded-full ${
                                                task.completed
                                                    ? isLight
                                                        ? "bg-[#d8c5e9] text-[#8d45c3] border border-[#c4a8dc]"
                                                        : "bg-emerald-800 text-emerald-300 border border-emerald-700"
                                                    : isLight
                                                    ? "bg-[#e1d0f0] text-[#9148d1] border border-[#cdb1e9]"
                                                    : "bg-emerald-900 text-emerald-300 border border-emerald-700/60"
                                            }`}
                                        >
                                            {task.completed
                                                ? "Completed"
                                                : "Pending"}
                                        </span>

                                        {/* DELETE */}

                                        <button
                                            onClick={() =>
                                                deleteTask(task.id)
                                            }
                                            className={
                                                isLight
                                                    ? "text-[#a58cad] hover:text-red-500 transition text-lg"
                                                    : "text-emerald-100/30 hover:text-red-300 transition text-lg"
                                            }
                                            title="Delete task"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* FOOTER */}

                <div
                    className={`mt-8 p-5 rounded-2xl border ${
                        isLight
                            ? "bg-[#e9ddf7] border-[#d4bceb]"
                            : "bg-emerald-950/80 border-emerald-800/60"
                    }`}
                >
                    <p
                        className={`text-xs leading-relaxed ${mutedText}`}
                    >
                        Your task progress is currently stored
                        separately for your MindEase account in
                        this browser. Your task history is not
                        deleted when a new day starts.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default DailyTasks;