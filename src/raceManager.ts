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
  laneOffset: number; // Offset from inner edge of track
  data: HorseData; // Reference to horse data
}

export class RaceManager {
  private state: RaceState = RaceState.IDLE;
  private horses: Horse[] = [];
  private countdownOverlay: CountdownOverlay;
  private raceTrack: RaceTrack;
  private trackLength: number;

  constructor(raceTrack: RaceTrack) {
    this.raceTrack = raceTrack;
    this.countdownOverlay = new CountdownOverlay();

    // Calculate track length for one lap
    const config = raceTrack.getConfig();
    this.trackLength = config.length * 2 + Math.PI * config.radius * 2;
  }

  public setHorses(horseDataList: HorseData[]): void {
    // Clear existing horses from scene
    this.horses.forEach((horse) => {
      if (horse.mesh.parent) {
        horse.mesh.parent.remove(horse.mesh);
      }
    });

    this.horses = [];

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

      this.horses.push({
        mesh,
        progress: 0,
        currentSpeed: speedCurve[0].speed,
        speedCurve,
        hasFinished: false,
        laneOffset,
        data: horseData,
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

  public async startRace(): Promise<void> {
    if (this.state !== RaceState.IDLE) {
      return; // Race already in progress
    }

    // Reset all horses
    this.resetHorses();

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
      horse.currentSpeed = horse.speedCurve[0].speed;

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

    let allFinished = true;

    // Update each horse
    this.horses.forEach((horse) => {
      if (!horse.hasFinished) {
        // Get current speed from speed curve based on progress
        horse.currentSpeed = this.getSpeedAtDistance(horse.speedCurve, horse.progress);

        // Move horse forward
        horse.progress += horse.currentSpeed * deltaTime;

        // Check if finished lap
        if (horse.progress >= this.trackLength) {
          horse.progress = this.trackLength;
          horse.hasFinished = true;
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

  public getTrackLength(): number {
    return this.trackLength;
  }
}
