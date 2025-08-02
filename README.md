Interactive Koi Pond Simulation
This project is a visually rich, interactive simulation of a koi pond, rendered in real-time using HTML5 Canvas and JavaScript. It features procedurally generated koi fish, lily pads, and flowers, all interacting with a dynamic water surface. The simulation includes realistic physics for floating objects, advanced fish AI for movement and feeding, and a host of customizable visual effects to create a serene and engaging experience.
Live Demonstration
Experience the interactive pond here: [Link to live demo]
Features
Procedurally Generated Fish: Each fish has a unique appearance and behavior, with bodies and tails rendered using segmented, physics-based animation for fluid motion.
Dynamic Water Effects:
Caustics: Realistic, moving light patterns on the pond floor, created by layering and scrolling a seamless texture.
Ripples: Interactive ripples are generated when food hits the water and reflect realistically off of floating objects.
Sparkles: Subtle glints of light animate across the water's surface, adding to the ambiance.
Interactive Objects:
Lily Pads & Flowers: Procedurally generated with unique shapes and details. They can be clicked and dragged, and they gently sway and drift on the water.
Fish Food: Click or hold the mouse button to drop food pellets into the pond. Watch as the fish react and swim towards the food.
Advanced Fish AI:
Fish exhibit natural behaviors like schooling, obstacle avoidance (walls and other fish), and attraction to food.
Their movement is governed by a steering algorithm that creates smooth, lifelike turns.
Sophisticated Rendering:
Depth & Shadows: Objects cast soft shadows that realistically offset based on their depth in the water.
Underwater Tint: Objects deeper in the water are tinted with the water color, enhancing the sense of depth.
Performance Optimization: Uses pre-rendering for static objects and a spatial grid to efficiently handle interactions.
In-depth Customization: The simulation's behavior and appearance can be extensively modified through the config.js file.
How to Interact
Feed the Fish: Click anywhere on the water to drop a food pellet. Click and hold to drop a continuous stream of food.
Move Objects: Click and drag the lily pads and flowers to move them around the pond. They will create ripples and push other objects.
Observe: Watch how the fish swim and interact with each other and their environment. Notice the subtle sways of the plants and the play of light on the water.
Customization
The config.js file provides a centralized location for tweaking almost every aspect of the simulation. No coding knowledge is required to change these values.
Key Configuration Areas:
CAUSTICS_CONFIG: Enable/disable and configure the water caustics effect, including speed, opacity, and color.
CONFIG: Adjust global settings like the number of fish, their speed, and their AI parameters (e.g., avoidance distance, turning speed).
FISH_DETAILS: Control the appearance of the fish, including their size, body proportions, and tail length.
LILYPAD_CONFIG & LILYFLOWER_CONFIG: Change the number, size, color, and shape of the lily pads and flowers.
FEED_CONFIG: Modify the properties of the fish food, such as its appearance and how fast it sinks.
RIPPLE_CONFIG & SPARKLE_CONFIG: Fine-tune the appearance and behavior of the water surface effects.
To make a change, simply open config.js in a text editor, modify the desired value, save the file, and refresh the webpage. For example, to have more fish, change numFish in the CONFIG section.
Technical Overview
The project is built with vanilla JavaScript, organized into several files for clarity:
index.html: The main entry point that sets up the canvases and includes all the scripts.
config.js: Contains all the configurable parameters for easy tweaking.
drawing.js: Handles all rendering logic for the objects, shadows, and effects onto the HTML5 canvas.
updates.js: Contains the core logic for updating the state of all objects in each frame, including physics and AI.
initialization.js: Manages the initial setup of the simulation, creating the fish, lily pads, and other objects.
utils.js: A collection of helper functions used throughout the project (e.g., math, color conversion).
spatial-grid.js: Implements a spatial grid data structure to optimize object collision and interaction detection, which is crucial for performance.
