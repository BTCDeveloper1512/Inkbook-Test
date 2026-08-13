import React, { useEffect, useMemo } from "react";
import { MessageCircle } from "lucide-react";
import ChatThread from "../../components/ChatThread";
import { initials } from "../../lib/artistColors";
import { SLOT_LABEL } from "../../lib/daySlots";

// A heartbeat updates last_seen_at every 25s (see stream.ts) — 45s covers one
// missed beat without a browser clock needing to stay perfectly in sync.
const ONLINE_WINDOW_MS = 45_000;
function isOnline(lastSeenAt) {
  return !!lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

const TYPE_LABEL = { consultation: "Beratung", project: "Projekt", single_session: "Termin" };

function previewText(message) {
  if (!message) return "—";
  if (message.attachment_type === "image") return "📷 Bild";
  if (message.attachment_type === "audio") return "🎤 Sprachnachricht";
  return message.body;
}

function lastMessage(b) {
  const msgs = b.messages || [];
  return msgs.length ? [...msgs].sort((x, y) => new Date(y.created_at) - new Date(x.created_at))[0] : null;
}

function unreadCount(b) {
  return (b.messages || []).filter((m) => m.sender === "customer" && !m.read_at).length;
}

/**
 * What this conversation is actually about. Without it a chat is a name and a
 * wall of text — with three bookings from the same person, staff had no way to
 * tell which tattoo the customer meant.
 */
function bookingContext(b) {
  const parts = [TYPE_LABEL[b.appointment_type] || "Buchung"];
  if (b.title) parts.push(b.title);
  const session = (b.sessions || [])
    .filter((s) => !["storniert", "no_show"].includes(s.status))
    .sort((x, y) => new Date(x.start_time) - new Date(y.start_time))[0];
  if (session) {
    parts.push(new Date(session.start_time).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }));
  } else if (b.preferred_date) {
    const slot = b.preferred_slot ? `, ${SLOT_LABEL[b.preferred_slot]?.toLowerCase()}` : "";
    parts.push(`Wunsch: ${new Date(b.preferred_date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })}${slot}`);
  }
  return parts.join(" · ");
}

/** Short enough for a tab chip — the full version lives in the header. */
function shortContext(b) {
  const type = TYPE_LABEL[b.appointment_type] || "Buchung";
  if (b.title) return `${type} · ${b.title}`;
  const session = (b.sessions || []).filter((s) => !["storniert", "no_show"].includes(s.status))[0];
  if (session) return `${type} · ${new Date(session.start_time).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}`;
  return `${type} · ${b.created_at ? new Date(b.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) : "—"}`;
}

/**
 * The studio's single chat surface. Threads are grouped by *customer*, not by
 * booking: a regular with a sleeve in progress, a healed piece and a new
 * request used to occupy three separate rows with identical names and no way
 * to tell them apart. Now they are one row, and their bookings become tabs
 * inside the conversation — each one still its own message thread, because the
 * backend scopes messages to a booking and mixing them would be a lie about
 * what the customer replied to.
 */
