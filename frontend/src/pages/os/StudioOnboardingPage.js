import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Check, Sparkles } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

const DAYS = [
  ["monday", "Montag"],
  ["tuesday", "Dienstag"],
  ["wednesday", "Mittwoch"],
  ["thursday", "Donnerstag"],
  ["friday", "Freitag"],
  ["saturday", "Samstag"],
  ["sunday", "Sonntag"],
];

const STEPS = ["Studio", "Öffnungszeiten", "Richtlinien", "Branding"];

/**
 * Shown right after a studio owner registers. Everything collected here is
 * exactly what a customer sees on the public booking page before they
 * commit to a booking — the point isn't a generic settings form, it's
 * "give customers what they need to decide, before they even ask."
 */
export default function StudioOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [styleInput, setStyleInput] = useState("");
  const [styles, setStyles] = useState([]);

  const [openingHours, setOpeningHours] = useState(() => Object.fromEntries(DAYS.map(([key]) => [key, ""])));

  const [depositRequired, setDepositRequired] = useState(false);
  const [depositPercent, setDepositPercent] = useState("20");
  const [cancellationHours, setCancellationHours] = useState("48");

  const [bannerImage, setBannerImage] = useState("");
  const [logoImage, setLogoImage] = useState("");

  function addStyle() {
    const v = styleInput.trim();
    if (v && !styles.includes(v)) setStyles((prev) => [...prev, v]);
    setStyleInput("");
  }
  function removeStyle(s) {
    setStyles((prev) => prev.filter((x) => x !== s));
  }

  async function finish() {
    setSaving(true);
    setError("");
    try {
      await studioApi.patch("/studios/me", {
        description: description || undefined,
        address: address || undefined,
        city: city || undefined,
        phone: phone || undefined,
        website: website || undefined,
        styles,
        openingHours,
        settings: {
          depositRequired,
          depositPercent: depositRequired ? Number(depositPercent) || 0 : 0,
          cancellationHours: Number(cancellationHours) || 0,
        },
        bannerImage: bannerImage || undefined,
        logoImage: logoImage || undefined,
      });
      navigate("/os/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    navigate("/os/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-card p-8">
        <StudioOSWordmark className="mb-1" />
        <div className="flex items-center gap-1.5 text-xs font-inter text-zinc-400 mb-6">
          <Sparkles size={12} /> Einrichtungsguide — für deine Kunden sichtbar
        </div>

        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-inter font-bold ${
                    i <= step ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {i < step ? <Check size={11} strokeWidth={2.5} /> : i + 1}
                </div>
                <span className={`text-[11px] font-inter whitespace-nowrap ${i <= step ? "text-zinc-700 font-medium" : "text-zinc-400"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-zinc-200" />}
            </React.Fragment>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Über dein Studio</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[90px]" placeholder="Was macht euer Studio besonders?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Adresse</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl h-10" />
              </div>
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Stadt</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl h-10" />
              </div>
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Telefon</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-10" />
              </div>
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Website (optional)</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="rounded-xl h-10" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Stile</Label>
              <div className="flex gap-2">
                <Input
                  value={styleInput}
                  onChange={(e) => setStyleInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStyle())}
                  placeholder="z.B. Fine Line — Enter zum Hinzufügen"
                  className="rounded-xl h-10"
                />
                <Button type="button" variant="outline" onClick={addStyle} className="rounded-xl flex-shrink-0">
                  +
                </Button>
              </div>
              {styles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {styles.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => removeStyle(s)}
                      className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-inter hover:bg-zinc-200"
                    >
                      {s} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2.5">
            <p className="text-xs font-inter text-zinc-500 mb-2">Frei eintragen, z.B. "10:00–18:00" oder leer lassen für geschlossen.</p>
            {DAYS.map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-24 text-xs font-inter text-zinc-600 flex-shrink-0">{label}</span>
                <Input
                  value={openingHours[key]}
                  onChange={(e) => setOpeningHours((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder="Geschlossen"
                  className="rounded-lg h-9 text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100">
              <div>
                <div className="font-inter font-medium text-sm text-zinc-900">Anzahlung erforderlich</div>
                <div className="text-xs font-inter text-zinc-500 mt-0.5">Kunden zahlen einen Teil vorab</div>
              </div>
              <button
                type="button"
                onClick={() => setDepositRequired((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${depositRequired ? "bg-zinc-900" : "bg-zinc-200"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${depositRequired ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            {depositRequired && (
              <div>
                <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Anzahlung in %</Label>
                <Input type="number" min="0" max="100" value={depositPercent} onChange={(e) => setDepositPercent(e.target.value)} className="rounded-xl h-10 w-32" />
              </div>
            )}
            <div>
              <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Kostenlose Stornierung bis (Stunden vorher)</Label>
              <Input type="number" min="0" value={cancellationHours} onChange={(e) => setCancellationHours(e.target.value)} className="rounded-xl h-10 w-32" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs font-inter text-zinc-500 mb-2">Bild-URLs — ein echter Upload folgt später.</p>
            <div>
              <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Banner-Bild (URL)</Label>
              <Input value={bannerImage} onChange={(e) => setBannerImage(e.target.value)} className="rounded-xl h-10" placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Logo (URL)</Label>
              <Input value={logoImage} onChange={(e) => setLogoImage(e.target.value)} className="rounded-xl h-10" placeholder="https://..." />
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-600 font-inter mt-4">{error}</p>}

        <div className="flex items-center justify-between mt-8">
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="rounded-xl font-inter">
                <ChevronLeft size={15} className="mr-1" /> Zurück
              </Button>
            )}
            <button type="button" onClick={skip} className="text-xs font-inter text-zinc-400 hover:text-zinc-600 px-2">
              Später ausfüllen
            </button>
          </div>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
              Weiter <ChevronRight size={15} className="ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={finish} disabled={saving} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
              {saving ? <Loader2 size={15} className="animate-spin" /> : "Fertig"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
