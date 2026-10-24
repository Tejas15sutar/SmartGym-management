
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/MembershipPlanManagement.css";

const EMPTY_FORM = {
  name: "",
  plan_type: "MONTHLY",
  duration_days: "30",
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

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price || 0));
}

export default function MembershipPlanManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/memberships/plans/");
      const data = response.data;

      setPlans(
        Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : []
      );
    } catch (err) {
      console.error("Failed to load membership plans:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load membership plans. Please check your admin access."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAdd = () => {
    setError("");
    setNotice("");
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (plan) => {
    setError("");
    setNotice("");
    setEditingId(plan.id);
    setForm({
      name: plan.name || "",
      plan_type: plan.plan_type || "MONTHLY",
      duration_days: String(plan.duration_days ?? ""),
      price: String(plan.price ?? ""),
      description: plan.description || "",
      is_active: Boolean(plan.is_active),
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const duration = Number(form.duration_days);
    const price = Number(form.price);

    if (!form.name.trim()) {
      setError("Please enter a plan name.");
      return;
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      setError("Duration must be a positive whole number of days.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Please enter a valid price that is zero or greater.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      plan_type: form.plan_type,
      duration_days: duration,
      price: price.toFixed(2),
      description: form.description.trim(),
      is_active: form.is_active,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await api.patch(
          `/memberships/plans/${editingId}/`,
          payload
        );
        setNotice("Membership plan updated successfully.");
      } else {
        await api.post("/memberships/plans/", payload);
        setNotice("Membership plan created successfully.");
      }

      resetForm();
      await loadPlans();
    } catch (err) {
      console.error("Failed to save membership plan:", err);

      const data = err.response?.data;
      const firstFieldError =
        data && typeof data === "object"
          ? Object.entries(data).find(([key]) => key !== "detail")
          : null;

      setError(
        data?.detail ||
          (firstFieldError
            ? `${firstFieldError[0]}: ${
                Array.isArray(firstFieldError[1])
                  ? firstFieldError[1].join(" ")
                  : String(firstFieldError[1])
              }`
            : "Unable to save the plan. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    setError("");
    setNotice("");

    try {
      await api.patch(`/memberships/plans/${plan.id}/`, {
        is_active: !plan.is_active,
      });

      setNotice(
        `${plan.name} has been ${
          plan.is_active ? "deactivated" : "activated"
        }.`
      );

      await loadPlans();
    } catch (err) {
      console.error("Failed to update plan status:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to change the plan status."
      );
    }
  };

  const handleDelete = async (plan) => {
    const confirmed = window.confirm(
      `Delete "${plan.name}"? This action cannot be undone. Plans linked to existing memberships may be protected by the backend.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/memberships/plans/${plan.id}/`);

      setNotice(`"${plan.name}" was deleted successfully.`);
      await loadPlans();
    } catch (err) {
      console.error("Failed to delete membership plan:", err);

      const status = err.response?.status;

      setError(
        status === 403
          ? "You do not have permission to delete this plan."
          : status === 404
            ? "This plan was not found. Refresh the list and try again."
            : status === 500
              ? "The server could not delete this plan. It may be linked to existing memberships. Check the Django terminal for details."
              : err.response?.data?.detail ||
                "Unable to delete the plan. Please try again."
      );
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      plan.name?.toLowerCase().includes(query) ||
      plan.description?.toLowerCase().includes(query) ||
      plan.plan_type?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && plan.is_active) ||
      (statusFilter === "INACTIVE" && !plan.is_active);

    return matchesSearch && matchesStatus;
  });

  const activeCount = plans.filter((plan) => plan.is_active).length;

  return (
    <section className="membership-plans-module">
      <div className="mp-summary-grid">
        <article className="mp-summary-card">
          <span className="mp-summary-icon">◇</span>
          <div>
            <p>Total Plans</p>
            <strong>{loading ? "—" : plans.length}</strong>
          </div>
        </article>

        <article className="mp-summary-card">
          <span className="mp-summary-icon mp-icon-active">✓</span>
          <div>
            <p>Active Plans</p>
            <strong>{loading ? "—" : activeCount}</strong>
          </div>
        </article>

        <article className="mp-summary-card">
          <span className="mp-summary-icon mp-icon-inactive">Ⅱ</span>
          <div>
            <p>Inactive Plans</p>
            <strong>{loading ? "—" : plans.length - activeCount}</strong>
          </div>
        </article>
      </div>

      <div className="mp-toolbar">
        <div>
          <h2>Membership Plans</h2>
          <p>Create and manage your gym membership packages.</p>
        </div>

        <button
          type="button"
          className="mp-primary-button"
          onClick={handleAdd}
        >
          + Add Plan
        </button>
      </div>

      {error && (
        <div className="mp-message mp-error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="mp-message mp-success" role="status">
          {notice}
        </div>
      )}

      {showForm && (
        <form className="mp-form-card" onSubmit={handleSubmit}>
          <div className="mp-form-heading">
            <div>
              <h3>{editingId !== null ? "Edit Plan" : "Create New Plan"}</h3>
              <p>Enter the membership package details below.</p>
            </div>

            <button
              type="button"
              className="mp-close-button"
              onClick={resetForm}
              disabled={saving}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <div className="mp-form-grid">
            <label>
              Plan Name *
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Premium Monthly"
                maxLength={100}
                required
              />
            </label>

            <label>
              Plan Type *
              <select
                name="plan_type"
                value={form.plan_type}
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="e.g. 1499"
                required
              />
            </label>

            <label className="mp-full-width">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                placeholder="Describe the benefits included in this plan..."
              />
            </label>

            <label className="mp-checkbox-label mp-full-width">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Make this plan active and available for use
            </label>
          </div>

          <div className="mp-form-actions">
            <button
              type="button"
              className="mp-secondary-button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="mp-primary-button"
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

      <div className="mp-filter-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search plans..."
          aria-label="Search membership plans"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter plans by status"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active only</option>
          <option value="INACTIVE">Inactive only</option>
        </select>

        <button
          type="button"
          className="mp-secondary-button"
          onClick={loadPlans}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      <div className="mp-table-card">
        <div className="mp-table-scroll">
          <table className="mp-table">
            <thead>
              <tr>
                <th>Membership Plan</th>
                <th>Plan Type</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="mp-empty-state">
                    Loading membership plans...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan="6" className="mp-empty-state">
                    {plans.length === 0
                      ? "No membership plans found. Add your first plan."
                      : "No plans match your search or status filter."}
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <div className="mp-plan-name">{plan.name}</div>
                      <div className="mp-plan-description">
                        {plan.description || "No description provided"}
                      </div>
                    </td>

                    <td>
                      {PLAN_TYPES.find(
                        (type) => type.value === plan.plan_type
                      )?.label || plan.plan_type}
                    </td>

                    <td>{plan.duration_days} days</td>

                    <td className="mp-price">
                      {formatPrice(plan.price)}
                    </td>

                    <td>
                      <span
                        className={`mp-status ${
                          plan.is_active ? "is-active" : "is-inactive"
                        }`}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="mp-row-actions">
                        <button
                          type="button"
                          className="mp-edit-button"
                          onClick={() => handleEdit(plan)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="mp-toggle-button"
                          onClick={() => handleToggleStatus(plan)}
                        >
                          {plan.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          className="mp-delete-button"
                          onClick={() => handleDelete(plan)}
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
      </div>

      <p className="mp-footer-note">
        Plans linked to existing memberships may be protected from deletion
        by the backend.
      </p>
    </section>
  );
}
