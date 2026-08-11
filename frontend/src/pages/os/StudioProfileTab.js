import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ExternalLink, Link2, Loader2, ImagePlus, Save, AlertTriangle, Trash2, CreditCard } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { PLAN_LIMITS, planInfo } from "../../lib/plans";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

const DAYS = [
  ["monday", "Mo"],
  ["tuesday", "Di"],
  ["wednesday", "Mi"],
  ["thursday", "Do"],
  ["friday", "Fr"],
  ["saturday", "Sa"],
  ["sunday", "So"],
];

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-[11px] font-inter text-zinc-500 mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function Card({ title, subtitle, children, tone }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "danger" ? "bg-red-50/40 border-red-200" : "bg-white border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]"
      }`}
    >
      <h3 className={`font-playfair text-base ${tone === "danger" ? "text-red-900" : "text-zinc-900"}`}>{title}</h3>
      {subtitle && <p className="text-[11px] font-inter text-zinc-400 mt-0.5">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

/**
 * The knob was positioned off its static position inside the button, which
 * left it a couple of pixels short of the track on both ends and made the
 * switch look broken mid-animation. Anchored explicitly now, and it announces
 * itself as a switch rather than an unlabelled button.
 */
function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-inter text-zinc-900">{label}</div>
        {hint && <div className="text-[11px] font-inter text-zinc-400">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 p-0 rounded-full flex-shrink-0 transition-colors duration-200 ${checked ? "bg-zinc-900" : "bg-zinc-200"}`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
          style={{ left: checked ? 22 : 2 }}
        />
      </button>
    </div>
  );
}

function SaveButton({ saving, saved, onClick, label = "Speichern" }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter flex-shrink-0"
    >
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
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl bg-zinc-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
        {value ? <img src={value} alt={label} className="w-full h-full object-cover" /> : <ImagePlus size={16} className="text-zinc-300" />}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-inter text-zinc-700 mb-1">{label}</div>
        <label className="inline-flex items-center gap-2 h-8 px-2.5 rounded-lg border border-zinc-200 text-[11px] font-inter text-zinc-600 cursor-pointer hover:border-zinc-300 transition-colors">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : "Bild wählen"}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

