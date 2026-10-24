import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboardModules.css";

const ROLE_BY_SECTION = {
  Members: "MEMBER",
  Trainers: "TRAINER",
  Receptionists: "RECEPTIONIST",
};

const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
};

export default function AdminUserManagement({ section }) {
  const role = ROLE_BY_SECTION[section];
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/auth/admin-users/?role=${role}`);
      const data = response.data;
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load accounts. Check your admin access and API."
      );
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function startEdit(user) {
    setEditingId(user.id);
    setForm({
      username: user.username || "",
      email: user.email || "",
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveUser(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = { ...form, role };
    if (!payload.password) delete payload.password;

    try {
      if (editingId) {
        await api.patch(`/auth/admin-users/${editingId}/`, payload);
        setNotice("Account updated successfully.");
      } else {
        await api.post("/auth/admin-users/", payload);
        setNotice("Account created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadUsers();
    } catch (err) {
      const data = err.response?.data;
      const message =
        typeof data === "string"
          ? data
          : data
            ? Object.entries(data)
                .map(([field, messages]) =>
                  `${field}: ${
                    Array.isArray(messages)
                      ? messages.join(", ")
                      : typeof messages === "string"
                        ? messages
                        : JSON.stringify(messages)
                  }`
                )
                .join(" | ")
            : "Unable to save the account. Please try again.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAccount(user) {
    const action = user.is_active ? "deactivate" : "activate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.username}?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await api.patch(`/auth/admin-users/${user.id}/`, {
        is_active: !user.is_active,
      });
      setNotice(`Account ${action}d successfully.`);
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.detail || `Unable to ${action} this account.`
      );
    }
  }

  return (
    <section className="admin-module">
      <div className="admin-module-toolbar">
        <div>
          <h2>{section} Management</h2>
          <p>View, create and manage {section.toLowerCase()} accounts.</p>
        </div>
        <div className="admin-module-actions">
          <button
            type="button"
            className="admin-module-secondary"
            onClick={loadUsers}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            type="button"
            className="admin-module-primary"
            onClick={startCreate}
          >
            + Add {section === "Receptionists" ? "Receptionist" : section.slice(0, -1)}
          </button>
        </div>
      </div>

      {error && <div className="admin-module-error" role="alert">{error}</div>}
      {notice && <div className="admin-module-notice" role="status">{notice}</div>}

      {showForm && (
        <form className="admin-module-form" onSubmit={saveUser}>
          <div className="admin-form-heading">
            <h3>{editingId ? "Edit Account" : "Create Account"}</h3>
            <button
              type="button"
              className="admin-module-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>

          <div className="admin-form-grid">
            <label>
              Username *
              <input
                name="username"
                value={form.username}
                onChange={updateField}
                required
                autoComplete="off"
              />
            </label>
            <label>
              Email *
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                required
              />
            </label>
            <label>
              First Name
              <input name="first_name" value={form.first_name} onChange={updateField} />
            </label>
            <label>
              Last Name
              <input name="last_name" value={form.last_name} onChange={updateField} />
            </label>
            <label>
              Phone
              <input name="phone" type="tel" value={form.phone} onChange={updateField} />
            </label>
            <label>
              {editingId ? "New Password (optional)" : "Password *"}
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                required={!editingId}
                minLength={8}
                autoComplete="new-password"
                placeholder={editingId ? "Leave blank to keep current password" : "At least 8 characters"}
              />
            </label>
          </div>

          <div className="admin-form-footer">
            <span>Account role: <strong>{role}</strong></span>
            <button type="submit" className="admin-module-primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Account"}
            </button>
          </div>
        </form>
      )}

      <div className="admin-module-table-wrap">
        <table className="admin-module-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5">Loading accounts...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5">No {section.toLowerCase()} accounts found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>
                      {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username}
                    </strong>
                    <small className="admin-table-subtext">@{user.username}</small>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone || "—"}</td>
                  <td>
                    <span className={`admin-account-status ${user.is_active ? "is-active" : "is-inactive"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" className="admin-table-edit" onClick={() => startEdit(user)}>
                        Edit
                      </button>
                      <button type="button" className="admin-table-toggle" onClick={() => toggleAccount(user)}>
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="admin-module-footnote">
        Deactivated accounts are retained in the database. This screen does not permanently delete users or their membership/payment history.
      </p>
    </section>
  );
}
