"use client";
import { useEffect } from "react";
export default function PhaserGame() {
  useEffect(() => {
    const loadGame = async () => {
      if (typeof window !== "undefined") {
        const Phaser = await import("phaser");
        class MyGameScene extends Phaser.Scene {
          player!: Phaser.Physics.Arcade.Sprite;
          platforms!: Phaser.Physics.Arcade.StaticGroup;
          cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
          spaceKey!: Phaser.Input.Keyboard.Key;
          constructor() {
            super("my-game");
          }
          preload() {
            this.load.image("sky", "/assets/sky.jpg");
            this.load.image("ground", "/assets/platform.png");
            this.load.image("dude", "/assets/dude.png");
          }

          create() {
            const { width, height } = this.scale;

            this.add
              .image(width / 2, height / 2, "sky")
              .setDisplaySize(width, height);

            // Add ground platform at the bottom
            this.platforms = this.physics.add.staticGroup();
            const ground = this.platforms
              .create(width / 2, height - 16, "ground")
              .setScale(width / 400, 1) // adjust width scale dynamically
              .refreshBody();

            // Add player
            this.player = this.physics.add.sprite(100, height - 150, "dude");
            this.player.setBounce(0.2);
            this.player.setCollideWorldBounds(true);

            this.physics.add.collider(this.player, this.platforms);

            // Setup input
            this.cursors = this.input.keyboard!.createCursorKeys();
            this.spaceKey = this.input.keyboard!.addKey(
              Phaser.Input.Keyboard.KeyCodes.SPACE,
            );
          }

          update() {
            if (this.cursors.left?.isDown) {
              this.player.setVelocityX(-160);
            } else if (this.cursors.right?.isDown) {
              this.player.setVelocityX(160);
            } else {
              this.player.setVelocityX(0);
            }

            const isJumpPressed =
              this.cursors.up?.isDown || this.spaceKey.isDown;

            if (isJumpPressed && this.player.body?.touching.down) {
              this.player.setVelocityY(-300);
            }
          }
        }

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: window.innerWidth,
          height: window.innerHeight,
          physics: {
            default: "arcade",
            arcade: {
              gravity: { x: 0, y: 500 },
              debug: false,
            },
          },
          scene: MyGameScene,
          parent: "phaser-container",
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
        };

        const game = new Phaser.Game(config);

        const resize = () => {
          game.scale.resize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener("resize", resize);

        return () => {
          window.removeEventListener("resize", resize);
          game.destroy(true);
        };
      }
    };

    loadGame();
  }, []);

  return (
    <div
      id="phaser-container"
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
}
