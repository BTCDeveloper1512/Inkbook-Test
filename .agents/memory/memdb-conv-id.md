---
name: Memdb conv_id migration
description: Old seed conversations have conv_id: None — participant-based lookup needed when upserting.
---

## Rule
When upserting into db.conversations by conv_id, always search for an existing conversation by participants first (since seed data may have conv_id: None).

**Why:** Old seed conversations were created without a conv_id field (stored as null). An upsert on {"conv_id": "conv_..."} would create a *new* duplicate conversation instead of updating the existing one.

**How to apply:** In any function that upserts a conversation (e.g. _post_system_message), fetch all conversations where participants[0] is in participants, then filter Python-side for matching participant set. Use the existing doc's _id as the filter; fall back to {"conv_id": conv_id} for new convs.
