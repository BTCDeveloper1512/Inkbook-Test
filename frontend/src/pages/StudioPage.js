import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Star, MapPin, Phone, Mail, Globe, CheckCircle, ChevronLeft, ChevronRight, X, ImagePlus, MessageSquare } from "lucide-react";

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
  const [showBooking, setShowBooking] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [refImages, setRefImages] = useState([]);
  const [uploadingRef, setUploadingRef] = useState(false);
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
      } catch {
        navigate("/search");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studioId]);

  useEffect(() => {
    if (selectedDate) {
      axios.get(`${API}/studios/${studioId}/slots`, { params: { date: selectedDate } })
        .then(r => setSlots(r.data))
        .catch(() => setSlots([]));
    }
  }, [selectedDate, studioId]);

  const handleBook = async () => {
    if (!user) { navigate("/login"); return; }
    if (!selectedSlot) return;
    setBookingLoading(true);
    try {
      const { data } = await axios.post(`${API}/bookings`, {
        studio_id: studioId,
        slot_id: selectedSlot.slot_id,
        booking_type: bookingType,
        notes: bookingNotes,
        reference_images: refImages
      }, { withCredentials: true });
      setBookingSuccess(data);
    } catch (e) {
      alert(e.response?.data?.detail || "Buchung fehlgeschlagen");
    } finally {
      setBookingLoading(false);
    }
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

  // Date helpers
  const today = new Date().toISOString().split("T")[0];
  const getDates = () => {
    const dates = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="h-96 bg-gray-100 animate-pulse mb-6"></div>
        <div className="h-8 bg-gray-100 animate-pulse w-64 mb-4"></div>
        <div className="h-4 bg-gray-100 animate-pulse w-full mb-2"></div>
      </div>
    </div>
  );

  if (!studio) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="relative h-72 md:h-96 bg-black overflow-hidden">
        {studio.images?.[galleryIdx] ? (
          <img src={studio.images[galleryIdx]} alt={studio.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <span className="text-gray-600 text-8xl font-playfair">{studio.name[0]}</span>
          </div>
        )}
        {studio.images?.length > 1 && (
          <>
            <button onClick={() => setGalleryIdx((galleryIdx - 1 + studio.images.length) % studio.images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 transition-colors">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button onClick={() => setGalleryIdx((galleryIdx + 1) % studio.images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 transition-colors">
              <ChevronRight size={20} className="text-white" />
            </button>
          </>
        )}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            {studio.is_verified && (
              <span className="bg-white/90 text-black text-xs px-2 py-1 flex items-center gap-1 font-outfit">
                <CheckCircle size={10} /> {t("studio.verified")}
              </span>
            )}
            <span className="bg-black/60 text-white text-xs px-2 py-1 font-outfit">{priceLabels[studio.price_range]}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white">{studio.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-white/80 text-sm font-outfit"><MapPin size={14} />{studio.city}</span>
            <span className="flex items-center gap-1 text-white/80 text-sm font-outfit"><Star size={14} className="fill-amber-400 text-amber-400" />{studio.avg_rating?.toFixed(1)} ({studio.review_count})</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto">
              {["about", "artists", "gallery", "reviews"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-outfit font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"}`}
                  data-testid={`tab-${tab}`}
                >
                  {tab === "about" ? t("studio.about") : tab === "artists" ? `Artists (${artists.length})` : tab === "gallery" ? t("studio.gallery") : t("studio.reviews")}
                </button>
              ))}
            </div>

            {activeTab === "about" && (
              <div className="space-y-6">
                <p className="text-gray-700 font-outfit leading-relaxed">{studio.description}</p>
                <div>
                  <h3 className="font-playfair font-semibold mb-3">{t("studio.styles")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {studio.styles?.map(s => (
                      <span key={s} className="px-3 py-1.5 border border-gray-300 text-sm font-outfit hover:bg-black hover:text-white hover:border-black transition-colors cursor-default">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {studio.address && <p className="flex items-center gap-2 text-sm font-outfit text-gray-600"><MapPin size={14} className="text-gray-400" />{studio.address}, {studio.city}</p>}
                  {studio.phone && <p className="flex items-center gap-2 text-sm font-outfit text-gray-600"><Phone size={14} className="text-gray-400" />{studio.phone}</p>}
                  {studio.email && <p className="flex items-center gap-2 text-sm font-outfit text-gray-600"><Mail size={14} className="text-gray-400" />{studio.email}</p>}
                  {studio.website && <p className="flex items-center gap-2 text-sm font-outfit text-gray-600"><Globe size={14} className="text-gray-400" />{studio.website}</p>}
                </div>
              </div>
            )}

            {activeTab === "artists" && (
              <div className="space-y-4">
                {artists.length === 0 ? (
                  <p className="text-gray-500 font-outfit text-sm">Noch keine Artists</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {artists.map(artist => (
                      <div key={artist.artist_id} className="border border-gray-200 p-4 hover:border-gray-400 transition-colors" data-testid={`artist-profile-${artist.artist_id}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-playfair font-bold text-sm">
                            {artist.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-playfair font-semibold">{artist.name}</h4>
                            {artist.experience_years > 0 && <p className="text-xs text-gray-500 font-outfit">{artist.experience_years} Jahre Erfahrung</p>}
                          </div>
                        </div>
                        {artist.bio && <p className="text-xs text-gray-600 font-outfit mb-3 line-clamp-2">{artist.bio}</p>}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {artist.styles?.slice(0, 4).map(s => <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 font-outfit">{s}</span>)}
                        </div>
                        {artist.portfolio_images?.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {artist.portfolio_images.slice(0, 4).map((img, i) => (
                              <img key={i} src={img} alt="" className="w-12 h-12 object-cover border border-gray-100" />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "gallery" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {studio.images?.length > 0 ? studio.images.map((img, i) => (
                  <img key={i} src={img} alt={`Gallery ${i + 1}`} className="w-full h-48 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
                )) : (
                  <p className="text-gray-500 font-outfit col-span-3">Keine Bilder vorhanden</p>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 font-outfit">Noch keine Bewertungen</p>
                ) : reviews.map(r => (
                  <div key={r.review_id} className="border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-outfit font-semibold text-sm">{r.user_name}</span>
                      <div className="flex">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={14} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-outfit">{r.comment}</p>
                    <p className="text-xs text-gray-400 font-outfit mt-2">{new Date(r.created_at).toLocaleDateString("de-DE")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-gray-200 p-6 sticky top-20">
              <h3 className="font-playfair font-bold text-xl mb-4">{t("booking.title")}</h3>

              {/* Booking Type */}
              <div className="mb-4">
                <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">{t("booking.selectType")}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBookingType("consultation")}
                    className={`py-2 text-xs font-outfit border transition-colors ${bookingType === "consultation" ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`}
                    data-testid="booking-type-consultation"
                  >
                    {t("booking.consultation")}
                  </button>
                  <button
                    onClick={() => setBookingType("tattoo")}
                    className={`py-2 text-xs font-outfit border transition-colors ${bookingType === "tattoo" ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`}
                    data-testid="booking-type-tattoo"
                  >
                    {t("booking.tattoo")}
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-4">
                <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">{t("booking.selectDate")}</label>
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {getDates().map(d => (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`flex-shrink-0 w-12 py-2 text-xs font-outfit border transition-colors ${selectedDate === d ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`}
                      data-testid={`date-btn-${d}`}
                    >
                      <div>{new Date(d).toLocaleDateString("de-DE", { day: "2-digit" })}</div>
                      <div className="text-xs opacity-70">{new Date(d).toLocaleDateString("de-DE", { month: "short" })}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slots */}
              {selectedDate && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">{t("booking.selectSlot")}</label>
                  {slots.length === 0 ? (
                    <p className="text-sm text-gray-500 font-outfit">Keine freien Termine</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {slots.map(slot => (
                        <button
                          key={slot.slot_id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 text-xs font-outfit border transition-colors ${selectedSlot?.slot_id === slot.slot_id ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`}
                          data-testid={`slot-btn-${slot.slot_id}`}
                        >
                          {slot.start_time} - {slot.end_time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedSlot && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">{t("booking.notes")}</label>
                  <textarea
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit resize-none"
                    placeholder="Beschreibe dein Tattoo-Motiv..."
                    data-testid="booking-notes"
                  />
                </div>
              )}

              {/* Reference Images Upload */}
              {selectedSlot && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">{t("booking.refImages")}</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {refImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt="" className="w-14 h-14 object-cover border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => setRefImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                    {refImages.length < 5 && (
                      <label className={`w-14 h-14 border-2 border-dashed border-gray-300 hover:border-black flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadingRef ? "opacity-50" : ""}`}>
                        <ImagePlus size={16} className="text-gray-400" />
                        <span className="text-xs text-gray-400 font-outfit">{uploadingRef ? "..." : "+"}</span>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          onChange={handleRefImageUpload}
                          disabled={uploadingRef}
                          className="hidden"
                          data-testid="ref-image-input"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-outfit">Max. 5 Bilder</p>
                </div>
              )}

              <div className="text-xs text-gray-500 font-outfit mb-4">
                {t("booking.deposit")}: <span className="font-bold text-black">€50</span>
              </div>

              {bookingSuccess ? (
                <div className="bg-green-50 border border-green-200 p-4 text-center" data-testid="booking-success">
                  <p className="text-green-700 font-outfit font-semibold text-sm mb-1">{t("booking.success")}</p>
                  <p className="text-xs text-green-600 font-outfit">Buchungs-ID: {bookingSuccess.booking_id}</p>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="mt-3 w-full py-2 bg-black text-white text-xs font-outfit"
                  >
                    Zum Dashboard
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleBook}
                  disabled={!selectedSlot || bookingLoading}
                  className="w-full py-3 bg-black text-white font-outfit font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40"
                  data-testid="confirm-booking-btn"
                >
                  {bookingLoading ? t("common.loading") : t("booking.confirm")}
                </button>
              )}

              {/* Contact Studio */}
              {user && (
                <button
                  onClick={() => navigate(`/messages/${studio.owner_id}`)}
                  className="w-full mt-3 py-2.5 border border-gray-300 hover:border-black text-sm font-outfit flex items-center justify-center gap-2 transition-colors"
                  data-testid="contact-studio-btn"
                >
                  <MessageSquare size={14} /> Studio kontaktieren
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
