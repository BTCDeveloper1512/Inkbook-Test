import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    id: 'willkommen',
    chapter: null,
    type: 'cover',
    title: 'StudioOS',
    subtitle: 'Studio-Handbuch',
    body: 'Schritt-für-Schritt-Anleitung zur Einrichtung und Nutzung der Plattform',
    meta: '15 Kapitel · Vollständige Einrichtung'
  },
  {
    id: 'uebersicht',
    chapter: 'Überblick',
    step: null,
    type: 'overview',
    title: 'Was du in diesem Handbuch lernst',
    items: [
      { icon: '🔐', label: 'Registrierung & Profil', desc: 'Account anlegen, Studio-Profil vollständig einrichten' },
      { icon: '💳', label: 'Stripe Connect', desc: 'Zahlungsabwicklung aktivieren, Auszahlungen erhalten' },
      { icon: '📅', label: 'Kalender & Kapazitäten', desc: 'Verfügbarkeiten verwalten, Sperrtage setzen' },
      { icon: '📨', label: 'Buchungsanfragen', desc: 'Anfragen empfangen, prüfen und bearbeiten' },
      { icon: '✉️', label: 'Angebote & Bestätigungen', desc: 'Individuelle Angebote erstellen und versenden' },
      { icon: '💰', label: 'Zahlungen & Rückzahlungen', desc: 'Anzahlungen verwalten, Stornierungen abwickeln' },
      { icon: '💬', label: 'Kundenkommunikation', desc: 'Nachrichten, Benachrichtigungen, Inbox' },
      { icon: '📊', label: 'Analytics & Einnahmen', desc: 'Auslastung, Umsatz und Statistiken im Blick' },
    ]
  },
  {
    id: 'registrierung',
    chapter: 'Registrierung',
    step: 1,
    type: 'step',
    title: 'Account erstellen',
    intro: 'Dein StudioOS-Account ist der erste Schritt. Die Registrierung dauert weniger als 3 Minuten.',
    sections: [
      {
        title: 'So geht\'s',
        steps: [
          'Öffne StudioOS und klicke oben rechts auf „Registrieren"',
          'Wähle den Account-Typ: Studio (nicht Kunde!)',
          'Gib deinen Namen, deine E-Mail-Adresse und ein sicheres Passwort ein',
          'Bestätige deine E-Mail-Adresse über den Link, den wir dir schicken',
          'Du wirst automatisch zu deinem Studio-Dashboard weitergeleitet',
        ]
      },
      {
        title: 'Wichtig',
        type: 'warning',
        steps: [
          'Wähle unbedingt „Studio" als Account-Typ — ein Kunden-Account hat keinen Zugang zum Studio-Dashboard',
          'Nutze eine E-Mail-Adresse, die du regelmäßig abrufst — darüber bekommst du Buchungsbenachrichtigungen',
          'Das Passwort muss mindestens 8 Zeichen haben',
        ]
      }
    ]
  },
  {
    id: 'profil',
    chapter: 'Profil',
    step: 2,
    type: 'step',
    title: 'Studio-Profil einrichten',
    intro: 'Ein vollständiges Profil ist entscheidend — Kunden entscheiden anhand deines Profils, ob sie anfragen. Nimm dir hier Zeit.',
    sections: [
      {
        title: 'Pflichtfelder',
        steps: [
          'Studio-Name: Dein offizieller Name (z. B. „Black Ink Studio Berlin")',
          'Beschreibung: Mindestens 3 Sätze über deinen Stil, deine Erfahrung und was dich besonders macht',
          'Standort: Vollständige Adresse mit Stadt — wird für die Suche genutzt',
          'Tattoo-Stile: Wähle alle Stile aus, die du anbietest (Fine Line, Blackwork, Realism, …)',
          'Profilbild: Lade ein professionelles Logo oder Studio-Foto hoch (quadratisch, min. 400×400px)',
        ]
      },
      {
        title: 'Empfohlen (steigert Anfragen)',
        type: 'highlight',
        steps: [
          'Portfolio-Fotos: Lade 5–10 deiner besten Arbeiten hoch — das ist das erste, was Kunden sehen',
          'Stündlicher Grundpreis: Gibt Kunden eine Preisvorstellung (du kannst im Angebot abweichen)',
          'Mindest-Anzahlung in %: Z. B. 20 % — wird bei Buchungsbestätigung automatisch fällig',
          'Website / Instagram: Verlinkung erhöht Vertrauen',
          'Freies Stornierungsfenster: Z. B. 48 Stunden — innerhalb dieser Zeit können Kunden kostenlos stornieren',
        ]
      }
    ]
  },
  {
    id: 'stripe',
    chapter: 'Zahlungen',
    step: 3,
    type: 'step',
    title: 'Stripe Connect einrichten',
    intro: 'Stripe ist unser Zahlungspartner. Ohne aktives Stripe-Konto können Kunden keine Anzahlungen leisten — Buchungen sind dann nicht möglich.',
    sections: [
      {
        title: 'Einrichtung Schritt für Schritt',
        steps: [
          'Gehe im Dashboard auf „Einstellungen" → „Zahlungen & Auszahlungen"',
          'Klicke auf „Mit Stripe verbinden"',
          'Du wirst zu Stripe weitergeleitet — erstelle dort ein Konto oder melde dich an',
          'Fülle alle Pflichtfelder aus: Name, Adresse, Steuer-ID / USt-IdNr., Bankverbindung',
          'Nach erfolgreicher Verifikation erscheint im Dashboard „✓ Stripe aktiv"',
        ]
      },
      {
        title: 'Wichtige Infos zu Auszahlungen',
        type: 'highlight',
        steps: [
          'Anzahlungen werden sofort nach Zahlung des Kunden auf deinem Stripe-Konto gutgeschrieben',
          'Auszahlungen auf dein Bankkonto erfolgen automatisch im 7-Tage-Rhythmus (Stripe-Standard)',
          'StudioOS erhebt eine Plattformgebühr von 5 % — Stripe erhebt zusätzlich ~1,4 % + 0,25 €',
          'Du siehst alle Transaktionen direkt im Stripe-Dashboard unter stripe.com',
          'Rückzahlungen löst du im StudioOS-Dashboard aus — Stripe wickelt sie automatisch ab',
        ]
      }
    ]
  },
  {
    id: 'kalender',
    chapter: 'Kalender',
    step: 4,
    type: 'step',
    title: 'Kalender & Verfügbarkeiten',
    intro: 'Der Kalender zeigt Kunden, an welchen Tagen dein Studio verfügbar ist. Du hast die volle Kontrolle — kein Termin wird ohne deine Bestätigung angelegt.',
    sections: [
      {
        title: 'Kapazität pro Tag einstellen',
        steps: [
          'Gehe im Dashboard auf „Kalender"',
          'Klicke auf einen Tag, um seine Kapazität zu setzen (z. B. 2 gleichzeitige Buchungen)',
          'Grüne Tage = verfügbar, graue Tage = ausgebucht oder gesperrt',
          'Du kannst ganze Wochen oder Monate auf einmal bearbeiten',
        ]
      },
      {
        title: 'Sperrtage setzen',
        steps: [
          'Klicke auf „+ Sperrtag hinzufügen" im Kalender',
          'Wähle Start- und Enddatum (z. B. Urlaub, Messe, Umbau)',
          'Trage optional einen Grund ein — der wird dir intern angezeigt',
          'Gesperrte Tage erscheinen für Kunden als „nicht verfügbar" in der Buchungsansicht',
        ]
      },
      {
        title: 'Tipp',
        type: 'tip',
        steps: [
          'Halte deinen Kalender immer aktuell — Kunden sehen nur wirklich freie Tage und werden nicht enttäuscht',
          'Setze Puffertage nach intensiven Sessions, damit du nicht überlastet wirst',
        ]
      }
    ]
  },
  {
    id: 'anfragen',
    chapter: 'Anfragen',
    step: 5,
    type: 'step',
    title: 'Buchungsanfragen empfangen',
    intro: 'Sobald dein Profil vollständig ist und Stripe aktiv ist, können Kunden Anfragen schicken. Du wirst per E-Mail und im Dashboard benachrichtigt.',
    sections: [
      {
        title: 'Wo siehst du Anfragen?',
        steps: [
          'Im Dashboard unter „Buchungsanfragen" — dort erscheinen alle neuen Anfragen mit Status',
          'Eine rote Zahl neben dem Glocken-Symbol zeigt neue, unbearbeitete Anfragen',
          'Du bekommst außerdem sofort eine E-Mail mit allen Details der Anfrage',
        ]
      },
      {
        title: 'Was steht in einer Anfrage?',
        steps: [
          'Name und Kontaktdaten des Kunden',
          'Gewünschter Stil, Größe und Körperstelle',
          'Beschreibung und Referenzbilder (wenn vorhanden)',
          'Wunschdatum oder Wunschzeitraum',
          'Anmerkungen und Fragen des Kunden',
        ]
      },
      {
        title: 'Reaktionszeit',
        type: 'warning',
        steps: [
          'Antworte innerhalb von 24 Stunden — das erhöht deine Sichtbarkeit in der Suche erheblich',
          'Kunden, die keine Antwort bekommen, vergeben die Buchung an andere Studios',
          'Du kannst Anfragen auch ablehnen — dafür gibt es den „Ablehnen"-Button mit optionaler Begründung',
        ]
      }
    ]
  },
  {
    id: 'angebote',
    chapter: 'Angebote',
    step: 6,
    type: 'step',
    title: 'Individuelle Angebote erstellen',
    intro: 'Auf jede Anfrage antwortest du mit einem maßgeschneiderten Angebot. Der Kunde sieht das Angebot und kann es annehmen oder ablehnen.',
    sections: [
      {
        title: 'Angebot erstellen',
        steps: [
          'Klicke in der Anfrage auf „Angebot erstellen"',
          'Trage den Gesamtpreis ein (z. B. € 350 für die Session)',
          'Wähle das konkrete Datum und die Uhrzeit für die Session',
          'Schreibe eine persönliche Nachricht: Beschreibe kurz dein Konzept, Dauer, Besonderheiten',
          'Lege die Anzahlung fest (z. B. 20 % = € 70 — wird beim Annehmen fällig)',
          'Klicke auf „Angebot senden"',
        ]
      },
      {
        title: 'Was passiert dann?',
        steps: [
          'Der Kunde bekommt eine E-Mail und Benachrichtigung mit deinem Angebot',
          'Er kann das Angebot annehmen und direkt die Anzahlung per Karte / Apple Pay / Google Pay bezahlen',
          'Du wirst sofort benachrichtigt, sobald die Zahlung eingegangen ist',
          'Die Buchung wechselt auf Status „Bestätigt" — sie erscheint nun in deinem Kalender',
        ]
      },
      {
        title: 'Tipp zum Angebots-Text',
        type: 'tip',
        steps: [
          'Schreibe immer eine persönliche Nachricht — generische Angebote werden seltener angenommen',
          'Erwähne konkret, was der Kunde für den Preis bekommt: Skizze, Session-Dauer, Anzahl der Farben, etc.',
          'Wenn du den Wunschdatum nicht erfüllen kannst, schlage aktiv Alternativen vor',
        ]
      }
    ]
  },
  {
    id: 'bestaetigung',
    chapter: 'Buchungen',
    step: 7,
    type: 'step',
    title: 'Bestätigte Buchungen verwalten',
    intro: 'Nach Annahme des Angebots und Zahlung der Anzahlung gilt die Buchung als bestätigt. Ab hier ist sie verbindlich für beide Seiten.',
    sections: [
      {
        title: 'Was zeigt eine bestätigte Buchung?',
        steps: [
          'Kundendaten, Termin, Preis und Anzahlung',
          'Der noch ausstehende Restbetrag (Gesamtpreis minus Anzahlung)',
          'Die Storno-Frist — nach Ablauf greift die Anzahlungs-Einbehaltungsregel',
          'Alle Nachrichten und Anhänge aus der Konversation',
        ]
      },
      {
        title: 'Buchung selbst stornieren (als Studio)',
        type: 'warning',
        steps: [
          'Klicke in der Buchung auf „Termin absagen"',
          'Bei Studio-seitiger Stornierung wird die Anzahlung immer vollständig zurückgezahlt — keine Ausnahme',
          'Der Kunde erhält automatisch eine E-Mail mit der Storno-Bestätigung',
          'Storniere nur wenn absolut notwendig — häufige Studio-Stornierungen senken dein Ranking',
        ]
      },
      {
        title: 'Restbetrag bei der Session einziehen',
        type: 'highlight',
        steps: [
          'Den Restbetrag kassierst du direkt bei der Session (bar oder per eigener Lösung)',
          'StudioOS kümmert sich nur um die Anzahlung — der Restbetrag ist deine Sache',
          'Klicke nach der Session auf „Session abgeschlossen", um die Buchung zu archivieren',
        ]
      }
    ]
  },
  {
    id: 'stornierung',
    chapter: 'Stornierungen',
    step: 8,
    type: 'step',
    title: 'Stornierungen & Rückzahlungen',
    intro: 'Stornierungen sind Teil des Geschäfts. StudioOS regelt sie automatisch und fair — basierend auf dem Zeitpunkt der Stornierung.',
    sections: [
      {
        title: 'Kunden-Stornierung im freien Zeitfenster',
        steps: [
          'Der Kunde storniert innerhalb des freien Stornierungsfensters (z. B. 48 Stunden nach Buchung)',
          'Die Anzahlung muss vollständig zurückgezahlt werden',
          'Du siehst im Dashboard unter dem Glocken-Symbol: „Rückzahlung ausstehend"',
          'Klicke auf „💳 Anzahlung zurückzahlen" — die Rückzahlung läuft automatisch über Stripe',
          'Der Kunde erhält das Geld innerhalb von 3–5 Werktagen zurück',
        ]
      },
      {
        title: 'Kunden-Stornierung NACH der Frist',
        type: 'highlight',
        steps: [
          'Wenn der Kunde nach Ablauf des freien Fensters storniert, darfst du die Anzahlung behalten',
          'Im Dashboard erscheint die Buchung mit Status „Storniert — Anzahlung einbehalten"',
          'Du musst nichts tun — das Geld ist bereits auf deinem Stripe-Konto',
          'Strikte Empfehlung: Klär dies vorab im Angebots-Text, damit keine Missverständnisse entstehen',
        ]
      },
      {
        title: 'Wichtig',
        type: 'warning',
        steps: [
          'Rückzahlungen müssen immer über StudioOS / Stripe abgewickelt werden — nicht manuell!',
          'Ausstehende Rückzahlungen solltest du innerhalb von 24 Stunden bearbeiten',
          'Bei Fragen oder Streitfällen wende dich an support@studioos.de — wir helfen schnell',
        ]
      }
    ]
  },
  {
    id: 'nachrichten',
    chapter: 'Kommunikation',
    step: 9,
    type: 'step',
    title: 'Nachrichten & Kundenkommunikation',
    intro: 'Alle Kommunikation mit Kunden läuft über den StudioOS-Posteingang. Das hält alles übersichtlich und sicher.',
    sections: [
      {
        title: 'Nachrichten-Funktionen',
        steps: [
          'Gehe im Menü auf „Nachrichten" — hier siehst du alle Konversationen nach Buchung geordnet',
          'Du kannst Text-Nachrichten, Fotos und Referenzbilder schicken',
          'Kunden sehen deine Antworten in Echtzeit und werden per E-Mail benachrichtigt',
          'Die rote Badge-Zahl neben dem Nachrichten-Icon zeigt ungelesene Nachrichten',
        ]
      },
      {
        title: 'Best Practices',
        type: 'highlight',
        steps: [
          'Bestätige erhaltene Anfragen kurz: „Vielen Dank für deine Anfrage, ich melde mich bis [Datum]!"',
          'Schicke dem Kunden vor der Session ruhig nochmals eine Bestätigung mit Treffpunkt und Adresse',
          'Frage nach, falls Referenzbilder fehlen oder der Wunsch unklar ist — lieber einmal mehr fragen',
          'Sei freundlich und professionell — Kunden bewerten auch die Kommunikation, nicht nur das Tattoo',
        ]
      },
      {
        title: 'Benachrichtigungen einstellen',
        type: 'tip',
        steps: [
          'Unter „Einstellungen" → „Benachrichtigungen" kannst du E-Mail-Benachrichtigungen an- oder abschalten',
          'Empfehlung: Lass alle Buchungs- und Nachrichten-Benachrichtigungen aktiv',
        ]
      }
    ]
  },
  {
    id: 'analytics',
    chapter: 'Analytics',
    step: 10,
    type: 'step',
    title: 'Analytics & Einnahmen-Übersicht',
    intro: 'Das Analytics-Dashboard gibt dir einen vollständigen Überblick über dein Geschäft — Umsatz, Auslastung, Stile und mehr.',
    sections: [
      {
        title: 'Was du im Analytics-Dashboard siehst',
        steps: [
          'Monats- und Jahresumsatz (Anzahlungen, die über StudioOS liefen)',
          'Anzahl bestätigter, ausstehender und stornierter Buchungen',
          'Auslastungsrate: Wie viele deiner verfügbaren Tage sind ausgebucht?',
          'Beliebteste Stile nach Buchungsanzahl',
          'Durchschnittliche Antwortzeit auf Anfragen',
          'Kundenbewertungen und Durchschnittsscore',
        ]
      },
      {
        title: 'Tipps zur Nutzung',
        type: 'tip',
        steps: [
          'Überprüfe das Dashboard mindestens einmal pro Woche',
          'Wenn die Auslastung niedrig ist, optimiere dein Profil: bessere Fotos, mehr Stile, aktueller Kalender',
          'Wenn viele Anfragen kommen, aber wenige angenommen werden, überprüfe deine Angebots-Texte und Preise',
          'Das Stripe-Dashboard (stripe.com) zeigt dir detaillierte Zahlungshistorie und Auszahlungen',
        ]
      }
    ]
  },
  {
    id: 'profiltipps',
    chapter: 'Optimierung',
    step: 11,
    type: 'step',
    title: 'Tipps für mehr Sichtbarkeit',
    intro: 'Studios mit vollständigem Profil erhalten durchschnittlich 3× mehr Anfragen. Hier sind die wichtigsten Stellschrauben:',
    sections: [
      {
        title: 'Profil-Optimierung',
        steps: [
          'Lade mindestens 8 hochwertige Portfolio-Fotos hoch (gute Beleuchtung, scharfer Fokus)',
          'Schreibe eine Beschreibung mit mind. 150 Wörtern — erkläre, was dich von anderen unterscheidet',
          'Füge alle Stile hinzu, die du beherrschst — auch Stile, die du selten machst',
          'Verknüpfe dein Instagram — viele Kunden schauen dort nochmals nach',
          'Halte deinen Kalender immer aktuell — veraltete Kalender senken das Ranking',
        ]
      },
      {
        title: 'Reaktionszeit verbessern',
        type: 'highlight',
        steps: [
          'Die Reaktionszeit wird öffentlich auf deinem Profil angezeigt',
          'Antworte immer innerhalb von 24 Stunden — auch wenn nur eine kurze Rückmeldung',
          'Nutze das Nachrichtensystem für Rückfragen statt externe Wege (E-Mail, Instagram-DM)',
          'Schalte E-Mail-Benachrichtigungen an, damit du keine Anfrage verpasst',
        ]
      },
      {
        title: 'Bewertungen',
        type: 'tip',
        steps: [
          'Nach jeder abgeschlossenen Session werden Kunden automatisch um eine Bewertung gebeten',
          'Hohe Bewertungen (4,8+) steigern deine Position in der Suchliste erheblich',
          'Bitte Kunden nach der Session freundlich, eine ehrliche Bewertung zu hinterlassen',
        ]
      }
    ]
  },
  {
    id: 'faq',
    chapter: 'FAQ',
    step: null,
    type: 'faq',
    title: 'Häufig gestellte Fragen',
    questions: [
      {
        q: 'Kann ich als Studio mehrere Tätowierer im selben Account verwalten?',
        a: 'Aktuell ist ein Account einem Studio zugeordnet. Wenn du mehrere Artists verwaltest, empfehlen wir, die Kapazität pro Tag entsprechend zu erhöhen. Eine Multi-Artist-Funktion ist in Planung.'
      },
      {
        q: 'Was passiert, wenn ein Kunde seine Anzahlung nicht bezahlt?',
        a: 'Ohne Anzahlung wird die Buchung nicht bestätigt. Das Angebot läuft nach 72 Stunden automatisch ab. Du wirst benachrichtigt und kannst entscheiden, ob du das Angebot verlängerst oder neu vergibst.'
      },
      {
        q: 'Kann ich meinen Preis nach dem Angebot noch ändern?',
        a: 'Sobald das Angebot angenommen und die Anzahlung bezahlt wurde, ist der Preis verbindlich. Vorher kannst du ein neues Angebot mit korrigiertem Preis senden.'
      },
      {
        q: 'Wie lange dauert eine Auszahlung auf mein Bankkonto?',
        a: 'Stripe zahlt automatisch alle 7 Tage aus. Den genauen Auszahlungsplan siehst du in deinem Stripe-Dashboard unter stripe.com. Die erste Auszahlung kann bis zu 14 Tage dauern (Stripe-Verifikation).'
      },
      {
        q: 'Was passiert bei einem Streit mit einem Kunden?',
        a: 'Kontaktiere unseren Support unter support@studioos.de mit der Buchungs-ID. Wir prüfen den Fall und vermitteln. Bei eindeutigen Fällen greifen wir direkt ein.'
      },
      {
        q: 'Kann ich mein Stornierungsfenster auf 0 Stunden setzen?',
        a: 'Ja, du kannst das freie Stornierungsfenster auch auf 0 setzen — dann gilt sofort die Einbehaltungs-Regel. Wir empfehlen aber mindestens 24 Stunden, da das das Vertrauen der Kunden erhöht.'
      },
      {
        q: 'Wie bekomme ich eine Rechnung für die Plattformgebühren?',
        a: 'Stripe stellt automatisch monatliche Rechnungen aus. Du findest sie in deinem Stripe-Dashboard unter „Billing". Wende dich bei buchhalterischen Fragen an support@studioos.de.'
      },
      {
        q: 'Gibt es eine mobile App?',
        a: 'StudioOS ist als Progressive Web App (PWA) optimiert — du kannst es auf deinem Smartphone als App installieren (Browser → „Zum Startbildschirm hinzufügen"). Eine native iOS/Android-App ist in Entwicklung.'
      },
    ]
  },
  {
    id: 'support',
    chapter: null,
    type: 'closing',
    title: 'Du bist startklar.',
    subtitle: 'Hilfe & Support',
    items: [
      { icon: '✉️', label: 'E-Mail-Support', value: 'support@studioos.de', note: 'Antwort innerhalb von 24 Stunden' },
      { icon: '💬', label: 'Live-Chat', value: 'Im Dashboard rechts unten', note: 'Mo–Fr 10–18 Uhr' },
      { icon: '❓', label: 'FAQ & Hilfe-Center', value: '/faq', note: 'Antworten auf die häufigsten Fragen' },
      { icon: '📖', label: 'Dieses Handbuch', value: '/guide', note: 'Jederzeit abrufbar im Browser' },
    ]
  }
];

