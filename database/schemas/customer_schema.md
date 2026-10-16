# MongoDB Customer Collection Schema Specification

**Collection Name:** `customers`  
**Database:** `xeno_telemetry_db` (MongoDB Atlas)  
**ORM / ODM:** Mongoose ODM v8.0.0  

---

## 1. Schema Definition & Data Dictionary

| Field Name | BSON Type | Validation Rules | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `String` / `ObjectId` | Required, Primary Key | Unique customer telemetry identifier. |
| `name` | `String` | Required, Trimmed | Full customer entity name. |
| `email` | `String` | Required, Lowercase, Indexed | Customer contact email for campaign dispatches. |
| `avatar` | `String` | URL format | Cloud-hosted avatar URL (Cloudinary / UI-Avatars). |
| `riskScore` | `Number` | Bounded $[1, 99]$ | Dynamic arithmetic churn risk evaluation metric. |
| `tier` | `String` | Enum: `['low', 'medium', 'high']` | Categorical risk segment classification. |
| `joinDate` | `String` (ISO 8601) | Required | Customer onboarding timestamp. |
| `lastPurchaseDate` | `String` (ISO 8601) | Required | Timestamp of most recent completed order. |
| `daysInactive` | `Number` | Min: $0$, Max: $120+$ | Calculated gap in days since last active session. |
| `cartAbandonRate` | `Number` | Percentage $[0, 100]$ | Proportion of abandoned shopping carts. |
| `orderFrequencyDrop` | `Number` | Percentage $[0, 100]$ | Velocity drop in repeat purchase cadence. |
| `orderHistory` | `Array<OrderSubdoc>` | Bounded array | Subdocuments storing historical transactional items. |
| `cartHistory` | `Array<CartSubdoc>` | Bounded array | Longitudinal logs of cart creation, values, and exit times. |
| `scoreHistory` | `Array<ScoreSubdoc>` | Bounded array | Time-series snapshots of historical score trajectory. |
| `campaignHistory` | `Array<CampaignSubdoc>` | Bounded array | Record of automated/manual retention emails sent. |
| `overrides` | `Array<OverrideSubdoc>` | Bounded array | Human manager intervention history with rationale. |
| `deleted` | `Boolean` | Default: `false` | Soft-deletion flag for audit preservation. |

---

## 2. Embedded Subdocument Schemas

### 2.1 `scoreHistory` Subdocument
```json
{
  "date": "2026-10-08T18:30:00.000Z",
  "score": 78
}
```

### 2.2 `cartHistory` Subdocument
```json
{
  "date": "2026-10-07T14:22:10.000Z",
  "cartValue": 4500,
  "itemCount": 3,
  "timeInCart": "12m"
}
```

### 2.3 `orderHistory` Subdocument
```json
{
  "date": "2026-09-15T10:14:00.000Z",
  "amount": 8990,
  "status": "completed",
  "itemCount": 2
}
```

---

## 3. Performance Indexing Strategy
- **`email`**: Unique compound index `{ email: 1 }` for rapid retrieval.
- **`riskScore`**: Index `{ riskScore: -1 }` for high-risk customer ranking.
- **`tier`**: Index `{ tier: 1 }` for dashboard segmentation filters.
- **`deleted`**: Sparse compound index `{ deleted: 1, tier: 1 }` for soft-deletion query optimization.
