import { useMemo, useState } from "react";
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
  FiHome,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiFileText,
} from "react-icons/fi";
import "../css/AdminProject.css";

const INITIAL_PROJECTS = [
  {
    id: 1,
    name: "Villa Serenity – Bali",
    client: "Bpk. Arief Wicaksono",
    status: "progress",
    progress: 68,
    cover:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    location: "Seminyak, Bali",
    deadline: "2025-08-30",
    budget: "Rp 850.000.000",
    overview:
      "Renovasi total vila bergaya tropical-modern. Meliputi area living room, 3 kamar tidur, dapur, dan taman belakang.",
    timeline: [
      {
        id: 1,
        date: "1 Mar 2025",
        label: "Kick-off & Survey Lokasi",
        done: true,
      },
      { id: 2, date: "15 Mar 2025", label: "Finalisasi Desain 3D", done: true },
      {
        id: 3,
        date: "1 Apr 2025",
        label: "Pengerjaan Struktur & Plafon",
        done: true,
      },
      {
        id: 4,
        date: "20 Apr 2025",
        label: "Pemasangan Lantai & Dinding",
        done: false,
      },
      {
        id: 5,
        date: "10 Mei 2025",
        label: "Pemasangan Furniture",
        done: false,
      },
      { id: 6, date: "30 Ags 2025", label: "Serah Terima Proyek", done: false },
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
    deadline: "2025-10-15",
    budget: "Rp 420.000.000",
    overview:
      "Desain interior apartemen 2BR bergaya Scandinavian-minimalist dengan sentuhan natural wood.",
    timeline: [
      { id: 1, date: "10 Mar 2025", label: "Kick-off Meeting", done: true },
      { id: 2, date: "25 Mar 2025", label: "Approval Desain", done: true },
      { id: 3, date: "5 Apr 2025", label: "Pengerjaan Dimulai", done: false },
      { id: 4, date: "15 Okt 2025", label: "Serah Terima", done: false },
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
    deadline: "2025-02-28",
    budget: "Rp 650.000.000",
    overview:
      "Renovasi penuh rumah 2 lantai bergaya tropis kontemporer. Proyek telah selesai dan diserahterimakan.",
    timeline: [
      { id: 1, date: "1 Nov 2024", label: "Kick-off", done: true },
      { id: 2, date: "15 Nov 2024", label: "Approval Desain", done: true },
      { id: 3, date: "1 Des 2024", label: "Pengerjaan", done: true },
      { id: 4, date: "28 Feb 2025", label: "Serah Terima", done: true },
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
    deadline: "2025-01-10",
    budget: "Rp 380.000.000",
    overview:
      "Desain interior kantor 200m² bergaya industrial-modern untuk startup teknologi.",
    timeline: [
      { id: 1, date: "1 Okt 2024", label: "Kick-off", done: true },
      { id: 2, date: "10 Jan 2025", label: "Serah Terima", done: true },
    ],
    tasks: [
      { id: 1, label: "Desain Layout Kantor", done: true },
      { id: 2, label: "Pemasangan Partisi", done: true },
      { id: 3, label: "Furniture Kantor", done: true },
    ],
    progressFeed: [],
  },
];

const EMPTY_FORM = {
  name: "",
  client: "",
  status: "progress",
  progress: 0,
  cover: "",
  location: "",
  deadline: "",
  budget: "",
  overview: "",
};

function formatDeadline(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function CircularProgress({ value, size = 58 }) {
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
        strokeWidth="5"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="cp-fill"
        strokeWidth="5"
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
      <text
        x="50%"
        y="53%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="cp-text"
      >
        {value}%
      </text>
    </svg>
  );
}

function ProjectCard({ project, onClick, onEdit, onDelete }) {
  return (
    <div className="project-card">
      <div className="card-cover" onClick={() => onClick(project)}>
        <img src={project.cover} alt={project.name} loading="lazy" />
        <span className={`badge badge-${project.status}`}>
          {project.status === "done" ? "Selesai" : "Berjalan"}
        </span>
      </div>

      <div className="card-body">
        <div className="card-info" onClick={() => onClick(project)}>
          <h3 className="card-title">{project.name}</h3>
          <p className="card-client">
            <FiUser size={12} /> {project.client}
          </p>
          <p className="card-location">
            <FiMapPin size={12} /> {project.location}
          </p>
          <div className="card-deadline">
            <FiClock size={12} />
            <span>Deadline: {formatDeadline(project.deadline)}</span>
          </div>
        </div>

        <div className="card-side">
          <div className="card-progress">
            <CircularProgress value={project.progress} />
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => onEdit(project)}
              title="Edit project"
            >
              <FiEdit2 size={15} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => onDelete(project.id)}
              title="Hapus project"
            >
              <FiTrash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabOverview({ project }) {
  return (
    <div className="tab-content">
      <div className="overview-grid">
        <div className="content-card">
          <h4 className="section-label">Deskripsi Proyek</h4>
          <p className="overview-desc">{project.overview}</p>

          <div className="overview-meta">
            <div className="meta-item">
              <FiCalendar size={15} />
              <div>
                <span className="meta-label">Deadline</span>
                <span className="meta-value">
                  {formatDeadline(project.deadline)}
                </span>
              </div>
            </div>

            <div className="meta-item">
              <FiMapPin size={15} />
              <div>
                <span className="meta-label">Lokasi</span>
                <span className="meta-value">{project.location}</span>
              </div>
            </div>

            <div className="meta-item">
              <FiUser size={15} />
              <div>
                <span className="meta-label">Klien</span>
                <span className="meta-value">{project.client}</span>
              </div>
            </div>

            <div className="meta-item">
              <FiHome size={15} />
              <div>
                <span className="meta-label">Budget</span>
                <span className="meta-value">{project.budget}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h4 className="section-label">Timeline Pengerjaan</h4>
          <ul className="timeline-list">
            {project.timeline.map((item) => (
              <li
                key={item.id}
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

function TabProgress({
  project,
  onAddProgress,
  onDeleteProgress,
  onUpdateProjectProgress,
}) {
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState("Tim Lapangan");
  const [img, setImg] = useState("");
  const [progressValue, setProgressValue] = useState(project.progress);

  const handleSubmit = () => {
    if (!note.trim()) return;

    onAddProgress(project.id, {
      date: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      author,
      note,
      img,
    });

    setNote("");
    setImg("");
  };

  const handleSaveProgress = () => {
    const normalized = Math.max(0, Math.min(100, Number(progressValue) || 0));
    onUpdateProjectProgress(project.id, normalized);
  };

  return (
    <div className="tab-content tab-stack">
      <div className="content-card">
        <div className="section-row">
          <span className="section-label no-margin">Progress Keseluruhan</span>
          <span className="mini-badge green">{project.progress}%</span>
        </div>

        <div className="progress-bar-wrap">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="inline-form">
          <input
            type="number"
            min="0"
            max="100"
            value={progressValue}
            onChange={(e) => setProgressValue(e.target.value)}
            className="mini-input"
            placeholder="0-100"
          />
          <button className="secondary-btn" onClick={handleSaveProgress}>
            Simpan Progress
          </button>
        </div>
      </div>

      <div className="content-card">
        <h4 className="section-label">Tambah Update Progress</h4>

        <div className="form-grid">
          <div className="form-group">
            <label>Nama Tim</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Contoh: Tim Lapangan A"
            />
          </div>

          <div className="form-group">
            <label>Link Foto (opsional)</label>
            <input
              type="text"
              value={img}
              onChange={(e) => setImg(e.target.value)}
              placeholder="Tempel URL gambar"
            />
          </div>
        </div>

        <textarea
          className="form-textarea"
          placeholder="Tuliskan progress hari ini, kendala, atau catatan penting..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
        />

        <div className="form-row right">
          <button className="primary-btn" onClick={handleSubmit}>
            <FiPlus size={14} /> Kirim Update
          </button>
        </div>
      </div>

      <div className="content-card">
        <h4 className="section-label">Riwayat Progress</h4>

        {project.progressFeed.length === 0 && (
          <p className="empty-state">Belum ada update progress.</p>
        )}

        <div className="progress-feed">
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
                  <div>
                    <span className="feed-author">{item.author}</span>
                    <span className="feed-date">
                      <FiClock size={11} /> {item.date}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => onDeleteProgress(project.id, item.id)}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                <p className="feed-note">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabTask({ project, onToggleTask, onAddTask, onDeleteTask }) {
  const [taskInput, setTaskInput] = useState("");
  const done = project.tasks.filter((t) => t.done).length;
  const percent = project.tasks.length
    ? (done / project.tasks.length) * 100
    : 0;

  const handleAddTask = () => {
    if (!taskInput.trim()) return;
    onAddTask(project.id, taskInput);
    setTaskInput("");
  };

  return (
    <div className="tab-content tab-stack">
      <div className="content-card">
        <div className="task-header">
          <span className="section-label no-margin">Checklist Pekerjaan</span>
          <span className="task-count">
            {done}/{project.tasks.length} selesai
          </span>
        </div>

        <div className="task-progress-bar">
          <div className="task-prog-fill" style={{ width: `${percent}%` }} />
        </div>

        <div className="inline-form">
          <input
            type="text"
            className="mini-input grow"
            placeholder="Tambah task baru..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
          />
          <button className="secondary-btn" onClick={handleAddTask}>
            <FiPlus size={14} /> Tambah Task
          </button>
        </div>
      </div>

      <div className="content-card">
        <ul className="task-list">
          {project.tasks.map((task) => (
            <li
              key={task.id}
              className={`task-item ${task.done ? "done" : ""}`}
            >
              <div
                className="task-clickable"
                onClick={() => onToggleTask(project.id, task.id)}
              >
                <div className="task-checkbox">
                  {task.done && <FiCheck size={12} />}
                </div>
                <span className="task-label">{task.label}</span>
              </div>

              <div className="task-right">
                {task.done && <span className="task-done-badge">Selesai</span>}
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => onDeleteTask(project.id, task.id)}
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const TABS = [
  { key: "overview", label: "Overview", icon: <FiGrid size={14} /> },
  { key: "progress", label: "Progress", icon: <FiCamera size={14} /> },
  { key: "task", label: "Task", icon: <FiCheckCircle size={14} /> },
];

function ProjectDetail({
  project,
  onBack,
  onAddProgress,
  onDeleteProgress,
  onUpdateProjectProgress,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}) {
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
      {activeTab === "progress" && (
        <TabProgress
          project={project}
          onAddProgress={onAddProgress}
          onDeleteProgress={onDeleteProgress}
          onUpdateProjectProgress={onUpdateProjectProgress}
        />
      )}
      {activeTab === "task" && (
        <TabTask
          project={project}
          onToggleTask={onToggleTask}
          onAddTask={onAddTask}
          onDeleteTask={onDeleteTask}
        />
      )}
    </div>
  );
}

function ProjectModal({ form, setForm, onClose, onSubmit, isEdit }) {
  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="project-modal">
        <div className="modal-header">
          <div>
            <h3>{isEdit ? "Edit Proyek" : "Tambah Proyek Baru"}</h3>
            <p>Lengkapi data proyek interior di bawah ini.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Nama Proyek</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Contoh: Interior Cafe Premium"
              />
            </div>

            <div className="form-group">
              <label>Nama Klien</label>
              <input
                type="text"
                value={form.client}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, client: e.target.value }))
                }
                placeholder="Contoh: Bpk. Budi"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="progress">Berjalan</option>
                <option value="done">Selesai</option>
              </select>
            </div>

            <div className="form-group">
              <label>Progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.progress}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, progress: e.target.value }))
                }
                placeholder="0 - 100"
              />
            </div>

            <div className="form-group">
              <label>Lokasi</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Contoh: Bandung"
              />
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, deadline: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label>Budget</label>
              <input
                type="text"
                value={form.budget}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, budget: e.target.value }))
                }
                placeholder="Contoh: Rp 150.000.000"
              />
            </div>

            <div className="form-group">
              <label>URL Cover</label>
              <input
                type="text"
                value={form.cover}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cover: e.target.value }))
                }
                placeholder="Tempel URL gambar cover"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Deskripsi</label>
            <textarea
              rows={4}
              value={form.overview}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, overview: e.target.value }))
              }
              placeholder="Jelaskan proyek ini..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="primary-btn" onClick={onSubmit}>
            {isEdit ? "Simpan Perubahan" : "Tambah Proyek"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function AdminProject() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const selected =
    projects.find((project) => project.id === selectedId) || null;

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchFilter = filter === "all" || p.status === filter;
      const keyword = search.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(keyword) ||
        p.client.toLowerCase().includes(keyword) ||
        p.location.toLowerCase().includes(keyword);
      return matchFilter && matchSearch;
    });
  }, [projects, filter, search]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "progress").length;
    const done = projects.filter((p) => p.status === "done").length;
    const avgProgress = total
      ? Math.round(
          projects.reduce((acc, item) => acc + item.progress, 0) / total,
        )
      : 0;

    return { total, active, done, avgProgress };
  }, [projects]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingId(project.id);
    setForm({
      name: project.name,
      client: project.client,
      status: project.status,
      progress: project.progress,
      cover: project.cover,
      location: project.location,
      deadline: project.deadline,
      budget: project.budget,
      overview: project.overview,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSaveProject = () => {
    if (
      !form.name.trim() ||
      !form.client.trim() ||
      !form.location.trim() ||
      !form.deadline ||
      !form.cover.trim()
    ) {
      alert("Nama proyek, klien, lokasi, deadline, dan cover wajib diisi.");
      return;
    }

    const normalizedProject = {
      name: form.name,
      client: form.client,
      status: form.status,
      progress: Number(form.progress) || 0,
      cover: form.cover,
      location: form.location,
      deadline: form.deadline,
      budget: form.budget,
      overview: form.overview,
    };

    if (editingId) {
      setProjects((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...normalizedProject } : item,
        ),
      );

      if (selectedId === editingId) {
        setSelectedId(editingId);
      }
    } else {
      const newProject = {
        id: Date.now(),
        ...normalizedProject,
        timeline: [
          {
            id: Date.now() + 1,
            date: new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            label: "Proyek baru dibuat",
            done: true,
          },
        ],
        tasks: [],
        progressFeed: [],
      };

      setProjects((prev) => [newProject, ...prev]);
    }

    closeModal();
  };

  const handleDeleteProject = (projectId) => {
    const confirmed = window.confirm("Yakin ingin menghapus proyek ini?");
    if (!confirmed) return;

    setProjects((prev) => prev.filter((item) => item.id !== projectId));

    if (selectedId === projectId) {
      setSelectedId(null);
    }
  };

  const handleAddProgress = (projectId, progressItem) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              progressFeed: [
                { id: Date.now(), ...progressItem },
                ...project.progressFeed,
              ],
            }
          : project,
      ),
    );
  };

  const handleDeleteProgress = (projectId, progressId) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              progressFeed: project.progressFeed.filter(
                (item) => item.id !== progressId,
              ),
            }
          : project,
      ),
    );
  };

  const handleUpdateProjectProgress = (projectId, value) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              progress: value,
              status: value >= 100 ? "done" : "progress",
            }
          : project,
      ),
    );
  };

  const handleToggleTask = (projectId, taskId) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.map((task) =>
                task.id === taskId ? { ...task, done: !task.done } : task,
              ),
            }
          : project,
      ),
    );
  };

  const handleAddTask = (projectId, label) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: [
                ...project.tasks,
                {
                  id: Date.now(),
                  label,
                  done: false,
                },
              ],
            }
          : project,
      ),
    );
  };

  const handleDeleteTask = (projectId, taskId) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.filter((task) => task.id !== taskId),
            }
          : project,
      ),
    );
  };

  if (selected) {
    return (
      <ProjectDetail
        project={selected}
        onBack={() => setSelectedId(null)}
        onAddProgress={handleAddProgress}
        onDeleteProgress={handleDeleteProgress}
        onUpdateProjectProgress={handleUpdateProjectProgress}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
      />
    );
  }

  return (
    <div className="admin-project">
      <div className="page-shell">
        <div className="page-header">
          <div>
            <span className="eyebrow">Project Monitoring</span>
            <h1 className="page-title">Daftar Proyek Interior</h1>
            <p className="page-sub">
              Kelola proyek, progress lapangan, dan checklist pekerjaan dalam
              satu halaman.
            </p>
          </div>

          <button className="new-project-btn" onClick={openCreateModal}>
            <FiPlus size={16} /> Proyek Baru
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Proyek</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Sedang Berjalan</span>
            <strong>{stats.active}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Selesai</span>
            <strong>{stats.done}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Rata-rata Progress</span>
            <strong>{stats.avgProgress}%</strong>
          </div>
        </div>

        <div className="toolbar-card">
          <div className="search-box">
            <FiSearch size={16} />
            <input
              type="text"
              placeholder="Cari nama proyek, klien, atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-bar">
            {["all", "progress", "done"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "Semua"
                  : f === "progress"
                    ? "Berjalan"
                    : "Selesai"}
              </button>
            ))}
            <span className="filter-count">{filtered.length} proyek</span>
          </div>
        </div>

        <div className="project-grid">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={(item) => setSelectedId(item.id)}
              onEdit={openEditModal}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      </div>

      {isModalOpen && (
        <ProjectModal
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSaveProject}
          isEdit={Boolean(editingId)}
        />
      )}
    </div>
  );
}
