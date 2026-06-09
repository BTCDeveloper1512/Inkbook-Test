---
name: Capacity active statuses
description: Capacity calendar must count all booking pipeline statuses, not just pending/confirmed.
---

## Rule
The capacity calendar and any capacity-check query must use _ACTIVE_STATUSES (the module-level list), not a hardcoded subset like ["pending", "confirmed"].

**Why:** Bookings flow through pending_studio_review → offer_sent → waiting_for_deposit → confirmed. All of these consume studio capacity for the day. Hardcoding only ["pending","confirmed"] caused newly-created capacity bookings to not count toward the limit, allowing overbooking.

**How to apply:** In get_capacity_calendar and any booking overlap check, use {"status": {"$in": _ACTIVE_STATUSES}}.
