// The four time-of-day buckets a customer picks from instead of a clock time.
// Shared by the booking widget, the offer modal and the studio's queue so the
// wording a customer chose is the exact wording the studio reads back.
//
// `from`/`to` are the hours the calendar uses to pre-position a dropped block;
// they are a starting point for the studio, not a promise to the customer.
export const DAY_SLOTS = [
  { value: "morgens", label: "Morgens", hint: "bis 12 Uhr", from: 9, to: 12 },
  { value: "mittags", label: "Mittags", hint: "12 – 15 Uhr", from: 12, to: 15 },
  { value: "nachmittags", label: "Nachmittags", hint: "15 – 18 Uhr", from: 15, to: 18 },
  { value: "abends", label: "Abends", hint: "ab 18 Uhr", from: 18, to: 21 },
];

export const SLOT_LABEL = Object.fromEntries(DAY_SLOTS.map((s) => [s.value, s.label]));
export const SLOT_HINT = Object.fromEntries(DAY_SLOTS.map((s) => [s.value, s.hint]));

export function slotStartHour(slot) {
  return DAY_SLOTS.find((s) => s.value === slot)?.from ?? 12;
}
