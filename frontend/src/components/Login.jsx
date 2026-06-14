import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import "../css/Login.css";
import logoMedtic from "../assets/logo.svg";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "finance", label: "Finance" },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterLogin = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");

    if (!redirect) return "";

    try {
      const decodedRedirect = decodeURIComponent(redirect);

      if (
        decodedRedirect.startsWith("/admin") ||
        decodedRedirect.startsWith("/profile") ||
        decodedRedirect.startsWith("/settings")
      ) {
        return decodedRedirect;
      }

      return "";
    } catch (error) {
      return "";
    }
  }, [location.search]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const saveAuthToLocalStorage = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await login(email, password, role);

      saveAuthToLocalStorage(data.token, data.user);

      setSuccess("Login berhasil. Mengalihkan ke dashboard...");

      setTimeout(() => {
        navigate(redirectAfterLogin || data.redirectTo || "/admin", {
          replace: true,
        });
      }, 1000);
    } catch (err) {
      setError(
        err.message ||
          "Login gagal. Periksa email, kata sandi, dan peran akun.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-brand-block">
            <img
              src={logoMedtic}
              alt="Logo Medtic Indonesia"
              className="login-company-logo"
            />
            <h2 className="login-company-name">Medtic Indonesia</h2>
          </div>

          <div className="login-header">
            <p className="login-label">Masuk</p>
            <h1 className="login-title">Selamat Datang Kembali</h1>
            <p className="login-subtitle">
              Silakan masuk menggunakan akun yang sudah terdaftar
            </p>
          </div>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Kata Sandi</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
              />
            </div>

            <div className="login-field">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="" disabled>
                  Pilih role
                </option>

                {ROLE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="login-forgot-wrap">
              <Link to="/forgot-password" className="login-forgot-link">
                Lupa kata sandi?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`login-submit-btn ${
                loading ? "login-submit-disabled" : ""
              }`}
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="login-footer-text">
            Belum memiliki akun?{" "}
            <Link to="/register" className="login-footer-link">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
