import { useEffect, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export default function GoogleLoginButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID belum di-set di .env");
      return;
    }

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const res = await fetch(`${API_BASE_URL}/google-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: response.credential }),
            });

            const data = await res.json().catch(() => ({}));
            console.log("Google login response:", data);

            if (!res.ok) {
              throw new Error(data.message || "Login Google gagal");
            }

            if (!data.token || !data.user) {
              throw new Error("Response Google login tidak valid");
            }

            onSuccess?.(data);
          } catch (err) {
            console.error("Google login error:", err);
            onError?.(err);
          }
        },
      });

      buttonRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
      });
    };

    if (!window.google?.accounts?.id) {
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", initGoogle);
        return () => existingScript.removeEventListener("load", initGoogle);
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);

      return () => {
        script.onload = null;
      };
    } else {
      initGoogle();
    }
  }, [clientId, onSuccess, onError]);

  return (
    <div
      ref={buttonRef}
      style={{ width: "100%", display: "flex", justifyContent: "center" }}
    />
  );
}