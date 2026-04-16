import React, { useMemo, useState } from "react";
import {
  FiFileText,
  FiPackage,
  FiDollarSign,
  FiDownload,
  FiPrinter,
  FiFilter,
  FiCalendar,
  FiUser,
  FiClock,
} from "react-icons/fi";
import "../css/Laporan.css";

function Laporan() {
  // =========================================================
  // STATE
  // =========================================================
  // Menyimpan nilai filter tanggal awal
  const [startDate, setStartDate] = useState("");

  // Menyimpan nilai filter tanggal akhir
  const [endDate, setEndDate] = useState("");

  // Menyimpan proyek yang dipilih dari dropdown
  const [selectedProject, setSelectedProject] = useState("all");

  // =========================================================
  // DATA DUMMY PROJECT
  // =========================================================
  // Data ini nanti bisa diganti dari API/backend
  const projectOptions = [
    { id: "all", name: "Semua Proyek" },
    { id: "p1", name: "Villa Serenity – Bali" },
    { id: "p2", name: "Apartemen The Edge – Jakarta" },
    { id: "p3", name: "Rumah Tropis – Bandung" },
    { id: "p4", name: "Kantor Startup – Surabaya" },
  ];

  // =========================================================
  // DATA DUMMY CARD LAPORAN
  // =========================================================
  // Dibuat dalam bentuk array supaya scalable dan mudah ditambah
  const reportCards = [
    {
      id: 1,
      title: "Laporan Project",
      icon: <FiFileText size={22} />,
      description:
        "Ekspor PDF progress pengerjaan proyek, data customer, timeline, dan dokumentasi foto lapangan.",
      actionLabel: "Download PDF",
      type: "project",
    },
    {
      id: 2,
      title: "Laporan Stok",
      icon: <FiPackage size={22} />,
      description:
        "Rekap material masuk dan keluar, stok tersedia, serta histori penggunaan material proyek.",
      actionLabel: "Cetak Laporan",
      type: "stock",
    },
    {
      id: 3,
      title: "Laporan Keuangan / Summary",
      icon: <FiDollarSign size={22} />,
      description:
        "Ringkasan nilai kontrak, estimasi proyek, dan summary nilai pekerjaan berdasarkan proyek.",
      actionLabel: "Download PDF",
      type: "finance",
    },
  ];

  // =========================================================
  // DATA DUMMY AKTIVITAS LAPORAN
  // =========================================================
  // Nanti data ini bisa berasal dari database/log sistem
  const reportActivities = [
    {
      id: 1,
      user: "Admin Utama",
      reportName: "Laporan Project - Villa Serenity",
      projectId: "p1",
      date: "2026-04-14",
      time: "09:15 WIB",
    },
    {
      id: 2,
      user: "Project Manager",
      reportName: "Laporan Stok - Semua Material",
      projectId: "all",
      date: "2026-04-15",
      time: "13:40 WIB",
    },
    {
      id: 3,
      user: "Finance Staff",
      reportName: "Laporan Keuangan - Rumah Tropis",
      projectId: "p3",
      date: "2026-04-15",
      time: "16:05 WIB",
    },
    {
      id: 4,
      user: "Admin Lapangan",
      reportName: "Laporan Project - Apartemen The Edge",
      projectId: "p2",
      date: "2026-04-16",
      time: "10:20 WIB",
    },
    {
      id: 5,
      user: "Supervisor",
      reportName: "Laporan Keuangan - Kantor Startup",
      projectId: "p4",
      date: "2026-04-16",
      time: "15:10 WIB",
    },
  ];

  // =========================================================
  // HANDLER FILTER
  // =========================================================
  // Fungsi untuk mengecek apakah aktivitas masuk ke rentang tanggal yang dipilih
  const isDateInRange = (activityDate) => {
    if (!startDate && !endDate) return true;

    if (startDate && activityDate < startDate) return false;
    if (endDate && activityDate > endDate) return false;

    return true;
  };

  // =========================================================
  // FILTER DATA AKTIVITAS
  // =========================================================
  // useMemo dipakai agar filtering tidak dihitung ulang terus-menerus
  // kalau nilai state tidak berubah
  const filteredActivities = useMemo(() => {
    return reportActivities.filter((activity) => {
      const matchProject =
        selectedProject === "all" ||
        activity.projectId === selectedProject ||
        activity.projectId === "all";

      const matchDate = isDateInRange(activity.date);

      return matchProject && matchDate;
    });
  }, [selectedProject, startDate, endDate]);

  // =========================================================
  // HANDLER AKSI DOWNLOAD / CETAK
  // =========================================================
  // Ini masih simulasi frontend.
  // Nanti bisa diganti dengan generate PDF / panggil API backend
  const handleReportAction = (reportType, actionLabel) => {
    const projectName =
      projectOptions.find((item) => item.id === selectedProject)?.name ||
      "Semua Proyek";

    const filterInfo = `
Jenis: ${reportType}
Proyek: ${projectName}
Tanggal Awal: ${startDate || "-"}
Tanggal Akhir: ${endDate || "-"}
    `;

    alert(`${actionLabel} dijalankan.\n\n${filterInfo}`);
  };

  // =========================================================
  // HANDLER RESET FILTER
  // =========================================================
  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setSelectedProject("all");
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="laporan-page">
      {/* Header halaman */}
      <div className="laporan-header">
        <div>
          <span className="laporan-eyebrow">Monitoring Interior</span>
          <h1>Pusat Laporan</h1>
          <p>
            Kelola dokumentasi dan ekspor data proyek, stok material, serta
            summary keuangan dalam satu halaman.
          </p>
        </div>
      </div>

      {/* Section filter */}
      <div className="laporan-filter-card">
        <div className="laporan-filter-header">
          <div className="filter-title-wrap">
            <FiFilter size={18} />
            <h3>Filter Laporan</h3>
          </div>

          <button className="filter-reset-btn" onClick={handleResetFilter}>
            Reset Filter
          </button>
        </div>

        <div className="laporan-filter-grid">
          <div className="filter-group">
            <label>Tanggal Mulai</label>
            <div className="input-icon-wrap">
              <FiCalendar size={16} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Tanggal Akhir</label>
            <div className="input-icon-wrap">
              <FiCalendar size={16} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Pilih Proyek</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Card Laporan */}
      <div className="laporan-grid">
        {reportCards.map((card) => (
          <div className="laporan-card" key={card.id}>
            <div className="laporan-card-icon">{card.icon}</div>

            <div className="laporan-card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>

            <button
              className="laporan-action-btn"
              onClick={() => handleReportAction(card.type, card.actionLabel)}
            >
              {card.actionLabel === "Cetak Laporan" ? (
                <FiPrinter size={16} />
              ) : (
                <FiDownload size={16} />
              )}
              {card.actionLabel}
            </button>
          </div>
        ))}
      </div>

      {/* Tabel aktivitas terakhir */}
      <div className="laporan-table-card">
        <div className="laporan-table-header">
          <div>
            <h3>Aktivitas Laporan Terakhir</h3>
            <p>
              Riwayat user yang terakhir melakukan download atau cetak laporan.
            </p>
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
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <div className="table-user">
                        <span className="table-icon user-icon">
                          <FiUser size={14} />
                        </span>
                        {activity.user}
                      </div>
                    </td>
                    <td>
                      <div className="table-report-name">
                        <span className="table-icon report-icon">
                          <FiFileText size={14} />
                        </span>
                        {activity.reportName}
                      </div>
                    </td>
                    <td>{activity.date}</td>
                    <td>
                      <div className="table-time">
                        <FiClock size={14} />
                        {activity.time}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    <div className="table-empty">
                      Tidak ada aktivitas laporan pada filter yang dipilih.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Laporan;
