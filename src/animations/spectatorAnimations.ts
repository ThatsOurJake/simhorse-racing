import * as THREE from 'three';

export interface AnimatedSpectator {
  group: THREE.Group;
  topCube: THREE.Mesh;
  isAnimated: boolean;
  // Random offsets for varied animation timing
  phaseOffset: number;
  swaySpeed: number;
  bobSpeed: number;
  jumpSpeed: number;
}

export class SpectatorAnimationController {
  private animatedSpectators: AnimatedSpectator[] = [];
  private isRaceActive: boolean = false;
  private elapsedTime: number = 0;

  // Animation parameters
  private readonly HEAD_BOB_ANGLE_CALM = Math.PI / 36; // ±5°
  private readonly HEAD_BOB_ANGLE_EXCITED = Math.PI / 18; // ±10°
  private readonly BODY_SWAY_ANGLE = Math.PI / 60; // ±3°
  private readonly JUMP_HEIGHT = 0.15;

  public addSpectator(spectator: AnimatedSpectator): void {
    if (spectator.isAnimated) {
      this.animatedSpectators.push(spectator);
    }
  }

  public setRaceActive(active: boolean): void {
    this.isRaceActive = active;
  }

  public update(deltaTime: number): void {
    this.elapsedTime += deltaTime;

    if (this.animatedSpectators.length === 0) {
      return;
    }

    for (const spectator of this.animatedSpectators) {
      if (this.isRaceActive) {
        this.updateExcitedAnimations(spectator);
      } else {
        this.updateCalmAnimations(spectator);
      }
    }
  }

  private updateCalmAnimations(spectator: AnimatedSpectator): void {
    const time = this.elapsedTime + spectator.phaseOffset;

    // Head bobbing (left-right looking)
    const bobAngle = Math.sin(time * spectator.bobSpeed) * this.HEAD_BOB_ANGLE_CALM;
    spectator.topCube.rotation.y = bobAngle;

    // Body swaying (gentle side-to-side)
    const swayAngle = Math.sin(time * spectator.swaySpeed) * this.BODY_SWAY_ANGLE;
    spectator.group.rotation.z = swayAngle;

    // Reset any jump offset from excited state
    if (spectator.group.userData.jumpOffset) {
      spectator.group.position.y -= spectator.group.userData.jumpOffset;
      spectator.group.userData.jumpOffset = 0;
    }
  }

  private updateExcitedAnimations(spectator: AnimatedSpectator): void {
    const time = this.elapsedTime + spectator.phaseOffset;

    // Faster head bobbing
    const bobAngle = Math.sin(time * spectator.bobSpeed * 2) * this.HEAD_BOB_ANGLE_EXCITED;
    spectator.topCube.rotation.y = bobAngle;

    // Jumping (vertical bounce)
    const jumpOffset = Math.abs(Math.sin(time * spectator.jumpSpeed)) * this.JUMP_HEIGHT;
    const previousJumpOffset = spectator.group.userData.jumpOffset || 0;
    spectator.group.position.y += jumpOffset - previousJumpOffset;
    spectator.group.userData.jumpOffset = jumpOffset;

    // Reset body sway during excited state
    spectator.group.rotation.z = 0;
  }

  public clear(): void {
    this.animatedSpectators = [];
    this.elapsedTime = 0;
  }
}
