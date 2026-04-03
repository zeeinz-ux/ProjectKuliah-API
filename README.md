# VoulenteerEvent Project-API

Aplikasi web untuk ANALISIS KEBUTUHAN DAN PERANCANGAN SISTEM INFORMASI MONITORING PROYEK INTERIOR BERBASIS WEB PADA PT. MEDTIC INTERIOR dengan arsitektur fullstack menggunakan AdonisJS (Backend) dan React (Frontend).

## Daftar Isi

- [Teknologi](#teknologi)
- [Setup Backend](#setup-backend)
- [Setup Frontend](#setup-frontend)
- [Seeder Usage](#seeder-usage)

## Teknologi

### Backend

- **Framework**: AdonisJS v6
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT + Google OAuth
- **Language**: TypeScript
- **API**: REST API + GraphQL
- **OAuth**: Google Auth Library

### Frontend

- **Framework**: React 19
- **Styling**: TailwindCSS v4
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Build Tool**: Vite

## Setup Backend

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas Account
- Google Cloud Console Account (untuk OAuth)
- OpenWeatherMap Account (untuk Weather API)
- Git

### Installation

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd Project-API/backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   # Copy environment template
   cp .env.example .env

   # Generate APP_KEY
   node ace generate:key
   ```

4. **Configure .env**

   ```env
   TZ=UTC
   PORT=3333
   HOST=localhost
   LOG_LEVEL=info
   APP_KEY=your_generated_app_key_here
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_here

   MONGODB_URI=your_mongodb_connection_string
   MONGO_DB_NAME=VoulenteerEvent

   GOOGLE_CLIENT_ID=your_google_client_id_here

   WEATHER_API_KEY=your_openweather_api_key_here
   WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5/weather
   ```

5. **Setup Google OAuth**
   - Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Buat project baru atau pilih existing project
   - Enable Google+ API
   - Buat OAuth 2.0 credentials
   - Copy Client ID ke .env

6. **Setup Weather API**
   - Daftar di [OpenWeatherMap](https://openweathermap.org/api)
   - Buat API key gratis
   - Copy API key ke .env

7. **Run Development Server**

   ```bash
   npm run dev
   ```

   Server akan berjalan di: `http://localhost:3333`

### Available Scripts

```bash
npm run dev        # Development server with HMR
npm run build      # Build for production
npm run start      # Start production server
npm run test       # Run tests
npm run lint       # Run ESLint
npm run typecheck  # TypeScript type checking
```

## Setup Frontend

### Installation

1. **Navigate to Frontend**

   ```bash
   cd Project-API/frontend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**
   - Update API base URL jika perlu
   - Setup Google OAuth client ID untuk frontend

4. **Run Development Server**

   ```bash
   npm run dev
   ```

   Frontend akan berjalan di: `http://localhost:5173`

### Available Scripts

```bash
npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Seeder Usage

### Menjalankan Seeder

Seeder digunakan untuk mengisi database dengan admin user.

```bash
cd backend
node ace seed:admin
```

### Data yang Akan Dibuat:

#### **Admin Account**

- **Email**: `admin@example.com`
- **Password**: `adminpassword`
- **Role**: `admin`
- **Name**: `Admin`

**Note:** Jika admin sudah ada, seeder akan skip dan tidak membuat duplikat.

### Kapan Menggunakan Seeder:

- Setup development environment baru
- Reset database dengan data fresh
- Demo/testing dengan data konsisten
- Onboarding developer baru

## Notes

- README ini bersifat **sementara** dan akan diperbarui seiring development
- API Documentation lengkap akan ditambahkan kemudian
- Deployment guide akan disediakan saat ready untuk production
- Troubleshooting section akan diperluas berdasarkan feedback

## Authors

- \*_Wisnu Prastyo_ - Backend Developer
- **Alif Fahri Aditya** - Frontend Developer
- **Surya Putra Pratama** - UI/UX Figma Designer

## Support

Jika ada pertanyaan atau issue, silakan hubungi tim development.
