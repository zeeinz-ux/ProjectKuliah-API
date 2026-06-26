import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { register } from "../api/authApi";
import "../css/Login.css";
import logoMedtic from "../assets/logo.svg";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "PM" },
  { value: "finance", label: "Finance" },
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const roleMap = { admin: "Super User", project_manager: "Operator Data", finance: "Keuangan" };
    const dept = roleMap[form.role];
    if (dept) setForm((prev) => ({ ...prev, departemen: dept }));
  }, [form.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error || success) { setError(""); setSuccess(""); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await register({ ...form, full_name: form.full_name.trim(), email: form.email.trim() });
      setSuccess(data.message || "Registrasi berhasil. Silakan login.");
      setForm(INITIAL_FORM);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat registrasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-brand">
            <img src={logoMedtic} alt="Logo" className="auth-logo" />
            <h2 className="auth-brand-name">Medtic Indonesia</h2>
          </div>

          <div className="auth-header">
            <span className="auth-label">Pendaftaran</span>
            <h1 className="auth-title">Buat Akun</h1>
            <p className="auth-subtitle">Silakan lengkapi data untuk membuat akun baru</p>
          </div>

          {error && <div className="auth-alert auth-alert--error">{error}</div>}
          {success && <div className="auth-alert auth-alert--success">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="full_name">Nama Lengkap</label>
              <input id="full_name" type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Masukkan nama lengkap" autoComplete="name" required />
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Masukkan email" autoComplete="email" required />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Kata Sandi</label>
              <div className="auth-password-wrap">
                <input id="password" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Masukkan kata sandi" autoComplete="new-password" minLength={6} required />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((p) => !p)} tabIndex={-1}>
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Role</label>
              <div className="auth-role-group">
                {ROLE_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" className={`auth-role-btn${form.role === opt.value ? " is-active" : ""}`} onClick={() => setForm((prev) => ({ ...prev, role: opt.value }))}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="departemen">Departemen</label>
              <input id="departemen" type="text" value={form.departemen || "-"} className="auth-input-readonly" readOnly />
            </div>

            <button type="submit" disabled={loading || !form.role} className="auth-submit">
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </form>

          <p className="auth-footer">
            Sudah punya akun? <Link to="/login" className="auth-footer-link">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
