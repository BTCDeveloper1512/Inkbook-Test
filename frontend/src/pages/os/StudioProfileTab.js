import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, Link2, Loader2, ImagePlus, Save } from "lucide-react";
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

/** Section shell — playfair heading over a subtitle, like the old dashboard. */
function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
      <h3 className="font-playfair text-lg text-zinc-900">{title}</h3>
      {subtitle && <p className="text-[11px] font-inter text-zinc-400 mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

function SaveButton({ saving, saved, onClick, label = "Speichern" }) {
  return (
    <Button type="button" onClick={onClick} disabled={saving} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter flex-shrink-0">
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

  const [name, setName] = useState(studio?.name || "");
  const [description, setDescription] = useState(studio?.description || "");
  const [city, setCity] = useState(studio?.city || "");
  const [address, setAddress] = useState(studio?.address || "");
  const [phone, setPhone] = useState(studio?.phone || "");
  const [website, setWebsite] = useState(studio?.website || "");
  const [isActive, setIsActive] = useState(studio?.is_active ?? true);

  const [openingHours, setOpeningHours] = useState(() => {
    const base = Object.fromEntries(DAYS.map(([k]) => [k, ""]));
    return { ...base, ...(studio?.opening_hours || {}) };
  });

  const [depositRequired, setDepositRequired] = useState(studio?.settings?.depositRequired || false);
  const [depositPercent, setDepositPercent] = useState(String(studio?.settings?.depositPercent || 20));
  const [cancellationHours, setCancellationHours] = useState(String(studio?.settings?.cancellationHours || 48));

  // Images write straight through — there is nothing to "draft" about picking
  // a file, and holding it back until save would only invite losing it.
  async function saveImage(field, url) {
    const { data } = await studioApi.patch("/studios/me", { [field]: url });
    onStudioUpdate(data);
  }

  /**
   * One save for everything that lives on the studio record. Three separate
   * buttons meant a studio could edit its hours, press save on the policy
   * card, and quietly lose the hours — the old dashboard's single header
   * button is the better pattern and this takes it.
   */
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveAll() {
    setSaving(true);
    try {
      const { data } = await studioApi.patch("/studios/me", {
        name,
        description,
        city,
        address,
        phone,
        website,
        isActive,
        openingHours,
        settings: {
          depositRequired,
          depositPercent: depositRequired ? Number(depositPercent) || 0 : 0,
          cancellationHours: Number(cancellationHours) || 0,
        },
      });
      onStudioUpdate(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  // The account sits on a different endpoint, so it keeps its own controls
  // rather than pretending to be part of the studio record.
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-playfair text-xl text-zinc-900">Profil</h2>
          <p className="text-xs text-zinc-400 font-inter mt-0.5">Studio-Informationen und öffentliche Darstellung</p>
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={saveAll}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-inter font-semibold transition-colors disabled:opacity-50 flex-shrink-0 ${
            saved ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Speichern…
            </>
          ) : saved ? (
            <>
              <Check size={14} strokeWidth={2} /> Gespeichert
            </>
          ) : (
            <>
              <Save size={14} strokeWidth={1.5} /> Profil speichern
            </>
          )}
        </motion.button>
      </div>

      {/* The link is the whole product for a studio, so it goes first */}
      {linkUrl && (
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                <Link2 size={14} className="text-zinc-600" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-inter font-semibold text-zinc-900 leading-tight">Deine öffentliche Studio-Seite</p>
                <p className="text-[11px] text-zinc-400 font-inter font-mono truncate">{linkUrl}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(linkUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-inter font-semibold transition-colors ${
                  copied ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={12} strokeWidth={2} /> Kopiert
                  </>
                ) : (
                  <>
                    <Copy size={12} strokeWidth={1.5} /> Kopieren
                  </>
                )}
              </button>
              <a
                href={linkUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-inter font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                <ExternalLink size={12} strokeWidth={1.5} /> Vorschau
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <Card title="Studio-Profil" subtitle="Was Kunden auf deiner Seite sehen">
          <div className="space-y-3">
            <Field label="Studioname">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-10" />
            </Field>
            <Field label="Kurzbeschreibung">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[70px]" />
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
          </div>
        </Card>

        <Card title="Öffnungszeiten" subtitle="Bestimmen das Kalenderraster und welche Zeiten buchbar sind">
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
          <p className="text-[11px] font-inter text-zinc-400 mt-3">Format 10:00-18:00. Leer heißt geschlossen.</p>
        </Card>

        <Card title="Bilder" subtitle="Banner und Logo erscheinen auf deiner Studio-Seite">
          <div className="space-y-4">
            <ImageUploadField label="Banner" value={studio?.banner_image} onChange={(url) => saveImage("bannerImage", url)} />
            <ImageUploadField label="Logo" value={studio?.logo_image} onChange={(url) => saveImage("logoImage", url)} />
            <p className="text-[11px] font-inter text-zinc-400">Bilder werden sofort gespeichert.</p>
          </div>
        </Card>

        <Card title="Richtlinien" subtitle="Gelten für alle Buchungen">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-inter text-zinc-900">Anzahlung verlangen</div>
                <div className="text-[11px] font-inter text-zinc-400">Noch ohne Zahlungsanbindung</div>
              </div>
              <button
                type="button"
                onClick={() => setDepositRequired((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${depositRequired ? "bg-zinc-900" : "bg-zinc-200"}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    depositRequired ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            {depositRequired && (
              <Field label="Anzahlung in %">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={depositPercent}
                  onChange={(e) => setDepositPercent(e.target.value)}
                  className="rounded-xl h-10"
                />
              </Field>
            )}
            <Field label="Kostenlose Stornierung bis (Std. vorher)">
              <Input type="number" min="0" value={cancellationHours} onChange={(e) => setCancellationHours(e.target.value)} className="rounded-xl h-10" />
            </Field>
            <p className="text-[11px] font-inter text-zinc-400">Diese Frist bekommt der Kunde beim Stornieren angezeigt.</p>
          </div>
        </Card>

        <Card title="Sichtbarkeit" subtitle="Nimmt deine Seite Anfragen entgegen?">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-inter text-zinc-900">{isActive ? "Seite ist aktiv" : "Seite ist offline"}</div>
              <div className="text-[11px] font-inter text-zinc-400">
                {isActive ? "Kunden können über deinen Link buchen" : "Der Link zeigt nichts an"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${isActive ? "bg-zinc-900" : "bg-zinc-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </Card>

        <Card title="Dein Konto" subtitle="Gilt nur für dich, nicht fürs Studio">
          <div className="space-y-3">
            <Field label="Dein Name">
              <div className="flex gap-2">
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="rounded-xl h-10" />
                <SaveButton saving={savingAccountName} saved={savedAccountName} onClick={saveAccountName} />
              </div>
            </Field>
            <Field label="Neues Passwort">
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="mindestens 8 Zeichen"
                  className="rounded-xl h-10"
                />
                <SaveButton saving={savingPassword} saved={passwordSaved} onClick={changePassword} label="Ändern" />
              </div>
            </Field>
            {passwordError && <p className="text-xs font-inter text-red-600">{passwordError}</p>}
            <p className="text-[11px] font-inter text-zinc-400">Angemeldet als {staff?.email}</p>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
