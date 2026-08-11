import React, { useEffect, useMemo } from "react";
import { MessageCircle } from "lucide-react";
import ChatThread from "../../components/ChatThread";
import { initials } from "../../lib/artistColors";

// A heartbeat updates last_seen_at every 25s (see stream.ts) — 45s covers one
// missed beat without a browser clock needing to stay perfectly in sync.
const ONLINE_WINDOW_MS = 45_000;
function isOnline(lastSeenAt) {
  return !!lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

function previewText(message) {
  if (!message) return "—";
  if (message.attachment_type === "image") return "📷 Bild";
  if (message.attachment_type === "audio") return "🎤 Sprachnachricht";
  return message.body;
}

/**
 * The studio's single chat surface: every booking with a message thread,
 * newest first, list on the left and the open thread on the right — replaces
 * the chat section that used to live inside BookingDetailDialog.
 */
export default function NachrichtenTab({ bookings, selectedThreadId, onSelectThread, onSendMessage, onMarkMessagesRead, sendingMessage }) {
  // Every booking is a potential thread, not just ones with messages already
  // — staff can always write first (see the workflow rule in messages.ts),
  // so a bare "anfrage" still needs to be reachable here to start that.
  const threads = useMemo(
    () =>
      bookings
        .map((b) => ({
          booking: b,
          last: (b.messages || []).length ? [...b.messages].sort((x, y) => new Date(y.created_at) - new Date(x.created_at))[0] : null,
        }))
        .sort((a, b) => new Date(b.last?.created_at || b.booking.created_at) - new Date(a.last?.created_at || a.booking.created_at)),
    [bookings]
  );

  const selected = threads.find((t) => t.booking.id === selectedThreadId) || threads[0];

  useEffect(() => {
    if (!selected) return;
    onSelectThread(selected.booking.id);
    const hasUnread = (selected.booking.messages || []).some((m) => m.sender === "customer" && !m.read_at);
    if (hasUnread) onMarkMessagesRead(selected.booking.id);
    // Only when the selected thread's id changes, not on every message array update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.booking.id]);

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
        {threads.map(({ booking: b, last }) => {
          const unread = (b.messages || []).filter((m) => m.sender === "customer" && !m.read_at).length;
          const online = isOnline(b.customers?.last_seen_at);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectThread(b.id)}
              className={`w-full text-left p-3 flex items-start gap-2.5 transition-colors ${
                selected?.booking.id === b.id ? "bg-zinc-50" : "hover:bg-zinc-50/60"
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-[11px] font-inter text-zinc-500">
                  {initials(b.customers?.name || "?")}
                </div>
                {online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-inter font-medium text-zinc-900 truncate">{b.customers?.name || "—"}</span>
                  {unread > 0 && (
                    <span className="text-[9px] font-inter bg-zinc-900 text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-inter text-zinc-400 truncate mt-0.5">{previewText(last)}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-4 flex flex-col min-w-0">
        {selected && (
          <>
            <div className="pb-3 mb-1 border-b border-zinc-100 flex-shrink-0">
              <p className="font-inter text-sm font-medium text-zinc-900">{selected.booking.customers?.name || "—"}</p>
            </div>
            <ChatThread
              messages={selected.booking.messages}
              viewerRole="staff"
              sending={sendingMessage}
              uploadPath="/studios/me/upload/chat"
              presence={{ online: isOnline(selected.booking.customers?.last_seen_at), lastSeenAt: selected.booking.customers?.last_seen_at }}
              onSend={(payload) => onSendMessage(selected.booking.id, payload)}
            />
          </>
        )}
      </div>
    </div>
  );
}
