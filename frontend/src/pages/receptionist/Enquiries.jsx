
import { useCallback, useEffect, useState } from "react";
import {
    Search,
    Plus,
    Users,
    Phone,
    Mail,
    CalendarDays,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    PhoneCall,
    UserCheck,
    CalendarCheck,
} from "lucide-react";

import receptionistService from "../../services/receptionistService";
import "../../styles/Enquiries.css";

const STATUS_OPTIONS = [
    { value: "NEW", label: "New" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "VISIT_SCHEDULED", label: "Visit Scheduled" },
    { value: "CONVERTED", label: "Converted" },
    { value: "NOT_INTERESTED", label: "Not Interested" },
];

const EMPTY_FORM = {
    name: "",
    phone: "",
    email: "",
    interested_plan: "",
    status: "NEW",
    follow_up_date: "",
    notes: "",
};

const Enquiries = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    // Load enquiries
    const loadEnquiries = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await receptionistService.getEnquiries({
                ...(search.trim() ? { search: search.trim() } : {}),
                ...(statusFilter ? { status: statusFilter } : {}),
            });

            setEnquiries(response.results || response);
        } catch (err) {
            console.error("Unable to load enquiries:", err);
            setError(
                err.response?.data?.detail ||
                "Unable to load enquiries. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        loadEnquiries();
    }, [loadEnquiries]);

    // Add enquiry
    const openAddForm = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setError("");
        setSuccess("");
        setShowForm(true);
    };

    // Edit enquiry
    const openEditForm = (enquiry) => {
        setEditingId(enquiry.id);

        setForm({
            name: enquiry.name || "",
            phone: enquiry.phone || "",
            email: enquiry.email || "",
            interested_plan: enquiry.interested_plan || "",
            status: enquiry.status || "NEW",
            follow_up_date: enquiry.follow_up_date || "",
            notes: enquiry.notes || "",
        });

        setError("");
        setSuccess("");
        setShowForm(true);
    };

    // Close modal
    const closeForm = () => {
        if (saving) return;

        setShowForm(false);
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
    };

    // Handle form inputs
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Create or update enquiry
    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!form.name.trim() || !form.phone.trim()) {
            setError("Name and phone number are required.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ...form,
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || null,
                interested_plan: form.interested_plan.trim(),
                notes: form.notes.trim(),
                follow_up_date: form.follow_up_date || null,
            };

            if (editingId) {
                await receptionistService.updateEnquiry(
                    editingId,
                    payload
                );

                setSuccess("Enquiry updated successfully.");
            } else {
                await receptionistService.createEnquiry(payload);

                setSuccess("Enquiry created successfully.");
            }

            setShowForm(false);
            setEditingId(null);
            setForm({ ...EMPTY_FORM });

            await loadEnquiries();
        } catch (err) {
            console.error("Unable to save enquiry:", err);

            const data = err.response?.data;

            const fieldError = data && Object.entries(data)
                .find(([, value]) => Array.isArray(value));

            setError(
                fieldError
                    ? `${fieldError[0]}: ${fieldError[1][0]}`
                    : data?.detail || "Unable to save enquiry."
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete enquiry
    const handleDelete = async (enquiry) => {
        const confirmed = window.confirm(
            `Delete the enquiry for ${enquiry.name}? This cannot be undone.`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            await receptionistService.deleteEnquiry(enquiry.id);

            setSuccess("Enquiry deleted successfully.");

            await loadEnquiries();
        } catch (err) {
            console.error("Unable to delete enquiry:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to delete enquiry."
            );
        }
    };

    // Status label
    const statusLabel = (status) =>
        STATUS_OPTIONS.find((item) => item.value === status)?.label ||
        status;

    // Calculate enquiry counts
    const counts = STATUS_OPTIONS.reduce((result, status) => {
        result[status.value] = enquiries.filter(
            (item) => item.status === status.value
        ).length;

        return result;
    }, {});

    return (
        <main className="enquiries-page">

            {/* Header */}
            <header className="enquiries-header">
                <div>
                    <span className="enquiries-eyebrow">
                        RECEPTIONIST WORKSPACE
                    </span>

                    <h1>Enquiries</h1>

                    <p>
                        Manage potential members, follow-ups and joining
                        opportunities.
                    </p>
                </div>

                <button
                    className="enquiries-primary-btn"
                    type="button"
                    onClick={openAddForm}
                >
                    <Plus size={18} />
                    Add Enquiry
                </button>
            </header>

            {/* Error message */}
            {error && !showForm && (
                <div className="enquiries-alert enquiries-alert-error">
                    {error}
                </div>
            )}

            {/* Success message */}
            {success && (
                <div className="enquiries-alert enquiries-alert-success">
                    {success}

                    <button
                        type="button"
                        aria-label="Dismiss message"
                        onClick={() => setSuccess("")}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Statistics */}
            <section className="enquiries-stat-grid">

                <article className="enquiries-stat-card">
                    <span>Total Results</span>
                    <strong>{enquiries.length}</strong>
                    <Users size={21} />
                </article>

                <article className="enquiries-stat-card">
                    <span>New Enquiries</span>
                    <strong>{counts.NEW || 0}</strong>
                    <PhoneCall size={21} />
                </article>

                <article className="enquiries-stat-card">
                    <span>Contacted</span>
                    <strong>{counts.CONTACTED || 0}</strong>
                    <UserCheck size={21} />
                </article>

                <article className="enquiries-stat-card">
                    <span>Visits Scheduled</span>
                    <strong>{counts.VISIT_SCHEDULED || 0}</strong>
                    <CalendarCheck size={21} />
                </article>

            </section>

            {/* Enquiries panel */}
            <section className="enquiries-panel">

                {/* Search and filters */}
                <div className="enquiries-toolbar">

                    <div className="enquiries-search">
                        <Search size={19} />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search name, phone or email..."
                            aria-label="Search enquiries"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                        aria-label="Filter by status"
                    >
                        <option value="">All statuses</option>

                        {STATUS_OPTIONS.map((item) => (
                            <option
                                key={item.value}
                                value={item.value}
                            >
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="enquiries-refresh-btn"
                        onClick={loadEnquiries}
                        disabled={loading}
                        aria-label="Refresh enquiries"
                    >
                        <RefreshCw size={17} />
                    </button>

                </div>

                {/* Loading state */}
                {loading ? (
                    <div className="enquiries-empty">
                        <RefreshCw size={28} />
                        <h3>Loading enquiries...</h3>
                    </div>

                ) : enquiries.length === 0 ? (

                    /* Empty state */
                    <div className="enquiries-empty">
                        <Users size={34} />

                        <h3>No enquiries found</h3>

                        <p>
                            Add a new enquiry or change your search filters.
                        </p>

                        <button
                            type="button"
                            className="enquiries-primary-btn"
                            onClick={openAddForm}
                        >
                            <Plus size={17} />
                            Add First Enquiry
                        </button>
                    </div>

                ) : (

                    /* Enquiries table */
                    <div className="enquiries-table-wrap">

                        <table className="enquiries-table">

                            <thead>
                                <tr>
                                    <th>Prospective Member</th>
                                    <th>Interested In</th>
                                    <th>Status</th>
                                    <th>Follow-up</th>
                                    <th>Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {enquiries.map((item) => (
                                    <tr key={item.id}>

                                        <td>
                                            <div className="enquiries-person">

                                                <div className="enquiries-avatar">
                                                    {(item.name || "?")
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <strong>{item.name}</strong>

                                                    <span>
                                                        <Phone size={13} />
                                                        {item.phone}
                                                    </span>

                                                    {item.email && (
                                                        <span>
                                                            <Mail size={13} />
                                                            {item.email}
                                                        </span>
                                                    )}
                                                </div>

                                            </div>
                                        </td>

                                        <td>
                                            {item.interested_plan || "—"}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    `enquiries-status status-${(
                                                        item.status || "new"
                                                    ).toLowerCase()}`
                                                }
                                            >
                                                {statusLabel(item.status)}
                                            </span>
                                        </td>

                                        <td>
                                            {item.follow_up_date ? (
                                                <span className="enquiries-follow-up">
                                                    <CalendarDays size={15} />
                                                    {item.follow_up_date}
                                                </span>
                                            ) : "—"}
                                        </td>

                                        <td>
                                            <span
                                                className="enquiries-notes"
                                                title={item.notes || ""}
                                            >
                                                {item.notes || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="enquiries-row-actions">

                                                <button
                                                    type="button"
                                                    title="Edit enquiry"
                                                    aria-label={`Edit ${item.name}`}
                                                    onClick={() =>
                                                        openEditForm(item)
                                                    }
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="enquiries-delete-btn"
                                                    title="Delete enquiry"
                                                    aria-label={`Delete ${item.name}`}
                                                    onClick={() =>
                                                        handleDelete(item)
                                                    }
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}

            </section>

            {/* Add / Edit Enquiry Modal */}
            {showForm && (
                <div
                    className="enquiries-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeForm();
                        }
                    }}
                >

                    <section
                        className="enquiries-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="enquiries-form-title"
                    >

                        {/* Modal header */}
                        <header className="enquiries-modal-header">

                            <div>
                                <h2 id="enquiries-form-title">
                                    {editingId ? "Edit Enquiry" : "Add Enquiry"}
                                </h2>

                                <p>
                                    Keep prospective member details and
                                    follow-up information up to date.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="enquiries-modal-close"
                                onClick={closeForm}
                                disabled={saving}
                                aria-label="Close form"
                            >
                                <X size={20} />
                            </button>

                        </header>

                        {/* Form error */}
                        {error && (
                            <div className="enquiries-alert enquiries-alert-error">
                                {error}
                            </div>
                        )}

                        {/* Enquiry form */}
                        <form
                            className="enquiries-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="enquiries-form-grid">

                                <label>
                                    Full Name *

                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                        maxLength={150}
                                        required
                                        disabled={saving}
                                    />
                                </label>

                                <label>
                                    Phone Number *

                                    <input
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={handleInputChange}
                                        placeholder="Enter phone number"
                                        maxLength={15}
                                        required
                                        disabled={saving}
                                    />
                                </label>

                                <label>
                                    Email Address

                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleInputChange}
                                        placeholder="name@example.com"
                                        disabled={saving}
                                    />
                                </label>

                                <label>
                                    Interested Plan

                                    <input
                                        name="interested_plan"
                                        value={form.interested_plan}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Monthly Membership"
                                        maxLength={100}
                                        disabled={saving}
                                    />
                                </label>

                                <label>
                                    Enquiry Status

                                    <select
                                        name="status"
                                        value={form.status}
                                        onChange={handleInputChange}
                                        disabled={saving}
                                    >
                                        {STATUS_OPTIONS.map((item) => (
                                            <option
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Next Follow-up

                                    <input
                                        name="follow_up_date"
                                        type="date"
                                        value={form.follow_up_date}
                                        onChange={handleInputChange}
                                        disabled={saving}
                                    />
                                </label>

                                <label className="enquiries-full-width">
                                    Notes

                                    <textarea
                                        name="notes"
                                        value={form.notes}
                                        onChange={handleInputChange}
                                        placeholder="Record the conversation, preferences or next steps..."
                                        rows={4}
                                        disabled={saving}
                                    />
                                </label>

                            </div>

                            {/* Form actions */}
                            <footer className="enquiries-form-actions">

                                <button
                                    type="button"
                                    className="enquiries-secondary-btn"
                                    onClick={closeForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="enquiries-primary-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Save Changes"
                                            : "Create Enquiry"}
                                </button>

                            </footer>

                        </form>

                    </section>
                </div>
            )}

        </main>
    );
};

export default Enquiries;
