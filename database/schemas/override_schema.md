# MongoDB Override Collection Schema Specification

**Collection Name:** `overrides`  
**Database:** `xeno_telemetry_db` (MongoDB Atlas)  

---

## 1. Schema Definition & Data Dictionary

| Field Name | BSON Type | Validation Rules | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Required, Primary Key | Unique override log entry identifier. |
| `customerId` | `String` / `ObjectId` | Required, Indexed | Foreign key linking the target customer profile. |
| `previousTier`| `String` | Enum: `['low', 'medium', 'high']` | System-assigned algorithmic risk classification prior to override. |
| `newTier` | `String` | Enum: `['low', 'medium', 'high']` | Human manager-adjusted risk classification tier. |
| `reason` | `String` | Required, Min: 10 chars | Mandatory human justification for compliance and audit trail. |
| `managerId` | `String` | Required | Authenticated identifier of the Customer Success Manager. |
| `createdAt` | `String` (ISO 8601) | Auto-generated | Immutable UTC timestamp of the override intervention. |

---

## 2. Compliance & Human-in-the-Loop (HITL) Policy
- Every manual override requires non-empty reasoning to prevent unverified data manipulation.
- Overriding a customer tier updates the active record and simultaneously pushes an immutable record into the `overrides` collection and the customer's nested `overrides` sub-document array.
