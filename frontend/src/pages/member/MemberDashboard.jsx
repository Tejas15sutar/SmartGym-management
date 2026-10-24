
import { useEffect, useState } from "react";
import { getMyMemberships } from "../../services/membershipService";
import "../../styles/member-dashboard.css";
import {
    Activity,
    CalendarCheck,
    Clock,
    Dumbbell,
    Flame,
    Target,
    TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function MemberDashboard() {
    const { user } = useAuth();

    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMemberships = async () => {
            try {
                const data = await getMyMemberships();
                setMemberships(data);
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    "Unable to load memberships."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchMemberships();
    }, []);

    const activeMemberships = memberships.filter(
        (membership) => membership.status === "ACTIVE"
    );

    const currentMembership = activeMemberships
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];

    const stats = [
        {
            title: "Attendance",
            value: "18 Days",
            subtitle: "This month",
            icon: CalendarCheck,
            color: "purple",
        },
        {
            title: "Workouts",
            value: "24",
            subtitle: "Completed this month",
            icon: Dumbbell,
            color: "blue",
        },
        {
            title: "Calories Burned",
            value: "8,450",
            subtitle: "Estimated kcal",
            icon: Flame,
            color: "orange",
        },
        {
            title: "Workout Hours",
            value: "32.5",
            subtitle: "Hours this month",
            icon: Clock,
            color: "green",
        },
    ];

    const weeklyActivity = [
        { day: "Mon", height: "75%" },
        { day: "Tue", height: "50%" },
        { day: "Wed", height: "90%" },
        { day: "Thu", height: "65%" },
        { day: "Fri", height: "80%" },
        { day: "Sat", height: "40%" },
        { day: "Sun", height: "20%" },
    ];

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(`${date}T00:00:00`).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    return (
        <div className="dashboard-overview">
            <div className="dashboard-welcome">
                <div>
                    <h1>
                        Good to see you, {user?.first_name || user?.username}!
                    </h1>
                    <p>
                        Keep showing up. Every workout brings you closer
                        to your fitness goals.
                    </p>
                </div>

                <div className="welcome-icon">
                    <Activity size={30} />
                </div>
            </div>

            <div className="membership-banner">
                <div>
                    <span className="membership-label">
                        YOUR MEMBERSHIP
                    </span>

                    {loading ? (
                        <>
                            <h2>Loading membership...</h2>
                            <p>Please wait while we fetch your details.</p>
                        </>
                    ) : error ? (
                        <>
                            <h2>Membership unavailable</h2>
                            <p>{error}</p>
                        </>
                    ) : currentMembership ? (
                        <>
                            <h2>{currentMembership.plan_name}</h2>
                            <p>
                                Valid from {formatDate(currentMembership.start_date)}
                                {" "}to {formatDate(currentMembership.end_date)}
                            </p>
                            <p>
                                {currentMembership.remaining_days} days remaining
                            </p>
                        </>
                    ) : (
                        <>
                            <h2>No Active Membership</h2>
                            <p>
                                You don't currently have an active membership.
                            </p>
                        </>
                    )}
                </div>

                {!loading && !error && (
                    <div className="membership-status">
                        {currentMembership ? "ACTIVE" : "INACTIVE"}
                    </div>
                )}
            </div>

            <div className="section-heading">
                <div>
                    <h2>Your Activity</h2>
                    <p>Here is your fitness summary.</p>
                </div>
            </div>

            <div className="stats-grid">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div className="stat-card" key={stat.title}>
                            <div className={`stat-icon ${stat.color}`}>
                                <Icon size={22} />
                            </div>

                            <p>{stat.title}</p>
                            <h3>{stat.value}</h3>
                            <span>{stat.subtitle}</span>
                        </div>
                    );
                })}
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card activity-card">
                    <div className="card-heading">
                        <div>
                            <h3>Weekly Activity</h3>
                            <p>Your workout consistency</p>
                        </div>

                        <TrendingUp size={21} />
                    </div>

                    <div className="activity-chart">
                        {weeklyActivity.map((item) => (
                            <div className="activity-column" key={item.day}>
                                <div className="activity-bar-wrapper">
                                    <div
                                        className="activity-bar"
                                        style={{ height: item.height }}
                                    />
                                </div>
                                <span>{item.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-card goal-card">
                    <div className="card-heading">
                        <div>
                            <h3>Fitness Goal</h3>
                            <p>Stay focused on your target</p>
                        </div>

                        <Target size={21} />
                    </div>

                    <div className="goal-content">
                        <div className="goal-circle">
                            <strong>75%</strong>
                        </div>

                        <h4>Great progress!</h4>
                        <p>Keep training consistently to reach your goal.</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-card schedule-card">
                <div className="card-heading">
                    <div>
                        <h3>Upcoming Schedule</h3>
                        <p>Your planned workout sessions</p>
                    </div>

                    <CalendarCheck size={21} />
                </div>

                <div className="empty-schedule">
                    <CalendarCheck size={30} />
                    <h4>No upcoming sessions</h4>
                    <p>Your scheduled workouts will appear here.</p>
                </div>
            </div>
        </div>
    );
}

export default MemberDashboard;
