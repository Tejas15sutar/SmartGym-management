
import { useNavigate } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import "../styles/Home.css";

function Dashboard() {
    const navigate = useNavigate();

    const roles = [
        {
            title: "Admin",
            description:
                "Manage gym operations, staff, and business performance.",
            icon: "⚙",
        },
        {
            title: "Receptionist",
            description:
                "Manage members, memberships, payments, and attendance.",
            icon: "◈",
        },
        {
            title: "Trainer",
            description:
                "Support training activities and help members reach their goals.",
            icon: "✦",
        },
        {
            title: "Member",
            description:
                "Access your membership, workouts, and fitness progress.",
            icon: "↗",
        },
    ];

    const handleGetStarted = () => {
        document.getElementById("portals")?.scrollIntoView({
            behavior: "smooth",
        });
    };

    return (
        <main className="home-page">
            {/* Navigation */}
            <nav className="home-nav">
                <button
                    className="home-brand"
                    onClick={() => navigate("/")}
                    aria-label="SmartGym home"
                >
                    <span className="brand-mark">
                        <Dumbbell size={25} strokeWidth={2.2} />
                    </span>
                    <span>
                        SMART<span className="brand-accent">GYM</span>
                    </span>
                </button>

                <div className="home-nav-actions">
                    <button
                        className="nav-register"
                        onClick={() => navigate("/register")}
                    >
                        Register
                    </button>

                    <button
                        className="nav-login"
                        onClick={() => navigate("/login")}
                    >
                        Log In <span aria-hidden="true">↗</span>
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="home-hero">
                <div className="hero-content">
                    <div className="hero-eyebrow">
                        <span className="status-dot" />
                        YOUR FITNESS. YOUR CONTROL.
                    </div>

                    <h1>
                        BUILD YOUR
                        <br />
                        <span>STRONGER</span>
                        <br />
                        TOMORROW.
                    </h1>

                    <p className="hero-description">
                        One smart platform for your gym.
                        Manage operations, empower trainers,
                        and help every member make progress.
                    </p>

                    <div className="hero-actions">
                        <button
                            className="primary-button"
                            onClick={handleGetStarted}
                        >
                            Get Started <span aria-hidden="true">↗</span>
                        </button>

                        <span className="hero-caption">
                            ONE PLATFORM. EVERY GOAL.
                        </span>
                    </div>

                    <div className="hero-stats">
                        <div>
                            <strong>01</strong>
                            <span>ONE PLATFORM</span>
                        </div>

                        <div>
                            <strong>04</strong>
                            <span>USER PORTALS</span>
                        </div>

                        <div>
                            <strong>∞</strong>
                            <span>ROOM TO GROW</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="hero-image">
                        <div className="image-overlay" />

                        <div className="image-label">
                            <span className="status-dot" />
                            BUILT FOR PROGRESS
                        </div>

                        <div className="image-title">
                            <span>DISCIPLINE</span>
                            <strong>CREATES RESULTS.</strong>
                        </div>
                    </div>

                    <div className="visual-accent" />
                    <div className="visual-number">SG / 001</div>
                </div>
            </section>

            {/* Role Selection */}
            <section className="portal-section" id="portals">
                <div className="section-heading">
                    <div>
                        <span className="section-eyebrow">
                            YOUR WORKSPACE
                        </span>

                        <h2>
                            CHOOSE YOUR <span>PORTAL.</span>
                        </h2>
                    </div>

                    <p>
                        Select your role to continue to the
                        SmartGym login page.
                    </p>
                </div>

                <div className="portal-grid">
                    {roles.map((role, index) => (
                        <button
                            className="portal-card"
                            key={role.title}
                            onClick={() => navigate("/login")}
                        >
                            <div className="portal-card-top">
                                <span className="portal-icon">
                                    {role.icon}
                                </span>

                                <span className="portal-index">
                                    0{index + 1}
                                </span>
                            </div>

                            <h3>{role.title}</h3>

                            <p>{role.description}</p>

                            <div className="portal-card-bottom">
                                <span>CONTINUE TO LOGIN</span>
                                <span className="portal-arrow">↗</span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <button
                    className="footer-brand"
                    onClick={() => navigate("/")}
                >
                    SMART<span>GYM</span>
                </button>

                <p>TRAIN SMARTER. MANAGE BETTER.</p>

                <span>
                    © {new Date().getFullYear()} SMARTGYM
                </span>
            </footer>
        </main>
    );
}

export default Dashboard;
