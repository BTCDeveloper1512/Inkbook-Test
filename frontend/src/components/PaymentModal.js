import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Deliberately lazy, and a no-op without a configured key. App.js imports the
 * old product's CustomerDashboard and StudioPage eagerly, which pulls this
 * module into the initial bundle — so a module-scope loadStripe() ran on
 * *every* page load, StudioOS included, and threw an unhandled rejection
 * there. StudioOS has no publishable key on purpose: its deposit and
 * subscription payments both go through Stripe Checkout redirects, which are
 * created server-side and need no client-side key.
 */
let stripePromise;
function getStripe() {
  const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

function formatIban(raw) {
  return (raw || "").replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}

// ── Inner form — rendered inside <Elements> ──────────────────────────────────
function StripeForm({ session, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState("form"); // form | processing | success | error
  const [error, setError] = useState("");

  const amount = session?.amount ?? 0;
  const studioName = session?.studio_name ?? "Studio";
  const bookingDate = session?.booking_date ?? "";
  const bookingTime = session?.booking_time ?? "";
  const bankHolder = session?.bank_holder ?? "";
  const bankIban = session?.bank_iban ?? "";
  const bankBic = session?.bank_bic ?? "";
  const hasBankInfo = (bankIban || "").replace(/\s/g, "").length > 4;

  const formattedDate = bookingDate
    ? new Date(bookingDate + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setStep("processing");
    setError("");

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message);
      setStep("error");
      return;
    }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    });

    if (confirmErr) {
      setError(confirmErr.message);
      setStep("error");
      return;
    }

    // Mark paid in our DB
    try {
      await axios.post(`${API}/payments/confirm/${session.session_id}`, {}, { withCredentials: true });
    } catch {}

    setStep("success");
    setTimeout(() => { onSuccess(); onClose(); }, 2800);
  };

  return (
    <form onSubmit={handleSubmit}>
      <AnimatePresence mode="wait">

        {/* ── Processing ── */}
        {step === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 py-16 flex flex-col items-center gap-5">
            <div className="relative w-14 h-14">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-zinc-200 border-t-zinc-900"
              />
            </div>
            <div className="text-center">
              <p className="font-playfair font-semibold text-zinc-900 text-lg">Zahlung wird verarbeitet</p>
              <p className="text-xs text-zinc-400 font-inter mt-1">Bitte nicht schließen…</p>
            </div>
          </motion.div>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="px-6 py-10 flex flex-col items-center gap-4 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center"
            >
              <CheckCircle size={30} className="text-emerald-500" strokeWidth={1.5} />
            </motion.div>
            <div>
              <p className="font-playfair font-semibold text-zinc-900 text-xl">Zahlung erfolgreich!</p>
              <p className="text-sm text-zinc-500 font-inter mt-1.5">
                Deine Anzahlung von <strong className="text-zinc-800">€ {amount.toFixed(2)}</strong> wurde verarbeitet.<br />
                Deine Buchung wurde bestätigt.
              </p>
              <p className="text-xs text-zinc-400 font-inter mt-2">Eine Zahlungsbestätigung wurde an deine E-Mail gesendet.</p>
            </div>
          </motion.div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={26} className="text-red-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-playfair font-semibold text-zinc-900 text-lg">Zahlung fehlgeschlagen</p>
              <p className="text-sm text-zinc-500 font-inter mt-1">{error}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => setStep("form")}
                className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-inter rounded-xl hover:bg-zinc-800 transition-colors">
                Erneut versuchen
              </button>
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 border border-zinc-200 text-zinc-600 text-sm font-inter rounded-xl hover:bg-zinc-50 transition-colors">
                Abbrechen
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Form ── */}
        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 py-5 space-y-5">

            {/* Order summary */}
            <div className="bg-zinc-50 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-inter">Studio</span>
                <span className="text-xs font-inter font-medium text-zinc-800">{studioName}</span>
              </div>
              {formattedDate && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-inter">Termin</span>
                  <span className="text-xs font-inter font-medium text-zinc-800">
                    {formattedDate}{bookingTime ? ` · ${bookingTime}` : ""}
                  </span>
                </div>
              )}
              <div className="border-t border-zinc-200 pt-2 mt-2 flex items-center justify-between">
                <span className="text-sm font-inter font-semibold text-zinc-700">Anzahlung</span>
                <span className="text-base font-playfair font-bold text-zinc-900">€ {amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Test Mode Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-200 px-2 py-0.5 rounded-full">Testmodus</span>
                <span className="text-xs text-amber-700 font-inter font-medium">Echte Zahlungen sind deaktiviert</span>
              </div>
              <p className="text-[11px] text-amber-700 font-inter">
                Testkarte: <span className="font-mono font-bold">4242 4242 4242 4242</span>
                &nbsp;· Ablauf: <span className="font-mono font-bold">12/34</span>
                &nbsp;· CVC: <span className="font-mono font-bold">123</span>
              </p>
            </div>

            {/* Stripe Payment Element — handles Apple Pay, Google Pay, Card, etc. */}
            <PaymentElement
              options={{
                layout: "tabs",
                wallets: { applePay: "never", googlePay: "never" },
              }}
            />

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={!stripe || !elements}
              className="w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-inter font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Jetzt zahlen · € {amount.toFixed(2)}
            </motion.button>

            <p className="text-center text-[10px] text-zinc-400 font-inter pb-1">
              🔒 Gesichert durch Stripe · 256-bit SSL
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </form>
  );
}

// ── Outer modal — loads PaymentIntent client_secret then mounts Elements ─────
export default function PaymentModal({ session, onClose, onSuccess }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (session?.client_secret) {
      setClientSecret(session.client_secret);
    } else {
      setLoadError("Zahlungssession konnte nicht geladen werden.");
    }
  }, [session]);

  const appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#18181b",
      colorBackground: "#fafafa",
      colorText: "#18181b",
      colorDanger: "#ef4444",
      fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif",
      borderRadius: "12px",
      spacingUnit: "4px",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs font-playfair">I</span>
            </div>
            <span className="font-playfair font-semibold text-zinc-900 text-sm">StudioOS · Sicherer Checkout</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {loadError && (
          <div className="px-6 py-10 text-center text-sm text-red-500 font-inter">{loadError}</div>
        )}

        {!loadError && !clientSecret && (
          <div className="px-6 py-16 flex items-center justify-center">
            <div className="relative w-10 h-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-zinc-200 border-t-zinc-900"
              />
            </div>
          </div>
        )}

        {clientSecret && (
          <Elements
            stripe={getStripe()}
            options={{ clientSecret, appearance, locale: "de" }}
          >
            <StripeForm session={session} onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        )}
      </motion.div>
    </motion.div>
  );
}
