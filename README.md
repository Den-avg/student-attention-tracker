# Student Attention Monitor

Client-side attention tracking for students during lessons/assessments — head pose, eye closure, body posture, mouse clicks, and keystrokes combined into a live attention score, optionally logged to Google Sheets.

## Why this moved out of Apps Script

The original version ran as a Google Apps Script web app (`HtmlService`). Apps Script serves web apps inside a sandboxed `googleusercontent.com` iframe with a restrictive `Permissions-Policy` header that blocks `navigator.mediaDevices.getUserMedia()` for camera/microphone in many browser/policy combinations — that's the "Google blocked camera access" behavior. This isn't something you can fix from your own script's code; it's enforced by the hosting environment itself.

**Fix:** host the camera-facing front end as a static site (GitHub Pages) instead. GitHub Pages has no such iframe restriction, so `getUserMedia()` prompts normally. The Apps Script project is kept, but now only as a lightweight logging backend that receives attention-score events by POST and writes them to your Google Sheet — no camera code runs inside Apps Script anymore.

## Repo structure

```
student-attention-tracker/
├── index.html          # the full app — deploy this to GitHub Pages
├── apps-script/
│   └── Code.gs          # logging-only backend, deploy separately as an Apps Script web app
└── README.md
```

## Deploy steps

### 1. Push this repo to GitHub
```bash
cd student-attention-tracker
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages
Repo → Settings → Pages → Source: `main` branch, `/ (root)`. Your app will be live at
`https://<your-username>.github.io/<repo-name>/`.

### 3. Deploy the Apps Script logger
- Open the Apps Script project tied to `SPREADSHEET_ID` in `apps-script/Code.gs`.
- Paste in `Code.gs`.
- **Add your DeepSeek API key**: Project Settings (gear icon) → Script Properties → Add property → name it `DEEPSEEK_API_KEY`, value = your DeepSeek API key. This powers the AI-written feedback in column D. If this property is missing, the script falls back to a simple one-line summary instead of failing.
- Deploy → New deployment → Web app → Execute as: **Me** → Who has access: **Anyone** (or "Anyone with Google account" per your school's policy).
- Copy the `/exec` URL.

### 5. (Optional but recommended) Install the system-activity extension
`extension/` is a Chrome/Edge extension that reports **real system-wide mouse/keyboard activity** — across all apps, not just the browser tab — using Chrome's `idle` API. Without it, activity tracking falls back to clicks/keys/scrolls inside the tracker tab only.

1. Go to `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension/` folder from this repo.
4. Open the tracker page — the header badge should switch from "Checking extension…" to "✅ System activity: connected" within a couple of seconds.

Note the real limit here: `chrome.idle` reports whether the *system* is active or idle (mouse/keyboard used anywhere), at ~15-second granularity. It cannot see *what* the student is doing in another app — just that some input happened. True per-application tracking (e.g., "was in Word vs. a game") would require a native OS-level agent, a much larger build outside what a browser can do.

## Accuracy notes
Head-turn and no-face detection are intentionally lenient to avoid false "distracted" flags for normal behavior:
- A brief glance down while actively typing is not penalized as heavily as a sustained turn.
- Each displayed/logged score is smoothed over the last 3 checks, so one noisy or momentary frame doesn't spike a false distraction event.
- Consider these thresholds a starting point — if you're still seeing false positives/negatives during real use, the constants (`0.25` head-yaw threshold, `0.18` eye-aspect-ratio, penalty weights) are worth tuning in `index.html`'s `analyzeFrame()`.


## How the attention score works

Every 1.5s, MediaPipe Holistic landmarks are analyzed locally in-browser (no frames ever leave the device):

| Signal | Method | Penalty |
|---|---|---|
| Head turned away | Nose position relative to face width | -35 |
| No face in frame | Missing face landmarks | -40 |
| Eyes closed / drowsy | Eye-aspect-ratio on both eyes | -30 |
| Slouching / poor posture | Nose-to-shoulder vertical gap + shoulder tilt (Pose landmarks) | -20 |
| Idle input (no clicks/keys) | 45s → -8, 90s+ → -15 | up to -15 |

Score starts at 100 and penalties combine (floored at 0). This is a heuristic, not a certified proctoring measurement — treat scores as a classroom-engagement signal, not disciplinary evidence.

## Privacy note
Video never leaves the browser — only numeric scores/statuses are sent to your Sheet. Make sure students/parents are informed this tool is in use, consistent with your school's data-protection policy.
