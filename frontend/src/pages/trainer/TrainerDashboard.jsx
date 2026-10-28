
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "../../styles/TrainerDashboard.css";

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatTime(value) {
    if (!value) return "—";

    return new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function formatDate(value) {
    if (!value) return "—";

    const [year, month, day] = value.split("-");
    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatDuration(seconds) {
    if (seconds == null || !Number.isFinite(Number(seconds))) {
        return "—";
    }

    const totalMinutes = Math.floor(Number(seconds) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
}

function getErrorMessage(error, fallback) {
    return (
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        fallback
    );
}

function getList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function TrainerDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [attendanceActionLoading, setAttendanceActionLoading] =
        useState(false);
    const [error, setError] = useState("");
    const [attendanceError, setAttendanceError] = useState("");
    const [attendanceMessage, setAttendanceMessage] = useState("");
    const [clock, setClock] = useState(Date.now());

    const today = getToday();

    const todayAttendance = attendance.find(
        (record) => record.date === today
    );

    const isCheckedIn =
        Boolean(todayAttendance?.check_in) &&
        !todayAttendance?.check_out;

    const isCheckedOut = Boolean(todayAttendance?.check_out);

    const loadAttendance = useCallback(async () => {
        try {
            setAttendanceLoading(true);
            setAttendanceError("");

            const response = await api.get("/trainer-attendance/");
            setAttendance(getList(response.data));
        } catch (err) {
            setAttendanceError(
                getErrorMessage(
                    err,
                    "Unable to load your attendance history."
                )
            );
        } finally {
            setAttendanceLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchTrainerData = async () => {
            try {
                setLoading(true);
                setError("");

                const results = await Promise.allSettled([
                    api.get("/workouts/plans/"),
                    api.get("/workouts/assignments/"),
                ]);

                if (results[0].status === "fulfilled") {
                    setWorkoutPlans(getList(results[0].value.data));
                }

                if (results[1].status === "fulfilled") {
                    setAssignments(getList(results[1].value.data));
                }

                if (
                    results.every(
                        (result) => result.status === "rejected"
                    )
                ) {
                    setError(
                        "Unable to load trainer data. Please check the API endpoints and permissions."
                    );
                }
            } catch {
                setError(
                    "Something went wrong while loading the dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTrainerData();
        loadAttendance();
    }, [loadAttendance]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setClock(Date.now());
        }, 60000);

        return () => window.clearInterval(timer);
    }, []);

    const handleAttendanceAction = async (action) => {
        try {
            setAttendanceActionLoading(true);
            setAttendanceError("");
            setAttendanceMessage("");

            const endpoint =
                action === "check-in"
                    ? "/trainer-attendance/check-in/"
                    : "/trainer-attendance/check-out/";

            await api.post(endpoint, {});

            setAttendanceMessage(
                action === "check-in"
                    ? "You have successfully checked in."
                    : "You have successfully checked out."
            );

            await loadAttendance();
        } catch (err) {
            setAttendanceError(
                getErrorMessage(
                    err,
                    "Unable to update attendance. Please try again."
                )
            );
        } finally {
            setAttendanceActionLoading(false);
        }
    };

    const getDuration = (record) => {
        if (!record.check_in) return "—";

        if (record.check_out && record.duration_seconds != null) {
            return formatDuration(record.duration_seconds);
        }

        if (!record.check_out) {
            const elapsedSeconds = Math.max(
                0,
                Math.floor(
                    (clock - new Date(record.check_in).getTime()) / 1000
                )
            );

            return formatDuration(elapsedSeconds);
        }

        return "—";
    };

    return (
        <div className="trainer-dashboard">
            <header className="trainer-header">
                <div>
                    <p className="trainer-eyebrow">SMARTGYM WORKSPACE</p>
                    <h1>Trainer Dashboard</h1>
                    <p className="trainer-subtitle">
                        Manage workout plans, member assignments, and your
                        daily attendance.
                    </p>
                </div>

                <div className="trainer-header-actions">
                    <div className="trainer-header-icon" aria-hidden="true">
                        🏋️
                    </div>
                    <button
                        type="button"
                        className="trainer-logout-btn"
                        onClick={handleLogout}
                    >
                        <span aria-hidden="true">↪</span>
                        Logout
                    </button>
                </div>
            </header>

            {error && <div className="trainer-error">{error}</div>}

            <section className="trainer-stats">
                <article className="trainer-stat-card">
                    <div className="trainer-stat-icon">📋</div>
                    <p>Workout Plans</p>
                    <h2>{loading ? "—" : workoutPlans.length}</h2>
                    <span>Plans available to your account</span>
                </article>

                <article className="trainer-stat-card">
                    <div className="trainer-stat-icon">👥</div>
                    <p>Assignments</p>
                    <h2>{loading ? "—" : assignments.length}</h2>
                    <span>Workout assignments returned by the API</span>
                </article>

                <article className="trainer-stat-card">
                    <div className="trainer-stat-icon">⏱️</div>
                    <p>Today's Duration</p>
                    <h2>
                        {attendanceLoading
                            ? "—"
                            : todayAttendance?.check_in
                              ? getDuration(todayAttendance)
                              : "0h 0m"}
                    </h2>
                    <span>
                        {isCheckedIn
                            ? "Attendance in progress"
                            : isCheckedOut
                              ? "Attendance completed"
                              : "Not checked in yet"}
                    </span>
                </article>
            </section>

            <section className="trainer-content-card trainer-attendance-card">
                <div className="trainer-section-heading">
                    <div>
                        <h2>My Attendance</h2>
                        <p>
                            {formatDate(today)} · Record your working hours
                        </p>
                    </div>

                    <span
                        className={`trainer-attendance-badge ${
                            isCheckedIn
                                ? "in-progress"
                                : isCheckedOut
                                  ? "completed"
                                  : "not-started"
                        }`}
                    >
                        {attendanceLoading
                            ? "Loading..."
                            : isCheckedIn
                              ? "Checked In"
                              : isCheckedOut
                                ? "Completed"
                                : "Not Checked In"}
                    </span>
                </div>

                {attendanceError && (
                    <div className="trainer-error">
                        {attendanceError}
                    </div>
                )}

                {attendanceMessage && (
                    <div className="trainer-success">
                        {attendanceMessage}
                    </div>
                )}

                <div className="trainer-attendance-summary">
                    <div className="trainer-attendance-time">
                        <span>Check-in time</span>
                        <strong>
                            {formatTime(todayAttendance?.check_in)}
                        </strong>
                    </div>

                    <div className="trainer-attendance-time">
                        <span>Check-out time</span>
                        <strong>
                            {formatTime(todayAttendance?.check_out)}
                        </strong>
                    </div>

                    <div className="trainer-attendance-time">
                        <span>Working duration</span>
                        <strong>
                            {todayAttendance?.check_in
                                ? getDuration(todayAttendance)
                                : "—"}
                        </strong>
                    </div>
                </div>

                <div className="trainer-attendance-actions">
                    <button
                        type="button"
                        className="trainer-check-in-button"
                        disabled={
                            attendanceLoading ||
                            attendanceActionLoading ||
                            Boolean(todayAttendance?.check_in)
                        }
                        onClick={() => handleAttendanceAction("check-in")}
                    >
                        {attendanceActionLoading
                            ? "Please wait..."
                            : "✓ Check In"}
                    </button>

                    <button
                        type="button"
                        className="trainer-check-out-button"
                        disabled={
                            attendanceLoading ||
                            attendanceActionLoading ||
                            !isCheckedIn
                        }
                        onClick={() => handleAttendanceAction("check-out")}
                    >
                        {attendanceActionLoading
                            ? "Please wait..."
                            : "↗ Check Out"}
                    </button>
                </div>

                <p className="trainer-attendance-note">
                    Your attendance is recorded using the server time.
                    You can check in and check out only once per day.
                </p>
            </section>

            <section className="trainer-content-card">
                <div className="trainer-section-heading">
                    <div>
                        <h2>Attendance History</h2>
                        <p>Your previously recorded working hours</p>
                    </div>

                    <button
                        type="button"
                        className="trainer-refresh-button"
                        disabled={attendanceLoading}
                        onClick={loadAttendance}
                    >
                        ↻ Refresh
                    </button>
                </div>

                {attendanceLoading ? (
                    <p className="trainer-empty">
                        Loading attendance history...
                    </p>
                ) : attendance.length === 0 ? (
                    <p className="trainer-empty">
                        No attendance records found yet. Check in to create
                        your first record.
                    </p>
                ) : (
                    <div className="trainer-table-wrapper">
                        <table className="trainer-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {attendance.map((record) => (
                                    <tr key={record.id}>
                                        <td>{formatDate(record.date)}</td>
                                        <td>{formatTime(record.check_in)}</td>
                                        <td>{formatTime(record.check_out)}</td>
                                        <td>{getDuration(record)}</td>
                                        <td>
                                            <span className="trainer-status">
                                                {record.check_out
                                                    ? "Completed"
                                                    : record.check_in
                                                      ? "In Progress"
                                                      : "Not Started"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="trainer-content-card">
                <div className="trainer-section-heading">
                    <div>
                        <h2>Workout Plans</h2>
                        <p>Plans returned by the backend</p>
                    </div>
                </div>

                {loading ? (
                    <p className="trainer-empty">Loading workout plans...</p>
                ) : workoutPlans.length === 0 ? (
                    <p className="trainer-empty">
                        No workout plans were returned.
                    </p>
                ) : (
                    <div className="trainer-table-wrapper">
                        <table className="trainer-table">
                            <thead>
                                <tr>
                                    <th>Plan Name</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {workoutPlans.map((plan) => (
                                    <tr key={plan.id}>
                                        <td>
                                            <strong>
                                                {plan.name ||
                                                    plan.title ||
                                                    `Plan #${plan.id}`}
                                            </strong>
                                        </td>
                                        <td>{plan.description || "—"}</td>
                                        <td>
                                            <span className="trainer-status">
                                                {plan.is_active === false
                                                    ? "Inactive"
                                                    : "Available"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="trainer-content-card">
                <div className="trainer-section-heading">
                    <div>
                        <h2>Member Assignments</h2>
                        <p>Workout assignments returned by the backend</p>
                    </div>
                </div>

                {loading ? (
                    <p className="trainer-empty">Loading assignments...</p>
                ) : assignments.length === 0 ? (
                    <p className="trainer-empty">
                        No workout assignments were returned.
                    </p>
                ) : (
                    <div className="trainer-assignment-list">
                        {assignments.map((assignment) => {
                            const plan =
                                assignment.workout_plan_details || {};

                            return (
                                <article
                                    className="trainer-assignment-item"
                                    key={assignment.id}
                                >
                                    <div className="trainer-assignment-icon">
                                        💪
                                    </div>

                                    <div className="trainer-assignment-info">
                                        <h3>
                                            {plan.name ||
                                                plan.title ||
                                                `Assignment #${assignment.id}`}
                                        </h3>

                                        <p>
                                            Member:{" "}
                                            {assignment.member_name ||
                                                assignment.member_username ||
                                                assignment.member ||
                                                "Member details unavailable"}
                                        </p>
                                    </div>

                                    <span className="trainer-status">
                                        Assigned
                                    </span>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

export default TrainerDashboard;
