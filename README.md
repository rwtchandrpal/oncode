# Oncode – Online Coding Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Now-blue?style=for-the-badge)](https://oncode-self.vercel.app/)

An online coding platform inspired by LeetCode where users can solve programming problems, submit code in multiple languages, and receive instant feedback through secure code execution.

##  Screenshots

> <img width="1916" height="937" alt="Screenshot 2026-08-08 120158" src="https://github.com/user-attachments/assets/e4dde490-aa3c-4f3b-84b4-35c9702ea1f0" />
  <img width="1912" height="938" alt="Screenshot 2026-08-08 120324" src="https://github.com/user-attachments/assets/a5f16218-8147-4350-a68d-ee3a9d8b81ab" />



---

##  Features

### Authentication
- User registration and login
- JWT authentication via Bearer tokens (localStorage)
- Secure password hashing using bcrypt
- User profile & stats

### Coding & Judge System
- Solve coding problems with custom test cases
- Support for C++ and Java
- Secure code execution using an isolated Judge0 instance
- Batch evaluation of multiple test cases
- Execution time and runtime error handling (TLE, SIGSEGV, Compilation Error, etc.)

### Problem Management
- Browse curated problems
- Difficulty levels and tags
- Search and filter functionality
- Seamless frontend markdown rendering

### Admin Dashboard
- Create and edit problems
- Manage test cases and boilerplate driver code
- Review platform-wide user submissions

---

## Tech Stack

### Frontend
- React / Vite
- Redux Toolkit
- Tailwind CSS & DaisyUI
- Axios

### Backend
- Node.js & Express.js
- JSON Web Tokens (JWT)
- Express Rate Limit

### Database & Caching
- MongoDB (Mongoose)
- Redis

### Code Execution
- Judge0 API (AWS EC2 Sandboxing)

---

## Installation

### Clone Repository
```bash
git clone https://github.com/your-username/oncode.git
```

### Install Backend
```bash
cd backend
npm install
```

### Install Frontend
```bash
cd frontend
npm install
```

### Environment Variables
Copy the examples and fill them in:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for every variable.

> **Do not point a local `.env` at the production MongoDB Atlas cluster or Redis Cloud.** Use separate dev
> credentials, or the local Docker stack below.

### Local development stack (Docker)
```bash
docker run -d --name oncode-dev-mongo -p 127.0.0.1:27017:27017 mongo:7 --replSet rs0 --bind_ip_all
docker exec oncode-dev-mongo mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
docker run -d --name oncode-dev-redis -p 127.0.0.1:6379:6379 redis:7-alpine
```
Then use `MONGO_URI=mongodb://127.0.0.1:27017/oncode_dev?replicaSet=rs0&directConnection=true`,
`REDIS_HOST=127.0.0.1`, `REDIS_PORT=6379` and an empty `REDIS_PASS`. A replica set is needed because problem
deletion uses a transaction. `audit/harness/` has a seeded variant (test accounts, sample problems and a mock Judge0).

### Start Servers
Run this in both `frontend` and `backend` directories:
```bash
npm run dev
```

---

##  What I Learned
- Secure authentication using JWT and localStorage
- Integrating AI assistance (Gemini API) to act as a programming tutor
- REST API design and distributed system architecture
- Integrating and managing a remote Judge0 execution engine
- Protecting endpoints with rate limiting
- State management in React with Redux Toolkit
