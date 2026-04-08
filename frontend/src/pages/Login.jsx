import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import GoogleLoginButton from "../components/GoogleLoginButton";
import "../css/Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = (data) => {
    localStorage.setItem("user", JSON.stringify(data.user));

    if (data.user?.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token, user } = await login(email, password);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Login gagal. Periksa email dan password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-layout">
          <div className="login-image-panel">
            <img
              src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80"
              alt="Interior modern"
              className="login-side-image"
            />
          </div>

          <div className="login-form-panel">
            <div className="login-brand">Medtic Indonesia</div>

            <div className="login-card">
              <div className="login-header">
                <p className="login-label">Masuk</p>
                <h1 className="login-title">Welcome back</h1>
                <p className="login-subtitle">Please enter your details</p>
              </div>

              {error && <div className="login-error">{error}</div>}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="login-field">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                  />
                </div>

                <div className="login-field">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                  />
                </div>

                <div className="login-forgot-wrap">
                  <Link to="/forgot-password" className="login-forgot-link">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`login-submit-btn ${
                    loading ? "login-submit-disabled" : ""
                  }`}
                >
                  {loading ? "Memproses..." : "Sign in"}
                </button>
              </form>

              <div className="login-divider">
                <span></span>
                <small>atau</small>
                <span></span>
              </div>

              <div className="login-google-wrap">
                <GoogleLoginButton
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google login gagal")}
                />
              </div>

              <p className="login-footer-text">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="login-footer-link">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
