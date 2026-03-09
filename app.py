from flask import Flask, render_template, request, jsonify, send_from_directory
import os, json, uuid, base64
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
DATA_FILE = 'data/pins.json'

os.makedirs('data', exist_ok=True)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def load_pins():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return []

def save_pins(pins):
    with open(DATA_FILE, 'w') as f:
        json.dump(pins, f, indent=2)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Seed some demo data
def seed_demo():
    if not os.path.exists(DATA_FILE) or load_pins() == []:
        demo_pins = [
            {"id": str(uuid.uuid4()), "title": "Midnight Architecture", "description": "Dark facades, glass towers, city lights bleeding into fog", "category": "Architecture", "likes": 342, "saves": 89, "color": "#1a1a2e", "gradient": "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", "created_at": "2024-01-15", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Desert Bloom", "description": "Warm terracotta meets sage green in perfect desert harmony", "category": "Nature", "likes": 521, "saves": 203, "color": "#c9753d", "gradient": "linear-gradient(135deg, #c9753d 0%, #e8a87c 50%, #7a9e7e 100%)", "created_at": "2024-01-20", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Neon Tokyo", "description": "Cyberpunk aesthetics, rain-slicked streets, holographic signs", "category": "Urban", "likes": 891, "saves": 445, "color": "#ff0090", "gradient": "linear-gradient(135deg, #0d0d0d 0%, #1a0533 50%, #ff0090 100%)", "created_at": "2024-02-01", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Ocean Depths", "description": "Bioluminescent creatures in abyssal dark blues", "category": "Nature", "likes": 673, "saves": 312, "color": "#006994", "gradient": "linear-gradient(135deg, #001219 0%, #005f73 50%, #94d2bd 100%)", "created_at": "2024-02-10", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Bauhaus Revival", "description": "Primary colors, geometric forms, functional beauty", "category": "Design", "likes": 445, "saves": 178, "color": "#e63946", "gradient": "linear-gradient(135deg, #e63946 0%, #f4d35e 50%, #118ab2 100%)", "created_at": "2024-02-15", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Misty Forests", "description": "Ancient trees draped in morning fog, moss-covered silence", "category": "Nature", "likes": 789, "saves": 367, "color": "#2d6a4f", "gradient": "linear-gradient(135deg, #081c15 0%, #1b4332 50%, #52b788 100%)", "created_at": "2024-02-20", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Rose Gold Era", "description": "Luxury minimalism in warm metallic tones", "category": "Fashion", "likes": 1203, "saves": 589, "color": "#b76e79", "gradient": "linear-gradient(135deg, #f9e4d4 0%, #c9a9a6 50%, #b76e79 100%)", "created_at": "2024-03-01", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Industrial Loft", "description": "Raw concrete, exposed brick, Edison bulb warmth", "category": "Interior", "likes": 556, "saves": 234, "color": "#6b705c", "gradient": "linear-gradient(135deg, #3d3d3d 0%, #6b705c 50%, #ffe8d6 100%)", "created_at": "2024-03-05", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Sakura Season", "description": "Cherry blossoms falling through golden afternoon light", "category": "Nature", "likes": 2341, "saves": 1102, "color": "#ffb7c5", "gradient": "linear-gradient(135deg, #fff0f3 0%, #ffb7c5 50%, #ff6b8a 100%)", "created_at": "2024-03-10", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Void Minimal", "description": "The beauty of nothing — pure black, infinite possibility", "category": "Design", "likes": 334, "saves": 167, "color": "#0a0a0a", "gradient": "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)", "created_at": "2024-03-15", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Golden Hour", "description": "That perfect moment when the sky turns molten amber", "category": "Photography", "likes": 4521, "saves": 2103, "color": "#f77f00", "gradient": "linear-gradient(135deg, #6a0572 0%, #f77f00 50%, #ffba08 100%)", "created_at": "2024-03-20", "type": "color"},
            {"id": str(uuid.uuid4()), "title": "Arctic Solitude", "description": "Endless white, blue shadows on snow, absolute stillness", "category": "Nature", "likes": 678, "saves": 289, "color": "#a8dadc", "gradient": "linear-gradient(135deg, #f0f4f8 0%, #a8dadc 50%, #457b9d 100%)", "created_at": "2024-03-25", "type": "color"},
        ]
        save_pins(demo_pins)

seed_demo()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/pins', methods=['GET'])
def get_pins():
    pins = load_pins()
    category = request.args.get('category', 'all')
    search = request.args.get('search', '').lower()
    if category != 'all':
        pins = [p for p in pins if p.get('category', '').lower() == category.lower()]
    if search:
        pins = [p for p in pins if search in p.get('title', '').lower() or search in p.get('description', '').lower()]
    return jsonify(pins)

@app.route('/api/pins', methods=['POST'])
def create_pin():
    data = request.get_json()
    pins = load_pins()
    new_pin = {
        "id": str(uuid.uuid4()),
        "title": data.get('title', 'Untitled'),
        "description": data.get('description', ''),
        "category": data.get('category', 'Design'),
        "likes": 0,
        "saves": 0,
        "color": data.get('color', '#000'),
        "gradient": data.get('gradient', ''),
        "image_data": data.get('image_data', ''),
        "canvas_data": data.get('canvas_data', ''),
        "type": data.get('type', 'design'),
        "created_at": datetime.now().strftime('%Y-%m-%d')
    }
    pins.insert(0, new_pin)
    save_pins(pins)
    return jsonify(new_pin), 201

@app.route('/api/pins/<pin_id>/like', methods=['POST'])
def like_pin(pin_id):
    pins = load_pins()
    for pin in pins:
        if pin['id'] == pin_id:
            pin['likes'] = pin.get('likes', 0) + 1
            save_pins(pins)
            return jsonify({'likes': pin['likes']})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/pins/<pin_id>/save', methods=['POST'])
def save_pin(pin_id):
    pins = load_pins()
    for pin in pins:
        if pin['id'] == pin_id:
            pin['saves'] = pin.get('saves', 0) + 1
            save_pins(pins)
            return jsonify({'saves': pin['saves']})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/pins/<pin_id>', methods=['DELETE'])
def delete_pin(pin_id):
    pins = load_pins()
    pins = [p for p in pins if p['id'] != pin_id]
    save_pins(pins)
    return jsonify({'success': True})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(path)
        return jsonify({'url': f'/static/uploads/{filename}'})
    return jsonify({'error': 'Invalid file'}), 400

@app.route('/api/categories', methods=['GET'])
def get_categories():
    pins = load_pins()
    cats = list(set(p.get('category', 'Design') for p in pins))
    return jsonify(sorted(cats))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
