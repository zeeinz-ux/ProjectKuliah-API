// src/pages/AdminDashboard.jsx

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../css/AdminDashboard.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3333"
).replace(/\/$/, "");

const PROJECT_API_URL = `${API_BASE_URL}/api/projects`;
const MATERIAL_API_URL = `${API_BASE_URL}/api/materials`;
const FILE_API_URL = `${API_BASE_URL}/api/files`;
const ACTIVITY_API_URL = `${API_BASE_URL}/api/activity-logs?limit=6`;
const CRITICAL_PROJECT_API_URL = `${API_BASE_URL}/api/projects/critical`;
const REMIND_DEADLINE_API_URL = `${API_BASE_URL}/api/projects/remind-deadlines`;

const avatarClasses = ["green", "cyan", "blue", "yellow", "purple", "green2"];

const statusConfig = {
  on_track: {
    label: "Berjalan Baik",
    color: "#0f9c4a",
  },
  critical: {
    label: "Mendekati Deadline",
    color: "#f59e0b",
  },
  delayed: {
    label: "Terlambat",
    color: "#ef4444",
  },
  completed: {
    label: "Selesai",
    color: "#a55ac5",
  },
};

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  const text = await response.text();
  let result = null;

  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(result?.message || "Gagal mengambil data dashboard.");
  }

  return result;
}

function normalizeApiCollection(payload, possibleKeys = []) {
  if (Array.isArray(payload)) return payload;

  for (const key of possibleKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;

  return [];
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim();

  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d,.-]/g, "");

  if (!cleaned) return 0;

  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const numberValue = Number(normalized);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(toNumber(value));
}

