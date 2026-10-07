# StudioOS – TikTok Ad (24 s, 9:16, 4K 60 fps)

Programmatisches Motion Design: Jede Szene ist HTML/CSS und wird über eine deterministische
Timeline (`renderFrame(t)` in `index.html`) Frame für Frame in headless Chromium gerendert.
Der Soundtrack (Beat, Whooshes, Impacts, UI-Sounds) wird in `audio.py` synthetisiert und
liegt framegenau auf den Animationen.

## Storyboard
| Zeit | Szene |
|---|---|
| 0–2,5 s | Hook: DMs, WhatsApp, Anrufe, No-Shows, Excel, Zettel → „Chaos.“ (Benachrichtigungen fluten, Zähler 99+) |
| 2,5–4,9 s | Implosion → Logo-Reveal → Zoom-Through in den weißen Balken des Logos |
| 4,9–8 s | 01 Buchungslink: Handy-Mockup, Tattoo/Do/13:30 antippen, echter QR-Code (studioos-cloud.de) |
| 8–11 s | 02 Kalender: Termin per Drag & Drop umbuchen, „Kunde automatisch informiert“ |
| 11–14 s | 03 Absprachen: Referenzbild (Line-Art zeichnet sich), Sprachnachricht, Antwort |
| 14–16,6 s | 04 Anzahlungen: Zähler bis 100,00 €, Ausstehend → Bezahlt |
| 16,6–18,5 s | Rapid-Fire: Warteliste, Projekte, QR-Code, DSGVO, Server in DE |
| 18,5–20,4 s | „Mehr Zeit für Kunst. Weniger Zeit für Chaos.“ |
| 20,4–24 s | End-Card: Logo, „Kostenlos starten“, studioos-cloud.de |

## Vorschau & Rendern
```bash
# Live-Vorschau: index.html im Browser öffnen (läuft in Echtzeit in Schleife)
python3 audio.py build/soundtrack.wav          # Soundtrack (benötigt numpy + scipy)
./render_all.sh build                           # 4K-Frames → build/video.mp4 (parallel, ~20–40 min)
./finalize.sh build out                         # 4K + 1080p + Version ohne Ton
```

Inhaltlich hält sich der Spot an die Marketing-Regeln aus `replit.md`: keine erfundenen
Kundenzahlen, Testimonials oder Logos; Namen im Mockup (Lena, Max, Julia K.) sind Demo-Daten.
