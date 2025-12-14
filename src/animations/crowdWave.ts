import type * as THREE from "three";

interface WaveSpectator {
  group: THREE.Group;
  topCube: THREE.Mesh;
  originalY: number;
  bleacherIndex: number;
  positionInBleacher: number; // X position for ripple ordering
}

export class CrowdWaveController {
  private spectators: WaveSpectator[] = [];
  private isWaveActive: boolean = false;
  private waveStartTime: number = 0;
  private elapsedTime: number = 0;

  // Wave animation parameters
  private readonly WAVE_JUMP_HEIGHT = 0.3; // Height spectators jump (double the normal excited jump)
  private readonly WAVE_DURATION = 12; // Total duration for wave to complete around track (seconds)
  private readonly JUMP_DURATION = 0.5; // Duration of each individual spectator's jump (seconds)

  // Bleacher order for wave propagation (set externally based on track layout)
  private bleacherWaveOrder: number[] = [];

  // Calculated completion threshold (allow last spectators to finish their jump)
  private get WAVE_COMPLETION_THRESHOLD(): number {
    return 1.0 + this.JUMP_DURATION / this.WAVE_DURATION;
  }

  public addSpectator(spectator: WaveSpectator): void {
    this.spectators.push(spectator);
  }

  public setBleacherWaveOrder(order: number[]): void {
    this.bleacherWaveOrder = order;
  }

  public startWave(): void {
    if (this.isWaveActive || this.spectators.length === 0) {
      return;
    }

    console.log("Starting crowd wave!");
    this.isWaveActive = true;
    this.waveStartTime = this.elapsedTime;
  }

  public isWaveRunning(): boolean {
    return this.isWaveActive;
  }

  public update(deltaTime: number): void {
    this.elapsedTime += deltaTime;

    if (!this.isWaveActive) {
      return;
    }

    // Calculate how far through the wave we are (0.0 to 1.0)
    const waveProgress =
      (this.elapsedTime - this.waveStartTime) / this.WAVE_DURATION;

    if (waveProgress >= this.WAVE_COMPLETION_THRESHOLD) {
      this.finishWave();
      return;
    }

    // Update each spectator's jump based on wave progression
    for (const spectator of this.spectators) {
      this.updateSpectatorWave(spectator, waveProgress);
    }
  }

  private updateSpectatorWave(
    spectator: WaveSpectator,
    waveProgress: number,
  ): void {
    // Find which position this bleacher is in the wave sequence
    const bleacherOrderIndex = this.bleacherWaveOrder.indexOf(
      spectator.bleacherIndex,
    );
    if (bleacherOrderIndex === -1) return;

    // Calculate when this bleacher's section of the wave starts and ends
    const numBleachers = this.bleacherWaveOrder.length;
    const bleacherStartProgress = bleacherOrderIndex / numBleachers;
    const bleacherEndProgress = (bleacherOrderIndex + 1) / numBleachers;
    const bleacherDuration = bleacherEndProgress - bleacherStartProgress;

    // Within this bleacher, calculate when THIS spectator should jump
    // positionInBleacher ranges from 1 (right) to 0 (left), creating right-to-left ripple
    const spectatorStartProgress =
      bleacherStartProgress + spectator.positionInBleacher * bleacherDuration;
    const jumpDurationNormalized = this.JUMP_DURATION / this.WAVE_DURATION;
    const spectatorEndProgress =
      spectatorStartProgress + jumpDurationNormalized;

    // Calculate jump height using sine wave for smooth motion
    let jumpOffset = 0;
    if (
      waveProgress >= spectatorStartProgress &&
      waveProgress <= spectatorEndProgress
    ) {
      const jumpProgress =
        (waveProgress - spectatorStartProgress) / jumpDurationNormalized;
      jumpOffset = Math.sin(jumpProgress * Math.PI) * this.WAVE_JUMP_HEIGHT;
    }

    // Apply the jump
    spectator.group.position.y = spectator.originalY + jumpOffset;
  }

  private finishWave(): void {
    console.log("Crowd wave finished!");

    // Reset all spectators to original positions
    for (const spectator of this.spectators) {
      spectator.group.position.y = spectator.originalY;
    }

    this.isWaveActive = false;
  }

  public clear(): void {
    this.spectators = [];
    this.isWaveActive = false;
    this.elapsedTime = 0;
  }
}
