# Faculty Feedback Management System

> A full-stack web application for managing faculty feedback at **KNIT Sultanpur** — built as an MCA Final Year Project.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248.svg)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

---

## Overview

The **Faculty Feedback Management System** is a role-based, full-stack portal that allows students to submit anonymous feedback on faculty members after each semester. Admins can manage the academic structure, configure feedback sessions, generate detailed reports, and analyse trends across departments.

The system is designed for real-world institutional use — with Google OAuth, automatic session scheduling, PDF/Excel export, student roll number mapping, and a professional audit trail.

---

## Features

### Admin Portal
- 📊 **Dashboard** — live metrics: active sessions, completion rates, average ratings
- 🏫 **Academic Structure** — manage courses, branches, years, and semesters
- 📚 **Subjects** — manage subjects with course/branch/semester assignment
- 👨‍🏫 **Faculty Management** — create, edit, activate/deactivate faculty profiles
- 🔗 **Faculty-Subject Mapping** — assign faculty to subjects per semester
- 🗓️ **Feedback Sessions** — schedule, activate, and close feedback windows with date-based auto-management
- 📋 **Question Bank** — customizable feedback questionnaire
- 🗂️ **Roll Number Mapping** — map student roll ranges to course/branch/year/semester
- 📈 **Reports** — tabular and visual feedback reports with PDF/Excel export
- 📉 **Analytics** — trend charts, department-wise rating breakdowns
- 🔍 **Audit Logs** — complete admin action trail
- ⚙️ **Settings** — system name, logo, Google login toggle, anonymous feedback toggle

### Student Portal
- 🏠 **Dashboard** — active feedback sessions with completion status
- 📝 **Feedback Form** — per-faculty, per-subject rating form with optional comments
- 📜 **Feedback History** — view past submissions by semester
- 🔔 **Notifications** — alerts for new sessions, reminders
- ❓ **Help & FAQ**
- 🔒 **Privacy Policy**

### Authentication
- 🔐 JWT-based login (username + password)
- 🔵 Google Sign-In (OAuth 2.0)
- 🛡️ Role-based access control: `admin`, `student`, `faculty`, `hod`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite 6 |
| **Styling** | Tailwind CSS v4, Custom CSS |
| **Charts** | Recharts |
| **Routing** | React Router v7 |
| **HTTP Client** | Axios |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT, bcrypt, Google OAuth |
| **File Export** | PDFKit (PDF), ExcelJS (Excel) |
| **Logging** | Winston |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize |

---

## Architecture

```
Client Browser
    ↓  HTTP + JWT
React Frontend (Vite, Port 5173)
    ↓  REST API calls
Express Backend (Node.js, Port 5001)
    ↓  Mongoose ODM
MongoDB Database
```

See [docs/Architecture.md](docs/Architecture.md) for the full system architecture diagram and data flow.

---

## Folder Structure

```
Faculty-Feedback-Management-System/
│
├── src/                         # React frontend source
│   ├── app/                     # Root App component
│   ├── components/
│   │   ├── common/              # Badge, Button, Card, Input, Table
│   │   ├── layout/              # Header, Sidebar, Footer, DashboardLayout
│   │   └── admin/               # AdminShared, RollMappingTab
│   ├── context/                 # AuthContext, ThemeContext, SettingsContext
│   ├── hooks/                   # Custom React hooks
│   ├── pages/
│   │   ├── admin/               # 11 admin pages
│   │   ├── student/             # 5 student pages
│   │   ├── auth/                # Login page
│   │   └── feedback/            # Feedback form
│   ├── routes/                  # AppRouter, ProtectedRoute, RoleRoute
│   ├── services/                # API service layer (12 modules)
│   └── styles/                  # Global CSS, theme variables
│
├── backend/
│   └── src/
│       ├── app.ts               # Express app setup
│       ├── server.ts            # Server entry point
│       ├── config/              # Database connection
│       ├── controllers/         # Request handlers (12 modules)
│       ├── services/            # Business logic (12 modules)
│       ├── routes/              # API routes (12 modules)
│       ├── models/              # Mongoose schemas (9 models)
│       ├── middleware/          # Auth, error handling, validation
│       ├── utils/               # Logger, API response helpers
│       ├── seed/                # Database seeder with KNIT sample data
│       └── jobs/                # Scheduled jobs (session auto-close)
│
├── docs/
│   ├── API_Documentation.md     # All API endpoints documented
│   ├── Database_Schema.md       # All MongoDB collections and fields
│   ├── Architecture.md          # System architecture overview
│   └── Screenshots/             # Application screenshots
│
├── .env.example                 # Environment variable template
├── .gitignore
├── deploy.md                    # Deployment guide
├── LICENSE                      # MIT License
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB running locally (or a MongoDB Atlas URI)
- npm or pnpm

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/faculty-feedback-system.git
cd faculty-feedback-system
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```env
MONGO_URI=mongodb://127.0.0.1:27017/knit-feedback
ACCESS_TOKEN_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
CORS_ORIGIN=http://localhost:5173
PORT=5001
NODE_ENV=development
VITE_API_URL=http://localhost:5001/api
```

### 3. Install Dependencies

**Frontend (project root):**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### 4. Seed the Database (Optional but Recommended)

Seeds the database with realistic KNIT Sultanpur sample data — faculty, students, courses, subjects, and feedback sessions.

```bash
cd backend
npm run seed
```

> ⚠️ This clears all existing data except the admin user.

**Default admin credentials after seeding:**
```
Username: admin@knit.ac.in
Password: Admin@KNIT2026!
```

### 5. Run the Application

**Start the backend:**
```bash
cd backend
npm run dev
# Backend running at http://localhost:5001
```

**Start the frontend (in a new terminal):**
```bash
npm run dev
# Frontend running at http://localhost:5173
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/knit-feedback` |
| `ACCESS_TOKEN_SECRET` | JWT signing secret | — |
| `REFRESH_TOKEN_SECRET` | JWT refresh secret | — |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | — |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:5173` |
| `PORT` | Backend server port | `5001` |
| `NODE_ENV` | Environment mode | `development` |
| `VITE_API_URL` | Frontend API base URL | `http://localhost:5001/api` |

---

## API Reference

See [docs/API_Documentation.md](docs/API_Documentation.md) for the complete API reference covering all 12 route groups.

---

## Database Schema

See [docs/Database_Schema.md](docs/Database_Schema.md) for all 16 MongoDB collections with field definitions and relationships.

---

## Deployment

See [deploy.md](deploy.md) for full deployment instructions covering:
- **Render + Vercel** (recommended for demos)
- **VPS / DigitalOcean** with Nginx + PM2
- **Local production build**

---

## Screenshots

> Add screenshots of your application to `docs/Screenshots/` and reference them here.

| Page | Description |
|------|-------------|
| Admin Dashboard | Live metrics, active sessions, analytics |
| Feedback Form | Per-faculty, per-subject rating form |
| Reports Page | Tabular reports with PDF/Excel export |
| Settings | System configuration panel |

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Project Info

| Field | Value |
|-------|-------|
| **Project Type** | MCA Final Year Project |
| **Institution** | Kamla Nehru Institute of Technology, Sultanpur |
| **Academic Year** | 2025–26 |
| **Course** | Master of Computer Applications (MCA) |

---

*Built with ❤️ for KNIT Sultanpur*