// src/components/AdminLayout.jsx

import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/AdminLayout.css";
import logo from "../assets/logo.svg";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiTrendingUp,
  FiBox,
  FiUsers,
  FiFolder,
  FiFileText,
  FiUserCheck,
  FiSettings,
  FiLogOut,
  FiUser,
} from "react-icons/fi";

const COMPANY_NAME = "Medtic Indonesia";
const COMPANY_LOGO = logo;

const menuSections = [
  {
    title: "Overview",
    items: [
      {
        type: "link",
        to: "/admin",
        label: "Dashboard",
        exact: true,
        icon: FiGrid,
      },
      {
        type: "link",
        to: "/admin/projects",
        label: "Project",
        icon: FiTrendingUp,
      },
      // {
      //   type: "link",
      //   to: "/admin/progress",
      //   label: "Progress",
      //   icon: FiTrendingUp,
      // },
      {
        type: "link",
        to: "/admin/materials",
        label: "Stok Material",
        icon: FiBox,
      },
    ],
  },
  {
    title: "Commerce",
    items: [
      {
        type: "link",
        to: "/admin/clients",
        label: "Client",
        icon: FiUsers,
      },
      {
        type: "link",
        to: "/admin/documentation",
        label: "Files",
        icon: FiFolder,
      },
      {
        type: "link",
        to: "/admin/laporan",
        label: "Laporan",
        icon: FiFileText,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        type: "link",
        to: "/admin/users",
        label: "Users",
        icon: FiUser,
      },
      {
        type: "link",
        to: "/admin/settings",
        label: "Settings",
        icon: FiSettings,
      },
    ],
  },
];

function getInitialOpenMenus(pathname) {
  return {
    project: pathname.startsWith("/admin/projects"),
    progress: pathname.startsWith("/admin/progress"),
    material: pathname.startsWith("/admin/materials"),
    client: pathname.startsWith("/admin/clients"),
    documentation: pathname.startsWith("/admin/documentation"),
    reports: pathname.startsWith("/admin/reports"),
    users: pathname.startsWith("/admin/users"),
    settings: pathname.startsWith("/admin/settings"),
  };
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState(() =>
    getInitialOpenMenus(location.pathname),
  );

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);
    } catch {
      // biarkan, ProtectedRoute sudah meng-handle auth
    }
  }, []);

  useEffect(() => {
    const autoOpenMenus = getInitialOpenMenus(location.pathname);

    setOpenMenus((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(autoOpenMenus).filter(([, value]) => value),
      ),
    }));

    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const isPathActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const isGroupActive = (children = []) => {
    return children.some((child) => isPathActive(child.to, child.exact));
  };

  const toggleMenu = (key) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      return;
    }

    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const displayName = user?.name || user?.email || "Administrator";

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Admin";

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
            className="sidebar-toggle sidebar-toggle--desktop sidebar-toggle--floating"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Perbesar sidebar" : "Kecilkan sidebar"}
            title={isCollapsed ? "Perbesar sidebar" : "Kecilkan sidebar"}
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>

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
                  if (item.type === "link") {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.exact}
                        onClick={() => setIsMobileSidebarOpen(false)}
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
                  }

                  const Icon = item.icon;
                  const groupActive = isGroupActive(item.children);
                  const groupOpen = openMenus[item.key];

                  return (
                    <div
                      className={`menu-group ${
                        groupActive ? "menu-group--active" : ""
                      }`}
                      key={item.key}
                    >
                      <button
                        type="button"
                        className={`menu-link menu-link--button ${
                          groupActive ? "active-parent" : ""
                        }`}
                        onClick={() => toggleMenu(item.key)}
                      >
                        <span className="menu-icon">
                          <Icon />
                        </span>
                        <span className="menu-text">{item.label}</span>
                        <span
                          className={`menu-chevron ${
                            groupOpen ? "menu-chevron--open" : ""
                          }`}
                        >
                          <FiChevronDown />
                        </span>
                      </button>

                      {!isCollapsed && groupOpen && (
                        <div className="submenu">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={() => setIsMobileSidebarOpen(false)}
                              className={({ isActive }) =>
                                `submenu-link ${isActive ? "active" : ""}`
                              }
                            >
                              <span className="submenu-bullet" />
                              <span>{child.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
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
                <FiUser />
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
              aria-label="Logout"
              title="Logout"
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Buka sidebar"
            >
              ☰
            </button>

            <div>
              <p className="admin-kicker">Admin Area</p>
              <h2 className="admin-title">Sistem Monitoring Interior</h2>
            </div>
          </div>

          <div className="admin-topbar__right">
            <span className="status-badge">
              <span className="status-dot" />
              Online
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
