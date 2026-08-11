// Mirrors studioos-backend/src/lib/plans.ts — kept in sync by hand since the
// backend and frontend are separate repos with no shared package. The
// backend is the actual source of truth (it's what rejects requests); this
// copy only drives display (badges, the usage counter, upgrade buttons).
export const PLAN_LIMITS = {
  kostenlos: { label: "Kostenlos", price: "0 €", artists: 1, sessionsPerMonth: 5 },
  starter: { label: "Starter", price: "19,99 €", artists: 2, sessionsPerMonth: 20 },
  pro: { label: "Pro", price: "49,99 €", artists: 4, sessionsPerMonth: Infinity },
};

export function planInfo(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.kostenlos;
}
