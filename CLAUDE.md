# CLAUDE.md · dotsphere-site

Landing page von Dotsphere (Swift-Package, `farazfarid/dotsphere`). Sprache mit dem Nutzer: Deutsch, Seite selbst: Englisch, Rechtstexte: Deutsch.

Live: https://dotsphere.farazfarid.com · GitHub `farazfarid/dotsphere-site` (öffentlich) · Hosting Coolify auf `root@169.58.117.132`
(Dockerfile mit nginx, App-ID in `.coolify-app`), DNS bei Cloudflare (A-Record, Proxy an).

## Regeln
- Keine Cookies, kein Tracking, nichts von Dritten laden (keine Schriften, keine Skripte). Die CSP in `nginx.conf` erlaubt nur `'self'`
  und keine Inline-Stile oder -Skripte: Stile über Klassen in `site/assets/style.css`, dynamische Werte nur per `element.style` im Skript.
- Jakub Antalik (Original thinking-orbs) immer nennen, Seite ist ein inoffizieller Port. Keine Superlative, keine Garantien, keine Emojis.
- Engine: `site/assets/js/vendor/thinking-orbs-engine.js` ist das gebündelte Original (nicht ändern), Zusätze in `site/assets/js/dotsphere.js`.
  Nach Änderungen an Zusatzzuständen oder Presets im Swift-Paket: `scripts/swift-reference.json` neu erzeugen und `node scripts/verify.mjs` laufen lassen.
- Hosting-Muster wie `letterslot-site`, `lifeboat-site`: Projekt „LuminaX Websites“ in Coolify, Port 80.

## Veröffentlichen
`./scripts/deploy.sh "Nachricht"` committet, pusht und startet den Coolify-Deploy. Danach `curl -sI https://dotsphere.farazfarid.com/`.
