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
- `studios`: id, owner_id, name, location, styles, `banner_image`, `logo_image`, deposit_required, deposit_amount, is_active, is_verified
- `artists`: id, studio_id, name, `profile_image`, `banner_image`, `portfolio_images`, styles, bio, experience_years, instagram
- `bookings`: id, studio_id, customer_id, artist_id, status, type, date
- `messages`: id, sender_id, receiver_id, content, timestamp, image_url
- `subscriptions`: studio_id, plan, status, expires_at

### April 2026 (Iteration 18)
- **Admin: Nutzer löschen** ✅: Trash-Icon in der Nutzerliste im Admin-Panel
- Admin-Konten sind geschützt (können nicht gelöscht werden)
- Studio-Inhaber-Löschung räumt automatisch auf: Studio, Artists, Slots werden mitgelöscht, aktive Buchungen werden storniert
- `user_id` wird jetzt korrekt in der Admin-Users-API zurückgegeben (via MongoDB `_id` Fallback)

### April 2026 (Iteration 17)
- **InkBook Logo** ✅: Echtes Marken-Logo in Navbar + Landing Page + Footer eingepflegt
- Licht-Navbar: `filter: invert(1)` → schwarzes Logo auf weiß; Dunkel-Navbar: Logo nativ weiß auf schwarz

### April 2026 (Iteration 16)
- **Chat Löschen** ✅: Trash-Icon im Chat-Header für beide Parteien (Studio + Kunde)
- **System-Nachricht** ✅: Zentrierte Systemnachricht "[Name] hat die Unterhaltung gelöscht und beendet." live im Chat sichtbar
- **Input gesperrt** ✅: Andere Partei sieht "Unterhaltung beendet" Banner + "Auch für mich löschen" Button
- **Live-Updates** ✅: 2.5s Polling zeigt Löschung ohne Seitenrefresh
- **Wiederherstellung** ✅: Neue Nachricht nach beidseitiger Löschung stellt Gespräch wieder her

### April 2026 (Iteration 15)
- **CustomerDashboard 3 Tabs** ✅: Heutige Termine + Kommende Termine + Vergangene Termine (live, zeitbasiert)
- **Vergangene Termine**: Umbuchen/Absagen ausgeblendet, "Abgeschlossen"-Badge, Bewerten-Popup für noch laufende Termine
- **StudioDashboard Übersicht** ✅: "Heutige Termine" (Echtzeit-Pulse) + "Kommende Termine" getrennt
- **StudioDashboard Buchungen** ✅: Sub-Tabs "Aktuelle Buchungen" / "Vergangene Termine"; Stornieren für vergangene Buchungen ausgegraut
- **Live-Updates** ✅: API-Polling alle 30s + Zeitneuberechnung alle 60s in beiden Dashboards

### April 2026 (Iteration 14)
- **Artist-Modal-Buttons** ✅: Galerie + Instagram von der Karte entfernt, nur noch im Modal-Popup
- **Chat-Slot-Sharing** ✅: Studio kann Terminvorschlag im Chat senden (bestehender oder neuer Slot)
- **Direktbuchung via Chat** ✅: Kunde bucht mit einem Klick direkt aus dem Chat heraus
- **Vollständige Benachrichtigungen** ✅: Email + Push-Notification nach Chat-Buchung, Buchung erscheint im Kunden-Dashboard
- **Live-Update** ✅: Kalender-Slot wird nach Buchung sofort als belegt markiert (is_booked=true), Slot-Karte zeigt "Termin gebucht" in Grün

### April 2026 (Iteration 13 – Aktuelle Session)
- **Studio-Branding** ✅: Separates Banner-Bild + Logo/Profilbild statt allgemeiner Galerie im Dashboard
- **Artist-Profile-Bilder** ✅: Eigenes `profile_image` (Avatar) + `banner_image` für jeden Artist im Dashboard hochladbar
- **Galerie-Tab entfernt** ✅: Studio-Profil-Seite hat jetzt nur noch Tabs „Über uns", „Artists", „Bewertungen"
- **„Galerie öffnen"-Button** ✅: Artist-Karten auf Studio-Seite haben dedizierter Button zum Öffnen der Lightbox
- **Artist-Karte visuell verbessert** ✅: `banner_image` als Karten-Header-Hintergrund, `profile_image` als rundes Avatar-Overlay
- **Artist-Modal verbessert** ✅: `banner_image` als Modal-Header-Hintergrund, `profile_image` als Avatar im Namensoverlay

