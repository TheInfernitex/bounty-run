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

            this.platforms = this.physics.add.staticGroup();
            this.platforms
              .create(width / 2, height - 32, "ground")
              .setScale(2)
              .refreshBody();

            this.player = this.physics.add.sprite(100, height - 150, "dude");
            this.player.setBounce(0.2);
            this.player.setCollideWorldBounds(true);

            this.physics.add.collider(this.player, this.platforms);
          }

          update() {
            const cursors = this.input.keyboard.createCursorKeys();

            if (cursors.left?.isDown) {
              this.player.setVelocityX(-160);
            } else if (cursors.right?.isDown) {
              this.player.setVelocityX(160);
            } else {
              this.player.setVelocityX(0);
            }

            if (cursors.up?.isDown && this.player.body.touching.down) {
              this.player.setVelocityY(-330);
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
              gravity: { y: 300 },
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
