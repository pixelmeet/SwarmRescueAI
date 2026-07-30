# 🚨 SwarmRescue AI

> **Multi-Agent Disaster Triage, Dynamic Dispatch, & Real-Time Emergency Response Coordination Platform**

SwarmRescue AI is a real-time, multi-tier emergency response platform designed to automate incident triage, optimize responder assignment using dynamic weighted scoring algorithms, track live spatial positioning of rescue units, and stream real-time updates across emergency dispatch control rooms and field responders.

---

## 📐 Complete Project Structure

```
swarmrescue-ai/
├── frontend/                          # Next.js 15 (App Router, TypeScript, Tailwind CSS, Recharts)
│   ├── app/
│   │   ├── (public)/
│   │   │   └── report/page.tsx        # Citizen emergency report intake & location picker
│   │   ├── (dashboard)/
│   │   │   ├── admin/page.tsx         # Dispatcher command center & JWT admin login
│   │   │   ├── team/page.tsx          # Field responder & volunteer task manager (en_route -> completed)
│   │   │   └── analytics/page.tsx     # Incident response analytics & Recharts visualizations
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
│   │   └── ui/                        # Reusable design primitives (Skeleton, Button, Input, Badge)
│   ├── lib/
│   │   ├── api.ts                     # Async FastAPI client & JWT bearer header manager
│   │   ├── socket.ts                  # WebSocket live feed client connection manager
│   │   └── validators.ts              # Client-side form & payload validation utilities
│   ├── types/
│   │   └── index.ts                   # Platform TypeScript type definitions & interfaces
│   ├── .env.local                     # Frontend environment variables template
│   └── package.json                   # Frontend dependencies & package config
│
├── backend/                           # FastAPI (Python 3.11+, Motor Async MongoDB)
│   ├── app/
│   │   ├── main.py                    # FastAPI application initialization & router mounts
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
│   │   ├── routers/                   # Modular REST API routes (/api/...)
│   │   │   ├── requests.py            # Incident management endpoints
│   │   │   ├── teams.py               # Rescue team registry endpoints
│   │   │   ├── ambulances.py          # Ambulance telemetry endpoints
│   │   │   ├── hospitals.py           # Hospital capacity monitoring endpoints
│   │   │   ├── volunteers.py          # Volunteer registry endpoints
│   │   │   ├── assignments.py         # JWT-protected dispatch assignment endpoints
│   │   │   ├── auth.py                # JWT authentication endpoints (/api/auth/login)
│   │   │   └── analytics.py           # Aggregated incident metrics endpoint (/api/analytics)
│   │   ├── services/                  # Core domain & intelligence services
│   │   │   ├── severity_classifier.py # Groq LLM emergency report severity classifier
│   │   │   ├── scoring_engine.py      # Multi-criteria weighted assignment engine
│   │   │   ├── routing.py             # OSRM routing engine integration & ETA calculation
│   │   │   ├── notify.py              # Outbound Next.js notification trigger service
│   │   │   └── ws_manager.py          # WebSocket broadcast connection manager
│   │   ├── core/
│   │   │   ├── security.py            # Passlib bcrypt hashing & JWT token encoding/decoding
│   │   │   └── deps.py                # FastAPI HTTPBearer get_current_admin route dependency
│   │   └── seed/
│   │       └── seed_data.py          # Database seeder script for teams, hospitals, volunteers
│   ├── requirements.txt               # Backend Python package requirements
│   └── .env                           # Backend environment variables template
│
└── README.md                          # Comprehensive setup & architecture documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | [Next.js 15](https://nextjs.org/) (App Router, TypeScript, React 19) |
| **Styling & Visualization** | [Tailwind CSS](https://tailwindcss.com/), [Recharts](https://recharts.org/), [Lucide React](https://lucide.dev/) |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+), [Uvicorn](https://www.uvicorn.org/) |
| **Database & Geospatial** | [MongoDB Atlas / Local](https://www.mongodb.com/) with [Motor](https://motor.readthedocs.io/) async driver & `2dsphere` indexes |
| **AI Triage & Services** | Groq LLM (`llama-3.3-70b-versatile`), OSRM Routing Engine, WebSockets, Nodemailer |
| **Authentication & Security** | Passlib (bcrypt), PyJWT / python-jose Bearer Tokens |

---

## 🔑 Comprehensive Environment Configuration

### 1. MongoDB Setup (`MONGO_URI`)
- **Local MongoDB**: Run `mongod` locally on default port `27017`: `mongodb://localhost:27017`
- **MongoDB Atlas (Cloud)**:
  1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
  2. Go to **Database Access** -> create a database user and password.
  3. Go to **Network Access** -> click **Add IP Address** -> select **Allow Access from Anywhere** (`0.0.0.0/0`).
  4. Click **Connect** -> **Drivers** and copy your connection string (e.g. `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority`).