### April 2026 (Iteration 12)
- **Artist Modal** ✅: Artist-Karte anklickbar → Framer-Motion slide-up Modal (Name, Bio, Stile, Portfolio, Instagram)
- **Gallery + Portfolio Lightbox** ✅: Vollbild-Overlay mit Navigation, Tastatur (Esc/Pfeiltasten)
- **Deposit flexibel** ✅: Kein hardcoded "€50" mehr; Studios stellen selbst ein (Dashboard: Toggle + Betrag)
- **EU-Datumsformat** ✅: DD.MM.YYYY überall (14.04.2026 statt 2026-04-14)
- **Stornierungsbanner persistent** ✅: localStorage `inkbook_dismissed_cancellations` – kommt nach Schließen nicht wieder

### April/Mai 2026 (Diese Session – Iteration 11)
- **GSAP Landingpage MacBook + Scroll-Fix** ✅
  - Neue MacBook-CSS-Komponente mit korrekten Proportionen (16:10 Screen, Hinge, Base, Touchpad)
  - Hero: MacBook (zentriert, hinter iPhones) + 3 iPhones in gestaffelter 3D-Anordnung
  - MacBook GSAP Entrance: rises from below with rotateX(6→22) + scale-in
  - Scroll-Fix: `opacity:0` aus allen Hero-Scroll-Animationen entfernt → Geräte bleiben sichtbar beim Scrollen
  - Neue Screenshots: search.jpg, booking.jpg, chat.jpg (390x844), desktop.jpg (1280x800) – alle mit realistischen Daten
  - Test-Daten bereinigt: "Test Kunde" → "Sophie Müller", realistische Chat-Nachrichten
  - Chat zeigt Drachen-Tattoo-Referenzbild (Unsplash) statt Selfie
  - Doppelter /search-Route in App.js bereinigt

### April/Mai 2026 (Letzte Session – Iteration 10)
- **GSAP Landingpage verifiziert** ✅ (100% Frontend-Tests bestanden)
  - Hero-Sektion: 3 iPhone-Mockups mit echten App-Screenshots (search.jpg, booking.jpg, chat.jpg)
  - GSAP ScrollTrigger: Title-Char-Animation, Barrel-Roll-Phones, Text-Reveal-Animationen
  - Wetter-Übergänge (Dunkel→Hell→Dunkel) zwischen allen Feature-Sektionen
  - Feature-Sektionen: Search (weiß), Booking (dunkel), Chat (weiß) mit je einem Phone-Mockup
  - Stats-Sektion: 500+ Studios, 10k+ Buchungen, 4.9★ Bewertung
  - Doppelter /search-Route-Eintrag in App.js bereinigt
  - Keine JS-Fehler, keine GSAP-Memory-Leaks (ctx.revert() korrekt implementiert)

### Mai 2026 (Diese Session – Iteration 7 & 8)
- **Chat-Fix verifiziert** ✅
  - Enter-Taste sendet Nachricht (stale-closure-Fix via useRef funktioniert korrekt)
  - Live-Polling alle 2s – Studio sieht Kunden-Nachrichten ohne Reload
  - Bug behoben: `image_url: null` → `image_url: ''` + `Optional[str]` im Backend
- **Push-Benachrichtigungen verifiziert** ✅
- **5 neue UI-Features** ✅
  - Schließen-Button (X) für Stornierung-Banner im CustomerDashboard
  - Bild-Lightbox im Chat – Klick öffnet Vollbild-Overlay
  - Voller Monatskalender (Mo–So Grid, Navigation, heute-Highlight, vergangene Tage deaktiviert)
  - Kalender-Verfügbarkeitsanzeige: grüner/grauer Punkt pro Tag (API: GET /studios/{id}/available-dates)
  - Buchungs-Sidebar zeigt Login/Register-Prompt wenn nicht eingeloggt
  - Instagram-Button auf Artist-Kachel: Klick öffnet Popup mit Lottie-Animation (lottie-instagram.json in /public/) + @handle

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
