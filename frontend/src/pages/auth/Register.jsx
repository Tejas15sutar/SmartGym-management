
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Register.css";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Validate registration form
    const validateForm = () => {
        const {
            username,
            first_name,
            last_name,
            email,
            phone,
            password,
            confirmPassword,
        } = formData;

        // Username validation
        if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
            return "Username must be 4-20 characters and contain only letters, numbers or underscores.";
        }

        // First name validation
        if (!/^[a-zA-Z ]{2,30}$/.test(first_name.trim())) {
            return "Please enter a valid first name.";
        }

        // Last name validation
        if (!/^[a-zA-Z ]{2,30}$/.test(last_name.trim())) {
            return "Please enter a valid last name.";
        }

        // Gmail validation
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim())) {
            return "Please enter a valid Gmail address (example@gmail.com).";
        }

        // Indian mobile number validation
        if (!/^[6-9]\d{9}$/.test(phone.trim())) {
            return "Phone number must contain exactly 10 digits and start with 6, 7, 8 or 9.";
        }

        // Password validation
        if (password.length < 8) {
            return "Password must contain at least 8 characters.";
        }

        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter.";
        }

        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter.";
        }

        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one number.";
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            return "Password must contain at least one special character.";
        }

        // Confirm password validation
        if (password !== confirmPassword) {
            return "Passwords do not match.";
        }

        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "phone"
                    ? value.replace(/\D/g, "").slice(0, 10)
                    : value,
        }));

        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registrationData } = formData;

            registrationData.username = registrationData.username.trim();
            registrationData.first_name = registrationData.first_name.trim();
            registrationData.last_name = registrationData.last_name.trim();
            registrationData.email = registrationData.email.trim().toLowerCase();
            registrationData.phone = registrationData.phone.trim();

            await api.post("/auth/register/", registrationData);

            alert("Registration successful! Please login.");
            navigate("/login");
        } catch (err) {
            const data = err.response?.data;

            if (data && typeof data === "object") {
                const messages = Object.entries(data)
                    .map(([field, messages]) =>
                        `${field}: ${
                            Array.isArray(messages)
                                ? messages.join(", ")
                                : messages
                        }`
                    )
                    .join("\n");

                setError(messages || "Registration failed.");
            } else {
                setError("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        {
            name: "username",
            label: "Username",
            placeholder: "Choose a username",
            autoComplete: "username",
        },
        {
            name: "first_name",
            label: "First name",
            placeholder: "Enter your first name",
            autoComplete: "given-name",
        },
        {
            name: "last_name",
            label: "Last name",
            placeholder: "Enter your last name",
            autoComplete: "family-name",
        },
        {
            name: "email",
            label: "Email address",
            placeholder: "you@gmail.com",
            autoComplete: "email",
        },
        {
            name: "phone",
            label: "Phone number",
            placeholder: "Enter 10 digit mobile number",
            autoComplete: "tel",
        },
        {
            name: "password",
            label: "Password",
            placeholder: "Create a password",
            autoComplete: "new-password",
        },
        {
            name: "confirmPassword",
            label: "Confirm password",
            placeholder: "Re-enter your password",
            autoComplete: "new-password",
        },
    ];

    return (
        <main className="register-page">
            <header className="register-nav">
                <button
                    className="register-brand"
                    onClick={() => navigate("/")}
                    aria-label="Go to SmartGym home"
                >
                    <span className="register-brand-mark">S</span>
                    <span>
                        SMART<span className="register-lime">GYM</span>
                    </span>
                </button>

                <Link to="/login" className="register-nav-link">
                    Already a member? <span>Log in ↗</span>
                </Link>
            </header>

            <section className="register-layout">
                <div className="register-intro">
                    <span className="register-eyebrow">
                        <span className="register-dot" />
                        YOUR FITNESS STARTS HERE
                    </span>

                    <h1>
                        START YOUR
                        <br />
                        <span>NEXT CHAPTER.</span>
                    </h1>

                    <p>
                        Create your SmartGym account and take
                        the next step in your fitness journey.
                        Your goals deserve a smarter approach.
                    </p>

                    <div className="register-feature">
                        <span className="register-feature-icon">↗</span>
                        <div>
                            <strong>One smart platform</strong>
                            <p>
                                Your gym experience, all in one place.
                            </p>
                        </div>
                    </div>

                    <div className="register-feature">
                        <span className="register-feature-icon">✦</span>
                        <div>
                            <strong>Built for progress</strong>
                            <p>
                                Stay connected with your fitness journey.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="register-card">
                    <div className="register-card-heading">
                        <span className="register-section-label">
                            CREATE ACCOUNT
                        </span>

                        <h2>Join SmartGym<span>.</span></h2>

                        <p>
                            Enter your details to get started.
                        </p>
                    </div>

                    <form
                        className="register-form"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <div className="register-fields">
                            {fields.map((field) => {
                                const isPassword =
                                    field.name === "password" ||
                                    field.name === "confirmPassword";

                                return (
                                    <div
                                        className={`register-field ${
                                            field.name === "username" ||
                                            field.name === "email"
                                                ? "register-field-full"
                                                : ""
                                        }`}
                                        key={field.name}
                                    >
                                        <label htmlFor={field.name}>
                                            {field.label}
                                        </label>

                                        <div className="register-input-wrap">
                                            <input
                                                id={field.name}
                                                type={
                                                    isPassword
                                                        ? showPassword
                                                            ? "text"
                                                            : "password"
                                                        : field.name === "email"
                                                        ? "email"
                                                        : field.name === "phone"
                                                        ? "tel"
                                                        : "text"
                                                }
                                                name={field.name}
                                                value={formData[field.name]}
                                                onChange={handleChange}
                                                placeholder={field.placeholder}
                                                autoComplete={field.autoComplete}
                                                maxLength={
                                                    field.name === "phone"
                                                        ? 10
                                                        : undefined
                                                }
                                                inputMode={
                                                    field.name === "phone"
                                                        ? "numeric"
                                                        : undefined
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <label className="register-show-password">
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={(e) =>
                                    setShowPassword(e.target.checked)
                                }
                            />
                            <span>Show passwords</span>
                        </label>

                        {error && (
                            <div
                                className="register-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            className="register-submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating account..."
                                : "Create Account"}
                            {!loading && <span>↗</span>}
                        </button>
                    </form>

                    <p className="register-login-prompt">
                        Already have an account?{" "}
                        <Link to="/login">Log in</Link>
                    </p>

                    <p className="register-note">
                        Your account will be created using SmartGym's
                        existing registration process.
                    </p>
                </div>
            </section>

            <footer className="register-footer">
                <span>SMART<span>GYM</span></span>
                <p>TRAIN SMARTER. MANAGE BETTER.</p>
            </footer>
        </main>
    );
}

export default Register;
