import { useState } from "react";
import {
  FiGrid,
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiCamera,
  FiPlus,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiUpload,
  FiCheck,
  FiChevronRight,
  FiHome,
} from "react-icons/fi";
import "../css/AdminProject.css";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: 1,
    name: "Villa Serenity – Bali",
    client: "Bpk. Arief Wicaksono",
    status: "progress",
    progress: 68,
    cover:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    location: "Seminyak, Bali",
    deadline: "30 Agustus 2025",
    budget: "Rp 850.000.000",
    overview:
      "Renovasi total vila bergaya tropical-modern. Meliputi area living room, 3 kamar tidur, dapur, dan taman belakang.",
    timeline: [
      { date: "1 Mar 2025", label: "Kick-off & Survey Lokasi", done: true },
      { date: "15 Mar 2025", label: "Finalisasi Desain 3D", done: true },
      { date: "1 Apr 2025", label: "Pengerjaan Struktur & Plafon", done: true },
      {
        date: "20 Apr 2025",
        label: "Pemasangan Lantai & Dinding",
        done: false,
      },
      { date: "10 Mei 2025", label: "Pemasangan Furniture", done: false },
      { date: "30 Ags 2025", label: "Serah Terima Proyek", done: false },
    ],
    tasks: [
      { id: 1, label: "Survey & Pengukuran", done: true },
      { id: 2, label: "Desain 3D Disetujui", done: true },
      { id: 3, label: "Pembongkaran Area Lama", done: true },
      { id: 4, label: "Pengerjaan Plafon Gypsum", done: true },
      { id: 5, label: "Pemasangan Lantai Vinyl", done: false },
      { id: 6, label: "Pengecatan Dinding", done: false },
      { id: 7, label: "Instalasi Listrik & Lampu", done: false },
      { id: 8, label: "Pengiriman & Pemasangan Furniture", done: false },
      { id: 9, label: "Styling & Dekorasi Akhir", done: false },
    ],
    progressFeed: [
      {
        id: 1,
        date: "18 Apr 2025",
        author: "Tim Lapangan A",
        note: "Pemasangan lantai vinyl sudah 40% selesai. Material tambahan telah tiba.",
        img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
      },
      {
        id: 2,
        date: "10 Apr 2025",
        author: "Tim Lapangan A",
        note: "Plafon gypsum ruang utama selesai 100%. Siap pengecatan.",
        img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80",
      },
    ],
  },
  {
    id: 2,
    name: "Apartemen The Edge – Jakarta",
    client: "Ibu Nadya Putri",
    status: "progress",
    progress: 35,
    cover:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
    location: "Sudirman, Jakarta",
    deadline: "15 Oktober 2025",
    budget: "Rp 420.000.000",
    overview:
      "Desain interior apartemen 2BR bergaya Scandinavian-minimalist dengan sentuhan natural wood.",
    timeline: [
      { date: "10 Mar 2025", label: "Kick-off Meeting", done: true },
      { date: "25 Mar 2025", label: "Approval Desain", done: true },
      { date: "5 Apr 2025", label: "Pengerjaan Dimulai", done: false },
      { date: "15 Okt 2025", label: "Serah Terima", done: false },
    ],
    tasks: [
      { id: 1, label: "Survey Lokasi", done: true },
      { id: 2, label: "Approval Desain 3D", done: true },
      { id: 3, label: "Pengerjaan Plafon", done: false },
      { id: 4, label: "Pemasangan Lantai", done: false },
      { id: 5, label: "Pemasangan Furniture", done: false },
    ],
    progressFeed: [
      {
        id: 1,
        date: "2 Apr 2025",
        author: "Tim Lapangan B",
        note: "Material sudah diperiksa dan siap digunakan. Pengerjaan mulai besok.",
        img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80",
      },
    ],
  },
  {
    id: 3,
    name: "Rumah Tropis – Bandung",
    client: "Keluarga Santoso",
    status: "done",
    progress: 100,
    cover:
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80",
    location: "Dago, Bandung",
    deadline: "28 Feb 2025",
    budget: "Rp 650.000.000",
    overview:
      "Renovasi penuh rumah 2 lantai bergaya tropis kontemporer. Proyek telah selesai dan diserahterimakan.",
    timeline: [
      { date: "1 Nov 2024", label: "Kick-off", done: true },
      { date: "15 Nov 2024", label: "Approval Desain", done: true },
      { date: "1 Des 2024", label: "Pengerjaan", done: true },
      { date: "28 Feb 2025", label: "Serah Terima ✓", done: true },
    ],
    tasks: [
      { id: 1, label: "Survey & Desain", done: true },
      { id: 2, label: "Struktur & Plafon", done: true },
      { id: 3, label: "Lantai & Dinding", done: true },
      { id: 4, label: "Furniture & Styling", done: true },
    ],
    progressFeed: [
      {
        id: 1,
        date: "26 Feb 2025",
        author: "Tim Lapangan C",
        note: "Finishing akhir selesai. Siap untuk serah terima besok lusa.",
        img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
      },
    ],
  },
  {
    id: 4,
    name: "Kantor Startup – Surabaya",
    client: "PT. Kreasi Digital",
    status: "done",
    progress: 100,
    cover:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    location: "Gubeng, Surabaya",
    deadline: "10 Jan 2025",
    budget: "Rp 380.000.000",
    overview:
      "Desain interior kantor 200m² bergaya industrial-modern untuk startup teknologi.",
    timeline: [
      { date: "1 Okt 2024", label: "Kick-off", done: true },
      { date: "10 Jan 2025", label: "Serah Terima", done: true },
    ],
    tasks: [
      { id: 1, label: "Desain Layout Kantor", done: true },
      { id: 2, label: "Pemasangan Partisi", done: true },
      { id: 3, label: "Furniture Kantor", done: true },
    ],
    progressFeed: [],
  },
];

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ value, size = 52 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="circular-progress">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="cp-bg"
        strokeWidth="4"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="cp-fill"
        strokeWidth="4"
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
      <text
        x="50%"
        y="54%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="cp-text"
      >
        {value}%
      </text>
    </svg>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick }) {
  return (
    <div className="project-card" onClick={() => onClick(project)}>
      <div className="card-cover">
        <img src={project.cover} alt={project.name} loading="lazy" />
        <span className={`badge badge-${project.status}`}>
          {project.status === "done" ? "Selesai" : "Berjalan"}
        </span>
      </div>
      <div className="card-body">
        <div className="card-info">
          <h3 className="card-title">{project.name}</h3>
          <p className="card-client">
            <FiUser size={12} /> {project.client}
          </p>
          <p className="card-location">
            <FiMapPin size={12} /> {project.location}
          </p>
          <div className="card-deadline">
            <FiClock size={12} />
            <span>Deadline: {project.deadline}</span>
          </div>
        </div>
        <div className="card-progress">
          <CircularProgress value={project.progress} />
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function TabOverview({ project }) {
  return (
    <div className="tab-content">
      <div className="overview-grid">
        <div className="overview-main">
          <h4 className="section-label">Deskripsi Proyek</h4>
          <p className="overview-desc">{project.overview}</p>
          <div className="overview-meta">
            <div className="meta-item">
              <FiCalendar size={14} />
              <div>
                <span className="meta-label">Deadline</span>
                <span className="meta-value">{project.deadline}</span>
              </div>
            </div>
            <div className="meta-item">
              <FiMapPin size={14} />
              <div>
                <span className="meta-label">Lokasi</span>
                <span className="meta-value">{project.location}</span>
              </div>
            </div>
            <div className="meta-item">
              <FiUser size={14} />
              <div>
                <span className="meta-label">Klien</span>
                <span className="meta-value">{project.client}</span>
              </div>
            </div>
            <div className="meta-item">
              <FiHome size={14} />
              <div>
                <span className="meta-label">Budget</span>
                <span className="meta-value">{project.budget}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-timeline">
          <h4 className="section-label">Timeline Pengerjaan</h4>
          <ul className="timeline-list">
            {project.timeline.map((item, i) => (
              <li
                key={i}
                className={`timeline-item ${item.done ? "done" : ""}`}
              >
                <div className="tl-dot">
                  {item.done && <FiCheck size={10} />}
                </div>
                <div className="tl-body">
                  <span className="tl-date">{item.date}</span>
                  <span className="tl-label">{item.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Progress ────────────────────────────────────────────────────────────
function TabProgress({ project }) {
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!note.trim()) return;
    setSubmitted(true);
    setNote("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="tab-content">
      <div className="progress-overall">
        <span className="section-label">Progress Keseluruhan</span>
        <div className="progress-bar-wrap">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="progress-bar-pct">{project.progress}%</span>
        </div>
      </div>

      <div className="update-form">
        <h4 className="section-label">Update Progress</h4>
        <textarea
          className="form-textarea"
          placeholder="Tuliskan progress hari ini, kendala, atau catatan penting..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
        />
        <div className="form-row">
          <label className="upload-btn">
            <FiUpload size={14} /> Upload Foto
            <input type="file" accept="image/*" multiple hidden />
          </label>
          <button
            className={`submit-btn ${submitted ? "submitted" : ""}`}
            onClick={handleSubmit}
          >
            {submitted ? (
              <>
                <FiCheckCircle size={14} /> Tersimpan
              </>
            ) : (
              <>
                <FiPlus size={14} /> Kirim Update
              </>
            )}
          </button>
        </div>
      </div>

      <div className="progress-feed">
        <h4 className="section-label">Riwayat Progress</h4>
        {project.progressFeed.length === 0 && (
          <p className="empty-state">Belum ada update progress.</p>
        )}
        {project.progressFeed.map((item) => (
          <div key={item.id} className="feed-card">
            {item.img && (
              <img
                src={item.img}
                alt="progress"
                className="feed-img"
                loading="lazy"
              />
            )}
            <div className="feed-body">
              <div className="feed-meta">
                <span className="feed-author">{item.author}</span>
                <span className="feed-date">
                  <FiClock size={11} /> {item.date}
                </span>
              </div>
              <p className="feed-note">{item.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Task ────────────────────────────────────────────────────────────────
function TabTask({ project }) {
  const [tasks, setTasks] = useState(project.tasks);
  const done = tasks.filter((t) => t.done).length;

  const toggle = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  return (
    <div className="tab-content">
      <div className="task-header">
        <span className="section-label">Checklist Pekerjaan</span>
        <span className="task-count">
          {done}/{tasks.length} selesai
        </span>
      </div>
      <div className="task-progress-bar">
        <div
          className="task-prog-fill"
          style={{ width: `${(done / tasks.length) * 100}%` }}
        />
      </div>
      <ul className="task-list">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`task-item ${task.done ? "done" : ""}`}
            onClick={() => toggle(task.id)}
          >
            <div className="task-checkbox">
              {task.done && <FiCheck size={12} />}
            </div>
            <span className="task-label">{task.label}</span>
            {task.done && <span className="task-done-badge">Selesai</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Project Detail ───────────────────────────────────────────────────────────
const TABS = [
  { key: "overview", label: "Overview", icon: <FiGrid size={14} /> },
  { key: "progress", label: "Progress", icon: <FiCamera size={14} /> },
  { key: "task", label: "Task", icon: <FiCheckCircle size={14} /> },
];

function ProjectDetail({ project, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="detail-wrapper">
      <button className="back-btn" onClick={onBack}>
        <FiArrowLeft size={16} /> Semua Proyek
      </button>

      <div className="detail-hero">
        <img src={project.cover} alt={project.name} className="detail-cover" />
        <div className="detail-overlay">
          <span className={`badge badge-${project.status} badge-lg`}>
            {project.status === "done" ? "Selesai" : "Sedang Berjalan"}
          </span>
          <h2 className="detail-title">{project.name}</h2>
          <p className="detail-sub">
            <FiUser size={13} /> {project.client}
          </p>
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <TabOverview project={project} />}
      {activeTab === "progress" && <TabProgress project={project} />}
      {activeTab === "task" && <TabTask project={project} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminProject() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = PROJECTS.filter(
    (p) => filter === "all" || p.status === filter,
  );

  if (selected) {
    return (
      <ProjectDetail project={selected} onBack={() => setSelected(null)} />
    );
  }

  return (
    <div className="admin-project">
      <div className="page-header">
        <div>
          <h1 className="page-title">Proyek</h1>
          <p className="page-sub">Monitoring seluruh proyek interior aktif</p>
        </div>
        <button className="new-project-btn">
          <FiPlus size={15} /> Proyek Baru
        </button>
      </div>

      <div className="filter-bar">
        {["all", "progress", "done"].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Semua" : f === "progress" ? "Berjalan" : "Selesai"}
          </button>
        ))}
        <span className="filter-count">{filtered.length} proyek</span>
      </div>

      <div className="project-grid">
        {filtered.map((p) => (
          <ProjectCard key={p.id} project={p} onClick={setSelected} />
        ))}
      </div>
    </div>
  );
}
