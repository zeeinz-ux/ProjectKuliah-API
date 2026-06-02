import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiDownload,
  FiEye,
  FiFile,
  FiFileText,
  FiGrid,
  FiHardDrive,
  FiList,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import "../css/FieldFileUpload.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3333"
).replace(/\/$/, "");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024;

const FILTER_TABS = [
  { key: "all", label: "Semua File" },
  { key: "blueprint", label: "Blueprint PDF" },
  { key: "excel", label: "File Excel" },
  { key: "invoice", label: "Invoice & Kwitansi" },
];

const CATEGORY_META = {
  blueprint: { label: "Blueprint PDF", badgeClass: "is-blueprint" },
  excel: { label: "File Excel", badgeClass: "is-excel" },
  invoice: { label: "Invoice & Kwitansi", badgeClass: "is-invoice" },
  other: { label: "Dokumen Lain", badgeClass: "is-other" },
};

const DEFAULT_PROJECTS = [{ id: "all", name: "Semua Proyek" }];

function getToken() {
  return localStorage.getItem("token") || "";
}

function getHeaders(isJson = false) {
  const token = getToken();

  return {
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatStorage(bytes = 0) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileExtension(fileName = "") {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function isPdfFile(file) {
  const ext = getFileExtension(file?.name || "");
  return file?.mimeType === "application/pdf" || ext === "pdf";
}

function resolveCategoryKey(rawCategory = "", fileName = "", mimeType = "") {
  const source =
    `${rawCategory || ""} ${fileName || ""} ${mimeType || ""}`.toLowerCase();

  const ext = getFileExtension(fileName);

  if (
    source.includes("invoice") ||
    source.includes("kwitansi") ||
    source.includes("receipt") ||
    source.includes("payment") ||
    source.includes("tagihan") ||
    source.includes("pembayaran")
  ) {
    return "invoice";
  }

  if (
    source.includes("excel") ||
    source.includes("xlsx") ||
    source.includes("spreadsheet") ||
    ext === "xlsx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "excel";
  }

  if (
    source.includes("blueprint") ||
    source.includes("layout") ||
    source.includes("elevation") ||
    source.includes("drawing") ||
    source.includes("cad") ||
    mimeType === "application/pdf" ||
    ext === "pdf"
  ) {
    return "blueprint";
  }

  return "other";
}

function normalizeFiles(payload) {
  const rawFiles = Array.isArray(payload)
    ? payload
    : payload?.files || payload?.data || [];

  return rawFiles.map((item, index) => {
    const name =
      item.fileName ||
      item.originalName ||
      item.filename ||
      item.name ||
      `File ${index + 1}`;

    const mimeType = item.fileType || item.mimeType || item.type || "";
    const categoryKey = resolveCategoryKey(item.category, name, mimeType);

    return {
      id: item.id || item.fileId || `${name}-${index}`,
      name,
      path: item.filePath || item.path || item.fileUrl || item.url || "",
      size: Number(item.fileSize || item.size || 0),
      mimeType,
      uploadedAt: item.uploadedAt || item.createdAt || item.updatedAt || "",
      projectName:
        item.projectName || item.project?.name || item.project_title || "-",
      categoryKey,
    };
  });
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

function isAllowedFile(file) {
  const mimeType = file.type?.toLowerCase() || "";
  const ext = getFileExtension(file.name);

  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const allowedExtensions = ["pdf", "xlsx"];

  return allowedMimeTypes.includes(mimeType) || allowedExtensions.includes(ext);
}

function FileTypeIcon({ fileName, mimeType }) {
  const ext = getFileExtension(fileName);

  if (mimeType === "application/pdf" || ext === "pdf") {
    return (
      <div className="field-files-row-icon is-pdf">
        <FiFileText />
      </div>
    );
  }

  if (
    ext === "xlsx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return (
      <div className="field-files-row-icon is-excel">
        <FiFile />
      </div>
    );
  }

  return (
    <div className="field-files-row-icon is-generic">
      <FiFile />
    </div>
  );
}

function CategoryBadge({ categoryKey }) {
  const meta = CATEGORY_META[categoryKey] || CATEGORY_META.other;

  return (
    <span className={`field-files-badge ${meta.badgeClass}`}>{meta.label}</span>
  );
}

function ActionIconButton({
  icon,
  label,
  onClick,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`field-files-icon-btn ${danger ? "is-danger" : ""}`}
    >
      {icon}
    </button>
  );
}

export default function FieldFileUpload() {
  const inputRef = useRef(null);
  const createdPdfUrlsRef = useRef(new Set());

  const [files, setFiles] = useState([]);
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState("all");
  const [filterProjectId, setFilterProjectId] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/options`, {
        headers: getHeaders(),
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

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (filterProjectId !== "all") {
        params.set("projectId", filterProjectId);
      }

      const url = `${API_BASE_URL}/api/files${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url, {
        headers: getHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Endpoint GET /api/files belum ada di backend AdonisJS kamu.",
          );
        }

        throw new Error(result.message || "Gagal mengambil data file.");
      }

      setFiles(normalizeFiles(result));
    } catch (err) {
      setFiles([]);
      setError(err.message || "Terjadi kesalahan saat mengambil data file.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [filterProjectId]);

  useEffect(() => {
    if (!deleteTarget) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeDeleteModal();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [deleteTarget, deleteLoading]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";

      createdPdfUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });

      createdPdfUrlsRef.current.clear();
    };
  }, []);

  const totalStorageUsed = useMemo(() => {
    return files.reduce((total, file) => total + (Number(file.size) || 0), 0);
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchTab =
        activeTab === "all" ? true : file.categoryKey === activeTab;

      const keyword = search.trim().toLowerCase();

      const matchSearch =
        !keyword ||
        file.name.toLowerCase().includes(keyword) ||
        file.projectName.toLowerCase().includes(keyword);

      return matchTab && matchSearch;
    });
  }, [files, activeTab, search]);

  const selectedRows = useMemo(() => {
    return files.filter((file) => selectedIds.includes(file.id));
  }, [files, selectedIds]);

  const allVisibleSelected =
    filteredFiles.length > 0 &&
    filteredFiles.every((file) => selectedIds.includes(file.id));

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleIncomingFiles = (incomingList) => {
    const incomingFiles = Array.from(incomingList || []);
    if (!incomingFiles.length) return;

    const validFiles = [];
    const invalidMessages = [];

    incomingFiles.forEach((file) => {
      if (!isAllowedFile(file)) {
        invalidMessages.push(`${file.name} harus berformat PDF atau XLSX.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        invalidMessages.push(`${file.name} melebihi batas 5MB.`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidMessages.length > 0) {
      setError(invalidMessages[0]);
    } else {
      setError("");
    }

    if (validFiles.length > 0) {
      setSelectedUploadFiles((prev) => {
        const next = [...prev];

        validFiles.forEach((file) => {
          const exists = next.some(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified,
          );

          if (!exists) next.push(file);
        });

        return next;
      });

      setSuccess("");
    }
  };

  const handleInputChange = (event) => {
    handleIncomingFiles(event.target.files);
    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    handleIncomingFiles(event.dataTransfer.files);
  };

  const removeSelectedUploadFile = (fileToRemove) => {
    setSelectedUploadFiles((prev) =>
      prev.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          ),
      ),
    );
  };

  const handleUpload = async () => {
    if (!selectedUploadFiles.length) {
      setError("Silakan pilih file terlebih dahulu.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      setSuccess("");

      for (const file of selectedUploadFiles) {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("fileSize", String(file.size));
        formData.append("fileType", file.type);
        formData.append(
          "category",
          CATEGORY_META[resolveCategoryKey("", file.name, file.type)]?.label ||
            "Dokumen Lain",
        );

        if (uploadProjectId !== "all") {
          formData.append("projectId", uploadProjectId);
        }

        const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
          method: "POST",
          headers: {
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
          body: formData,
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              "Endpoint POST /api/files/upload belum ada di backend AdonisJS kamu.",
            );
          }

          throw new Error(
            result.message ||
              (typeof result.error === "string" ? result.error : "") ||
              `Gagal upload file ${file.name}.`,
          );
        }
      }

      setSuccess("File berhasil diupload ke server dan metadata tersimpan.");
      setSelectedUploadFiles([]);
      setUploadProjectId("all");
      fetchFiles();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = (file) => {
    if (!isPdfFile(file)) {
      setError(
        "Preview hanya tersedia untuk file PDF. Gunakan tombol Download untuk file Excel.",
      );
      return;
    }

    if (!file.id) {
      setError("ID file tidak ditemukan.");
      return;
    }

    const viewer = window.open("", "_blank");

    if (!viewer) {
      setError("Browser memblokir tab baru.");
      return;
    }

    viewer.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${file.name}</title>

        <style>
          html,
          body {
            margin: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #111827;
          }

          iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: white;
          }
        </style>
      </head>

      <body>
        <iframe
          src="${API_BASE_URL}/api/files/${file.id}/open">
        </iframe>
      </body>
    </html>
  `);

    viewer.document.close();
  };

  const handleDownload = (file) => {
    if (!file.path) return;

    const downloadUrl = `${API_BASE_URL}/api/files/${file.id}/download`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSelected = () => {
    selectedRows.forEach((file) => handleDownload(file));
  };

  const openDeleteModal = (file) => {
    setDeleteTarget(file);
    setDeleteError("");
    setError("");
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;

    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/files/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Endpoint DELETE /api/files/:id belum ada di backend AdonisJS kamu.",
          );
        }

        throw new Error(result.message || "Gagal menghapus file.");
      }

      setSuccess("File berhasil dihapus.");
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
      await fetchFiles();
    } catch (err) {
      setDeleteError(err.message || "Terjadi kesalahan saat menghapus file.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleRowSelection = (fileId) => {
    setSelectedIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredFiles.some((file) => file.id === id)),
      );
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredFiles.forEach((file) => next.add(file.id));
      return Array.from(next);
    });
  };

  return (
    <div className="field-files-page">
      <div className="field-files-shell">
        <section className="field-files-card">
          <div className="field-files-header">
            <div className="field-files-header-main">
              <span className="field-files-eyebrow">Pusat File Proyek</span>

              <h1 className="field-files-title">Upload Dokumen Proyek</h1>

              <p className="field-files-description">
                Halaman ini khusus untuk dokumen proyek seperti blueprint PDF,
                file Excel, invoice, dan kwitansi.
              </p>
            </div>

            <div className="field-files-storage">
              <div className="field-files-storage-label">
                <FiHardDrive />
                <span>Storage Used</span>
              </div>

              <p className="field-files-storage-value">
                {formatStorage(totalStorageUsed)} of{" "}
                {formatStorage(STORAGE_LIMIT_BYTES)}
              </p>

              <p className="field-files-storage-note">
                Total file tersimpan: {files.length}
              </p>
            </div>
          </div>

          <div className="field-files-body">
            <div
              className={`field-files-dropzone ${
                isDragActive ? "is-drag-active" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.xlsx"
                multiple
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="field-files-drop-icon">
                <FiUploadCloud />
              </div>

              <h2 className="field-files-drop-title">
                Pilih atau drop file di sini
              </h2>

              <p className="field-files-drop-note">
                Format: PDF, XLSX • Maksimal 5MB
              </p>

              <button
                type="button"
                onClick={handleBrowseClick}
                className="field-files-primary-btn"
              >
                Select Files
              </button>
            </div>

            {selectedUploadFiles.length > 0 && (
              <div className="field-files-upload-panel">
                <div className="field-files-upload-head">
                  <div>
                    <h3 className="field-files-upload-title">
                      File terpilih ({selectedUploadFiles.length})
                    </h3>

                    <p className="field-files-upload-subtitle">
                      File fisik disimpan di server, metadata disimpan di
                      PostgreSQL.
                    </p>
                  </div>

                  <div className="field-files-upload-actions">
                    <select
                      value={uploadProjectId}
                      onChange={(event) =>
                        setUploadProjectId(event.target.value)
                      }
                      className="field-files-select"
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="field-files-primary-btn"
                    >
                      {isUploading ? "Uploading..." : "Upload ke Server"}
                    </button>
                  </div>
                </div>

                <div className="field-files-chip-list">
                  {selectedUploadFiles.map((file) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="field-files-chip"
                    >
                      <span className="field-files-chip-text">
                        {file.name} • {formatBytes(file.size)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeSelectedUploadFile(file)}
                        className="field-files-chip-close"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="field-files-message is-error">{error}</div>
            )}

            {success && (
              <div className="field-files-message is-success">{success}</div>
            )}
          </div>
        </section>

        <section className="field-files-toolbar">
          <div className="field-files-tabs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`field-files-tab ${
                  activeTab === tab.key ? "is-active" : ""
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="field-files-tools">
            <div className="field-files-search">
              <FiSearch />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama file..."
              />
            </div>

            <select
              value={filterProjectId}
              onChange={(event) => setFilterProjectId(event.target.value)}
              className="field-files-select"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <div className="field-files-view-toggle">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`field-files-view-btn ${
                  viewMode === "list" ? "is-active" : ""
                }`}
                title="List view"
              >
                <FiList />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`field-files-view-btn ${
                  viewMode === "grid" ? "is-active" : ""
                }`}
                title="Grid view"
              >
                <FiGrid />
              </button>
            </div>
          </div>
        </section>

        <section className="field-files-table-card">
          <div className="field-files-table-head">
            <div>
              <h2 className="field-files-table-title">Recent Activity</h2>

              <p className="field-files-table-meta">
                Menampilkan dokumen proyek yang diupload tim lapangan.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadSelected}
              disabled={selectedRows.length === 0}
              className="field-files-secondary-btn"
            >
              <FiDownload />
              Download All Selected
            </button>
          </div>

          {loading ? (
            <div className="field-files-empty">Memuat data file...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="field-files-empty">
              Belum ada file yang cocok dengan filter saat ini.
            </div>
          ) : viewMode === "list" ? (
            <div className="field-files-table-wrapper">
              <table className="field-files-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                      />
                    </th>
                    <th>Nama File</th>
                    <th>Kategori</th>
                    <th>Ukuran</th>
                    <th>Tanggal Upload</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(file.id)}
                          onChange={() => toggleRowSelection(file.id)}
                        />
                      </td>

                      <td>
                        <div className="field-files-row-name">
                          <FileTypeIcon
                            fileName={file.name}
                            mimeType={file.mimeType}
                          />

                          <div>
                            <p className="field-files-row-title">{file.name}</p>

                            <p className="field-files-row-subtitle">
                              Project: {file.projectName || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <CategoryBadge categoryKey={file.categoryKey} />
                      </td>

                      <td>{formatBytes(file.size)}</td>

                      <td>{formatDate(file.uploadedAt)}</td>

                      <td>
                        <div className="field-files-actions">
                          {isPdfFile(file) && (
                            <ActionIconButton
                              icon={<FiEye />}
                              label="Lihat file"
                              onClick={() => handleView(file)}
                              disabled={!file.path}
                            />
                          )}

                          <ActionIconButton
                            icon={<FiDownload />}
                            label="Download file"
                            onClick={() => handleDownload(file)}
                            disabled={!file.path}
                          />

                          <ActionIconButton
                            icon={<FiTrash2 />}
                            label="Hapus file"
                            onClick={() => openDeleteModal(file)}
                            danger
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="field-files-grid">
              {filteredFiles.map((file) => (
                <div key={file.id} className="field-files-grid-card">
                  <div className="field-files-grid-top">
                    <div className="field-files-row-name">
                      <FileTypeIcon
                        fileName={file.name}
                        mimeType={file.mimeType}
                      />

                      <div>
                        <p className="field-files-row-title">{file.name}</p>

                        <p className="field-files-row-subtitle">
                          {file.projectName || "-"}
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={selectedIds.includes(file.id)}
                      onChange={() => toggleRowSelection(file.id)}
                    />
                  </div>

                  <div className="field-files-grid-meta">
                    <CategoryBadge categoryKey={file.categoryKey} />
                    <span>{formatBytes(file.size)}</span>
                  </div>

                  <p className="field-files-row-subtitle">
                    Uploaded: {formatDate(file.uploadedAt)}
                  </p>

                  <div className="field-files-actions">
                    {isPdfFile(file) && (
                      <ActionIconButton
                        icon={<FiEye />}
                        label="Lihat file"
                        onClick={() => handleView(file)}
                        disabled={!file.path}
                      />
                    )}

                    <ActionIconButton
                      icon={<FiDownload />}
                      label="Download file"
                      onClick={() => handleDownload(file)}
                      disabled={!file.path}
                    />

                    <ActionIconButton
                      icon={<FiTrash2 />}
                      label="Hapus file"
                      onClick={() => openDeleteModal(file)}
                      danger
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {deleteTarget && (
        <div
          className="field-files-modal-backdrop"
          onClick={closeDeleteModal}
          role="presentation"
        >
          <div
            className="field-files-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-file-title"
          >
            <button
              type="button"
              className="field-files-modal-close"
              onClick={closeDeleteModal}
              disabled={deleteLoading}
              aria-label="Tutup modal"
            >
              ×
            </button>

            <h3 id="delete-file-title" className="field-files-modal-title">
              Delete File
            </h3>

            <p className="field-files-modal-text">
              Are you sure you want to delete this file?
            </p>

            <p className="field-files-modal-file-name">{deleteTarget.name}</p>

            {deleteError && (
              <div className="field-files-modal-error">{deleteError}</div>
            )}

            <div className="field-files-modal-actions">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="field-files-modal-cancel"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="field-files-modal-delete"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