function formatIDR(value) {
  const numberValue = toNumber(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function formatCompactIDR(value) {
  const numberValue = toNumber(value);

  if (numberValue >= 1_000_000_000) {
    return `Rp${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 1,
    }).format(numberValue / 1_000_000_000)} M`;
  }

  if (numberValue >= 1_000_000) {
    return `Rp${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 1,
    }).format(numberValue / 1_000_000)} jt`;
  }

  return formatIDR(numberValue);
}

function formatShortNumber(value) {
  const numberValue = toNumber(value);

  if (numberValue >= 1_000_000) {
    return `${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 1,
    }).format(numberValue / 1_000_000)} jt`;
  }

  if (numberValue >= 1_000) {
    return `${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 1,
    }).format(numberValue / 1_000)} rb`;
  }

  return formatNumber(numberValue);
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getTimeAgo(value) {
  const date = parseDate(value);

  if (!date) return "-";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(name = "") {
  const initials = String(name)
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return initials || "CL";
}

function getProjectDate(project) {
  return (
    parseDate(project.updatedAt) ||
    parseDate(project.updated_at) ||
    parseDate(project.createdAt) ||
    parseDate(project.created_at) ||
    parseDate(project.startDate) ||
    parseDate(project.start_date) ||
    parseDate(project.deadline) ||
    parseDate(project.deadline_date)
  );
}

function getProjectBudget(project) {
  return toNumber(
    project.budget ||
      project.amount ||
      project.contractValue ||
      project.contract_value ||
      project.nilaiKontrak ||
      project.nilai_kontrak ||
      project.totalBudget ||
      project.total_budget ||
      project.total ||
      0,
  );
}

function getProjectProgress(project) {
  // Hitung dari tasks jika tersedia — sama persis dengan halaman AdminProject
  // supaya nilai progress di dashboard selalu konsisten
  if (Array.isArray(project.tasks) && project.tasks.length > 0) {
    const doneTasks = project.tasks.filter((t) => t.done).length;
    return Math.round((doneTasks / project.tasks.length) * 100);
  }

  // Fallback ke kolom progress tersimpan di DB
  return clamp(
    project.progress ||
      project.progressPercentage ||
      project.progress_percentage ||
      project.percentage ||
      0,
  );
}

function getProjectName(project) {
  return (
    project.name ||
    project.projectName ||
    project.project_name ||
    project.title ||
    "-"
  );
}

function getClientName(project) {
  const clientObject =
    project.client && typeof project.client === "object"
      ? project.client
      : null;

  return (
    clientObject?.name ||
    project.clientName ||
    project.client_name ||
    project.customerName ||
    project.customer_name ||
    project.owner ||
    (typeof project.client === "string" ? project.client : "") ||
    "-"
  );
}

function getProjectStatus(project) {
  const status = String(project.status || "").toLowerCase();
  const progress = getProjectProgress(project);

  if (
    status.includes("cancel") ||
    status.includes("batal") ||
    status.includes("cancelled")
  ) {
    return {
      label: "Dibatalkan",
      className: "cancelled",
    };
  }

  if (
    status.includes("selesai") ||
    status.includes("completed") ||
    status.includes("complete") ||
    status.includes("done") ||
    progress >= 100
  ) {
    return {
      label: "Selesai",
      className: "completed",
    };
  }

  if (
    status.includes("pending") ||
    status.includes("menunggu") ||
    status.includes("review")
  ) {
    return {
      label: "Menunggu",
      className: "pending",
    };
  }

  if (
    status.includes("baru") ||
    status.includes("new") ||
    status.includes("draft") ||
    progress <= 0
  ) {
    return {
      label: "Proyek Baru",
      className: "pending",
    };
  }

  return {
    label: "Diproses",
    className: "processing",
  };
}

function isProjectCompleted(project) {
  return getProjectStatus(project).className === "completed";
}

function isProjectActive(project) {
  const status = getProjectStatus(project).className;
  return status !== "completed" && status !== "cancelled";
}

function isProjectDelayed(project) {
  if (isProjectCompleted(project)) return false;

  const deadline =
    parseDate(project.deadline) ||
    parseDate(project.deadline_date) ||
    parseDate(project.endDate) ||
    parseDate(project.end_date);

  if (!deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  deadline.setHours(0, 0, 0, 0);

  return deadline < today;
}

function isProjectCritical(project) {
  if (isProjectCompleted(project)) return false;
  if (isProjectDelayed(project)) return false;

  const deadline =
    parseDate(project.deadline) ||
    parseDate(project.deadline_date) ||
    parseDate(project.endDate) ||
    parseDate(project.end_date);

  if (!deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= 7;
}

function getProjectCondition(project) {
  const rawStatus = String(project.status || "").toLowerCase();
  const progress = getProjectProgress(project);

  if (isProjectCompleted(project)) return "completed";
  if (isProjectDelayed(project)) return "delayed";
  if (isProjectCritical(project)) return "critical";

  if (
    rawStatus.includes("pending") ||
    rawStatus.includes("menunggu") ||
    rawStatus.includes("review") ||
    rawStatus.includes("baru") ||
    rawStatus.includes("new") ||
    rawStatus.includes("draft") ||
    progress <= 0
  ) {
    return "need_review";
  }

  return "on_track";
}

function getProjectMaterials(project) {
  const candidates = [
    project.projectMaterials,
    project.project_materials,
    project.materials,
    project.materialRequests,
    project.material_requests,
    project.usedMaterials,
    project.used_materials,
  ];

  return candidates.find((item) => Array.isArray(item)) || [];
}

function getProjectMaterialCount(project) {
  const materials = getProjectMaterials(project);

  return materials.reduce((total, item) => {
    const quantity = toNumber(
      item.quantity ||
        item.qty ||
        item.amount ||
        item.usedQuantity ||
        item.used_quantity ||
        item.pivot?.quantity ||
        1,
    );

    return total + (quantity > 0 ? quantity : 1);
  }, 0);
}

function getProjectDocumentationCount(project) {
  const candidates = [
    project.progressFeed,
    project.progress_feed,
    project.progressFeeds,
    project.progress_feeds,
    project.progressHistories,
    project.progress_histories,
    project.photos,
    project.images,
    project.progressPhotos,
    project.progress_photos,
  ];

  return candidates.reduce((total, item) => {
    if (Array.isArray(item)) return total + item.length;
    return total;
  }, 0);
}

function getMaterialStock(material) {
  return toNumber(
    material.stock ||
      material.currentStock ||
      material.current_stock ||
      material.quantity ||
      material.qty ||
      0,
  );
}

function getMaterialDate(material) {
  return (
    parseDate(material.updatedAt) ||
    parseDate(material.updated_at) ||
    parseDate(material.createdAt) ||
    parseDate(material.created_at)
  );
}

function getFileDate(file) {
  return (
    parseDate(file.updatedAt) ||
    parseDate(file.updated_at) ||
    parseDate(file.createdAt) ||
    parseDate(file.created_at) ||
    parseDate(file.uploadedAt) ||
    parseDate(file.uploaded_at)
  );
}

function getMonthIndex(date) {
  const safeDate = parseDate(date);

  if (!safeDate) return null;

  return safeDate.getMonth();
}

function getMetricChange(monthlyData) {
  const currentMonth = new Date().getMonth();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  const current = toNumber(monthlyData[currentMonth]);
  const previous = toNumber(monthlyData[previousMonth]);

  if (previous === 0 && current === 0) {
    return {
      change: "0%",
      changeType: "up",
    };
  }

  if (previous === 0 && current > 0) {
    return {
      change: "+100%",
      changeType: "up",
    };
  }

  const percentage = ((current - previous) / previous) * 100;
  const fixed = Math.abs(percentage).toFixed(1).replace(".0", "");

  return {
    change: `${percentage >= 0 ? "+" : "-"}${fixed}%`,
    changeType: percentage >= 0 ? "up" : "down",
  };
}

function normalizeRecentProject(project, index) {
  const clientObject =
    project.client && typeof project.client === "object"
      ? project.client
      : null;

  const clientName = getClientName(project);

  const clientInfo =
    clientObject?.email ||
    project.clientEmail ||
    project.client_email ||
    project.email ||
    project.location ||
    project.address ||
    "Proyek Interior";

  const projectName = getProjectName(project);

  const projectId =
    project.projectCode ||
    project.project_code ||
    project.code ||
    project.projectId ||
    project.project_id ||
    `PRJ-${String(project.id || index + 1).padStart(4, "0")}`;

  const budget = getProjectBudget(project);
  const status = getProjectStatus(project);

  return {
    id: project.id || projectId,
    initials: getInitials(clientName),
    name: clientName,
    email: clientInfo,
    projectId,
    projectName,
    status: status.label,
    amount: budget ? formatIDR(budget) : "-",
    avatarClass: avatarClasses[index % avatarClasses.length],
    statusClass: status.className,
    createdAt:
      project.createdAt ||
      project.created_at ||
      project.updatedAt ||
      project.updated_at ||
      "",
  };
}

function buildMonthlyDashboardData(projects, materials, files) {
  const progressTotal = Array(12).fill(0);
  const progressCount = Array(12).fill(0);
  const budget = Array(12).fill(0);
  const material = Array(12).fill(0);
  const documentation = Array(12).fill(0);
  const activeProjects = Array(12).fill(0);

  projects.forEach((project) => {
    const monthIndex = getMonthIndex(getProjectDate(project));

    if (monthIndex === null) return;

    const progress = getProjectProgress(project);

    progressTotal[monthIndex] += progress;
    progressCount[monthIndex] += 1;
    budget[monthIndex] += getProjectBudget(project);
    material[monthIndex] += getProjectMaterialCount(project);
    documentation[monthIndex] += getProjectDocumentationCount(project);

    if (isProjectActive(project)) {
      activeProjects[monthIndex] += 1;
    }
  });

  const progress = progressTotal.map((total, index) => {
    if (!progressCount[index]) return 0;
    return Math.round(total / progressCount[index]);
  });

  const hasProjectMaterial = material.some((value) => value > 0);
  const hasProjectDocumentation = documentation.some((value) => value > 0);

  if (!hasProjectMaterial) {
    materials.forEach((item) => {
      const monthIndex = getMonthIndex(getMaterialDate(item));

      if (monthIndex === null) return;

      material[monthIndex] += getMaterialStock(item) || 1;
    });
  }

  if (!hasProjectDocumentation) {
    files.forEach((item) => {
      const monthIndex = getMonthIndex(getFileDate(item));

      if (monthIndex === null) return;

      documentation[monthIndex] += 1;
    });
  }

  return {
    progress,
    budget,
    material,
    documentation,
    activeProjects,
  };
}

function buildMetricCards(projects, materials, files, monthlyData) {
  const totalBudget = projects.reduce(
    (total, project) => total + getProjectBudget(project),
    0,
  );

  const activeProjectCount = projects.filter(isProjectActive).length;

  const materialFromProjects = projects.reduce(
    (total, project) => total + getProjectMaterialCount(project),
    0,
  );

  const materialCount =
    materialFromProjects > 0 ? materialFromProjects : materials.length;

  const documentationFromProjects = projects.reduce(
    (total, project) => total + getProjectDocumentationCount(project),
    0,
  );

  const documentationCount =
    files.length > 0 ? files.length : documentationFromProjects;

  const budgetChange = getMetricChange(monthlyData.budget);
  const activeChange = getMetricChange(monthlyData.activeProjects);
  const materialChange = getMetricChange(monthlyData.material);
  const documentationChange = getMetricChange(monthlyData.documentation);

  return [
    {
      title: "Total Nilai Proyek",
      value: formatCompactIDR(totalBudget),
      change: budgetChange.change,
      changeType: budgetChange.changeType,
      note: "vs bulan lalu",
      icon: "money",
      iconClass: "green",
      lineClass: "green-line",
      data: monthlyData.budget,
    },
    {
      title: "Proyek Aktif",
      value: formatNumber(activeProjectCount),
      change: activeChange.change,
      changeType: activeChange.changeType,
      note: "vs bulan lalu",
      icon: "users",
      iconClass: "cyan",
      lineClass: "cyan-line",
      data: monthlyData.activeProjects,
    },
    {
      title: "Permintaan Material",
      value: formatNumber(materialCount),
      change: materialChange.change,
      changeType: materialChange.changeType,
      note: materials.length ? "dari stok material" : "dari data proyek",
      icon: "cart",
      iconClass: "blue",
      lineClass: "blue-line",
      data: monthlyData.material,
    },
    {
      title: "Dokumentasi Lapangan",
      value: formatNumber(documentationCount),
      change: documentationChange.change,
      changeType: documentationChange.changeType,
      note: files.length ? "dari data file" : "dari progres proyek",
      icon: "eye",
      iconClass: "yellow",
      lineClass: "yellow-line",
      data: monthlyData.documentation,
    },
  ];
}

function buildStatusProject(projects) {
  const total = projects.length;

  const counts = {
    on_track: 0,
    critical: 0,
    delayed: 0,
    completed: 0,
  };

  projects.forEach((project) => {
    const condition = getProjectCondition(project);
    counts[condition] += 1;
  });

  return Object.keys(statusConfig).map((key) => ({
    label: statusConfig[key].label,
    value: total ? Math.round((counts[key] / total) * 100) : 0,
    count: counts[key],
    color: statusConfig[key].color,
  }));
}

function buildMonthlyGoals(projects, materials) {
  const totalProjects = projects.length;

  const averageProgress = totalProjects
    ? Math.round(
        projects.reduce((total, project) => {
          return total + getProjectProgress(project);
        }, 0) / totalProjects,
      )
    : 0;

  const completedProjects = projects.filter(isProjectCompleted).length;

  const completedPercent = totalProjects
    ? Math.round((completedProjects / totalProjects) * 100)
    : 0;

  const materialReady = materials.filter((material) => {
    return getMaterialStock(material) > 0;
  }).length;

  const materialPercent = materials.length
    ? Math.round((materialReady / materials.length) * 100)
    : 0;

  return [
    {
      title: "Progres Proyek Bulanan",
      percent: averageProgress,
      value: `${averageProgress}%`,
      target: "Target: 100%",
      color: "#0f9c4a",
    },
    {
      title: "Pemasangan Selesai",
      percent: completedPercent,
      value: `${completedProjects} proyek`,
      target: `Target: ${totalProjects} proyek`,
      color: "#0ea5a8",
    },
    {
      title: "Ketersediaan Material",
      percent: materialPercent,
      value: materials.length
        ? `${materialReady}/${materials.length} material`
        : "0 material",
      target: materials.length
        ? "Target: semua tersedia"
        : "Data material belum tersedia",
      color: "#2f80ed",
    },
  ];
}

function detectActivityIcon(activity) {
  const text = `${activity.title || ""} ${activity.description || ""} ${
    activity.message || ""
  } ${activity.action || ""}`.toLowerCase();

  if (text.includes("client") || text.includes("user")) {
    return {
      icon: "user",
      color: "cyan",
    };
  }

  if (
    text.includes("bayar") ||
    text.includes("payment") ||
    text.includes("dp")
  ) {
    return {
      icon: "card",
      color: "blue",
    };
  }

  if (text.includes("review") || text.includes("revisi")) {
    return {
      icon: "star",
      color: "purple",
    };
  }

  if (text.includes("material") || text.includes("stok")) {
    return {
      icon: "ticket",
      color: "yellow",
    };
  }

  return {
    icon: "doc",
    color: "green",
  };
}

function normalizeActivity(activity, index) {
  const iconConfig = detectActivityIcon(activity);
  const meta = activity.metadata || {};
  const projectId = meta.projectId || meta.project_id || null;

  return {
    id: activity.id || index,
    title:
      activity.title ||
      activity.action ||
      activity.activity ||
      activity.type ||
      "Aktivitas dashboard",
    desc:
      activity.description ||
      activity.message ||
      activity.desc ||
      "Aktivitas terbaru dari sistem monitoring.",
    time: getTimeAgo(
      activity.createdAt ||
        activity.created_at ||
        activity.updatedAt ||
        activity.updated_at,
    ),
    color: iconConfig.color,
    icon: iconConfig.icon,
    projectId,
  };
}

function buildProjectFallbackActivities(projects) {
  return [...projects]
    .sort((a, b) => {
      const dateA = getProjectDate(a)?.getTime() || 0;
      const dateB = getProjectDate(b)?.getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, 6)
    .map((project, index) => {
      const status = getProjectStatus(project);

      return {
        id: project.id || index,
        title: "Pembaruan Proyek",
        desc: `${getProjectName(project)} - ${status.label} (${getProjectProgress(
          project,
        )}%)`,
        time: getTimeAgo(getProjectDate(project)),
        color: "green",
        icon: "doc",
      };
    });
}

function createVisualSparklineData(data = [], stepsPerSegment = 18) {
  const source =
    Array.isArray(data) && data.length > 0
      ? data.map((item) => Number(item) || 0)
      : [0];

  if (source.length < 2) return source;

  const max = Math.max(...source, 1);
  const min = Math.min(...source, 0);
  const range = max - min || 1;

  const normalized = source.map((value) => (value - min) / range);
  const smoothed = normalized.map((value, index) => {
    const prev2 = normalized[Math.max(0, index - 2)];
    const prev1 = normalized[Math.max(0, index - 1)];
    const current = normalized[index];
    const next1 = normalized[Math.min(normalized.length - 1, index + 1)];
    const next2 = normalized[Math.min(normalized.length - 1, index + 2)];

    return (
      prev2 * 0.06 + prev1 * 0.2 + current * 0.48 + next1 * 0.2 + next2 * 0.06
    );
  });

  const output = [];

  for (let i = 0; i < smoothed.length - 1; i += 1) {
    const start = smoothed[i];
    const end = smoothed[i + 1];

    for (let step = 0; step < stepsPerSegment; step += 1) {
      const t = step / stepsPerSegment;
      const eased = t * t * (3 - 2 * t);

      output.push(start + (end - start) * eased);
    }
  }

  output.push(smoothed[smoothed.length - 1]);

  return output;
}

function buildSparklinePoints(data, width = 100, height = 42) {
  const displayData = createVisualSparklineData(data, 18);

  // Posisi garis dinaikkan sedikit dari bawah card
  const baselineY = 25;

  // Amplitudo sedikit dinaikkan supaya gelombangnya lebih hidup
  const amplitude = 8.5;

  return displayData.map((value, index) => {
    const x = (index * width) / (displayData.length - 1 || 1);

    const wave = Math.sin(index * 0.18) * 0.12 + Math.sin(index * 0.055) * 0.08;

    const visualValue = clamp(value * 0.72 + 0.18 + wave, 0, 1);
    const y = baselineY - visualValue * amplitude;

    return [x, y];
  });
}

function buildSmoothPathFromPoints(points) {
  if (!points.length) return "";

  if (points.length === 1) {
    return `M ${points[0][0]} ${points[0][1]}`;
  }

  let path = `M ${points[0][0]} ${points[0][1]}`;
  const tension = 0.78;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const cp1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;

    const cp2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const cp2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }

  return path;
}

function buildSparklineAreaPath(points, width = 100, height = 42) {
  const linePath = buildSmoothPathFromPoints(points);
  return `${linePath} L ${width} ${height} L 0 ${height} Z`;
}

function Sparkline({ data, className }) {
  const points = buildSparklinePoints(data, 100, 42);
  const linePath = buildSmoothPathFromPoints(points);
  const areaPath = buildSparklineAreaPath(points, 100, 42);

  return (
    <svg
      className={`sparkline ${className}`}
      viewBox="0 0 100 42"
      preserveAspectRatio="none"
    >
      <path className="sparkline-area" d={areaPath} />
      <path className="sparkline-line" d={linePath} />
    </svg>
  );
}

function OverviewChart({ data, mode = "progress" }) {
  const [hoverData, setHoverData] = useState(null);

  const width = 1000;
  const height = 340;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 38;

  const safeData =
    Array.isArray(data) && data.length === 12 ? data : Array(12).fill(0);

  const rawMax =
    mode === "progress"
      ? 100
      : Math.max(...safeData.map((item) => toNumber(item)), 1);

  const max = mode === "progress" ? 100 : Math.ceil(rawMax * 1.15);
  const min = 0;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const points = safeData.map((value, index) => {
    const x =
      paddingLeft +
      (index * (width - paddingLeft - paddingRight)) / (safeData.length - 1);

    const y =
      paddingTop +
      ((max - value) / (max - min || 1)) *
        (height - paddingTop - paddingBottom);

    return [x, y];
  });

  const linePath = buildSmoothPathFromPoints(points);

  const areaPath = `${linePath} L ${width - paddingRight} ${
    height - paddingBottom
  } L ${paddingLeft} ${height - paddingBottom} Z`;

  const yValues =
    mode === "progress"
      ? [100, 75, 50, 25, 0]
      : [max, max * 0.75, max * 0.5, max * 0.25, 0];

  const yLabels = yValues.map((value) => {
    if (mode === "progress") return `${Math.round(value)}%`;
    if (mode === "budget") return formatCompactIDR(value);
    return formatShortNumber(value);
  });

  const getTooltipLabel = () => {
    if (mode === "progress") return "Progres";
    if (mode === "material") return "Material";
    if (mode === "budget") return "Anggaran";
    return "Value";
  };

  const getTooltipValue = (value) => {
    if (mode === "progress") return `${formatNumber(value)}%`;
    if (mode === "budget") return formatCompactIDR(value);
    return formatNumber(value);
  };

  const handleChartMove = (event) => {
    const svgElement = event.currentTarget;
    const rect = svgElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    const chartStartX = (paddingLeft / width) * rect.width;
    const chartEndX = ((width - paddingRight) / width) * rect.width;
    const chartWidth = chartEndX - chartStartX;

    const relativeX = Math.min(Math.max(mouseX - chartStartX, 0), chartWidth);
    const index = Math.round((relativeX / chartWidth) * (safeData.length - 1));
    const point = points[index];

    const xPx = svgElement.offsetLeft + (point[0] / width) * rect.width;
    const yPx = svgElement.offsetTop + (point[1] / height) * rect.height;

    setHoverData({
      index,
      month: months[index],
      value: safeData[index],
      point,
      xPx,
      yPx,
    });
  };

  const handleChartLeave = () => {
    setHoverData(null);
  };

  return (
    <div className="overview-chart-wrap" onMouseLeave={handleChartLeave}>
      <svg
        className="overview-chart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onMouseMove={handleChartMove}
      >
        {yValues.map((value, index) => {
          const y =
            paddingTop +
            ((max - value) / (max - min || 1)) *
              (height - paddingTop - paddingBottom);

          return (
            <line
              key={`${value}-${index}`}
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              className="overview-grid"
            />
          );
        })}

        <path className="overview-area" d={areaPath} />
        <path className="overview-line" d={linePath} />

        {hoverData ? (
          <>
            <line
              x1={hoverData.point[0]}
              y1={paddingTop}
              x2={hoverData.point[0]}
              y2={height - paddingBottom}
              className="overview-hover-line"
            />

            <circle
              cx={hoverData.point[0]}
              cy={hoverData.point[1]}
              r="7"
              className="overview-hover-dot"
            />
          </>
        ) : null}
      </svg>

      {hoverData ? (
        <div
          className="overview-tooltip"
          style={{
            left: `${hoverData.xPx}px`,
            top: `${hoverData.yPx}px`,
          }}
        >
          <span>{hoverData.month}</span>
          <strong>
            {getTooltipLabel()}: {getTooltipValue(hoverData.value)}
          </strong>
        </div>
      ) : null}

      <div className="overview-y-labels">
        {yLabels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      <div className="overview-x-labels">
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data, total }) {
  let start = 0;
  const hasData = total > 0 && data.some((item) => item.value > 0);

  const gradientParts = hasData
    ? data.map((item, index) => {
        const end = index === data.length - 1 ? 100 : start + item.value;
        const part = `${item.color} ${start}% ${end}%`;
        start = end;
        return part;
      })
    : ["#e5e7eb 0% 100%"];

  return (
    <div className="status-chart-box">
      <div
        className="donut-chart"
        style={{ background: `conic-gradient(${gradientParts.join(", ")})` }}
      >
        <div className="donut-inner">
          <h3>{formatNumber(total)}</h3>
          <p>Proyek</p>
        </div>
      </div>

      <div className="status-legend">
        {data.map((item) => (
          <div className="legend-row" key={item.label}>
            <div className="legend-left">
              <span
                className="legend-dot"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function Icon({ name }) {
  switch (name) {
    case "money":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 3v18" />
          <path d="M16.5 7.5c0-1.657-2.015-3-4.5-3s-4.5 1.343-4.5 3 2.015 3 4.5 3 4.5 1.343 4.5 3-2.015 3-4.5 3-4.5-1.343-4.5-3" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="3" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 4.13a3 3 0 0 1 0 5.74" />
        </svg>
      );
    case "cart":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
          <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h9.9a1 1 0 0 0 1-.76L21 8H7" />
        </svg>
      );
    case "eye":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="2.8" />
        </svg>
      );
    default:
      return null;
  }
}

function ActivityIcon({ type }) {
  switch (type) {
    case "doc":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M8 3h6l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M14 3v5h5" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6L3.27 9.35l6.03-.88L12 3Z" />
        </svg>
      );
    case "card":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    case "ticket":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z" />
          <path d="M12 7v10" />
        </svg>
      );
    default:
      return null;
  }
}

function CriticalProjectsWidget({ projects }) {
  if (!projects || projects.length === 0) return null;

  const overdueCount = projects.filter((p) => p.isOverdue).length;
  const upcomingCount = projects.length - overdueCount;

  return (
    <div className="panel critical-projects-panel">
      <div className="panel-head">
        <div>
          <h2 className="critical-projects-title">Proyek Kritis</h2>
          <p>{overdueCount > 0 ? `${overdueCount} proyek telat, ${upcomingCount} mendekati deadline` : `Proyek dengan deadline H-7 atau kurang`}</p>
        </div>
        <span className="critical-badge">{projects.length}</span>
      </div>
      <div className="critical-projects-list">
        {projects.map((p) => {
          const daysLeft = p.daysLeft ?? p.daysUntilDeadline;
          const isOverdue = p.isOverdue || daysLeft < 0;
          const isUrgent = !isOverdue && daysLeft <= 3;

          return (
            <Link
              key={p.id}
              to={`/admin/projects?id=${p.id}`}
              className="critical-project-item"
            >
              <div className="critical-project-left">
                <span
                  className={`critical-project-dot ${isOverdue ? "overdue" : isUrgent ? "urgent" : "warning"}`}
                />
                <div className="critical-project-info">
                  <strong>{p.name}</strong>
                  <span>{p.client || "-"}</span>
                </div>
              </div>
              <div className={`critical-project-deadline ${isOverdue ? "overdue-text" : isUrgent ? "urgent-text" : "warning-text"}`}>
                {isOverdue ? `Telat ${Math.abs(daysLeft)} hari` : daysLeft > 0 ? `H-${daysLeft}` : "Hari Ini"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({ item }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <div>
          <p className="metric-title">{item.title}</p>
          <h3 className="metric-value">{item.value}</h3>

          <div className={`metric-change ${item.changeType}`}>
            <span className="metric-arrow">
              {item.changeType === "up" ? "↗" : "↘"}
            </span>
            <strong>{item.change}</strong>
            <span>{item.note}</span>
          </div>
        </div>

        <div className={`metric-icon ${item.iconClass}`}>
          <Icon name={item.icon} />
        </div>
      </div>

      <div className="metric-chart">
        <Sparkline data={item.data} className={item.lineClass} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("progress");
  const [dashboardProjects, setDashboardProjects] = useState([]);
  const [dashboardMaterials, setDashboardMaterials] = useState([]);
  const [dashboardFiles, setDashboardFiles] = useState([]);
  const [dashboardActivities, setDashboardActivities] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [criticalProjects, setCriticalProjects] = useState([]);

  const currentYear = new Date().getFullYear();
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState(String(currentYear));

  const monthlyData = useMemo(() => {
    return buildMonthlyDashboardData(
      dashboardProjects,
      dashboardMaterials,
      dashboardFiles,
    );
  }, [dashboardProjects, dashboardMaterials, dashboardFiles]);

  const metricCards = useMemo(() => {
    return buildMetricCards(
      dashboardProjects,
      dashboardMaterials,
      dashboardFiles,
      monthlyData,
    );
  }, [dashboardProjects, dashboardMaterials, dashboardFiles, monthlyData]);

  const statusProject = useMemo(() => {
    return buildStatusProject(dashboardProjects);
  }, [dashboardProjects]);

  const monthlyGoals = useMemo(() => {
    return buildMonthlyGoals(dashboardProjects, dashboardMaterials);
  }, [dashboardProjects, dashboardMaterials]);

  const recentClients = useMemo(() => {
    return [...dashboardProjects]
      .map(normalizeRecentProject)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 6);
  }, [dashboardProjects]);

  const recentActivities = useMemo(() => {
    if (dashboardActivities.length > 0) {
      return dashboardActivities.map(normalizeActivity).slice(0, 6);
    }

    return buildProjectFallbackActivities(dashboardProjects);
  }, [dashboardActivities, dashboardProjects]);

  const currentData =
    activeTab === "progress"
      ? monthlyData.progress
      : activeTab === "material"
        ? monthlyData.material
        : monthlyData.budget;

  const fetchDashboardData = async (month = filterMonth, year = filterYear) => {
    try {
      setProjectsLoading(true);
      setProjectsError("");

      const params = new URLSearchParams();
      if (year) params.set("year", year);
      if (month) params.set("month", month);
      const projectUrl = params.toString()
        ? `${PROJECT_API_URL}?${params.toString()}`
        : PROJECT_API_URL;

      const projectResult = await fetchJson(projectUrl);

      const projects = normalizeApiCollection(projectResult, [
        "projects",
        "project",
      ]);

      setDashboardProjects(projects);

      const [materialResult, fileResult, activityResult] =
        await Promise.allSettled([
          fetchJson(
            params.toString()
              ? `${MATERIAL_API_URL}?${params.toString()}`
              : MATERIAL_API_URL,
          ),
          fetchJson(
            params.toString()
              ? `${FILE_API_URL}?${params.toString()}`
              : FILE_API_URL,
          ),
          fetchJson(ACTIVITY_API_URL),
        ]);

      if (materialResult.status === "fulfilled") {
        setDashboardMaterials(
          normalizeApiCollection(materialResult.value, [
            "materials",
            "material",
          ]),
        );
      } else {
        setDashboardMaterials([]);
      }

      if (fileResult.status === "fulfilled") {
        setDashboardFiles(
          normalizeApiCollection(fileResult.value, ["files", "documents"]),
        );
      } else {
        setDashboardFiles([]);
      }

      if (activityResult.status === "fulfilled") {
        setDashboardActivities(
          normalizeApiCollection(activityResult.value, [
            "activities",
            "activityLogs",
            "activity_logs",
            "logs",
          ]),
        );
      } else {
        setDashboardActivities([]);
      }
    } catch (error) {
      setProjectsError(error.message || "Gagal mengambil data dashboard.");
      setDashboardProjects([]);
      setDashboardMaterials([]);
      setDashboardFiles([]);
      setDashboardActivities([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchCriticalProjects = async () => {
    try {
      const result = await fetchJson(CRITICAL_PROJECT_API_URL);
      const items = normalizeApiCollection(result, ["data"]);
      setCriticalProjects(Array.isArray(items) ? items : []);
    } catch {
      setCriticalProjects([]);
    }
  };

  const triggerDeadlineReminders = async () => {
    try {
      await fetch(REMIND_DEADLINE_API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch {
      // silent — notifikasi opsional
    }
  };

  // Re-fetch saat filter berubah
  useEffect(() => {
    fetchDashboardData(filterMonth, filterYear);
    fetchCriticalProjects();
    triggerDeadlineReminders();
  }, [filterMonth, filterYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh setiap 15 detik
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDashboardData(filterMonth, filterYear);
      fetchCriticalProjects();
      triggerDeadlineReminders();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [filterMonth, filterYear]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-top">
          <div>
            <h1>Dashboard</h1>
            <p>
              Selamat datang kembali. Berikut adalah kabar terbaru seputar
              bisnis interior Anda hari ini.
            </p>
          </div>

          <div className="dashboard-filter-bar">
            <select
              className="filter-select"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              aria-label="Filter bulan"
            >
              <option value="">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            <select
              className="filter-select"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              aria-label="Filter tahun"
            >
              <option value="">Semua Tahun</option>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>

            {(filterMonth || filterYear !== String(currentYear)) && (
              <button
                type="button"
                className="filter-reset-btn"
                onClick={() => {
                  setFilterMonth("");
                  setFilterYear(String(currentYear));
                }}
              >
                Atur Ulang
              </button>
            )}
          </div>
        </div>
      </div>

      {projectsError ? (
        <div className="dashboard-error-banner">{projectsError}</div>
      ) : null}

      <div className="metrics-grid">
        {metricCards.map((item) => (
          <MetricCard key={item.title} item={item} />
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="left-column">
          <div className="panel overview-panel">
            <div className="panel-head panel-head-space">
              <div>
                <h2>Ringkasan</h2>
                <p>Performa bulanan untuk tahun ini</p>
              </div>

              <div className="segment-tabs">
                <button
                  type="button"
                  className={activeTab === "progress" ? "active" : ""}
                  onClick={() => setActiveTab("progress")}
                >
                  Progres
                </button>

                <button
                  type="button"
                  className={activeTab === "material" ? "active" : ""}
                  onClick={() => setActiveTab("material")}
                >
                  Material
                </button>

                <button
                  type="button"
                  className={activeTab === "budget" ? "active" : ""}
                  onClick={() => setActiveTab("budget")}
                >
                  Anggaran
                </button>
              </div>
            </div>

            <OverviewChart data={currentData} mode={activeTab} />
          </div>

          <div className="panel clients-panel">
            <div className="clients-head">
              <div>
                <h2>Klien Terbaru</h2>
                <p>Daftar klien yang baru saja terhubung</p>
              </div>

              <Link to="/admin/projects" className="view-all-btn">
                Lihat Semua <span>↗</span>
              </Link>
            </div>

            <div className="clients-table-wrap desktop-only">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Klien</th>
                    <th>ID Proyek</th>
                    <th>Proyek</th>
                    <th>Status</th>
                    <th>Anggaran</th>
                  </tr>
                </thead>

                <tbody>
                  {projectsLoading ? (
                    <tr>
                      <td colSpan={5} className="project-name">
                        Mengambil data dashboard...
                      </td>
                    </tr>
                  ) : projectsError ? (
                    <tr>
                      <td colSpan={5} className="project-name">
                        {projectsError}
                      </td>
                    </tr>
                  ) : recentClients.length > 0 ? (
                    recentClients.map((client) => (
                      <tr key={client.id}>
                        <td>
                          <div className="client-cell">
                            <div
                              className={`client-avatar ${client.avatarClass}`}
                            >
                              {client.initials}
                            </div>

                            <div className="client-info">
                              <h4>{client.name}</h4>
                              <p>{client.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="project-id">{client.projectId}</td>
                        <td className="project-name">{client.projectName}</td>

                        <td>
                          <span
                            className={`status-badge ${client.statusClass}`}
                          >
                            {client.status}
                          </span>
                        </td>

                        <td className="project-amount">{client.amount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="project-name">
                        Belum ada data proyek.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="clients-mobile-list mobile-only">
              {projectsLoading ? (
                <div className="client-mobile-card">
                  <div className="client-info">
                    <h4>Mengambil data dashboard...</h4>
                    <p>Mohon tunggu sebentar.</p>
                  </div>
                </div>
              ) : projectsError ? (
                <div className="client-mobile-card">
                  <div className="client-info">
                    <h4>Data dashboard gagal dimuat</h4>
                    <p>{projectsError}</p>
                  </div>
                </div>
              ) : recentClients.length > 0 ? (
                recentClients.map((client) => (
                  <div
                    className="client-mobile-card"
                    key={`mobile-${client.id}`}
                  >
                    <div className="client-mobile-top">
                      <div className="client-cell">
                        <div className={`client-avatar ${client.avatarClass}`}>
                          {client.initials}
                        </div>

                        <div className="client-info">
                          <h4>{client.name}</h4>
                          <p>{client.email}</p>
                        </div>
                      </div>

                      <span className={`status-badge ${client.statusClass}`}>
                        {client.status}
                      </span>
                    </div>

                    <div className="client-mobile-meta">
                      <div>
                        <span>ID Proyek</span>
                        <strong>{client.projectId}</strong>
                      </div>
                      <div>
                        <span>Proyek</span>
                        <strong>{client.projectName}</strong>
                      </div>
                      <div>
                        <span>Anggaran</span>
                        <strong>{client.amount}</strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="client-mobile-card">
                  <div className="client-info">
                    <h4>Belum ada data proyek.</h4>
                    <p>Buat proyek baru dari halaman Proyek.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-column">
          <CriticalProjectsWidget projects={criticalProjects} />

          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Status Proyek</h2>
                <p>Distribusi kondisi proyek interior saat ini</p>
              </div>
            </div>

            <DonutChart data={statusProject} total={dashboardProjects.length} />
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Pencapaian Bulanan</h2>
                <p>Memantau kemajuan pencapaian target</p>
              </div>
            </div>

            <div className="goals-list">
              {monthlyGoals.map((goal) => (
                <div className="goal-item" key={goal.title}>
                  <div className="goal-title-row">
                    <span>{goal.title}</span>
                    <strong>{goal.percent}%</strong>
                  </div>

                  <div className="goal-bar">
                    <div
                      className="goal-fill"
                      style={{
                        width: `${clamp(goal.percent)}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>

                  <div className="goal-footer">
                    <span>{goal.value}</span>
                    <span>{goal.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel activity-panel">
            <div className="clients-head">
              <div>
                <h2>Aktivitas Terbaru</h2>
                <p>Informasi terbaru dari proyek interior Anda</p>
              </div>

              <button
                type="button"
                className="view-all-btn"
                onClick={fetchDashboardData}
                disabled={projectsLoading}
              >
                Perbarui <span>↗</span>
              </button>
            </div>

            <div className="activity-list">
              {projectsLoading ? (
                <div className="activity-item">
                  <div className="activity-icon green">
                    <ActivityIcon type="doc" />
                  </div>

                  <div className="activity-content">
                    <h4>Mengambil aktivitas...</h4>
                    <p>Mohon tunggu sebentar.</p>
                    <span>Memuat...</span>
                  </div>
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((item, index) => {
                  const itemContent = (
                    <>
                      <div className={`activity-icon ${item.color}`}>
                        <ActivityIcon type={item.icon} />
                      </div>

                      <div className="activity-content">
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                        <span>{item.time}</span>
                      </div>
                    </>
                  );

                  return item.projectId ? (
                    <Link
                      to={`/admin/projects?id=${item.projectId}`}
                      className="activity-item activity-item--link"
                      key={`${item.id}-${index}`}
                    >
                      {itemContent}
                    </Link>
                  ) : (
                    <div className="activity-item" key={`${item.id}-${index}`}>
                      {itemContent}
                    </div>
                  );
                })
              ) : (
                <div className="activity-item">
                  <div className="activity-icon green">
                    <ActivityIcon type="doc" />
                  </div>

                  <div className="activity-content">
                    <h4>Belum ada aktivitas</h4>
                    <p>Belum ada aktivitas yang tercatat.</p>
                    <span>-</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
