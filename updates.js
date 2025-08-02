// ===================================================================================
// Update Logic
// ===================================================================================
function updateObjectPhysics(time, dt) {
    const C = PHYSICS_CONFIG;
    for (const objA of allFloatingObjects) {
        const nearbyObjects = objectGrid.query(objA, objA.radius + C.repulsionBuffer);
        for (const objB of nearbyObjects) {
            if (objA === objB || objB.type === 'fish' || objB.type === 'feed') continue; 
            const dx = objB.x - objA.x, dy = objB.y - objA.y, distance = Math.hypot(dx, dy);
            const minDistance = objA.radius + objB.radius + C.repulsionBuffer;
            if (distance < minDistance && distance > 0) {
                const overlap = minDistance - distance, force = overlap * C.repulsionStrength, forceX = (dx / distance) * force, forceY = (dy / distance) * force;
                if (objA !== draggedObject) { objA.pushVx -= forceX; objA.pushVy -= forceY; }
                if (objB !== draggedObject) { objB.pushVx += forceX; objB.pushVy += forceY; }
            }
        }
    }
    allFloatingObjects.forEach(obj => {
        if (obj === draggedObject) {
            obj.pushVx = 0; obj.pushVy = 0;
        } else {
            const speed = Math.hypot(obj.pushVx, obj.pushVy);
            if (speed > C.maxSpeed) {
                const ratio = C.maxSpeed / speed;
                obj.pushVx *= ratio; obj.pushVy *= ratio;
            }
            obj.baseX += obj.pushVx; obj.baseY += obj.pushVy;
            obj.pushVx *= C.damping; obj.pushVy *= C.damping;
            if (obj.baseX - obj.radius < 0) { obj.baseX = obj.radius; obj.pushVx *= -1; }
            if (obj.baseX + obj.radius > canvas.width) { obj.baseX = canvas.width - obj.radius; obj.pushVx *= -1; }
            if (obj.baseY - obj.radius < 0) { obj.baseY = obj.radius; obj.pushVy *= -1; }
            if (obj.baseY + obj.radius > canvas.height) { obj.baseY = canvas.height - obj.radius; obj.pushVy *= -1; }
        }
        const swayConfig = obj.type === 'lilypad' ? LILYPAD_CONFIG : LILYFLOWER_CONFIG;
        obj.x = obj.baseX + Math.cos(time * obj.moveSpeed + obj.moveAngle) * obj.moveRadius;
        obj.y = obj.baseY + Math.sin(time * obj.moveSpeed + obj.moveAngle) * obj.moveRadius;
        if (obj.sway) {
            const swayValue = Math.sin(time * obj.sway.speed + obj.sway.angle);
            if (obj.type === 'lilypad') {
                obj.angle += swayValue * swayConfig.swayAngle * dt;
            } else if (obj.type === 'flower') {
                obj.rotation += swayValue * swayConfig.swayAngle * dt;
            }
        }
    });
}

function calculateSteeringCurvature(fish, nearbyObjects) {
    const C = CONFIG;
    const FC = FEED_CONFIG;
    let totalCurvature = 0;

    // --- Repulsive Forces ---
    let repulsionCurv = 0;
    const lx = fish.x + Math.cos(fish.angle) * C.lookaheadDistance;
    const ly = fish.y + Math.sin(fish.angle) * C.lookaheadDistance;
    
    const wD = C.wallAvoidDistance;
    if (lx < wD) repulsionCurv += (Math.sign((0-fish.angle+Math.PI)%(2*Math.PI)-Math.PI) / C.turnRate) * Math.pow((wD - lx)/wD, 2) * C.wallAvoidStrength; 
    if (lx > canvas.width-wD) repulsionCurv += (Math.sign((Math.PI-fish.angle+Math.PI)%(2*Math.PI)-Math.PI) / C.turnRate) * Math.pow((lx-(canvas.width-wD))/wD, 2) * C.wallAvoidStrength; 
    if (ly < wD) repulsionCurv += (Math.sign((Math.PI/2-fish.angle+Math.PI)%(2*Math.PI)-Math.PI) / C.turnRate) * Math.pow((wD-ly)/wD, 2) * C.wallAvoidStrength; 
    if (ly > canvas.height-wD) repulsionCurv += (Math.sign((-Math.PI/2-fish.angle+Math.PI)%(2*Math.PI)-Math.PI) / C.turnRate) * Math.pow((ly-(canvas.height-wD))/wD, 2) * C.wallAvoidStrength; 
    
    let fishRepulsionCurv = 0, sumW = 0;
    for (const other of nearbyObjects) {
        if (other === fish || other.type !== 'fish') continue;
        const d = Math.hypot(other.x - fish.x, other.y - fish.y);
        if (d < C.avoidDistance && d > 0) {
            const awayAng = Math.atan2(fish.y - other.y, fish.x - other.x);
            const diff = (awayAng - fish.angle + Math.PI) % (2*Math.PI) - Math.PI;
            const w = Math.pow((C.avoidDistance - d) / C.avoidDistance, 2);
            fishRepulsionCurv += (diff / C.turnRate) * w * C.avoidStrength;
            sumW += w;
        }
    }
    if (sumW > 0) fishRepulsionCurv /= sumW;
    repulsionCurv += fishRepulsionCurv;

    // --- Attractive Forces ---
    let attractionCurv = 0;
    const feeds = nearbyObjects.filter(o => o.type === 'feed' && o.z < FC.ATTRACTION_Z_THRESHOLD);
    let closestFeed = null;
    let minFeedDist = C.attractionDistance;

    if (feeds.length > 0) {
        for (const feed of feeds) {
            const d = Math.hypot(feed.x - fish.x, feed.y - fish.y);
            if (d < minFeedDist) {
                minFeedDist = d;
                closestFeed = feed;
            }
        }

        if (closestFeed) {
            const toFeedAng = Math.atan2(closestFeed.y - fish.y, closestFeed.x - fish.x);
            const diff = (toFeedAng - fish.angle + Math.PI) % (2 * Math.PI) - Math.PI;
            const weight = Math.pow((C.attractionDistance - minFeedDist) / C.attractionDistance, 0.5);
            attractionCurv = (diff / C.turnRate) * weight * C.attractionStrength;
        }
    }
    
    // --- Combine Forces ---
    if (Math.abs(repulsionCurv) > Math.abs(attractionCurv) * 1.5) {
         totalCurvature = repulsionCurv;
    } else {
         totalCurvature = lerp(repulsionCurv, attractionCurv, 0.6);
    }

    return totalCurvature;
}

