# Chronos Detection Capabilities

> [!NOTE]
> Last Updated: 2026-02-16
> This document is continuously updated as new file types and applications are supported.

## Overview

Chronos uses advanced detection techniques to automatically track your work across applications with 95-98% accuracy on Windows. This document outlines all supported file types and application-specific detection profiles.

---

## Supported File Extensions

### Documents & Office
- **PDF**: `.pdf`
- **Microsoft Office**: `.docx`, `.xlsx`, `.pptx`, `.doc`, `.xls`, `.ppt`
- **Text Files**: `.txt`, `.md`, `.rtf`

### CAD & BIM
- **AutoCAD**: `.dwg`, `.dxf`, `.dwf`
- **Revit**: `.rvt`, `.rfa`, `.rte`
- **Navisworks**: `.nwd`, `.nwf`, `.nwc`
- **SketchUp**: `.skp`
- **Rhino**: `.3dm`
- **IFC (Building Information Modeling)**: `.ifc`
- **MicroStation**: `.dgn`

### Reality Capture & Point Cloud
- **ReCap**: `.rcp`, `.rcs`, `.rcc`

### Design & Creative
- **Photoshop**: `.psd`
- **Illustrator**: `.ai`

### Software Development
- **JavaScript/TypeScript**: `.js`, `.ts`, `.jsx`, `.tsx`
- **Python**: `.py`
- **Java**: `.java`
- **C/C++**: `.c`, `.cpp`, `.cs`
- **Go**: `.go`
- **Ruby**: `.rb`

### Configuration & Data
- **JSON**: `.json`
- **XML**: `.xml`
- **YAML**: `.yaml`, `.yml`
- **SQL**: `.sql`
- **Web**: `.html`, `.css`, `.scss`

---

## App-Specific Detection Profiles

### Development Tools

#### 1. **GitHub Desktop**
- **Detection Method**: Window title parsing + config file reading + CWD detection
- **Accuracy**: 95%+
- **Features**:
  - Extracts repository name from window title
  - Reads GitHub Desktop configuration for recent repos
  - Matches repo name to project folders
  - Fallback to process CWD

#### 2. **Visual Studio Code**
- **Detection Method**: Window title parsing
- **Accuracy**: 90%+
- **Features**:
  - Extracts workspace/folder path from title
  - Matches to tracked project folders

#### 3. **Web Browsers** (Chrome, Edge, Firefox, Brave)
- **Detection Method**: URL detection + tab title parsing
- **Accuracy**: 80%+
- **Features**:
  - GitHub/GitLab URL detection
  - PDF viewer detection
  - Matches GitHub repos to local projects

### CAD & Engineering

#### 4. **Autodesk Revit**
- **Detection Method**: Window title bracket parsing + file index lookup
- **Accuracy**: 90%+
- **Features**:
  - Extracts project name from title brackets: `[ProjectName - View]`
  - Removes view suffix (e.g., "3D View: {3D}")
  - Auto-appends `.rvt` extension if missing
  - Matches to file index for full path resolution

#### 5. **Autodesk ReCap** [NEW - 2026-02-16]
- **Detection Method**: Handle enumeration (Windows)
- **Accuracy**: 95%+
- **Features**:
  - Enumerates open file handles via PID
  - Filters for `.rcp`, `.rcs`, `.rcc` files
  - Direct path matching to project folders
  - Works with network paths (UNC)

### File Managers

#### 6. **Windows Explorer**
- **Detection Method**: Window title parsing
- **Accuracy**: 85%+
- **Features**:
  - Automatically classifies as "Overhead"
  - Extracts folder path from title
  - Provides context for classification

#### 7. **Dolphin** (Linux/KDE)
- **Detection Method**: Window title + DBus
- **Accuracy**: 80%+
- **Features**:
  - Extracts file paths from Dolphin window
  - KDE Wayland-compatible

#### 8. **Nautilus/GNOME Files** (Linux)
- **Detection Method**: Window title parsing
- **Accuracy**: 80%+
- **Features**:
  - Extracts folder paths
  - GNOME desktop integration

### Terminal & Shell

#### 9. **Terminal/Shell CWD Detection**
- **Supported**: PowerShell, bash, Konsole, GNOME Terminal, xterm, alacritty, kitty
- **Detection Method**: Process CWD (Current Working Directory) via `/proc` or Win32 API
- **Accuracy**: 75%+ (90%+ for Node.js processes like Claude Code)
- **Features**:
  - Reads current working directory from process
  - Filters out system paths (e.g., `C:\Windows\System32`)
  - Matches CWD to project folders
  - Special handling for Node.js (more reliable CWD)

---

## Detection Methods Hierarchy

Chronos uses multiple detection methods in parallel (Turbo Mode) or sequentially (Legacy Mode):

