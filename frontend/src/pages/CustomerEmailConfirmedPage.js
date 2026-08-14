import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import { StudioOSWordmark } from "../components/StudioOSLogo";
import { Button } from "../components/ui/button";

/** Same fragment-token pattern as the staff-side confirmation page. */
function readTokens() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const expiresIn = Number(hash.get("expires_in")) || undefined;
  if (accessToken && refreshToken) return { tokens: { accessToken, refreshToken, expiresIn }, error: "" };
  return { tokens: null, error: hash.get("error_description") || "Dieser Link ist ungültig oder abgelaufen." };
}

/**
 * Where a customer's confirmation e-mail lands. Registering never blocked
 * anything for a customer — this only lifts the one gate that does exist
 * (accepting/paying an offer, enforced in offers.ts) by turning the link into
 * a real session, then sends them to the studio picker exactly like any other
 * login would.
 */
export default function CustomerEmailConfirmedPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking"); // checking | error
  const [error, setError] = useState("");

  useEffect(() => {
    const { tokens, error: readError } = readTokens();
    if (tokens && window.location.hash) window.history.replaceState({}, "", window.location.pathname);
    if (!tokens) {
      setStatus("error");
      setError(readError);
      return;
    }
    studioApi
      .post("/auth/customer/verify-email", { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn })
      .then(({ data }) => {
        const studios = data.studios || [];
        navigate(studios.length === 1 ? `/t/${studios[0].slug}/konto` : "/konto", { replace: true });
      })
      .catch((err) => {
        setStatus("error");
        setError(err.response?.data?.error || "E-Mail konnte nicht bestätigt werden.");
      });
    // Runs once against whatever the link carried on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={22} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-card p-8"
      >
        <StudioOSWordmark className="mb-6" />
        <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <ShieldAlert size={18} className="text-zinc-600" strokeWidth={1.5} />
        </div>
        <h1 className="font-playfair text-lg text-zinc-900 mb-1">Link ungültig</h1>
        <p className="text-sm text-zinc-500 font-inter mb-6 leading-relaxed">{error}</p>
        <Button onClick={() => navigate("/konto")} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
          Zum Konto
        </Button>
      </motion.div>
    </div>
  );
}
