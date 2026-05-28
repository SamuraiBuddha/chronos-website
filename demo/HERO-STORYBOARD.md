# Hero Demo Storyboard -- 30 seconds, no voiceover

The existing 1:30 voiceover demo (`voiceover-script.md`) is the "explainer" version. This is the condensed **hero version**: 30 seconds, silent (autoplay-muted-loop in the browser), and visual-only. No narration needed because the viewer is already reading the hero copy.

The goal: in 30 seconds, drive home the one "wow" moment a viewer will not forget -- **three files, three projects, zero clicks, classified live**.

## Target output

| | Spec |
|---|---|
| Duration | 28-32 seconds |
| Aspect | 16:9 (1920x1080 source, deliver at 1280x720) |
| Frame rate | 30fps |
| MP4 | H.264 baseline, ~2-3 Mbps -> ~7-11 MB |
| WebM | VP9, ~1.5 Mbps -> ~5-7 MB (preferred by modern browsers) |
| GIF (optional) | 720p, ~15 fps, ~5 MB cap -- only for unfurls / RSS / Slack previews |
| Poster | First frame as PNG at 1280x720 |
| Audio | None. (Hero plays muted via autoplay-muted-loop -- audio would be stripped anyway.) |

Drop the produced files into `assets/demo/`:
- `assets/demo/hero-demo.mp4`
- `assets/demo/hero-demo.webm`
- `assets/demo/hero-demo-poster.png`
- `assets/demo/hero-demo.gif` (optional)

The `<video>` element in `index.html` will pick them up automatically (it already references these paths).

## Storyboard (sub-second precision)

### Title card -- 0:00-0:02 (2s)

Reuse the existing `demo/title-card.png`. Static frame: logo + "Chronos Timekeeping" wordmark, indigo background.
**No text overlay needed in this version** -- the page already says "Stop Losing Billable Hours" two inches above the video.

### Cut to desktop -- 0:02-0:04 (2s)

Clean Windows 11 desktop, Chronos tray icon visible in the corner with a subtle pulse. File Explorer open showing three project folders side by side:
```
C:\Demo\Baker-vs-County\
C:\Demo\EBIC-Revit-Project\
C:\Demo\Mosier-Audit-2026\
```

### Open file 1 -- 0:04-0:11 (7s)

Double-click `Baker-vs-County\Baker_Deposition_2026.pdf`. PDF opens in Adobe.
Within ~0.5 seconds, Chronos popup (top-right toast):
> **Tracking: Baker v. County / Deposition Review**
> Detection: handle enumeration (99% confidence)

Hold for 2-3 seconds so the viewer reads it. Toast fades. Status remains in the tray.

### Switch to file 2 -- 0:11-0:17 (6s)

Alt-tab back to File Explorer. Double-click `EBIC-Revit-Project\EBIC_Building_Model.rvt`. Revit opens.
Chronos popup:
> **Switched: EBIC Building Model / BIM Coordination**
> Detection: handle enumeration (98% confidence)

The point: it didn't ask, didn't guess, didn't need a keyword in the window title. It read the OS file handle.

### Switch to file 3 -- 0:17-0:22 (5s)

Alt-tab again. Open `Mosier-Audit-2026\Mosier_Q1_Workpapers.xlsx`. Excel opens.
Chronos popup:
> **Switched: Mosier Audit 2026 / Workpaper Prep**
> Detection: handle enumeration (99% confidence)

By now the viewer has seen three completely different file types, three completely different projects, three correct classifications. **This is the moment that sells.**

### Reports flash -- 0:22-0:27 (5s)

Click the Chronos tray icon. The dashboard opens for ~3 seconds. Camera cuts to the day's timeline view -- three colored blocks showing the three projects, exact minute counts, total billable hours summed at top.

Zoom into the export button area, hover over "Export to CSV" (don't click; just signal it's a button).

### CTA card -- 0:27-0:30 (3s)

Cut to `demo/cta-card.png` (already produced). Hold for 3 seconds. Last frame of the loop.

When the video loops back to 0:00 it lands on the title card again -- silent transition is fine because the viewer is reading the page; they're not watching the loop end.

## Recording approach

The full recording pipeline is already documented in `record-demo.md` (OBS Studio 28+ on Melchior, Argos MCP, Playwright MCP, Chronos installed, sample folders). That doc is for the 1:30 version; the 30-second cut reuses the same setup but:

1. Use the existing `chronos-driver.mjs` to drive the file-open sequence on a strict 5-second cadence so timing is tight
2. Record at 1920x1080@30fps for source quality
3. Cut in DaVinci Resolve (free) or Shotcut (free): trim to 28-32s, export MP4 (H.264 baseline) and WebM (VP9)
4. Generate GIF via `ffmpeg`:
   ```
   ffmpeg -i hero-demo.mp4 -vf "fps=15,scale=1280:-1:flags=lanczos,palettegen" hero-demo-palette.png
   ffmpeg -i hero-demo.mp4 -i hero-demo-palette.png -filter_complex "fps=15,scale=1280:-1:flags=lanczos[x];[x][1:v]paletteuse" hero-demo.gif
   ```

## What's measured

When the video plays (autoplay starts on page load), `<video onplay="...">` fires:
```javascript
plausible('DemoPlay', { props: { location: 'hero' } })
```

The metric to watch in Plausible: **DemoPlay-to-Download conversion**. The pre-demo baseline (no demo, just static text hero) is whatever the current Plausible numbers show post-merge of PR 1. Compare 30-day windows pre- and post-demo to measure lift.

If lift is positive: keep the demo, consider adding a longer version on the pricing page.
If lift is flat or negative: the demo is loading too slowly (check WebVitals) or the storyboard isn't selling the right moment -- re-record focusing on the strongest user reaction during testing.

## Open questions for Jordan

1. Is "three files, three projects" the right wow moment, or should we lead with idle detection (the second-strongest reaction from beta users)?
2. Should the demo include the idle-pause moment as part of the 30s, or keep the cut tight on just the multi-project switching?
3. Do we want a webcam reaction-shot overlay in the bottom corner (per existing `record-demo.md` "Demo + Cam" scene), or a clean screen-only cut?
