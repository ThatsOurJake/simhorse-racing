import * as THREE from 'three';
import { CountdownOverlay } from './countdownOverlay';
import { RaceTrack } from './raceTrack';
import { calculateSpeedCurve } from './horseStats';
import type { HorseData, SpeedPoint } from './horseStats';

export const RaceState = {
  IDLE: 'idle',
  COUNTDOWN: 'countdown',
  RACING: 'racing',
  FINISHED: 'finished'
} as const;

export type RaceState = typeof RaceState[keyof typeof RaceState];

export interface Horse {
  mesh: THREE.Mesh;
  progress: number; // Distance traveled along track
  currentSpeed: number; // Current speed (from speed curve)
  speedCurve: SpeedPoint[]; // Pre-calculated speed curve
  hasFinished: boolean;
  finishTime: number | null; // Time when horse finished (null if not finished)
  laneOffset: number; // Offset from inner edge of track
  data: HorseData; // Reference to horse data
  speedVariance: number; // Current speed variance multiplier (0.85-1.15)
  varianceTimer: number; // Time until next variance change
  finalKick: number; // Random final stretch boost (0.8-1.2)
}

export class RaceManager {
  private state: RaceState = RaceState.IDLE;
  private horses: Horse[] = [];
  private countdownOverlay: CountdownOverlay;
  private raceTrack: RaceTrack;
  private trackLength: number;
  private raceSeed: number = 0; // For seeded randomness
  private raceTime: number = 0; // Current race time in seconds

  constructor(raceTrack: RaceTrack) {
    this.raceTrack = raceTrack;
    this.countdownOverlay = new CountdownOverlay();

    // Calculate track length for one lap
    const config = raceTrack.getConfig();
    this.trackLength = config.length * 2 + Math.PI * config.radius * 2;
  }

