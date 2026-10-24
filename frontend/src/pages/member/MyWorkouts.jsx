import { useEffect, useState } from "react";

import {
    Dumbbell,
    CalendarDays,
    Clock,
    Target,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Timer,
} from "lucide-react";

import workoutService from "../../services/workoutService";

function MyWorkouts() {
    const [assignments, setAssignments] = useState([]);
    const [expandedWorkout, setExpandedWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [workoutLogs, setWorkoutLogs] = useState([]);
    const [loggingExercise, setLoggingExercise] = useState(null);

    useEffect(() => {
        loadWorkouts();
        loadLogs();
    }, []);

    const loadWorkouts = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await workoutService.getAssignments();
            setAssignments(data.results || data);
        } catch (err) {
            setError("Unable to load your workouts. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        try {
            const data = await workoutService.getLogs();
            setWorkoutLogs(data.results || data);
        } catch (err) {
            console.error("Unable to load workout logs:", err);
        }
    };

    const toggleWorkout = (workoutId) => {
        if (expandedWorkout === workoutId) {
            setExpandedWorkout(null);
        } else {
            setExpandedWorkout(workoutId);
        }
    };

    const markExerciseCompleted = async (workout, exercise) => {
        try {
            setLoggingExercise(exercise.id);

            await workoutService.createLog({
                member_workout: workout.id,
                plan_exercise: exercise.id,
                workout_date: new Date().toISOString().split("T")[0],
                completed_sets: exercise.sets,
                completed_reps: exercise.reps,
                notes: `Completed ${exercise.exercise_name} with good form.`,
                completed: true,
            });

            await loadLogs();
        } catch (err) {
            console.error("Unable to mark exercise as completed:", err);
        } finally {
            setLoggingExercise(null);
        }
    };

    if (loading) {
        return <div className="workout-loading">Loading your workouts...</div>;
    }

    if (error) {
        return (
            <div className="workout-error">
                <AlertCircle size={20} />
                {error}
                <button onClick={loadWorkouts}>Retry</button>
            </div>
        );
    }

    const activeWorkouts = assignments.filter(
        (workout) => workout.status === "ACTIVE"
    );

    return (
        <div className="my-workouts-page">
            <div className="workout-page-header">
                <div>
                    <span className="workout-eyebrow">
                        YOUR FITNESS JOURNEY
                    </span>

                    <h1>My Workouts</h1>

                    <p>
                        Stay consistent, follow your plan and track your
                        progress.
                    </p>
                </div>

                <div className="workout-header-icon">
                    <Dumbbell size={30} />
                </div>
            </div>

            <div className="workout-summary">
                <div className="workout-summary-card">
                    <Target size={22} />

                    <div>
                        <h3>{assignments.length}</h3>
                        <p>Total Assignments</p>
                    </div>
                </div>

                <div className="workout-summary-card">
                    <Dumbbell size={22} />

                    <div>
                        <h3>{activeWorkouts.length}</h3>
                        <p>Active Workouts</p>
                    </div>
                </div>
            </div>

            <div className="workout-section-heading">
                <h2>Assigned Workout Plans</h2>
                <span>{activeWorkouts.length} Active</span>
            </div>

            {assignments.length === 0 ? (
                <div className="workout-empty">
                    <Dumbbell size={40} />
                    <h3>No workouts assigned yet</h3>
                    <p>Your trainer will assign a workout plan soon.</p>
                </div>
            ) : (
                <div className="workout-assignment-grid">
                    {assignments.map((workout) => {
                        const plan = workout.workout_plan_details;

                        const exercises = plan
                            ? [...plan.plan_exercises].sort(
                                  (a, b) => a.order - b.order
                              )
                            : [];

                        const isExpanded =
                            expandedWorkout === workout.id;

                        return (
                            <div
                                className="workout-assignment-card"
                                key={workout.id}
                            >
                                <div className="workout-card-top">
                                    <div className="workout-card-icon">
                                        <Dumbbell size={23} />
                                    </div>

                                    <span
                                        className={`workout-status ${workout.status.toLowerCase()}`}
                                    >
                                        {workout.status}
                                    </span>
                                </div>

                                <h3>{workout.workout_plan_name}</h3>

                                {plan && (
                                    <p className="workout-plan-description">
                                        {plan.description}
                                    </p>
                                )}

                                <div className="workout-card-details">
                                    <div>
                                        <CalendarDays size={16} />

                                        <span>
                                            Start: {workout.start_date}
                                        </span>
                                    </div>

                                    <div>
                                        <Clock size={16} />

                                        <span>
                                            End: {workout.end_date}
                                        </span>
                                    </div>
                                </div>

                                {workout.notes && (
                                    <p className="workout-card-notes">
                                        {workout.notes}
                                    </p>
                                )}

                                <button
                                    className="workout-view-button"
                                    onClick={() =>
                                        toggleWorkout(workout.id)
                                    }
                                >
                                    {isExpanded
                                        ? "Hide Workout"
                                        : "View Workout"}

                                    {isExpanded ? (
                                        <ChevronUp size={18} />
                                    ) : (
                                        <ChevronDown size={18} />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="workout-exercise-section">
                                        <div className="workout-exercise-heading">
                                            <div>
                                                <span>DAY 1</span>

                                                <h4>
                                                    Today's Workout
                                                </h4>
                                            </div>

                                            <span className="exercise-count">
                                                {exercises.length} Exercises
                                            </span>
                                        </div>

                                        {exercises.map((exercise) => (
                                            <div
                                                className="exercise-card"
                                                key={exercise.id}
                                            >
                                                <div className="exercise-card-header">
                                                    <div className="exercise-number">
                                                        {exercise.order}
                                                    </div>

                                                    <div className="exercise-title">
                                                        <h4>
                                                            {
                                                                exercise.exercise_name
                                                            }
                                                        </h4>

                                                        <span>
                                                            {
                                                                exercise.exercise_category
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="exercise-stats">
                                                    <div>
                                                        <Target size={16} />

                                                        <strong>
                                                            {exercise.sets}
                                                        </strong>

                                                        <span>Sets</span>
                                                    </div>

                                                    <div>
                                                        <Dumbbell size={16} />

                                                        <strong>
                                                            {exercise.reps}
                                                        </strong>

                                                        <span>Reps</span>
                                                    </div>

                                                    <div>
                                                        <Timer size={16} />

                                                        <strong>
                                                            {
                                                                exercise.rest_seconds
                                                            }{" "}
                                                            sec
                                                        </strong>

                                                        <span>Rest</span>
                                                    </div>
                                                </div>

                                                {exercise.notes && (
                                                    <p className="exercise-notes">
                                                        {exercise.notes}
                                                    </p>
                                                )}

                                                <button
                                                    className="exercise-complete-button"
                                                    onClick={() => markExerciseCompleted(workout, exercise)}
                                                    disabled={
                                                        loggingExercise === exercise.id ||
                                                        workoutLogs.some(
                                                            (log) =>
                                                                log.member_workout === workout.id &&
                                                                log.plan_exercise === exercise.id &&
                                                                log.completed
                                                        )
                                                    }
                                                >
                                                    {loggingExercise === exercise.id
                                                        ? "Saving..."
                                                        : workoutLogs.some(
                                                            (log) =>
                                                                log.member_workout === workout.id &&
                                                                log.plan_exercise === exercise.id &&
                                                                log.completed
                                                        )
                                                        ? "✓ Completed"
                                                        : "Mark as Completed"}
                                                </button>
                                                
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MyWorkouts;