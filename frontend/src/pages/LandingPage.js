import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  MessageCircle,
  Layers,
  Clock,
  ShieldCheck,
  QrCode,
  Check,
  Sparkles,
  Zap,
  Star,
} from "lucide-react";
import { StudioOSWordmark } from "../components/StudioOSLogo";
import { DragCalendarMockup, ChatMockup, WorkflowActs } from "../components/LandingMockups";
import MacBookScene from "../components/MacBookScene";
import DepthText from "../components/DepthText";
import PlanWheel from "../components/PlanWheel";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

/** The four things a studio actually does all day. Each pairs with a live mockup. */
const WORKFLOWS = [
  {
    eyebrow: "Zusagen & Umbuchen",
    title: "Zugesagte Termine stehen sofort im Kalender",
    body:
      "Sagt ein Kunde zu, trägt sich der Termin selbst ein — du musst nichts abtippen. Passt die Zeit später doch nicht, ziehst du ihn auf einen neuen Slot, und der Kunde bekommt automatisch Bescheid, um wie viel es sich verschoben hat.",
    Mockup: DragCalendarMockup,
  },
  {
    eyebrow: "Absprachen im Projekt",
    title: "Nachrichten dort, wo der Termin ist",
    body:
      "Bilder, Sprachnachrichten und Rückfragen hängen am jeweiligen Projekt, statt in WhatsApp zu versanden. Beide Seiten sehen, ob die andere gerade online ist.",
    Mockup: ChatMockup,
  },
];

const FEATURES = [
  { icon: QrCode, title: "Dein eigener Buchungslink", body: "Als QR-Code im Studio, im Bio-Link oder per WhatsApp. Kunden landen direkt bei dir." },
  { icon: Layers, title: "Projekte statt Einzeltermine", body: "Mehrere Sessions an einem Tattoo bleiben zusammen — inklusive Verlauf und Referenzen." },
  { icon: CalendarDays, title: "Auslastung statt Slot-Raster", body: "Freie Zeit wird nach echter Dauer berechnet, nicht nach starren 60-Minuten-Blöcken." },
  { icon: MessageCircle, title: "Chat mit Bild & Audio", body: "Motivabsprachen mit Referenzbildern und Sprachnachrichten, sauber pro Projekt abgelegt." },
  { icon: Clock, title: "Warteliste, die arbeitet", body: "Wird ein Platz frei, bietest du ihn mit zwei Klicks den Wartenden an." },
  { icon: ShieldCheck, title: "DSGVO-konform in der EU", body: "Server in Frankfurt. Kundendaten liegen getrennt pro Studio — sonst sieht sie niemand." },
];

const PLANS = [
  {
    icon: Sparkles,
    name: "Kostenlos",
    subtitle: "Zum Reinschnuppern",
    price: "0 €",
    period: "",
    features: ["1 Artist", "5 Termine pro Monat", "Buchungslink & Basis-Profil", "5 Portfolio-Bilder"],
    cta: "Kostenlos starten",
    highlight: false,
  },
  {
    icon: Zap,
    name: "Starter",
    subtitle: "Für wachsende Studios",
    price: "19,99 €",
    period: "/ Monat",
    features: ["2 Artists", "20 Termine pro Monat", "Chat & Terminbestätigung", "E-Mail-Benachrichtigungen", "Ohne StudioOS-Branding"],
    cta: "Starter wählen",
    highlight: false,
  },
  {
    icon: Star,
    name: "Pro",
    subtitle: "Für etablierte Studios",
    price: "49,99 €",
    period: "/ Monat",
    features: ["4 Artists", "Unbegrenzte Termine", "Alles aus Starter", "Anzahlungen via Stripe", "Erweiterte Statistiken", "Storno-Management"],
    cta: "Pro wählen",
    highlight: true,
  },
];

