// src/components/GoogleLoginButton.jsx
import { useEffect, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3333";

export default function GoogleLoginButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID belum di-set di .env");
      return;
    }

    function initGoogle() {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const res = await fetch(`${API_BASE_URL}/google-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: response.credential }),
            });

            const data = await res.json();
            console.log("Google login response:", data);

            if (!res.ok) {
              throw new Error(data.message || "Login Google gagal");
            }

            // Backend mengirim token untuk sukses, bukan success field
            if (data.token || data.data?.token) {
              onSuccess?.(data);
            } else {
              throw new Error(data.message || "Login Google gagal");
            }
          } catch (err) {
            console.error("Google login error:", err);
            onError?.(err);
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 300,
      });
    }

    // load script kalau belum ada
    if (!window.google?.accounts?.id) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }
  }, [clientId, onSuccess, onError]);

  return (
    <div
      ref={buttonRef}
      style={{ display: "flex", justifyContent: "center" }}
    />
  );
}
