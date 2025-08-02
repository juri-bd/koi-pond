# Interactive Koi Pond Simulation

An immersive, real-time simulation of a koi pond rendered with **HTML5 Canvas + vanilla JavaScript**, featuring procedurally generated fish, interactive flora, and dynamic water effects. Designed for serenity, exploration, and deep customization.

## Features

### 🐟 Procedurally Generated Fish
- Unique appearance per fish (size, body proportions, tail length).
- Physics-based segmented animation for fluid, lifelike motion.
- Advanced AI: schooling behavior, obstacle avoidance, smooth steering, and attraction to fish food.

### 🌊 Dynamic Water Effects
- **Caustics**: Realistic shifting light patterns on the pond floor.
- **Ripples**: Interactive ripples from food drops and object movement, reflecting off floating elements.
- **Sparkles**: Subtle ambient glints for enhanced visual depth.

### 🌸 Interactive Objects
- **Lily Pads & Flowers**: Procedurally created, each with a unique shape. Click-and-drag support; they sway and drift naturally.
- **Fish Food**: Click or hold to drop pellets; fish detect and respond with emergent group behavior.

### 🎨 Sophisticated Rendering
- Depth-based tinting for underwater immersion.
- Soft shadows offset by perceived depth.
- Performance-conscious rendering (see below).

### ⚙️ In-depth Customization
Everything is exposed in `config.js` — no build step, no framework knowledge required for tweaking.

## Installation

1. Clone or download the repository.
2. Open `index.html` in a modern browser (no server required for basic usage).
   ```sh
   # If you want a simple local server (recommended for consistency):
   python -m http.server 8000
