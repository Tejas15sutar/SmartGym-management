
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Login.css";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const loggedInUser = await login(formData);

            switch (loggedInUser.role) {
                case "ADMIN":
                    navigate("/admin", { replace: true });
                    break;

                case "TRAINER":
                    navigate("/trainer", { replace: true });
                    break;

                case "MEMBER":
                    navigate("/member", { replace: true });
                    break;

                case "RECEPTIONIST":
                    navigate("/receptionist", { replace: true });
                    break;

                default:
                    navigate("/", { replace: true });
            }
        } catch (err) {
            const message = err.response?.data;

            setError(
                typeof message === "string"
                    ? message
                    : "Invalid username or password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <header className="login-nav">
                <button
                    className="login-brand"
                    onClick={() => navigate("/")}
                    aria-label="Go to SmartGym home"
                >
                    <span className="login-brand-mark">S</span>
                    <span>
                        SMART<span className="login-lime">GYM</span>
                    </span>
                </button>

                <Link to="/" className="login-home-link">
                    ← Back to Home
                </Link>
            </header>

            <section className="login-layout">
                <div className="login-intro">
                    <span className="login-eyebrow">
                        <span className="login-dot" />
                        WELCOME TO SMARTGYM
                    </span>

                    <h1>
                        YOUR GOALS.
                        <br />
                        YOUR <span>GAME.</span>
                    </h1>

                    <p>
                        Sign in to access your SmartGym workspace.
                        Your fitness journey and gym management
                        tools are waiting for you.
                    </p>

                    <div className="login-highlight">
                        <span className="login-highlight-icon">✦</span>
                        <div>
                            <strong>One platform. Every goal.</strong>
                            <p>
                                A smarter way to manage and experience your gym.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="login-card">
                    <div className="login-card-heading">
                        <span className="login-section-label">
                            YOUR WORKSPACE
                        </span>

                        <h2>Welcome back<span>.</span></h2>

                        <p>Enter your credentials to continue.</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="login-field">
                            <label htmlFor="login-username">
                                Username
                            </label>

                            <input
                                id="login-username"
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="login-field">
                            <label htmlFor="login-password">
                                Password
                            </label>

                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <label className="login-show-password">
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={(e) =>
                                    setShowPassword(e.target.checked)
                                }
                            />
                            <span>Show password</span>
                        </label>

                        {error && (
                            <div className="login-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                            {!loading && <span>↗</span>}
                        </button>
                    </form>

                    <div className="login-divider">
                        <span />
                        <span>NEW TO SMARTGYM?</span>
                        <span />
                    </div>

                    <Link to="/register" className="login-register-button">
                        Create an Account <span>↗</span>
                    </Link>

                    <p className="login-card-note">
                        Sign in with the account provided or created
                        through your existing SmartGym registration process.
                    </p>
                </div>
            </section>

            <footer className="login-footer">
                <span>
                    SMART<span>GYM</span>
                </span>

                <p>TRAIN SMARTER. MANAGE BETTER.</p>
            </footer>
        </main>
    );
}

export default Login;
