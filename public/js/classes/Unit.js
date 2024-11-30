class Unit {
    constructor(scene, type, x, y, stats) {
        this.scene = scene;
        this.type = type;

        // Base stats
        this.maxHealth = stats.health || 100;
        this.health = this.maxHealth;
        this.attack = stats.attack || 10;
        this.defense = stats.defense || 5;
        this.moveRange = stats.moveRange || 1;
        this.isHostile = stats.isHostile || false;  // For distinguishing enemies from player

        // Create smaller sprite
        const spriteSize = Math.floor(scene.TILE_SIZE * 0.4);  // Make sprite 40% of tile size
        this.sprite = scene.add.circle(x, y, spriteSize, stats.color || 0xff0000);

        // Adjust text size to fit smaller tiles
        this.label = scene.add.text(x, y, stats.symbol || '?', {
            fontSize: `${Math.floor(scene.TILE_SIZE * 0.5)}px`,  // Make text 50% of tile size
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Set depth for unit sprite and label
        const UNIT_DEPTH = 1000; // Much higher than terrain depths
        this.sprite.setDepth(UNIT_DEPTH);
        this.label.setDepth(UNIT_DEPTH + 1); // Label slightly above unit
    }

    move(dx, dy) {
        const newX = this.sprite.x + (dx * this.scene.TILE_SIZE);
        const newY = this.sprite.y + (dy * this.scene.TILE_SIZE);

        if (this.canMoveTo(newX, newY)) {
            this.sprite.x = newX;
            this.sprite.y = newY;
            this.label.x = newX;
            this.label.y = newY;
            return true;
        }
        return false;
    }

    canMoveTo(x, y) {
        const gridX = Math.floor(x / this.scene.TILE_SIZE);
        const gridY = Math.floor(y / this.scene.TILE_SIZE);

        // Check boundaries and terrain
        if (!(gridX >= 0 &&
              gridX < this.scene.GRID_SIZE &&
              gridY >= 0 &&
              gridY < this.scene.GRID_SIZE &&
              this.scene.isWalkable(x, y))) {
            return false;
        }

        // Check for other units at the target position
        return !this.scene.isUnitAt(gridX, gridY, this);
    }

    takeDamage(amount) {
        const previousHealth = this.health;
        this.health = Math.max(0, this.health - amount);
        console.log(`${this.type} took ${amount} damage. Health: ${previousHealth} -> ${this.health}`); // Debug log
        return this.health > 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    destroy() {
        this.sprite.destroy();
        this.label.destroy();
    }

    getPosition() {
        return {
            x: Math.floor(this.sprite.x / this.scene.TILE_SIZE),
            y: Math.floor(this.sprite.y / this.scene.TILE_SIZE)
        };
    }

    getDistance(otherUnit) {
        const pos1 = this.getPosition();
        const pos2 = otherUnit.getPosition();
        return Phaser.Math.Distance.Between(pos1.x, pos1.y, pos2.x, pos2.y);
    }

    canSeeUnit(otherUnit) {
        return this.getDistance(otherUnit) <= this.visionRange;
    }
}