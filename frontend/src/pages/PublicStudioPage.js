import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Instagram, MapPin, Loader2, Phone, Clock, ShieldCheck, X, ChevronLeft, ChevronRight, Globe, UserCircle2, Maximize2 } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import StudioBookingWidget from "../components/StudioBookingWidget";
import StudioWaitlistCard from "../components/StudioWaitlistCard";
import { StudioOSWordmark } from "../components/StudioOSLogo";
import { artistColor, initials } from "../lib/artistColors";

const DAY_LABELS = { monday: "Mo", tuesday: "Di", wednesday: "Mi", thursday: "Do", friday: "Fr", saturday: "Sa", sunday: "So" };
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

/**
 * An artist's work deserves a stage, not thumbnails. Ported from the old
 * studio page: one large image you can swipe or arrow through, a counter,
 * dots, and a thumbnail strip that scrolls the active frame into view.
 * Controls stay hidden until hover so the photo is what you see first.
 */
function PortfolioSlider({ images, onOpenLightbox }) {
  const [current, setCurrent] = useState(0);
  const dragDir = useRef(0);
  const thumbsRef = useRef(null);

  const go = (idx) => {
    dragDir.current = idx > current ? 1 : -1;
    setCurrent(idx);
    thumbsRef.current?.children[idx]?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  };
  const prev = () => go((current - 1 + images.length) % images.length);
  const next = () => go((current + 1) % images.length);

  return (
    <div className="select-none">
      <div className="relative rounded-2xl overflow-hidden bg-zinc-950 group" style={{ height: 280 }}>
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
              if (info.offset.x < -50) next();
              else if (info.offset.x > 50) prev();
            }}
            className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
            draggable={false}
            alt=""
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {images.length > 1 && (
          <>
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/65 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/65 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </motion.button>
          </>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => onOpenLightbox(images, current)}
          className="absolute bottom-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/65 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Vergrößern"
        >
          <Maximize2 size={13} strokeWidth={2} />
        </motion.button>

        {images.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
            <span className="text-white/80 text-[11px] font-inter tabular-nums">
              {current + 1} / {images.length}
            </span>
          </div>
        )}

        {images.length > 1 && images.length <= 12 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                className={`transition-all duration-300 rounded-full ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div ref={thumbsRef} className="flex gap-2 mt-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {images.map((img, i) => (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => go(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all duration-200 ${
                i === current ? "ring-2 ring-zinc-900 opacity-100 scale-[1.04]" : "opacity-45 hover:opacity-75 hover:scale-[1.02]"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Full-screen image viewer, shared by the banner and the artist portfolios. */
function Lightbox({ images, index, onClose, onIndex }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onIndex]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button type="button" onClick={onClose} className="absolute top-5 right-5 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10">
        <X size={20} />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index - 1 + images.length) % images.length);
            }}
            className="absolute left-4 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index + 1) % images.length);
            }}
            className="absolute right-4 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      <motion.img
        key={images[index]}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        src={images[index]}
        alt=""
        className="max-h-[85vh] max-w-full object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <span className="absolute bottom-6 text-white/70 text-xs font-inter tabular-nums">
          {index + 1} / {images.length}
        </span>
      )}
    </motion.div>
  );
}

function ArtistModal({ artist, index, onClose, onOpenImage }) {
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        <div className="relative h-28 bg-zinc-900 rounded-t-3xl" style={{ backgroundColor: artistColor(index) }}>
          <button type="button" onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl text-white/80 hover:bg-white/20">
            <X size={18} />
          </button>
          <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-zinc-100 flex items-center justify-center">
            {artist.photo_url ? (
              <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-playfair text-xl text-zinc-500">{initials(artist.name)}</span>
            )}
          </div>
        </div>

        <div className="pt-11 px-6 pb-6">
          <h2 className="font-playfair text-xl text-zinc-900">{artist.name}</h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {artist.instagram_handle && (
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-inter">
                <Instagram size={11} /> {artist.instagram_handle}
              </span>
            )}
            {artist.experience_years != null && (
              <span className="text-[11px] text-zinc-400 font-inter">{artist.experience_years} Jahre Erfahrung</span>
            )}
          </div>

          {artist.bio && <p className="text-sm font-inter text-zinc-600 leading-relaxed mt-3 whitespace-pre-line">{artist.bio}</p>}

          {artist.styles?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {artist.styles.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-inter">
                  {s}
                </span>
              ))}
            </div>
          )}

          {artist.portfolio_images?.length > 0 && (
            <>
              <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-400 mt-5 mb-2">
                Portfolio · {artist.portfolio_images.length} {artist.portfolio_images.length === 1 ? "Bild" : "Bilder"}
              </div>
              <PortfolioSlider images={artist.portfolio_images} onOpenLightbox={onOpenImage} />
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * The only way a customer reaches a studio: its own link, e.g. /t/some-slug.
 * No search, no directory, no cross-studio navigation on this page —
 * that's the point (see product decision: no discovery path).
 */
export default function PublicStudioPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [studio, setStudio] = useState(null);
  const [artists, setArtists] = useState([]);
  const [state, setState] = useState("loading"); // loading | ok | not-found
  const [tab, setTab] = useState("about");
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { images, index }

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    Promise.all([studioApi.get(`/t/${slug}`), studioApi.get(`/t/${slug}/artists`)])
      .then(([studioRes, artistsRes]) => {
        if (cancelled) return;
        setStudio(studioRes.data);
        setArtists(artistsRes.data);
        setState("ok");
      })
      .catch(() => {
        if (!cancelled) setState("not-found");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const allImages = useMemo(
    () => [studio?.banner_image, ...(studio?.images || [])].filter(Boolean),
    [studio]
  );

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-zinc-400" size={28} />
      </div>
    );
  }

  if (state === "not-found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
        <h1 className="font-playfair text-2xl text-zinc-900 mb-2">Studio nicht gefunden</h1>
        <p className="text-sm text-zinc-500 font-inter">Dieser Link ist ungültig oder das Studio ist nicht mehr aktiv.</p>
      </div>
    );
  }

  const TABS = [
    { id: "about", label: "Über uns" },
    ...(artists.length ? [{ id: "artists", label: `Artists (${artists.length})` }] : []),
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <StudioOSWordmark markSize={22} textSize="text-sm" />
          <button
            type="button"
            onClick={() => navigate(`/t/${slug}/konto`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-inter text-zinc-600 border border-zinc-200 bg-white hover:border-zinc-400 transition-colors"
          >
            <UserCircle2 size={14} strokeWidth={1.5} /> Mein Konto
          </button>
        </div>

        {/* Banner as a card with the logo breaking its lower edge — the old
            page's signature, and it reads far better than a dark full-bleed
            strip with the title inside it. */}
        <div className="relative mb-14">
          <div
            className={`relative rounded-3xl overflow-hidden ${allImages.length ? "cursor-pointer" : ""}`}
            style={{ height: 320 }}
            onClick={() => allImages.length > 0 && setLightbox({ images: allImages, index: 0 })}
          >
            {allImages[0] ? (
              <img src={allImages[0]} alt={studio.name} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <span className="text-zinc-700 text-[100px] font-playfair select-none">{studio.name?.[0]}</span>
              </div>
            )}
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox({ images: allImages, index: 0 });
                }}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-2 text-sm font-inter font-semibold text-zinc-800 shadow-sm hover:bg-white transition-colors"
              >
                Alle Fotos · {allImages.length}
              </button>
            )}
          </div>

          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-zinc-100 flex items-center justify-center">
              {studio.logo_image ? (
                <img src={studio.logo_image} alt={studio.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-zinc-900 text-2xl font-playfair">{studio.name?.[0]}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-playfair text-3xl text-zinc-900">{studio.name}</h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap text-sm font-inter text-zinc-500">
            {(studio.city || studio.address) && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} /> {[studio.address, studio.city].filter(Boolean).join(", ")}
              </span>
            )}
            {studio.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={13} /> {studio.phone}
              </span>
            )}
            {studio.website && (
              <a href={studio.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-zinc-900">
                <Globe size={13} /> Website
              </a>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div>
            <div className="flex gap-1 mb-5 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_8px_rgb(0,0,0,0.04)] p-1.5 w-fit max-w-full overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-inter font-medium transition-colors whitespace-nowrap ${
                    tab === t.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === "about" && (
                <motion.div key="about" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                  {studio.description && (
                    <section className="bg-white rounded-3xl shadow-card p-6 sm:p-7">
                      <h2 className="font-playfair text-lg text-zinc-900 mb-3">Über uns</h2>
                      <p className="text-sm text-zinc-600 font-inter leading-relaxed whitespace-pre-line">{studio.description}</p>
                      {studio.styles?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {studio.styles.map((s) => (
                            <span key={s} className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-inter">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  <section className="bg-white rounded-3xl shadow-card p-6 sm:p-7">
                    <h2 className="font-playfair text-lg text-zinc-900 mb-4">Gut zu wissen</h2>
                    <div className="grid sm:grid-cols-2 gap-5">
                      {Object.values(studio.opening_hours || {}).some(Boolean) && (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-inter uppercase tracking-wide text-zinc-400 mb-2">
                            <Clock size={12} /> Öffnungszeiten
                          </div>
                          <div className="space-y-0.5">
                            {DAY_ORDER.filter((d) => studio.opening_hours?.[d]).map((d) => (
                              <div key={d} className="flex justify-between text-sm font-inter text-zinc-700 gap-4">
                                <span className="text-zinc-400">{DAY_LABELS[d]}</span>
                                <span>{studio.opening_hours[d]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(studio.settings?.depositRequired || studio.settings?.cancellationHours > 0) && (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-inter uppercase tracking-wide text-zinc-400 mb-2">
                            <ShieldCheck size={12} /> Richtlinien
                          </div>
                          {studio.settings?.depositRequired && (
                            <p className="text-sm font-inter text-zinc-700">Anzahlung von {studio.settings.depositPercent}% bei Buchung.</p>
                          )}
                          {studio.settings?.cancellationHours > 0 && (
                            <p className="text-sm font-inter text-zinc-700">
                              Kostenlose Stornierung bis {studio.settings.cancellationHours} Stunden vorher.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {(studio.impressum || studio.privacy_policy) && (
                      <div className="mt-5 pt-4 border-t border-zinc-100 space-y-2">
                        {studio.impressum && (
                          <details className="group">
                            <summary className="text-xs font-inter text-zinc-500 cursor-pointer hover:text-zinc-900">Impressum</summary>
                            <p className="text-xs font-inter text-zinc-500 mt-2 whitespace-pre-line leading-relaxed">{studio.impressum}</p>
                          </details>
                        )}
                        {studio.privacy_policy && (
                          <details className="group">
                            <summary className="text-xs font-inter text-zinc-500 cursor-pointer hover:text-zinc-900">Datenschutz</summary>
                            <p className="text-xs font-inter text-zinc-500 mt-2 whitespace-pre-line leading-relaxed">{studio.privacy_policy}</p>
                          </details>
                        )}
                      </div>
                    )}
                  </section>
                </motion.div>
              )}

              {tab === "artists" && (
                <motion.div
                  key="artists"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  {artists.map((a, i) => (
                    <motion.button
                      key={a.id}
                      type="button"
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedArtist({ artist: a, index: i })}
                      className="bg-white rounded-2xl shadow-card overflow-hidden text-left"
                    >
                      <div className="flex gap-3 items-start p-4">
                        <div
                          className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-inter font-semibold text-sm"
                          style={{ backgroundColor: artistColor(i) }}
                        >
                          {a.photo_url ? <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" /> : initials(a.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-inter font-medium text-sm text-zinc-900">{a.name}</div>
                          {a.bio && <p className="font-inter text-xs text-zinc-500 mt-0.5 line-clamp-2">{a.bio}</p>}
                          {a.styles?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {a.styles.slice(0, 3).map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-inter">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {a.portfolio_images?.length > 0 && (
                        <div className="grid grid-cols-4 gap-0.5">
                          {a.portfolio_images.slice(0, 4).map((url) => (
                            <div key={url} className="aspect-square overflow-hidden">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:sticky lg:top-8 self-start space-y-4">
            <StudioBookingWidget slug={slug} artists={artists} />
            <StudioWaitlistCard slug={slug} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedArtist && (
          <ArtistModal
            artist={selectedArtist.artist}
            index={selectedArtist.index}
            onClose={() => setSelectedArtist(null)}
            onOpenImage={(images, index) => setLightbox({ images, index })}
          />
        )}
        {lightbox && (
          <Lightbox
            images={lightbox.images}
            index={lightbox.index}
            onClose={() => setLightbox(null)}
            onIndex={(index) => setLightbox((l) => ({ ...l, index }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
