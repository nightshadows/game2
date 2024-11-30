class Player extends Unit {
    constructor(scene, x, y) {
        super(scene, 'player', x, y, {
            health: 100,
            attack: 20,
            defense: 5,
            moveRange: 1,
            color: 0x00ff00,
            symbol: '@',
            isHostile: false
        });

        this.level = 1;
        this.experience = 0;
        this.gold = 0;
    }

    gainExperience(amount) {
        this.experience += amount;
        if (this.experience >= this.level * 100) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.maxHealth += 10;
        this.health = this.maxHealth;
        this.attack += 2;
        this.defense += 1;
        this.experience = 0;
    }
}