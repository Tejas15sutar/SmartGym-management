
import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboardModules.css";

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getErrorMessage(err) {
  const data = err.response?.data;

  if (typeof data === "string") return data;

  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "string"
            ? value
            : JSON.stringify(value);

        return `${key}: ${message}`;
      })
      .join(" | ");
  }

  return err.message || "An unexpected error occurred.";
}

function AdminWorkoutAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    member: "",
    workout_plan: "",
    start_date: new Date().toLocaleDateString("en-CA"),
    end_date: "",
    status: "ACTIVE",
    notes: "",
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [assignmentRes, memberRes, planRes] = await Promise.all([
        api.get("/workouts/assignments/"),
        api.get("/auth/admin-users/?role=MEMBER"),
        api.get("/workouts/plans/"),
      ]);

      setAssignments(getList(assignmentRes.data));
      setMembers(getList(memberRes.data));
      setPlans(
        getList(planRes.data).filter((plan) => plan.is_active)
      );
    } catch (err) {
      console.error("Failed to load workout assignments:", err);
      console.error("Failed URL:", err.config?.url);
      console.error("HTTP status:", err.response?.status);
      console.error("API response:", err.response?.data);

      setError(
        `${err.config?.url || "API request"} — ${
          err.response?.status || "Network error"
        }: ${getErrorMessage(err)}`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      member: "",
      workout_plan: "",
      start_date: new Date().toLocaleDateString("en-CA"),
      end_date: "",
      status: "ACTIVE",
      notes: "",
    });

    setEditingId(null);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.member ||
      !form.workout_plan ||
      !form.start_date ||
      !form.end_date
    ) {
      setError(
        "Please select a member, workout plan, start date, and end date."
      );
      return;
    }

    if (form.end_date < form.start_date) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        member: Number(form.member),
        workout_plan: Number(form.workout_plan),
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
        notes: form.notes,
      };

      if (editingId) {
        await api.patch(
          `/workouts/assignments/${editingId}/`,
          payload
        );
        setSuccess("Workout assignment updated successfully.");
      } else {
        await api.post("/workouts/assignments/", payload);
        setSuccess("Workout plan assigned successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error("Failed to save workout assignment:", err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(assignment) {
    setEditingId(assignment.id);

    setForm({
      member: String(assignment.member),
      workout_plan: String(assignment.workout_plan),
      start_date: assignment.start_date,
      end_date: assignment.end_date,
      status: assignment.status,
      notes: assignment.notes || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this workout assignment?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(`/workouts/assignments/${id}/`);

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Workout assignment deleted successfully.");
      await loadData();
    } catch (err) {
      console.error("Failed to delete workout assignment:", err);
      setError(getErrorMessage(err));
    }
  }

  const filteredAssignments = assignments.filter((item) => {
    const searchableText = [
      item.member_name,
      item.workout_plan_name,
      item.status,
      item.notes,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.toLowerCase());
  });

  const activeCount = assignments.filter(
    (item) => item.status === "ACTIVE"
  ).length;

  const completedCount = assignments.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  return (
    <section className="admin-module">
      <div className="admin-module-header">
        <div>
          <h2>Member Workout Assignments</h2>
          <p>Assign training plans and manage their schedules.</p>
        </div>

        <button
          type="button"
          className="admin-module-secondary"
          onClick={loadData}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
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

      <form className="admin-module-form" onSubmit={handleSubmit}>
        <h3>
          {editingId ? "Edit Assignment" : "Assign Workout Plan"}
        </h3>

        <div className="admin-module-form-grid">
          <label>
            Member *
            <select
              name="member"
              value={form.member}
              onChange={handleChange}
              required
            >
              <option value="">Select member</option>

              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.username}
                  {member.first_name || member.last_name
                    ? ` — ${[
                        member.first_name,
                        member.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ")}`
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Workout Plan *
            <select
              name="workout_plan"
              value={form.workout_plan}
              onChange={handleChange}
              required
            >
              <option value="">Select workout plan</option>

              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.level})
                </option>
              ))}
            </select>
          </label>

          <label>
            Start Date *
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            End Date *
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              min={form.start_date}
              required
            />
          </label>

          <label>
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              disabled={!editingId}
            >
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>

          <label className="admin-module-full-width">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Optional training instructions..."
            />
          </label>
        </div>

        {!loading && members.length === 0 && (
          <p className="admin-module-muted">
            No members were returned by the admin users API. Check the
            Members module and ensure at least one member account exists.
          </p>
        )}

        {!loading && plans.length === 0 && (
          <p className="admin-module-muted">
            No active workout plans found. Create or activate a workout
            plan first.
          </p>
        )}

        <div className="admin-module-form-actions">
          <button
            type="submit"
            className="admin-module-primary"
            disabled={saving || loading}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Assignment"
                : "Assign Workout"}
          </button>

          {editingId && (
            <button
              type="button"
              className="admin-module-secondary"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="admin-module-summary">
        <div>
          <span>Total Assignments</span>
          <strong>{assignments.length}</strong>
        </div>

        <div>
          <span>Active</span>
          <strong>{activeCount}</strong>
        </div>

        <div>
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
      </div>

      <div className="admin-module-filters">
        <input
          type="search"
          placeholder="Search member, plan, or status..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="admin-module-table-wrap">
        <table className="admin-module-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Workout Plan</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Loading assignments...</td>
              </tr>
            ) : filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan="6">No workout assignments found.</td>
              </tr>
            ) : (
              filteredAssignments.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.member_name || `Member #${item.member}`}
                  </td>

                  <td>
                    {item.workout_plan_name ||
                      `Plan #${item.workout_plan}`}
                  </td>

                  <td>
                    {item.start_date} – {item.end_date}
                  </td>

                  <td>
                    <span
                      className={`admin-module-status ${
                        item.status?.toLowerCase()
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>{item.notes || "—"}</td>

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
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
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

export default AdminWorkoutAssignments;
