import React, { useEffect, useMemo, useState } from "react";

import {
  CheckCheck,
  Trash2,
  Bell,
  Search,
  FileText,
  User,
  FolderKanban,
  Package,
  CalendarDays,
  Image,
  Download,
  Settings,
  AlertCircle,
} from "lucide-react";
import "../css/Notifications.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3333"
).replace(/\/$/, "");

function buildApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatRelativeTime(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "Baru saja";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getIconByModule(module, icon) {
  const key = String(icon || module || "").toLowerCase();

  if (key.includes("user") || module === "client") return User;
  if (key.includes("project") || module === "project") return FolderKanban;
  if (key.includes("material") || module === "material") return Package;
  if (key.includes("calendar") || module === "calendar") return CalendarDays;
  if (key.includes("documentation") || module === "documentation") return Image;
  if (key.includes("file") || module === "file") return FileText;
  if (key.includes("report") || module === "report") return Download;
  if (key.includes("setting")) return Settings;

  return Bell;
}

function normalizeActivity(item) {
  const meta = item.metadata || {};
  const projectId = meta.projectId || meta.project_id || null;

  return {
    id: item.id,
    userId: item.userId || item.user_id || null,

    userName: item.userName || item.user_name || null,
    userRole: item.userRole || item.user_role || null,

    module: item.module || "system",
    action: item.action || "",
    title: item.title || "Aktivitas baru",
    description: item.description || "Tidak ada detail aktivitas.",
    icon: item.icon || "bell",
    color: item.color || "green",
    isRead: Boolean(item.isRead ?? item.is_read),
    metadata: meta,
    createdAt: item.createdAt || item.created_at,
    updatedAt: item.updatedAt || item.updated_at,
    projectId,
  };
}
export default function Notifications() {
  const [activities, setActivities] = useState([]);
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeModule, setActiveModule] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const currentUserRole = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      return JSON.parse(raw).role;
    } catch {
      return null;
    }
  }, []);

  const canDismiss = currentUserRole === 'finance' || currentUserRole === 'project_manager';

  const unreadCount = useMemo(() => {
    return activities.filter((item) => !item.isRead).length;
  }, [activities]);

  const moduleOptions = useMemo(() => {
    const modules = activities
      .map((item) => item.module)
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);

    return ["all", ...modules];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const matchesStatus =
        activeStatus === "all" ||
        (activeStatus === "unread" && !item.isRead) ||
        (activeStatus === "read" && item.isRead);

      const matchesModule =
        activeModule === "all" || item.module === activeModule;

      const keyword = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.module.toLowerCase().includes(keyword) ||
        item.action.toLowerCase().includes(keyword);

      return matchesStatus && matchesModule && matchesSearch;
    });
  }, [activities, activeStatus, activeModule, searchTerm]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const response = await fetch(buildApiUrl("/api/activity-logs?limit=10"), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data notifikasi.");
      }

      const data = Array.isArray(result.data)
        ? result.data
        : result.activities || [];

      setActivities(data.map(normalizeActivity));
    } catch (error) {
      setErrorMsg(error.message || "Gagal mengambil data notifikasi.");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (activityId) => {
    const target = activities.find((item) => item.id === activityId);

    if (!target || target.isRead) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/activity-logs/${activityId}/read`),
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menandai notifikasi.");
      }

      setActivities((prev) =>
        prev.map((item) =>
          item.id === activityId ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error) {
      setErrorMsg(error.message || "Gagal menandai notifikasi.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      setErrorMsg("");

      const response = await fetch(buildApiUrl("/api/activity-logs/read-all"), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menandai semua notifikasi.");
      }

      setActivities((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        })),
      );
    } catch (error) {
      setErrorMsg(error.message || "Gagal menandai semua notifikasi.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (activity) => {
    setDeleteTarget(activity);
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;

    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDeleteNotification = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");
      setErrorMsg("");

      const response = await fetch(
        buildApiUrl(`/api/activity-logs/${deleteTarget.id}`),
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus notifikasi.");
      }

      setActivities((prev) =>
        prev.filter((item) => item.id !== deleteTarget.id),
      );

      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error.message || "Gagal menghapus notifikasi.");
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (!deleteTarget) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeDeleteModal();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [deleteTarget, deleteLoading]);

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <p className="notifications-eyebrow">PUSAT AKTIVITAS</p>
          <h1>Notifikasi</h1>
          <p>
            Pantau semua aktivitas terbaru dari proyek, klien, material, file,
            kalender, laporan, dan pengguna.
          </p>
        </div>

        <button
          type="button"
          className="mark-all-btn"
          onClick={handleMarkAllAsRead}
          disabled={actionLoading || unreadCount === 0}
        >
          <CheckCheck size={18} />
          {actionLoading ? "Memproses..." : "Tandai semua dibaca"}
        </button>
      </div>

      <div className="notifications-panel">
        <div className="notifications-panel-head">
          <div>
            <div className="notifications-title-row">
              <h2>Semua Notifikasi</h2>

              {unreadCount > 0 ? (
                <span className="unread-pill">{unreadCount} Belum Dibaca</span>
              ) : (
                <span className="read-pill">Semua sudah dibaca</span>
              )}
            </div>

            <p>Total {activities.length} aktivitas tersimpan di sistem.</p>
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={fetchActivities}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Perbarui"}
          </button>
        </div>

        <div className="notifications-toolbar">
          <div className="notification-search">
            <Search size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari notifikasi..."
            />
          </div>

          <div className="notification-filter-group">
            <button
              type="button"
              className={activeStatus === "all" ? "active" : ""}
              onClick={() => setActiveStatus("all")}
            >
              Semua
            </button>

            <button
              type="button"
              className={activeStatus === "unread" ? "active" : ""}
              onClick={() => setActiveStatus("unread")}
            >
              Belum Dibaca
            </button>

            <button
              type="button"
              className={activeStatus === "read" ? "active" : ""}
              onClick={() => setActiveStatus("read")}
            >
              Sudah Dibaca
            </button>
          </div>

          <select
            value={activeModule}
            onChange={(event) => setActiveModule(event.target.value)}
            className="module-filter"
          >
            {moduleOptions.map((module) => (
              <option key={module} value={module}>
                {module === "all" ? "Semua Modul" : module}
              </option>
            ))}
          </select>
        </div>

        {errorMsg ? (
          <div className="notifications-alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        <div className="notifications-list">
          {loading ? (
            <div className="notifications-empty">
              <Bell size={34} />
              <h3>Mengambil notifikasi...</h3>
              <p>Mohon tunggu sebentar.</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="notifications-empty">
              <Bell size={34} />
              <h3>Belum ada notifikasi</h3>
              <p>Aktivitas terbaru akan muncul di halaman ini.</p>
            </div>
          ) : (
            filteredActivities.map((item) => {
              const IconComponent = getIconByModule(item.module, item.icon);

              return (
                <div
                  key={item.id}
                  className={`notification-item ${
                    item.isRead ? "is-read" : "is-unread"
                  }`}
                  onClick={() => handleMarkAsRead(item.id)}
                >
                  <div className={`notification-icon ${item.color}`}>
                    <IconComponent size={20} />
                  </div>

                  <div className="notification-content">
                    {item.userName ? (
                      <div className="notification-actor">
                        <strong>{item.userName}</strong>
                        {item.userRole ? ` • ${item.userRole}` : ""}
                      </div>
                    ) : null}

                    <div className="notification-main-row">
                      <h3>
                        {item.title}
                        {!item.isRead ? <span className="dot-unread" /> : null}
                      </h3>

                      <span className="notification-time">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p>{item.description}</p>

                    <div className="notification-meta">
                      <span>{item.module}</span>
                      <span>{item.action}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="notification-delete-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      openDeleteModal(item);
                    }}
                    title={canDismiss ? "Hapus dari daftar saya" : "Hapus Notifikasi"}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {deleteTarget ? (
        <div
          className="notification-modal-overlay"
          onClick={closeDeleteModal}
          role="presentation"
        >
          <div
            className="notification-confirm-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-notification-title"
          >
            <button
              type="button"
              className="notification-confirm-close"
              onClick={closeDeleteModal}
              disabled={deleteLoading}
              aria-label="Tutup modal"
            >
              ×
            </button>

            <h3 id="delete-notification-title">
              {canDismiss ? "Hapus Dari Daftar Saya" : "Hapus Notifikasi"}
            </h3>

            <p>
              {canDismiss
                ? "Apakah Anda yakin ingin menghapus notifikasi ini dari daftar Anda? Notifikasi ini hanya akan hilang dari tampilan Anda dan tetap tersedia untuk pengguna lain."
                : "Apakah Anda yakin ingin menghapus notifikasi ini?"}
            </p>

            {deleteError ? (
              <div className="notification-confirm-error">
                <AlertCircle size={16} />
                <span>{deleteError}</span>
              </div>
            ) : null}

            <div className="notification-confirm-actions">
              <button
                type="button"
                className="notification-cancel-btn"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Batal
              </button>

              <button
                type="button"
                className="notification-danger-btn"
                onClick={confirmDeleteNotification}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Memproses..." : canDismiss ? "Hapus dari Saya" : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
