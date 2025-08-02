
// ===================================================================================
// Initialization
// ===================================================================================
function startSimulation() {
    // Create all the objects and start the animation.
    createFishes();
    createLilypads();
    createLilyFlowers();
    setInterval(createSparkle, SPARKLE_CONFIG.spawnInterval);
    lastTime = performance.now();
    lastFpsUpdateTime = lastTime;
    requestAnimationFrame(animate);
}


function createFishes() {
    for (let i = 0; i < CONFIG.numFish; i++) {
        const speedMultiplier = randomRange(0.7, 1.3);
        const baseSpeed = CONFIG.speed * speedMultiplier;

        const fish = {
            id: objectIdCounter++, type: 'fish', z: randomRange(35, 65), 
            x: randomRange(CONFIG.cornerAvoidDistance, canvas.width - CONFIG.cornerAvoidDistance), 
            y: randomRange(CONFIG.cornerAvoidDistance, canvas.height - CONFIG.cornerAvoidDistance),
            angle: randomRange(0, 2 * Math.PI), curvature: 0, desiredCurvature: 0, cornerTurning: false, cornerTimer: 0, cornerCurvature: 0, path: [], 
            color: 'rgb(255, 140, 0)', // Solid orange color
            radius: FISH_DETAILS.headRadius,
            speedMultiplier: speedMultiplier,
            baseSpeed: baseSpeed,
            currentSpeed: baseSpeed,
            bodyCache: null // This is no longer used for a texture
        };

        // Parse the RGB color string into an array for tinting calculations.
        const colorMatch = fish.color.match(/\d+/g);
        if (colorMatch) {
            fish.baseRgb = colorMatch.map(Number);
        } else {
            fish.baseRgb = [255, 140, 0]; // Fallback
        }

        allDrawableObjects.push(fish);
    }
}

function generateNonOverlappingPosition(radius, existingObjects) { 
    let x, y, isOverlapping, safetyCounter = 0; 
    do { 
        isOverlapping = false; 
        x = randomRange(radius, canvas.width - radius); 
        y = randomRange(radius, canvas.height - radius); 
        for (const other of existingObjects) { 
            if (Math.hypot(x - other.x, y - other.y) < radius + other.radius + PHYSICS_CONFIG.repulsionBuffer) { 
                isOverlapping = true; 
                break; 
            } 
        } 
        safetyCounter++; 
    } while (isOverlapping && safetyCounter < 100); 
    return { x, y }; 
}

function preRenderObject(drawFunction, width, height) { 
    const bufferCanvas = document.createElement('canvas'); 
    const bufferCtx = bufferCanvas.getContext('2d'); 
    const padding = 10; 
    bufferCanvas.width = width + padding * 2; 
    bufferCanvas.height = height + padding * 2; 
    drawFunction(bufferCtx, bufferCanvas.width / 2, bufferCanvas.height / 2); 
    return { canvas: bufferCanvas, offsetX: bufferCanvas.width / 2, offsetY: bufferCanvas.height / 2 }; 
}

