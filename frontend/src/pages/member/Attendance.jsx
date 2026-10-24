import { useEffect, useState } from "react";
import {
    CalendarDays,
    Clock,
    CheckCircle2,
    XCircle,
} from "lucide-react";

import attendanceService from "../../services/attendanceService";

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadAttendance = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await attendanceService.getAttendance();

                setAttendance(data.results || data);
            } catch (err) {
                console.error("Unable to load attendance:", err);
                setError("Unable to load attendance records.");
            } finally {
                setLoading(false);
            }
        };

        loadAttendance();
    }, []);

    const formatTime = (dateTime) => {
        if (!dateTime) {
            return "—";
        }

        return new Date(dateTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (date) => {
        return new Date(`${date}T00:00:00`).toLocaleDateString([], {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const presentCount = attendance.filter(
        (record) => record.status === "PRESENT"
    ).length;

    const absentCount = attendance.filter(
        (record) => record.status === "ABSENT"
    ).length;

    if (loading) {
        return (
            <div className="member-page">
                <div className="member-page-header">
                    <div>
                        <h1>My Attendance</h1>
                        <p>Track your gym attendance and check-in history.</p>
                    </div>
                </div>

                <div className="attendance-loading">
                    Loading attendance...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="member-page">
                <div className="member-page-header">
                    <div>
                        <h1>My Attendance</h1>
                        <p>Track your gym attendance and check-in history.</p>
                    </div>
                </div>

                <div className="attendance-error">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="member-page">
            {/* Header */}
            <div className="member-page-header">
                <div>
                    <h1>My Attendance</h1>
                    <p>
                        Track your gym visits and attendance history.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="attendance-summary">
                <div className="attendance-summary-card">
                    <div className="attendance-summary-icon">
                        <CalendarDays size={20} />
                    </div>

                    <div>
                        <span>Total Records</span>
                        <strong>{attendance.length}</strong>
                    </div>
                </div>

                <div className="attendance-summary-card">
                    <div className="attendance-summary-icon">
                        <CheckCircle2 size={20} />
                    </div>

                    <div>
                        <span>Present</span>
                        <strong>{presentCount}</strong>
                    </div>
                </div>

                <div className="attendance-summary-card">
                    <div className="attendance-summary-icon">
                        <XCircle size={20} />
                    </div>

                    <div>
                        <span>Absent</span>
                        <strong>{absentCount}</strong>
                    </div>
                </div>
            </div>

            {/* Attendance History */}
            <div className="attendance-section">
                <div className="attendance-section-header">
                    <div>
                        <h2>Attendance History</h2>
                        <p>Your recent gym attendance records.</p>
                    </div>
                </div>

                {attendance.length === 0 ? (
                    <div className="attendance-empty">
                        <CalendarDays size={36} />
                        <h3>No attendance records</h3>
                        <p>
                            Your gym attendance will appear here once you
                            check in.
                        </p>
                    </div>
                ) : (
                    <div className="attendance-list">
                        {attendance.map((record) => (
                            <div
                                className="attendance-card"
                                key={record.id}
                            >
                                <div className="attendance-card-left">
                                    <div className="attendance-date-icon">
                                        <CalendarDays size={20} />
                                    </div>

                                    <div>
                                        <h3>
                                            {formatDate(record.date)}
                                        </h3>

                                        <span
                                            className={`attendance-status ${
                                                record.status === "PRESENT"
                                                    ? "present"
                                                    : "absent"
                                            }`}
                                        >
                                            {record.status === "PRESENT"
                                                ? "Present"
                                                : "Absent"}
                                        </span>
                                    </div>
                                </div>

                                <div className="attendance-times">
                                    <div>
                                        <span>Check In</span>
                                        <strong>
                                            <Clock size={15} />
                                            {formatTime(record.check_in)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Check Out</span>
                                        <strong>
                                            <Clock size={15} />
                                            {formatTime(record.check_out)}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;