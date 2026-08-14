import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  LogOut,
  LayoutGrid,
  BookOpen,
  Users,
  Settings2,
  Calendar,
  Search,
  X,
  BadgeCheck,
  Bell,
  Trash2,
  CalendarDays,
  Wallet,
  TrendingUp,
  MessageCircle,
  CreditCard,
  Banknote,
  AlertTriangle,
  ChevronDown,
  Lock,
  UserPlus,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { studioApi } from "../../lib/studioApi";
import { planInfo } from "../../lib/plans";
import { useLiveUpdates } from "../../lib/useLiveUpdates";
import { SLOT_LABEL } from "../../lib/daySlots";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import OfferModal from "./OfferModal";
import BookingDetailDialog from "./BookingDetailDialog";
import NachrichtenTab from "./NachrichtenTab";
import StudioProfileTab from "./StudioProfileTab";
import StudioArtistsTab from "./StudioArtistsTab";
import StudioTeamTab from "./StudioTeamTab";
import StudioCalendarTab from "./StudioCalendarTab";
import StudioAnalytics, { PERIODS } from "./StudioAnalytics";

// Deliberately says *who* needs to move next, not just what state the row is
// in — "Angebot läuft" read as neutral/ongoing, not "you're waiting on the
// customer right now", which was exactly the thing that was hard to tell at
// a glance in the list.
const STATUS_LABEL = {
  anfrage: "Anfrage",
  angebot_gesendet: "Wartet auf Kunde",
  angenommen: "Angenommen",
  anzahlung_ausstehend: "Wartet auf Zahlung",
  abgelehnt: "Abgelehnt",
  in_planung: "Bestätigt",
  laufend: "Läuft",
  abgeschlossen: "Abgeschlossen",
  abgebrochen: "Abgebrochen",
};
// Amber means "waiting on the studio", black means "the studio's move is out
// with the customer", the blue pair is the execution track, green done, red
// cancelled. Black rather than a colour for the offer so it reads as part of
// the same monochrome language as the rest of the app.
// Amber/orange is reserved for "the ball is in the customer's court" —
// anfrage is the one exception, since a fresh request needs the *studio* to
// act first, but shares the color because it's equally something sitting in
// someone's queue rather than settled.
const STATUS_DOT = {
  anfrage: "bg-amber-500",
  angebot_gesendet: "bg-orange-500",
  angenommen: "bg-teal-500",
  anzahlung_ausstehend: "bg-orange-600",
  abgelehnt: "bg-zinc-400",
  in_planung: "bg-blue-500",
  laufend: "bg-blue-700",
  abgeschlossen: "bg-emerald-500",
  abgebrochen: "bg-red-500",
};
const TYPE_LABEL = { consultation: "Beratung", project: "Projekt", single_session: "Termin" };

// The list is grouped by *who has to move next* rather than by raw status,
// because that's the question staff actually open this tab with. A flat list
// sorted by date put a request that needs answering today next to a booking
// finished in July, with nothing distinguishing them but a small label.
// "Erledigt" starts collapsed — it only grows, and it's never the reason
// anyone opens this screen.
const BOOKING_GROUPS = [
  { key: "todo", title: "Du bist dran", hint: "Warten auf deine Antwort", statuses: ["anfrage"] },
  { key: "waiting", title: "Warten auf Kunde", hint: "Angebot oder Anzahlung offen", statuses: ["angebot_gesendet", "anzahlung_ausstehend"] },
  { key: "active", title: "Bestätigt & läuft", hint: "Termin steht fest", statuses: ["angenommen", "in_planung", "laufend"] },
  { key: "done", title: "Erledigt", hint: "Abgeschlossen, abgebrochen oder abgelehnt", statuses: ["abgeschlossen", "abgebrochen", "abgelehnt"], defaultCollapsed: true },
];

const GROUP_OF_STATUS = Object.fromEntries(BOOKING_GROUPS.flatMap((g) => g.statuses.map((s) => [s, g.key])));

// Within a group the useful order differs: things waiting on someone are most
// urgent when they've waited longest, upcoming work reads best next-first, and
// the archive is only ever scanned from the most recent end.
const GROUP_SORT = {
  todo: (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
  waiting: (a, b) => new Date(waitingSince(a) || 0) - new Date(waitingSince(b) || 0),
  active: (a, b) => (nextSessionTime(a) ?? Infinity) - (nextSessionTime(b) ?? Infinity),
  done: (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
};

function nextSessionTime(b) {
  const upcoming = (b.sessions || [])
    .filter((s) => !["storniert", "no_show"].includes(s.status))
    .map((s) => new Date(s.start_time).getTime())
    .sort((x, y) => x - y);
  return upcoming.find((t) => t >= Date.now()) ?? upcoming[0] ?? null;
}

// When the ball went over to the customer — the moment the pending offer was
// sent, so "seit 5 Tagen" answers "should I chase this?" without opening it.
function waitingSince(b) {
  const pending = (b.offers || []).find((o) => o.status === "gesendet");
  return pending?.created_at || b.updated_at || b.created_at || null;
}

function sinceLabel(iso) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "seit heute";
  if (days === 1) return "seit gestern";
  return `seit ${days} Tagen`;
}

const NAV_ITEMS = [
  { key: "uebersicht", label: "Übersicht", icon: LayoutGrid },
  { key: "buchungen", label: "Buchungen", icon: BookOpen, badgeFrom: "anfrage" },
  { key: "nachrichten", label: "Nachrichten", icon: MessageCircle, badgeFrom: "unreadMessages" },
  { key: "kalender", label: "Kalender", icon: CalendarDays },
  { key: "warteliste", label: "Warteliste", icon: Bell, badgeFrom: "waitlist" },
  { key: "artists", label: "Artists", icon: Users },
  { key: "team", label: "Team", icon: UserPlus },
  { key: "profil", label: "Profil & Link", icon: Settings2 },
];

/**
 * On Pro, `statKey` turns the card into a toggle for the detail panel
 * underneath. Below Pro the card stays readable but reveals a lock on hover
 * and focus — the plan limit is stated where someone actually reaches for the
 * feature, instead of as a permanent caption over the whole grid that every
 * user had to read past forever.
 */
function StatCard({ icon: Icon, value, label, statKey, active, onSelect, locked, onLockedClick }) {
  const clickable = !!onSelect || locked;
  return (
    <button
      type="button"
      onClick={locked ? onLockedClick : onSelect ? () => onSelect(statKey) : undefined}
      disabled={!clickable}
      className={`group relative overflow-hidden text-left rounded-2xl border p-5 transition-colors ${
        active
          ? "bg-zinc-900 border-zinc-900 shadow-[0_4px_16px_rgb(0,0,0,0.12)]"
          : "bg-white border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]"
      } ${clickable ? "hover:border-zinc-300 cursor-pointer" : "cursor-default"} ${active && !locked ? "hover:border-zinc-900" : ""}`}
    >
      <Icon size={18} className={active ? "text-zinc-500 mb-3" : "text-zinc-400 mb-3"} strokeWidth={1.5} />
      <div className={`font-playfair text-2xl ${active ? "text-white" : "text-zinc-900"}`}>{value}</div>
      <div className={`text-xs font-inter mt-0.5 ${active ? "text-zinc-400" : "text-zinc-500"}`}>{label}</div>
      {locked && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/95 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          <Lock size={15} className="text-zinc-500" strokeWidth={1.5} />
          <span className="text-[11px] font-inter font-medium text-zinc-700">Erweiterte Ansicht</span>
          <span className="text-[10px] font-inter text-zinc-400">Auf Pro upgraden</span>
        </span>
      )}
    </button>
  );
}

