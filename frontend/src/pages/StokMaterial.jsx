import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiAlertTriangle,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiBox,
  FiChevronDown,
  FiColumns,
  FiDownload,
  FiEdit2,
  FiEye,
  FiMoreHorizontal,
  FiPackage,
  FiPlus,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import "../css/StokMaterial.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3333";

const MATERIAL_API_URL = `${API_BASE_URL}/api/materials`;

const emptyForm = {
  name: "",
  description: "",
  category: "",
  sku: "",
  stock: "",
  unit: "pcs",
  price: "",
};

const emptyMovementForm = {
  quantity: "",
  note: "",
};

const DEFAULT_CATEGORIES = [
  "Furniture",
  "Storage",
  "Lighting",
  "Dekorasi Dinding",
  "Aksesori Dekoratif",
  "Textiles",
  "Flooring",
  "Elemen Plafon",
  "Finishing Dinding",
  "Furnitur Dapur",
  "Furnitur Kamar Mandi",
  "Furnitur Kantor",
  "Aksesori Pintu",
  "Aksesori Jendela",
  "Perlengkapan Kenyamanan",
  "Item Gaya Dekoratif",
  "Fastener",
];

const TAB_KEYS = [
  { key: "all", label: "Semua" },
  { key: "tersedia", label: "Stok Tersedia" },
  { key: "menipis", label: "Stok Menipis" },
  { key: "habis", label: "Tidak Tersedia" },
];

const COLUMN_OPTIONS = [
  { key: "category", label: "Kategori" },
  { key: "status", label: "Status" },
  { key: "stock", label: "Stok" },
  { key: "price", label: "Harga" },
  { key: "updated", label: "Terakhir Diperbarui" },
];

const STATUS_CONFIG = {
  tersedia: {
    label: "Stok Tersedia",
    badgeClass: "is-ready",
    dotClass: "is-ready",
  },
  menipis: {
    label: "Stok Menipis",
    badgeClass: "is-low",
    dotClass: "is-low",
  },
  habis: {
    label: "Tidak Tersedia",
    badgeClass: "is-empty",
    dotClass: "is-empty",
  },
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

    stockIn: Number(
      item.stockIn ||
        item.stock_in ||
        item.qtyIn ||
        item.qty_in ||
        item.totalIn ||
        item.total_in ||
        item.barangMasuk ||
        0,
    ),

    stockOut: Number(
      item.stockOut ||
        item.stock_out ||
        item.qtyOut ||
        item.qty_out ||
        item.totalOut ||
        item.total_out ||
        item.barangKeluar ||
        0,
    ),

    lastUpdated:
      item.lastUpdated ||
      item.last_updated ||
      item.updatedAt ||
      item.updated_at ||
      item.createdAt ||
      item.created_at ||
      "",
  };
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatIDR(value) {
  if (!value && value !== 0) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value));
}

function formatNumberInput(value) {
  const digitsOnly = String(value || "").replace(/\D/g, "");

  if (!digitsOnly) return "";

  return new Intl.NumberFormat("id-ID").format(Number(digitsOnly));
}

function stockStatus(stock) {
  const value = Number(stock || 0);

  if (value === 0) return "habis";
  if (value <= 5) return "menipis";

  return "tersedia";
}

function getNextMaterialSku(materialList = []) {
  const usedNumbers = new Set(
    materialList
      .map((item) => {
        const match = String(item?.sku || "")
          .trim()
          .match(/^MAT-(\d+)$/i);

        return match ? Number(match[1]) : null;
      })
      .filter((number) => Number.isInteger(number) && number > 0),
  );

  let nextNumber = 1;

  while (usedNumbers.has(nextNumber)) {
    nextNumber += 1;
  }

  return `MAT-${String(nextNumber).padStart(3, "0")}`;
}

