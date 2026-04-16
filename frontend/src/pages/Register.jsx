// src/pages/Register.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/authApi";
import "../css/Register.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { token, user } = await register(fullName, email, password);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setSuccess("Pendaftaran berhasil! Mengalihkan ke dashboard...");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Pendaftaran gagal. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <p className="register-subtitle">Daftar</p>
            <h1 className="register-title">Buat akun baru</h1>
            <p className="register-desc">Silakan isi data untuk membuat akun</p>
          </div>

          {error && <div className="register-alert error-alert">{error}</div>}

          {success && (
            <div className="register-alert success-alert">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="fullName">Nama lengkap</label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Fullstack Plenger"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh@gmail.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Kata sandi</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`register-button ${loading ? "loading" : ""}`}
            >
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <p className="register-footer-text">
            Sudah punya akun?{" "}
            <Link to="/login" className="register-link">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
