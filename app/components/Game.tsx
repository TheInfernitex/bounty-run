"use client";

import { useEffect } from "react";

export default function PhaserGame() {
  useEffect(() => {
    const startEpicAdventure = async () => {
      if (typeof window !== "undefined") {
        const Phaser = await import("phaser");

        class SkyboundJourney extends Phaser.Scene {
          hero!: Phaser.Physics.Arcade.Sprite;
          terrain!: Phaser.Physics.Arcade.StaticGroup;
          controls!: Phaser.Types.Input.Keyboard.CursorKeys;
          jumpKey!: Phaser.Input.Keyboard.Key;
          score = 0;
          scoreText!: Phaser.GameObjects.Text;
          stars!: Phaser.Physics.Arcade.Group;
          bombs!: Phaser.Physics.Arcade.Group;
          gameOver = false;

          constructor() {
            super("skybound-journey");
          }

          preload() {
            this.load.image("sky", "/assets/sky.jpg");
            this.load.image("ground", "/assets/platform.png");
            this.load.image("hero", "/assets/dude.png");
            this.load.image("star", "/assets/star.png");
            this.load.image("bomb", "/assets/bomb.png");
          }

          create() {
            const { width, height } = this.scale;

            // Paint the sky
            this.add
              .image(width / 2, height / 2, "sky")
              .setDisplaySize(width, height);

            // Lay the foundation
            this.terrain = this.physics.add.staticGroup();
            this.terrain
              .create(width / 2, height - 16, "ground")
              .setScale(width / 400, 1)
              .refreshBody();

            // Summon the hero
            this.hero = this.physics.add.sprite(100, height - 150, "hero");
            this.hero.setDragX(800); // smoother horizontal stop
            this.hero.setScale(1.5);
            this.hero.body?.updateFromGameObject();
            this.hero.setBounce(0.2);
            this.hero.setCollideWorldBounds(true);
            this.physics.add.collider(this.hero, this.terrain);

            // Prepare for control
            this.controls = this.input.keyboard!.createCursorKeys();
            this.jumpKey = this.input.keyboard!.addKey(
              Phaser.Input.Keyboard.KeyCodes.SPACE,
            );

            // Create an empty group for stars
            this.stars = this.physics.add.group();

            // Drop stars repeatedly
            this.time.addEvent({
              delay: 800,
              loop: true,
              callback: this.spawnStar,
              callbackScope: this,
            });

            this.stars.children.iterate((child) => {
              const star = child as Phaser.Physics.Arcade.Image;
              star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.6));

              star.setScale(0.1);
              star.body?.updateFromGameObject();
              return true;
            });

            // Add collision with terrain
            this.physics.add.collider(this.stars, this.terrain);

            // Add overlap with hero
            this.physics.add.overlap(
              this.hero,
              this.stars,
              (hero, star) => {
                (star as Phaser.Physics.Arcade.Image).disableBody(true, true);
                this.score += 10;
                this.scoreText.setText("Score: " + this.score);
              },
              undefined,
              this,
            );
            // Create an empty group for bombs
            this.bombs = this.physics.add.group();

            // Drop bombs randomly
            this.time.addEvent({
              delay: 3000,
              loop: true,
              callback: this.spawnBomb,
              callbackScope: this,
            });

            // Display score
            this.scoreText = this.add.text(16, 16, "Score: 0", {
              fontSize: "32px",
              color: "#fff",
              fontFamily: "Arial",
            });
            this.scoreText.setScrollFactor(0);
          }
          spawnStar() {
            if (this.gameOver) return;

            const x = Phaser.Math.Between(50, this.scale.width - 50);
            const star = this.stars.create(
              x,
              0,
              "star",
            ) as Phaser.Physics.Arcade.Image;

            star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            star.setCollideWorldBounds(true);
            star.setScale(0.1);
            star.body?.updateFromGameObject();

            // Collide with ground
            this.physics.add.collider(star, this.terrain);

            // Overlap with hero
            this.physics.add.overlap(this.hero, star, (hero, star) => {
              (star as Phaser.Physics.Arcade.Image).disableBody(true, true);
              this.score += 10;
              this.scoreText.setText("Score: " + this.score);
            });

            // Fade out and destroy after 4 seconds
            this.tweens.add({
              targets: star,
              alpha: 0,
              duration: 4000,
              delay: 4000,
              onComplete: () => {
                if (star.active) {
                  star.destroy();
                }
              },
            });
          }
          spawnBomb() {
            if (this.gameOver) return;

            const x = Phaser.Math.Between(50, this.scale.width - 50);
            const bomb = this.bombs.create(
              x,
              0,
              "bomb",
            ) as Phaser.Physics.Arcade.Image;

            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            bomb.setScale(0.06); // smaller size
            bomb.body?.updateFromGameObject();

            // Collide with terrain
            this.physics.add.collider(bomb, this.terrain);

            // Check collision with player
            this.physics.add.collider(
              this.hero,
              bomb,
              this.handleGameOver,
              undefined,
              this,
            );
          }
          handleGameOver() {
            if (this.gameOver) return;
            this.gameOver = true;

            this.physics.pause();
            this.hero.setTint(0xff0000);
            this.hero.anims?.stop?.();

            const { width, height } = this.scale;
            this.add
              .text(width / 2, height / 2 - 50, "💥 Game Over 💥", {
                fontSize: "48px",
                color: "#ff0000",
                fontFamily: "Arial",
              })
              .setOrigin(0.5)
              .setScrollFactor(0);

            this.add
              .text(width / 2, height / 2, `Score: ${this.score}`, {
                fontSize: "35px",
                color: "#ff0000",
                fontFamily: "Arial",
              })
              .setOrigin(0.5)
              .setScrollFactor(0);

            const restartBtn = this.add
              .text(width / 2, height / 2 + 80, "Play Again", {
                fontSize: "28px",
                color: "#ffffff",
                backgroundColor: "#444",
                padding: { x: 20, y: 10 },
                fontFamily: "Arial",
              })
              .setOrigin(0.5)
              .setInteractive({ useHandCursor: true })
              // makes it clickable
              .setScrollFactor(0);

            restartBtn.on("pointerdown", () => {
              window.location.reload();
            });
          }

          update() {
            const moveLeft = this.controls.left?.isDown;
            const moveRight = this.controls.right?.isDown;
            const isGrounded = this.hero.body?.touching.down;
            const wantsToJump = this.controls.up?.isDown || this.jumpKey.isDown;

            const speed = 400; // faster side movement
            const jumpSpeed = -550; // slightly stronger jump

            if (moveLeft) {
              this.hero.setVelocityX(-speed);
            } else if (moveRight) {
              this.hero.setVelocityX(speed);
            } else {
              // Smooth deceleration
              this.hero.setVelocityX(0);
            }

            if (wantsToJump && isGrounded) {
              this.hero.setVelocityY(jumpSpeed);
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
          scene: SkyboundJourney,
          parent: "phaser-container",
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
        };

        const game = new Phaser.Game(config);

        const handleResize = () => {
          game.scale.resize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          game.destroy(true);
        };
      }
    };

    startEpicAdventure();
  }, []);

  return (
    <div
      id="phaser-container"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    />
  );
}