export default function StokMaterial() {
  const [materials, setMaterials] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [movementItem, setMovementItem] = useState(null);
  const [movementMode, setMovementMode] = useState(null);
  const [movementForm, setMovementForm] = useState(emptyMovementForm);
  const [movementSaving, setMovementSaving] = useState(false);
  const [movementError, setMovementError] = useState("");

  const [selected, setSelected] = useState([]);
  const [detailItem, setDetailItem] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const [catDropOpen, setCatDropOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);

  // State untuk custom dropdown kategori & satuan di form modal
  const [catFormDropOpen, setCatFormDropOpen] = useState(false);
  const [unitFormDropOpen, setUnitFormDropOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState({
    category: true,
    status: true,
    stock: true,
    price: true,
    updated: true,
  });

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    mode: "single",
    item: null,
    ids: [],
  });

  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const catRef = useRef(null);
  const columnsRef = useRef(null);
  const catFormRef = useRef(null);
  const unitFormRef = useRef(null);
  const menuButtonRefs = useRef({});

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const response = await fetch(MATERIAL_API_URL, {
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
        error.message || "Terjadi kesalahan saat mengambil data material.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (catRef.current && !catRef.current.contains(event.target)) {
        setCatDropOpen(false);
      }

      if (columnsRef.current && !columnsRef.current.contains(event.target)) {
        setColumnsOpen(false);
      }

      if (catFormRef.current && !catFormRef.current.contains(event.target)) {
        setCatFormDropOpen(false);
      }

      if (unitFormRef.current && !unitFormRef.current.contains(event.target)) {
        setUnitFormDropOpen(false);
      }

      setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  useEffect(() => {
    const isAnyModalOpen =
      isOpen || detailItem || movementItem || deleteConfirm.open;

    document.body.style.overflow = isAnyModalOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, detailItem, movementItem, deleteConfirm.open]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (deleteConfirm.open && !deleteSaving) {
        closeDeleteConfirm();
        return;
      }

      if (movementItem && !movementSaving) {
        closeMovementModal();
        return;
      }

      if (detailItem) {
        setDetailItem(null);
        return;
      }

      if (isOpen && !saving) {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [
    deleteConfirm.open,
    deleteSaving,
    movementItem,
    movementSaving,
    detailItem,
    isOpen,
    saving,
  ]);

  const categories = useMemo(() => {
    const databaseCategories = materials
      .map((item) => item.category)
      .filter(Boolean);

    return [...new Set([...DEFAULT_CATEGORIES, ...databaseCategories])];
  }, [materials]);

  const summary = useMemo(
    () => ({
      jenisMaterial: materials.length,
      totalStok: materials.reduce(
        (total, item) => total + Number(item.stock || 0),
        0,
      ),
      stokMenipis: materials.filter((material) => {
        const status = stockStatus(material.stock);
        return status === "menipis" || status === "habis";
      }).length,
      barangMasuk: materials.reduce(
        (total, item) => total + Number(item.stockIn || 0),
        0,
      ),
      barangKeluar: materials.reduce(
        (total, item) => total + Number(item.stockOut || 0),
        0,
      ),
    }),
    [materials],
  );

  const filtered = useMemo(() => {
    return materials.filter((item) => {
      const status = stockStatus(item.stock);
      const keyword = searchTerm.toLowerCase();

      const matchSearch =
        item.name.toLowerCase().includes(keyword) ||
        item.sku.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);

      const matchTab = activeTab === "all" || status === activeTab;

      const matchCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      return matchSearch && matchTab && matchCategory;
    });
  }, [materials, searchTerm, activeTab, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
    setSelected([]);
  }, [searchTerm, activeTab, categoryFilter, rowsPerPage]);

  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex =
    totalResults === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage;

  const endIndex = Math.min(startIndex + rowsPerPage, totalResults);
  const paginatedMaterials = filtered.slice(startIndex, endIndex);

  const visibleStart = totalResults === 0 ? 0 : startIndex + 1;
  const visibleEnd = endIndex;

  const isCurrentPageSelected =
    paginatedMaterials.length > 0 &&
    paginatedMaterials.every((item) => selected.includes(item.id));

  const visibleColumnCount =
    Object.values(visibleColumns).filter(Boolean).length;

  const tableColumnCount = 3 + visibleColumnCount;

  const tabCounts = useMemo(
    () => ({
      all: materials.length,
      tersedia: materials.filter(
        (material) => stockStatus(material.stock) === "tersedia",
      ).length,
      menipis: materials.filter(
        (material) => stockStatus(material.stock) === "menipis",
      ).length,
      habis: materials.filter(
        (material) => stockStatus(material.stock) === "habis",
      ).length,
    }),
    [materials],
  );

  const handleToggleColumn = (key) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExport = () => {
    const headers = [
      "Nama Material",
      "SKU",
      "Deskripsi",
      "Kategori",
      "Status",
      "Stok",
      "Satuan",
      "Harga",
      "Barang Masuk",
      "Barang Keluar",
      "Update Terakhir",
    ];

    const rows = filtered.map((item) => [
      item.name,
      item.sku,
      item.description,
      item.category,
      STATUS_CONFIG[stockStatus(item.stock)].label,
      item.stock,
      item.unit,
      item.price,
      item.stockIn,
      item.stockOut,
      formatDate(item.lastUpdated),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "stok-material.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const openAdd = () => {
    setModalMode("add");
    setSelectedId(null);
    setFormData({
      ...emptyForm,
      sku: getNextMaterialSku(materials),
    });
    setCatFormDropOpen(false);
    setUnitFormDropOpen(false);
    setErrorMsg("");
    setIsOpen(true);
  };

  const openEdit = (item) => {
    setModalMode("edit");
    setSelectedId(item.id);
    setFormData({
      name: item.name,
      description: item.description || "",
      category: item.category,
      sku: item.sku,
      stock: String(item.stock),
      unit: item.unit,
      price: String(item.price || ""),
    });
    setCatFormDropOpen(false);
    setUnitFormDropOpen(false);
    setErrorMsg("");
    setIsOpen(true);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    if (saving) return;

    setIsOpen(false);
    setFormData(emptyForm);
    setSelectedId(null);
    setCatFormDropOpen(false);
    setUnitFormDropOpen(false);
  };

  const openMovementModal = (mode, item) => {
    if (mode !== "in") return;

    setMovementMode(mode);
    setMovementItem(item);
    setMovementForm(emptyMovementForm);
    setMovementError("");
    setErrorMsg("");
    setOpenMenuId(null);
  };

  const closeMovementModal = () => {
    if (movementSaving) return;

    setMovementMode(null);
    setMovementItem(null);
    setMovementForm(emptyMovementForm);
    setMovementError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "stock" || name === "price" ? value.replace(/\D/g, "") : value,
    }));
  };

  const handleMovementChange = (event) => {
    const { name, value } = event.target;

    setMovementForm((prev) => ({
      ...prev,
      [name]: name === "quantity" ? value.replace(/\D/g, "") : value,
    }));

    if (name === "quantity") {
      setMovementError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const safeSku =
      modalMode === "add"
        ? getNextMaterialSku(materials)
        : formData.sku.trim() || getNextMaterialSku(materials);

    if (
      !formData.name.trim() ||
      !formData.category.trim() ||
      formData.stock === "" ||
      !formData.unit.trim()
    ) {
      setErrorMsg("Nama, kategori, stok, dan satuan wajib diisi.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      sku: safeSku,
      stock: Number(formData.stock),
      unit: formData.unit.trim(),
      price: Number(formData.price) || 0,
    };

    try {
      setSaving(true);
      setErrorMsg("");

      const response = await fetch(
        modalMode === "add"
          ? MATERIAL_API_URL
          : `${MATERIAL_API_URL}/${selectedId}`,
        {
          method: modalMode === "add" ? "POST" : "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan material.");
      }

      const savedMaterial = normalizeMaterial(
        result.data || result.material || result,
      );

      if (modalMode === "add") {
        setMaterials((prev) => [savedMaterial, ...prev]);
      } else {
        setMaterials((prev) =>
          prev.map((item) => (item.id === selectedId ? savedMaterial : item)),
        );

        setDetailItem((prev) =>
          prev && prev.id === selectedId ? savedMaterial : prev,
        );
      }

      closeModal();
    } catch (error) {
      setErrorMsg(
        error.message || "Terjadi kesalahan saat menyimpan material.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStockMovementSubmit = async (event) => {
    event.preventDefault();

    if (!movementItem || movementMode !== "in") return;

    const quantity = Number(movementForm.quantity || 0);

    if (quantity <= 0) {
      setMovementError("Jumlah barang masuk harus lebih dari 0.");
      return;
    }

    const currentStock = Number(movementItem.stock || 0);
    const currentStockIn = Number(movementItem.stockIn || 0);
    const currentStockOut = Number(movementItem.stockOut || 0);

    const nextStock = currentStock + quantity;
    const nextStockIn = currentStockIn + quantity;
    const nextStockOut = currentStockOut;

    const payload = {
      name: movementItem.name,
      description: movementItem.description || "",
      category: movementItem.category,
      sku: movementItem.sku,
      stock: nextStock,
      unit: movementItem.unit,
      price: Number(movementItem.price || 0),
      stockIn: nextStockIn,
      stockOut: nextStockOut,
      stock_in: nextStockIn,
      stock_out: nextStockOut,
    };

    try {
      setMovementSaving(true);
      setMovementError("");
      setErrorMsg("");

      const response = await fetch(`${MATERIAL_API_URL}/${movementItem.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan barang masuk.");
      }

      const updatedMaterial = normalizeMaterial(
        result.data ||
          result.material || {
            ...movementItem,
            stock: nextStock,
            stockIn: nextStockIn,
            stockOut: nextStockOut,
            stock_in: nextStockIn,
            stock_out: nextStockOut,
            updatedAt: new Date().toISOString(),
          },
      );

      setMaterials((prev) =>
        prev.map((item) =>
          item.id === movementItem.id ? updatedMaterial : item,
        ),
      );

      setDetailItem((prev) =>
        prev && prev.id === movementItem.id ? updatedMaterial : prev,
      );

      closeMovementModal();
    } catch (error) {
      setMovementError(
        error.message || "Terjadi kesalahan saat menyimpan barang masuk.",
      );
    } finally {
      setMovementSaving(false);
    }
  };

  const openDeleteConfirm = (item) => {
    if (!item) return;

    setDeleteConfirm({
      open: true,
      mode: "single",
      item,
      ids: [item.id],
    });

    setDeleteError("");
    setErrorMsg("");
    setOpenMenuId(null);
  };

  const openBulkDeleteConfirm = () => {
    if (!selected.length) return;

    setDeleteConfirm({
      open: true,
      mode: "bulk",
      item: null,
      ids: [...selected],
    });

    setDeleteError("");
    setErrorMsg("");
    setOpenMenuId(null);
  };

  const closeDeleteConfirm = () => {
    if (deleteSaving) return;

    setDeleteConfirm({
      open: false,
      mode: "single",
      item: null,
      ids: [],
    });

    setDeleteError("");
  };

  const handleDelete = (id) => {
    const target = materials.find((item) => item.id === id);
    openDeleteConfirm(target);
  };

  const handleBulkDelete = () => {
    openBulkDeleteConfirm();
  };

  const handleConfirmDelete = async () => {
    const idsToDelete =
      deleteConfirm.mode === "single" && deleteConfirm.item
        ? [deleteConfirm.item.id]
        : deleteConfirm.ids;

    if (!idsToDelete.length) return;

    try {
      setDeleteSaving(true);
      setDeleteError("");
      setErrorMsg("");

      await Promise.all(
        idsToDelete.map(async (id) => {
          const response = await fetch(`${MATERIAL_API_URL}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          const result = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(result.message || "Gagal menghapus material.");
          }
        }),
      );

      setMaterials((prev) =>
        prev.filter((material) => !idsToDelete.includes(material.id)),
      );

      setSelected((prev) =>
        prev.filter((selectedId) => !idsToDelete.includes(selectedId)),
      );

      setOpenMenuId(null);

      setDetailItem((prev) =>
        prev && idsToDelete.includes(prev.id) ? null : prev,
      );

      setDeleteConfirm({
        open: false,
        mode: "single",
        item: null,
        ids: [],
      });

      setDeleteError("");
    } catch (error) {
      setDeleteError(
        error.message || "Terjadi kesalahan saat menghapus material.",
      );
    } finally {
      setDeleteSaving(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const toggleAll = () => {
    const currentPageIds = paginatedMaterials.map((item) => item.id);

    if (isCurrentPageSelected) {
      setSelected((prev) => prev.filter((id) => !currentPageIds.includes(id)));
      return;
    }

    setSelected((prev) => [...new Set([...prev, ...currentPageIds])]);
  };

  const activeMenuItem = useMemo(
    () => materials.find((item) => item.id === openMenuId) || null,
    [materials, openMenuId],
  );

  const updateActionMenuPosition = (itemId) => {
    const button = menuButtonRefs.current[itemId];

    if (!button) return;

    const rect = button.getBoundingClientRect();

    const menuWidth = 180;
    const menuHeight = 238;
    const padding = 12;
    const gap = 8;

    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setOpenMenuId(null);
      return;
    }

    const safeLeft = Math.min(
      window.innerWidth - menuWidth - padding,
      Math.max(padding, rect.right - menuWidth),
    );

    let safeTop = rect.bottom + gap;

    if (safeTop + menuHeight > window.innerHeight - padding) {
      safeTop = Math.max(padding, window.innerHeight - menuHeight - padding);
    }

    setMenuPosition({
      top: safeTop,
      left: safeLeft,
    });
  };

  const toggleActionMenu = (event, itemId) => {
    event.stopPropagation();

    if (openMenuId === itemId) {
      setOpenMenuId(null);
      return;
    }

    updateActionMenuPosition(itemId);
    setOpenMenuId(itemId);
  };

  useEffect(() => {
    if (!openMenuId) return;

    const handleRepositionMenu = () => {
      updateActionMenuPosition(openMenuId);
    };

    window.addEventListener("scroll", handleRepositionMenu, true);
    window.addEventListener("resize", handleRepositionMenu);

    return () => {
      window.removeEventListener("scroll", handleRepositionMenu, true);
      window.removeEventListener("resize", handleRepositionMenu);
    };
  }, [openMenuId]);

  return (
    <div className="stok-page">
      <div className="stok-container">
        <div className="stok-header">
          <div>
            <h1>Stok Material</h1>
            <p>
              Kelola data material, stok masuk, dan stok keluar proyek interior.
            </p>
          </div>

          <button type="button" className="stok-main-btn" onClick={openAdd}>
            <FiPlus size={16} />
            Tambah Material
          </button>
        </div>

        {errorMsg && <div className="stok-error">{errorMsg}</div>}

        <div className="stok-summary-grid">
          <StatCard
            icon={<FiPackage size={18} />}
            iconClass="is-emerald"
            label="Total Stok"
            value={summary.totalStok}
            note="Akumulasi seluruh stok material"
          />

          <StatCard
            icon={<FiBox size={18} />}
            iconClass="is-blue"
            label="Jenis Material"
            value={summary.jenisMaterial}
            note="Tipe item terdaftar"
          />

          <StatCard
            icon={<FiAlertTriangle size={18} />}
            iconClass="is-amber"
            label="Stok Menipis"
            value={summary.stokMenipis}
            note="Perlu penambahan stok segera"
            noteClass="is-warning"
          />

          <StatCard
            icon={<FiArrowDownCircle size={18} />}
            iconClass="is-emerald"
            label="Total Unit Masuk"
            value={summary.barangMasuk}
            note="Kumulatif penerimaan"
          />

          <StatCard
            icon={<FiArrowUpCircle size={18} />}
            iconClass="is-red"
            label="Total Unit Keluar"
            value={summary.barangKeluar}
            note="Kumulatif pengeluaran"
          />
        </div>

        <div className="stok-card">
          <div className="stok-tabs-wrapper">
            <div className="stok-tabs">
              {TAB_KEYS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`stok-tab ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  <span>{tabCounts[tab.key]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="stok-toolbar">
            <div className="stok-search">
              <FiSearch size={14} />
              <input
                type="text"
                placeholder="Cari material..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="stok-toolbar-actions">
              <div className="stok-columns-dropdown" ref={columnsRef}>
                <button
                  type="button"
                  className={`stok-soft-btn ${columnsOpen ? "active" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setColumnsOpen((prev) => !prev);
                  }}
                >
                  <FiColumns size={13} />
                  Kolom
                </button>

                {columnsOpen && (
                  <div
                    className="stok-columns-menu"
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    {COLUMN_OPTIONS.map((column) => (
                      <label key={column.key} className="stok-column-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key]}
                          onChange={() => handleToggleColumn(column.key)}
                        />
                        <span>{column.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="stok-soft-btn"
                onClick={handleExport}
              >
                <FiDownload size={13} />
                Ekspor
              </button>

              <div className="stok-dropdown" ref={catRef}>
                <button
                  type="button"
                  className={`stok-soft-btn ${catDropOpen ? "active" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setCatDropOpen((prev) => !prev);
                  }}
                >
                  <FiTag size={13} />
                  {categoryFilter === "all" ? "Kategori" : categoryFilter}
                  <FiChevronDown
                    size={13}
                    className={catDropOpen ? "rotate" : ""}
                  />
                </button>

                {catDropOpen && (
                  <div className="stok-dropdown-menu">
                    <button
                      type="button"
                      className={categoryFilter === "all" ? "active" : ""}
                      onClick={() => {
                        setCategoryFilter("all");
                        setCatDropOpen(false);
                      }}
                    >
                      Semua Kategori
                    </button>

                    {categories.map((category) => (
                      <button
                        type="button"
                        key={category}
                        className={categoryFilter === category ? "active" : ""}
                        onClick={() => {
                          setCategoryFilter(category);
                          setCatDropOpen(false);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="stok-result-count">{filtered.length} hasil</span>
            </div>
          </div>

          <div className="stok-table-wrapper">
            <table className="stok-table">
              <thead>
                <tr>
                  <th className="stok-checkbox-col">
                    <input
                      type="checkbox"
                      checked={isCurrentPageSelected}
                      onChange={toggleAll}
                    />
                  </th>

                  <th>Material</th>

                  {visibleColumns.category && <th>Kategori</th>}
                  {visibleColumns.status && <th>Status</th>}
                  {visibleColumns.stock && <th>Stok</th>}
                  {visibleColumns.price && <th>Harga</th>}
                  {visibleColumns.updated && <th>Terakhir Diperbarui</th>}

                  <th className="stok-action-col"></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={tableColumnCount}>
                      <div className="stok-loading">
                        <div className="stok-spinner" />
                        <p>Mengambil data material...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedMaterials.length > 0 ? (
                  paginatedMaterials.map((item) => {
                    const status = stockStatus(item.stock);
                    const statusCfg = STATUS_CONFIG[status];
                    const isChecked = selected.includes(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={isChecked ? "is-selected" : ""}
                      >
                        <td className="stok-checkbox-col">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>

                        <td>
                          <div className="stok-material-cell">
                            <div className="stok-material-icon">
                              <FiPackage size={15} />
                            </div>

                            <div>
                              <strong>{item.name}</strong>
                              <span>
                                {item.sku} · {item.description || "-"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {visibleColumns.category && (
                          <td>
                            <span className="stok-category-badge">
                              {item.category || "-"}
                            </span>
                          </td>
                        )}

                        {visibleColumns.status && (
                          <td>
                            <span
                              className={`stok-status-badge ${statusCfg.badgeClass}`}
                            >
                              <i className={statusCfg.dotClass} />
                              {statusCfg.label}
                            </span>
                          </td>
                        )}

                        {visibleColumns.stock && (
                          <td>
                            <span className="stok-stock-value">
                              {item.stock}
                            </span>
                            <span className="stok-stock-unit">{item.unit}</span>
                          </td>
                        )}

                        {visibleColumns.price && (
                          <td className="stok-price">
                            {formatIDR(item.price)}
                          </td>
                        )}

                        {visibleColumns.updated && (
                          <td className="stok-date">
                            {formatDate(item.lastUpdated)}
                          </td>
                        )}

                        <td className="stok-action-col">
                          <div className="stok-action-wrap">
                            <button
                              type="button"
                              ref={(element) => {
                                if (element) {
                                  menuButtonRefs.current[item.id] = element;
                                } else {
                                  delete menuButtonRefs.current[item.id];
                                }
                              }}
                              className="stok-menu-btn"
                              onMouseDown={(event) => event.stopPropagation()}
                              onClick={(event) =>
                                toggleActionMenu(event, item.id)
                              }
                            >
                              <FiMoreHorizontal size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={tableColumnCount}>
                      <div className="stok-empty">
                        <FiPackage size={32} />
                        <p>Tidak ada material ditemukan</p>
                        <span>Coba ubah filter atau kata kunci pencarian</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="stok-table-footer">
            <div className="stok-footer-left">
              <span>
                Menampilkan {visibleStart}-{visibleEnd} dari {totalResults} data
              </span>

              {selected.length > 0 && (
                <button type="button" onClick={handleBulkDelete}>
                  Hapus {selected.length} item dipilih
                </button>
              )}
            </div>

            <div className="stok-pagination">
              <span>Baris</span>

              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>

              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Sebelumnya
              </button>

              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;

                return (
                  <button
                    key={page}
                    type="button"
                    className={safeCurrentPage === page ? "active" : ""}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeMenuItem &&
        createPortal(
          <div
            className="stok-action-menu stok-action-menu-floating"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setDetailItem(activeMenuItem);
                setOpenMenuId(null);
              }}
            >
              <FiEye size={13} />
              Detail
            </button>

            <button type="button" onClick={() => openEdit(activeMenuItem)}>
              <FiEdit2 size={13} />
              Ubah
            </button>

            <hr />

            <button
              type="button"
              className="success"
              onClick={() => openMovementModal("in", activeMenuItem)}
            >
              <FiArrowDownCircle size={13} />
              Barang Masuk
            </button>

            <hr />

            <button
              type="button"
              className="danger"
              onClick={() => handleDelete(activeMenuItem.id)}
            >
              <FiTrash2 size={13} />
              Hapus
            </button>
          </div>,
          document.body,
        )}

      {isOpen &&
        createPortal(
          <div className="stok-modal-overlay" onClick={closeModal}>
            <div
              className="stok-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="stok-modal-header">
                <div>
                  <h3>
                    {modalMode === "add"
                      ? "Tambah Material Baru"
                      : "Ubah Material"}
                  </h3>
                  <p>
                    {modalMode === "add"
                      ? "Isi data material dengan lengkap."
                      : "Perbarui data material yang tersimpan."}
                  </p>
                </div>

                <button
                  type="button"
                  className="stok-modal-close"
                  onClick={closeModal}
                  disabled={saving}
                >
                  <FiX size={17} />
                </button>
              </div>

              <form className="stok-form" onSubmit={handleSubmit}>
                <div className="stok-form-grid">
                  <FormGroup label="Nama Barang *" className="full">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Contoh: Cat Dulux"
                    />
                  </FormGroup>

                  <FormGroup label="Deskripsi" className="full">
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Deskripsi singkat material"
                    />
                  </FormGroup>

                  {/* KATEGORI — Custom Dropdown */}
                  <FormGroup label="Kategori *">
                    <div className="stok-form-dropdown" ref={catFormRef}>
                      <button
                        type="button"
                        className={`stok-form-dropdown-trigger ${catFormDropOpen ? "active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setCatFormDropOpen((prev) => !prev);
                        }}
                      >
                        <span>{formData.category || "Pilih kategori"}</span>
                        <FiChevronDown
                          size={14}
                          className={catFormDropOpen ? "rotate" : ""}
                        />
                      </button>

                      {catFormDropOpen && (
                        <div
                          className="stok-form-dropdown-menu"
                          onMouseDown={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={!formData.category ? "active" : ""}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                category: "",
                              }));
                              setCatFormDropOpen(false);
                            }}
                          >
                            Pilih kategori
                          </button>

                          {categories.map((category) => (
                            <button
                              type="button"
                              key={category}
                              className={
                                formData.category === category ? "active" : ""
                              }
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  category,
                                }));
                                setCatFormDropOpen(false);
                              }}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormGroup>

                  <FormGroup label="SKU Otomatis">
                    <input
                      type="text"
                      name="sku"
                      className="stok-sku-input"
                      value={
                        formData.sku ||
                        (modalMode === "add"
                          ? getNextMaterialSku(materials)
                          : "")
                      }
                      placeholder="MAT-001"
                      readOnly
                      tabIndex={-1}
                    />
                    <small className="stok-form-hint">
                      SKU dibuat otomatis berurutan dari MAT-001.
                    </small>
                  </FormGroup>

                  <FormGroup label="Stok Awal *">
                    <input
                      type="text"
                      name="stock"
                      value={formatNumberInput(formData.stock)}
                      onChange={handleChange}
                      placeholder="0"
                      inputMode="numeric"
                    />
                  </FormGroup>

                  {/* SATUAN — Custom Dropdown (serasi dengan Kategori) */}
                  <FormGroup label="Satuan">
                    <div className="stok-form-dropdown" ref={unitFormRef}>
                      <button
                        type="button"
                        className={`stok-form-dropdown-trigger ${unitFormDropOpen ? "active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setUnitFormDropOpen((prev) => !prev);
                        }}
                      >
                        <span>{formData.unit || "Pilih satuan"}</span>
                        <FiChevronDown
                          size={14}
                          className={unitFormDropOpen ? "rotate" : ""}
                        />
                      </button>

                      {unitFormDropOpen && (
                        <div
                          className="stok-form-dropdown-menu"
                          onMouseDown={(event) => event.stopPropagation()}
                        >
                          {[
                            "pcs",
                            "set",
                            "unit",
                            "roll",
                            "sheet",
                            "batang",
                            "m1",
                            "m2",
                            "sak",
                            "liter",
                            "kg",
                            "lbr",
                          ].map((unit) => (
                            <button
                              type="button"
                              key={unit}
                              className={formData.unit === unit ? "active" : ""}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, unit }));
                                setUnitFormDropOpen(false);
                              }}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormGroup>

                  <FormGroup label="Harga Satuan (IDR)" className="full">
                    <input
                      type="text"
                      name="price"
                      className="stok-money-input"
                      value={formatNumberInput(formData.price)}
                      onChange={handleChange}
                      placeholder="0"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  </FormGroup>
                </div>

                <div className="stok-modal-actions">
                  <button
                    type="button"
                    className="stok-cancel-btn"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="stok-save-btn"
                    disabled={saving}
                  >
                    {saving
                      ? "Menyimpan..."
                      : modalMode === "add"
                        ? "Simpan Material"
                        : "Perbarui Material"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {movementItem &&
        createPortal(
          <div className="stok-modal-overlay" onClick={closeMovementModal}>
            <div
              className="stok-movement-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="stok-modal-header">
                <div>
                  <h3>Barang Masuk</h3>
                  <p>{movementItem.name}</p>
                </div>

                <button
                  type="button"
                  className="stok-modal-close"
                  onClick={closeMovementModal}
                  disabled={movementSaving}
                >
                  <FiX size={17} />
                </button>
              </div>

              <form className="stok-form" onSubmit={handleStockMovementSubmit}>
                <div className="stok-movement-info">
                  <span>Stok saat ini</span>
                  <strong>
                    {movementItem.stock} {movementItem.unit}
                  </strong>
                </div>

                {movementError && (
                  <div className="stok-modal-inline-error">{movementError}</div>
                )}

                <FormGroup label="Jumlah Barang Masuk *" className="full">
                  <input
                    type="text"
                    name="quantity"
                    value={formatNumberInput(movementForm.quantity)}
                    onChange={handleMovementChange}
                    placeholder="0"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </FormGroup>

                <FormGroup label="Catatan" className="full">
                  <textarea
                    name="note"
                    value={movementForm.note}
                    onChange={handleMovementChange}
                    placeholder="Contoh: pembelian material / digunakan untuk proyek..."
                    rows={3}
                  />
                </FormGroup>

                <div className="stok-modal-actions">
                  <button
                    type="button"
                    className="stok-cancel-btn"
                    onClick={closeMovementModal}
                    disabled={movementSaving}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="stok-save-btn"
                    disabled={movementSaving}
                  >
                    {movementSaving ? "Menyimpan..." : "Simpan Barang Masuk"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {detailItem &&
        createPortal(
          <div
            className="stok-modal-overlay"
            onClick={() => setDetailItem(null)}
          >
            <div
              className="stok-detail-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="stok-modal-header">
                <div>
                  <h3>Detail Material</h3>
                  <p>Informasi lengkap material yang dipilih.</p>
                </div>

                <button
                  type="button"
                  className="stok-modal-close"
                  onClick={() => setDetailItem(null)}
                >
                  <FiX size={17} />
                </button>
              </div>

              <div className="stok-detail-body">
                <div className="stok-detail-product">
                  <div className="stok-detail-icon">
                    <FiPackage size={20} />
                  </div>

                  <div>
                    <strong>{detailItem.name}</strong>
                    <span>{detailItem.sku}</span>
                  </div>
                </div>

                <DetailRow
                  label="Deskripsi"
                  value={detailItem.description || "-"}
                />
                <DetailRow
                  label="Kategori"
                  value={detailItem.category || "-"}
                />
                <DetailRow
                  label="Stok Saat Ini"
                  value={`${detailItem.stock} ${detailItem.unit}`}
                />
                <DetailRow
                  label="Barang Masuk"
                  value={`${detailItem.stockIn || 0} ${detailItem.unit}`}
                />
                <DetailRow
                  label="Barang Keluar"
                  value={`${detailItem.stockOut || 0} ${detailItem.unit}`}
                />
                <DetailRow
                  label="Status"
                  value={STATUS_CONFIG[stockStatus(detailItem.stock)].label}
                />
                <DetailRow
                  label="Harga Satuan"
                  value={formatIDR(detailItem.price)}
                />
                <DetailRow
                  label="Update Terakhir"
                  value={formatDate(detailItem.lastUpdated)}
                />
              </div>

              <div className="stok-detail-actions">
                <button
                  type="button"
                  className="stok-cancel-btn"
                  onClick={() => {
                    openEdit(detailItem);
                    setDetailItem(null);
                  }}
                >
                  Ubah Material
                </button>

                <button
                  type="button"
                  className="stok-dark-btn"
                  onClick={() => setDetailItem(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {deleteConfirm.open &&
        createPortal(
          <div
            className="stok-delete-modal-overlay"
            onClick={closeDeleteConfirm}
            role="presentation"
          >
            <div
              className="stok-delete-modal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-material-title"
            >
              <button
                type="button"
                className="stok-delete-modal-close"
                onClick={closeDeleteConfirm}
                disabled={deleteSaving}
                aria-label="Tutup modal"
              >
                <FiX size={21} />
              </button>

              <h3 id="delete-material-title">
                {deleteConfirm.mode === "bulk"
                  ? "Hapus Material"
                  : "Hapus Material"}
              </h3>

              <p>
                {deleteConfirm.mode === "bulk" ? (
                  <>
                    Apakah Anda yakin ingin menghapus{" "}
                    <strong>{deleteConfirm.ids.length}</strong> material yang
                    dipilih?
                  </>
                ) : (
                  <>
                    Apakah Anda yakin ingin menghapus material yang dipilih?{" "}
                    <strong>{deleteConfirm.item?.name}</strong>?
                  </>
                )}
              </p>

              {deleteError && (
                <div className="stok-delete-modal-error">{deleteError}</div>
              )}

              <div className="stok-delete-modal-actions">
                <button
                  type="button"
                  className="stok-delete-cancel-btn"
                  onClick={closeDeleteConfirm}
                  disabled={deleteSaving}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="stok-delete-danger-btn"
                  onClick={handleConfirmDelete}
                  disabled={deleteSaving}
                >
                  {deleteSaving ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function StatCard({ icon, iconClass, label, value, note, noteClass = "" }) {
  return (
    <div className="stok-stat-card">
      <div className="stok-stat-top">
        <span>{label}</span>

        <div className={`stok-stat-icon ${iconClass}`}>{icon}</div>
      </div>

      <h2>{value}</h2>
      <p className={noteClass}>{note}</p>
    </div>
  );
}

function FormGroup({ label, className = "", children }) {
  return (
    <div className={`stok-form-group ${className}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="stok-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
