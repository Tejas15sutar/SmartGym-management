
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminReports.css";

const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000)
    .toISOString()
    .slice(0, 10);

function getRows(response) {
    const data = response?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function money(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
}

function escapeCsv(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(rows) {
    const columns = [
        ["Member", (row) =>
            row.member_name ||
            row.member_details?.username ||
            row.member_username ||
            row.member ||
            "—"],
        ["Amount (INR)", (row) => row.amount ?? 0],
        ["Method", (row) => row.payment_method || "—"],
        ["Status", (row) => row.payment_status || "—"],
        ["Transaction ID", (row) => row.transaction_id || "—"],
        ["Payment Date", (row) => row.payment_date || row.created_at || "—"],
    ];

    const csv = [
        columns.map(([heading]) => escapeCsv(heading)).join(","),
        ...rows.map((row) =>
            columns.map(([, getter]) => escapeCsv(getter(row))).join(",")
        ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `smartgym-payments-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function getMemberLabel(payment) {
    return (
        payment.member_name ||
        payment.member_details?.username ||
        payment.member_username ||
        (typeof payment.member === "object"
            ? payment.member.username || payment.member.email
            : null) ||
        (payment.member ? `Member #${payment.member}` : "Unknown member")
    );
}

function AdminReports() {
    const [stats, setStats] = useState(null);
    const [memberships, setMemberships] = useState([]);
    const [payments, setPayments] = useState([]);
    const [fromDate, setFromDate] = useState(thirtyDaysAgo);
    const [toDate, setToDate] = useState(today);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    const loadReports = useCallback(async () => {
        setLoading(true);
        setErrors([]);

        const requests = await Promise.allSettled([
            api.get("/auth/admin-dashboard/stats/"),
            api.get("/memberships/records/"),
            api.get("/payments/records/"),
        ]);

        const nextErrors = [];

        if (requests[0].status === "fulfilled") {
            setStats(requests[0].value.data);
        } else {
            nextErrors.push("Dashboard statistics could not be loaded.");
        }

        if (requests[1].status === "fulfilled") {
            setMemberships(getRows(requests[1].value));
        } else {
            setMemberships([]);
            nextErrors.push("Membership records could not be loaded.");
        }

        if (requests[2].status === "fulfilled") {
            setPayments(getRows(requests[2].value));
        } else {
            setPayments([]);
            nextErrors.push("Payment records could not be loaded.");
        }

        setErrors(nextErrors);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const validRange =
        (!fromDate || !toDate || fromDate <= toDate);

    const filteredPayments = useMemo(() => {
        return payments.filter((payment) => {
            const rawDate = payment.payment_date || payment.created_at;
            if (!rawDate) return !fromDate && !toDate;

            const date = String(rawDate).slice(0, 10);

            return (
                (!fromDate || date >= fromDate) &&
                (!toDate || date <= toDate)
            );
        });
    }, [payments, fromDate, toDate]);

    const filteredMemberships = useMemo(() => {
        return memberships.filter((membership) => {
            const rawDate = membership.created_at || membership.start_date;
            if (!rawDate) return true;

            const date = String(rawDate).slice(0, 10);

            return (
                (!fromDate || date >= fromDate) &&
                (!toDate || date <= toDate)
            );
        });
    }, [memberships, fromDate, toDate]);

    const successfulPayments = filteredPayments.filter(
        (payment) => payment.payment_status === "SUCCESSFUL"
    );

    const totalRevenue = successfulPayments.reduce(
        (total, payment) => total + (Number(payment.amount) || 0),
        0
    );

    const pendingPayments = filteredPayments.filter(
        (payment) => payment.payment_status === "PENDING"
    );

    const failedPayments = filteredPayments.filter(
        (payment) => payment.payment_status === "FAILED"
    );

    const membershipCounts = useMemo(() => {
        const counts = {
            ACTIVE: 0,
            PENDING: 0,
            EXPIRED: 0,
            CANCELLED: 0,
        };

        const currentDate = new Date().toISOString().slice(0, 10);

        filteredMemberships.forEach((membership) => {
            let status = membership.status || "PENDING";

            if (
                status === "ACTIVE" &&
                membership.end_date &&
                membership.end_date < currentDate
            ) {
                status = "EXPIRED";
            }

            if (status in counts) counts[status] += 1;
        });

        return counts;
    }, [filteredMemberships]);

    const monthlyRevenue = useMemo(() => {
        const months = [];

        for (let offset = 5; offset >= 0; offset--) {
            const date = new Date();
            date.setDate(1);
            date.setMonth(date.getMonth() - offset);

            const year = date.getFullYear();
            const month = date.getMonth();

            months.push({
                key: `${year}-${String(month + 1).padStart(2, "0")}`,
                label: date.toLocaleDateString("en-IN", {
                    month: "short",
                }),
                amount: 0,
            });
        }

        successfulPayments.forEach((payment) => {
            const rawDate = payment.payment_date || payment.created_at;
            if (!rawDate) return;

            const date = new Date(rawDate);
            if (Number.isNaN(date.getTime())) return;

            const key = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

            const month = months.find((item) => item.key === key);
            if (month) month.amount += Number(payment.amount) || 0;
        });

        return months;
    }, [successfulPayments]);

    const maximumRevenue = Math.max(
        ...monthlyRevenue.map((month) => month.amount),
        1
    );

    const activeMemberships = membershipCounts.ACTIVE;
    const totalMembers = stats?.total_members ?? "—";
    const activeCount = stats?.active_memberships ?? activeMemberships;

    return (
        <section className="admin-reports">
            <header className="reports-header">
                <div>
                    <span className="reports-eyebrow">SMARTGYM ANALYTICS</span>
                    <h2>Reports &amp; Analytics</h2>
                    <p>
                        Understand your gym's revenue, memberships, and
                        payment activity.
                    </p>
                </div>

                <button
                    type="button"
                    className="reports-refresh"
                    onClick={loadReports}
                    disabled={loading}
                >
                    {loading ? "Refreshing..." : "↻ Refresh"}
                </button>
            </header>

            <div className="reports-filter-panel">
                <div className="reports-filter-heading">
                    <div>
                        <strong>Report period</strong>
                        <span>Filter records by date</span>
                    </div>
                    <button
                        type="button"
                        className="reports-reset"
                        onClick={() => {
                            setFromDate("");
                            setToDate("");
                        }}
                    >
                        All dates
                    </button>
                </div>

                <div className="reports-date-controls">
                    <label>
                        From
                        <input
                            type="date"
                            value={fromDate}
                            max={toDate || undefined}
                            onChange={(event) => setFromDate(event.target.value)}
                        />
                    </label>

                    <label>
                        To
                        <input
                            type="date"
                            value={toDate}
                            min={fromDate || undefined}
                            max={today}
                            onChange={(event) => setToDate(event.target.value)}
                        />
                    </label>

                    <button
                        type="button"
                        className="reports-export"
                        disabled={loading || filteredPayments.length === 0}
                        onClick={() => downloadCsv(filteredPayments)}
                    >
                        ↓ Export CSV
                    </button>
                </div>

                {!validRange && (
                    <p className="reports-error">
                        The start date must be before the end date.
                    </p>
                )}
            </div>

            {errors.length > 0 && (
                <div className="reports-error-panel">
                    {errors.map((error) => (
                        <p key={error}>{error}</p>
                    ))}
                    <span>
                        Check the browser console and Django server output
                        if an endpoint fails.
                    </span>
                </div>
            )}

            {loading ? (
                <div className="reports-loading">
                    <span className="reports-spinner" />
                    Loading your reports...
                </div>
            ) : (
                <>
                    <div className="reports-stat-grid">
                        <article className="reports-stat-card">
                            <div className="reports-stat-top">
                                <span>Total Members</span>
                                <span className="reports-stat-icon purple">
                                    ♙
                                </span>
                            </div>
                            <strong>{totalMembers}</strong>
                            <small>Registered gym members</small>
                        </article>

                        <article className="reports-stat-card">
                            <div className="reports-stat-top">
                                <span>Active Memberships</span>
                                <span className="reports-stat-icon green">
                                    ✓
                                </span>
                            </div>
                            <strong>{activeCount}</strong>
                            <small>Currently active per dashboard stats</small>
                        </article>

                        <article className="reports-stat-card">
                            <div className="reports-stat-top">
                                <span>Successful Revenue</span>
                                <span className="reports-stat-icon orange">
                                    ₹
                                </span>
                            </div>
                            <strong>{money(totalRevenue)}</strong>
                            <small>Successful payments in selected period</small>
                        </article>

                        <article className="reports-stat-card">
                            <div className="reports-stat-top">
                                <span>Pending Payments</span>
                                <span className="reports-stat-icon blue">
                                    ◷
                                </span>
                            </div>
                            <strong>{money(
                                pendingPayments.reduce(
                                    (sum, payment) =>
                                        sum + (Number(payment.amount) || 0),
                                    0
                                )
                            )}</strong>
                            <small>{pendingPayments.length} pending transactions</small>
                        </article>
                    </div>

                    <div className="reports-content-grid">
                        <article className="reports-panel reports-revenue-panel">
                            <div className="reports-panel-header">
                                <div>
                                    <h3>Revenue overview</h3>
                                    <p>Successful payments over the last six months</p>
                                </div>
                                <strong>{money(totalRevenue)}</strong>
                            </div>

                            <div className="reports-chart">
                                {monthlyRevenue.map((month) => (
                                    <div
                                        className="reports-chart-column"
                                        key={month.key}
                                    >
                                        <span className="reports-bar-value">
                                            {month.amount >= 1000
                                                ? `₹${(month.amount / 1000).toFixed(1)}k`
                                                : `₹${month.amount.toFixed(0)}`}
                                        </span>
                                        <div className="reports-bar-track">
                                            <div
                                                className="reports-bar"
                                                style={{
                                                    height: `${Math.max(
                                                        (month.amount / maximumRevenue) * 100,
                                                        2
                                                    )}%`,
                                                }}
                                                title={`${month.label}: ${money(month.amount)}`}
                                            />
                                        </div>
                                        <span className="reports-bar-label">
                                            {month.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="reports-chart-note">
                                The chart uses the six latest calendar months.
                                The revenue card and payment table follow your
                                selected date range.
                            </p>
                        </article>

                        <article className="reports-panel">
                            <div className="reports-panel-header">
                                <div>
                                    <h3>Membership breakdown</h3>
                                    <p>Membership records in the selected period</p>
                                </div>
                            </div>

                            <div className="reports-membership-list">
                                {[
                                    ["ACTIVE", "Active", "green"],
                                    ["PENDING", "Pending", "orange"],
                                    ["EXPIRED", "Expired", "purple"],
                                    ["CANCELLED", "Cancelled", "gray"],
                                ].map(([key, label, color]) => {
                                    const count = membershipCounts[key];
                                    const total = filteredMemberships.length;
                                    const percentage = total
                                        ? (count / total) * 100
                                        : 0;

                                    return (
                                        <div
                                            className="reports-membership-item"
                                            key={key}
                                        >
                                            <div className="reports-membership-row">
                                                <span>
                                                    <i className={`reports-dot ${color}`} />
                                                    {label}
                                                </span>
                                                <strong>{count}</strong>
                                            </div>
                                            <div className="reports-progress-track">
                                                <div
                                                    className={`reports-progress-fill ${color}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="reports-membership-footer">
                                <span>Total filtered records</span>
                                <strong>{filteredMemberships.length}</strong>
                            </div>
                        </article>
                    </div>

                    <article className="reports-panel reports-payments-panel">
                        <div className="reports-panel-header reports-payments-heading">
                            <div>
                                <h3>Payment activity</h3>
                                <p>
                                    {filteredPayments.length} transactions
                                    {" "}in the selected period
                                </p>
                            </div>
                            <div className="reports-payment-summary">
                                <span className="successful-text">
                                    {successfulPayments.length} successful
                                </span>
                                <span className="failed-text">
                                    {failedPayments.length} failed
                                </span>
                            </div>
                        </div>

                        {filteredPayments.length === 0 ? (
                            <div className="reports-empty">
                                <span>₹</span>
                                <strong>No payment records found</strong>
                                <p>
                                    Try selecting a different date range or
                                    add payment records first.
                                </p>
                            </div>
                        ) : (
                            <div className="reports-table-wrap">
                                <table className="reports-table">
                                    <thead>
                                        <tr>
                                            <th>Member</th>
                                            <th>Transaction ID</th>
                                            <th>Date</th>
                                            <th>Method</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...filteredPayments]
                                            .sort((a, b) =>
                                                String(
                                                    b.payment_date || b.created_at || ""
                                                ).localeCompare(
                                                    String(
                                                        a.payment_date ||
                                                        a.created_at ||
                                                        ""
                                                    )
                                                )
                                            )
                                            .slice(0, 10)
                                            .map((payment, index) => (
                                                <tr
                                                    key={
                                                        payment.id ??
                                                        payment.transaction_id ??
                                                        index
                                                    }
                                                >
                                                    <td>
                                                        <strong>
                                                            {getMemberLabel(payment)}
                                                        </strong>
                                                    </td>
                                                    <td>
                                                        {payment.transaction_id || "—"}
                                                    </td>
                                                    <td>
                                                        {formatDate(
                                                            payment.payment_date ||
                                                            payment.created_at
                                                        )}
                                                    </td>
                                                    <td>
                                                        {payment.payment_method || "—"}
                                                    </td>
                                                    <td className="reports-amount">
                                                        {money(payment.amount)}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`reports-status ${
                                                                payment.payment_status === "SUCCESSFUL"
                                                                    ? "success"
                                                                    : payment.payment_status === "FAILED"
                                                                        ? "failed"
                                                                        : "pending"
                                                            }`}
                                                        >
                                                            {payment.payment_status || "UNKNOWN"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </article>

                    <footer className="reports-footer">
                        <span>
                            Report data comes from your SmartGym Django API.
                        </span>
                        <span>
                            {filteredPayments.length} payments ·{" "}
                            {filteredMemberships.length} memberships
                        </span>
                    </footer>
                </>
            )}
        </section>
    );
}

export default AdminReports;
