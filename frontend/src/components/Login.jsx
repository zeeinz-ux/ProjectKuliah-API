import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { login } from "../api/authApi";
import "../css/Login.css";
import logoMedtic from "../assets/logo.svg";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "PM" },
  { value: "finance", label: "Finance" },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterLogin = (() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");
    if (!redirect) return "";
    try {
      const d = decodeURIComponent(redirect);
      if (d.startsWith("/admin") || d.startsWith("/profile") || d.startsWith("/settings")) return d;
    } catch {}
    return "";
  })();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await login(email, password, role);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-user-updated"));
      setSuccess("Login berhasil. Mengalihkan...");
      setTimeout(() => navigate(redirectAfterLogin || data.redirectTo || "/admin", { replace: true }), 1000);
    } catch (err) {
      setError(err.message || "Login gagal.");
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
            <span className="auth-label">Masuk</span>
            <h1 className="auth-title">Selamat Datang Kembali</h1>
            <p className="auth-subtitle">Silakan masuk menggunakan akun yang sudah terdaftar</p>
          </div>

          {error && <div className="auth-alert auth-alert--error">{error}</div>}
          {success && <div className="auth-alert auth-alert--success">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Masukkan email" autoComplete="username" required />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Kata Sandi</label>
              <div className="auth-password-wrap">
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" autoComplete="current-password" required />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((p) => !p)} tabIndex={-1}>
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Role</label>
              <div className="auth-role-group">
                {ROLE_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" className={`auth-role-btn${role === opt.value ? " is-active" : ""}`} onClick={() => setRole(opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-forgot-wrap">
              <Link to="/forgot-password" className="auth-forgot-link">Lupa kata sandi?</Link>
            </div>

            <button type="submit" disabled={loading || !role} className="auth-submit">
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="auth-footer">
            Belum memiliki akun? <Link to="/register" className="auth-footer-link">Daftar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
