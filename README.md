# Live Translator for Zoom

**Any Language. Real-time. Free.**

Real-time speech-to-text + translation subtitles for Zoom, Google Meet and Teams meetings -- runs in the browser, no server to deploy, no login, no cost.

- 13 languages -- English, Tamil, Malayalam, Telugu, Kannada, Hindi, Bengali, Marathi, French, Spanish, Arabic, Portuguese, Swahili
- Real-time -- uses the browser's own speech recognition engine, so a spoken sentence becomes a subtitle in about a second, not several seconds
- Floating overlay -- pop the subtitle out as a Picture-in-Picture window that floats above Zoom/Meet
- Transcript export -- download the full session (original + translated) as a PDF
- Installable PWA -- "Add to Home Screen" / "Install app" on desktop or mobile

---

## Why this version is architected differently from the first draft

An earlier version of this app tried to run speech recognition (Whisper-tiny) and translation (a 600M-parameter model) entirely offline, inside the browser, via WebAssembly. It worked, but:

- Whisper-tiny is the smallest Whisper model that exists; running it on a laptop CPU with no GPU made it slow **and** noticeably less accurate, especially for accented speech or fast talkers.
- The 600M-parameter translation model took multiple seconds per sentence on CPU.
- Stacked together, a spoken sentence could take 5-15+ seconds to appear as a subtitle -- not usable for a live meeting.

