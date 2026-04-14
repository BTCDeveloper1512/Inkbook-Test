import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Plus, Trash2, Edit3, Save, X, Instagram, Star, Upload } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES_LIST = ["Fine Line", "Blackwork", "Traditional", "Neo-Traditional", "Japanese", "Realism", "Portrait", "Geometric", "Watercolor", "Tribal", "Minimalist", "Color", "Abstract", "Surrealism", "Illustrative", "Black & Grey"];

const emptyArtist = { name: "", bio: "", styles: [], experience_years: 0, instagram: "", portfolio_images: [] };

export default function ArtistsTab({ studioId }) {
  const { user } = useAuth();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyArtist);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef();

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
    } catch (e) { alert(e.response?.data?.detail || "Fehler"); } finally { setSaving(false); }
  };

  const handleEdit = (artist) => {
    setForm({ name: artist.name, bio: artist.bio, styles: artist.styles, experience_years: artist.experience_years, instagram: artist.instagram, portfolio_images: artist.portfolio_images || [] });
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

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setForm(emptyArtist); setEditingId(null); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-outfit hover:bg-neutral-800"
          data-testid="add-artist-btn"
        >
          <Plus size={16} /> Artist hinzufügen
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-gray-200 p-6 mb-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-playfair font-bold">{editingId ? "Artist bearbeiten" : "Neuen Artist erstellen"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-black"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="artist-name-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Erfahrung (Jahre)</label>
              <input type="number" min="0" max="50" value={form.experience_years} onChange={e => setForm({...form, experience_years: parseInt(e.target.value)||0})} className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="artist-experience-input" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Bio</label>
              <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit resize-none" data-testid="artist-bio-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Instagram Handle</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input type="text" value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} className="w-full pl-8 pr-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="artist-instagram-input" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Stile</label>
            <div className="flex flex-wrap gap-2">
              {STYLES_LIST.map(s => (
                <button key={s} type="button" onClick={() => toggleStyle(s)} className={`px-2 py-1 text-xs border font-outfit transition-colors ${form.styles.includes(s) ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`} data-testid={`artist-style-${s}`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Portfolio-Bilder</label>
            <div className="flex flex-wrap gap-2">
              {form.portfolio_images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt="" className="w-16 h-16 object-cover border border-gray-200" />
                  <button type="button" onClick={() => setForm(prev => ({...prev, portfolio_images: prev.portfolio_images.filter((_,idx)=>idx!==i)}))} className="absolute -top-1 -right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <X size={9} />
                  </button>
                </div>
              ))}
              <label className={`w-16 h-16 border-2 border-dashed border-gray-300 hover:border-black flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadingImg ? "opacity-50" : ""}`}>
                <Upload size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400 font-outfit">{uploadingImg ? "..." : "+"}</span>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePortfolioUpload} disabled={uploadingImg} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-6 py-2 bg-black text-white text-sm font-outfit hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2" data-testid="save-artist-btn">
              <Save size={14} /> {saving ? "..." : (editingId ? "Speichern" : "Erstellen")}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyArtist); }} className="px-6 py-2 border border-gray-300 text-sm font-outfit hover:border-black">
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Artists Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-40 bg-gray-100 animate-pulse"></div>)}
        </div>
      ) : artists.length === 0 ? (
        <div className="bg-white border border-gray-200 py-16 text-center">
          <p className="text-gray-400 font-outfit text-sm">Noch keine Artists angelegt</p>
          <p className="text-gray-300 font-outfit text-xs mt-1">Klicke auf „Artist hinzufügen" um loszulegen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {artists.map(artist => (
            <div key={artist.artist_id} className="bg-white border border-gray-200 p-5 group hover:border-gray-400 transition-colors" data-testid={`artist-card-${artist.artist_id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-playfair font-bold text-sm">
                    {artist.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-playfair font-semibold">{artist.name}</h4>
                    {artist.experience_years > 0 && (
                      <p className="text-xs text-gray-500 font-outfit">{artist.experience_years} Jahre Erfahrung</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(artist)} className="p-1.5 text-gray-400 hover:text-black" data-testid={`edit-artist-${artist.artist_id}`}><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(artist.artist_id)} className="p-1.5 text-gray-400 hover:text-red-500" data-testid={`delete-artist-${artist.artist_id}`}><Trash2 size={14} /></button>
                </div>
              </div>
              {artist.bio && <p className="text-xs text-gray-600 font-outfit mb-3 line-clamp-2">{artist.bio}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                {artist.styles?.slice(0,4).map(s => <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 font-outfit">{s}</span>)}
              </div>
              {artist.instagram && (
                <p className="text-xs text-gray-500 font-outfit flex items-center gap-1"><Instagram size={12} />@{artist.instagram}</p>
              )}
              {artist.portfolio_images?.length > 0 && (
                <div className="flex gap-1 mt-3">
                  {artist.portfolio_images.slice(0,4).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-12 h-12 object-cover border border-gray-100" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
