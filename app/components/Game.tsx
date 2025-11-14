"use client";

import { useEffect } from "react";

export default function PhaserGame() {
  type CustomControls = {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    H: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
    K: Phaser.Input.Keyboard.Key;
    L: Phaser.Input.Keyboard.Key;
  };

  useEffect(() => {
    const startEpicAdventure = async () => {
      if (typeof window !== "undefined") {
        const Phaser = await import("phaser");

        class SkyboundJourney extends Phaser.Scene {
          hero!: Phaser.Physics.Arcade.Sprite;
          terrain!: Phaser.Physics.Arcade.StaticGroup;
          jumpKey!: Phaser.Input.Keyboard.Key;
          score!: number;
          scoreText!: Phaser.GameObjects.Text;
          stars!: Phaser.Physics.Arcade.Group;
          bombs!: Phaser.Physics.Arcade.Group;
          magicStars!: Phaser.Physics.Arcade.Group;
          gameOver!: boolean;
          starSpawnRate!: number;
          bombSpawnRate!: number;
          starTimer!: Phaser.Time.TimerEvent;
          bombTimer!: Phaser.Time.TimerEvent;
          controls!: CustomControls;
          lastMagicStarScore!: number;
          magicStarText!: Phaser.GameObjects.Text;
          lastDifficultyScore!: number;

          // UI elements
          uiContainer!: Phaser.GameObjects.Container;
          livesText!: Phaser.GameObjects.Text;
          nextMagicStarText!: Phaser.GameObjects.Text;

          // Add text objects for initial instructions
          controlsText!: Phaser.GameObjects.Text;
          objectiveText!: Phaser.GameObjects.Text;

          constructor() {
            super("skybound-journey");
          }

          init() {
            // Reset all game parameters here
            this.score = 0;
            this.gameOver = false;
            this.starSpawnRate = 1600;
            this.bombSpawnRate = 4000;
            this.lastMagicStarScore = 0;
            this.lastDifficultyScore = 0;
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
            const platform = this.terrain
              .create(width / 2, height, "ground")
              .setOrigin(0.5, 1);

            const platformWidth = platform.width;
            const platformHeight = platform.height;

            const scaleX = width / platformWidth;
            const desiredHeight = 100;
            const scaleY = desiredHeight / platformHeight;

            platform.setScale(scaleX, scaleY).refreshBody();

            // Summon the hero
            const platformTopY = height - desiredHeight;
            this.hero = this.physics.add.sprite(
              100,
              platformTopY - 100,
              "hero",
            );
            this.hero.setScale(0.05);
            this.hero.setBounce(0.2);
            this.hero.setCollideWorldBounds(false);
            this.hero.setDragX(800);
            this.hero.body?.updateFromGameObject();

            this.physics.add.collider(this.hero, this.terrain);

            // Prepare for control
            this.controls = this.input!.keyboard!.addKeys({
              up: Phaser.Input.Keyboard.KeyCodes.UP,
              down: Phaser.Input.Keyboard.KeyCodes.DOWN,
              left: Phaser.Input.Keyboard.KeyCodes.LEFT,
              right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
              W: Phaser.Input.Keyboard.KeyCodes.W,
              A: Phaser.Input.Keyboard.KeyCodes.A,
              S: Phaser.Input.Keyboard.KeyCodes.S,
              D: Phaser.Input.Keyboard.KeyCodes.D,
              H: Phaser.Input.Keyboard.KeyCodes.H,
              J: Phaser.Input.Keyboard.KeyCodes.J,
              K: Phaser.Input.Keyboard.KeyCodes.K,
              L: Phaser.Input.Keyboard.KeyCodes.L,
            }) as CustomControls;

            this.jumpKey = this.input!.keyboard!.addKey(
              Phaser.Input.Keyboard.KeyCodes.SPACE,
            );

            // Create groups
            this.stars = this.physics.add.group();
            this.bombs = this.physics.add.group();
            this.magicStars = this.physics.add.group();

            // Drop stars repeatedly
            this.time.addEvent({
              delay: 1600,
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
            this.physics.add.collider(this.magicStars, this.terrain);

            // Add overlap with hero
            this.physics.add.overlap(
              this.hero,
              this.stars,
              (hero, star) => {
                (star as Phaser.Physics.Arcade.Image).disableBody(true, true);
                this.score += 10;
                this.updateUI();
                this.checkMagicStar();
              },
              undefined,
              this,
            );

            // Magic star overlap
            this.physics.add.overlap(
              this.hero,
              this.magicStars,
              (hero, magicStar) => {
                (magicStar as Phaser.Physics.Arcade.Image).disableBody(
                  true,
                  true,
                );
                this.score += 50;
                this.clearAllBombs();
                this.showMagicStarEffect();
                this.updateUI();
              },
              undefined,
              this,
            );

            // Drop bombs randomly
            this.time.addEvent({
              delay: 4000,
              loop: true,
              callback: this.spawnBomb,
              callbackScope: this,
            });

            // Create enhanced UI
            this.createUI();

            // Add initial controls and objective text
            this.controlsText = this.add
              .text(
                width / 2,
                height / 2 - 120,
                "🎮 CONTROLS 🎮\nArrow Keys / WASD: Move\nSpacebar: Jump\nDown Key: Rush to Platform",
                {
                  fontSize: "20px",
                  color: "#ffffff",
                  fontFamily: "Arial",
                  align: "center",
                  stroke: "#000000",
                  strokeThickness: 2,
                },
              )
              .setOrigin(0.5)
              .setScrollFactor(0);

            this.objectiveText = this.add
              .text(
                width / 2,
                height / 2 - 20,
                "✨ OBJECTIVE ✨\nCollect stars (+10 pts) and avoid bombs!\n⭐ Magic Stars appear every 200 pts and destroy all bombs! ⭐\nDifficulty increases with score!",
                {
                  fontSize: "18px",
                  color: "#ffffff",
                  fontFamily: "Arial",
                  align: "center",
                  stroke: "#000000",
                  strokeThickness: 2,
                },
              )
              .setOrigin(0.5)
              .setScrollFactor(0);

            // Set a timer to remove the text after 6 seconds
            this.time.delayedCall(
              6000,
              () => {
                this.controlsText.destroy();
                this.objectiveText.destroy();
              },
              [],
              this,
            );

            this.time.addEvent({
              delay: 1000,
              loop: true,
              callback: this.scaleDifficulty,
              callbackScope: this,
            });
          }

          createUI() {
            // Create UI container
            this.uiContainer = this.add.container(0, 0);

            // Enhanced score display
            this.scoreText = this.add.text(20, 20, "Score: 0", {
              fontSize: "28px",
              color: "#ffffff",
              fontFamily: "Arial",
              stroke: "#000000",
              strokeThickness: 3,
            });

            // Next magic star indicator
            this.nextMagicStarText = this.add.text(
              20,
              60,
              "⭐ Magic Star: 200 pts",
              {
                fontSize: "20px",
                color: "#ffdf00",
                fontFamily: "Arial",
                stroke: "#000000",
                strokeThickness: 2,
              },
            );

            // Add pulsing effect to magic star text
            this.tweens.add({
              targets: this.nextMagicStarText,
              alpha: 0.5,
              duration: 1000,
              yoyo: true,
              repeat: -1,
            });

            this.uiContainer.add([this.scoreText, this.nextMagicStarText]);
            this.uiContainer.setScrollFactor(0);
          }

          updateUI() {
            this.scoreText.setText(`Score: ${this.score}`);
            const nextMagicAt = Math.ceil((this.score + 1) / 200) * 200;
            this.nextMagicStarText.setText(`⭐ Magic Star: ${nextMagicAt} pts`);
          }

          checkMagicStar() {
            const currentMagicStarMilestone = Math.floor(this.score / 200);
            const lastMagicStarMilestone = Math.floor(
              this.lastMagicStarScore / 200,
            );

            if (currentMagicStarMilestone > lastMagicStarMilestone) {
              this.spawnMagicStar();
              this.lastMagicStarScore = this.score;
            }
          }

          spawnMagicStar() {
            const x = Phaser.Math.Between(50, this.scale.width - 50);
            const magicStar = this.magicStars.create(
              x,
              0,
              "star",
            ) as Phaser.Physics.Arcade.Image;

            magicStar.setBounceY(0.8);
            magicStar.setCollideWorldBounds(true);
            magicStar.setScale(0.15);
            magicStar.setTint(0xffdf00);
            magicStar.body?.updateFromGameObject();

            // Add glowing effect
            this.tweens.add({
              targets: magicStar,
              scaleX: 0.18,
              scaleY: 0.18,
              duration: 500,
              yoyo: true,
              repeat: -1,
            });

            // Add sparkle effect
            this.tweens.add({
              targets: magicStar,
              alpha: 0.7,
              duration: 300,
              yoyo: true,
              repeat: -1,
            });

            // Auto-destroy after 8 seconds
            this.time.delayedCall(8000, () => {
              if (magicStar.active) {
                magicStar.destroy();
              }
            });
          }

          clearAllBombs() {
            this.bombs.children.entries.forEach((bomb) => {
              if (bomb.active) {
                // Add explosion effect
                this.tweens.add({
                  targets: bomb,
                  scaleX: 0.2,
                  scaleY: 0.2,
                  alpha: 0,
                  duration: 200,
                  onComplete: () => {
                    (bomb as Phaser.Physics.Arcade.Image).destroy();
                  },
                });
              }
            });
          }

          showMagicStarEffect() {
            const { width, height } = this.scale;
            const effectText = this.add
              .text(
                width / 2,
                height / 2,
                "✨ MAGIC STAR! ✨\nAll bombs destroyed!",
                {
                  fontSize: "32px",
                  color: "#ffdf00",
                  fontFamily: "Arial",
                  align: "center",
                  stroke: "#000000",
                  strokeThickness: 3,
                },
              )
              .setOrigin(0.5)
              .setScrollFactor(0);

            this.tweens.add({
              targets: effectText,
              alpha: 0,
              y: height / 2 - 50,
              duration: 3000,
              onComplete: () => {
                effectText.destroy();
              },
            });
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

            this.physics.add.collider(star, this.terrain);

            this.physics.add.overlap(this.hero, star, (hero, star) => {
              (star as Phaser.Physics.Arcade.Image).disableBody(true, true);
              this.score += 10;
              this.updateUI();
              this.checkMagicStar();
            });

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

          scaleDifficulty() {
            const difficultyThreshold = 100;
            const difficultyIncreaseFactor = 0.05;

            if (this.score >= this.lastDifficultyScore + difficultyThreshold) {
              this.lastDifficultyScore = this.score;

              if (this.starSpawnRate > 600) {
                this.starSpawnRate *= 1 - difficultyIncreaseFactor;
              }

              if (this.bombSpawnRate > 1000) {
                this.bombSpawnRate *= 1 - difficultyIncreaseFactor;
              }

              this.starTimer?.remove(false);
              this.bombTimer?.remove(false);

              this.starTimer = this.time.addEvent({
                delay: this.starSpawnRate,
                loop: true,
                callback: this.spawnStar,
                callbackScope: this,
              });

              this.bombTimer = this.time.addEvent({
                delay: this.bombSpawnRate,
                loop: true,
                callback: this.spawnBomb,
                callbackScope: this,
              });
            }
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
            bomb.setScale(0.06);
            bomb.body?.updateFromGameObject();

            this.physics.add.collider(bomb, this.terrain);

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

            // Game over background
            const gameOverBg = this.add.rectangle(
              width / 2,
              height / 2,
              width,
              height,
              0x000000,
              0.8,
            );
            gameOverBg.setScrollFactor(0);

            this.add
              .text(width / 2, height / 2 - 80, "GAME OVER!", {
                fontSize: "48px",
                color: "#ff6b6b",
                fontFamily: "Arial",
                stroke: "#000000",
                strokeThickness: 4,
              })
              .setOrigin(0.5)
              .setScrollFactor(0);

            this.add
              .text(width / 2, height / 2 - 20, `Final Score: ${this.score}`, {
                fontSize: "32px",
                color: "#ffffff",
                fontFamily: "Arial",
                stroke: "#000000",
                strokeThickness: 3,
              })
              .setOrigin(0.5)
              .setScrollFactor(0);

            const restartBtn = this.add
              .text(width / 2, height / 2 + 60, "🔄 PLAY AGAIN", {
                fontSize: "28px",
                color: "#ffffff",
                backgroundColor: "#131a29",
                padding: { x: 30, y: 15 },
                fontFamily: "Arial",
              })
              .setOrigin(0.5)
              .setInteractive({ useHandCursor: true })
              .setScrollFactor(0);

            restartBtn.on("pointerover", () => {
              restartBtn.setScale(1.1);
            });

            restartBtn.on("pointerout", () => {
              restartBtn.setScale(1);
            });

            restartBtn.on("pointerdown", () => {
              // This will reset the scene's state and call create() again
              this.scene.restart();
            });
          }

          update() {
            if (this.gameOver) return;

            const moveLeft =
              this.controls.left?.isDown || this.controls.A?.isDown || this.controls.H?.isDown;
            const moveRight =
              this.controls.right?.isDown || this.controls.D?.isDown || this.controls.L?.isDown;
            const rushDown =
              this.controls.down?.isDown || this.controls.S?.isdown || this.controls.J?.isDown;
            const isGrounded = this.hero.body?.touching.down;
            const wantsToJump =
              this.controls.up?.isDown ||
              this.controls.W?.isDown ||
              this.controls.K?.isDown ||
              this.jumpKey?.isDown;

            const speed = 450;
            const jumpSpeed = -500;
            const rushSpeed = 400; // Speed for rushing down

            if (moveLeft) {
              this.hero.setVelocityX(-speed);
            } else if (moveRight) {
              this.hero.setVelocityX(speed);
            } else {
              this.hero.setVelocityX(0);
            }

            if (wantsToJump && isGrounded) {
              this.hero.setVelocityY(jumpSpeed);
            }

            // Rush down to platform
            if (rushDown && !isGrounded) {
              this.hero.setVelocityY(rushSpeed);
            }

            // Screen wrapping logic
            const { width } = this.scale;
            if (this.hero.x < 0) {
              this.hero.x = width;
            } else if (this.hero.x > width) {
              this.hero.x = 0;
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
