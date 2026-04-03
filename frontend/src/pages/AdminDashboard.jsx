import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { adminFetchStats } from "../api/adminApi";

function StatCard({ label, value, desc, loading }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>

      {loading ? (
        <div className="h-6 w-16 rounded bg-slate-200 animate-pulse" />
      ) : (
        <p className="text-lg font-bold text-slate-900">{value}</p>
      )}

      <p className="text-[11px] text-slate-500">{desc}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRelawan: 0,
    totalEventBencana: 0,
    totalPengguna: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  const aliveRef = useRef(true);
  const reqIdRef = useRef(0);

  let user = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) user = JSON.parse(raw);
  } catch {
    // ignore
  }

  const loadStats = async ({ silent = false } = {}) => {
    const myReqId = ++reqIdRef.current;

    if (!silent) setLoadingStats(true);
    setStatsError("");

    try {
      const data = await adminFetchStats();

      if (!aliveRef.current || myReqId !== reqIdRef.current) return;
      setStats(data);
    } catch (e) {
      if (!aliveRef.current || myReqId !== reqIdRef.current) return;
      setStatsError(e?.message || "Gagal memuat statistik.");
    } finally {
      if (!aliveRef.current || myReqId !== reqIdRef.current) return;
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    aliveRef.current = true;

    // Load awal
    loadStats({ silent: false });

    // Auto refresh tiap 60 detik (silent)
    const interval = setInterval(() => {
      loadStats({ silent: true });
    }, 60000);

    return () => {
      aliveRef.current = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statItems = useMemo(
    () => [
      {
        label: "Relawan",
        value: stats.totalRelawan,
        desc: "Total relawan terdaftar (approved) pada berbagai event.",
      },
      {
        label: "Event / Bencana",
        value: stats.totalEventBencana,
        desc: "Monitoring jumlah event yang tersedia di sistem.",
      },
      {
        label: "Pengguna",
        value: stats.totalPengguna,
        desc: "Ringkasan akun yang terdaftar pada sistem.",
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-100">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-blue-700">
            Dashboard Admin
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Kontrol penuh dalam satu tampilan.
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pantau event, relawan, dan pengguna untuk memastikan sistem
              berjalan dengan baik.
            </p>

            {user && (
              <p className="text-sm text-slate-700 mt-2">
                Selamat datang,{" "}
                <span className="font-semibold text-blue-700">
                  {user.name || user.email}
                </span>
                .
              </p>
            )}
          </div>

          <span className="inline-flex items-center rounded-xl bg-yellow-300 px-3 py-1 text-xs font-semibold text-blue-900 shadow-sm">
            ⚡ Akses penuh admin
          </span>
        </div>
      </header>

      {/* Statistik */}
      <section className="grid gap-4 md:grid-cols-3">
        {statItems.map((it) => (
          <StatCard
            key={it.label}
            label={it.label}
            value={it.value}
            desc={it.desc}
            loading={loadingStats}
          />
        ))}
      </section>

      {statsError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {statsError}
        </div>
      )}

      {/* Navigasi utama */}
      <section className="grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/volunteers"
          className="group bg-gradient-to-br from-white via-white to-blue-50 rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition"
        >
          <h3 className="font-semibold text-slate-900">Data Relawan</h3>
          <p className="text-sm text-slate-500 mt-2">
            Lihat dan kelola pendaftaran relawan pada setiap event/bencana.
          </p>
        </Link>

        <Link
          to="/admin/events"
          className="group bg-gradient-to-br from-white via-white to-yellow-50 rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition"
        >
          <h3 className="font-semibold text-slate-900">Data Event / Bencana</h3>
          <p className="text-sm text-slate-500 mt-2">
            Tambah, ubah, atau arsipkan event/bencana yang tampil di aplikasi.
          </p>
        </Link>

        <Link
          to="/admin/users"
          className="group bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition"
        >
          <h3 className="font-semibold text-slate-900">Data Pengguna</h3>
          <p className="text-sm text-slate-500 mt-2">
            Kelola akun pengguna, akses, dan informasi profil dengan mudah.
          </p>
        </Link>
      </section>
    </div>
  );
}
