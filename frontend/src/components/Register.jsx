import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/authApi";
import "../css/Register.css";
import logoMedtic from "../assets/logo.svg";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "finance", label: "Finance" },
];

const DEPARTEMEN_OPTIONS = [
  { value: "Super User", label: "Super User" },
  { value: "Operator Data", label: "Operator Data" },
  { value: "Accounting", label: "Accounting" },
];

const INITIAL_FORM = {
  full_name: "",
  email: "",
  password: "",
  role: "",
  departemen: "",
};

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error || success) {
      resetMessages();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const payload = {
        ...form,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
      };

      const data = await register(payload);

      setSuccess(data.message || "Registrasi berhasil. Silakan login.");
      setForm(INITIAL_FORM);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat registrasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-wrapper">
        <div className="register-card">
          <div className="register-brand-block">
            <img
              src={logoMedtic}
              alt="Logo Medtic Indonesia"
              className="register-company-logo"
            />
            <h2 className="register-company-name">Medtic Indonesia</h2>
          </div>

          <div className="register-header">
            <p className="register-label">Pendaftaran</p>
            <h1 className="register-title">Buat Akun</h1>
            <p className="register-subtitle">
              Silakan lengkapi data untuk membuat akun baru
            </p>
          </div>

          {error && (
            <div className="register-alert register-alert-error">{error}</div>
          )}

          {success && (
            <div className="register-alert register-alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-field">
              <label htmlFor="full_name">Nama Lengkap</label>
              <input
                id="full_name"
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                autoComplete="name"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Masukkan email"
                autoComplete="email"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="password">Kata Sandi</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Masukkan kata sandi"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="">Pilih role</option>
                {ROLE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="register-field">
              <label htmlFor="departemen">Departemen</label>
              <select
                id="departemen"
                name="departemen"
                value={form.departemen}
                onChange={handleChange}
                required
              >
                <option value="">Pilih departemen</option>
                {DEPARTEMEN_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className={`register-submit-btn ${loading ? "is-loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </form>

          <p className="register-footer-text">
            Sudah punya akun?{" "}
            <Link to="/login" className="register-footer-link">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
