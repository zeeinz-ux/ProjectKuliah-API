import React from "react";
import "../css/Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-small">
      <div className="footer-small-container">
        <p>© {currentYear} PT. Medtic Indonesia. All rights reserved.</p>
        <span className="footer-small-status">Online</span>
      </div>
    </footer>
  );
}
