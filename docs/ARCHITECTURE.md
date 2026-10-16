# System Architecture & Theoretical Engineering Specification

**Project Title:** Live Customer Churn Risk Assessment Engine with Real-Time Recommendation Overrides for E-Commerce  
**Institution:** Bannari Amman Institute of Technology  
**Department:** Artificial Intelligence and Data Science  
**Academic Year:** 2026 – 2027 | S7 Project Work  
**Project ID:** 2026AC395  

---

## 1. Theoretical Foundation

### 1.1 The Churn Problem in Contemporary E-Commerce
Customer churn represents the rate at which customers discontinue interactions or purchasing activities with an enterprise. In modern digital commerce, Customer Acquisition Cost (CAC) has expanded significantly due to advertising market saturation, making customer retention 5 to 7 times more cost-effective than acquisition. 

Traditional Customer Relationship Management (CRM) solutions rely on **lagging indicators**—customer support tickets, negative reviews, and post-cancellation exit surveys. By the time these signals are logged, churn has already occurred. Furthermore, existing machine learning pipelines typically operate on static, overnight batch processing jobs (e.g., cron jobs executing every 24 hours), creating an operational latency window where at-risk customers exit undetected.

### 1.2 Event-Driven Behavioral Telemetry Theory
To mitigate the latency of static batch models, this engine implements an **event-driven behavioral telemetry pipeline**. Rather than analyzing static demographic snapshots, the system captures continuous high-frequency interaction signals:
- **Temporal Inactivity Drift ($T_{\text{inact}}$):** The chronological gap between the current timestamp and the customer's last purchase or session event.
- **Cart Abandonment Rate ($R_{\text{cart}}$):** The ratio of uncompleted checkout sessions to total cart creation instances within a sliding observation window.
- **Purchase Decay Rate ($D_{\text{freq}}$):** The percentage decrease in transaction frequency relative to the customer's established baseline.

---

## 2. Mathematical Risk Formulation

The dynamic churn risk score $S \in [1, 99]$ is derived using a continuous, bounded multi-variable arithmetic formulation:

$$S = \min\left(99, \max\left(1, \left\lfloor w_1 \cdot \frac{\min(T_{\text{inact}}, T_{\max})}{T_{\max}} \times 100 + w_2 \cdot \frac{\min(R_{\text{cart}}, 100)}{100} \times 100 + w_3 \cdot \frac{\min(D_{\text{freq}}, 100)}{100} \times 100 \right\rfloor\right)\right)$$

### Parameter Specifications:
- **$w_1 = 0.40$ (Inactivity Weight):** Reflects the primary risk indicator—engagement decay over time ($T_{\max} = 120\text{ days}$, providing a linear scale up to a maximum contribution of 40 points).
- **$w_2 = 0.30$ (Cart Abandonment Weight):** Captures high-intent checkout friction and price resistance (maximum contribution of 30 points).
- **$w_3 = 0.30$ (Purchase Frequency Decay Weight):** Identifies behavioral drift where an active customer decelerates order cadence (maximum contribution of 30 points).

### Discretized Risk Tier Boundaries:
$$\text{Tier}(S) = \begin{cases} 
\text{High Risk (Red Flag)}, & \text{if } S \ge 70 \\
\text{Medium Risk (Yellow Flag)}, & \text{if } 40 \le S < 70 \\
\text{Low Risk (Green Flag)}, & \text{if } S < 40 
\end{cases}$$

---

## 3. High-Level Architectural Topology

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

## 4. Multi-Agent AI Negotiation & Counterfactual Theory

### 4.1 Multi-Agent Dialogue Simulation
The AI Retention Arena ([Trainer.jsx](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/frontend/src/pages/Trainer.jsx)) models negotiation as a multi-turn game between two artificial agents:
1. **Virtual Customer Persona:** Initialized with stochastic mood states ($\text{Mood} \in \{\text{Price-Sensitive}, \text{Angry}, \text{Indifferent}\}$) derived from historical telemetry (e.g., repeated checkout failures induce anger; high cart abandonment induces price sensitivity).
2. **AI Retention Agent:** Guided by customizable strategy prompts ($\text{Strategy} \in \{\text{Empathetic}, \text{Value-Focused}, \text{Aggressive-Discount}\}$).

At each turn $t$, the state transition is evaluated:
$$(M_t, S_t, P_t) = f_{\text{LLM}}(\text{Dialogue History}, \text{Telemetry Profile}, \text{Persona Prompt})$$
where $M_t$ is the text response, $S_t \in [0, 100]$ is the real-time sentiment score, and $P_t \in [0, 100]$ is the retention win probability.

### 4.2 Pearl's Counterfactual Scenario Branching
To prevent trial-and-error mistakes on live customer accounts, the engine incorporates **Counterfactual Scenario Branching** based on Judea Pearl's Causal Hierarchy:
$$\mathbb{E}[Y_{x} \mid E = e]$$
- **Factual Context ($e$):** Observed historical telemetry (e.g., "Customer experienced double-charge billing error and abandoned cart").
- **Intervention ($do(X = x)$):** Proposed recovery strategy (e.g., "Dispatch instant refund + 20% loyalty voucher").
- **Projected Outcome ($Y_x$):** Projected score delta $\Delta S$ and resulting tier transition.

### 4.3 Resilience & Heuristic Fallback
When cloud LLM API quotas or network latencies exceed operational boundaries, execution falls back seamlessly to a local deterministic heuristic simulation engine ([customers.js#L588-L604](file:///c:/Users/mrvss/Music/S7%20project/S7_Project/backend/src/routes/customers.js#L588-L604)). This preserves system uptime without degrading user experience.

---

## 5. Human-in-the-Loop (HITL) Governance & Audit Registry

Autonomous algorithms risk false positives (e.g., misclassifying VIP accounts undergoing seasonal pauses). The system enforces **Human-in-the-Loop Recommendation Overrides**:
- Authorized managers can manually override algorithmic tier assignments.
- Overrides require a mandatory audit justification string, manager identity tag, and timestamp.
- All actions are logged immutably to the `overrides` collection in MongoDB Atlas, ensuring regulatory compliance and algorithmic accountability.
