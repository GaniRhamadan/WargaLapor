import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ProtectedRoute, RoleGuard } from './ProtectedRoute';

// Layouts
import { PublicLayout } from '../components/layout/PublicLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { AboutPage } from '../pages/public/AboutPage';
import { HowItWorksPage } from '../pages/public/HowItWorksPage';
import { PublicStatsPage } from '../pages/public/PublicStatsPage';
import { PublicMapPage } from '../pages/public/PublicMapPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/public/ResetPasswordPage';

// Citizen Pages
import { CitizenDashboard } from '../pages/citizen/CitizenDashboard';
import { CreateReportPage } from '../pages/citizen/CreateReportPage';
import { MyReportsPage } from '../pages/citizen/MyReportsPage';
import { ReportDetailPage } from '../pages/citizen/ReportDetailPage';
import { CitizenMapPage } from '../pages/citizen/CitizenMapPage';
import { CitizenNotificationsPage } from '../pages/citizen/CitizenNotificationsPage';

// Officer Pages
import { OfficerDashboard } from '../pages/officer/OfficerDashboard';
import { OfficerTaskListPage } from '../pages/officer/OfficerTaskListPage';
import { OfficerTaskDetailPage } from '../pages/officer/OfficerTaskDetailPage';
import { OfficerMapPage } from '../pages/officer/OfficerMapPage';
import { OfficerHistoryPage } from '../pages/officer/OfficerHistoryPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminVerificationPage } from '../pages/admin/AdminVerificationPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminOfficersPage } from '../pages/admin/AdminOfficersPage';
import { AdminCitizensPage } from '../pages/admin/AdminCitizensPage';
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage';
import { AdminMapPage } from '../pages/admin/AdminMapPage';
import { AdminHeatmapPage } from '../pages/admin/AdminHeatmapPage';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage';
import { AdminAuditLogPage } from '../pages/admin/AdminAuditLogPage';
import { AdminSlaSettingsPage } from '../pages/admin/AdminSlaSettingsPage';
import { AdminSystemSettingsPage } from '../pages/admin/AdminSystemSettingsPage';
import { AdminRolesPage } from '../pages/admin/AdminRolesPage';

// Common Pages
import { ProfilePage } from '../pages/common/ProfilePage';
import { SettingsPage } from '../pages/common/SettingsPage';

export const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/public/about" element={<AboutPage />} />
              <Route path="/public/how-it-works" element={<HowItWorksPage />} />
              <Route path="/public/stats" element={<PublicStatsPage />} />
              <Route path="/public/map" element={<PublicMapPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* PROTECTED AUTHENTICATED ROUTES */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                {/* CITIZEN PORTAL */}
                <Route element={<RoleGuard allowedRoles={['citizen']} />}>
                  <Route path="/citizen" element={<CitizenDashboard />} />
                  <Route path="/citizen/create-report" element={<CreateReportPage />} />
                  <Route path="/citizen/reports" element={<MyReportsPage />} />
                  <Route path="/citizen/reports/:id" element={<ReportDetailPage />} />
                  <Route path="/citizen/map" element={<CitizenMapPage />} />
                  <Route path="/citizen/notifications" element={<CitizenNotificationsPage />} />
                  <Route path="/citizen/profile" element={<ProfilePage />} />
                  <Route path="/citizen/settings" element={<SettingsPage />} />
                </Route>

                {/* OFFICER PORTAL */}
                <Route element={<RoleGuard allowedRoles={['officer']} />}>
                  <Route path="/officer" element={<OfficerDashboard />} />
                  <Route path="/officer/tasks" element={<OfficerTaskListPage />} />
                  <Route path="/officer/tasks/:id" element={<OfficerTaskDetailPage />} />
                  <Route path="/officer/map" element={<OfficerMapPage />} />
                  <Route path="/officer/history" element={<OfficerHistoryPage />} />
                  <Route path="/officer/notifications" element={<CitizenNotificationsPage />} />
                  <Route path="/officer/profile" element={<ProfilePage />} />
                </Route>

                {/* ADMIN PORTAL */}
                <Route element={<RoleGuard allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/verification" element={<AdminVerificationPage />} />
                  <Route path="/admin/reports" element={<AdminReportsPage />} />
                  <Route path="/admin/reports/:id" element={<ReportDetailPage />} />
                  <Route path="/admin/officers" element={<AdminOfficersPage />} />
                  <Route path="/admin/citizens" element={<AdminCitizensPage />} />
                  <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                  <Route path="/admin/map" element={<AdminMapPage />} />
                  <Route path="/admin/heatmap" element={<AdminHeatmapPage />} />
                  <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                  <Route path="/admin/audit-logs" element={<AdminAuditLogPage />} />
                  <Route path="/admin/sla-settings" element={<AdminSlaSettingsPage />} />
                  <Route path="/admin/settings" element={<AdminSystemSettingsPage />} />
                  <Route path="/admin/roles" element={<AdminRolesPage />} />
                  <Route path="/admin/notifications" element={<CitizenNotificationsPage />} />
                  <Route path="/admin/profile" element={<ProfilePage />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};
