import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Mail, Clock, Euro, Image as ImageIcon, CalendarDays, MessageCircle, ChevronRight, Banknote, RotateCcw } from "lucide-react";
import { SLOT_LABEL } from "../../lib/daySlots";

/**
 * Everything known about one booking in one place. The list row can only
 * afford a name and a line of meta, so the motif text, the reference images,
 * the offer history and the sessions all live here instead of being spread
 * across tabs.
 */

const TYPE_LABEL = { consultation: "Beratung", project: "Projekt", single_session: "Termin" };
// A "project" can take another offer once under way — that's how session 2,
// 3, ... on the same tattoo gets scheduled. Mirrors the same rule enforced
// server-side in offers.ts; single_session/consultation stay one-and-done.
function canOfferAgain(b) {
  return (
    ["anfrage", "angebot_gesendet", "abgelehnt"].includes(b.status) ||
    (b.appointment_type === "project" && ["in_planung", "laufend"].includes(b.status))
  );
}
const OFFER_STATUS_LABEL = {
  gesendet: "offen",
  angenommen: "angenommen",
  abgelehnt: "abgelehnt",
  verfallen: "ersetzt",
};
const OFFER_STATUS_CLS = {
  gesendet: "bg-zinc-900 text-white",
  angenommen: "bg-teal-100 text-teal-700",
  abgelehnt: "bg-red-100 text-red-700",
  verfallen: "bg-zinc-100 text-zinc-500",
};

function Row({ label, children }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 py-1.5 border-b border-zinc-50 last:border-0">
      <span className="text-[11px] font-inter text-zinc-400">{label}</span>
      <span className="text-xs font-inter text-zinc-800 min-w-0 break-words">{children}</span>
    </div>
  );
}

