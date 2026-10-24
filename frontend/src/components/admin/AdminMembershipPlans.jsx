
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboardModules.css";

const INITIAL_FORM = {
  name: "",
  plan_type: "MONTHLY",
  duration_days: 30,
  price: "",
  description: "",
  is_active: true,
};

const PLAN_TYPES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "YEARLY", label: "Yearly" },
];

function getErrorMessage(err, fallback) {
  const data = err.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, value]) => {
        const message = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "string"
            ? value
            : JSON.stringify(value);

        return `${field === "detail" ? "" : `${field}: `}${message}`;
      })
      .join(" | ");
  }

  return fallback;
}

function AdminMembershipPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState({ ...INITIAL_FORM });

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/memberships/plans/");
      const data = response.data;

      setPlans(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : []
      );
    } catch (err) {
      console.error("Failed to load membership plans:", err);
      setError(
        getErrorMessage(
          err,
          "Unable to load membership plans. Check your admin access and API."
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
    const searchTerm = search.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch =
        !searchTerm ||
        plan.name?.toLowerCase().includes(searchTerm) ||
        plan.description?.toLowerCase().includes(searchTerm) ||
        plan.plan_type?.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && plan.is_active) ||
        (statusFilter === "INACTIVE" && !plan.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

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
      plan_type: plan.plan_type || "MONTHLY",
      duration_days: plan.duration_days ?? 30,
      price: plan.price ?? "",
      description: plan.description || "",
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

    const duration = Number(form.duration_days);
    const price = Number(form.price);

    if (!Number.isInteger(duration) || duration < 1) {
      setError("Duration must be a whole number greater than zero.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price of zero or more.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...form,
      duration_days: duration,
      price: price.toFixed(2),
    };

    try {
      if (editingId !== null) {
        await api.patch(`/memberships/plans/${editingId}/`, payload);
        setNotice("Membership plan updated successfully.");
      } else {
        await api.post("/memberships/plans/", payload);
        setNotice("Membership plan created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...INITIAL_FORM });

      await loadPlans();
    } catch (err) {
      console.error("Failed to save membership plan:", err);
      setError(
        getErrorMessage(err, "Unable to save membership plan.")
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (plan) => {
    const nextActive = !plan.is_active;

    const confirmed = window.confirm(
      `${nextActive ? "Activate" : "Deactivate"} "${plan.name}"?`
    );

    if (!confirmed || actionId !== null) return;

    setActionId(plan.id);
    setError("");
    setNotice("");

    try {
      await api.patch(`/memberships/plans/${plan.id}/`, {
        is_active: nextActive,
      });

      setNotice(
        `"${plan.name}" ${nextActive ? "activated" : "deactivated"} successfully.`
      );

      await loadPlans();
    } catch (err) {
      console.error("Failed to change membership plan status:", err);
      setError(
        getErrorMessage(err, "Unable to change the plan status.")
      );
    } finally {
      setActionId(null);
    }
  };

  const deletePlan = async (plan) => {
    const confirmed = window.confirm(
      `Delete "${plan.name}" permanently? This action cannot be undone. If memberships already use this plan, the backend may prevent deletion.`
    );

    if (!confirmed || actionId !== null) return;

    setActionId(plan.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/memberships/plans/${plan.id}/`);

      setNotice(`"${plan.name}" deleted successfully.`);
      await loadPlans();
    } catch (err) {
      console.error("Failed to delete membership plan:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to delete this plan. It may already be linked to memberships."
        )
      );
    } finally {
      setActionId(null);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  return (
    <section className="admin-module">
      <div className="admin-module-header">
        <div>
          <h2>Membership Plans</h2>
          <p>Create and manage the plans offered by your gym.</p>
        </div>

        <button
          type="button"
          className="admin-module-primary"
          onClick={startCreate}
          disabled={saving}
        >
          + Add Plan
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
            {editingId !== null ? "Edit Plan" : "Create Membership Plan"}
          </h3>

          <div className="admin-module-form-grid">
            <label>
              Plan Name *
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="e.g. Premium Fitness"
                required
                maxLength={100}
              />
            </label>

            <label>
              Plan Type *
              <select
                name="plan_type"
                value={form.plan_type}
                onChange={updateField}
                required
              >
                {PLAN_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Duration (days) *
              <input
                type="number"
                name="duration_days"
                value={form.duration_days}
                onChange={updateField}
                min="1"
                step="1"
                required
              />
            </label>

            <label>
              Price (₹) *
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={updateField}
                min="0"
                step="0.01"
                required
              />
            </label>

            <label className="admin-module-full-width">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows="3"
                placeholder="Describe what this plan includes"
              />
            </label>

            <label className="admin-module-checkbox">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={updateField}
              />
              Available for new memberships
            </label>
          </div>

          <div className="admin-module-form-actions">
            <button
              type="button"
              className="admin-table-edit"
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
          <strong>{plans.filter((plan) => plan.is_active).length}</strong>
        </div>
        <div>
          <span>Inactive Plans </span>
          <strong>{plans.filter((plan) => !plan.is_active).length}</strong>
        </div>
      </div>

      <div className="admin-module-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search plans by name or description..."
          aria-label="Search membership plans"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter membership plans by status"
        >
          <option value="ALL">All plans</option>
          <option value="ACTIVE">Active only</option>
          <option value="INACTIVE">Inactive only</option>
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
              <th>Plan</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Loading membership plans...</td>
              </tr>
            ) : filteredPlans.length === 0 ? (
              <tr>
                <td colSpan="6">
                  {plans.length === 0
                    ? "No membership plans found. Add your first plan."
                    : "No plans match your search or status filter."}
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
                    {PLAN_TYPES.find(
                      (type) => type.value === plan.plan_type
                    )?.label || plan.plan_type}
                  </td>

                  <td>{plan.duration_days} days</td>
                  <td>{formatCurrency(plan.price)}</td>

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
                          ? "Working..."
                          : plan.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </button>

                      <button
                        type="button"
                        className="admin-module-secondary"
                        onClick={() => deletePlan(plan)}
                        disabled={actionId !== null || saving}
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

export default AdminMembershipPlans;
