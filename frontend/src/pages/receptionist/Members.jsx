import { useEffect, useState } from "react";
import {
    Search,
    Users,
    UserRound,
    Mail,
    Phone,
    MoreVertical,
    X,
    CalendarDays,
    ShieldCheck,
    ClipboardCheck,
    CreditCard,
    Wallet,
    Clock3,
} from "lucide-react";

import api from "../../services/api";
import receptionistService from "../../services/receptionistService";

const Members = () => {
    const [members, setMembers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState(null);

    const [selectedMember, setSelectedMember] = useState(null);
    const [modalType, setModalType] = useState(null);

    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [membershipRecords, setMembershipRecords] = useState([]);
    const [paymentRecords, setPaymentRecords] = useState([]);

    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        const loadMembers = async () => {
            try {
                const data = await receptionistService.getMembers();
                setMembers(data);
            } catch (error) {
                console.error("Unable to load members:", error);
            } finally {
                setLoading(false);
            }
        };

        loadMembers();
    }, []);

    const filteredMembers = members.filter((member) => {
        const searchText = search.toLowerCase();

        return (
            member.username?.toLowerCase().includes(searchText) ||
            member.first_name?.toLowerCase().includes(searchText) ||
            member.last_name?.toLowerCase().includes(searchText) ||
            member.email?.toLowerCase().includes(searchText) ||
            member.phone?.toLowerCase().includes(searchText)
        );
    });

    const getInitials = (member) => {
        const first = member.first_name?.charAt(0) || "";
        const last = member.last_name?.charAt(0) || "";

        return `${first}${last}`.toUpperCase() || "M";
    };

    const toggleMenu = (memberId) => {
        setActiveMenu(
            activeMenu === memberId
                ? null
                : memberId
        );
    };

    const openProfile = (member) => {
        setSelectedMember(member);
        setModalType("profile");
        setActiveMenu(null);
    };

    const openAttendance = async (member) => {
        setSelectedMember(member);
        setModalType("attendance");
        setActiveMenu(null);
        setModalLoading(true);

        try {
            const response = await api.get("/attendance/records/");

            const data = response.data?.results || response.data || [];

            const records = data.filter(
                (record) => Number(record.member) === Number(member.id)
            );

            setAttendanceRecords(records);
        } catch (error) {
            console.error(
                "Unable to load attendance:",
                error
            );
            setAttendanceRecords([]);
        } finally {
            setModalLoading(false);
        }
    };

    const openMembership = async (member) => {
        setSelectedMember(member);
        setModalType("membership");
        setActiveMenu(null);
        setModalLoading(true);

        try {
            const response = await api.get(
                "/memberships/records/"
            );

            const data = response.data?.results || response.data || [];

            const records = data.filter(
                (record) => Number(record.member) === Number(member.id)
            );

            setMembershipRecords(records);
        } catch (error) {
            console.error(
                "Unable to load membership:",
                error
            );
            setMembershipRecords([]);
        } finally {
            setModalLoading(false);
        }
    };

    const openPayments = async (member) => {
        setSelectedMember(member);
        setModalType("payments");
        setActiveMenu(null);
        setModalLoading(true);

        try {
            const response = await api.get(
                "/payments/records/"
            );

            const data = response.data?.results || response.data || [];

            const records = data.filter(
                (record) => Number(record.member) === Number(member.id)
            );

            setPaymentRecords(records);
        } catch (error) {
            console.error(
                "Unable to load payments:",
                error
            );
            setPaymentRecords([]);
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedMember(null);
        setModalType(null);
        setModalLoading(false);
    };

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const formatDateTime = (date) => {
        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    const getStatusClass = (status) => {
        if (status === "ACTIVE" || status === "SUCCESSFUL") {
            return "success";
        }

        if (status === "PENDING") {
            return "pending";
        }

        if (
            status === "EXPIRED" ||
            status === "FAILED" ||
            status === "CANCELLED"
        ) {
            return "danger";
        }

        return "default";
    };

    const renderProfileModal = () => {
        if (!selectedMember) {
            return null;
        }

        return (
            <>
                <div className="receptionist-member-modal-header">
                    <div>
                        <h2>Member Profile</h2>
                        <p>
                            View member account information
                        </p>
                    </div>

                    <button
                        type="button"
                        className="receptionist-member-modal-close"
                        onClick={closeModal}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="receptionist-member-modal-profile">
                    <div className="receptionist-member-modal-avatar">
                        {getInitials(selectedMember)}
                    </div>

                    <div>
                        <h3>
                            {selectedMember.first_name}{" "}
                            {selectedMember.last_name}
                        </h3>

                        <span>
                            @{selectedMember.username}
                        </span>
                    </div>

                    <div className="receptionist-member-modal-status">
                        <ShieldCheck size={15} />
                        Active
                    </div>
                </div>

                <div className="receptionist-member-modal-section">
                    <div className="receptionist-member-modal-section-title">
                        <UserRound size={17} />
                        <h4>Personal Information</h4>
                    </div>

                    <div className="receptionist-member-modal-grid">
                        <div className="receptionist-member-modal-field">
                            <span>First Name</span>
                            <strong>
                                {selectedMember.first_name ||
                                    "Not provided"}
                            </strong>
                        </div>

                        <div className="receptionist-member-modal-field">
                            <span>Last Name</span>
                            <strong>
                                {selectedMember.last_name ||
                                    "Not provided"}
                            </strong>
                        </div>

                        <div className="receptionist-member-modal-field">
                            <span>Member ID</span>
                            <strong>
                                #{selectedMember.id}
                            </strong>
                        </div>

                        <div className="receptionist-member-modal-field">
                            <span>Username</span>
                            <strong>
                                @{selectedMember.username}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="receptionist-member-modal-section">
                    <div className="receptionist-member-modal-section-title">
                        <Mail size={17} />
                        <h4>Contact Information</h4>
                    </div>

                    <div className="receptionist-member-modal-grid">
                        <div className="receptionist-member-modal-field">
                            <span>Email</span>
                            <strong>
                                {selectedMember.email ||
                                    "Not provided"}
                            </strong>
                        </div>

                        <div className="receptionist-member-modal-field">
                            <span>Phone</span>
                            <strong>
                                {selectedMember.phone ||
                                    "Not provided"}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="receptionist-member-modal-section">
                    <div className="receptionist-member-modal-section-title">
                        <CalendarDays size={17} />
                        <h4>Account</h4>
                    </div>

                    <div className="receptionist-member-modal-grid">
                        <div className="receptionist-member-modal-field">
                            <span>Role</span>
                            <strong>Member</strong>
                        </div>

                        <div className="receptionist-member-modal-field">
                            <span>Account Status</span>
                            <strong>Active</strong>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderAttendanceModal = () => (
        <>
            <div className="receptionist-member-modal-header">
                <div>
                    <h2>Attendance History</h2>
                    <p>
                        Attendance records for{" "}
                        {selectedMember?.first_name}{" "}
                        {selectedMember?.last_name}
                    </p>
                </div>

                <button
                    type="button"
                    className="receptionist-member-modal-close"
                    onClick={closeModal}
                >
                    <X size={20} />
                </button>
            </div>

            <div className="receptionist-member-history-summary">
                <div>
                    <ClipboardCheck size={20} />
                    <div>
                        <span>Total Records</span>
                        <strong>
                            {attendanceRecords.length}
                        </strong>
                    </div>
                </div>
            </div>

            {modalLoading ? (
                <div className="receptionist-member-history-state">
                    <Clock3 size={30} />
                    <h3>Loading attendance...</h3>
                    <p>Please wait.</p>
                </div>
            ) : attendanceRecords.length === 0 ? (
                <div className="receptionist-member-history-state">
                    <ClipboardCheck size={30} />
                    <h3>No attendance records</h3>
                    <p>
                        This member does not have any attendance
                        records yet.
                    </p>
                </div>
            ) : (
                <div className="receptionist-member-history-list">
                    {attendanceRecords.map((record) => (
                        <div
                            className="receptionist-member-history-item"
                            key={record.id}
                        >
                            <div className="receptionist-history-icon">
                                <ClipboardCheck size={18} />
                            </div>

                            <div className="receptionist-history-main">
                                <strong>
                                    {formatDate(record.date)}
                                </strong>

                                <span>
                                    Check-in:{" "}
                                    {formatDateTime(
                                        record.check_in
                                    )}
                                </span>

                                <span>
                                    Check-out:{" "}
                                    {formatDateTime(
                                        record.check_out
                                    )}
                                </span>
                            </div>

                            <span
                                className={`receptionist-history-status ${getStatusClass(
                                    record.status
                                )}`}
                            >
                                {record.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    const renderMembershipModal = () => (
        <>
            <div className="receptionist-member-modal-header">
                <div>
                    <h2>Membership</h2>
                    <p>
                        Membership details for{" "}
                        {selectedMember?.first_name}{" "}
                        {selectedMember?.last_name}
                    </p>
                </div>

                <button
                    type="button"
                    className="receptionist-member-modal-close"
                    onClick={closeModal}
                >
                    <X size={20} />
                </button>
            </div>

            {modalLoading ? (
                <div className="receptionist-member-history-state">
                    <Clock3 size={30} />
                    <h3>Loading membership...</h3>
                    <p>Please wait.</p>
                </div>
            ) : membershipRecords.length === 0 ? (
                <div className="receptionist-member-history-state">
                    <CreditCard size={30} />
                    <h3>No membership found</h3>
                    <p>
                        This member does not have a membership
                        record yet.
                    </p>
                </div>
            ) : (
                <div className="receptionist-member-history-list">
                    {membershipRecords.map((membership) => (
                        <div
                            className="receptionist-membership-card"
                            key={membership.id}
                        >
                            <div className="receptionist-membership-card-header">
                                <div>
                                    <span>Membership #{membership.id}</span>
                                    <h3>
                                        {membership.plan_name ||
                                            membership.plan?.name ||
                                            `Plan #${membership.plan}`}
                                    </h3>
                                </div>

                                <span
                                    className={`receptionist-history-status ${getStatusClass(
                                        membership.status
                                    )}`}
                                >
                                    {membership.status}
                                </span>
                            </div>

                            <div className="receptionist-membership-details">
                                <div>
                                    <span>Start Date</span>
                                    <strong>
                                        {formatDate(
                                            membership.start_date
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>End Date</span>
                                    <strong>
                                        {formatDate(
                                            membership.end_date
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>Amount Paid</span>
                                    <strong>
                                        ₹
                                        {Number(
                                            membership.amount_paid || 0
                                        ).toLocaleString("en-IN")}
                                    </strong>
                                </div>

                                <div>
                                    <span>Remaining Days</span>
                                    <strong>
                                        {membership.remaining_days ??
                                            "—"}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    const renderPaymentsModal = () => (
        <>
            <div className="receptionist-member-modal-header">
                <div>
                    <h2>Payment History</h2>
                    <p>
                        Payment records for{" "}
                        {selectedMember?.first_name}{" "}
                        {selectedMember?.last_name}
                    </p>
                </div>

                <button
                    type="button"
                    className="receptionist-member-modal-close"
                    onClick={closeModal}
                >
                    <X size={20} />
                </button>
            </div>

            {modalLoading ? (
                <div className="receptionist-member-history-state">
                    <Clock3 size={30} />
                    <h3>Loading payments...</h3>
                    <p>Please wait.</p>
                </div>
            ) : paymentRecords.length === 0 ? (
                <div className="receptionist-member-history-state">
                    <Wallet size={30} />
                    <h3>No payments found</h3>
                    <p>
                        This member does not have any payment
                        records yet.
                    </p>
                </div>
            ) : (
                <div className="receptionist-member-history-list">
                    {paymentRecords.map((payment) => (
                        <div
                            className="receptionist-member-history-item"
                            key={payment.id}
                        >
                            <div className="receptionist-history-icon">
                                <Wallet size={18} />
                            </div>

                            <div className="receptionist-history-main">
                                <strong>
                                    ₹
                                    {Number(
                                        payment.amount || 0
                                    ).toLocaleString("en-IN")}
                                </strong>

                                <span>
                                    Method:{" "}
                                    {payment.method || "—"}
                                </span>

                                <span>
                                    Date:{" "}
                                    {formatDateTime(
                                        payment.payment_date
                                    )}
                                </span>

                                {payment.transaction_id && (
                                    <span>
                                        Transaction:{" "}
                                        {payment.transaction_id}
                                    </span>
                                )}
                            </div>

                            <span
                                className={`receptionist-history-status ${getStatusClass(
                                    payment.status
                                )}`}
                            >
                                {payment.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    return (
        <div className="receptionist-members-page">
            {/* =========================
                PAGE HEADER
            ========================== */}
            <div className="receptionist-members-page-header">
                <div>
                    <div className="receptionist-members-title-row">
                        <div className="receptionist-members-title-icon">
                            <Users size={22} />
                        </div>

                        <div>
                            <h1>Members</h1>
                            <p>
                                Manage and view all registered gym members.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="receptionist-members-total">
                    <span>Total Members</span>
                    <strong>{members.length}</strong>
                </div>
            </div>

            {/* =========================
                SEARCH
            ========================== */}
            <div className="receptionist-members-toolbar">
                <div className="receptionist-members-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search by name, username, email or phone..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />
                </div>

                <div className="receptionist-members-result-count">
                    {filteredMembers.length}{" "}
                    {filteredMembers.length === 1
                        ? "member"
                        : "members"}{" "}
                    found
                </div>
            </div>

            {/* =========================
                TABLE
            ========================== */}
            <div className="receptionist-members-card">
                {loading ? (
                    <div className="receptionist-members-state">
                        <Users size={32} />
                        <h3>Loading members...</h3>
                        <p>
                            Please wait while we fetch member data.
                        </p>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="receptionist-members-state">
                        <UserRound size={34} />
                        <h3>No members found</h3>
                        <p>
                            Try changing your search or add a new member.
                        </p>
                    </div>
                ) : (
                    <div className="receptionist-members-table-wrapper">
                        <table className="receptionist-members-table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Contact</th>
                                    <th>Phone</th>
                                    <th>Member ID</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td>
                                            <div className="receptionist-member-profile">
                                                <div className="receptionist-member-avatar">
                                                    {getInitials(member)}
                                                </div>

                                                <div className="receptionist-member-info">
                                                    <strong>
                                                        {member.first_name}{" "}
                                                        {member.last_name}
                                                    </strong>

                                                    <span>
                                                        @{member.username}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="receptionist-member-contact">
                                                <div>
                                                    <Mail size={14} />
                                                    <span>
                                                        {member.email ||
                                                            "No email"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="receptionist-member-phone">
                                                <Phone size={14} />
                                                <span>
                                                    {member.phone ||
                                                        "Not provided"}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="receptionist-member-id">
                                                #{member.id}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="receptionist-member-status">
                                                Active
                                            </span>
                                        </td>

                                        <td>
                                            <div className="receptionist-member-action-wrapper">
                                                <button
                                                    type="button"
                                                    className="receptionist-member-action"
                                                    title="More options"
                                                    onClick={() =>
                                                        toggleMenu(
                                                            member.id
                                                        )
                                                    }
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {activeMenu === member.id && (
                                                    <div className="receptionist-member-menu">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openProfile(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            View Profile
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openAttendance(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            View Attendance
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openMembership(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            View Membership
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openPayments(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            View Payments
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* =========================
                MODAL
            ========================== */}
            {selectedMember && (
                <div
                    className="receptionist-member-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="receptionist-member-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        {modalType === "profile" &&
                            renderProfileModal()}

                        {modalType === "attendance" &&
                            renderAttendanceModal()}

                        {modalType === "membership" &&
                            renderMembershipModal()}

                        {modalType === "payments" &&
                            renderPaymentsModal()}

                        <div className="receptionist-member-modal-footer">
                            <button
                                type="button"
                                onClick={closeModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Members;