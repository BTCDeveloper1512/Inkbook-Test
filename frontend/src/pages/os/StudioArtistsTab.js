import React, { useMemo, useState } from "react";
import { Plus, Loader2, X, ImagePlus, Trash2 } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { artistColor, initials } from "../../lib/artistColors";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

function PortfolioUploader({ images, onChange }) {
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const { data } = await studioApi.post("/upload/image", form);
        onChange((prev) => [...prev, data.url]);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Portfolio</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((url) => (
          <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden group flex-shrink-0">
            <img src={url} alt="Portfolio" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange((prev) => prev.filter((u) => u !== url))}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <label className="w-16 h-16 rounded-lg border border-dashed border-zinc-300 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors flex-shrink-0">
          {uploading ? <Loader2 size={14} className="animate-spin text-zinc-400" /> : <ImagePlus size={16} className="text-zinc-300" />}
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

function ArtistForm({ initial, onSave, onCancel, saving, error }) {
  const [name, setName] = useState(initial?.name || "");
  const [bio, setBio] = useState(initial?.bio || "");
  const [instagramHandle, setInstagramHandle] = useState(initial?.instagram_handle || "");
  const [experienceYears, setExperienceYears] = useState(initial?.experience_years ?? "");
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [specialties, setSpecialties] = useState(initial?.specialties || []);
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url || "");
  const [portfolioImages, setPortfolioImages] = useState(initial?.portfolio_images || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  function addSpecialty() {
    const v = specialtyInput.trim();
    if (v && !specialties.includes(v)) setSpecialties((prev) => [...prev, v]);
    setSpecialtyInput("");
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await studioApi.post("/upload/image", form);
      setPhotoUrl(data.url);
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5 mb-4">
      <div className="flex gap-4 mb-3">
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-zinc-100 overflow-hidden flex items-center justify-center">
            {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-zinc-300 text-xl">?</span>}
          </div>
          <label className="text-[11px] font-inter text-zinc-500 cursor-pointer hover:text-zinc-800">
            {uploadingPhoto ? <Loader2 size={12} className="animate-spin inline" /> : "Foto"}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
          </label>
        </div>
        <div className="flex-1 space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-xl h-10" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@instagram" className="rounded-xl h-10" />
            <Input type="number" min="0" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} placeholder="Jahre Erfahrung" className="rounded-xl h-10" />
          </div>
        </div>
      </div>

      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Kurzbeschreibung" className="rounded-xl min-h-[70px] mb-3" />

      <div className="mb-3">
        <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Stile</Label>
        <div className="flex gap-2">
          <Input
            value={specialtyInput}
            onChange={(e) => setSpecialtyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
            placeholder="z.B. Fine Line — Enter"
            className="rounded-xl h-9 text-sm"
          />
          <Button type="button" variant="outline" onClick={addSpecialty} className="rounded-xl flex-shrink-0">
            +
          </Button>
        </div>
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {specialties.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpecialties((prev) => prev.filter((x) => x !== s))}
                className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-inter hover:bg-zinc-200"
              >
                {s} ×
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <PortfolioUploader images={portfolioImages} onChange={setPortfolioImages} />
      </div>

      {error && <p className="text-xs font-inter text-red-600 mb-3">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl font-inter">
          Abbrechen
        </Button>
        <Button
          type="button"
          disabled={saving || !name.trim()}
          onClick={() =>
            onSave({
              name,
              bio,
              instagramHandle,
              experienceYears: experienceYears === "" ? undefined : Number(experienceYears),
              specialties,
              photoUrl: photoUrl || undefined,
              portfolioImages,
            })
          }
          className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : "Speichern"}
        </Button>
      </div>
    </div>
  );
}

export default function StudioArtistsTab({ artists, bookings, onArtistsChange }) {
  const [formMode, setFormMode] = useState(null); // null | "new" | artistId
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const statsByArtist = useMemo(() => {
    const now = Date.now();
    const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
    const map = {};
    for (const a of artists) map[a.id] = { upcoming: 0, thisWeek: 0 };
    for (const b of bookings) {
      if (!b.artist_id || !map[b.artist_id]) continue;
      for (const s of b.sessions || []) {
        const t = new Date(s.start_time).getTime();
        if (t < now) continue;
        map[b.artist_id].upcoming += 1;
        if (t <= weekAhead) map[b.artist_id].thisWeek += 1;
      }
    }
    return map;
  }, [artists, bookings]);

  async function createArtist(fields) {
    setSaving(true);
    setFormError("");
    try {
      const { data } = await studioApi.post("/studios/me/artists", { ...fields, type: "resident" });
      onArtistsChange((prev) => [...prev, data]);
      setFormMode(null);
    } catch (err) {
      setFormError(err.response?.data?.error || "Artist konnte nicht angelegt werden.");
    } finally {
      setSaving(false);
    }
  }

  async function updateArtist(id, fields) {
    setSaving(true);
    setFormError("");
    try {
      const { data } = await studioApi.patch(`/studios/me/artists/${id}`, fields);
      onArtistsChange((prev) => prev.map((a) => (a.id === id ? data : a)));
      setFormMode(null);
    } catch (err) {
      setFormError(err.response?.data?.error || "Änderung konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteArtist(id) {
    await studioApi.delete(`/studios/me/artists/${id}`);
    onArtistsChange((prev) => prev.filter((a) => a.id !== id));
  }

  const editingArtist = typeof formMode === "string" && formMode !== "new" ? artists.find((a) => a.id === formMode) : null;

  return (
    <div>
      {formMode === "new" && (
        <ArtistForm
          onSave={createArtist}
          onCancel={() => {
            setFormMode(null);
            setFormError("");
          }}
          saving={saving}
          error={formError}
        />
      )}
      {editingArtist && (
        <ArtistForm
          initial={editingArtist}
          onSave={(fields) => updateArtist(editingArtist.id, fields)}
          onCancel={() => {
            setFormMode(null);
            setFormError("");
          }}
          saving={saving}
          error={formError}
        />
      )}

      {!formMode && (
        <button
          type="button"
          onClick={() => setFormMode("new")}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl border border-dashed border-zinc-300 text-sm font-inter text-zinc-500 hover:border-zinc-400 transition-colors mb-4"
        >
          <Plus size={15} /> Artist hinzufügen
        </button>
      )}

      {artists.length === 0 ? (
        <p className="text-sm text-zinc-400 font-inter text-center py-8">Noch keine Artists.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {artists.map((a, i) => {
            const stats = statsByArtist[a.id] || { upcoming: 0, thisWeek: 0 };
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-inter font-semibold text-sm flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: artistColor(i) }}
                    >
                      {a.photo_url ? <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" /> : initials(a.name)}
                    </div>
                    <div>
                      <div className="font-inter font-medium text-sm text-zinc-900">{a.name}</div>
                      <div className="text-xs font-inter text-zinc-500">{(a.specialties || []).slice(0, 2).join(", ") || "—"}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-inter uppercase tracking-wide px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 flex-shrink-0">
                    {a.type === "guest" ? "Gast" : "Aktiv"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-zinc-50 rounded-xl px-3 py-2">
                    <div className="font-playfair text-lg text-zinc-900">{stats.thisWeek}</div>
                    <div className="text-[9px] font-inter uppercase tracking-wide text-zinc-400">Diese Woche</div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl px-3 py-2">
                    <div className="font-playfair text-lg text-zinc-900">{stats.upcoming}</div>
                    <div className="text-[9px] font-inter uppercase tracking-wide text-zinc-400">Anstehend</div>
                  </div>
                </div>

                {a.portfolio_images?.length > 0 && (
                  <div className="flex gap-1.5 mb-3">
                    {a.portfolio_images.slice(0, 4).map((url) => (
                      <div key={url} className="w-full aspect-square rounded-lg overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setFormMode(a.id)} className="rounded-lg font-inter flex-1">
                    Bearbeiten
                  </Button>
                  <button
                    type="button"
                    onClick={() => deleteArtist(a.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Entfernen"
                  >
                    <X size={14} className="text-zinc-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
