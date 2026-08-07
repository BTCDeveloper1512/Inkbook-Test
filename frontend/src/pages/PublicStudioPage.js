import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Instagram, MapPin, Loader2, Phone, Clock, ShieldCheck } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import StudioBookingWidget from "../components/StudioBookingWidget";
import StudioWaitlistCard from "../components/StudioWaitlistCard";
import { StudioOSWordmark } from "../components/StudioOSLogo";

const DAY_LABELS = {
  monday: "Mo",
  tuesday: "Di",
  wednesday: "Mi",
  thursday: "Do",
  friday: "Fr",
  saturday: "Sa",
  sunday: "So",
};
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/**
 * The only way a customer reaches a studio: its own link, e.g. /t/some-slug.
 * No search, no directory, no cross-studio navigation on this page —
 * that's the point (see product decision: no discovery path).
 */
export default function PublicStudioPage() {
  const { slug } = useParams();
  const [studio, setStudio] = useState(null);
  const [artists, setArtists] = useState([]);
  const [state, setState] = useState("loading"); // loading | ok | not-found

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

  return (
    <div className="min-h-screen bg-zinc-50">
      <header
        className="relative h-64 sm:h-80 bg-zinc-900 bg-cover bg-center flex items-end"
        style={studio.banner_image ? { backgroundImage: `url(${studio.banner_image})` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative w-full max-w-5xl mx-auto px-6 pb-8 flex items-end justify-between">
          <div>
            <StudioOSWordmark className="mb-4 [&_span]:text-white" markSize={24} textSize="text-sm" />
            <h1 className="font-playfair text-3xl sm:text-4xl text-white font-semibold">{studio.name}</h1>
            {studio.city && (
              <p className="flex items-center gap-1.5 text-white/80 font-inter text-sm mt-2">
                <MapPin size={14} /> {studio.city}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 grid lg:grid-cols-[1fr_400px] gap-10">
        <div>
          {studio.description && (
            <section className="bg-white rounded-3xl shadow-card p-6 sm:p-8 mb-6">
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

          {(studio.phone || studio.address || Object.values(studio.opening_hours || {}).some(Boolean) || studio.settings?.cancellationHours || studio.settings?.depositRequired) && (
            <section className="bg-white rounded-3xl shadow-card p-6 sm:p-8 mb-6">
              <h2 className="font-playfair text-lg text-zinc-900 mb-4">Gut zu wissen</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {(studio.address || studio.phone) && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-inter uppercase tracking-wide text-zinc-400 mb-2">
                      <Phone size={12} /> Kontakt
                    </div>
                    {studio.address && <p className="text-sm font-inter text-zinc-700">{studio.address}</p>}
                    {studio.phone && <p className="text-sm font-inter text-zinc-700">{studio.phone}</p>}
                  </div>
                )}

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

                {(studio.settings?.depositRequired || studio.settings?.cancellationHours) && (
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-xs font-inter uppercase tracking-wide text-zinc-400 mb-2">
                      <ShieldCheck size={12} /> Richtlinien
                    </div>
                    {studio.settings?.depositRequired && (
                      <p className="text-sm font-inter text-zinc-700">
                        Anzahlung von {studio.settings.depositPercent}% bei Buchung erforderlich.
                      </p>
                    )}
                    {studio.settings?.cancellationHours > 0 && (
                      <p className="text-sm font-inter text-zinc-700">
                        Kostenlose Stornierung bis {studio.settings.cancellationHours} Stunden vor dem Termin.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {artists.length > 0 && (
            <section className="bg-white rounded-3xl shadow-card p-6 sm:p-8">
              <h2 className="font-playfair text-lg text-zinc-900 mb-4">Unsere Artists</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {artists.map((a) => (
                  <div key={a.id} className="flex gap-3 items-start p-3 rounded-2xl border border-zinc-100">
                    <div className="w-12 h-12 rounded-full bg-zinc-200 flex-shrink-0 overflow-hidden">
                      {a.photo_url && <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-inter font-medium text-sm text-zinc-900">{a.name}</div>
                      {a.bio && <p className="font-inter text-xs text-zinc-500 mt-0.5 line-clamp-2">{a.bio}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {a.instagram_handle && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-inter">
                            <Instagram size={11} /> {a.instagram_handle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-10 self-start space-y-4">
          <StudioBookingWidget slug={slug} artists={artists} />
          <StudioWaitlistCard slug={slug} />
        </div>
      </main>
    </div>
  );
}
