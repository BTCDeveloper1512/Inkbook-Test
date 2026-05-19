import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Lock, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function formatCardNumber(val) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
}

export default function PaymentModal({ session, onClose, onSuccess }) {
  const [method, setMethod] = useState("card"); // "card" | "paypal"
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [step, setStep] = useState("form"); // "form" | "processing" | "success" | "error"
  const [error, setError] = useState("");

  const amount = session?.amount ?? 0;
  const studioName = session?.studio_name ?? "Studio";
  const bookingDate = session?.booking_date ?? "";
  const bookingTime = session?.booking_time ?? "";

  const formattedDate = bookingDate
    ? new Date(bookingDate + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  const cardValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvc.length >= 3 &&
    cardName.trim().length > 1;

  const handlePay = async () => {
    if (method === "card" && !cardValid) return;
    setStep("processing");
    setError("");

    // Simulate a short processing delay for realism
    await new Promise(r => setTimeout(r, 1800));

    try {
      await axios.post(`${API}/payments/confirm/${session.session_id}`, {}, { withCredentials: true });
      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2200);
    } catch (err) {
      setError(err.response?.data?.detail || "Zahlung fehlgeschlagen. Bitte versuche es erneut.");
      setStep("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && step === "form" && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs font-playfair">I</span>
            </div>
            <span className="font-playfair font-semibold text-zinc-900 text-sm">InkBook · Sicherer Checkout</span>
          </div>
          {step === "form" && (
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors">
              <X size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>

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
              className="px-6 py-14 flex flex-col items-center gap-4 text-center">
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
                <button onClick={() => setStep("form")}
                  className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-inter rounded-xl hover:bg-zinc-800 transition-colors">
                  Erneut versuchen
                </button>
                <button onClick={onClose}
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
                    <span className="text-xs font-inter font-medium text-zinc-800">{formattedDate}{bookingTime ? ` · ${bookingTime}` : ""}</span>
                  </div>
                )}
                <div className="border-t border-zinc-200 pt-2 mt-2 flex items-center justify-between">
                  <span className="text-sm font-inter font-semibold text-zinc-700">Anzahlung</span>
                  <span className="text-base font-playfair font-bold text-zinc-900">€ {amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Method selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMethod("card")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-inter font-medium transition-all ${
                    method === "card"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                  }`}
                >
                  <CreditCard size={14} strokeWidth={1.5} /> Karte
                </button>
                <button
                  onClick={() => setMethod("paypal")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-inter font-medium transition-all ${
                    method === "paypal"
                      ? "border-[#003087] bg-[#003087] text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                  }`}
                >
                  <PayPalIcon active={method === "paypal"} /> PayPal
                </button>
              </div>

              {/* Card form */}
              <AnimatePresence mode="wait">
                {method === "card" && (
                  <motion.div key="card-form"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden">
                    <div>
                      <label className="block text-[10px] font-semibold tracking-widest uppercase text-zinc-400 mb-1.5 font-inter">Karteninhaber</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={e => setCardName(e.target.value)}
                        placeholder="Max Mustermann"
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold tracking-widest uppercase text-zinc-400 mb-1.5 font-inter">Kartennummer</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                        inputMode="numeric"
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter tracking-wider focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold tracking-widest uppercase text-zinc-400 mb-1.5 font-inter">Gültig bis</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={e => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/JJ"
                          inputMode="numeric"
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold tracking-widest uppercase text-zinc-400 mb-1.5 font-inter">CVC</label>
                        <input
                          type="text"
                          value={cvc}
                          onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="123"
                          inputMode="numeric"
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {method === "paypal" && (
                  <motion.div key="paypal-info"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="bg-[#f5f7fa] rounded-xl px-4 py-4 text-center space-y-1.5">
                      <PayPalLogo />
                      <p className="text-xs text-zinc-500 font-inter">
                        Du wirst über dein PayPal-Konto abgerechnet.<br />
                        Klicke auf „Jetzt zahlen" um fortzufahren.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pay button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePay}
                disabled={method === "card" && !cardValid}
                className={`w-full py-3 rounded-xl text-sm font-inter font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  method === "paypal"
                    ? "bg-[#ffc439] text-[#003087] hover:bg-[#f0b429]"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                <Lock size={13} strokeWidth={2} />
                Jetzt zahlen · € {amount.toFixed(2)}
                <ChevronRight size={13} strokeWidth={2} />
              </motion.button>

              {/* Security note */}
              <p className="text-center text-[10px] text-zinc-400 font-inter pb-1">
                🔒 256-bit SSL-Verschlüsselung · Sicher &amp; geschützt
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function PayPalIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M7.5 21H4L6.5 6.5H12.5C15.5 6.5 17 8 16.5 10.5C16 13 13.5 14.5 10.5 14.5H8.5L7.5 21Z"
        fill={active ? "#009cde" : "#003087"} />
      <path d="M10 17.5H7L9.5 3H15.5C18.5 3 20 4.5 19.5 7C19 9.5 16.5 11 13.5 11H11.5L10 17.5Z"
        fill={active ? "#ffffff" : "#009cde"} opacity={active ? "0.8" : "1"} />
    </svg>
  );
}

function PayPalLogo() {
  return (
    <div className="flex items-center justify-center gap-1 mb-1">
      <span style={{ fontFamily: "Arial", fontWeight: 700, fontSize: 22, color: "#003087" }}>Pay</span>
      <span style={{ fontFamily: "Arial", fontWeight: 700, fontSize: 22, color: "#009cde" }}>Pal</span>
    </div>
  );
}
