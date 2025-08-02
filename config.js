// ===================================================================================
// Configuration
// ===================================================================================
const FISH_BASE_SIZE = 50;  // The master size control for all fish parts.

const CAUSTICS_CONFIG = {
    enabled: true,
    renderOnSurface: true,
    surfaceZIndex: 99,
    // A seamless, tileable caustics texture. You can replace this with your own.
    imageSrc: 'water.png',
    // Layer 1 (slow, broad movement)
    layer1: {
        speedX: 3,
        speedY: 3,
        opacity: 0.1
    },
    // Layer 2 (faster, more detailed movement in a different direction)
    layer2: {
        speedX: -5,
        speedY: 5,
        opacity: 0.1
    },
    // The base color of the pond floor. This will also be used for the underwater tint.
    baseColor: '#4eb7d5' 
};

const FISH_DETAILS = {
    tailLength: FISH_BASE_SIZE * 3, // Total length of the fish's follow-path (body + tail).
    bodyProportion: 0.8, // The percentage of tailLength that is the solid body (the rest is the veil).
    bodyWidth: FISH_BASE_SIZE, // The maximum width of the fish's main body.
    headRadius: FISH_BASE_SIZE * 0.48, // The radius of the fish's head.
    finOpacity: 0.7 // The transparency of the side fins.
};

const VEIL_TAIL_CONFIG = {
    startWidth: FISH_DETAILS.bodyWidth * 0.05, // How wide the tail is where it meets the body.
    endWidth: FISH_DETAILS.bodyWidth * 0.1, // How wide the tail is at its tip.
    waviness: 0.2, // The amplitude of the tail's side-to-side wave motion.
    waveLength: 20, // The length of a single wave along the tail. Larger numbers = longer waves.
    waveSpeed: 5, // How fast the waves travel down the tail.
    opacity: 0.7 // The transparency of the tail veil.
};

const CONFIG = {
    numFish: 15,            // Total number of fish in the pond.
    speed: 50,              // The fish's normal cruising speed (pixels/sec).
    feedSpeedBoost: 2,      // Speed multiplier when a fish is chasing food.
    maxCurvature: 1.5,      // The sharpest turn a fish can make. Lower values = wider turns.
    turnRate: Math.PI,      // How quickly a fish can change its angle.
    cornerAvoidDistance: 125, // How far from a corner a fish starts to turn.
    cornerTurnDuration: 0.05, // How long the special corner-turning logic lasts.
    wallAvoidDistance: 100, // How far from a wall a fish starts to turn.
    wallAvoidStrength: 1.0, // How strongly a fish is pushed from walls.
    avoidDistance: 100, // The radius around a fish where it avoids others.
    avoidStrength: 1.0,     // How strongly fish repel each other.
    lookaheadDistance: 10,  // How far in front the fish checks for obstacles.
    curvatureSmoothing: 0.1, // Smooths out turning motion. Lower is smoother.
    attractionDistance: 450, // How far away a fish can "see" food.
    attractionStrength: 1.0, // How strongly a fish is pulled towards food.
    showForceOverlay: false // Set to true to see a debug view of forces.
};

const PHYSICS_CONFIG = {
    repulsionStrength: 0.04, // How strongly floating objects push each other apart.
    repulsionBuffer: 2,     // Extra padding for object collision.
    damping: 0.985,         // Simulates water friction on floating objects. Closer to 1 is less friction.
    maxSpeed: 3.5           // The fastest a floating object can move when pushed.
};

const LILYPAD_CONFIG = {
    numPads: 7,             // Number of lily pads to create.
    minRadius: 60,          // The smallest possible lily pad radius.
    maxRadius: 140,         // The largest possible lily pad radius.
    color: '#2E7D32', // The main color of the lily pads.
    darkerColor: '#1B5E20', // The color for outlines and details.
    opacity: 0.9, // The transparency of the lily pads.
    irregularity: 0.05, // How non-circular and natural the pads look.
    numPoints: 65, // The number of points in the pad's shape. More = smoother.
    veinColor: '#1B5E20', // The color of the veins on the pad.
    veinAlpha: 0.4,         // The transparency of the veins.
    numNicks: 5,            // Number of small cuts on the pad's edge for realism.
    swayAngle: 0.05,        // How much the pad rotates back and forth.
    swaySpeed: 0.15,        // The speed of the rotational sway.
    swayRadius: 3           // The radius of the pad's gentle drifting motion.
};

const WATER_DROPLET_CONFIG = {
    maxDropletsPerPad: 7,   // Max number of water droplets on a single lily pad.
    minRadius: 1,           // The smallest droplet size.
    maxRadius: 3,           // The largest droplet size.
    color: 'rgba(230, 245, 255, 0.2)', // The base color of the droplets.
    highlightColor: 'rgba(255, 255, 255, 0.3)' // The color for the shiny highlight.
};

