# FixMyCity — Citizen Mobile App

A React Native (Expo) app that lets citizens report civic issues directly from their phones. Built for speed, trust, and accessibility — with AI-assisted reporting, voice input, and a live hotspot map.

---

## What It Does

Citizens can report broken infrastructure, garbage, water leaks, and other civic problems in under a minute. Every report is verified with a live photo and GPS location, then routed to the relevant authority portal for action.

---

## Key Features

### 📷 Live Photo Capture
- Camera-only capture (gallery not allowed) to prevent fake or old photos
- Photo is immediately uploaded to Cloudinary on capture
- GPS coordinates are recorded at the exact moment of the shutter press
- A "✅ VERIFIED" badge confirms both photo and location are locked in

### ✨ AI Autofill
- After capturing a photo, tap "AI Autofill" to let AI analyze the image
- The AI identifies the issue and auto-fills:
  - **Category** — pothole, garbage, water leak, streetlight, road damage, power cut, other
  - **Severity** — low, medium, high
  - **Description** — a short, clear complaint description
- If the AI doesn't detect a civic issue, the citizen is prompted to retake the photo
- If AI is unavailable, the form falls back to manual entry gracefully

### 🎙️ Voice Input (Multilingual)
- Citizens can dictate their complaint description instead of typing
- Powered by Sarvam AI speech-to-text
- Supports 8 Indian languages: English, Hindi, Marathi, Tamil, Telugu, Kannada, Bengali, Gujarati
- Auto-detects language or citizen can select manually
- Auto-stops after 60 seconds

### 📍 GPS Location Verification
- Location is captured automatically on screen load using high-accuracy GPS
- Reverse geocoded to a human-readable address
- Location must be verified before a complaint can be submitted
- Citizens can retry if location fails

### 🗺️ Hotspot Map
- Interactive map showing all active civic complaints in the area
- Color-coded pins by severity: 🔴 High, 🟠 Medium, 🟢 Low
- Filter by severity level
- Tap any pin to see complaint details, photo, status, and address
- Category summary strip at the bottom (pothole count, garbage count, etc.)

### 📋 My Complaints
- View all complaints submitted by the logged-in citizen
- Real-time status tracking: Received → Job Created → In Progress → Resolved
- Pull-to-refresh
- Tap any complaint to view full details

### 🔐 Authentication
- JWT-based login and signup
- Role-enforced: only Citizens can log in (Authority/Contractor use separate web portals)
- Token stored securely in AsyncStorage

---

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Home | `/` | Dashboard with quick actions |
| Login | `/login` | Citizen sign-in |
| Sign Up | `/signup` | New citizen registration |
| Report Issue | `/report` | Full complaint submission flow |
| My Complaints | `/my-complaints` | Complaint history and status |
| Hotspot Map | `/map` | Live map of all civic issues |
| Complaint Detail | `/complaint/[id]` | Single complaint view |
| Success | `/success` | Post-submission confirmation |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo (SDK 54) |
| Routing | Expo Router (file-based) |
| Language | TypeScript |
| Image Picker | expo-image-picker |
| Location | expo-location |
| Audio | expo-av |
| Maps | react-native-maps |
| Storage | @react-native-async-storage/async-storage |
| HTTP | Fetch API (custom `api.js` wrapper) |
| AI Analysis | Backend → AI vision model via `/api/complaints/analyze-image` |
| Voice STT | Sarvam AI via `/api/voice/transcribe` |
| Image Storage | Cloudinary (via backend `/api/upload`) |
| Auth | JWT Bearer tokens |

---

## Project Structure

```
app/
  _layout.tsx          # Root layout (Expo Router stack)
  index.tsx            # Home screen
  login.tsx            # Login screen
  signup.tsx           # Sign up screen
  report.tsx           # Report issue screen (AI + voice + GPS)
  my-complaints.tsx    # Complaint history
  map.tsx              # Hotspot map
  success.tsx          # Submission success
  complaint/
    [id].tsx           # Complaint detail

components/
  PrimaryButton.tsx    # Reusable button
  InputField.tsx       # Reusable text input
  ComplaintCard.tsx    # Complaint list item
  VoiceMicButton.tsx   # Mic button with recording state

hooks/
  useVoiceRecorder.ts  # Voice recording + Sarvam STT hook

services/
  api.js               # HTTP client (GET, POST, PATCH, postForm)
  authService.ts       # Login, logout, token management
  complaintService.ts  # Complaint API calls
```

---

## Report Flow (Step by Step)

```
1. Open app → Home screen
2. Tap "📷 Report an Issue"
3. GPS location is captured automatically
4. Tap the camera area → live photo taken
5. Photo uploads to Cloudinary in the background
6. Tap "✨ AI Autofill" → AI analyzes the image
7. Category, severity, and description are auto-filled
8. Edit any field if needed
9. Add/edit description (or use 🎙️ voice input)
10. Tap "Submit Report" → complaint sent to backend
11. Redirected to success screen
```

---

## Complaint Categories

- 🕳️ Pothole
- 🗑️ Garbage
- 💧 Water Leak
- 💡 Streetlight
- 🚧 Road Damage
- ⚡ Power Cut
- ⚠️ Other

---

## Severity Levels

| Level | Color | Meaning |
|-------|-------|---------|
| High | 🔴 Red | Immediate danger or major disruption |
| Medium | 🟠 Amber | Significant issue needing prompt attention |
| Low | 🟢 Green | Minor issue, can be scheduled |

---

## Complaint Status Lifecycle

```
RECEIVED → JOB_CREATED → IN_PROGRESS → COMPLETED
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone, or Android/iOS simulator

### Install & Run

```bash
cd FixMyCityCitizen_App
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android / `i` for iOS simulator.

### Configure API URL

Update the base URL in `services/api.js` to point to your backend:

```js
const BASE_URL = "http://<your-machine-ip>:5000/api";
```

Use your machine's local IP (not `localhost`) when testing on a physical device.

---

## Backend Dependencies

This app requires the FixMyCity backend (`/backend`) to be running. Key endpoints used:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Citizen login |
| `/api/auth/register` | POST | Citizen registration |
| `/api/complaints` | POST | Submit complaint |
| `/api/complaints/my` | GET | Fetch citizen's complaints |
| `/api/complaints/analyze-image` | POST | AI image analysis |
| `/api/complaints/hotspots` | GET | All complaints for map |
| `/api/upload` | POST | Upload image to Cloudinary |
| `/api/voice/transcribe` | POST | Voice-to-text (Sarvam AI) |

---

## Anti-Fraud Measures

- Camera-only photo capture (no gallery uploads)
- GPS coordinates locked at time of photo capture
- `capturedAt` ISO timestamp sent with every complaint
- `deviceVerified: true` flag on all submissions
- Location must be verified before submission is allowed
