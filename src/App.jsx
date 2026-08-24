import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './components/layout/DashboardLayout';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MedicalHistory = lazy(() => import('./pages/MedicalHistory'));
const CreateRecord = lazy(() => import('./pages/CreateRecord'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Feedback = lazy(() => import('./pages/Feedback'));
const VerifyPrescription = lazy(() => import('./pages/VerifyPrescription'));
const UploadReport = lazy(() => import('./pages/UploadReport'));
const HealthcareTest = lazy(() => import('./pages/HealthcareTest'));
const PatientImaging = lazy(() => import('./pages/PatientImaging'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-primary, #0a0f1a)',
      color: 'var(--accent-primary, #00e6d9)'
    }}>
      <div className="loading-spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/medical-history" element={<ProtectedRoute><DashboardLayout><MedicalHistory /></DashboardLayout></ProtectedRoute>} />
        <Route path="/create-record" element={<ProtectedRoute><DashboardLayout><CreateRecord /></DashboardLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin-panel" element={<ProtectedRoute><DashboardLayout><AdminPanel /></DashboardLayout></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><DashboardLayout><Feedback /></DashboardLayout></ProtectedRoute>} />
        <Route path="/verify-prescription" element={<ProtectedRoute><DashboardLayout><VerifyPrescription /></DashboardLayout></ProtectedRoute>} />
        <Route path="/upload-report" element={<ProtectedRoute><DashboardLayout><UploadReport /></DashboardLayout></ProtectedRoute>} />
        <Route path="/health-test" element={<ProtectedRoute><DashboardLayout><HealthcareTest /></DashboardLayout></ProtectedRoute>} />
        <Route path="/medical-imaging" element={<ProtectedRoute><DashboardLayout><PatientImaging /></DashboardLayout></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
