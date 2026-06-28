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
import PatientImaging from './pages/PatientImaging';
import DashboardLayout from './components/layout/DashboardLayout';

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
