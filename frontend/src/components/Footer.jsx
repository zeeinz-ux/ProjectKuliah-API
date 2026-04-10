import React from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import { SiGooglemaps, SiTiktok } from "react-icons/si";
import "../css/Footer.css";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Gallery", to: "/gallery" },
  { label: "Profile", to: "/profile" },
  { label: "Login", to: "/login" },
];

const contactLinks = [
  {
    label: "WhatsApp",
    href: "https://wa.me/6282261289602",
    icon: <FaWhatsapp />,
    className: "is-whatsapp",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/medtic_ind",
    icon: <FaInstagram />,
    className: "is-instagram",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@medtic.indonesia?_r=1&_t=ZS-95O5RxCsZRB",
    icon: <SiTiktok />,
    className: "is-tiktok",
  },
  {
    label: "Maps",
    href: "https://maps.app.goo.gl/4M41Hnkq7XEJAukZ6",
    icon: <SiGooglemaps />,
    className: "is-maps",
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <h2>PT. Medtic Indonesia</h2>
            <p>
              Sistem monitoring project interior yang membantu perusahaan
              mengelola progres pekerjaan, material, tim, dan laporan proyek
              secara lebih rapi, modern, dan terstruktur.
            </p>
          </div>

          <div className="footer-nav">
            <h3>Navigasi</h3>
            <div className="footer-link-list">
              {footerLinks.map((item) => (
                <Link key={item.label} to={item.to} className="footer-link">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="footer-contact">
            <h3>Kontak & Sosial Media</h3>
            <div className="footer-social-list">
              {contactLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`footer-social-item ${item.className}`}
                >
                  <span className="footer-social-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 PT. Medtic Indonesia. All rights reserved.</p>
          <span className="footer-status">
            Online
          </span>
        </div>
      </div>
    </footer>
  );
}
