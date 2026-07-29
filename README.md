# 🚨 SwarmRescue AI

> **Multi-Agent Disaster Triage, Dynamic Dispatch, & Real-Time Emergency Response Coordination Platform**

SwarmRescue AI is a real-time, multi-tier emergency response platform designed to automate incident triage, optimize responder assignment using dynamic weighted scoring algorithms, track live spatial positioning of rescue units, and stream real-time updates across emergency dispatch control rooms and field responders.

---

## 📐 Complete Project Structure

```
swarmrescue-ai/
├── frontend/                          # Next.js 15 (App Router, TypeScript, Tailwind CSS)
│   ├── app/
│   │   ├── (public)/
│   │   │   └── report/page.tsx        # Citizen emergency report intake & location picker
│   │   ├── (dashboard)/
│   │   │   ├── admin/page.tsx         # Dispatcher command center (live queue, map, manual override)
│   │   │   ├── team/page.tsx          # Field responder & volunteer task view
│   │   │   └── analytics/page.tsx     # Incident response time statistics & performance metrics
│   │   ├── api/
│   │   │   ├── notify/route.ts        # Nodemailer email notification dispatcher
│   │   │   └── internal/geocode/route.ts # Geocoding API route
│   │   ├── layout.tsx                 # Root layout wrapper
│   │   ├── globals.css                # Global styles & Tailwind base directives
│   │   └── page.tsx                   # Main platform landing hub
│   ├── components/
│   │   ├── map/                       # Spatial map components (LeafletMap, RequestMarker, RouteLine)
│   │   ├── forms/                     # Interactive forms (EmergencyReportForm, LocationPicker)
│   │   ├── dashboard/                 # Command widgets (RequestQueue, AssignmentCard, StatsPanel)
│   │   └── ui/                        # Reusable design primitives (Button, Input, Badge)
│   ├── lib/
│   │   ├── api.ts                     # Async FastAPI client wrapper
│   │   ├── socket.ts                  # WebSocket live feed client connection manager
│   │   └── validators.ts              # Client-side form & payload validation utilities
│   ├── types/
│   │   └── index.ts                   # Platform TypeScript type definitions & interfaces
│   ├── .env.local                     # Frontend environment variables template
│   └── package.json                   # Frontend dependencies & package config
│
├── backend/                           # FastAPI (Python 3.11+, Motor Async MongoDB)
│   ├── app/
│   │   ├── main.py                    # FastAPI application initialization & middleware
│   │   ├── config.py                  # Pydantic BaseSettings environment manager
│   │   ├── db/
│   │   │   ├── mongo.py               # Async Motor MongoDB client setup & lifecycle hooks
│   │   │   └── indexes.py             # Geospatial 2dsphere index configuration
│   │   ├── schemas/                   # Pydantic models & request/response validation
│   │   │   ├── request.py             # Emergency incident request schemas
│   │   │   ├── team.py                # Rescue team resource schemas
│   │   │   ├── ambulance.py           # Ambulance dispatch schemas
│   │   │   ├── hospital.py            # Hospital bed capacity schemas
│   │   │   ├── volunteer.py           # Registered volunteer schemas
│   │   │   └── assignment.py          # Unit dispatch assignment schemas
│   │   ├── routers/                   # Modular REST API routes (/api/v1/...)
│   │   │   ├── requests.py            # Incident management endpoints
│   │   │   ├── teams.py               # Rescue team registry endpoints
│   │   │   ├── ambulances.py          # Ambulance telemetry endpoints
│   │   │   ├── hospitals.py           # Hospital capacity monitoring endpoints
│   │   │   ├── volunteers.py          # Volunteer registry endpoints
│   │   │   ├── assignments.py         # Automated & manual dispatch override endpoints
│   │   │   └── auth.py                # JWT authentication endpoints
│   │   ├── services/                  # Core domain & intelligence services
│   │   │   ├── severity_classifier.py # Groq LLM emergency report severity classifier
│   │   │   ├── scoring_engine.py      # Multi-criteria weighted assignment engine
│   │   │   ├── routing.py             # OSRM routing engine integration & ETA calculation
│   │   │   ├── notify.py              # Outbound Next.js notification trigger service
│   │   │   └── ws_manager.py          # WebSocket broadcast connection manager
│   │   ├── core/
│   │   │   ├── security.py            # JWT token encoding/decoding & security helpers
│   │   │   └── deps.py                # FastAPI route dependency injections
│   │   └── seed/
│   │       └── seed_data.py          # Database seeder script for teams, hospitals, volunteers
│   ├── requirements.txt               # Backend Python package requirements
│   └── .env                           # Backend environment variables template
│
├── docs/
│   ├── architecture.md                # System architecture documentation & sequence flows
│   └── api-spec.md                    # REST API specifications & WebSocket protocols
│
└── README.md                          # Project documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | [Next.js 15](https://nextjs.org/) (App Router, TypeScript, React 19) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [PostCSS](https://postcss.org/), [Autoprefixer](https://github.com/postcss/autoprefixer), [Lucide React](https://lucide.dev/) |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+), [Uvicorn](https://www.uvicorn.org/) |
| **Database & Geospatial** | [MongoDB](https://www.mongodb.com/) with [Motor](https://motor.readthedocs.io/) async driver & `2dsphere` indexes |
| **AI Triage & Services** | Groq LLM API, OSRM Routing Engine, WebSockets, Nodemailer |
| **Authentication** | OAuth2 / JWT (`python-jose`) |

---

## 🔑 Environment Variables Setup

### Frontend (`frontend/.env.local`)

```env
# FastAPI Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Email Sender Configuration (Nodemailer)
EMAIL_USER=user@example.com
EMAIL_APP_PASSWORD=placeholder_password

