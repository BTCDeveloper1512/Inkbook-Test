---
name: Capacity booking flow
description: How tattoo bookings work — capacity points instead of time slots, with two separate API endpoints.
---

## Rule
Tattoo bookings use a capacity-point model, not time slots. Each size costs points; the studio confirms the actual time after accepting.

**Sizes:** mini=1, small=2, medium=3, large=5, xl=8. Day capacity = 8 points total.

**Day status thresholds:** available (≥5 remaining), limited (3–4), small_only (1–2), full (≤0).

## API separation
- `GET /studios/{id}/capacity-calendar?year=&month=` → per-day status map
- `POST /bookings/capacity` → creates booking without slot_id; stores `capacity_cost` and `size_category`
- `POST /bookings` → old slot-based flow (consultation only)

## Frontend
- `bookingType === "tattoo"` triggers the capacity flow in StudioPage.js
- Two separate useEffects: one for available-dates (consultation), one for capacity-calendar (tattoo)
- Constants `SIZES`, `SIZE_COST`, `DAY_CAPACITY` defined at module level before the component
- `sizeCategory` + `capacityData` state; `handleCapacityBook` submits to `/bookings/capacity`

**Why:** Studios can't pre-schedule exact times for all tattoo appointments; capacity-based booking lets them manage workload and confirm times after reviewing each request.
