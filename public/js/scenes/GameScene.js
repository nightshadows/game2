class GameScene extends Phaser.Scene {
    static DEPTHS = {
        TERRAIN_BASE: 0,
        TERRAIN_DECORATION: 1,
        TERRAIN_OBJECT: 2,
        TERRAIN_TALL: 3,
        UNITS: 1000,
        UNIT_LABELS: 1001,
        EFFECTS: 2000,
        UI: 3000
    };

    constructor() {
        super({ key: 'GameScene' });
        this.GRID_SIZE = 15;
        this.GAME_AREA_WIDTH = 800;
        this.PANEL_WIDTH = 400;
        this.TILE_SIZE = Math.min(
            this.GAME_AREA_WIDTH / this.GRID_SIZE,
            800 / this.GRID_SIZE
        );
        this.playerTurn = true;
        this.terrainGrid = [];
        this.enemies = [];
        this.player = null;
    }

    create() {
        console.log('GameScene created');
        this.createTerrainGrid();
        this.createInfoPanel();
        this.createPlayer();
        this.createEnemies();
        this.setupInput();
    }

    createTerrainGrid() {
        // Initialize empty grid
        for (let x = 0; x < this.GRID_SIZE; x++) {
            this.terrainGrid[x] = [];
            for (let y = 0; y < this.GRID_SIZE; y++) {
                const pixelX = this.getPixelX(x);
                const pixelY = this.getPixelY(y);

                // Create new terrain tile
                const terrain = new Terrain(this, pixelX, pixelY);

                // Set base terrain (default to grass)
                terrain.setBase(Terrain.TYPES.GRASS);

                // Add road in the middle
                if (x === 7 || y === 7) {
                    terrain.setBase(Terrain.TYPES.ROAD);
                }

                // Add walls
                if ((x === 3 || x === 11) && y !== 7) {
                    terrain.setBase(Terrain.TYPES.WALL);
                }

                // Add trees on some grass tiles
                if ((x === 2 || x === 12) && (y === 2 || y === 12)) {
                    terrain.addObject(Terrain.TYPES.TREE);
                }

                // Add some decorative flowers on grass
                if (Math.random() < 0.1 && terrain.layers.get('base') === Terrain.TYPES.GRASS) {
                    terrain.addObject(Terrain.TYPES.FLOWERS);
                }

                this.terrainGrid[x][y] = terrain;
            }
        }
    }

    getPixelX(gridX) {
        return (gridX * this.TILE_SIZE) +
               (this.GAME_AREA_WIDTH - (this.GRID_SIZE * this.TILE_SIZE)) / 2 +
               this.TILE_SIZE/2;
    }

    getPixelY(gridY) {
        return (gridY * this.TILE_SIZE) +
               (this.game.config.height - (this.GRID_SIZE * this.TILE_SIZE)) / 2 +
               this.TILE_SIZE/2;
    }

    // Update the canMoveTo method in Unit class to check terrain
    isWalkable(x, y) {
        const gridX = Math.floor(x / this.TILE_SIZE);
        const gridY = Math.floor(y / this.TILE_SIZE);

        // Check boundaries
        if (gridX < 0 || gridX >= this.GRID_SIZE || gridY < 0 || gridY >= this.GRID_SIZE) {
            return false;
        }

        // Check terrain walkability
        return this.terrainGrid[gridX][gridY].isWalkable();
    }

    // Helper method to get grid coordinates
    getGridCoordinates(pixelX, pixelY) {
        const offsetX = (this.GAME_AREA_WIDTH - (this.GRID_SIZE * this.TILE_SIZE)) / 2;
        const offsetY = (this.game.config.height - (this.GRID_SIZE * this.TILE_SIZE)) / 2;

        return {
            x: Math.floor((pixelX - offsetX) / this.TILE_SIZE),
            y: Math.floor((pixelY - offsetY) / this.TILE_SIZE)
        };
    }

    createInfoPanel() {
        // Add info panel background
        this.add.rectangle(
            this.GAME_AREA_WIDTH + this.PANEL_WIDTH/2,
            this.game.config.height/2,
            this.PANEL_WIDTH,
            this.game.config.height,
            0x333333
        );

        // Add stats text
        this.statsText = this.add.text(
            this.GAME_AREA_WIDTH + 20,
            20,
            'Player Stats',
            { fontSize: '24px', fill: '#ffffff' }
        );

        // Add combat log
        this.combatLog = this.add.text(
            this.GAME_AREA_WIDTH + 20,
            300,
            'Combat Log:',
            { fontSize: '16px', fill: '#ffffff' }
        );

        this.statsText.setDepth(GameScene.DEPTHS.UI);
        this.combatLog.setDepth(GameScene.DEPTHS.UI);
    }

    isUnitAt(gridX, gridY, excludeUnit = null) {
        // Check player position first
        if (this.player && this.player !== excludeUnit) {
            const playerPos = this.player.getPosition();
            if (playerPos.x === gridX && playerPos.y === gridY) {
                return true;
            }
        }

        // Then check enemy positions
        return this.enemies.some(enemy => {
            if (enemy === excludeUnit) return false;
            const pos = enemy.getPosition();
            return pos.x === gridX && pos.y === gridY;
        });
    }

    findSafeSpawnPosition(preferredX, preferredY) {
        // First try the preferred position
        if (this.isValidSpawnPosition(preferredX, preferredY)) {
            return { x: preferredX, y: preferredY };
        }

        // If preferred position is not valid, search in expanding squares
        for (let radius = 1; radius < this.GRID_SIZE; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                        const newX = preferredX + dx;
                        const newY = preferredY + dy;
                        if (this.isValidSpawnPosition(newX, newY)) {
                            return { x: newX, y: newY };
                        }
                    }
                }
            }
        }

        console.error('No safe spawn position found');
        return null;
    }

    isValidSpawnPosition(gridX, gridY) {
        // Check boundaries
        if (gridX < 0 || gridX >= this.GRID_SIZE || gridY < 0 || gridY >= this.GRID_SIZE) {
            return false;
        }

        // Convert grid coordinates to pixel coordinates for terrain check
        const pixelX = (gridX * this.TILE_SIZE) + (this.GAME_AREA_WIDTH - (this.GRID_SIZE * this.TILE_SIZE)) / 2 + this.TILE_SIZE/2;
        const pixelY = (gridY * this.TILE_SIZE) + (this.game.config.height - (this.GRID_SIZE * this.TILE_SIZE)) / 2 + this.TILE_SIZE/2;

        // Check terrain walkability
        if (!this.isWalkable(pixelX, pixelY)) {
            return false;
        }

        // Check for other units
        return !this.isUnitAt(gridX, gridY);
    }

    createPlayer() {
        const centerX = Math.floor(this.GRID_SIZE / 2);
        const centerY = Math.floor(this.GRID_SIZE / 2);

        const spawnPos = this.findSafeSpawnPosition(centerX, centerY);
        if (!spawnPos) {
            console.error('Could not spawn player!');
            return;
        }

        const pixelX = (spawnPos.x * this.TILE_SIZE) + (this.GAME_AREA_WIDTH - (this.GRID_SIZE * this.TILE_SIZE)) / 2 + this.TILE_SIZE/2;
        const pixelY = (spawnPos.y * this.TILE_SIZE) + (this.game.config.height - (this.GRID_SIZE * this.TILE_SIZE)) / 2 + this.TILE_SIZE/2;

        this.player = new Player(this, pixelX, pixelY);
    }

    createEnemies() {
        const enemyPositions = [
            { x: 2, y: 2, type: 'warrior' },
            { x: 12, y: 12, type: 'archer' },
            { x: 2, y: 12, type: 'warrior' },
            { x: 12, y: 2, type: 'archer' }
        ];

        enemyPositions.forEach(pos => {
            const enemy = this.createEnemy(pos.x, pos.y, pos.type);
            if (enemy) {
                this.enemies.push(enemy);
            }
        });
    }

    setupInput() {
        this.input.keyboard.on('keydown', (event) => {
            if (!this.playerTurn) return;

            let dx = 0;
            let dy = 0;

            switch(event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    dy = -1;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    dy = 1;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    dx = -1;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    dx = 1;
                    break;
            }

            if (dx !== 0 || dy !== 0) {
                if (!this.handleCombat(dx, dy)) {
                    this.player.move(dx, dy);
                }
                this.updateInfoPanel();
                this.playerTurn = false;
                this.processEnemyTurns();
            }
        });
    }

    updateInfoPanel() {
        const player = this.player;
        this.statsText.setText([
            'Player Stats:',
            `Health: ${player.health}/${player.maxHealth}`,
            `Level: ${player.level}`,
            `Gold: ${player.gold}`
        ]);
    }

    handleCombat(playerDx, playerDy) {
        const playerPos = this.player.getPosition();
        const targetX = playerPos.x + playerDx;
        const targetY = playerPos.y + playerDy;

        // Check if there's an enemy at the target position
        const enemy = this.findEnemyAt(targetX, targetY);

        if (enemy) {
            // Player attacks enemy
            this.performAttack(this.player, enemy);
            return true;
        }

        return false;
    }

    findEnemyAt(x, y) {
        return this.enemies.find(enemy => {
            const pos = enemy.getPosition();
            return pos.x === x && pos.y === y;
        });
    }

    performAttack(attacker, defender) {
        // Calculate base damage
        const damage = Math.max(1, attacker.attack - Math.floor(defender.defense / 2));
        console.log(`${attacker.type} attacks with ${attacker.attack} attack vs ${defender.defense} defense = ${damage} damage`);

        const survived = defender.takeDamage(damage);

        // Log the combat action
        this.logCombatAction(attacker, defender, damage);

        // Check for death
        if (!survived) {
            if (defender === this.player) {
                this.handlePlayerDeath();
            } else {
                this.handleEnemyDeath(defender);
            }
        }

        // Visual feedback
        this.showDamageEffect(defender, damage);
    }

    logCombatAction(attacker, defender, damage) {
        const attackerName = attacker === this.player ? 'Player' : attacker.type;
        const defenderName = defender === this.player ? 'Player' : defender.type;

        const log = `${attackerName} hits ${defenderName} for ${damage} damage!\n${defenderName}: ${defender.health}/${defender.maxHealth} HP`;

        // Keep only last 5 lines of combat log
        const currentLog = this.combatLog.text.split('\n');
        currentLog.push(log);
        if (currentLog.length > 6) { // 5 lines + title
            currentLog.splice(1, currentLog.length - 6);
        }
        this.combatLog.setText(currentLog.join('\n'));
    }

    showDamageEffect(unit, damage) {
        const damageText = this.add.text(
            unit.sprite.x,
            unit.sprite.y - 20,
            `-${damage}`,
            { fontSize: '20px', fill: '#ff0000' }
        ).setDepth(GameScene.DEPTHS.EFFECTS);

        this.tweens.add({
            targets: damageText,
            y: damageText.y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => damageText.destroy()
        });
    }

    handleEnemyDeath(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }

        // Give player experience and gold
        const expGained = enemy.type === 'warrior' ? 20 : 15;
        const goldGained = enemy.type === 'warrior' ? 10 : 8;

        this.player.gainExperience(expGained);
        this.player.gold += goldGained;

        this.logCombatAction(this.player, enemy, 'killed');
        enemy.destroy();
        this.updateInfoPanel();
    }

    handlePlayerDeath() {
        this.playerTurn = false;
        this.scene.pause();
        this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2,
            'Game Over',
            { fontSize: '64px', fill: '#ff0000' }
        ).setOrigin(0.5);

        // Add restart button
        const restartButton = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2 + 80,
            'Click to Restart',
            { fontSize: '32px', fill: '#ffffff' }
        ).setOrigin(0.5)
        .setInteractive();

        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    processEnemyTurns() {
        this.enemies.forEach(enemy => {
            enemy.update(this.player);
        });

        // Return to player's turn
        this.playerTurn = true;
    }

    createEnemy(preferredX, preferredY, type = 'warrior') {
        const spawnPos = this.findSafeSpawnPosition(preferredX, preferredY);
        if (!spawnPos) {
            console.error(`Could not spawn enemy at ${preferredX}, ${preferredY}`);
            return null;
        }

        const pixelX = (spawnPos.x * this.TILE_SIZE) + (this.GAME_AREA_WIDTH - (this.GRID_SIZE * this.TILE_SIZE)) / 2 + this.TILE_SIZE/2;
        const pixelY = (spawnPos.y * this.TILE_SIZE) + (this.game.config.height - (this.GRID_SIZE * this.TILE_SIZE)) / 2 + this.TILE_SIZE/2;

        const enemy = type === 'warrior'
            ? new Warrior(this, pixelX, pixelY)
            : new Archer(this, pixelX, pixelY);

        // Add vision range indicator (debug)
        const visionCircle = this.add.circle(
            pixelX, pixelY,
            enemy.visionRange * this.TILE_SIZE,
            enemy.type === 'warrior' ? 0xff0000 : 0xff6600,
            0.1
        );
        visionCircle.setDepth(-1);

        return enemy;
    }

    preload() {
        // Load terrain sprites
        this.load.spritesheet('grass', 'assets/terrain/grass.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('road', 'assets/terrain/road.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('wall', 'assets/terrain/wall.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('tree', 'assets/terrain/tree.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('flowers', 'assets/terrain/flowers.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }
}