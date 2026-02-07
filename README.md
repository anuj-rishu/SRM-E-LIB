# SRM E-LIB

A digital library platform for SRM Institute of Science and Technology students to upload, download, and share academic materials. Students authenticate using their SRM Academia credentials and earn points for contributing resources.

## Features

- **SRM Academia Authentication** — Login with your `@srmist.edu.in` credentials (powered by SRM's Zoho-based academia portal)
- **File Upload & Download** — Share study materials (PDFs, notes, etc.) organized by semester, subject code, subject name, and regulation
- **Points System** — Earn points for uploading materials; spend points to download
- **Favorites** — Bookmark files for quick access later
- **Popular Files** — Discover trending materials based on download count
- **User Profile** — View your profile details, department, section, advisors, and point balance
- **PDF Preview** — Preview PDF files directly in the browser
- **Rate Limiting & CSRF Protection** — Secure API with rate limiting and CSRF tokens

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT + CSRF tokens with session cookies
- **File Storage:** Local filesystem with Multer
- **Logging:** Winston
- **Other:** Axios, Cheerio (for SRM Academia scraping), Compression, CORS

### Frontend
- **Library:** React 19
- **Build Tool:** Vite 7
- **UI:** Material UI (MUI) 7 + Tailwind CSS 4
- **HTTP Client:** Axios

## Project Structure

```
SRM-E-LIB/
├── backend/
│   ├── server.js              # Entry point
│   ├── config/                # Environment, DB, CORS, Express, Logger setup
│   ├── handlers/              # Business logic (login, file, profile, user)
│   ├── helpers/               # Helper utilities
│   ├── middleware/             # Auth, error handling, rate limiting
│   ├── models/                # Mongoose schemas (User, File)
│   ├── routes/                # API route definitions
│   └── utils/                 # File upload config, error handling, extraction
├── forntend/
│   ├── src/
│   │   ├── App.jsx            # Root component
│   │   ├── components/        # UI components
│   │   └── services/api.js    # API client
│   └── public/
└── LICENSE
```

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (local instance or MongoDB Atlas connection string)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/anuj-rishu/SRM-E-LIB.git
cd SRM-E-LIB
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
DEV_MODE=true
PORT=9000
MONGODB_URI=mongodb://localhost:27017/elib
JWT_SECRET=your_jwt_secret_here
```

Start the server:

```bash
node server.js
```

The backend API will be available at `http://localhost:9000`.

### 3. Frontend Setup

```bash
cd forntend
npm install
npm run dev
```

The frontend dev server will be available at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Authenticate via SRM Academia |
| DELETE | `/api/logout` | End session |
| GET | `/api/user` | Get authenticated user details |
| POST | `/api/upload` | Upload a study material |
| GET | `/api/files` | List available files |
| GET | `/api/download/:id` | Download a file |
| GET | `/api/user/points` | Get user point balance |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEV_MODE` | Enable dotenv loading | — |
| `PORT` | Server port | `9000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/elib` |
| `JWT_SECRET` | Secret key for JWT signing | — |

## License

This project is licensed under the [Attribution-NonCommercial-NoDerivatives 4.0 International](LICENSE).

## Author

**Anuj Rishu Tiwari** — [@anuj-rishu](https://github.com/anuj-rishu)
