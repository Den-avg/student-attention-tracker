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
- Open the Apps Script project tied to `SPREADSHEET_ID` in `apps-script/Code.gs` (confirm the ID matches your sheet — a placeholder inline comment flags this).
- Paste in `Code.gs`.
- Deploy → New deployment → Web app → Execute as: **Me** → Who has access: **Anyone** (or "Anyone with Google account" per your school's policy).
- Copy the `/exec` URL.

### 4. Connect the two
On the GitHub Pages page, paste the Apps Script `/exec` URL into the "Apps Script Web App URL" field, enter a student/session ID, click **Request Camera Access**, then **Start Monitoring**. Scores log to a sheet tab called `Attention_Log` every 10 seconds.

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
