
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import MemberLayout from "./layouts/MemberLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleBasedRoute from "./routes/RoleBasedRoute";

import AdminDashboard from "./pages/admin/AdminDashboard";
import TrainerDashboard from "./pages/trainer/TrainerDashboard";

import MemberDashboard from "./pages/member/MemberDashboard";
import Membership from "./pages/member/Membership";
import Payments from "./pages/member/Payments";
import Profile from "./pages/member/Profile";
import MyWorkouts from "./pages/member/MyWorkouts";
import Attendance from "./pages/member/Attendance";

import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import Members from "./pages/receptionist/Members";
import PaymentHistory from "./pages/receptionist/PaymentHistory";
import Memberships from "./pages/receptionist/Memberships";
import Enquiries from "./pages/receptionist/Enquiries";


function AppRoutes() {
    return (
        <Routes>
            {/* =========================
                Public Routes
            ========================= */}

            {/* Public SmartGym landing page */}
            <Route
                path="/"
                element={<Dashboard />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />


            {/* =========================
                Protected Routes
            ========================= */}

            <Route element={<ProtectedRoute />}>

                {/* Admin Routes */}
                <Route
                    element={
                        <RoleBasedRoute
                            allowedRoles={["ADMIN"]}
                        />
                    }
                >
                    <Route
                        path="/admin"
                        element={<AdminDashboard />}
                    />
                </Route>


                {/* Trainer Routes */}
                <Route
                    element={
                        <RoleBasedRoute
                            allowedRoles={["TRAINER"]}
                        />
                    }
                >
                    <Route
                        path="/trainer"
                        element={<TrainerDashboard />}
                    />
                </Route>


                {/* Member Routes */}
                <Route
                    element={
                        <RoleBasedRoute
                            allowedRoles={["MEMBER"]}
                        />
                    }
                >
                    <Route
                        path="/member"
                        element={<MemberLayout />}
                    >
                        <Route
                            index
                            element={<MemberDashboard />}
                        />

                        <Route
                            path="membership"
                            element={<Membership />}
                        />

                        <Route
                            path="payments"
                            element={<Payments />}
                        />

                        <Route
                            path="profile"
                            element={<Profile />}
                        />

                        <Route
                            path="workouts"
                            element={<MyWorkouts />}
                        />

                        <Route
                            path="attendance"
                            element={<Attendance />}
                        />
                    </Route>
                </Route>


                {/* Receptionist Routes */}
                <Route
                    element={
                        <RoleBasedRoute
                            allowedRoles={["RECEPTIONIST"]}
                        />
                    }
                >
                    <Route
                        path="/receptionist"
                        element={<ReceptionistDashboard />}
                    />

                    <Route
                        path="/receptionist/members"
                        element={<Members />}
                    />

                    <Route
                        path="/receptionist/payments"
                        element={<PaymentHistory />}
                    />

                    <Route
                        path="/receptionist/memberships"
                        element={<Memberships />}
                    />

                    <Route
                        path="/receptionist/enquiries"
                        element={<Enquiries />}
                    />
                </Route>
            </Route>


            {/* =========================
                Unknown Routes
            ========================= */}

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}


function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
