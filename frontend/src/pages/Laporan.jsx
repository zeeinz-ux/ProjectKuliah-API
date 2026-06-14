import React, { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiFileText,
  FiFilter,
  FiPackage,
  FiUser,
} from "react-icons/fi";
import "../css/Laporan.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3333";

const DEFAULT_PROJECTS = [{ id: "all", name: "Semua Proyek" }];

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function getHeaders(isJson = false) {
  const token = getToken();

  return {
    Accept: isJson ? "application/json" : "text/csv, application/json",
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getCurrentUserId() {
  const directId =
    localStorage.getItem("user_id") ||
    localStorage.getItem("userId") ||
    localStorage.getItem("auth_user_id");

  if (directId) return directId;

  const possibleKeys = ["user", "auth_user", "currentUser", "profile", "admin"];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);

      const id =
        parsed?.id || parsed?.userId || parsed?.user?.id || parsed?.data?.id;

      if (id) return String(id);
    } catch {
      // lanjut cek key berikutnya
    }
  }

  return "";
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDateOnly(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeFileName(value) {
  return (
    String(value || "semua-proyek")
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "laporan"
  );
}

function getUserPhotoUrl(value) {
  if (!value) return "";

  const photo = String(value);

  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }

  if (photo.startsWith("/")) {
    return `${API_BASE_URL}${photo}`;
  }

  return `${API_BASE_URL}/${photo}`;
}

function getInitialName(name) {
  const cleanName = String(name || "").trim();

  if (!cleanName || cleanName === "-") return "";

  return cleanName.charAt(0).toUpperCase();
}

function normalizeProjects(payload) {
  const rawProjects = Array.isArray(payload)
    ? payload
    : payload?.projects || payload?.data || [];

  const mapped = rawProjects.map((item, index) => ({
    id: String(item.id || item.projectId || index + 1),
    name: item.name || item.projectName || item.title || `Proyek ${index + 1}`,
  }));

  return DEFAULT_PROJECTS.concat(mapped);
}

function normalizeSummary(payload) {
  const data = payload?.summary || payload?.data || payload || {};

  return {
    projectCount: Number(
      data.projectCount ?? data.project?.count ?? data.project?.total ?? 0,
    ),
    stockCount: Number(
      data.stockCount ?? data.stock?.count ?? data.stock?.total ?? 0,
    ),
    financeTotal: Number(
      data.financeTotal ?? data.finance?.total ?? data.finance?.amount ?? 0,
    ),
  };
}

function normalizeReportLogs(payload) {
  const rawLogs = Array.isArray(payload)
    ? payload
    : payload?.logs || payload?.data || [];

  return rawLogs.map((item, index) => {
    const createdAt =
      item.createdAt || item.generatedAt || item.exportedAt || item.loggedAt;

    const userName =
      item.userName ||
      item.generatedByName ||
      item.user?.name ||
      item.user?.fullName ||
      "-";

    const userPhoto = getUserPhotoUrl(
      item.userPhoto ||
        item.user_photo ||
        item.photo ||
        item.avatar ||
        item.profilePhoto ||
        item.profile_photo ||
        item.user?.photo ||
        item.user?.avatar ||
        item.user?.profilePhoto ||
        item.user?.profile_photo,
    );

    return {
      id: item.id || `log-${index + 1}`,
      userName,
      userPhoto,
      userInitial: getInitialName(userName),
      reportName:
        item.reportName ||
        item.fileName ||
        item.title ||
        `${item.reportType || "Laporan"} - ${
          item.projectName || "Semua Proyek"
        }`,
      createdAt,
      displayDate: formatDateOnly(createdAt),
      displayTime: formatTimeOnly(createdAt),
    };
  });
}

function buildQueryString({ selectedProject, startDate, endDate }) {
  const params = new URLSearchParams();

  if (selectedProject && selectedProject !== "all") {
    params.set("projectId", selectedProject);
  }

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  return params.toString();
}