function createLilypads() {
    const C = LILYPAD_CONFIG;
    const DC = WATER_DROPLET_CONFIG;

    for (let i = 0; i < C.numPads; i++) {
        const radius = randomRange(C.minRadius, C.maxRadius);
        const { x, y } = generateNonOverlappingPosition(radius, allFloatingObjects);
        const pad = {
            id: objectIdCounter++, type: 'lilypad', z: 100, x, y, baseX: x, baseY: y, radius, pushVx: 0, pushVy: 0, angle: randomRange(0, Math.PI * 2), moveAngle: randomRange(0, Math.PI * 2), moveRadius: randomRange(1, 3), moveSpeed: randomRange(0.1, 0.3),
            sway: { angle: randomRange(0, Math.PI * 2), speed: randomRange(C.swaySpeed * 0.8, C.swaySpeed * 1.2) },
            droplets: []
        };

        const numDroplets = Math.floor(randomRange(0, DC.maxDropletsPerPad));
        const angleStep = (Math.PI * 2) / C.numPoints;
        const cutoutAngle = 2 * angleStep; 

        for (let j = 0; j < numDroplets; j++) {
            const dropletAngle = randomRange(cutoutAngle, Math.PI * 2);
            const dropletDist = Math.pow(Math.random(), 1.5) * radius * 0.95; 

            pad.droplets.push({
                x: Math.cos(dropletAngle) * dropletDist,
                y: Math.sin(dropletAngle) * dropletDist,
                radius: randomRange(DC.minRadius, DC.maxRadius)
            });
        }

        const drawLogic = (b_ctx, cx, cy, isShadow) => {
            const numPoints = C.numPoints, shapePoints = [], nickIndices = new Set();
            for (let k = 0; k < C.numNicks; k++) nickIndices.add(Math.floor(randomRange(2, numPoints - 2)));
            for (let j = 0; j <= numPoints; j++) { 
                const angle = j * angleStep; 
                let r = radius * (1 + randomRange(-C.irregularity, C.irregularity)); 
                if (nickIndices.has(j)) r *= 0.9; 
                shapePoints.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }); 
            }
            const mainCutoutSize = 2, drawingPoints = shapePoints.slice(mainCutoutSize);
            const drawPath = () => { 
                b_ctx.beginPath(); 
                b_ctx.moveTo(cx, cy); 
                const p0 = drawingPoints[0]; 
                b_ctx.lineTo(p0.x, p0.y); 
                for (let j = 0; j < drawingPoints.length - 1; j++) { 
                    const p1 = drawingPoints[j], p2 = drawingPoints[j + 1]; 
                    b_ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2); 
                } 
                b_ctx.lineTo(drawingPoints[drawingPoints.length - 1].x, drawingPoints[drawingPoints.length - 1].y); 
                b_ctx.closePath(); 
            };

            if (isShadow) {
                b_ctx.fillStyle = '#000000';
                drawPath();
                b_ctx.fill();
            } else {
                b_ctx.fillStyle = C.color; 
                b_ctx.globalAlpha = C.opacity; 
                drawPath(); 
                b_ctx.fill();
                b_ctx.strokeStyle = C.veinColor; 
                b_ctx.globalAlpha = C.veinAlpha; 
                b_ctx.lineWidth = 1.5; 
                drawingPoints.forEach(p => { 
                    b_ctx.beginPath(); 
                    b_ctx.moveTo(cx, cy); 
                    b_ctx.lineTo(p.x, p.y); 
                    b_ctx.stroke(); 
                });
                b_ctx.strokeStyle = C.darkerColor; 
                b_ctx.globalAlpha = 1.0; 
                b_ctx.lineWidth = 3; 
                drawPath(); 
                b_ctx.stroke();

                b_ctx.globalAlpha = 1.0;
                for (const droplet of pad.droplets) {
                    const dropletX = cx + droplet.x;
                    const dropletY = cy + droplet.y;
                    
                    const gradient = b_ctx.createRadialGradient(
                        dropletX - droplet.radius * 0.2,
                        dropletY - droplet.radius * 0.2,
                        0,
                        dropletX,
                        dropletY,
                        droplet.radius
                    );
                    gradient.addColorStop(0, DC.highlightColor);
                    gradient.addColorStop(1, DC.color);
                    
                    b_ctx.fillStyle = gradient;
                    b_ctx.beginPath();
                    b_ctx.arc(dropletX, dropletY, droplet.radius, 0, Math.PI * 2);
                    b_ctx.fill();
                }
            }
        };
        pad.renderCache = preRenderObject((b_ctx, cx, cy) => drawLogic(b_ctx, cx, cy, false), radius * 2, radius * 2);
        pad.shadowCache = preRenderObject((b_ctx, cx, cy) => drawLogic(b_ctx, cx, cy, true), radius * 2, radius * 2);
        allDrawableObjects.push(pad);
        allFloatingObjects.push(pad);
    }
}

