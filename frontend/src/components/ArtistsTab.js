import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, Save, X, Instagram, Upload, User } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES_LIST = ["Fine Line", "Blackwork", "Traditional", "Neo-Traditional", "Japanese", "Realism", "Portrait", "Geometric", "Watercolor", "Tribal", "Minimalist", "Color", "Abstract", "Surrealism", "Illustrative", "Black & Grey"];

const emptyArtist = { name: "", bio: "", styles: [], experience_years: 0, instagram: "", portfolio_images: [], profile_image: null, banner_image: null };

const LabelField = ({ children }) => (
  <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2">{children}</p>
);

export default function ArtistsTab({ studioId }) {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyArtist);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileRef = useRef();
  const avatarRef = useRef();
  const bannerRef = useRef();

  useEffect(() => { fetchArtists(); }, [studioId]);

  const fetchArtists = async () => {
    try {
      const { data } = await axios.get(`${API}/studios/${studioId}/artists`);
      setArtists(data);
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/studios/${studioId}/artists/${editingId}`, form, { withCredentials: true });
      } else {
        await axios.post(`${API}/studios/${studioId}/artists`, form, { withCredentials: true });
      }
      setForm(emptyArtist);
      setShowForm(false);
      setEditingId(null);
      fetchArtists();
    } catch (err) { alert(err.response?.data?.detail || "Fehler"); } finally { setSaving(false); }
  };

  const handleEdit = (artist) => {
    setForm({ name: artist.name, bio: artist.bio, styles: artist.styles, experience_years: artist.experience_years, instagram: artist.instagram, portfolio_images: artist.portfolio_images || [], profile_image: artist.profile_image || null, banner_image: artist.banner_image || null });
    setEditingId(artist.artist_id);
    setShowForm(true);
  };

  const handleDelete = async (artistId) => {
    if (!window.confirm("Artist wirklich löschen?")) return;
    try {
      await axios.delete(`${API}/studios/${studioId}/artists/${artistId}`, { withCredentials: true });
      fetchArtists();
    } catch {}
  };

  const toggleStyle = (s) => setForm(prev => ({
    ...prev, styles: prev.styles.includes(s) ? prev.styles.filter(x => x !== s) : [...prev.styles, s]
  }));

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setForm(prev => ({ ...prev, portfolio_images: [...prev.portfolio_images, data.url] }));
    } catch {} finally { setUploadingImg(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setForm(prev => ({ ...prev, profile_image: data.url }));
    } catch {} finally { setUploadingAvatar(false); }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBanner(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setForm(prev => ({ ...prev, banner_image: data.url }));
    } catch {} finally { setUploadingBanner(false); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-end mb-4">
        <motion.button
          whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
          onClick={() => { setForm(emptyArtist); setEditingId(null); setShowForm(!showForm); }}
          className="btn-primary flex items-center gap-2 text-sm"
          data-testid="add-artist-btn"
        >
          <Plus size={15} strokeWidth={1.5} /> Artist hinzufügen
        </motion.button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6 mb-6 space-y-6"
          >
            {/* Form Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-playfair font-semibold text-lg text-zinc-900">
                  {editingId ? "Artist bearbeiten" : "Neuen Artist erstellen"}
                </h3>
                <p className="text-xs text-zinc-400 font-inter mt-0.5">Alle mit * markierten Felder sind Pflichtfelder</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyArtist); }}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <LabelField>Name *</LabelField>
                <input
                  type="text" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  required placeholder="z.B. Markus Weber"
                  className="input-base w-full"
                  data-testid="artist-name-input"
                />
              </div>
              <div>
                <LabelField>Erfahrung (Jahre)</LabelField>
                <input
                  type="number" min="0" max="50"
                  value={form.experience_years}
                  onChange={e => setForm({...form, experience_years: parseInt(e.target.value)||0})}
                  className="input-base w-full"
                  data-testid="artist-experience-input"
                />
              </div>
              <div className="md:col-span-2">
                <LabelField>Bio</LabelField>
                <textarea
                  value={form.bio}
                  onChange={e => setForm({...form, bio: e.target.value})}
                  rows={3} placeholder="Kurze Beschreibung des Artists..."
                  className="input-base w-full resize-none"
                  data-testid="artist-bio-input"
                />
              </div>
              <div>
                <LabelField>Instagram Handle</LabelField>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-inter">@</span>
                  <input
                    type="text" value={form.instagram}
                    onChange={e => setForm({...form, instagram: e.target.value})}
                    className="input-base w-full pl-8"
                    placeholder="username"
                    data-testid="artist-instagram-input"
                  />
                </div>
              </div>
            </div>

            {/* Stile */}
            <div>
              <LabelField>Tattoo-Stile</LabelField>
              <div className="flex flex-wrap gap-2">
                {STYLES_LIST.map(s => (
                  <motion.button
                    key={s} type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleStyle(s)}
                    className={`px-3 py-1.5 text-xs rounded-full border font-inter transition-all ${form.styles.includes(s) ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
                    data-testid={`artist-style-${s}`}
                  >{s}</motion.button>
                ))}
              </div>
            </div>

            {/* Avatar & Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar */}
              <div>
                <LabelField>Profilbild (Avatar)</LabelField>
                <div className="flex items-center gap-3">
                  {form.profile_image ? (
                    <div className="relative group flex-shrink-0">
                      <img src={form.profile_image} alt="Avatar" className="w-16 h-16 object-cover rounded-2xl border border-zinc-200" />
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, profile_image: null }))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      ><X size={9} /></button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-zinc-300" strokeWidth={1.5} />
                    </div>
                  )}
                  <label className={`flex-1 h-10 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors ${uploadingAvatar ? "opacity-50" : ""}`}>
                    <Upload size={13} className="text-zinc-400" strokeWidth={1.5} />
                    <span className="text-xs text-zinc-400 font-inter">{uploadingAvatar ? "Wird hochgeladen..." : "Foto hochladen"}</span>
                    <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" data-testid="artist-avatar-input" />
                  </label>
                </div>
              </div>

              {/* Banner */}
              <div>
                <LabelField>Artist-Banner</LabelField>
                {form.banner_image ? (
                  <div className="relative group mb-2">
                    <img src={form.banner_image} alt="Banner" className="w-full h-20 object-cover rounded-xl border border-zinc-200" />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, banner_image: null }))}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-zinc-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    ><X size={9} /></button>
                  </div>
                ) : (
                  <div className="w-full h-20 rounded-xl bg-zinc-50 border border-dashed border-zinc-300 flex items-center justify-center mb-2">
                    <span className="text-xs text-zinc-400 font-inter">Kein Banner hochgeladen</span>
                  </div>
                )}
                <label className={`h-10 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors ${uploadingBanner ? "opacity-50" : ""}`}>
                  <Upload size={13} className="text-zinc-400" strokeWidth={1.5} />
                  <span className="text-xs text-zinc-400 font-inter">{uploadingBanner ? "Wird hochgeladen..." : "Banner hochladen"}</span>
                  <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerUpload} disabled={uploadingBanner} className="hidden" data-testid="artist-banner-input" />
                </label>
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <LabelField>Portfolio-Bilder</LabelField>
              <div className="flex flex-wrap gap-2">
                {form.portfolio_images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="w-16 h-16 object-cover rounded-xl border border-zinc-200" />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({...prev, portfolio_images: prev.portfolio_images.filter((_,idx)=>idx!==i)}))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    ><X size={9} /></button>
                  </div>
                ))}
                <label className={`w-16 h-16 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadingImg ? "opacity-50" : ""}`}>
                  <Upload size={14} className="text-zinc-400" strokeWidth={1.5} />
                  <span className="text-xs text-zinc-400 font-inter mt-0.5">{uploadingImg ? "..." : "Bild"}</span>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePortfolioUpload} disabled={uploadingImg} className="hidden" />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit" disabled={saving}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                data-testid="save-artist-btn"
              >
                <Save size={14} strokeWidth={1.5} />
                {saving ? "Wird gespeichert..." : (editingId ? "Änderungen speichern" : "Artist erstellen")}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyArtist); }}
                className="btn-secondary"
              >
                Abbrechen
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Artists Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <div key={i} className="h-40 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : artists.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] py-24 flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
            className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-5"
          >
            <User size={26} className="text-zinc-300" strokeWidth={1.5} />
          </motion.div>
          <h3 className="font-playfair text-xl text-zinc-900 mb-1.5">Keine Artists</h3>
          <p className="text-zinc-400 font-inter text-sm">Klicke auf „Artist hinzufügen" um loszulegen</p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {artists.map(artist => (
            <motion.div
              key={artist.artist_id}
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 22 } } }}
              whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
              className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5 group transition-shadow"
              data-testid={`artist-card-${artist.artist_id}`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {artist.profile_image ? (
                    <img src={artist.profile_image} alt={artist.name} className="w-11 h-11 rounded-2xl object-cover border border-zinc-200 flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-playfair font-bold text-sm flex-shrink-0">
                      {artist.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-playfair font-semibold text-zinc-900">{artist.name}</h4>
                    {artist.experience_years > 0 && (
                      <p className="text-xs text-zinc-400 font-inter">{artist.experience_years} Jahre Erfahrung</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleEdit(artist)} className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors" data-testid={`edit-artist-${artist.artist_id}`}>
                    <Edit3 size={14} strokeWidth={1.5} />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(artist.artist_id)} className="p-1.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors" data-testid={`delete-artist-${artist.artist_id}`}>
                    <Trash2 size={14} strokeWidth={1.5} />
                  </motion.button>
                </div>
              </div>

              {artist.bio && (
                <p className="text-xs text-zinc-500 font-inter mb-3 line-clamp-2">{artist.bio}</p>
              )}

              {/* Style Badges */}
              {artist.styles?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {artist.styles.slice(0, 4).map(s => (
                    <span key={s} className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-inter border border-zinc-200">{s}</span>
                  ))}
                  {artist.styles.length > 4 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-400 font-inter">+{artist.styles.length - 4}</span>
                  )}
                </div>
              )}

              {artist.instagram && (
                <p className="text-xs text-zinc-400 font-inter flex items-center gap-1.5">
                  <Instagram size={12} strokeWidth={1.5} />@{artist.instagram}
                </p>
              )}

              {/* Portfolio thumbnails */}
              {artist.portfolio_images?.length > 0 && (
                <div className="flex gap-1.5 mt-3">
                  {artist.portfolio_images.slice(0, 4).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded-xl border border-zinc-100" />
                  ))}
                  {artist.portfolio_images.length > 4 && (
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
                      <span className="text-xs text-zinc-400 font-inter">+{artist.portfolio_images.length - 4}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
