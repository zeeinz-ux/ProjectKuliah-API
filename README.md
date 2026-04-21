# PT. Medtic Indonesia Project API

Aplikasi web untuk **Rancang Bangun Sistem Informasi Monitoring Proyek Interior Berbasis Web** pada **PT Medtic Indonesia** dengan arsitektur fullstack menggunakan **AdonisJS v6** sebagai backend, **React 19** sebagai frontend, dan **PostgreSQL** sebagai database utama.

Project ini dibuat untuk mendukung kebutuhan monitoring proyek interior, pengelolaan user, profil akun, serta pengelolaan data material dan proyek secara terstruktur.

---

## Daftar Isi

- [Overview](#overview)
- [Teknologi](#teknologi)
- [Fitur Utama](#fitur-utama)
- [Setup Backend](#setup-backend)
- [Setup Frontend](#setup-frontend)
- [Environment Variables](#environment-variables)
- [Migration](#migration)
- [Autentikasi](#autentikasi)
- [Struktur Role](#struktur-role)
- [Catatan Development](#catatan-development)
- [Authors](#authors)

---

## Overview

Sistem ini dirancang untuk membantu perusahaan interior dalam:

- memonitor progres proyek interior
- mengelola user berdasarkan role
- mengelola data profil user
- mengelola stok material
- mengelola daftar proyek interior
- mendukung login manual dan login Google
- menyiapkan pondasi integrasi fitur upload avatar dan dokumentasi proyek

---

## Teknologi

### Backend

- **Framework**: AdonisJS v6
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Lucid ORM
- **Authentication**: JWT
- **Google Login**: Google Auth Library
- **API Style**: REST API

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: CSS
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

---

## Setup Backend

### Prerequisites

Pastikan sudah menginstall:

- Node.js v18+
- PostgreSQL
- DBeaver atau pgAdmin
- Google Cloud Console account
- Git

### Installation

## Clone Repo

git clone <repository-url>

Masuk ke folder backend:

```bash
cd backend
```

Install dependency:

```bash
npm install
```

Generate app key jika diperlukan:

```bash
# Copy environment template
cp .env.example .env

# Generate APP_KEY
node ace generate:key
```

Jalankan server development:

```bash
node ace serve --watch
```

Backend akan berjalan di:

```bash
http://localhost:3333
```

### Available Commands

```bash
node ace serve --watch     # Menjalankan backend mode development
node ace migration:run     # Menjalankan migration database
node ace migration:status  # Mengecek status migration
node ace migration:rollback # Rollback migration terakhir
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
http://localhost:5173
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

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_DATABASE=your_database_name

GOOGLE_CLIENT_ID=your_google_client_id
```

### Frontend `.env`

Contoh konfigurasi frontend:

```env
VITE_API_URL=http://localhost:3333
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

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

### Endpoint user management

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

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

- **Super Admin**
  - bisa melihat user
  - bisa tambah, edit, hapus user
- **Project Manager**
  - bisa melihat halaman tertentu sesuai proteksi frontend/backend
- **Finance**
  - bisa melihat halaman tertentu sesuai proteksi frontend/backend

---

## Catatan Development

- Project ini sudah berpindah dari pendekatan MongoDB ke **PostgreSQL**
- ORM yang digunakan sekarang adalah **Lucid ORM**
- Sistem autentikasi sudah menggunakan backend AdonisJS yang terhubung ke PostgreSQL
- Halaman `Profile Settings` sudah disiapkan untuk terhubung dengan akun user yang sedang login
- Upload avatar menggunakan **Cloudinary**
- README ini masih dapat diperbarui mengikuti perkembangan fitur berikutnya

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