function createLilyFlowers() {
    const C = LILYFLOWER_CONFIG;
    for (let i = 0; i < C.numFlowers; i++) {
        const radius = randomRange(C.minRadius, C.maxRadius);
        const { x, y } = generateNonOverlappingPosition(radius, allFloatingObjects);
        const flower = {
            id: objectIdCounter++, type: 'flower', z: 100, x, y, baseX: x, baseY: y, radius, pushVx: 0, pushVy: 0, 
            outerPetals: Math.floor(randomRange(C.minOuterPetals, C.maxOuterPetals)), 
            midPetals: Math.floor(randomRange(C.minMidPetals, C.maxMidPetals)), 
            innerPetals: Math.floor(randomRange(C.minInnerPetals, C.maxInnerPetals)),
            corePetals: Math.floor(randomRange(C.minCorePetals, C.maxCorePetals)),
            rotation: randomRange(0, Math.PI * 2), 
            moveAngle: randomRange(0, Math.PI * 2), moveRadius: randomRange(0.5, 1.5), moveSpeed: randomRange(0.05, 0.15),
            sway: { angle: randomRange(0, Math.PI * 2), speed: randomRange(C.swaySpeed * 0.8, C.swaySpeed * 1.2) },
        };
        const drawLogic = (b_ctx, cx, cy, isShadow) => {
            const rotationOffset = (Math.PI * 2) / (flower.outerPetals * 2);
            if(isShadow){
                b_ctx.fillStyle = '#000000';
                drawPetalLayer(b_ctx, flower, cx, cy, flower.outerPetals, flower.radius, '#000000', '#000000', 0, true);
                drawPetalLayer(b_ctx, flower, cx, cy, flower.midPetals, flower.radius * 0.75, '#000000', '#000000', rotationOffset, true);
                drawPetalLayer(b_ctx, flower, cx, cy, flower.innerPetals, flower.radius * 0.5, '#000000', '#000000', 0, true);
                drawPetalLayer(b_ctx, flower, cx, cy, flower.corePetals, flower.radius * 0.25, '#000000', '#000000', rotationOffset, true);
                b_ctx.beginPath(); 
                b_ctx.arc(cx, cy, flower.radius / 5.5, 0, Math.PI * 2); 
                b_ctx.fill();
            } else {
                drawPetalLayer(b_ctx, flower, cx, cy, flower.outerPetals, flower.radius, C.outerPetalColor1, C.outerPetalColor2, 0);
                drawPetalLayer(b_ctx, flower, cx, cy, flower.midPetals, flower.radius * 0.75, C.midPetalColor1, C.midPetalColor2, rotationOffset);
                drawPetalLayer(b_ctx, flower, cx, cy, flower.innerPetals, flower.radius * 0.5, C.innerPetalColor1, C.innerPetalColor2, 0);
                drawPetalLayer(b_ctx, flower, cx, cy, flower.corePetals, flower.radius * 0.25, C.corePetalColor1, C.corePetalColor2, rotationOffset);
                b_ctx.fillStyle = C.centerColor; 
                b_ctx.beginPath(); 
                b_ctx.arc(cx, cy, flower.radius / 5.5, 0, Math.PI * 2); 
                b_ctx.fill();
            }
        };
        flower.renderCache = preRenderObject((b_ctx, cx, cy) => drawLogic(b_ctx, cx, cy, false), flower.radius * 2, flower.radius * 2);
        flower.shadowCache = preRenderObject((b_ctx, cx, cy) => drawLogic(b_ctx, cx, cy, true), flower.radius * 2, flower.radius * 2);
        allDrawableObjects.push(flower);
        allFloatingObjects.push(flower);
    }
}

