# Comprehensive Live Demonstration & Evaluation Protocol

**Project Title:** Live Customer Churn Risk Assessment Engine with Real-Time Recommendation Overrides for E-Commerce  
**Primary Deployment URLs:**  
- **Production Frontend:** `https://live-customer-churn-risk-assessment-engine-srixenos-projects.vercel.app` (or `http://localhost:5173`)  
- **Production Backend:** `https://live-customer-churn-risk-assessment-engine.onrender.com` (or `http://localhost:10000`)  

---

## Stage 1: System Authentication & Role-Based Access Control (RBAC)

1. **Access Login Portal:** Navigate to `/login`.
2. **Execute Demo Quick-Fill:**
   - Click the **"Fill Demo Admin"** badge (`admin@xenoproducts.com` / `Admin@123`).
   - Observe JWT generation, encrypted token storage in `localStorage ('xeno_token')`, and role assignment (`admin`).
3. **Verify Routing Guard:** Confirm redirection to the authenticated command center (`/dashboard`).

---

## Stage 2: Real-Time Telemetry & Asynchronous WebSocket Stream

1. **Observe Live Telemetry Ticker:**
   - In the top header bar, inspect the **green pulsing connection badge** indicating active WebSocket tunneling via Socket.io.
   - Observe the live activity feed updating every 20 seconds as the background `activitySimulator.js` thread executes stochastic events (`cart_abandoned`, `checkout_viewed`, `order_completed`, `inactive_drift`).
2. **Verify Telemetry Reactive Physics:**
   - Note that cards, scores, and activity feeds update **in-place without refreshing or re-rendering the entire page**, maintaining 60 FPS performance.
3. **Inspect KPI Metric Cards:**
   - Hover over the 3D tilt glassmorphic cards (`StatCard.jsx`) to observe mouse physics and dynamic count-up animations (`AnimatedCounter.jsx`).
   - Check key metrics: *Total Tracked Profiles (150)*, *High-Risk Segment Accounts*, *Aggregate Revenue at Risk*, and *Autopilot Active Triggers*.

---

## Stage 3: Customer 360 Dossier & Recommendation Override

1. **Select an At-Risk Account:** In the dashboard table, click on any customer tagged with the red **High Risk** badge (e.g., *Customer 014* or *Sarah Jenkins*).
2. **Examine Longitudinal Telemetry:**
   - View the historical risk score trajectory line chart rendered on Chart.js canvas.
   - Review the shopping cart abandonment timeline and transaction audit history.
3. **Execute Human-in-the-Loop Override:**
   - Click the **"Override Risk Tier"** button.
   - Select the target new tier (e.g., downgrade from **High** to **Medium**).
   - Enter a compliant audit justification: `"Customer contacted via VIP phone desk; resolved payment gateway confusion."`
   - Click **"Confirm & Log Override"**.
4. **Verify Audit Trail:**
   - Confirm that the customer's active tier updates immediately on the UI.
   - Navigate to `/admin` to verify that the override appears chronologically in the **Manager Override Audit Registry**.

---

## Stage 4: Multi-Agent AI Negotiation Arena & Counterfactual Branching

1. **Enter the Arena:** Navigate to `/trainer` via the sidebar.
2. **Select Scenario Archetype:**
   - Choose a mission: e.g., *"Sarah: Billing Dispute Crisis"* or live Gemini mode.
3. **Multi-Turn Negotiation Simulation:**
   - Configure persona parameters: Customer Mood = *Price-Sensitive*, Strategy = *Empathetic*.
   - Submit dialogue turns or select tactical responses.
   - Observe the **Live Sentiment Meter (0–100%)** and **Win-Back Probability Gauge** recalculating on every turn via Google Gemini 1.5 LLM JSON schema output.
4. **Demonstrate Counterfactual Scenario Branching:**
   - In the "What-If" Counterfactual panel, select a historical failure event (e.g., *Cart abandoned after shipping fee shock*).
   - Enter a counter-action: *"Auto-issue free express shipping voucher within 5 minutes."*
   - Click **"Forecast Outcome"**.
   - Review the generated counterfactual analysis, projected score drop ($\Delta S$), and resulting tier transition.

---

## Stage 5: Autopilot Rules & System Health Administration

1. **Access Admin Cockpit:** Navigate to `/admin` (Protected by `AdminOnly` route guard).
2. **Demonstrate Autopilot Automation:**
   - Toggle **"Enable Auto-Discount Dispatch"** and set threshold to **Score $\ge 75$**.
   - Toggle **"Enable Cart Recovery Reminders"** and set threshold to **Abandon Rate $\ge 60\%$**.
   - Save triggers and observe real-time simulation intercepts.
3. **Database Health & Seeding:**
   - Demonstrate the one-click database seed button (`/api/admin/database/seed`) and clear controls (`/api/admin/database/clear`).
