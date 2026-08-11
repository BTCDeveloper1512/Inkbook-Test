import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ExternalLink,
  Link2,
  Loader2,
  ImagePlus,
  Save,
  AlertTriangle,
  Trash2,
  CreditCard,
  Store,
  Clock,
  Images,
  ShieldCheck,
  Scale,
  UserCog,
} from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { PLAN_LIMITS, planInfo } from "../../lib/plans";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import Folder from "../../components/Folder";

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

/**
 * A folder's contents, opened on its own layer rather than inline in the
 * grid — same overlay/spring-panel language as OfferModal and
 * BookingDetailDialog, so a settings section reads like the rest of the
 * app's modals instead of a one-off pattern.
 */
function SectionDialog({ title, subtitle, tone, onClose, children }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className={`font-playfair text-lg ${tone === "danger" ? "text-red-900" : "text-zinc-900"}`}>{title}</h3>
            {subtitle && <p className="text-[11px] font-inter text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors flex-shrink-0"
          >
            <span className="sr-only">Schließen</span>×
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * One tile in the folder grid. The folder itself is the only interactive
 * element (it carries its own role="button"/tabIndex) — wrapping it in a
 * second, outer button would nest two focusable controls inside each other,
 * and would also block the folder's own CSS :hover fan-out from ever
 * triggering, since a pointer-events-none folder never receives the hover.
 */
function FolderTile({ icon, color, title, subtitle, badge, onClick }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 pt-2 pb-1">
      <Folder icon={icon} color={color} size={1.15} badge={badge} onClick={onClick} />
      <div>
        <div className="text-sm font-inter font-medium text-zinc-900">{title}</div>
        {subtitle && <div className="text-[11px] font-inter text-zinc-400 mt-0.5 max-w-[150px]">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function StudioProfileTab({ studio, staff, onStudioUpdate, onStaffUpdate }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [openSection, setOpenSection] = useState(null);
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
  const [accountPhone, setAccountPhone] = useState(staff?.phone || "");
  const [savingPhone, setSavingPhone] = useState(false);
  const [savedPhone, setSavedPhone] = useState(false);
  const [accountEmail, setAccountEmail] = useState(staff?.email || "");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savedEmail, setSavedEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [resettingMfa, setResettingMfa] = useState(false);
  const [mfaResetDone, setMfaResetDone] = useState(false);

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

  async function saveAccountPhone() {
    setSavingPhone(true);
    try {
      const updated = await studioOsAuth.patchMe({ phone: accountPhone });
      onStaffUpdate(updated);
      setSavedPhone(true);
      setTimeout(() => setSavedPhone(false), 1500);
    } finally {
      setSavingPhone(false);
    }
  }

  async function saveAccountEmail() {
    setEmailError("");
    setSavingEmail(true);
    try {
      const updated = await studioOsAuth.changeEmail(accountEmail);
      onStaffUpdate(updated);
      setSavedEmail(true);
      setTimeout(() => setSavedEmail(false), 1500);
    } catch (err) {
      setEmailError(err.response?.data?.error || "Fehlgeschlagen.");
    } finally {
      setSavingEmail(false);
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

  // Two-factor is mandatory (see StudioOsMfaGate) — "reset" doesn't turn it
  // off, it just clears the current factor so the gate walks the owner
  // through setting up a new one the moment they next hit a protected route.
  async function resetMfa() {
    setResettingMfa(true);
    try {
      await studioOsAuth.mfaUnenroll();
      setMfaResetDone(true);
    } finally {
      setResettingMfa(false);
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

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
        <FolderTile icon={Store} color="#52525b" title="Studio-Profil" subtitle="Was Kunden sehen" onClick={() => setOpenSection("profil")} />
        <FolderTile icon={Clock} color="#52525b" title="Öffnungszeiten" subtitle="Kalenderraster" onClick={() => setOpenSection("stunden")} />
        <FolderTile icon={Images} color="#52525b" title="Bilder" subtitle="Banner & Logo" onClick={() => setOpenSection("bilder")} />
        <FolderTile icon={ShieldCheck} color="#52525b" title="Richtlinien" subtitle="Anzahlung, Storno" onClick={() => setOpenSection("richtlinien")} />
        <FolderTile icon={Scale} color="#52525b" title="Rechtliches" subtitle="Impressum, DSGVO" onClick={() => setOpenSection("recht")} />
        <FolderTile icon={CreditCard} color="#52525b" title="Abrechnung" subtitle={planInfo(currentPlan).label} onClick={() => setOpenSection("abrechnung")} />
        <FolderTile icon={UserCog} color="#52525b" title="Dein Konto" subtitle={staff?.email} onClick={() => setOpenSection("konto")} />
        {isOwner && (
          <FolderTile icon={Trash2} color="#dc2626" title="Studio löschen" subtitle="Unwiderruflich" onClick={() => setOpenSection("loeschen")} />
        )}
      </div>

      <AnimatePresence>
        {openSection === "profil" && (
          <SectionDialog title="Studio-Profil" subtitle="Was Kunden auf deiner Seite sehen" onClose={() => setOpenSection(null)}>
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
              <SaveButton saving={saving} saved={saved} onClick={saveAll} label="Speichern" />
            </div>
          </SectionDialog>
        )}

        {openSection === "stunden" && (
          <SectionDialog title="Öffnungszeiten" subtitle="Bestimmen Kalenderraster und buchbare Zeiten" onClose={() => setOpenSection(null)}>
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
            <p className="text-[11px] font-inter text-zinc-400 mt-2 mb-3">Format 10:00-18:00, leer heißt geschlossen.</p>
            <SaveButton saving={saving} saved={saved} onClick={saveAll} label="Speichern" />
          </SectionDialog>
        )}

        {openSection === "bilder" && (
          <SectionDialog title="Bilder" subtitle="Erscheinen auf deiner Studio-Seite" onClose={() => setOpenSection(null)}>
            <div className="space-y-3">
              <ImageUploadField label="Banner" value={studio?.banner_image} onChange={(url) => saveImage("bannerImage", url)} />
              <ImageUploadField label="Logo" value={studio?.logo_image} onChange={(url) => saveImage("logoImage", url)} />
              <p className="text-[11px] font-inter text-zinc-400">Bilder speichern sofort.</p>
            </div>
          </SectionDialog>
        )}

        {openSection === "richtlinien" && (
          <SectionDialog title="Richtlinien" subtitle="Gelten für alle Buchungen" onClose={() => setOpenSection(null)}>
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
              <SaveButton saving={saving} saved={saved} onClick={saveAll} label="Speichern" />
            </div>
          </SectionDialog>
        )}

        {openSection === "recht" && (
          <SectionDialog title="Rechtliches" subtitle="Auf deiner Studio-Seite verlinkt" onClose={() => setOpenSection(null)}>
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
              <SaveButton saving={saving} saved={saved} onClick={saveAll} label="Speichern" />
            </div>
          </SectionDialog>
        )}

        {openSection === "abrechnung" && (
          <SectionDialog title="Abrechnung" subtitle="Dein Tarif bei StudioOS" onClose={() => setOpenSection(null)}>
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
          </SectionDialog>
        )}

        {openSection === "konto" && (
          <SectionDialog title="Dein Konto" subtitle="Gilt nur für dich, nicht fürs Studio" onClose={() => setOpenSection(null)}>
            <div className="space-y-2.5">
              <Field label="Dein Name">
                <div className="flex gap-2">
                  <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="rounded-xl h-9" />
                  <SaveButton saving={savingAccountName} saved={savedAccountName} onClick={saveAccountName} />
                </div>
              </Field>
              <Field label="Telefon">
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={accountPhone}
                    onChange={(e) => setAccountPhone(e.target.value)}
                    placeholder="Für Rückfragen im Team"
                    className="rounded-xl h-9"
                  />
                  <SaveButton saving={savingPhone} saved={savedPhone} onClick={saveAccountPhone} />
                </div>
              </Field>
              <Field label="E-Mail (Login)">
                <div className="flex gap-2">
                  <Input type="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} className="rounded-xl h-9" />
                  <SaveButton saving={savingEmail} saved={savedEmail} onClick={saveAccountEmail} />
                </div>
                {emailError && <p className="text-xs font-inter text-red-600 mt-1">{emailError}</p>}
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

              <div className="pt-1 border-t border-zinc-100" />

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-inter text-zinc-900">Zwei-Faktor-Authentifizierung</div>
                  <div className="text-[11px] font-inter text-zinc-400">
                    {mfaResetDone ? "Beim nächsten Login richtest du sie neu ein." : "Für jedes Konto Pflicht, per Authenticator-App."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetMfa}
                  disabled={resettingMfa || mfaResetDone}
                  className="h-9 px-3 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-inter hover:border-zinc-300 disabled:opacity-50 flex-shrink-0 flex items-center gap-1.5"
                >
                  {resettingMfa ? <Loader2 size={12} className="animate-spin" /> : mfaResetDone ? <Check size={12} /> : "Zurücksetzen"}
                </button>
              </div>

              <p className="text-[11px] font-inter text-zinc-400">
                Rolle: {staff?.role === "owner" ? "Inhaber" : staff?.role === "admin" ? "Admin" : staff?.role === "artist" ? "Artist" : "Mitarbeiter"}
              </p>
            </div>
          </SectionDialog>
        )}

        {openSection === "loeschen" && isOwner && (
          <SectionDialog title="Studio löschen" subtitle="Unwiderruflich" tone="danger" onClose={() => setOpenSection(null)}>
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
          </SectionDialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
