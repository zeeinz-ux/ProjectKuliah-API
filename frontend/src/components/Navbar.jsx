import logo from "../assets/logo.svg";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

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
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <img src={logo} alt="Logo" className="navbar-logo" />
            <span className="navbar-title">{/* PT Medtic Indonesia */}</span>
          </Link>

          <div className="navbar-menu">
            <NavItem to="/" active={isActive("/", true)}>
              Home
            </NavItem>

            <NavItem to="/gallery" active={isActive("/gallery")}>
              Gallery
            </NavItem>

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

            {user ? (
              <>
                <NavItem to="/profile" active={isActive("/profile")}>
                  Profil
                </NavItem>
                <button onClick={handleLogout} className="logout-btn">
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

const NavItem = ({ to, active, children }) => (
  <Link to={to} className={`nav-item ${active ? "active" : ""}`}>
    {children}
  </Link>
);

export default Navbar;