const total = SLIDES.length;

function ProgressBar({ current }) {
  return (
    <div className="flex gap-1">
      {SLIDES.map((_, i) => (
        <div
          key={i}
          className="h-0.5 flex-1 rounded-full transition-all duration-300"
          style={{ background: i <= current ? '#ffffff' : '#27272a' }}
        />
      ))}
    </div>
  );
}

function Tag({ type }) {
  const map = {
    warning: { label: '⚠ Wichtig', bg: '#27272a', color: '#e4e4e7' },
    highlight: { label: '★ Empfehlung', bg: '#27272a', color: '#e4e4e7' },
    tip: { label: '💡 Tipp', bg: '#27272a', color: '#e4e4e7' },
  };
  const cfg = map[type];
  if (!cfg) return null;
  return (
    <span
      className="text-[0.7rem] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function SlideContent({ slide }) {
  if (slide.type === 'cover') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-sm uppercase tracking-[0.25em] mb-6" style={{ color: '#52525b' }}>
          Studio-Handbuch
        </div>
        <h1
          className="font-black tracking-tighter leading-none text-white mb-4"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(3rem, 8vw, 7rem)' }}
        >
          Studio<em>OS</em>
        </h1>
        <div className="my-8 h-px w-32" style={{ background: 'linear-gradient(90deg, transparent, #3f3f46, transparent)' }} />
        <p className="text-xl mb-3" style={{ color: '#a1a1aa' }}>{slide.body}</p>
        <p className="text-sm" style={{ color: '#52525b' }}>{slide.meta}</p>
        <div className="mt-16 flex items-center gap-2" style={{ color: '#52525b' }}>
          <span className="text-sm">Weiter mit</span>
          <div className="flex gap-1 items-center">
            <kbd className="px-2 py-1 rounded text-xs border" style={{ borderColor: '#27272a', background: '#18181b', color: '#71717a' }}>→</kbd>
            <span className="text-xs" style={{ color: '#52525b' }}>oder Klick</span>
          </div>
        </div>
      </div>
    );
  }

  if (slide.type === 'overview') {
    return (
      <div className="flex flex-col h-full">
        <div className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: '#52525b' }}>Inhalt</div>
        <h2 className="text-3xl font-black text-white mb-10" style={{ fontFamily: '"Playfair Display", serif' }}>
          {slide.title}
        </h2>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {slide.items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl p-5 border flex items-start gap-4"
              style={{ background: '#18181b', borderColor: '#27272a' }}
            >
              <div className="text-2xl shrink-0">{item.icon}</div>
              <div>
                <div className="font-semibold text-white mb-1">{item.label}</div>
                <div className="text-sm" style={{ color: '#71717a' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.type === 'step') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          {slide.step && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-black shrink-0 bg-white"
            >
              {slide.step}
            </div>
          )}
          <div className="text-xs uppercase tracking-[0.2em]" style={{ color: '#52525b' }}>{slide.chapter}</div>
        </div>
        <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
          {slide.title}
        </h2>
        <p className="text-base mb-8 leading-relaxed" style={{ color: '#71717a' }}>{slide.intro}</p>

        <div className={`grid gap-6 flex-1 ${slide.sections.length >= 3 ? 'grid-cols-3' : slide.sections.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {slide.sections.map((section, si) => (
            <div
              key={si}
              className="rounded-xl border p-5 flex flex-col"
              style={{ background: '#18181b', borderColor: '#27272a' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="font-semibold text-white text-sm">{section.title}</span>
                {section.type && <Tag type={section.type} />}
              </div>
              <ul className="space-y-3 flex-1">
                {section.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{
                        background: section.type === 'warning' ? '#27272a' : '#27272a',
                        color: section.type === 'warning' ? '#e4e4e7' : '#71717a',
                        border: '1px solid #3f3f46'
                      }}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.type === 'faq') {
    return (
      <div className="flex flex-col h-full">
        <div className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: '#52525b' }}>FAQ</div>
        <h2 className="text-3xl font-black text-white mb-8" style={{ fontFamily: '"Playfair Display", serif' }}>
          {slide.title}
        </h2>
        <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
          {slide.questions.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border p-5"
              style={{ background: '#18181b', borderColor: '#27272a' }}
            >
              <div className="font-semibold text-white mb-2 text-sm leading-snug">{item.q}</div>
              <div className="text-sm leading-relaxed" style={{ color: '#71717a' }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.type === 'closing') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-sm uppercase tracking-[0.25em] mb-4" style={{ color: '#52525b' }}>Fertig</div>
        <h1
          className="font-black tracking-tighter leading-none text-white mb-3"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
        >
          {slide.title}
        </h1>
        <div className="my-6 h-px w-24" style={{ background: 'linear-gradient(90deg, transparent, #3f3f46, transparent)' }} />
        <p className="text-xl mb-10" style={{ color: '#a1a1aa' }}>{slide.subtitle}</p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
          {slide.items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border p-5 text-left"
              style={{ background: '#18181b', borderColor: '#27272a' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{item.icon}</span>
                <span className="font-semibold text-white text-sm">{item.label}</span>
              </div>
              <div className="font-mono text-sm mb-1" style={{ color: '#e4e4e7' }}>{item.value}</div>
              <div className="text-xs" style={{ color: '#52525b' }}>{item.note}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function StudioGuide() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback((dir) => {
    setDirection(dir);
    setCurrent(c => Math.max(0, Math.min(total - 1, c + dir)));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go]);

  const slide = SLIDES[current];

  return (
    <div
      className="fixed inset-0 flex flex-col select-none"
      style={{ background: '#09090b', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)' }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-10 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <span className="font-black text-white" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem' }}>
            Studio<em>OS</em>
          </span>
          <span className="text-xs" style={{ color: '#52525b' }}>Handbuch</span>
        </div>
        <div className="flex items-center gap-4">
          {slide.chapter && (
            <span className="text-xs uppercase tracking-wider" style={{ color: '#52525b' }}>
              {slide.chapter}
            </span>
          )}
          <span className="text-xs font-mono" style={{ color: '#3f3f46' }}>
            {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="relative z-10 px-10 mb-2">
        <ProgressBar current={current} />
      </div>

      {/* Slide content */}
      <div className="relative z-10 flex-1 overflow-hidden px-10 pb-8 pt-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <SlideContent slide={slide} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="relative z-10 flex items-center justify-between px-10 pb-8">
        <button
          onClick={() => go(-1)}
          disabled={current === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: current === 0 ? 'transparent' : '#18181b',
            border: '1px solid',
            borderColor: current === 0 ? '#1c1c1f' : '#27272a',
            color: current === 0 ? '#27272a' : '#a1a1aa',
            cursor: current === 0 ? 'default' : 'pointer'
          }}
        >
          ← Zurück
        </button>

        {/* Dot navigation */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === current ? '20px' : '6px',
                height: '6px',
                background: i === current ? '#ffffff' : '#27272a'
              }}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          disabled={current === total - 1}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: current === total - 1 ? 'transparent' : '#ffffff',
            border: '1px solid',
            borderColor: current === total - 1 ? '#1c1c1f' : '#ffffff',
            color: current === total - 1 ? '#27272a' : '#09090b',
            cursor: current === total - 1 ? 'default' : 'pointer'
          }}
        >
          Weiter →
        </button>
      </div>
    </div>
  );
}
