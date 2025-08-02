// ===================================================================================
// Drawing
// ===================================================================================
function drawCausticLayers(ctx) {
    const C = CAUSTICS_CONFIG;
    if (!C.enabled || !causticsBuffer) {
        return;
    }

    const cbW = causticsBuffer.width;
    const cbH = causticsBuffer.height;
    const vW = ctx.canvas.width;
    const vH = ctx.canvas.height;

    const drawLayer = (offsetX, offsetY, opacity) => {
        ctx.globalAlpha = opacity;
        
        // Use a true modulo operator to handle negative offsets correctly.
        const scrollX = ((offsetX % cbW) + cbW) % cbW;
        const scrollY = ((offsetY % cbH) + cbH) % cbH;

        for (let y = -scrollY; y < vH; y += cbH) {
            for (let x = -scrollX; x < vW; x += cbW) {
                ctx.drawImage(causticsBuffer, x, y, cbW, cbH);
            }
        }
    };

    // --- Draw Layer 1 ---
    drawLayer(causticOffsetX1, causticOffsetY1, C.layer1.opacity);

    // --- Draw Layer 2 ---
    drawLayer(causticOffsetX2, causticOffsetY2, C.layer2.opacity);

    // --- Reset global alpha ---
    ctx.globalAlpha = 1.0;
}


function drawBackground() {
    const C = CAUSTICS_CONFIG;

    bgCtx.fillStyle = C.baseColor;
    bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    if (!C.renderOnSurface) {
        drawCausticLayers(bgCtx);
    }
}

