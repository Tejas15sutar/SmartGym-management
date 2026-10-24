
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboardModules.css";

const CATEGORIES = [
  { value: "CHEST", label: "Chest" },
  { value: "BACK", label: "Back" },
  { value: "SHOULDERS", label: "Shoulders" },
  { value: "ARMS", label: "Arms" },
  { value: "LEGS", label: "Legs" },
  { value: "ABS", label: "Abs" },
  { value: "CARDIO", label: "Cardio" },
  { value: "FULL_BODY", label: "Full Body" },
];

const EMPTY_FORM = {
  name: "",
  category: "CHEST",
  description: "",
  instructions: "",
  video_url: "",
  is_active: true,
};

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

function getExerciseList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function AdminExerciseLibrary() {
  const [exercises, setExercises] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadExercises() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/workouts/exercises/");
      setExercises(getExerciseList(response.data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExercises();
  }, []);

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesSearch =
        !query ||
        exercise.name?.toLowerCase().includes(query) ||
        exercise.description?.toLowerCase().includes(query) ||
        exercise.instructions?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "ALL" ||
        exercise.category === categoryFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && exercise.is_active) ||
        (statusFilter === "INACTIVE" && !exercise.is_active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [exercises, search, categoryFilter, statusFilter]);

  const activeCount = exercises.filter((item) => item.is_active).length;
  const inactiveCount = exercises.length - activeCount;
  const categoryName = (value) =>
    CATEGORIES.find((item) => item.value === value)?.label || value || "—";

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleEdit(exercise) {
    setForm({
      name: exercise.name || "",
      category: exercise.category || "CHEST",
      description: exercise.description || "",
      instructions: exercise.instructions || "",
      video_url: exercise.video_url || "",
      is_active: exercise.is_active ?? true,
    });

    setEditingId(exercise.id);
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
      name: form.name.trim(),
      description: form.description.trim(),
      instructions: form.instructions.trim(),
      video_url: form.video_url.trim(),
    };

    try {
      if (editingId !== null) {
        await api.patch(`/workouts/exercises/${editingId}/`, payload);
        setSuccess("Exercise updated successfully.");
      } else {
        await api.post("/workouts/exercises/", payload);
        setSuccess("Exercise created successfully.");
      }

      resetForm();
      await loadExercises();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(exercise) {
    const action = exercise.is_active ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${exercise.name}"?`
      )
    ) {
      return;
    }

    setUpdatingId(exercise.id);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/workouts/exercises/${exercise.id}/`, {
        is_active: !exercise.is_active,
      });

      setSuccess(`Exercise ${action}d successfully.`);
      await loadExercises();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="admin-module">
      <div className="admin-module-header">
        <div>
          <h2>Exercise Library</h2>
          <p>Manage exercises available for workout plans.</p>
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
          <span>Total Exercises</span>
          <strong>{exercises.length}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <span>Inactive</span>
          <strong>{inactiveCount}</strong>
        </div>
      </div>

      <form className="admin-module-form" onSubmit={handleSubmit}>
        <h3>{editingId !== null ? "Edit Exercise" : "Add New Exercise"}</h3>

        <div className="admin-module-form-grid">
          <label>
            Exercise Name *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Bench Press"
              maxLength={150}
              required
            />
          </label>

          <label>
            Category *
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-module-full-width">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Briefly describe the exercise"
            />
          </label>

          <label className="admin-module-full-width">
            Instructions
            <textarea
              name="instructions"
              value={form.instructions}
              onChange={handleChange}
              rows={4}
              placeholder="Explain the correct technique and steps"
            />
          </label>

          <label className="admin-module-full-width">
            Demonstration Video URL
            <input
              type="url"
              name="video_url"
              value={form.video_url}
              onChange={handleChange}
              placeholder="https://example.com/video"
            />
          </label>

          <label className="admin-module-checkbox">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Exercise is active
          </label>
        </div>

        <div className="admin-module-form-actions">
          <button
            type="submit"
            className="admin-module-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId !== null
                ? "Update Exercise"
                : "Create Exercise"}
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
      </form>

      <div className="admin-module-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search exercises..."
          aria-label="Search exercises"
        />

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="admin-module-table-wrap">
        <table className="admin-module-table">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Category</th>
              <th>Video</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">Loading exercises...</td>
              </tr>
            ) : filteredExercises.length === 0 ? (
              <tr>
                <td colSpan="5">No exercises found.</td>
              </tr>
            ) : (
              filteredExercises.map((exercise) => (
                <tr key={exercise.id}>
                  <td>
                    <strong>{exercise.name}</strong>
                    {exercise.description && (
                      <p className="admin-module-muted">
                        {exercise.description}
                      </p>
                    )}
                  </td>

                  <td>{categoryName(exercise.category)}</td>

                  <td>
                    {exercise.video_url ? (
                      <a
                        href={exercise.video_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View video
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    <span
                      className={`admin-module-status ${
                        exercise.is_active ? "active" : "inactive"
                      }`}
                    >
                      {exercise.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    <div className="admin-module-actions">
                      <button
                        type="button"
                        className="admin-module-secondary"
                        onClick={() => handleEdit(exercise)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-module-secondary"
                        disabled={updatingId === exercise.id}
                        onClick={() => toggleStatus(exercise)}
                      >
                        {updatingId === exercise.id
                          ? "Updating..."
                          : exercise.is_active
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

export default AdminExerciseLibrary;
