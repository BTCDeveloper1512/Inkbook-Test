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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger } from "../../components/ui/select";
import StudioProfileTab from "./StudioProfileTab";
import StudioArtistsTab from "./StudioArtistsTab";
import StudioCalendarTab from "./StudioCalendarTab";

// anfrage/angebot_gesendet/angenommen/anzahlung_ausstehend/abgelehnt are
// outputs of the offer/deposit pipeline now (createOffer, /respond,
// confirmDepositPaid) — staff picking one by hand from a dropdown would
// leave a project "confirmed" with no session behind it, or an offer nobody
// actually sent. Those are shown as a read-only badge instead; only the
// three states with no automated path get an editable dropdown.
const MANUAL_STATUS_GROUPS = [
  { label: "Umsetzung", items: ["laufend"] },
  { label: "Beendet", items: ["abgeschlossen", "abgebrochen"] },
];
const SYSTEM_MANAGED_STATUSES = ["anfrage", "angebot_gesendet", "angenommen", "anzahlung_ausstehend", "abgelehnt"];
// A "project" can take another offer once under way — that's how session 2,
// 3, ... on the same tattoo gets scheduled. Mirrors the same rule enforced
// server-side in offers.ts; single_session/consultation stay one-and-done.
function canOfferAgain(b) {
  return (
    ["anfrage", "angebot_gesendet", "abgelehnt"].includes(b.status) ||
    (b.appointment_type === "project" && ["in_planung", "laufend"].includes(b.status))
  );
}
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

const NAV_ITEMS = [
  { key: "uebersicht", label: "Übersicht", icon: LayoutGrid },
  { key: "buchungen", label: "Buchungen", icon: BookOpen, badgeFrom: "anfrage" },
  { key: "nachrichten", label: "Nachrichten", icon: MessageCircle, badgeFrom: "unreadMessages" },
  { key: "kalender", label: "Kalender", icon: CalendarDays },
  { key: "warteliste", label: "Warteliste", icon: Bell, badgeFrom: "waitlist" },
  { key: "artists", label: "Artists", icon: Users },
  { key: "profil", label: "Profil & Link", icon: Settings2 },
];

/**
 * Plain and static on every plan below Pro. On Pro, `statKey` turns it into
 * a toggle for the detail panel underneath — same card, no visual weight
 * added for the tiers that can't use it, so it doesn't read as a feature
 * that's broken for them.
 */
