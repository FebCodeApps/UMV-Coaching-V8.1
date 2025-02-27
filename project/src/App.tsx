import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Students } from './pages/Students';
import { Batches } from './pages/Batches';
import { Attendance } from './pages/Attendance';
import { StudyTracking } from './pages/StudyTracking';
import { Payments } from './pages/Payments';
import { Settings } from './pages/Settings';

function Dashboard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-primary mb-4">Welcome to Anini LMS</h2>
      <p className="text-gray-600">Select an option from the sidebar to get started.</p>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/students" element={<Students />} />
                    <Route path="/batches" element={<Batches />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/tracking" element={<StudyTracking />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