// Helper function to convert world coordinates to a fish's local space
function worldToLocal(worldX, worldY, fish) {
    const dx = worldX - fish.x;
    const dy = worldY - fish.y;
    const cosA = Math.cos(-fish.angle);
    const sinA = Math.sin(-fish.angle);
    const localX = dx * cosA - dy * sinA;
    const localY = dx * sinA + dy * cosA;
    return { x: localX, y: localY };
}

function updateFishes(dt) { 
    const C = CONFIG;
    const FC = FEED_CONFIG;
    const fishes = allDrawableObjects.filter(obj => obj.type === 'fish'); 
    // Filter for attractive food based on the new threshold.
    const feeds = allDrawableObjects.filter(obj => obj.type === 'feed' && obj.z < FC.ATTRACTION_Z_THRESHOLD);

    fishes.forEach(fish => { 
        // --- Speed Control ---
        let closestFeedDist = C.attractionDistance;
        let isAttracted = false;
        if (feeds.length > 0) {
            for (const feed of feeds) {
                const d = Math.hypot(feed.x - fish.x, feed.y - fish.y);
                if (d < closestFeedDist) {
                    closestFeedDist = d;
                    isAttracted = true;
                }
            }
        }

        let targetSpeed = isAttracted ? fish.baseSpeed * C.feedSpeedBoost : fish.baseSpeed;
        fish.currentSpeed = lerp(fish.currentSpeed, targetSpeed, 0.1);


        // --- Steering Control ---
        if (fish.cornerTurning) { 
            fish.cornerTimer += dt; 
            if (fish.cornerTimer >= C.cornerTurnDuration) fish.cornerTurning = false; 
        } else { 
            const lx = fish.x + Math.cos(fish.angle) * C.lookaheadDistance;
            const ly = fish.y + Math.sin(fish.angle) * C.lookaheadDistance; 
            let turned = false; 
            const corners = [[0, 0], [canvas.width, 0], [0, canvas.height], [canvas.width, canvas.height]]; 
            for (const [cx, cy] of corners) { 
                if (Math.hypot(lx - cx, ly - cy) < C.cornerAvoidDistance) { 
                    const away = Math.atan2(ly - cy, lx - cx); 
                    const diff = ((away - fish.angle + Math.PI) % (2 * Math.PI)) - Math.PI; 
                    fish.cornerTurning = true; 
                    fish.cornerCurvature = (Math.sign(diff) || 1) * C.maxCurvature; 
                    fish.cornerTimer = 0; 
                    turned = true; 
                    break; 
                } 
            } 
            if (!turned) { 
                const queryRadius = Math.max(C.avoidDistance, C.attractionDistance);
                fish.desiredCurvature = calculateSteeringCurvature(fish, objectGrid.query(fish, queryRadius)); 
            } else { 
                fish.desiredCurvature = fish.cornerCurvature; 
            } 
        } 

        // --- Update Position ---
        fish.curvature += (fish.desiredCurvature - fish.curvature) * C.curvatureSmoothing; 
        fish.curvature = Math.max(-C.maxCurvature, Math.min(C.maxCurvature, fish.curvature));
        fish.angle += fish.curvature * C.turnRate * dt; 
        fish.x += Math.cos(fish.angle) * fish.currentSpeed * dt; 
        fish.y += Math.sin(fish.angle) * fish.currentSpeed * dt; 
        fish.x = Math.max(0, Math.min(canvas.width, fish.x)); 
        fish.y = Math.max(0, Math.min(canvas.height, fish.y)); 

        // --- Update Path for Tail ---
        fish.path.unshift({ x: fish.x, y: fish.y, angle: fish.angle });

        let totalLength = 0;
        let cutIndex = -1;
        for (let i = 1; i < fish.path.length; i++) {
            const p1 = fish.path[i-1];
            const p2 = fish.path[i];
            totalLength += Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (totalLength > FISH_DETAILS.tailLength) {
                cutIndex = i;
                break;
            }
        }

        if (cutIndex !== -1) {
            fish.path.splice(cutIndex);
        }
    }); 
}

