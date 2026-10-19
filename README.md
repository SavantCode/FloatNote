# 📝 FloatNote Sticky Notes — Chrome Extension

A lightweight, aesthetic Google Chrome extension (Manifest V3) that brings customizable, draggable sticky notes directly onto any web page you browse. It blends cozy notebook textures and artistic skins with seamless browser productivity.

---

## ✨ Features

- **Aesthetic Custom Skins:** Choose from multiple hand-crafted templates (classic notebook paper, character designs, and music notes) using a built-in dropdown selector.
- **Floating & Always-On-Top:** Injected safely via content scripts and Shadow DOM isolation so webpage CSS never interferes with your notes.
- **Precise Text Alignment:** Each skin features custom padding and line-height mappings so your digital handwriting sits neatly on the ruled lines.
- **Interactive Drag & Resize:** Grab and drag notes anywhere on your screen, or resize them fluidly using the bottom-right corner handle.
- **Selective Workspace Checklist:** Open the extension popup to check or uncheck individual notes, pinning only what you need to your current screen.
- **Local Data & Backup:** All notes save automatically to local browser storage (`chrome.storage.local`) with full JSON export and import support for backups and cross-device sharing.

---
<img width="1775" height="767" alt="image" src="https://github.com/user-attachments/assets/c5ee1c8a-8c9e-4096-8f9b-4ebfdab6b0ec" />
<img width="535" height="539" alt="image" src="https://github.com/user-attachments/assets/e0132756-b6b8-4161-9bd8-aaab24910366" />



## 📂 File Structure

```text
CustomGraphicNotes/
├── manifest.json       # Extension configuration (Manifest V3)
├── background.js       # Background service worker for tab script injection
├── popup.html          # Extension popup dashboard & checklist UI
├── popup.js            # Popup control logic and JSON backup handlers
├── skins.js            # Template art definitions, dimensions, and text rules
├── content.js          # Injected script managing floating DOM elements & drag logic
├── fonts/              # Custom handwriting font assets (e.g., Caveat.ttf)
└── images/             # Folder containing template artwork PNGs (image.png, music-note.png, etc.)