# Internal Route Authentication Secret
INTERNAL_API_SECRET=placeholder_secret
```

### Backend (`backend/.env`)

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=swarmrescue

# AI & Routing Integrations
GROQ_API_KEY=placeholder_groq_key
OSRM_BASE_URL=http://router.project-osrm.org

# Authentication & Notifications
JWT_SECRET=placeholder_jwt_secret
NEXTJS_NOTIFY_URL=http://localhost:3000/api/notify
INTERNAL_API_SECRET=placeholder_secret
```

---

## 🚀 Quickstart Guide

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Python**: v3.11.0 or higher
- **MongoDB**: Local MongoDB instance running on port `27017` or MongoDB Atlas URI

---

### Step 1: Run the Frontend

1. Open a terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the web interface at **[http://localhost:3000](http://localhost:3000)**.

---

### Step 2: Run the Backend

1. Open a second terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed initial database data (optional):
   ```bash
   python -m app.seed.seed_data
   ```
5. Start the FastAPI application with live-reloading:
   ```bash
   uvicorn app.main:app --reload
   ```
6. Access interactive Swagger API documentation at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

## 🛰️ API Endpoint Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root health check & API metadata |
| `GET` | `/health` | Application status probe |
| `GET` / `POST` | `/api/v1/requests` | List or submit emergency incident reports |
| `GET` / `POST` | `/api/v1/teams` | List or register rescue response teams |
| `GET` | `/api/v1/ambulances` | Fetch available emergency ambulances |
| `GET` | `/api/v1/hospitals` | Query hospital bed capacity & ICU availability |
| `GET` | `/api/v1/volunteers` | List registered nearby volunteer responders |
| `POST` | `/api/v1/assignments/auto-assign` | Trigger AI weighted scoring dispatch algorithm |
| `POST` | `/api/v1/assignments/manual-override` | Dispatcher manual override for unit assignment |
| `POST` | `/api/v1/auth/login` | Responder & Admin authentication |
| `WS` | `/ws/live-feed` | Real-time WebSocket incident and telemetry feed |

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.
