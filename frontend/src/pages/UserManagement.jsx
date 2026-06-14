import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../css/UserManagement.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const TABS = [
  { label: "Semua", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Nonaktif", value: "inactive" },
];

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "Manajer Proyek" },
  { value: "finance", label: "Finance" },
];

const DEPARTEMEN_OPTIONS = [
  { value: "Super User", label: "Super Pengguna" },
  { value: "Operator Data", label: "Operator Data" },
  { value: "Accounting", label: "Accounting" },
];

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatRoleLabel = (role) => {
  if (!role) return "-";

  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const capitalize = (text) => {
  if (!text) return "-";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const escapeCsvValue = (value) => {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
};

export default function UserManagement() {
  let parsedUser = null;

  try {
    parsedUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    parsedUser = null;
  }

  const currentUser = parsedUser;
  const isSuperAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [visibleColumns, setVisibleColumns] = useState({
    role: true,
    department: true,
    status: true,
    lastActive: true,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    id: null,
    full_name: "",
    email: "",
    password: "",
    role: "",
    departemen: "",
    is_active: true,
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const columnsMenuRef = useRef(null);

  const getTokenHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setFetchError("");

      const response = await fetch(`${API_URL}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getTokenHeader(),
        },
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data pengguna");
      }

      const normalizedUsers = Array.isArray(data)
        ? data.map((user) => ({
            id: user.id,
            full_name: user.full_name || "-",
            email: user.email || "-",
            role: user.role || "-",
            departemen: user.departemen || "-",
            avatar: user.avatar || "",
            is_active: Boolean(user.is_active),
            status: user.is_active ? "active" : "inactive",
            lastActive: formatDateTime(
              user.updated_at ||
                user.updatedAt ||
                user.created_at ||
                user.createdAt,
            ),
          }))
        : [];

      setUsers(normalizedUsers);
    } catch (err) {
      setFetchError(
        err.message || "Terjadi kesalahan saat mengambil data pengguna",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, rowsPerPage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        columnsMenuRef.current &&
        !columnsMenuRef.current.contains(event.target)
      ) {
        setShowColumnsMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowColumnsMenu(false);
        setIsModalOpen(false);
        setFormError("");

        if (!deleteLoading) {
          setDeleteTarget(null);
          setDeleteError("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [deleteLoading]);

  useEffect(() => {
    if (isModalOpen || deleteTarget) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, deleteTarget]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchStatus =
        activeTab === "all" ? true : user.status === activeTab;

      const keyword = searchTerm.toLowerCase().trim();
      const matchSearch =
        user.full_name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword);

      return matchStatus && matchSearch;
    });
  }, [users, activeTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const openCreateModal = () => {
    if (!isSuperAdmin) return;

    setModalMode("create");
    setFormError("");
    setForm({
      id: null,
      full_name: "",
      email: "",
      password: "",
      role: "",
      departemen: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    if (!isSuperAdmin) return;

    setModalMode("edit");
    setFormError("");
    setForm({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      password: "",
      role: user.role,
      departemen: user.departemen,
      is_active: user.is_active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitLoading) return;

    setIsModalOpen(false);
    setFormError("");
  };

  const openDeleteModal = (user) => {
    if (!isSuperAdmin) return;

    setDeleteTarget(user);
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;

    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();

    if (!isSuperAdmin) return;

    try {
      setSubmitLoading(true);
      setFormError("");

      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        departemen: form.departemen,
        is_active: form.is_active,
      };

      if (modalMode === "create") {
        payload.password = form.password;
      } else if (form.password.trim()) {
        payload.password = form.password;
      }

      const url =
        modalMode === "create"
          ? `${API_URL}/users`
          : `${API_URL}/users/${form.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getTokenHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan data pengguna");
      }

      closeModal();
      await fetchUsers();
    } catch (err) {
      setFormError(err.message || "Terjadi kesalahan saat menyimpan user");
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!isSuperAdmin || !deleteTarget) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      const response = await fetch(`${API_URL}/users/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getTokenHeader(),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus user");
      }

      setDeleteTarget(null);
      await fetchUsers();
    } catch (err) {
      setDeleteError(err.message || "Terjadi kesalahan saat menghapus user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => {
    const headers = [
      "Nama",
      "Email",
      "Role",
      "Departemen",
      "Status",
      "Terakhir Aktif",
    ];

    const rows = filteredUsers.map((user) => [
      user.full_name,
      user.email,
      formatRoleLabel(user.role),
      user.departemen,
      capitalize(user.status),
      user.lastActive,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "data-user.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  };

  const handleToggleColumn = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const getRoleClass = (role) => {
    switch (role) {
      case "admin":
        return "user-role-badge user-role-badge--admin";
      case "project_manager":
        return "user-role-badge user-role-badge--editor";
      case "finance":
        return "user-role-badge user-role-badge--moderator";
      default:
        return "user-role-badge user-role-badge--viewer";
    }
  };

  const getStatusClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "user-status-badge user-status-badge--active";
      case "inactive":
        return "user-status-badge user-status-badge--inactive";
      default:
        return "user-status-badge";
    }
  };

  const startEntry =
    filteredUsers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, filteredUsers.length);

  const totalVisibleColumns =
    1 +
    Number(visibleColumns.role) +
    Number(visibleColumns.department) +
    Number(visibleColumns.status) +
    Number(visibleColumns.lastActive) +
    Number(isSuperAdmin);

  return (
    <div className="user-management-page">
      <div className="user-management-top">
        <div className="user-management-heading">
          <span className="user-management-eyebrow">Manajemen Pengguna</span>
          <h1 className="user-management-title">Pengguna</h1>
          <p className="user-management-subtitle">
            Kelola user, peran, dan hak akses sistem.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            className="user-btn user-btn--primary"
            onClick={openCreateModal}
          >
            + Tambah User
          </button>
        )}
      </div>

      <div className="user-toolbar-card">
        <div className="user-tabs-row">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`user-tab-btn ${
                activeTab === tab.value ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="user-actions-row">
          <div className="user-search-box">
            <span className="user-search-icon">⌕</span>
            <input
              type="text"
              placeholder="Cari user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="user-table-actions">
            <div className="user-columns-wrapper" ref={columnsMenuRef}>
              <button
                type="button"
                className="user-btn user-btn--secondary"
                onClick={() => setShowColumnsMenu((prev) => !prev)}
              >
                ☷ Kolom
              </button>

              {showColumnsMenu && (
                <div className="user-columns-dropdown">
                  <label>
                    <input
                      type="checkbox"
                      checked={visibleColumns.role}
                      onChange={() => handleToggleColumn("role")}
                    />
                    Role
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={visibleColumns.department}
                      onChange={() => handleToggleColumn("department")}
                    />
                    Departemen
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={visibleColumns.status}
                      onChange={() => handleToggleColumn("status")}
                    />
                    Status
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={visibleColumns.lastActive}
                      onChange={() => handleToggleColumn("lastActive")}
                    />
                    Terakhir Aktif
                  </label>
                </div>
              )}
            </div>

            <button
              type="button"
              className="user-btn user-btn--secondary"
              onClick={handleExport}
            >
              ⭳ Ekspor
            </button>
          </div>
        </div>
      </div>

      <div className="user-table-card">
        <div className="user-table-responsive">
          <table className="user-table">
            <thead>
              <tr>
                <th>Nama</th>
                {visibleColumns.role && <th>Role</th>}
                {visibleColumns.department && <th>Departemen</th>}
                {visibleColumns.status && <th>Status</th>}
                {visibleColumns.lastActive && <th>Terakhir Aktif</th>}
                {isSuperAdmin && <th className="user-action-column">Aksi</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={totalVisibleColumns}>
                    <div className="user-empty-state">
                      Memuat data pengguna...
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={totalVisibleColumns}>
                    <div className="user-empty-state">{fetchError}</div>
                  </td>
                </tr>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-table-user-cell">
                        <div className="user-avatar">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.full_name}
                              className="user-avatar-image"
                            />
                          ) : (
                            getInitials(user.full_name)
                          )}
                        </div>

                        <div className="user-meta">
                          <h4>{user.full_name}</h4>
                          <p>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {visibleColumns.role && (
                      <td>
                        <span className={getRoleClass(user.role)}>
                          {formatRoleLabel(user.role)}
                        </span>
                      </td>
                    )}

                    {visibleColumns.department && <td>{user.departemen}</td>}

                    {visibleColumns.status && (
                      <td>
                        <span className={getStatusClass(user.status)}>
                          {user.status === "active" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                    )}

                    {visibleColumns.lastActive && <td>{user.lastActive}</td>}

                    {isSuperAdmin && (
                      <td className="user-action-column">
                        <div className="user-row-actions">
                          <button
                            type="button"
                            className="user-icon-btn user-icon-btn--edit"
                            onClick={() => openEditModal(user)}
                            aria-label={`Edit ${user.full_name}`}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="user-icon-btn user-icon-btn--delete"
                            onClick={() => openDeleteModal(user)}
                            aria-label={`Hapus ${user.full_name}`}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={totalVisibleColumns}>
                    <div className="user-empty-state">
                      Tidak ada pengguna yang ditemukan.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="user-table-footer">
          <p className="user-results-text">
            Menampilkan {startEntry}-{endEntry} dari {filteredUsers.length} data
          </p>

          <div className="user-pagination-wrap">
            <div className="user-rows-select">
              <span>Baris</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>

            <div className="user-pagination">
              <button
                type="button"
                className="user-page-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`user-page-number ${
                    currentPage === page ? "active" : ""
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="user-page-btn"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {isSuperAdmin &&
        isModalOpen &&
        createPortal(
          <div className="user-modal-overlay" onClick={closeModal}>
            <div className="user-modal" onClick={(e) => e.stopPropagation()}>
              <div className="user-modal__header">
                <div>
                  <h3>
                    {modalMode === "create" ? "Tambah User Baru" : "Edit User"}
                  </h3>
                  <p>
                    {modalMode === "create"
                      ? "Tambahkan user baru ke dalam sistem monitoring interior."
                      : "Perbarui informasi user yang sudah terdaftar."}
                  </p>
                </div>

                <button
                  type="button"
                  className="user-modal__close"
                  onClick={closeModal}
                  aria-label="Tutup modal"
                >
                  ×
                </button>
              </div>

              {formError && (
                <div className="user-modal__error">{formError}</div>
              )}

              <form onSubmit={handleSubmitUser} className="user-form">
                <div className="user-form__grid">
                  <div className="user-form__group">
                    <label htmlFor="full_name">Nama Lengkap</label>
                    <input
                      id="full_name"
                      type="text"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleFormChange}
                      placeholder="Contoh: Admin Utama"
                      required
                    />
                  </div>

                  <div className="user-form__group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      placeholder="contoh@email.com"
                      required
                    />
                  </div>

                  <div className="user-form__group">
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      name="role"
                      value={form.role}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Pilih role</option>
                      {ROLE_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="user-form__group">
                    <label htmlFor="departemen">Departemen</label>
                    <select
                      id="departemen"
                      name="departemen"
                      value={form.departemen}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Pilih departemen</option>
                      {DEPARTEMEN_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="user-form__group">
                    <label htmlFor="password">
                      Password{" "}
                      {modalMode === "edit"
                        ? "(kosongkan jika tidak diubah)"
                        : ""}
                    </label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleFormChange}
                      placeholder={
                        modalMode === "create"
                          ? "Masukkan password minimal 6 karakter"
                          : "Kosongkan jika tidak ingin mengganti password"
                      }
                      required={modalMode === "create"}
                      minLength={6}
                    />
                  </div>

                  <div className="user-form__group">
                    <label htmlFor="is_active">Status Akun</label>
                    <select
                      id="is_active"
                      name="is_active"
                      value={String(form.is_active)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          is_active: e.target.value === "true",
                        }))
                      }
                      required
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="user-form__actions">
                  <button
                    type="button"
                    className="user-btn user-btn--ghost"
                    onClick={closeModal}
                    disabled={submitLoading}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="user-btn user-btn--primary"
                    disabled={submitLoading}
                  >
                    {submitLoading
                      ? "Menyimpan..."
                      : modalMode === "create"
                        ? "Simpan User"
                        : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {isSuperAdmin &&
        deleteTarget &&
        createPortal(
          <div
            className="user-delete-modal-overlay"
            onClick={closeDeleteModal}
            role="presentation"
          >
            <div
              className="user-delete-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-user-title"
            >
              <button
                type="button"
                className="user-delete-modal__close"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                aria-label="Tutup modal"
              >
                ×
              </button>

              <h3 id="delete-user-title">Hapus User</h3>

              <p>
                Apakah Anda yakin ingin menghapus user{" "}
                <strong className="user-delete-modal__target">
                  {deleteTarget.full_name}
                </strong>
                ?
              </p>

              {deleteError && (
                <div className="user-delete-modal__error">{deleteError}</div>
              )}

              <div className="user-delete-modal__actions">
                <button
                  type="button"
                  className="user-delete-modal__cancel"
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="user-delete-modal__danger"
                  onClick={confirmDeleteUser}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