export default function BookingDetailDialog({ booking, statusLabel, statusDot, onClose, onCreateOffer, onOpenThread, onDepositCash, onConfirmRefund }) {
  const b = booking;
  const offers = [...(b.offers || [])].sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
  const sessions = [...(b.sessions || [])].sort((x, y) => new Date(x.start_time) - new Date(y.start_time));
  const eur = (n) => `${Number(n).toFixed(0)} €`;
  const unreadMessages = (b.messages || []).filter((m) => m.sender === "customer" && !m.read_at).length;
  const depositPayment = (b.payments || []).find((p) => p.type === "anzahlung");
  const [depositBusy, setDepositBusy] = useState(false);
  const [depositError, setDepositError] = useState("");

  async function handleDepositCash() {
    setDepositBusy(true);
    setDepositError("");
    try {
      await onDepositCash?.(b.id);
    } catch (err) {
      setDepositError(err.response?.data?.error || "Konnte nicht vermerkt werden.");
    } finally {
      setDepositBusy(false);
    }
  }

  async function handleConfirmRefund() {
    setDepositBusy(true);
    setDepositError("");
    try {
      await onConfirmRefund?.(depositPayment.id);
    } catch (err) {
      setDepositError(err.response?.data?.error || "Konnte nicht bestätigt werden.");
    } finally {
      setDepositBusy(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur px-6 pt-6 pb-3 border-b border-zinc-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-playfair text-xl text-zinc-900 truncate">{b.customers?.name || "—"}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                <span className="text-xs font-inter text-zinc-500">
                  {statusLabel} · {TYPE_LABEL[b.appointment_type]}
                </span>
                {b.in_progress && (
                  <span className="text-[10px] font-inter px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">In Bearbeitung</span>
                )}
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-5">
          <section>
            <Row label="E-Mail">
              {b.customers?.email && (
                <a href={`mailto:${b.customers.email}`} className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900">
                  <Mail size={11} /> {b.customers.email}
                </a>
              )}
            </Row>
            <Row label="Titel">{b.title}</Row>
            <Row label="Motiv">{b.motif_description}</Row>
            <Row label="Körperstelle">{b.body_part}</Row>
            <Row label="Stil">{b.style}</Row>
            <Row label="Wunsch">
              {b.preferred_date && (
                <>
                  {new Date(b.preferred_date).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
                  {b.preferred_slot && <>, {SLOT_LABEL[b.preferred_slot]?.toLowerCase()}</>}
                  {b.preferred_time && <span className="text-zinc-500"> — "{b.preferred_time}"</span>}
                </>
              )}
            </Row>
            <Row label="Angefragt">{b.created_at && new Date(b.created_at).toLocaleString("de-DE")}</Row>
            <Row label="Preis">
              {b.price_final != null ? (
                <span className="inline-flex items-center gap-1">
                  <Euro size={11} className="text-zinc-400" /> {eur(b.price_final)} (final)
                </span>
              ) : b.price_estimated ? (
                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <Euro size={11} className="text-zinc-400" /> {eur(b.price_estimated)} (angeboten)
                </span>
              ) : null}
            </Row>
          </section>

          {b.reference_images?.length > 0 && (
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <ImageIcon size={12} className="text-zinc-400" />
                <span className="text-[10px] font-inter uppercase tracking-widest text-zinc-400">Referenzen</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {b.reference_images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-xl overflow-hidden border border-zinc-100 hover:border-zinc-300 transition-colors">
                    <img src={url} alt="Referenz" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {sessions.length > 0 && (
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <CalendarDays size={12} className="text-zinc-400" />
                <span className="text-[10px] font-inter uppercase tracking-widest text-zinc-400">Termine</span>
              </div>
              <div className="space-y-1.5">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2">
                    <span className="text-xs font-inter text-zinc-800">
                      {new Date(s.start_time).toLocaleString("de-DE", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[11px] font-inter text-zinc-500 flex items-center gap-1 flex-shrink-0">
                      <Clock size={10} />
                      {s.actual_duration_minutes || s.estimated_duration_minutes || "?"} Min.
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {offers.length > 0 && (
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <Euro size={12} className="text-zinc-400" />
                <span className="text-[10px] font-inter uppercase tracking-widest text-zinc-400">Angebote</span>
              </div>
              <div className="space-y-1.5">
                {offers.map((o) => (
                  <div key={o.id} className="rounded-xl border border-zinc-100 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-inter font-medium text-zinc-900">
                        {b.appointment_type !== "consultation" && <>{eur(o.price_total)} · </>}
                        {o.duration_minutes} Min.
                      </span>
                      <span className={`text-[10px] font-inter px-1.5 py-0.5 rounded-full ${OFFER_STATUS_CLS[o.status]}`}>
                        {OFFER_STATUS_LABEL[o.status]}
                      </span>
                    </div>
                    <div className="text-[11px] font-inter text-zinc-500 mt-0.5">
                      {new Date(o.offer_date).toLocaleDateString("de-DE", { day: "2-digit", month: "long" })}
                      {o.offer_slot && <>, {SLOT_LABEL[o.offer_slot]?.toLowerCase()}</>}
                      {o.deposit_amount > 0 && <> · Anzahlung {eur(o.deposit_amount)}</>}
                      {o.additional_sessions?.length > 0 && <> · +{o.additional_sessions.length} weitere Session{o.additional_sessions.length === 1 ? "" : "s"}</>}
                    </div>
                    {o.notes && <p className="text-[11px] font-inter text-zinc-500 italic mt-1">"{o.notes}"</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(depositPayment || b.status === "anzahlung_ausstehend") && (
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <Banknote size={12} className="text-zinc-400" />
                <span className="text-[10px] font-inter uppercase tracking-widest text-zinc-400">Anzahlung</span>
              </div>
              <div className="rounded-xl border border-zinc-100 px-3 py-2.5">
                {depositPayment ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-inter font-medium text-zinc-900">{eur(depositPayment.amount)}</span>
                    <span
                      className={`text-[10px] font-inter px-1.5 py-0.5 rounded-full ${
                        depositPayment.status === "paid"
                          ? "bg-teal-100 text-teal-700"
                          : depositPayment.status === "refund_pending"
                            ? "bg-amber-100 text-amber-700"
                            : depositPayment.status === "refunded"
                              ? "bg-zinc-100 text-zinc-500"
                              : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {depositPayment.status === "paid"
                        ? depositPayment.stripe_payment_id
                          ? "Bezahlt · Stripe"
                          : "Bezahlt · Bar"
                        : depositPayment.status === "refund_pending"
                          ? "Rückerstattung fällig (bar)"
                          : depositPayment.status === "refunded"
                            ? "Erstattet"
                            : depositPayment.status}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-inter text-zinc-500">Noch nicht bezahlt</span>
                    <span className="text-[10px] font-inter px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">ausstehend</span>
                  </div>
                )}
                {depositError && <p className="text-[11px] font-inter text-red-600 mt-2">{depositError}</p>}
                {b.status === "anzahlung_ausstehend" && !depositPayment && (
                  <button
                    type="button"
                    onClick={handleDepositCash}
                    disabled={depositBusy}
                    className="mt-2 w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-inter transition-colors"
                  >
                    {depositBusy ? "…" : "Anzahlung bar erhalten"}
                  </button>
                )}
                {depositPayment?.status === "refund_pending" && (
                  <button
                    type="button"
                    onClick={handleConfirmRefund}
                    disabled={depositBusy}
                    className="mt-2 w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-inter transition-colors"
                  >
                    <RotateCcw size={11} />
                    {depositBusy ? "…" : "Rückerstattung bestätigt (bar ausgezahlt)"}
                  </button>
                )}
              </div>
            </section>
          )}

          <button
            type="button"
            onClick={() => onOpenThread?.(b.id)}
            className="w-full flex items-center gap-2.5 rounded-xl border border-zinc-100 px-3 py-2.5 hover:bg-zinc-50 transition-colors"
          >
            <MessageCircle size={14} className="text-zinc-400 flex-shrink-0" />
            <span className="text-xs font-inter text-zinc-700 flex-1 text-left">Zu den Nachrichten</span>
            {unreadMessages > 0 && (
              <span className="text-[10px] font-inter bg-zinc-900 text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                {unreadMessages}
              </span>
            )}
            <ChevronRight size={14} className="text-zinc-300 flex-shrink-0" />
          </button>
        </div>

        {canOfferAgain(b) && (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur px-6 py-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateOffer(b);
              }}
              className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-sm transition-colors"
            >
              {b.status === "angebot_gesendet"
                ? "Angebot ändern"
                : sessions.length > 0
                  ? "Weitere Session anbieten"
                  : "Angebot erstellen"}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
