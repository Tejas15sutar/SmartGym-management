
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "../../styles/AdminDashboard.css";

import AdminUserManagement from "../../components/admin/AdminUserManagement";
import AdminMembershipPlans from "../../components/admin/AdminMembershipPlans";
import AdminPayments from "../../components/admin/AdminPayments";
import AdminWorkoutPlans from "../../components/admin/AdminWorkoutPlans";
import AdminExerciseLibrary from "../../components/admin/AdminExerciseLibrary";
import AdminPlanExercises from "../../components/admin/AdminPlanExercises";
import AdminWorkoutAssignments from "../../components/admin/AdminWorkoutAssignments";
import AdminReports from "../../components/admin/AdminReports";
import AdminTrainerAttendance from "../../components/admin/AdminTrainerAttendance";

function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [activeSection, setActiveSection] = useState("Overview");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/auth/admin-dashboard/stats/");
      setDashboardData(response.data);
    } catch (err) {
      console.error("Failed to load admin dashboard statistics:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard statistics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const stats = [
    {
      title: "Total Members",
      value: dashboardData?.total_members ?? "—",
      note: "Registered gym members",
      icon: "👥",
    },
    {
      title: "Active Memberships",
      value: dashboardData?.active_memberships ?? "—",
      note: "Currently active plans",
      icon: "💳",
    },
    {
      title: "Total Trainers",
      value: dashboardData?.total_trainers ?? "—",
      note: "Registered trainers",
      icon: "🏋️",
    },
    {
      title: "Total Revenue",
      value:
        dashboardData === null
          ? "—"
          : formatCurrency(dashboardData.total_payments),
      note: "Successful payments collected",
      icon: "₹",
    },
  ];

  const menuItems = [
    { name: "Overview", icon: "▦" },
    { name: "Members", icon: "♙" },
    { name: "Trainers", icon: "♟" },
    { name: "Trainer Attendance", icon: "◷" },
    { name: "Receptionists", icon: "▣" },
    { name: "Membership Plans", icon: "◇" },
    { name: "Payments", icon: "₹" },
    { name: "Workout Plans", icon: "⚡" },
    { name: "Exercise Library", icon: "🏋️" },
    { name: "Plan Exercises", icon: "🏋️" },
    { name: "Workout Assignments", icon: "📋" },
    { name: "Reports", icon: "▤" },
  ];

  const userManagementSections = [
    "Members",
    "Trainers",
    "Receptionists",
  ];

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">S</div>
          <div>
            <h2>SmartGym</h2>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <div className="admin-menu-label">WORKSPACE</div>

        <nav className="admin-navigation">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`admin-nav-item ${
                activeSection === item.name ? "active" : ""
              }`}
              onClick={() => setActiveSection(item.name)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              {activeSection === item.name && (
                <span className="admin-nav-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile-avatar">A</div>
          <div className="admin-profile-details">
            <strong>Administrator</strong>
            <span>Gym Management</span>
          </div>
        </div>

        <button
          type="button"
          className="admin-sidebar-logout"
          onClick={handleLogout}
        >
          <span className="admin-logout-icon">↪</span>
          <span>Logout</span>
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-breadcrumb">
              SmartGym <span>/</span> {activeSection}
            </div>
            <h1>{activeSection}</h1>
            <p>Manage your gym operations from one place.</p>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-status">
              <span className="admin-status-dot" />
              Admin Workspace
            </div>
            <div className="admin-top-avatar">A</div>
          </div>
        </header>

        {activeSection === "Overview" ? (
          <>
            <section className="admin-welcome">
              <div className="admin-welcome-content">
                <span className="admin-eyebrow">
                  SMARTGYM MANAGEMENT
                </span>
                <h2>Your gym, at a glance.</h2>
                <p>
                  Monitor memberships, manage your team, and keep your gym
                  running smoothly.
                </p>
              </div>
              <div className="admin-welcome-decoration">🏋️</div>
            </section>

            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>Business Overview</h2>
                  <p>Your key gym statistics.</p>
                </div>

                <button
                  type="button"
                  className="admin-back-button"
                  onClick={fetchDashboardStats}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "↻ Refresh"}
                </button>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <div className="admin-stats-grid">
                {stats.map((stat) => (
                  <article className="admin-stat-card" key={stat.title}>
                    <div className="admin-stat-top">
                      <span className="admin-stat-title">
                        {stat.title}
                      </span>
                      <span className="admin-stat-icon">
                        {stat.icon}
                      </span>
                    </div>

                    <div className="admin-stat-value">
                      {loading ? "Loading..." : stat.value}
                    </div>

                    <div className="admin-stat-note">{stat.note}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-bottom-grid">
              <article className="admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Quick Actions</h2>
                    <p>Access common management areas.</p>
                  </div>
                </div>

                <div className="admin-quick-actions">
                  {[
                    ["Members", "Manage gym members", "👥"],
                    ["Trainers", "Manage your trainers", "🏋️"],
                    ["Membership Plans", "View membership plans", "💳"],
                    ["Payments", "Review payment records", "₹"],
                  ].map(([name, description, icon]) => (
                    <button
                      type="button"
                      className="admin-action-item"
                      key={name}
                      onClick={() => setActiveSection(name)}
                    >
                      <span className="admin-action-icon">{icon}</span>
                      <span className="admin-action-text">
                        <strong>{name}</strong>
                        <small>{description}</small>
                      </span>
                      <span className="admin-action-arrow">↗</span>
                    </button>
                  ))}
                </div>
              </article>

              <article className="admin-panel admin-system-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>System Overview</h2>
                    <p>Dashboard integration status.</p>
                  </div>
                  <span className="admin-system-icon">⚙</span>
                </div>

                <div className="admin-system-row">
                  <span className="admin-system-indicator" />
                  <div>
                    <strong>Admin interface</strong>
                    <small>Frontend dashboard loaded</small>
                  </div>
                  <span className="admin-system-label">Ready</span>
                </div>

                <div className="admin-system-row">
                  <span
                    className={`admin-system-indicator ${
                      error || loading ? "pending" : ""
                    }`}
                  />
                  <div>
                    <strong>Live statistics</strong>
                    <small>
                      {loading
                        ? "Loading data from Django"
                        : error
                          ? "Unable to load statistics"
                          : "Connected to Django API"}
                    </small>
                  </div>
                  <span
                    className={`admin-system-label ${
                      error || loading ? "pending" : ""
                    }`}
                  >
                    {loading ? "Loading" : error ? "Error" : "Connected"}
                  </span>
                </div>

                <div className="admin-system-tip">
                  <strong>Dashboard insights</strong>
                  <p>
                    Statistics are retrieved from your Django backend.
                    Revenue includes successful payments only.
                  </p>
                </div>
              </article>
            </section>
          </>
        ) : userManagementSections.includes(activeSection) ? (
          <AdminUserManagement section={activeSection} />
        ) : activeSection === "Membership Plans" ? (
          <AdminMembershipPlans />
        ) : activeSection === "Payments" ? (
          <AdminPayments />
        ) : activeSection === "Workout Plans" ? (
          <AdminWorkoutPlans />
        ) : activeSection === "Exercise Library" ? (
          <AdminExerciseLibrary />
        ) : activeSection === "Plan Exercises" ? (
          <AdminPlanExercises />
        ) : activeSection === "Workout Assignments" ? (
          <AdminWorkoutAssignments />
        ) : activeSection === "Reports" ? (
          <AdminReports />
        ) : activeSection === "Trainer Attendance" ? (
          <AdminTrainerAttendance />
        ) : (
          <section className="admin-placeholder-panel">
            <div className="admin-placeholder-icon">✦</div>
            <h2>{activeSection}</h2>
            <p>
              This management section is ready for development. We will
              connect it to your existing Django backend next.
            </p>
            <button
              type="button"
              className="admin-back-button"
              onClick={() => setActiveSection("Overview")}
            >
              Back to Overview
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
