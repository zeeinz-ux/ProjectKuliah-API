import React, { useEffect, useMemo, useRef, useState } from "react";
import "../css/UserManagement.css";

const USERS_DATA = [
  {
    id: 1,
    name: "Aigars Silkalns",
    email: "aigars@company.com",
    role: "Admin",
    department: "Engineering",
    status: "active",
    lastActive: "2 hours ago",
  },
  {
    id: 2,
    name: "Emma Wilson",
    email: "emma@company.com",
    role: "Editor",
    department: "Marketing",
    status: "active",
    lastActive: "5 min ago",
  },
  {
    id: 3,
    name: "James Chen",
    email: "james@company.com",
    role: "Admin",
    department: "Engineering",
    status: "active",
    lastActive: "1 hour ago",
  },
  {
    id: 4,
    name: "Sofia Garcia",
    email: "sofia@company.com",
    role: "Moderator",
    department: "Support",
    status: "active",
    lastActive: "30 min ago",
  },
  {
    id: 5,
    name: "Alex Thompson",
    email: "alex@company.com",
    role: "Viewer",
    department: "Sales",
    status: "active",
    lastActive: "3 hours ago",
  },
  {
    id: 6,
    name: "Maria Santos",
    email: "maria@company.com",
    role: "Editor",
    department: "Design",
    status: "active",
    lastActive: "1 day ago",
  },
  {
    id: 7,
    name: "David Kim",
    email: "david@company.com",
    role: "Viewer",
    department: "Finance",
    status: "inactive",
    lastActive: "2 weeks ago",
  },
  {
    id: 8,
    name: "Lisa Park",
    email: "lisa@company.com",
    role: "Editor",
    department: "Marketing",
    status: "active",
    lastActive: "10 min ago",
  },
  {
    id: 9,
    name: "Ryan Mitchell",
    email: "ryan@company.com",
    role: "Moderator",
    department: "Support",
    status: "active",
    lastActive: "45 min ago",
  },
  {
    id: 10,
    name: "Nina Patel",
    email: "nina@company.com",
    role: "Admin",
    department: "Engineering",
    status: "active",
    lastActive: "15 min ago",
  },
  {
    id: 11,
    name: "Daniel Cruz",
    email: "daniel@company.com",
    role: "Viewer",
    department: "Warehouse",
    status: "inactive",
    lastActive: "3 days ago",
  },
  {
    id: 12,
    name: "Olivia Brown",
    email: "olivia@company.com",
    role: "Editor",
    department: "Procurement",
    status: "active",
    lastActive: "20 min ago",
  },
  {
    id: 13,
    name: "Kevin Hartono",
    email: "kevin@company.com",
    role: "Moderator",
    department: "Operations",
    status: "suspended",
    lastActive: "1 month ago",
  },
  {
    id: 14,
    name: "Farah Amelia",
    email: "farah@company.com",
    role: "Editor",
    department: "Project Management",
    status: "active",
    lastActive: "8 min ago",
  },
  {
    id: 15,
    name: "Michael Scott",
    email: "michael@company.com",
    role: "Viewer",
    department: "Sales",
    status: "inactive",
    lastActive: "4 days ago",
  },
  {
    id: 16,
    name: "Rachel Green",
    email: "rachel@company.com",
    role: "Editor",
    department: "Design",
    status: "active",
    lastActive: "50 min ago",
  },
  {
    id: 17,
    name: "Jonathan Lee",
    email: "jonathan@company.com",
    role: "Admin",
    department: "IT Support",
    status: "active",
    lastActive: "12 min ago",
  },
  {
    id: 18,
    name: "Putri Maharani",
    email: "putri@company.com",
    role: "Moderator",
    department: "Customer Service",
    status: "suspended",
    lastActive: "6 days ago",
  },
  {
    id: 19,
    name: "Bima Saputra",
    email: "bima@company.com",
    role: "Viewer",
    department: "Logistics",
    status: "active",
    lastActive: "35 min ago",
  },
  {
    id: 20,
    name: "Anisa Ramadhani",
    email: "anisa@company.com",
    role: "Editor",
    department: "Finance",
    status: "active",
    lastActive: "18 min ago",
  },
  {
    id: 21,
    name: "Christopher Nolan",
    email: "chris@company.com",
    role: "Admin",
    department: "Management",
    status: "active",
    lastActive: "1 hour ago",
  },
  {
    id: 22,
    name: "Nadia Putri",
    email: "nadia@company.com",
    role: "Viewer",
    department: "HR",
    status: "inactive",
    lastActive: "5 days ago",
  },
  {
    id: 23,
    name: "Rizky Maulana",
    email: "rizky@company.com",
    role: "Editor",
    department: "Operations",
    status: "active",
    lastActive: "25 min ago",
  },
  {
    id: 24,
    name: "Stephanie Lim",
    email: "stephanie@company.com",
    role: "Moderator",
    department: "Legal",
    status: "suspended",
    lastActive: "2 weeks ago",
  },
];

const TABS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

const UserManagement = () => {
  const [users] = useState(USERS_DATA);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState({
    role: true,
    department: true,
    status: true,
    lastActive: true,
  });

  const columnsMenuRef = useRef(null);

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

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchStatus =
        activeTab === "all" ? true : user.status === activeTab;

      const keyword = searchTerm.toLowerCase().trim();
      const matchSearch =
        user.name.toLowerCase().includes(keyword) ||
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
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleAddUser = () => {
    alert("Modal Add User bisa kamu hubungkan nanti ke form tambah user.");
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
      user.name,
      user.email,
      user.role,
      user.department,
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

    alert("Data user berhasil diexport ke CSV.");
  };

  const handleToggleColumn = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const getRoleClass = (role) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "role-badge admin";
      case "editor":
        return "role-badge editor";
      case "moderator":
        return "role-badge moderator";
      case "viewer":
        return "role-badge viewer";
      default:
        return "role-badge";
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "status-badge active";
      case "inactive":
        return "status-badge inactive";
      case "suspended":
        return "status-badge suspended";
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

  return (
    <div className="user-management-page">
      <div className="user-management-top">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">
            Manage team members, roles, and permissions.
          </p>
        </div>

        <button className="primary-btn" onClick={handleAddUser}>
          + Add User
        </button>
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
                <th className="action-column">Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">{getInitials(user.name)}</div>
                        <div className="user-meta">
                          <h4>{user.name}</h4>
                          <p>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {visibleColumns.role && (
                      <td>
                        <span className={getRoleClass(user.role)}>
                          {user.role}
                        </span>
                      </td>
                    )}

                    {visibleColumns.department && <td>{user.department}</td>}

                    {visibleColumns.status && (
                      <td>
                        <span className={getStatusClass(user.status)}>
                          {capitalize(user.status)}
                        </span>
                      </td>
                    )}

                    {visibleColumns.lastActive && <td>{user.lastActive}</td>}

                    <td className="action-column">
                      <div className="row-actions">
                        <button
                          className="icon-btn edit"
                          onClick={() => alert(`Edit user: ${user.name}`)}
                        >
                          ✎
                        </button>
                        <button
                          className="icon-btn delete"
                          onClick={() => alert(`Delete user: ${user.name}`)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={
                      2 +
                      Number(visibleColumns.role) +
                      Number(visibleColumns.department) +
                      Number(visibleColumns.status) +
                      Number(visibleColumns.lastActive)
                    }
                  >
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
    </div>
  );
};

export default UserManagement;
