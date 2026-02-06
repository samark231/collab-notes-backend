# 🛠 Collaborative Notes App - Backend

The backend server for the Real-Time Collaborative Notes application. Built with Node.js, Express, and PostgreSQL, it handles REST API requests, authentication, and real-time WebSocket connections.

## 🚀 Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Real-Time:** Socket.io
- **Auth:** JWT (JSON Web Tokens) with HttpOnly Cookies
- **Security:** Bcrypt (hashing), Helmet, CORS

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v20 or higher)
- PostgreSQL installed and running locally

### 2. Installation
```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install
```

### 3. Environment Variables

Create a `.env` file in the root of the backend folder and add the following:

```env
PORT=5000

# Database Connection String
DATABASE_URL=your_database_url

# Frontend Url for cors
CLIENT_URL= [https://collab-notes-frontend.onrender.com/,"http://localhost:5173"]


# Security Secrets
JWT_SECRET=your_super_secret_string_here

# Environment (use 'production' when deploying)
NODE_ENV=development
```

### 4. Database Setup

The application automatically checks for tables on startup. However, you can verify your database exists:

```sql
CREATE DATABASE collab_notes_db;
```

### 5. Running the Server
```bash
# Development Mode (with nodemon)
npm run dev

# Production Mode
npm start
```

Server runs on: http://localhost:5000

---

## 📡 API Documentation

### 🔐 Authentication
- `POST /api/auth/signup` – Register a new user
- `POST /api/auth/login` – Login and set secure cookie
- `POST /api/auth/logout` – Clear auth cookie
- `GET /api/auth/check-auth` – Get current logged-in user

### 📝 Notes Management
- `GET /api/notes` – Fetch all notes (Owned + Shared)
- `POST /api/notes` – Create a new note
- `GET /api/notes/:id` – Get details of a specific note
- `PUT /api/notes/:id` – Update title/content
- `DELETE /api/notes/:id` – Delete note (Owner only)

### 🤝 Collaboration
- `POST /api/notes/:id/collaborators` – Add a user as Editor/Viewer

---

## 🔌 Socket.io Events

The WebSocket server listens for the following events:

| Event Name     | Direction          | Payload                       | Description                              |
|----------------|-------------------|-------------------------------|------------------------------------------|
| `connection`   | Client → Server   | –                             | Establishes handshake                    |
| `join_note`    | Client → Server   | `noteId`                      | Joins a specific room for a note         |
| `send_update`  | Client → Server   | `{ noteId, title, content }`  | Broadcasts changes to room               |
| `receive_update` | Server → Client | `{ title, content }`          | Updates other users' UI                  |

---

## 🗄 Database Schema

The backend automatically creates and manages the following tables on startup:

### 1. `users`
Stores registered user information.
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firstName VARCHAR(50),
    lastName VARCHAR(50),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. `notes`
Stores notes created by users.
```sql
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. `collaborators`
Manages shared access and permissions.
```sql
CREATE TABLE IF NOT EXISTS collaborators (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('EDITOR', 'VIEWER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(note_id, user_id)
);
```

### 4. `activity_log`
Tracks user actions on notes.
```sql
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

This backend is designed for scalability, security, and real-time collaboration. 🚀