import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/ResetPassword.css";
import logoMedtic from "../assets/logo.svg";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3333";

function ResetPassword() {
  const location = useLocation();

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token") || "";
  }, [location.search]);

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!token) {
      setErrorMsg("Token reset password tidak ditemukan di URL.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi baru minimal harus 6 karakter.");
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMsg("Konfirmasi kata sandi tidak sama.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Gagal mereset password.");
      }

      setSuccessMsg(
        data.message ||
          "Kata sandi berhasil direset. Silakan masuk dengan kata sandi baru.",
      );

      setPassword("");
      setPasswordConfirmation("");
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <div className="reset-brand-block">
          <img
            src={logoMedtic}
            alt="Logo Medtic Indonesia"
            className="reset-company-logo"
          />
        </div>

        <h1 className="reset-title">Atur Ulang Kata Sandi</h1>
        <p className="reset-subtitle">
          Masukkan kata sandi baru untuk akun Anda. Token reset akan dibaca
          secara otomatis dari URL.
        </p>

        {!token && (
          <div className="reset-alert reset-alert-error">
            Token reset password tidak ditemukan. Pastikan kamu membuka link
            reset yang benar.
          </div>
        )}

        {errorMsg && (
          <div className="reset-alert reset-alert-error">{errorMsg}</div>
        )}

        {successMsg && (
          <div className="reset-alert reset-alert-success">
            <p>{successMsg}</p>
            <Link to="/login" className="reset-login-link">
              Kembali ke Halaman Masuk
            </Link>
          </div>
        )}

        <form className="reset-form" onSubmit={handleSubmit}>
          <div className="reset-form-group">
            <label htmlFor="password" className="reset-label">
              Kata Sandi Baru
            </label>
            <input
              id="password"
              type="password"
              className="reset-input"
              placeholder="Masukkan kata sandi baru"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg || successMsg) clearMessages();
              }}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="reset-form-group">
            <label htmlFor="passwordConfirmation" className="reset-label">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              id="passwordConfirmation"
              type="password"
              className="reset-input"
              placeholder="Ulangi kata sandi baru"
              value={passwordConfirmation}
              onChange={(e) => {
                setPasswordConfirmation(e.target.value);
                if (errorMsg || successMsg) clearMessages();
              }}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="reset-button"
            disabled={loading || !token}
          >
            {loading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
          </button>
        </form>

        <div className="reset-footer">
          <Link to="/login" className="reset-back-link">
            ← Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
