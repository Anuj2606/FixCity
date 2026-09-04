# FixMyCity — Civic Issue Management & Resolution Portal

FixMyCity is a civic issue reporting and municipal management platform designed to connect citizens directly with city administrators and field operations. The application empowers citizens to report civic grievances (potholes, streetlights, waste accumulation, broken infrastructure, water leaks) with geolocation, photo evidence, and AI assistance, while providing municipal authorities with an operational command center to triage, route, assign, and resolve civic complaints.

---

## 🌐 Live Application URLs

- **Live Production App:** https://fixmycity-app-150360520684.asia-southeast1.run.app

---

## 🚀 Key Features

### 1. Citizen Reporting Portal
- **Location-Aware Submissions:** Auto-detects GPS coordinates with browser geolocation or allows manual address search.
- **Visual Evidence Upload:** Upload and preview on-site photos of reported infrastructure issues.
- **AI-Powered Civic Assistance:** Integrates Gemini 2.5 to analyze issue descriptions, auto-categorize complaints, detect severity levels, and suggest actionable summaries.
- **Tracking & History:** Citizens can view real-time status updates, track resolution timelines, and access their submission history under "My Reports".

### 2. Interactive Community Map (Leaflet + OpenStreetMap)
- **Geospatial Visualization:** 100% open-source mapping powered by Leaflet and OpenStreetMap tiles with zero proprietary API key requirements.
- **Dynamic Filtering:** Filter civic pins by status (Reported, Under Review, In Progress, Resolved) and category.
- **Interactive Pins & Popups:** Click on map markers to view issue thumbnails, severity indicators, and quick links to full report details.

### 3. Municipal Operations & Administrative Command Center
- **Operational Triage:** Dedicated view for municipal officers to manage incoming reports across city zones.
- **Staff Assignment & Routing:** Assign civic issues to specific departments (Roads & Highways, Sanitation, Electrical, Water Works).
- **Status Lifecycle Transitions:** Update statuses across `reported` ➔ `under_review` ➔ `assigned` ➔ `in_progress` ➔ `resolved` ➔ `closed`.
- **Target Resolution Estimations:** Automated SLA deadlines and target resolution tracking based on severity.

### 4. Automated Notifications & Cloud Functions
- **Admin Alerts:** Cloud Function (`notifyAdminsOnIssueCreated`) triggers on new reports in Firestore and dispatches notifications to municipal administrators.
- **Citizen Status Updates:** Cloud Function (`notifyCitizenOnStatusChange`) triggers on status modifications to alert the reporting citizen in real time.

### 5. Municipal Analytics & Insights
- **Data Visualizations:** Interactive charts built with Recharts displaying resolution velocity, category distribution, and geographic density.
- **Performance Metrics:** Real-time calculation of resolution rates, average resolution time, and active caseloads.

### 6. Role-Based Access Control (RBAC)
- **Citizen Role:** Submit reports, view public map, track own submissions, receive status update alerts.
- **Admin Role:** Access operations center, triage queue, edit issue metadata, assign field personnel, access administrative settings.

---

## 🏗️ System Architecture

FixMyCity is built as a full-stack web application combining a React SPA frontend with an Express API proxy, backed by Firebase Firestore for real-time data persistence, Firebase Authentication, and Google Gemini for server-side AI processing.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                              │
│                                                                        │
│   React 19 + TypeScript + Tailwind CSS v4 + Motion                     │
│   ├── Citizen Views (Home, Report Issue, My Reports, Map)              │
│   ├── Admin Views (Operations Center, Issue Management, Analytics)    │
│   └── Geospatial Engine (Leaflet + OpenStreetMap)                     │
└───────────────────┬────────────────────────────┬───────────────────────┘
                    │ REST / Static              │ Real-time SDK
                    ▼                            ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       EXPRESS BACKEND (Node.js)      │  │      FIREBASE PLATFORM       │
