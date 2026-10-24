
import { useEffect, useState } from "react";
import {
    CreditCard,
    Receipt,
    CalendarDays,
    Wallet,
    IndianRupee,
    History,
} from "lucide-react";

import { getMyPayments } from "../../services/paymentService";
import "../../styles/payments.css";

function Payments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const data = await getMyPayments();
                setPayments(data);
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    "Unable to load payment history."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    const formatPrice = (amount) =>
        Number(amount).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        });

    const formatDate = (date) => {
        if (!date) return "Not available";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const successfulPayments = payments.filter(
        (payment) => payment.payment_status === "SUCCESSFUL"
    );

    const totalPaid = successfulPayments.reduce(
        (total, payment) => total + Number(payment.amount),
        0
    );

    const pendingPayments = payments.filter(
        (payment) => payment.payment_status === "PENDING"
    );

    const failedPayments = payments.filter(
        (payment) => payment.payment_status === "FAILED"
    );

    if (loading) {
        return (
            <div className="payments-page">
                <p>Loading payment history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="payments-page">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="payments-page">
            <div className="payments-page-heading">
                <div>
                    <h1>Payment History</h1>
                    <p>Track your gym membership payments and transactions.</p>
                </div>

                <div className="payments-heading-icon">
                    <Receipt size={27} />
                </div>
            </div>

            <div className="payment-stats-grid">
                <div className="payment-stat-card">
                    <div className="payment-stat-icon purple">
                        <Wallet size={22} />
                    </div>
                    <span>Total Paid</span>
                    <h2>{formatPrice(totalPaid)}</h2>
                    <p>Successful payments</p>
                </div>

                <div className="payment-stat-card">
                    <div className="payment-stat-icon green">
                        <CreditCard size={22} />
                    </div>
                    <span>Transactions</span>
                    <h2>{successfulPayments.length}</h2>
                    <p>Successful transactions</p>
                </div>

                <div className="payment-stat-card">
                    <div className="payment-stat-icon orange">
                        <CalendarDays size={22} />
                    </div>
                    <span>Pending</span>
                    <h2>{pendingPayments.length}</h2>
                    <p>Awaiting confirmation</p>
                </div>

                <div className="payment-stat-card">
                    <div className="payment-stat-icon red">
                        <History size={22} />
                    </div>
                    <span>Failed</span>
                    <h2>{failedPayments.length}</h2>
                    <p>Unsuccessful transactions</p>
                </div>
            </div>

            <section className="payment-history-section">
                <div className="payment-section-heading">
                    <div>
                        <h2>All Transactions</h2>
                        <p>Your complete payment records</p>
                    </div>
                    <Receipt size={23} />
                </div>

                {payments.length > 0 ? (
                    <div className="payment-table-wrapper">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Membership</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            {payment.transaction_id || "—"}
                                        </td>
                                        <td>{payment.membership_plan}</td>
                                        <td className="payment-amount">
                                            {formatPrice(payment.amount)}
                                        </td>
                                        <td>{payment.payment_method}</td>
                                        <td>{formatDate(payment.payment_date)}</td>
                                        <td>
                                            <span
                                                className={`payment-status ${payment.payment_status.toLowerCase()}`}
                                            >
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="payment-empty-state">
                        <IndianRupee size={35} />
                        <h3>No Payment Records</h3>
                        <p>Your membership payments will appear here.</p>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Payments;
