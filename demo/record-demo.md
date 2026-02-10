# Chronos Timekeeping - Automated Demo Recording Script

## Prerequisites

Run this from **Melchior** (Windows 11 Pro) with:
- **OBS Studio 28+** running with WebSocket server enabled (port 4455)
- **Argos MCP** connected to OBS
- **Playwright MCP** available
- **Chronos Timekeeping** installed and running
- Sample project folders set up (see below)

## OBS Scene Setup (one-time)

Create these scenes in OBS before running:

| Scene | Sources |
|-------|---------|
| `Title Card` | Image source: title-card.png (1920x1080, "Chronos Timekeeping - Stop Losing Billable Hours") |
| `Demo` | Display Capture (full screen) |
| `Demo + Cam` | Display Capture + Webcam overlay (bottom-right, 320x240) |
| `Feature Callout` | Display Capture + Text overlay (bottom bar for feature names) |
| `CTA` | Image source: cta-card.png ("Free beta at chronos-timekeeping.com") |

Audio: Desktop audio + Microphone (if doing voiceover)

## Sample Project Folders (one-time)

Create these on Melchior to demonstrate multi-project detection:

```
C:\Demo\Baker-vs-County\
    Baker_Deposition_2026.pdf
    Baker_Motion_to_Compel.docx
    Baker_Exhibit_A.pdf

C:\Demo\EBIC-Revit-Project\
    EBIC_Building_Model.rvt
    EBIC_Structural_Plans.dwg
    EBIC_RFI_Response_042.pdf

C:\Demo\Acme-Consulting\
    Acme_Q1_Analysis.xlsx
    Acme_Strategy_Deck.pptx
    Acme_SOW_Draft.docx
```

Register all three as projects in Chronos before recording.

---

## THE SCRIPT

Paste this prompt into Claude on Melchior with Argos + Playwright MCPs active:

---

### Claude Prompt (copy this entire block)

```
You are recording a 2-minute product demo video for Chronos Timekeeping.
You have access to Argos MCP (OBS control) and Playwright MCP (UI automation).
Follow this script exactly, with the specified timing between actions.

## PHASE 1: SETUP (before recording)
1. Connect to OBS via Argos MCP (localhost:4455)
2. Verify OBS is connected and get scene list
3. Switch to "Title Card" scene
4. Set desktop audio volume to 0% (we don't want system sounds)
5. Confirm Chronos Timekeeping is running in the system tray

## PHASE 2: TITLE CARD (5 seconds)
1. Start OBS recording
2. Wait 5 seconds on the Title Card scene

## PHASE 3: THE PROBLEM (15 seconds)
1. Switch to "Demo" scene
2. Open Windows File Explorer to C:\Demo\Baker-vs-County\
3. Wait 2 seconds
4. Double-click Baker_Deposition_2026.pdf to open it in the default PDF viewer
5. Wait 3 seconds - let the viewer load
6. IMPORTANT: The window title probably just shows "Baker_Deposition_2026.pdf"
   or maybe just "Adobe Acrobat" - this is the problem we're demonstrating
7. Wait 5 seconds
8. Close the PDF viewer

## PHASE 4: THE SOLUTION - HANDLE ENUMERATION (30 seconds)
1. Switch to "Feature Callout" scene
2. Click the Chronos system tray icon to open the main window
3. Wait 2 seconds for the window to appear
4. The dashboard should show the Baker-vs-County project was detected
   with the exact file path C:\Demo\Baker-vs-County\Baker_Deposition_2026.pdf
5. Wait 5 seconds - let viewers see the detection
6. Now minimize Chronos
7. Open File Explorer, navigate to C:\Demo\EBIC-Revit-Project\
8. Double-click EBIC_RFI_Response_042.pdf
9. Wait 5 seconds
10. Now open C:\Demo\Acme-Consulting\Acme_Q1_Analysis.xlsx
11. Wait 5 seconds
12. Bring Chronos back to foreground
13. The dashboard should show all three projects detected with time logged
14. Wait 5 seconds - this is the money shot

## PHASE 5: IDLE DETECTION (15 seconds)
1. Switch to "Demo" scene
2. With Chronos visible, stop moving the mouse and don't touch the keyboard
3. Wait 10 seconds (or however long until idle indicator appears)
4. NOTE: The idle threshold may be set to 5 minutes for real use -
   for the demo, temporarily set it to 10 seconds in Chronos Settings first
5. Move the mouse - show Chronos automatically resuming active tracking
6. Wait 5 seconds

## PHASE 6: REPORTS (20 seconds)
1. Switch to "Feature Callout" scene
2. In Chronos, click on the Reports tab/section
3. Wait 3 seconds
4. Show the time breakdown by project:
   - Baker-vs-County: X minutes
   - EBIC-Revit-Project: X minutes
   - Acme-Consulting: X minutes
5. If visible, show the active vs idle time breakdown
6. Wait 5 seconds
7. If there's an export button, click it to show CSV/PDF export options
8. Wait 5 seconds

## PHASE 7: PRIVACY (10 seconds)
1. In Chronos, navigate to Settings
2. Show the encryption settings / privacy section
3. Scroll to show "Local only" / "No cloud" indicators
4. Wait 5 seconds

## PHASE 8: CTA (10 seconds)
1. Switch to "CTA" scene
2. Wait 8 seconds
3. Stop OBS recording
4. Report the recording file path

## TIMING SUMMARY
- Title Card: 5s
- The Problem: 15s
- Handle Enumeration: 30s
- Idle Detection: 15s
- Reports: 20s
- Privacy: 10s
- CTA: 10s
- Total: ~105 seconds (1:45)

## NOTES
- If any step fails, pause for 2 seconds and continue to the next phase
- Use smooth, deliberate mouse movements (not instant jumps)
- Wait for windows to fully render before proceeding
- If Chronos shows a classification popup, dismiss it and continue
```

---

## Post-Recording

1. Recording saves to OBS default output folder (usually `C:\Users\JordanEhrig\Videos\`)
2. Trim the first/last second if needed in any video editor
3. Upload to YouTube
4. Embed on chronos-timekeeping.com (video section ready to go)

## Re-Recording

The beauty of this script: if you update the UI, just run it again.
Same script, new video, zero effort.
