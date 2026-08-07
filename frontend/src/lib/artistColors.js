// One consistent color per artist across dashboard cards, timeline blocks
// and (later) the drag-scheduler — assigned by position in the roster, not
// stored, so it never needs a migration and stays stable as long as the
// list order doesn't change.
const PALETTE = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function artistColor(index) {
  return PALETTE[index % PALETTE.length];
}

export function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