const LILYFLOWER_CONFIG = {
    numFlowers: 4,          // Number of lily flowers to create.
    minRadius: 20,          // The smallest possible flower radius.
    maxRadius: 40,          // The largest possible flower radius.
    petalTipSharpness: 1.7, // Makes petal tips more or less pointy.
    minOuterPetals: 12,     // Min number of petals in the outer layer.
    maxOuterPetals: 14,     // Max number of petals in the outer layer.
    outerPetalColor1: '#FFF0F5', // Fill color for outer petals.
    outerPetalColor2: '#FFE4E1', // Outline color for outer petals.
    minMidPetals: 14,       // Min number of petals in the middle layer.
    maxMidPetals: 16,       // Max number of petals in the middle layer.
    midPetalColor1: '#FFC0CB', // Fill color for middle petals.
    midPetalColor2: '#FFB6C1', // Outline color for middle petals.
    minInnerPetals: 15,     // Min number of petals in the inner layer.
    maxInnerPetals: 17, // Max number of petals in the inner layer.
    innerPetalColor1: '#FF69B4', // Fill color for inner petals.
    innerPetalColor2: '#DB7093', // Outline color for inner petals.
    minCorePetals: 16, // Min number of petals in the central layer.
    maxCorePetals: 18, // Max number of petals in the central layer.
    corePetalColor1: '#C71585', // Fill color for core petals.
    corePetalColor2: '#8B008B', // Outline color for core petals.
    centerColor: '#FFD700', // The color of the flower's very center.
    swayAngle: 0.05,        // How much the flower rotates back and forth.
    swaySpeed: 0.3,         // The speed of the flower's sway.
    swayRadius: 1.5         // The radius of the flower's drifting motion.
};

const FEED_CONFIG = {
    fallSpeed: 200,         // How fast food falls from the "sky" (pixels/sec).
    sinkSpeed: 50,          // How fast food sinks once in the water (pixels/sec).
    ATTRACTION_Z_THRESHOLD: 50, // Z-level at which fish become attracted to food.
    startRadius: 8,         // The size of the food pellets.
    color: '#8B4513',     // The color of the food.
    maxFeeds: 20,           // The maximum number of food pellets on screen at once.
    startZ: 200,            // How high above the water the food spawns.
    brushRadius: 20,        // Spawns food in a random radius around the cursor.
    spawnInterval: 150      // Time between food spawns when mouse is held (in ms).
};

const FIN_CONTROLS = {
    // Fins closer to the head
    side1: {
        pos: 0.1,           // Position along the body (0=head, 1=tail).
        len: 0.05,          // Length of the fin's base.
        hgt: 13,            // How far the fin extends from the body.
        drp: -22            // How much the fin tip droops backward.
    },
    // Fins in the middle of the body
    side2: {
        pos: 0.5,           // Position along the body.
        len: 0.05,          // Length of the fin's base.
        hgt: 7,             // How far the fin extends.
        drp: -8             // How much the fin tip droops.
    }
};

const SHADOW_CONFIG = {
    color: 'rgba(0, 0, 0, 0.25)', // The color and transparency of all shadows.
    maxOffset: 25,          // How far shadows are offset for objects deep in the water.
    xOffsetMultiplier: 1.6  // How much the shadow is offset horizontally relative to its vertical offset.
};

const UNDERWATER_EFFECT = {
    WATER_SURFACE_Z: 100,   // The z-level of the water's surface.
    MIN_TINT_OPACITY: 0.1,  // The tint opacity for objects at the surface.
    MAX_TINT_OPACITY: 0.25, // The tint opacity for objects deep underwater.
    MAX_DEPTH: 0            // The z-level considered to be the deepest.
};

const RIPPLE_CONFIG = {
    duration: 7,            // How long a ripple lasts on screen (in seconds).
    numWaves: 1,            // Number of concentric waves per ripple effect.
    startRadius: 5,         // The initial size of the ripple.
    maxRadius: 300,         // The final size the ripple expands to.
    startOpacity: 0.2,      // The ripple's starting transparency.
    startLineWidth: 2,      // The initial thickness of the ripple line.
    endLineWidth: 0,        // The final thickness of the ripple line.
    maxReflections: 5,      // How many times a ripple can bounce off floating objects.
    reflectionDamping: 0.5  // How much a ripple's intensity is reduced after a reflection.
};

const SPARKLE_CONFIG = {
    enabled: true,          // <<< SET THIS TO false TO DISABLE SPARKLES
    maxSparkles: 100,       // The maximum number of sparkles on screen at any time.
    spawnInterval: 100,     // How often (in milliseconds) a new sparkle might be created.
    minDuration: 1500,      // The shortest lifespan for a sparkle (in ms).
    maxDuration: 3000,      // The longest lifespan for a sparkle (in ms).
    minSize: 1,             // The smallest possible sparkle size.
    maxSize: 2,             // The largest possible sparkle size.
    color: 'rgba(255, 255, 255, 0.8)' // The color and base opacity of the sparkles.
};

