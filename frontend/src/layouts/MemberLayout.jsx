import "../styles/member.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Receipt } from "lucide-react";
import {
    LayoutDashboard,
    Dumbbell,
    CalendarDays,
    CreditCard,
    UserRound,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";

function MemberLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navItems = [
        {
            name: "Dashboard",
            path: "/member",
            icon: LayoutDashboard,
            end: true,
        },
        {
            name: "My Workouts",
            path: "/member/workouts",
            icon: Dumbbell,
        },
        {
            name: "Attendance",
            path: "/member/attendance",
            icon: CalendarDays,
        },
        {
            name: "Membership",
            path: "/member/membership",
            icon: CreditCard,
        },
        {
            name: "Payments",
            path: "/member/payments",
            icon: Receipt,
        },
        {
            name: "My Profile",
            path: "/member/profile",
            icon: UserRound,
        },
    ];

    return (
        <div className="member-app">
            <aside className={`member-sidebar ${menuOpen ? "open" : ""}`}>
                <div className="sidebar-brand">
                    <div className="brand-icon">
                        <Dumbbell size={25} />
                    </div>
                    <div>
                        <h2>SmartGym</h2>
                        <span>FITNESS MANAGEMENT</span>
                    </div>
                    <button
                        className="mobile-close"
                        onClick={() => setMenuOpen(false)}
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="sidebar-section-label">
                    MENU
                </div>

                <nav className="sidebar-navigation">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end={item.end}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? "active" : ""}`
                                }
                                onClick={() => setMenuOpen(false)}
                            >
                                <Icon size={19} />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {(user?.first_name || user?.username || "M")
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="user-details">
                            <strong>
                                {user?.first_name || user?.username}
                            </strong>
                            <span>Member</span>
                        </div>
                    </div>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {menuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            <main className="member-main">
                <header className="member-header">
                    <button
                        className="mobile-menu"
                        onClick={() => setMenuOpen(true)}
                    >
                        <Menu size={23} />
                    </button>

                    <div className="header-title">
                        <h3>Member Portal</h3>
                        <p>Welcome back to your fitness journey!</p>
                    </div>

                    <div className="header-profile">
                        <div className="header-avatar">
                            {(user?.first_name || user?.username || "M")
                                .charAt(0)
                                .toUpperCase()}
                        </div>
                        <div>
                            <strong>
                                {user?.first_name || user?.username}
                            </strong>
                            <span>Member</span>
                        </div>
                    </div>
                </header>

                <section className="member-content">
                    <Outlet />
                </section>
            </main>
        </div>
    );
}

export default MemberLayout;