function normalizeAngle(angle) {
    return (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
}

function mergeAngles(angles) {
    if (angles.length <= 1) return angles;
    angles.sort((a, b) => a[0] - b[0]);
    const merged = [angles[0]];
    for (let i = 1; i < angles.length; i++) {
        const last = merged[merged.length - 1];
        const current = angles[i];
        if (current[0] <= last[1]) {
            last[1] = Math.max(last[1], current[1]);
        } else {
            merged.push(current);
        }
    }
    if (merged.length > 1) {
        const first = merged[0];
        const last = merged[merged.length - 1];
        if (last[1] >= 2 * Math.PI && first[0] <= (last[1] - 2 * Math.PI)) {
             first[0] = last[0] - 2 * Math.PI;
             merged.pop();
        }
    }
    return merged;
}

function getBlockedAngles(origin, currentRadius, object) {
    const dx = object.x - origin.x;
    const dy = object.y - origin.y;
    const distance = Math.hypot(dx, dy);

    if (distance < Math.abs(currentRadius - object.radius) || distance > currentRadius + object.radius) {
        return null;
    }

    const angleToObject = Math.atan2(dy, dx);
    const angleOffset = Math.acos((currentRadius**2 + distance**2 - object.radius**2) / (2 * currentRadius * distance));

    let startAngle = normalizeAngle(angleToObject - angleOffset);
    let endAngle = normalizeAngle(angleToObject + angleOffset);

    if (startAngle > endAngle) {
        return [[startAngle, 2 * Math.PI], [0, endAngle]];
    }
    return [[startAngle, endAngle]];
}

function drawRippleWave(ctx, ripple, currentRadius) {
    ctx.beginPath();

    if (ripple.isReflection) {
        const clipObject = ripple.clipObject;
        const parentOrigin = ripple.parentOrigin;
        const dx = clipObject.x - parentOrigin.x;
        const dy = clipObject.y - parentOrigin.y;
        const dist = Math.hypot(dx, dy);
        const angleToObj = Math.atan2(dy, dx);
        const angleOffset = Math.asin(clipObject.radius / dist);
        let startAngle = angleToObj - angleOffset;
        let endAngle = angleToObj + angleOffset;

        ctx.arc(0, 0, currentRadius, endAngle, startAngle + 2 * Math.PI);

    } else {
        const blockedAngles = [];
        const origin = { x: ripple.x, y: ripple.y };

        for (const obj of allFloatingObjects) {
            const angles = getBlockedAngles(origin, currentRadius, obj);
            if(angles) blockedAngles.push(...angles);
        }

        const mergedBlocked = mergeAngles(blockedAngles);

        if (mergedBlocked.length === 0) {
            ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        } else {
            let lastEndAngle = mergedBlocked[mergedBlocked.length - 1][1];
            for (const block of mergedBlocked) {
                const startAngle = block[0];
                ctx.arc(0, 0, currentRadius, lastEndAngle, startAngle);
                lastEndAngle = block[1];
            }
        }
    }

    ctx.stroke();
}

function drawSegmentedBody(fish, bodyColor) {
    if (fish.path.length < 3) return;

    const bodyPoints = Math.floor(fish.path.length * FISH_DETAILS.bodyProportion);
    if (bodyPoints < 3) return;

    drawingContext.fillStyle = bodyColor;

    const localPath = fish.path.slice(0, bodyPoints).map(p => worldToLocal(p.x, p.y, fish));

    const angles = [];
    for (let i = 0; i < localPath.length - 1; i++) {
        const p1 = localPath[i];
        const p2 = localPath[i + 1];
        angles.push(Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.PI / 2);
    }
    angles.push(angles[angles.length - 1]);

    for (let i = 0; i < localPath.length - 1; i++) {
        const p1 = localPath[i];
        const p2 = localPath[i + 1];
        const prog1 = i / (bodyPoints - 1);
        const prog2 = (i + 1) / (bodyPoints - 1);
        const taper1 = Math.pow(1 - prog1, 0.6);
        const taper2 = Math.pow(1 - prog2, 0.6);
        const radius1 = (FISH_DETAILS.bodyWidth / 2) * taper1;
        const radius2 = (FISH_DETAILS.bodyWidth / 2) * taper2;
        const angle1 = angles[i];
        const angle2 = angles[i + 1];
        const L1 = { x: p1.x + Math.cos(angle1) * radius1, y: p1.y + Math.sin(angle1) * radius1 };
        const R1 = { x: p1.x - Math.cos(angle1) * radius1, y: p1.y - Math.sin(angle1) * radius1 };
        const L2 = { x: p2.x + Math.cos(angle2) * radius2, y: p2.y + Math.sin(angle2) * radius2 };
        const R2 = { x: p2.x - Math.cos(angle2) * radius2, y: p2.y - Math.sin(angle2) * radius2 };
        const path = new Path2D();

        path.moveTo(L1.x, L1.y);
        path.lineTo(R1.x, R1.y);
        path.lineTo(R2.x, R2.y);
        path.lineTo(L2.x, L2.y);
        path.closePath();
        drawingContext.fill(path);
    }
}

function drawSingleFish(fish, overrideColor = null) {
    const isShadow = !!overrideColor;

    let finalBodyColor;
    let finalFinColor;
    let finalVeilColor;

    if (isShadow) {
        finalBodyColor = overrideColor;
        finalFinColor = overrideColor;
        finalVeilColor = overrideColor;
    } else {
        const C = UNDERWATER_EFFECT;
        const tintRgb = hexToRgb(CAUSTICS_CONFIG.baseColor);
        const depthPercent = Math.max(0, Math.min(1,
            (C.WATER_SURFACE_Z - fish.z) / (C.WATER_SURFACE_Z - C.MAX_DEPTH)
        ));

        const tintOpacity = lerp(C.MIN_TINT_OPACITY, C.MAX_TINT_OPACITY, depthPercent);
        const r = Math.round(lerp(fish.baseRgb[0], tintRgb[0], tintOpacity));
        const g = Math.round(lerp(fish.baseRgb[1], tintRgb[1], tintOpacity));
        const b = Math.round(lerp(fish.baseRgb[2], tintRgb[2], tintOpacity));
        finalBodyColor = `rgb(${r},${g},${b})`;
        finalFinColor = `rgba(${r},${g},${b}, ${FISH_DETAILS.finOpacity})`;
        finalVeilColor = `rgba(${r},${g},${b}, ${VEIL_TAIL_CONFIG.opacity})`;
    }

    drawingContext.save();
    drawingContext.rotate(fish.angle);
    drawingContext.fillStyle = finalVeilColor;
    drawVeilTail(fish);
    drawSegmentedBody(fish, finalBodyColor);
    drawingContext.fillStyle = finalFinColor;
    drawSideFin(fish, 1, FIN_CONTROLS.side1);
    drawSideFin(fish, -1, FIN_CONTROLS.side1);
    drawSideFin(fish, 1, FIN_CONTROLS.side2);
    drawSideFin(fish, -1, FIN_CONTROLS.side2);
    drawingContext.fillStyle = finalBodyColor;
    drawFishHead(fish);
    drawingContext.restore();
}

function drawVeilTail(fish) {
    if (fish.path.length < 5) return;

    const C = VEIL_TAIL_CONFIG;
    const bodyEndIndex = Math.floor(fish.path.length * FISH_DETAILS.bodyProportion);
    const tailPath = fish.path.slice(bodyEndIndex);
    if (tailPath.length < 2) return;

    const leftEdge = [];
    const rightEdge = [];
    const time = performance.now() / 1000;

    for (let i = 0; i < tailPath.length; i++) {
        const point = tailPath[i];
        const prevPoint = i > 0 ? tailPath[i-1] : fish.path[bodyEndIndex - 1];
        if (!prevPoint) continue;

        const perpAngle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) + Math.PI / 2;
        const progress = i / (tailPath.length - 1);
        const currentBaseWidth = lerp(C.startWidth, C.endWidth, progress) / 2;
        const waveOffset = Math.sin(i / C.waveLength * (Math.PI * 2) - time * C.waveSpeed) * currentBaseWidth * C.waviness;
        const currentWidth = currentBaseWidth + waveOffset;

        const worldLeft = { x: point.x + Math.cos(perpAngle) * currentWidth, y: point.y + Math.sin(perpAngle) * currentWidth };
        const worldRight = { x: point.x - Math.cos(perpAngle) * currentWidth, y: point.y - Math.sin(perpAngle) * currentWidth };

        leftEdge.push(worldToLocal(worldLeft.x, worldLeft.y, fish));
        rightEdge.unshift(worldToLocal(worldRight.x, worldRight.y, fish));
    }

    const allPoints = leftEdge.concat(rightEdge);
    if (allPoints.length < 3) return;

    drawingContext.beginPath();
    drawingContext.moveTo(allPoints[0].x, allPoints[0].y);
    for (let i = 1; i < allPoints.length - 2; i++) {
        const p1 = allPoints[i];
        const p2 = allPoints[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        drawingContext.quadraticCurveTo(p1.x, p1.y, midX, midY);
    }
    drawingContext.quadraticCurveTo(allPoints[allPoints.length - 2].x, allPoints[allPoints.length - 2].y, allPoints[allPoints.length - 1].x, allPoints[allPoints.length - 1].y);
    drawingContext.closePath();
    drawingContext.fill();
}

function drawPetalLayer(b_ctx, flower, cx, cy, numPetals, radius, color1, color2, rotationOffset, isShadow = false) {
    const C = LILYFLOWER_CONFIG;
    const petalAngleIncrement = (Math.PI * 2) / numPetals;
    b_ctx.fillStyle = color1;
    b_ctx.strokeStyle = color2;
    b_ctx.lineWidth = isShadow ? 0 : 1.5;
    for (let i = 0; i < numPetals; i++) {
        const angle = rotationOffset + i * petalAngleIncrement;
        const tip = { x: cx + Math.cos(angle) * radius * C.petalTipSharpness, y: cy + Math.sin(angle) * radius * C.petalTipSharpness };
        const shoulderWidth = petalAngleIncrement * 0.45, shoulderRadius = radius * 0.9;
        const shoulder1 = { x: cx + Math.cos(angle - shoulderWidth) * shoulderRadius, y: cy + Math.sin(angle - shoulderWidth) * shoulderRadius };
        const shoulder2 = { x: cx + Math.cos(angle + shoulderWidth) * shoulderRadius, y: cy + Math.sin(angle + shoulderWidth) * shoulderRadius };
        const controlAngleOffset = petalAngleIncrement / 1.8;
        const cp1 = { x: cx + Math.cos(angle - controlAngleOffset) * radius * 0.5, y: cy + Math.sin(angle - controlAngleOffset) * radius * 0.5 };
        const cp2 = { x: cx + Math.cos(angle + controlAngleOffset) * radius * 0.5, y: cy + Math.sin(angle + controlAngleOffset) * radius * 0.5 };
        b_ctx.beginPath(); 
        b_ctx.moveTo(cx, cy); 
        b_ctx.quadraticCurveTo(cp1.x, cp1.y, shoulder1.x, shoulder1.y); 
        b_ctx.quadraticCurveTo(tip.x, tip.y, shoulder2.x, shoulder2.y); 
        b_ctx.quadraticCurveTo(cp2.x, cp2.y, cx, cy); 
        b_ctx.closePath(); 
        b_ctx.fill();
        if(!isShadow) b_ctx.stroke();
    }
}

function drawFishHead(fish) { 
    drawingContext.beginPath(); 
    drawingContext.arc(0, 0, FISH_DETAILS.headRadius, 0, 2 * Math.PI); 
    drawingContext.fill(); 
}

function drawSideFin(fish, side, controls) { 
    const pathInLocalSpace = fish.path.map(p => worldToLocal(p.x, p.y, fish));

    let startIdx = Math.floor(controls.pos * (pathInLocalSpace.length - 1)); 
    let endIdx = Math.min(startIdx + Math.floor(controls.len * pathInLocalSpace.length), pathInLocalSpace.length - 1); 
    if (startIdx >= endIdx || startIdx >= pathInLocalSpace.length || endIdx >= pathInLocalSpace.length || !pathInLocalSpace[startIdx - 1] || !pathInLocalSpace[endIdx - 1]) return; 

    const p1 = pathInLocalSpace[startIdx], p2 = pathInLocalSpace[endIdx]; 
    const angle1 = Math.atan2(pathInLocalSpace[startIdx - 1].y - p1.y, pathInLocalSpace[startIdx - 1].x - p1.x) + (Math.PI / 2) * side; 
    const angle2 = Math.atan2(pathInLocalSpace[endIdx - 1].y - p2.y, pathInLocalSpace[endIdx - 1].x - p2.x); 
    const finHeight = controls.hgt * (FISH_BASE_SIZE / 20); 
    const finOuterBase = { x: p1.x + Math.cos(angle1) * finHeight, y: p1.y + Math.sin(angle1) * finHeight }; 
    const finOuterTip = { x: p2.x + Math.cos(angle1) * finHeight + Math.cos(angle2) * controls.drp, y: p2.y + Math.sin(angle1) * finHeight + Math.sin(angle2) * controls.drp }; 

    drawingContext.beginPath(); 
    drawingContext.moveTo(p1.x, p1.y); 
    drawingContext.quadraticCurveTo(finOuterBase.x, finOuterBase.y, finOuterTip.x, finOuterTip.y); 
    drawingContext.lineTo(p2.x, p2.y); 
    drawingContext.closePath(); 
    drawingContext.fill(); 
}