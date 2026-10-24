
import { useEffect, useState } from "react";
import {
    CalendarDays,
    Clock,
    CreditCard,
    History,
    ShieldCheck,
    Dumbbell,
} from "lucide-react";
import {
    getMyMemberships,
    getMembershipPlans,
} from "../../services/membershipService";
import "../../styles/membership.css";

function Membership() {
    const [memberships, setMemberships] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membershipData, planData] = await Promise.all([
                    getMyMemberships(),
                    getMembershipPlans(),
                ]);

                setMemberships(membershipData);
                setPlans(planData);
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    "Unable to load membership information."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMembership = memberships
        .filter((item) => item.status === "ACTIVE")
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];

    const upcomingMemberships = memberships.filter(
        (item) => item.status === "PENDING"
    );

    const membershipHistory = memberships.filter(
        (item) => item.status === "EXPIRED" || item.status === "CANCELLED"
    );

    const formatDate = (date) =>
        new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    const formatPrice = (price) =>
        Number(price).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        });

    if (loading) {
        return <div className="membership-page"><p>Loading membership details...</p></div>;
    }

    if (error) {
        return <div className="membership-page"><p>{error}</p></div>;
    }

    return (
        <div className="membership-page">
            <div className="membership-page-heading">
                <div>
                    <h1>My Membership</h1>
                    <p>Manage your gym membership and explore available plans.</p>
                </div>
                <div className="membership-heading-icon">
                    <Dumbbell size={27} />
                </div>
            </div>

            <section className="current-membership-section">
                <div className="membership-section-heading">
                    <div>
                        <h2>Current Membership</h2>
                        <p>Your active membership information</p>
                    </div>
                    <ShieldCheck size={23} />
                </div>

                {currentMembership ? (
                    <div className="current-membership-card">
                        <div className="current-plan-top">
                            <span className="plan-eyebrow">YOUR CURRENT PLAN</span>
                            <span className="plan-active-badge">ACTIVE</span>
                        </div>

                        <h2>{currentMembership.plan_name}</h2>

                        <div className="membership-details-grid">
                            <div>
                                <CalendarDays size={19} />
                                <span>Start Date</span>
                                <strong>{formatDate(currentMembership.start_date)}</strong>
                            </div>

                            <div>
                                <CalendarDays size={19} />
                                <span>Expiry Date</span>
                                <strong>{formatDate(currentMembership.end_date)}</strong>
                            </div>

                            <div>
                                <Clock size={19} />
                                <span>Remaining Days</span>
                                <strong>{currentMembership.remaining_days} Days</strong>
                            </div>

                            <div>
                                <CreditCard size={19} />
                                <span>Amount Paid</span>
                                <strong>{formatPrice(currentMembership.amount_paid)}</strong>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="membership-empty-state">
                        <ShieldCheck size={35} />
                        <h3>No Active Membership</h3>
                        <p>You don't have an active membership at the moment.</p>
                    </div>
                )}
            </section>

            <section className="available-plans-section">
                <div className="membership-section-heading">
                    <div>
                        <h2>Available Plans</h2>
                        <p>Explore membership plans offered by your gym.</p>
                    </div>
                    <Dumbbell size={23} />
                </div>

                <div className="membership-plans-grid">
                    {plans.filter((plan) => plan.is_active).map((plan) => (
                        <div className="membership-plan-card" key={plan.id}>
                            <div className="plan-card-icon">
                                <Dumbbell size={23} />
                            </div>

                            <h3>{plan.name}</h3>
                            <div className="plan-price">{formatPrice(plan.price)}</div>
                            <p className="plan-duration">
                                {plan.duration_days} Days
                            </p>
                            <p className="plan-description">
                                {plan.description || "Gym membership access."}
                            </p>
                        </div>
                    ))}
                </div>

                {plans.filter((plan) => plan.is_active).length === 0 && (
                    <p>No active membership plans are currently available.</p>
                )}
            </section>

            <section className="upcoming-membership-section">
                <div className="membership-section-heading">
                    <div>
                        <h2>Upcoming Memberships</h2>
                        <p>Your scheduled memberships</p>
                    </div>
                    <CalendarDays size={23} />
                </div>

                {upcomingMemberships.length > 0 ? (
                    <div className="membership-table-wrapper">
                        <table className="membership-table">
                            <thead>
                                <tr>
                                    <th>Plan</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcomingMemberships.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.plan_name}</td>
                                        <td>{formatDate(item.start_date)}</td>
                                        <td>{formatDate(item.end_date)}</td>
                                        <td><span className="status-pending">PENDING</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="membership-small-empty">
                        No upcoming memberships.
                    </div>
                )}
            </section>

            <section className="membership-history-section">
                <div className="membership-section-heading">
                    <div>
                        <h2>Membership History</h2>
                        <p>Your previous membership records</p>
                    </div>
                    <History size={23} />
                </div>

                {membershipHistory.length > 0 ? (
                    <div className="membership-table-wrapper">
                        <table className="membership-table">
                            <thead>
                                <tr>
                                    <th>Plan</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {membershipHistory.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.plan_name}</td>
                                        <td>{formatDate(item.start_date)}</td>
                                        <td>{formatDate(item.end_date)}</td>
                                        <td>
                                            <span className={`status-${item.status.toLowerCase()}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="membership-small-empty">
                        No previous membership records.
                    </div>
                )}
            </section>
        </div>
    );
}

export default Membership;
