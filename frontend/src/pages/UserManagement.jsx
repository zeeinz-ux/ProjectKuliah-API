import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../css/UserManagement.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const TABS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "finance", label: "Finance" },
];

const DEPARTEMEN_OPTIONS = [
  { value: "IT/Sistem", label: "IT/Sistem" },
  { value: "Pengawas", label: "Pengawas" },
  { value: "Keuangan", label: "Keuangan" },
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

const UserManagement = () => {
  let parsedUser = null;
  try {
    parsedUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    parsedUser = null;
  }

  const currentUser = parsedUser;
  const isSuperAdmin = currentUser?.role === "super_admin";

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
        throw new Error(data.message || "Gagal mengambil data user");
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
        err.message || "Terjadi kesalahan saat mengambil data user",
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

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

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i);
    }
    return pages;
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
    setIsModalOpen(false);
    setFormError("");
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
        full_name: form.full_name,
        email: form.email,
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
        throw new Error(data.message || "Gagal menyimpan data user");
      }

      closeModal();
      await fetchUsers();
    } catch (err) {
      setFormError(err.message || "Terjadi kesalahan saat menyimpan user");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!isSuperAdmin) return;

    const confirmed = window.confirm(
      `Yakin ingin menghapus user "${user.full_name}"?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
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

      await fetchUsers();
    } catch (err) {
      alert(err.message || "Terjadi kesalahan saat menghapus user");
    }
  };

  const handleExport = () => {
    const headers = [
      "Name",
      "Email",
      "Role",
      "Department",
      "Status",
      "Last Active",
    ];

    const rows = filteredUsers.map((user) => [
      user.full_name,
      user.email,
      formatRoleLabel(user.role),
      user.departemen,
      user.status,
      user.lastActive,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleColumn = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const getRoleClass = (role) => {
    switch (role) {
      case "super_admin":
        return "role-badge admin";
      case "project_manager":
        return "role-badge editor";
      case "finance":
        return "role-badge moderator";
      default:
        return "role-badge viewer";
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "status-badge active";
      case "inactive":
        return "status-badge inactive";
      default:
        return "status-badge";
    }
  };

  const capitalize = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
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
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">
            Manage team members, roles, and permissions.
          </p>
        </div>

        {isSuperAdmin && (
          <button className="primary-btn" onClick={openCreateModal}>
            + Add User
          </button>
        )}
      </div>

      <div className="toolbar-card">
        <div className="tabs-row">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              className={`tab-btn ${activeTab === tab.value ? "active" : ""}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="actions-row">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-actions">
            <div className="columns-wrapper" ref={columnsMenuRef}>
              <button
                className="secondary-btn"
                onClick={() => setShowColumnsMenu((prev) => !prev)}
              >
                ☷ Columns
              </button>

              {showColumnsMenu && (
                <div className="columns-dropdown">
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
                    Department
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
                    Last Active
                  </label>
                </div>
              )}
            </div>

            <button className="secondary-btn" onClick={handleExport}>
              ⭳ Export
            </button>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                {visibleColumns.role && <th>Role</th>}
                {visibleColumns.department && <th>Department</th>}
                {visibleColumns.status && <th>Status</th>}
                {visibleColumns.lastActive && <th>Last Active</th>}
                {isSuperAdmin && <th className="action-column">Action</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={totalVisibleColumns}>
                    <div className="empty-state">Loading users...</div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={totalVisibleColumns}>
                    <div className="empty-state">{fetchError}</div>
                  </td>
                </tr>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.full_name}
                              className="avatar-image"
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
                          {capitalize(user.status)}
                        </span>
                      </td>
                    )}

                    {visibleColumns.lastActive && <td>{user.lastActive}</td>}

                    {isSuperAdmin && (
                      <td className="action-column">
                        <div className="row-actions">
                          <button
                            className="icon-btn edit"
                            onClick={() => openEditModal(user)}
                          >
                            ✎
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() => handleDeleteUser(user)}
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
                    <div className="empty-state">
                      No users found for this filter or search.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <p className="results-text">
            Showing {startEntry}-{endEntry} of {filteredUsers.length} results
          </p>

          <div className="pagination-wrap">
            <div className="rows-select">
              <span>Rows</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>

            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  className={`page-number ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="page-btn"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages || 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
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
                    {modalMode === "create" ? "Add New User" : "Edit User"}
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
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
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
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="user-btn user-btn--primary"
                    disabled={submitLoading}
                  >
                    {submitLoading
                      ? "Menyimpan..."
                      : modalMode === "create"
                        ? "Save User"
                        : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default UserManagement;
