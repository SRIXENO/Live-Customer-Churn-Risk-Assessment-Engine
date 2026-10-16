# MongoDB Order & Transaction Schema Specification

**Collection Name:** `orders` / Embedded in `customers.orderHistory`  
**Database:** `xeno_telemetry_db` (MongoDB Atlas)  

---

## 1. Schema Definition & Data Dictionary

| Field Name | BSON Type | Validation Rules | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Required, Primary Key | Unique transaction identifier. |
| `customerId` | `String` / `ObjectId` | Required, Foreign Key | Reference to owning customer document. |
| `date` | `String` (ISO 8601) | Required | Completed order checkout timestamp. |
| `amount` | `Number` | Min: $0$ (INR / Currency) | Total gross transaction value. |
| `status` | `String` | Enum: `['completed', 'pending', 'refunded']` | Transaction fulfillment lifecycle status. |
| `itemCount` | `Number` | Integer, Min: $1$ | Total quantity of merchandise units in order. |
| `paymentGateway` | `String` | Optional (e.g., `'UPI'`, `'Card'`) | Processing gateway identifier. |
| `couponApplied` | `String` | Optional | Code of retention voucher redeemed (e.g., `'XENO20'`). |

---

## 2. Order Frequency Drop Metric Calculation
The decay rate $D_{\text{freq}}$ is calculated by contrasting the customer's trailing 30-day velocity against their 90-day baseline moving average:

$$D_{\text{freq}} = \max\left(0, \frac{\bar{V}_{90} - V_{30}}{\bar{V}_{90}} \times 100\right)$$
where $V$ represents order count per unit window.