export default function StudioProfileTab({ studio, staff, onStudioUpdate, onStaffUpdate }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const linkUrl = studio?.slug ? `${window.location.origin}/t/${studio.slug}` : "";

  const [name, setName] = useState(studio?.name || "");
  const [description, setDescription] = useState(studio?.description || "");
  const [city, setCity] = useState(studio?.city || "");
  const [address, setAddress] = useState(studio?.address || "");
  const [phone, setPhone] = useState(studio?.phone || "");
  const [website, setWebsite] = useState(studio?.website || "");
  const [isActive, setIsActive] = useState(studio?.is_active ?? true);
  const [impressum, setImpressum] = useState(studio?.impressum || "");
  const [privacyPolicy, setPrivacyPolicy] = useState(studio?.privacy_policy || "");

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
   * One save for everything on the studio record. Three separate buttons meant
   * a studio could edit its hours, press save on the policy card, and quietly
   * lose the hours — the fields all write to the same endpoint anyway.
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
        impressum,
        privacyPolicy,
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

  // The account sits on a different endpoint, so it keeps its own controls.
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

  // Deletion asks for the studio's name typed back, because it takes every
  // booking, customer record and colleague's login with it.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const isOwner = staff?.role === "owner";
  const currentPlan = studio?.subscription_plan || "kostenlos";
  const [billingBusy, setBillingBusy] = useState(null);
  const [billingError, setBillingError] = useState("");

  async function startCheckout(plan) {
    setBillingBusy(plan);
    setBillingError("");
    try {
      const { data } = await studioApi.post("/studios/me/billing/checkout", { plan });
      window.location.href = data.url;
    } catch (err) {
      setBillingError(err.response?.data?.error || "Konnte den Checkout nicht öffnen.");
      setBillingBusy(null);
    }
  }

  async function openBillingPortal() {
    setBillingBusy("portal");
    setBillingError("");
    try {
      const { data } = await studioApi.post("/studios/me/billing/portal");
      window.location.href = data.url;
    } catch (err) {
      setBillingError(err.response?.data?.error || "Konnte die Abo-Verwaltung nicht öffnen.");
      setBillingBusy(null);
    }
  }

  async function deleteStudio() {
    setDeleting(true);
    setDeleteError("");
    try {
      await studioApi.delete("/studios/me", { data: { confirmName } });
      navigate("/os/login", { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Löschen fehlgeschlagen.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="space-y-4"
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

      {linkUrl && (
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-inter font-semibold transition-colors ${
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-inter font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                <ExternalLink size={12} strokeWidth={1.5} /> Vorschau
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        <Card title="Studio-Profil" subtitle="Was Kunden auf deiner Seite sehen">
          <div className="space-y-2.5">
            <Field label="Studioname">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-9" />
            </Field>
            <Field label="Kurzbeschreibung">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[60px]" />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Adresse">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl h-9" />
              </Field>
              <Field label="Stadt">
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl h-9" />
              </Field>
              <Field label="Telefon">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-9" />
              </Field>
              <Field label="Website">
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="rounded-xl h-9" />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Öffnungszeiten" subtitle="Bestimmen Kalenderraster und buchbare Zeiten">
          <div className="space-y-1.5">
            {DAYS.map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-7 text-[11px] font-inter text-zinc-500 flex-shrink-0">{label}</span>
                <Input
                  value={openingHours[key]}
                  onChange={(e) => setOpeningHours((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder="Geschlossen"
                  className="rounded-lg h-8 text-xs"
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] font-inter text-zinc-400 mt-2">Format 10:00-18:00, leer heißt geschlossen.</p>
        </Card>

        <Card title="Bilder" subtitle="Erscheinen auf deiner Studio-Seite">
          <div className="space-y-3">
            <ImageUploadField label="Banner" value={studio?.banner_image} onChange={(url) => saveImage("bannerImage", url)} />
            <ImageUploadField label="Logo" value={studio?.logo_image} onChange={(url) => saveImage("logoImage", url)} />
            <p className="text-[11px] font-inter text-zinc-400">Bilder speichern sofort.</p>
          </div>
        </Card>

        <Card title="Richtlinien" subtitle="Gelten für alle Buchungen">
          <div className="space-y-3">
            <Toggle
              checked={depositRequired}
              onChange={setDepositRequired}
              label="Anzahlung verlangen"
              hint="Termin steht erst fix, wenn der Kunde die Anzahlung bezahlt hat"
            />
            <AnimatePresence initial={false}>
              {depositRequired && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <Field label="Anzahlung in %">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={depositPercent}
                      onChange={(e) => setDepositPercent(e.target.value)}
                      className="rounded-xl h-9"
                    />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
            <Field label="Kostenlose Stornierung bis (Std. vorher)">
              <Input type="number" min="0" value={cancellationHours} onChange={(e) => setCancellationHours(e.target.value)} className="rounded-xl h-9" />
            </Field>
            <Toggle
              checked={isActive}
              onChange={setIsActive}
              label={isActive ? "Seite ist aktiv" : "Seite ist offline"}
              hint={isActive ? "Kunden können über deinen Link buchen" : "Der Link zeigt nichts an"}
            />
          </div>
        </Card>

        <Card title="Rechtliches" subtitle="Auf deiner Studio-Seite verlinkt">
          <div className="space-y-2.5">
            <Field label="Impressum">
              <Textarea value={impressum} onChange={(e) => setImpressum(e.target.value)} placeholder="Anbieterkennzeichnung nach §5 TMG" className="rounded-xl min-h-[70px] text-xs" />
            </Field>
            <Field label="Datenschutzerklärung">
              <Textarea
                value={privacyPolicy}
                onChange={(e) => setPrivacyPolicy(e.target.value)}
                placeholder="Wie du Kundendaten verarbeitest"
                className="rounded-xl min-h-[70px] text-xs"
              />
            </Field>
            <p className="text-[11px] font-inter text-zinc-400">
              Kundendaten liegen getrennt pro Studio — andere Studios sehen deine Kunden nicht.
            </p>
          </div>
        </Card>

        <Card title="Abrechnung" subtitle="Dein Tarif bei StudioOS">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2.5">
              <div>
                <div className="text-sm font-inter font-semibold text-zinc-900">{planInfo(currentPlan).label}</div>
                <div className="text-[11px] font-inter text-zinc-400">
                  {planInfo(currentPlan).price}/Monat · {planInfo(currentPlan).artists} Artist
                  {planInfo(currentPlan).artists > 1 ? "s" : ""} ·{" "}
                  {planInfo(currentPlan).sessionsPerMonth === Infinity ? "unbegrenzte" : planInfo(currentPlan).sessionsPerMonth}{" "}
                  Termine/Monat
                </div>
              </div>
              {studio?.subscription_status && studio.subscription_status !== "active" && (
                <span className="text-[10px] font-inter px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {studio.subscription_status}
                </span>
              )}
            </div>

            {!isOwner ? (
              <p className="text-[11px] font-inter text-zinc-400">Nur der Studio-Inhaber kann das Abo verwalten.</p>
            ) : currentPlan === "kostenlos" ? (
              <div className="flex gap-2">
                {["starter", "pro"].map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => startCheckout(plan)}
                    disabled={!!billingBusy}
                    className="flex-1 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-inter text-xs flex items-center justify-center gap-1.5"
                  >
                    {billingBusy === plan ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={12} />}
                    Zu {PLAN_LIMITS[plan].label} ({PLAN_LIMITS[plan].price})
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={openBillingPortal}
                disabled={!!billingBusy}
                className="w-full h-10 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 text-zinc-700 font-inter text-xs flex items-center justify-center gap-1.5"
              >
                {billingBusy === "portal" ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={12} />}
                Abo verwalten
              </button>
            )}
            {billingError && <p className="text-[11px] font-inter text-red-600">{billingError}</p>}
          </div>
        </Card>

        <Card title="Dein Konto" subtitle="Gilt nur für dich, nicht fürs Studio">
          <div className="space-y-2.5">
            <Field label="Dein Name">
              <div className="flex gap-2">
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="rounded-xl h-9" />
                <SaveButton saving={savingAccountName} saved={savedAccountName} onClick={saveAccountName} />
              </div>
            </Field>
            <Field label="Neues Passwort">
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="mind. 8 Zeichen"
                  className="rounded-xl h-9"
                />
                <SaveButton saving={savingPassword} saved={passwordSaved} onClick={changePassword} label="Ändern" />
              </div>
            </Field>
            {passwordError && <p className="text-xs font-inter text-red-600">{passwordError}</p>}
            <p className="text-[11px] font-inter text-zinc-400">Angemeldet als {staff?.email}</p>
          </div>
        </Card>

        {isOwner && (
          <Card title="Studio löschen" subtitle="Unwiderruflich" tone="danger">
            {!deleteOpen ? (
              <>
                <p className="text-[11px] font-inter text-red-800/80 mb-3">
                  Entfernt alle Buchungen, Termine, Angebote, Kundendaten und die Zugänge deines Teams.
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-300 text-red-700 text-xs font-inter font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={12} /> Studio löschen
                </button>
              </>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
                <div className="flex items-start gap-1.5 text-[11px] font-inter text-red-800">
                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                  Tippe <span className="font-semibold">{studio?.name}</span> ein, um zu bestätigen.
                </div>
                <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} className="rounded-xl h-9" placeholder={studio?.name} />
                {deleteError && <p className="text-[11px] font-inter text-red-600">{deleteError}</p>}
                <div className="flex gap-2">
                  <Button
                    onClick={deleteStudio}
                    disabled={deleting || confirmName.trim() !== studio?.name}
                    className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white font-inter text-xs disabled:opacity-40"
                  >
                    {deleting ? <Loader2 size={13} className="animate-spin" /> : "Endgültig löschen"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteOpen(false);
                      setConfirmName("");
                      setDeleteError("");
                    }}
                    className="h-9 rounded-xl font-inter text-xs"
                  >
                    Abbrechen
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        )}
      </div>
    </motion.div>
  );
}
