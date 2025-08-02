// ===================================================================================
// Spatial Grid
// ===================================================================================
class SpatialGrid {
    constructor(width, height, cellSize) { 
        this.width = width; 
        this.height = height; 
        this.cellSize = cellSize; 
        this.grid = new Map(); 
    }
    getKey(x, y) { 
        return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`; 
    }
    insert(obj) { 
        const key = this.getKey(obj.x, obj.y); 
        if (!this.grid.has(key)) this.grid.set(key, []); 
        this.grid.get(key).push(obj); 
    }
    
    query(obj, radius) { 
        const nearby = []; 
        const minCol = Math.floor((obj.x - radius) / this.cellSize); 
        const maxCol = Math.floor((obj.x + radius) / this.cellSize); 
        const minRow = Math.floor((obj.y - radius) / this.cellSize); 
        const maxRow = Math.floor((obj.y + radius) / this.cellSize); 
        for (let col = minCol; col <= maxCol; col++) { 
            for (let row = minRow; row <= maxRow; row++) { 
                const key = `${col},${row}`; 
                if (this.grid.has(key)) nearby.push(...this.grid.get(key)); 
            } 
        } 
        return nearby; 
    }
    
    clear() { 
        this.grid.clear(); 
    }
}