  public setHorses(horseDataList: HorseData[], raceSeed?: number): void {
    // Clear existing horses from scene
    this.horses.forEach((horse) => {
      if (horse.mesh.parent) {
        horse.mesh.parent.remove(horse.mesh);
      }
    });

    this.horses = [];
    if (raceSeed !== undefined) {
      this.raceSeed = raceSeed;
    }

    // Create new horses
    const trackWidth = this.raceTrack.getConfig().width;
    const numHorses = horseDataList.length;
    const laneSpacing = trackWidth / (numHorses + 1);

    horseDataList.forEach((horseData, index) => {
      const laneOffset = laneSpacing * (index + 1);
      const speedCurve = calculateSpeedCurve(horseData, this.trackLength);

      // Create cube for horse
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshLambertMaterial({ color: horseData.color });
      const mesh = new THREE.Mesh(geometry, material);

      // Generate final kick using race seed
      const finalKick = this.seededRandom(this.raceSeed + index * 7) * 0.4 + 0.8; // 0.8-1.2

      this.horses.push({
        mesh,
        progress: 0,
        currentSpeed: speedCurve[0].speed,
        speedCurve,
        hasFinished: false,
        finishTime: null,
        laneOffset,
        data: horseData,
        speedVariance: 1.0,
        varianceTimer: 0,
        finalKick,
      });

      // Add to scene
      const trackGroup = this.raceTrack.getGroup();
      if (trackGroup.parent) {
        trackGroup.parent.add(mesh);
      }
    });

    // Position horses at starting line
    this.resetHorses();
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  public async startRace(): Promise<void> {
    if (this.state !== RaceState.IDLE) {
      return; // Race already in progress
    }

    // Reset all horses and race time
    this.resetHorses();
    this.raceTime = 0;

    // Start countdown
    this.state = RaceState.COUNTDOWN;
    await this.countdownOverlay.showCountdown(['3', '2', '1', 'GO']);

    // Start racing
    this.state = RaceState.RACING;
  }

  private resetHorses(): void {
    this.horses.forEach((horse) => {
      horse.progress = 0;
      horse.hasFinished = false;
      horse.finishTime = null;
      horse.currentSpeed = horse.speedCurve[0].speed;
      horse.speedVariance = 1.0;
      horse.varianceTimer = 0;

      // Position at starting line
      const position = this.raceTrack.getTrackPosition(0, horse.laneOffset);
      horse.mesh.position.x = position.x;
      horse.mesh.position.y = position.y + 0.5;
      horse.mesh.position.z = position.z;
    });
  }

  public update(deltaTime: number): void {
    if (this.state !== RaceState.RACING) {
      return;
    }

    // Update race time
    this.raceTime += deltaTime;

    let allFinished = true;

    // Update each horse
    this.horses.forEach((horse, horseIndex) => {
      if (!horse.hasFinished) {
        // Get base speed from speed curve
        const baseSpeed = this.getSpeedAtDistance(horse.speedCurve, horse.progress);

        // Update variance timer
        horse.varianceTimer -= deltaTime;
        if (horse.varianceTimer <= 0) {
          // Time to change variance - happens every 1-3 seconds
          horse.varianceTimer = 1 + this.seededRandom(this.raceSeed + horseIndex + horse.progress) * 2;

          // Calculate new variance based on stamina (high stamina = more consistent)
          const staminaConsistency = horse.data.stats.stamina;
          const varianceRange = 0.15 * (1 - staminaConsistency * 0.5); // 0.075-0.15 range
          const randomFactor = this.seededRandom(this.raceSeed + horseIndex + horse.progress + 1000);
          horse.speedVariance = 1.0 + (randomFactor - 0.5) * 2 * varianceRange;
        }

        // Apply variance
        let finalSpeed = baseSpeed * horse.speedVariance;

        // Check if in final stretch (last 15% of track)
        const progressRatio = horse.progress / this.trackLength;
        if (progressRatio > 0.85) {
          // Apply final kick modifier
          const finalStretchBoost = 1.0 + (horse.finalKick - 1.0) * ((progressRatio - 0.85) / 0.15);
          finalSpeed *= finalStretchBoost;
        }

        horse.currentSpeed = finalSpeed;

        // Move horse forward
        horse.progress += horse.currentSpeed * deltaTime;

        // Check if finished lap
        if (horse.progress >= this.trackLength) {
          horse.progress = this.trackLength;
          if (!horse.hasFinished) {
            horse.hasFinished = true;
            horse.finishTime = this.raceTime;
          }
        } else {
          allFinished = false;
        }

        // Update horse position based on progress and lane
        const position = this.raceTrack.getTrackPosition(horse.progress, horse.laneOffset);
        horse.mesh.position.x = position.x;
        horse.mesh.position.y = position.y + 0.5; // Keep horse above ground
        horse.mesh.position.z = position.z;
      }
    });

    // Check if race is finished
    if (allFinished) {
      this.state = RaceState.FINISHED;
      console.log('Race finished!');
      this.printRaceResults();
    }
  }

  private getSpeedAtDistance(speedCurve: SpeedPoint[], distance: number): number {
    // Find the two points that bracket the current distance
    for (let i = 0; i < speedCurve.length - 1; i++) {
      if (distance >= speedCurve[i].distance && distance <= speedCurve[i + 1].distance) {
        // Linear interpolation between the two points
        const t =
          (distance - speedCurve[i].distance) /
          (speedCurve[i + 1].distance - speedCurve[i].distance);
        return speedCurve[i].speed + (speedCurve[i + 1].speed - speedCurve[i].speed) * t;
      }
    }

    // If beyond the curve, return the last speed
    return speedCurve[speedCurve.length - 1].speed;
  }

  private printRaceResults(): void {
    // Sort horses by finish time (those who finished first have earliest finish)
    const results = [...this.horses]
      .map((horse, index) => ({ horse, originalIndex: index }));

    console.log('=== Race Results ===');
    results.forEach((result, place) => {
      console.log(
        `${place + 1}. ${result.horse.data.name} (Lane ${result.originalIndex + 1})`
      );
    });
  }

  public getState(): RaceState {
    return this.state;
  }

  public isRacing(): boolean {
    return this.state === RaceState.RACING || this.state === RaceState.COUNTDOWN;
  }

  public resetRace(): void {
    this.state = RaceState.IDLE;
    this.resetHorses();
  }

  public getHorses(): Horse[] {
    return this.horses;
  }

  public getLeadHorseProgress(): number {
    if (this.horses.length === 0) return 0;

    // Find the horse with the most progress
    let maxProgress = 0;
    this.horses.forEach((horse) => {
      if (horse.progress > maxProgress) {
        maxProgress = horse.progress;
      }
    });

    return maxProgress;
  }

  public getHorseProgressList(): number[] {
    return this.horses.map((horse) => horse.progress);
  }

  public getRaceTime(): number {
    return this.raceTime;
  }

  public getLeaderboard(): { position: number; name: string; progress: number }[] {
    // Sort horses: finished horses by finish time (ascending), then unfinished by progress (descending)
    const sorted = [...this.horses]
      .map((horse) => ({
        name: horse.data.name,
        progress: horse.progress,
        hasFinished: horse.hasFinished,
        finishTime: horse.finishTime,
      }))
      .sort((a, b) => {
        // Finished horses come first, sorted by finish time
        if (a.hasFinished && b.hasFinished) {
          return (a.finishTime ?? 0) - (b.finishTime ?? 0);
        }
        if (a.hasFinished) return -1;
        if (b.hasFinished) return 1;
        // Unfinished horses sorted by progress
        return b.progress - a.progress;
      });

    // Add positions
    return sorted.map((entry, index) => ({
      position: index + 1,
      name: entry.name,
      progress: entry.progress,
    }));
  }

  public getTrackLength(): number {
    return this.trackLength;
  }
}
