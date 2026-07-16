import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Lottie from "lottie-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GuestBookingModal from "../components/GuestBookingModal";
import { Star, MapPin, Phone, Mail, Globe, CheckCircle, X, ImagePlus, MessageSquare, Palette, Calendar, Clock, ChevronLeft, ChevronRight, Scissors, Instagram, LogIn, UserPlus, Images, Video, Maximize2, ZoomIn, Flag, Info, Bell, ShoppingBag, Package, Gift, Download, ExternalLink } from "lucide-react";
import PaymentModal from "../components/PaymentModal";
import WaitlistModal from "../components/WaitlistModal";
import { motion, AnimatePresence } from "framer-motion";
import ProfileCard from "../components/ProfileCard";
import CircularGallery from "../components/CircularGallery/CircularGallery";
import GradualBlur from "../components/GradualBlur/GradualBlur";
import StudioMap from "../components/StudioMap";
import { notify } from "../components/InkNotify";
import { getStudioCache, setStudioCache, fetchStudio } from "../utils/studiosCache";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SIZE_COST = { mini: 1, small: 2, medium: 3, large: 5, xl: 8 };
const DAY_CAPACITY = 8;
const SIZES = [
  { id: "mini",   label: "Mini",   desc: "Schriftzug, Symbol, Fineline",   cost: 1 },
  { id: "small",  label: "Small",  desc: "bis ca. 5 cm",                   cost: 2 },
  { id: "medium", label: "Medium", desc: "bis ca. 10 cm",                  cost: 3 },
  { id: "large",  label: "Large",  desc: "Unterarm, Schulter",             cost: 5 },
  { id: "xl",     label: "XL",     desc: "Rücken, Sleeve, großes Projekt", cost: 8 },
];

const formatDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
};

/* ── Lightbox (professional) ────────────────────────── */
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

