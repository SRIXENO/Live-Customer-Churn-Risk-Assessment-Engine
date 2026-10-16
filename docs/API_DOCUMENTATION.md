# REST API & WebSocket Protocol Specification

**Project Title:** Live Customer Churn Risk Assessment Engine with Real-Time Recommendation Overrides for E-Commerce  
**Base URL:** `http://localhost:10000/api` (Production: `https://<render-service-url>/api`)  
**WebSocket Protocol:** `ws://` / `wss://` via Socket.io v4.6  
**Authentication Scheme:** Bearer Token (JSON Web Token - RFC 7519)  

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Authenticate User Session
- **Route:** `POST /api/auth/login`
- **Access Level:** Public
- **Description:** Authenticates credentials and issues a signed JSON Web Token valid for 7 days.
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "admin@xenoproducts.com",
    "password": "AdminPassword@123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "64f9b8c0e1a2b3c4d5e6f7a8",
        "name": "Platform Administrator",
        "email": "admin@xenoproducts.com",
        "role": "admin"
      }
    }
  }
  ```

---

## 2. Customer Telemetry Endpoints (`/api/customers`)

### 2.1 Retrieve Customer Roster (Paginated & Filtered)
- **Route:** `GET /api/customers`
- **Access Level:** Protected (Bearer JWT)
- **Query Parameters:**
  - `page` *(optional, default: 1)*: Page number.
  - `limit` *(optional, default: 20)*: Page size.
  - `search` *(optional)*: Full-text name or email search query.
  - `tier` *(optional)*: Filter by risk tier (`high`, `medium`, `low`).
  - `sort` *(optional)*: Sort field (`riskScore`, `daysInactive`, `cartAbandonRate`).
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "customers": [
        {
          "_id": "651a2b3c4d5e6f7a8b9c0d1e",
          "name": "Sarah Jenkins",
          "email": "sarah.j@example.com",
          "riskScore": 78,
          "tier": "high",
          "daysInactive": 45,
          "cartAbandonRate": 82,
          "orderFrequencyDrop": 60,
          "lastPurchaseDate": "2026-09-01T12:00:00.000Z"
        }
      ],
      "total": 150,
      "page": 1,
      "totalPages": 8
    }
  }
  ```

### 2.2 Retrieve Customer 360 Dossier
- **Route:** `GET /api/customers/:id`
- **Access Level:** Protected
- **Description:** Returns the complete longitudinal telemetry dossier including order history, cart timeline, score evolution, and override audit records.

### 2.3 On-Demand Customer Activity Simulation
- **Route:** `POST /api/customers/:id/simulate`
- **Access Level:** Protected
- **Request Body:**
  ```json
  {
    "daysInactive": 50,
    "cartAbandonRate": 85,
    "orderFrequencyDrop": 40
  }
  ```
- **Description:** Evaluates the mathematical scoring equation on provided parameters, persists history, and broadcasts real-time `score_updated` event across WebSocket channels.

### 2.4 Multi-Turn AI Negotiation Turn
- **Route:** `POST /api/customers/:id/negotiate-step`
- **Access Level:** Protected
- **Request Body:**
  ```json
  {
    "history": [
      { "speaker": "customer", "message": "Your service is too expensive compared to Competitor X." }
    ],
    "mood": "price_sensitive",
    "strategy": "empathetic",
    "speaker": "agent",
    "humanMessage": null
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "reply": "I understand pricing is a critical concern, Sarah. We value your loyalty, so I've applied an exclusive 20% discount (XENO20) to your account.",
      "sentiment": 75,
      "retentionProbability": 68,
      "isRealAi": true
    }
  }
  ```

### 2.5 Counterfactual Scenario Forecasting
- **Route:** `POST /api/customers/:id/forecast-branch`
- **Access Level:** Protected
- **Request Body:**
  ```json
  {
    "pastEvent": "Customer cart checkout failed with gateway timeout error.",
    "counterAction": "Instantly credit ₹500 wallet balance and send apologetic SMS."
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "forecastedScore": 32,
      "forecastedTier": "low",
      "analysis": "Immediate financial reconciliation eliminates negative sentiment and repairs perceived friction, dropping risk by 46 points.",
      "isRealAi": true
    }
  }
  ```

---

## 3. Autopilot & Administration (`/api/admin`)

### 3.1 Fetch Autopilot Configuration
- **Route:** `GET /api/admin/triggers`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "discountEnabled": true,
      "discountThreshold": 75,
      "cartEnabled": true,
      "cartThreshold": 60
    }
  }
  ```

### 3.2 Update Autopilot Trigger Rules
- **Route:** `POST /api/admin/triggers`
- **Access Level:** Admin Only

### 3.3 Manager Override Audit Registry
- **Route:** `GET /api/admin/override-logs`
- **Description:** Returns chronological registry of all human-in-the-loop overrides with manager identity, justification, and before/after risk tiers.

---

## 4. WebSocket Protocol Specification

The server exposes a persistent WebSocket stream on connection. Clients authenticate and subscribe to real-time events.

| Event Channel | Payload Schema | Emission Trigger |
| :--- | :--- | :--- |
| `customer_activity` | `{ customerId, customerName, activityType, description, riskScore, tier, timestamp }` | Dispatched every 20s by the background activity simulator thread. |
| `score_updated` | `{ customerId, newScore, newTier, previousTier, simulated }` | Dispatched when a score crosses any delta threshold or simulation completes. |
| `campaign_sent` | `{ campaignId, customerId, customerName, templateType, sentAt, status }` | Dispatched whenever an automated or manual campaign is released. |
| `autopilot_action` | `{ customerName, ruleName, actionTaken, timestamp }` | Dispatched when the autopilot engine executes autonomous retention actions. |
