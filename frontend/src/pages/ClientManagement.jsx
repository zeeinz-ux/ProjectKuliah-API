import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, X, Trash2, Pencil, Users, Loader2 } from "lucide-react";
import AccessControl from "../components/AccessControl";
import "../css/ClientManagement.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const statusTabs = [
  { label: "Semua", value: "all" },
  { label: "Aktif", value: "Active" },
  { label: "Nonaktif", value: "Inactive" },
];

const emptyFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  status: "Active",
  joined: "",
};

function ClientManagement() {
  // =========================
  // State utama data client
  // =========================
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  // =========================
  // State filter, search, pagination
  // =========================
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // =========================
  // State modal add/edit
  // =========================
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState(emptyFormData);

  // =========================
  // State modal delete custom
  // =========================
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // =========================
  // State loading/error
  // =========================
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // =========================
  // Ambil token dari localStorage
  // =========================
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // =========================
  // Normalisasi data dari backend
  // Supaya aman kalau field backend snake_case
  // =========================
  const normalizeClient = (client) => {
    return {
      id: client.id,
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      status: client.status || "Active",
      joined: client.joined || client.joined_at || client.createdAt || "",
      totalSpent: Number(client.totalSpent || client.total_spent || 0),
      projects: client.projects || [],
      projectCount:
        client.projectCount ||
        client.project_count ||
        client.projects?.length ||
        client.orders ||
        0,
    };
  };

  // =========================
  // GET data client dari backend
  // =========================
  const fetchClients = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const response = await fetch(`${API_BASE_URL}/api/clients`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data klien.");
      }

      const data = Array.isArray(result) ? result : result.data || [];
      setClients(data.map(normalizeClient));
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // =========================
  // Helpers tampilan
  // =========================
  const getInitials = (name) => {
    if (!name) return "-";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusClass = (status) => {
    return String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  // =========================
  // Filter data client
  // =========================
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesStatus =
        activeTab === "all" ? true : client.status === activeTab;

      const keyword = searchTerm.toLowerCase();

      const matchesSearch =
        client.name.toLowerCase().includes(keyword) ||
        client.email.toLowerCase().includes(keyword) ||
        client.phone.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [clients, activeTab, searchTerm]);

  // =========================
  // Pagination
  // =========================
  const totalPages = Math.max(
    1,
    Math.ceil(filteredClients.length / rowsPerPage),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredClients.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredClients, currentPage, rowsPerPage]);

  const startItem =
    filteredClients.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const endItem = Math.min(currentPage * rowsPerPage, filteredClients.length);

  // =========================
  // Kunci scroll body ketika modal/drawer terbuka
  // =========================
  useEffect(() => {
    if (selectedClient || isFormModalOpen || deleteTarget) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedClient, isFormModalOpen, deleteTarget]);

  // =========================
  // Tutup modal dengan ESC
  // =========================
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      setSelectedClient(null);
      setIsFormModalOpen(false);

      if (!deleteLoading) {
        setDeleteTarget(null);
        setDeleteError("");
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [deleteLoading]);

  // =========================
  // Handler filter/search
  // =========================
  const handleChangeTab = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // =========================
  // Handler modal add/edit
  // =========================
  const handleOpenAddModal = () => {
    setFormMode("add");
    setFormData(emptyFormData);
    setErrorMsg("");
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    setFormMode("edit");
    setEditingClient(client);
    setErrorMsg("");

    setFormData({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      status: client.status || "Active",
      joined: client.joined ? String(client.joined).slice(0, 10) : "",
    });

    setSelectedClient(null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    if (submitLoading) return;

    setIsFormModalOpen(false);
    setFormData(emptyFormData);
    setSelectedClient(null);
    setEditingClient(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // POST / PUT client ke backend
  // =========================
  const handleSubmitClient = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.joined) {
      setErrorMsg("Nama, email, dan tanggal bergabung wajib diisi.");
      return;
    }

    try {
      setSubmitLoading(true);
      setErrorMsg("");

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        status: formData.status,
        joined: formData.joined,
      };

      const isEdit = formMode === "edit" && editingClient?.id;
      const url = isEdit
        ? `${API_BASE_URL}/api/clients/${editingClient.id}`
        : `${API_BASE_URL}/api/clients`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan data klien.");
      }

      await fetchClients();
      setCurrentPage(1);
      handleCloseFormModal();
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // =========================
  // Buka modal delete custom
  // =========================
  const handleOpenDeleteModal = (client) => {
    setDeleteTarget(client);
    setDeleteError("");
    setErrorMsg("");
  };

  const handleCloseDeleteModal = () => {
    if (deleteLoading) return;

    setDeleteTarget(null);
    setDeleteError("");
  };

  // =========================
  // DELETE client ke backend
  // =========================
  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");
      setErrorMsg("");

      const response = await fetch(
        `${API_BASE_URL}/api/clients/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus klien.");
      }

      setClients((prev) =>
        prev.filter((client) => client.id !== deleteTarget.id),
      );

      if (selectedClient?.id === deleteTarget.id) {
        setSelectedClient(null);
      }

      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(
        error.message || "Terjadi kesalahan saat menghapus klien.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="client-page">
      {/* Header halaman */}
      <div className="client-page__header">
        <div className="client-page__title-wrap">
          <span className="client-page__eyebrow">Manajemen Klien</span>
          <h1>Klien</h1>
        </div>

        <AccessControl action="write" resource="clients">
          <button
            type="button"
            className="client-btn client-btn--primary"
            onClick={handleOpenAddModal}
          >
            <Plus size={18} />
            Tambah Klien
          </button>
        </AccessControl>
      </div>

      {/* Pesan error */}
      {errorMsg && (
        <div className="client-alert">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Toolbar filter dan search */}
      <div className="client-toolbar">
        <div className="client-tabs">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`client-tab ${activeTab === tab.value ? "active" : ""}`}
              onClick={() => handleChangeTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="client-search">
          <Search className="client-search__icon" size={17} />
          <input
            type="text"
            placeholder="Cari klien..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Table client */}
      <div className="client-card">
        <div className="client-table-wrap">
          <table className="client-table">
            <thead>
              <tr>
                <th>Klien</th>
                <th>Status</th>
                <th>Bergabung</th>
                <th>Jumlah Proyek</th>
                <th>Total Pengeluaran</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">
                    <div className="client-empty">
                      <Loader2 className="client-spin" size={22} />
                      Memuat data klien...
                    </div>
                  </td>
                </tr>
              ) : paginatedClients.length > 0 ? (
                paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="client-table__row"
                    onClick={() => setSelectedClient(client)}
                  >
                    <td>
                      <div className="client-user">
                        <div className="client-avatar">
                          {getInitials(client.name)}
                        </div>

                        <div className="client-user__meta">
                          <button
                            type="button"
                            className="client-name-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                            }}
                          >
                            {client.name}
                          </button>
                          <span>{client.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`client-status-badge ${statusClass(
                          client.status,
                        )}`}
                      >
                        {client.status === "Active"
                          ? "Aktif"
                          : client.status === "Inactive"
                            ? "Nonaktif"
                            : client.status}
                      </span>
                    </td>

                    <td>{formatDate(client.joined)}</td>
                    <td>{client.projectCount}</td>

                    <td className="client-table__money">
                      {formatCurrency(client.totalSpent)}
                    </td>

                    <td>
                      <div className="client-action-group">
                        <AccessControl action="write" resource="clients">
                          <button
                            type="button"
                            className="client-icon-btn client-icon-btn--edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                              handleOpenEditModal(client);
                            }}
                            title="Ubah klien"
                          >
                            <Pencil size={15} />
                          </button>
                        </AccessControl>

                        <AccessControl action="delete" resource="clients">
                          <button
                            type="button"
                            className="client-icon-btn client-icon-btn--danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteModal(client);
                            }}
                            title="Hapus klien"
                          >
                            <Trash2 size={15} />
                          </button>
                        </AccessControl>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="client-empty">
                      <Users size={24} />
                      Tidak ada data klien yang cocok.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer table */}
        <div className="client-footer">
          <p>
            Menampilkan {startItem}-{endItem} dari {filteredClients.length} data
          </p>

          <div className="client-pagination">
            <div className="client-rows">
              <span>Baris</span>
              <select value={rowsPerPage} onChange={handleRowsChange}>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>

            <button
              type="button"
              className="client-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  className={`client-page-btn ${
                    currentPage === page ? "active" : ""
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button
              type="button"
              className="client-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Drawer detail client */}
      {selectedClient &&
        createPortal(
          <>
            <div
              className="client-drawer-overlay"
              onClick={() => setSelectedClient(null)}
            />

            <aside className="client-drawer">
              <div className="client-drawer__header">
                <div>
                  <h2>Detail Klien</h2>
                  <p>Informasi lengkap klien interior.</p>
                </div>

                <button
                  type="button"
                  className="client-close-btn"
                  onClick={() => setSelectedClient(null)}
                  aria-label="Tutup detail klien"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="client-drawer__body">
                <div className="drawer-profile">
                  <div className="drawer-profile__avatar">
                    {getInitials(selectedClient.name)}
                  </div>

                  <div>
                    <h3>{selectedClient.name}</h3>
                    <p>{selectedClient.email}</p>
                    <span
                      className={`client-status-badge ${statusClass(
                        selectedClient.status,
                      )}`}
                    >
                      {selectedClient.status === "Active"
                        ? "Aktif"
                        : selectedClient.status === "Inactive"
                          ? "Nonaktif"
                          : selectedClient.status}
                    </span>
                  </div>
                </div>

                <div className="drawer-section">
                  <h4>Informasi Klien</h4>

                  <div className="drawer-info-grid">
                    <div className="drawer-info-card">
                      <span>Bergabung</span>
                      <strong>{formatDate(selectedClient.joined)}</strong>
                    </div>

                    <div className="drawer-info-card">
                      <span>Total Proyek</span>
                      <strong>{selectedClient.projectCount}</strong>
                    </div>

                    <div className="drawer-info-card">
                      <span>Total Pengeluaran</span>
                      <strong>
                        {formatCurrency(selectedClient.totalSpent)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="drawer-section">
                  <h4>Kontak</h4>

                  <div className="drawer-contact-list">
                    <div>
                      <span>Email</span>
                      <strong>{selectedClient.email || "-"}</strong>
                    </div>

                    <div>
                      <span>Telepon</span>
                      <strong>{selectedClient.phone || "-"}</strong>
                    </div>

                    <div>
                      <span>Alamat</span>
                      <strong>{selectedClient.address || "-"}</strong>
                    </div>
                  </div>
                </div>

                <div className="drawer-actions">
                  <AccessControl action="write" resource="clients">
                    <button
                      type="button"
                      className="client-btn client-btn--ghost"
                      onClick={() => handleOpenEditModal(selectedClient)}
                    >
                      <Pencil size={16} />
                      Ubah Klien
                    </button>
                  </AccessControl>

                  <AccessControl action="delete" resource="clients">
                    <button
                      type="button"
                      className="client-btn client-btn--danger-solid"
                      onClick={() => handleOpenDeleteModal(selectedClient)}
                    >
                      <Trash2 size={16} />
                      Hapus Klien
                    </button>
                  </AccessControl>
                </div>
              </div>
            </aside>
          </>,
          document.body,
        )}

      {/* Modal tambah/edit client */}
      {isFormModalOpen &&
        createPortal(
          <>
            <div
              className="client-modal-overlay"
              onClick={handleCloseFormModal}
            />

            <div className="client-modal" onClick={(e) => e.stopPropagation()}>
              <div className="client-modal__header">
                <div>
                  <h3>
                    {formMode === "add" ? "Tambah Klien Baru" : "Ubah Klien"}
                  </h3>
                  <p>
                    {formMode === "add"
                      ? "Tambahkan data klien baru ke sistem."
                      : "Perbarui data klien yang sudah tersimpan."}
                  </p>
                </div>

                <button
                  type="button"
                  className="client-close-btn"
                  onClick={handleCloseFormModal}
                  aria-label="Tutup modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form className="client-form" onSubmit={handleSubmitClient}>
                <div className="client-form__grid">
                  <div className="client-form__group">
                    <label>Nama Klien</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>

                  <div className="client-form__group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contoh@email.com"
                    />
                  </div>

                  <div className="client-form__group">
                    <label>Telepon</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Contoh: 08123456789"
                    />
                  </div>

                  <div className="client-form__group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Active">Aktif</option>
                      <option value="Inactive">Nonaktif</option>
                    </select>
                  </div>

                  <div className="client-form__group">
                    <label>Tanggal Bergabung</label>
                    <input
                      type="date"
                      name="joined"
                      value={formData.joined}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="client-form__group client-form__group--full">
                    <label>Alamat</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Alamat klien"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="client-form__actions">
                  <button
                    type="button"
                    className="client-btn client-btn--ghost"
                    onClick={handleCloseFormModal}
                    disabled={submitLoading}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="client-btn client-btn--primary"
                    disabled={submitLoading}
                  >
                    {submitLoading && (
                      <Loader2 className="client-spin" size={16} />
                    )}
                    {formMode === "add" ? "Simpan Klien" : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </>,
          document.body,
        )}

      {/* Modal delete custom sesuai patokan Delete Event */}
      {deleteTarget &&
        createPortal(
          <div
            className="client-delete-modal-overlay"
            onClick={handleCloseDeleteModal}
            role="presentation"
          >
            <div
              className="client-delete-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-client-title"
            >
              <button
                type="button"
                className="client-delete-modal__close"
                onClick={handleCloseDeleteModal}
                disabled={deleteLoading}
                aria-label="Tutup modal"
              >
                <X size={22} />
              </button>

              <h3 id="delete-client-title">Hapus Klien</h3>

              <p>
                Apakah Anda yakin ingin menghapus klien{" "}
                <strong>{deleteTarget.name}</strong>?
              </p>

              {deleteError && (
                <div className="client-delete-modal__error">{deleteError}</div>
              )}

              <div className="client-delete-modal__actions">
                <button
                  type="button"
                  className="client-btn client-btn--ghost"
                  onClick={handleCloseDeleteModal}
                  disabled={deleteLoading}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="client-btn client-btn--danger-solid"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading && (
                    <Loader2 className="client-spin" size={16} />
                  )}
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

export default ClientManagement;
