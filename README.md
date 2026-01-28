# Encrypt Edge - Timetable to Google Calendar Sync

A full-stack web application that syncs LPU student timetables to Google Calendar with weekly recurring events.

## 🚀 Features

- **Pre-loaded Student Data**: 18 students with complete timetable data
- **Selective Class Sync**: Choose which classes to sync per student
- **Google Calendar Integration**: Create weekly recurring events with reminders
- **Dashboard**: Track sync status, filter by day/room/student
- **Real-time Status**: See sync progress and event counts

## 👥 Pre-Registered Students

| # | Name | Reg No | Section | Classes |
|---|------|--------|---------|---------|
| 1 | Paramjit Singh | 12311061 | 223PE | 37 |
| 2 | Parth Narula | 12500362 | 223PE | 37 |
| 3 | Ashish Kumar Singh | 12300608 | 223PE | 37 |
| 4 | Yash Yadav | 12309583 | 223PE | 37 |
| 5 | Prabal | 12512197 | 425FT | 29 |
| 6 | Aryan Kumar | 12218679 | 222RB | 5 |
| 7 | Kumar Ayush | 12310661 | - | 0 |
| 8 | Shaun Beniel Edwin | 12218394 | 322MR | 6 |
| 9 | Md Arfaa Taj | 12313447 | 223PE | 29 |
| 10 | Anubhav Jaiswal | 12302387 | 223PE | 30 |
| 11 | Anshul Choudhary | 12205969 | 322EI | 7 |
| 12 | Gagandeep Singh | 12322960 | 423UH | 30 |
| 13 | Shashank Pandey | 12317758 | 223YE | 30 |
| 14 | Priya Jantwal | 12320951 | 223PE | 30 |
| 15 | Aditya Raj | 12307796 | 223OX | 17 |
| 16 | Ankit Ranjan | 12000777 | 222BB | 42 |
| 17 | Rajvardhan Singh | 12303815 | 223FN | 30 |
| 18 | Guddu Kumar Das | 12309867 | 222LH | 8 |

## 📁 Project Structure

```
Encrypt Edge-Timetable/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── server.js       # Entry point
│   │   ├── config/         # Google OAuth config
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Calendar sync logic
│   │   └── middleware/     # Error handling
│   ├── data/
│   │   └── students.json   # Student & timetable data
│   └── .env                # Environment variables
└── frontend/               # React UI
    └── src/
        ├── pages/          # Main views
        ├── components/     # Reusable UI
        └── services/       # API client
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Google Cloud Console project with Calendar API enabled
- OAuth 2.0 credentials configured

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start server
npm run dev
```

Backend runs on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on `http://localhost:5173`

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable **Google Calendar API**
3. Create OAuth 2.0 credentials (Web application)
4. Add redirect URI: `http://localhost:5000/api/auth/callback`
5. Copy credentials to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students |
| GET | `/api/timetable/:regNo` | Get student timetable |
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/status` | Check auth status |
| POST | `/api/calendar/sync` | Sync to calendar |
| GET | `/api/dashboard` | Dashboard data |
| GET | `/api/dashboard/filter` | Filtered data |

## 💻 Usage

1. **View Students**: Go to Students page to see all registered students
2. **Connect Google**: Click "Connect Google" in navbar
3. **Select Classes**: On Timetable page, select/deselect classes to sync
4. **Sync**: Click "Sync to Google Calendar"
5. **Monitor**: Check Dashboard for sync status

## 📝 Tech Stack

- **Backend**: Node.js, Express.js, Google APIs
- **Frontend**: React, Vanilla CSS, React Router, Axios
- **Storage**: JSON file (no database required)

---

Built with ❤️ by Encrypt Edge Team