function Laporan() {
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [selectedProject, setSelectedProject] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState({
    projectCount: 0,
    stockCount: 0,
    financeTotal: 0,
  });
  const [reportLogs, setReportLogs] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [exportingType, setExportingType] = useState("");
  const [error, setError] = useState("");

  const isInvalidDateRange = Boolean(
    startDate && endDate && startDate > endDate,
  );

  const selectedProjectName = useMemo(() => {
    return (
      projects.find((project) => project.id === selectedProject)?.name ||
      "Semua Proyek"
    );
  }, [projects, selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/options`, {
        headers: getHeaders(true),
      });

      if (!response.ok) {
        setProjects(DEFAULT_PROJECTS);
        return;
      }

      const result = await response.json().catch(() => ({}));
      setProjects(normalizeProjects(result));
    } catch {
      setProjects(DEFAULT_PROJECTS);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);

      const query = buildQueryString({ selectedProject, startDate, endDate });
      const response = await fetch(
        `${API_BASE_URL}/api/reports/summary${query ? `?${query}` : ""}`,
        {
          headers: getHeaders(true),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Endpoint GET /api/reports/summary tidak ditemukan.");
        }

        throw new Error(result.message || "Gagal mengambil ringkasan laporan.");
      }

      setSummary(normalizeSummary(result));
    } catch (err) {
      setSummary({
        projectCount: 0,
        stockCount: 0,
        financeTotal: 0,
      });
      setError(err.message || "Terjadi kesalahan saat mengambil ringkasan.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchReportLogs = async () => {
    try {
      setLoadingLogs(true);

      const query = buildQueryString({ selectedProject, startDate, endDate });
      const response = await fetch(
        `${API_BASE_URL}/api/report-logs${query ? `?${query}` : ""}`,
        {
          headers: getHeaders(true),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Endpoint GET /api/report-logs tidak ditemukan.");
        }

        throw new Error(result.message || "Gagal mengambil log laporan.");
      }

      setReportLogs(normalizeReportLogs(result));
    } catch (err) {
      setReportLogs([]);
      setError(err.message || "Terjadi kesalahan saat mengambil log laporan.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (isInvalidDateRange) return;

    setError("");
    fetchSummary();
    fetchReportLogs();
  }, [selectedProject, startDate, endDate, isInvalidDateRange]);

  const handleExportReport = async (type) => {
    if (isInvalidDateRange) {
      setError("Tanggal akhir tidak boleh lebih kecil dari tanggal mulai.");
      return;
    }

    try {
      setExportingType(type);
      setError("");

      const params = new URLSearchParams();
      params.set("type", type);
      params.set("format", "csv");

      const currentUserId = getCurrentUserId();

      if (currentUserId) {
        params.set("generatedBy", currentUserId);
      }

      if (selectedProject !== "all") {
        params.set("projectId", selectedProject);
      }

      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(
        `${API_BASE_URL}/api/reports/export?${params.toString()}`,
        {
          headers: getHeaders(),
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Endpoint GET /api/reports/export tidak ditemukan.");
        }

        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Gagal membuat laporan CSV.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `laporan-${type}-${safeFileName(selectedProjectName)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      fetchReportLogs();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengunduh laporan CSV.");
    } finally {
      setExportingType("");
    }
  };

  const handleResetFilter = () => {
    setSelectedProject("all");
    setStartDate("");
    setEndDate("");
    setError("");
  };

  const cards = [
    {
      id: "project",
      title: "Laporan Proyek",
      value: `${summary.projectCount} Proyek`,
      icon: <FiFileText />,
      description:
        "Ekspor data proyek, klien, status, progres, lokasi, tenggat, dan anggaran ke format CSV.",
      buttonLabel:
        exportingType === "project" ? "Membuat laporan..." : "Unduh CSV",
      actionIcon: <FiDownload />,
    },
    {
      id: "stock",
      title: "Laporan Stok",
      value: `${summary.stockCount} Data`,
      icon: <FiPackage />,
      description:
        "Ekspor rekap stok material, barang masuk, barang keluar, harga, dan nilai stok terakhir ke format CSV.",
      buttonLabel:
        exportingType === "stock" ? "Membuat laporan..." : "Unduh CSV",
      actionIcon: <FiDownload />,
    },
    {
      id: "finance",
      title: "Laporan Keuangan",
      value: formatCurrency(summary.financeTotal),
      icon: <FiDollarSign />,
      description:
        "Ekspor ringkasan anggaran proyek, estimasi biaya material, dan sisa anggaran ke format CSV.",
      buttonLabel:
        exportingType === "finance" ? "Membuat laporan..." : "Unduh CSV",
      actionIcon: <FiDownload />,
    },
  ];

  return (
    <div className="laporan-page">
      <div className="laporan-shell">
        <div className="laporan-header">
          <div>
            <span className="laporan-eyebrow">Monitoring Interior</span>
            <h1>Pusat Laporan</h1>
            <p>
              Halaman ini khusus ringkasan & ekspor laporan. Semua data ditarik
              dari database lalu diekspor menjadi file CSV yang bisa dibuka di
              Excel.
            </p>
          </div>
        </div>

        <section className="laporan-filter-card">
          <div className="laporan-filter-header">
            <div className="laporan-filter-title-wrap">
              <FiFilter />
              <h3>Filter Laporan</h3>
            </div>

            <button
              type="button"
              className="laporan-filter-reset-btn"
              onClick={handleResetFilter}
            >
              Atur Ulang Filter
            </button>
          </div>

          <div className="laporan-filter-grid">
            <div className="laporan-filter-group">
              <label>Tanggal Mulai</label>
              <div className="laporan-input-icon-wrap">
                <FiCalendar />
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="laporan-filter-group">
              <label>Tanggal Akhir</label>
              <div className="laporan-input-icon-wrap">
                <FiCalendar />
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="laporan-filter-group">
              <label>Pilih Proyek</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isInvalidDateRange && (
            <div className="laporan-filter-note laporan-filter-note--error">
              Tanggal akhir tidak boleh lebih kecil dari tanggal mulai.
            </div>
          )}

          {error && (
            <div className="laporan-filter-note laporan-filter-note--error">
              {error}
            </div>
          )}
        </section>

        <section className="laporan-grid">
          {cards.map((card) => (
            <div className="laporan-card" key={card.id}>
              <div className="laporan-card-icon">{card.icon}</div>

              <div className="laporan-card-content">
                <h3>{card.title}</h3>
                <p className="laporan-card-value">
                  {loadingSummary ? "Memuat..." : card.value}
                </p>
                <p>{card.description}</p>
              </div>

              <button
                type="button"
                className="laporan-action-btn"
                onClick={() => handleExportReport(card.id)}
                disabled={Boolean(exportingType)}
              >
                {card.actionIcon}
                {card.buttonLabel}
              </button>
            </div>
          ))}
        </section>

        <section className="laporan-table-card">
          <div className="laporan-table-header">
            <div>
              <h3>Aktivitas Laporan Terakhir</h3>
              <p>Riwayat pengguna yang mengunduh laporan CSV.</p>
            </div>
          </div>

          <div className="laporan-table-wrapper">
            <table className="laporan-table">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Jenis Laporan</th>
                  <th>Tanggal</th>
                  <th>Waktu</th>
                </tr>
              </thead>

              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan="4">
                      <div className="laporan-table-empty">
                        Memuat log laporan...
                      </div>
                    </td>
                  </tr>
                ) : reportLogs.length > 0 ? (
                  reportLogs.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <div className="laporan-table-user">
                          {activity.userPhoto ? (
                            <img
                              src={activity.userPhoto}
                              alt={activity.userName}
                              className="laporan-user-photo"
                            />
                          ) : activity.userInitial ? (
                            <span className="laporan-user-initial">
                              {activity.userInitial}
                            </span>
                          ) : (
                            <span className="laporan-table-icon laporan-user-icon">
                              <FiUser />
                            </span>
                          )}

                          <span>{activity.userName}</span>
                        </div>
                      </td>

                      <td>
                        <div className="laporan-table-report-name">
                          <span className="laporan-table-icon laporan-report-icon">
                            <FiFileText />
                          </span>
                          {activity.reportName}
                        </div>
                      </td>

                      <td>{activity.displayDate}</td>

                      <td>
                        <div className="laporan-table-time">
                          <FiClock />
                          {activity.displayTime}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      <div className="laporan-table-empty">
                        Tidak ada aktivitas laporan pada filter yang dipilih.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Laporan;
