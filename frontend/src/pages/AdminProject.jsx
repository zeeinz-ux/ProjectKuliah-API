import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
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
  FiCheck,
  FiHome,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiLoader,
  FiAlertCircle,
  FiImage,
  FiPackage,
} from "react-icons/fi";
import AccessControl from "../components/AccessControl";
import "../css/AdminProject.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3333";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

const EMPTY_FORM = {
  name: "",
  clientId: "",
  status: "progress",
  progress: 0,
  cover: "",
  location: "",
  deadline: "",
  startDate: "",
  team: "",
  budget: "",
  overview: "",
  materials: [],
};

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeCurrencyInput(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCurrencyInput(value) {
  const numericValue = normalizeCurrencyInput(value);

  if (!numericValue) return "";

  return new Intl.NumberFormat("id-ID").format(Number(numericValue));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizeMaterial(item) {
  return {
    id: item.id,
    name: item.name || "",
    description: item.description || "",
    category: item.category || "",
    sku: item.sku || "",
    stock: Number(item.stock || 0),
    unit: item.unit || "pcs",
    price: Number(item.price || 0),
  };
}

function normalizeProjectMaterial(item) {
  const material = item.material || {};
  const materialId = Number(
    item.materialId || item.material_id || material.id || 0,
  );

  const rawQuantity = item.quantity ?? 1;
  const quantity = rawQuantity === "" ? "" : Number(rawQuantity || 1);
  const price = Number(item.price ?? material.price ?? 0);
  const numericQuantity = Number(quantity || 0);

  return {
    id: item.id,
    materialId,
    quantity,
    price,
    subtotal: Number(item.subtotal || price * numericQuantity),
    name: material.name || item.name || "",
    category: material.category || item.category || "",
    sku: material.sku || item.sku || "",
    stock: Number(material.stock ?? item.stock ?? 0),
    unit: material.unit || item.unit || "pcs",
  };
}

function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDeadline(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function calculateTaskProgress(tasks = []) {
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;

  const doneTasks = tasks.filter((task) => task.done).length;
  return Math.round((doneTasks / tasks.length) * 100);
}

function formatTaskDateTime(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) return "-";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${month}-${day}-${year} ${hour}:${minute}`;
}

function getTimeValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getTaskCompletionDate(task) {
  return (
    task.completedAt ||
    task.completed_at ||
    task.doneAt ||
    task.done_at ||
    task.updatedAt ||
    task.updated_at ||
    task.createdAt ||
    task.created_at ||
    task.date ||
    new Date().toISOString()
  );
}

function buildTaskTimeline(tasks = []) {
  if (!Array.isArray(tasks)) return [];

  return tasks
    .filter((task) => task.done)
    .sort((a, b) => {
      const dateA = getTimeValue(getTaskCompletionDate(a));
      const dateB = getTimeValue(getTaskCompletionDate(b));

      return dateB - dateA;
    })
    .map((task) => ({
      id: task.id,
      done: true,
      date: formatTaskDateTime(getTaskCompletionDate(task)),
      label: task.label || "Tugas selesai",
    }));
}

function getProjectProgress(project) {
  return calculateTaskProgress(project.tasks || []);
}

function getProjectStatus(project) {
  const taskProgress = getProjectProgress(project);

  if (Array.isArray(project.tasks) && project.tasks.length > 0) {
    return taskProgress >= 100 ? "done" : "progress";
  }

  return project.status || "progress";
}

function getProgressImageUrl(imageData) {
  if (!imageData) return "";

  let imagePath = imageData;

  if (typeof imageData === "object") {
    imagePath =
      imageData.url ||
      imageData.path ||
      imageData.filePath ||
      imageData.file_path ||
      imageData.imagePath ||
      imageData.image_path ||
      imageData.filename ||
      imageData.fileName ||
      imageData.name ||
      "";
  }

  if (!imagePath) return "";

  const cleanPath = String(imagePath).replace(/^\/+/, "");

  if (cleanPath.startsWith("http")) {
    return cleanPath;
  }

  if (cleanPath.startsWith("uploads/")) {
    return `${API_BASE_URL}/${cleanPath}`;
  }

  return `${API_BASE_URL}/uploads/progress/${cleanPath}`;
}

function getProjectCover(project) {
  const latestProgressPhoto = project.progressFeed?.find((item) => {
    const imagePath =
      item.img ||
      item.image ||
      item.photo ||
      item.file ||
      item.filePath ||
      item.file_path ||
      item.imagePath ||
      item.image_path ||
      item.filename ||
      item.fileName ||
      "";

    return Boolean(getProgressImageUrl(imagePath));
  });

  if (latestProgressPhoto) {
    const imagePath =
      latestProgressPhoto.img ||
      latestProgressPhoto.image ||
      latestProgressPhoto.photo ||
      latestProgressPhoto.file ||
      latestProgressPhoto.filePath ||
      latestProgressPhoto.file_path ||
      latestProgressPhoto.imagePath ||
      latestProgressPhoto.image_path ||
      latestProgressPhoto.filename ||
      latestProgressPhoto.fileName ||
      "";

    return getProgressImageUrl(imagePath);
  }

  return project.cover || DEFAULT_COVER;
}

function normalizeProject(project) {
  const rawProjectMaterials =
    project.materials ||
    project.projectMaterials ||
    project.project_materials ||
    [];

  const normalizedProjectMaterials = Array.isArray(rawProjectMaterials)
    ? rawProjectMaterials.map(normalizeProjectMaterial)
    : [];

  return {
    id: project.id,
    clientId: project.clientId || project.client_id || "",
    client:
      project.client?.name ||
      project.clientName ||
      project.client_name ||
      project.client ||
      "-",
    name: project.name || "",
    status: project.status || "progress",
    progress: Number(project.progress || 0),
    cover: project.cover || DEFAULT_COVER,
    location: project.location || "-",
    deadline: project.deadline || null,
    budget: Number(project.budget || 0),
    overview: project.overview || "Belum ada deskripsi proyek.",
    timeline: project.timeline || [],
    materials: normalizedProjectMaterials,
    projectMaterials: normalizedProjectMaterials,

    tasks: Array.isArray(project.tasks)
      ? project.tasks.map((task) => {
          const createdAt =
            task.createdAt ||
            task.created_at ||
            task.date ||
            new Date().toISOString();

          const updatedAt = task.updatedAt || task.updated_at || null;

          const completedAt =
            task.completedAt ||
            task.completed_at ||
            task.doneAt ||
            task.done_at ||
            updatedAt ||
            createdAt;

          return {
            ...task,
            createdAt,
            updatedAt,
            completedAt: task.done ? completedAt : null,
          };
        })
      : [],

    progressFeed: Array.isArray(project.progressFeed || project.progress_feed)
      ? (project.progressFeed || project.progress_feed).map((item) => ({
          ...item,
          img:
            item.img ||
            item.image ||
            item.photo ||
            item.file ||
            item.filePath ||
            item.file_path ||
            item.imagePath ||
            item.image_path ||
            item.filename ||
            item.fileName ||
            "",
          date:
            item.date ||
            formatTaskDateTime(item.createdAt || item.created_at || new Date()),
        }))
      : [],
  };
}

function CircularProgress({ value, size = 58 }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (safeValue / 100) * circ;

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
        {safeValue}%
      </text>
    </svg>
  );
}

function ProjectCard({ project, onClick, onEdit, onDelete }) {
  const projectStatus = getProjectStatus(project);
  const projectProgress = getProjectProgress(project);

  return (
    <div className="project-card">
      <div className="card-cover" onClick={() => onClick(project)}>
        <img
          src={getProjectCover(project)}
          alt={project.name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = DEFAULT_COVER;
          }}
        />

        <span className={`badge badge-${projectStatus}`}>
          {projectStatus === "done" ? "Selesai" : "Berjalan"}
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
            <CircularProgress value={projectProgress} />
          </div>

          <div className="card-actions">
            <AccessControl action="write" resource="projects">
              <button
                type="button"
                className="icon-btn"
                onClick={() => onEdit(project)}
                title="Ubah proyek"
              >
                <FiEdit2 size={15} />
              </button>
            </AccessControl>

            <AccessControl action="delete" resource="projects">
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => onDelete(project)}
                title="Hapus proyek"
              >
                <FiTrash2 size={15} />
              </button>
            </AccessControl>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabOverview({ project }) {
  const [overviewLightboxImage, setOverviewLightboxImage] = useState(null);

  const tasks = Array.isArray(project.tasks) ? project.tasks : [];
  const taskProgress = calculateTaskProgress(tasks);
  const doneTasks = tasks.filter((task) => task.done).length;
  const totalTasks = tasks.length;
  const dynamicTimeline = buildTaskTimeline(tasks);

  const progressPhotos = [...(project.progressFeed || [])]
    .map((item) => {
      const imagePath =
        item.img ||
        item.image ||
        item.photo ||
        item.file ||
        item.filePath ||
        item.file_path ||
        item.imagePath ||
        item.image_path ||
        item.filename ||
        item.fileName ||
        "";

      return {
        ...item,
        imageUrl: getProgressImageUrl(imagePath),
        displayDate:
          item.date ||
          formatTaskDateTime(item.createdAt || item.created_at || new Date()),
        sortDate:
          item.createdAt ||
          item.created_at ||
          item.updatedAt ||
          item.updated_at ||
          new Date().toISOString(),
      };
    })
    .filter((item) => item.imageUrl)
    .sort((a, b) => getTimeValue(b.sortDate) - getTimeValue(a.sortDate));

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
                <span className="meta-label">Anggaran</span>
                <span className="meta-value">
                  {formatCurrency(project.budget)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="section-label no-margin">Timeline Pengerjaan</h4>

            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
              {taskProgress}%
            </span>
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
              <span>
                {doneTasks}/{totalTasks} Tugas selesai
              </span>

              <span>Otomatis dari checklist pekerjaan</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>

          {dynamicTimeline.length === 0 ? (
            <p className="empty-state">
              Belum ada tugas yang selesai. Checklist pekerjaan di tab Tugas
              untuk menampilkan timeline.
            </p>
          ) : (
            <ul className="timeline-list">
              {dynamicTimeline.map((item) => (
                <li key={item.id} className="timeline-item done">
                  <div className="tl-dot !border-emerald-600 !bg-emerald-600 !text-white">
                    <FiCheck size={10} />
                  </div>

                  <div className="tl-body">
                    <span className="tl-date">{item.date}</span>
                    <span className="tl-label">{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="content-card mt-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h4 className="section-label no-margin">Riwayat Foto Progres</h4>

            <p className="mt-2 text-sm font-medium text-slate-400">
              Kumpulan foto terbaru dari pembaruan progres lapangan.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-500">
            {progressPhotos.length} foto
          </span>
        </div>

        {progressPhotos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <FiCamera size={28} className="mx-auto mb-3 text-slate-300" />

            <p className="text-sm font-semibold text-slate-400">
              Belum ada foto progres.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {progressPhotos.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setOverviewLightboxImage({
                    src: item.imageUrl,
                    alt: item.note || "Foto progres",
                  })
                }
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-emerald-100 hover:shadow-md"
                title="Klik untuk melihat foto"
              >
                <div className="h-40 overflow-hidden bg-slate-100">
                  <img
                    src={item.imageUrl}
                    alt={item.note || "Foto progres"}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-90"
                  />
                </div>

                <div className="p-4">
                  <h5 className="truncate text-sm font-black text-slate-900">
                    {item.author || "Tim Lapangan"}
                  </h5>

                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <FiClock size={12} />
                    {item.displayDate}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {item.note || "Tidak ada catatan."}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {overviewLightboxImage && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/85 px-4 py-6 backdrop-blur-sm"
          onClick={() => setOverviewLightboxImage(null)}
        >
          <div
            className="relative w-full max-w-[760px] md:max-w-[820px]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOverviewLightboxImage(null)}
              className="absolute right-0 -top-12 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition hover:bg-slate-100"
              title="Tutup"
            >
              <FiX size={20} />
            </button>

            <img
              src={overviewLightboxImage.src}
              alt={overviewLightboxImage.alt}
              className="mx-auto max-h-[68vh] max-w-full rounded-3xl object-contain shadow-2xl"
            />

            <p className="mt-3 text-center text-xs font-semibold text-slate-300">
              Klik area gelap atau tombol X untuk menutup foto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TabProgress({ project, onAddProgress, onDeleteProgress }) {
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState("Tim Lapangan");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fileError, setFileError] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);

  const tasks = Array.isArray(project.tasks) ? project.tasks : [];
  const progressFeed = Array.isArray(project.progressFeed)
    ? project.progressFeed
    : [];
  const taskProgress = calculateTaskProgress(tasks);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setFileError("");
    setImageFile(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview("");

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setFileError("Format foto harus JPG atau PNG.");
      return;
    }

    if (file.size > maxSize) {
      setFileError("Ukuran foto maksimal 5MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview("");
    setFileError("");
  };

  const handleSubmit = () => {
    if (!note.trim()) return;

    onAddProgress(project.id, {
      author,
      note,
      imageFile,
    });

    setNote("");
    setImageFile(null);
    setImagePreview("");
    setFileError("");
  };

  return (
    <div className="tab-content tab-stack">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Progres Keseluruhan
          </span>

          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
            {taskProgress}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
            style={{ width: `${taskProgress}%` }}
          />
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Progres otomatis dihitung dari jumlah tugas yang sudah selesai.
        </p>
      </div>

      <AccessControl action="write" resource="projects">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Tambah Pembaruan Progres
          </h4>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Nama Tim
              </label>

              <input
                type="text"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Contoh: Tim Lapangan A"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Foto Progres
              </label>

              <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100">
                <FiCamera size={17} />
                <span>Pilih Foto JPG / PNG</span>

                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <p className="mt-2 text-xs font-medium text-slate-400">
                Maksimal 5MB. Foto akan disimpan di server lokal.
              </p>
            </div>
          </div>

          {fileError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {fileError}
            </div>
          )}

          {imagePreview && (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <FiImage size={16} className="text-emerald-600" />
                  Pratinjau Foto
                </div>

                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-500 shadow-sm transition hover:bg-red-50"
                >
                  Hapus Foto
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  setLightboxImage({
                    src: imagePreview,
                    alt: "Pratinjau progres",
                  })
                }
                className="group block overflow-hidden rounded-2xl bg-slate-200"
              >
                <img
                  src={imagePreview}
                  alt="Pratinjau progres"
                  className="h-32 w-48 object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-90"
                />
              </button>
            </div>
          )}

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-800">
              Catatan Progres
            </label>

            <textarea
              placeholder="Tuliskan progres hari ini, kendala, atau catatan penting..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <FiPlus size={16} />
              Tambah Pembaruan
            </button>
          </div>
        </div>
      </AccessControl>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Riwayat Progres
        </h4>

        {progressFeed.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <FiCamera size={28} className="mx-auto mb-3 text-slate-300" />

            <p className="text-sm font-semibold text-slate-400">
              Belum ada pembaruan progres.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {progressFeed.map((item) => {
              const imagePath =
                item.img ||
                item.image ||
                item.photo ||
                item.file ||
                item.filePath ||
                item.file_path ||
                item.imagePath ||
                item.image_path ||
                item.filename ||
                item.fileName ||
                "";

              const imageUrl = getProgressImageUrl(imagePath);

              return (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="group relative rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-100 hover:shadow-md">
                    <AccessControl action="delete" resource="projects">
                      <button
                        type="button"
                        onClick={() => onDeleteProgress(project.id, item.id)}
                        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100"
                        title="Hapus pembaruan progres"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </AccessControl>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                      {imageUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxImage({
                              src: imageUrl,
                              alt: "Foto progres",
                            })
                          }
                          className="group/thumb h-36 w-full flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 md:h-36 md:w-48"
                          title="Klik untuk memperbesar foto"
                        >
                          <img
                            src={imageUrl}
                            alt="Foto progres"
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover/thumb:scale-105 group-hover/thumb:opacity-90"
                          />
                        </button>
                      ) : (
                        <div className="flex h-36 w-full flex-shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 md:w-48">
                          <div className="text-center">
                            <FiImage
                              size={26}
                              className="mx-auto mb-2 text-slate-300"
                            />

                            <span className="text-xs font-bold text-slate-400">
                              Tanpa Foto
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="min-w-0 flex-1 pr-12">
                        <div className="mb-3">
                          <h5 className="text-base font-black text-slate-900">
                            {item.author || "Tim Lapangan"}
                          </h5>

                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                            <FiClock size={12} />
                            {item.date ||
                              formatTaskDateTime(
                                item.createdAt || item.created_at || new Date(),
                              )}
                          </p>
                        </div>

                        <p className="max-w-4xl text-sm leading-7 text-slate-600">
                          {item.note}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/85 px-4 py-6 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative w-full max-w-[760px] md:max-w-[820px]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute right-0 -top-12 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition hover:bg-slate-100"
              title="Tutup"
            >
              <FiX size={20} />
            </button>

            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="mx-auto max-h-[68vh] max-w-full rounded-3xl object-contain shadow-2xl"
            />

            <p className="mt-3 text-center text-xs font-semibold text-slate-300">
              Klik area gelap atau tombol X untuk menutup foto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TabTask({ project, onToggleTask, onAddTask, onDeleteTask }) {
  const [taskInput, setTaskInput] = useState("");

  const tasks = Array.isArray(project.tasks) ? project.tasks : [];
  const done = tasks.filter((task) => task.done).length;
  const percent = calculateTaskProgress(tasks);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? -1 : 1;
    }

    const dateA = a.done
      ? getTimeValue(getTaskCompletionDate(a))
      : getTimeValue(a.createdAt || a.created_at || 0);

    const dateB = b.done
      ? getTimeValue(getTaskCompletionDate(b))
      : getTimeValue(b.createdAt || b.created_at || 0);

    return dateB - dateA;
  });

  const handleAddTask = () => {
    if (!taskInput.trim()) return;

    onAddTask(project.id, {
      label: taskInput.trim(),
      createdAt: new Date().toISOString(),
    });

    setTaskInput("");
  };

  return (
    <div className="tab-content tab-stack">
      <div className="content-card">
        <div className="task-header">
          <span className="section-label no-margin">Checklist Pekerjaan</span>

          <span className="task-count">
            {done}/{tasks.length} selesai
          </span>
        </div>

        <div className="task-progress-bar">
          <div className="task-prog-fill" style={{ width: `${percent}%` }} />
        </div>

        <AccessControl action="write" resource="projects">
          <div className="inline-form">
            <input
              type="text"
              className="mini-input grow"
              placeholder="Tambah tugas baru..."
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
            />

            <button
              type="button"
              className="secondary-btn"
              onClick={handleAddTask}
            >
              <FiPlus size={14} /> Tambah Tugas
            </button>
          </div>
        </AccessControl>
      </div>

      <div className="content-card">
        {tasks.length === 0 ? (
          <p className="empty-state">Belum ada checklist pekerjaan.</p>
        ) : (
          <ul className="task-list">
            {sortedTasks.map((task) => (
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

                  <div className="task-info">
                    <span className="task-label">{task.label}</span>

                    <span className="task-date">
                      <FiClock size={11} />
                      {task.done
                        ? formatTaskDateTime(getTaskCompletionDate(task))
                        : formatTaskDateTime(task.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="task-right">
                  {task.done && (
                    <span className="task-done-badge">Selesai</span>
                  )}

                  <AccessControl action="delete" resource="projects">
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => onDeleteTask(project.id, task.id)}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </AccessControl>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { key: "overview", label: "Ringkasan", icon: <FiGrid size={14} /> },
  { key: "task", label: "Tugas", icon: <FiCheckCircle size={14} /> },
  { key: "progress", label: "Progres", icon: <FiCamera size={14} /> },
];

function ProjectDetail({
  project,
  onBack,
  onAddProgress,
  onDeleteProgress,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const projectStatus = getProjectStatus(project);

  return (
    <div className="detail-wrapper">
      <button type="button" className="back-btn" onClick={onBack}>
        <FiArrowLeft size={16} /> Semua Proyek
      </button>

      <div className="detail-hero">
        <img
          src={getProjectCover(project)}
          alt={project.name}
          className="detail-cover"
          onError={(event) => {
            event.currentTarget.src = DEFAULT_COVER;
          }}
        />

        <div className="detail-overlay">
          <span className={`badge badge-${projectStatus} badge-lg`}>
            {projectStatus === "done" ? "Selesai" : "Berjalan"}
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
            type="button"
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <TabOverview project={project} />}

      {activeTab === "task" && (
        <TabTask
          project={project}
          onToggleTask={onToggleTask}
          onAddTask={onAddTask}
          onDeleteTask={onDeleteTask}
        />
      )}

      {activeTab === "progress" && (
        <TabProgress
          project={project}
          onAddProgress={onAddProgress}
          onDeleteProgress={onDeleteProgress}
        />
      )}
    </div>
  );
}

function ProjectModal({
  form,
  clients,
  materials,
  materialsLoading,
  setForm,
  onClose,
  onSubmit,
  isEdit,
  submitLoading,
}) {
  const selectedMaterials = Array.isArray(form.materials) ? form.materials : [];

  const totalMaterialCost = selectedMaterials.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0,
  );

  const usedMaterialIds = selectedMaterials.map((item) =>
    Number(item.materialId),
  );

  const availableMaterialCount = materials.filter(
    (material) =>
      !usedMaterialIds.includes(Number(material.id)) &&
      Number(material.stock || 0) > 0,
  ).length;

  const getMaterialById = (id) =>
    materials.find((material) => Number(material.id) === Number(id));

  const handleAddMaterial = () => {
    const firstAvailableMaterial = materials.find(
      (material) =>
        !usedMaterialIds.includes(Number(material.id)) &&
        Number(material.stock || 0) > 0,
    );

    if (!firstAvailableMaterial) return;

    const price = Number(firstAvailableMaterial.price || 0);

    const newItem = {
      materialId: firstAvailableMaterial.id,
      quantity: "",
      price,
      subtotal: 0,
      name: firstAvailableMaterial.name,
      sku: firstAvailableMaterial.sku,
      stock: Number(firstAvailableMaterial.stock || 0),
      unit: firstAvailableMaterial.unit || "pcs",
      category: firstAvailableMaterial.category || "",
    };

    setForm((prev) => ({
      ...prev,
      materials: [...(prev.materials || []), newItem],
    }));
  };

  const handleChangeMaterial = (index, materialId) => {
    if (!materialId) {
      setForm((prev) => {
        const nextMaterials = [...(prev.materials || [])];

        nextMaterials[index] = {
          materialId: "",
          quantity: "",
          price: 0,
          subtotal: 0,
          name: "",
          sku: "",
          stock: 0,
          unit: "pcs",
          category: "",
        };

        return {
          ...prev,
          materials: nextMaterials,
        };
      });

      return;
    }

    const material = getMaterialById(materialId);

    if (!material) return;

    setForm((prev) => {
      const nextMaterials = [...(prev.materials || [])];

      const currentQuantity = nextMaterials[index]?.quantity;
      const maxStock = Number(material.stock || 0);
      const price = Number(material.price || 0);

      const safeQuantity =
        currentQuantity === "" || currentQuantity === undefined
          ? ""
          : Math.min(Number(currentQuantity || 0), maxStock);

      nextMaterials[index] = {
        ...nextMaterials[index],
        materialId: material.id,
        quantity: safeQuantity,
        price,
        subtotal: Number(safeQuantity || 0) * price,
        name: material.name,
        sku: material.sku,
        stock: maxStock,
        unit: material.unit || "pcs",
        category: material.category || "",
      };

      return {
        ...prev,
        materials: nextMaterials,
      };
    });
  };

  const handleChangeQuantity = (index, value) => {
    const digitsOnly = String(value || "").replace(/\D/g, "");

    setForm((prev) => {
      const nextMaterials = [...(prev.materials || [])];
      const currentItem = nextMaterials[index];

      if (!currentItem) return prev;

      const material = getMaterialById(currentItem.materialId);
      const maxStock = Number(material?.stock ?? currentItem.stock ?? 0);
      const price = Number(currentItem.price || material?.price || 0);

      if (digitsOnly === "") {
        nextMaterials[index] = {
          ...currentItem,
          quantity: "",
          price,
          subtotal: 0,
        };

        return {
          ...prev,
          materials: nextMaterials,
        };
      }

      const inputQuantity = Number(digitsOnly);
      const safeQuantity =
        maxStock > 0 ? Math.min(inputQuantity, maxStock) : inputQuantity;

      nextMaterials[index] = {
        ...currentItem,
        quantity: safeQuantity,
        price,
        subtotal: safeQuantity * price,
      };

      return {
        ...prev,
        materials: nextMaterials,
      };
    });
  };

  const handleRemoveMaterial = (index) => {
    setForm((prev) => ({
      ...prev,
      materials: (prev.materials || []).filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  return createPortal(
    <>
      <div className="project-modal-overlay" onClick={onClose} />

      <div className="project-modal">
        <div className="modal-header">
          <div>
            <h3>{isEdit ? "Ubah Proyek" : "Tambah Proyek Baru"}</h3>
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
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Contoh: Interior Cafe Premium"
              />
            </div>

            <div className="form-group">
              <label>Klien</label>
              <select
                value={form.clientId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    clientId: event.target.value,
                  }))
                }
              >
                <option value="">Pilih klien</option>
                {clients
                  .filter((client) => {
                    const status = (client.status || '').toLowerCase();
                    return status !== 'inactive' && status !== 'nonaktif';
                  })
                  .map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value }))
                }
              >
                <option value="progress">Berjalan</option>
                <option value="done">Selesai</option>
              </select>
            </div>

            <div className="form-group">
              <label>Lokasi</label>
              <input
                type="text"
                value={form.location}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    location: event.target.value,
                  }))
                }
                placeholder="Contoh: Bandung"
              />
            </div>

            <div className="form-group">
              <label>Tanggal Mulai</label>
              <input
                type="date"
                min={getTodayDateString()}
                value={form.startDate || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    startDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label>Tim Lapangan</label>
              <input
                type="text"
                value={form.team || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    team: event.target.value,
                  }))
                }
                placeholder="Contoh: Tim Lapangan A"
              />
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                min={getTodayDateString()}
                value={form.deadline || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    deadline: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label>Anggaran</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrencyInput(form.budget)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    budget: normalizeCurrencyInput(event.target.value),
                  }))
                }
                placeholder="Contoh: 150.000.000"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Deskripsi</label>
            <textarea
              rows={4}
              value={form.overview}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, overview: event.target.value }))
              }
              placeholder="Jelaskan proyek ini..."
            />
          </div>

          <div className="project-material-box">
            <div className="project-material-head">
              <div>
                <h4>
                  <FiPackage size={16} />
                  Material Proyek
                </h4>

                <p>
                  Pilih material dari Stok Material untuk kebutuhan proyek ini.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMaterial}
                disabled={
                  materialsLoading ||
                  materials.length === 0 ||
                  availableMaterialCount === 0
                }
                className="project-material-add-btn"
              >
                <FiPlus size={14} />
                Tambah Material
              </button>
            </div>

            {materialsLoading ? (
              <div className="project-material-empty">
                Mengambil data material...
              </div>
            ) : materials.length === 0 ? (
              <div className="project-material-empty">
                Belum ada data material di Stok Material.
              </div>
            ) : selectedMaterials.length === 0 ? (
              <div className="project-material-empty">
                Belum ada material dipilih.
              </div>
            ) : (
              <div className="project-material-list">
                {selectedMaterials.map((item, index) => {
                  const selectedMaterial = getMaterialById(item.materialId);
                  const stock = Number(
                    selectedMaterial?.stock ?? item.stock ?? 0,
                  );
                  const unit = selectedMaterial?.unit || item.unit || "pcs";

                  return (
                    <div
                      key={`${item.materialId || "empty"}-${index}`}
                      className="project-material-row-card"
                    >
                      <div className="project-material-row-grid">
                        <div>
                          <label>Material</label>

                          <select
                            value={item.materialId || ""}
                            onChange={(event) =>
                              handleChangeMaterial(index, event.target.value)
                            }
                          >
                            <option value="">Pilih material</option>

                            {materials.map((material) => {
                              const isUsed = selectedMaterials.some(
                                (selectedItem, selectedIndex) =>
                                  selectedIndex !== index &&
                                  Number(selectedItem.materialId) ===
                                    Number(material.id),
                              );

                              return (
                                <option
                                  key={material.id}
                                  value={material.id}
                                  disabled={
                                    isUsed || Number(material.stock || 0) <= 0
                                  }
                                >
                                  {material.name} · Stok {material.stock}{" "}
                                  {material.unit}
                                </option>
                              );
                            })}
                          </select>

                          <p>
                            {item.sku || selectedMaterial?.sku || "-"} ·{" "}
                            {item.category || selectedMaterial?.category || "-"}
                          </p>
                        </div>

                        <div>
                          <label>Jumlah</label>

                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity ?? ""}
                            onChange={(event) =>
                              handleChangeQuantity(index, event.target.value)
                            }
                            placeholder="0"
                          />

                          <p>
                            Stok: {stock} {unit}
                          </p>
                        </div>

                        <div>
                          <label>Total</label>

                          <div className="project-material-subtotal">
                            {formatCurrency(item.subtotal)}
                          </div>

                          <p>Harga: {formatCurrency(item.price)}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(index)}
                          className="project-material-remove-btn"
                          title="Hapus material"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="project-material-total-card">
                  <div>
                    <p>Total Material</p>
                    <strong>{formatCurrency(totalMaterialCost)}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        budget: String(totalMaterialCost),
                      }))
                    }
                  >
                    Gunakan sebagai Anggaran
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Batal
          </button>

          <AccessControl action="write" resource="projects">
            <button
              type="button"
              className="primary-btn"
              onClick={onSubmit}
              disabled={submitLoading}
            >
              {submitLoading && <FiLoader className="spin-icon" size={16} />}
              {isEdit ? "Simpan Perubahan" : "Tambah Proyek"}
            </button>
          </AccessControl>
        </div>
      </div>
    </>,
    document.body,
  );
}

function AlertPopup({ title, message, onClose }) {
  return createPortal(
    <div
      className="project-confirm-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="project-confirm-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="project-confirm-close"
          onClick={onClose}
          aria-label="Tutup peringatan"
        >
          <FiX size={21} />
        </button>

        <h3>{title}</h3>

        <p>{message}</p>

        <div className="project-confirm-actions">
          <button
            type="button"
            className="project-confirm-danger-btn"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DeleteProjectModal({ project, loading, error, onClose, onConfirm }) {
  if (!project) return null;

  return createPortal(
    <div
      className="project-confirm-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="project-confirm-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
      >
        <button
          type="button"
          className="project-confirm-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Tutup modal"
        >
          <FiX size={21} />
        </button>

        <h3 id="delete-project-title">Hapus Proyek</h3>

        <p>
          Apakah Anda yakin ingin menghapus proyek{" "}
          <strong>{project.name}</strong>?
        </p>

        {error ? <div className="project-confirm-error">{error}</div> : null}

        <div className="project-confirm-actions">
          <button
            type="button"
            className="project-confirm-cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>

          <button
            type="button"
            className="project-confirm-danger-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function AdminProject() {
  const [searchParams] = useSearchParams();
  const idFromUrl = searchParams.get('id');
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const [selectedId, setSelectedId] = useState(idFromUrl ? Number(idFromUrl) : null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [alertBox, setAlertBox] = useState({
    open: false,
    title: "",
    message: "",
  });

  const [deleteProjectTarget, setDeleteProjectTarget] = useState(null);
  const [deleteProjectLoading, setDeleteProjectLoading] = useState(false);
  const [deleteProjectError, setDeleteProjectError] = useState("");

  const selected =
    projects.find((project) => project.id === selectedId) || null;

  const openAlertBox = (title, message) => {
    setAlertBox({
      open: true,
      title,
      message,
    });
  };

  const closeAlertBox = () => {
    setAlertBox({
      open: false,
      title: "",
      message: "",
    });
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data proyek.");
      }

      const data = Array.isArray(result) ? result : result.data || [];
      setProjects(data.map(normalizeProject));
    } catch (error) {
      setErrorMsg(
        error.message || "Terjadi kesalahan saat mengambil data proyek.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data klien.");
      }

      const data = Array.isArray(result) ? result : result.data || [];
      setClients(data);
    } catch (error) {
      setErrorMsg(
        error.message || "Terjadi kesalahan saat mengambil data klien.",
      );
    }
  };

  const fetchMaterials = async () => {
    try {
      setMaterialsLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/materials`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data material.");
      }

      const data = Array.isArray(result)
        ? result
        : result.data || result.materials || [];

      setMaterials(data.map(normalizeMaterial));
    } catch (error) {
      setErrorMsg(
        error?.message || "Terjadi kesalahan saat mengambil data material.",
      );
    } finally {
      setMaterialsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchMaterials();
  }, []);

  useEffect(() => {
    const isOverlayOpen =
      isModalOpen || alertBox.open || Boolean(deleteProjectTarget);

    document.body.style.overflow = isOverlayOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, alertBox.open, deleteProjectTarget]);

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const keyword = search.toLowerCase();

      const matchFilter =
        filter === "all" || getProjectStatus(project) === filter;

      const matchSearch =
        project.name.toLowerCase().includes(keyword) ||
        String(project.client).toLowerCase().includes(keyword) ||
        project.location.toLowerCase().includes(keyword);

      return matchFilter && matchSearch;
    });
  }, [projects, filter, search]);

  const stats = useMemo(() => {
    const total = projects.length;

    const active = projects.filter(
      (project) => getProjectStatus(project) === "progress",
    ).length;

    const done = projects.filter(
      (project) => getProjectStatus(project) === "done",
    ).length;

    const avgProgress = total
      ? Math.round(
          projects.reduce(
            (acc, project) => acc + getProjectProgress(project),
            0,
          ) / total,
        )
      : 0;

    return { total, active, done, avgProgress };
  }, [projects]);

  const openCreateModal = () => {
    setEditingId(null);
    closeAlertBox();
    setForm({
      ...EMPTY_FORM,
      materials: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingId(project.id);
    closeAlertBox();

    setForm({
      name: project.name || "",
      clientId: project.clientId || "",
      status: getProjectStatus(project),
      progress: getProjectProgress(project),
      cover: project.cover || "",
      location: project.location || "",
      deadline: project.deadline || "",
      startDate: project.startDate || project.start_date || "",
      team: project.team || "",
      budget: String(project.budget || ""),
      overview: project.overview || "",
      materials: Array.isArray(project.materials)
        ? project.materials.map(normalizeProjectMaterial)
        : [],
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    closeAlertBox();
    setForm({
      ...EMPTY_FORM,
      materials: [],
    });
  };

  const buildPayload = () => {
    const currentProject = projects.find((project) => project.id === editingId);
    const taskProgress = currentProject
      ? getProjectProgress(currentProject)
      : 0;

    return {
      client_id: Number(form.clientId),
      name: form.name.trim(),
      status:
        currentProject?.tasks?.length > 0 && taskProgress >= 100
          ? "done"
          : form.status,
      progress: taskProgress,
      cover: currentProject?.cover || form.cover || DEFAULT_COVER,
      location: form.location.trim(),
      deadline: form.deadline || null,
      start_date: form.startDate || null,
      team: form.team || null,
      budget: Number(form.budget || 0),
      overview: form.overview.trim(),
      materials: (form.materials || [])
        .filter(
          (item) => Number(item.materialId) > 0 && Number(item.quantity) > 0,
        )
        .map((item) => ({
          materialId: Number(item.materialId),
          quantity: Number(item.quantity),
        })),
    };
  };

  const handleSaveProject = async () => {
    if (
      !form.name.trim() ||
      !form.clientId ||
      !form.location.trim() ||
      !form.deadline
    ) {
      openAlertBox(
        "Form Belum Lengkap",
        "Nama proyek, klien, lokasi, dan deadline wajib diisi.",
      );
      return;
    }

    const invalidMaterial = (form.materials || []).find(
      (item) => Number(item.materialId) > 0 && Number(item.quantity || 0) <= 0,
    );

    if (invalidMaterial) {
      openAlertBox(
        "Qty Material Tidak Valid",
        "Qty material yang dipilih wajib diisi minimal 1.",
      );
      return;
    }

    try {
      setSubmitLoading(true);
      setErrorMsg("");
      closeAlertBox();

      const payload = buildPayload();

      const url = editingId
        ? `${API_BASE_URL}/api/projects/${editingId}`
        : `${API_BASE_URL}/api/projects`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan proyek.");
      }

      await fetchProjects();
      closeModal();
    } catch (error) {
      setErrorMsg(error?.message || "Terjadi kesalahan saat menyimpan proyek.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const closeDeleteProjectModal = () => {
    if (deleteProjectLoading) return;

    setDeleteProjectTarget(null);
    setDeleteProjectError("");
  };

  const handleDeleteProject = (project) => {
    setDeleteProjectTarget(project);
    setDeleteProjectError("");
    setErrorMsg("");
  };

  const handleConfirmDeleteProject = async () => {
    if (!deleteProjectTarget?.id) return;

    try {
      setDeleteProjectLoading(true);
      setDeleteProjectError("");
      setErrorMsg("");

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${deleteProjectTarget.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus proyek.");
      }

      setProjects((prev) =>
        prev.filter((item) => item.id !== deleteProjectTarget.id),
      );

      if (selectedId === deleteProjectTarget.id) {
        setSelectedId(null);
      }

      setDeleteProjectTarget(null);
    } catch (error) {
      setDeleteProjectError(
        error.message || "Terjadi kesalahan saat menghapus proyek.",
      );
    } finally {
      setDeleteProjectLoading(false);
    }
  };

  const handleAddProgress = async (projectId, progressItem) => {
    try {
      setErrorMsg("");

      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("author", progressItem.author || "Tim Lapangan");
      formData.append("note", progressItem.note || "");

      if (progressItem.imageFile) {
        formData.append("image", progressItem.imageFile);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/progress-logs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menambahkan pembaruan progres.",
        );
      }

      const newProgressLog = {
        ...result.data,
        img:
          result.data?.img ||
          result.data?.image ||
          result.data?.photo ||
          result.data?.file ||
          result.data?.filePath ||
          result.data?.file_path ||
          result.data?.imagePath ||
          result.data?.image_path ||
          result.data?.filename ||
          result.data?.fileName ||
          "",
        date:
          result.data?.date ||
          formatTaskDateTime(result.data?.createdAt || result.data?.created_at),
      };

      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? {
                ...project,
                progressFeed: [newProgressLog, ...project.progressFeed],
              }
            : project,
        ),
      );
    } catch (error) {
      setErrorMsg(
        error.message ||
          "Terjadi kesalahan saat menambahkan pembaruan progres.",
      );
    }
  };

  const handleDeleteProgress = async (projectId, progressId) => {
    try {
      setErrorMsg("");

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/progress-logs/${progressId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus pembaruan progres.");
      }

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
    } catch (error) {
      setErrorMsg(
        error.message || "Terjadi kesalahan saat menghapus pembaruan progres.",
      );
    }
  };

  const handleToggleTask = async (projectId, taskId) => {
    const project = projects.find((item) => item.id === projectId);
    const task = project?.tasks.find((item) => item.id === taskId);

    if (!project || !task) return;

    const nextDone = !task.done;
    const toggledAt = new Date().toISOString();

    try {
      setErrorMsg("");

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/tasks/${taskId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            done: nextDone,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui tugas.");
      }

      const responseTask = result.data || {};

      setProjects((prev) =>
        prev.map((projectItem) => {
          if (projectItem.id !== projectId) return projectItem;

          const nextTasks = projectItem.tasks.map((taskItem) => {
            if (taskItem.id !== taskId) return taskItem;

            const finalDone = Boolean(responseTask.done ?? nextDone);

            return {
              ...taskItem,
              ...responseTask,
              done: finalDone,
              updatedAt:
                responseTask.updatedAt || responseTask.updated_at || toggledAt,
              completedAt: finalDone
                ? responseTask.completedAt ||
                  responseTask.completed_at ||
                  responseTask.doneAt ||
                  responseTask.done_at ||
                  responseTask.updatedAt ||
                  responseTask.updated_at ||
                  toggledAt
                : null,
            };
          });

          const nextProgress = calculateTaskProgress(nextTasks);

          return {
            ...projectItem,
            tasks: nextTasks,
            progress: nextProgress,
            status:
              nextProgress >= 100 && nextTasks.length > 0 ? "done" : "progress",
          };
        }),
      );
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan saat memperbarui tugas.");
    }
  };

  const handleAddTask = async (projectId, taskData) => {
    try {
      setErrorMsg("");

      const label =
        typeof taskData === "string" ? taskData : taskData.label || "";

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            label,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menambahkan tugas.");
      }

      const newTask = {
        ...result.data,
        done: Boolean(result.data?.done),
        createdAt:
          result.data?.createdAt ||
          result.data?.created_at ||
          taskData.createdAt ||
          new Date().toISOString(),
        updatedAt: result.data?.updatedAt || result.data?.updated_at || null,
        completedAt: result.data?.done
          ? result.data?.completedAt ||
            result.data?.completed_at ||
            result.data?.doneAt ||
            result.data?.done_at ||
            result.data?.updatedAt ||
            result.data?.updated_at ||
            new Date().toISOString()
          : null,
      };

      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;

          const nextTasks = [...project.tasks, newTask];
          const nextProgress = calculateTaskProgress(nextTasks);

          return {
            ...project,
            tasks: nextTasks,
            progress: nextProgress,
            status:
              nextProgress >= 100 && nextTasks.length > 0 ? "done" : "progress",
          };
        }),
      );
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan saat menambahkan tugas.");
    }
  };

  const handleDeleteTask = async (projectId, taskId) => {
    try {
      setErrorMsg("");

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus tugas.");
      }

      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;

          const nextTasks = project.tasks.filter((task) => task.id !== taskId);
          const nextProgress = calculateTaskProgress(nextTasks);

          return {
            ...project,
            tasks: nextTasks,
            progress: nextProgress,
            status:
              nextProgress >= 100 && nextTasks.length > 0 ? "done" : "progress",
          };
        }),
      );
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan saat menghapus tugas.");
    }
  };

  if (selectedId && loading) {
    return (
      <div className="admin-project">
        <div className="page-shell">
          <div className="loading-state">Memuat proyek...</div>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <ProjectDetail
        project={selected}
        onBack={() => setSelectedId(null)}
        onAddProgress={handleAddProgress}
        onDeleteProgress={handleDeleteProgress}
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
            <span className="eyebrow">Monitoring Proyek</span>

            <h1 className="page-title">Daftar Proyek Interior</h1>

            <p className="page-sub">
              Kelola proyek, progres lapangan, dan checklist pekerjaan dalam
              satu halaman.
            </p>
          </div>

          <AccessControl action="write" resource="projects">
            <button
              type="button"
              className="new-project-btn"
              onClick={openCreateModal}
            >
              <FiPlus size={16} /> Tambah Proyek
            </button>
          </AccessControl>
        </div>

        {errorMsg && (
          <div className="project-alert">
            <FiAlertCircle size={17} />
            <span>{errorMsg}</span>

            <button type="button" onClick={() => setErrorMsg("")}>
              <FiX size={16} />
            </button>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Proyek</span>
            <strong>{stats.total}</strong>
          </div>

          <div className="stat-card">
            <span className="stat-label">Berjalan</span>
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
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="filter-bar">
            {["all", "progress", "done"].map((item) => (
              <button
                key={item}
                type="button"
                className={`filter-btn ${filter === item ? "active" : ""}`}
                onClick={() => setFilter(item)}
              >
                {item === "all"
                  ? "Semua"
                  : item === "progress"
                    ? "Berjalan"
                    : "Selesai"}
              </button>
            ))}

            <span className="filter-count">{filtered.length} proyek</span>
          </div>
        </div>

        {loading ? (
          <div className="project-loading">
            <FiLoader className="spin-icon" size={22} />

            <span>Loading data proyek...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="project-empty-main">
            <FiGrid size={28} />

            <h3>Belum ada proyek</h3>

            <p>Tambahkan proyek baru dan pilih client yang sudah terdaftar.</p>
          </div>
        ) : (
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
        )}
      </div>

      {isModalOpen && (
        <ProjectModal
          form={form}
          clients={clients}
          materials={materials}
          materialsLoading={materialsLoading}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSaveProject}
          isEdit={Boolean(editingId)}
          submitLoading={submitLoading}
        />
      )}

      {alertBox.open && (
        <AlertPopup
          title={alertBox.title}
          message={alertBox.message}
          onClose={closeAlertBox}
        />
      )}

      {deleteProjectTarget && (
        <DeleteProjectModal
          project={deleteProjectTarget}
          loading={deleteProjectLoading}
          error={deleteProjectError}
          onClose={closeDeleteProjectModal}
          onConfirm={handleConfirmDeleteProject}
        />
      )}
    </div>
  );
}
