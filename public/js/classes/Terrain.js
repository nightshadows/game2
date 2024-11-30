class Terrain {
    static DEPTHS = {
        BASE: 0,        // Ground layers (grass, road)
        DECORATION: 1,  // Small decorations (flowers, small rocks)
        OBJECT: 2,      // Larger objects (bushes)
        TALL: 3         // Tall objects (trees, walls)
    };

    static TYPES = {
        GRASS: {
            id: 'grass',
            spriteKey: 'grass',
            variations: 4,
            walkable: true,
            description: 'Grass',
            isBase: true
        },
        ROAD: {
            id: 'road',
            spriteKey: 'road',
            variations: 3,
            walkable: true,
            description: 'Dirt Road',
            isBase: true
        },
        WALL: {
            id: 'wall',
            spriteKey: 'wall',
            variations: 2,
            walkable: false,
            description: 'Brick Wall',
            isBase: true
        },
        TREE: {
            id: 'tree',
            spriteKey: 'tree',
            variations: 3,
            walkable: false,
            description: 'Tree',
            isBase: false
        },
        BUSH: {
            id: 'bush',
            spriteKey: 'bush',
            variations: 2,
            walkable: false,
            description: 'Bush',
            isBase: false
        },
        FLOWERS: {
            id: 'flowers',
            spriteKey: 'flowers',
            variations: 3,
            walkable: true,
            description: 'Flowers',
            isBase: false
        }
    };

    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.layers = new Map();
        this.sprites = new Map();
    }

    setBase(terrainType) {
        if (!terrainType.isBase) {
            throw new Error(`${terrainType.id} is not a base terrain type`);
        }
        this.setLayer('base', terrainType);
    }

    addObject(objectType) {
        if (objectType.isBase) {
            throw new Error(`${objectType.id} is a base terrain and cannot be added as an object`);
        }
        const layerId = `object_${objectType.id}`;
        this.setLayer(layerId, objectType);
    }

    removeObject(objectType) {
        const layerId = `object_${objectType.id}`;
        if (this.sprites.has(layerId)) {
            this.sprites.get(layerId).destroy();
            this.sprites.delete(layerId);
        }
        this.layers.delete(layerId);
    }

    setLayer(layerId, terrainType) {
        if (this.sprites.has(layerId)) {
            this.sprites.get(layerId).destroy();
        }

        const variation = this.getVariationForPosition(this.x, this.y, terrainType.variations);
        const sprite = this.scene.add.sprite(this.x, this.y, terrainType.spriteKey, variation);

        const scale = this.scene.TILE_SIZE / 32;
        sprite.setScale(scale);

        if (layerId === 'base') {
            sprite.setDepth(Terrain.DEPTHS.BASE);
        } else {
            let depth;
            switch(terrainType.id) {
                case 'flowers':
                case 'rocks':
                    depth = Terrain.DEPTHS.DECORATION;
                    break;
                case 'bush':
                    depth = Terrain.DEPTHS.OBJECT;
                    break;
                case 'tree':
                case 'wall':
                    depth = Terrain.DEPTHS.TALL;
                    break;
                default:
                    depth = Terrain.DEPTHS.OBJECT;
            }
            sprite.setDepth(depth);
        }

        this.sprites.set(layerId, sprite);
        this.layers.set(layerId, terrainType);
    }

    isWalkable() {
        for (const terrainType of this.layers.values()) {
            if (!terrainType.walkable) {
                return false;
            }
        }
        return true;
    }

    getVariationForPosition(x, y, maxVariations) {
        const hash = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);
        return Math.floor(hash % maxVariations);
    }

    destroy() {
        for (const sprite of this.sprites.values()) {
            sprite.destroy();
        }
        this.sprites.clear();
        this.layers.clear();
    }
}