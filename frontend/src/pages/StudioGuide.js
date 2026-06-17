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
      { icon: '📅', label: 'Kalender & Kapazitäten', desc: 'Verfügbarkeiten verwalten, Tage sperren' },
      { icon: '📨', label: 'Buchungsanfragen', desc: 'Drei verschiedene Anfrage-Typen verstehen und bearbeiten' },
      { icon: '✉️', label: 'Angebote (15-Minuten-Fenster)', desc: 'Individuelle Angebote erstellen — Kunde hat 15 Minuten Zeit' },
      { icon: '✅', label: 'Bestätigt & Session-Abschluss', desc: 'Depot, Restbetrag eintragen, Revenue-Tracking' },
      { icon: '🔄', label: 'Stornierungen & Rückzahlungen', desc: 'Freies Fenster vor Termin, No-Show, automatische Rückzahlung' },
      { icon: '📊', label: 'Analytics & Nachrichten', desc: 'Umsatz, Auslastung, Kundenkommunikation' },
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
          'Nutze eine E-Mail-Adresse, die du regelmäßig abrufst — darüber bekommst du alle Buchungs-Benachrichtigungen',
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
          'Standort: Stadt und Adresse — wird für die Suchfilter genutzt',
          'Tattoo-Stile: Wähle alle Stile, die du anbietest (Fine Line, Blackwork, Realism, …)',
          'Profilbild / Logo: Quadratisch, min. 400×400px',
        ]
      },
      {
        title: 'Zahlungs-Einstellungen (in den Studio-Einstellungen)',
        type: 'highlight',
        steps: [
          'Standard-Anzahlung (€): Dein Default-Betrag — du kannst ihn pro Angebot individuell überschreiben',
          'Anzahlungs-Frist (Stunden): Wie lange hat der Kunde Zeit, die Anzahlung zu zahlen, bevor sie verfällt',
          'Freies Stornierungsfenster (Stunden): Wieviele Stunden VOR dem Termin der Kunde kostenlos stornieren kann — z. B. 48 bedeutet: bis 48 Std. vor Termin → volle Rückzahlung',
          'Portfolio-Fotos: 5–10 beste Arbeiten hochladen',
          'Stündlicher Grundpreis: Gibt Kunden eine Preisvorstellung',
        ]
      },
      {
        title: 'Tipp',
        type: 'tip',
        steps: [
          'Setze das Stornierungsfenster realistisch — zu kurze Fristen schrecken Kunden ab, zu lange erhöhen dein Risiko',
          'Vervollständige dein Profil zu 100 % — unvollständige Profile werden in der Suche schlechter gerankt',
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
    intro: 'Stripe ist unser Zahlungspartner. Ohne aktives Stripe-Konto können Kunden keine Anzahlungen leisten — das Angebot kann zwar erstellt werden, aber kein Kunde kann bezahlen.',
    sections: [
      {
        title: 'Einrichtung Schritt für Schritt',
        steps: [
          'Gehe im Dashboard auf den Reiter „Zahlungen" oder klicke das Stripe-Banner oben',
          'Klicke auf „Mit Stripe verbinden"',
          'Du wirst zu Stripe weitergeleitet — erstelle dort ein Konto oder melde dich an',
          'Fülle alle Pflichtfelder aus: Name, Adresse, Steuer-ID / USt-IdNr., Bankverbindung (IBAN)',
          'Nach erfolgreicher Verifikation erscheint im Dashboard „✓ Stripe aktiv"',
        ]
      },
      {
        title: 'Gebühren & Auszahlungen',
        type: 'highlight',
        steps: [
          'StudioOS erhebt 5 % Plattformgebühr auf den Anzahlungsbetrag (wird automatisch einbehalten)',
          'Stripe berechnet zusätzlich ~1,4 % + 0,25 € pro Transaktion (Stripe-Standard, EU-Karte)',
          'Anzahlungen erscheinen sofort auf deinem Stripe-Konto nach Kundenzahlung',
          'Auszahlungen auf dein Bankkonto erfolgen automatisch — den genauen Rhythmus siehst du in deinem Stripe-Dashboard (stripe.com)',
          'Alle Transaktionen und Rechnungen findest du direkt im Stripe-Dashboard',
        ]
      },
      {
        title: 'Wichtig',
        type: 'warning',
        steps: [
          'Ohne Stripe Connect können keine Anzahlungen angenommen werden',
          'Die erste Auszahlung kann bis zu 14 Tage dauern (Stripe-Erstverifikation)',
          'Rückzahlungen werden immer über Stripe abgewickelt — niemals manuell außerhalb des Systems!',
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
    intro: 'Der Kalender steuert, wann Kunden Buchungsanfragen stellen können. Du hast die volle Kontrolle — kein Termin wird ohne deine Bestätigung vergeben.',
    sections: [
      {
        title: 'Kapazitätssystem',
        steps: [
          'Jeder Tag hat eine Maximalkapazität von 8 Punkten',
          'Kleine Tattoos zählen 1–2 Punkte, große Sessions 4–8 Punkte',
          'Wenn die Tagespunkte erschöpft sind, gilt der Tag automatisch als ausgebucht',
          'Gehe im Dashboard auf „Kalender" → Ansicht „Kapazität" um freie Tage zu sehen',
          'Grüne Tage = verfügbar, graue / rote Tage = ausgebucht oder gesperrt',
        ]
      },
      {
        title: 'Sperrtage setzen',
        steps: [
          'Klicke im Kalender auf einen Tag und wähle „Tag sperren"',
          'Oder klicke auf „+ Sperrtag / Block hinzufügen" und wähle Start- und Enddatum',
          'Optional: Grund eintragen (Urlaub, Messe, Umbau) — nur intern sichtbar',
          'Gesperrte Tage erscheinen für Kunden als „nicht verfügbar"',
          'Zum Entfernen: auf den Sperrtag klicken → „Blockierung aufheben"',
        ]
      },
      {
        title: 'Tipp',
        type: 'tip',
        steps: [
          'Halte den Kalender immer aktuell — veraltete Kalender senken dein Suchranking erheblich',
          'Setze Puffertage nach langen Sessions, um Überlastung zu vermeiden',
        ]
      }
    ]
  },
  {
    id: 'anfragen',
    chapter: 'Anfragen',
    step: 5,
    type: 'step',
    title: 'Buchungsanfragen — 3 Typen',
    intro: 'Es gibt drei verschiedene Wege, wie eine Buchungsanfrage bei dir landen kann. Alle erscheinen im Dashboard-Reiter „Buchungen".',
    sections: [
      {
        title: 'Typ 1 — Kapazitäts-Anfrage (häufigster Weg)',
        steps: [
          'Kunde wählt auf deiner Profilseite Datum, Größe und Beschreibung',
          'Status im Dashboard: „Neue Anfrage" (pending_studio_review)',
          'Du siehst alle Details: Wunschtermin, Größe, Stil, Beschreibung, Referenzbilder',
          'Deine Aktion: Angebot erstellen → „Angebot senden" klicken',
        ]
      },
      {
        title: 'Typ 2 — Gast-Inquiry (ohne Account)',
        steps: [
          'Interessent füllt das Kontaktformular auf deiner Profilseite aus (kein Login nötig)',
          'Erscheint im Dashboard unter „Anfragen" (separater Reiter)',
          'Du kannst zunächst Nachrichten schreiben (Status: „kontaktiert")',
          'Wenn ihr euch einig seid, erstellst du ein Angebot → System schickt dem Gast automatisch einen Aktivierungslink per E-Mail',
          'Gast aktiviert Account, sieht das Angebot und bezahlt die Anzahlung',
        ]
      },
      {
        title: 'Typ 3 — Direkte Slot-Buchung',
        steps: [
          'Kunde bucht direkt einen von dir angelegten Zeitslot',
          'Status: „Ausstehend" (pending)',
          'Du bestätigst oder lehnst ab wie bei Typ 1',
        ]
      }
    ]
  },
  {
    id: 'angebote',
    chapter: 'Angebote',
    step: 6,
    type: 'step',
    title: 'Angebot erstellen — 15 Minuten Frist',
    intro: 'Das Angebot ist deine Antwort auf eine Buchungsanfrage. Sobald du es sendest, hat der Kunde genau 15 Minuten Zeit, es anzunehmen — danach verfällt es automatisch.',
    sections: [
      {
        title: 'Angebot erstellen',
        steps: [
          'Klicke in der Buchungsanfrage auf „Angebot erstellen" (Stift-Icon)',
          'Wähle das konkrete Datum und die Uhrzeit',
          'Trage die geplante Dauer in Minuten ein (z. B. 240 für 4 Stunden)',
          'Gesamtpreis eingeben (z. B. € 350)',
          'Anzahlung festlegen (z. B. € 70 — du kannst den Default-Wert aus deinen Einstellungen überschreiben)',
          'Optionale Notiz an den Kunden (wird als Chat-Nachricht gesendet)',
          'Klicke auf „Angebot senden"',
        ]
      },
      {
        title: '⚡ 15-Minuten-Deadline — sehr wichtig!',
        type: 'warning',
        steps: [
          'Sobald du das Angebot sendest, startet ein 15-Minuten-Countdown für den Kunden',
          'Der Kunde bekommt sofort eine Push-Benachrichtigung und E-Mail: „15 Minuten Zeit!"',
          'Nimmt der Kunde das Angebot nicht innerhalb von 15 Minuten an, verfällt es automatisch',
          'Die Buchung geht zurück auf „Neue Anfrage" — du kannst ein neues Angebot senden',
          'Tipp: Sende Angebote nur, wenn du den Termin wirklich sicher halten kannst',
        ]
      },
      {
        title: 'Nach dem Angebot',
        type: 'highlight',
        steps: [
          'Kunde nimmt an → Status wechselt zu „Wartet auf Zahlung" (wenn Anzahlung > 0)',
          'Kunde zahlt Anzahlung via Stripe (Karte, Apple Pay, Google Pay) → Status: „Bestätigt"',
          'Du bekommst sofort eine Benachrichtigung über die erfolgreiche Zahlung',
          'Die 5 % Plattformgebühr wird automatisch von der Anzahlung einbehalten',
        ]
      }
    ]
  },
  {
    id: 'bestaetigung',
    chapter: 'Buchungen',
    step: 7,
    type: 'step',
    title: 'Bestätigte Buchungen & Session-Abschluss',
    intro: 'Nach Anzahlungs-Eingang gilt die Buchung als bestätigt (Status: „Bestätigt"). Nach der Session trägst du den Restbetrag ein — so funktioniert dein Revenue-Tracking.',
    sections: [
      {
        title: 'Was eine bestätigte Buchung zeigt',
        steps: [
          'Kundendaten, Termin, Dauer und Gesamtpreis',
          'Gezahlte Anzahlung und noch ausstehender Restbetrag (Gesamtpreis − Anzahlung)',
          'Die Storno-Frist (wann das freie Stornierungsfenster endet)',
          'Alle Nachrichten und Referenzbilder aus dem Chat',
        ]
      },
      {
        title: 'Session abschließen (nach dem Termin)',
        type: 'highlight',
        steps: [
          'Klicke in der Buchung auf „Session abschließen" (Häkchen-Icon)',
          'Trage den tatsächlich kassierten Betrag ein (Restbetrag oder individuell)',
          'Wähle die Zahlungsart: Bar oder Stripe',
          'Klicke auf „Bestätigen" — die Buchung wechselt zu Status „Abgeschlossen"',
          'Der Betrag erscheint sofort in deiner Revenue-Übersicht (Heute, Monat, Gesamt)',
        ]
      },
      {
        title: 'No-Show — Kunde erscheint nicht',
        type: 'warning',
        steps: [
          'Erscheint der Kunde nicht, klicke auf „No-Show markieren"',
          'Status wechselt zu „Nicht erschienen" — die Anzahlung ist damit einbehalten',
          'Du musst nichts weiter tun — das Geld ist bereits auf deinem Stripe-Konto',
          'Der Kunde wird nicht automatisch benachrichtigt — du kannst ihm aber eine Nachricht schreiben',
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
    intro: 'Das freie Stornierungsfenster gilt relativ zum Termin — nicht zur Buchung. Storniert der Kunde früh genug VOR dem Termin, muss die Anzahlung zurückgezahlt werden.',
    sections: [
      {
        title: 'Kunden-Stornierung — freies Fenster',
        steps: [
          'Dein Stornierungsfenster ist in den Einstellungen als Stunden vor dem Termin definiert (z. B. 48)',
          'Beispiel: Termin ist Fr 14:00 Uhr, Fenster = 48 Std. → Kostenlose Stornierung möglich bis Mi 14:00 Uhr',
          'Storniert der Kunde innerhalb dieses Zeitraums: rote Glocke im Dashboard mit „Rückzahlung ausstehend"',
          'Klicke auf „💳 Anzahlung zurückzahlen" — Stripe veranlasst die Rückbuchung automatisch',
          'Kunde erhält das Geld in 3–5 Werktagen zurück (Stripe-Standard)',
        ]
      },
      {
        title: 'Kunden-Stornierung — NACH dem freien Fenster',
        type: 'highlight',
        steps: [
          'Storniert der Kunde NACH Ablauf des Stornierungsfensters, darfst du die Anzahlung behalten',
          'Status: „Storniert" — kein Rückzahlungs-Button erscheint',
          'Das Geld ist bereits auf deinem Stripe-Konto',
          'Empfehlung: Erwähne diese Regel explizit in deinem Angebots-Text, damit es keine Missverständnisse gibt',
        ]
      },
      {
        title: 'Studio storniert selbst',
        type: 'warning',
        steps: [
          'Klicke in der Buchung auf „Termin absagen"',
          'Bei studio-seitiger Stornierung wird die Anzahlung IMMER vollständig zurückgezahlt — automatisch über Stripe',
          'Kein manueller Schritt nötig — das System erledigt alles',
          'Der Kunde wird per E-Mail und Push-Benachrichtigung informiert',
          'Häufige Studio-Stornierungen senken dein Ranking — bitte nur wenn wirklich nötig',
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
    intro: 'Alle Kommunikation läuft über den StudioOS-Posteingang. So bleibt alles dokumentiert und an einem Ort.',
    sections: [
      {
        title: 'So funktioniert der Chat',
        steps: [
          'Gehe im Menü auf „Nachrichten" — alle Konversationen sind nach Buchung geordnet',
          'Du kannst Text, Fotos und Referenzbilder schicken',
          'Kunden sehen deine Antworten in Echtzeit und werden per E-Mail benachrichtigt',
          'Ungelesene Nachrichten zeigen eine rote Badge-Zahl neben dem Nachrichten-Icon',
          'Automatische System-Nachrichten (Angebote, Bestätigungen, Stornierungen) erscheinen ebenfalls im Chat',
        ]
      },
      {
        title: 'Best Practices',
        type: 'highlight',
        steps: [
          'Bestätige neue Anfragen mit einer kurzen Rückmeldung — auch wenn das Angebot noch nicht fertig ist',
          'Schicke dem Kunden vor der Session nochmals Adresse, Parkhinweise und was er mitbringen soll',
          'Frage aktiv nach fehlenden Referenzbildern — lieber einmal mehr fragen als überraschend sein',
          'Beim Gast-Inquiry: kommuniziere über den Chat, bevor du das formale Angebot erstellst',
        ]
      },
      {
        title: 'Benachrichtigungen',
        type: 'tip',
        steps: [
          'Unter „Einstellungen" → „Benachrichtigungen" kannst du E-Mail-Alerts ein- und ausschalten',
          'Empfehlung: alle Buchungs- und Nachrichten-Benachrichtigungen aktiv lassen',
          'Push-Benachrichtigungen (Browser/Handy) werden automatisch angeboten — bitte erlauben',
        ]
      }
    ]
  },
  {
    id: 'analytics',
    chapter: 'Analytics',
    step: 10,
    type: 'step',
    title: 'Analytics & Revenue-Übersicht',
    intro: 'Das Analytics-Dashboard zeigt dir Umsatz, Auslastung und Buchungsstatistiken. Revenue wird nur aus abgeschlossenen Sessions gezählt.',
    sections: [
      {
        title: 'Was du siehst',
        steps: [
          'Umsatz Heute / Diesen Monat / Gesamt (nur Status „Abgeschlossen")',
          'Stripe-Gesamteinnahmen separat (nur Anzahlungen über Stripe)',
          'Anzahl bestätigter, ausstehender und stornierter Buchungen',
          'Neue offene Anfragen (rote Badge-Zahl im Buchungs-Tab)',
          'Auslastungsrate: wie viele deiner verfügbaren Tage sind gebucht',
        ]
      },
      {
        title: 'Tipp',
        type: 'tip',
        steps: [
          'Revenue steigt nur, wenn du Sessions über „Session abschließen" abschließt und den Betrag einträgst',
          'Stripe-Einnahmen und Bar-Einnahmen werden getrennt in der Übersicht gezeigt',
          'Überprüfe das Dashboard wöchentlich — niedrige Auslastung signalisiert Optimierungsbedarf im Profil',
          'Detaillierte Zahlungshistorie und Auszahlungspläne findest du unter stripe.com',
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
    intro: 'Studios mit vollständigem Profil und kurzer Reaktionszeit erhalten deutlich mehr Anfragen. Hier die wichtigsten Stellschrauben:',
    sections: [
      {
        title: 'Profil-Optimierung',
        steps: [
          'Lade mindestens 8 hochwertige Portfolio-Fotos hoch (scharfe Beleuchtung, guter Fokus)',
          'Schreibe eine Beschreibung mit mindestens 150 Wörtern',
          'Aktiviere alle Stile, die du beherrschst — auch seltener nachgefragte Stile steigern Sichtbarkeit',
          'Verknüpfe dein Instagram — viele Kunden schauen dort nochmals nach',
          'Halte Kalender und Kapazitäten aktuell — veraltet = schlechteres Ranking',
        ]
      },
      {
        title: 'Reaktionszeit & Bewertungen',
        type: 'highlight',
        steps: [
          'Deine durchschnittliche Reaktionszeit ist öffentlich sichtbar — antworte immer innerhalb von 24 Stunden',
          'Nach jeder abgeschlossenen Session (Status „Abgeschlossen") werden Kunden automatisch zur Bewertung eingeladen',
          'Bewertungen über 4,8 Sterne steigern dein Ranking erheblich',
          'Bitte Kunden nach der Session freundlich um eine ehrliche Bewertung',
        ]
      }
    ]
  },
  {
    id: 'statusuebersicht',
    chapter: 'Status-Glossar',
    step: null,
    type: 'statuses',
    title: 'Alle Buchungs-Status im Überblick',
    statuses: [
      { status: 'Neue Anfrage', badge: '#f59e0b', desc: 'Kunde hat eine Kapazitäts-Anfrage gestellt — du musst ein Angebot erstellen' },
      { status: 'Ausstehend', badge: '#f59e0b', desc: 'Direktbuchung eines Slots — du bestätigst oder lehnst ab' },
      { status: 'Angebot gesendet', badge: '#8b5cf6', desc: 'Du hast ein Angebot gesendet — Kunde hat 15 Minuten Zeit zum Annehmen' },
      { status: 'Wartet auf Zahlung', badge: '#3b82f6', desc: 'Kunde hat angenommen, Anzahlung noch nicht bezahlt' },
      { status: 'Bestätigt', badge: '#22c55e', desc: 'Anzahlung eingegangen — Buchung ist verbindlich für beide Seiten' },
      { status: 'Abgeschlossen', badge: '#6b7280', desc: 'Session abgehalten, Restbetrag eingetragen — zählt für Revenue' },
      { status: 'Nicht erschienen', badge: '#6b7280', desc: 'Kunde ist nicht aufgetaucht — Anzahlung wird einbehalten' },
      { status: 'Studio storniert', badge: '#ef4444', desc: 'Du hast storniert — Anzahlung wird automatisch zurückgezahlt' },
      { status: 'Kunde storniert', badge: '#ef4444', desc: 'Kunde hat storniert — Rückzahlung abhängig vom Stornierungsfenster' },
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
        q: 'Warum sind es nur 15 Minuten zum Annehmen des Angebots?',
        a: 'Das soll sicherstellen, dass Angebote zeitnah und verbindlich sind — der Termin ist reserviert, solange das Angebot offen ist. Nimmt der Kunde nicht innerhalb von 15 Minuten an, geht die Anfrage zurück auf "Neue Anfrage" und du kannst ein neues Angebot senden.'
      },
      {
        q: 'Was passiert, wenn ein Kunde die Anzahlung innerhalb der Frist nicht zahlt?',
        a: 'Wenn du eine "Anzahlungs-Frist" in Stunden in deinen Einstellungen hinterlegt hast, wird die Buchung nach Ablauf dieser Frist automatisch storniert. Ohne eingestellte Frist bleibt die Buchung offen.'
      },
      {
        q: 'Kann ich den Preis nach dem Angebot noch ändern?',
        a: 'Nein — sobald der Kunde das Angebot angenommen und die Anzahlung bezahlt hat, ist der Preis verbindlich. Vorher kannst du das Angebot zurückziehen und ein neues senden (solange noch innerhalb der 15 Minuten).'
      },
      {
        q: 'Was bedeutet "Kapazität 8 Punkte pro Tag" konkret?',
        a: 'Du hast 8 Kapazitätspunkte pro Tag. Eine große Session (z. B. Full-Day) kann bis zu 8 Punkte kosten, kleine Flash-Tattoos nur 1–2. Du bestimmst selbst im Angebot, wie viele Punkte eine Session belegt. Wenn die 8 Punkte ausgeschöpft sind, gilt der Tag als ausgebucht.'
      },
      {
        q: 'Wann muss ich eine Rückzahlung auslösen?',
        a: 'Nur wenn: (a) der Kunde innerhalb seines freien Stornierungsfensters storniert UND (b) bereits eine Anzahlung gezahlt wurde. In diesem Fall erscheint eine rote Glocke im Dashboard. Du musst manuell auf "Anzahlung zurückzahlen" klicken. Bei studio-seitiger Stornierung läuft die Rückzahlung vollautomatisch.'
      },
      {
        q: 'Was passiert beim Gast-Inquiry, wenn der Gast den Aktivierungslink nicht öffnet?',
        a: 'Ohne Account-Aktivierung kann der Gast das Angebot nicht annehmen und keine Anzahlung zahlen. Du kannst ihm über die E-Mail-Adresse im Inquiry erneut schreiben oder den Support kontaktieren.'
      },
      {
        q: 'Zählt die Anzahlung als Revenue in meiner Übersicht?',
        a: 'Nein — Revenue wird nur durch den "Session abschließen"-Schritt erfasst. Du trägst dort den Restbetrag ein, den du bei der Session kassiert hast. Anzahlungen sind bereits auf deinem Stripe-Konto, werden aber separat als "Stripe-Einnahmen" gezeigt.'
      },
      {
        q: 'Wie bekomme ich Rechnungen für die Plattformgebühr?',
        a: 'Die 5 % Plattformgebühr wird direkt bei jeder Anzahlung einbehalten. Stripe stellt automatisch monatliche Kontoauszüge aus. Für buchhalterische Fragen wende dich an support@studioos.de.'
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
          style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif", fontSize: 'clamp(3rem, 8vw, 7rem)' }}
        >
          Studio<em>OS</em>
        </h1>
        <div className="my-8 h-px w-32" style={{ background: 'linear-gradient(90deg, transparent, #3f3f46, transparent)' }} />
        <p className="text-xl mb-3" style={{ color: '#a1a1aa' }}>{slide.body}</p>
        <p className="text-sm" style={{ color: '#52525b' }}>{slide.meta}</p>
        <div className="mt-16 flex items-center gap-2" style={{ color: '#52525b' }}>
          <span className="text-sm">Weiter mit</span>
          <kbd className="px-2 py-1 rounded text-xs border" style={{ borderColor: '#27272a', background: '#18181b', color: '#71717a' }}>→</kbd>
          <span className="text-xs" style={{ color: '#52525b' }}>oder Klick</span>
        </div>
      </div>
    );
  }

  if (slide.type === 'overview') {
    return (
      <div className="flex flex-col h-full">
        <div className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: '#52525b' }}>Inhalt</div>
        <h2 className="text-3xl font-black text-white mb-10" style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif" }}>
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
    const cols = slide.sections.length >= 3 ? 'grid-cols-3' : slide.sections.length === 2 ? 'grid-cols-2' : 'grid-cols-1';
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          {slide.step && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-black shrink-0 bg-white">
              {slide.step}
            </div>
          )}
          <div className="text-xs uppercase tracking-[0.2em]" style={{ color: '#52525b' }}>{slide.chapter}</div>
        </div>
        <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif" }}>
          {slide.title}
        </h2>
        <p className="text-base mb-8 leading-relaxed" style={{ color: '#71717a' }}>{slide.intro}</p>

        <div className={`grid gap-6 flex-1 ${cols}`}>
          {slide.sections.map((section, si) => (
            <div
              key={si}
              className="rounded-xl border p-5 flex flex-col"
              style={{ background: '#18181b', borderColor: '#27272a' }}
            >
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="font-semibold text-white text-sm">{section.title}</span>
                {section.type && <Tag type={section.type} />}
              </div>
              <ul className="space-y-3 flex-1">
                {section.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ background: '#27272a', color: '#71717a', border: '1px solid #3f3f46' }}
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

  if (slide.type === 'statuses') {
    return (
      <div className="flex flex-col h-full">
        <div className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: '#52525b' }}>{slide.chapter}</div>
        <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif" }}>
          {slide.title}
        </h2>
        <div className="grid grid-cols-3 gap-3 flex-1">
          {slide.statuses.map((s, i) => (
            <div
              key={i}
              className="rounded-xl border p-4 flex flex-col gap-2"
              style={{ background: '#18181b', borderColor: '#27272a' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.badge }} />
                <span className="font-semibold text-white text-sm">{s.status}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>{s.desc}</p>
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
        <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif" }}>
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
          style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
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
      style={{ background: '#09090b', fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif" }}
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
          <span className="font-black text-white" style={{ fontFamily: "'Cooper Hewitt', 'Barlow', sans-serif", fontSize: '1.1rem' }}>
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
