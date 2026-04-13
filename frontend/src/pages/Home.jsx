import React from "react";
import { Link } from "react-router-dom";
import "../css/Home.css";

const stats = [
  { value: "100+", label: "Proyek Ditangani" },
  { value: "50+", label: "Klien & Unit" },
  { value: "10+", label: "Tahun Pengalaman" },
];

const features = [
  {
    title: "Monitoring Proyek",
    desc: "Pantau progres pekerjaan interior secara terstruktur, mulai dari perencanaan, pelaksanaan, hingga finishing.",
  },
  {
    title: "Manajemen Material",
    desc: "Kontrol kebutuhan, penggunaan, dan ketersediaan material agar pekerjaan lebih efisien dan tepat sasaran.",
  },
  {
    title: "Data Tim & Karyawan",
    desc: "Kelola tim kerja yang terlibat pada setiap proyek untuk memudahkan koordinasi dan pembagian tugas.",
  },
  {
    title: "Laporan Proyek",
    desc: "Lihat ringkasan proyek, kendala lapangan, dan hasil monitoring dalam tampilan yang rapi dan mudah dibaca.",
  },
];

const workflows = [
  {
    number: "1",
    title: "Login ke Sistem",
    desc: "Masuk ke platform untuk mengakses data proyek, stok, dan laporan perusahaan.",
  },
  {
    number: "2",
    title: "Pilih Proyek",
    desc: "Buka proyek yang sedang berjalan untuk melihat progres, timeline, dan kebutuhan lapangan.",
  },
  {
    number: "3",
    title: "Update Monitoring",
    desc: "Catat perkembangan pekerjaan, material, dan aktivitas tim secara berkala.",
  },
  {
    number: "4",
    title: "Lihat Laporan",
    desc: "Gunakan data monitoring sebagai dasar evaluasi dan pengambilan keputusan proyek.",
  },
];

const galleries = [
  {
    title: "Office Interior",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Modern Workspace",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Meeting Area",
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
  },
];

