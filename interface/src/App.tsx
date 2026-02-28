import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import FacilitiesPage from './pages/FacilitiesPage';
import BuildingRoomsPage from './pages/BuildingRoomsPage';
import FacilityDetailPage from './pages/FacilityDetailPage';
import BookingsPage from './pages/BookingsPage';
import AccountPage from './pages/AccountPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserComplaintsPage from './pages/UserComplaintsPage';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="full-center"><div className="spinner" /></div>;
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div className="full-center"><div className="spinner" /></div>;
  if (!token) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/facilities" replace />;
  return <>{children}</>;
};

const AppShell: React.FC = () => {
  const { token, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div className="full-center"><div className="spinner" /></div>;

  return (
    <>
      {token && <Navbar />}
      <main className={token ? 'main-content' : ''}>
        <Routes>
          <Route path="/auth" element={token ? <Navigate to={isAdmin ? '/admin' : '/facilities'} replace /> : <AuthPage />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          {/* Buildings flow: list → rooms → detail */}
          <Route path="/facilities" element={<PrivateRoute><FacilitiesPage /></PrivateRoute>} />
          <Route path="/buildings/:id" element={<PrivateRoute><BuildingRoomsPage /></PrivateRoute>} />
          <Route path="/facilities/:id" element={<PrivateRoute><FacilityDetailPage /></PrivateRoute>} />
          <Route path="/bookings" element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
          <Route path="/support" element={<PrivateRoute><UserComplaintsPage /></PrivateRoute>} />
          <Route path="/account" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to={token ? (isAdmin ? '/admin' : '/facilities') : '/auth'} replace />} />
        </Routes>
      </main>
    </>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <DataProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </DataProvider>
  </AuthProvider>
);

export default App;
