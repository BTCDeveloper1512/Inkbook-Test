import React, { useState } from "react";
import { Copy, Check, ExternalLink, Link2, Loader2, ImagePlus, Sparkles } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { studioOsAuth } from "../../lib/studioOsAuth";
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

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function SaveButton({ saving, saved, onClick, label = "Speichern" }) {
  return (
    <Button type="button" onClick={onClick} disabled={saving} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
      {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : label}
    </Button>
  );
}

function ImageUploadField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await studioApi.post("/upload/image", form);
      onChange(data.url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {value ? <img src={value} alt={label} className="w-full h-full object-cover" /> : <ImagePlus size={18} className="text-zinc-300" />}
        </div>
        <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-zinc-200 text-xs font-inter text-zinc-600 cursor-pointer hover:border-zinc-300 transition-colors">
          {uploading ? <Loader2 size={13} className="animate-spin" /> : "Bild wählen"}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

export default function StudioProfileTab({ studio, staff, onStudioUpdate, onStaffUpdate }) {
  const [copied, setCopied] = useState(false);
  const linkUrl = studio?.slug ? `${window.location.origin}/t/${studio.slug}` : "";

  // Studio-Profil
  const [name, setName] = useState(studio?.name || "");
  const [description, setDescription] = useState(studio?.description || "");
  const [city, setCity] = useState(studio?.city || "");
  const [address, setAddress] = useState(studio?.address || "");
  const [phone, setPhone] = useState(studio?.phone || "");
  const [website, setWebsite] = useState(studio?.website || "");
  const [isActive, setIsActive] = useState(studio?.is_active ?? true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const { data } = await studioApi.patch("/studios/me", { name, description, city, address, phone, website, isActive });
      onStudioUpdate(data);
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 1500);
    } finally {
      setSavingProfile(false);
    }
  }

  // Bilder
  async function saveImage(field, url) {
    const { data } = await studioApi.patch("/studios/me", { [field]: url });
    onStudioUpdate(data);
  }

  // Öffnungszeiten
  const [openingHours, setOpeningHours] = useState(() => {
    const base = Object.fromEntries(DAYS.map(([k]) => [k, ""]));
    return { ...base, ...(studio?.opening_hours || {}) };
  });
  const [savingHours, setSavingHours] = useState(false);
  const [savedHours, setSavedHours] = useState(false);

  async function saveHours() {
    setSavingHours(true);
    try {
      const { data } = await studioApi.patch("/studios/me", { openingHours });
      onStudioUpdate(data);
      setSavedHours(true);
      setTimeout(() => setSavedHours(false), 1500);
    } finally {
      setSavingHours(false);
    }
  }

  // Richtlinien
  const [depositRequired, setDepositRequired] = useState(studio?.settings?.depositRequired || false);
  const [depositPercent, setDepositPercent] = useState(String(studio?.settings?.depositPercent || 20));
  const [cancellationHours, setCancellationHours] = useState(String(studio?.settings?.cancellationHours || 48));
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savedPolicy, setSavedPolicy] = useState(false);

  async function savePolicy() {
    setSavingPolicy(true);
    try {
      const { data } = await studioApi.patch("/studios/me", {
        settings: {
          depositRequired,
          depositPercent: depositRequired ? Number(depositPercent) || 0 : 0,
          cancellationHours: Number(cancellationHours) || 0,
        },
      });
      onStudioUpdate(data);
      setSavedPolicy(true);
      setTimeout(() => setSavedPolicy(false), 1500);
    } finally {
      setSavingPolicy(false);
    }
  }

  // Account
  const [accountName, setAccountName] = useState(staff?.name || "");
  const [savingAccountName, setSavingAccountName] = useState(false);
  const [savedAccountName, setSavedAccountName] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  async function saveAccountName() {
    setSavingAccountName(true);
    try {
      const updated = await studioOsAuth.patchMe({ name: accountName });
      onStaffUpdate(updated);
      setSavedAccountName(true);
      setTimeout(() => setSavedAccountName(false), 1500);
    } finally {
      setSavingAccountName(false);
    }
  }

  async function changePassword() {
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("Mindestens 8 Zeichen.");
      return;
    }
    setSavingPassword(true);
    try {
      await studioOsAuth.changePassword(newPassword);
      setNewPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 1500);
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Fehlgeschlagen.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-4">
        {/* Studio-Profil */}
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
          <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-400 mb-4">Studio-Profil</div>
          <div className="space-y-3">
            <Field label="Studioname">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-10" />
            </Field>
            <Field label="Kurzbeschreibung">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[80px]" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Adresse">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl h-10" />
              </Field>
              <Field label="Stadt">
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl h-10" />
              </Field>
              <Field label="Telefon">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-10" />
              </Field>
              <Field label="Website">
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="rounded-xl h-10" />
              </Field>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-100">
              <div>
                <div className="font-inter font-medium text-sm text-zinc-900">Buchungsseite öffentlich</div>
                <div className="text-xs font-inter text-zinc-500 mt-0.5">Kund:innen können Anfragen senden</div>
              </div>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${isActive ? "bg-zinc-900" : "bg-zinc-200"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <SaveButton saving={savingProfile} saved={savedProfile} onClick={saveProfile} />
          </div>
        </div>

        {/* Bilder */}
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
          <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-400 mb-4">Bilder</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ImageUploadField label="Banner" value={studio?.banner_image} onChange={(url) => saveImage("bannerImage", url)} />
            <ImageUploadField label="Logo" value={studio?.logo_image} onChange={(url) => saveImage("logoImage", url)} />
          </div>
        </div>

        {/* Öffnungszeiten */}
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
          <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-400 mb-4">Öffnungszeiten</div>
          <div className="space-y-2">
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
          <div className="flex justify-end mt-4">
            <SaveButton saving={savingHours} saved={savedHours} onClick={saveHours} />
          </div>
        </div>

        {/* Richtlinien */}
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
          <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-400 mb-4">Richtlinien</div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 mb-3">
            <div className="font-inter font-medium text-sm text-zinc-900">Anzahlung erforderlich</div>
            <button
              type="button"
              onClick={() => setDepositRequired((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${depositRequired ? "bg-zinc-900" : "bg-zinc-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${depositRequired ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {depositRequired && (
              <Field label="Anzahlung in %">
                <Input type="number" min="0" max="100" value={depositPercent} onChange={(e) => setDepositPercent(e.target.value)} className="rounded-xl h-10" />
              </Field>
            )}
            <Field label="Kostenlose Stornierung bis (Std.)">
              <Input type="number" min="0" value={cancellationHours} onChange={(e) => setCancellationHours(e.target.value)} className="rounded-xl h-10" />
            </Field>
          </div>
          <div className="flex justify-end mt-4">
            <SaveButton saving={savingPolicy} saved={savedPolicy} onClick={savePolicy} />
          </div>
        </div>

        {/* Zahlungen (Stripe) */}
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
          <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-400 mb-3">Zahlungen</div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-dashed border-zinc-200">
            <Sparkles size={16} className="text-zinc-400 flex-shrink-0" />
            <div>
              <div className="font-inter font-medium text-sm text-zinc-700">Stripe noch nicht verbunden</div>
              <div className="text-xs font-inter text-zinc-500 mt-0.5">
                Online-Zahlungen und Anzahlungen folgen, sobald Stripe angebunden ist.
              </div>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
          <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-400 mb-4">Account</div>
          <div className="flex items-end gap-2 mb-4">
            <div className="flex-1">
              <Field label="Dein Name">
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="rounded-xl h-10" />
              </Field>
            </div>
            <SaveButton saving={savingAccountName} saved={savedAccountName} onClick={saveAccountName} />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Neues Passwort">
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl h-10" />
              </Field>
            </div>
            <SaveButton saving={savingPassword} saved={passwordSaved} onClick={changePassword} label="Ändern" />
          </div>
          {passwordError && <p className="text-xs text-red-600 font-inter mt-2">{passwordError}</p>}
        </div>
      </div>

      {/* Right column: booking link */}
      <div className="lg:sticky lg:top-8 self-start space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-5">
          <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-500 mb-2">Dein Buchungslink</div>
          <div className="flex items-center gap-1.5 text-white font-inter text-sm mb-4">
            <Link2 size={14} className="text-zinc-400" />
            <span className="truncate">{linkUrl.replace(/^https?:\/\//, "")}</span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1 rounded-lg bg-white text-zinc-900 hover:bg-zinc-100 font-inter"
              onClick={() => {
                navigator.clipboard.writeText(linkUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
              {copied ? "Kopiert" : "Kopieren"}
            </Button>
            <a
              href={linkUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/20 text-white text-sm font-inter hover:bg-white/10 transition-colors"
            >
              <ExternalLink size={14} /> Vorschau
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