│                                      │  │                              │
│  - Vite SSR/SPA Middleware           │  │  - Firebase Authentication   │
│  - Server-side Gemini AI Proxy       │  │  - Cloud Firestore Database  │
│  - Geocoding & Places Helper         │  │    (Issues, Users, Notifs)   │
│  - Strict API Key Protection         │  │  - Firestore Security Rules  │
└───────────────────┬──────────────────┘  └──────────────┬───────────────┘
                    │                                    │
                    ▼                                    ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       GOOGLE GEMINI API              │  │   FIREBASE CLOUD FUNCTIONS   │
│  (Intelligent Triage & Categorization)│  │   (Automated Event Triggers) │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 🔄 End-to-End Workflow

```
[ Citizen ] ──( 1. Reports Issue )──► Form + GPS + Photo + AI Suggestions
                                              │
                                              ▼
                                   [ Firestore Database ]
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        [ Cloud Function Trigger ]                         [ Operations Center ]
                     │                                                 │
          Dispatches Alert to Admins                        Municipal Admin Triages
                     │                                                 │
                     ▼                                                 ▼
        [ Admin Notification Inbox ]                       Assigns Dept & Updates Status
                                                                       │
                                                                       ▼
                                                           [ Cloud Function Trigger ]
                                                                       │
                                                           Notifies Reporting Citizen
                                                                       │
                                                                       ▼
                                                           Issue Verified & Resolved
```

1. **Submission:** A citizen captures a civic defect, uploads an image, and allows GPS location capture. Gemini AI assists by verifying the issue category and urgency.
2. **Persistence & Trigger:** The complaint is written to the `issues` collection in Firestore. A Cloud Function instantly triggers and generates notification documents for all registered administrators.
3. **Triage & Assignment:** Municipal staff inspects the issue on the Operations Center board or Community Map, verifies the priority, and assigns it to the relevant department.
4. **Progress & Notification:** As work progresses, the status transitions to `in_progress` and eventually `resolved`. On every status update, a Cloud Function automatically dispatches a notification to the reporting citizen.
5. **Closure:** The citizen receives notification of resolution, and the issue is archived in the community record.

---

## 🧰 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React |
| **Mapping** | Leaflet, OpenStreetMap (`tile.openstreetmap.org`) |
| **Charts & Metrics**| Recharts |
| **Backend & Server**| Node.js, Express, `tsx`, `esbuild` |
| **AI Engine** | Google GenAI SDK (`@google/genai`), Gemini 2.5 Flash |
| **Database & Auth** | Firebase Cloud Firestore, Firebase Authentication |
| **Serverless Functions** | Firebase Cloud Functions v2 (Node.js runtime) |
| **Security** | Granular Firestore Security Rules (`firestore.rules`), strict `.gitignore` |

---

## 🔒 Security & Credential Protection

This repository strictly implements secure credential handling:
- **No Secret Leakage:** `.env`, `.env.local`, and all private credentials (`*.pem`, `*.key`, `service-account*.json`) are excluded in `.gitignore`.
- **Server-Side API Proxying:** Gemini API calls are strictly handled on the Node.js backend (`server.ts`) via `process.env.GEMINI_API_KEY`. The Gemini key is **never** bundled or exposed to client browsers.
- **Client Configuration Isolation:** The frontend dynamically loads Firebase client configuration without hardcoding sensitive strings into code. A template configuration is provided in `firebase-applet-config.example.json`.
- **Role-Based Security Rules:** Firestore database access is governed by production-grade security rules validating `request.auth` identities and user roles.

---

## 💻 Local Development & Setup

### Prerequisites
- Node.js (v20 or higher recommended)
- npm or bun

### 1. Clone the repository
```bash
git clone https://github.com/your-username/fixmycity.git
cd fixmycity
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```
Fill in the necessary variables:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

### 4. Run the development server
```bash
npm run dev
```
The application will be accessible at: `http://localhost:3000`

### 5. Build for production
```bash
npm run build
npm start
```

---

## 📄 License
This project is licensed under the MIT License — feel free to customize and deploy it for your local community or municipality.
