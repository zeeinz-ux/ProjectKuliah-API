// src/components/AdminLayout.jsx

import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/AdminLayout.css";
import logo from "../assets/logo.svg";
import {
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiTrendingUp,
  FiBox,
  FiUsers,
  FiFolder,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiUser,
  FiCalendar,
  FiMessageCircle,
  FiBell,
} from "react-icons/fi";

const COMPANY_NAME = "Medtic Indonesia";
const COMPANY_LOGO = logo;

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3333";

function getAvatarUrl(value) {
  if (!value) return "";

  const avatar = String(value);

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  if (avatar.startsWith("/")) {
    return `${API_BASE_URL}${avatar}`;
  }

  return `${API_BASE_URL}/${avatar}`;
}

function getInitialName(name) {
  const cleanName = String(name || "").trim();

  if (!cleanName) return "A";

  return cleanName.charAt(0).toUpperCase();
}

function formatRoleLabel(role = "") {
  if (!role) return "Admin";

  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const menuSections = [
  {
    title: "Ikhtisar",
    items: [
      { to: "/admin", label: "Dashboard", exact: true, icon: FiGrid },
      { to: "/admin/projects", label: "Proyek", icon: FiTrendingUp },
      { to: "/admin/materials", label: "Stok Material", icon: FiBox },
      { to: "/admin/calendar", label: "Kalender", icon: FiCalendar },
    ],
  },
  {
    title: "Bisnis",
    items: [
      // { to: "/admin/chat", label: "Chat", icon: FiMessageCircle },
      { to: "/admin/clients", label: "Klien", icon: FiUsers },
      { to: "/admin/documentation", label: "Berkas", icon: FiFolder },
      { to: "/admin/laporan", label: "Laporan", icon: FiFileText },
    ],
  },
  {
    title: "Manajemen",
    items: [
      { to: "/admin/users", label: "Pengguna", icon: FiUser },
      { to: "/admin/notifications", label: "Notifikasi", icon: FiBell },
      { to: "/admin/settings", label: "Pengaturan", icon: FiSettings },
    ],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const loadUserFromStorage = () => {
    const raw = localStorage.getItem("user");

    if (!raw) {
      setUser(null);
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);
      return parsed;
    } catch {
      setUser(null);
      return null;
    }
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) return;

      const latestUser = data?.user || data;

      localStorage.setItem("user", JSON.stringify(latestUser));
      setUser(latestUser);
    } catch {
      // fallback tetap pakai localStorage
    }
  };

  useEffect(() => {
    loadUserFromStorage();
    fetchCurrentUser();
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleUserUpdated = () => {
      loadUserFromStorage();
      fetchCurrentUser();
    };

    window.addEventListener("auth-user-updated", handleUserUpdated);
    window.addEventListener("storage", handleUserUpdated);

    return () => {
      window.removeEventListener("auth-user-updated", handleUserUpdated);
      window.removeEventListener("storage", handleUserUpdated);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const displayName = user?.full_name || user?.email || "Administrator";
  const avatarUrl = getAvatarUrl(user?.avatar);
  const avatarInitial = getInitialName(displayName);
  const roleLabel = formatRoleLabel(user?.role);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  return (
    <div className={`admin-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      {isMobileSidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Tutup sidebar"
        />
      )}

      <aside
        className={`admin-sidebar ${isMobileSidebarOpen ? "mobile-open" : ""}`}
      >
        <div className="admin-sidebar__header">
          <div className="brand-block">
            <div className="brand-logo">
              <img
                src={COMPANY_LOGO}
                alt="Logo perusahaan"
                className="brand-logo-image"
              />
            </div>

            <div className="brand-meta">
              <h1>{COMPANY_NAME}</h1>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-toggle sidebar-toggle--mobile"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Tutup sidebar mobile"
            title="Tutup sidebar mobile"
          >
            ✕
          </button>
        </div>

        <nav className="admin-sidebar__nav">
          {menuSections.map((section) => (
            <div className="menu-section" key={section.title}>
              <p className="menu-section__title">{section.title}</p>

              <div className="menu-section__items">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      title={isCollapsed ? item.label : ""}
                      className={({ isActive }) =>
                        `menu-link ${isActive ? "active" : ""}`
                      }
                    >
                      <span className="menu-icon">
                        <Icon />
                      </span>
                      <span className="menu-text">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="profile-card">
            <div className="profile-card__left">
              <div className="profile-avatar">
                {avatarUrl && !avatarFailed ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="profile-avatar-image"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : avatarInitial ? (
                  <span className="profile-avatar-initial">
                    {avatarInitial}
                  </span>
                ) : (
                  <FiUser />
                )}
              </div>

              <div className="profile-info">
                <strong>{displayName}</strong>
                <span>{roleLabel}</span>
              </div>
            </div>

            <button
              type="button"
              className="profile-logout-btn"
              onClick={handleLogout}
              aria-label="Keluar"
              title="Keluar"
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      <button
        type="button"
        className="sidebar-toggle sidebar-toggle--desktop layout-toggle-outside"
        onClick={toggleSidebar}
        aria-label={isCollapsed ? "Perbesar sidebar" : "Kecilkan sidebar"}
        title={isCollapsed ? "Perbesar sidebar" : "Kecilkan sidebar"}
      >
        {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Buka sidebar"
              title="Buka sidebar"
            >
              ☰
            </button>

            <div>
              <p className="admin-kicker">Area Admin</p>
              <h2 className="admin-title">Sistem Monitoring Interior</h2>
            </div>
          </div>

          <div className="admin-topbar__right">
            <span className="layout-status-badge">
              <span className="layout-status-dot" />
              Aktif
            </span>
          </div>
        </header>

        <section className="admin-content">
          <div className="admin-content__card">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}
