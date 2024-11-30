class Warrior extends Enemy {
    constructor(scene, x, y, isHostile = true) {
        super(scene, 'warrior', x, y, {
            health: 50,
            attack: 15,
            defense: 8,
            moveRange: 1,
            color: isHostile ? 0xff0000 : 0x0000ff,
            symbol: 'W',
            isHostile: isHostile,
            visionRange: 4,
            moveDelay: 1200
        });
    }
}