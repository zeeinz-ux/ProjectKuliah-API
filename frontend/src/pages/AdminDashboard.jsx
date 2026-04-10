import React from "react";
import "../css/AdminDashboard.css";

const summaryCards = [
  { title: "Proyek Aktif", value: "12", note: "4 proyek mendekati deadline" },
  { title: "Proyek Selesai", value: "28", note: "Bulan ini +6 proyek" },
  { title: "Stok Kritis", value: "7", note: "Perlu restock material" },
  { title: "Jumlah Karyawan", value: "34", note: "Tim lapangan & admin" },
];

const projectRows = [
  {
    name: "Renovasi Kantor Direksi",
    client: "PT Sinar Makmur",
    progress: "82%",
    deadline: "18 Apr 2026",
    status: "On Progress",
  },
  {
    name: "Interior Lobby Hotel",
    client: "Hotel Arunika",
    progress: "45%",
    deadline: "01 Mei 2026",
    status: "Monitoring",
  },
  {
    name: "Fit Out Showroom",
    client: "Astra Living",
    progress: "100%",
    deadline: "05 Apr 2026",
    status: "Selesai",
  },
  {
    name: "Custom Office Workspace",
    client: "PT Nusantara Digital",
    progress: "63%",
    deadline: "24 Apr 2026",
    status: "On Progress",
  },
];

const stockRows = [
  { material: "HPL Walnut", stock: "18 lembar", status: "Aman" },
  { material: "Cat Interior Putih", stock: "6 kaleng", status: "Menipis" },
  { material: "Plywood 18mm", stock: "12 lembar", status: "Aman" },
  { material: "Lampu Downlight", stock: "4 pcs", status: "Kritis" },
];

const teamRows = [
  {
    name: "Raka Pratama",
    role: "Site Supervisor",
    project: "Renovasi Kantor Direksi",
  },
  {
    name: "Nadia Putri",
    role: "Admin Proyek",
    project: "Interior Lobby Hotel",
  },
  { name: "Aldo Saputra", role: "QC Interior", project: "Fit Out Showroom" },
  {
    name: "Dimas Fajar",
    role: "Logistik Material",
    project: "Custom Office Workspace",
  },
];

const reports = [
  {
    title: "Laporan Progres Mingguan",
    desc: "Ringkasan progres seluruh proyek minggu ini.",
  },
  {
    title: "Laporan Material",
    desc: "Data stok, material masuk, dan penggunaan proyek.",
  },
  {
    title: "Laporan Karyawan",
    desc: "Distribusi tim, absensi, dan penugasan lapangan.",
  },
];

const adminActions = [
  "Tambah Data Proyek",
  "Edit Data Proyek",
  "Hapus Data Proyek",
  "Kelola Data Karyawan",
  "Kelola Material",
  "Cetak Laporan",
];

const statusClass = (status) => {
  if (status === "Selesai") return "done";
  if (status === "Monitoring") return "monitoring";
  return "progress";
};

const stockClass = (status) => {
  if (status === "Kritis") return "critical";
  if (status === "Menipis") return "low";
  return "safe";
};

export default function AdminDashboard() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-hero-badge">Dashboard Internal Perusahaan</p>
          <h2>Monitoring Project Interior PT. MEDTIC INTERIOR</h2>
          <p className="dashboard-hero-text">
            Kelola proyek, stok material, laporan, dan data karyawan dalam satu
            dashboard yang modern, profesional, dan mudah digunakan.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <a href="#monitoring-proyek" className="dashboard-primary-btn">
            Lihat Monitoring
          </a>
          <a href="#admin-tools" className="dashboard-secondary-btn">
            Aksi Admin
          </a>
        </div>
      </section>

      <section className="dashboard-summary-grid">
        {summaryCards.map((item) => (
          <div key={item.title} className="dashboard-summary-card">
            <p>{item.title}</p>
            <h3>{item.value}</h3>
            <span>{item.note}</span>
          </div>
        ))}
      </section>

      <section id="monitoring-proyek" className="dashboard-panel">
        <div className="dashboard-panel-head">
          <div>
            <p className="dashboard-section-label">Monitoring Proyek</p>
            <h3>Daftar Proyek Interior</h3>
          </div>

          <div className="dashboard-action-group">
            <button>Tambah</button>
            <button>Edit</button>
            <button className="danger">Hapus</button>
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Nama Proyek</th>
                <th>Client</th>
                <th>Progress</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projectRows.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.client}</td>
                  <td>{item.progress}</td>
                  <td>{item.deadline}</td>
                  <td>
                    <span
                      className={`status-badge ${statusClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="dashboard-two-column">
        <section id="stok-material" className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="dashboard-section-label">Stok Material</p>
              <h3>Kontrol Persediaan</h3>
            </div>
            <button className="dashboard-link-btn">Kelola Stok</button>
          </div>

          <div className="dashboard-mini-list">
            {stockRows.map((item) => (
              <div key={item.material} className="dashboard-mini-card">
                <div>
                  <h4>{item.material}</h4>
                  <p>{item.stock}</p>
                </div>
                <span className={`stock-badge ${stockClass(item.status)}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="jumlah-karyawan" className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="dashboard-section-label">Jumlah Karyawan</p>
              <h3>Tim yang Sedang Bertugas</h3>
            </div>
            <button className="dashboard-link-btn">Kelola Tim</button>
          </div>

          <div className="dashboard-team-list">
            {teamRows.map((item) => (
              <div key={item.name} className="dashboard-team-card">
                <div className="team-avatar">
                  {item.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h4>{item.name}</h4>
                  <p>{item.role}</p>
                  <span>{item.project}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-two-column">
        <section id="laporan-proyek" className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="dashboard-section-label">Laporan</p>
              <h3>Ringkasan dan Dokumen</h3>
            </div>
            <button className="dashboard-link-btn">Lihat Semua</button>
          </div>

          <div className="dashboard-report-list">
            {reports.map((item) => (
              <div key={item.title} className="dashboard-report-card">
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
                <div className="dashboard-report-actions">
                  <button>Preview</button>
                  <button>Download</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="admin-tools" className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="dashboard-section-label">Admin</p>
              <h3>Aksi CRUD Cepat</h3>
            </div>
            <button className="dashboard-link-btn">Panel Admin</button>
          </div>

          <div className="dashboard-admin-grid">
            {adminActions.map((item) => (
              <button key={item} className="dashboard-admin-action">
                {item}
              </button>
            ))}
          </div>

          <div className="dashboard-note-box">
            <strong>Catatan:</strong>
            <p>
              Tombol di atas sudah disiapkan sebagai area aksi CRUD. Nanti
              tinggal disambungkan ke modal/form atau halaman data sesuai
              struktur backend yang kamu pakai.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
