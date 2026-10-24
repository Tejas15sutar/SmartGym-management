
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminDashboardModules.css";

function getErrorMessage(err, fallback) {
  const data = err.response?.data;

  if (typeof data === "string") return data;

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

function getDisplayName(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "object") {
    return (
      value.username ||
      value.name ||
      value.email ||
      (value.id ? `#${value.id}` : "—")
    );
  }

  return String(value);
}

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/payments/records/");
      const data = response.data;

      setPayments(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : []
      );
    } catch (err) {
      console.error("Failed to load payments:", err);
      setError(
        getErrorMessage(
          err,
          "Unable to load payments. Check your admin access and API."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const getMember = (payment) =>
    getDisplayName(
      payment.member_name ??
        payment.member_details ??
        payment.member
    );

  const getMembership = (payment) =>
    getDisplayName(
      payment.membership_name ??
        payment.membership_details ??
        payment.membership
    );

  const getStatus = (payment) =>
    String(payment.status || "UNKNOWN").toUpperCase();

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !term ||
        getMember(payment).toLowerCase().includes(term) ||
        String(payment.transaction_id || "").toLowerCase().includes(term) ||
        String(payment.id).includes(term) ||
        String(payment.payment_method || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        getStatus(payment) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const confirmPayment = async (payment) => {
    if (getStatus(payment) !== "PENDING" || actionId !== null) return;

    const confirmed = window.confirm(
      `Confirm payment #${payment.id} for ${formatCurrency(payment.amount)}?`
    );

    if (!confirmed) return;

    setActionId(payment.id);
    setError("");
    setNotice("");

    try {
      await api.post(`/payments/records/${payment.id}/confirm/`);

      setNotice(`Payment #${payment.id} confirmed successfully.`);
      await loadPayments();
    } catch (err) {
      console.error("Failed to confirm payment:", err);
      setError(
        getErrorMessage(
          err,
          "Unable to confirm this payment. Please check its current status."
        )
      );
    } finally {
      setActionId(null);
    }
  };

  const totalAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const successfulPayments = payments.filter((payment) =>
    ["SUCCESS", "SUCCESSFUL", "COMPLETED", "CONFIRMED"].includes(
      getStatus(payment)
    )
  );

  const pendingPayments = payments.filter(
    (payment) => getStatus(payment) === "PENDING"
  );

  const successfulAmount = successfulPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  return (
    <section className="admin-module">
      <div className="admin-module-header">
        <div>
          <h2>Payments</h2>
          <p>Review transactions and manage pending payment confirmations.</p>
        </div>

        <button
          type="button"
          className="admin-module-primary"
          onClick={loadPayments}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
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

      <div className="admin-module-summary">
        <div>
          <span>Total Transactions </span>
          <strong>{payments.length}</strong>
        </div>
        <div>
          <span>Pending Payments </span>
          <strong>{pendingPayments.length}</strong>
        </div>
        <div>
          <span>Successful Revenue </span>
          <strong>{formatCurrency(successfulAmount)}</strong>
        </div>
        <div>
          <span>All Payment Amounts </span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </div>
      </div>

      <div className="admin-module-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search member, transaction ID, or payment method..."
          aria-label="Search payments"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter payments by status"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="admin-module-table-wrap">
        <table className="admin-module-table">
          <thead>
            <tr>
              <th>Payment</th>
              <th>Member</th>
              <th>Membership</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9">Loading payment records...</td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="9">
                  {payments.length === 0
                    ? "No payment records found."
                    : "No payments match your search or status filter."}
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => {
                const status = getStatus(payment);
                const isPending = status === "PENDING";

                return (
                  <tr key={payment.id}>
                    <td>
                      <strong>#{payment.id}</strong>
                    </td>

                    <td>{getMember(payment)}</td>

                    <td>{getMembership(payment)}</td>

                    <td>
                      <strong>{formatCurrency(payment.amount)}</strong>
                    </td>

                    <td>
                      {String(payment.payment_method || "—").replace(
                        /_/g,
                        " "
                      )}
                    </td>

                    <td>
                      {payment.transaction_id || "—"}
                    </td>

                    <td>
                      {formatDate(
                        payment.created_at ||
                          payment.payment_date ||
                          payment.date
                      )}
                    </td>

                    <td>
                      <span
                        className={`admin-module-status ${
                          ["SUCCESS", "SUCCESSFUL", "COMPLETED", "CONFIRMED"].includes(
                            status
                          )
                            ? "active"
                            : ["FAILED", "CANCELLED"].includes(status)
                              ? "inactive"
                              : "pending"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td>
                      {isPending ? (
                        <button
                          type="button"
                          className="admin-module-primary"
                          onClick={() => confirmPayment(payment)}
                          disabled={actionId !== null}
                        >
                          {actionId === payment.id
                            ? "Confirming..."
                            : "Confirm"}
                        </button>
                      ) : (
                        <span className="admin-module-muted">
                          No action
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminPayments;
