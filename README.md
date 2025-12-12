# 🕹️ PIXEL AI STUDIO

**Client-side AI Image Tool for POD & Creators**

A retro pixel art styled Progressive Web App (PWA) for processing images with AI - completely offline and secure.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)

## ✨ Features

- 🔒 **100% Client-Side** - Your images never leave your device
- 📴 **Works Offline** - Install as PWA, use without internet
- 🎯 **POD Ready** - Export at 300 DPI for print quality
- 🎨 **Retro Pixel Art** - Beautiful 8-bit NES aesthetic
- ⚡ **AI Powered** - Background removal & upscaling on your device

## 🛠️ Tech Stack

- **Core**: React + Vite + TypeScript
- **Styling**: Tailwind CSS + NES.css (8-bit styles)
- **Icons**: Pixel art icons
- **AI Processing**: 
  - `@imgly/background-removal` - Client-side background removal
  - `upscalerjs` + TensorFlow.js - AI image upscaling
- **Storage**: File System Access API
- **PWA**: vite-plugin-pwa

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/PIXELAISTUDIO.git
cd PIXELAISTUDIO

# Install dependencies
npm install

# Start development server
npm run dev
```

Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🎮 Tools

### 1. 🎨 Resize & Preset
Scale images for POD platforms with quick presets:
- Merch by Amazon: 4500x5400
- Etsy Listing: 2000x2000
- Mug 11oz: 2000x800

### 2. 🔄 Format Convert
Convert between PNG/JPG/WEBP formats with quality control

### 3. ✂️ Remove BG
AI-powered background removal running entirely in your browser

### 4. ⚡ Upscale 4K
Enhance images to 4K quality using AI upscaling

## 📁 Project Structure

```
PIXELAISTUDIO/
├── public/               # Static assets
├── src/
│   ├── assets/          # Icons, sounds, fonts
│   ├── components/
│   │   ├── core/       # Reusable UI components
│   │   ├── layout/     # Layout components
│   │   └── shared/     # Shared components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── utils/          # Helper functions
│   └── App.tsx         # Main app component
└── package.json
```

## 🎨 Design Philosophy

- **No rounded corners** - Everything is pixel-perfect
- **Hard shadows only** - No blur effects
- **NES color palette** - Primary, Success, Warning, Error
- **Press Start 2P font** - Authentic retro feel
- **Pixel art icons** - Custom 8-bit graphics

## 🔧 Development

### Sprint Progress

- ✅ **Sprint 1**: Foundation & Theme
- 🔄 **Sprint 2**: Core Engine & File System (Coming Soon)
- 📋 **Sprint 3**: Resize & Convert (Coming Soon)
- 📋 **Sprint 4**: AI Background Removal (Coming Soon)
- 📋 **Sprint 5**: AI Upscale 4K (Coming Soon)
- 📋 **Sprint 6**: PWA & Offline (Coming Soon)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 💚 Made with Love

Created by Pixel Artists • Powered by WebAssembly & AI

---

**Note**: This is a client-side application. All processing happens on your device for maximum privacy and security.
