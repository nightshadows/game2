class Enemy extends Unit {
    constructor(scene, type, x, y, stats) {
        super(scene, type, x, y, stats);

        this.state = 'wander';  // wander, chase, attack
        this.visionRange = stats.visionRange || 5;
        this.lastMoveTime = 0;
        this.moveDelay = stats.moveDelay || 1000; // Time between moves in ms
        this.wanderDirection = { x: 0, y: 0 };
        this.updateWanderDirection();
    }

    updateWanderDirection() {
        // Random direction: -1, 0, or 1 for both x and y
        this.wanderDirection = {
            x: Phaser.Math.Between(-1, 1),
            y: Phaser.Math.Between(-1, 1)
        };
    }

    update(player) {
        const currentTime = Date.now();
        if (currentTime - this.lastMoveTime < this.moveDelay) {
            return; // Wait for move delay
        }

        const distance = this.getDistance(player);

        // Update state based on distance to player
        if (distance <= 1) {
            this.state = 'attack';
        } else if (distance <= this.visionRange) {
            this.state = 'chase';
        } else {
            this.state = 'wander';
        }

        // Act based on current state
        switch (this.state) {
            case 'attack':
                this.scene.performAttack(this, player);
                break;

            case 'chase':
                this.chasePlayer(player);
                break;

            case 'wander':
                this.wander();
                break;
        }

        this.lastMoveTime = currentTime;
    }

    chasePlayer(player) {
        const myPos = this.getPosition();
        const playerPos = player.getPosition();

        // Calculate direction to player
        const dx = Math.sign(playerPos.x - myPos.x);
        const dy = Math.sign(playerPos.y - myPos.y);

        // Try to move closer to player
        if (dx !== 0 || dy !== 0) {
            this.move(dx, dy);
        }
    }

    wander() {
        // Occasionally change direction
        if (Phaser.Math.Between(0, 100) < 20) { // 20% chance to change direction
            this.updateWanderDirection();
        }

        // Try to move in wander direction
        this.move(this.wanderDirection.x, this.wanderDirection.y);
    }
}