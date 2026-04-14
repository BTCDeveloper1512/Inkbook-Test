# InkBook – Product Requirements Document (PRD)

## Original Problem Statement
Design a web app ("InkBook") similar to Doctolib, exclusively for Tattoo Studios and Artists.
- Customers can search, compare, and book appointments (consultation/sessions)
- Studios get admin dashboard for calendar management, customer management, and automated reminders
- Business model: Free for customers, monthly Stripe subscription for studios (~€49/mo)

## Architecture
```
/app/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js / App.css
│   │   ├── i18n.js
│   │   ├── components/        # Navbar, StudioCard, Footer, ProtectedRoute
│   │   ├── pages/             # All pages
│   │   └── utils/
│   │       └── pushNotifications.js
│   ├── public/
│   │   ├── sw.js              # Service Worker for Push
│   │   └── manifest.json      # PWA config
│   ├── tailwind.config.js
│   └── package.json
└── memory/
    ├── test_credentials.md
    └── PRD.md
```

## Tech Stack
- **Frontend**: React, TailwindCSS, framer-motion, i18n, shadcn/ui, PWA
- **Backend**: FastAPI, MongoDB (Motor Async), JWT Auth (cookie-based)
- **Integrations**: Stripe (Subscriptions), Resend (Emails), pywebpush (Push Notifications)

## DB Schema
- `users`: id, email, role (customer/studio/admin), password_hash, push_subscriptions
- `studios`: id, owner_id, name, location, styles, images, is_active, is_verified
- `artists`: id, studio_id, name, styles
- `bookings`: id, studio_id, customer_id, artist_id, status, type, date
- `messages`: id, sender_id, receiver_id, content, timestamp, image_url
- `subscriptions`: studio_id, plan, status, expires_at

### Mai 2026 (Diese Session – Iteration 7)
- **Chat-Fix verifiziert** ✅
  - Enter-Taste sendet Nachricht (stale-closure-Fix via useRef funktioniert korrekt)
  - Send-Button funktioniert
  - Live-Polling alle 2s – Studio sieht Kunden-Nachrichten ohne Reload
  - Fehlertolerant: kein Redirect zu /login bei kurzen Netzwerkausfällen
  - Bug behoben: `image_url: null` → `image_url: ''` in MessagesPage.js + `Optional[str]` im Backend
- **Push-Benachrichtigungen verifiziert** ✅
  - VAPID-Key-Endpunkt liefert Key
  - Subscribe-Endpunkt akzeptiert Push-Subscription
  - Typing-Indicator (POST/GET) funktioniert korrekt

### 2025 Initial MVP
- Base FastAPI + React + MongoDB setup ✅
- JWT Cookie Auth + Multi-language (i18n DE/EN) ✅
- Studio Search + Booking System ✅
- Artist profiles within studios ✅

### Q1 2026 Feature Set
- Stripe Subscriptions (~€49/mo, Basic €29, Pro €79) ✅
- Booking Rescheduling Flow ✅
- Resend Email Notifications ✅
- Chat/Messaging UI with image upload ✅
- Reference image upload for bookings ✅
- PWA (manifest.json + sw.js) ✅
- AI Advisor Page ✅

### April 2026 (Latest Session)
- **UI Redesign "Premium Light Minimalist (Apple-like)"** ✅
  - Playfair Display headings, Inter body text
  - Soft shadows, rounded-2xl corners
  - framer-motion animations on all pages
  - All pages updated: Landing, Search, Studio, Dashboards, Messages, Subscription
- **Push Notifications** ✅
  - VAPID keys generated and saved to .env
  - Backend: /api/notifications/subscribe, /api/notifications/unsubscribe, /api/notifications/vapid-public-key
  - Frontend: pushNotifications.js utility + sw.js service worker
- **Admin Panel for InkBook Operators** ✅
  - Route: /admin (protected, admin role only)
  - 4 tabs: Übersicht (stats), Studios (CRUD), Nutzer, Buchungen
  - Studio management: activate/deactivate, verify, delete
  - Platform stats: total studios, users, bookings, revenue, subscriptions

## Key API Endpoints
- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `/api/studios`, `/api/studios/{id}`
- `/api/bookings`, `/api/bookings/{id}/reschedule`
- `/api/messages`, `/api/messages/{recipient_id}`
- `/api/subscriptions/create-checkout-session`, `/api/webhook/stripe`
- `/api/notifications/subscribe`, `/api/notifications/vapid-public-key`
- `/api/messages/unread-count` – Ungelesene Nachrichten-Zähler
- `/api/messages/{id}/mark-read` – Nachrichten als gelesen markieren

## 3rd Party Integrations
- **Stripe** (test mode) – Studio subscriptions
- **Resend** (API key set) – Email notifications
- **pywebpush** – Browser push notifications (VAPID keys in .env)

## Design System
- Based on `/app/design_guidelines.json`
- Fonts: Playfair Display (headings), Inter (body)
- Colors: zinc-900 (primary), zinc-50 (background), white (cards)
- Shadows: `shadow-[0_4px_16px_rgb(0,0,0,0.04)]`
- Radii: rounded-2xl (cards), rounded-full (pills/buttons)

## Prioritized Backlog
### P0 (Must Have)
- Alle P0 Features implementiert und getestet ✅

### P1 (High Priority)
- Stripe Connect für Studio-Auszahlungen / Revenue-Tracking

### P2 (Nice to Have)
- Rating/Review system for studios
- Social sharing / QR codes for studios
- Dark mode toggle
- Advanced analytics per studio (heatmap, conversion rates)
- Google Maps integration for studio location
- Mobile app (React Native or PWA-enhanced)

## Testing Status
- Iteration 1-4 all passed (100% backend + frontend)
- Test credentials in /app/memory/test_credentials.md
