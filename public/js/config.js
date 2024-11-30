const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1200,
    height: 800,
    scene: GameScene,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};