function Lightbox({ imgs, idx, onClose, onPrev, onNext, onJump }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && imgs.length > 1) onPrev();
      if (e.key === "ArrowRight" && imgs.length > 1) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imgs, onClose, onPrev, onNext]);

  const dragDir = useRef(0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
        style={{ background: "#000" }}
        onClick={onClose}
      >
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-20">
          <X size={18} strokeWidth={1.5} />
        </button>

        {/* Counter */}
        {imgs.length > 1 && (
          <p className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-white/40 font-inter tracking-widest z-20">
            {idx + 1} / {imgs.length}
          </p>
        )}

        {/* Main Image with slide animation */}
        <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden px-16">
          <AnimatePresence initial={false} custom={dragDir.current}>
            <motion.img
              key={idx}
              src={imgs[idx]}
              custom={dragDir.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.8 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(e, info) => {
                if (info.offset.x < -60 && imgs.length > 1) { dragDir.current = 1; onNext(); }
                else if (info.offset.x > 60 && imgs.length > 1) { dragDir.current = -1; onPrev(); }
              }}
              className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl cursor-grab active:cursor-grabbing select-none"
              style={{ position: "absolute" }}
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          </AnimatePresence>
        </div>

        {/* Prev / Next Arrows */}
        {imgs.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); dragDir.current = -1; onPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110">
              <ChevronLeft size={22} strokeWidth={1.5} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); dragDir.current = 1; onNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110">
              <ChevronRight size={22} strokeWidth={1.5} />
            </button>
          </>
        )}

        {/* Thumbnail Strip */}
        {imgs.length > 1 && (
          <div
            className="w-full flex-shrink-0 pb-6 pt-4 flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-2.5 overflow-x-auto px-6 max-w-3xl">
              {imgs.map((img, i) => (
                <motion.button
                  key={i}
                  onClick={() => { dragDir.current = i > idx ? 1 : -1; onJump(i); }}
                  whileTap={{ scale: 0.93 }}
                  className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden transition-all duration-200 ${i === idx ? "ring-2 ring-white scale-105 opacity-100" : "opacity-35 hover:opacity-65"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Artist Detail Modal ────────────────────────────── */
/* ── Portfolio Slider ───────────────────────────────── */
function PortfolioSlider({ images, onOpenLightbox }) {
  const [current, setCurrent] = useState(0);
  const dragDir = useRef(0);
  const thumbsRef = useRef(null);

  const go = (idx) => {
    dragDir.current = idx > current ? 1 : -1;
    setCurrent(idx);
    // Scroll thumbnail into view
    if (thumbsRef.current) {
      const btn = thumbsRef.current.children[idx];
      btn?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
    }
  };
  const prev = () => go((current - 1 + images.length) % images.length);
  const next = () => go((current + 1) % images.length);

  return (
    <div className="select-none">
      {/* ── Main Stage ─────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-zinc-950 group" style={{ height: 300 }}>
        <AnimatePresence initial={false} custom={dragDir.current}>
          <motion.img
            key={current}
            src={images[current]}
            custom={dragDir.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 360, damping: 36, mass: 0.75 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50) { dragDir.current = 1; next(); }
              else if (info.offset.x > 50) { dragDir.current = -1; prev(); }
            }}
            className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
            draggable={false}
          />
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/65 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/65 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </motion.button>
          </>
        )}

        {/* Lightbox expand */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onOpenLightbox(images, current)}
          className="absolute bottom-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/65 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
          data-testid="portfolio-expand-btn"
        >
          <Maximize2 size={13} strokeWidth={2} />
        </motion.button>

        {/* Counter pill */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
            <span className="text-white/80 text-[11px] font-inter tabular-nums">{current + 1} / {images.length}</span>
          </div>
        )}

        {/* Progress dots (max 8) */}
        {images.length > 1 && images.length <= 12 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                className={`transition-all duration-300 rounded-full ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Thumbnail Strip ─────────────────────────── */}
      {images.length > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-2 mt-3 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {images.map((img, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.94 }}
              onClick={() => go(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all duration-200 ${i === current ? "ring-2 ring-zinc-900 opacity-100 scale-[1.04]" : "opacity-45 hover:opacity-75 hover:scale-[1.02]"}`}
              data-testid={`thumb-${i}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function ArtistModal({ artist, lottieData, onClose, onOpenLightbox }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          data-testid="artist-modal"
        >
          {/* Header - banner or portfolio strip */}
          <div className="h-52 sm:h-64 bg-zinc-100 relative overflow-hidden rounded-t-3xl flex-shrink-0">
            {artist.banner_image ? (
              <img src={artist.banner_image} alt="" className="w-full h-full object-cover" />
            ) : artist.portfolio_images?.length > 0 ? (
              <div className="flex gap-0.5 h-full">
                {artist.portfolio_images.slice(0, 4).map((img, i) => (
                  <img key={i} src={img} alt="" className="h-full object-cover"
                    style={{ flex: i === 0 ? 2.5 : 1 }} />
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Palette size={40} className="text-zinc-300" strokeWidth={1} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {/* Close button */}
            <button onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
              data-testid="artist-modal-close">
              <X size={16} strokeWidth={2} />
            </button>
            {/* Name overlay */}
            <div className="absolute bottom-4 left-5 flex items-end gap-3">
              {artist.profile_image ? (
                <img src={artist.profile_image} alt={artist.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 shadow-xl flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-playfair font-bold text-2xl border-2 border-white/20 flex-shrink-0">
                  {artist.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-playfair font-bold text-2xl text-white leading-tight">{artist.name}</h2>
                {artist.experience_years > 0 && (
                  <p className="text-white/70 text-sm font-inter">{artist.experience_years} Jahre Erfahrung</p>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Bio */}
            {artist.bio && (
              <div>
                <p className="text-xs font-inter font-semibold tracking-[0.18em] uppercase text-zinc-400 mb-2">Über mich</p>
                <p className="text-sm text-zinc-600 font-inter leading-relaxed">{artist.bio}</p>
              </div>
            )}

            {/* Styles */}
            {artist.styles?.length > 0 && (
              <div>
                <p className="text-xs font-inter font-semibold tracking-[0.18em] uppercase text-zinc-400 mb-2.5">Stile</p>
                <div className="flex flex-wrap gap-2">
                  {artist.styles.map(s => (
                    <span key={s} className="text-sm px-3 py-1.5 bg-zinc-100 text-zinc-700 font-inter rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio – Professional Slider */}
            {artist.portfolio_images?.length > 0 && (
              <div>
                <p className="text-xs font-inter font-semibold tracking-[0.18em] uppercase text-zinc-400 mb-3">
                  Portfolio · {artist.portfolio_images.length} {artist.portfolio_images.length === 1 ? "Bild" : "Bilder"}
                </p>
                <PortfolioSlider
                  images={artist.portfolio_images}
                  onOpenLightbox={onOpenLightbox}
                />
              </div>
            )}

            {/* Instagram */}
            {artist.instagram && (
              <div className="pt-1">
                <a
                  href={`https://instagram.com/${artist.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition-all text-sm font-inter font-medium group"
                  data-testid="modal-instagram-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Instagram size={14} strokeWidth={1.5} className="group-hover:text-pink-500 transition-colors" />
                  @{artist.instagram.replace(/^@/, "")}
                </a>
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function StudioPage() {
  const { studioId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingRef = useRef(null);
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
  const [lottieData, setLottieData] = useState(null);
  const [igActive, setIgActive] = useState(null); // artist_id currently showing instagram popup
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { imgs: [], idx: 0 }
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  // Review reporting
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState(new Set());

  // Shop
  const [shopProducts, setShopProducts] = useState([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopSession, setShopSession] = useState(null); // PaymentModal session object
  const [shopCheckoutLoading, setShopCheckoutLoading] = useState({}); // { productId: bool }
  const [shopOrderResult, setShopOrderResult] = useState(null); // { type, voucher_code, download_token, product_title }
  const [shopGuestModal, setShopGuestModal] = useState(null); // product pending guest email
  const [shopGuestEmail, setShopGuestEmail] = useState("");
  const [shopGuestEmailError, setShopGuestEmailError] = useState("");
  const [shopConfirmRetry, setShopConfirmRetry] = useState(false);

  // Auto-scroll to booking sidebar when ?book=true
  useEffect(() => {
    if (new URLSearchParams(location.search).get("book") === "true" && bookingRef.current) {
      setTimeout(() => {
        bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 600);
    }
  }, [location.search, studio]);

  // Load lottie animation once (local file to avoid CORS)
  useEffect(() => {
    fetch("/lottie-instagram.json")
      .then(r => r.json()).then(setLottieData).catch(() => {});
  }, []);
  const [sizeCategory, setSizeCategory] = useState(null);
  const [bodyPart, setBodyPart] = useState("");
  const [preferredTimeFrom, setPreferredTimeFrom] = useState("");
  const [preferredTimeTo, setPreferredTimeTo] = useState("");
  const [capacityData, setCapacityData] = useState({});
  const [calVisibleUntil, setCalVisibleUntil] = useState(null);
  const [selectedCapArtist, setSelectedCapArtist] = useState(null); // null = no artist filter

  // Voucher code redemption
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherStatus, setVoucherStatus] = useState(null); // null | "checking" | "valid" | "invalid" | "used"
  const [voucherDiscount, setVoucherDiscount] = useState(null); // { amount_cents, product_title }
  const [voucherError, setVoucherError] = useState("");

  const today = new Date();
  const [calMonth, setCalMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });

  // Compute offer deadline label based on selected date (mirrors backend _calc_offer_deadline)
  const offerDeadlineLabel = useMemo(() => {
    if (!selectedDate) return null;
    const now = new Date();
    const appt = new Date(selectedDate + "T12:00:00");
    const diffMs = appt - now;
    const diffH = diffMs / 3600000;
    if (diffH < 24) return "30 Minuten";
    if (diffH < 7 * 24) return "2 Stunden";
    return "24 Stunden";
  }, [selectedDate]);
  const [availableDates, setAvailableDates] = useState(new Set());

  // Calendar helpers
  const getCalendarDays = () => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Monday-first: getDay() 0=Sun -> shift
    const startDow = (firstDay.getDay() + 6) % 7;
    const days = [];
    // Leading empty cells
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };
  const toISO = (d) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : "";
  const todayISO = toISO(today);
  const calDays = getCalendarDays();
  const monthLabel = new Date(calMonth.year, calMonth.month, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const prevMonth = () => setCalMonth(m => {
    const d = new Date(m.year, m.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setCalMonth(m => {
    const d = new Date(m.year, m.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Fetch available dates (for consultation/slot flow)
  useEffect(() => {
    if (!studioId || bookingType === "tattoo") return;
    axios.get(`${API}/studios/${studioId}/available-dates`, {
      params: { year: calMonth.year, month: calMonth.month + 1, slot_type: bookingType }
    }).then(({ data }) => {
      setAvailableDates(new Set(data.available_dates));
    }).catch(() => {});
  }, [studioId, calMonth, bookingType]);

  // Fetch capacity calendar (for tattoo flow)
  useEffect(() => {
    if (!studioId || bookingType !== "tattoo") return;
    const params = { year: calMonth.year, month: calMonth.month + 1 };
    if (selectedCapArtist) params.artist_id = selectedCapArtist;
    axios.get(`${API}/studios/${studioId}/capacity-calendar`, { params })
      .then(({ data }) => {
        setCapacityData(data.dates || {});
        setCalVisibleUntil(data.slots_visible_until || null);
      })
      .catch(() => {});
  }, [studioId, calMonth, bookingType, selectedCapArtist]);

  useEffect(() => {
    const applyData = (cached) => {
      setStudio(cached.studio);
      setReviews(cached.reviews);
      setArtists(cached.artists);
      setShopProducts(cached.shop || []);
      if ((cached.artists || []).length > 1) setSelectedCapArtist(cached.artists[0].artist_id);
      if (window.posthog) {
        window.posthog.capture("studio_viewed", {
          studio_id: cached.studio.studio_id,
          studio_name: cached.studio.name,
          city: cached.studio.city,
          avg_rating: cached.studio.avg_rating,
        });
      }
    };

    const hit = getStudioCache(studioId);
    if (hit) {
      // Instant display from cache
      applyData(hit);
      setLoading(false);
      // Silent background refresh
      fetchStudio(studioId).then((fresh) => {
        if (fresh) { setStudioCache(studioId, fresh); applyData(fresh); }
      }).catch(() => {});
      return;
    }

    // No cache — show spinner while fetching
    setLoading(true);
    fetchStudio(studioId)
      .then((data) => {
        if (!data) { navigate("/"); return; }
        setStudioCache(studioId, data);
        applyData(data);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
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

  const handleVoucherValidate = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    setVoucherStatus("checking");
    setVoucherError("");
    setVoucherDiscount(null);
    try {
      const { data } = await axios.post(`${API}/shop/vouchers/validate`, { voucher_code: code, studio_id: studioId });
      setVoucherStatus("valid");
      setVoucherDiscount({ amount_cents: data.amount_cents, product_title: data.product_title });
    } catch (e) {
      const detail = e.response?.data?.detail || "";
      if (detail.includes("eingelöst")) {
        setVoucherStatus("used");
        setVoucherError("Dieser Gutschein wurde bereits eingelöst.");
      } else {
        setVoucherStatus("invalid");
        setVoucherError("Ungültiger Gutschein-Code.");
      }
      setVoucherDiscount(null);
    }
  };

  const handleBook = async () => {
    if (!user) {
      if (window.posthog) window.posthog.capture("inquiry_started", { studio_id: studioId, studio_name: studio?.name, source: "guest_modal" });
      setShowGuestModal(true);
      return;
    }
    if (!selectedSlot) return;
    if (window.posthog) window.posthog.capture("inquiry_started", { studio_id: studioId, studio_name: studio?.name, source: "authenticated_slot" });
    setBookingLoading(true);
    try {
      const { data } = await axios.post(`${API}/bookings`, {
        studio_id: studioId, slot_id: selectedSlot.slot_id,
        booking_type: bookingType, notes: bookingNotes, reference_images: refImages,
        voucher_code: voucherStatus === "valid" ? voucherCode.trim().toUpperCase() : null,
      }, { withCredentials: true });
      setBookingSuccess(data);
      if (window.posthog) window.posthog.capture("booking_confirmed", { studio_id: studioId, studio_name: studio?.name, booking_type: bookingType });
    } catch (e) { notify.error(e.response?.data?.detail || "Buchung fehlgeschlagen"); } finally { setBookingLoading(false); }
  };

  const handleCapacityBook = async () => {
    if (!user) {
      if (window.posthog) window.posthog.capture("inquiry_started", { studio_id: studioId, studio_name: studio?.name, source: "guest_modal" });
      setShowGuestModal(true);
      return;
    }
    if (!selectedDate || !sizeCategory) return;
    if (window.posthog) window.posthog.capture("inquiry_started", { studio_id: studioId, studio_name: studio?.name, source: "authenticated_capacity" });
    setBookingLoading(true);
    try {
      const { data } = await axios.post(`${API}/bookings/capacity`, {
        studio_id: studioId,
        date: selectedDate,
        size_category: sizeCategory,
        body_part: bodyPart,
        booking_type: bookingType,
        notes: bookingNotes,
        reference_images: refImages,
        preferred_time_from: preferredTimeFrom,
        preferred_time_to: preferredTimeTo,
        artist_id: selectedCapArtist || null,
        artist_name: selectedCapArtist ? (artists.find(a => a.artist_id === selectedCapArtist)?.name || "") : "",
        voucher_code: voucherStatus === "valid" ? voucherCode.trim().toUpperCase() : null,
      }, { withCredentials: true });
      setBookingSuccess(data);
      if (window.posthog) window.posthog.capture("booking_confirmed", { studio_id: studioId, studio_name: studio?.name, booking_type: bookingType, size_category: sizeCategory });
    } catch (e) {
      notify.error(e.response?.data?.detail || "Anfrage fehlgeschlagen");
    } finally { setBookingLoading(false); }
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

  const submitReviewReport = async () => {
    if (!reportingReviewId || !reportReason.trim()) return;
    setReportSubmitting(true);
    try {
      await axios.post(`${API}/reports`, {
        target_type: "review",
        target_id: reportingReviewId,
        reason: reportReason.trim(),
      }, { withCredentials: true });
      setReportedIds(prev => new Set([...prev, reportingReviewId]));
      setReportingReviewId(null);
      setReportReason("");
    } catch (e) {
      notify.error(e.response?.data?.detail || "Meldung fehlgeschlagen");
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <svg className="animate-spin" width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="22" stroke="#e4e4e7" strokeWidth="3" />
            <path d="M26 4a22 22 0 0 1 22 22" stroke="#18181b" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="absolute font-playfair font-semibold text-zinc-900 text-[11px] tracking-tight select-none">OS</span>
        </div>
        <p className="text-sm font-inter text-zinc-400">Studio wird geladen…</p>
      </div>
    </div>
  );
  if (!studio) return null;

  const _doShopCheckout = async (product, guestEmail) => {
    setShopCheckoutLoading(prev => ({ ...prev, [product.product_id]: true }));
    try {
      const payload = { product_id: product.product_id, studio_id: studioId };
      if (guestEmail) payload.guest_email = guestEmail;
      const { data } = await axios.post(`${API}/shop/checkout`, payload, { withCredentials: true });
      setShopSession({
        ...data,
        session_id: data.order_id,
        client_secret: data.client_secret,
        amount: data.amount,
        studio_name: data.studio_name,
      });
    } catch (e) {
      notify.error(e.response?.data?.detail || "Checkout fehlgeschlagen.");
    } finally {
      setShopCheckoutLoading(prev => ({ ...prev, [product.product_id]: false }));
    }
  };

  const handleShopCheckout = async (product) => {
    if (!user) {
      setShopGuestModal(product);
      setShopGuestEmail("");
      setShopGuestEmailError("");
      return;
    }
    await _doShopCheckout(product, null);
  };

  const handleShopGuestSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shopGuestEmail)) {
      setShopGuestEmailError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    const product = shopGuestModal;
    setShopGuestModal(null);
    await _doShopCheckout(product, shopGuestEmail);
  };

  const handleShopPaymentSuccess = async () => {
    if (!shopSession) return;
    setShopConfirmRetry(false);
    try {
      const { data } = await axios.post(`${API}/shop/confirm/${shopSession.session_id}`, {}, { withCredentials: true });
      setShopOrderResult({
        type: data.product_type,
        voucher_code: data.voucher_code,
        download_token: data.download_token,
        product_title: data.product_title,
      });
      setShopSession(null);
    } catch (e) {
      setShopConfirmRetry(true);
      notify.error("Bestellung konnte nicht bestätigt werden – bitte versuche es erneut oder kontaktiere das Studio.");
    }
  };

  const TABS = [
    { id: "about", label: t("studio.about") },
    { id: "artists", label: `Artists (${artists.length})` },
    { id: "reviews", label: `${t("studio.reviews")} (${reviews.length})` },
    ...(shopProducts.length > 0 ? [{ id: "shop", label: `Shop (${shopProducts.length})` }] : []),
  ];

  const allImages = [
    ...(studio.banner_image ? [studio.banner_image] : []),
    ...(studio.images || []),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pb-8">
        {/* ── Title section ── */}
        <div className="pt-8 pb-5">
          <h1 className="text-3xl font-playfair font-bold text-zinc-900 mb-3">{studio.name}</h1>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-sm">
            {studio.avg_rating > 0 && (
              <div className="flex items-center gap-1.5">
                <Star size={13} className="fill-zinc-900 text-zinc-900" />
                <span className="font-semibold text-zinc-900">{studio.avg_rating?.toFixed(2)}</span>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-700 font-semibold underline underline-offset-2 cursor-pointer" onClick={() => setActiveTab("reviews")}>
                  {studio.review_count} Bewertungen
                </span>
              </div>
            )}
            {studio.is_verified && (
              <>
                <span className="text-zinc-200">|</span>
                <span className="flex items-center gap-1 text-zinc-600 font-semibold">
                  <CheckCircle size={13} className="text-zinc-700" /> Verifiziertes Studio
                </span>
              </>
            )}
            <span className="text-zinc-200">|</span>
            <span className="flex items-center gap-1 text-zinc-500">
              <MapPin size={13} /> {studio.city}
            </span>
          </div>
          {studio.styles?.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {studio.styles.map(s => (
                <span key={s} className="border border-zinc-200 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Banner + Profile pic ── */}
        <div className="relative mb-14">
          {/* Banner */}
          <div
            className="relative rounded-3xl overflow-hidden cursor-pointer"
            style={{ height: 340 }}
            onClick={() => allImages.length > 0 && setLightbox({ imgs: allImages, idx: 0 })}
          >
            {allImages[0] ? (
              <img
                src={allImages[0]}
                alt={studio.name}
                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <span className="text-zinc-700 text-[100px] font-playfair select-none">{studio.name?.[0]}</span>
              </div>
            )}
            {allImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox({ imgs: allImages, idx: 0 }); }}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-white transition-colors"
              >
                Alle Fotos · {allImages.length}
              </button>
            )}
          </div>
          {/* Profile / logo pic — overlaps bottom of banner */}
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-zinc-100">
              {studio.logo_image ? (
                <img src={studio.logo_image} alt={studio.name} className="w-full h-full object-cover" />
              ) : allImages[0] ? (
                <img src={allImages[0]} alt={studio.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                  <span className="text-white text-2xl font-playfair">{studio.name?.[0]}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-14">
        <div>
            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_8px_rgb(0,0,0,0.04)] p-1.5 w-fit max-w-full overflow-x-auto">
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

                    {/* Map */}
                    {(studio.address || studio.city) && (
                      <div className="pt-1">
                        <StudioMap
                          address={studio.address}
                          city={studio.city}
                          studioName={studio.name}
                          hidden={!!(lightbox || showGuestModal || showWaitlistModal || selectedArtist || igActive || reportingReviewId)}
                        />
                      </div>
                    )}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {artists.map(artist => (
                        <div
                          key={artist.artist_id}
                          data-testid={`artist-profile-${artist.artist_id}`}
                          onClick={() => setSelectedArtist(artist)}
                          style={{ cursor: 'pointer' }}
                        >
                          <ProfileCard
                            avatarUrl={artist.profile_image || artist.banner_image || (artist.portfolio_images?.[0] || '')}
                            miniAvatarUrl={artist.profile_image || ''}
                            name={artist.name || ''}
                            title={
                              artist.styles?.length > 0
                                ? artist.styles.slice(0, 3).join(' · ')
                                : 'Tattoo Artist'
                            }
                            handle={artist.instagram?.replace(/^@/, '') || ''}
                            status={
                              artist.experience_years > 0
                                ? `${artist.experience_years} Jahre Erfahrung`
                                : 'Verfügbar'
                            }
                            contactText="Profil öffnen"
                            onContactClick={() => setSelectedArtist(artist)}
                            behindGlowEnabled={true}
                            enableTilt={true}
                            showUserInfo={true}
                            className="inkbook-artist"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Shop */}
              {activeTab === "shop" && (
                <motion.div key="shop" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  {/* Order success banner */}
                  <AnimatePresence>
                    {shopOrderResult && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-start gap-3">
                          <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                          <div className="flex-1 min-w-0">
                            <p className="font-inter font-semibold text-emerald-800 mb-1">Bestellung erfolgreich! 🎉</p>
                            <p className="text-xs text-emerald-700 font-inter mb-3">{shopOrderResult.product_title}</p>
                            {shopOrderResult.type === "voucher" && shopOrderResult.voucher_code && (
                              <div className="bg-white rounded-xl p-4 border border-emerald-200 text-center">
                                <p className="text-[10px] font-inter text-emerald-600 uppercase tracking-widest mb-2">Dein Gutschein-Code</p>
                                <p className="font-mono font-black text-2xl text-zinc-900 tracking-widest">{shopOrderResult.voucher_code}</p>
                                <p className="text-[10px] text-zinc-400 font-inter mt-2">Zeige diesen Code beim Besuch vor. Der Code wurde auch per E-Mail gesendet.</p>
                              </div>
                            )}
                            {shopOrderResult.type === "flash" && shopOrderResult.download_token && (
                              <a href={`${process.env.REACT_APP_BACKEND_URL}/api/shop/download/${shopOrderResult.download_token}`}
                                target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-inter font-semibold rounded-xl hover:bg-zinc-700 transition-colors">
                                <Download size={14} strokeWidth={2} /> Flash-Design herunterladen
                              </a>
                            )}
                            {shopOrderResult.type === "aftercare" && (
                              <p className="text-xs text-emerald-700 font-inter">Eine Bestätigung wurde per E-Mail gesendet. Das Studio wird sich mit Details melden.</p>
                            )}
                          </div>
                          <button onClick={() => setShopOrderResult(null)} className="p-1 rounded-lg text-emerald-400 hover:text-emerald-700 transition-colors flex-shrink-0">
                            <X size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Product grid */}
                  {shopProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-black/[0.04] p-12 text-center">
                      <ShoppingBag size={28} className="text-zinc-300 mx-auto mb-3" strokeWidth={1} />
                      <p className="text-zinc-400 font-inter text-sm">Noch keine Produkte im Shop</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(() => {
                        const TYPE_LABELS = { flash: "Flash-Design", voucher: "Gutschein", aftercare: "Pflegeprodukt" };
                        const TYPE_COLORS = { flash: "bg-violet-50 text-violet-700 border-violet-200", voucher: "bg-emerald-50 text-emerald-700 border-emerald-200", aftercare: "bg-blue-50 text-blue-700 border-blue-200" };
                        return shopProducts.map(product => (
                          <div key={product.product_id} className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
                            {product.image_data && (
                              <div className="h-52 overflow-hidden bg-zinc-100 flex-shrink-0">
                                <img src={product.image_data} alt={product.title}
                                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500" />
                              </div>
                            )}
                            {!product.image_data && product.type === "flash" && (
                              <div className="h-32 bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                <Package size={32} className="text-zinc-300" strokeWidth={1} />
                              </div>
                            )}
                            {product.type === "voucher" && (
                              <div className="h-24 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center flex-shrink-0">
                                <Gift size={32} className="text-emerald-400" strokeWidth={1} />
                              </div>
                            )}
                            <div className="p-5 flex flex-col flex-1">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <span className={`inline-block text-[9px] font-inter font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border mb-1.5 ${TYPE_COLORS[product.type]}`}>
                                    {TYPE_LABELS[product.type]}
                                  </span>
                                  <h3 className="font-inter font-semibold text-sm text-zinc-900">{product.title}</h3>
                                </div>
                                <p className="font-playfair font-bold text-lg text-zinc-900 flex-shrink-0">€{(product.price_cents / 100).toFixed(2)}</p>
                              </div>
                              {product.description && (
                                <p className="text-xs text-zinc-500 font-inter leading-relaxed mb-4 flex-1">{product.description}</p>
                              )}
                              {product.stock !== null && product.stock !== undefined && (
                                <p className="text-[10px] text-zinc-400 font-inter mb-3">{product.stock} auf Lager</p>
                              )}
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => handleShopCheckout(product)}
                                disabled={shopCheckoutLoading[product.product_id] || (product.stock !== null && product.stock !== undefined && product.stock <= 0)}
                                className="w-full py-2.5 bg-zinc-900 text-white text-xs font-inter font-semibold rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                                {shopCheckoutLoading[product.product_id] ? (
                                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Lädt…</>
                                ) : product.stock === 0 ? "Ausverkauft" : (
                                  <><ShoppingBag size={13} strokeWidth={2} /> {user ? "Jetzt kaufen" : "Anmelden zum Kaufen"}</>
                                )}
                              </motion.button>
                            </div>
                          </div>
                        ));
                      })()}
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
                        <div className="flex items-center gap-3">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={13} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"} strokeWidth={1.5} />
                            ))}
                          </div>
                          {user && (
                            reportedIds.has(r.review_id)
                              ? <span className="text-[10px] text-zinc-400 font-inter">Gemeldet</span>
                              : <button
                                  onClick={() => { setReportingReviewId(r.review_id); setReportReason(""); }}
                                  className="p-1.5 rounded-lg text-zinc-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                                  title="Bewertung melden"
                                  data-testid={`report-review-btn-${r.review_id}`}
                                >
                                  <Flag size={13} strokeWidth={1.5} />
                                </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-zinc-600 font-inter leading-relaxed">{r.comment}</p>
                      <p className="text-xs text-zinc-400 font-inter mt-2">{new Date(r.created_at).toLocaleDateString("de-DE")}</p>

                      {/* Inline report form */}
                      <AnimatePresence>
                        {reportingReviewId === r.review_id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-zinc-100">
                              <p className="text-xs font-inter font-semibold text-zinc-700 mb-2">Grund der Meldung</p>
                              <textarea
                                value={reportReason}
                                onChange={e => setReportReason(e.target.value)}
                                placeholder="Beschreibe kurz, warum du diese Bewertung meldest..."
                                rows={2}
                                className="w-full text-xs font-inter text-zinc-700 border border-zinc-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-zinc-400 transition-colors"
                                data-testid="report-review-reason-input"
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={submitReviewReport}
                                  disabled={reportSubmitting || !reportReason.trim()}
                                  className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-inter font-medium hover:bg-zinc-700 transition-colors disabled:opacity-40"
                                  data-testid="report-review-submit-btn"
                                >
                                  {reportSubmitting ? "..." : "Melden"}
                                </button>
                                <button
                                  onClick={() => { setReportingReviewId(null); setReportReason(""); }}
                                  className="px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-lg text-xs font-inter hover:bg-zinc-50 transition-colors"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Booking Sidebar ── */}
          <div ref={bookingRef}>
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-7 md:sticky md:top-20">
              <h3 className="font-playfair font-semibold text-xl text-zinc-900 mb-5">{t("booking.title")}</h3>

              {/* ── Not logged in: guest inquiry prompt ── */}
              {!user ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-4">
                  {/* Progress indicator */}
                  <div className="flex items-center gap-1.5 mb-5">
                    {[
                      { n: 1, label: "Anfrage" },
                      { n: 2, label: "Preis" },
                      { n: 3, label: "Zahlen" },
                    ].map((s, i) => (
                      <React.Fragment key={s.n}>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center text-[9px] font-inter font-bold text-zinc-400">{s.n}</div>
                          <span className="text-[10px] text-zinc-400 font-inter">{s.label}</span>
                        </div>
                        {i < 2 && <div className="flex-1 h-px bg-zinc-200 min-w-[4px]" />}
                      </React.Fragment>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 font-inter leading-relaxed mb-4">
                    Sende eine Anfrage direkt an das Studio — ganz ohne Account.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowGuestModal(true)}
                    className="btn-primary w-full justify-center gap-2"
                    data-testid="guest-inquiry-btn"
                  >
                    <Calendar size={15} strokeWidth={1.5} /> Termin anfragen
                  </motion.button>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-px bg-zinc-100" />
                    <span className="text-[11px] text-zinc-400 font-inter">oder</span>
                    <div className="flex-1 h-px bg-zinc-100" />
                  </div>
                  <Link to="/login" data-testid="booking-login-btn"
                    className="flex items-center justify-center gap-2 w-full mt-3 py-2 border border-zinc-200 text-zinc-600 rounded-xl font-inter font-medium text-sm hover:border-zinc-400 transition-colors">
                    <LogIn size={14} strokeWidth={1.5} /> Anmelden
                  </Link>
                </motion.div>
              ) : (
              <>
              {/* ── Booking type ── */}
              <div className="mb-5">
                <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">{t("booking.selectType")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: "consultation", icon: <MessageSquare size={13} strokeWidth={1.5} />, label: "Beratung" },
                    { val: "tattoo", icon: <Scissors size={13} strokeWidth={1.5} />, label: "Tattoo" }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => { setBookingType(opt.val); setSelectedSlot(null); setSelectedDate(null); setSizeCategory(null); setBookingSuccess(null); }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-inter font-medium rounded-xl border transition-all ${bookingType === opt.val ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
                      data-testid={`booking-type-${opt.val}`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {bookingType === "tattoo" ? (<>
                {/* ── CAPACITY FLOW ── */}

                {/* Step 1: Size */}
                <div className="mb-5">
                  <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">Tattoo-Größe</p>
                  <div className="flex flex-col gap-1.5">
                    {SIZES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSizeCategory(s.id); setSelectedDate(null); setBookingSuccess(null); }}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all ${sizeCategory === s.id ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400 bg-white"}`}
                      >
                        <div className="flex flex-col">
                          <span className={`text-xs font-inter font-semibold ${sizeCategory === s.id ? "text-white" : "text-zinc-800"}`}>{s.label}</span>
                          <span className={`text-[10px] font-inter ${sizeCategory === s.id ? "text-zinc-300" : "text-zinc-400"}`}>{s.desc}</span>
                        </div>
                        <span className={`text-[10px] font-inter whitespace-nowrap ml-3 ${sizeCategory === s.id ? "text-zinc-300" : "text-zinc-400"}`}>{s.cost === 1 ? "1 Punkt" : `${s.cost} Punkte`}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Körperstelle */}
                {sizeCategory && (
                  <div className="mb-5">
                    <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">Körperstelle <span className="text-zinc-300 font-normal normal-case tracking-normal">(optional)</span></p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["Arm","Unterarm","Oberschenkel","Wade","Rücken","Brust","Nacken","Rippen","Hand","Knöchel","Schulter","Hüfte"].map(part => (
                        <button key={part} onClick={() => setBodyPart(p => p === part ? "" : part)}
                          className={`px-2 py-2 rounded-xl border text-xs font-inter font-medium transition-all ${bodyPart === part ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400 bg-white text-zinc-700"}`}
                        >{part}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2b: Artist selector — only when studio has multiple artists */}
                {sizeCategory && artists.length > 1 && (
                  <div className="mb-5">
                    <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">Artist wählen</p>
                    <div className="flex flex-col gap-1.5">
                      {artists.map(a => (
                        <button
                          key={a.artist_id}
                          onClick={() => { setSelectedCapArtist(a.artist_id); setSelectedDate(null); }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${selectedCapArtist === a.artist_id ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400 bg-white"}`}
                        >
                          {a.profile_image ? (
                            <img src={a.profile_image} alt={a.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${selectedCapArtist === a.artist_id ? "bg-zinc-700 text-white" : "bg-zinc-100 text-zinc-500"}`}>{(a.name||"?")[0]}</span>
                          )}
                          <div>
                            <p className={`text-xs font-inter font-semibold ${selectedCapArtist === a.artist_id ? "text-white" : "text-zinc-800"}`}>{a.name}</p>
                            {a.styles?.length > 0 && (
                              <p className={`text-[10px] font-inter ${selectedCapArtist === a.artist_id ? "text-zinc-300" : "text-zinc-400"}`}>{a.styles.slice(0,3).join(" · ")}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Calendar (shown after size + artist selected, or only one artist) */}
                {sizeCategory && (artists.length <= 1 || selectedCapArtist) && (
                  <div className="mb-5">
                    <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-3 flex items-center gap-1.5"><Calendar size={11} strokeWidth={1.5} /> Wunschdatum
                      {selectedCapArtist && (() => { const a = artists.find(x => x.artist_id === selectedCapArtist); return a ? <span className="ml-1 font-normal normal-case tracking-normal text-zinc-400">– {a.name}</span> : null; })()}
                    </p>
                    <div className="flex items-center gap-x-3 gap-y-1 mb-3 flex-wrap">
                      {[
                        {color:"bg-teal-400",  text:"text-teal-600",  label:"XL frei"},
                        {color:"bg-green-400", text:"text-green-600", label:"Large"},
                        {color:"bg-yellow-400",text:"text-yellow-600",label:"Medium"},
                        {color:"bg-amber-400", text:"text-amber-600", label:"Small"},
                        {color:"bg-orange-400",text:"text-orange-500",label:"Mini"},
                        {color:"bg-rose-400",  text:"text-rose-500",  label:"Ausgebucht"},
                        {color:"bg-violet-400",text:"text-violet-500",label:"Urlaub"},
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${l.color}`} />
                          <span className={`text-[10px] font-inter font-medium ${l.text}`}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={prevMonth} disabled={calMonth.year === today.getFullYear() && calMonth.month === today.getMonth()} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" data-testid="cal-prev-month"><ChevronLeft size={16} strokeWidth={2} /></button>
                      <span className="font-inter font-semibold text-sm text-zinc-800 capitalize">{monthLabel}</span>
                      <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors" data-testid="cal-next-month"><ChevronRight size={16} strokeWidth={2} /></button>
                    </div>
                    <div className="grid grid-cols-7 mb-1">
                      {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => <div key={d} className="text-center text-xs font-inter font-semibold text-zinc-400 py-1">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calDays.map((day, idx) => {
                        if (!day) return <div key={`e-${idx}`} />;
                        const iso = toISO(day);
                        const isPast = iso < todayISO;
                        const isToday = iso === todayISO;
                        const isSelected = iso === selectedDate;
                        const capDay = capacityData[iso];
                        const cost = SIZE_COST[sizeCategory] || 1;
                        const remaining = capDay ? capDay.remaining : (isPast ? 0 : DAY_CAPACITY);
                        const isVacation = !isPast && capDay && capDay.status === "vacation";
                        const isNotAvailableYet = !isPast && calVisibleUntil && iso > calVisibleUntil;
                        const canFit = !isPast && !isVacation && !isNotAvailableYet && remaining >= cost;
                        // Dot/number colour = largest size that still fits: XL(8)→teal, Large(5)→green, Medium(3)→yellow, Small(2)→amber, Mini(1)→orange, full→rose
                        const capColor = isVacation ? { dot: "bg-violet-400", num: "text-violet-500" }
                          : isNotAvailableYet ? { dot: "bg-zinc-300", num: "text-zinc-400" }
                          : remaining >= 8 ? { dot: "bg-teal-400",   num: "text-teal-600"   }
                          : remaining >= 5 ? { dot: "bg-green-400",  num: "text-green-600"  }
                          : remaining >= 3 ? { dot: "bg-yellow-400", num: "text-yellow-600" }
                          : remaining >= 2 ? { dot: "bg-amber-400",  num: "text-amber-600"  }
                          : remaining >= 1 ? { dot: "bg-orange-400", num: "text-orange-500" }
                          :                  { dot: "bg-rose-400",   num: "text-rose-500"   };
                        const dotColor = isSelected ? "bg-white/60" : capColor.dot;
                        const numColor = isSelected ? "" : isPast ? "text-zinc-300" : capColor.num;
                        const noteTitle = isNotAvailableYet ? "Bald verfügbar" : isVacation ? "Urlaub / geschlossen" : (capDay?.note || null);
                        return (
                          <div key={iso} className="relative group">
                            <button disabled={isPast || isVacation || isNotAvailableYet}
                              onClick={() => { setSelectedDate(iso); setBookingSuccess(null); }}
                              className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-inter font-medium transition-all ${isPast || isVacation || isNotAvailableYet ? "text-zinc-300 cursor-not-allowed" : "hover:bg-zinc-100"} ${isVacation ? "bg-violet-50" : ""} ${isNotAvailableYet ? "bg-zinc-50 border border-dashed border-zinc-200" : ""} ${isSelected && canFit ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" : ""} ${isSelected && !canFit ? "bg-rose-100 text-rose-700 ring-2 ring-rose-300" : ""} ${isToday && !isSelected ? "ring-2 ring-zinc-900 ring-offset-1 text-zinc-900 font-bold" : ""} ${!isSelected && !isPast && canFit && !isToday ? "text-zinc-700" : ""} ${!isSelected && !isPast && !canFit && !isVacation && !isNotAvailableYet ? "text-rose-400" : ""}`}
                              data-testid={`date-btn-${iso}`}
                            >
                              <span className={numColor}>{day.getDate()}</span>
                              {!isPast && !isNotAvailableYet && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors ${dotColor}`} />}
                              {!isPast && isNotAvailableYet && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-inter text-zinc-400 leading-none">bald</span>}
                            </button>
                            {noteTitle && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out w-max max-w-[140px]">
                                <div className="bg-zinc-900 text-white text-[10px] font-inter rounded-xl px-3 py-2 shadow-xl leading-snug text-center whitespace-normal">
                                  {noteTitle}
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-900" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Day info */}
                <AnimatePresence>
                  {selectedDate && sizeCategory && (() => {
                    const capDay = capacityData[selectedDate];
                    const remaining = capDay ? capDay.remaining : DAY_CAPACITY;
                    const isVacDay = capDay && capDay.status === "vacation";
                    const selCostCheck = SIZE_COST[sizeCategory] || 1;
                    if (!isVacDay && remaining < selCostCheck) return null; // day full — hide info, show waitlist below
                    let bg = "bg-emerald-50 border-emerald-100 text-emerald-800";
                    let msg = "Dieser Tag ist gut verfügbar – auch große Tattoos möglich.";
                    let hint = "";
                    if (isVacDay) {
                      bg = "bg-orange-50 border-orange-100 text-orange-800";
                      msg = "Das Studio ist an diesem Tag geschlossen (Urlaub).";
                      hint = "Bitte wähle einen anderen Termin.";
                    } else if (remaining >= 5) {
                      msg = "Dieser Tag ist gut verfügbar – auch große Tattoos möglich.";
                    } else if (remaining >= 3) {
                      bg = "bg-amber-50 border-amber-100 text-amber-800";
                      msg = "An diesem Tag ist noch begrenzte Kapazität frei.";
                      hint = "Für sehr große Projekte nicht mehr geeignet.";
                    } else {
                      bg = "bg-blue-50 border-blue-100 text-blue-800";
                      msg = "Nur noch wenig Kapazität – ideal für kleine Tattoos.";
                      hint = "Größere Tattoos sind an diesem Tag nicht mehr möglich.";
                    }
                    return (
                      <motion.div key={selectedDate} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`mb-4 p-3.5 rounded-xl border text-xs font-inter leading-relaxed overflow-hidden ${bg}`}>
                        <p className="font-semibold mb-0.5">{msg}</p>
                        {hint && <p className="opacity-70 mb-0.5">{hint}</p>}
                        {!isVacDay && <p className="opacity-60 text-[10px] mt-1">Die genaue Uhrzeit wird nach Prüfung durch das Studio bestätigt.</p>}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                {/* Step 4: Time preference + Notes + ref images — hidden when day is full */}
                <AnimatePresence>
                  {selectedDate && sizeCategory && (() => {
                    const capDayCheck = capacityData[selectedDate];
                    const remCheck = capDayCheck ? capDayCheck.remaining : DAY_CAPACITY;
                    const isVacCheck = capDayCheck && capDayCheck.status === "vacation";
                    if (!isVacCheck && remCheck < (SIZE_COST[sizeCategory] || 1)) return null;
                    return true;
                  })() && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mb-4">
                        <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
                          <Clock size={11} strokeWidth={1.5} /> Wunschzeit (optional)
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] text-zinc-400 font-inter mb-1">Von</label>
                            <input type="time" value={preferredTimeFrom} onChange={e => setPreferredTimeFrom(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all"
                              data-testid="preferred-time-from" />
                          </div>
                          <span className="text-zinc-400 font-inter text-sm mt-4">–</span>
                          <div className="flex-1">
                            <label className="block text-[10px] text-zinc-400 font-inter mb-1">Bis</label>
                            <input type="time" value={preferredTimeTo} onChange={e => setPreferredTimeTo(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 focus:outline-none focus:border-zinc-400 transition-all"
                              data-testid="preferred-time-to" />
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-inter mt-1.5">Die genaue Uhrzeit bestätigt das Studio – deine Angabe hilft bei der Planung.</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2">{t("booking.notes")}</p>
                        <textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} rows={3}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100 resize-none transition-all"
                          placeholder="Beschreibe dein Tattoo-Motiv, Stil, Körperstelle..." data-testid="booking-notes" />
                      </div>
                      <div className="mb-5">
                        <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2">{t("booking.refImages")}</p>
                        <div className="flex flex-wrap gap-2">
                          {refImages.map((img, i) => (
                            <div key={i} className="relative group">
                              <img src={img} alt="" className="w-14 h-14 object-cover rounded-xl border border-zinc-200" />
                              <button type="button" onClick={() => setRefImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={8} /></button>
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {studio?.deposit_required && selectedDate && (() => {
                  const capDayDep = capacityData[selectedDate];
                  const remDep = capDayDep ? capDayDep.remaining : DAY_CAPACITY;
                  const isVacDep = capDayDep && capDayDep.status === "vacation";
                  return isVacDep || remDep >= (SIZE_COST[sizeCategory] || 1);
                })() && (
                  <div className="text-xs text-zinc-400 font-inter mb-3 flex items-center gap-1.5">
                    <span>Das Studio legt die Anzahlung im Angebot fest.</span>
                  </div>
                )}

                {selectedDate && offerDeadlineLabel && (() => {
                  const capDayOffer = capacityData[selectedDate];
                  const remOffer = capDayOffer ? capDayOffer.remaining : DAY_CAPACITY;
                  const isVacOffer = capDayOffer && capDayOffer.status === "vacation";
                  return isVacOffer || remOffer >= (SIZE_COST[sizeCategory] || 1);
                })() && (
                  <div className="text-xs font-inter mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <span className="text-amber-600 flex-shrink-0 mt-0.5">⏳</span>
                    <span className="text-amber-800">Nach Angebotseingang hast du <strong>{offerDeadlineLabel}</strong> Zeit, um das Angebot anzunehmen und die Anzahlung zu leisten.</span>
                  </div>
                )}

                {studio?.cancellation_hours && (() => {
                  const capDayCan = capacityData[selectedDate];
                  const remCan = capDayCan ? capDayCan.remaining : DAY_CAPACITY;
                  const isVacCan = capDayCan && capDayCan.status === "vacation";
                  return !selectedDate || isVacCan || remCan >= (SIZE_COST[sizeCategory] || 1);
                })() && (
                  <div className="text-xs text-zinc-500 font-inter mb-4 flex items-start gap-2 bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2.5">
                    <Info size={11} className="text-zinc-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <span><strong className="text-zinc-700">Stornierungsbedingung:</strong> Kostenlose Stornierung bis {studio.cancellation_hours >= 24 ? `${studio.cancellation_hours / 24} Tag${studio.cancellation_hours >= 48 ? "e" : ""}` : `${studio.cancellation_hours} Stunden`} vor dem Termin. Danach wird die Anzahlung einbehalten.</span>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2">Gutschein-Code (optional)</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherStatus(null); setVoucherDiscount(null); setVoucherError(""); }}
                      placeholder="XXXX-XXXX-XXXX"
                      className={`flex-1 px-3.5 py-2.5 bg-zinc-50 border rounded-xl text-sm font-mono text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white transition-all ${voucherStatus === "valid" ? "border-emerald-400 focus:border-emerald-500" : voucherStatus === "invalid" || voucherStatus === "used" ? "border-rose-400 focus:border-rose-500" : "border-zinc-200 focus:border-zinc-400"}`}
                    />
                    <button
                      type="button"
                      onClick={handleVoucherValidate}
                      disabled={!voucherCode.trim() || voucherStatus === "checking"}
                      className="px-3.5 py-2.5 bg-zinc-900 text-white text-xs font-inter font-semibold rounded-xl hover:bg-zinc-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      {voucherStatus === "checking" ? "…" : "Prüfen"}
                    </button>
                  </div>
                  {voucherStatus === "valid" && voucherDiscount && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-inter bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      <span className="text-emerald-600">✓</span>
                      <span>Gutschein gültig – <strong>€{(voucherDiscount.amount_cents / 100).toFixed(2)} Rabatt</strong> wird angewendet</span>
                    </div>
                  )}
                  {(voucherStatus === "invalid" || voucherStatus === "used") && (
                    <p className="mt-1.5 text-xs text-rose-600 font-inter">{voucherError}</p>
                  )}
                </div>

                {(() => {
                  const selCapDay = capacityData[selectedDate];
                  const selRemaining = selCapDay ? selCapDay.remaining : DAY_CAPACITY;
                  const selCost = SIZE_COST[sizeCategory] || 1;
                  const dayFull = selectedDate && sizeCategory && selRemaining < selCost && !(selCapDay?.status === "vacation");
                  if (bookingSuccess) return (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center" data-testid="booking-success">
                      <CheckCircle size={24} className="text-emerald-600 mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-emerald-800 font-inter font-semibold text-sm mb-1">Anfrage gesendet!</p>
                      <p className="text-xs text-emerald-600 font-inter mb-1">Das Studio erstellt dein Angebot – du hast dann <strong>{offerDeadlineLabel}</strong> Zeit zum Annehmen.</p>
                      <p className="text-xs text-zinc-400 font-inter">ID: {bookingSuccess.booking_id}</p>
                      <button onClick={() => navigate("/dashboard")} className="mt-3 w-full py-2 bg-zinc-900 text-white text-xs font-inter rounded-xl hover:bg-zinc-700 transition-colors">Zum Dashboard</button>
                    </motion.div>
                  );
                  if (dayFull) return (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
                        <p className="text-rose-700 font-inter font-semibold text-sm mb-1">Dieser Tag ist ausgebucht</p>
                        <p className="text-xs text-rose-500 font-inter">Für deine gewählte Größe ist an diesem Tag keine Kapazität mehr frei.</p>
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => { if (!user) { setShowGuestModal(true); return; } setShowWaitlistModal(true); }}
                        className="w-full py-3 rounded-xl border-2 border-zinc-900 text-zinc-900 text-sm font-inter font-semibold flex items-center justify-center gap-2 hover:bg-zinc-900 hover:text-white transition-all">
                        <Bell size={15} strokeWidth={1.5} />
                        Auf Warteliste setzen
                      </motion.button>
                      <p className="text-center text-[10px] text-zinc-400 font-inter">Du bekommst sofort eine E-Mail wenn Kapazität frei wird</p>
                    </motion.div>
                  );
                  return (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleCapacityBook}
                      disabled={!selectedDate || !sizeCategory || bookingLoading}
                      className="btn-primary w-full justify-center disabled:opacity-40" data-testid="confirm-booking-btn">
                      {bookingLoading ? t("common.loading") : "Termin anfragen"}
                    </motion.button>
                  );
                })()}
              </>) : (<>
                {/* ── CONSULTATION SLOT FLOW ── */}
                <div className="mb-5">
                  <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-3 flex items-center gap-1.5"><Calendar size={11} strokeWidth={1.5} /> {t("booking.selectDate")}</p>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={prevMonth} disabled={calMonth.year === today.getFullYear() && calMonth.month === today.getMonth()} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" data-testid="cal-prev-month"><ChevronLeft size={16} strokeWidth={2} /></button>
                    <span className="font-inter font-semibold text-sm text-zinc-800 capitalize">{monthLabel}</span>
                    <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors" data-testid="cal-next-month"><ChevronRight size={16} strokeWidth={2} /></button>
                  </div>
                  <div className="grid grid-cols-7 mb-1">
                    {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => <div key={d} className="text-center text-xs font-inter font-semibold text-zinc-400 py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calDays.map((day, idx) => {
                      if (!day) return <div key={`e-${idx}`} />;
                      const iso = toISO(day);
                      const isPast = iso < todayISO;
                      const isToday = iso === todayISO;
                      const isSelected = iso === selectedDate;
                      const hasSlots = availableDates.has(iso);
                      return (
                        <button key={iso} disabled={isPast}
                          onClick={() => { setSelectedDate(iso); setSelectedSlot(null); setBookingSuccess(null); }}
                          className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-inter font-medium transition-all ${isPast ? "text-zinc-300 cursor-not-allowed" : "hover:bg-zinc-100"} ${isSelected ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" : ""} ${isToday && !isSelected ? "ring-2 ring-zinc-900 ring-offset-1 text-zinc-900 font-bold" : ""} ${!isSelected && !isPast && !isToday ? "text-zinc-700" : ""}`}
                          data-testid={`date-btn-${iso}`}
                        >
                          <span>{day.getDate()}</span>
                          {!isPast && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? "bg-white/60" : hasSlots ? "bg-emerald-400" : "bg-zinc-200"}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div className="mb-5">
                    <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5 flex items-center gap-1.5"><Clock size={11} strokeWidth={1.5} /> {t("booking.selectSlot")}</p>
                    {slotsLoading ? (
                      <div className="grid grid-cols-2 gap-1.5">{[1,2].map(i => <div key={i} className="h-10 bg-zinc-100 rounded-xl animate-pulse" />)}</div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-zinc-400 font-inter py-2">Keine freien Termine für diesen Tag</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {slots.map(slot => (
                          <button key={slot.slot_id} onClick={() => { setSelectedSlot(slot); setBookingSuccess(null); }}
                            className={`py-2.5 text-xs font-inter font-medium rounded-xl border transition-all ${selectedSlot?.slot_id === slot.slot_id ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400 bg-white"}`}
                            data-testid={`slot-btn-${slot.slot_id}`}>
                            {slot.start_time} – {slot.end_time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {selectedSlot && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                      <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">{t("booking.notes")}</p>
                      <textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} rows={3}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100 resize-none transition-all"
                        placeholder="Beschreibe dein Tattoo-Motiv..." data-testid="booking-notes" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {selectedSlot && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                      <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">{t("booking.refImages")}</p>
                      <div className="flex flex-wrap gap-2">
                        {refImages.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt="" className="w-14 h-14 object-cover rounded-xl border border-zinc-200" />
                            <button type="button" onClick={() => setRefImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={8} /></button>
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

                {studio?.deposit_required && (
                  <div className="text-xs text-zinc-400 font-inter mb-3 flex items-center gap-1.5">
                    <span>Das Studio legt die Anzahlung im Angebot fest.</span>
                  </div>
                )}
                {selectedDate && offerDeadlineLabel && (
                  <div className="text-xs font-inter mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <span className="text-amber-600 flex-shrink-0 mt-0.5">⏳</span>
                    <span className="text-amber-800">Nach Angebotseingang hast du <strong>{offerDeadlineLabel}</strong> Zeit, um das Angebot anzunehmen und die Anzahlung zu leisten.</span>
                  </div>
                )}
                {studio?.cancellation_hours && (
                  <div className="text-xs text-zinc-500 font-inter mb-4 flex items-start gap-2 bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2.5">
                    <Info size={11} className="text-zinc-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <span><strong className="text-zinc-700">Stornierungsbedingung:</strong> Kostenlose Stornierung bis {studio.cancellation_hours >= 24 ? `${studio.cancellation_hours / 24} Tag${studio.cancellation_hours >= 48 ? "e" : ""}` : `${studio.cancellation_hours} Stunden`} vor dem Termin. Danach wird die Anzahlung einbehalten.</span>
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2">Gutschein-Code (optional)</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherStatus(null); setVoucherDiscount(null); setVoucherError(""); }}
                      placeholder="XXXX-XXXX-XXXX"
                      className={`flex-1 px-3.5 py-2.5 bg-zinc-50 border rounded-xl text-sm font-mono text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white transition-all ${voucherStatus === "valid" ? "border-emerald-400 focus:border-emerald-500" : voucherStatus === "invalid" || voucherStatus === "used" ? "border-rose-400 focus:border-rose-500" : "border-zinc-200 focus:border-zinc-400"}`}
                    />
                    <button
                      type="button"
                      onClick={handleVoucherValidate}
                      disabled={!voucherCode.trim() || voucherStatus === "checking"}
                      className="px-3.5 py-2.5 bg-zinc-900 text-white text-xs font-inter font-semibold rounded-xl hover:bg-zinc-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      {voucherStatus === "checking" ? "…" : "Prüfen"}
                    </button>
                  </div>
                  {voucherStatus === "valid" && voucherDiscount && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-inter bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      <span className="text-emerald-600">✓</span>
                      <span>Gutschein gültig – <strong>€{(voucherDiscount.amount_cents / 100).toFixed(2)} Rabatt</strong> wird angewendet</span>
                    </div>
                  )}
                  {(voucherStatus === "invalid" || voucherStatus === "used") && (
                    <p className="mt-1.5 text-xs text-rose-600 font-inter">{voucherError}</p>
                  )}
                </div>
                {bookingSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center" data-testid="booking-success">
                    <CheckCircle size={24} className="text-emerald-600 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-emerald-800 font-inter font-semibold text-sm mb-1">{t("booking.success")}</p>
                    <p className="text-xs text-emerald-600 font-inter mb-1">Das Studio erstellt dein Angebot – du hast dann <strong>{offerDeadlineLabel}</strong> Zeit zum Annehmen.</p>
                    <p className="text-xs text-zinc-400 font-inter">ID: {bookingSuccess.booking_id}</p>
                    <button onClick={() => navigate("/dashboard")} className="mt-3 w-full py-2 bg-zinc-900 text-white text-xs font-inter rounded-xl hover:bg-zinc-700 transition-colors">Zum Dashboard</button>
                  </motion.div>
                ) : (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleBook}
                    disabled={!selectedSlot || bookingLoading}
                    className="btn-primary w-full justify-center disabled:opacity-40" data-testid="confirm-booking-btn">
                    {bookingLoading ? t("common.loading") : t("booking.confirm")}
                  </motion.button>
                )}
                {user && (
                  <div className="w-full mt-3 py-3 px-4 bg-zinc-50 border border-zinc-100 rounded-xl flex items-start gap-2.5" data-testid="contact-studio-info">
                    <MessageSquare size={14} strokeWidth={1.5} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-500 font-inter leading-relaxed">
                      Nach deiner Buchung meldet sich das Studio direkt per Nachricht bei dir. Du findest das Gespräch dann unter <strong className="text-zinc-700">Nachrichten</strong>.
                    </p>
                  </div>
                )}
              </>)}

              </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          imgs={lightbox.imgs}
          idx={lightbox.idx}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(l => ({ ...l, idx: (l.idx - 1 + l.imgs.length) % l.imgs.length }))}
          onNext={() => setLightbox(l => ({ ...l, idx: (l.idx + 1) % l.imgs.length }))}
          onJump={(i) => setLightbox(l => ({ ...l, idx: i }))}
        />
      )}

      {/* Artist Modal */}
      {selectedArtist && (
        <ArtistModal
          artist={selectedArtist}
          lottieData={lottieData}
          onClose={() => setSelectedArtist(null)}
          onOpenLightbox={(imgs, idx) => setLightbox({ imgs, idx })}
        />
      )}

      {/* Guest Inquiry Modal */}
      {showGuestModal && studio && (
        <GuestBookingModal studio={studio} onClose={() => setShowGuestModal(false)} />
      )}

      {/* Shop Guest Email Modal */}
      <AnimatePresence>
        {shopGuestModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShopGuestModal(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
              <p className="font-playfair font-bold text-lg text-zinc-900 mb-1">Bestellung als Gast</p>
              <p className="text-xs text-zinc-500 font-inter mb-5">
                Gib deine E-Mail-Adresse ein – wir senden dir die Bestellbestätigung{shopGuestModal?.type === "voucher" ? " mit dem Gutschein-Code" : shopGuestModal?.type === "flash" ? " mit dem Download-Link" : ""} dorthin.
              </p>
              <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">E-Mail-Adresse</label>
              <input
                type="email"
                value={shopGuestEmail}
                onChange={e => { setShopGuestEmail(e.target.value); setShopGuestEmailError(""); }}
                onKeyDown={e => e.key === "Enter" && handleShopGuestSubmit()}
                placeholder="deine@email.de"
                autoFocus
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl font-inter focus:outline-none text-zinc-900 transition-colors mb-1 ${shopGuestEmailError ? "border-red-400 focus:border-red-500" : "border-zinc-200 focus:border-zinc-900"}`}
              />
              {shopGuestEmailError && <p className="text-[11px] text-red-500 font-inter mb-3">{shopGuestEmailError}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShopGuestModal(null)}
                  className="flex-1 py-2.5 text-sm font-inter text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-all">
                  Abbrechen
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleShopGuestSubmit}
                  disabled={!shopGuestEmail}
                  className="flex-1 py-2.5 text-sm font-inter font-semibold text-white bg-zinc-900 hover:bg-zinc-700 rounded-2xl transition-all disabled:opacity-40">
                  Weiter zur Zahlung
                </motion.button>
              </div>
              <p className="text-center mt-3 text-[11px] text-zinc-400 font-inter">
                Bereits registriert?{" "}
                <button onClick={() => { setShopGuestModal(null); navigate("/login"); }} className="text-zinc-700 font-semibold hover:underline">
                  Anmelden
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop PaymentModal */}
      {shopSession && (
        <PaymentModal
          session={shopSession}
          onClose={() => setShopSession(null)}
          onSuccess={handleShopPaymentSuccess}
        />
      )}

      {/* Shop Order Result Modal */}
      <AnimatePresence>
        {shopOrderResult && shopOrderResult.type !== "aftercare" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShopOrderResult(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-playfair font-bold text-xl text-zinc-900 mb-2">Vielen Dank!</h3>
              <p className="text-sm text-zinc-500 font-inter mb-5">{shopOrderResult.product_title}</p>
              {shopOrderResult.type === "voucher" && shopOrderResult.voucher_code && (
                <div className="bg-zinc-50 rounded-2xl p-5 mb-5 border border-zinc-100">
                  <p className="text-[10px] font-inter text-zinc-400 uppercase tracking-widest mb-2">Gutschein-Code</p>
                  <p className="font-mono font-black text-3xl text-zinc-900 tracking-widest">{shopOrderResult.voucher_code}</p>
                  <p className="text-[10px] text-zinc-400 font-inter mt-3">Zeige diesen Code beim Besuch vor. Er wurde auch per E-Mail gesendet.</p>
                </div>
              )}
              {shopOrderResult.type === "flash" && shopOrderResult.download_token && (
                <a href={`${API}/shop/download/${shopOrderResult.download_token}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white text-sm font-inter font-semibold rounded-xl hover:bg-zinc-700 transition-colors mb-4">
                  <Download size={15} strokeWidth={2} /> Flash-Design herunterladen
                </a>
              )}
              <button onClick={() => setShopOrderResult(null)} className="w-full py-2.5 text-sm font-inter text-zinc-400 hover:text-zinc-700 transition-colors">
                Schließen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {showWaitlistModal && studio && (
          <WaitlistModal
            studio={studio}
            prefillDate={(() => {
              const selCapDay = capacityData[selectedDate];
              const selRemaining = selCapDay ? selCapDay.remaining : DAY_CAPACITY;
              const selCost = SIZE_COST[sizeCategory] || 1;
              return selectedDate && selRemaining < selCost ? selectedDate : null;
            })()}
            prefillMonth={`${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}`}
            onClose={() => setShowWaitlistModal(false)}
            onSuccess={() => notify.success("Du stehst auf der Warteliste! Wir benachrichtigen dich per E-Mail.")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
