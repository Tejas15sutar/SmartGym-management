import { useEffect, useMemo, useState } from "react";

import {

    Search,

    RefreshCw,

    Users,

    CreditCard,

    CalendarDays,

    Clock3,

    X,

    UserRound,

    CheckCircle2,

    AlertCircle,

    XCircle,

} from "lucide-react";

import membershipService from "../../services/membershipService";

import receptionistService from "../../services/receptionistService";
import api from "../../services/api";
import "../../styles/ReceptionistMemberships.css";

const Memberships = () => {

    const [memberships, setMemberships] = useState([]);

    const [members, setMembers] = useState([]);

    const [plans, setPlans] = useState([]);

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");

    const [planFilter, setPlanFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [selectedMembership, setSelectedMembership] = useState(null);
    const [showRenewForm, setShowRenewForm] = useState(false);
    const [renewPlanId, setRenewPlanId] = useState("");
    const [savingRenewal, setSavingRenewal] = useState(false);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [savingAssignment, setSavingAssignment] = useState(false);
    const [pageError, setPageError] = useState("");
    const [pageSuccess, setPageSuccess] = useState("");
    const [assignmentForm, setAssignmentForm] = useState({
        member: "",
        plan: "",
        start_date: new Date().toISOString().slice(0, 10),
    });

    const selectedPlan = plans.find(
        (plan) => Number(plan.id) === Number(assignmentForm.plan)
    );

    const calculateEndDate = (startDate, durationDays) => {
        if (!startDate || !durationDays) return "";
        const date = new Date(`${startDate}T00:00:00`);
        date.setDate(date.getDate() + Number(durationDays));
        return date.toISOString().slice(0, 10);
    };

    const assignmentEndDate = calculateEndDate(
        assignmentForm.start_date,
        selectedPlan?.duration_days
    );

    const openAssignForm = () => {
        setPageError("");
        setPageSuccess("");
        setAssignmentForm({
            member: "",
            plan: "",
            start_date: new Date().toISOString().slice(0, 10),
        });
        setShowAssignForm(true);
    };

    const handleAssignChange = (event) => {
        const { name, value } = event.target;
        setAssignmentForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleAssignMembership = async (event) => {
        event.preventDefault();
        setPageError("");
        setPageSuccess("");

        if (!assignmentForm.member || !assignmentForm.plan || !assignmentForm.start_date) {
            setPageError("Please select a member, plan and start date.");
            return;
        }

        try {
            setSavingAssignment(true);
            await api.post("/memberships/records/", {
                member: Number(assignmentForm.member),
                plan: Number(assignmentForm.plan),
                start_date: assignmentForm.start_date,
            });
            setPageSuccess("Membership assigned successfully.");
            setShowAssignForm(false);
            await loadData(true);
        } catch (error) {
            const data = error.response?.data;
            let message = data?.detail || data?.message || "Unable to assign membership.";
            if (data && typeof data === "object") {
                const errors = Object.entries(data)
                    .map(([field, value]) => {
                        const text = Array.isArray(value)
                            ? value.join(" ")
                            : typeof value === "string"
                                ? value
                                : "";
                        return text ? `${field}: ${text}` : "";
                    })
                    .filter(Boolean);
                if (errors.length) message = errors.join(" | ");
            }
            setPageError(message);
        } finally {
            setSavingAssignment(false);
        }
    };

    const loadData = async (isRefresh = false) => {

        try {

            if (isRefresh) {

                setRefreshing(true);

            } else {

                setLoading(true);

            }

            const [membershipData, memberData, planData] =

                await Promise.all([

                    membershipService.getMemberships(),

                    receptionistService.getMembers(),

                    membershipService.getMembershipPlans(),

                ]);

            setMemberships(

                membershipData?.results || membershipData || []

            );

            setMembers(memberData?.results || memberData || []);

            setPlans(planData?.results || planData || []);

        } catch (error) {

            console.error("Unable to load membership data:", error);

        } finally {

            setLoading(false);

            setRefreshing(false);

        }

    };

    useEffect(() => {

        loadData();

    }, []);

    const getMember = (memberId) => {

        return members.find(

            (member) => Number(member.id) === Number(memberId)

        );

    };

    const getPlan = (planId) => {

        return plans.find(

            (plan) => Number(plan.id) === Number(planId)

        );

    };

    const getMemberName = (membership) => {

        const member =

            getMember(membership.member) ||

            membership.member_details ||

            membership.member_data;

        if (member) {

            const fullName = `${member.first_name || ""} ${

                member.last_name || ""

            }`.trim();

            return fullName || member.username || `Member #${membership.member}`;

        }

        return membership.member_name || `Member #${membership.member}`;

    };

    const getUsername = (membership) => {

        const member = getMember(membership.member);

        return (

            member?.username ||

            membership.username ||

            ""

        );

    };

    const getPlanName = (membership) => {

        const plan = getPlan(membership.plan);

        return (

            membership.plan_name ||

            membership.plan?.name ||

            plan?.name ||

            `Plan #${membership.plan}`

        );

    };

    const formatDate = (date) => {

        if (!date) {

            return "—";

        }

        return new Date(date).toLocaleDateString("en-IN", {

            day: "2-digit",

            month: "short",

            year: "numeric",

        });

    };

    const getRemainingDays = (membership) => {

        if (membership.remaining_days !== undefined && membership.remaining_days !== null) {

            return Number(membership.remaining_days);

        }

        if (!membership.end_date) {

            return null;

        }

        const today = new Date();

        const endDate = new Date(membership.end_date);

        today.setHours(0, 0, 0, 0);

        endDate.setHours(0, 0, 0, 0);

        return Math.ceil(

            (endDate - today) / (1000 * 60 * 60 * 24)

        );

    };

    const getEffectiveStatus = (membership) => {

        const remainingDays = getRemainingDays(membership);

        if (membership.status === "CANCELLED") {

            return "CANCELLED";

        }

        if (membership.status === "PENDING") {

            return "PENDING";

        }

        if (

            membership.status === "EXPIRED" ||

            (remainingDays !== null && remainingDays < 0)

        ) {

            return "EXPIRED";

        }

        if (

            membership.status === "ACTIVE" &&

            remainingDays !== null &&

            remainingDays >= 0

        ) {

            return "ACTIVE";

        }

        return membership.status || "UNKNOWN";

    };

    const getStatusClass = (status) => {

        switch (status) {

            case "ACTIVE":

                return "success";

            case "PENDING":

                return "pending";

            case "EXPIRED":

            case "CANCELLED":

                return "danger";

            default:

                return "default";

        }

    };

    const getStatusIcon = (status) => {

        switch (status) {

            case "ACTIVE":

                return <CheckCircle2 size={15} />;

            case "PENDING":

                return <Clock3 size={15} />;

            case "EXPIRED":

                return <AlertCircle size={15} />;

            case "CANCELLED":

                return <XCircle size={15} />;

            default:

                return null;

        }

    };

    const filteredMemberships = useMemo(() => {

        const searchText = search.trim().toLowerCase();

        return memberships.filter((membership) => {

            const memberName = getMemberName(membership).toLowerCase();

            const username = getUsername(membership).toLowerCase();

            const planName = getPlanName(membership).toLowerCase();

            const memberId = String(membership.member || "");

            const membershipId = String(membership.id || "");

            const matchesSearch =

                !searchText ||

                memberName.includes(searchText) ||

                username.includes(searchText) ||

                planName.includes(searchText) ||

                memberId.includes(searchText) ||

                membershipId.includes(searchText);

            const status = getEffectiveStatus(membership);

            const matchesStatus =

                statusFilter === "ALL" ||

                status === statusFilter;

            const matchesPlan =

                planFilter === "ALL" ||

                String(membership.plan) === String(planFilter);

            return (

                matchesSearch &&

                matchesStatus &&

                matchesPlan

            );

        });

    }, [

        memberships,

        members,

        plans,

        search,

        statusFilter,

        planFilter,

    ]);

    const statistics = useMemo(() => {

        let active = 0;

        let expiring = 0;

        let expired = 0;

        let pending = 0;

        memberships.forEach((membership) => {

            const status = getEffectiveStatus(membership);

            const remainingDays = getRemainingDays(membership);

            if (status === "ACTIVE") {

                active++;

                if (

                    remainingDays !== null &&

                    remainingDays >= 0 &&

                    remainingDays <= 7

                ) {

                    expiring++;

                }

            }

            if (status === "EXPIRED") {

                expired++;

            }

            if (status === "PENDING") {

                pending++;

            }

        });

        return {

            total: memberships.length,

            active,

            expiring,

            expired,

            pending,

        };

    }, [memberships, members, plans]);

    const openDetails = (membership) => {

        setSelectedMembership(membership);

    };

    const closeDetails = () => {
        setSelectedMembership(null);
        setShowRenewForm(false);
        setRenewPlanId("");
    };

    const startRenewal = () => {
        setPageError("");
        setPageSuccess("");
        setRenewPlanId(String(selectedMembership?.plan?.id || selectedMembership?.plan || ""));
        setShowRenewForm(true);
    };

    const handleRenewMembership = async (event) => {
        event.preventDefault();
        if (!selectedMembership || !renewPlanId) {
            setPageError("Please select a membership plan to renew.");
            return;
        }

        setPageError("");
        setPageSuccess("");
        setSavingRenewal(true);
        try {
            await api.post(`/memberships/records/${selectedMembership.id}/renew/`, {
                plan: Number(renewPlanId),
            });
            setPageSuccess(`Membership renewed successfully for ${getMemberName(selectedMembership)}. A new membership record has been created.`);
            closeDetails();
            await loadData(true);
        } catch (error) {
            const data = error.response?.data;
            let message = data?.detail || data?.plan || "Unable to renew membership.";
            if (data && typeof data === "object") {
                const details = Object.entries(data)
                    .map(([field, value]) => {
                        const text = Array.isArray(value) ? value.join(" ") : typeof value === "string" ? value : "";
                        return text ? `${field}: ${text}` : "";
                    })
                    .filter(Boolean);
                if (details.length) message = details.join(" | ");
            }
            setPageError(message);
        } finally {
            setSavingRenewal(false);
        }
    };

    const clearFilters = () => {

        setSearch("");

        setStatusFilter("ALL");

        setPlanFilter("ALL");

    };

    return (

        <div className="receptionist-members-page">
            <style>{`
                .receptionist-membership-header-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
                .receptionist-membership-assign-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:0; border-radius:10px; padding:11px 16px; background:#2563eb; color:#fff; font-weight:600; cursor:pointer; }
                .receptionist-membership-assign-button:hover { background:#1d4ed8; }
                .receptionist-membership-message { margin:14px 0; padding:12px 14px; border-radius:9px; font-size:14px; }
                .receptionist-membership-message.success { background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; }
                .receptionist-membership-message.error { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
                .receptionist-assign-membership-modal { max-width:620px; width:calc(100% - 28px); max-height:90vh; overflow-y:auto; }
                .receptionist-assign-membership-form { display:grid; gap:16px; padding:20px 0 0; }
                .receptionist-assign-membership-form label { display:grid; gap:7px; color:#374151; font-size:14px; font-weight:600; }
                .receptionist-assign-membership-form label span { color:#dc2626; display:inline; }
                .receptionist-assign-membership-form input, .receptionist-assign-membership-form select { width:100%; min-width:0; box-sizing:border-box; border:1px solid #d1d5db; border-radius:9px; padding:11px 12px; background:#fff; color:#111827; font:inherit; }
                .receptionist-assign-membership-preview { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; padding:14px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; }
                .receptionist-assign-membership-preview div { display:grid; gap:6px; min-width:0; }
                .receptionist-assign-membership-preview span { color:#6b7280; font-size:12px; }
                .receptionist-assign-membership-preview strong { color:#111827; font-size:14px; overflow-wrap:anywhere; }
                .receptionist-assign-membership-note { margin:0; color:#6b7280; font-size:13px; line-height:1.5; }
                .receptionist-renew-membership-panel { margin-top:18px; padding:16px; border:1px solid #dbeafe; background:#eff6ff; border-radius:12px; }
                .receptionist-renew-membership-panel h4 { margin:0 0 8px; color:#1e3a8a; font-size:15px; }
                .receptionist-renew-membership-panel p { margin:0 0 12px; color:#475569; font-size:13px; line-height:1.5; }
                .receptionist-renew-membership-panel select { width:100%; box-sizing:border-box; padding:11px 12px; border:1px solid #cbd5e1; border-radius:9px; background:#fff; color:#111827; font:inherit; }
                .receptionist-member-modal-footer { display:flex; align-items:center; justify-content:flex-end; gap:10px; flex-wrap:wrap; }
                .receptionist-renew-membership-actions { display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; margin-top:14px; }
                .receptionist-renew-membership-actions button { border:0; border-radius:9px; padding:10px 14px; font-weight:600; cursor:pointer; }
                .receptionist-renew-membership-actions button[type="submit"] { background:#2563eb; color:#fff; }
                .receptionist-renew-membership-actions button[type="button"] { background:#e5e7eb; color:#374151; }
                .receptionist-renew-trigger { display:inline-flex !important; align-items:center; justify-content:center; gap:6px; background:#2563eb !important; color:#fff !important; border:0 !important; border-radius:9px !important; padding:10px 14px !important; font-weight:600 !important; cursor:pointer !important; min-height:40px; }
                @media(max-width:560px) { .receptionist-assign-membership-preview { grid-template-columns:1fr; } .receptionist-membership-header-actions { width:100%; } .receptionist-membership-header-actions button { flex:1; } }
            `}</style>


            {/* PAGE HEADER */}

            <div className="receptionist-members-page-header">

                <div>

                    <div className="receptionist-members-title-row">

                        <div className="receptionist-members-title-icon">

                            <CreditCard size={22} />

                        </div>

                        <div>

                            <h1>Memberships</h1>

                            <p>

                                Manage and monitor all member

                                memberships.

                            </p>

                        </div>

                    </div>

                </div>

                <div className="receptionist-membership-header-actions">
                    <button
                        type="button"
                        className="receptionist-membership-assign-button"
                        onClick={openAssignForm}
                    >
                        <Users size={17} />
                        Assign Membership
                    </button>

                    <button
                        type="button"
                        className="receptionist-members-refresh"
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? "receptionist-spin" : ""}
                        />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

            </div>

            {pageSuccess && <div className="receptionist-membership-message success">{pageSuccess}</div>}
            {pageError && <div className="receptionist-membership-message error">{pageError}</div>}

            {showAssignForm && (
                <div className="receptionist-member-modal-overlay" onClick={() => setShowAssignForm(false)}>
                    <div className="receptionist-member-modal receptionist-assign-membership-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="receptionist-member-modal-header">
                            <div>
                                <h2>Assign Membership</h2>
                                <p>Select a member, plan and start date.</p>
                            </div>
                            <button type="button" className="receptionist-member-modal-close" onClick={() => setShowAssignForm(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form className="receptionist-assign-membership-form" onSubmit={handleAssignMembership}>
                            <label>
                                Member <span>*</span>
                                <select name="member" value={assignmentForm.member} onChange={handleAssignChange} required>
                                    <option value="">Select member</option>
                                    {members.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {`${member.first_name || ""} ${member.last_name || ""}`.trim() || member.username} ({member.username})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Membership Plan <span>*</span>
                                <select name="plan" value={assignmentForm.plan} onChange={handleAssignChange} required>
                                    <option value="">Select plan</option>
                                    {plans.filter((plan) => plan.active !== false).map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name || plan.plan_type || `Plan #${plan.id}`} — ₹{Number(plan.price || 0).toLocaleString("en-IN")} ({plan.duration_days} days)
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Start Date <span>*</span>
                                <input type="date" name="start_date" value={assignmentForm.start_date} onChange={handleAssignChange} required />
                            </label>

                            <div className="receptionist-assign-membership-preview">
                                <div><span>Plan Price</span><strong>₹{Number(selectedPlan?.price || 0).toLocaleString("en-IN")}</strong></div>
                                <div><span>Duration</span><strong>{selectedPlan?.duration_days ? `${selectedPlan.duration_days} days` : "—"}</strong></div>
                                <div><span>Calculated End Date</span><strong>{assignmentEndDate ? formatDate(assignmentEndDate) : "Select a plan"}</strong></div>
                            </div>

                            <p className="receptionist-assign-membership-note">
                                The backend will validate the assignment and reject overlapping memberships.
                            </p>

                            {pageError && <div className="receptionist-membership-message error">{pageError}</div>}

                            <div className="receptionist-member-modal-footer">
                                <button type="button" onClick={() => setShowAssignForm(false)} disabled={savingAssignment}>Cancel</button>
                                <button type="submit" disabled={savingAssignment || !members.length || !plans.length}>
                                    {savingAssignment ? "Assigning..." : "Assign Membership"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STATISTICS */}

            <div className="receptionist-membership-stats">

                <div className="receptionist-membership-stat-card">

                    <div className="receptionist-membership-stat-icon">

                        <Users size={20} />

                    </div>

                    <div>

                        <span>Total Memberships</span>

                        <strong>{statistics.total}</strong>

                    </div>

                </div>

                <div className="receptionist-membership-stat-card">

                    <div className="receptionist-membership-stat-icon">

                        <CheckCircle2 size={20} />

                    </div>

                    <div>

                        <span>Active</span>

                        <strong>{statistics.active}</strong>

                    </div>

                </div>

                <div className="receptionist-membership-stat-card">

                    <div className="receptionist-membership-stat-icon">

                        <Clock3 size={20} />

                    </div>

                    <div>

                        <span>Expiring Soon</span>

                        <strong>{statistics.expiring}</strong>

                    </div>

                </div>

                <div className="receptionist-membership-stat-card">

                    <div className="receptionist-membership-stat-icon">

                        <AlertCircle size={20} />

                    </div>

                    <div>

                        <span>Expired</span>

                        <strong>{statistics.expired}</strong>

                    </div>

                </div>

                <div className="receptionist-membership-stat-card">

                    <div className="receptionist-membership-stat-icon">

                        <Clock3 size={20} />

                    </div>

                    <div>

                        <span>Pending</span>

                        <strong>{statistics.pending}</strong>

                    </div>

                </div>

            </div>

            {/* FILTERS */}

            <div className="receptionist-members-toolbar">

                <div className="receptionist-members-search">

                    <Search size={18} />

                    <input

                        type="text"

                        placeholder="Search member, username, plan or ID..."

                        value={search}

                        onChange={(event) =>

                            setSearch(event.target.value)

                        }

                    />

                </div>

                <select

                    value={statusFilter}

                    onChange={(event) =>

                        setStatusFilter(event.target.value)

                    }

                    className="receptionist-membership-filter"

                >

                    <option value="ALL">All Status</option>

                    <option value="ACTIVE">Active</option>

                    <option value="PENDING">Pending</option>

                    <option value="EXPIRED">Expired</option>

                    <option value="CANCELLED">Cancelled</option>

                </select>

                <select

                    value={planFilter}

                    onChange={(event) =>

                        setPlanFilter(event.target.value)

                    }

                    className="receptionist-membership-filter"

                >

                    <option value="ALL">All Plans</option>

                    {plans.map((plan) => (

                        <option

                            key={plan.id}

                            value={plan.id}

                        >

                            {plan.name ||

                                plan.plan_type ||

                                `Plan #${plan.id}`}

                        </option>

                    ))}

                </select>

                {(search ||

                    statusFilter !== "ALL" ||

                    planFilter !== "ALL") && (

                    <button

                        type="button"

                        className="receptionist-membership-clear"

                        onClick={clearFilters}

                    >

                        Clear

                    </button>

                )}

            </div>

            {/* RESULT COUNT */}

            <div className="receptionist-members-result-count">

                {filteredMemberships.length}{" "}

                {filteredMemberships.length === 1

                    ? "membership"

                    : "memberships"}{" "}

                found

            </div>

            {/* TABLE */}

            <div className="receptionist-members-card">

                {loading ? (

                    <div className="receptionist-members-state">

                        <CreditCard size={32} />

                        <h3>

                            Loading memberships...

                        </h3>

                        <p>

                            Please wait while we fetch

                            membership data.

                        </p>

                    </div>

                ) : filteredMemberships.length === 0 ? (

                    <div className="receptionist-members-state">

                        <CreditCard size={34} />

                        <h3>

                            No memberships found

                        </h3>

                        <p>

                            Try changing your search or

                            filters.

                        </p>

                    </div>

                ) : (

                    <div className="receptionist-members-table-wrapper">

                        <table className="receptionist-members-table">

                            <thead>

                                <tr>

                                    <th>Member</th>

                                    <th>Plan</th>

                                    <th>Start Date</th>

                                    <th>End Date</th>

                                    <th>Amount</th>

                                    <th>Remaining</th>

                                    <th>Status</th>

                                    <th></th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredMemberships.map(

                                    (membership) => {

                                        const status =

                                            getEffectiveStatus(

                                                membership

                                            );

                                        const remainingDays =

                                            getRemainingDays(

                                                membership

                                            );

                                        return (

                                            <tr

                                                key={

                                                    membership.id

                                                }

                                            >

                                                <td>

                                                    <div className="receptionist-member-profile">

                                                        <div className="receptionist-member-avatar">

                                                            <UserRound

                                                                size={

                                                                    17

                                                                }

                                                            />

                                                        </div>

                                                        <div className="receptionist-member-info">

                                                            <strong>

                                                                {getMemberName(

                                                                    membership

                                                                )}

                                                            </strong>

                                                            <span>

                                                                {getUsername(

                                                                    membership

                                                                ) ||

                                                                    `Member #${membership.member}`}

                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td>

                                                    <div className="receptionist-membership-plan">

                                                        <strong>

                                                            {getPlanName(

                                                                membership

                                                            )}

                                                        </strong>

                                                        <span>

                                                            Membership

                                                            #

                                                            {

                                                                membership.id

                                                            }

                                                        </span>

                                                    </div>

                                                </td>

                                                <td>

                                                    <div className="receptionist-membership-date">

                                                        <CalendarDays

                                                            size={

                                                                14

                                                            }

                                                        />

                                                        {formatDate(

                                                            membership.start_date

                                                        )}

                                                    </div>

                                                </td>

                                                <td>

                                                    <div className="receptionist-membership-date">

                                                        <CalendarDays

                                                            size={

                                                                14

                                                            }

                                                        />

                                                        {formatDate(

                                                            membership.end_date

                                                        )}

                                                    </div>

                                                </td>

                                                <td>

                                                    <strong>

                                                        ₹

                                                        {Number(

                                                            membership.amount_paid ||

                                                                0

                                                        ).toLocaleString(

                                                            "en-IN"

                                                        )}

                                                    </strong>

                                                </td>

                                                <td>

                                                    <span

                                                        className={

                                                            remainingDays !==

                                                                null &&

                                                            remainingDays <=

                                                                7 &&

                                                            remainingDays >=

                                                                0

                                                                ? "receptionist-membership-days warning"

                                                                : remainingDays !==

                                                                      null &&

                                                                  remainingDays <

                                                                      0

                                                                ? "receptionist-membership-days expired"

                                                                : "receptionist-membership-days"

                                                        }

                                                    >

                                                        {remainingDays ===

                                                        null

                                                            ? "—"

                                                            : remainingDays <

                                                                0

                                                              ? "Expired"

                                                              : `${remainingDays} days`}

                                                    </span>

                                                </td>

                                                <td>

                                                    <span

                                                        className={`receptionist-history-status ${getStatusClass(

                                                            status

                                                        )}`}

                                                    >

                                                        {getStatusIcon(

                                                            status

                                                        )}

                                                        {status}

                                                    </span>

                                                </td>

                                                <td>

                                                    <button

                                                        type="button"

                                                        className="receptionist-membership-view"

                                                        onClick={() =>

                                                            openDetails(

                                                                membership

                                                            )

                                                        }

                                                    >

                                                        View

                                                    </button>

                                                </td>

                                            </tr>

                                        );

                                    }

                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

            {/* DETAILS MODAL */}

            {selectedMembership && (

                <div

                    className="receptionist-member-modal-overlay"

                    onClick={closeDetails}

                >

                    <div

                        className="receptionist-member-modal"

                        onClick={(event) =>

                            event.stopPropagation()

                        }

                    >

                        <div className="receptionist-member-modal-header">

                            <div>

                                <h2>

                                    Membership Details

                                </h2>

                                <p>

                                    Detailed membership

                                    information

                                </p>

                            </div>

                            <button

                                type="button"

                                className="receptionist-member-modal-close"

                                onClick={closeDetails}

                            >

                                <X size={20} />

                            </button>

                        </div>

                        <div className="receptionist-member-modal-profile">

                            <div className="receptionist-member-modal-avatar">

                                <CreditCard size={22} />

                            </div>

                            <div>

                                <h3>

                                    {getMemberName(

                                        selectedMembership

                                    )}

                                </h3>

                                <span>

                                    Membership #

                                    {

                                        selectedMembership.id

                                    }

                                </span>

                            </div>

                            <div

                                className={`receptionist-member-modal-status ${getStatusClass(

                                    getEffectiveStatus(

                                        selectedMembership

                                    )

                                )}`}

                            >

                                {getStatusIcon(

                                    getEffectiveStatus(

                                        selectedMembership

                                    )

                                )}

                                {getEffectiveStatus(

                                    selectedMembership

                                )}

                            </div>

                        </div>

                        <div className="receptionist-member-modal-section">

                            <div className="receptionist-member-modal-section-title">

                                <UserRound size={17} />

                                <h4>

                                    Member Information

                                </h4>

                            </div>

                            <div className="receptionist-member-modal-grid">

                                <div className="receptionist-member-modal-field">

                                    <span>

                                        Member Name

                                    </span>

                                    <strong>

                                        {getMemberName(

                                            selectedMembership

                                        )}

                                    </strong>

                                </div>

                                <div className="receptionist-member-modal-field">

                                    <span>

                                        Username

                                    </span>

                                    <strong>

                                        {getUsername(

                                            selectedMembership

                                        ) || "—"}

                                    </strong>

                                </div>

                                <div className="receptionist-member-modal-field">

                                    <span>

                                        Member ID

                                    </span>

                                    <strong>

                                        #

                                        {

                                            selectedMembership.member

                                        }

                                    </strong>

                                </div>

                                <div className="receptionist-member-modal-field">

                                    <span>

                                        Membership ID

                                    </span>

                                    <strong>

                                        #

                                        {

                                            selectedMembership.id

                                        }

                                    </strong>

                                </div>

                            </div>

                        </div>

                        <div className="receptionist-member-modal-section">

                            <div className="receptionist-member-modal-section-title">

                                <CreditCard size={17} />

                                <h4>

                                    Membership Information

                                </h4>

                            </div>

                            <div className="receptionist-member-modal-grid">

                                <div className="receptionist-member-modal-field">

                                    <span>

                                        Plan

                                    </span>

                                    <strong>

                                        {getPlanName(

                                            selectedMembership

                                        )}

                                    </strong>

                                </div>

                                <div className="receptionist-member-modal-field">

                                    <span>

                                        Amount Paid

                                    </span>

                                    <strong>

                                        ₹

                                        {Number(

                                            selectedMembership.amount_paid ||

                                                0

                                        ).toLocaleString(

                                            "en-IN"

                                        )}

                                    </strong>

                                </div>

                                <div className="receptionist-member-modal-field">

                                    <span>

                                        Start Date

                                    </span>

                                    <strong>

                                        {formatDate(

                                            selectedMembership.start_date

                                        )}

                                    </strong>

                                </div>

                                <div className="receptionist-member-modal-field">

                                    <span>

                                        End Date

                                    </span>

                                    <strong>

                                        {formatDate(

                                            selectedMembership.end_date

                                        )}

                                    </strong>

                                </div>

                                <div className="receptionist-member-modal-field">

                                    <span>

                                        Remaining Days

                                    </span>

                                    <strong>

                                        {getRemainingDays(

                                            selectedMembership

                                        ) === null

                                            ? "—"

                                            : getRemainingDays(

                                                  selectedMembership

                                              ) < 0

                                              ? "Expired"

                                              : `${getRemainingDays(

                                                    selectedMembership

                                                )} days`}

                                    </strong>

                                </div>

                                <div className="receptionist-member-modal-field">

                                    <span>

                                        Status

                                    </span>

                                    <strong>

                                        {getEffectiveStatus(

                                            selectedMembership

                                        )}

                                    </strong>

                                </div>

                            </div>

                        </div>

                        {showRenewForm && (
                            <form className="receptionist-renew-membership-panel" onSubmit={handleRenewMembership}>
                                <h4>Renew Membership</h4>
                                <p>
                                    A new membership will be created for this member. If the current membership has not ended,
                                    the renewal starts the following day; otherwise, it starts today. Any overlapping membership will be rejected.
                                </p>
                                <label htmlFor="renew-membership-plan">Select plan</label>
                                <select
                                    id="renew-membership-plan"
                                    value={renewPlanId}
                                    onChange={(event) => setRenewPlanId(event.target.value)}
                                    required
                                >
                                    <option value="">Choose a plan</option>
                                    {plans.filter((plan) => plan.active !== false && plan.is_active !== false).map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name || plan.plan_type || `Plan #${plan.id}`} — ₹{Number(plan.price || 0).toLocaleString("en-IN")} ({plan.duration_days} days)
                                        </option>
                                    ))}
                                </select>
                                {renewPlanId && (() => {
                                    const plan = plans.find((item) => Number(item.id) === Number(renewPlanId));
                                    return plan ? <p style={{ marginTop: 10, marginBottom: 0 }}>Plan price: <strong>₹{Number(plan.price || 0).toLocaleString("en-IN")}</strong> · Duration: <strong>{plan.duration_days} days</strong></p> : null;
                                })()}
                                {pageError && <div className="receptionist-membership-message error">{pageError}</div>}
                                <div className="receptionist-renew-membership-actions">
                                    <button type="button" onClick={() => setShowRenewForm(false)} disabled={savingRenewal}>Cancel</button>
                                    <button type="submit" disabled={savingRenewal || !renewPlanId}>
                                        {savingRenewal ? "Renewing..." : "Confirm Renewal"}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="receptionist-member-modal-footer">
                            {!showRenewForm && (
                                <button type="button" className="receptionist-renew-trigger" onClick={startRenewal}>
                                    <RefreshCw size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
                                    Renew Membership
                                </button>
                            )}
                            <button type="button" onClick={closeDetails}>Close</button>
                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};

export default Memberships;