// ===================================================================================
// Utility Functions
// ===================================================================================
function resize() { 
    const w = window.innerWidth; 
    const h = window.innerHeight; 
    backgroundCanvas.width = canvas.width = shadowCanvas.width = w; 
    backgroundCanvas.height = canvas.height = shadowCanvas.height = h; 
    objectGrid.width = w; 
    objectGrid.height = h; 
    drawBackground(); 
}

window.addEventListener('resize', resize);

function randomRange(min, max) { 
    return min + Math.random() * (max - min); 
}

function lerp(a, b, t) { 
    return a * (1 - t) + b * t; 
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

function hslToRgb(h, s, l) {
    s /= 100; 
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return [r, g, b];
} 