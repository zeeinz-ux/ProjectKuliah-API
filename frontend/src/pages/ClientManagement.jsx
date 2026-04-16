import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ClientManagement.css";

const initialClients = [
  {
    id: 1,
    name: "Emma Wilson",
    email: "emma@example.com",
    status: "Active",
    joined: "2026-01-05",
    totalSpent: 18500000,
    projects: [
      { id: 101, name: "Interior Cafe A", status: "Completed" },
      { id: 102, name: "Renovasi Rumah A", status: "On Progress" },
    ],
  },
  {
    id: 2,
    name: "James Chen",
    email: "james@company.io",
    status: "Active",
    joined: "2026-01-12",
    totalSpent: 9200000,
    projects: [
      { id: 103, name: "Booth Pameran Brand X", status: "On Progress" },
    ],
  },
  {
    id: 3,
    name: "Sofia Garcia",
    email: "sofia@startup.co",
    status: "Active",
    joined: "2025-12-18",
    totalSpent: 28500000,
    projects: [
      { id: 104, name: "Interior Office Startup", status: "Completed" },
      { id: 105, name: "Lobby Kantor Minimalis", status: "Pending" },
    ],
  },
  {
    id: 4,
    name: "Alex Thompson",
    email: "alex@dev.com",
    status: "Active",
    joined: "2026-01-20",
    totalSpent: 4600000,
    projects: [{ id: 106, name: "Kitchen Set Modern", status: "Completed" }],
  },
  {
    id: 5,
    name: "Maria Santos",
    email: "maria@agency.co",
    status: "Active",
    joined: "2025-12-02",
    totalSpent: 12750000,
    projects: [
      { id: 107, name: "Renovasi Ruang Meeting", status: "On Progress" },
    ],
  },
  {
    id: 6,
    name: "David Kim",
    email: "david@tech.io",
    status: "Inactive",
    joined: "2025-11-15",
    totalSpent: 0,
    projects: [],
  },
  {
    id: 7,
    name: "Lisa Park",
    email: "lisa@design.co",
    status: "Active",
    joined: "2026-01-08",
    totalSpent: 9850000,
    projects: [
      { id: 108, name: "Interior Boutique Store", status: "Completed" },
    ],
  },
  {
    id: 8,
    name: "Ryan Mitchell",
    email: "ryan@startup.io",
    status: "Active",
    joined: "2025-12-28",
    totalSpent: 25400000,
    projects: [
      { id: 109, name: "Showroom Furniture", status: "On Progress" },
      { id: 110, name: "Display Produk Premium", status: "Pending" },
    ],
  },
  {
    id: 9,
    name: "Nina Patel",
    email: "nina@corp.com",
    status: "Active",
    joined: "2026-01-15",
    totalSpent: 5100000,
    projects: [{ id: 111, name: "Backdrop Resepsionis", status: "Completed" }],
  },
  {
    id: 10,
    name: "Tom Bradley",
    email: "tom@agency.io",
    status: "Active",
    joined: "2026-01-22",
    totalSpent: 9100000,
    projects: [
      { id: 112, name: "Workspace Creative Studio", status: "On Progress" },
    ],
  },
  {
    id: 11,
    name: "Olivia Brown",
    email: "olivia@studio.com",
    status: "Inactive",
    joined: "2025-10-12",
    totalSpent: 3500000,
    projects: [{ id: 113, name: "Mini Bar Apartment", status: "Completed" }],
  },
  {
    id: 12,
    name: "Daniel Lee",
    email: "daniel@home.id",
    status: "Active",
    joined: "2026-02-02",
    totalSpent: 15800000,
    projects: [
      { id: 114, name: "Renovasi Kamar Utama", status: "On Progress" },
      { id: 115, name: "Wardrobe Custom", status: "Pending" },
    ],
  },
];

const statusTabs = ["All", "Active", "Inactive"];

