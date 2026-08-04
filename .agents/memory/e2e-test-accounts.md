---
name: E2E test accounts and email domain validation
description: Registration does a DNS MX check on email domains — automated test accounts must use real domains (e.g. gmail.com), and seeded test data lives in backend/data.json.
---

Registration (`backend/server.py`, `validate email` near line 707) resolves the email domain's MX records via DNS and rejects domains that don't exist ("E-Mail-Adresse ungültig oder Domain existiert nicht").

**Why:** Pre-launch E2E runs failed repeatedly because test subagents tried registering with fake domains like `studioos-test.de`.

**How to apply:** For automated UI tests, register with real-domain addresses (e.g. `...@gmail.com`) or seed users directly into `backend/data.json` (remember: seeded users can have `user_id: None` — see memdb-conv-id memory; login still works via `_id`). Studio seeded for testing: slug `teststudio-e2e-audit`. Consent/refund flows depend on studio settings (`consent_required`, `cancellation_hours`) being enabled in the studio profile edit dialog first.
