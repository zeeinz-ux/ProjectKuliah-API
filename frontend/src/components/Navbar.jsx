// src/components/Navbar.jsx

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  // Baca ulang user dari localStorage setiap kali URL berubah
  useEffect(() => {
    const raw = localStorage.getItem("user");

    if (!raw) {
      setUser(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);
    } catch (e) {
      console.error("Gagal parse user dari localStorage", e);
      localStorage.removeItem("user");
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="mb-0 sticky top-0 left0 w-full z-50 bg-black/20 bacdrop-blur-sm border-b border-white/10">
      <div className="max-w-7x1 mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between py-3">
          {/* LOGO + BRAND */}
          <Link to="/" className="flex items-center gap-2">
            {/* Logo SVG: letakkan file di frontend/public/logo.svg */}
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-white font-semibold text-lg tracking-wide">
              {/* PT Medtic Indonesia */}
            </span>
          </Link>

          {/* MENU */}
          <div className="flex items-center gap-4 text-sm">
            {/* Home */}
            <NavItem to="/" active={isActive("/", true)}>
              Home
            </NavItem>

            {/* Gallery */}
            <NavItem to="/gallery" active={isActive("/gallery")}>
              Gallery
            </NavItem>

            {/* Admin menu jika role admin */}
            {user && user.role === "admin" && (
              <>
                <NavItem to="/admin" active={isActive("/admin", true)}>
                  Admin Dashboard
                </NavItem>
                <NavItem to="/admin/events" active={isActive("/admin/events")}>
                  Admin Events
                </NavItem>
                <NavItem to="/admin/users" active={isActive("/admin/users")}>
                  Admin Users
                </NavItem>
              </>
            )}

            {/* Kanan: login/register atau profil+logout */}
            {user ? (
              <>
                <NavItem to="/profile" active={isActive("/profile")}>
                  Profil
                </NavItem>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold
                             bg-red-500 text-white hover:bg-red-600 transition shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavItem to="/login" active={isActive("/login")}>
                  Login
                </NavItem>
                <NavItem to="/register" active={isActive("/register")}>
                  Register
                </NavItem>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Komponen kecil untuk link navbar
const NavItem = ({ to, active, children }) => (
  <Link
    to={to}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition
      ${
        active
          ? "bg-white text-blue-800 shadow-sm"
          : "text-blue-100 hover:bg-white/10"
      }`}
  >
    {children}
  </Link>
);

export default Navbar;
