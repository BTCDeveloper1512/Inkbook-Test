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

## What's Been Implemented (Updated 2025-04 – v3)

### Backend
- ✅ All auth (JWT + Google OAuth), Studios, Slots, Bookings, Reviews, Messages
- ✅ Stripe deposits + Subscription checkout (Basic €29/Pro €79)
- ✅ Subscription verify/cancel/status endpoints
- ✅ Artists CRUD (per studio): name, bio, styles, experience, instagram, portfolio
- ✅ Booking reschedule (PUT /api/bookings/{id}/reschedule)
- ✅ Email notifications via Resend (confirmation, status, reschedule) – non-blocking
- ✅ AI Style Advisor (GPT-4o)

### Frontend
- ✅ SubscriptionPage (/subscription): Basic €29 / Pro €79 plan cards + compare table
- ✅ Studio Dashboard: 5 tabs (Übersicht, Slots, Buchungen, Artists, Profil)
  - Artists tab: create/edit/delete artists with portfolio images
  - Subscription badge + Abo button in header
- ✅ Customer Dashboard: Umbuchen-Button + Reschedule-Modal with date/slot picker
- ✅ Studio detail page: 4 tabs (About, Artists, Gallery, Reviews)
- ✅ All previous features intact

## Resend Email Status
- API key is set and active
- Emails currently only deliverable to verified Resend account email
- For production: verify domain at resend.com/domains, update SENDER_EMAIL in .env

## P0 Backlog
- Resend domain verification (user action needed at resend.com)
- Admin panel
- Push notifications (Web Push API)

## P1 Backlog  
- Monthly subscription auto-renewal (Stripe recurring billing)
- Booking analytics for studios
- Social sharing

## P2 Backlog
- Deposit refund management
- Customer tattoo history/portfolio
- Multiple artists per booking slot

## Test Accounts
- Admin: admin@inkbook.com / admin123
- Customer: testuser@inkbook.com / test123
- Studio Owner: studioowner@inkbook.com / studio123

## Demo Studios
- studio_demo001: Black Needle Studio (Berlin, Fine Line/Blackwork)
- studio_demo002: Ink & Soul Hamburg (Traditional/Japanese)
- studio_demo003: Realismus Atelier München (Realism/Portrait)
- studio_demo004: Ink Rebels Köln (Tribal/Abstract)
