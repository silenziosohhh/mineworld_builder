import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { LandingPage } from '../pages/Landing/LandingPage';
import { LoginPage } from '../pages/Auth/LoginPage';
import { RegisterPage } from '../pages/Auth/RegisterPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { BuilderPage } from '../pages/Builder/BuilderPage';
import { useAuthStore } from '../store/authStore';
import ErrorPage from '../pages/Errors/ErrorPage';
import type { JSX } from 'react';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'builder',
        element: (
          <ProtectedRoute>
            <BuilderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'error',
        element: <ErrorPage />,
      },
      {
        path: '/profile',
        element: ( 
          <Navigate to="/" replace />
        )
      }
    ],
  },
]);