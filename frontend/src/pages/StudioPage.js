import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Star, MapPin, Phone, Mail, Globe, CheckCircle, X, ImagePlus, MessageSquare, Palette, Calendar, Clock, ChevronLeft, ChevronRight, Scissors } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const priceLabels = { budget: "€", medium: "€€", premium: "€€€", luxury: "€€€€" };

export default function StudioPage() {
  const { studioId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studio, setStudio] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingType, setBookingType] = useState("tattoo");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [refImages, setRefImages] = useState([]);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studioRes, reviewsRes, artistsRes] = await Promise.all([
          axios.get(`${API}/studios/${studioId}`),
          axios.get(`${API}/studios/${studioId}/reviews`),
          axios.get(`${API}/studios/${studioId}/artists`)
        ]);
        setStudio(studioRes.data);
        setReviews(reviewsRes.data);
        setArtists(artistsRes.data);
      } catch { navigate("/"); } finally { setLoading(false); }
    };
    fetchData();
  }, [studioId]);

  // Re-fetch slots whenever date OR bookingType changes
  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    axios.get(`${API}/studios/${studioId}/slots`, { params: { date: selectedDate, slot_type: bookingType } })
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, bookingType, studioId]);

  const handleBook = async () => {
    if (!user) { navigate("/login"); return; }
    if (!selectedSlot) return;
    setBookingLoading(true);
    try {
      const { data } = await axios.post(`${API}/bookings`, {
        studio_id: studioId, slot_id: selectedSlot.slot_id,
        booking_type: bookingType, notes: bookingNotes, reference_images: refImages
      }, { withCredentials: true });
      setBookingSuccess(data);
    } catch (e) { alert(e.response?.data?.detail || "Buchung fehlgeschlagen"); } finally { setBookingLoading(false); }
  };

  const handleRefImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingRef(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setRefImages(prev => [...prev, data.url]);
    } catch {} finally { setUploadingRef(false); }
  };

  const getDates = () => {
    const dates = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-4">
        <div className="h-72 bg-zinc-100 animate-pulse rounded-3xl" />
        <div className="h-6 bg-zinc-100 animate-pulse rounded-full w-48" />
        <div className="h-4 bg-zinc-100 animate-pulse rounded-full w-full" />
      </div>
    </div>
  );
  if (!studio) return null;

  const TABS = [
    { id: "about", label: t("studio.about") },
    { id: "artists", label: `Artists (${artists.length})` },
    { id: "gallery", label: t("studio.gallery") },
    { id: "reviews", label: `${t("studio.reviews")} (${reviews.length})` },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-zinc-900">
        {studio.images?.[galleryIdx] ? (
          <img src={studio.images[galleryIdx]} alt={studio.name} className="w-full h-full object-cover opacity-70" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-zinc-700 text-9xl font-playfair">{studio.name[0]}</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Gallery nav */}
        {studio.images?.length > 1 && (
          <>
            <button onClick={() => setGalleryIdx((galleryIdx - 1 + studio.images.length) % studio.images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-sm hover:bg-white/40 rounded-full flex items-center justify-center transition-all">
              <ChevronLeft size={16} className="text-white" strokeWidth={1.5} />
            </button>
            <button onClick={() => setGalleryIdx((galleryIdx + 1) % studio.images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-sm hover:bg-white/40 rounded-full flex items-center justify-center transition-all">
              <ChevronRight size={16} className="text-white" strokeWidth={1.5} />
            </button>
            <div className="absolute bottom-20 right-4 flex gap-1">
              {studio.images.map((_, i) => (
                <button key={i} onClick={() => setGalleryIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === galleryIdx ? "bg-white w-3" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}

        {/* Studio info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {studio.is_verified && (
                  <span className="bg-white/95 text-zinc-900 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-inter font-semibold">
                    <CheckCircle size={10} className="text-emerald-600" /> Verifiziert
                  </span>
                )}
                <span className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-inter backdrop-blur-sm">{priceLabels[studio.price_range]}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-playfair font-semibold text-white leading-tight">{studio.name}</h1>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-white/80 text-sm font-inter"><MapPin size={13} strokeWidth={1.5} />{studio.city}</span>
                {studio.avg_rating > 0 && (
                  <span className="flex items-center gap-1 text-white/80 text-sm font-inter">
                    <Star size={13} className="fill-amber-400 text-amber-400" strokeWidth={1.5} />
                    {studio.avg_rating?.toFixed(1)} <span className="text-white/50">({studio.review_count})</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main Content ── */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_8px_rgb(0,0,0,0.04)] p-1.5 w-fit overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-inter font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* About */}
              {activeTab === "about" && (
                <motion.div key="about" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
                    <p className="text-zinc-600 font-inter leading-relaxed text-sm">{studio.description}</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
                    <h3 className="font-inter font-semibold text-xs tracking-[0.15em] uppercase text-zinc-400 mb-3 flex items-center gap-2"><Palette size={13} strokeWidth={1.5} /> {t("studio.styles")}</h3>
                    <div className="flex flex-wrap gap-2">
                      {studio.styles?.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 text-xs font-inter text-zinc-700 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6 space-y-3">
                    <h3 className="font-inter font-semibold text-xs tracking-[0.15em] uppercase text-zinc-400 mb-2">Kontakt</h3>
                    {studio.address && <p className="flex items-center gap-3 text-sm font-inter text-zinc-600"><MapPin size={14} className="text-zinc-400 flex-shrink-0" strokeWidth={1.5} />{studio.address}, {studio.city}</p>}
                    {studio.phone && <p className="flex items-center gap-3 text-sm font-inter text-zinc-600"><Phone size={14} className="text-zinc-400 flex-shrink-0" strokeWidth={1.5} />{studio.phone}</p>}
                    {studio.email && <p className="flex items-center gap-3 text-sm font-inter text-zinc-600"><Mail size={14} className="text-zinc-400 flex-shrink-0" strokeWidth={1.5} />{studio.email}</p>}
                    {studio.website && <p className="flex items-center gap-3 text-sm font-inter text-zinc-600"><Globe size={14} className="text-zinc-400 flex-shrink-0" strokeWidth={1.5} /><a href={studio.website} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-zinc-900 transition-colors">{studio.website}</a></p>}
                  </div>
                </motion.div>
              )}

              {/* Artists */}
              {activeTab === "artists" && (
                <motion.div key="artists" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  {artists.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-black/[0.04] p-12 text-center">
                      <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Scissors size={20} className="text-zinc-400" strokeWidth={1.5} />
                      </div>
                      <p className="text-zinc-400 font-inter text-sm">Noch keine Artists im Profil</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {artists.map(artist => (
                        <motion.div
                          key={artist.artist_id}
                          whileHover={{ y: -2 }}
                          className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)] transition-all duration-300"
                          data-testid={`artist-profile-${artist.artist_id}`}
                        >
                          {/* Artist card top - portfolio preview */}
                          <div className="h-32 bg-zinc-100 relative overflow-hidden">
                            {artist.portfolio_images?.length > 0 ? (
                              <div className="flex gap-0.5 h-full">
                                {artist.portfolio_images.slice(0, 3).map((img, i) => (
                                  <img key={i} src={img} alt="" className="flex-1 h-full object-cover" style={{ flex: i === 0 ? 2 : 1 }} />
                                ))}
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Palette size={28} className="text-zinc-300" strokeWidth={1} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            {/* Experience badge */}
                            {artist.experience_years > 0 && (
                              <span className="absolute top-2.5 right-2.5 text-xs bg-white/90 text-zinc-800 px-2 py-1 rounded-full font-inter font-semibold">
                                {artist.experience_years}J
                              </span>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center font-playfair font-bold text-base flex-shrink-0">
                                {artist.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-playfair font-semibold text-zinc-900">{artist.name}</h4>
                                {artist.experience_years > 0 && (
                                  <p className="text-xs text-zinc-400 font-inter">{artist.experience_years} Jahre Erfahrung</p>
                                )}
                              </div>
                            </div>

                            {artist.bio && (
                              <p className="text-xs text-zinc-500 font-inter leading-relaxed mb-3 line-clamp-2">{artist.bio}</p>
                            )}

                            {artist.styles?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {artist.styles.slice(0, 4).map(s => (
                                  <span key={s} className="text-xs px-2.5 py-1 bg-zinc-100 text-zinc-600 font-inter rounded-full">{s}</span>
                                ))}
                                {artist.styles.length > 4 && (
                                  <span className="text-xs px-2 py-1 text-zinc-400 font-inter">+{artist.styles.length - 4}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Gallery */}
              {activeTab === "gallery" && (
                <motion.div key="gallery" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  {studio.images?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {studio.images.map((img, i) => (
                        <motion.div key={i} whileHover={{ scale: 1.02 }} className="overflow-hidden rounded-2xl cursor-pointer" onClick={() => setGalleryIdx(i)}>
                          <img src={img} alt={`Galerie ${i + 1}`} className="w-full h-44 object-cover hover:opacity-90 transition-opacity" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-black/[0.04] p-12 text-center">
                      <p className="text-zinc-400 font-inter text-sm">Keine Bilder vorhanden</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Reviews */}
              {activeTab === "reviews" && (
                <motion.div key="reviews" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
                  {reviews.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-black/[0.04] p-12 text-center">
                      <p className="text-zinc-400 font-inter text-sm">Noch keine Bewertungen</p>
                    </div>
                  ) : reviews.map(r => (
                    <div key={r.review_id} className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-bold font-inter">{r.user_name?.[0]?.toUpperCase()}</div>
                          <span className="font-inter font-semibold text-sm text-zinc-900">{r.user_name}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={13} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"} strokeWidth={1.5} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-zinc-600 font-inter leading-relaxed">{r.comment}</p>
                      <p className="text-xs text-zinc-400 font-inter mt-2">{new Date(r.created_at).toLocaleDateString("de-DE")}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Booking Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_8px_24px_rgb(0,0,0,0.06)] p-6 sticky top-20">
              <h3 className="font-playfair font-semibold text-xl text-zinc-900 mb-5">{t("booking.title")}</h3>

              {/* Booking Type */}
              <div className="mb-5">
                <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">{t("booking.selectType")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: "consultation", icon: <MessageSquare size={13} strokeWidth={1.5} />, label: t("booking.consultation") },
                    { val: "tattoo", icon: <Scissors size={13} strokeWidth={1.5} />, label: t("booking.tattoo") }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => { setBookingType(opt.val); setSelectedSlot(null); }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-inter font-medium rounded-xl border transition-all ${bookingType === opt.val ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
                      data-testid={`booking-type-${opt.val}`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-5">
                <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5 flex items-center gap-1.5"><Calendar size={11} strokeWidth={1.5} /> {t("booking.selectDate")}</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1">
                  {getDates().map(d => {
                    const dateObj = new Date(d + "T12:00:00");
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDate(d)}
                        className={`flex-shrink-0 w-12 py-2.5 text-center rounded-xl border transition-all ${selectedDate === d ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400 bg-white"}`}
                        data-testid={`date-btn-${d}`}
                      >
                        <div className="text-xs font-inter font-semibold">{dateObj.toLocaleDateString("de-DE", { day: "2-digit" })}</div>
                        <div className="text-xs opacity-60">{dateObj.toLocaleDateString("de-DE", { month: "short" })}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots */}
              {selectedDate && (
                <div className="mb-5">
                  <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5 flex items-center gap-1.5"><Clock size={11} strokeWidth={1.5} /> {t("booking.selectSlot")}</p>
                  {slotsLoading ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      {[1,2].map(i => <div key={i} className="h-10 bg-zinc-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-zinc-400 font-inter py-2">Keine freien Termine für diesen Tag</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {slots.map(slot => (
                        <button
                          key={slot.slot_id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 text-xs font-inter font-medium rounded-xl border transition-all ${selectedSlot?.slot_id === slot.slot_id ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400 bg-white"}`}
                          data-testid={`slot-btn-${slot.slot_id}`}
                        >
                          {slot.start_time} – {slot.end_time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <AnimatePresence>
                {selectedSlot && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                    <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">{t("booking.notes")}</p>
                    <textarea
                      value={bookingNotes}
                      onChange={e => setBookingNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100 resize-none transition-all"
                      placeholder="Beschreibe dein Tattoo-Motiv..."
                      data-testid="booking-notes"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reference Images */}
              <AnimatePresence>
                {selectedSlot && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                    <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">{t("booking.refImages")}</p>
                    <div className="flex flex-wrap gap-2">
                      {refImages.map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={img} alt="" className="w-14 h-14 object-cover rounded-xl border border-zinc-200" />
                          <button type="button" onClick={() => setRefImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                      {refImages.length < 5 && (
                        <label className={`w-14 h-14 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadingRef ? "opacity-50" : ""}`}>
                          <ImagePlus size={14} className="text-zinc-400" strokeWidth={1.5} />
                          <span className="text-xs text-zinc-400 font-inter mt-0.5">{uploadingRef ? "..." : "+"}</span>
                          <input ref={fileRef} type="file" accept="image/*" onChange={handleRefImageUpload} disabled={uploadingRef} className="hidden" data-testid="ref-image-input" />
                        </label>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-xs text-zinc-400 font-inter mb-4">
                {t("booking.deposit")}: <span className="font-semibold text-zinc-900">€50</span>
              </div>

              {bookingSuccess ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center" data-testid="booking-success">
                  <CheckCircle size={24} className="text-emerald-600 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-emerald-800 font-inter font-semibold text-sm mb-1">{t("booking.success")}</p>
                  <p className="text-xs text-emerald-600 font-inter">ID: {bookingSuccess.booking_id}</p>
                  <button onClick={() => navigate("/dashboard")} className="mt-3 w-full py-2 bg-zinc-900 text-white text-xs font-inter rounded-xl hover:bg-zinc-700 transition-colors">
                    Zum Dashboard
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBook}
                  disabled={!selectedSlot || bookingLoading}
                  className="btn-primary w-full justify-center disabled:opacity-40"
                  data-testid="confirm-booking-btn"
                >
                  {bookingLoading ? t("common.loading") : t("booking.confirm")}
                </motion.button>
              )}

              {user && (
                <button
                  onClick={() => navigate(`/messages/${studio.owner_id}`, { state: { recipientName: studio.name, recipientRole: "studio_owner" } })}
                  className="w-full mt-3 py-2.5 border border-zinc-200 hover:border-zinc-900 text-sm font-inter text-zinc-600 hover:text-zinc-900 rounded-xl flex items-center justify-center gap-2 transition-all"
                  data-testid="contact-studio-btn"
                >
                  <MessageSquare size={14} strokeWidth={1.5} /> Studio kontaktieren
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
