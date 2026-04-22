# PT. Medtic Indonesia Project API

Aplikasi web untuk **Rancang Bangun Sistem Informasi Monitoring Proyek Interior Berbasis Web** pada **PT Medtic Indonesia** dengan arsitektur fullstack menggunakan **AdonisJS v6** sebagai backend, **React + Vite** sebagai frontend, dan **PostgreSQL** sebagai database utama.

Project ini dibuat untuk mendukung kebutuhan monitoring proyek interior, pengelolaan user, autentikasi, profil akun, pengelolaan material, dokumentasi lapangan, serta pengiriman email reset password.

---

## Daftar Isi

- [Overview](#overview)
- [Teknologi](#teknologi)
- [Fitur Utama](#fitur-utama)
- [Instalasi Backend Step by Step](#instalasi-backend-step-by-step)
- [Setup Frontend](#setup-frontend)
- [Environment Variables](#environment-variables)
- [Migration](#migration)
- [Autentikasi](#autentikasi)
- [Forgot Password / Reset Password](#forgot-password--reset-password)
- [Struktur Role](#struktur-role)
- [Catatan Development](#catatan-development)
- [Authors](#authors)
- [License](#license)

---

## Overview

Sistem ini dirancang untuk membantu perusahaan interior dalam:

- memonitor progres proyek interior
- mengelola user berdasarkan role
- mengelola data profil user
- mengelola stok material
- mengelola daftar proyek interior
- mendukung login manual dan login Google
- mendukung reset password melalui email
- menyiapkan pondasi integrasi upload avatar dan dokumentasi proyek

---

## Teknologi

### Backend
- **Framework**: AdonisJS v6
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Lucid ORM
- **Authentication**: JWT
- **Google Login**: Google Auth Library
- **Mail Service**: AdonisJS Mail + Gmail SMTP
- **API Style**: REST API

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: CSS + Tailwind base setup
- **HTTP Client**: Fetch API

### Tools Pendukung
- **Database Client**: DBeaver / pgAdmin
- **Image Upload**: Cloudinary
- **Version Control**: Git & GitHub

---

## Fitur Utama

### Authentication
- Login dengan email, password, dan role
- Register user baru
- Login dengan akun Google
- JWT-based authentication
- Proteksi route berdasarkan role

### Forgot Password / Reset Password
- User dapat meminta reset password melalui email
- Backend membuat token reset password
- Token disimpan ke tabel `password_resets`
- Link reset password dikirim ke email user melalui Gmail SMTP
- Token memiliki masa berlaku
- Password baru akan disimpan melalui hook hash password pada model `User`
- Token otomatis dihapus setelah digunakan

### User Management
- Menampilkan daftar user dari database
- Tambah user
- Edit user
- Hapus user
- Hak CRUD khusus **Super Admin**

### Profile Settings
- Menampilkan data user yang sedang login
- Ubah avatar
- Ubah nama
- Ubah email
- Ubah bio
- Ubah password

### Project Management
- Menampilkan daftar proyek interior
- Tambah proyek
- Edit proyek
- Detail proyek
- Monitoring progress dan task proyek

### Material Stock
- Menampilkan data stok material
- Tambah barang
- Edit barang
- Hapus barang
- Monitoring stok masuk/keluar

### Dokumentasi Lapangan
- Upload file / foto dokumentasi proyek
- Menyimpan bukti progres lapangan
- Mendukung kebutuhan monitoring visual

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
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=your_generated_app_key
NODE_ENV=development

JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id

WEATHER_API_KEY=your_weather_api_key
WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5/weather

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_DATABASE=your_database_name

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_gmail_address
SMTP_PASSWORD=your_gmail_app_password
SMTP_SECURE=false

MAIL_FROM_ADDRESS=your_gmail_address
MAIL_FROM_NAME=Medtic Interior

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

### 11. Jalankan backend

```bash
node ace serve --watch
```

Jika berhasil, backend akan berjalan di:

```bash
http://localhost:3333
```

### 12. Jika backend error saat start

Beberapa penyebab yang paling umum:

- file `.env` belum dibuat
- ada environment variable yang kosong padahal wajib
- konfigurasi database salah
- PostgreSQL belum aktif
- `APP_KEY` belum diisi

### 13. Available backend commands

```bash
node ace serve --watch
node ace migration:run
node ace migration:status
node ace migration:rollback
```

---

## Setup Frontend

Masuk ke folder frontend:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Jalankan frontend:

```bash
npm run dev
```

Frontend akan berjalan di:

```bash
http://localhost:5173/ProjectKuliah-API/
```

### Available Commands

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
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=your_generated_app_key
NODE_ENV=development

JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id

WEATHER_API_KEY=your_weather_api_key
WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5/weather

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_DATABASE=your_database_name

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_gmail_address
SMTP_PASSWORD=your_gmail_app_password
SMTP_SECURE=false

MAIL_FROM_ADDRESS=your_gmail_address
MAIL_FROM_NAME=Medtic Interior

FRONTEND_URL=http://localhost:5173/ProjectKuliah-API
```

### Frontend `.env`

Contoh konfigurasi frontend:

```env
VITE_API_BASE_URL=http://localhost:3333
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### Catatan penting

- File `.env` digunakan untuk nilai asli
- File `.env.example` digunakan sebagai template
- Jangan commit credential asli seperti `APP_KEY`, `JWT_SECRET`, `SMTP_PASSWORD`, dan password database ke repository publik

---

## Migration

Project ini menggunakan **Lucid ORM** dengan PostgreSQL.

### Jalankan migration

```bash
node ace migration:run
```

### Struktur tabel `users`

Tabel `users` saat ini mencakup kolom:
- `id`
- `full_name`
- `email`
- `password`
- `role`
- `departemen`
- `google_id`
- `is_active`
- `bio`
- `avatar`
- `created_at`
- `updated_at`

### Struktur tabel `password_resets`

Tabel `password_resets` saat ini mencakup kolom:
- `id`
- `email`
- `token`
- `expires_at`
- `created_at`
- `updated_at`

---

## Autentikasi

Autentikasi backend menggunakan:

- **JWT** untuk login session
- **Google Login** untuk login dengan akun Google
- validasi login berdasarkan:
  - email
  - password
  - role

### Endpoint auth utama
- `POST /register`
- `POST /login`
- `POST /google-login`

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
9. Backend mengirim email reset password melalui Gmail SMTP
10. User membuka link dari email
11. User mengisi password baru di halaman **Reset Password**
12. Backend memvalidasi token, password, dan konfirmasi password
13. Password user diperbarui
14. Token reset password dihapus setelah berhasil digunakan

### Validasi reset password
- token wajib valid
- token harus belum expired
- password minimal 6 karakter
- `password_confirmation` harus sama dengan `password`

### Catatan implementasi
- Password user tidak di-hash manual di controller
- Hash password ditangani oleh hook pada model `User`
- Response endpoint `forgot-password` bersifat generic agar tidak membocorkan apakah email terdaftar atau tidak

---

## Struktur Role

Role yang digunakan saat ini:

- `super_admin`
- `project_manager`
- `finance`

Departemen yang digunakan saat ini:

- `IT/Sistem`
- `Pengawas`
- `Keuangan`

### Hak akses umum

#### Super Admin
- bisa melihat user
- bisa tambah user
- bisa edit user
- bisa hapus user

#### Project Manager
- bisa mengakses halaman tertentu sesuai proteksi frontend/backend

#### Finance
- bisa mengakses halaman tertentu sesuai proteksi frontend/backend

---

## Catatan Development

- Project ini sudah berpindah dari pendekatan MongoDB ke **PostgreSQL**
- ORM yang digunakan sekarang adalah **Lucid ORM**
- Sistem autentikasi sudah menggunakan backend AdonisJS yang terhubung ke PostgreSQL
- Fitur Forgot Password / Reset Password backend sudah terhubung dengan Gmail SMTP
- Frontend menggunakan base path Vite: `/ProjectKuliah-API/`
- Routing frontend menggunakan `BrowserRouter` dengan `basename={import.meta.env.BASE_URL}`
- Upload avatar menggunakan **Cloudinary**
- README ini dapat terus diperbarui mengikuti perkembangan fitur berikutnya

### Catatan penting
Jika sebelumnya project masih memakai struktur MongoDB/Mongoose, pastikan:
- file model lama yang tidak dipakai sudah dibersihkan
- route dan controller lama yang tidak relevan sudah dihapus
- env MongoDB lama tidak lagi digunakan

---

## Authors

- **Wisnu Prastyo** - Backend Developer
- **Alif Fahri Aditya** - Frontend Developer
- **Surya Putra Pratama** - UI/UX Designer

---

## License

Project ini dibuat untuk kebutuhan pengembangan sistem internal / akademik PT Medtic Indonesia.
