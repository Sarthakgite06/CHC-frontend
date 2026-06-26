import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MedicalHistory from './pages/MedicalHistory';
import CreateRecord from './pages/CreateRecord';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Feedback from './pages/Feedback';
import VerifyPrescription from './pages/VerifyPrescription';
import UploadReport from './pages/UploadReport';
import HealthcareTest from './pages/HealthcareTest';

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
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/medical-history" element={<ProtectedRoute><MedicalHistory /></ProtectedRoute>} />
      <Route path="/create-record" element={<ProtectedRoute><CreateRecord /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin-panel" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
      <Route path="/verify-prescription" element={<ProtectedRoute><VerifyPrescription /></ProtectedRoute>} />
      <Route path="/upload-report" element={<ProtectedRoute><UploadReport /></ProtectedRoute>} />
      <Route path="/health-test" element={<ProtectedRoute><HealthcareTest /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
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
