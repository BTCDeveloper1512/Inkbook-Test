import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  FileCheck2,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PenLine,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

const bronze = "#b9895d";

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const visible = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Logo({ light = false }) {
  return (
    <span className={`so-logo ${light ? "so-logo-light" : ""}`}>
      Studio<span>OS</span>
    </span>
  );
}

function ButtonLink({ children, to, variant = "dark", className = "" }) {
  return (
    <Link className={`so-button so-button-${variant} ${className}`} to={to}>
      {children}
      <ArrowRight size={16} strokeWidth={1.7} />
    </Link>
  );
}

function MiniBar({ width, accent = false }) {
  return <div className={`mini-bar ${accent ? "mini-bar-accent" : ""}`} style={{ width }} />;
}

function DashboardMockup({ compact = false }) {
  return (
    <div className={`browser-frame ${compact ? "browser-compact" : ""}`}>
      <div className="browser-top">
        <div className="browser-dots"><i /><i /><i /></div>
        <div className="browser-address">studioos / arbeitsplatz</div>
        <MoreHorizontal size={15} />
      </div>
      <div className="dashboard-shell">
        <aside className="dashboard-side">
          <div className="dash-mark">s</div>
          {!compact && <div className="dash-studio">Morrow Studio <ChevronDown size={11} /></div>}
          <nav>
            <span className="active"><LayoutDashboard size={14} />Übersicht</span>
            <span><CalendarDays size={14} />Kalender</span>
            <span><Users size={14} />Kund:innen</span>
            <span><CreditCard size={14} />Zahlungen</span>
          </nav>
          {!compact && <div className="dash-side-bottom"><span><ShieldCheck size={13} />Studio geschützt</span></div>}
        </aside>
        <main className="dashboard-main">
          <div className="dash-head">
            <div><p className="dash-eyebrow">Dienstag, 18. Juni</p><h3>Guten Morgen, Mira.</h3></div>
            <button className="dash-add"><Plus size={14} />Termin</button>
          </div>
          <div className="dash-cards">
            <div><span>Heute</span><strong>06</strong><small>Termine</small></div>
            <div><span>Offen</span><strong>03</strong><small>Anfragen</small></div>
            <div><span>Gesichert</span><strong>€ 1.240</strong><small>Anzahlungen</small></div>
          </div>
          <div className="dash-content-grid">
            <div className="dash-panel">
              <div className="panel-title"><span>Dein Tag</span><small>Alle anzeigen <ArrowRight size={11} /></small></div>
              {[
                ["10:00", "Mara H.", "Fine Line · Beratung", "MH"],
                ["13:30", "Jonas R.", "Sleeve · Session", "JR"],
                ["16:00", "Nina S.", "Piercing · Lobe", "NS"],
              ].map(([time, name, type, initials], index) => (
                <div className="appointment" key={name}>
                  <time>{time}</time><div className="avatar">{initials}</div><div className="appointment-copy"><b>{name}</b><span>{type}</span></div>
                  <span className={`appointment-state ${index === 1 ? "pending" : ""}`}>{index === 1 ? "Anfrage" : "Bestätigt"}</span>
                </div>
              ))}
            </div>
            <div className="dash-panel focus-panel">
              <div className="panel-title"><span>Im Fokus</span><MoreHorizontal size={14} /></div>
              <div className="focus-icon"><Bell size={17} /></div>
              <b>2 Anfragen warten</b>
              <p>Alle Infos sind schon da. Nur noch prüfen und bestätigen.</p>
              <div className="focus-line"><span /><span /><span /></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ChaosCard({ icon, title, copy, tone }) {
  return (
    <motion.div className={`chaos-card chaos-${tone}`} whileHover={{ y: -6, rotate: tone === "paper" ? -1 : 0 }}>
      <div className="chaos-card-top">{icon}<span>offen</span></div>
      <h3>{title}</h3><p>{copy}</p>
      <div className="chaos-lines"><MiniBar width="84%" /><MiniBar width="63%" /><MiniBar width="72%" /></div>
    </motion.div>
  );
}

function FeatureVisual({ type }) {
  if (type === "calendar") return <div className="feature-visual calendar-visual"><div className="fv-heading"><span>Juni 2024</span><MoreHorizontal size={14} /></div><div className="week-labels">{["M", "D", "M", "D", "F", "S", "S"].map((x, i) => <span key={`${x}-${i}`}>{x}</span>)}</div><div className="calendar-grid">{Array.from({ length: 28 }, (_, i) => <span className={i === 11 || i === 19 ? "selected" : i % 7 === 2 ? "has-event" : ""} key={i}>{i + 1}</span>)}</div></div>;
  if (type === "payments") return <div className="feature-visual payment-visual"><div className="payment-total"><span>Diese Woche</span><strong>€ 2.840</strong><small>+12,4 %</small></div><div className="payment-bars">{[42, 63, 50, 76, 58, 88, 68].map((height, i) => <span style={{ height: `${height}%` }} className={i === 5 ? "bar-active" : ""} key={i} />)}</div></div>;
  return <div className="feature-visual form-visual"><div className="form-top"><FileCheck2 size={16} /><span>Gesundheitsbogen · Mara H.</span><Check size={14} /></div><div className="form-row"><span /> <MiniBar width="68%" /></div><div className="form-row"><span /> <MiniBar width="82%" /></div><div className="form-row"><span /> <MiniBar width="54%" /></div><div className="form-sign"><PenLine size={13} /> digital unterschrieben</div></div>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const [activeTab, setActiveTab] = useState("Kalender");
  const tabs = ["Kalender", "Kund:innen", "Zahlungen"];
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="studio-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        :root { --paper:#f3f0ea; --paper-deep:#e9e3d9; --graphite:#242321; --muted:#77736c; --bronze:${bronze}; --line:rgba(36,35,33,.14); }
        * { box-sizing:border-box; } .studio-page { background:var(--paper); color:var(--graphite); font-family:'DM Sans',sans-serif; overflow:hidden; }
        .studio-page a { color:inherit; text-decoration:none; } .so-wrap { width:min(1180px,calc(100% - 48px)); margin:auto; }
        .so-nav { height:80px; display:flex; align-items:center; justify-content:space-between; position:absolute; z-index:5; inset:0 0 auto; color:var(--paper); }
        .so-logo { font:500 22px 'DM Sans',sans-serif; letter-spacing:-.07em; } .so-logo span { color:var(--bronze); font-weight:400; }
        .so-logo-light { color:var(--paper); } .so-nav-links { display:flex; gap:32px; align-items:center; font-size:13px; color:rgba(243,240,234,.7); }
        .so-nav-links a:hover { color:var(--paper); } .nav-login { color:var(--paper)!important; border-bottom:1px solid rgba(243,240,234,.45); padding-bottom:4px; }
        .nav-start { border:1px solid rgba(185,137,93,.7); padding:11px 17px; color:var(--paper)!important; } .mobile-menu { display:none; background:none; color:var(--paper); border:0; }
        .hero { min-height:760px; background:var(--graphite); color:var(--paper); padding:178px 0 120px; position:relative; isolation:isolate; }
        .hero:after { content:""; position:absolute; inset:auto -10% -240px; height:470px; background:radial-gradient(ellipse,rgba(185,137,93,.16),transparent 62%); z-index:-1; }
        .hero-grid { display:grid; grid-template-columns: .9fr 1.1fr; gap:70px; align-items:center; } .eyebrow { font:11px 'DM Mono',monospace; letter-spacing:.16em; text-transform:uppercase; color:var(--bronze); }
        .hero h1 { font-size:clamp(52px,6.8vw,96px); line-height:.94; letter-spacing:-.075em; font-weight:500; margin:24px 0 28px; max-width:650px; }
        .hero h1 em, .serif { font-family:'Instrument Serif',serif; font-weight:400; letter-spacing:-.04em; } .hero-copy { color:rgba(243,240,234,.63); line-height:1.7; font-size:16px; max-width:440px; }
        .hero-actions { display:flex; gap:14px; align-items:center; margin-top:38px; } .so-button { display:inline-flex; align-items:center; gap:17px; padding:15px 18px; font-size:13px; transition:transform .3s,background .3s; } .so-button:hover { transform:translateY(-3px); }
        .so-button-dark { background:var(--paper); color:var(--graphite)!important; } .so-button-dark:hover { background:#fff; } .so-button-ghost { color:var(--paper)!important; border:1px solid rgba(243,240,234,.25); } .so-button-bronze { background:var(--bronze); color:var(--paper)!important; }
        .hero-note { display:flex; align-items:center; gap:9px; color:rgba(243,240,234,.45); font-size:11px; margin-top:22px; } .hero-note svg { color:var(--bronze); }
        .browser-frame { background:#d9d5ce; border-radius:18px; padding:9px; box-shadow:0 38px 80px rgba(0,0,0,.32); transform:perspective(1200px) rotateY(-5deg) rotateX(2deg); transition:transform .8s; } .browser-frame:hover { transform:perspective(1200px) rotateY(-1deg) rotateX(1deg); }
        .browser-top { height:28px; display:flex; align-items:center; gap:12px; color:#8d8981; padding:0 8px; font-size:9px; } .browser-dots { display:flex; gap:4px; } .browser-dots i { width:7px;height:7px;border-radius:50%;background:#aaa59d; } .browser-address { flex:1; background:#ece9e3; border-radius:4px; text-align:center; padding:5px; font:9px 'DM Mono',monospace; }
        .dashboard-shell { display:flex; min-height:424px; background:#f9f8f5; border-radius:11px; overflow:hidden; } .dashboard-side { width:142px; padding:18px 12px; background:#282725; color:#a6a29b; display:flex; flex-direction:column; } .dash-mark { width:25px;height:25px;border:1px solid #b9895d;color:#b9895d;display:grid;place-items:center;font:italic 18px 'Instrument Serif'; margin-bottom:23px; } .dash-studio { color:#edeae3; font-size:10px; display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; } .dashboard-side nav { display:grid;gap:7px;font-size:10px; } .dashboard-side nav span { display:flex;gap:9px;align-items:center;padding:8px 7px; } .dashboard-side nav .active { background:#3b3935;color:#f5f0e8; } .dash-side-bottom { margin-top:auto; font-size:8px; color:#b9895d; } .dash-side-bottom span { display:flex;align-items:center;gap:5px; }
        .dashboard-main { flex:1; padding:27px 30px; } .dash-head { display:flex;justify-content:space-between;align-items:start; } .dash-eyebrow { margin:0 0 4px; color:#928e86; font:9px 'DM Mono',monospace; } .dash-head h3 { font-size:20px;letter-spacing:-.05em;margin:0;font-weight:500; } .dash-add { display:flex;align-items:center;gap:5px;background:#292826;color:white;border:0;padding:8px 11px;font-size:10px; }
        .dash-cards { display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:25px 0 14px; } .dash-cards>div { background:#eeece7;padding:12px;display:grid;gap:4px; } .dash-cards span,.dash-cards small { font-size:9px;color:#8c877f; } .dash-cards strong { font-size:23px; font-weight:500; letter-spacing:-.06em; } .dash-content-grid { display:grid;grid-template-columns:1.5fr 1fr;gap:12px; } .dash-panel { background:#fff;border:1px solid #e5e1da;padding:15px; } .panel-title { display:flex;justify-content:space-between;font-size:11px;font-weight:600;margin-bottom:11px; } .panel-title small { color:#9a958e;font-size:9px;display:flex;align-items:center;gap:3px;font-weight:400; } .appointment { display:flex;align-items:center;border-top:1px solid #efede8;padding:10px 0;gap:8px; } .appointment time { color:#9c978e;font:8px 'DM Mono';width:28px; } .avatar { width:24px;height:24px;border-radius:50%;background:#d8c3af;display:grid;place-items:center;font-size:8px; } .appointment-copy { display:grid;gap:2px;flex:1;font-size:10px; } .appointment-copy span { color:#99948c;font-size:8px; } .appointment-state { background:#e1eee5;color:#53745d;padding:4px 5px;font-size:7px; } .appointment-state.pending { background:#f3eadf;color:#9a7048; } .focus-panel { background:#ece6dd; } .focus-icon { width:32px;height:32px;background:#292826;color:#c99b70;display:grid;place-items:center;margin:30px 0 12px; } .focus-panel b { font-size:12px; } .focus-panel p { color:#8e887f;font-size:9px;line-height:1.5;max-width:150px; } .focus-line { display:flex;gap:4px;margin-top:18px; } .focus-line span { height:3px;background:#c3a487;width:18px; }.focus-line span:first-child { width:40px; background:#292826; }
        .section { padding:145px 0; } .section-header { max-width:650px; } .section h2 { font-size:clamp(42px,5.5vw,74px);line-height:.98;letter-spacing:-.075em;font-weight:500;margin:18px 0 25px; } .section-intro { color:var(--muted);font-size:16px;line-height:1.7;max-width:500px; } .section-dark { background:var(--graphite);color:var(--paper); } .section-dark .section-intro { color:rgba(243,240,234,.57); }
        .chaos-wrap { margin-top:65px;display:grid;grid-template-columns:repeat(4,1fr);gap:13px; } .chaos-card { min-height:190px;padding:19px;background:#302f2c;border:1px solid rgba(243,240,234,.11);color:var(--paper); } .chaos-card:nth-child(2) { transform:translateY(32px); } .chaos-card:nth-child(4) { transform:translateY(60px); } .chaos-card-top { display:flex;justify-content:space-between;color:#a39c92; }.chaos-card-top svg { color:var(--bronze); }.chaos-card-top span { font:8px 'DM Mono';opacity:.65; } .chaos-card h3 { font-size:18px;margin:34px 0 6px;letter-spacing:-.04em; } .chaos-card p { color:#9b958b;font-size:11px;line-height:1.5;margin:0; } .chaos-lines { margin-top:22px;display:grid;gap:5px; } .mini-bar { height:4px;background:#514d47; } .mini-bar-accent { background:var(--bronze); }
        .split-story { display:grid;grid-template-columns:1fr 1fr;gap:100px;align-items:center; } .check-list { display:grid;gap:20px;margin-top:35px; } .check-list div { display:flex;align-items:center;gap:14px;color:#716c64;font-size:15px; } .check-list svg { color:var(--bronze);border:1px solid rgba(185,137,93,.5);padding:4px;width:25px;height:25px; } .before-after { background:#e8e1d7;padding:26px; } .ba-top { display:flex;justify-content:space-between;color:#8e877d;font:10px 'DM Mono';text-transform:uppercase;letter-spacing:.08em;margin-bottom:22px; } .ba-stack { display:grid;gap:10px; } .ba-row { display:flex;align-items:center;gap:10px;background:var(--paper);padding:13px; } .ba-row.dim { opacity:.45; } .ba-row span:first-child { width:25px;height:25px;background:#d2c2b2;display:grid;place-items:center;color:#7e6855; } .ba-row b { font-size:11px;font-weight:500;flex:1; } .ba-row small { color:#9b958b;font-size:9px; } .ba-arrow { text-align:center;color:var(--bronze);padding:7px; }
        .steps { margin-top:80px;display:grid;grid-template-columns:repeat(3,1fr); } .step { padding:24px 36px 24px 0;border-top:1px solid var(--line);position:relative; } .step:not(:last-child) { margin-right:45px; } .step:not(:last-child):after { content:"";position:absolute;right:17px;top:26px;width:35px;height:1px;background:var(--bronze); } .step-num { color:var(--bronze);font:12px 'DM Mono'; } .step h3 { font-size:23px;letter-spacing:-.05em;margin:38px 0 10px;font-weight:500; } .step p { color:var(--muted);font-size:13px;line-height:1.6;margin:0; }
        .product-section { background:#ddd8cf;padding-bottom:80px; } .product-browser { margin-top:68px; } .product-browser .browser-frame { transform:none;max-width:1000px;margin:auto; } .product-browser .dashboard-shell { min-height:500px; } .product-tabs { display:flex;gap:8px;justify-content:center;margin-top:25px; } .product-tabs button { border:1px solid #beb7ad;background:transparent;padding:10px 17px;color:#777168;font:12px 'DM Sans';cursor:pointer; } .product-tabs button.active { background:var(--graphite);color:var(--paper);border-color:var(--graphite); }
        .bento { display:grid;grid-template-columns:1.2fr .8fr 1fr;grid-auto-rows:240px;gap:14px;margin-top:70px; } .bento-card { background:#e8e3da;padding:26px;position:relative;overflow:hidden; } .bento-card.dark { background:var(--graphite);color:var(--paper); } .bento-card.tall { grid-row:span 2; } .bento-card.wide { grid-column:span 2; } .bento-card h3 { font-size:22px;letter-spacing:-.06em;margin:0 0 9px;font-weight:500; } .bento-card p { color:var(--muted);font-size:12px;line-height:1.55;max-width:220px;margin:0; } .bento-card.dark p { color:#aaa49b; } .bento-icon { color:var(--bronze);margin-bottom:35px; } .feature-visual { position:absolute;right:23px;bottom:0;left:23px;background:#f6f3ed;border:1px solid #d8d0c5;padding:13px;color:var(--graphite); } .calendar-visual { height:130px; } .fv-heading,.form-top { display:flex;justify-content:space-between;align-items:center;font-size:10px;margin-bottom:12px; } .week-labels,.calendar-grid { display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center; } .week-labels { color:#aaa39a;font:8px 'DM Mono';margin-bottom:5px; } .calendar-grid span { font-size:8px;padding:4px 0; } .calendar-grid .selected { color:#fff;background:var(--graphite); } .calendar-grid .has-event { color:var(--bronze);border-bottom:2px solid var(--bronze); } .payment-visual { height:132px;display:flex;gap:28px;align-items:flex-end; } .payment-total { display:grid;align-self:flex-start;gap:4px; } .payment-total span,.payment-total small { color:#9b958b;font-size:8px; }.payment-total strong { font-size:20px;letter-spacing:-.06em; }.payment-total small { color:#65816a; }.payment-bars { display:flex;gap:5px;height:78px;align-items:flex-end;flex:1; }.payment-bars span { background:#cbb8a6;flex:1; }.payment-bars .bar-active { background:var(--bronze); }.form-visual { height:135px; }.form-top { border-bottom:1px solid #dfd9cf;padding-bottom:10px; }.form-top svg:last-child { color:#6e876d; }.form-row { display:flex;align-items:center;gap:8px;margin:10px 0; }.form-row>span { width:10px;height:10px;border:1px solid #bdb5aa; }.form-sign { color:#65816a;font-size:9px;margin-top:11px;display:flex;gap:6px;align-items:center; }
        .day-section { background:#292826;color:var(--paper); } .day-grid { display:grid;grid-template-columns:1fr 1.4fr;gap:100px;align-items:start;margin-top:65px; } .day-list { display:grid;gap:0; } .day-item { padding:25px 0;border-top:1px solid rgba(243,240,234,.16);display:grid;grid-template-columns:100px 1fr;cursor:default; } .day-item:last-child { border-bottom:1px solid rgba(243,240,234,.16); } .day-item time { color:var(--bronze);font:11px 'DM Mono'; }.day-item h3 { margin:0 0 5px;font-size:23px;font-weight:500;letter-spacing:-.05em; }.day-item p { margin:0;color:#9d978e;font-size:12px; }.day-quote { padding:38px;background:#34312d;min-height:260px;display:flex;flex-direction:column;justify-content:space-between; }.day-quote p { font:italic 33px/1.08 'Instrument Serif';margin:0;max-width:450px; }.day-quote span { color:var(--bronze);font:10px 'DM Mono';letter-spacing:.13em;text-transform:uppercase; }
        .faq { max-width:790px;margin:60px auto 0; }.faq-item { border-top:1px solid var(--line); }.faq-item:last-child { border-bottom:1px solid var(--line); }.faq-button { width:100%;display:flex;align-items:center;justify-content:space-between;background:none;border:0;padding:22px 0;text-align:left;font:500 16px 'DM Sans';color:var(--graphite);cursor:pointer; }.faq-answer { overflow:hidden;color:var(--muted);font-size:13px;line-height:1.7;max-width:650px; }.faq-answer p { margin:0 0 22px; }.final-cta { background:var(--graphite);color:var(--paper);padding:150px 0;text-align:center;position:relative; }.final-cta h2 { max-width:800px;margin:16px auto 35px;font-size:clamp(48px,6vw,86px);line-height:.95;letter-spacing:-.08em;font-weight:500; }.final-cta p { color:#a39d93;font-size:13px;margin-top:20px; }.footer { background:var(--graphite);color:var(--paper);border-top:1px solid rgba(243,240,234,.12);padding:32px 0 40px; }.footer-row { display:flex;align-items:end;justify-content:space-between; }.footer-copy { color:#827d75;font-size:11px;margin-top:45px; }.footer-links { display:flex;gap:24px;color:#9d978e;font-size:11px; }.footer-links a:hover { color:var(--paper); }
        @media (max-width:800px) { .so-wrap { width:min(100% - 36px,600px); } .so-nav { height:68px; }.so-nav-links { display:none;position:absolute;top:58px;left:18px;right:18px;background:#302e2a;padding:20px;flex-direction:column;align-items:flex-start;gap:18px;box-shadow:0 15px 30px #0005; }.so-nav-links.open { display:flex; }.mobile-menu { display:block; }.nav-start { margin-left:auto;margin-right:12px;padding:9px 12px;font-size:11px; }.hero { padding:130px 0 82px;min-height:auto; }.hero-grid { display:block; }.hero h1 { font-size:clamp(53px,14vw,82px); }.hero-copy { font-size:14px; }.hero-actions { flex-wrap:wrap; }.hero .browser-frame { margin-top:68px; }.browser-frame { transform:none; }.dashboard-side { width:62px;padding:14px 10px; }.dash-studio,.dashboard-side nav span:not(.active) svg,.dashboard-side nav span:not(.active),.dash-side-bottom { font-size:0; }.dashboard-side nav span.active { font-size:0;justify-content:center; }.dashboard-main { padding:19px 14px; }.dash-head h3 { font-size:16px; }.dash-cards strong { font-size:17px; }.dash-content-grid { display:block; }.focus-panel { display:none; }.section { padding:90px 0; }.chaos-wrap { grid-template-columns:1fr 1fr; }.chaos-card:nth-child(2),.chaos-card:nth-child(4) { transform:none; }.split-story,.day-grid { display:block; }.before-after { margin-top:55px; }.steps { display:block;margin-top:55px; }.step { margin:0!important;padding:23px 0 30px!important; }.step:after { display:none; }.step h3 { margin:20px 0 8px; }.bento { grid-template-columns:1fr 1fr;grid-auto-rows:210px; }.bento-card.tall { grid-row:span 1; }.bento-card.wide { grid-column:span 2; }.bento-card h3 { font-size:18px; }.bento-card p { font-size:11px; }.day-quote { margin-top:50px; }.footer-row { display:block; }.footer-links { margin-top:25px;flex-wrap:wrap; }.final-cta { padding:100px 0; } }
        @media (max-width:480px) { .hero-actions .so-button { width:100%;justify-content:space-between; }.browser-top { padding:0 3px; }.browser-address { font-size:7px; }.dashboard-shell { min-height:350px; }.dash-cards { gap:5px; }.dash-cards>div { padding:8px; }.dash-cards span,.dash-cards small { font-size:7px; }.dash-cards strong { font-size:14px; }.appointment-state { display:none; }.chaos-wrap { grid-template-columns:1fr; }.bento { display:block; }.bento-card { min-height:200px;margin-bottom:12px; }.bento-card.wide { min-height:235px; }.product-tabs { overflow:auto;justify-content:flex-start;margin-left:18px;margin-right:18px;padding-bottom:5px; }.product-tabs button { white-space:nowrap; }.day-item { grid-template-columns:75px 1fr; }.day-item h3 { font-size:20px; } }
        @media (prefers-reduced-motion:reduce) { *,*:before,*:after { scroll-behavior:auto!important;animation-duration:.001ms!important;transition-duration:.001ms!important; } .browser-frame { transform:none; } }
      `}</style>
      <header className="hero">
        <nav className="so-nav so-wrap">
          <Link to="/"><Logo light /></Link>
          <div className={`so-nav-links ${menuOpen ? "open" : ""}`}>
            <a href="#system" onClick={() => setMenuOpen(false)}>Das System</a>
            <a href="#alltag" onClick={() => setMenuOpen(false)}>Der Alltag</a>
            <a href="#fragen" onClick={() => setMenuOpen(false)}>Fragen</a>
            <Link className="nav-login" to="/login">Anmelden</Link>
          </div>
          <Link className="nav-start" to="/register?role=studio">Studio starten</Link>
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menü öffnen">{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </nav>
        <div className="so-wrap hero-grid">
          <div>
            <Reveal><p className="eyebrow">Das Betriebssystem für Studios</p><h1>Mehr Zeit für <em>Kunst.</em><br />Weniger Zeit für Chaos.</h1><p className="hero-copy">StudioOS übernimmt Termine, Anzahlungen, Formulare und Kundenkommunikation. Damit dein Studio läuft, auch wenn du gerade an der Maschine sitzt.</p><div className="hero-actions"><ButtonLink to="/register?role=studio">Kostenlos starten</ButtonLink><a className="so-button so-button-ghost" href="#system">System ansehen <ArrowRight size={16} /></a></div><div className="hero-note"><Check size={14} /> Keine Kreditkarte. In wenigen Minuten eingerichtet.</div></Reveal>
          </div>
          <Reveal delay={.18}><DashboardMockup /></Reveal>
        </div>
      </header>

      <main>
        <section className="section section-dark">
          <div className="so-wrap">
            <Reveal><p className="eyebrow">Der Alltag, wie er wirklich ist</p><h2>Kommt dir das<br /><span className="serif">bekannt</span> vor?</h2><p className="section-intro">Ein Termin steckt in den DMs. Eine Anzahlung wartet auf deine Antwort. Drei Referenzbilder liegen irgendwo im Chat. Dein Kopf hält alles zusammen — bis er es nicht mehr tut.</p></Reveal>
            <div className="chaos-wrap">
              <Reveal delay={.05}><ChaosCard tone="dm" icon={<MessageCircle size={18} />} title="Instagram DMs" copy="„Hast du im August noch etwas frei?“ — zum achten Mal heute." /></Reveal>
              <Reveal delay={.1}><ChaosCard tone="phone" icon={<Clock3 size={18} />} title="Terminchaos" copy="Zwischen Walk-in, Rückruf und Doppelbuchung den Überblick behalten." /></Reveal>
              <Reveal delay={.15}><ChaosCard tone="paper" icon={<PenLine size={18} />} title="Papier & Listen" copy="Informationen verteilt über Notizen, Kalender und Tabellen." /></Reveal>
              <Reveal delay={.2}><ChaosCard tone="money" icon={<CreditCard size={18} />} title="Anzahlungen" copy="Hinterherlaufen, erinnern, nachfragen. Immer wieder." /></Reveal>
            </div>
          </div>
        </section>

        <section className="section" id="system"><div className="so-wrap split-story"><Reveal><p className="eyebrow">Der Wechsel</p><h2>Du machst Kunst.<br /><span className="serif">StudioOS macht den Rest.</span></h2><p className="section-intro">Keine neue Aufgabe auf deiner Liste. Ein ruhiger Ort, an dem jede Information ankommt, wohin sie gehört.</p><div className="check-list"><div><Check /> Alles an einem Ort</div><div><Check /> Automatische Erinnerungen</div><div><Check /> Anzahlungen online</div><div><Check /> Kund:innen kommen vorbereitet</div></div></Reveal><Reveal delay={.15}><div className="before-after"><div className="ba-top"><span>Vorher</span><span>Mit StudioOS</span></div><div className="ba-stack"><div className="ba-row dim"><span><X size={13} /></span><b>Termin vergessen</b><small>09:42 · DM</small></div><div className="ba-row dim"><span><X size={13} /></span><b>Anzahlung offen</b><small>gestern</small></div><div className="ba-arrow"><ArrowRight size={18} /></div><div className="ba-row"><span><Check size={13} /></span><b>Mara H. · 10:00</b><small>bestätigt</small></div><div className="ba-row"><span><Check size={13} /></span><b>€ 160 · gesichert</b><small>bezahlt</small></div></div></div></Reveal></div></section>

        <section className="section" style={{ paddingTop: 20 }}><div className="so-wrap"><Reveal><p className="eyebrow">Einmal einrichten. Ruhiger arbeiten.</p><h2>So einfach<br /><span className="serif">funktioniert es.</span></h2></Reveal><div className="steps"><Reveal delay={.05}><div className="step"><span className="step-num">01</span><h3>Studio einrichten</h3><p>Deine Leistungen, Verfügbarkeiten und Regeln. Klar und in deinem Tempo.</p></div></Reveal><Reveal delay={.12}><div className="step"><span className="step-num">02</span><h3>Link teilen</h3><p>In deine Bio, auf deine Website oder direkt in die nächste Nachricht.</p></div></Reveal><Reveal delay={.19}><div className="step"><span className="step-num">03</span><h3>Studio läuft</h3><p>Anfragen kommen vollständig an. Erinnerungen gehen automatisch raus.</p></div></Reveal></div></div></section>

        <section className="section product-section"><div className="so-wrap"><Reveal><p className="eyebrow">Alles, was du brauchst. Nichts, was dich aufhält.</p><h2>Dein Studio.<br /><span className="serif">Ein ruhiger Blick.</span></h2><p className="section-intro">StudioOS bringt Ordnung in die vielen kleinen Dinge, die zwischen zwei Sessions passieren. Hier ist alles, was heute zählt.</p></Reveal><div className="product-browser"><Reveal delay={.1}><DashboardMockup /></Reveal><div className="product-tabs">{tabs.map(tab => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div></div></div></section>

        <section className="section" style={{ paddingTop: 100 }}><div className="so-wrap" id="features"><Reveal><p className="eyebrow">Für den ganzen Studioalltag</p><h2>Weniger suchen.<br /><span className="serif">Mehr machen.</span></h2></Reveal><div className="bento"><Reveal><div className="bento-card tall"><CalendarDays className="bento-icon" size={21} /><h3>Ein Kalender, der mitdenkt.</h3><p>Termine, Anfragen und Verfügbarkeiten in einem Blick. Ohne Seitenwechsel.</p><FeatureVisual type="calendar" /></div></Reveal><Reveal delay={.08}><div className="bento-card dark"><Bell className="bento-icon" size={21} /><h3>Keine Erinnerung vergessen.</h3><p>StudioOS hält den Kontakt, auch wenn du gerade arbeitest.</p></div></Reveal><Reveal delay={.14}><div className="bento-card"><FileCheck2 className="bento-icon" size={21} /><h3>Formulare digital.</h3><p>Vorbereitet ankommen. Sicher archiviert.</p><FeatureVisual type="form" /></div></Reveal><Reveal delay={.18}><div className="bento-card wide"><CreditCard className="bento-icon" size={21} /><h3>Anzahlungen, die einfach passieren.</h3><p>Ein klarer Schritt bei der Buchung. Mehr Sicherheit für beide Seiten.</p><FeatureVisual type="payments" /></div></Reveal><Reveal delay={.24}><div className="bento-card"><ImageIcon className="bento-icon" size={21} /><h3>Referenzen am richtigen Ort.</h3><p>Alle Bilder und Wünsche direkt beim Termin.</p></div></Reveal></div></div></section>

        <section className="section day-section" id="alltag"><div className="so-wrap"><Reveal><p className="eyebrow">Ein besserer Studioalltag</p><h2>Du merkst es<br /><span className="serif">an deinem Tag.</span></h2><p className="section-intro">Nicht an einer Statistik. Sondern daran, dass zwischen zwei Kund:innen wieder Luft ist.</p></Reveal><div className="day-grid"><div className="day-list"><Reveal delay={.1}><div className="day-item"><time>09:00</time><div><h3>Morgens</h3><p>Ein Blick auf den Tag. Alles vorbereitet, nichts offen.</p></div></div></Reveal><Reveal delay={.15}><div className="day-item"><time>14:30</time><div><h3>Zwischendurch</h3><p>Eine Anfrage kommt vollständig an. Du antwortest, wenn es passt.</p></div></div></Reveal><Reveal delay={.2}><div className="day-item"><time>18:00</time><div><h3>Abends</h3><p>Der letzte Termin geht. Dein Studio bleibt organisiert.</p></div></div></Reveal></div><Reveal delay={.25}><div className="day-quote"><p>„Endlich muss ich nicht mehr gleichzeitig Künstler:in und Büro sein.“</p><span>Der Anspruch hinter StudioOS</span></div></Reveal></div></div></section>

        <section className="section" id="fragen"><div className="so-wrap"><Reveal><p className="eyebrow">Fragen, die häufig kommen</p><h2>Passt StudioOS<br /><span className="serif">zu deinem Studio?</span></h2></Reveal><div className="faq">{[["Für welche Studios ist StudioOS gedacht?", "Für Tattoo-, Piercing- und PMU-Studios — vom Einzelstudio bis zum Team mit mehreren Artists. Du stellst dein Studio so ein, wie du arbeitest."],["Muss ich meine Website ändern?", "Nein. Dein StudioOS Buchungslink kann direkt in deine Bio, Website oder Nachrichten eingefügt werden. Bestehende Kanäle bleiben, wie sie sind."],["Wie schnell kann ich starten?", "Die Grundeinrichtung dauert nur wenige Minuten. Du kannst Leistungen, Verfügbarkeiten und Studio-Infos direkt selbst anlegen und jederzeit ändern."],["Kann ich StudioOS erst ausprobieren?", "Ja. Du kannst kostenlos starten und dein Studio in Ruhe einrichten. Für den Anfang ist keine Kreditkarte erforderlich."]].map(([question, answer], i) => <div className="faq-item" key={question}><button className="faq-button" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>{question}{faqOpen === i ? <X size={18} /> : <Plus size={18} />}</button><motion.div className="faq-answer" initial={false} animate={{ height: faqOpen === i ? "auto" : 0, opacity: faqOpen === i ? 1 : 0 }}><p>{answer}</p></motion.div></div>)}</div></div></section>

        <section className="final-cta"><div className="so-wrap"><Reveal><p className="eyebrow">Der nächste ruhige Schritt</p><h2>Dein Studio verdient mehr Zeit für das, was wirklich zählt.</h2><ButtonLink to="/register?role=studio" variant="bronze">Jetzt kostenlos starten</ButtonLink><p>Keine Kreditkarte erforderlich. In wenigen Minuten eingerichtet.</p></Reveal></div></section>
      </main>
      <footer className="footer"><div className="so-wrap"><div className="footer-row"><Logo light /><div className="footer-links"><Link to="/login">Anmelden</Link><Link to="/register?role=studio">Studio starten</Link><a href="#fragen">Fragen</a></div></div><p className="footer-copy">StudioOS — das Betriebssystem für Tattoo, Piercing und PMU Studios.</p></div></footer>
    </div>
  );
}

export default App;