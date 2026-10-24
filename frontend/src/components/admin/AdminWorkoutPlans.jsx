
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboardModules.css";

const INITIAL_FORM = {
  name: "",
  description: "",
  level: "BEGINNER",
  duration_weeks: 4,
  is_active: true,
};

const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

function getErrorMessage(err, fallback) {
  const data = err.response?.data;

  if (typeof data === "string") return data;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, value]) => {
        const detail = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "string"
            ? value
            : JSON.stringify(value);

        return `${field === "detail" ? "" : `${field}: `}${detail}`;
      })
      .join(" | ");
  }

  return fallback;
}

function AdminWorkoutPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/workouts/plans/");
      const data = response.data;

      setPlans(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : []
      );
    } catch (err) {
      console.error("Failed to load workout plans:", err);
      setError(
        getErrorMessage(
          err,
          "Unable to load workout plans. Check your admin access and API."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch =
        !term ||
        plan.name?.toLowerCase().includes(term) ||
        plan.description?.toLowerCase().includes(term);

      const matchesLevel =
        levelFilter === "ALL" || plan.level === levelFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && plan.is_active) ||
        (statusFilter === "INACTIVE" && !plan.is_active);

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [plans, search, levelFilter, statusFilter]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const startEdit = (plan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name || "",
      description: plan.description || "",
      level: plan.level || "BEGINNER",
      duration_weeks: plan.duration_weeks ?? 4,
      is_active: plan.is_active ?? true,
    });
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const duration = Number(form.duration_weeks);

    if (!Number.isInteger(duration) || duration < 1) {
      setError("Duration must be a whole number greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...form,
      duration_weeks: duration,
    };

    try {
      if (editingId !== null) {
        await api.patch(`/workouts/plans/${editingId}/`, payload);
        setNotice("Workout plan updated successfully.");
      } else {
        await api.post("/workouts/plans/", payload);
        setNotice("Workout plan created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...INITIAL_FORM });
      await loadPlans();
    } catch (err) {
      console.error("Failed to save workout plan:", err);
      setError(
        getErrorMessage(err, "Unable to save workout plan.")
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (plan) => {
    if (actionId !== null) return;

    const nextActive = !plan.is_active;

    if (
      !window.confirm(
        `${nextActive ? "Activate" : "Deactivate"} "${plan.name}"?`
      )
    ) {
      return;
    }

    setActionId(plan.id);
    setError("");
    setNotice("");

    try {
      await api.patch(`/workouts/plans/${plan.id}/`, {
        is_active: nextActive,
      });

      setNotice(
        `"${plan.name}" ${nextActive ? "activated" : "deactivated"} successfully.`
      );

      await loadPlans();
    } catch (err) {
      console.error("Failed to update workout plan status:", err);
      setError(
        getErrorMessage(err, "Unable to change workout plan status.")
      );
    } finally {
      setActionId(null);
    }
  };

  const activeCount = plans.filter((plan) => plan.is_active).length;

  return (
    <section className="admin-module">
      <div className="admin-module-header">
        <div>
          <h2>Workout Plans</h2>
          <p>Create and manage structured workout programs for your members.</p>
        </div>

        <button
          type="button"
          className="admin-module-primary"
          onClick={startCreate}
          disabled={saving}
        >
          + Create Plan
        </button>
      </div>

      {error && (
        <div className="admin-module-error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="admin-module-success" role="status">
          {notice}
        </div>
      )}

      {showForm && (
        <form className="admin-module-form" onSubmit={handleSubmit}>
          <h3>
            {editingId !== null ? "Edit Workout Plan" : "Create Workout Plan"}
          </h3>

          <div className="admin-module-form-grid">
            <label>
              Plan Name *
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="e.g. Beginner Full Body Plan"
                maxLength={100}
                required
              />
            </label>

            <label>
              Difficulty Level *
              <select
                name="level"
                value={form.level}
                onChange={updateField}
                required
              >
                {LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Duration (weeks) *
              <input
                type="number"
                name="duration_weeks"
                value={form.duration_weeks}
                onChange={updateField}
                min="1"
                step="1"
                required
              />
            </label>

            <label className="admin-module-checkbox">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={updateField}
              />
              Available for assignment
            </label>

            <label className="admin-module-full-width">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows="3"
                placeholder="Describe the goal and structure of this workout plan"
              />
            </label>
          </div>

          <div className="admin-module-form-actions">
            <button
              type="button"
              className="admin-module-secondary"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-module-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Save Changes"
                  : "Create Plan"}
            </button>
          </div>
        </form>
      )}

      <div className="admin-module-summary">
        <div>
          <span>Total Plans </span>
          <strong>{plans.length}</strong>
        </div>
        <div>
          <span>Active Plans </span>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <span>Inactive Plans </span>
          <strong>{plans.length - activeCount}</strong>
        </div>
      </div>

      <div className="admin-module-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search workout plans..."
          aria-label="Search workout plans"
        />

        <select
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value)}
          aria-label="Filter by difficulty"
        >
          <option value="ALL">All levels</option>
          {LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <button
          type="button"
          className="admin-module-secondary"
          onClick={loadPlans}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="admin-module-table-wrap">
        <table className="admin-module-table">
          <thead>
            <tr>
              <th>Workout Plan</th>
              <th>Level</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">Loading workout plans...</td>
              </tr>
            ) : filteredPlans.length === 0 ? (
              <tr>
                <td colSpan="5">
                  {plans.length === 0
                    ? "No workout plans found. Create your first plan."
                    : "No plans match your filters."}
                </td>
              </tr>
            ) : (
              filteredPlans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <strong>{plan.name}</strong>
                    {plan.description && (
                      <div className="admin-module-muted">
                        {plan.description}
                      </div>
                    )}
                  </td>

                  <td>
                    {LEVELS.find((level) => level.value === plan.level)?.label ||
                      plan.level}
                  </td>

                  <td>{plan.duration_weeks} weeks</td>

                  <td>
                    <span
                      className={`admin-module-status ${
                        plan.is_active ? "active" : "inactive"
                      }`}
                    >
                      {plan.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    <div className="admin-module-actions">
                      <button
                        type="button"
                        className="admin-module-secondary"
                        onClick={() => startEdit(plan)}
                        disabled={actionId !== null || saving}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-module-secondary"
                        onClick={() => toggleStatus(plan)}
                        disabled={actionId !== null || saving}
                      >
                        {actionId === plan.id
                          ? "Updating..."
                          : plan.is_active
                            ? "Deactivate"
                            : "Activate"}
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

export default AdminWorkoutPlans;
