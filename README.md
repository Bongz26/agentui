# Victory Connect — Field Agent Digital Onboarding Platform

A **mobile-first PWA** that turns every authorised field agent's smartphone into a secure digital client onboarding terminal for South African financial/funeral-services businesses.

> ⚠️ **Prototype / Demo** — Synthetic data only. Not connected to any real financial system.

---

## Quick Start

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Seed the database
```bash
cd server && npm run seed
```

### 3. Start API server (Terminal 1)
```bash
cd server && npm run dev
# → http://localhost:3001
```

### 4. Start React client (Terminal 2)
```bash
cd client && npm run dev
# → http://localhost:5173
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Field Agent** | `karabo@victory.demo` | `20260818` |
| **Supervisor** | `reuben@victory.demo` | `20260817` |
| Field Agent | `thabo.mokoena@victory.demo` | `Agent@123` |
| Field Agent | `zanele.dlamini@victory.demo` | `Agent@123` |
| Field Agent | `nomsa.khumalo@victory.demo` | `Agent@123` |
| Supervisor | `sarah.vanderberg@victory.demo` | `Supervisor@123` |
| Admin | `admin@victory.demo` | `Admin@123` |

---

## Architecture

```
agentui/
├── client/         React + Vite PWA (mobile-first)
│   └── src/
│       ├── api/            API client modules
│       ├── components/     Shared UI components
│       ├── features/       Page components by feature
│       ├── hooks/          useAutoSave, useOnlineStatus
│       └── store/          Zustand state (auth, wizard)
│
└── server/         Node.js + Express API
    └── src/
        ├── api/            Express route handlers
        ├── services/       Business logic layer
        ├── repositories/   Data access layer
        ├── middleware/      Auth, RBAC, error handling
        ├── integrations/   CRM/WhatsApp/Storage adapters (stubs)
        └── db/             sql.js + migrations + seed
```

### Layered Architecture
```
Presentation (React PWA)
    ↓ REST / JSON
API Layer (Express routes)
    ↓
Business/Service Layer (ApplicationService, AuthService...)
    ↓
Data Layer (Repositories → SQLite via sql.js)
    ↓
Integration Layer (CrmAdapter, WhatsAppAdapter — stubs)
```

---

## Key Features

- ✅ **Secure JWT authentication** with refresh token rotation
- ✅ **Role-based access control** (Field Agent / Supervisor / Admin)
- ✅ **6-step application wizard** with auto-save every 2 seconds
- ✅ **Camera-first document capture** using browser `capture="environment"`
- ✅ **Offline awareness** — detects network state, queues saves
- ✅ **SA ID number validation** (Luhn algorithm)
- ✅ **Mobile-first responsive design** optimised for Android
- ✅ **Supervisor dashboard** with stats, agent performance, filterable tables
- ✅ **Audit log** for all sensitive actions
- ✅ **Application status history** with timeline
- ✅ **PWA-ready** (manifest + service worker via Workbox)

---

## Security Design

- Passwords hashed with bcrypt (cost 12)
- JWT access tokens (15-min) + rotating refresh tokens (7-day)
- httpOnly cookie storage for tokens
- RBAC middleware — agents can only see their own applications
- Helmet.js security headers
- CORS restricted to known origins
- Rate limiting on all API routes (stricter on auth)
- Input validation via express-validator
- Document downloads require authentication and ownership check
- All secrets in `.env` (never committed)

---

## Integration Stubs

Future integrations are stubbed in `server/src/integrations/`:
- `StorageAdapter.js` — swap local filesystem for S3/GCS
- `CrmAdapter.js` — future CRM/policy system connector
- `CrmAdapter.js#WhatsAppAdapter` — future WhatsApp lead ingestion

---

## Consent / Legal

⚠️ All consent wording in `Step5Consent.jsx` is **placeholder text only**. It must be reviewed and approved by a qualified South African attorney familiar with POPIA, FAIS, and applicable financial services regulations before production use.

---

## POPIA Design Principles Applied

- Data minimisation — only required fields captured
- Purpose limitation — data used for onboarding only
- Access control — agents cannot see other agents' data
- Auditability — all mutations logged to audit_log
- Secure storage — documents served through authenticated API only
