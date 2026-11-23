# dotsphere.farazfarid.com

Dotsphere by Fabian Faraz Farid.

Landing page of [Dotsphere](https://github.com/farazfarid/dotsphere), the Swift package of dotted thought-orbs for SwiftUI.
Static site: plain HTML, CSS and ES modules, no build step, no third-party requests, no cookies.

The demo (a mocked foldable phone) runs the engine of [thinking-orbs](https://github.com/Jakubantalik/thinking-orbs) by Jakub Antalik (MIT, bundled unchanged in
`site/assets/js/vendor/`) plus the additions of Dotsphere (`site/assets/js/dotsphere.js`), translated from the Swift package.

```bash
python3 -m http.server 8765 --directory site     # then open http://localhost:8765
node scripts/verify.mjs                            # the web engine against the original's golden vectors and the Swift package
```

`scripts/verify.mjs` compares every dot of every state against `scripts/orbs-golden.json` (from thinking-orbs) and `scripts/swift-reference.json` (dumped from the Swift package).

## Licence

MIT, see [LICENSE](LICENSE). The vendored engine is © Jakub Antalik, MIT, see `site/assets/js/vendor/LICENSE`.