### 1. **Window Title Parsing + File Index** (~1ms)
- Fastest method
- Extracts filename from window title
- O(1) lookup in pre-indexed project files
- 60-70% accuracy (baseline)

### 2. **Terminal CWD Detection** (~10-50ms)
- For terminal/shell processes
- Reads process working directory
- High accuracy for development work

### 3. **App-Specific Detection** (~10-100ms)
- Custom logic for known applications
- Highest accuracy for supported apps (85-95%)
- Handles edge cases (e.g., ReCap title format)

### 4. **Handle Enumeration** (Windows, ~100-500ms)
- Enumerates open file handles via Win32 API or PowerShell
- 95-98% accuracy
- Used automatically for apps without title parsing

### 5. **Jump Lists / MRU Registry** (~50-200ms)
- Reads recent file lists from Windows registry
- Fallback for Office apps and others

### 6. **Vision Model** (Optional, ~2-5 seconds)
- Local AI analysis of window screenshots
- Uses Ollama (privacy-first, no cloud)
- Last automated resort before manual classification

### 7. **Manual Classification Popup**
- User intervention as absolute last resort
- Can "remember" mappings for future (e.g., "Outlook -> Overhead")

---

## Platform Support

| Platform | Tier | Handle Enumeration | File Detection Accuracy |
|----------|------|-------------------|------------------------|
| **Windows** | 1 (Primary) | Yes (PowerShell) | 95-98% |
| **macOS** | 2 | Yes (lsof) | 80-90% |
| **Linux** | 3 | Yes (lsof + /proc) | 80-90% (X11), 70-80% (Wayland) |

---

## Requesting New Support

### Adding File Extensions
File extensions are added based on user demand and technical feasibility. To request a new file type:
1. Open a GitHub issue with the file extension and use case
2. Provide sample window titles from the application
3. We'll add it in the next minor release

### Adding App-Specific Detection
App-specific profiles dramatically improve accuracy for specific applications. To request a new app profile:
1. Open a GitHub issue with:
   - Application name and version
   - Sample window title formats
   - Process name (from Task Manager)
   - How the app displays open files
2. We'll prioritize based on user base and complexity
3. Typical turnaround: 1-2 weeks

---

## Detection Edge Cases

### Known Limitations
1. **Wayland (Linux)**: Reduced window title access due to security model
2. **Sandboxed Apps**: Some UWP/Store apps have limited handle access
3. **Browser Tabs**: Truncated titles may require fuzzy matching
4. **Network Paths**: Some apps don't expose UNC paths in titles

### Workarounds
- **Wayland**: Uses inotify file monitoring as fallback
- **Sandboxed Apps**: Vision model or manual classification
- **Browser Tabs**: Partial filename matching against file index
- **Network Paths**: Handle enumeration captures full UNC paths

---

## Version History

### v0.1.1 (2026-02-16)
- [OK] Added ReCap support (.rcp, .rcs, .rcc)
- [OK] Added handle enumeration for ReCap process detection
- [OK] Improved network path (UNC) handling

### v0.1.0 (2025-01-XX)
- [OK] Initial release
- [OK] 40+ file extensions supported
- [OK] 9+ app-specific detection profiles
- [OK] Handle enumeration (Windows)
- [OK] File index with O(1) lookup
- [OK] Turbo Mode parallel detection

---

## Marketing Highlights

### Key Differentiators
1. **95-98% Accuracy**: Handle enumeration on Windows (vs 60-70% title parsing only)
2. **40+ File Types**: Comprehensive support for CAD, BIM, office, and code files
3. **9+ App Profiles**: Custom detection logic for popular apps
4. **Privacy-First**: All detection is local, no data transmission
5. **Continuous Improvement**: Detection profiles added based on user feedback

### Competitive Advantage
- **Traditional Time Trackers**: 60-70% accuracy (title parsing only)
- **Chronos**: 95-98% accuracy on Windows (handle enumeration)
- **Result**: 35-40% fewer manual classifications per day

---

## Technical Details

For developers and advanced users:

### Detection Architecture
- **File Index**: In-memory SQLite with O(1) filename lookups
- **Handle Enumeration**: PowerShell `Get-Process` + Win32 API via native modules
- **Vision Model**: Ollama with local Moondream/Llama3.2 models
- **Turbo Mode**: Parallel detection with first-to-respond wins
- **Confidence Scoring**: 0-100% confidence, auto-accept >= 80%

### Adding Custom Detection
See `src/main/integration/tracker-engine.js`:
- Add detection case in `_tryAppSpecificDetection()`
- Implement `_detect[AppName]Project()` method
- Return `{ method, confidence, projectId, filePath }` object

---

**Questions or feedback?** Open an issue on GitHub or contact support.
