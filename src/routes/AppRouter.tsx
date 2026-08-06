import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { ProtectedRoute } from "./ProtectedRoute.js";
import { RoleRoute } from "./RoleRoute.js";
import { DashboardLayout } from "../components/layout/DashboardLayout.js";

// Pages
import { LandingPage } from "../pages/LandingPage.js";
import { LoginPage } from "../pages/auth/LoginPage.js";

// Student Portal Pages
import { StudentDashboard } from "../pages/student/Dashboard.js";
import { FeedbackHistory } from "../pages/student/FeedbackHistory.js";
import { Notifications } from "../pages/student/Notifications.js";
import { HelpFAQ } from "../pages/student/HelpFAQ.js";
import { PrivacyPolicy } from "../pages/student/PrivacyPolicy.js";

// Feedback Form Page
import { FeedbackForm } from "../pages/feedback/FeedbackForm.js";

// Admin Portal Pages
import { AdminDashboard } from "../pages/admin/Dashboard.js";
import { AcademicStructure } from "../pages/admin/AcademicStructure.js";
import { Subjects } from "../pages/admin/Subjects.js";
import { Faculty } from "../pages/admin/Faculty.js";
import { QuestionBank } from "../pages/admin/QuestionBank.js";
import { Mapping } from "../pages/admin/Mapping.js";
import { FeedbackSessions } from "../pages/admin/FeedbackSessions.js";
import { Reports } from "../pages/admin/Reports.js";
import { Analytics } from "../pages/admin/Analytics.js";
import { AuditLogs } from "../pages/admin/AuditLogs.js";
import { Settings } from "../pages/admin/Settings.js";

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Student Portal (Protected, role="student") */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["student"]}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="history" element={<FeedbackHistory />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="help" element={<HelpFAQ />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
      </Route>

      {/* Student Feedback Form (Protected, separate fullscreen view) */}
      <Route
        path="/feedback-form"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["student"]}>
              <FeedbackForm />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Admin Portal (Protected, role="admin") */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="structure" element={<AcademicStructure />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="faculty" element={<Faculty />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="mapping" element={<Mapping />} />
        <Route path="sessions" element={<FeedbackSessions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* HOD Portal (Protected, role="hod") */}
      <Route
        path="/hod"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["hod"]}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Faculty Portal (Protected, role="faculty") */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["faculty"]}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="trends" element={<Analytics />} />
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
