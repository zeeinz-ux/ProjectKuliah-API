// src/components/AdminLayout.jsx

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const adminMenu = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/users", label: "Data Pengguna" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-72 bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 text-white shadow-2xl flex flex-col">
        {/* Header sidebar */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-yellow-300 flex items-center justify-center shadow-md">
            <span className="font-extrabold text-blue-900 text-lg">A</span>
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold tracking-wide">
              Admin Dashboard
            </h1>
            {user && (
              <p className="text-xs text-blue-100 mt-0.5">
                Login sebagai{" "}
                <span className="font-medium">{user.name || user.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Menu sidebar */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {adminMenu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  "hover:bg-blue-600/70 hover:translate-x-0.5",
                  isActive
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-blue-50/90",
                ].join(" ")
              }
            >
              {/* Bullet / accent kecil */}
              <span className="h-2 w-2 rounded-full bg-yellow-300 group-[.active]:bg-blue-600" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full text-sm px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-yellow-300 font-semibold tracking-wide transition"
          >
            Logout
          </button>
          <p className="mt-2 text-[11px] text-blue-100/80">
            Memastikan admin memiliki akses penuh terhadap seluruh fitur web.
          </p>
        </div>
      </aside>

      {/* KONTEN UTAMA ADMIN */}
      <section className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Bar di atas konten admin */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-blue-600">
                Admin Area
              </p>
              <p className="text-sm text-slate-500">
                Kelola data dan konfigurasi aplikasi dari satu tempat.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-medium text-green-700 border border-green-200">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Online
              </span>
            </div>
          </div>

          {/* Outlet akan diisi oleh page admin: Dashboard, Volunteers, Events, Users */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 md:p-6">
            <Outlet />
          </div>
        </div>
      </section>
    </div>
  );
}
