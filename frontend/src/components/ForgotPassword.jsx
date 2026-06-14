import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/ForgotPassword.css";
import logoMedtic from "../assets/logo.svg";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3333";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setResetUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    clearMessages();

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Gagal membuat tautan reset kata sandi.",
        );
      }

      const generatedResetUrl = data.resetUrl || data.reset_url || "";

      setSuccessMsg(data.message || "Tautan reset kata sandi berhasil dibuat.");
      setResetUrl(generatedResetUrl);
      setEmail("");
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <div className="forgot-brand-block">
          <img
            src={logoMedtic}
            alt="Logo Medtic Indonesia"
            className="forgot-company-logo"
          />
        </div>

        <h1 className="forgot-title">Lupa Kata Sandi</h1>
        <p className="forgot-subtitle">
          Masukkan email akun Anda untuk membuat tautan reset kata sandi.
        </p>

        {errorMsg && (
          <div className="forgot-alert forgot-alert-error">{errorMsg}</div>
        )}

        {successMsg && (
          <div className="forgot-alert forgot-alert-success">
            <p>{successMsg}</p>

            {resetUrl ? (
              <a href={resetUrl} className="forgot-reset-action">
                Buka Halaman Reset Kata Sandi
              </a>
            ) : (
              <p className="forgot-reset-link-warning">
                Tautan reset kata sandi belum diterima dari server.
              </p>
            )}
          </div>
        )}

        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="forgot-form-group">
            <label htmlFor="email" className="forgot-label">
              Email
            </label>

            <input
              id="email"
              type="email"
              className="forgot-input"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                if (errorMsg || successMsg || resetUrl) {
                  clearMessages();
                }
              }}
              autoComplete="email"
              required
            />
          </div>

          <button type="submit" className="forgot-button" disabled={loading}>
            {loading ? "Membuat tautan..." : "Buat Tautan Reset"}
          </button>
        </form>

        <div className="forgot-footer">
          <Link to="/login" className="forgot-back-link">
            ← Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
