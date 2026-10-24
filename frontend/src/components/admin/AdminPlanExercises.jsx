
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboardModules.css";

const EMPTY_FORM = {
  workout_plan: "",
  exercise: "",
  day_number: 1,
  sets: 3,
  reps: "12",
  rest_seconds: 60,
  notes: "",
  order: 0,
};

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(" ")
          : typeof messages === "string"
            ? messages
            : JSON.stringify(messages);
        return `${field === "non_field_errors" ? "" : `${field}: `}${message}`;
      })
      .join(" ");
  }

  return error?.message || "Something went wrong. Please try again.";
}

function AdminPlanExercises() {
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [planExercises, setPlanExercises] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [plansResponse, exercisesResponse, assignmentsResponse] =
        await Promise.all([
          api.get("/workouts/plans/"),
          api.get("/workouts/exercises/"),
          api.get("/workouts/plan-exercises/"),
        ]);

      setPlans(getList(plansResponse.data));
      setExercises(getList(exercisesResponse.data));
      setPlanExercises(getList(assignmentsResponse.data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return planExercises.filter((item) => {
      const planName =
        item.workout_plan_name ||
        plans.find((plan) => plan.id === item.workout_plan)?.name ||
        "";

      const exerciseName =
        item.exercise_name ||
        exercises.find((exercise) => exercise.id === item.exercise)?.name ||
        "";

      const matchesPlan =
        selectedPlan === "ALL" ||
        String(item.workout_plan) === String(selectedPlan);

      const matchesSearch =
        !query ||
        planName.toLowerCase().includes(query) ||
        exerciseName.toLowerCase().includes(query) ||
        String(item.day_number).includes(query);

      return matchesPlan && matchesSearch;
    });
  }, [planExercises, plans, exercises, selectedPlan, search]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleEdit(item) {
    setForm({
      workout_plan: String(item.workout_plan),
      exercise: String(item.exercise),
      day_number: item.day_number ?? 1,
      sets: item.sets ?? 3,
      reps: item.reps ?? "12",
      rest_seconds: item.rest_seconds ?? 60,
      notes: item.notes ?? "",
      order: item.order ?? 0,
    });

    setEditingId(item.id);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      workout_plan: Number(form.workout_plan),
      exercise: Number(form.exercise),
      day_number: Number(form.day_number),
      sets: Number(form.sets),
      reps: String(form.reps).trim(),
      rest_seconds: Number(form.rest_seconds),
      order: Number(form.order),
      notes: form.notes.trim(),
    };

    try {
      if (editingId !== null) {
        await api.patch(
          `/workouts/plan-exercises/${editingId}/`,
          payload
        );
        setSuccess("Plan exercise updated successfully.");
      } else {
        await api.post("/workouts/plan-exercises/", payload);
        setSuccess("Exercise added to the workout plan successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const exerciseName =
      item.exercise_name ||
      exercises.find((exercise) => exercise.id === item.exercise)?.name ||
      "this exercise";

    if (
      !window.confirm(
        `Remove ${exerciseName} from this workout plan? Existing workout logs may prevent deletion.`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(`/workouts/plan-exercises/${item.id}/`);
      setSuccess("Exercise removed from the workout plan.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function getPlanName(item) {
    return (
      item.workout_plan_name ||
      plans.find((plan) => plan.id === item.workout_plan)?.name ||
      `Plan #${item.workout_plan}`
    );
  }

  function getExerciseName(item) {
    return (
      item.exercise_name ||
      exercises.find((exercise) => exercise.id === item.exercise)?.name ||
      `Exercise #${item.exercise}`
    );
  }

  return (
    <section className="admin-module">
      <div className="admin-module-header">
        <div>
          <h2>Plan Exercises</h2>
          <p>Build structured daily routines for your workout plans.</p>
        </div>

        <button
          type="button"
          className="admin-module-primary"
          onClick={() => {
            resetForm();
            setError("");
            setSuccess("");
          }}
        >
          + Add Exercise
        </button>
      </div>

      {error && (
        <div className="admin-module-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-module-success" role="status">
          {success}
        </div>
      )}

      <div className="admin-module-summary">
        <div>
          <span>Workout Plans</span>
          <strong>{plans.length}</strong>
        </div>
        <div>
          <span>Available Exercises</span>
          <strong>{exercises.length}</strong>
        </div>
        <div>
          <span>Plan Exercise Entries</span>
          <strong>{planExercises.length}</strong>
        </div>
      </div>

      <form className="admin-module-form" onSubmit={handleSubmit}>
        <h3>{editingId !== null ? "Edit Plan Exercise" : "Add Exercise to Plan"}</h3>

        <div className="admin-module-form-grid">
          <label>
            Workout Plan *
            <select
              name="workout_plan"
              value={form.workout_plan}
              onChange={handleChange}
              required
            >
              <option value="">Select a workout plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}{plan.is_active ? "" : " (Inactive)"}
                </option>
              ))}
            </select>
          </label>

          <label>
            Exercise *
            <select
              name="exercise"
              value={form.exercise}
              onChange={handleChange}
              required
            >
              <option value="">Select an exercise</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.category})
                  {!exercise.is_active ? " — Inactive" : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Workout Day *
            <input
              type="number"
              name="day_number"
              min="1"
              value={form.day_number}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Sets *
            <input
              type="number"
              name="sets"
              min="1"
              value={form.sets}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Reps *
            <input
              name="reps"
              value={form.reps}
              onChange={handleChange}
              maxLength={50}
              placeholder="e.g. 12 or 10-12"
              required
            />
          </label>

          <label>
            Rest Between Sets (seconds) *
            <input
              type="number"
              name="rest_seconds"
              min="0"
              value={form.rest_seconds}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Display Order
            <input
              type="number"
              name="order"
              min="0"
              value={form.order}
              onChange={handleChange}
            />
          </label>

          <label className="admin-module-full-width">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Optional coaching notes or technique reminders"
            />
          </label>
        </div>

        <div className="admin-module-form-actions">
          <button
            type="submit"
            className="admin-module-primary"
            disabled={saving || plans.length === 0 || exercises.length === 0}
          >
            {saving
              ? "Saving..."
              : editingId !== null
                ? "Update Entry"
                : "Add to Plan"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="admin-module-secondary"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel Edit
            </button>
          )}
        </div>

        {plans.length === 0 && (
          <p className="admin-module-muted">
            Create a workout plan first.
          </p>
        )}

        {exercises.length === 0 && (
          <p className="admin-module-muted">
            Create an exercise in the Exercise Library first.
          </p>
        )}
      </form>

      <div className="admin-module-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by plan, exercise, or day..."
          aria-label="Search plan exercises"
        />

        <select
          value={selectedPlan}
          onChange={(event) => setSelectedPlan(event.target.value)}
          aria-label="Filter by workout plan"
        >
          <option value="ALL">All Workout Plans</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-module-table-wrap">
        <table className="admin-module-table">
          <thead>
            <tr>
              <th>Workout Plan</th>
              <th>Day</th>
              <th>Exercise</th>
              <th>Sets × Reps</th>
              <th>Rest</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7">Loading plan exercises...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="7">No plan exercises found.</td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>{getPlanName(item)}</td>
                  <td>Day {item.day_number}</td>
                  <td>
                    <strong>{getExerciseName(item)}</strong>
                    {item.exercise_category && (
                      <p className="admin-module-muted">
                        {item.exercise_category}
                      </p>
                    )}
                    {item.notes && (
                      <p className="admin-module-muted">{item.notes}</p>
                    )}
                  </td>
                  <td>{item.sets} × {item.reps}</td>
                  <td>{item.rest_seconds}s</td>
                  <td>{item.order}</td>
                  <td>
                    <div className="admin-module-actions">
                      <button
                        type="button"
                        className="admin-module-secondary"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-module-secondary"
                        onClick={() => handleDelete(item)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminPlanExercises;
