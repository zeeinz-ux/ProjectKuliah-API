import { useState } from "react";
import { Link } from "react-router-dom";
import "../css/Login.css";
import logoMedtic from "../assets/logo.svg";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3333";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Gagal membuat tautan reset.");
      setSuccess(data.message || "Tautan reset kata sandi berhasil dikirim.");
      setEmail("");
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
            <h1 className="auth-title">Lupa Kata Sandi</h1>
            <p className="auth-subtitle">Masukkan email akun Anda untuk menerima tautan reset kata sandi.</p>
          </div>

          {error && <div className="auth-alert auth-alert--error">{error}</div>}
          {success && <div className="auth-alert auth-alert--success">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (error || success) { setError(""); setSuccess(""); } }} placeholder="Masukkan email" autoComplete="email" required />
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Mengirim..." : "Kirim Tautan Reset"}
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
