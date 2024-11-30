class Archer extends Enemy {
    constructor(scene, x, y, isHostile = true) {
        super(scene, 'archer', x, y, {
            health: 30,
            attack: 18,
            defense: 4,
            moveRange: 1,
            color: isHostile ? 0xff0000 : 0x0000ff,
            symbol: 'A',
            isHostile: isHostile,
            visionRange: 6,    // Archers can see farther
            moveDelay: 1000    // Archers move slightly faster
        });
    }
}