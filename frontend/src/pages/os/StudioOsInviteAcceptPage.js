import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, UserPlus, ShieldAlert } from "lucide-react";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const ROLE_LABEL = { owner: "Inhaber", admin: "Admin", artist: "Artist", staff: "Mitarbeiter" };

function Shell({ icon: Icon = UserPlus, title, body, children }) {
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
          <Icon size={18} className="text-zinc-600" strokeWidth={1.5} />
        </div>
        <h1 className="font-playfair text-lg text-zinc-900 mb-1">{title}</h1>
        {body && <p className="text-sm text-zinc-500 font-inter mb-6 leading-relaxed">{body}</p>}
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Same fragment-token pattern as StudioOsEmailConfirmedPage: present only
 * when Supabase's own inviteUserByEmail mail sent the click here (a
 * brand-new identity). An invite mailed through our own layer instead
 * (team.ts's teamInviteExisting, for an address that already had an
 * account) links here with no fragment at all — that's how this page tells
 * the two accept paths apart.
 */
function readTokens() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const expiresIn = Number(hash.get("expires_in")) || undefined;
  if (accessToken && refreshToken) return { accessToken, refreshToken, expiresIn };
  return null;
}

export default function StudioOsInviteAcceptPage() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [tokens] = useState(readTokens);

  useEffect(() => {
    if (tokens && window.location.hash) window.history.replaceState({}, "", window.location.pathname);
    studioOsAuth
      .getInvite(inviteId)
      .then(setInvite)
      .catch((err) => setLoadError(err.response?.data?.error || "Einladung nicht gefunden."));
    // Runs once for the invite this link carries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteId]);

  if (loadError) {
    return (
      <Shell title="Einladung ungültig" body={loadError}>
        <Button onClick={() => navigate("/os/login")} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
          Zur Anmeldung
        </Button>
      </Shell>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={22} />
      </div>
    );
  }

  if (invite.status !== "pending") {
    return (
      <Shell icon={ShieldAlert} title="Einladung nicht mehr gültig" body="Diese Einladung wurde bereits angenommen oder widerrufen.">
        <Button onClick={() => navigate("/os/login")} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
          Zur Anmeldung
        </Button>
      </Shell>
    );
  }

  const body = `${invite.studioName} hat dich als ${ROLE_LABEL[invite.role] || invite.role} eingeladen (${invite.email}).`;

  return tokens ? (
    <NewIdentityForm inviteId={inviteId} tokens={tokens} body={body} navigate={navigate} />
  ) : (
    <ExistingIdentityForm inviteId={inviteId} email={invite.email} body={body} navigate={navigate} />
  );
}

function NewIdentityForm({ inviteId, tokens, body, navigate }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await studioOsAuth.acceptInvite(inviteId, { ...tokens, name, password });
      navigate("/os/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Einladung konnte nicht angenommen werden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell title="Einladung annehmen" body={`${body} Leg noch deinen Namen und ein Passwort fest.`}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-11" autoFocus required />
        </div>
        <div>
          <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Passwort</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} className="rounded-xl h-11" required />
        </div>
        {error && <p className="text-xs font-inter text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : "Einladung annehmen"}
        </Button>
      </form>
    </Shell>
  );
}

function ExistingIdentityForm({ inviteId, email, body, navigate }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await studioOsAuth.acceptInviteExisting(inviteId, password);
      navigate("/os/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Einladung konnte nicht angenommen werden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell title="Einladung annehmen" body={`${body} Du hast bereits ein StudioOS-Konto — melde dich mit deinem bestehenden Passwort an.`}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">E-Mail</Label>
          <Input value={email} disabled className="rounded-xl h-11 bg-zinc-50 text-zinc-400" />
        </div>
        <div>
          <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Passwort</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl h-11" autoFocus required />
        </div>
        {error && <p className="text-xs font-inter text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : "Einladung annehmen"}
        </Button>
      </form>
    </Shell>
  );
}