This is a real, structural limitation of doing everything locally in a browser with free, open models -- not a bug that could be patched. Real "live caption" products (Zoom's own captions, Google Meet captions, Otter.ai) all use server-side, GPU-accelerated speech models.

**This version trades "100% offline" for "actually real-time":**

- **Speech recognition** now uses the browser's own built-in `SpeechRecognition` API (`src/utils/speechRecognition.js`) -- the same engine Chrome uses for voice typing/dictation. It streams audio to a speech server and returns text in roughly a second. Requires internet and Chrome or Edge; there currently isn't a free, comparably fast offline alternative for in-browser use.
- **Translation** now uses the free [MyMemory API](https://mymemory.translated.net/doc/spec.php) (`src/utils/translator.js`) instead of a local model -- a network round-trip that's still much faster than local CPU inference. No signup required; free tier is 5,000 characters/day per visitor (see the comment at the top of `translator.js` for how to raise that limit).

If you specifically need a fully offline tool (no internet at all, e.g. for a private/air-gapped setting) and can accept several seconds of delay per line, the earlier Whisper+NLLB approach is the one to revisit -- but expect delay, not live captioning.

---

## Quick start (local dev)

```bash
npm install
npm run dev
```

Open the printed local URL in **Chrome or Edge**, allow microphone access, pick your two languages, and press **Start meeting**.

## Production build

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

The build output lands in `dist/`.

---

## Deploying to GitHub Pages

1. **Push this project to a GitHub repo.**

   ```bash
   git init
   git add .
   git commit -m "Live Translator for Zoom v3.0"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. **Set the Vite `base` path** in `vite.config.js` to match your repo name **exactly**, with a leading *and* trailing slash (only needed for project pages, i.e. `https://<user>.github.io/<repo>/`):

   ```js
   export default defineConfig({
     base: '/<your-repo-name>/',
     ...
   })
   ```

   If you're deploying to a **custom domain** or a **user/org page** (`https://<user>.github.io/`), use `base: '/'` instead.

3. **A GitHub Actions workflow is already included** at `.github/workflows/deploy.yml` -- it builds and deploys automatically on every push to `main`. Make sure it ends up at exactly that path in your repo (`.github/workflows/deploy.yml`) -- GitHub only recognizes workflows at that specific location; if you upload it elsewhere (e.g. the repo root) it will silently be ignored.

4. In your repo **Settings -> Pages**, set **Source** to **GitHub Actions** (not "Deploy from a branch" -- that legacy mode serves the raw, unbuilt files and will show a blank page).

5. Push to `main`, then check the **Actions** tab -- once the workflow shows a green check, your app is live at `https://<your-username>.github.io/<your-repo>/`.

### Alternative: Vercel / Netlify (recommended -- zero config)

Both platforms auto-detect Vite. Just import the GitHub repo:
- **Build command:** `npm run build`
- **Output directory:** `dist`
- Leave `base: '/'` in `vite.config.js` for these -- no sub-path to worry about.

---

## Browser requirements

- **HTTPS is required** for microphone access (GitHub Pages, Vercel and Netlify all serve HTTPS by default; `localhost` is exempt during dev).
- **Speech recognition** (the `SpeechRecognition` / `webkitSpeechRecognition` API) currently only ships in Chrome and Edge (desktop and Android). Firefox and Safari do not support it -- the app will show a warning banner and disable Start in those browsers.
- **Picture-in-Picture overlay** also works best in Chrome and Edge.

## Project structure

```
├── index.html
├── vite.config.js          # Vite + PWA plugin config
├── tailwind.config.js
├── .github/workflows/deploy.yml   # auto-deploy to GitHub Pages on push
├── src/
│   ├── App.jsx               # top-level state & wiring
│   ├── index.css             # design system (sculpted panels, glow, motion)
│   ├── components/
│   │   ├── LanguageDeck.jsx  # source/target language selectors + swap
│   │   ├── SubtitlePanel.jsx
│   │   ├── ControlDeck.jsx   # start/stop, overlay, PDF export
│   │   ├── Overlay.jsx       # Picture-in-Picture floating subtitle
│   │   └── TranscriptLog.jsx
│   └── utils/
│       ├── languages.js
│       ├── speechRecognition.js  # wraps the browser's native speech API
│       ├── translator.js         # MyMemory translation API
│       └── pdfExport.js
└── public/
    ├── icon-192.png / icon-512.png / apple-touch-icon.png
```

## How it works

1. **Speech recognition** -- `speechRecognition.js` starts the browser's native `SpeechRecognition`, set to the speaker's language. It streams back interim (still-being-recognized) text immediately, then a final version of each sentence once the speaker pauses.
2. **Live source display** -- interim text is shown as the subtitle right away, so there's visible feedback the app is listening even before translation finishes.
3. **Translate** -- once a sentence is finalized, it's sent to the MyMemory API and the subtitle updates to the translation, usually within a second.
4. **Display** -- the translated line renders as a large subtitle, optionally floated over your meeting window via Picture-in-Picture, and logged for PDF export.

## Known limits

- **Free translation quota:** MyMemory's free tier is 5,000 characters/day per visitor without an email, 50,000/day with one (see `translator.js`). A long class session could hit this; swap in a paid translation API if you need higher volume.
- **Not private/offline:** audio goes to the browser's speech-recognition provider and translated text goes to MyMemory. If privacy is a hard requirement, this trade-off isn't right for you -- see the offline alternative note above.
- **Accuracy** depends on the underlying browser speech engine per language; it's generally strong for major languages and more variable for some.
- **PDF export uses your browser's print dialog, not a bundled PDF library.** `jsPDF`'s built-in fonts can't render Tamil, Malayalam, Telugu, Kannada, Bengali, Devanagari (Hindi/Marathi) or Arabic script -- text in those scripts came out as garbled symbols. Instead, "Save transcript (PDF)" opens a new tab styled with proper Unicode webfonts and triggers the browser's print dialog; choose "Save as PDF" there. This uses the browser's actual text-rendering engine, which is what correctly draws non-Latin scripts.
- **Live transcript revisions:** Chrome's speech engine often re-fires a growing version of the same sentence multiple times as it processes more audio, rather than one clean final result. The app now collapses those into a single updated line instead of stacking each partial version -- if you still see two very similar lines close together, it usually means the engine paused briefly (4+ seconds) between them and treated it as a genuinely new sentence.

## License / cost

No paid services required to run this as described. Built on the browser's free built-in speech recognition and the free MyMemory translation API.
