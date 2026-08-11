import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import { StudioOSWordmark } from "../components/StudioOSLogo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

/**
 * The customer's way in when they don't have their studio's link to hand.
 * A customer record belongs to one studio, but the login behind it is global,
 * so we authenticate once and then let them pick — and skip the picking
 * entirely when there's only one, which is the common case.
 */
export default function CustomerStudioPicker() {
  const navigate = useNavigate();
  const [studios, setStudios] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function go(list) {
    if (list.length === 1) {
      navigate(`/t/${list[0].slug}/konto`, { replace: true });
      return true;
    }
    setStudios(list);
    return false;
  }

  // An existing session shouldn't ask for a password again.
  useEffect(() => {
    studioApi
      .get("/auth/customer/studios")
      .then(({ data }) => {
        if (data?.length) go(data);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await studioApi.post("/auth/customer/login", { email, password });
      go(data.studios);
    } catch (err) {
      setError(err.response?.data?.error || "Anmeldung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={`w-full bg-white rounded-3xl shadow-card p-8 ${studios ? "max-w-md" : "max-w-sm"}`}
      >
        <StudioOSWordmark className="mb-6" />

        {studios ? (
          <>
            <h1 className="font-playfair text-lg text-zinc-900 mb-1">Deine Studios</h1>
            <p className="text-sm text-zinc-500 font-inter mb-5">Bei diesen Studios bist du Kunde — jedes mit eigenen Terminen.</p>
            <div className="grid grid-cols-2 gap-3">
              {studios.map((s, i) => (
                <motion.button
                  key={s.slug}
                  type="button"
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24, delay: i * 0.06 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/t/${s.slug}/konto`)}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-zinc-200 hover:border-zinc-900 hover:shadow-card bg-white text-center transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {s.logo ? (
                      <img src={s.logo} alt={s.studioName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-playfair text-xl text-zinc-500">{(s.studioName || "?")[0]}</span>
                    )}
                  </div>
                  <span className="font-inter text-sm font-medium text-zinc-900 leading-tight">{s.studioName}</span>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="font-playfair text-lg text-zinc-900 mb-1">Dein Konto</h1>
            <p className="text-sm text-zinc-500 font-inter mb-5">Melde dich an, um deine Termine zu sehen.</p>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">E-Mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-10" required />
              </div>
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Passwort</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl h-10" required />
              </div>
              {error && <p className="text-xs text-red-600 font-inter">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter mt-2">
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Anmelden"}
              </Button>
            </form>
            <p className="text-[11px] font-inter text-zinc-400 mt-4 text-center leading-snug">
              Noch kein Konto? Das entsteht bei deiner ersten Anfrage über den Link deines Studios.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