function ClientManagement() {
  const navigate = useNavigate();

  const [clients, setClients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [selectedClient, setSelectedClient] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: "Active",
    joined: "",
    totalSpent: "",
    firstProjectName: "",
    firstProjectStatus: "Pending",
  });

  const getInitials = (name) => {
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
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusClass = (status) => status.toLowerCase().replace(/\s+/g, "-");

  // Logika filtering:
  // 1. Filter berdasarkan tab status (All / Active / Inactive)
  // 2. Lalu filter lagi berdasarkan input search untuk nama atau email client
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesStatus =
        activeTab === "All" ? true : client.status === activeTab;

      const keyword = searchTerm.toLowerCase();
      const matchesSearch =
        client.name.toLowerCase().includes(keyword) ||
        client.email.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [clients, activeTab, searchTerm]);

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

  const handleOpenDrawer = (client) => {
    setSelectedClient(client);
  };

  const handleCloseDrawer = () => {
    setSelectedClient(null);
  };

  const handleDeleteClient = (clientId) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus client ini?");
    if (!confirmDelete) return;

    setClients((prev) => prev.filter((client) => client.id !== clientId));

    if (selectedClient?.id === clientId) {
      setSelectedClient(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddClient = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.joined) {
      alert("Nama, email, dan tanggal bergabung wajib diisi.");
      return;
    }

    const newClient = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      status: formData.status,
      joined: formData.joined,
      totalSpent: Number(formData.totalSpent || 0),
      projects: formData.firstProjectName
        ? [
            {
              id: Math.floor(Math.random() * 100000),
              name: formData.firstProjectName,
              status: formData.firstProjectStatus,
            },
          ]
        : [],
    };

    setClients((prev) => [newClient, ...prev]);
    setIsAddModalOpen(false);
    setCurrentPage(1);

    setFormData({
      name: "",
      email: "",
      status: "Active",
      joined: "",
      totalSpent: "",
      firstProjectName: "",
      firstProjectStatus: "Pending",
    });
  };

  // Logika cross-linking:
  // Saat nama project di drawer diklik, user diarahkan ke halaman detail project
  // menggunakan route dinamis /project-detail/:id
  const handleNavigateProject = (projectId) => {
    navigate(`/project-detail/${projectId}`);
  };

  const startItem =
    filteredClients.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, filteredClients.length);

  return (
    <div className="client-page">
      <div className="client-page__header">
        <div>
          <h1>Client Management</h1>
          <p>Kelola data client dan lihat keterhubungannya dengan project.</p>
        </div>

        <button
          className="client-btn client-btn--primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          + Add Client
        </button>
      </div>

      <div className="client-toolbar">
        <div className="client-tabs">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              className={`client-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleChangeTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="client-search">
          <span className="client-search__icon">⌕</span>
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="client-card">
        <div className="client-table-wrap">
          <table className="client-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedClients.length > 0 ? (
                paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="client-table__row"
                    onClick={() => handleOpenDrawer(client)}
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
                              handleOpenDrawer(client);
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
                        className={`status-badge ${statusClass(client.status)}`}
                      >
                        {client.status}
                      </span>
                    </td>

                    <td>{formatDate(client.joined)}</td>
                    <td>{client.projects.length}</td>
                    <td className="client-table__money">
                      {formatCurrency(client.totalSpent)}
                    </td>

                    <td>
                      <button
                        className="client-btn client-btn--danger client-btn--sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(client.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="client-empty">
                      Tidak ada data client yang cocok.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="client-footer">
          <p>
            Showing {startItem}-{endItem} of {filteredClients.length} results
          </p>

          <div className="client-pagination">
            <div className="client-rows">
              <span>Rows</span>
              <select value={rowsPerPage} onChange={handleRowsChange}>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>

            <button
              className="client-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  className={`client-page-btn ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button
              className="client-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedClient && (
        <>
          <div className="client-drawer-overlay" onClick={handleCloseDrawer} />
          <aside className="client-drawer">
            <div className="client-drawer__header">
              <div>
                <h2>Client Detail</h2>
                <p>Informasi client dan riwayat project terkait.</p>
              </div>
              <button
                className="client-drawer__close"
                onClick={handleCloseDrawer}
              >
                ×
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
                    className={`status-badge ${statusClass(selectedClient.status)}`}
                  >
                    {selectedClient.status}
                  </span>
                </div>
              </div>

              <div className="drawer-section">
                <h4>Client Info</h4>
                <div className="drawer-info-grid">
                  <div className="drawer-info-card">
                    <span>Joined</span>
                    <strong>{formatDate(selectedClient.joined)}</strong>
                  </div>
                  <div className="drawer-info-card">
                    <span>Total Orders</span>
                    <strong>{selectedClient.projects.length}</strong>
                  </div>
                  <div className="drawer-info-card">
                    <span>Total Spent</span>
                    <strong>{formatCurrency(selectedClient.totalSpent)}</strong>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <h4>Riwayat Project</h4>

                {selectedClient.projects.length > 0 ? (
                  <div className="project-history">
                    {selectedClient.projects.map((project) => (
                      <div key={project.id} className="project-history__item">
                        <div className="project-history__left">
                          <button
                            className="project-link"
                            onClick={() => handleNavigateProject(project.id)}
                          >
                            {project.name}
                          </button>
                          <span
                            className={`status-badge ${statusClass(project.status)}`}
                          >
                            {project.status}
                          </span>
                        </div>

                        <button
                          className="project-go-btn"
                          onClick={() => handleNavigateProject(project.id)}
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="drawer-empty">
                    Client ini belum memiliki riwayat project.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}

      {isAddModalOpen && (
        <>
          <div
            className="client-modal-overlay"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="client-modal">
            <div className="client-modal__header">
              <div>
                <h3>Add New Client</h3>
                <p>Tambahkan client baru beserta project awal jika ada.</p>
              </div>
              <button
                className="client-drawer__close"
                onClick={() => setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form className="client-form" onSubmit={handleAddClient}>
              <div className="client-form__grid">
                <div className="client-form__group">
                  <label>Nama Client</label>
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
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="client-form__group">
                  <label>Joined Date</label>
                  <input
                    type="date"
                    name="joined"
                    value={formData.joined}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="client-form__group">
                  <label>Total Spent</label>
                  <input
                    type="number"
                    name="totalSpent"
                    value={formData.totalSpent}
                    onChange={handleInputChange}
                    placeholder="Contoh: 15000000"
                  />
                </div>

                <div className="client-form__group">
                  <label>Project Pertama (Opsional)</label>
                  <input
                    type="text"
                    name="firstProjectName"
                    value={formData.firstProjectName}
                    onChange={handleInputChange}
                    placeholder="Contoh: Interior Cafe Baru"
                  />
                </div>

                <div className="client-form__group client-form__group--full">
                  <label>Status Project Pertama</label>
                  <select
                    name="firstProjectStatus"
                    value={formData.firstProjectStatus}
                    onChange={handleInputChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="On Progress">On Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="client-form__actions">
                <button
                  type="button"
                  className="client-btn client-btn--ghost"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="client-btn client-btn--primary"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default ClientManagement;
