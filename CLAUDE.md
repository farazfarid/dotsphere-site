# CLAUDE.md · dotsphere-site

Landing page von Dotsphere (Swift-Package, `farazfarid/dotsphere`). Sprache mit dem Nutzer: Deutsch, Seite selbst: Englisch, Rechtstexte: Deutsch.

Live: https://dotsphere.farazfarid.com · GitHub `farazfarid/dotsphere-site` (öffentlich) · Hosting Coolify auf `root@169.58.117.132`
(Dockerfile mit nginx, App-ID in `.coolify-app`), DNS bei Cloudflare (A-Record, Proxy an).

## Regeln
- Keine Cookies, kein Tracking, nichts von Dritten laden (keine Schriften, keine Skripte). Die CSP in `nginx.conf` erlaubt nur `'self'`
  und keine Inline-Stile oder -Skripte: Stile über Klassen in `site/assets/style.css`, dynamische Werte nur per `element.style` im Skript.
- Jakub Antalik (Original thinking-orbs) immer nennen, Seite ist ein inoffizieller Port. Keine Superlative, keine Garantien, keine Emojis.
- Engine: `site/assets/js/vendor/thinking-orbs-engine.js` ist das gebündelte Original (nicht ändern), Zusätze in `site/assets/js/dotsphere.js` und `site/assets/js/modes2.js`.
  Nach Änderungen an Zusatzzuständen oder Presets im Swift-Paket: `scripts/swift-reference.json` neu erzeugen und `node scripts/verify.mjs` laufen lassen.
- Hosting-Muster wie `letterslot-site`, `lifeboat-site`: Projekt „LuminaX Websites“ in Coolify, Port 80.

## Veröffentlichen
`./scripts/deploy.sh "Nachricht"` committet, pusht und startet den Coolify-Deploy. Danach `curl -sI https://dotsphere.farazfarid.com/`.

## Aufbau der Seite (Stand 23.11.2026)
- `site/index.html`: ein Hero in voller Höhe (das „o“ in *Dotsphere* ist ein lebendiger Orb), danach „The 48“ (CSS-sticky, vom Skript gescrubbt), Handy-Demo, Raster, Ink, CarPlay-Mockups, Zahlen, Install, FAQ, Credits, Finale.
- `assets/js/experience.js`: Bewegung (GSAP, Lenis als einzige Smooth-Scroll-Engine, Wort-für-Wort-Reveals, Punktfeld). Bei `prefers-reduced-motion` ohne Scroll-Engine und ohne Scrub, mit statischen Endzuständen.
- `assets/js/app.js`: Handy-Mockup und Raster. `orbs.js` (Canvas-Schleife), `data.js` (Texte), `dotsphere.js` + `modes2.js` (Engine), `boot.js` (setzt `js`, `rm`, `ui` vor dem ersten Bild).
- Schriften (Geist, Geist Mono, Instrument Serif) und GSAP/Lenis liegen selbst gehostet unter `assets/`, nichts kommt von Dritten.
- Der volle Name **Fabian Faraz Farid** steht im Titel, in der Beschreibung, im Hero, in Credits, FAQ, Footer und in den strukturierten Daten (Person, SoftwareSourceCode, FAQPage). Beim Ändern beibehalten.
