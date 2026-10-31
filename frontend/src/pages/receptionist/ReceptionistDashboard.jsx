import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {

    Users,

    UserCheck,

    UserPlus,

    CreditCard,

    CalendarCheck,

    Clock,

    X,

    CheckCircle2,

    Eye,

    EyeOff,
    
    Dumbbell

} from "lucide-react";

import attendanceService from "../../services/attendanceService";

import receptionistService from "../../services/receptionistService";

import membershipService from "../../services/membershipService";

import paymentService from "../../services/paymentService";

import api from "../../services/api";
import "../../styles/ReceptionistDashboard.css";

const ReceptionistDashboard = () => {

    const navigate = useNavigate();

    const [attendance, setAttendance] = useState([]);

    const [members, setMembers] = useState([]);

    const [dashboardPayments, setDashboardPayments] = useState([]);

    const [loadingPayments, setLoadingPayments] = useState(true);

    const [loadingAttendance, setLoadingAttendance] = useState(true);

    const [loadingMembers, setLoadingMembers] = useState(true);

    const [loadingMemberships, setLoadingMemberships] = useState(false);

    const [showAttendanceForm, setShowAttendanceForm] = useState(false);

    const [showAddMemberForm, setShowAddMemberForm] = useState(false);

    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const [savingAttendance, setSavingAttendance] = useState(false);

    const [savingMember, setSavingMember] = useState(false);

    const [savingPayment, setSavingPayment] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");

    const [errorMessage, setErrorMessage] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({

        member: "",

        date: new Date().toISOString().split("T")[0],

        check_in: "",

        status: "PRESENT",

        notes: "",

    });

    const [memberFormData, setMemberFormData] = useState({

        first_name: "",

        last_name: "",

        username: "",

        email: "",

        phone: "",

        password: "",

        confirm_password: "",

    });

    const [memberships, setMemberships] = useState([]);

    const [paymentFormData, setPaymentFormData] = useState({

        member: "",

        membership: "",

        method: "CASH",

        transaction_id: "",

        notes: "",

    });

    // Use the browser's local date so dashboard totals match the receptionist's day.
    const getLocalDate = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const today = getLocalDate();

    const todayAttendance = attendance.filter((record) => {
        const attendanceDate = String(record.date || record.created_at || "").slice(0, 10);
        return attendanceDate === today;
    });

    const newMembersToday = members.filter((member) => {
        const joinedDate =
            member.date_joined ||
            member.created_at ||
            member.joined_at ||
            member.created ||
            member.created_on ||
            member.join_date;
        return joinedDate && String(joinedDate).slice(0, 10) === today;
    }).length;

    const todaySuccessfulPayments = dashboardPayments.filter((payment) => {
        const paymentDate =
            payment.payment_date ||
            payment.date ||
            payment.created_at ||
            payment.created ||
            payment.updated_at;
        return (
            String(paymentDate || "").slice(0, 10) === today &&
            ((payment.payment_status || payment.status) === "SUCCESSFUL")
        );
    });

    const todayPaymentTotal = todaySuccessfulPayments.reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
    );

    /* =========================

       LOAD ATTENDANCE

    ========================== */

    const loadAttendance = async () => {

        try {

            setLoadingAttendance(true);

            const data = await attendanceService.getAttendance();

            setAttendance(data.results || data);

        } catch (error) {

            console.error("Unable to load attendance:", error);

        } finally {

            setLoadingAttendance(false);

        }

    };

    /* =========================

       LOAD MEMBERS

    ========================== */

    const loadMembers = async () => {

        try {

            setLoadingMembers(true);

            const data = await receptionistService.getMembers();

            setMembers(data);

        } catch (error) {

            console.error("Unable to load members:", error);

            setErrorMessage("Unable to load members.");

        } finally {

            setLoadingMembers(false);

        }

    };

    const getListData = (data) => {

        return data?.results || data || [];

    };

    const getPlanId = (membership) => {

        if (membership?.plan && typeof membership.plan === "object") {

            return membership.plan.id;

        }

        return membership?.plan;

    };

    const getPlanName = (membership, plans) => {

        if (membership?.plan_name) {

            return membership.plan_name;

        }

        if (membership?.plan?.name) {

            return membership.plan.name;

        }

        const planId = getPlanId(membership);

        const plan = plans.find(

            (item) => Number(item.id) === Number(planId)

        );

        return plan?.name || `Plan #${planId || "-"}`;

    };

    const getMembershipAmount = (membership, plans) => {

        if (membership?.plan?.price !== undefined && membership?.plan?.price !== null) {

            return Number(membership.plan.price);

        }

        if (membership?.amount !== undefined && membership?.amount !== null) {

            return Number(membership.amount);

        }

        const planId = getPlanId(membership);

        const plan = plans.find(

            (item) => Number(item.id) === Number(planId)

        );

        return Number(plan?.price || 0);

    };

    const getMemberName = (memberId) => {

        const member = members.find(

            (item) => Number(item.id) === Number(memberId)

        );

        if (!member) return "Member";

        const fullName = `${member.first_name || ""} ${member.last_name || ""}`.trim();

        return fullName || member.username || "Member";

    };

    const loadMemberships = async (memberId = "") => {

        try {

            setLoadingMemberships(true);

            const [membershipResponse, planResponse, paymentResponse] =

                await Promise.all([

                    membershipService.getMemberships(),

                    membershipService.getMembershipPlans(),

                    paymentService.getPayments(),

                ]);

            const membershipData = getListData(membershipResponse);

            const plansData = getListData(planResponse);

            const paymentData = getListData(paymentResponse);

            const paidMembershipIds = new Set(

                paymentData

                    .filter((payment) => (payment.payment_status || payment.status) === "SUCCESSFUL")

                    .map((payment) => Number(payment.membership))

            );

            const availableMemberships = membershipData.filter((membership) => {

                const belongsToMember =

                    !memberId ||

                    Number(membership.member) === Number(memberId);

                const validStatus = !["CANCELLED", "EXPIRED"].includes(

                    membership.status

                );

                const alreadyPaid = paidMembershipIds.has(

                    Number(membership.id)

                );

                return belongsToMember && validStatus && !alreadyPaid;

            });

            setMemberships(

                availableMemberships.map((membership) => ({

                    ...membership,

                    display_plan_name: getPlanName(membership, plansData),

                    display_amount: getMembershipAmount(

                        membership,

                        plansData

                    ),

                }))

            );

        } catch (error) {

            console.error("Unable to load memberships:", error);

            setMemberships([]);

            setErrorMessage("Unable to load memberships.");

        } finally {

            setLoadingMemberships(false);

        }

    };

    const loadDashboardPayments = async () => {
        try {
            setLoadingPayments(true);
            const response = await paymentService.getPayments();
            setDashboardPayments(getListData(response));
        } catch (error) {
            console.error("Unable to load dashboard payments:", error);
            setDashboardPayments([]);
        } finally {
            setLoadingPayments(false);
        }
    };

    useEffect(() => {
        loadAttendance();
        loadMembers();
        loadDashboardPayments();
    }, []);

    /* =========================

       ATTENDANCE FORM INPUT

    ========================== */

    const handleInputChange = (event) => {

        const { name, value } = event.target;

        setFormData((previous) => ({

            ...previous,

            [name]: value,

        }));

    };

    /* =========================

       MEMBER FORM INPUT

    ========================== */

    const handleMemberInputChange = (event) => {

        const { name, value } = event.target;

        setMemberFormData((previous) => ({

            ...previous,

            [name]: value,

        }));

    };

    /* =========================

       OPEN ATTENDANCE FORM

    ========================== */

    const openAttendanceForm = () => {

        setSuccessMessage("");

        setErrorMessage("");

        setFormData({

            member: "",

            date: today,

            check_in: "",

            status: "PRESENT",

            notes: "",

        });

        setShowAttendanceForm(true);

    };

    /* =========================

       CLOSE ATTENDANCE FORM

    ========================== */

    const closeAttendanceForm = () => {

        if (savingAttendance) return;

        setShowAttendanceForm(false);

        setSuccessMessage("");

        setErrorMessage("");

    };

    /* =========================

       OPEN ADD MEMBER FORM

    ========================== */

    const openAddMemberForm = () => {

        setSuccessMessage("");

        setErrorMessage("");

        setMemberFormData({

            first_name: "",

            last_name: "",

            username: "",

            email: "",

            phone: "",

            password: "",

            confirm_password: "",

        });

        setShowPassword(false);

        setShowConfirmPassword(false);

        setShowAddMemberForm(true);

    };

    /* =========================

       CLOSE ADD MEMBER FORM

    ========================== */

    const closeAddMemberForm = () => {

        if (savingMember) return;

        setShowAddMemberForm(false);

        setSuccessMessage("");

        setErrorMessage("");

        setMemberFormData({

            first_name: "",

            last_name: "",

            username: "",

            email: "",

            phone: "",

            password: "",

            confirm_password: "",

        });

        setShowPassword(false);

        setShowConfirmPassword(false);

    };

    /* =========================

       SUBMIT ATTENDANCE

    ========================== */

    const handleSubmitAttendance = async (event) => {

        event.preventDefault();

        setSuccessMessage("");

        setErrorMessage("");

        if (!formData.member) {

            setErrorMessage("Please select a member.");

            return;

        }

        if (!formData.date) {

            setErrorMessage("Please select an attendance date.");

            return;

        }

        try {

            setSavingAttendance(true);

            const attendanceData = {

                member: Number(formData.member),

                date: formData.date,

                check_in: formData.check_in

                    ? `${formData.date}T${formData.check_in}:00`

                    : null,

                check_out: null,

                status: formData.status,

                notes: formData.notes || null,

            };

            await receptionistService.createAttendance(

                attendanceData

            );

            setSuccessMessage(

                "Attendance recorded successfully."

            );

            await loadAttendance();

            setFormData({

                member: "",

                date: today,

                check_in: "",

                status: "PRESENT",

                notes: "",

            });

            setTimeout(() => {

                setShowAttendanceForm(false);

                setSuccessMessage("");

            }, 1200);

        } catch (error) {

            console.error(

                "Unable to record attendance:",

                error

            );

            const message =

                error.response?.data?.non_field_errors?.[0] ||

                error.response?.data?.detail ||

                "Unable to record attendance.";

            setErrorMessage(message);

        } finally {

            setSavingAttendance(false);

        }

    };

    /* =========================

       SUBMIT NEW MEMBER

    ========================== */

    const handleSubmitMember = async (event) => {

        event.preventDefault();

        setSuccessMessage("");

        setErrorMessage("");

        const {

            first_name,

            last_name,

            username,

            email,

            phone,

            password,

            confirm_password,

        } = memberFormData;

        if (

            !first_name.trim() ||

            !last_name.trim() ||

            !username.trim() ||

            !email.trim() ||

            !phone.trim() ||

            !password ||

            !confirm_password

        ) {

            setErrorMessage(

                "Please fill in all required fields."

            );

            return;

        }

        if (password.length < 8) {

            setErrorMessage(

                "Password must contain at least 8 characters."

            );

            return;

        }

        if (password !== confirm_password) {

            setErrorMessage(

                "Password and confirm password do not match."

            );

            return;

        }

        try {

            setSavingMember(true);

            await api.post("/auth/register/", {

                username: username.trim(),

                email: email.trim(),

                password,

                first_name: first_name.trim(),

                last_name: last_name.trim(),

                phone: phone.trim(),

            });

            setSuccessMessage(

                "Member added successfully."

            );

            await loadMembers();

            setMemberFormData({

                first_name: "",

                last_name: "",

                username: "",

                email: "",

                phone: "",

                password: "",

                confirm_password: "",

            });

            setTimeout(() => {

                setShowAddMemberForm(false);

                setSuccessMessage("");

            }, 1400);

        } catch (error) {

            console.error(

                "Unable to add member:",

                error

            );

            const data = error.response?.data;

            let message =

                data?.detail ||

                data?.message ||

                "Unable to add member.";

            if (typeof data === "object" && data !== null) {

                const fieldErrors = [];

                Object.entries(data).forEach(

                    ([field, value]) => {

                        if (Array.isArray(value)) {

                            fieldErrors.push(

                                `${field}: ${value[0]}`

                            );

                        } else if (typeof value === "string") {

                            fieldErrors.push(

                                `${field}: ${value}`

                            );

                        }

                    }

                );

                if (fieldErrors.length > 0) {

                    message = fieldErrors.join(" | ");

                }

            }

            setErrorMessage(message);

        } finally {

            setSavingMember(false);

        }

    };

    const handlePaymentInputChange = (event) => {

        const { name, value } = event.target;

        setPaymentFormData((previous) => ({

            ...previous,

            [name]: value,

        }));

        if (name === "member") {

            setPaymentFormData((previous) => ({

                ...previous,

                member: value,

                membership: "",

            }));

            setMemberships([]);

            if (value) {

                loadMemberships(value);

            }

        }

    };

    const openPaymentForm = async () => {

        setSuccessMessage("");

        setErrorMessage("");

        setPaymentFormData({

            member: "",

            membership: "",

            method: "CASH",

            transaction_id: "",

            notes: "",

        });

        setMemberships([]);

        setShowPaymentForm(true);

    };

    const closePaymentForm = () => {

        if (savingPayment) return;

        setShowPaymentForm(false);

        setSuccessMessage("");

        setErrorMessage("");

        setPaymentFormData({

            member: "",

            membership: "",

            method: "CASH",

            transaction_id: "",

            notes: "",

        });

        setMemberships([]);

    };

    const selectedMembership = memberships.find(

        (membership) =>

            Number(membership.id) === Number(paymentFormData.membership)

    );

    const selectedPaymentAmount = selectedMembership

        ? Number(selectedMembership.display_amount || 0)

        : 0;

    const handleSubmitPayment = async (event) => {

        event.preventDefault();

        setSuccessMessage("");

        setErrorMessage("");

        const {

            member,

            membership,

            method,

            transaction_id,

            notes,

        } = paymentFormData;

        if (!member) {

            setErrorMessage("Please select a member.");

            return;

        }

        if (!membership) {

            setErrorMessage("Please select a membership.");

            return;

        }

        if (!selectedMembership) {

            setErrorMessage("Selected membership is not available.");

            return;

        }

        if (selectedPaymentAmount <= 0) {

            setErrorMessage(

                "Unable to determine the membership amount."

            );

            return;

        }

        if (

            ["UPI", "CARD", "ONLINE"].includes(method) &&

            !transaction_id.trim()

        ) {

            setErrorMessage(

                "Transaction ID is required for this payment method."

            );

            return;

        }

        try {

            setSavingPayment(true);

            await paymentService.createPayment({

                member: Number(member),

                membership: Number(membership),

                amount: selectedPaymentAmount.toFixed(2),

                payment_method: method,

                transaction_id: transaction_id.trim() || null,

                notes: notes.trim() || null,

            });

            setSuccessMessage(

                `Payment of ₹${selectedPaymentAmount.toLocaleString(

                    "en-IN"

                )} recorded as pending for ${getMemberName(member)}. Please confirm it from Payment History.`

            );

            await loadAttendance();

            await loadMemberships(member);

            setPaymentFormData({

                member: "",

                membership: "",

                method: "CASH",

                transaction_id: "",

                notes: "",

            });

            setTimeout(() => {

                setShowPaymentForm(false);

                setSuccessMessage("");

            }, 1400);

        } catch (error) {

            console.error("Unable to record payment:", error);

            const data = error.response?.data;

            let message =

                data?.detail ||

                data?.message ||

                "Unable to record payment.";

            if (typeof data === "object" && data !== null) {

                const fieldErrors = [];

                Object.entries(data).forEach(([field, value]) => {

                    if (Array.isArray(value)) {

                        fieldErrors.push(`${field}: ${value[0]}`);

                    } else if (typeof value === "string") {

                        fieldErrors.push(`${field}: ${value}`);

                    }

                });

                if (fieldErrors.length > 0) {

                    message = fieldErrors.join(" | ");

                }

            }

            setErrorMessage(message);

        } finally {

            setSavingPayment(false);

        }

    };

    return (

        <div className="receptionist-page">

            {/* =========================

                PAGE HEADER

            ========================== */}

            <div className="receptionist-page-header">
                <div className="receptionist-brand">
                    <div className="receptionist-brand-icon">
                        <Dumbbell size={29} strokeWidth={2.2} />
                    </div>

                    <div>
                        <h2>SmartGym</h2>
                        <span>FITNESS MANAGEMENT</span>
                    </div>
                </div>
                <div>

                    <h2>Receptionist Dashboard</h2>

                    <p>

                        Manage members, attendance, memberships and daily gym

                        activities.

                    </p>

                </div>

            </div>

            {/* =========================

                STATISTICS

            ========================== */}

            <div className="receptionist-stats">

                <div className="receptionist-stat-card">

                    <div className="receptionist-stat-icon">

                        <Users size={22} />

                    </div>

                    <div>

                        <span>Total Members</span>

                        <strong>{members.length}</strong>

                    </div>

                </div>

                <div className="receptionist-stat-card">

                    <div className="receptionist-stat-icon">

                        <UserCheck size={22} />

                    </div>

                    <div>

                        <span>Today's Attendance</span>

                        <strong>

                            {loadingAttendance

                                ? "..."

                                : todayAttendance.length}

                        </strong>

                    </div>

                </div>

                <div className="receptionist-stat-card">

                    <div className="receptionist-stat-icon">

                        <UserPlus size={22} />

                    </div>

                    <div>

                        <span>New Members</span>

                        <strong>{loadingMembers ? "..." : newMembersToday}</strong>

                    </div>

                </div>

                <div className="receptionist-stat-card">

                    <div className="receptionist-stat-icon">

                        <CreditCard size={22} />

                    </div>

                    <div>

                        <span>Today's Payments</span>

                        <strong>
                            {loadingPayments
                                ? "..."
                                : `₹${todayPaymentTotal.toLocaleString("en-IN", {
                                      maximumFractionDigits: 0,
                                  })}`}
                        </strong>

                    </div>

                </div>

            </div>

            {/* =========================

                DASHBOARD SECTIONS

            ========================== */}

            <div className="receptionist-dashboard-grid">

                {/* QUICK ACTIONS */}

                <div className="receptionist-section">

                    <div className="receptionist-section-header">

                        <div>

                            <h2>Quick Actions</h2>

                            <p>

                                Frequently used receptionist actions.

                            </p>

                        </div>

                    </div>

                    <div className="receptionist-actions">

                        <button

                            type="button"

                            onClick={openAddMemberForm}

                        >

                            <UserPlus size={20} />

                            <span>Add Member</span>

                        </button>

                        <button
                                type="button"
                                className="receptionist-quick-action"
                                onClick={() => navigate("/receptionist/memberships")}
                            >
                                <CreditCard size={20} />
                                <span>Manage Memberships</span>
                            </button>

                        <button

                            type="button"

                            onClick={openAttendanceForm}

                        >

                            <CalendarCheck size={20} />

                            <span>Record Attendance</span>

                        </button>

                        <button

                            type="button"

                            onClick={openPaymentForm}

                        >

                            <CreditCard size={20} />

                            <span>Record Payment</span>

                        </button>

                        <button

                            type="button"

                            className="receptionist-quick-action"

                            onClick={() => navigate("/receptionist/payments")}

                        >

                            <CreditCard size={20} />

                            <span>

                                Payment History

                            </span>

                        </button>

                        <button

                            type="button"

                            onClick={() =>

                                navigate(

                                    "/receptionist/members"

                                )

                            }

                        >

                            <Users size={20} />

                            <span>View Members</span>

                        </button>

                        <button

                            type="button"

                            className="receptionist-quick-action"

                            onClick={() => navigate("/receptionist/enquiries")}

                        >

                            <Users size={20} />

                            <span>Manage Enquiries</span>

                        </button>

                        
                            


                    </div>

                </div>

                {/* TODAY'S ACTIVITY */}

                <div className="receptionist-section">

                    <div className="receptionist-section-header">

                        <div>

                            <h2>Today's Activity</h2>

                            <p>

                                Recent activity at the gym.

                            </p>

                        </div>

                    </div>

                    <div className="receptionist-activity-list">

                        {loadingAttendance ? (

                            <div className="receptionist-empty">

                                <Clock size={34} />

                                <h3>

                                    Loading activity...

                                </h3>

                            </div>

                        ) : todayAttendance.length === 0 ? (

                            <div className="receptionist-empty">

                                <Clock size={34} />

                                <h3>

                                    No attendance yet

                                </h3>

                                <p>

                                    Today's member check-ins will appear here.

                                </p>

                            </div>

                        ) : (

                            todayAttendance.map((record) => (

                                <div

                                    className="receptionist-activity-item"

                                    key={record.id}

                                >

                                    <div className="receptionist-activity-icon">

                                        <UserCheck size={18} />

                                    </div>

                                    <div className="receptionist-activity-info">

                                        <strong>

                                            {record.member_name ||

                                                "Member"}

                                        </strong>

                                        <span>

                                            {record.status === "PRESENT"

                                                ? "Present"

                                                : "Absent"}

                                        </span>

                                    </div>

                                    <div className="receptionist-activity-time">

                                        {record.check_in

                                            ? new Date(

                                                record.check_in

                                            ).toLocaleTimeString(

                                                [],

                                                {

                                                    hour: "2-digit",

                                                    minute: "2-digit",

                                                }

                                            )

                                            : "--"}

                                    </div>

                                </div>

                            ))

                        )}

                    </div>

                </div>

            </div>

            {/* =====================================================

                ADD MEMBER MODAL

            ====================================================== */}

            {showAddMemberForm && (

                <div className="receptionist-modal-overlay">

                    <div className="receptionist-modal">

                        <div className="receptionist-modal-header">

                            <div>

                                <h2>Add New Member</h2>

                                <p>

                                    Create a new gym member account.

                                </p>

                            </div>

                            <button

                                type="button"

                                className="receptionist-modal-close"

                                onClick={closeAddMemberForm}

                                disabled={savingMember}

                            >

                                <X size={20} />

                            </button>

                        </div>

                        {successMessage && (

                            <div className="receptionist-success">

                                <CheckCircle2 size={18} />

                                <span>

                                    {successMessage}

                                </span>

                            </div>

                        )}

                        {errorMessage && (

                            <div className="receptionist-error">

                                {errorMessage}

                            </div>

                        )}

                        <form

                            className="receptionist-form"

                            onSubmit={handleSubmitMember}

                        >

                            <div className="receptionist-form-row">

                                <div className="receptionist-form-group">

                                    <label htmlFor="first_name">

                                        First Name

                                    </label>

                                    <input

                                        id="first_name"

                                        type="text"

                                        name="first_name"

                                        value={

                                            memberFormData.first_name

                                        }

                                        onChange={

                                            handleMemberInputChange

                                        }

                                        placeholder="Enter first name"

                                        disabled={savingMember}

                                        required

                                    />

                                </div>

                                <div className="receptionist-form-group">

                                    <label htmlFor="last_name">

                                        Last Name

                                    </label>

                                    <input

                                        id="last_name"

                                        type="text"

                                        name="last_name"

                                        value={

                                            memberFormData.last_name

                                        }

                                        onChange={

                                            handleMemberInputChange

                                        }

                                        placeholder="Enter last name"

                                        disabled={savingMember}

                                        required

                                    />

                                </div>

                            </div>

                            <div className="receptionist-form-row">

                                <div className="receptionist-form-group">

                                    <label htmlFor="username">

                                        Username

                                    </label>

                                    <input

                                        id="username"

                                        type="text"

                                        name="username"

                                        value={

                                            memberFormData.username

                                        }

                                        onChange={

                                            handleMemberInputChange

                                        }

                                        placeholder="Enter username"

                                        disabled={savingMember}

                                        required

                                    />

                                </div>

                                <div className="receptionist-form-group">

                                    <label htmlFor="email">

                                        Email

                                    </label>

                                    <input

                                        id="email"

                                        type="email"

                                        name="email"

                                        value={

                                            memberFormData.email

                                        }

                                        onChange={

                                            handleMemberInputChange

                                        }

                                        placeholder="Enter email address"

                                        disabled={savingMember}

                                        required

                                    />

                                </div>

                            </div>

                            <div className="receptionist-form-group">

                                <label htmlFor="phone">

                                    Phone Number

                                </label>

                                <input

                                    id="phone"

                                    type="tel"

                                    name="phone"

                                    value={

                                        memberFormData.phone

                                    }

                                    onChange={

                                        handleMemberInputChange

                                    }

                                    placeholder="Enter phone number"

                                    maxLength="15"

                                    disabled={savingMember}

                                    required

                                />

                            </div>

                            <div className="receptionist-form-row">

                                <div className="receptionist-form-group">

                                    <label htmlFor="password">

                                        Password

                                    </label>

                                    <div className="receptionist-password-wrapper">

                                        <input

                                            id="password"

                                            type={

                                                showPassword

                                                    ? "text"

                                                    : "password"

                                            }

                                            name="password"

                                            value={

                                                memberFormData.password

                                            }

                                            onChange={

                                                handleMemberInputChange

                                            }

                                            placeholder="Minimum 8 characters"

                                            disabled={savingMember}

                                            required

                                        />

                                        <button

                                            type="button"

                                            className="receptionist-password-toggle"

                                            onClick={() =>

                                                setShowPassword(

                                                    (previous) =>

                                                        !previous

                                                )

                                            }

                                            disabled={savingMember}

                                        >

                                            {showPassword ? (

                                                <EyeOff size={17} />

                                            ) : (

                                                <Eye size={17} />

                                            )}

                                        </button>

                                    </div>

                                </div>

                                <div className="receptionist-form-group">

                                    <label htmlFor="confirm_password">

                                        Confirm Password

                                    </label>

                                    <div className="receptionist-password-wrapper">

                                        <input

                                            id="confirm_password"

                                            type={

                                                showConfirmPassword

                                                    ? "text"

                                                    : "password"

                                            }

                                            name="confirm_password"

                                            value={

                                                memberFormData.confirm_password

                                            }

                                            onChange={

                                                handleMemberInputChange

                                            }

                                            placeholder="Re-enter password"

                                            disabled={savingMember}

                                            required

                                        />

                                        <button

                                            type="button"

                                            className="receptionist-password-toggle"

                                            onClick={() =>

                                                setShowConfirmPassword(

                                                    (previous) =>

                                                        !previous

                                                )

                                            }

                                            disabled={savingMember}

                                        >

                                            {showConfirmPassword ? (

                                                <EyeOff size={17} />

                                            ) : (

                                                <Eye size={17} />

                                            )}

                                        </button>

                                    </div>

                                </div>

                            </div>

                            <div className="receptionist-member-role-note">

                                <UserCheck size={16} />

                                <span>

                                    This account will automatically be created

                                    with the <strong>Member</strong> role.

                                </span>

                            </div>

                            <div className="receptionist-form-actions">

                                <button

                                    type="button"

                                    className="receptionist-cancel-btn"

                                    onClick={closeAddMemberForm}

                                    disabled={savingMember}

                                >

                                    Cancel

                                </button>

                                <button

                                    type="submit"

                                    className="receptionist-submit-btn"

                                    disabled={savingMember}

                                >

                                    {savingMember

                                        ? "Creating..."

                                        : "Create Member"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =====================================================

                RECORD PAYMENT MODAL

            ====================================================== */}

            {showPaymentForm && (

                <div className="receptionist-modal-overlay">

                    <div className="receptionist-modal">

                        <div className="receptionist-modal-header">

                            <div>

                                <h2>Record Payment</h2>

                                <p>

                                    Record a membership payment for a gym member.

                                </p>

                            </div>

                            <button

                                type="button"

                                className="receptionist-modal-close"

                                onClick={closePaymentForm}

                                disabled={savingPayment}

                            >

                                <X size={20} />

                            </button>

                        </div>

                        {successMessage && (

                            <div className="receptionist-success">

                                <CheckCircle2 size={18} />

                                <span>{successMessage}</span>

                            </div>

                        )}

                        {errorMessage && (

                            <div className="receptionist-error">

                                {errorMessage}

                            </div>

                        )}

                        <form

                            className="receptionist-form"

                            onSubmit={handleSubmitPayment}

                        >

                            <div className="receptionist-form-group">

                                <label htmlFor="payment-member">

                                    Member

                                </label>

                                <select

                                    id="payment-member"

                                    name="member"

                                    value={paymentFormData.member}

                                    onChange={handlePaymentInputChange}

                                    disabled={

                                        loadingMembers || savingPayment

                                    }

                                    required

                                >

                                    <option value="">

                                        {loadingMembers

                                            ? "Loading members..."

                                            : "Select member"}

                                    </option>

                                    {members.map((member) => (

                                        <option

                                            key={member.id}

                                            value={member.id}

                                        >

                                            {member.first_name}{" "}

                                            {member.last_name} (

                                            {member.username})

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div className="receptionist-form-group">

                                <label htmlFor="payment-membership">

                                    Membership

                                </label>

                                <select

                                    id="payment-membership"

                                    name="membership"

                                    value={paymentFormData.membership}

                                    onChange={handlePaymentInputChange}

                                    disabled={

                                        !paymentFormData.member ||

                                        loadingMemberships ||

                                        savingPayment

                                    }

                                    required

                                >

                                    <option value="">

                                        {!paymentFormData.member

                                            ? "Select a member first"

                                            : loadingMemberships

                                            ? "Loading memberships..."

                                            : memberships.length === 0

                                            ? "No unpaid membership available — assign a plan first"

                                            : "Select membership"}

                                    </option>

                                    {memberships.map((membership) => (

                                        <option

                                            key={membership.id}

                                            value={membership.id}

                                        >

                                            {membership.display_plan_name} - ₹

                                            {Number(

                                                membership.display_amount || 0

                                            ).toLocaleString("en-IN")}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            {selectedMembership && (

                                <div className="receptionist-member-role-note">

                                    <CreditCard size={16} />

                                    <span>

                                        <strong>

                                            {selectedMembership.display_plan_name}

                                        </strong>

                                        {" • "}

                                        Amount: ₹

                                        {selectedPaymentAmount.toLocaleString(

                                            "en-IN"

                                        )}

                                        {" • "}

                                        Status:{" "}

                                        {selectedMembership.status || "PENDING"}

                                    </span>

                                </div>

                            )}

                            <div className="receptionist-form-row">

                                <div className="receptionist-form-group">

                                    <label htmlFor="payment-method">

                                        Payment Method

                                    </label>

                                    <select

                                        id="payment-method"

                                        name="method"

                                        value={paymentFormData.method}

                                        onChange={handlePaymentInputChange}

                                        disabled={savingPayment}

                                    >

                                        <option value="CASH">Cash</option>

                                        <option value="UPI">UPI</option>

                                        <option value="CARD">Card</option>

                                        <option value="ONLINE">

                                            Online

                                        </option>

                                    </select>

                                </div>

                                <div className="receptionist-form-group">

                                    <label htmlFor="transaction_id">

                                        Transaction ID

                                        {!["CASH"].includes(

                                            paymentFormData.method

                                        ) && " *"}

                                    </label>

                                    <input

                                        id="transaction_id"

                                        type="text"

                                        name="transaction_id"

                                        value={

                                            paymentFormData.transaction_id

                                        }

                                        onChange={handlePaymentInputChange}

                                        placeholder={

                                            paymentFormData.method === "CASH"

                                                ? "Optional"

                                                : "Enter transaction ID"

                                        }

                                        disabled={savingPayment}

                                        required={

                                            paymentFormData.method !== "CASH"

                                        }

                                    />

                                </div>

                            </div>

                            <div className="receptionist-form-group">

                                <label htmlFor="payment-notes">

                                    Notes

                                </label>

                                <textarea

                                    id="payment-notes"

                                    name="notes"

                                    value={paymentFormData.notes}

                                    onChange={handlePaymentInputChange}

                                    placeholder="Optional payment notes..."

                                    rows="3"

                                    disabled={savingPayment}

                                />

                            </div>

                            <div className="receptionist-form-actions">

                                <button

                                    type="button"

                                    className="receptionist-cancel-btn"

                                    onClick={closePaymentForm}

                                    disabled={savingPayment}

                                >

                                    Cancel

                                </button>

                                <button

                                    type="submit"

                                    className="receptionist-submit-btn"

                                    disabled={

                                        savingPayment ||

                                        !selectedMembership

                                    }

                                >

                                    {savingPayment

                                        ? "Saving..."

                                        : "Record Payment"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =====================================================

                ATTENDANCE MODAL

            ====================================================== */}

            {showAttendanceForm && (

                <div className="receptionist-modal-overlay">

                    <div className="receptionist-modal">

                        <div className="receptionist-modal-header">

                            <div>

                                <h2>Record Attendance</h2>

                                <p>

                                    Record a member's gym attendance.

                                </p>

                            </div>

                            <button

                                type="button"

                                className="receptionist-modal-close"

                                onClick={closeAttendanceForm}

                                disabled={savingAttendance}

                            >

                                <X size={20} />

                            </button>

                        </div>

                        {successMessage && (

                            <div className="receptionist-success">

                                <CheckCircle2 size={18} />

                                <span>

                                    {successMessage}

                                </span>

                            </div>

                        )}

                        {errorMessage && (

                            <div className="receptionist-error">

                                {errorMessage}

                            </div>

                        )}

                        <form

                            className="receptionist-form"

                            onSubmit={handleSubmitAttendance}

                        >

                            <div className="receptionist-form-group">

                                <label htmlFor="member">

                                    Member

                                </label>

                                <select

                                    id="member"

                                    name="member"

                                    value={formData.member}

                                    onChange={handleInputChange}

                                    disabled={

                                        loadingMembers ||

                                        savingAttendance

                                    }

                                    required

                                >

                                    <option value="">

                                        {loadingMembers

                                            ? "Loading members..."

                                            : "Select member"}

                                    </option>

                                    {members.map((member) => (

                                        <option

                                            key={member.id}

                                            value={member.id}

                                        >

                                            {member.first_name}{" "}

                                            {member.last_name} (

                                            {member.username})

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div className="receptionist-form-row">

                                <div className="receptionist-form-group">

                                    <label htmlFor="date">

                                        Date

                                    </label>

                                    <input

                                        id="date"

                                        type="date"

                                        name="date"

                                        value={formData.date}

                                        onChange={handleInputChange}

                                        disabled={savingAttendance}

                                        required

                                    />

                                </div>

                                <div className="receptionist-form-group">

                                    <label htmlFor="check_in">

                                        Check-in Time

                                    </label>

                                    <input

                                        id="check_in"

                                        type="time"

                                        name="check_in"

                                        value={formData.check_in}

                                        onChange={handleInputChange}

                                        disabled={savingAttendance}

                                    />

                                </div>

                            </div>

                            <div className="receptionist-form-group">

                                <label htmlFor="status">

                                    Status

                                </label>

                                <select

                                    id="status"

                                    name="status"

                                    value={formData.status}

                                    onChange={handleInputChange}

                                    disabled={savingAttendance}

                                >

                                    <option value="PRESENT">

                                        Present

                                    </option>

                                    <option value="ABSENT">

                                        Absent

                                    </option>

                                </select>

                            </div>

                            <div className="receptionist-form-group">

                                <label htmlFor="notes">

                                    Notes

                                </label>

                                <textarea

                                    id="notes"

                                    name="notes"

                                    value={formData.notes}

                                    onChange={handleInputChange}

                                    placeholder="Optional notes..."

                                    rows="3"

                                    disabled={savingAttendance}

                                />

                            </div>

                            <div className="receptionist-form-actions">

                                <button

                                    type="button"

                                    className="receptionist-cancel-btn"

                                    onClick={closeAttendanceForm}

                                    disabled={savingAttendance}

                                >

                                    Cancel

                                </button>

                                <button

                                    type="submit"

                                    className="receptionist-submit-btn"

                                    disabled={savingAttendance}

                                >

                                    {savingAttendance

                                        ? "Saving..."

                                        : "Record Attendance"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );

};

export default ReceptionistDashboard;
