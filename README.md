# ✨ APEX Photo Studio v1.0.0

<div align="center">

![APEX Photo Studio](https://img.shields.io/badge/APEX-Photo%20Studio%20v1.0.0-0ea5e9?style=for-the-badge&logo=aperture&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)

**Professional photo capture and editing application with a premium Lightroom-inspired interface**

[Live Demo](#) · [Features](#-features) · [Getting Started](#-getting-started) · [Keyboard Shortcuts](#-keyboard-shortcuts)

</div>

---

## 🎯 Features

### 📷 Camera Capture
- **Live Preview** with real-time video feed
- **Resolution Selection** (4K, 2K, 1080p, 720p, Max Quality)
- **Timer Mode** (2s, 5s, 10s countdown)
- **Multi-camera Support** with easy switching
- **Animated Countdown Overlay**

### 🎨 Professional Editor
- **Real-time Image Processing** with instant preview
- **Before/After Comparison** with draggable split view
- **Zoom & Pan** with mouse wheel and drag support
- **Grid Overlays** (Rule of Thirds, Golden Ratio, Diagonals, Center)
- **Zebra Patterns** for exposure clipping detection

### 🎚️ Adjustment Controls
| Basic | Color | Detail |
|-------|-------|--------|
| Exposure | Temperature | Clarity |
| Contrast | Tint | Sharpness |
| Highlights | Vibrance | Noise Reduction |
| Shadows | Saturation | |
| Whites | | |
| Blacks | | |

### 📊 Real-time Histogram
- RGB channel visualization
- Clipping detection with animated indicators
- Live updates during adjustments

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/juliandeveloper05/apex-photo-studio.git

# Navigate to the project
cd apex-photo-studio

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `C` | Switch to Camera mode |
| `E` | Switch to Editor mode |
| `G` | Cycle through grid overlays |
| `Z` | Toggle zebra patterns |
| `H` | Toggle histogram |
| `\` | Toggle before/after comparison |
| `+` / `-` | Zoom in/out |
| `0` | Reset zoom to 100% |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

---

## 🛠️ Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand
- **Icons:** Lucide React
- **Image Processing:** Custom Canvas-based engine

---

## 📁 Project Structure

```
apex-photo-studio/
├── src/
│   ├── components/       # React components
│   │   ├── Camera.tsx        # Camera capture
│   │   ├── Editor.tsx        # Image editor
│   │   ├── Toolbar.tsx       # Top toolbar
│   │   ├── AdjustmentsPanel.tsx  # Sliders panel
│   │   ├── Histogram.tsx     # RGB histogram
│   │   ├── GridOverlay.tsx   # Composition guides
│   │   └── ZebraOverlay.tsx  # Clipping patterns
│   ├── engine/           # Image processing
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript definitions
│   └── utils/            # Utility functions
├── public/
└── package.json
```

---

## ✨ Design Features

- **Glassmorphism UI** with blur effects and transparency
- **Premium Animations** for smooth interactions
- **Custom Sliders** with glow effects and bidirectional support
- **Responsive Layout** for desktop and tablet
- **Dark Theme** optimized for photo editing

---

## �‍💻 Author

**Julian Javier Soto**

- GitHub: [@juliandeveloper05](https://github.com/juliandeveloper05)

---

## 📄 License

MIT License © 2026 Julian Javier Soto

---

<div align="center">

**APEX Photo Studio v1.0.0**

Made with ❤️ by Julian Javier Soto

</div>
