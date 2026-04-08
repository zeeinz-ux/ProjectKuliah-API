export default function Footer() {
  return (
    <footer className="mt-12">
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 text-white">
        {/* decorative blur */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold tracking-wide">
                PT. Medtic Indonesia
              </h2>
              <p className="text-sm text-blue-50/90 leading-relaxed">
                Platform yang menghubungkan relawan dengan kegiatan sosial dan
                penanggulangan bencana secara cepat dan terorganisir.
              </p>
            </div>

            {/* Navigation */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-blue-100">
                Navigasi
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/"
                    className="text-blue-50 hover:text-yellow-300 transition"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/events"
                    className="text-blue-50 hover:text-yellow-300 transition"
                  >
                    Event & Bencana
                  </a>
                </li>
                <li>
                  <a
                    href="/profile"
                    className="text-blue-50 hover:text-yellow-300 transition"
                  >
                    Profile
                  </a>
                </li>
              </ul>
            </div>

            {/* Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-blue-100">
                Informasi
              </h3>
              <p className="text-sm text-blue-50/90">
                Dikembangkan untuk mempermudah koordinasi relawan dan
                meningkatkan dampak sosial secara nyata.
              </p>

              <div className="inline-flex items-center gap-2 mt-2 rounded-full bg-yellow-300 px-3 py-1 text-xs font-semibold text-blue-900 shadow-sm">
                 Bersama Kita Bisa
              </div>
            </div>
          </div>

          {/* bottom */}
          <div className="mt-10 border-t border-white/20 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-blue-100/80">
              © {new Date().getFullYear()} PT. Medtic Indonesia. All rights
              reserved.
            </p>

            <div className="flex items-center gap-4 text-xs text-blue-100/80">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
              <span>Indonesia</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
