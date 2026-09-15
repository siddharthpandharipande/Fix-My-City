# FixMyCity — Civic Issue Management System

> A full-stack platform for reporting, tracking, and resolving civic infrastructure issues across a city. Built for citizens, municipal authorities, and contractors — with AI-assisted reporting, voice input, gamification, live hotspot maps, and a complete job management pipeline.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Applications](#4-applications)
   - [Citizen Mobile App](#41-citizen-mobile-app)
   - [Authority Dashboard](#42-authority-dashboard)
   - [Contractor Dashboard](#43-contractor-dashboard)
5. [Core Workflow](#5-core-workflow)
6. [Features](#6-features)
7. [API Reference](#7-api-reference)
9. [Authentication & Security](#9-authentication--security)
10. [Map System](#10-map-system)
11. [Image Uploads](#11-image-uploads)
12. [Background Jobs](#12-background-jobs)
13. [Environment Variables](#13-environment-variables)
14. [Getting Started](#14-getting-started)

---

## 1. Project Overview

FixMyCity is a civic issue management system that connects three stakeholders:

- **Citizens** — report civic issues (potholes, garbage, water leaks, etc.) directly from their phones in under a minute, with AI-assisted categorization, voice input, GPS verification, and live photo capture. Citizens earn Impact Points for contributions and track recurring problems on an interactive heatmap.
- **Municipal Authorities** — create and manage civic issues, assign contractors, monitor resolution on a live map, and view analytics across departments and subdivisions.
- **Contractors** — discover open jobs on a map, place competitive bids, and submit GPS-verified completion proof with photos.

The system is built around a **source-agnostic data pipeline**: whether a job originates from a citizen complaint or an authority, it flows through the exact same backend logic. Complaints submitted by citizens are automatically clustered by proximity and category, and hotspots are computed hourly from those clusters.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                 │
│                                                                      │
│  Citizen Mobile App    Authority Dashboard    Contractor Dashboard   │
│  (React Native/Expo)   (React + Vite + TS)   (React + Vite + TS)    │
│         │                      │                       │            │
└─────────┼──────────────────────┼───────────────────────┼────────────┘
          │   JWT Bearer Token   │                       │
          ▼                      ▼                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Node.js / Express API                           │
│                                                                      │
│   JWT Auth Middleware (protects all non-auth routes)                 │
│                                                                      │
│  /api/auth   /api/jobs    /api/bids    /api/complaints               │
│  /api/upload /api/hotspots /api/analytics /api/subdivisions          │
│  /api/voice  /api/rewards                                            │
│                                                                      │
│  Background Jobs: EscalationEngine (15 min) · HotspotEngine (1 hr)  │
└──────────────────┬───────────────────────────┬──────────────────────┘
                   │                           │
          ┌────────▼────────┐        ┌─────────▼────────┐
          │   MongoDB Atlas │        │  Cloudinary CDN  │
          │  (all documents)│        │  (image storage) │
          └─────────────────┘        └──────────────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Single shared backend | All three clients hit the same API — no separate BFF layers |
| Source-agnostic job pipeline | The `source` field on Job is stored but never branched on in controller logic |
| Complaint clustering | Complaints within 50m of the same category are merged into a Cluster to reduce noise |
| Hotspot engine | Hourly cron computes Hotspot documents from Clusters exceeding a configurable threshold |
| Escalation engine | 15-minute cron transitions job health: ON_TRACK → AT_RISK → OVERDUE → ESCALATED |
| Cloudinary for media | Images are streamed from multer memory storage directly to Cloudinary — nothing written to disk |
| JWT authentication | All routes except `/api/auth/*` require a valid Bearer token; role is embedded in the token |
| 30-second live polling | Both web dashboards use `setInterval`-based polling — keeps the backend stateless, no WebSockets needed |

---

## 3. Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM modules) |
| Framework | Express.js 4.x |
| Database | MongoDB via Mongoose 8.x |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| File Uploads | Multer (memory storage) → Cloudinary SDK 2.x |
| Email | Nodemailer |
| Scheduling | node-cron (escalation + hotspot engines) |
| Testing | Jest + Supertest + fast-check + mongodb-memory-server |

### Citizen Mobile App
| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Routing | Expo Router (file-based) |
| Language | TypeScript / JavaScript |
| Maps | react-native-maps (MapView, Marker, Circle, Callout) |
| Image Picker | expo-image-picker (camera-only) |
| Location | expo-location |
| Audio | expo-av |
| Storage | @react-native-async-storage/async-storage |
| HTTP | Fetch API (custom `api.js` with auto-logout on 401) |
| AI Analysis | Google Cloud Vision/Gemini AI via `/api/complaints/analyze-image` |
| Voice STT | Sarvam AI via `/api/voice/transcribe` |
| Image Storage | Cloudinary (via backend `/api/upload`) |

### Authority & Contractor Dashboards
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Routing | React Router DOM v6 |
| State / Data Fetching | TanStack Query (React Query) v5 |
| UI Components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS 3 |
| Maps | Leaflet 1.9 + React Leaflet 5 |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| Animations | Framer Motion |
| Notifications | Sonner (toast) |
| Testing | Vitest + Testing Library + fast-check + Playwright |

---

## 4. Applications

### 4.1 Citizen Mobile App

A React Native (Expo) app that lets citizens report civic issues directly from their phones. Built for speed, trust, and accessibility.

**Screens:**
| Screen | Route | Description |
|--------|-------|-------------|
| Home | `/` | Dashboard with quick actions |
| Login | `/login` | Citizen sign-in |
| Sign Up | `/signup` | New citizen registration |
| Report Issue | `/report` | Full complaint submission flow |
| My Complaints | `/my-complaints` | Complaint history and status |
| Hotspot Map | `/map` | Live map of active civic issues |
| Issue History | `/history` | Heatmap + timeline of all historical complaints |
| Complaint Detail | `/complaint/[id]` | Single complaint view with upvote |
| Profile | `/profile` | Impact Points, tier, and points history |
| Leaderboard | `/leaderboard` | Top 20 citizens by Impact Points |
| Success | `/success` | Post-submission confirmation |

**Key Capabilities:**
- Camera-only photo capture (no gallery) with GPS locked at shutter press — "✅ VERIFIED" badge confirms both
- AI Autofill: tap to let Google Cloud Vision/Gemini AI analyze the photo and auto-fill category, severity, and description
- Voice input via Sarvam AI STT — supports 8 Indian languages, auto-stops after 60 seconds
- GPS reverse-geocoded to a human-readable address; location must be verified before submission
- Live hotspot map with color-coded severity pins and tap-to-detail callouts
- Issue history screen with heatmap (Circle overlays) and paginated timeline view; filterable by category, severity, status, and date range
- Impact Points gamification: earn points for submitting, getting verified/resolved, and upvoting
- Three-tier progression: Bronze (0–199) → Silver (200–499) → Gold (500+)
- Leaderboard of top 20 citizens; own row highlighted
- Upvote any complaint to confirm you've seen the same problem (+5 pts, self/duplicate blocked)
- JWT auth with 30-day expiry; auto-logout on 401; Citizens only (Authorities/Contractors use web portals)

**Report Flow:**
```
1. Open app → Home screen
2. Tap "📷 Report an Issue"
3. GPS location captured automatically
4. Tap camera area → live photo taken + uploaded to Cloudinary
5. Tap "✨ AI Autofill" → category, severity, description auto-filled
6. Edit fields if needed; optionally use 🎙️ voice input
7. Tap "Submit Report" → complaint sent to backend
8. Redirected to success screen → +1 Impact Point awarded
```

### 4.2 Authority Dashboard

The web portal used by municipal authorities to create and manage civic issues.

**Pages:**
- `/` — Landing page
- `/login`, `/signup` — Authority authentication
- `/dashboard` — Live analytics overview (stat cards + severity distribution)
- `/jobs` — Kanban board for all jobs across all statuses
- `/complaints` — Complaint management
- `/map` — Full-screen interactive map with all job markers

**Key Capabilities:**
- Create civic issues via a full form (title, description, category, severity, image, GPS/map location)
- View all jobs in a Kanban board (OPEN → ASSIGNED → IN_PROGRESS → COMPLETED)
- Review contractor bids for each open job
- Assign a contractor to a job (accepts winning bid, auto-rejects all others)
- View completion proof (photo + GPS location) on the map
- One-click demo job creation from preset templates
- Live analytics: total issues, active hotspots, completed issues, severity breakdown, resolution rate, avg resolution time

### 4.3 Contractor Dashboard

The web portal used by contractors to find and complete work.

**Pages:**
- `/contractor/login`, `/contractor/signup` — Contractor authentication
- `/contractor/app/` — Contractor dashboard with personal stats
- `/contractor/app/jobs` — Browse all open jobs available for bidding
- `/contractor/app/bids` — View submitted bids and their statuses
- `/contractor/app/my-jobs` — Jobs assigned to this contractor
- `/contractor/app/map` — Interactive map showing open jobs with bid popup
- `/contractor/app/profile` — Contractor profile and reputation ring

**Key Capabilities:**
- Discover open jobs on an interactive map
- Click a map marker to see job details and place a bid directly from the popup
- Submit bids with ETA, cost estimate, and notes
- Mark assigned jobs as complete with GPS capture and photo proof
- Track bid statuses (PENDING / ACCEPTED / REJECTED)

---

## 5. Core Workflow

```
1. Citizen submits a complaint via the mobile app
   → Photo captured + GPS locked → AI autofills category/severity/description
   → Complaint saved with status: RECEIVED
   → Complaint clustered by proximity (50m radius, same category)
   → +1 Impact Point awarded to citizen
        │
        ▼
2. Hotspot engine (hourly) detects clusters exceeding threshold
   → Hotspot document created/updated
        │
        ▼
3. Authority reviews complaint → creates a Job linked to the complaint
   → Job status: OPEN
   → Complaint status: JOB_CREATED
   → Citizen earns +10 Impact Points (verified)
        │
        ▼
4. Contractors view the job on their map and place bids (ETA + cost + note)
        │
        ▼
5. Authority reviews bids and assigns one contractor
   → Winning bid: ACCEPTED · All other bids: REJECTED
   → Job status: ASSIGNED
        │
        ▼
6. Contractor works on the job → Job status: IN_PROGRESS
   → Complaint status: IN_PROGRESS
        │
        ▼
7. Contractor submits completion proof (photo + GPS)
   → Job status: COMPLETED
   → Complaint status: COMPLETED
   → Citizen earns +20 Impact Points (resolved)
        │
        ▼
8. Map updates: completion marker + dashed line to original location
   Authority can view proof photo in popup
```

---

## 6. Features

### Citizen App Features

**Live Photo Capture & GPS Verification**
- Camera-only capture (no gallery) to prevent fake or old photos
- Photo uploaded to Cloudinary immediately on capture
- GPS coordinates locked at the exact moment of the shutter press
- "✅ VERIFIED" badge confirms both photo and location are locked
- `capturedAt` ISO timestamp sent with every complaint — backend flags submissions older than 2 minutes

**AI Autofill**
- Tap "AI Autofill" after capturing a photo to let Gemini AI analyze the image
- Auto-fills category (pothole, garbage, water leak, streetlight, road damage, power cut, other), severity (low/medium/high), and description
- Falls back gracefully to manual entry if AI is unavailable

**Voice Input (Multilingual)**
- Dictate complaint descriptions via Sarvam AI speech-to-text
- Supports 8 Indian languages: English, Hindi, Marathi, Tamil, Telugu, Kannada, Bengali, Gujarati
- Auto-stops after 60 seconds

**Hotspot Map**
- Color-coded pins by severity: High (red), Medium (amber), Low (green)
- Filter by severity; tap any pin for complaint details, photo, status, and address
- Category summary strip at the bottom

**Issue History & Heatmap**
- Heatmap view: Circle overlays sized and colored by complaint severity weight (HIGH=3, MEDIUM=2, LOW=1)
- Timeline view: chronological scrollable list with severity badges, status, address, and date
- Filters: category, severity, status, date range; reset with one tap
- Stats bar: total complaints, resolution rate %, top issue category
- Paginated loading (50 per page, auto-loads on scroll)

**Impact Points & Gamification**
| Action | Points |
|--------|--------|
| Submit a complaint | +1 |
| Complaint verified by authority | +10 |
| Complaint resolved (COMPLETED) | +20 |
| Upvote another citizen's complaint | +5 |

| Tier | Points Required |
|------|----------------|
| 🥉 Bronze | 0 – 199 |
| 🥈 Silver | 200 – 499 |
| 🥇 Gold | 500+ |

- Idempotent — the same event never awards points twice
- Leaderboard of top 20 citizens; own row highlighted; medals for top 3
- Upvoting is blocked for self-upvotes and duplicates

---

### Authority & Contractor Features

### Issue Creation
- Full form with title, description, category (POTHOLE, ELECTRICAL, DRAINAGE, FOOTPATH, WATER, OTHER), and severity (LOW / MEDIUM / HIGH)
- Image upload with live preview (PNG, JPG, WEBP)
- GPS capture via browser geolocation API (`enableHighAccuracy: true`)
- Embedded map picker (centered on Pune: `[18.5204, 73.8567]`) for click/drag pin placement
- Coordinates displayed as text overlay on the map picker
- Validation blocks submission if title, description, or location is missing

### Interactive Map
- Leaflet-based map on both dashboards
- Severity-based color-coded markers: HIGH → red (`#EF4444`), MEDIUM → yellow (`#F59E0B`), LOW → green (`#10B981`)
- Completed jobs always render green regardless of severity
- HIGH severity jobs (not completed) have a CSS pulse animation
- Marker clustering via `leaflet.markercluster` with count badges
- Severity legend on the map
- 30-second live polling for real-time updates
- Completion markers (checkmark icon) at contractor GPS location
- Dashed green polyline connecting original job location to completion location
- Popup on completion marker shows "Resolution Proof" + photo thumbnail

### Map Popups
- Click any marker to see: job title, description (truncated to 80 chars), severity badge, status badge, image thumbnail
- Dark-themed popups (`#1a1a1a` background, white text)
- Contractor map popup includes a "Place Bid" button

### Analytics Dashboard
- Total Issues count
- Active Hotspots (non-completed jobs)
- Completed Issues count
- Resolution rate % and average resolution time (hours)
- Overdue and escalated job counts
- Severity Distribution (HIGH / MEDIUM / LOW counts)
- Breakdowns by department and subdivision
- All derived from live API data — no hardcoded values

### Bid System
- Contractors submit bids with ETA, cost, and optional notes
- Authority sees all bids per job with contractor username
- One-click assignment: accepts winner, rejects all others atomically
- Bid status tracking: PENDING → ACCEPTED or REJECTED

### Job Completion with Proof
- GPS capture required (blocks submission if denied)
- Photo upload to Cloudinary
- Completion location, image, timestamp, and verification flag all persisted
- Completion visualized on authority map

### Demo Mode
- 5 built-in preset job templates (realistic civic issues)
- One-click demo job creation from the Create Job modal
- Demo jobs tagged with `isDemoJob: true` and a "demo" badge in the UI
- Random preset selection if no index specified

### Status Badges & UI Feedback
- Status badges for all four job states: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED
- `isVerified: true` → "VERIFIED ✅" indicator
- `isVerifiedCompletion: true` → "COMPLETION VERIFIED ✅" indicator
- Loading states during API fetches
- Error banners on API failure (no page crashes)

---

## 7. API Reference

All routes except `/api/auth/*` and `POST /api/subdivisions` require a valid JWT Bearer token in the `Authorization` header.

### Authentication
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user (any role) |
| POST | `/api/auth/login` | Login and receive JWT token |

**Login response:**
```json
{ "token": "...", "role": "ADMIN", "userId": "...", "name": "..." }
```

### Jobs
| Method | Route | Description |
|---|---|---|
| GET | `/api/jobs` | Get all jobs (sorted by createdAt desc) |
| POST | `/api/jobs` | Create a new job |
| GET | `/api/jobs/open` | Get only OPEN jobs |
| PUT | `/api/jobs/:id/assign` | Assign a contractor to a job |
| PUT | `/api/jobs/:id/status` | Update job status (including completion proof) |
| POST | `/api/jobs/demo` | Create a demo job from preset or custom payload |
| GET | `/api/jobs/demo/presets` | Get the 5 built-in demo preset templates |

### Bids
| Method | Route | Description |
|---|---|---|
| POST | `/api/bids` | Submit a new bid |
| GET | `/api/bids/:jobId` | Get all bids for a job (with contractor details) |

### Complaints
| Method | Route | Description |
|---|---|---|
| POST | `/api/complaints` | Submit a citizen complaint |
| GET | `/api/complaints` | Get all complaints |
| GET | `/api/complaints/my` | Get complaints for the logged-in citizen |
| GET | `/api/complaints/:id` | Get a single complaint |
| PATCH | `/api/complaints/:id/status` | Update complaint status |

### Hotspots
| Method | Route | Description |
|---|---|---|
| GET | `/api/hotspots` | Get all active hotspots |

### Analytics
| Method | Route | Description |
|---|---|---|
| GET | `/api/analytics` | City, department, and subdivision analytics (role-filtered) |

### Subdivisions
| Method | Route | Description |
|---|---|---|
| POST | `/api/subdivisions` | Create a subdivision (no auth — called during DEPARTMENT signup) |
| GET | `/api/subdivisions` | List all subdivisions (optional `?department=` filter) |
| GET | `/api/subdivisions/nearest` | Find nearest subdivision for a department and location |

### Rewards (Citizen App)
| Method | Route | Description |
|---|---|---|
| GET | `/api/rewards/me` | Citizen's points, tier, and full ledger |
| GET | `/api/rewards/leaderboard` | Top 20 citizens by Impact Points |
| POST | `/api/rewards/upvote/:id` | Upvote a complaint (+5 pts) |
| POST | `/api/rewards/redeem` | Reward redemption (coming soon) |

### Voice (Citizen App)
| Method | Route | Description |
|---|---|---|
| POST | `/api/voice/transcribe` | Speech-to-text via Sarvam AI |

### Upload
| Method | Route | Description |
|---|---|---|
| POST | `/api/upload` | Upload an image to Cloudinary (multipart/form-data, field: `image`) |

**Upload response:**
```json
{ "imageUrl": "https://res.cloudinary.com/..." }
```

### Error Responses
| Scenario | Status | Response |
|---|---|---|
| Missing JWT token | 401 | `{ "error": "No token" }` |
| Invalid/expired JWT | 401 | `{ "error": "Invalid token" }` |
| Upload without image | 400 | `{ "error": "No image provided" }` |
| Bid with non-existent jobId | 404 | `{ "error": "Job not found" }` |
| Assign with non-existent contractorId | 404 | `{ "error": "Contractor not found" }` |
| Complaint not found | 404 | `{ "error": "Complaint not found" }` |
| Invalid complaint status | 400 | `{ "error": "status must be one of: ..." }` |
| Server error | 500 | `{ "error": "<message>" }` |

---

## 9. Authentication & Security

- Passwords are hashed using **bcrypt** with 10 salt rounds before storage
- JWT tokens are signed with `JWT_SECRET` and expire per `JWT_EXPIRES_IN` config
- Token payload contains `{ id, role }` — role is used for route-level access control
- All non-auth routes are protected by the `authMiddleware` which:
  1. Extracts the Bearer token from the `Authorization` header
  2. Verifies it with `JWT_SECRET`
  3. Attaches the decoded payload to `req.user`
  4. Returns HTTP 401 on missing or invalid token
- Four user roles: `ADMIN` (authority), `CONTRACTOR`, `CITIZEN`, `DEPARTMENT`
- Analytics routes use a `dataFilter` middleware that scopes data by role: ADMIN sees all, DEPARTMENT sees their subdivision, CONTRACTOR sees nothing
- Citizen app auto-redirects to login on 401 (token expiry); tokens last 30 days
- Anti-fraud: camera-only capture, GPS locked at shutter, `capturedAt` timestamp validated server-side (flagged if > 2 minutes old), `deviceVerified: true` flag required

---

## 10. Map System

Both dashboards use **Leaflet** with **React Leaflet** for interactive maps.

### Marker Color System
```
Severity HIGH   + not COMPLETED  →  #EF4444  (red)
Severity MEDIUM + not COMPLETED  →  #F59E0B  (yellow)
Severity LOW    + not COMPLETED  →  #10B981  (green)
Any severity    + COMPLETED      →  #10B981  (green, always)
```

### Map Features
- **Hotspot Markers** — colored `divIcon` markers per job
- **Pulse Animation** — HIGH severity non-completed jobs pulse with CSS animation
- **Marker Clustering** — `leaflet.markercluster` groups nearby markers with count badges
- **Completion Markers** — checkmark-style icon at contractor's GPS location
- **Completion Line** — dashed green polyline from original job location to completion location
- **Map Picker** — embedded minimap in the issue creation form for click/drag pin placement
- **Live Polling** — `setInterval` re-fetches every 30 seconds
- **Memory Leak Prevention** — `mapInstance.remove()` called on component unmount
- **Missing Location Guard** — jobs without `location.lat`/`location.lng` are silently skipped

---

## 11. Image Uploads

Images are handled via a two-step process:

1. Client POSTs image to `POST /api/upload` as `multipart/form-data`
2. Backend uses **Multer** with `memoryStorage()` (no disk writes) to buffer the file
3. Buffer is streamed to **Cloudinary** via `upload_stream`
4. Cloudinary returns a secure URL which is stored in the Job/Complaint document

This applies to:
- Issue cover images (uploaded by authority during job creation)
- Completion proof photos (uploaded by contractor during job completion)
- Citizen complaint photos (uploaded immediately on camera capture in the mobile app)

---

## 12. Background Jobs

### Escalation Engine (every 15 minutes)
Evaluates all non-COMPLETED jobs and applies health transitions:

```
ON_TRACK  →  AT_RISK    (deadline within 24h, no progress update in last 24h)
ON_TRACK  →  OVERDUE    (past deadline)
OVERDUE   →  ESCALATED  (been OVERDUE for > 12h)
```

### Hotspot Engine (every hour)
Queries Clusters created within a rolling window (default: 7 days), groups them by category and geographic proximity (500m radius), and upserts/deactivates Hotspot documents:

- Groups exceeding `HOTSPOT_THRESHOLD` (default: 5) → Hotspot marked `isActive: true`
- Groups below threshold → existing Hotspot marked `isActive: false`
- Hotspot score = sum of `duplicateCount` across all clusters in the group

### Complaint Clustering (on complaint submission)
When a citizen submits a complaint, the backend checks for an existing Cluster of the same category within 50m:
- Match found → complaint merged into cluster (`isMerged: true`, `clusterId` set, `duplicateCount` incremented)
- No match → new Cluster created from the complaint

---

## 13. Environment Variables

### Backend (`backend/.env`)
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/fixmycity
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
HOTSPOT_WINDOW_DAYS=7
HOTSPOT_THRESHOLD=5
```

### Citizen App (`FixMyCityCitizen_App/services/api.js`)
```js
const BASE_URL = "http://<your-machine-ip>:5000/api";
// Use your machine's local IP (not localhost) when testing on a physical device
```

---

## 14. Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Expo CLI (`npm install -g expo-cli`) — for the citizen mobile app
- Expo Go app on your phone, or Android/iOS simulator

### Backend Setup
```bash
cd backend
npm install
# Configure .env with your MongoDB URI, JWT secret, and Cloudinary credentials
npm start
# Server runs on http://localhost:5000
```

### Citizen Mobile App Setup
```bash
cd FixMyCityCitizen_App
npm install
npx expo start
# Scan the QR code with Expo Go, or press 'a' for Android / 'i' for iOS simulator
```

### Authority & Contractor Dashboard Setup
```bash
cd fixmycity-authority-portal-main/FixMyCity-authority-portal-main
npm install
npm run dev
# App runs on http://localhost:5173
```


### First-Time Setup
1. Start the backend server
2. Register an ADMIN user via `POST /api/auth/signup` with `role: "ADMIN"`
3. Register a CONTRACTOR user via `POST /api/auth/signup` with `role: "CONTRACTOR"`
4. Register a CITIZEN user via `POST /api/auth/signup` with `role: "CITIZEN"` (or use the mobile app signup)
5. Log in to the Authority Dashboard at `/login`
6. Create a job using the "Create Issue" button
7. Log in to the Contractor Dashboard at `/contractor/login`
8. Find the job on the map and place a bid
9. Back in the Authority Dashboard, assign the bid
10. In the Contractor Dashboard, mark the job complete with GPS + photo proof
11. Open the Citizen App, submit a complaint, and track its status through the lifecycle

---


