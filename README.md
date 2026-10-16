# Live Customer Churn Risk Assessment Engine
### Real-Time Behavioral Telemetry, Mathematical Risk Scoring & Multi-Agent AI Overrides

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.6-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Cloud_Cluster-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash_LLM-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Deployment](https://img.shields.io/badge/Production-Vercel_%26_Render-000000?logo=vercel&logoColor=white)](https://live-customer-churn-risk-assessment-engine-srixenos-projects.vercel.app)

---

## 🌟 Executive Overview

The **Live Customer Churn Risk Assessment Engine** is an enterprise-grade, event-driven customer retention platform built for modern e-commerce ecosystems. 

Traditional CRM platforms operate **reactively**—analyzing churn through post-cancellation exit surveys and support tickets after customer loss has already occurred. Furthermore, existing machine learning pipelines rely on **24-hour overnight batch processing**, creating an unmonitored operational window where high-intent buyers silently disengage.

This platform replaces batch delays with a **continuous, 20-second behavioral telemetry pipeline**. It computes dynamic mathematical risk scores in real-time, broadcasts live event feeds over full-duplex WebSockets, executes autonomous email retention vouchers via an event-driven Autopilot engine, and provides a **Multi-Agent Generative AI Negotiation Arena** with a strict **Human-in-the-Loop (HITL) Manager Override Registry**.

---

## 🎯 Key Architectural Pillars

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           THE EVENT-DRIVEN CONTINUUM                            │
├──────────────────────┬──────────────────────┬───────────────────────────────────┤
│ 1. Telemetry Capture │ 2. Dynamic Scoring   │ 3. Automated & Human Retention    │
│  Continuous 20s      │  Multi-variable      │  Autopilot 20% discount vouchers  │
│  stochastic event    │  mathematical risk   │  + Gemini Multi-Agent Arena       │
│  heartbeat thread    │  scoring (1 to 99)   │  + HITL Manager Override Registry │
└──────────────────────┴──────────────────────┴───────────────────────────────────┘
```

- **Zero-Latency Telemetry Streaming:** An asynchronous background simulator generates real-time customer behavior (cart exits, checkout views, purchase decays) and streams score updates directly to client dashboards via Socket.io without page reloads.
- **Explainable Multi-Variable Risk Equation:** Transparent, bounded arithmetic scoring combining Temporal Inactivity ($40\%$), Cart Abandonment Rate ($30\%$), and Purchase Frequency Decay ($30\%$).
- **Multi-Agent AI Negotiation Arena:** Powered by Google Gemini 1.5 LLM, allowing Customer Success teams to simulate multi-turn retention dialogues with simulated customer personas (Price-Sensitive, Angry, Indifferent) alongside real-time sentiment scoring.
- **Pearl's Counterfactual Scenario Branching:** "What-if" forecasting engine allowing managers to test hypothetical recovery scripts against historical friction events to predict score drops ($\Delta S$) before live contact.
- **Human-in-the-Loop (HITL) Governance:** Mandatory audit trail and compliance registry for human managers to override algorithmic tier recommendations with recorded justification.

---

## 📐 Mathematical Risk Scoring Model

The dynamic churn risk metric $S \in [1, 99]$ is evaluated on every behavioral event using the multi-variable weighted equation:

$$S = \min\left(99, \max\left(1, \left\lfloor 0.40 \cdot \frac{\min(T_{\text{inact}}, 120)}{120} \times 100 + 0.30 \cdot \frac{\min(R_{\text{cart}}, 100)}{100} \times 100 + 0.30 \cdot \frac{\min(D_{\text{freq}}, 100)}{100} \times 100 \right\rfloor\right)\right)$$

### Operational Tier Discretization:

| Risk Tier | Score Range | UI Indicator | Automated Trigger & Recommended Action |
| :--- | :---: | :---: | :--- |
| **High Risk** | $70 - 100$ | `Red Flag` | **Autopilot Trigger:** 20% Discount Voucher email dispatch + Priority Manager Intervention alert. |
| **Medium Risk** | $40 - 69$ | `Yellow Flag` | **Cart Recovery Trigger:** Automated cart checkout reminder email dispatch. |
| **Low Risk** | $1 - 39$ | `Green Flag` | **Standard Operations:** Healthy account cadence; standard loyalty telemetry logging. |

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER                                   |
|  React 18 + Vite SPA | SCSS Glassmorphic Design | Chart.js 2D Canvas Engine       |
|  - Real-time KPI Dashboard (Live score tickers, interactive telemetry data table)  |
|  - Customer 360 Profile (Score trajectory lines, cart events, transaction audit)  |
|  - Multi-Agent AI Arena & Counterfactual Branching Simulator (Trainer.jsx)        |
|  - Admin Cockpit (Autopilot threshold tuning, database seeding & wipe controls)   |
+-----------------------------------------------------------------------------------+
                                   ▲                        ▲
                WebSocket (Full-Duplex)             REST API (HTTP/JSON)
                                   ▼                        ▼
+-----------------------------------------------------------------------------------+
|                             APPLICATION LAYER                                     |
|  Node.js (v18+) & Express.js Non-Blocking Asynchronous Micro-Engine (Port 10000)  |
|                                                                                   |
|  [Background Workers]                                                             |
|  * Activity Simulator Thread (20-second continuous stochastic event heartbeat)    |
|  * Scheduled Batch Recalculator (Cron interval every 30 minutes)                  |
|                                                                                   |
|  [Operational Engines]                                                            |
|  * Multi-Variable Risk Scorer (riskScorer.js / churnScorer.js)                    |
|  * Autopilot Rule Dispatcher (Condition evaluators & automated voucher triggers)  |
|  * Multi-Agent LLM Copilot & Heuristic Fallback Engine                            |
|                                                                                   |
|  [Security & Middleware]                                                          |
|  * JWT Authorization (7-Day TTL) & bcryptjs Password Encryption                   |
|  * Role-Based Access Control (RBAC: Admin, Manager, Agent)                        |
|  * Helmet Security Headers & Express Rate Limiter                                 |
+-----------------------------------------------------------------------------------+
             ▲                                ▲                           ▲
             │                                │                           │
             ▼                                ▼                           ▼
+-----------------------+   +-----------------------+   +-----------------------+
|    PERSISTENCE LAYER  |   |    AI INFERENCE LAYER |   |  COMMUNICATION LAYER  |
|  MongoDB Atlas Cluster|   |  Google Gemini 1.5    |   |  Brevo REST API &     |
|  - Customer Collection|   |  Flash LLM API        |   |  EmailJS Dispatchers  |
|  - User Collection    |   |  - JSON Schema Prompts|   |  - Transactional Vouchers|
|  - Campaign Collection|   |  - Sentiment (0-100)  |   |  - Cart Recovery Cards|
|  - Override Audit Log |   |  - Retention Prob.    |   |  - Automated Webhooks |
+-----------------------+   +-----------------------+   +-----------------------+
```

---

## 💻 Technology Stack

### Frontend Architecture
- **Framework:** React 18 & Vite (Ultra-fast HMR and optimized build compilation)
- **Styling Architecture:** Modular SCSS (Glassmorphic physics, cyberpunk cards, smooth CSS micro-animations)
- **Data Visualization:** Chart.js & React-ChartJS-2 (HTML5 Canvas-based doughnut & longitudinal trend charts)
- **Iconography & Visuals:** Lucide-React vector glyphs & HTML5 Matrix Canvas stream
- **Real-Time Client:** Socket.io-client (Persistent full-duplex WebSocket connection)

### Backend Architecture
- **Runtime Environment:** Node.js (v18.0.0+)
- **Web Framework:** Express.js 4.18 with modular routing architecture
- **Real-Time Engine:** Socket.io Server (Dual transports: `websocket` with `polling` fallback)
- **Database Modeling:** Mongoose ODM 8.0 with compound indexing
- **Security & Auth:** JSON Web Tokens (JWT with 7-day validity), bcryptjs hashing, Helmet.js headers, rate-limiting middleware

### AI & Third-Party Integrations
- **Generative AI:** Google Gemini 1.5 Flash LLM (Structured JSON schema extraction)
- **Resilience Engine:** Local deterministic regex-heuristic fallback handler
- **Email Dispatchers:** Brevo REST API & EmailJS transactional email delivery

---

## 📂 Repository Structure

```text
S7_Project/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB Atlas connection & Socket.io server config
│   │   ├── jobs/            # 20s Activity Simulator & cron batch schedulers
│   │   ├── middleware/      # JWT auth, RBAC role-checking, error & rate-limiters
│   │   ├── models/          # Mongoose collection schemas (Customer, User, Campaign, Override)
│   │   ├── routes/          # REST route handlers (customers, campaigns, admin, analytics)
│   │   ├── services/        # Email dispatcher, Risk Scorer & Socket emitters
│   │   └── utils/           # Mock data generators, validators & response envelopes
│   ├── server.js            # Main backend entry point with dynamic port fallback (10000-10009)
│   └── package.json         # Backend dependencies & seeding scripts
├── frontend/
│   ├── src/
│   │   ├── components/      # Modular UI widgets (StatCards, TiltCards, CustomerTable, Matrix Canvas)
│   │   ├── context/         # AuthContext (JWT) & SocketContext (WebSocket stream)
│   │   ├── hooks/           # Telemetry, real-time socket, and churn data custom hooks
│   │   ├── pages/           # Dashboard, CustomerProfile, Trainer, Admin, Analytics, Campaigns
│   │   ├── router.jsx       # Client-side protected & admin-only routing guards
│   │   ├── services/        # Axios API client & EmailJS service
│   │   └── styles/          # Modular SCSS design system (glassmorphism, variables, layout)
│   ├── vite.config.js       # Vite build configuration
│   └── package.json         # Frontend dependencies & build scripts
├── database/
│   ├── indexes/             # MongoDB performance indexing scripts
│   ├── schemas/             # Formal schema specifications (customer, order, override)
│   └── seeds/               # Database seeder scripts (150 realistic customer records)
├── docs/
│   ├── ARCHITECTURE.md      # Comprehensive theoretical and architectural documentation
│   ├── API_DOCUMENTATION.md # Full REST API endpoints and WebSocket protocol specification
│   ├── DEMO_SCRIPT.md       # Step-by-step live presentation & evaluation script
│   └── DEPLOYMENT_GUIDE.md  # Production cloud deployment runbook (Vercel & Render)
├── start.bat                # Automated one-click dual-server local launcher
└── WEEKLY_PROJECT_LOG.txt   # Engineering milestones & development weekly logs
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Package Manager:** `pnpm` (recommended) or `npm`
- **Database:** MongoDB Atlas URI or local MongoDB instance

### 1. One-Click Launcher (Windows)
Double-click `start.bat` or run in terminal:
```cmd
start.bat
```
*This automatically boots the backend on port 10000 and frontend on port 5173.*

---

### 2. Manual Setup

#### Step A: Configure Backend
```bash
cd backend
pnpm install

# Create and configure .env
cp .env.example .env
```
Ensure your `backend/.env` contains:
```env
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_optional
```

Seed the database with 150 realistic customer telemetry records:
```bash
pnpm run seed
```

Start backend development server:
```bash
pnpm dev
```

#### Step B: Configure Frontend
```bash
cd ../frontend
pnpm install

# Create and configure .env
cp .env.example .env
```
Ensure your `frontend/.env` contains:
```env
VITE_API_URL=http://localhost:10000/api
VITE_SOCKET_URL=http://localhost:10000
```

Start frontend development server:
```bash
pnpm dev
```
Navigate to **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Credentials

| Role | Email Identifier | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin@xenoproducts.com` | `Admin@123` | Full system access: Live Dashboard, Customer 360, AI Arena, Autopilot Rules, DB Seed/Wipe. |
| **Customer Success Manager** | `manager@xenoproducts.com` | `Manager@123` | Operational access: Live Dashboard, Customer Profiles, Scenario Branching, Recommendation Overrides. |

*(Quick-fill buttons are provided directly on the Login page for rapid demonstration).*

---

## 🧪 Documentation & Testing Suite

Comprehensive engineering and compliance documentation is provided in the [`docs/`](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/docs/) directory:
- **[System Architecture & Mathematical Theory](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/docs/ARCHITECTURE.md):** Formal derivation of the continuous scoring model, multi-agent AI dialogue dynamics, and Pearl's counterfactual branching.
- **[REST API & WebSocket Protocol](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/docs/API_DOCUMENTATION.md):** Complete catalog of endpoints, payload structures, query filters, and WebSocket event channels.
- **[Live Demonstration & Review Script](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/docs/DEMO_SCRIPT.md):** Turn-by-turn evaluator protocol for presenting real-time telemetry, overrides, and AI Arena simulations.
- **[Production Deployment Guide](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/docs/DEPLOYMENT_GUIDE.md):** Production runbook for deploying to Vercel (Edge CDN) and Render Web Services.

---

## 🎓 Academic Metadata

- **Institution:** Bannari Amman Institute of Technology
- **Department:** Artificial Intelligence and Data Science
- **Course / Session:** Academic Year 2026 – 2027 | S7 Project Work
- **BIP Project ID:** `2026AC395` | **Category:** Academic Project
- **Project Title:** *Live Customer Churn Risk Assessment Engine with Real-Time Recommendation Overrides for E-Commerce*
- **Authoring Team:**
  - **Logesh M** (`241CS505`)
  - **Siranjeevi S** (`241CS514`)
  - **Sridhar M** (`241CS515`)
- **Project Guide:** **Srisoundaryaa S S P**, Associate Professor, Dept. of AI & DS

---

## 📄 License
This project is developed for academic, demonstration, and enterprise research purposes.
