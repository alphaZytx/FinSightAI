import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import WorkspacePage from '../pages/Workspace/WorkspacePage';
import ComparisonPage from '../pages/Comparison/ComparisonPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import ChatPage from '../pages/Chat/ChatPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import AuthPage from '../pages/Authentication/AuthPage';
import ResetPasswordPage from '../pages/Authentication/ResetPasswordPage';
import { ProtectedRoute, GuestRoute } from './guards';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestRoute>
        <AuthPage />
      </GuestRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <GuestRoute>
        <ResetPasswordPage />
      </GuestRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'workspace', element: <WorkspacePage /> },
      { path: 'comparison', element: <ComparisonPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
