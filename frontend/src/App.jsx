import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/AdminDashboard";
import AdminProject from "./pages/AdminProject";
import StokMaterial from "./pages/StokMaterial";
import ClientManagement from "./pages/ClientManagement";
import AdminLayout from "./components/AdminLayout";
import FieldFileUpload from "./pages/FieldFileUpload";
import Laporan from "./pages/Laporan";
import UserManagement from "./pages/UserManagement";
import ProfileSettings from "./pages/ProfileSettings";

function App() {
  const location = useLocation();
  const isAuthRoute =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="projects" element={<AdminProject />} />
            <Route path="materials" element={<StokMaterial />} />
            <Route path="clients" element={<ClientManagement />} />
            <Route path="documentation" element={<FieldFileUpload />} />
            <Route path="laporan" element={<Laporan />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<ProfileSettings />} />
          </Route>
        </Routes>
      </main>

      {isAuthRoute && <Footer />}
    </div>
  );
}

export default App;