const FAQ = [
  {
    q: "Werde ich in einem Verzeichnis gelistet?",
    a: "Nein. StudioOS ist kein Marktplatz — es gibt keine Suche, kein Ranking und keine Verlinkung zwischen Studios. Deine Seite ist ausschließlich über den Link erreichbar, den du selbst verteilst.",
  },
  {
    q: "Muss ich mein bisheriges System sofort ablösen?",
    a: "Nein. Viele Studios starten mit den nächsten Anfragen und lassen den alten Kalender parallel weiterlaufen, bis alles Laufende dort erledigt ist.",
  },
  {
    q: "Was passiert, wenn ich wieder aufhören will?",
    a: "Du kannst dein Studio jederzeit selbst löschen — inklusive aller Buchungen, Termine und Kundendaten. Keine Kündigungsfrist, kein Anruf nötig.",
  },
  {
    q: "Brauchen meine Kunden eine App?",
    a: "Nein. Sie öffnen deinen Link im Browser, legen beim ersten Mal ein Konto an und sehen dort danach ihre Termine, Angebote und Nachrichten.",
  },
];

function SectionLabel({ children }) {
  return <span className="text-[11px] font-inter uppercase tracking-[0.18em] text-zinc-400">{children}</span>;
}


export default function LandingPage() {
  // The wheel starts on the middle tier, not the recommended one: with an end
  // option focused the dial has nothing rendered on one side, which both looks
  // lopsided and hides the fact that it turns at all. An option above and
  // below is the affordance.
  const [activePlan, setActivePlan] = useState(1);

  // Progress through the pinned stage: 0 the moment it locks to the top of
  // the viewport, 1 when the runway is used up and it releases.
  const stageRef = useRef(null);
  const { scrollYProgress: stageProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end end"],
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 bg-zinc-50/85 backdrop-blur border-b border-zinc-200/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <StudioOSWordmark markSize={26} textSize="text-lg" />
          <nav className="hidden md:flex items-center gap-7">
            {[
              { label: "Funktionen", href: "#funktionen" },
              { label: "Preise", href: "#preise" },
              { label: "Fragen", href: "#fragen" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-inter text-zinc-500 hover:text-zinc-900 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/os/login" className="text-sm font-inter text-zinc-600 hover:text-zinc-900 px-3 py-2 transition-colors">
              Anmelden
            </Link>
            <Link
              to="/os/login"
              className="text-sm font-inter text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl px-4 py-2 transition-colors whitespace-nowrap"
            >
              Studio anlegen
            </Link>
          </div>
        </div>
      </header>

      {/* Hero. Animated on mount rather than on scroll-into-view: this is the
          first thing above the fold, so there is no "into view" moment to
          wait for — whileInView would just risk a frame of blank page. */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-8 md:pt-20 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* The name as the page's first real statement, extruded so it
              reads as an object rather than a heading. Dark face on the
              light page — the same mark reversed out on dark was the reason
              it barely registered before. */}
          <div className="mb-7 mt-2 flex justify-center">
            <DepthText
              text="StudioOS"
              layers={34}
              depth={0.0072}
              faceColor="#09090b"
              depthColor="#bfbfc7"
              tilt={9}
              className="font-playfair font-black tracking-[-0.02em] text-[17vw] sm:text-7xl md:text-8xl leading-none"
            />
          </div>

          <h1 className="font-playfair text-2xl md:text-3xl lg:text-[2.1rem] leading-[1.15] text-zinc-900 mb-5">
            Mehr Zeit für Kunst.
            <br />
            Weniger Zeit für Chaos.
          </h1>
          <p className="text-base md:text-lg font-inter text-zinc-600 leading-relaxed mb-8 max-w-xl mx-auto">
            StudioOS bündelt Anfragen, Angebote, Termine und Absprachen an einem Ort — damit du abends nicht noch
            Nachrichten sortierst, sondern Feierabend hast.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/os/login"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-sm transition-colors shadow-btn"
            >
              Studio kostenlos anlegen
              <ArrowRight size={16} />
            </Link>
            <a
              href="mailto:hallo@studioos.de?subject=Demo%20StudioOS"
              className="inline-flex items-center h-12 px-5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-inter text-sm transition-colors"
            >
              Lieber erst reden?
            </a>
          </div>
          <p className="text-xs font-inter text-zinc-400 mt-4">
            Keine Kreditkarte nötig · In wenigen Minuten eingerichtet · Jederzeit selbst löschbar
          </p>
        </motion.div>
      </section>

      {/* The machine flies in and opens on the real dashboard. Scaled down on
          narrow screens rather than reflowed — a laptop only reads as a laptop
          at its own proportions. */}
      {/* A pinned stage: the machine holds dead centre and stays there while
          the scroll drives the whole camera move — overhead, down to eye
          level, lid open, screen lit, then in through the glass. The tall
          outer section is only the scroll runway for the sticky child, and it
          is long because the sequence has five beats to get through without
          any of them feeling rushed. */}
      <section ref={stageRef} className="relative" style={{ height: "460vh" }}>
        {/* Clipped at the stage, not the page: at the end of the dive the
            machine is deliberately wider than the viewport, and without this
            that overflow becomes real horizontal scroll — body's overflow-x
            doesn't stop it, since the document scroller is <html>. */}
        <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center px-6">
          {/* Half of what the old wide shot used, because the scene itself is
              now built at 2×. The dive multiplies back up to exactly 1:1, so
              the closest frame is native pixels rather than a stretched
              raster. */}
          <div className="origin-center scale-[0.21] sm:scale-[0.29] md:scale-[0.37] lg:scale-[0.46] xl:scale-50">
            {/* The same progress drives the camera and what is on the screen,
                so the acts can only begin once the dive has actually arrived. */}
            <MacBookScene progress={stageProgress}>
              <WorkflowActs progress={stageProgress} />
            </MacBookScene>
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section id="funktionen" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <motion.div {...fadeUp} className="mb-14 max-w-2xl">
          <SectionLabel>So arbeitet StudioOS</SectionLabel>
          <h2 className="font-playfair text-3xl md:text-4xl text-zinc-900 mt-3 leading-tight">
            Die Handgriffe, die deinen Tag ausmachen
          </h2>
        </motion.div>

        <div className="space-y-20 md:space-y-28">
          {WORKFLOWS.map(({ eyebrow, title, body, Mockup }, i) => (
            <motion.div key={title} {...fadeUp} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <SectionLabel>{eyebrow}</SectionLabel>
                <h3 className="font-playfair text-2xl md:text-3xl text-zinc-900 mt-3 mb-4 leading-snug">{title}</h3>
                <p className="text-sm md:text-base font-inter text-zinc-600 leading-relaxed max-w-md">{body}</p>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <Mockup />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="bg-white border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <motion.div {...fadeUp} className="mb-12 max-w-2xl">
            <SectionLabel>Außerdem drin</SectionLabel>
            <h2 className="font-playfair text-3xl md:text-4xl text-zinc-900 mt-3 leading-tight">
              Die Kleinigkeiten, die den Unterschied machen
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.07 }}
                className="rounded-2xl border border-zinc-100 p-5 hover:border-zinc-200 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center mb-3.5">
                  <Icon size={16} className="text-zinc-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-inter font-medium text-sm text-zinc-900 mb-1.5">{title}</h3>
                <p className="text-xs font-inter text-zinc-500 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <motion.div {...fadeUp} className="mb-12 text-center max-w-2xl mx-auto">
          <SectionLabel>Preise</SectionLabel>
          <h2 className="font-playfair text-3xl md:text-4xl text-zinc-900 mt-3 mb-3 leading-tight">
            Klein anfangen, jederzeit wechseln
          </h2>
          <p className="text-sm font-inter text-zinc-500">
            Monatlich kündbar. Der kostenlose Tarif läuft ohne Zeitlimit — du entscheidest, wann mehr Sinn ergibt.
          </p>
        </motion.div>

        {/* A dial instead of three cards side by side — scroll, drag or click
            the wheel to bring a plan into focus, its details crossfade in
            next to it. Nothing here is decided until a tier is actually in
            the middle, same "one thing in focus" idea as the pinned stages
            above. */}
        <motion.div
          {...fadeUp}
          className="grid md:grid-cols-[260px_1fr] gap-6 md:gap-16 max-w-4xl mx-auto items-center"
        >
          <PlanWheel items={PLANS.map((p) => p.name)} active={activePlan} onChange={setActivePlan} />

          {/* Fixed height because the card is absolutely positioned — the
              outgoing and incoming card overlap during the crossfade, so the
              column can't be sized by its content without the section
              jumping on every turn of the wheel. */}
          <div className="relative min-h-[440px]">
            <AnimatePresence mode="wait">
              {PLANS.filter((_, i) => i === activePlan).map(({ icon: Icon, name, subtitle, price, period, features, cta, highlight }) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 0.98 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute inset-0 rounded-3xl p-8 flex flex-col ${
                    highlight
                      ? "bg-zinc-900 text-white shadow-card-hover"
                      : "bg-white border border-zinc-200/70 shadow-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          highlight ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        <Icon size={18} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-playfair text-xl leading-tight ${highlight ? "text-white" : "text-zinc-900"}`}>
                          {name}
                        </h3>
                        <p className={`text-[11px] font-inter mt-0.5 ${highlight ? "text-zinc-400" : "text-zinc-500"}`}>
                          {subtitle}
                        </p>
                      </div>
                    </div>
                    {highlight && (
                      <span className="text-[10px] font-inter uppercase tracking-widest bg-white/15 rounded-full px-2.5 py-1 flex-shrink-0">
                        Beliebt
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex items-baseline gap-1.5 pb-6 mb-6 border-b ${
                      highlight ? "border-white/10" : "border-zinc-100"
                    }`}
                  >
                    <span className={`font-playfair text-[2.6rem] leading-none ${highlight ? "text-white" : "text-zinc-900"}`}>
                      {price}
                    </span>
                    <span className={`text-xs font-inter ${highlight ? "text-zinc-400" : "text-zinc-500"}`}>{period}</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          size={14}
                          strokeWidth={2.5}
                          className={`mt-px flex-shrink-0 ${highlight ? "text-emerald-400" : "text-emerald-500"}`}
                        />
                        <span className={`text-[13px] font-inter leading-snug ${highlight ? "text-zinc-300" : "text-zinc-600"}`}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/os/login"
                    className={`h-12 rounded-2xl font-inter text-sm flex items-center justify-center transition-colors ${
                      highlight ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"
                    }`}
                  >
                    {cta}
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section id="fragen" className="bg-white border-y border-zinc-100">
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          <motion.div {...fadeUp} className="mb-10">
            <SectionLabel>Häufige Fragen</SectionLabel>
            <h2 className="font-playfair text-3xl md:text-4xl text-zinc-900 mt-3 leading-tight">Bevor du loslegst</h2>
          </motion.div>

          <div className="divide-y divide-zinc-100">
            {FAQ.map(({ q, a }, i) => (
              <motion.details
                key={q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="group py-5"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                  <span className="font-inter font-medium text-sm text-zinc-900">{q}</span>
                  <span className="text-zinc-300 text-lg leading-none transition-transform group-open:rotate-45 flex-shrink-0">
                    +
                  </span>
                </summary>
                <p className="text-sm font-inter text-zinc-600 leading-relaxed mt-3 pr-8">{a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <motion.div {...fadeUp} className="rounded-3xl bg-zinc-900 px-8 py-14 md:px-16 md:py-20 text-center">
          <h2 className="font-playfair text-3xl md:text-4xl text-white leading-tight mb-4">
            Richte dein Studio in ein paar Minuten ein
          </h2>
          <p className="text-sm md:text-base font-inter text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">
            Konto anlegen, Öffnungszeiten eintragen, Link teilen — die erste Anfrage kann noch heute reinkommen.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/os/login"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-inter text-sm transition-colors"
            >
              Studio kostenlos anlegen
              <ArrowRight size={16} />
            </Link>
            <a
              href="mailto:hallo@studioos.de?subject=Demo%20StudioOS"
              className="inline-flex items-center h-12 px-5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 font-inter text-sm transition-colors"
            >
              Demo vereinbaren
            </a>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-zinc-200/60">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <StudioOSWordmark markSize={22} textSize="text-sm" />
          <div className="flex flex-wrap items-center justify-center gap-5">
            {[
              { to: "/impressum", label: "Impressum" },
              { to: "/datenschutz", label: "Datenschutz" },
              { to: "/agb", label: "AGB" },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="text-xs font-inter text-zinc-500 hover:text-zinc-900 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          <p className="text-xs font-inter text-zinc-400">© 2026 StudioOS</p>
        </div>
      </footer>
    </div>
  );
}