function StatCard({ icon: Icon, value, label, statKey, active, onSelect }) {
  const clickable = !!onSelect;
  return (
    <button
      type="button"
      onClick={clickable ? () => onSelect(statKey) : undefined}
      disabled={!clickable}
      className={`text-left rounded-2xl border p-5 transition-colors ${
        active
          ? "bg-zinc-900 border-zinc-900 shadow-[0_4px_16px_rgb(0,0,0,0.12)]"
          : "bg-white border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]"
      } ${clickable ? "hover:border-zinc-300 cursor-pointer" : "cursor-default"} ${active && clickable ? "hover:border-zinc-900" : ""}`}
    >
      <Icon size={18} className={active ? "text-zinc-500 mb-3" : "text-zinc-400 mb-3"} strokeWidth={1.5} />
      <div className={`font-playfair text-2xl ${active ? "text-white" : "text-zinc-900"}`}>{value}</div>
      <div className={`text-xs font-inter mt-0.5 ${active ? "text-zinc-400" : "text-zinc-500"}`}>{label}</div>
    </button>
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
          {tab === "uebersicht" && (
            <section>
              <SectionHeader title="Übersicht" subtitle={`Angemeldet als ${staff?.name} · ${staff?.role}`} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <StatCard icon={BookOpen} value={stats.total} label="Buchungen" statKey="total" active={isPro && selectedStat === "total"} onSelect={isPro ? setSelectedStat : undefined} />
                <StatCard icon={Calendar} value={stats.anfrage} label="Anfragen" statKey="anfrage" active={isPro && selectedStat === "anfrage"} onSelect={isPro ? setSelectedStat : undefined} />
                <StatCard icon={LayoutGrid} value={stats.in_planung} label="In Planung" statKey="in_planung" active={isPro && selectedStat === "in_planung"} onSelect={isPro ? setSelectedStat : undefined} />
                <StatCard icon={BadgeCheck} value={stats.abgeschlossen} label="Abgeschlossen" statKey="abgeschlossen" active={isPro && selectedStat === "abgeschlossen"} onSelect={isPro ? setSelectedStat : undefined} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard icon={Wallet} value={eur(revenueStats.revenue)} label="Umsatz gesamt" statKey="revenue" active={isPro && selectedStat === "revenue"} onSelect={isPro ? setSelectedStat : undefined} />
                <StatCard icon={Users} value={revenueStats.customerCount} label="Kunden gesamt" statKey="customerCount" active={isPro && selectedStat === "customerCount"} onSelect={isPro ? setSelectedStat : undefined} />
                <StatCard icon={TrendingUp} value={eur(revenueStats.avgPerBooking)} label="Ø pro Buchung" statKey="avgPerBooking" active={isPro && selectedStat === "avgPerBooking"} onSelect={isPro ? setSelectedStat : undefined} />
                <StatCard
                  icon={CalendarDays}
                  value={monthlyUsage.limit === Infinity ? `${monthlyUsage.used}` : `${monthlyUsage.used}/${monthlyUsage.limit}`}
                  label="Termine diesen Monat"
                  statKey="monthlyUsage"
                  active={isPro && selectedStat === "monthlyUsage"}
                  onSelect={isPro ? setSelectedStat : undefined}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard
                  icon={CreditCard}
                  value={eur(revenueStats.depositsStripe)}
                  label="Anzahlungen via Stripe"
                  statKey="depositsStripe"
                  active={isPro && selectedStat === "depositsStripe"}
                  onSelect={isPro ? setSelectedStat : undefined}
                />
                <StatCard
                  icon={Banknote}
                  value={eur(revenueStats.depositsCash)}
                  label="Anzahlungen bar"
                  statKey="depositsCash"
                  active={isPro && selectedStat === "depositsCash"}
                  onSelect={isPro ? setSelectedStat : undefined}
                />
                {revenueStats.refundsPendingCount > 0 && (
                  <StatCard
                    icon={AlertTriangle}
                    value={revenueStats.refundsPendingCount}
                    label="Rückerstattung fällig (bar)"
                    statKey="refundsPending"
                    active={isPro && selectedStat === "refundsPending"}
                    onSelect={isPro ? setSelectedStat : undefined}
                  />
                )}
              </div>

              <SectionHeader
                title={activePanel.title}
                subtitle={activePanel.subtitle}
                action={
                  !isPro ? (
                    <span className="text-[10px] font-inter uppercase tracking-widest text-zinc-400 bg-zinc-100 rounded-full px-2.5 py-1">
                      Kacheln anklicken ab Pro
                    </span>
                  ) : undefined
                }
              />
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

              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
                {filteredBookings.length === 0 ? (
                  <EmptyState
                    heading={bookings.length === 0 ? "Keine Buchungen" : "Keine Ergebnisse"}
                    subtext={bookings.length === 0 ? "Teile deinen Studio-Link, damit Kunden buchen können." : "Versuch eine andere Suche."}
                  />
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {filteredBookings.map((b) => (
                      <div
                        key={b.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setDetailBooking(b)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setDetailBooking(b);
                          }
                        }}
                        className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-zinc-50/80 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-inter font-medium text-sm text-zinc-900 truncate flex items-center gap-1.5">
                            {b.customers?.name || "—"}
                            <span className="text-[10px] font-inter uppercase tracking-wide text-zinc-400">{TYPE_LABEL[b.appointment_type]}</span>
                            {(b.messages || []).some((m) => m.sender === "customer" && !m.read_at) && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-inter text-white bg-zinc-900 rounded-full px-1.5 py-0.5 flex-shrink-0">
                                <MessageCircle size={9} />
                                {(b.messages || []).filter((m) => m.sender === "customer" && !m.read_at).length}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-inter text-zinc-500 mt-0.5 truncate">
                            {b.title && <>{b.title} · </>}
                            {b.sessions?.[0]?.start_time
                              ? new Date(b.sessions[0].start_time).toLocaleString("de-DE")
                              : b.preferred_date && (
                                  <>
                                    Wunsch: {new Date(b.preferred_date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })}
                                    {b.preferred_slot && <>, {SLOT_LABEL[b.preferred_slot]?.toLowerCase()}</>}
                                    {b.preferred_time && <> ({b.preferred_time})</>}
                                  </>
                                )}
                          </div>
                          {b.offers?.some((o) => o.status === "gesendet") && (
                            <div className="text-[11px] font-inter text-zinc-500 mt-1">
                              Angebot läuft:{" "}
                              {b.appointment_type !== "consultation" && (
                                <>{Number(b.offers.find((o) => o.status === "gesendet").price_total).toFixed(0)} € · </>
                              )}
                              {b.offers.find((o) => o.status === "gesendet").duration_minutes} Min.
                            </div>
                          )}
                          {b.reference_images?.length > 0 && (
                            <div className="flex gap-1.5 mt-2">
                              {b.reference_images.map((url) => (
                                <a key={url} href={url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100">
                                  <img src={url} alt="Referenz" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Controls stop the row's own click from opening the
                            detail dialog underneath them. */}
                        <div
                          className="flex items-center gap-2 flex-wrap justify-end min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {b.status === "anfrage" && (
                            <button
                              type="button"
                              onClick={() => toggleInProgress(b.id, !b.in_progress)}
                              className={`h-9 px-3 rounded-lg text-xs font-inter border transition-colors ${
                                b.in_progress
                                  ? "border-amber-300 bg-amber-50 text-amber-700"
                                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                              }`}
                            >
                              {b.in_progress ? "In Bearbeitung" : "Als in Bearbeitung markieren"}
                            </button>
                          )}
                          {canOfferAgain(b) && (
                            <Button
                              size="sm"
                              onClick={() => setOfferModal(b)}
                              className={`h-9 rounded-lg font-inter text-xs ${
                                // A follow-up on an already-confirmed project is an
                                // option, not something waiting on the studio — kept
                                // visually quieter than the solid black "this needs
                                // you" buttons (first offer, revising a pending one),
                                // so the two don't compete for attention in the list.
                                b.status !== "angebot_gesendet" && b.sessions?.length > 0
                                  ? "border border-zinc-200 text-zinc-600 hover:border-zinc-400 bg-white"
                                  : "bg-zinc-900 hover:bg-zinc-800 text-white"
                              }`}
                            >
                              {b.status === "angebot_gesendet"
                                ? "Angebot ändern"
                                : b.sessions?.length > 0
                                  ? "Weitere Session anbieten"
                                  : "Angebot erstellen"}
                            </Button>
                          )}
                          {SYSTEM_MANAGED_STATUSES.includes(b.status) ? (
                            // Read-only: this state came from the offer/deposit
                            // pipeline, not from a manual choice, so there's
                            // nothing here for staff to override.
                            <span className="inline-flex items-center gap-2 h-9 px-3 text-xs font-inter text-zinc-500">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[b.status]}`} />
                              {STATUS_LABEL[b.status]}
                            </span>
                          ) : (
                            <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                              <SelectTrigger className="w-[150px] max-w-full rounded-lg h-9 text-xs font-inter">
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[b.status]}`} />
                                  <span className="truncate">{STATUS_LABEL[b.status]}</span>
                                </span>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {MANUAL_STATUS_GROUPS.map((group, gi) => (
                                  <React.Fragment key={group.label}>
                                    {gi > 0 && <SelectSeparator />}
                                    <SelectGroup>
                                      <SelectLabel className="text-[10px] font-inter uppercase tracking-widest text-zinc-400 px-2 py-1">
                                        {group.label}
                                      </SelectLabel>
                                      {group.items.map((s) => (
                                        <SelectItem key={s} value={s} className="text-xs font-inter rounded-lg">
                                          <span className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                                            {STATUS_LABEL[s]}
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </React.Fragment>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

          {tab === "profil" && (
            <section>
              <SectionHeader title="Profil & Link" subtitle="So sehen Kunden dein Studio" />
              <StudioProfileTab studio={studio} staff={staff} onStudioUpdate={setStudio} onStaffUpdate={setStaff} />
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
              />
            );
          })()}
      </AnimatePresence>
    </div>
  );
}