### 2. Groq LLM API Key (`GROQ_API_KEY`)
1. Create a free account at [Groq Console](https://console.groq.com/).
2. Navigate to **API Keys** and generate an API key (`gsk_...`).
3. Set `GROQ_API_KEY` in `backend/.env`.

### 3. Gmail SMTP App Password Setup (`EMAIL_USER`, `EMAIL_APP_PASSWORD`)
1. Sign in to your Google Account and go to **Security** -> **2-Step Verification** (Ensure 2FA is enabled).
2. Search for **App Passwords** or navigate to `https://myaccount.google.com/apppasswords`.
3. Create a new App Password for "Mail".
4. Copy the generated 16-character password and set `EMAIL_APP_PASSWORD` in `frontend/.env.local`.

---

### Backend Configuration File (`backend/.env`)

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=swarmrescue

GROQ_API_KEY=gsk_your_groq_api_key_here
OSRM_BASE_URL=http://router.project-osrm.org

JWT_SECRET=your_jwt_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminpass

NEXTJS_NOTIFY_URL=http://localhost:3000/api/notify
INTERNAL_API_SECRET=your_internal_secret_here
```

### Frontend Configuration File (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_16_char_app_password

INTERNAL_API_SECRET=your_internal_secret_here
```

---

## 🚀 Step-by-Step Local Setup & Execution Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10.0 or higher
- **MongoDB**: Running local MongoDB or MongoDB Atlas URI

---

### Step 1: Set Up & Launch Backend Service

1. Open terminal and navigate to `backend/`:
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
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed database with initial rescue teams, hospitals, ambulances, and volunteers:
   ```bash
   python -m app.seed.seed_data
   ```
5. Start the FastAPI Uvicorn server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
6. Verify backend is running at **[http://localhost:8000](http://localhost:8000)** and Swagger docs at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

### Step 2: Set Up & Launch Frontend Service

1. Open a second terminal window and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Launch the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🧪 End-to-End Testing Workflow

1. **Submit Emergency Report (Public Form)**:
   - Open `http://localhost:3000/report`
   - Select emergency location on map, enter reporter details & incident description (e.g. *"Building collapsed due to flood waters, 3 people trapped on roof requiring boat extraction"*).
   - Submit report. AI classifies severity as `CRITICAL` / `trapped`, sends email confirmation, and broadcasts live WebSocket event.

2. **Admin Command Center Authentication & Dispatch**:
   - Open `http://localhost:3000/admin`
   - Enter admin credentials (`admin` / `adminpass`).
   - Inspect incident queue, click request to fetch AI geospatial scoring recommendations.
   - Click **Assign Resource** to dispatch nearest rescue team. Unauthenticated requests to `/api/assignments` are rejected with `401 Unauthorized`.

3. **Field Responder Portal Workflow**:
   - Open `http://localhost:3000/team`
   - Select assigned unit from dropdown.
   - Click **En Route to Emergency** (flips status to `en_route`).
   - Click **Mark Completed & Resolve Incident** (flips status to `completed` & request status to `resolved`).
   - System automatically sends resolution email to citizen reporter and updates resource availability to `available`.

4. **Response & Incident Analytics**:
   - Open `http://localhost:3000/analytics`
   - View real-time average triage-to-assignment time, assignment-to-resolution time, resource utilization %, and Recharts bar charts for incident category and severity breakdown.

---

## 📄 License

This project is licensed under the MIT License.
