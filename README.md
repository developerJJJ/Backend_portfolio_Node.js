# BaseballUSA ⚾

BaseballUSA is a full-stack community portal designed for US baseball enthusiasts. Inspired by the density and functionality of community sites like MissyUSA, it provides a dedicated space for discussing leagues, equipment, and general baseball topics.

## 🛠 Tech Stack

### Frontend
*   **React (Vite)**: Fast, modern UI library for building interactive interfaces.
*   **React Router**: Handles client-side routing for seamless navigation.
*   **Bootstrap 5 (React-Bootstrap)**: Provides a responsive grid system and pre-styled components for the "portal" layout.
*   **Axios**: Promise-based HTTP client for making API requests to the backend.

### Backend
*   **Node.js**: JavaScript runtime environment.
*   **Express.js**: Minimalist web framework for building the REST API.
*   **SQLite**: Lightweight, file-based relational database (no external server required).
*   **Bcrypt**: Library for hashing and securing user passwords.
*   **JSON Web Token (JWT)**: Stateless authentication mechanism for secure user sessions.

## 🏗 Architecture

The application follows a classic **Client-Server** architecture.

### High-Level Overview
1.  **Client (Frontend)**: Runs in the user's browser. It fetches data from the API and renders the UI. It manages user state (auth tokens) in local storage/memory.
2.  **Server (Backend)**: Runs on a Node.js process. It exposes RESTful API endpoints (e.g., `GET /api/posts`, `POST /api/login`).
3.  **Database**: A local SQLite file (`baseball.db`) managed by the server.

### Database Schema

**Users Table**
*   `id`: Integer, Primary Key
*   `username`: Text, Unique
*   `password`: Text (Hashed)

**Posts Table**
*   `id`: Integer, Primary Key
*   `title`: Text
*   `content`: Text
*   `author`: Text (Foreign Key link to User)
*   `category`: Text (e.g., 'general', 'equipment')
*   `created_at`: DateTime
*   `views`: Integer

## ✨ Features

*   **Community Forums**: Categorized bulletin boards.
*   **CRUD Functionality**:
    *   **Create**: Authenticated users can write new posts.
    *   **Read**: Public access to read all discussions.
    *   **Update/Delete**: Authors have exclusive rights to edit or remove their own content.
*   **Authentication**: Secure Sign-Up and Login flows.
*   **Portal Layout**: "Hot Topics" and side-navigation for quick access to different boards.

## 🚀 How to Run

**1. Backend Server**
```bash
cd server
npm install
npm start
# Server runs on http://localhost:3000
```

**2. Frontend Client**
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:5173 (usually)
```
