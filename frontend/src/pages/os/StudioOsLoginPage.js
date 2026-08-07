import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

/**
 * Studio-staff login/registration for the new backend. Separate from the
 * old /login page (different auth system entirely) until the rest of the
 * app has migrated over.
 */
export default function StudioOsLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await studioOsAuth.login(email, password);
        navigate("/os/dashboard");
      } else {
        await studioOsAuth.register(email, password, name, studioName);
        navigate("/os/onboarding");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-card p-8">
        <StudioOSWordmark className="mb-6" />
        <div className="flex gap-1 mb-6 bg-zinc-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg text-xs font-inter font-medium transition-colors ${mode === "login" ? "bg-white shadow-soft text-zinc-900" : "text-zinc-500"}`}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 rounded-lg text-xs font-inter font-medium transition-colors ${mode === "register" ? "bg-white shadow-soft text-zinc-900" : "text-zinc-500"}`}
          >
            Studio anlegen
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <>
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Dein Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-10" required />
              </div>
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Studio-Name</Label>
                <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} className="rounded-xl h-10" required />
              </div>
            </>
          )}
          <div>
            <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">E-Mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-10" required />
          </div>
          <div>
            <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Passwort</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl h-10" required />
          </div>

          {error && <p className="text-xs text-red-600 font-inter">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter mt-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : mode === "login" ? "Anmelden" : "Studio anlegen"}
          </Button>
        </form>
      </div>
    </div>
  );
}
