import React, { useMemo, useState } from "react";
import "../css/StokMaterial.css";

// Data dummy awal
const initialMaterials = [
  {
    id: 1,
    name: "Cat Dulux Weathershield",
    category: "Finishing",
    sku: "MAT-001",
    stock: 24,
    unit: "pcs",
  },
  {
    id: 2,
    name: "HPL Taco Oak Brown",
    category: "Panel",
    sku: "MAT-002",
    stock: 8,
    unit: "lembar",
  },
  {
    id: 3,
    name: "Semen Tiga Roda",
    category: "Struktur",
    sku: "MAT-003",
    stock: 40,
    unit: "sak",
  },
  {
    id: 4,
    name: "Keramik Roman 60x60",
    category: "Flooring",
    sku: "MAT-004",
    stock: 12,
    unit: "box",
  },
  {
    id: 5,
    name: "Lampu Downlight LED",
    category: "Electrical",
    sku: "MAT-005",
    stock: 5,
    unit: "pcs",
  },
  {
    id: 6,
    name: "Multiplek 18mm",
    category: "Panel",
    sku: "MAT-006",
    stock: 17,
    unit: "lembar",
  },
];

const emptyForm = {
  name: "",
  category: "",
  sku: "",
  stock: "",
  unit: "pcs",
};