/**
 * One collapsible block with a small header line. Used for both the stat-tile
 * groups and the booking groups so collapsing behaves identically everywhere —
 * the two used to be separate pieces of markup that happened to look alike.
 */
function CollapsibleGroup({ title, count, hint, collapsed, onToggle, disabled, children }) {
  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-1 pb-2 text-left disabled:cursor-default"
      >
        <ChevronDown size={13} strokeWidth={2} className={`text-zinc-400 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
        <span className="text-[10px] font-inter uppercase tracking-widest text-zinc-500">{title}</span>
        {count !== undefined && (
          <span className="text-[10px] font-inter text-zinc-400 bg-zinc-100 rounded-full px-1.5 leading-4">{count}</span>
        )}
        {hint && <span className="text-[10px] font-inter text-zinc-300 truncate hidden sm:inline">{hint}</span>}
      </button>
      {!collapsed && children}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="font-playfair text-lg text-zinc-900">{title}</h2>
        {subtitle && <p className="text-xs font-inter text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ heading, subtext }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Calendar size={28} className="text-zinc-200 mb-3" strokeWidth={1.5} />
      <p className="font-playfair text-base text-zinc-700">{heading}</p>
      {subtext && <p className="text-xs font-inter text-zinc-400 mt-1">{subtext}</p>}
    </div>
  );
}

/**
 * Every booking row is the same three slots — identity, status, one action —
 * with the last two at a fixed width so status labels and buttons line up
 * down the whole list instead of floating wherever the text happens to end.
 * Everything that used to make rows different heights (a second line for the
 * running offer, a strip of reference thumbnails, a dropdown on some rows and
 * a plain badge on others) is folded into the single meta line or moved to
 * the detail dialog.
 */
function BookingRow({ booking: b, onOpen, action, unread }) {
  const meta = [];
  if (b.title) meta.push(b.title);
  const session = (b.sessions || []).find((s) => !["storniert", "no_show"].includes(s.status));
  if (session) {
    meta.push(new Date(session.start_time).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }));
  } else if (b.preferred_date) {
    const slot = b.preferred_slot ? `, ${SLOT_LABEL[b.preferred_slot]?.toLowerCase()}` : "";
    meta.push(`Wunsch: ${new Date(b.preferred_date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })}${slot}`);
  }
  const pendingOffer = (b.offers || []).find((o) => o.status === "gesendet");
  if (pendingOffer) {
    const price = b.appointment_type !== "consultation" ? `${Number(pendingOffer.price_total).toFixed(0)} € · ` : "";
    meta.push(`Angebot: ${price}${pendingOffer.duration_minutes} Min.`);
  }

  const since = ["angebot_gesendet", "anzahlung_ausstehend"].includes(b.status) ? sinceLabel(waitingSince(b)) : null;
  const thumb = b.reference_images?.[0];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(b)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(b);
        }
      }}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50/80 transition-colors"
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[b.status]}`} />

      {thumb ? (
        <img src={thumb} alt="" className="w-8 h-8 rounded-lg object-cover border border-zinc-100 flex-shrink-0 hidden sm:block" />
      ) : (
        <span className="w-8 flex-shrink-0 hidden sm:block" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-inter font-medium text-sm text-zinc-900 truncate">{b.customers?.name || "—"}</span>
          <span className="text-[10px] font-inter uppercase tracking-wide text-zinc-400 flex-shrink-0">{TYPE_LABEL[b.appointment_type]}</span>
          {b.in_progress && b.status === "anfrage" && (
            <span className="text-[10px] font-inter px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">In Bearbeitung</span>
          )}
          {unread > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-inter text-white bg-zinc-900 rounded-full px-1.5 py-0.5 flex-shrink-0">
              <MessageCircle size={9} />
              {unread}
            </span>
          )}
        </div>
        <div className="text-xs font-inter text-zinc-500 mt-0.5 truncate">
          {/* On narrow screens the status column is hidden, so it rides along here. */}
          <span className="sm:hidden">{STATUS_LABEL[b.status]}{meta.length > 0 && " · "}</span>
          {meta.join(" · ")}
        </div>
      </div>

      <div className="w-[124px] flex-shrink-0 text-right hidden sm:block">
        <div className="text-xs font-inter text-zinc-600 truncate">{STATUS_LABEL[b.status]}</div>
        {since && <div className="text-[10px] font-inter text-zinc-400 mt-0.5 truncate">{since}</div>}
      </div>

      {/* Fixed slot, kept even when empty — an action appearing on some rows
          and not others used to shift every neighbouring row's alignment.
          Only reserved from sm up; on a phone the row is one column anyway
          and 152px of blank space would crowd out the name. */}
      <div className="sm:w-[152px] flex-shrink-0 flex justify-end" onClick={(e) => e.stopPropagation()}>
        {action && (
          <button
            type="button"
            onClick={action.run}
            className={`h-8 px-3 rounded-lg text-xs font-inter whitespace-nowrap transition-colors ${
              action.primary
                ? "bg-zinc-900 hover:bg-zinc-800 text-white"
                : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 bg-white"
            }`}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudioOsDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("kalender");
  const [staff, setStaff] = useState(null);
  const [studio, setStudio] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [waitlist, setWaitlist] = useState([]);
  const [offerModal, setOfferModal] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [period, setPeriod] = useState("90d");
  // Deep-links the Profil tab straight into its billing section, so a locked
  // tile lands on the upgrade button rather than on a tab the user then has
  // to search through.
  const [profileSection, setProfileSection] = useState(null);
  // confirming | success | timeout | cancel
  const [billingBanner, setBillingBanner] = useState(null);

  // Stripe sends the owner back here the moment the card clears, but the plan
  // only changes once the checkout.session.completed webhook lands — usually a
  // second or two later. Nothing used to read this parameter, so they arrived
  // on a dashboard still saying "Kostenlos" and reasonably concluded the
  // payment had failed.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    if (!billing) return;
    window.history.replaceState({}, "", window.location.pathname);
    setBillingBanner(billing === "success" ? "confirming" : "cancel");
  }, []);

  // ready | interrupted
  const [connectBanner, setConnectBanner] = useState(null);

  // Return from the Stripe Connect onboarding flow. Unlike the billing
  // checkout above this doesn't need a poll-and-wait loop: the sync call
  // reads the account straight from Stripe, so the answer is already known
  // by the time this call returns — no webhook race to wait out.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeConnect = params.get("stripeConnect");
    if (!stripeConnect) return;
    window.history.replaceState({}, "", window.location.pathname);
    if (stripeConnect === "refresh") {
      setConnectBanner("interrupted");
      return;
    }
    studioApi
      .post("/studios/me/stripe-connect/sync")
      .then(() => studioApi.get("/studios/me"))
      .then(({ data }) => {
        setStudio(data);
        setConnectBanner(data.stripe_connect_charges_enabled ? "ready" : "interrupted");
      })
      .catch(() => setConnectBanner("interrupted"));
  }, []);

  useEffect(() => {
    if (billingBanner !== "confirming" || loading || !studio) return;
    const before = studio.subscription_plan;
    let stopped = false;
    let tries = 0;
    let timer;
    const poll = async () => {
      if (stopped) return;
      tries += 1;
      try {
        const { data } = await studioApi.get("/studios/me");
        if (data.subscription_plan !== before) {
          setStudio(data);
          setBillingBanner("success");
          return;
        }
      } catch {
        // A failed poll is not a failed payment — keep trying until the budget
        // runs out, then say so honestly instead of claiming either outcome.
      }
      // Stripe fires several preliminary events (charge, invoice, payment
      // method) before checkout.session.completed itself, so the webhook
      // that actually flips the plan can land well past what feels like a
      // generous budget — a real run observed ~10s just for that ordering,
      // before network/queueing delay on top. 60s of headroom keeps a slow
      // but successful sync from surfacing as a false "contact support".
      if (tries >= 30) return setBillingBanner("timeout");
      timer = setTimeout(poll, 2000);
    };
    timer = setTimeout(poll, 1500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
    // Deliberately not re-armed on every studio object change — `loading`
    // flips exactly once, which is when the pre-checkout plan is known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingBanner, loading]);

  function goToUpgrade() {
    setProfileSection("abrechnung");
    setTab("profil");
  }

  function goToPayouts() {
    setProfileSection("auszahlungen");
    setTab("profil");
  }

  // Switching tabs while scrolled down otherwise drops you into the middle of
  // the new one, and on a shorter tab the browser clamps the scroll position
  // mid-render.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [tab]);
  // "Erweiterte Statistiken" is a Pro-plan perk on the pricing page — the
  // stat tiles only become click-to-drill-down on that plan, defaulting to
  // revenue history same as before on every other one.
  const [selectedStat, setSelectedStat] = useState("revenue");

  function openThread(projectId) {
    setDetailBooking(null);
    setSelectedThreadId(projectId);
    setTab("nachrichten");
  }

  /**
   * Someone on the waitlist has no booking yet, and shouldn't get one until
   * they've actually been offered something — otherwise they'd appear in the
   * bookings list and the calendar's open-requests rail while still just
   * waiting. The dialog opens against the entry; the booking is created
   * server-side together with the offer.
   */
  function offerFromWaitlist(entry) {
    setOfferModal({
      id: null,
      _waitlistEntryId: entry.id,
      title: entry.motif_rough,
      preferred_time: entry.desired_period,
      customers: entry.customers,
      offers: [],
    });
  }

  function handleOfferSent(projectId, offer, waitlistEntryId, createdProject) {
    if (createdProject) {
      setBookings((prev) => [{ ...createdProject, offers: [offer], sessions: [] }, ...prev]);
    } else {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === projectId
            ? { ...b, status: "angebot_gesendet", price_estimated: offer.price_total, offers: [offer, ...(b.offers || [])] }
            : b
        )
      );
    }
    if (waitlistEntryId) setWaitlist((prev) => prev.filter((w) => w.id !== waitlistEntryId));
  }

  const load = useCallback(async () => {
    try {
      const [me, studioRes, bookingsRes, artistsRes, waitlistRes] = await Promise.all([
        studioOsAuth.me(),
        studioApi.get("/studios/me"),
        studioApi.get("/studios/me/bookings"),
        studioApi.get("/studios/me/artists"),
        studioApi.get("/studios/me/waitlist"),
      ]);
      setStaff(me);
      setStudio(studioRes.data);
      setBookings(bookingsRes.data);
      setArtists(artistsRes.data);
      setWaitlist(waitlistRes.data);
    } catch {
      navigate("/os/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // A customer accepting an offer puts a booking straight into this calendar,
  // so the dashboard has to hear about writes it didn't make itself.
  const refreshBookings = useCallback(async () => {
    const { data } = await studioApi.get("/studios/me/bookings");
    setBookings(data);
  }, []);
  useLiveUpdates("/studios/me/stream", refreshBookings, !loading);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      anfrage: bookings.filter((b) => b.status === "anfrage").length,
      in_planung: bookings.filter((b) => b.status === "in_planung").length,
      abgeschlossen: bookings.filter((b) => b.status === "abgeschlossen").length,
      waitlist: waitlist.length,
      unreadMessages: bookings.reduce((n, b) => n + (b.messages || []).filter((m) => m.sender === "customer" && !m.read_at).length, 0),
    }),
    [bookings, waitlist]
  );

  // Same "a month" as the backend's enforcement (studioos-backend/src/lib/plans.ts):
  // non-cancelled sessions whose own start_time falls in the current month.
  const monthlyUsage = useMemo(
    () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const used = bookings.reduce(
        (n, b) =>
          n +
          (b.sessions || []).filter((s) => {
            if (["storniert", "no_show"].includes(s.status)) return false;
            const t = new Date(s.start_time);
            return t >= monthStart && t < monthEnd;
          }).length,
        0
      );
      const limit = planInfo(studio?.subscription_plan).sessionsPerMonth;
      return { used, limit };
    },
    [bookings, studio]
  );

  const revenueStats = useMemo(() => {
    const completed = bookings.filter((b) => b.status === "abgeschlossen" && b.price_final);
    const revenue = completed.reduce((sum, b) => sum + Number(b.price_final || 0), 0);
    const customerIds = new Set(bookings.map((b) => b.customer_id).filter(Boolean));

    // A breakdown of what's already inside `revenue` (once its booking is
    // abgeschlossen, since deposits paid earlier feed into price_final the
    // same way any other partial payment does) — not an addition on top of
    // it. Deposits on bookings not yet abgeschlossen are real money the
    // studio holds, so they're shown here too, just kept out of "Umsatz
    // gesamt" until that booking actually finishes, exactly as before.
    const paidDeposits = bookings.flatMap((b) => (b.payments || []).filter((p) => p.type === "anzahlung" && p.status === "paid"));
    const depositsStripe = paidDeposits.filter((p) => p.stripe_payment_id).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const depositsCash = paidDeposits.filter((p) => !p.stripe_payment_id).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const refundsPending = bookings.flatMap((b) => (b.payments || []).filter((p) => p.type === "anzahlung" && p.status === "refund_pending"));

    return {
      revenue,
      completedCount: completed.length,
      avgPerBooking: completed.length ? revenue / completed.length : 0,
      customerCount: customerIds.size,
      depositsStripe,
      depositsCash,
      refundsPendingCount: refundsPending.length,
    };
  }, [bookings]);

  const eur = (n) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const isPro = studio?.subscription_plan === "pro";

  /**
   * One row shape (`primary`/`secondary`/`value`, optional `action`) for
   * every drill-down, built once here rather than inline in JSX so the panel
   * renderer below can stay a single generic list instead of eleven
   * hand-built ones.
   */
  const statDetails = useMemo(() => {
    const bookingRow = (b) => ({
      id: b.id,
      bookingId: b.id,
      primary: b.customers?.name || "—",
      secondary: `${b.created_at ? new Date(b.created_at).toLocaleDateString("de-DE") : "—"} · ${TYPE_LABEL[b.appointment_type] || "—"}`,
      value: b.price_final ? eur(Number(b.price_final)) : b.price_estimated ? `${eur(Number(b.price_estimated))} (geschätzt)` : "—",
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthSessions = bookings
      .flatMap((b) =>
        (b.sessions || [])
          .filter((s) => !["storniert", "no_show"].includes(s.status))
          .filter((s) => {
            const t = new Date(s.start_time);
            return t >= monthStart && t < monthEnd;
          })
          .map((s) => ({ booking: b, session: s }))
      )
      .sort((a, b) => new Date(a.session.start_time) - new Date(b.session.start_time))
      .map(({ booking, session }) => ({
        id: session.id,
        bookingId: booking.id,
        primary: booking.customers?.name || "—",
        secondary: new Date(session.start_time).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
        value: TYPE_LABEL[booking.appointment_type] || "—",
      }));

    const customerMap = new Map();
    bookings.forEach((b) => {
      if (!b.customer_id) return;
      const entry = customerMap.get(b.customer_id) || { id: b.customer_id, name: b.customers?.name || "—", count: 0, total: 0 };
      entry.count += 1;
      entry.total += Number(b.price_final || 0);
      customerMap.set(b.customer_id, entry);
    });
    const customers = [...customerMap.values()]
      .sort((a, b) => b.total - a.total)
      .map((c) => ({ id: c.id, primary: c.name, secondary: `${c.count} Buchung${c.count === 1 ? "" : "en"}`, value: eur(c.total) }));

    const paymentRow = (b, p, method) => ({
      id: p.id,
      bookingId: b.id,
      primary: b.customers?.name || "—",
      secondary: `${new Date(p.created_at).toLocaleDateString("de-DE")} · ${method}`,
      value: eur(Number(p.amount || 0)),
    });
    const depositsStripeList = bookings.flatMap((b) =>
      (b.payments || [])
        .filter((p) => p.type === "anzahlung" && p.status === "paid" && p.stripe_payment_id)
        .map((p) => paymentRow(b, p, `Stripe · ${p.stripe_payment_id.slice(0, 18)}`))
    );
    const depositsCashList = bookings.flatMap((b) =>
      (b.payments || []).filter((p) => p.type === "anzahlung" && p.status === "paid" && !p.stripe_payment_id).map((p) => paymentRow(b, p, "Bar"))
    );
    const refundsPendingList = bookings.flatMap((b) =>
      (b.payments || [])
        .filter((p) => p.status === "refund_pending")
        .map((p) => ({
          id: p.id,
          bookingId: b.id,
          primary: b.customers?.name || "—",
          secondary: `${new Date(p.created_at).toLocaleDateString("de-DE")} · Anzahlung bar`,
          value: eur(Number(p.amount || 0)),
          action: (
            <button
              type="button"
              onClick={() => handleConfirmRefund(p.id)}
              className="h-8 px-2.5 rounded-lg border border-zinc-200 text-[11px] font-inter text-zinc-600 hover:border-zinc-300 flex-shrink-0"
            >
              Erstattet
            </button>
          ),
        }))
    );

    const completedByDate = [...bookings.filter((b) => b.status === "abgeschlossen" && b.price_final)].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    const completedByPrice = [...completedByDate].sort((a, b) => Number(b.price_final || 0) - Number(a.price_final || 0));

    return {
      total: { title: "Alle Buchungen", subtitle: "Jede Anfrage und jeder Termin", rows: bookings.map(bookingRow), empty: "Noch keine Buchungen" },
      anfrage: {
        title: "Offene Anfragen",
        subtitle: "Noch kein Angebot gesendet oder Antwort ausstehend",
        rows: bookings.filter((b) => b.status === "anfrage").map(bookingRow),
        empty: "Keine offenen Anfragen",
      },
      in_planung: {
        title: "In Planung",
        subtitle: "Angenommen, Termin steht noch bevor",
        rows: bookings.filter((b) => b.status === "in_planung").map(bookingRow),
        empty: "Nichts in Planung",
      },
      abgeschlossen: {
        title: "Abgeschlossene Buchungen",
        subtitle: "Fertig abgerechnet",
        rows: completedByDate.map(bookingRow),
        empty: "Noch nichts abgeschlossen",
      },
      revenue: { title: "Umsatz-Historie", subtitle: "Zuletzt abgeschlossene Buchungen", rows: completedByDate.slice(0, 8).map(bookingRow), empty: "Noch kein Umsatz erfasst" },
      customerCount: { title: "Kunden", subtitle: "Nach Gesamtumsatz sortiert", rows: customers, empty: "Noch keine Kunden" },
      avgPerBooking: { title: "Preise pro Buchung", subtitle: "Höchste zuerst", rows: completedByPrice.map(bookingRow), empty: "Noch kein Umsatz erfasst" },
      monthlyUsage: { title: "Termine diesen Monat", subtitle: "Chronologisch", rows: monthSessions, empty: "Diesen Monat noch keine Termine" },
      depositsStripe: { title: "Anzahlungen via Stripe", subtitle: "Automatisch erfasst", rows: depositsStripeList, empty: "Noch keine Stripe-Anzahlungen" },
      depositsCash: { title: "Anzahlungen bar", subtitle: "Manuell im Studio erfasst", rows: depositsCashList, empty: "Noch keine Bar-Anzahlungen" },
      refundsPending: { title: "Rückerstattung fällig", subtitle: "Bar ausgezahlt, dann hier bestätigen", rows: refundsPendingList, empty: "Nichts offen" },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  const activePanel = statDetails[selectedStat] || statDetails.revenue;

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => (b.customers?.name || "").toLowerCase().includes(q) || (b.title || "").toLowerCase().includes(q));
  }, [bookings, search]);

  const groupedBookings = useMemo(
    () =>
      BOOKING_GROUPS.map((g) => ({
        ...g,
        // Unknown/new statuses would otherwise vanish from the list entirely;
        // they land in "Erledigt" rather than nowhere.
        rows: filteredBookings.filter((b) => (GROUP_OF_STATUS[b.status] || "done") === g.key).sort(GROUP_SORT[g.key]),
      })),
    [filteredBookings]
  );

  /**
   * Exactly one action per row: the single next thing the studio would do
   * with this booking. Solid black only in "Du bist dran" — everywhere else
   * the action is an option, not something overdue, and the group heading
   * already carries the urgency.
   */
  function rowAction(b) {
    if (b.status === "anfrage") return { label: "Angebot erstellen", primary: true, run: () => setOfferModal(b) };
    if (b.status === "angebot_gesendet") return { label: "Angebot ändern", run: () => setOfferModal(b) };
    if (b.status === "anzahlung_ausstehend" && !(b.payments || []).some((p) => p.type === "anzahlung" && p.status === "paid")) {
      return { label: "Anzahlung erhalten", run: () => handleDepositCash(b.id) };
    }
    if (b.status === "abgelehnt") return { label: "Neues Angebot", run: () => setOfferModal(b) };
    if (b.appointment_type === "project" && ["in_planung", "laufend"].includes(b.status)) {
      return { label: "Weitere Session", run: () => setOfferModal(b) };
    }
    return null;
  }

  async function updateStatus(projectId, status) {
    setBookings((prev) => prev.map((b) => (b.id === projectId ? { ...b, status } : b)));
    await studioApi.patch(`/studios/me/bookings/${projectId}`, { status });
  }

  async function toggleInProgress(projectId, inProgress) {
    setBookings((prev) => prev.map((b) => (b.id === projectId ? { ...b, in_progress: inProgress } : b)));
    await studioApi.patch(`/studios/me/bookings/${projectId}`, { inProgress });
  }

  async function handleDepositCash(projectId) {
    await studioApi.post(`/studios/me/bookings/${projectId}/deposit-cash`);
    await refreshBookings();
  }

  async function handleFinalPaymentCash(projectId) {
    await studioApi.post(`/studios/me/bookings/${projectId}/final-payment-cash`);
    await refreshBookings();
  }

  async function handleConfirmRefund(paymentId) {
    await studioApi.patch(`/studios/me/payments/${paymentId}/confirm-refund`);
    await refreshBookings();
  }

  async function sendMessage(projectId, payload) {
    setSendingMessage(true);
    try {
      const { data: message } = await studioApi.post(`/studios/me/bookings/${projectId}/messages`, payload);
      setBookings((prev) => prev.map((b) => (b.id === projectId ? { ...b, messages: [...(b.messages || []), message] } : b)));
    } finally {
      setSendingMessage(false);
    }
  }

  async function markMessagesRead(projectId) {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === projectId
          ? { ...b, messages: (b.messages || []).map((m) => (m.sender === "customer" ? { ...m, read_at: m.read_at || new Date().toISOString() } : m)) }
          : b
      )
    );
    await studioApi.patch(`/studios/me/bookings/${projectId}/messages/read`);
  }

  const planningStats = useMemo(() => {
    const now = new Date();
    const todayKey = now.toDateString();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const flat = bookings.flatMap((b) => (b.sessions || []).map((s) => s));
    return {
      today: flat.filter((s) => new Date(s.start_time).toDateString() === todayKey).length,
      week: flat.filter((s) => {
        const d = new Date(s.start_time);
        return d >= now && d <= weekAhead;
      }).length,
    };
  }, [bookings]);

  async function removeWaitlistEntry(entryId) {
    setWaitlist((prev) => prev.filter((w) => w.id !== entryId));
    await studioApi.delete(`/studios/me/waitlist/${entryId}`);
  }

  async function logout() {
    await studioOsAuth.logout();
    navigate("/os/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-52 flex-shrink-0">
          <div className="md:sticky md:top-8 space-y-4">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-500 mb-1">Studio Dashboard</div>
              <div className="font-playfair text-white text-base leading-tight mb-2">{studio?.name}</div>
              {studio?.is_verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-inter text-emerald-400 mb-2">
                  <BadgeCheck size={11} /> Verifiziert
                </span>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-white/10 rounded-xl px-3 py-2">
                  <div className="font-playfair text-white text-lg leading-none">{stats.total}</div>
                  <div className="text-[9px] font-inter uppercase tracking-wide text-zinc-400 mt-1">Buchungen</div>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2">
                  <div className="font-playfair text-white text-lg leading-none">{stats.anfrage}</div>
                  <div className="text-[9px] font-inter uppercase tracking-wide text-zinc-400 mt-1">Ausstehend</div>
                </div>
              </div>
            </div>

            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1">
              {NAV_ITEMS.map(({ key, label, icon: Icon, badgeFrom }) => {
                const badge = badgeFrom ? stats[badgeFrom] : 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-inter whitespace-nowrap transition-colors flex-shrink-0 ${
                      tab === key ? "bg-white shadow-soft text-zinc-900 font-medium" : "text-zinc-500 hover:bg-white/60"
                    }`}
                  >
                    <Icon size={15} strokeWidth={1.5} />
                    {label}
                    {badge > 0 && (
                      <span className="ml-auto text-[10px] font-inter bg-zinc-900 text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-inter text-zinc-400 hover:bg-white/60 transition-colors w-full"
            >
              <LogOut size={15} strokeWidth={1.5} /> Abmelden
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {billingBanner && (
            <div
              className={`mb-4 rounded-2xl px-4 py-3 text-xs font-inter flex items-start justify-between gap-3 ${
                billingBanner === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : billingBanner === "confirming"
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              <span className="flex items-center gap-2">
                {billingBanner === "confirming" && <Loader2 size={13} className="animate-spin flex-shrink-0" />}
                {billingBanner === "confirming" && "Zahlung erhalten — dein Tarif wird gerade freigeschaltet…"}
                {billingBanner === "success" && `Freigeschaltet: du bist jetzt auf ${planInfo(studio?.subscription_plan).label}.`}
                {billingBanner === "timeout" &&
                  "Die Zahlung ist durch, die Freischaltung steht aber noch aus. Das kann kurz dauern — lade die Seite gleich neu. Bleibt es so, melde dich beim Support."}
                {billingBanner === "cancel" && "Die Zahlung wurde nicht abgeschlossen. Dein Tarif ist unverändert."}
              </span>
              {billingBanner !== "confirming" && (
                <button type="button" onClick={() => setBillingBanner(null)} className="opacity-60 hover:opacity-100 flex-shrink-0">
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {connectBanner && (
            <div
              className={`mb-4 rounded-2xl px-4 py-3 text-xs font-inter flex items-start justify-between gap-3 ${
                connectBanner === "ready" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              <span className="flex items-center gap-2">
                {connectBanner === "ready" && "Auszahlungen eingerichtet — Kunden können jetzt online bezahlen."}
                {connectBanner === "interrupted" && (
                  <>
                    Die Einrichtung ist noch nicht abgeschlossen.{" "}
                    <button type="button" onClick={goToPayouts} className="underline underline-offset-2">
                      Fortsetzen
                    </button>
                  </>
                )}
              </span>
              <button type="button" onClick={() => setConnectBanner(null)} className="opacity-60 hover:opacity-100 flex-shrink-0">
                <X size={13} />
              </button>
            </div>
          )}
          {tab === "uebersicht" && (
            <section>
              <SectionHeader title="Übersicht" subtitle={`Angemeldet als ${staff?.name} · ${staff?.role}`} />
              {/* Grouped and collapsible rather than eleven tiles in one wall:
                  a studio that never takes deposits can fold that block away
                  and keep the screen about the numbers it actually reads. */}
              <div className="space-y-4 mb-6">
                {[
                  {
                    key: "tiles:buchungen",
                    title: "Buchungen",
                    hint: "Bestand nach Status",
                    tiles: [
                      { icon: BookOpen, value: stats.total, label: "Buchungen", key: "total" },
                      { icon: Calendar, value: stats.anfrage, label: "Anfragen", key: "anfrage" },
                      { icon: LayoutGrid, value: stats.in_planung, label: "In Planung", key: "in_planung" },
                      { icon: BadgeCheck, value: stats.abgeschlossen, label: "Abgeschlossen", key: "abgeschlossen" },
                    ],
                  },
                  {
                    key: "tiles:umsatz",
                    title: "Umsatz & Kunden",
                    hint: "Über die gesamte Zeit",
                    tiles: [
                      { icon: Wallet, value: eur(revenueStats.revenue), label: "Umsatz gesamt", key: "revenue" },
                      { icon: Users, value: revenueStats.customerCount, label: "Kunden gesamt", key: "customerCount" },
                      { icon: TrendingUp, value: eur(revenueStats.avgPerBooking), label: "Ø pro Buchung", key: "avgPerBooking" },
                      {
                        icon: CalendarDays,
                        value: monthlyUsage.limit === Infinity ? `${monthlyUsage.used}` : `${monthlyUsage.used}/${monthlyUsage.limit}`,
                        label: "Termine diesen Monat",
                        key: "monthlyUsage",
                      },
                    ],
                  },
                  {
                    key: "tiles:anzahlungen",
                    title: "Anzahlungen",
                    hint: "Bereits geflossenes Geld",
                    tiles: [
                      { icon: CreditCard, value: eur(revenueStats.depositsStripe), label: "Anzahlungen via Stripe", key: "depositsStripe" },
                      { icon: Banknote, value: eur(revenueStats.depositsCash), label: "Anzahlungen bar", key: "depositsCash" },
                      ...(revenueStats.refundsPendingCount > 0
                        ? [{ icon: AlertTriangle, value: revenueStats.refundsPendingCount, label: "Rückerstattung fällig (bar)", key: "refundsPending" }]
                        : []),
                    ],
                  },
                ].map((group) => {
                  const collapsed = collapsedGroups[group.key] ?? false;
                  return (
                    <CollapsibleGroup
                      key={group.key}
                      title={group.title}
                      count={group.tiles.length}
                      hint={group.hint}
                      collapsed={collapsed}
                      onToggle={() => setCollapsedGroups((prev) => ({ ...prev, [group.key]: !collapsed }))}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {group.tiles.map((t) => (
                          <StatCard
                            key={t.key}
                            icon={t.icon}
                            value={t.value}
                            label={t.label}
                            statKey={t.key}
                            active={isPro && selectedStat === t.key}
                            onSelect={isPro ? setSelectedStat : undefined}
                            locked={!isPro}
                            onLockedClick={goToUpgrade}
                          />
                        ))}
                      </div>
                    </CollapsibleGroup>
                  );
                })}
              </div>

              <SectionHeader title={activePanel.title} subtitle={activePanel.subtitle} />
              {activePanel.rows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
                  <EmptyState heading={activePanel.empty} />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] divide-y divide-zinc-100">
                  {activePanel.rows.map((r) => {
                    const openBooking = r.bookingId ? () => setDetailBooking(bookings.find((b) => b.id === r.bookingId)) : undefined;
                    return (
                      <div
                        key={r.id}
                        onClick={openBooking}
                        role={openBooking ? "button" : undefined}
                        tabIndex={openBooking ? 0 : undefined}
                        onKeyDown={
                          openBooking
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openBooking();
                                }
                              }
                            : undefined
                        }
                        className={`flex items-center justify-between gap-4 p-4 ${openBooking ? "cursor-pointer hover:bg-zinc-50/80 transition-colors" : ""}`}
                      >
                        <div className="min-w-0">
                          <div className="font-inter text-sm text-zinc-900 truncate">{r.primary}</div>
                          <div className="text-xs font-inter text-zinc-500 mt-0.5">{r.secondary}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => r.action && e.stopPropagation()}>
                          {r.value && <span className="font-playfair text-sm text-zinc-900">{r.value}</span>}
                          {r.action}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8">
                <SectionHeader
                  title="Analyse"
                  subtitle={isPro ? "Entwicklung über die Zeit statt Momentaufnahme" : "Umsatzverlauf, Abschlussquoten und Reaktionszeiten"}
                  action={
                    isPro ? (
                      // One range for the whole block below — per-chart ranges
                      // would let two cards describe different slices and both
                      // look correct.
                      <div className="flex gap-1 bg-zinc-100 rounded-xl p-0.5 flex-shrink-0">
                        {PERIODS.map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setPeriod(p.key)}
                            className={`px-2.5 h-7 rounded-lg text-[11px] font-inter whitespace-nowrap transition-colors ${
                              period === p.key ? "bg-white text-zinc-900 shadow-soft font-medium" : "text-zinc-500 hover:text-zinc-700"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    ) : undefined
                  }
                />
                {isPro ? (
                  <StudioAnalytics bookings={bookings} period={period} />
                ) : (
                  <button
                    type="button"
                    onClick={goToUpgrade}
                    className="w-full bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] py-12 flex flex-col items-center gap-2 hover:border-zinc-300 transition-colors"
                  >
                    <Lock size={18} className="text-zinc-400" strokeWidth={1.5} />
                    <span className="font-playfair text-base text-zinc-800">Erweiterte Ansicht</span>
                    <span className="text-xs font-inter text-zinc-400 max-w-xs text-center">
                      Umsatzverlauf, Anfrage-zu-Abschluss-Quote und Reaktionszeiten gibt es ab Pro.
                    </span>
                    <span className="text-[11px] font-inter text-zinc-900 underline underline-offset-2 mt-1">Auf Pro upgraden</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {tab === "buchungen" && (
            <section>
              <SectionHeader title="Buchungen" subtitle="Alle Anfragen und Termine deines Studios" />
              <div className="relative mb-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nach Name oder Titel suchen..."
                  className="rounded-2xl h-10 pl-10 pr-9 bg-white"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={14} className="text-zinc-400" />
                  </button>
                )}
              </div>

              {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
                  <EmptyState
                    heading={bookings.length === 0 ? "Keine Buchungen" : "Keine Ergebnisse"}
                    subtext={bookings.length === 0 ? "Teile deinen Studio-Link, damit Kunden buchen können." : "Versuch eine andere Suche."}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedBookings.map((g) => {
                    if (g.rows.length === 0) return null;
                    // A collapsed group would hide search hits, so searching
                    // force-opens everything — and the toggle goes inert while
                    // it does, rather than silently changing a state the user
                    // can't see the effect of until they clear the search.
                    const searching = !!search.trim();
                    const collapsed = !searching && (collapsedGroups[g.key] ?? g.defaultCollapsed ?? false);
                    return (
                      <CollapsibleGroup
                        key={g.key}
                        title={g.title}
                        count={g.rows.length}
                        hint={g.hint}
                        collapsed={collapsed}
                        disabled={searching}
                        onToggle={() => setCollapsedGroups((prev) => ({ ...prev, [g.key]: !collapsed }))}
                      >
                        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] divide-y divide-zinc-100 overflow-hidden">
                          {g.rows.map((b) => (
                            <BookingRow
                              key={b.id}
                              booking={b}
                              onOpen={setDetailBooking}
                              action={rowAction(b)}
                              unread={(b.messages || []).filter((m) => m.sender === "customer" && !m.read_at).length}
                            />
                          ))}
                        </div>
                      </CollapsibleGroup>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {tab === "nachrichten" && (
            <NachrichtenTab
              bookings={bookings}
              selectedThreadId={selectedThreadId}
              onSelectThread={setSelectedThreadId}
              onSendMessage={sendMessage}
              onMarkMessagesRead={markMessagesRead}
              sendingMessage={sendingMessage}
            />
          )}

          {tab === "kalender" && (
            <section>
              <SectionHeader title="Kalender" subtitle="Termin anklicken für Aktionen, ziehen zum Umbuchen" />
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] px-4 py-3">
                  <div className="font-playfair text-xl text-zinc-900">{planningStats.today}</div>
                  <div className="text-[10px] font-inter uppercase tracking-wide text-zinc-400 mt-0.5">Heute</div>
                </div>
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] px-4 py-3">
                  <div className="font-playfair text-xl text-zinc-900">{planningStats.week}</div>
                  <div className="text-[10px] font-inter uppercase tracking-wide text-zinc-400 mt-0.5">Nächste 7 Tage</div>
                </div>
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] px-4 py-3">
                  <div className="font-playfair text-xl text-zinc-900">{stats.anfrage}</div>
                  <div className="text-[10px] font-inter uppercase tracking-wide text-zinc-400 mt-0.5">Offene Anfragen</div>
                </div>
              </div>
              <StudioCalendarTab
                bookings={bookings}
                artists={artists}
                studio={studio}
                onBookingsChange={setBookings}
                onCreateOffer={setOfferModal}
                onRefresh={refreshBookings}
              />
            </section>
          )}

          {tab === "warteliste" && (
            <section>
              <SectionHeader title="Warteliste" subtitle="Kunden, die auf einen freien Termin warten" />
              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
                {waitlist.length === 0 ? (
                  <EmptyState heading="Niemand wartet aktuell" subtext="Einträge erscheinen hier, sobald Kunden sich auf deiner Studioseite eintragen." />
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {waitlist.map((w) => (
                      <div key={w.id} className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <div className="font-inter font-medium text-sm text-zinc-900 truncate">{w.customers?.name || "—"}</div>
                          <div className="text-xs font-inter text-zinc-500 mt-0.5 truncate">
                            {w.desired_period}
                            {w.motif_rough && <> · {w.motif_rough}</>}
                            {w.artists?.name && <> · bei {w.artists.name}</>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => offerFromWaitlist(w)}
                            className="h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-xs"
                          >
                            Termin anbieten
                          </Button>
                          <button
                            type="button"
                            onClick={() => removeWaitlistEntry(w.id)}
                            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                            title="Entfernen"
                          >
                            <Trash2 size={14} className="text-zinc-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "artists" && (
            <section>
              <SectionHeader title="Artists" subtitle="Dein Team, sichtbar auf der Buchungsseite" />
              <StudioArtistsTab artists={artists} bookings={bookings} onArtistsChange={setArtists} />
            </section>
          )}

          {tab === "team" && (
            <section>
              <SectionHeader title="Team" subtitle="Wer Zugriff auf dieses Studio hat" />
              <StudioTeamTab staff={staff} />
            </section>
          )}

          {tab === "profil" && (
            <section>
              <SectionHeader title="Profil & Link" subtitle="So sehen Kunden dein Studio" />
              <StudioProfileTab
                studio={studio}
                staff={staff}
                onStudioUpdate={setStudio}
                onStaffUpdate={setStaff}
                initialSection={profileSection}
                onSectionConsumed={() => setProfileSection(null)}
              />
            </section>
          )}
        </main>
      </div>

      <AnimatePresence>
        {offerModal && <OfferModal booking={offerModal} studio={studio} onClose={() => setOfferModal(null)} onSent={handleOfferSent} />}
        {detailBooking &&
          (() => {
            const liveBooking = bookings.find((b) => b.id === detailBooking.id) || detailBooking;
            return (
              <BookingDetailDialog
                booking={liveBooking}
                statusLabel={STATUS_LABEL[liveBooking.status]}
                statusDot={STATUS_DOT[liveBooking.status]}
                onClose={() => setDetailBooking(null)}
                onCreateOffer={setOfferModal}
                onOpenThread={openThread}
                onDepositCash={handleDepositCash}
                onConfirmRefund={handleConfirmRefund}
                onFinalPaymentCash={handleFinalPaymentCash}
                onUpdateStatus={updateStatus}
                onToggleInProgress={toggleInProgress}
                statusLabels={STATUS_LABEL}
                statusDots={STATUS_DOT}
              />
            );
          })()}
      </AnimatePresence>
    </div>
  );
}
