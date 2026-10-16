# Live Customer Churn Risk Assessment Engine

### Real-Time Behavioral Telemetry, Mathematical Risk Scoring, and Automated Retention Overrides

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.6-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Cloud_Cluster-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash_LLM-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Deployment](https://img.shields.io/badge/Production-Vercel_%26_Render-000000?logo=vercel&logoColor=white)](https://live-customer-churn-risk-assessment-engine-srixenos-projects.vercel.app)

---

## Executive Overview

The **Live Customer Churn Risk Assessment Engine** is an event-driven customer retention platform designed for digital commerce environments.

Traditional Customer Relationship Management (CRM) platforms operate reactively, registering churn signals through post-cancellation exit surveys and customer service escalations after account loss has already taken place. Furthermore, conventional machine learning implementations depend on 24-hour overnight batch processing routines, introducing operational latency where high-intent buyers disengage without detection.

This platform replaces batch delays with a continuous, 20-second behavioral telemetry pipeline. It computes dynamic mathematical risk scores in real time, streams live event feeds over full-duplex WebSockets, dispatches automated retention vouchers via an event-driven Autopilot engine, and provides a Multi-Agent Generative AI Negotiation Arena backed by a Human-in-the-Loop (HITL) Manager Override Registry.

---

## Core Architectural Principles

```
+---------------------------------------------------------------------------------+
|                           THE EVENT-DRIVEN PIPELINE                             |
+----------------------+----------------------+-----------------------------------+
| 1. Telemetry Capture | 2. Dynamic Scoring   | 3. Automated & Human Retention    |
|  Continuous 20s      |  Multi-variable      |  Autopilot retention vouchers     |
|  stochastic event    |  mathematical risk   |  + Gemini Multi-Agent Arena       |
|  heartbeat thread    |  scoring (1 to 99)   |  + HITL Manager Override Registry |
+----------------------+----------------------+-----------------------------------+
```

- **Zero-Latency Telemetry Streaming:** An asynchronous background worker simulates real-time customer behavior (cart exits, checkout views, purchase decays) and streams score updates directly to client dashboards via Socket.io without page reloads.
- **Explainable Multi-Variable Risk Equation:** Bounded arithmetic scoring combining Temporal Inactivity (40%), Cart Abandonment Rate (30%), and Purchase Frequency Decay (30%).
- **Multi-Agent AI Negotiation Arena:** Powered by Google Gemini 1.5 LLM, allowing retention teams to simulate multi-turn negotiation dialogues with modeled customer personas (Price-Sensitive, Angry, Indifferent) alongside real-time sentiment scoring.
- **Counterfactual Scenario Branching:** Simulation framework allowing operators to evaluate hypothetical recovery scripts against historical friction events to project score reductions before executing real-world interventions.
- **Human-in-the-Loop Governance:** Mandatory audit trail and compliance registry for human managers to override algorithmic tier recommendations with recorded justification.

---

## Mathematical Risk Scoring Model

The dynamic churn risk metric $S \in [1, 99]$ is evaluated on every behavioral event using the multi-variable weighted equation:

$$S = \min\left(99, \max\left(1, \left\lfloor 0.40 \cdot \frac{\min(T_{\text{inact}}, 120)}{120} \times 100 + 0.30 \cdot \frac{\min(R_{\text{cart}}, 100)}{100} \times 100 + 0.30 \cdot \frac{\min(D_{\text{freq}}, 100)}{100} \times 100 \right\rfloor\right)\right)$$

### Operational Tier Discretization

| Risk Tier | Score Range | Classification Status | Automated Action |
| :--- | :---: | :---: | :--- |
| **High Risk** | $70 - 100$ | Red Flag | **Autopilot Trigger:** 20% Discount Voucher email dispatch + Priority Manager Intervention alert. |
| **Medium Risk** | $40 - 69$ | Yellow Flag | **Cart Recovery Trigger:** Automated cart checkout reminder email dispatch. |
| **Low Risk** | $1 - 39$ | Green Flag | **Standard Operations:** Healthy account cadence; standard loyalty telemetry logging. |

---

## System Architecture

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

## Technology Stack

### Frontend
- **Framework:** React 18 & Vite
- **Styling:** Modular SCSS (Glassmorphic design system and CSS hardware acceleration)
- **Data Visualization:** Chart.js & React-ChartJS-2 (HTML5 Canvas charting)
- **Icons & Graphics:** Lucide-React vector glyphs & HTML5 Matrix Canvas
- **WebSocket Client:** Socket.io-client

### Backend
- **Runtime Environment:** Node.js (v18.0.0+)
- **Application Framework:** Express.js 4.18
- **WebSocket Server:** Socket.io Server (WebSocket protocol with HTTP long-polling fallback)
- **Object Data Modeling:** Mongoose ODM 8.0
- **Security:** JSON Web Tokens (JWT), bcryptjs, Helmet, Express Rate Limit

### Artificial Intelligence & Services
- **Generative AI:** Google Gemini 1.5 Flash API (Structured JSON schema extraction)
- **Resilience Engine:** Local deterministic heuristic simulation fallback
- **Transactional Messaging:** Brevo REST API & EmailJS delivery endpoints

---

## Repository Structure

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
├── start.bat                # Automated dual-server local launcher script
└── WEEKLY_PROJECT_LOG.txt   # Engineering milestones & development weekly logs
```

---

## Local Development and Setup

### Prerequisites
- Node.js v18.0.0 or higher
- `pnpm` (recommended) or `npm`
- MongoDB Atlas cluster URI or local MongoDB daemon

### Automated Startup (Windows)
Execute the provided batch script to launch both services concurrently:
```cmd
start.bat
```

---

### Manual Installation

#### Backend Configuration
```bash
cd backend
pnpm install
cp .env.example .env
```

Populate `backend/.env` with required parameters:
```env
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_optional
```

Populate the database with 150 synthetic customer profiles:
```bash
pnpm run seed
```

Start the backend development server:
```bash
pnpm dev
```

#### Frontend Configuration
```bash
cd ../frontend
pnpm install
cp .env.example .env
```

Populate `frontend/.env`:
```env
VITE_API_URL=http://localhost:10000/api
VITE_SOCKET_URL=http://localhost:10000
```

Start the frontend development server:
```bash
pnpm dev
```
Access the application at `http://localhost:5173`.

---

## Sandbox Test Accounts

The local development seed script generates isolated mock accounts within the database to facilitate feature evaluation. These identities operate strictly within the test sandbox environment and carry no access to production infrastructure:

| Role | Test Identifier | Default Password | Environment Access |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin@xenoproducts.com` | `Admin@123` | Full administrative controls, autopilot tuning, and database seeding tools. |
| **Customer Success Manager** | `manager@xenoproducts.com` | `Manager@123` | Operational dashboard, customer telemetry profiles, and manual tier override controls. |

*Note: Quick-fill buttons are integrated into the login screen to facilitate rapid local testing without manual credential entry.*

---

## Technical Documentation

Detailed engineering runbooks and architectural documentation are maintained in the `docs/` directory:
- [System Architecture and Theory](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/docs/ARCHITECTURE.md)
- [REST API and WebSocket Protocol](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/docs/API_DOCUMENTATION.md)
- [Live Demonstration and Evaluation Script](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/docs/DEMO_SCRIPT.md)
- [Production Deployment Guide](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/docs/DEPLOYMENT_GUIDE.md)

---

## License

This software is developed and distributed for enterprise research, academic evaluation, and demonstration purposes.