function createRipple(x, y, options = {}) {
    const C = RIPPLE_CONFIG;
    const damping = options.damping || 1.0;

    const ripple = {
        id: objectIdCounter++,
        type: 'ripple',
        x, y,
        z: 99, 
        creationTime: options.creationTime || performance.now() / 1000,
        duration: C.duration * damping,
        startOpacity: C.startOpacity * damping,
        maxRadius: C.maxRadius * (options.isReflection ? damping : 1.0),
        startRadius: C.startRadius,
        numWaves: C.numWaves,
        startLineWidth: C.startLineWidth,
        endLineWidth: C.endLineWidth,
        isReflection: options.isReflection || false,
        clipObject: options.clipObject || null,
        parentOrigin: options.parentOrigin || null,
        reflectedFrom: new Set(),
    };
    allDrawableObjects.push(ripple);
}

function createFeed(x, y) {
    const C = FEED_CONFIG;
    const feeds = allDrawableObjects.filter(obj => obj.type === 'feed');
    if (feeds.length >= C.maxFeeds) {
        const oldestFeedIndex = allDrawableObjects.findIndex(obj => obj.type === 'feed');
        if (oldestFeedIndex > -1) {
            allDrawableObjects.splice(oldestFeedIndex, 1);
        }
    }

    const baseRgb = hexToRgb(C.color);
    const tintRgb = hexToRgb(CAUSTICS_CONFIG.baseColor);
    const tintOpacity = UNDERWATER_EFFECT.MAX_TINT_OPACITY;
    
    const finalR = Math.round(lerp(baseRgb[0], tintRgb[0], tintOpacity));
    const finalG = Math.round(lerp(baseRgb[1], tintRgb[1], tintOpacity));
    const finalB = Math.round(lerp(baseRgb[2], tintRgb[2], tintOpacity));

    const feed = {
        id: objectIdCounter++,
        type: 'feed',
        x, y, // Current position
        spawnX: x, 
        spawnY: y, 
        fallOffsetX: randomRange(-25, 25), 
        fallOffsetY: randomRange(25, 50), 
        driftBaseX: 0, // Position at water impact
        driftBaseY: 0,
        driftTargetX: 0, // Target drift position on the floor
        driftTargetY: 0,
        z: C.startZ,
        radius: C.startRadius,
        baseRgb,
        finalRgb: [finalR, finalG, finalB],
        hasHitWater: false,
        flutterAngle: randomRange(0, Math.PI * 2),
        flutterSpeed: randomRange(1.5, 2.5),
        flutterRadius: randomRange(2, 4)
    };
    allDrawableObjects.push(feed);
}

function spawnFeedAtCursor() {
    // Check if the current mouse position is over a floating object.
    for (const obj of allFloatingObjects) {
        if (Math.hypot(lastMousePos.x - obj.x, lastMousePos.y - obj.y) < obj.radius) {
            return; // Do not spawn food if hovering over an object.
        }
    }

    const C = FEED_CONFIG;
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.random() * C.brushRadius;
    const x = lastMousePos.x + Math.cos(randomAngle) * randomRadius;
    const y = lastMousePos.y + Math.sin(randomAngle) * randomRadius;
    createFeed(x, y);
}

function createSparkle() {
    const currentSparkleCount = allDrawableObjects.filter(o => o.type === 'sparkle').length;
    if (currentSparkleCount >= SPARKLE_CONFIG.maxSparkles) {
        return; // Don't add more if we're at the cap.
    }

    const C = SPARKLE_CONFIG;
    const sparkle = {
        id: objectIdCounter++,
        type: 'sparkle',
        x: randomRange(0, canvas.width),
        y: randomRange(0, canvas.height),
        z: 98, // Drawn on the water surface, just below ripples.
        creationTime: performance.now(),
        duration: randomRange(C.minDuration, C.maxDuration),
        maxSize: randomRange(C.minSize, C.maxSize),
        color: C.color,
    };
    allDrawableObjects.push(sparkle);
}

