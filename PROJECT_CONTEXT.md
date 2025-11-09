# WebGL Panorama Stitcher - Project Context

## 📋 Overview
Web application untuk memproses dan visualisasi panorama stitching dengan integrasi Python pipeline. User bisa upload session data, run stitching process, dan explore hasil dalam 3D WebGL viewer.

---

## 🏗️ Architecture

### Stack
- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Processing**: Python (unified_stitch_pipeline.py) via child_process
- **3D Viewer**: WebGL (vanilla JS)

### Directory Structure
```
webgl-capstone-projek/
├── app/
│   ├── page.tsx                    # Session list (main page)
│   ├── session/[sessionId]/        # Session detail + stitching control
│   ├── viewer/                     # WebGL 3D viewer
│   └── api/
│       └── sessions/
│           ├── route.ts            # GET: List all sessions
│           ├── [sessionId]/
│           │   ├── route.ts        # GET: Session detail
│           │   └── stitch/
│           │       └── route.ts    # POST: Process stitching
├── lib/
│   ├── types.ts                    # TypeScript interfaces
│   ├── session-utils.ts            # Session management utilities
│   └── python-runner.ts            # Python script executor
├── public/
│   ├── scripts/webgl/js/           # WebGL scripts (browser-accessible)
│   └── source/                     # Session data storage
│       └── session_XX/
│           ├── images/             # Source images
│           ├── metadatas/          # JSON metadata (group_id)
│           └── output/             # Stitching results
│               ├── stitched/       # Original version
│               └── stitched_segmentation/  # Segmented version
└── unified_script/                 # Python stitching pipeline (sibling dir)
```

---

## 🔄 Workflow

### 1. Setup Session
User manually copy folder ke `public/source/`:
```
public/source/session_01/
├── images/
│   ├── 001.png
│   ├── 002.png
│   └── ...
└── metadatas/
    ├── 001.json (contains: photo_id, session_id, group_id)
    ├── 002.json
    └── ...
```

### 2. Process Flow
```
Main Page (/)
  ↓ [Auto-scan public/source/]
Session List (dengan status badge)
  ↓ [Click session]
Session Detail (/session/[id])
  ↓ [View images, click "Process Stitching"]
API Call (POST /api/sessions/[id]/stitch)
  ↓ [Copy to unified_script/, run Python]
Python Pipeline Execution
  ↓ [Generate 2 versions]
Copy Output Back
  ↓ [Refresh UI]
Display Results (Original + Segmented)
  ↓ [Select version, click "Open WebGL Viewer"]
WebGL 3D Viewer (/viewer?session=X&version=Y)
  ↓ [Can toggle version real-time]
```

### 3. Python Integration
- **Script**: `unified_script/unified_stitch_pipeline.py`
- **Execution**: Node.js `child_process.spawn()`
- **Input**: Session folder dengan images + metadatas
- **Output**: 2 versions (original + segmented) per group
- **Data Flow**:
  1. Copy `public/source/session_XX/` → `unified_script/session_XX/`
  2. Run Python script
  3. Copy `unified_script/session_XX/output/` → `public/source/session_XX/output/`

---

## 🎨 Features

### Current Features
✅ **Auto-detect sessions** di `public/source/`
✅ **Session list** dengan status (Processed/Unprocessed)
✅ **Image gallery** grouped by group_id
✅ **One-click stitching** via button (disabled jika sudah ada output)
✅ **Dual-version output** (Original + Segmented)
✅ **Version selection** sebelum masuk WebGL
✅ **Real-time version toggle** di WebGL viewer
✅ **Dynamic group count** (tidak hardcoded 4 walls)
✅ **Flexible layout**:
  - 4 groups → Rectangular room
  - Other counts → Linear row

### UI/UX
- Responsive design (Tailwind CSS)
- Loading states & progress indicators
- Error handling dengan user-friendly messages
- In-page routing (no new window popup)

---

## 🎯 Key Components

### Backend (Next.js API)

**`lib/session-utils.ts`** - Core utilities:
- `scanSessions()` - Auto-detect session folders
- `getSessionDetails()` - Parse metadata & count groups
- `getSessionStatus()` - Check output existence
- `getStitchedOutputs()` - List hasil stitching

**`lib/python-runner.ts`** - Python execution:
- `runStitchingPipeline()` - Execute dengan options
- `checkPythonAvailable()` - Validate Python installation
- Stream stdout/stderr untuk progress tracking

**API Routes**:
- `GET /api/sessions` → List all sessions
- `GET /api/sessions/[id]` → Session detail + outputs
- `POST /api/sessions/[id]/stitch` → Process stitching

### Frontend Pages

**`app/page.tsx`** - Session list:
- Session cards dengan stats (images, groups, status)
- Processed/Unprocessed badges
- Link to detail page

**`app/session/[sessionId]/page.tsx`** - Session control:
- Image gallery per group
- Process button (auto-disabled jika processed)
- Results display (2 versions side-by-side)
- Version selector + WebGL launcher

**`app/viewer/page.tsx`** - WebGL viewer:
- Full-screen 3D panorama viewer
- Dynamic script loading dengan cache busting
- Version toggle button
- Camera controls (rotate, pan, zoom)