export default function NachrichtenTab({ bookings, selectedThreadId, onSelectThread, onSendMessage, onMarkMessagesRead, sendingMessage }) {
  // Every booking is a potential thread, not just ones with messages already
  // — staff can always write first (see the workflow rule in messages.ts),
  // so a bare "anfrage" still needs to be reachable here to start that.
  const customers = useMemo(() => {
    const groups = new Map();
    bookings.forEach((b) => {
      // Bookings without a customer record can't be merged with anything, so
      // each stands alone rather than collapsing into one nameless pile.
      const key = b.customer_id || `booking:${b.id}`;
      const g = groups.get(key) || { key, name: b.customers?.name || "—", customer: b.customers, bookings: [] };
      g.bookings.push(b);
      groups.set(key, g);
    });
    return [...groups.values()]
      .map((g) => {
        const sorted = [...g.bookings].sort(
          (a, b) => new Date(lastMessage(b)?.created_at || b.created_at || 0) - new Date(lastMessage(a)?.created_at || a.created_at || 0)
        );
        return {
          ...g,
          bookings: sorted,
          last: lastMessage(sorted[0]),
          activity: new Date(lastMessage(sorted[0])?.created_at || sorted[0].created_at || 0),
          unread: g.bookings.reduce((n, b) => n + unreadCount(b), 0),
        };
      })
      .sort((a, b) => b.activity - a.activity);
  }, [bookings]);

  const activeCustomer = customers.find((c) => c.bookings.some((b) => b.id === selectedThreadId)) || customers[0];
  const selected = activeCustomer?.bookings.find((b) => b.id === selectedThreadId) || activeCustomer?.bookings[0];

  useEffect(() => {
    if (!selected) return;
    onSelectThread(selected.id);
    if (unreadCount(selected) > 0) onMarkMessagesRead(selected.id);
    // Only when the selected thread's id changes, not on every message array update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageCircle size={28} className="text-zinc-200 mb-3" strokeWidth={1.5} />
        <p className="font-playfair text-base text-zinc-700">Noch keine Buchungen</p>
        <p className="text-xs font-inter text-zinc-400 mt-1">Sobald jemand über deinen Link bucht, taucht der Thread hier auf.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[560px]">
      <div className="w-64 flex-shrink-0 bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-y-auto divide-y divide-zinc-100">
        {customers.map((c) => {
          const online = isOnline(c.customer?.last_seen_at);
          const isActive = activeCustomer?.key === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelectThread(c.bookings[0].id)}
              className={`w-full text-left p-3 flex items-start gap-2.5 transition-colors ${isActive ? "bg-zinc-50" : "hover:bg-zinc-50/60"}`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-[11px] font-inter text-zinc-500">
                  {initials(c.name)}
                </div>
                {online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-inter font-medium text-zinc-900 truncate">{c.name}</span>
                  {c.unread > 0 && (
                    <span className="text-[9px] font-inter bg-zinc-900 text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-inter text-zinc-400 truncate mt-0.5">{previewText(c.last)}</p>
                {c.bookings.length > 1 && (
                  <p className="text-[10px] font-inter text-zinc-300 mt-0.5">{c.bookings.length} Buchungen</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-4 flex flex-col min-w-0">
        {selected && (
          <>
            <div className="pb-3 mb-1 border-b border-zinc-100 flex-shrink-0">
              <p className="font-inter text-sm font-medium text-zinc-900 truncate">{activeCustomer.name}</p>
              {/* Which booking this thread belongs to — always stated, even
                  when the customer only has the one. */}
              <p className="text-[11px] font-inter text-zinc-500 truncate mt-0.5">{bookingContext(selected)}</p>

              {activeCustomer.bookings.length > 1 && (
                <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-0.5">
                  {activeCustomer.bookings.map((b) => {
                    const unread = unreadCount(b);
                    const active = b.id === selected.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onSelectThread(b.id)}
                        className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-inter whitespace-nowrap transition-colors flex-shrink-0 border ${
                          active ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                        }`}
                      >
                        {shortContext(b)}
                        {unread > 0 && (
                          <span
                            className={`text-[9px] font-inter rounded-full w-3.5 h-3.5 flex items-center justify-center ${
                              active ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"
                            }`}
                          >
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <ChatThread
              // Remounts on booking switch so the draft, scroll position and
              // any half-picked attachment don't leak into another thread.
              key={selected.id}
              messages={selected.messages}
              viewerRole="staff"
              sending={sendingMessage}
              uploadPath="/studios/me/upload/chat"
              presence={{ online: isOnline(activeCustomer.customer?.last_seen_at), lastSeenAt: activeCustomer.customer?.last_seen_at }}
              onSend={(payload) => onSendMessage(selected.id, payload)}
            />
          </>
        )}
      </div>
    </div>
  );
}
