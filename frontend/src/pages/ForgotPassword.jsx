import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3333"}/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Gagal mengirim permintaan reset password.",
        );
      }

      setSuccessMsg(
        data.message ||
          "Jika email terdaftar, link reset password akan dikirim.",
      );

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
        <div className="forgot-badge">Medtic Interior</div>

        <h1 className="forgot-title">Forgot Password</h1>
        <p className="forgot-subtitle">
          Masukkan email akun kamu untuk menerima link reset password.
        </p>

        {errorMsg && (
          <div className="forgot-alert forgot-alert-error">{errorMsg}</div>
        )}

        {successMsg && (
          <div className="forgot-alert forgot-alert-success">
            <p>{successMsg}</p>
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
              placeholder="Masukkan email kamu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="forgot-button" disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>
        </form>

        <div className="forgot-footer">
          <Link to="/login" className="forgot-back-link">
            ← Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