const Home = () => {
  return (
    <div className="home-page">
      <main>
        <section className="hero-section">
          <div className="hero-overlay"></div>

          <div className="home-container hero-grid">
            <div className="hero-content">
              <span className="hero-badge">PT Media Estetika Indonesia</span>

              <h1 className="hero-title">
                Sistem Monitoring Project Interior yang Modern & Profesional
              </h1>

              <p className="hero-desc">
                Platform internal untuk membantu PT. Medtic Indonesia memantau
                proyek interior secara lebih terstruktur, mulai dari progres
                pekerjaan, material, tim kerja, hingga laporan proyek dalam satu
                sistem yang rapi dan efisien.
              </p>

              <div className="hero-actions">
                <Link to="/login" className="btn-primary">
                  Masuk ke Sistem
                </Link>
                <a href="#fitur" className="btn-secondary">
                  Lihat Fitur
                </a>
              </div>

              <div className="stats-grid">
                {stats.map((item) => (
                  <div key={item.label} className="stat-card">
                    <h3>{item.value}</h3>
                    <p>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-gallery">
              <div className="hero-glow"></div>

              <div className="gallery-main">
                <img
                  src="https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1400&q=80"
                  alt="Interior kantor modern"
                />
              </div>

              <div className="gallery-small-grid">
                <div className="gallery-small">
                  <img
                    src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
                    alt="Ruang interior modern"
                  />
                </div>

                <div className="gallery-small">
                  <img
                    src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80"
                    alt="Area kerja interior"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="home-container about-grid">
            <div>
              <p className="section-label">Tentang Sistem</p>
              <h2 className="section-title">
                Satu Platform untuk Monitoring Project Interior Perusahaan
              </h2>
              <p className="section-text">
                Home ini dirancang sebagai halaman utama sebelum login, sehingga
                pengguna dapat langsung memahami fungsi aplikasi, mengenal
                identitas perusahaan, dan masuk ke sistem monitoring dengan
                pengalaman yang lebih profesional.
              </p>
              <p className="section-text">
                Desain dibuat dengan nuansa modern, elegan, dan relevan dengan
                dunia interior, agar selaras dengan citra PT. Medtic Indonesia
                sekaligus nyaman dilihat di desktop maupun perangkat mobile.
              </p>
            </div>

            <div className="card-grid two-col">
              <InfoCard
                title="Profesional"
                desc="Tampilan rapi dan formal untuk mendukung identitas perusahaan."
              />
              <InfoCard
                title="Terstruktur"
                desc="Pengguna langsung memahami alur sistem sebelum masuk ke dashboard."
              />
              <InfoCard
                title="Relevan"
                desc="Visual dan konten disesuaikan dengan bidang interior dan monitoring proyek."
              />
              <InfoCard
                title="Responsif"
                desc="Nyaman digunakan pada layar desktop, tablet, maupun handphone."
              />
            </div>
          </div>
        </section>

        <section id="fitur" className="section-block section-light">
          <div className="home-container">
            <div className="section-head">
              <div>
                <p className="section-label">Fitur Utama</p>
                <h2 className="section-title">
                  Dirancang untuk Kebutuhan Operasional Proyek
                </h2>
              </div>

              <p className="section-head-text">
                Fitur-fitur berikut membantu tim internal memantau pekerjaan
                lapangan secara lebih cepat, jelas, dan terdokumentasi.
              </p>
            </div>

            <div className="card-grid four-col">
              {features.map((item) => (
                <FeatureCard
                  key={item.title}
                  title={item.title}
                  desc={item.desc}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="home-container">
            <div className="section-head section-head-single">
              <div>
                <p className="section-label">Alur Penggunaan</p>
                <h2 className="section-title">
                  Sederhana Sebelum Masuk ke Dashboard
                </h2>
                <p className="section-head-text">
                  Pengguna cukup memahami fungsi utama sistem dari halaman ini,
                  lalu masuk ke dashboard untuk mulai melakukan monitoring dan
                  pengelolaan data proyek.
                </p>
              </div>
            </div>

            <div className="card-grid four-col">
              {workflows.map((item) => (
                <StepCard
                  key={item.number}
                  number={item.number}
                  title={item.title}
                  desc={item.desc}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="section-block gallery-section-dark">
          <div className="home-container">
            <div className="section-head">
              <div>
                <p className="section-label section-label-light">
                  Visual Interior
                </p>
                <h2 className="section-title section-title-light">
                  Nuansa yang Selaras dengan Bidang Perusahaan
                </h2>
              </div>

              <p className="section-head-text section-head-text-light">
                Galeri ini membantu membangun kesan visual yang lebih relevan
                dengan perusahaan interior, sehingga halaman home terasa lebih
                hidup dan profesional.
              </p>
            </div>

            <div className="card-grid three-col">
              {galleries.map((item) => (
                <div key={item.title} className="gallery-card">
                  <img src={item.image} alt={item.title} />
                  <div className="gallery-card-body">
                    <h3>{item.title}</h3>
                    <p>
                      Inspirasi visual interior modern yang mendukung kesan
                      elegan dan profesional.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="home-container">
            <div className="cta-box">
              <div>
                <p className="section-label">Akses Internal Perusahaan</p>
                <h2 className="section-title">
                  Masuk untuk Mulai Monitoring Project
                </h2>
                <p className="section-text cta-text">
                  Setelah login, pengguna akan diarahkan ke dashboard untuk
                  mengelola proyek, memperbarui progres, memantau stok, dan
                  melihat laporan kerja.
                </p>
              </div>

              <div className="cta-actions">
                <Link to="/login" className="btn-primary">
                  Login Sekarang
                </Link>
                <a href="#fitur" className="btn-secondary">
                  Pelajari Fitur
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const InfoCard = ({ title, desc }) => (
  <div className="info-card">
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

const FeatureCard = ({ title, desc }) => (
  <div className="feature-card">
    <div className="feature-icon"></div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

const StepCard = ({ number, title, desc }) => (
  <div className="step-card">
    <div className="step-head">
      <div className="step-number">{number}</div>
      <h3>{title}</h3>
    </div>
    <p>{desc}</p>
  </div>
);

export default Home;