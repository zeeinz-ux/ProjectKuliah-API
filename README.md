# PT. Medtic Indonesia Project API

Aplikasi web untuk **Rancang Bangun Sistem Informasi Monitoring Proyek Interior Berbasis Web** pada **PT Medtic Indonesia**.

Project ini menggunakan arsitektur fullstack dengan:

- **AdonisJS v6 + TypeScript** sebagai backend
- **React + Vite** sebagai frontend
- **PostgreSQL** sebagai database utama
- **Lucid ORM** sebagai ORM backend
- **JWT** sebagai sistem autentikasi

Aplikasi ini dibuat untuk membantu proses monitoring proyek interior, pengelolaan project, stok material, dokumentasi lapangan, laporan, user management, notifikasi, dan pengaturan profil akun.

---

## Daftar Isi

- [Overview](#overview)
- [Teknologi](#teknologi)
- [Fitur Utama](#fitur-utama)
- [Instalasi Backend Step by Step](#instalasi-backend-step-by-step)
- [Setup Frontend](#setup-frontend)
- [Environment Variables](#environment-variables)
- [Migration](#migration)
- [Seed Admin](#seed-admin)
- [Autentikasi](#autentikasi)
- [Forgot Password / Reset Password](#forgot-password--reset-password)
- [Struktur Role](#struktur-role)
- [Catatan Development](#catatan-development)
- [Authors](#authors)
- [License](#license)

---

## Overview

Sistem ini dirancang untuk membantu perusahaan interior dalam:

- memonitor progress proyek interior
- mengelola data project
- mengelola task dan progress pekerjaan
- mengelola stok material
- mencatat barang masuk dan barang keluar
- mengelola dokumentasi lapangan
- mengelola user berdasarkan role
- mengelola profil akun
- menampilkan laporan
- menampilkan notifikasi aktivitas
- melakukan autentikasi login menggunakan email, password, dan role
- melakukan reset password melalui link reset yang dibuat langsung oleh sistem

---

## Teknologi

### Backend

- **Framework**: AdonisJS v6
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Lucid ORM
- **Authentication**: JWT
- **Hashing**: AdonisJS Hash
- **API Style**: REST API
- **Validation**: VineJS / Adonis Validator
- **Date Handling**: Luxon

### Frontend

- **Framework**: React
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: CSS + Tailwind `@apply`
- **HTTP Client**: Fetch API
- **Base Path**: `/ProjectKuliah-API/`

### Tools Pendukung

- **Database Client**: DBeaver / pgAdmin
- **Version Control**: Git & GitHub
- **Image Upload**: Cloudinary
- **API Testing**: Thunder Client / Postman

---

## Fitur Utama

### Authentication

- Login dengan email, password, dan role
- Register user baru
- JWT-based authentication
- Proteksi route berdasarkan role
- Redirect otomatis ke halaman tujuan setelah login
- Public route guard agar user yang sudah login tidak kembali ke halaman login/register

### Forgot Password / Reset Password

- User dapat membuat link reset password melalui halaman Forgot Password
- Backend membuat token reset password
- Token disimpan ke tabel `password_resets`
- Link reset password dibuat berdasarkan `FRONTEND_URL`
- Link reset password langsung dikembalikan ke frontend
- Link ditampilkan sebagai tombol untuk masuk ke halaman Reset Password
- Token memiliki masa berlaku 30 menit
- Token otomatis dihapus setelah password berhasil direset

### Dashboard Admin

- Menampilkan KPI utama secara realtime
- Total nilai project
- Jumlah project aktif
- Permintaan material
- Dokumentasi lapangan
- Chart overview progress, material, dan budget
- Project status donut chart
- Monthly goals
- Recent activity
- Recent clients

### Project Management

- Menampilkan daftar proyek interior
- Tambah project
- Edit project
- Detail project
- Monitoring progress
- Task project
- Material project
- Budget project
- Riwayat progress dan dokumentasi project

### Material Stock

- Menampilkan data stok material
- Tambah material
- Edit material
- Hapus material
- Monitoring stok masuk
- Monitoring stok keluar
- Status material:
  - Ready Stock
  - Low Stock
  - Out of Stock
- Search, filter, export, dan pengaturan kolom

### Calendar

- Menampilkan kalender admin
- Menampilkan event project
- Menampilkan tanggal merah / hari libur Indonesia
- Data holiday dapat dikelola dari backend / file JSON
- Tampilan tetap responsive dan full-width

### Dokumentasi Lapangan

- Upload file / foto dokumentasi proyek
- Menyimpan bukti progress lapangan
- Menampilkan dokumentasi dalam mode list / grid
- Delete confirmation modal
- Integrasi dengan data project

### Laporan

- Menampilkan data laporan project
- Filter laporan
- Tabel laporan responsive
- Layout full-width mengikuti dashboard

### User Management

- Menampilkan daftar user
- Tambah user
- Edit user
- Hapus user
- Role-based access
- Status user aktif / nonaktif

### Profile Settings

- Menampilkan data user yang sedang login
- Update nama
- Update email
- Update bio
- Update avatar
- Update password
- Nama user ditampilkan sesuai data yang diisi tanpa fallback nama belakang palsu

### Notifications

- Menampilkan daftar notifikasi
- Notifikasi aktivitas project/material/user
- Modal hapus notifikasi
- Layout responsive

---

## Instalasi Backend Step by Step

Bagian ini menjelaskan instalasi backend secara urut mulai dari clone repository sampai backend berhasil dijalankan.

### 1. Prerequisites

Pastikan sudah menginstall:

- Node.js v18 atau lebih baru
- PostgreSQL
- Git
- DBeaver atau pgAdmin

### 2. Clone repository

```bash
git clone <repository-url>
```

Contoh:

```bash
git clone https://github.com/username/nama-repository.git
```

### 3. Masuk ke folder project

```bash
cd ProjectKuliah-API
```

### 4. Masuk ke folder backend

```bash
cd backend
```

### 5. Install dependency backend

```bash
npm install
```

### 6. Copy file environment

Buat file `.env` dari template `.env.example`.

#### Windows PowerShell

```powershell
copy .env.example .env
```

#### Git Bash / Linux / macOS

```bash
cp .env.example .env
```

### 7. Isi file `.env`

Setelah file `.env` dibuat, isi konfigurasi backend sesuai environment lokal kamu.

Contoh:

```env
NODE_ENV=development
PORT=3333
APP_KEY=your_generated_app_key
APP_NAME=Medtic Interior API
HOST=localhost
LOG_LEVEL=info

JWT_SECRET=your_jwt_secret

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_DATABASE=your_database_name

FRONTEND_URL=http://localhost:5173/ProjectKuliah-API
```

### 8. Generate `APP_KEY` jika belum ada

Kalau `APP_KEY` masih kosong, jalankan:

```bash
node ace generate:key
```

Lalu salin hasil key ke file `.env` pada bagian `APP_KEY`.

### 9. Buat database PostgreSQL

Buat database baru di PostgreSQL, misalnya:

```txt
db_Project_Kuliah
```

Pastikan nama database di `.env` sama dengan database yang kamu buat.

### 10. Jalankan migration

Setelah database siap dan file `.env` sudah benar, jalankan migration:

```bash
node ace migration:run
```

### 11. Buat atau update akun admin default

Jalankan command berikut:

```bash
node ace seed:admin
```

Akun default yang dibuat/update:

```txt
Email    : admin@example.com
Password : admin12345
Role     : admin
```

### 12. Jalankan backend

```bash
npm run dev
```

Atau:

```bash
node ace serve --hmr
```

Jika berhasil, backend akan berjalan di:

```bash
http://localhost:3333
```

### 13. Jika backend error saat start

Beberapa penyebab yang paling umum:

- file `.env` belum dibuat
- ada environment variable yang kosong padahal wajib
- konfigurasi database salah
- PostgreSQL belum aktif
- `APP_KEY` belum diisi
- `APP_NAME` belum diisi jika dipakai di config logger
- `JWT_SECRET` belum diisi
- `FRONTEND_URL` belum diisi
- database belum dibuat
- migration belum dijalankan

### 14. Available backend commands

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run lint
npm run format
npm run test

node ace migration:run
node ace migration:status
node ace migration:rollback
node ace seed:admin
```

---

## Setup Frontend

### 1. Masuk ke folder frontend

Jika posisi terminal masih di root project:

```bash
cd frontend
```

Jika posisi terminal masih di folder backend:

```bash
cd ../frontend
```

### 2. Install dependency frontend

```bash
npm install
```

### 3. Buat file `.env`

Buat file `.env` pada folder frontend.

Contoh:

```env
VITE_API_BASE_URL=http://localhost:3333
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 4. Jalankan frontend

```bash
npm run dev
```

Frontend akan berjalan di:

```bash
http://localhost:5173/ProjectKuliah-API/
```

### 5. Available frontend commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

---

## Environment Variables

### Backend `.env`

Contoh konfigurasi backend:

```env
NODE_ENV=development
PORT=3333
APP_KEY=your_generated_app_key
APP_NAME=Medtic Interior API
HOST=localhost
LOG_LEVEL=info

JWT_SECRET=your_jwt_secret

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_DATABASE=your_database_name

FRONTEND_URL=http://localhost:5173/ProjectKuliah-API
```

### Penjelasan Backend Env

| Variable       | Keterangan                                     |
| -------------- | ---------------------------------------------- |
| `NODE_ENV`     | Mode aplikasi, biasanya `development`          |
| `PORT`         | Port backend AdonisJS                          |
| `APP_KEY`      | Key utama aplikasi AdonisJS                    |
| `APP_NAME`     | Nama aplikasi untuk logger/backend             |
| `HOST`         | Host backend                                   |
| `LOG_LEVEL`    | Level log backend                              |
| `JWT_SECRET`   | Secret key untuk membuat token JWT             |
| `DB_HOST`      | Host PostgreSQL                                |
| `DB_PORT`      | Port PostgreSQL                                |
| `DB_USER`      | Username PostgreSQL                            |
| `DB_PASSWORD`  | Password PostgreSQL                            |
| `DB_DATABASE`  | Nama database PostgreSQL                       |
| `FRONTEND_URL` | URL frontend untuk membuat link reset password |

### Frontend `.env`

Contoh konfigurasi frontend:

```env
VITE_API_BASE_URL=http://localhost:3333
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### Penjelasan Frontend Env

| Variable                        | Keterangan               |
| ------------------------------- | ------------------------ |
| `VITE_API_BASE_URL`             | Base URL backend API     |
| `VITE_CLOUDINARY_CLOUD_NAME`    | Cloud name Cloudinary    |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Upload preset Cloudinary |

### Catatan penting

- File `.env` digunakan untuk nilai asli
- File `.env.example` digunakan sebagai template
- Jangan commit credential asli seperti `APP_KEY`, `JWT_SECRET`, password database, dan credential Cloudinary ke repository publik
- Project ini sudah tidak menggunakan Google Login
- Project ini sudah tidak menggunakan Gmail SMTP untuk reset password
- Project ini sudah tidak menggunakan GraphQL lama untuk sistem bencana/relawan
- Project ini sudah tidak menggunakan Swagger/OpenAPI lama dari project sebelumnya

---

## Migration

Project ini menggunakan **Lucid ORM** dengan PostgreSQL.

### Jalankan migration

```bash
node ace migration:run
```

### Cek status migration

```bash
node ace migration:status
```

### Rollback migration

```bash
node ace migration:rollback
```

### Struktur tabel `users`

Tabel `users` mencakup kolom utama:

- `id`
- `full_name`
- `email`
- `password`
- `role`
- `departemen`
- `is_active`
- `bio`
- `avatar`
- `created_at`
- `updated_at`

### Struktur tabel `password_resets`

Tabel `password_resets` mencakup kolom:

- `id`
- `email`
- `token`
- `expires_at`
- `created_at`
- `updated_at`

---

## Seed Admin

Project ini memiliki command custom untuk membuat atau memperbarui akun admin default.

Jalankan:

```bash
node ace seed:admin
```

Jika berhasil, akan muncul output seperti:

```txt
[ success ] Admin siap digunakan.
ID: 4
Email: admin@example.com
Password: admin12345
```

Akun default:

| Field    | Value               |
| -------- | ------------------- |
| Email    | `admin@example.com` |
| Password | `12345`     |
| Role     | `admin`             |
| Status   | `Active`            |

Command ini menggunakan `updateOrCreate`, sehingga jika akun admin sudah ada, datanya akan diperbarui.

---

## Autentikasi

Autentikasi backend menggunakan:

- **JWT** untuk login session
- login manual berdasarkan:
  - email
  - password
  - role
- proteksi route berdasarkan role

### Endpoint auth utama

- `POST /register`
- `POST /login`

### Endpoint profile

- `GET /me`
- `PUT /me`
- `PUT /me/password`

### Endpoint reset password

- `POST /forgot-password`
- `POST /reset-password`

### Endpoint user management

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

### Alur login frontend

1. User membuka halaman login
2. User memasukkan email, password, dan role
3. Frontend mengirim data ke endpoint `/login`
4. Backend memvalidasi user
5. Backend mengirim token JWT dan data user
6. Frontend menyimpan token dan user ke `localStorage`
7. User diarahkan ke halaman admin
8. Jika user sebelumnya membuka protected route, user diarahkan kembali ke route tersebut setelah login

---

## Forgot Password / Reset Password

Fitur reset password berjalan dengan alur berikut:

1. User membuka halaman **Forgot Password**
2. User memasukkan email akun
3. Backend memvalidasi email
4. Backend mencari user berdasarkan email
5. Backend menghapus token reset lama berdasarkan email
6. Backend membuat token reset baru dengan panjang 64 karakter
7. Backend menyimpan token ke tabel `password_resets`
8. Backend membentuk link reset password berdasarkan `FRONTEND_URL`
9. Backend mengirim response berisi `resetUrl` ke frontend
10. Frontend menampilkan alert sukses dan tombol **Masuk ke Reset Password**
11. User klik tombol tersebut
12. User mengisi password baru di halaman **Reset Password**
13. Backend memvalidasi token, password, dan konfirmasi password
14. Password user diperbarui
15. Token reset password dihapus setelah berhasil digunakan

### Contoh response `POST /forgot-password`

```json
{
  "message": "Link reset password berhasil dibuat.",
  "resetUrl": "http://localhost:5173/ProjectKuliah-API/reset-password?token=example_token",
  "token": "example_token",
  "expiresAt": "28 Apr 2026, 14:30 WIB"
}
```

### Validasi reset password

- token wajib valid
- token harus belum expired
- password minimal 6 karakter
- `password_confirmation` harus sama dengan `password`

### Catatan implementasi

- Link reset password tidak dikirim melalui email
- Link reset password langsung ditampilkan di halaman Forgot Password
- Password user tidak di-hash manual di controller
- Hash password ditangani oleh hook pada model `User`
- Token reset password otomatis dihapus setelah berhasil digunakan

---

## Struktur Role

Role yang digunakan:

- `admin`
- `project_manager`
- `finance`

Departemen yang digunakan:

- `Super User`
- `Operator Data`
- `Accounting`

### Hak akses umum

#### Admin

- bisa mengakses dashboard
- bisa mengelola project
- bisa mengelola stok material
- bisa mengelola client
- bisa mengelola dokumentasi
- bisa mengelola laporan
- bisa mengelola user
- bisa mengakses profile settings
- bisa melihat notifikasi

#### Project Manager

- bisa mengakses halaman sesuai proteksi role frontend/backend
- fokus pada project, progress, task, dokumentasi, dan monitoring lapangan

#### Finance

- bisa mengakses halaman sesuai proteksi role frontend/backend
- fokus pada laporan, budget, dan data keuangan project

---

## Catatan Development

- Project menggunakan **AdonisJS v6 + TypeScript** untuk backend
- Project menggunakan **React + Vite** untuk frontend
- Project menggunakan **PostgreSQL** sebagai database utama
- ORM yang digunakan adalah **Lucid ORM**
- Sistem autentikasi menggunakan JWT
- Sistem Google Login sudah dihapus
- Sistem pengiriman email reset password sudah dihapus
- Sistem GraphQL lama untuk bencana/relawan sudah dihapus
- Dokumentasi Swagger/OpenAPI lama sudah tidak dipakai
- Reset password sekarang menggunakan link yang dibuat backend dan ditampilkan langsung di frontend
- Frontend menggunakan base path Vite: `/ProjectKuliah-API/`
- Routing frontend menggunakan `BrowserRouter` dengan `basename={import.meta.env.BASE_URL}`
- Styling menggunakan CSS biasa dan Tailwind `@apply`
- Beberapa halaman admin sudah dibuat full-width agar tetap rapi saat browser zoom out
- Upload avatar dan dokumentasi menggunakan Cloudinary
- README ini dapat terus diperbarui mengikuti perkembangan fitur berikutnya

### Catatan layout frontend

Beberapa halaman admin sudah disesuaikan agar tidak terkunci di tengah saat browser di-scale kecil:

- Dashboard
- Stok Material
- Calendar
- Files / Dokumentasi
- Laporan
- Notifications

Prinsip layout yang digunakan:

- wrapper utama menggunakan `w-full`
- container menggunakan `max-w-none`
- card/table menggunakan `width: 100%`
- table tetap boleh menggunakan `min-w-[...]` agar tetap rapi di layar kecil

### Catatan route frontend

Frontend menggunakan protected route dan public route:

- `ProtectedRoute` digunakan untuk halaman admin
- `PublicRoute` digunakan untuk login, register, forgot password, dan reset password
- Jika user belum login dan membuka `/admin/projects`, user diarahkan ke `/login?redirect=/admin/projects`
- Setelah login berhasil, user diarahkan kembali ke halaman tujuan
- Jika user sudah login lalu membuka `/login` atau `/register`, user otomatis diarahkan ke `/admin`

### Catatan dependency yang sudah dibersihkan

Dependency lama yang tidak digunakan lagi:

- `google-auth-library`
- `@adonisjs/mail`
- `swagger-ui-express`
- `yamljs`
- `graphql`
- `@types/graphql`
- `bcryptjs`
- `@types/bcryptjs`

Password sekarang menggunakan AdonisJS Hash, bukan `bcryptjs` manual.

---

## Authors

- **Wisnu Prastyo** - Backend Developer
- **Alif Fahri Aditya** - Frontend Developer
- **Surya Putra Pratama** - UI/UX Designer

---

## License

Project ini dibuat untuk kebutuhan pengembangan sistem internal / akademik PT Medtic Indonesia.
