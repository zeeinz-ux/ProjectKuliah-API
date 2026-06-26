import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "../css/Login.css";
import logoMedtic from "../assets/logo.svg";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3333";

export default function ResetPassword() {
  const location = useLocation();
  const token = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!token) { setError("Token reset tidak ditemukan."); return; }
    if (password.length < 6) { setError("Kata sandi minimal 6 karakter."); return; }
    if (password !== passwordConfirmation) { setError("Konfirmasi kata sandi tidak sama."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, password_confirmation: passwordConfirmation }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Gagal mereset password.");
      setSuccess(data.message || "Kata sandi berhasil direset.");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
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
            <span className="auth-label">Reset Kata Sandi</span>
            <h1 className="auth-title">Atur Ulang Kata Sandi</h1>
            <p className="auth-subtitle">Masukkan kata sandi baru untuk akun Anda.</p>
          </div>

          {!token && <div className="auth-alert auth-alert--error">Token reset tidak valid. Periksa link yang Anda buka.</div>}
          {error && <div className="auth-alert auth-alert--error">{error}</div>}
          {success && (
            <div className="auth-alert auth-alert--success">
              <p>{success}</p>
              <Link to="/login" className="auth-footer-link" style={{ display: "inline-block", marginTop: 10 }}>Kembali ke Halaman Masuk</Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="password">Kata Sandi Baru</label>
              <div className="auth-password-wrap">
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); if (error || success) { setError(""); setSuccess(""); } }} placeholder="Masukkan kata sandi baru" autoComplete="new-password" required />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((p) => !p)} tabIndex={-1}>
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="passwordConfirmation">Konfirmasi Kata Sandi Baru</label>
              <div className="auth-password-wrap">
                <input id="passwordConfirmation" type={showPassword ? "text" : "password"} value={passwordConfirmation} onChange={(e) => { setPasswordConfirmation(e.target.value); if (error || success) { setError(""); setSuccess(""); } }} placeholder="Ulangi kata sandi baru" autoComplete="new-password" required />
              </div>
            </div>

            <button type="submit" disabled={loading || !token} className="auth-submit">
              {loading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="auth-footer-link">← Kembali ke Halaman Masuk</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