function StokMaterial() {
  const [materials, setMaterials] = useState(initialMaterials);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add | edit
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  // Ambil daftar kategori unik untuk dropdown
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(materials.map((item) => item.category)),
    ];
    return ["Semua", ...uniqueCategories];
  }, [materials]);

  // Filter pencarian + kategori
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        selectedCategory === "Semua" || item.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [materials, searchTerm, selectedCategory]);

  // Ringkasan kartu statistik
  const summary = useMemo(() => {
    const totalBarang = materials.length;
    const stokMenipis = materials.filter((item) => item.stock <= 10).length;

    // Dummy statis untuk kebutuhan tampilan dashboard
    const barangMasuk = 38;
    const barangKeluar = 21;

    return {
      totalBarang,
      stokMenipis,
      barangMasuk,
      barangKeluar,
    };
  }, [materials]);

  // Buka modal tambah barang
  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedId(null);
    setFormData(emptyForm);
    setIsOpen(true);
  };

  // Buka modal edit barang
  const handleOpenEditModal = (item) => {
    setModalMode("edit");
    setSelectedId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      stock: item.stock,
      unit: item.unit,
    });
    setIsOpen(true);
  };

  // Tutup modal
  const handleCloseModal = () => {
    setIsOpen(false);
    setFormData(emptyForm);
    setSelectedId(null);
  };

  // Handle perubahan input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "stock" ? value.replace(/\D/g, "") : value,
    }));
  };

  // Submit form tambah / edit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.category.trim() ||
      !formData.sku.trim() ||
      formData.stock === "" ||
      !formData.unit.trim()
    ) {
      alert("Semua field wajib diisi.");
      return;
    }

    if (modalMode === "add") {
      const newItem = {
        id: Date.now(),
        name: formData.name,
        category: formData.category,
        sku: formData.sku,
        stock: Number(formData.stock),
        unit: formData.unit,
      };

      setMaterials((prev) => [newItem, ...prev]);
    } else {
      setMaterials((prev) =>
        prev.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                name: formData.name,
                category: formData.category,
                sku: formData.sku,
                stock: Number(formData.stock),
                unit: formData.unit,
              }
            : item,
        ),
      );
    }

    handleCloseModal();
  };

  // Hapus data
  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus barang ini?");
    if (!confirmDelete) return;

    setMaterials((prev) => prev.filter((item) => item.id !== id));
  };

  // Stock masuk / keluar sederhana
  const handleStockChange = (id, amount) => {
    setMaterials((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stock: Math.max(0, item.stock + amount),
            }
          : item,
      ),
    );
  };

  // Status stok untuk badge
  const getStockStatus = (stock) => {
    if (stock <= 5) return "critical";
    if (stock <= 10) return "warning";
    return "safe";
  };

  return (
    <div className="material-stock-page">
      {/* Header halaman */}
      <div className="material-stock-header card">
        <div>
          <p className="material-stock-eyebrow">Inventory Management</p>
          <h1>Stok Material</h1>
          <p className="material-stock-subtitle">
            Kelola data material, stok masuk, dan stok keluar proyek interior.
          </p>
        </div>

        <button className="primary-btn" onClick={handleOpenAddModal}>
          + Tambah Barang
        </button>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="summary-card card">
          <div className="summary-top">
            <span className="summary-label">Total Barang</span>
            <span className="summary-icon">📦</span>
          </div>
          <h2>{summary.totalBarang}</h2>
          <p className="summary-note positive">+ Data material terdaftar</p>
        </div>

        <div className="summary-card card">
          <div className="summary-top">
            <span className="summary-label">Stok Menipis</span>
            <span className="summary-icon warning-bg">⚠️</span>
          </div>
          <h2>{summary.stokMenipis}</h2>
          <p className="summary-note negative">Perlu restock segera</p>
        </div>

        <div className="summary-card card">
          <div className="summary-top">
            <span className="summary-label">Barang Masuk</span>
            <span className="summary-icon success-bg">⬇</span>
          </div>
          <h2>{summary.barangMasuk}</h2>
          <p className="summary-note positive">Bulan ini</p>
        </div>

        <div className="summary-card card">
          <div className="summary-top">
            <span className="summary-label">Barang Keluar</span>
            <span className="summary-icon danger-bg">⬆</span>
          </div>
          <h2>{summary.barangKeluar}</h2>
          <p className="summary-note negative">Bulan ini</p>
        </div>
      </div>

      {/* Filter dan search */}
      <div className="filter-bar card">
        <div className="filter-left">
          <input
            type="text"
            placeholder="Cari nama barang atau SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-right">
          <span className="result-count">
            Menampilkan <strong>{filteredMaterials.length}</strong> data
          </span>
        </div>
      </div>

      {/* Tabel data */}
      <div className="table-card card">
        <div className="table-header">
          <div>
            <h3>Daftar Material</h3>
            <p>Data stok material untuk kebutuhan proyek interior</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="material-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>SKU</th>
                <th>Stok Saat Ini</th>
                <th>Satuan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="material-name-cell">
                        <strong>{item.name}</strong>
                        <span
                          className={`stock-badge ${getStockStatus(item.stock)}`}
                        >
                          {item.stock <= 5
                            ? "Kritis"
                            : item.stock <= 10
                              ? "Menipis"
                              : "Aman"}
                        </span>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.sku}</td>
                    <td>{item.stock}</td>
                    <td>{item.unit}</td>
                    <td>
                      <div className="action-group">
                        <button
                          className="table-btn edit-btn"
                          onClick={() => handleOpenEditModal(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="table-btn delete-btn"
                          onClick={() => handleDelete(item.id)}
                        >
                          Hapus
                        </button>

                        <button
                          className="table-btn stock-in-btn"
                          onClick={() => handleStockChange(item.id, 1)}
                        >
                          + Masuk
                        </button>

                        <button
                          className="table-btn stock-out-btn"
                          onClick={() => handleStockChange(item.id, -1)}
                        >
                          - Keluar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      Tidak ada data material yang sesuai dengan pencarian.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tambah / edit barang */}
      {isOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>
                  {modalMode === "add" ? "Tambah Barang Baru" : "Edit Barang"}
                </h3>
                <p>Isi data material dengan lengkap.</p>
              </div>

              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <form className="material-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nama Barang</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh: Cat Dulux"
                  />
                </div>

                <div className="form-group">
                  <label>Kategori</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Contoh: Finishing"
                  />
                </div>

                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Contoh: MAT-007"
                  />
                </div>

                <div className="form-group">
                  <label>Stok Awal</label>
                  <input
                    type="text"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="Contoh: 20"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Satuan</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                  >
                    <option value="pcs">pcs</option>
                    <option value="m2">m2</option>
                    <option value="lembar">lembar</option>
                    <option value="box">box</option>
                    <option value="sak">sak</option>
                    <option value="roll">roll</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleCloseModal}
                >
                  Batal
                </button>
                <button type="submit" className="primary-btn">
                  {modalMode === "add" ? "Simpan Barang" : "Update Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StokMaterial;
