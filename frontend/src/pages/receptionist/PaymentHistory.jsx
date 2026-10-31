
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Download,
    Eye,
    IndianRupee,
    Search,
    X,
    XCircle,
} from "lucide-react";

import api from "../../services/api";
import paymentService from "../../services/paymentService";
import membershipService from "../../services/membershipService";
import receptionistService from "../../services/receptionistService";
import "../../styles/PaymentHistory.css";
const PaymentHistory = () => {
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [members, setMembers] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [plans, setPlans] = useState([]);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [methodFilter, setMethodFilter] = useState("ALL");

    const [selectedPayment, setSelectedPayment] = useState(null);

    // PDF receipt download state
    const [downloadingPaymentId, setDownloadingPaymentId] = useState(null);
    const [receiptError, setReceiptError] = useState("");
    const [confirmingPaymentId, setConfirmingPaymentId] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    const getListData = (data) => {
        return data?.results || data || [];
    };

    const getMember = (memberId) => {
        return members.find(
            (member) => Number(member.id) === Number(memberId)
        );
    };

    const getMemberName = (memberId) => {
        const member = getMember(memberId);

        if (!member) {
            return `Member #${memberId || "-"}`;
        }

        const fullName =
            `${member.first_name || ""} ${member.last_name || ""}`.trim();

        return fullName || member.username || `Member #${member.id}`;
    };

    const getMemberUsername = (memberId) => {
        return getMember(memberId)?.username || "";
    };

    const getMembership = (membershipId) => {
        return memberships.find(
            (membership) =>
                Number(membership.id) === Number(membershipId)
        );
    };

    const getPlanName = (membershipId) => {
        const membership = getMembership(membershipId);

        if (!membership) {
            return `Membership #${membershipId || "-"}`;
        }

        if (membership.plan_name) {
            return membership.plan_name;
        }

        if (membership.plan?.name) {
            return membership.plan.name;
        }

        const planId =
            typeof membership.plan === "object"
                ? membership.plan?.id
                : membership.plan;

        const plan = plans.find(
            (item) => Number(item.id) === Number(planId)
        );

        return plan?.name || `Plan #${planId || "-"}`;
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatAmount = (amount) => {
        return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const [
                paymentResponse,
                memberResponse,
                membershipResponse,
                planResponse,
            ] = await Promise.all([
                paymentService.getPayments(),
                receptionistService.getMembers(),
                membershipService.getMemberships(),
                membershipService.getMembershipPlans(),
            ]);

            setPayments(
                getListData(paymentResponse).map((payment) => ({
                    ...payment,
                    status: payment.payment_status ?? payment.status ?? "PENDING",
                    method: payment.payment_method ?? payment.method ?? "",
                }))
            );
            setMembers(getListData(memberResponse));
            setMemberships(getListData(membershipResponse));
            setPlans(getListData(planResponse));
        } catch (error) {
            console.error("Unable to load payment history:", error);
            setErrorMessage(
                error.response?.data?.detail ||
                    "Unable to load payment history."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (payment) => {
        if (payment.status !== "PENDING" || confirmingPaymentId !== null) {
            return;
        }

        const confirmed = window.confirm(
            `Confirm payment #${payment.id} of ${formatAmount(payment.amount)} for ${getMemberName(payment.member)}?`
        );

        if (!confirmed) return;

        try {
            setConfirmingPaymentId(payment.id);
            setErrorMessage("");
            setSuccessMessage("");

            const confirmedPayment = await paymentService.confirmPayment(payment.id);
            const normalizedPayment = {
                ...payment,
                ...(confirmedPayment || {}),
                status: confirmedPayment?.payment_status ?? confirmedPayment?.status ?? "SUCCESSFUL",
                method: confirmedPayment?.payment_method ?? confirmedPayment?.method ?? payment.method,
            };

            setPayments((currentPayments) =>
                currentPayments.map((item) =>
                    Number(item.id) === Number(payment.id)
                        ? { ...item, ...normalizedPayment, status: "SUCCESSFUL" }
                        : item
                )
            );
            setSelectedPayment((current) =>
                current && Number(current.id) === Number(payment.id)
                    ? { ...current, ...normalizedPayment, status: "SUCCESSFUL" }
                    : current
            );
            setSuccessMessage(`Payment #${payment.id} confirmed successfully.`);

            // Refresh related member/membership information and authoritative payment data.
            await loadData();
        } catch (error) {
            console.error("Unable to confirm payment:", error);
            const detail = error.response?.data?.detail;
            setErrorMessage(
                typeof detail === "string"
                    ? detail
                    : "Unable to confirm payment. Please try again."
            );
        } finally {
            setConfirmingPaymentId(null);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Download a PDF receipt generated by the Django backend.
    const handleDownloadReceipt = async (payment) => {
        if (payment.status !== "SUCCESSFUL") {
            setReceiptError(
                "A receipt is available only for successful payments."
            );
            return;
        }

        try {
            setDownloadingPaymentId(payment.id);
            setReceiptError("");

            const response = await api.get(
                `/payments/records/${payment.id}/receipt/`,
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], {
                type: "application/pdf",
            });

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = blobUrl;
            link.download = `SG-PAY-${String(payment.id).padStart(
                6,
                "0"
            )}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 1000);
        } catch (error) {
            console.error("Unable to download receipt:", error);

            let message =
                "Unable to download the PDF receipt. Please try again.";

            if (error.response?.data instanceof Blob) {
                try {
                    const errorData = JSON.parse(
                        await error.response.data.text()
                    );

                    message = errorData.detail || message;
                } catch {
                    // Keep the default error message.
                }
            } else {
                message =
                    error.response?.data?.detail || message;
            }

            setReceiptError(message);
        } finally {
            setDownloadingPaymentId(null);
        }
    };

    const today = new Date().toISOString().split("T")[0];

    const stats = useMemo(() => {
        const successfulPayments = payments.filter(
            (payment) => payment.status === "SUCCESSFUL"
        );

        const todaySuccessfulPayments = successfulPayments.filter(
            (payment) => {
                if (!payment.payment_date) {
                    return false;
                }

                return (
                    new Date(payment.payment_date)
                        .toISOString()
                        .split("T")[0] === today
                );
            }
        );

        const successfulAmount = successfulPayments.reduce(
            (total, payment) => total + Number(payment.amount || 0),
            0
        );

        const todayCollection = todaySuccessfulPayments.reduce(
            (total, payment) => total + Number(payment.amount || 0),
            0
        );

        return {
            total: payments.length,
            successful: successfulPayments.length,
            pending: payments.filter(
                (payment) => payment.status === "PENDING"
            ).length,
            failed: payments.filter(
                (payment) => payment.status === "FAILED"
            ).length,
            successfulAmount,
            todayCollection,
        };
    }, [payments, today]);

    const filteredPayments = useMemo(() => {
        const query = search.trim().toLowerCase();

        return [...payments]
            .filter((payment) => {
                if (
                    statusFilter !== "ALL" &&
                    payment.status !== statusFilter
                ) {
                    return false;
                }

                if (
                    methodFilter !== "ALL" &&
                    payment.method !== methodFilter
                ) {
                    return false;
                }

                if (!query) {
                    return true;
                }

                const memberName = getMemberName(payment.member);
                const username = getMemberUsername(payment.member);
                const transactionId = payment.transaction_id || "";

                const searchableText = [
                    memberName,
                    username,
                    transactionId,
                    payment.id,
                    payment.membership,
                    payment.amount,
                ]
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(query);
            })
            .sort((a, b) => {
                return (
                    new Date(b.payment_date || b.created_at || 0) -
                    new Date(a.payment_date || a.created_at || 0)
                );
            });
    }, [
        payments,
        search,
        statusFilter,
        methodFilter,
        members,
        memberships,
        plans,
    ]);

    const statusClass = (status) => {
        switch (status) {
            case "SUCCESSFUL":
                return "payment-history-status-success";
            case "PENDING":
                return "payment-history-status-pending";
            case "FAILED":
                return "payment-history-status-failed";
            default:
                return "";
        }
    };

    const methodLabel = (method) => {
        const labels = {
            CASH: "Cash",
            UPI: "UPI",
            CARD: "Card",
            ONLINE: "Online",
        };

        return labels[method] || method || "-";
    };

    return (
        <div className="payment-history-page">

            <div className="payment-history-container">
                <div className="payment-history-header">
                    <div className="payment-history-title-area">
                        <button
                            className="payment-history-back"
                            onClick={() => navigate("/receptionist")}
                            title="Back to dashboard"
                        >
                            <ArrowLeft size={19} />
                        </button>

                        <div className="payment-history-title">
                            <h1>Payment History</h1>
                            <p>
                                View and manage all member payment records.
                            </p>
                        </div>
                    </div>

                    <button
                        className="payment-history-refresh"
                        onClick={loadData}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {errorMessage && (
                    <div className="payment-history-error">
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div
                        className="payment-history-success"
                        role="status"
                        style={{
                            marginBottom: "18px",
                            padding: "12px 14px",
                            border: "1px solid #bbf7d0",
                            borderRadius: "9px",
                            background: "#f0fdf4",
                            color: "#166534",
                            fontSize: "13px",
                        }}
                    >
                        {successMessage}
                    </div>
                )}

                <div className="payment-history-stats">
                    <div className="payment-history-stat">
                        <div className="payment-history-stat-top">
                            <span className="payment-history-stat-label">
                                Total Payments
                            </span>
                            <div className="payment-history-stat-icon">
                                <CreditCard size={19} />
                            </div>
                        </div>
                        <div className="payment-history-stat-value">
                            {stats.total}
                        </div>
                        <div className="payment-history-stat-subtitle">
                            All recorded transactions
                        </div>
                    </div>

                    <div className="payment-history-stat">
                        <div className="payment-history-stat-top">
                            <span className="payment-history-stat-label">
                                Successful
                            </span>
                            <div className="payment-history-stat-icon">
                                <CheckCircle2 size={19} />
                            </div>
                        </div>
                        <div className="payment-history-stat-value">
                            {stats.successful}
                        </div>
                        <div className="payment-history-stat-subtitle">
                            {formatAmount(stats.successfulAmount)} collected
                        </div>
                    </div>

                    <div className="payment-history-stat">
                        <div className="payment-history-stat-top">
                            <span className="payment-history-stat-label">
                                Pending
                            </span>
                            <div className="payment-history-stat-icon">
                                <Clock3 size={19} />
                            </div>
                        </div>
                        <div className="payment-history-stat-value">
                            {stats.pending}
                        </div>
                        <div className="payment-history-stat-subtitle">
                            Awaiting completion
                        </div>
                    </div>

                    <div className="payment-history-stat">
                        <div className="payment-history-stat-top">
                            <span className="payment-history-stat-label">
                                Failed
                            </span>
                            <div className="payment-history-stat-icon">
                                <XCircle size={19} />
                            </div>
                        </div>
                        <div className="payment-history-stat-value">
                            {stats.failed}
                        </div>
                        <div className="payment-history-stat-subtitle">
                            Failed transactions
                        </div>
                    </div>

                    <div className="payment-history-stat">
                        <div className="payment-history-stat-top">
                            <span className="payment-history-stat-label">
                                Today's Collection
                            </span>
                            <div className="payment-history-stat-icon">
                                <IndianRupee size={19} />
                            </div>
                        </div>
                        <div className="payment-history-stat-value">
                            {formatAmount(stats.todayCollection)}
                        </div>
                        <div className="payment-history-stat-subtitle">
                            Successful payments today
                        </div>
                    </div>
                </div>

                <div className="payment-history-card">
                    <div className="payment-history-toolbar">
                        <div className="payment-history-search">
                            <Search size={17} />
                            <input
                                type="text"
                                placeholder="Search member, username, transaction ID..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                        >
                            <option value="ALL">All Status</option>
                            <option value="SUCCESSFUL">Successful</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Failed</option>
                        </select>

                        <select
                            value={methodFilter}
                            onChange={(event) =>
                                setMethodFilter(event.target.value)
                            }
                        >
                            <option value="ALL">All Methods</option>
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="CARD">Card</option>
                            <option value="ONLINE">Online</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="payment-history-loading">
                            Loading payment history...
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="payment-history-empty">
                            No payment records found.
                        </div>
                    ) : (
                        <div className="payment-history-table-wrapper">
                            <table className="payment-history-table">
                                <thead>
                                    <tr>
                                        <th>Payment ID</th>
                                        <th>Member</th>
                                        <th>Membership</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                        <th>Payment Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredPayments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>
                                                <strong>#{payment.id}</strong>
                                            </td>

                                            <td>
                                                <div className="payment-history-member">
                                                    <span className="payment-history-member-name">
                                                        {getMemberName(
                                                            payment.member
                                                        )}
                                                    </span>
                                                    <span className="payment-history-member-username">
                                                        {getMemberUsername(
                                                            payment.member
                                                        )}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                {getPlanName(
                                                    payment.membership
                                                )}
                                            </td>

                                            <td>
                                                <span className="payment-history-amount">
                                                    {formatAmount(payment.amount)}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="payment-history-method">
                                                    <CreditCard size={14} />
                                                    {methodLabel(payment.method)}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`payment-history-status ${statusClass(
                                                        payment.status
                                                    )}`}
                                                >
                                                    {payment.status === "SUCCESSFUL" ? (
                                                        <CheckCircle2 size={13} />
                                                    ) : payment.status === "PENDING" ? (
                                                        <Clock3 size={13} />
                                                    ) : (
                                                        <XCircle size={13} />
                                                    )}
                                                    {payment.status || "-"}
                                                </span>
                                            </td>

                                            <td>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "7px",
                                                    }}
                                                >
                                                    <CalendarDays
                                                        size={14}
                                                        color="#94a3b8"
                                                    />
                                                    {formatDate(payment.payment_date)}
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {payment.status === "PENDING" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleConfirmPayment(payment)}
                                                            disabled={confirmingPaymentId !== null}
                                                            style={{
                                                                padding: "8px 11px",
                                                                border: "none",
                                                                borderRadius: "8px",
                                                                background: "#c494f5",
                                                                color: "#17210b",
                                                                fontWeight: 700,
                                                                cursor: confirmingPaymentId !== null ? "wait" : "pointer",
                                                                opacity: confirmingPaymentId !== null ? 0.65 : 1,
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {confirmingPaymentId === payment.id ? "Confirming..." : "Confirm"}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="payment-history-view"
                                                        onClick={() => {
                                                            setReceiptError("");
                                                            setSelectedPayment(payment);
                                                        }}
                                                        title="View payment details"
                                                        aria-label={`View payment ${payment.id}`}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {selectedPayment && (
                <div
                    className="payment-history-modal-overlay"
                    onClick={() => {
                        setSelectedPayment(null);
                        setReceiptError("");
                    }}
                >
                    <div
                        className="payment-history-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="payment-history-modal-header">
                            <h2>Payment Details</h2>

                            <button
                                className="payment-history-close"
                                onClick={() => {
                                    setSelectedPayment(null);
                                    setReceiptError("");
                                }}
                                aria-label="Close payment details"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="payment-history-modal-body">
                            <div className="payment-history-detail-grid">
                                <div className="payment-history-detail">
                                    <div className="payment-history-detail-label">
                                        Payment ID
                                    </div>
                                    <div className="payment-history-detail-value">
                                        #{selectedPayment.id}
                                    </div>
                                </div>

                                <div className="payment-history-detail">
                                    <div className="payment-history-detail-label">
                                        Status
                                    </div>
                                    <div className="payment-history-detail-value">
                                        <span
                                            className={`payment-history-status ${statusClass(
                                                selectedPayment.status
                                            )}`}
                                        >
                                            {selectedPayment.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="payment-history-detail">
                                    <div className="payment-history-detail-label">
                                        Member
                                    </div>
                                    <div className="payment-history-detail-value">
                                        {getMemberName(selectedPayment.member)}
                                    </div>
                                </div>

                                <div className="payment-history-detail">
                                    <div className="payment-history-detail-label">
                                        Membership
                                    </div>
                                    <div className="payment-history-detail-value">
                                        {getPlanName(selectedPayment.membership)}
                                    </div>
                                </div>

                                <div className="payment-history-detail">
                                    <div className="payment-history-detail-label">
                                        Amount
                                    </div>
                                    <div className="payment-history-detail-value">
                                        {formatAmount(selectedPayment.amount)}
                                    </div>
                                </div>

                                <div className="payment-history-detail">
                                    <div className="payment-history-detail-label">
                                        Payment Method
                                    </div>
                                    <div className="payment-history-detail-value">
                                        {methodLabel(selectedPayment.method)}
                                    </div>
                                </div>

                                <div className="payment-history-detail">
                                    <div className="payment-history-detail-label">
                                        Transaction ID
                                    </div>
                                    <div className="payment-history-detail-value">
                                        {selectedPayment.transaction_id ||
                                            "Not provided"}
                                    </div>
                                </div>

                                <div className="payment-history-detail">
                                    <div className="payment-history-detail-label">
                                        Payment Date
                                    </div>
                                    <div className="payment-history-detail-value">
                                        {formatDateTime(
                                            selectedPayment.payment_date
                                        )}
                                    </div>
                                </div>

                                <div className="payment-history-detail full">
                                    <div className="payment-history-detail-label">
                                        Notes
                                    </div>
                                    <div className="payment-history-detail-value">
                                        {selectedPayment.notes ||
                                            "No notes added."}
                                    </div>
                                </div>
                            </div>

                            {selectedPayment.status === "SUCCESSFUL" && (
                                <button
                                    type="button"
                                    className="payment-history-receipt-button"
                                    onClick={() =>
                                        handleDownloadReceipt(selectedPayment)
                                    }
                                    disabled={
                                        downloadingPaymentId ===
                                        selectedPayment.id
                                    }
                                >
                                    <Download size={18} />
                                    {downloadingPaymentId === selectedPayment.id
                                        ? "Generating PDF..."
                                        : "Download PDF Receipt"}
                                </button>
                            )}

                            {receiptError && (
                                <div
                                    className="payment-history-receipt-error"
                                    role="alert"
                                >
                                    {receiptError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentHistory;
