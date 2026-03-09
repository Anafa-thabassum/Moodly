# Moodly
# ◈ Moodly — Inspire & Create

> A Pinterest + Canva hybrid web app for discovering visual inspiration and designing your own moodboards.

![Python](https://img.shields.io/badge/Python-3.8+-blue?style=flat-square)
![Flask](https://img.shields.io/badge/Flask-2.3+-lightgrey?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

### 📌 Pinterest-Style Feed
- Responsive masonry grid (2–5 columns depending on screen size)
- Category filter chips — Design, Nature, Urban, Fashion, Interior, Architecture, Photography
- Live search with debounce (⌘K shortcut to focus)
- Like and Save pins directly from the feed or detail modal
- Pin detail modal with color palette extraction
- 12 pre-seeded demo pins on first launch

### 🎨 Canvas Studio (Canva-style)
- **Tools:** Select, Text, Rectangle, Circle, Freehand Draw, Image Upload
- **Text editor:** font family, size, bold / italic / underline, color
- **Fill & stroke** color pickers with live hex input
- **Canvas background** — 6 gradient presets + custom color picker
- **Layer controls** — bring forward, send backward, delete
- **Publish to feed** — captures the canvas and posts it live to the board

### ⌨️ Keyboard Shortcuts (inside Canvas Studio)
| Key | Action |
|-----|--------|
| `V` | Select tool |
| `T` | Text tool |
| `R` | Rectangle tool |
| `C` | Circle tool |
| `D` | Draw tool |
| `Delete` / `Backspace` | Delete selected element |
| `⌘K` | Focus search bar |
| `Esc` | Close modals |

---

## 🗂 Project Structure

```
moodly/
├── app.py                  # Flask backend — routes & API
├── requirements.txt        # Python dependencies
├── data/
│   └── pins.json           # Pin storage (auto-created)
├── templates/
│   └── index.html          # Main HTML template (Jinja2)
└── static/
    ├── css/
    │   └── style.css       # Full design system
    ├── js/
    │   └── main.js         # Feed, canvas editor, interactions
    └── uploads/            # Uploaded images (auto-created)
```

---

## 🚀 Getting Started

### 1. Clone or download the project

```bash
cd ~/Downloads/moodly
```

### 2. Create a virtual environment (recommended)

```bash
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the app

```bash
python app.py
```

### 5. Open in browser

```
http://127.0.0.1:5000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/pins` | Get all pins (supports `?category=` and `?search=`) |
| `POST` | `/api/pins` | Create a new pin |
| `POST` | `/api/pins/<id>/like` | Like a pin |
| `POST` | `/api/pins/<id>/save` | Save a pin |
| `DELETE` | `/api/pins/<id>` | Delete a pin |
| `POST` | `/api/upload` | Upload an image file |
| `GET` | `/api/categories` | Get all unique categories |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.8+, Flask 2.3 |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Storage | JSON flat-file (`data/pins.json`) |
| Fonts | Syne (display), DM Sans (body) via Google Fonts |
| Styling | Custom CSS design system with CSS variables |

---


## 📄 License

MIT — free to use, modify, and distribute.