function updateRipples(time) {
    const C = RIPPLE_CONFIG;
    const timeSeconds = time / 1000;
    const easeOutQuad = t => t * (2 - t);

    for (let i = 0; i < allDrawableObjects.length; i++) {
        const obj = allDrawableObjects[i];
        if (obj.type === 'ripple') {
            const age = timeSeconds - obj.creationTime;
            if (age > obj.duration) {
                allDrawableObjects.splice(i, 1);
                i--;
                continue;
            }
            obj.progress = age / obj.duration;

            if (!obj.isReflection && obj.reflectedFrom.size < C.maxReflections) {
                const currentRadius = lerp(obj.startRadius, obj.maxRadius, easeOutQuad(obj.progress));

                for (const floatObj of allFloatingObjects) {
                    if (obj.reflectedFrom.has(floatObj.id)) continue;

                    const dx = floatObj.x - obj.x;
                    const dy = floatObj.y - obj.y;
                    const distance = Math.hypot(dx, dy);

                    if (distance < currentRadius + floatObj.radius && distance > 0) {
                        
                        const rx = floatObj.x - (dx / distance) * floatObj.radius;
                        const ry = floatObj.y - (dy / distance) * floatObj.radius;

                        const remainingIntensity = 1 - obj.progress;
                        const reflectionDamping = C.reflectionDamping * remainingIntensity;

                        createRipple(rx, ry, {
                            creationTime: timeSeconds,
                            isReflection: true,
                            damping: reflectionDamping,
                            clipObject: floatObj,
                            parentOrigin: { x: obj.x, y: obj.y }
                        });

                        obj.reflectedFrom.add(floatObj.id);
                        
                        if (obj.reflectedFrom.size >= C.maxReflections) break;
                    }
                }
            }
        }
    }
}

function updateFeeds(time, dt) {
    const C = FEED_CONFIG;
    const UC = UNDERWATER_EFFECT;
    const fishes = allDrawableObjects.filter(obj => obj.type === 'fish');

    for (let i = allDrawableObjects.length - 1; i >= 0; i--) {
        const obj = allDrawableObjects[i];
        if (obj.type === 'feed') {

            let wasEaten = false;
            if (obj.z < C.ATTRACTION_Z_THRESHOLD) {
                for(const fish of fishes) {
                     if (Math.hypot(fish.x - obj.x, fish.y - obj.y) < fish.radius * 1.5) {
                        allDrawableObjects.splice(i, 1);
                        wasEaten = true;
                        break;
                     }
                }
            }

            if (wasEaten) {
                continue;
            }

            if (obj.z > UC.MAX_DEPTH) {
                const wasAboveWater = obj.z > UC.WATER_SURFACE_Z;

                if (obj.hasHitWater) {
                    obj.z -= C.sinkSpeed * dt;

                    const sinkProgress = (UC.WATER_SURFACE_Z - obj.z) / (UC.WATER_SURFACE_Z - UC.MAX_DEPTH);
                    const baseX = lerp(obj.driftBaseX, obj.driftTargetX, sinkProgress);
                    const baseY = lerp(obj.driftBaseY, obj.driftTargetY, sinkProgress);

                    obj.x = baseX + Math.cos(time * obj.flutterSpeed + obj.flutterAngle) * obj.flutterRadius;
                    obj.y = baseY + Math.sin(time * obj.flutterSpeed + obj.flutterAngle) * obj.flutterRadius;

                } else {
                    obj.z -= C.fallSpeed * dt;
                    const fallProgress = 1.0 - Math.max(0, obj.z) / C.startZ;
                    obj.x = lerp(obj.spawnX, obj.spawnX + obj.fallOffsetX, fallProgress);
                    obj.y = lerp(obj.spawnY, obj.spawnY + obj.fallOffsetY, fallProgress);
                }

                obj.z = Math.max(UC.MAX_DEPTH, obj.z); 

                if (wasAboveWater && obj.z <= UC.WATER_SURFACE_Z) {
                    if (!obj.hasHitWater) {
                        createRipple(obj.x, obj.y);
                        obj.hasHitWater = true;
                        obj.driftBaseX = obj.x; 
                        obj.driftBaseY = obj.y;
                        obj.driftTargetX = obj.x + randomRange(-15, 15);
                        obj.driftTargetY = obj.y + randomRange(-15, 15);
                    }
                }
            }
        }
    }
}

function updateSparkles(time) {
    for (let i = allDrawableObjects.length - 1; i >= 0; i--) {
        const obj = allDrawableObjects[i];
        if (obj.type === 'sparkle') {
            const age = time - obj.creationTime;
            if (age > obj.duration) {
                allDrawableObjects.splice(i, 1);
            }
        }
    }
}