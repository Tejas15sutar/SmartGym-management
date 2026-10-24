
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

function formatDate(value) {
    if (!value) return "—";

    const [year, month, day] = value.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day))
        .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
}

function formatTime(value) {
    if (!value) return "—";

    return new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
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

function AdminTrainerAttendance() {
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainer, setSelectedTrainer] = useState("");
    const [records, setRecords] = useState([]);
    const [loadingTrainers, setLoadingTrainers] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [error, setError] = useState("");

    const fetchTrainers = useCallback(async () => {
        try {
            setLoadingTrainers(true);
            setError("");

            const response = await api.get("/auth/admin-users/?role=TRAINER");
            const data = getList(response.data);

            setTrainers(data);

            if (data.length > 0) {
                setSelectedTrainer((current) => {
                    if (current && data.some(
                        (trainer) => String(trainer.id) === current
                    )) {
                        return current;
                    }

                    return String(data[0].id);
                });
            } else {
                setSelectedTrainer("");
                setRecords([]);
            }
        } catch (err) {
            setError(
                getErrorMessage(err, "Unable to load the trainer list.")
            );
        } finally {
            setLoadingTrainers(false);
        }
    }, []);

    const fetchAttendance = useCallback(async () => {
        if (!selectedTrainer) {
            setRecords([]);
            return;
        }

        try {
            setLoadingRecords(true);
            setError("");

            const response = await api.get(
                `/trainer-attendance/?trainer_id=${encodeURIComponent(selectedTrainer)}`
            );

            setRecords(getList(response.data));
        } catch (err) {
            setRecords([]);
            setError(
                getErrorMessage(
                    err,
                    "Unable to load attendance records for this trainer."
                )
            );
        } finally {
            setLoadingRecords(false);
        }
    }, [selectedTrainer]);

    useEffect(() => {
        fetchTrainers();
    }, [fetchTrainers]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const selectedTrainerDetails = trainers.find(
        (trainer) => String(trainer.id) === selectedTrainer
    );

    const trainerName = selectedTrainerDetails
        ? [
            selectedTrainerDetails.first_name,
            selectedTrainerDetails.last_name,
        ].filter(Boolean).join(" ") || selectedTrainerDetails.username
        : "";

    const completedRecords = records.filter(
        (record) => record.check_in && record.check_out
    );

    return (
        <div className="admin-trainer-attendance">
            <section className="admin-section">
                <div className="admin-section-heading">
                    <div>
                        <h2>Trainer Attendance</h2>
                        <p>
                            View check-in, check-out, and working hours for
                            individual trainers.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-back-button"
                        onClick={() => {
                            fetchTrainers();
                            fetchAttendance();
                        }}
                        disabled={loadingTrainers || loadingRecords}
                    >
                        {loadingTrainers || loadingRecords
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>
                </div>

                {error && (
                    <div className="login-error" role="alert">
                        {error}
                    </div>
                )}

                <div className="admin-attendance-filter">
                    <label htmlFor="admin-trainer-select">
                        Select Trainer
                    </label>

                    <select
                        id="admin-trainer-select"
                        value={selectedTrainer}
                        onChange={(event) =>
                            setSelectedTrainer(event.target.value)
                        }
                        disabled={loadingTrainers || trainers.length === 0}
                    >
                        {loadingTrainers && (
                            <option value="">Loading trainers...</option>
                        )}

                        {!loadingTrainers && trainers.length === 0 && (
                            <option value="">No trainers available</option>
                        )}

                        {trainers.map((trainer) => {
                            const name = [
                                trainer.first_name,
                                trainer.last_name,
                            ].filter(Boolean).join(" ") || trainer.username;

                            return (
                                <option
                                    key={trainer.id}
                                    value={String(trainer.id)}
                                >
                                    {name} ({trainer.username})
                                </option>
                            );
                        })}
                    </select>
                </div>

                {selectedTrainerDetails && (
                    <div className="admin-attendance-trainer-info">
                        <div className="admin-attendance-avatar">
                            {trainerName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                            <strong>{trainerName}</strong>
                            <p>
                                {selectedTrainerDetails.email || "No email available"}
                            </p>
                        </div>

                        <span className="admin-attendance-readonly">
                            Read only
                        </span>
                    </div>
                )}

                <div className="admin-attendance-stats">
                    <article className="admin-attendance-stat">
                        <span>Total Records</span>
                        <strong>
                            {loadingRecords ? "—" : records.length}
                        </strong>
                    </article>

                    <article className="admin-attendance-stat">
                        <span>Completed Days</span>
                        <strong>
                            {loadingRecords ? "—" : completedRecords.length}
                        </strong>
                    </article>

                    <article className="admin-attendance-stat">
                        <span>In Progress</span>
                        <strong>
                            {loadingRecords
                                ? "—"
                                : records.filter(
                                    (record) =>
                                        record.check_in && !record.check_out
                                ).length}
                        </strong>
                    </article>
                </div>
            </section>

            <section className="admin-section admin-attendance-table-section">
                <div className="admin-section-heading">
                    <div>
                        <h2>Attendance History</h2>
                        <p>
                            {selectedTrainer
                                ? `Attendance records for ${trainerName || "the selected trainer"}`
                                : "Select a trainer to view attendance"}
                        </p>
                    </div>
                </div>

                {loadingRecords || loadingTrainers ? (
                    <p className="admin-attendance-empty">
                        Loading attendance records...
                    </p>
                ) : !selectedTrainer ? (
                    <p className="admin-attendance-empty">
                        No trainer is available to select.
                    </p>
                ) : records.length === 0 ? (
                    <p className="admin-attendance-empty">
                        No attendance records found for this trainer.
                    </p>
                ) : (
                    <div className="admin-attendance-table-wrapper">
                        <table className="admin-attendance-table">
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
                                {records.map((record) => (
                                    <tr key={record.id}>
                                        <td>{formatDate(record.date)}</td>
                                        <td>{formatTime(record.check_in)}</td>
                                        <td>{formatTime(record.check_out)}</td>
                                        <td>
                                            {formatDuration(record.duration_seconds)}
                                        </td>
                                        <td>
                                            <span
                                                className={`admin-attendance-status ${
                                                    record.check_out
                                                        ? "completed"
                                                        : record.check_in
                                                          ? "in-progress"
                                                          : "not-started"
                                                }`}
                                            >
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
        </div>
    );
}

export default AdminTrainerAttendance;
