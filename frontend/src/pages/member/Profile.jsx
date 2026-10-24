import { useEffect, useState } from "react";
import {
    UserRound,
    Mail,
    Phone,
    CalendarDays,
    MapPin,
    Heart,
    Save,
    Ruler,
    Weight,
} from "lucide-react";

import { getMyProfile, updateMyProfile } from "../../services/memberService";
import "../../styles/profile.css";

function Profile() {
    const [profile, setProfile] = useState({
        date_of_birth: "",
        gender: "",
        address: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        height: "",
        weight: "",
        fitness_goal: "",
    });

    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getMyProfile();
                setProfile({
                    date_of_birth: data.date_of_birth || "",
                    gender: data.gender || "",
                    address: data.address || "",
                    emergency_contact_name: data.emergency_contact_name || "",
                    emergency_contact_phone: data.emergency_contact_phone || "",
                    height: data.height ?? "",
                    weight: data.weight ?? "",
                    fitness_goal: data.fitness_goal || "",
                });
                setUser(data.user || {});
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    "Unable to load your profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setProfile((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const updatedProfile = await updateMyProfile(profile);

            setProfile((previous) => ({
                ...previous,
                ...updatedProfile,
            }));

            setSuccess("Your profile has been updated successfully.");
        } catch (err) {
            const errors = err.response?.data;
            setError(
                typeof errors === "object"
                    ? Object.entries(errors)
                        .map(([field, messages]) =>
                            `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`
                        )
                        .join(" | ")
                    : "Unable to update your profile."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="profile-page">Loading your profile...</div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-heading">
                <div>
                    <h1>My Profile</h1>
                    <p>Manage your personal and fitness information.</p>
                </div>
                <div className="profile-heading-icon">
                    <UserRound size={27} />
                </div>
            </div>

            {error && <div className="profile-alert error">{error}</div>}
            {success && <div className="profile-alert success">{success}</div>}

            <form onSubmit={handleSubmit}>
                <section className="profile-card">
                    <div className="profile-card-heading">
                        <UserRound size={20} />
                        <div>
                            <h2>Personal Information</h2>
                            <p>Your basic account details</p>
                        </div>
                    </div>

                    <div className="profile-grid">
                        <div className="profile-field">
                            <label>Username</label>
                            <input value={user.username || ""} disabled />
                        </div>

                        <div className="profile-field">
                            <label>Email Address</label>
                            <div className="profile-input-icon">
                                <Mail size={17} />
                                <input value={user.email || ""} disabled />
                            </div>
                        </div>

                        <div className="profile-field">
                            <label>First Name</label>
                            <input value={user.first_name || ""} disabled />
                        </div>

                        <div className="profile-field">
                            <label>Last Name</label>
                            <input value={user.last_name || ""} disabled />
                        </div>

                        <div className="profile-field">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={profile.date_of_birth}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="profile-field">
                            <label>Gender</label>
                            <select
                                name="gender"
                                value={profile.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select gender</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div className="profile-field full-width">
                            <label>Address</label>
                            <div className="profile-input-icon">
                                <MapPin size={17} />
                                <textarea
                                    name="address"
                                    value={profile.address}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter your address"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="profile-card">
                    <div className="profile-card-heading">
                        <Heart size={20} />
                        <div>
                            <h2>Fitness Information</h2>
                            <p>Help us understand your fitness goals</p>
                        </div>
                    </div>

                    <div className="profile-grid">
                        <div className="profile-field">
                            <label>
                                <Ruler size={15} /> Height (cm)
                            </label>
                            <input
                                type="number"
                                name="height"
                                value={profile.height}
                                onChange={handleChange}
                                min="1"
                                step="0.01"
                                placeholder="e.g. 175"
                            />
                        </div>

                        <div className="profile-field">
                            <label>
                                <Weight size={15} /> Weight (kg)
                            </label>
                            <input
                                type="number"
                                name="weight"
                                value={profile.weight}
                                onChange={handleChange}
                                min="1"
                                step="0.01"
                                placeholder="e.g. 70"
                            />
                        </div>

                        <div className="profile-field full-width">
                            <label>Fitness Goal</label>
                            <textarea
                                name="fitness_goal"
                                value={profile.fitness_goal}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Describe your fitness goal"
                            />
                        </div>
                    </div>
                </section>

                <section className="profile-card">
                    <div className="profile-card-heading">
                        <Phone size={20} />
                        <div>
                            <h2>Emergency Contact</h2>
                            <p>Someone we can contact in an emergency</p>
                        </div>
                    </div>

                    <div className="profile-grid">
                        <div className="profile-field">
                            <label>Contact Name</label>
                            <input
                                name="emergency_contact_name"
                                value={profile.emergency_contact_name}
                                onChange={handleChange}
                                placeholder="Enter contact name"
                            />
                        </div>

                        <div className="profile-field">
                            <label>Contact Phone</label>
                            <input
                                type="tel"
                                name="emergency_contact_phone"
                                value={profile.emergency_contact_phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>
                </section>

                <div className="profile-save-wrapper">
                    <button type="submit" disabled={saving}>
                        <Save size={18} />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Profile;