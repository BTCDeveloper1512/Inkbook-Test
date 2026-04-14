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

## What's Been Implemented (Updated 2025-04)

### Backend (FastAPI)
- ✅ JWT auth + Google OAuth (email registration injects `id` from JWT payload - bug fixed)
- ✅ Studios CRUD with filters
- ✅ Slots management
- ✅ Bookings with reference images, email notifications
- ✅ Reviews with avg rating
- ✅ Messages/Chat (conversations enriched with other user name)
- ✅ Stripe deposits
- ✅ AI Style Advisor (GPT-4o vision)
- ✅ Image upload (base64 data URLs)
- ✅ Dashboard stats
- ✅ Email notifications via Resend (booking confirmation + status update, graceful skip if no key)
- ✅ Demo data seeded

### Frontend (React + PWA)
- ✅ Landing page
- ✅ Search/Discovery + filters
- ✅ Studio detail + booking sidebar with reference image upload (up to 5)
- ✅ Studio contact button (links to /messages/owner_id)
- ✅ Customer Dashboard (stats, bookings, messages quick action)
- ✅ Studio Dashboard (4 tabs: Übersicht, Slots, Buchungen, Profil bearbeiten)
  - ✅ Profile edit: name, description, address, city, phone, email, website, price range
  - ✅ Style toggle (select/deselect from 16 styles)
  - ✅ Gallery management (upload + remove images)
- ✅ Chat/Messaging UI (/messages + /messages/:recipientId)
  - ✅ Conversation list with other user name
  - ✅ Real-time polling (5s)
  - ✅ Image upload in chat
  - ✅ Mobile responsive two-panel layout
- ✅ AI Style Advisor (GPT-4o)
- ✅ Auth pages (Login + Register + Google OAuth)
- ✅ PWA: manifest.json, viewport meta, page title, apple-mobile-web-app tags
- ✅ Multilingual (DE/EN), Nachrichten nav link

## Priority Backlog (Updated)
### P0 (Next)
- Resend API key needed for email (RESEND_API_KEY in .env)
- Artist/employee profiles within studio
- Booking reschedule flow

### P1
- Push notifications (web push API)
- Admin panel
- Monthly studio subscriptions (Stripe)
- Advanced calendar view (FullCalendar)

### P2
- Studio analytics dashboard
- Social sharing
- Deposit refund management

## Test Accounts
- Admin: admin@inkbook.com / admin123
- Customer: testuser@inkbook.com / test123
- Studio Owner: studioowner@inkbook.com / studio123

## Demo Studios
- studio_demo001: Black Needle Studio (Berlin, Fine Line/Blackwork)
- studio_demo002: Ink & Soul Hamburg (Traditional/Japanese)
- studio_demo003: Realismus Atelier München (Realism/Portrait)
- studio_demo004: Ink Rebels Köln (Tribal/Abstract)
