# InkBook - PRD (Product Requirements Document)

## Problem Statement
Doctolib-style tattoo booking platform for tattoo studios and artists. Customers can find, compare, and book tattoo studios/artists. Studios get professional booking & management tools.

## Architecture
- **Frontend**: React (CRA + Craco), Tailwind CSS, react-router-dom, react-i18next, lucide-react
- **Backend**: FastAPI, Motor (async MongoDB), bcrypt, PyJWT, Stripe (emergentintegrations), GPT-4o AI
- **Database**: MongoDB (tattoo_booking)
- **Auth**: JWT (email/password) + Emergent-managed Google OAuth
- **Payments**: Stripe via emergentintegrations
- **AI**: OpenAI GPT-4o via emergentintegrations (EMERGENT_LLM_KEY)

## User Personas
1. **Tattoo Enthusiasts** (18-45, style-conscious, urban) - find and book studios
2. **Studio Owners / Artists** - manage bookings, calendar, clients

## Core Requirements (Static)
- Studio search with filters (style, price, city, rating)
- Studio/Artist profiles with gallery, reviews, booking
- Real-time slot booking (consultation, tattoo session)
- Stripe deposit payments for appointments
- Customer & Studio dashboards
- Secure auth (JWT + Google OAuth)
- AI tattoo style advisor (GPT-4o vision)
- Multilingual (DE/EN)

## What's Been Implemented (2025-04)

### Backend (FastAPI)
- ✅ JWT auth (register/login/logout/me) with bcrypt
- ✅ Google OAuth session via Emergent-managed auth
- ✅ Studios CRUD (create, read, update, list with filters)
- ✅ Slots management (create, list, delete)
- ✅ Bookings (create, list, status update, cancel)
- ✅ Reviews (create, list, avg rating auto-update)
- ✅ Messages/Chat (send, list conversations)
- ✅ Stripe deposits (create-session, status, webhook)
- ✅ AI Style Advisor (GPT-4o vision + text)
- ✅ Image upload (base64 data URLs)
- ✅ Dashboard stats for both user types
- ✅ Demo data seeded (4 studios, slots for 14 days)
- ✅ Admin + Studio Owner + Customer test accounts seeded

### Frontend (React)
- ✅ Landing page (hero, featured studios, how-it-works, AI banner)
- ✅ Search/Discovery page (studios grid + filters)
- ✅ Studio detail page (tabs: About, Gallery, Reviews + booking sidebar)
- ✅ Booking flow (select date → slot → type → confirm)
- ✅ Customer Dashboard (stats, upcoming/past bookings, deposit payment)
- ✅ Studio Dashboard (create studio, slot management, booking management)
- ✅ AI Style Advisor page (image upload + description → GPT-4o recommendation)
- ✅ Auth pages (Login + Register with Google OAuth buttons)
- ✅ Auth callback (Google OAuth session exchange)
- ✅ Protected routes
- ✅ Navbar with language toggle (DE/EN)
- ✅ Footer
- ✅ i18n (react-i18next, DE + EN)
- ✅ Design: Playfair Display + Outfit fonts, editorial light theme

## Prioritized Backlog

### P0 (Critical - next)
- Chat/Messaging UI (frontend for conversations)
- Email notifications (booking confirmations, reminders)
- Studio profile edit page
- Reference image upload in booking

### P1 (High priority)
- Artist profiles (separate from studio)
- Mobile app / PWA
- Push notifications
- Advanced calendar view for studio dashboard
- Booking reschedule functionality

### P2 (Nice to have)
- Studio subscription/payment (Stripe monthly plans)
- Admin panel
- Social sharing of tattoo appointments
- Deposit refund management
- Customer profile with tattoo history

## Test Accounts
- Admin: admin@inkbook.com / admin123
- Customer: testuser@inkbook.com / test123
- Studio Owner: studioowner@inkbook.com / studio123

## Demo Studios
- studio_demo001: Black Needle Studio (Berlin, Fine Line/Blackwork)
- studio_demo002: Ink & Soul Hamburg (Traditional/Japanese)
- studio_demo003: Realismus Atelier München (Realism/Portrait)
- studio_demo004: Ink Rebels Köln (Tribal/Abstract)