### WebGL Scripts (`public/scripts/webgl/js/`)

**Core Classes**:
- `Renderer` - Main WebGL renderer dengan version toggle
- `TextureLoader` - Dynamic texture loading (auto-detect groups)
- `Config` - Wall positioning (rectangular/linear layouts)
- `Camera` - 3D camera controls
- `Geometry` - Plane geometry untuk walls
- `Grid` - Coordinate grid visualization

**Important**: Scripts di `public/` agar browser bisa access langsung

---

## 🔧 Technical Details

### Metadata Format
```json
{
  "photo_id": "001",
  "session_id": "session_01",
  "group_id": 1
}
```
- `group_id` digunakan untuk grouping images sebelum stitching
- Setiap group akan menghasilkan 1 stitched panorama

### Stitching Versions
1. **Original** (`output/stitched/`):
   - Direct stitching dari source images
   - Natural panorama hasil

2. **Segmented** (`output/stitched_segmentation/`):
   - Apply segmentation (Gaussian blur + threshold + contours)
   - Stitching dari segmented images
   - Useful untuk edge detection visualization

### WebGL Layout Logic
```javascript
// 4 groups → Rectangular room
if (wallCount === 4) {
  Wall 1: Front (X-axis)
  Wall 2: Right (Z-axis, 90°)
  Wall 3: Back (-X-axis, 180°)
  Wall 4: Left (-Z-axis, -90°)
}

// Other counts → Linear row
else {
  All walls: Sequential along X-axis
}
```

---

## 🚀 Future Features Plan

### Phase 1: Server Integration
**Fitur**: Download session ZIP dari server storage
- [ ] API endpoint untuk list available sessions di server
- [ ] Download ZIP file dari server
- [ ] Auto-extract ZIP ke `public/source/`
- [ ] Progress bar untuk download & extraction
- [ ] Validation extracted content (images + metadata)

**Implementation Ideas**:
```typescript
// New API routes
GET  /api/server/sessions        // List sessions di server
POST /api/server/download         // Download & extract ZIP
  Body: { sessionId: string, serverUrl: string }

// Flow
Server List → Select → Download ZIP → Extract → Auto-refresh session list
```

### Phase 2: Advanced Stitching Options
- [ ] Custom stitching parameters UI (threshold, blur kernel, etc.)
- [ ] Real-time progress streaming dari Python
- [ ] Retry mechanism untuk failed stitching
- [ ] Batch processing multiple sessions

### Phase 3: Enhanced Viewer
- [ ] VR mode support
- [ ] Measurement tools (distance, area)
- [ ] Annotations/markers di panorama
- [ ] Export views as images/video
- [ ] Multi-session comparison view

### Phase 4: Session Management
- [ ] Delete session (with confirmation)
- [ ] Re-process session (delete output, run again)
- [ ] Session metadata editing
- [ ] Export/import session configurations
- [ ] Session history & logs

### Phase 5: Performance & UX
- [ ] WebWorker untuk heavy processing
- [ ] Lazy loading untuk large image galleries
- [ ] Thumbnail generation untuk previews
- [ ] Offline mode dengan service worker
- [ ] Mobile-responsive WebGL controls

---

## ⚙️ Prerequisites

### Development
```bash
# Node.js & NPM
node >= 18.0.0
npm >= 9.0.0

# Python (accessible dari Node.js)
python >= 3.7
pip install opencv-python numpy

# Verify
python --version  # or python3 --version
```

### Running
```bash
cd webgl-capstone-projek
npm install
npm run dev
# Open http://localhost:3000
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Python script tidak jalan
**Solution**:
- Check Python di PATH: `python --version`
- Windows: gunakan `python`, Linux/Mac: `python3`
- Update `python-runner.ts` jika perlu ubah command

### Issue 2: WebGL scripts 404
**Solution**:
- Pastikan scripts di `public/scripts/webgl/js/`
- Hard refresh browser (Ctrl+Shift+R)
- Check console untuk exact path error

### Issue 3: Stitching gagal
**Solution**:
- Check Python dependencies installed
- Verify metadata format (must have group_id)
- Check images readable (format: jpg, png, bmp, tiff)
- View Python stderr di API response

### Issue 4: Output tidak muncul
**Solution**:
- Check `unified_script/session_XX/output/` ada files
- Check copy process di API stitch route
- Refresh session detail page
- Check browser console errors

---

## 📝 Notes

- **Localhost only** - Tidak ada plan untuk deploy (safe untuk child_process)
- **Manual session upload** - User copy manual ke `public/source/`
- **Single-user** - Tidak ada user authentication
- **Session persistence** - Data persist di filesystem (public/source/)
- **Python dependency** - Requires OpenCV installed locally

---

## 🔗 Related Files

**Python Pipeline**: `../unified_script/unified_stitch_pipeline.py`
**Original Scripts**: `../temp_stiching/` (prototype/reference)
**Batch Segmentation**: `../batch_segmentation.py` (standalone tool)

---

**Last Updated**: 2025-11-09
**Version**: 1.0.0
